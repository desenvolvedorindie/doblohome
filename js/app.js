/**
 * Controlador Principal da Aplicação Three.js
 * Gerencia a cena 3D, câmeras, renderizador, animações e interface com o usuário
 */

function idbSet(key, value) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try { window.localStorage.removeItem(key); } catch (_) { }
  }
  if (typeof window === 'undefined' || !window.indexedDB) return;
  try {
    const req = window.indexedDB.open('DobloSolarExpanderDB', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('keyval')) db.createObjectStore('keyval');
    };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('keyval', 'readwrite');
      tx.objectStore('keyval').put(value, key);
    };
  } catch (_) { }
}

function idbGet(key, cb) {
  if (typeof window === 'undefined' || !window.indexedDB) {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const val = window.localStorage.getItem(key);
        cb(val ? JSON.parse(val) : null);
      } catch (_) { cb(null); }
    } else {
      cb(null);
    }
    return;
  }
  try {
    const req = window.indexedDB.open('DobloSolarExpanderDB', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('keyval')) db.createObjectStore('keyval');
    };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('keyval', 'readonly');
      const getReq = tx.objectStore('keyval').get(key);
      getReq.onsuccess = () => {
        let res = getReq.result;
        if (res === undefined && window.localStorage) {
          try {
            const raw = window.localStorage.getItem(key);
            if (raw) {
              res = JSON.parse(raw);
              window.localStorage.removeItem(key);
              idbSet(key, res);
            }
          } catch (_) { }
        }
        cb(res !== undefined ? res : null);
      };
      getReq.onerror = () => cb(null);
    };
    req.onerror = () => cb(null);
  } catch (_) {
    cb(null);
  }
}

class App {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();

    // Controle de animações concorrentes e rebobinamento
    this.activeExpansionAnim = null;
    this.rewindTimeout = null;
    this.isAutoAnimating = false;
    this.autoAnimDirection = 1; // 1 = abrindo, -1 = fechando
    this.autoAnimSpeed = 0.45;
    this.autoAnimPause = 0.0;
    this.lastLockPct = 0; // Previne cliques sonoros duplicados

    // Inicialização da cena e subsistemas
    this.initScene();
    this.initRenderer();
    this.initCamera();
    this.initControls();
    this.initEnvironment();

    // Inicializa bibliotecas e modelos
    MaterialLibrary.init();
    this.audio = new MechanicalAudio();
    this.vehicle = new DobloVehicle();
    this.scene.add(this.vehicle.group);

    this.solarSystem = new SolarSystem(this.scene);
    this.solarSim = new SolarSimulation(this.scene);

    // Carrega e restaura todas as configurações salvas (níveis, direção, orientação, placas, materiais, posições)
    this.restoreAllSettings();

    // Conecta eventos da UI
    this.bindUI();

    // Editor dinâmico de consumo de cargas e balanço energético
    this.initLoadsEditor();

    // Medição e hover das barras em tempo real
    this.initBarMeasurementHover();

    // Sincroniza estados visuais dos botões com as configurações carregadas
    this.syncUIWithState();

    // Atualiza dashboard inicial
    this.updateDashboard();
    this.saveAllSettings();

    // Loop de renderização
    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);
    this.scene.fog = new THREE.FogExp2(0x0f172a, 0.035);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.container.appendChild(this.renderer.domElement);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    // Perspectiva isométrica frontal direita (conforme Imagem 2)
    this.camera.position.set(3.4, 3.2, 4.2);
  }

  initControls() {
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 1.2;
    this.controls.maxDistance = 18;
    this.controls.maxPolarAngle = Math.PI * 0.85; // ~153° — permite ver sob os painéis
    this.controls.target.set(0, 1.85, 0);
    this.controls.update();
  }

  initEnvironment() {
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.85,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const grid = new THREE.GridHelper(24, 48, 0x38bdf8, 0x1e293b);
    grid.position.y = 0.002;
    this.scene.add(grid);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  cancelCurrentAnimation() {
    if (this.activeExpansionAnim) {
      cancelAnimationFrame(this.activeExpansionAnim);
      this.activeExpansionAnim = null;
    }
    if (this.rewindTimeout) {
      clearTimeout(this.rewindTimeout);
      this.rewindTimeout = null;
    }
    const btnRewind = document.getElementById('btn-rewind');
    if (btnRewind) {
      btnRewind.classList.remove('active');
      btnRewind.innerHTML = '⏪ Rebobinar';
    }
  }

  /**
   * Conecta todos os botões, sliders e controles da interface
   */
  bindUI() {
    const self = this;

    // 1. Configuradores Paramétricos do Stack de Painéis Solares Flexíveis
    // 1.1 Seletor de Níveis (Stack)
    const stackBtns = document.querySelectorAll('[data-stack]');
    stackBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        self.cancelCurrentAnimation();
        stackBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const levels = parseInt(btn.dataset.stack);
        self.solarSystem.setStackLevels(levels);
        self.syncUIWithState();
        self.saveAllSettings();
        self.flashSaved('✅ Salvo');
        self.audio.playLockClick();
        self.updateDashboard();
      });
    });

    // 1.2 Eventos do NÍVEL 1 (EM BAIXO / INFERIOR)
    const l1PanelBtns = document.querySelectorAll('[data-l1-panels]');
    l1PanelBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        self.cancelCurrentAnimation();
        l1PanelBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        self.solarSystem.setLevel1Panels(btn.dataset.l1Panels);
        self.saveAllSettings();
        self.flashSaved('✅ Salvo');
        self.audio.playLockClick();
        self.updateDashboard();
      });
    });

    const l1DirBtns = document.querySelectorAll('[data-l1-direction]');
    l1DirBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        self.cancelCurrentAnimation();
        l1DirBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        self.solarSystem.setLevel1Direction(btn.dataset.l1Direction);
        self.saveAllSettings();
        self.flashSaved('✅ Salvo');
        self.audio.playLockClick();
        self.updateDashboard();
      });
    });

    const l1OriBtns = document.querySelectorAll('[data-l1-orientation]');
    l1OriBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        self.cancelCurrentAnimation();
        l1OriBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        self.solarSystem.setLevel1Orientation(btn.dataset.l1Orientation);
        self.saveAllSettings();
        self.flashSaved('✅ Salvo');
        self.audio.playLockClick();
        self.updateDashboard();
      });
    });

    // 1.3 Eventos do NÍVEL 2 (EM CIMA / SUPERIOR)
    const l2PanelBtns = document.querySelectorAll('[data-l2-panels]');
    l2PanelBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        self.cancelCurrentAnimation();
        l2PanelBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        self.solarSystem.setLevel2Panels(btn.dataset.l2Panels);
        self.saveAllSettings();
        self.flashSaved('✅ Salvo');
        self.audio.playLockClick();
        self.updateDashboard();
      });
    });

    const l2DirBtns = document.querySelectorAll('[data-l2-direction]');
    l2DirBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        self.cancelCurrentAnimation();
        l2DirBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        self.solarSystem.setLevel2Direction(btn.dataset.l2Direction);
        self.saveAllSettings();
        self.flashSaved('✅ Salvo');
        self.audio.playLockClick();
        self.updateDashboard();
      });
    });

    const l2OriBtns = document.querySelectorAll('[data-l2-orientation]');
    l2OriBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        self.cancelCurrentAnimation();
        l2OriBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        self.solarSystem.setLevel2Orientation(btn.dataset.l2Orientation);
        self.saveAllSettings();
        self.flashSaved('✅ Salvo');
        self.audio.playLockClick();
        self.updateDashboard();
      });
    });

    // Compatibilidade com seletores genéricos antigos
    const dirBtns = document.querySelectorAll('[data-direction]');
    dirBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        self.cancelCurrentAnimation();
        dirBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        self.solarSystem.setSlideDirection(btn.dataset.direction);
        self.saveAllSettings();
        self.flashSaved('✅ Salvo');
        self.audio.playLockClick();
        self.updateDashboard();
      });
    });

    // 2. Slider de Expansão / Contração
    const expansionSlider = document.getElementById('expansion-slider');
    expansionSlider.addEventListener('input', (e) => {
      self.cancelCurrentAnimation();
      self.isAutoAnimating = false;
      const btnAuto = document.getElementById('btn-auto-anim');
      if (btnAuto) {
        btnAuto.classList.remove('active');
        btnAuto.innerHTML = '▶️ Loop';
      }
      const val = parseFloat(e.target.value) / 100;
      self.setExpansion(val);
      self.audio.playSlideSound(0.5);
    });

    // 3. Botões rápidos: Recolher, Expandir, Rebobinar e Loop
    document.getElementById('btn-retract').addEventListener('click', () => {
      self.animateExpansionTo(0.0);
    });

    document.getElementById('btn-expand').addEventListener('click', () => {
      self.animateExpansionTo(1.0);
    });

    document.getElementById('btn-rewind').addEventListener('click', () => {
      self.rewindCycle();
    });

    const btnAuto = document.getElementById('btn-auto-anim');
    btnAuto.addEventListener('click', () => {
      self.cancelCurrentAnimation();
      self.isAutoAnimating = !self.isAutoAnimating;
      btnAuto.classList.toggle('active', self.isAutoAnimating);
      btnAuto.innerHTML = self.isAutoAnimating ? '⏸️ Pausar' : '▶️ Loop';
      self.autoAnimPause = 0.0;
      self.audio.playLockClick();
    });

    // 4. Botões de Alternância (Toggles)
    const toggleVehicleBtn = document.getElementById('toggle-vehicle');
    toggleVehicleBtn.addEventListener('click', () => {
      const active = toggleVehicleBtn.classList.toggle('active');
      self.vehicle.setVisible(active);
    });

    const toggleDimsBtn = document.getElementById('toggle-dimensions');
    toggleDimsBtn.addEventListener('click', () => {
      const active = toggleDimsBtn.classList.toggle('active');
      self.solarSystem.setDimensionsVisible(active);
    });

    const toggleTranspBtn = document.getElementById('toggle-transparent');
    toggleTranspBtn.addEventListener('click', () => {
      const active = toggleTranspBtn.classList.toggle('active');
      self.solarSystem.setUpperTransparency(active);
    });

    const toggleSoundBtn = document.getElementById('toggle-sound');
    toggleSoundBtn.addEventListener('click', () => {
      const active = toggleSoundBtn.classList.toggle('active');
      self.audio.toggleSound(active);
      toggleSoundBtn.querySelector('.toggle-label').textContent = active ? 'Som: Ativado' : 'Som: Mudo';
    });

    // Toggle: Esteira Porta-Cabos (lagarta)
    const toggleChainBtn = document.getElementById('toggle-chain');
    if (toggleChainBtn) {
      toggleChainBtn.addEventListener('click', () => {
        const active = toggleChainBtn.classList.toggle('active');
        self.solarSystem.setCableChainVisible(active);
      });
    }

    // 6. Câmeras Pré-definidas
    document.querySelectorAll('.cam-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cam-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.dataset.view;
        self.setCameraPreset(view);
      });
    });

    // 7. Toggle de Material da Estrutura (Alumínio vs Ferro Soldado)
    const btnAluminum = document.getElementById('btn-mat-aluminum');
    const btnSteel = document.getElementById('btn-mat-steel');
    const weightBadge = document.getElementById('structure-weight-badge');

    const colorSubbar = document.getElementById('aluminum-color-subbar');
    const btnColorSilver = document.getElementById('btn-color-silver');
    const btnColorBlack = document.getElementById('btn-color-black');

    if (btnAluminum && btnSteel) {
      btnAluminum.addEventListener('click', () => {
        btnAluminum.classList.add('active');
        btnSteel.classList.remove('active');
        if (colorSubbar) colorSubbar.style.display = 'flex';
        self.solarSystem.setStructureMaterial('aluminum');
        if (weightBadge) weightBadge.textContent = '18.5 kg (Alumínio)';
        self.saveAllSettings();
        self.flashSaved('✅ Salvo');
        self.audio.playLockClick();
        self.updateDashboard();
      });

      btnSteel.addEventListener('click', () => {
        btnSteel.classList.add('active');
        btnAluminum.classList.remove('active');
        if (colorSubbar) colorSubbar.style.display = 'none';
        self.solarSystem.setStructureMaterial('steel');
        if (weightBadge) weightBadge.textContent = '42.0 kg (Ferro)';
        self.saveAllSettings();
        self.flashSaved('✅ Salvo');
        self.audio.playLockClick();
        self.updateDashboard();
      });
    }

    if (btnColorSilver && btnColorBlack) {
      btnColorSilver.addEventListener('click', () => {
        btnColorSilver.classList.add('primary', 'active');
        btnColorBlack.classList.remove('primary', 'active');
        self.solarSystem.setAluminumColor('silver');
        self.saveAllSettings();
        self.flashSaved('✅ Salvo');
        self.audio.playLockClick();
      });

      btnColorBlack.addEventListener('click', () => {
        btnColorBlack.classList.add('primary', 'active');
        btnColorSilver.classList.remove('primary', 'active');
        self.solarSystem.setAluminumColor('black');
        self.saveAllSettings();
        self.flashSaved('✅ Salvo');
        self.audio.playLockClick();
      });
    }

    // 8. Simulação de Posição do Sol
    const sunSlider = document.getElementById('sun-slider');
    const sunLabel = document.getElementById('sun-time-val');
    sunSlider.addEventListener('input', (e) => {
      const hour = parseFloat(e.target.value);
      self.solarSim.updateSunPosition(hour);
      const h = Math.floor(hour);
      const m = Math.floor((hour - h) * 60);
      sunLabel.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}h`;
    });

    // 9. Sliders de Posição do Rack (move TODA a estrutura — sem rebuild)
    const rackSlider = document.getElementById('rack-offset-slider');
    const rackValLabel = document.getElementById('rack-offset-val');
    const heightSlider = document.getElementById('rack-height-slider');
    const heightLabel = document.getElementById('rack-height-val');

    const KEY_Z = 'doblo_rack_offset_z';
    const KEY_Y = 'doblo_rack_offset_y';
    const DEF_Z = 0.40;
    const DEF_Y = 0.00;

    // Aplica offset Z (frente/trás)
    function applyZ(z) {
      self.solarSystem.setGroupOffsetZ(z);
      if (rackValLabel) rackValLabel.textContent = `${z >= 0 ? '+' : ''}${z.toFixed(2)} m`;
      if (rackSlider) rackSlider.value = z;
    }

    // Aplica offset Y (cima/baixo)
    function applyY(y) {
      self.solarSystem.setGroupOffsetY(y);
      if (heightLabel) heightLabel.textContent = `${y >= 0 ? '+' : ''}${y.toFixed(2)} m`;
      if (heightSlider) heightSlider.value = y;
    }

    // Aplica valores iniciais padrões
    applyZ(DEF_Z);
    applyY(DEF_Y);

    // Lê valores salvos do banco de dados IndexedDB
    idbGet(KEY_Z, (val) => {
      if (val !== null && val !== undefined) {
        const parsed = parseFloat(val);
        if (!isNaN(parsed)) applyZ(parsed);
      }
    });

    idbGet(KEY_Y, (val) => {
      if (val !== null && val !== undefined) {
        const parsed = parseFloat(val);
        if (!isNaN(parsed)) applyY(parsed);
      }
    });

    // Eventos dos sliders — salva automaticamente todas as configurações no IndexedDB
    if (rackSlider) {
      rackSlider.addEventListener('input', (e) => {
        const z = parseFloat(e.target.value);
        applyZ(z);
        idbSet(KEY_Z, z.toFixed(3));
        self.saveAllSettings();
      });
    }

    if (heightSlider) {
      heightSlider.addEventListener('input', (e) => {
        const y = parseFloat(e.target.value);
        applyY(y);
        idbSet(KEY_Y, y.toFixed(3));
        self.saveAllSettings();
      });
    }

    // 10. Modais
    this.setupModal('btn-open-battery', 'modal-battery', 'btn-close-battery');
    this.setupModal('btn-open-mppt', 'modal-mppt', 'btn-close-mppt');
    this.setupModal('btn-open-bom', 'modal-bom', 'btn-close-bom');

    // 11. Screenshot
    document.getElementById('btn-screenshot').addEventListener('click', () => {
      self.takeScreenshot();
    });
  }

  setupModal(openBtnId, modalId, closeBtnId) {
    const openBtn = document.getElementById(openBtnId);
    const modal = document.getElementById(modalId);
    const closeBtn = document.getElementById(closeBtnId);

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => {
        modal.classList.add('open');
      });
    }
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('open');
      });
    }
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    }
  }

  /**
   * Inicializa o Editor de Consumo de Cargas (Equipamentos do Motorhome)
   */
  initLoadsEditor() {
    const self = this;

    // Configura abertura do modal
    this.setupModal('btn-open-loads', 'modal-loads', 'btn-close-loads');

    // Link rápido no card do dashboard
    const quickBtn = document.getElementById('btn-quick-loads');
    const modalLoads = document.getElementById('modal-loads');
    if (quickBtn && modalLoads) {
      quickBtn.addEventListener('click', () => {
        modalLoads.classList.add('open');
        self.renderLoadsTable();
      });
    }

    // Botão Concluir no rodapé do modal
    const btnDone = document.getElementById('btn-done-loads');
    if (btnDone && modalLoads) {
      btnDone.addEventListener('click', () => {
        modalLoads.classList.remove('open');
      });
    }

    // Formulário de inserção de novo equipamento
    const formAdd = document.getElementById('form-add-load');
    if (formAdd) {
      formAdd.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputName = document.getElementById('input-load-name');
        const inputWatts = document.getElementById('input-load-watts');
        const inputHours = document.getElementById('input-load-hours');
        const inputQty = document.getElementById('input-load-qty');

        const name = inputName ? inputName.value.trim() : '';
        const watts = inputWatts ? parseFloat(inputWatts.value) : 0;
        const hours = inputHours ? parseFloat(inputHours.value) : 0;
        const qty = inputQty ? parseInt(inputQty.value) || 1 : 1;

        if (!name || isNaN(watts) || isNaN(hours)) return;

        self.solarSim.addAppliance(name, watts, hours, qty);

        // Limpa campos mantendo foco
        if (inputName) inputName.value = '';
        if (inputWatts) inputWatts.value = '';
        if (inputHours) inputHours.value = '';
        if (inputQty) inputQty.value = '1';
        if (inputName) inputName.focus();

        self.audio.playLockClick();
        self.renderLoadsTable();
        self.updateDashboard();
      });
    }

    // Presets rápidos com 1 clique
    document.querySelectorAll('.preset-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.name;
        const watts = parseFloat(btn.dataset.watts);
        const hours = parseFloat(btn.dataset.hours);
        const qty = parseInt(btn.dataset.qty) || 1;

        self.solarSim.addAppliance(name, watts, hours, qty);
        self.audio.playLockClick();
        self.renderLoadsTable();
        self.updateDashboard();
      });
    });

    // Botão restaurar padrões
    const btnReset = document.getElementById('btn-reset-loads');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('Deseja restaurar a lista padrão recomendada de consumo?')) {
          self.solarSim.resetDefaultAppliances();
          self.audio.playLockClick();
          self.renderLoadsTable();
          self.updateDashboard();
        }
      });
    }

    // Botão limpar todos
    const btnClear = document.getElementById('btn-clear-loads');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        if (confirm('Deseja remover todos os equipamentos da lista de consumo?')) {
          self.solarSim.APPLIANCES = [];
          self.solarSim.recalculateConsumption();
          self.solarSim.saveAppliances();
          self.audio.playLockClick();
          self.renderLoadsTable();
          self.updateDashboard();
        }
      });
    }

    // Render inicial da tabela
    this.renderLoadsTable();
  }

  /**
   * Renderiza as linhas e inputs da tabela de cargas
   */
  renderLoadsTable() {
    const tbody = document.getElementById('loads-table-body');
    if (!tbody) return;

    const self = this;
    const appliances = this.solarSim.APPLIANCES;
    tbody.innerHTML = '';

    if (appliances.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `
        <td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 13px;">
          Nenhum equipamento cadastrado. Use o formulário acima ou clique nos presets para adicionar!
        </td>
      `;
      tbody.appendChild(emptyRow);
    } else {
      appliances.forEach(item => {
        const tr = document.createElement('tr');
        if (item.enabled === false) tr.classList.add('row-disabled');

        const whDay = Math.round(item.watts * item.hours * (item.qty || 1));
        const ahDay = (whDay / this.solarSim.BAT_VOLTAGE).toFixed(1);

        tr.innerHTML = `
          <td style="text-align: center;">
            <input type="checkbox" class="load-toggle-check" data-id="${item.id}" ${item.enabled !== false ? 'checked' : ''} title="Ativar/Desativar esta carga" />
          </td>
          <td>
            <input type="text" class="loads-input-edit loads-input-text load-edit-field" data-id="${item.id}" data-field="name" value="${item.name.replace(/"/g, '&quot;')}" />
          </td>
          <td style="text-align: center;">
            <input type="number" class="loads-input-edit load-edit-field" data-id="${item.id}" data-field="watts" min="0" step="1" value="${item.watts}" style="text-align: center;" />
          </td>
          <td style="text-align: center;">
            <input type="number" class="loads-input-edit load-edit-field" data-id="${item.id}" data-field="hours" min="0" max="24" step="0.5" value="${item.hours}" style="text-align: center;" />
          </td>
          <td style="text-align: center;">
            <input type="number" class="loads-input-edit load-edit-field" data-id="${item.id}" data-field="qty" min="1" step="1" value="${item.qty || 1}" style="text-align: center; max-width: 55px; margin: 0 auto;" />
          </td>
          <td style="text-align: right; font-family: var(--font-mono);">
            <div style="font-weight: 700; color: ${item.enabled !== false ? '#fb923c' : '#64748b'};">${whDay} Wh/d</div>
            <div style="font-size: 10px; color: #64748b;">${ahDay} Ah/d</div>
          </td>
          <td style="text-align: center;">
            <button type="button" class="btn-remove-load" data-id="${item.id}" title="Excluir equipamento">&times;</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Event listeners para edição inline nos campos de texto e números
    tbody.querySelectorAll('.load-edit-field').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        const field = e.target.dataset.field;
        let val = e.target.value;
        if (field === 'watts' || field === 'hours' || field === 'qty') {
          val = parseFloat(val) || 0;
        }
        self.solarSim.updateAppliance(id, { [field]: val });
        self.renderLoadsTable();
        self.updateDashboard();
      });
    });

    // Event listeners para checkboxes ativo/desativado
    tbody.querySelectorAll('.load-toggle-check').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        self.solarSim.updateAppliance(id, { enabled: e.target.checked });
        self.renderLoadsTable();
        self.updateDashboard();
      });
    });

    // Event listeners para exclusão
    tbody.querySelectorAll('.btn-remove-load').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        self.solarSim.removeAppliance(id);
        self.renderLoadsTable();
        self.updateDashboard();
      });
    });

    // Atualiza KPIs e totais
    this.updateLoadsKPIs();
  }

  /**
   * Atualiza os cartões de KPI do modal e o resumo do header
   */
  updateLoadsKPIs() {
    if (!this.solarSystem || !this.solarSim) return;
    const stats = this.solarSystem.getEnergyStats();
    const perf = this.solarSim.calculateBatteryPerformance(stats.watts, parseFloat(stats.dailyKWh));
    const loads = perf.loadsSummary || this.solarSim.getLoadsSummary();

    // Badge no header
    const headerLoads = document.getElementById('header-loads-summary');
    if (headerLoads) {
      headerLoads.textContent = `${loads.totalKWh} kWh/d`;
    }

    // Total no rodapé da tabela
    const totalVal = document.getElementById('loads-table-total-val');
    if (totalVal) {
      totalVal.innerHTML = `${loads.totalWh} Wh/dia <span style="font-size: 11px; font-weight: normal; color: #94a3b8;">(${loads.totalAh} Ah/d @ 12.8V)</span>`;
    }

    // Cartão 1: Geração Solar Diária
    const elSolar = document.getElementById('loads-kpi-solar');
    const elSolarSub = document.getElementById('loads-kpi-solar-sub');
    if (elSolar) elSolar.textContent = `${perf.dailyWhGenerated} Wh/dia`;
    if (elSolarSub) {
      const solarAh = +(perf.dailyWhGenerated / this.solarSim.BAT_VOLTAGE).toFixed(1);
      elSolarSub.textContent = `${solarAh} Ah/dia @ 12.8V (slider ${stats.percent}%)`;
    }

    // Cartão 2: Consumo Total Diário
    const elConsumed = document.getElementById('loads-kpi-consumed');
    const elConsumedSub = document.getElementById('loads-kpi-consumed-sub');
    if (elConsumed) elConsumed.textContent = `${loads.totalWh} Wh/dia`;
    if (elConsumedSub) elConsumedSub.textContent = `${loads.totalAh} Ah/dia (${loads.activeCount} itens ativos)`;

    // Cartão 3: Balanço Energético Diário
    const elBalance = document.getElementById('loads-kpi-balance');
    const elBalanceSub = document.getElementById('loads-kpi-balance-sub');
    if (elBalance && elBalanceSub) {
      if (perf.isAutonomous) {
        elBalance.className = 'kpi-value text-green';
        elBalance.textContent = `+${perf.surplusWh} Wh/dia`;
        elBalanceSub.innerHTML = `✅ <strong>Superávit</strong> · 100% Autônomo`;
      } else {
        elBalance.className = 'kpi-value text-red';
        elBalance.textContent = `${perf.surplusWh} Wh/dia`;
        elBalanceSub.innerHTML = `⚠️ <strong>Déficit diário</strong> · Drena bateria`;
      }
    }

    // Cartão 4: Autonomia na Chuva
    const elAutonomy = document.getElementById('loads-kpi-autonomy');
    if (elAutonomy) {
      elAutonomy.textContent = `${perf.daysRainAutonomy} dias`;
    }
  }

  /**
   * Ciclo completo de Rebobinar (abre suavemente, aguarda e fecha com segurança)
   */
  rewindCycle() {
    this.cancelCurrentAnimation();
    this.isAutoAnimating = false;
    const btnAuto = document.getElementById('btn-auto-anim');
    if (btnAuto) {
      btnAuto.classList.remove('active');
      btnAuto.innerHTML = '▶️ Loop';
    }

    const btnRewind = document.getElementById('btn-rewind');
    if (btnRewind) {
      btnRewind.classList.add('active');
      btnRewind.innerHTML = '⏳ Rebobinando...';
    }

    const self = this;
    const current = this.solarSystem.expansionProgress;

    if (current < 0.9) {
      // Abre suavemente até 100%
      this.animateExpansionTo(1.0, 850, () => {
        // Pausa breve de 500ms totalmente estendido para inspeção
        self.rewindTimeout = setTimeout(() => {
          // Rebobina fechando suavemente até 0%
          self.animateExpansionTo(0.0, 850, () => {
            if (btnRewind) {
              btnRewind.classList.remove('active');
              btnRewind.innerHTML = '⏪ Rebobinar';
            }
          });
        }, 500);
      });
    } else {
      // Já está aberto: fecha suavemente até 0%
      this.animateExpansionTo(0.0, 850, () => {
        if (btnRewind) {
          btnRewind.classList.remove('active');
          btnRewind.innerHTML = '⏪ Rebobinar';
        }
      });
    }
  }

  /**
   * Ajusta a expansão com atualização de UI e dashboard
   */
  setExpansion(val) {
    this.solarSystem.updateExpansion(val);

    const slider = document.getElementById('expansion-slider');
    if (slider) slider.value = Math.round(val * 100);

    const valLabel = document.getElementById('expansion-val');
    const badge = document.getElementById('expansion-badge');

    const pct = Math.round(val * 100);
    valLabel.textContent = `${pct}%`;

    badge.className = 'status-badge ' + (pct === 0 ? 'retracted' : pct === 100 ? 'extended' : 'partial');
    badge.textContent = pct === 0 ? 'Fechado (Trânsito)' : pct === 100 ? 'Total Aberto (Camping)' : 'Parcial';

    // Dispara clique mecânico apenas UMA VEZ ao atingir 0% ou 100% (evita zumbido de áudio)
    if ((pct === 0 || pct === 100) && this.lastLockPct !== pct) {
      this.audio.playLockClick();
      this.lastLockPct = pct;
    } else if (pct > 0 && pct < 100) {
      this.lastLockPct = null;
    }

    this.updateDashboard();
    this.saveAllSettings();
  }

  /**
   * Interpola suavemente a expansão sem conflitos de animação
   */
  animateExpansionTo(target, duration = 800, onComplete = null) {
    this.cancelCurrentAnimation();
    this.isAutoAnimating = false;
    const btnAuto = document.getElementById('btn-auto-anim');
    if (btnAuto) {
      btnAuto.classList.remove('active');
      btnAuto.innerHTML = '▶️ Loop';
    }

    const start = this.solarSystem.expansionProgress;
    const startTime = performance.now();
    const self = this;

    function step(now) {
      const elapsed = now - startTime;
      const t = Math.min(1.0, elapsed / duration);
      // Easing suave (quad in/out)
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const current = start + (target - start) * ease;
      self.setExpansion(current);
      self.audio.playSlideSound(1.0 - t);

      if (t < 1.0) {
        self.activeExpansionAnim = requestAnimationFrame(step);
      } else {
        self.activeExpansionAnim = null;
        if (onComplete) onComplete();
      }
    }
    this.activeExpansionAnim = requestAnimationFrame(step);
  }

  /**
   * Câmeras pré-definidas
   */
  setCameraPreset(view) {
    const target = new THREE.Vector3(0, 1.85, 0);
    let newPos = new THREE.Vector3();

    switch (view) {
      case 'top':
        newPos.set(0, 5.2, 0.001);
        break;
      case 'iso':
        newPos.set(3.4, 3.2, 4.2);
        break;
      case 'side':
        newPos.set(-4.2, 2.0, 0);
        break;
      case 'front':
        newPos.set(0, 2.1, 4.5);
        break;
      case 'profile_detail':
        const curZ = (this.solarSystem && this.solarSystem.groupOffsetZ !== undefined)
          ? this.solarSystem.groupOffsetZ : 0.40;
        const curY = (this.solarSystem && this.solarSystem.groupOffsetY !== undefined)
          ? this.solarSystem.groupOffsetY : 0.00;
        target.set(-0.68, 2.06 + curY, curZ + 1.10);
        newPos.set(-0.92, 2.18 + curY, curZ + 1.35);
        break;
    }

    this.animateCameraTo(newPos, target);
  }

  animateCameraTo(targetPos, targetLookAt) {
    const startPos = this.camera.position.clone();
    const startLookAt = this.controls.target.clone();
    const duration = 750;
    const startTime = performance.now();
    const self = this;

    function step(now) {
      const elapsed = now - startTime;
      const t = Math.min(1.0, elapsed / duration);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      self.camera.position.lerpVectors(startPos, targetPos, ease);
      self.controls.target.lerpVectors(startLookAt, targetLookAt, ease);
      self.controls.update();

      if (t < 1.0) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  /**
   * Atualiza as informações do Painel de Energia e da Bateria Kingbo LiFePO4
   */
  updateDashboard() {
    const stats = this.solarSystem.getEnergyStats();

    const elWatts = document.getElementById('stat-watts');
    if (elWatts) elWatts.innerHTML = `${stats.watts} <span>W</span>`;

    const elDaily = document.getElementById('stat-daily-kwh');
    if (elDaily) elDaily.innerHTML = `${stats.dailyKWh} <span>kWh</span>`;

    const elAmps12v = document.getElementById('stat-amps-12v');
    if (elAmps12v) elAmps12v.textContent = `${stats.currentAmps12V} A`;

    const elState = document.getElementById('stat-state');
    if (elState) elState.textContent = stats.percent === 0 ? 'Modo Rodovia (Travado)' : `${stats.percent}% Estendido`;

    // Métricas Elétricas e Peso Real
    const elVoc = document.getElementById('stat-voc');
    if (elVoc) elVoc.textContent = `${stats.voc} V (${stats.vmp}V Vmp)`;

    const elWeightTotal = document.getElementById('stat-weight-total');
    if (elWeightTotal) elWeightTotal.textContent = `${stats.weightTotal} kg`;

    const structureWeightBadge = document.getElementById('structure-weight-badge');
    if (structureWeightBadge) {
      structureWeightBadge.textContent = `${stats.weightTotal} kg total (${stats.weightPanels}kg placas)`;
    }

    // Atualização das tags dos seletores
    const tagStack = document.getElementById('tag-stack-levels');
    if (tagStack) {
      tagStack.textContent = (stats.stackLevels === 1)
        ? `1 Nível (${stats.powerOpen}W)`
        : `2 Níveis (${stats.powerOpen}W total)`;
    }

    const tagL1 = document.getElementById('tag-level1-summary');
    if (tagL1) tagL1.textContent = `${stats.level1Panels} Placa(s) • ${stats.level1Panels * 100}W`;

    const tagL2 = document.getElementById('tag-level2-summary');
    if (tagL2) tagL2.textContent = `${stats.level2Panels} Placa(s) • ${stats.level2Panels * 100}W`;

    const cardL2 = document.getElementById('card-level-2');
    if (cardL2) {
      cardL2.style.display = (stats.stackLevels === 2) ? 'block' : 'none';
    }

    // Performance da Bateria Kingbo LiFePO4 12V 560Ah (7.168 kWh)
    const batPerf = this.solarSim.calculateBatteryPerformance(stats.watts, parseFloat(stats.dailyKWh));

    const elBatRecharge = document.getElementById('stat-bat-recharge');
    if (elBatRecharge) elBatRecharge.textContent = `+${batPerf.dailyAhInjected} Ah/dia`;

    const elChargeTime = document.getElementById('stat-charge-time');
    if (elChargeTime) elChargeTime.textContent = `${batPerf.solarHoursToFull}h sol (${batPerf.solarDaysToFull} dias)`;

    const elRainAutonomy = document.getElementById('stat-rain-autonomy');
    if (elRainAutonomy) elRainAutonomy.textContent = `${batPerf.daysRainAutonomy} dias sem sol!`;

    const autoLabel = document.getElementById('stat-autonomy');
    if (autoLabel) {
      if (batPerf.isAutonomous) {
        autoLabel.innerHTML = `<strong>100% Autônomo!</strong> Superávit de <strong>+${batPerf.surplusWh} Wh/dia</strong>. Bateria Kingbo de 7.168 kWh garante <strong>${batPerf.daysRainAutonomy} dias de chuva contínua</strong> sem descarregar!`;
      } else {
        autoLabel.innerHTML = `Injeção de <strong>${batPerf.dailyAhInjected} Ah/dia</strong> na Bateria Kingbo 560Ah. Recomendado expandir ao acampar para recarga acelerada!`;
      }
    }

    // --- Medidor de Capacidade do MPPT Kingbo 60A ---
    // O MPPT deve ser dimensionado para o pico máximo do array (todos os painéis expandidos),
    // independente do slider de expansão. Por isso usamos stats.powerOpen (pior caso real).
    const MPPT_MAX_W = 720;                    // 60A × 12V = limite do controlador
    const MPPT_WARN_W = MPPT_MAX_W * 0.85;      // 85% → zona de atenção (612 W)
    const peakW = stats.powerOpen;         // pico com TODOS os painéis abertos
    const currentW = stats.watts;             // geração instantânea (baseada no slider)
    const mpptPct = Math.round((peakW / MPPT_MAX_W) * 100);
    const mpptMargin = Math.max(0, MPPT_MAX_W - peakW);
    const fillPct = Math.min(mpptPct, 100);  // barra não ultrapassa a trilha visualmente

    // Estado: 'ok' | 'warn' | 'over'  — avaliado sobre o PICO (peakW)
    const mpptState = peakW > MPPT_MAX_W ? 'over'
      : peakW >= MPPT_WARN_W ? 'warn'
        : 'ok';

    // Barra de preenchimento
    const fill = document.getElementById('mppt-gauge-fill');
    if (fill) {
      fill.style.width = `${fillPct}%`;
      fill.className = `mppt-gauge-fill${mpptState !== 'ok' ? ' ' + mpptState : ''}`;
    }

    // Rótulo do meio da escala (sempre metade do máximo)
    const scaleMid = document.getElementById('mppt-scale-mid');
    if (scaleMid) scaleMid.textContent = `${Math.round(MPPT_MAX_W / 2)} W`;

    // Chip: "Pico do array" (muda quando troca placas)
    const elMpptW = document.getElementById('mppt-watts-val');
    if (elMpptW) {
      elMpptW.textContent = `${peakW} W pico`;
      elMpptW.title = `Geração atual: ${currentW} W (slider ${stats.percent}%)`;
    }

    // Chip: % de uso do MPPT
    const elMpptPct = document.getElementById('mppt-pct-val');
    if (elMpptPct) {
      elMpptPct.textContent = `${mpptPct}%`;
      elMpptPct.style.color = mpptState === 'over' ? '#ef4444'
        : mpptState === 'warn' ? '#f59e0b'
          : '#10b981';
    }

    // Chip: margem disponível
    const elMpptMargin = document.getElementById('mppt-margin-val');
    if (elMpptMargin) {
      elMpptMargin.textContent = mpptState === 'over'
        ? `−${peakW - MPPT_MAX_W} W excesso`
        : `+${mpptMargin} W livres`;
      elMpptMargin.style.color = mpptState === 'over' ? '#ef4444'
        : mpptState === 'warn' ? '#f59e0b'
          : '#94a3b8';
    }

    // Badge de status
    const badge = document.getElementById('mppt-status-badge');
    if (badge) {
      if (mpptState === 'over') {
        badge.textContent = `⚠️ SOBRECARGA ${mpptPct}%`;
        badge.className = 'mppt-meter-badge over';
      } else if (mpptState === 'warn') {
        badge.textContent = `⚡ ALTO ${mpptPct}%`;
        badge.className = 'mppt-meter-badge warn';
      } else {
        badge.textContent = `✅ OK — ${mpptPct}%`;
        badge.className = 'mppt-meter-badge';
      }
    }

    // Container: aplica classe de alerta visual
    const meterBox = document.getElementById('mppt-meter-box');
    if (meterBox) {
      meterBox.className = `mppt-meter-box${mpptState !== 'ok' ? ' mppt-' + mpptState : ''}`;
    }

    // Caixa de aviso expansível
    const alertEl = document.getElementById('mppt-alert');
    if (alertEl) {
      if (mpptState === 'over') {
        alertEl.style.display = 'block';
        alertEl.className = 'mppt-alert over';
        alertEl.innerHTML =
          `⛔ <strong>Sobrecarga no pico!</strong> ${stats.totalPanels} painéis geram ` +
          `<strong>${peakW} W</strong>, excedendo o limite de ${MPPT_MAX_W} W do MPPT 60A ` +
          `em <strong>${peakW - MPPT_MAX_W} W</strong>. ` +
          `Considere o modelo de <strong>80A (960 W)</strong> ou <strong>100A (1.200 W)</strong>.`;
      } else if (mpptState === 'warn') {
        alertEl.style.display = 'block';
        alertEl.className = 'mppt-alert warn';
        alertEl.innerHTML =
          `⚠️ <strong>Carga alta no pico (${mpptPct}%).</strong> ` +
          `${stats.totalPanels} painéis geram até <strong>${peakW} W</strong>, restam apenas ` +
          `<strong>+${mpptMargin} W</strong> de margem. ` +
          `Considere o modelo de <strong>80A</strong> para crescer sem risco.`;
      } else {
        alertEl.style.display = 'none';
        alertEl.className = 'mppt-alert';
      }
    }

    // Atualiza resumo de consumo de cargas e KPIs caso o modal esteja aberto
    this.updateLoadsKPIs();
  }

  /**
   * Salva TODAS as configurações do sistema solar no banco de dados IndexedDB:
   * Níveis (stack), Nível 1 e Nível 2 (placas, direção, orientação),
   * material, acabamento/cor, posição e nível de extensão.
   */
  saveAllSettings() {
    try {
      const config = {
        stackLevels: this.solarSystem.stackLevels,
        level1: { ...this.solarSystem.level1 },
        level2: { ...this.solarSystem.level2 },
        structureMaterial: this.solarSystem.structureMaterial,
        aluminumColor: this.solarSystem.aluminumColor,
        expansionProgress: this.solarSystem.expansionProgress,
        offsetZ: this.solarSystem.groupOffsetZ !== undefined ? this.solarSystem.groupOffsetZ : 0.40,
        offsetY: this.solarSystem.groupOffsetY !== undefined ? this.solarSystem.groupOffsetY : 0.00
      };
      idbSet('doblo_solar_full_config', config);
    } catch (e) {
      console.warn('Erro ao salvar configurações no banco de dados:', e);
    }
  }

  /**
   * Restaura todas as configurações salvas na inicialização
   */
  restoreAllSettings() {
    idbGet('doblo_solar_full_config', (cfg) => {
      try {
        if (!cfg) return;

        if (cfg.stackLevels !== undefined && [1, 2].includes(cfg.stackLevels)) {
          this.solarSystem.stackLevels = cfg.stackLevels;
        }
        if (cfg.level1) {
          if (cfg.level1.panels && [1, 2, 3, 4].includes(parseInt(cfg.level1.panels))) {
            this.solarSystem.level1.panels = parseInt(cfg.level1.panels);
          }
          if (cfg.level1.slideDirection && ['longitudinal', 'lateral', 'fixed', 'rear_only', 'front_only'].includes(cfg.level1.slideDirection)) {
            this.solarSystem.level1.slideDirection = cfg.level1.slideDirection;
          }
          if (cfg.level1.orientation && ['longitudinal', 'transverse'].includes(cfg.level1.orientation)) {
            this.solarSystem.level1.orientation = cfg.level1.orientation;
          }
        }
        if (cfg.level2) {
          if (cfg.level2.panels && [1, 2, 3, 4].includes(parseInt(cfg.level2.panels))) {
            this.solarSystem.level2.panels = parseInt(cfg.level2.panels);
          }
          if (cfg.level2.slideDirection && ['longitudinal', 'lateral', 'fixed', 'rear_only', 'front_only'].includes(cfg.level2.slideDirection)) {
            this.solarSystem.level2.slideDirection = cfg.level2.slideDirection;
          }
          if (cfg.level2.orientation && ['longitudinal', 'transverse'].includes(cfg.level2.orientation)) {
            this.solarSystem.level2.orientation = cfg.level2.orientation;
          }
        }
        if (cfg.structureMaterial && ['aluminum', 'steel'].includes(cfg.structureMaterial)) {
          this.solarSystem.structureMaterial = cfg.structureMaterial;
        }
        if (cfg.aluminumColor && ['silver', 'black'].includes(cfg.aluminumColor)) {
          this.solarSystem.aluminumColor = cfg.aluminumColor;
        }
        if (cfg.offsetZ !== undefined) {
          this.solarSystem.setGroupOffsetZ(parseFloat(cfg.offsetZ));
        }
        if (cfg.offsetY !== undefined) {
          this.solarSystem.setGroupOffsetY(parseFloat(cfg.offsetY));
        }

        // Reconstrói todo o sistema com as propriedades restauradas
        this.solarSystem.buildSystem();

        if (cfg.expansionProgress !== undefined) {
          this.solarSystem.updateExpansion(parseFloat(cfg.expansionProgress));
        }

        this.syncUIWithState();
      } catch (e) {
        console.warn('Erro ao restaurar configurações salvas:', e);
      }
    });
  }

  /**
   * Sincroniza visualmente os botões da UI com o estado atual do solarSystem
   */
  syncUIWithState() {
    const s = this.solarSystem;

    // 1. Níveis (Stack)
    document.querySelectorAll('[data-stack]').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.stack) === s.stackLevels);
    });

    // 2. NÍVEL 1 (EM BAIXO / INFERIOR)
    if (s.level1) {
      document.querySelectorAll('[data-l1-panels]').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.l1Panels) === s.level1.panels);
      });
      document.querySelectorAll('[data-l1-direction]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.l1Direction === s.level1.slideDirection);
      });
      document.querySelectorAll('[data-l1-orientation]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.l1Orientation === s.level1.orientation);
      });
    }

    // 3. NÍVEL 2 (EM CIMA / SUPERIOR)
    if (s.level2) {
      document.querySelectorAll('[data-l2-panels]').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.l2Panels) === s.level2.panels);
      });
      document.querySelectorAll('[data-l2-direction]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.l2Direction === s.level2.slideDirection);
      });
      document.querySelectorAll('[data-l2-orientation]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.l2Orientation === s.level2.orientation);
      });
    }

    // 4. Card do Nível 2 (exibe apenas se stackLevels === 2)
    const cardL2 = document.getElementById('card-level-2');
    if (cardL2) {
      cardL2.style.display = (s.stackLevels === 2) ? 'block' : 'none';
    }

    // 5. Material da estrutura
    const btnAluminum = document.getElementById('btn-mat-aluminum');
    const btnSteel = document.getElementById('btn-mat-steel');
    const colorSubbar = document.getElementById('aluminum-color-subbar');
    if (btnAluminum && btnSteel) {
      btnAluminum.classList.toggle('active', s.structureMaterial === 'aluminum');
      btnSteel.classList.toggle('active', s.structureMaterial === 'steel');
      if (colorSubbar) {
        colorSubbar.style.display = (s.structureMaterial === 'aluminum') ? 'flex' : 'none';
      }
    }

    // 6. Cor do Alumínio
    const btnColorSilver = document.getElementById('btn-color-silver');
    const btnColorBlack = document.getElementById('btn-color-black');
    if (btnColorSilver && btnColorBlack) {
      btnColorSilver.classList.toggle('primary', s.aluminumColor === 'silver');
      btnColorSilver.classList.toggle('active', s.aluminumColor === 'silver');
      btnColorBlack.classList.toggle('primary', s.aluminumColor === 'black');
      btnColorBlack.classList.toggle('active', s.aluminumColor === 'black');
    }

    // 7. Slider de Expansão
    const expSlider = document.getElementById('expansion-slider');
    if (expSlider) {
      const pct = Math.round(s.expansionProgress * 100);
      expSlider.value = pct;
      const expVal = document.getElementById('expansion-val');
      if (expVal) expVal.textContent = `${pct}%`;
      const expBadge = document.getElementById('expansion-badge');
      if (expBadge) {
        expBadge.className = 'status-badge ' + (pct === 0 ? 'retracted' : pct === 100 ? 'extended' : 'partial');
        expBadge.textContent = pct === 0 ? 'Fechado (Trânsito)' : pct === 100 ? 'Total Aberto (Camping)' : 'Parcial';
      }
    }

    // 8. Sliders de offset do rack
    const curZ = s.groupOffsetZ !== undefined ? s.groupOffsetZ : 0.40;
    const curY = s.groupOffsetY !== undefined ? s.groupOffsetY : 0.00;
    const rackSlider = document.getElementById('rack-offset-slider');
    const rackValLabel = document.getElementById('rack-offset-val');
    if (rackSlider) rackSlider.value = curZ;
    if (rackValLabel) rackValLabel.textContent = `${curZ >= 0 ? '+' : ''}${curZ.toFixed(2)} m`;

    const heightSlider = document.getElementById('rack-height-slider');
    const heightLabel = document.getElementById('rack-height-val');
    if (heightSlider) heightSlider.value = curY;
    if (heightLabel) heightLabel.textContent = `${curY >= 0 ? '+' : ''}${curY.toFixed(2)} m`;
  }


  /**
   * Sistema de Medição e Destaque Visual das Barras ao Passar o Mouse (Hover)
   */
  initBarMeasurementHover() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-9999, -9999);
    this.hoveredBarMesh = null;
    this.hoveredBarOriginalMaterials = null;

    let tooltip = document.getElementById('bar-hover-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'bar-hover-tooltip';
      tooltip.className = 'bar-hover-tooltip';
      document.body.appendChild(tooltip);
    }
    this.barTooltip = tooltip;

    const dom = this.renderer.domElement;
    let isDragging = false;

    dom.addEventListener('pointerdown', () => {
      isDragging = true;
      this.clearBarHover();
    });

    window.addEventListener('pointerup', () => {
      isDragging = false;
    });

    dom.addEventListener('pointermove', (event) => {
      if (isDragging) {
        this.clearBarHover();
        return;
      }

      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.updateBarHover(event.clientX, event.clientY);
    });

    dom.addEventListener('pointerleave', () => {
      this.clearBarHover();
    });
  }

  updateBarHover(screenX, screenY) {
    if (!this.solarSystem || !this.solarSystem.group) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.solarSystem.group.children, true);

    let target = null;
    for (const hit of intersects) {
      // Ignora cotas de texto (sprites), linhas de dimensão finas
      if (hit.object.isLine || hit.object.isSprite) continue;
      if (hit.object.userData && hit.object.userData.isBar) {
        target = hit.object;
        break;
      }
      if (hit.object.parent && hit.object.parent.userData && hit.object.parent.userData.isBar) {
        target = hit.object.parent;
        break;
      }
    }

    if (target) {
      if (this.hoveredBarMesh !== target) {
        this.clearBarHover();
        this.highlightBar(target);
      }
      this.showBarTooltip(target.userData, screenX, screenY);
      this.renderer.domElement.style.cursor = 'crosshair';
    } else {
      this.clearBarHover();
      this.renderer.domElement.style.cursor = 'default';
    }
  }

  highlightBar(mesh) {
    this.hoveredBarMesh = mesh;
    if (Array.isArray(mesh.material)) {
      this.hoveredBarOriginalMaterials = mesh.material.slice();
      mesh.material = mesh.material.map(m => {
        const clone = m.clone();
        if (clone.emissive) {
          clone.emissive = new THREE.Color(0x38bdf8);
          clone.emissiveIntensity = 0.55;
        }
        return clone;
      });
    } else if (mesh.material) {
      this.hoveredBarOriginalMaterials = mesh.material;
      const clone = mesh.material.clone();
      if (clone.emissive) {
        clone.emissive = new THREE.Color(0x38bdf8);
        clone.emissiveIntensity = 0.55;
      }
      mesh.material = clone;
    }
  }

  clearBarHover() {
    if (this.hoveredBarMesh && this.hoveredBarOriginalMaterials) {
      this.hoveredBarMesh.material = this.hoveredBarOriginalMaterials;
    }
    this.hoveredBarMesh = null;
    this.hoveredBarOriginalMaterials = null;
    if (this.barTooltip) {
      this.barTooltip.classList.remove('active');
    }
  }

  showBarTooltip(data, screenX, screenY) {
    if (!this.barTooltip || !data) return;

    const lenM = (data.barLength !== undefined) ? data.barLength : 0;
    const lenCm = Math.round(lenM * 100);
    const label = data.barLabel || 'Perfil Estrutural';
    const spec = data.profileSpec || 'Alumínio';

    let lengthHtml = '';
    if (data.barWidth !== undefined) {
      const widthCm = Math.round(data.barWidth * 100);
      lengthHtml = `<span class="val">${widthCm} x ${lenCm} cm</span> <span class="meters">(${data.barWidth.toFixed(2)} x ${lenM.toFixed(2)} m)</span>`;
    } else {
      lengthHtml = `<span class="val">${lenCm} cm</span> <span class="meters">(${lenM.toFixed(2)} m)</span>`;
    }

    this.barTooltip.innerHTML = `
      <div class="bar-hover-tooltip-title">
        <span>📏</span>
        <span>${label}</span>
      </div>
      <div class="bar-hover-tooltip-length">
        ${lengthHtml}
      </div>
      <div class="bar-hover-tooltip-spec">
        <span>⚙️ ${spec}</span>
      </div>
    `;

    // Proteção de borda da tela
    const tooltipW = 230;
    const tooltipH = 80;
    let posX = screenX + 16;
    let posY = screenY + 16;

    if (posX + tooltipW > window.innerWidth - 10) {
      posX = screenX - tooltipW - 16;
    }
    if (posY + tooltipH > window.innerHeight - 10) {
      posY = screenY - tooltipH - 16;
    }

    this.barTooltip.style.left = `${posX}px`;
    this.barTooltip.style.top = `${posY}px`;
    this.barTooltip.classList.add('active');
  }

  takeScreenshot() {
    this.renderer.render(this.scene, this.camera);
    const dataURL = this.renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `doblo_painel_solar_${this.solarSystem.currentMode}_${Math.round(this.solarSystem.expansionProgress * 100)}pct.png`;
    link.href = dataURL;
    link.click();
  }

  /**
   * Loop principal de renderização
   */
  animate() {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    // Auto animação de loop com pausa suave nas pontas
    if (this.isAutoAnimating) {
      if (this.autoAnimPause > 0) {
        this.autoAnimPause -= delta;
      } else {
        let current = this.solarSystem.expansionProgress;
        current += this.autoAnimDirection * this.autoAnimSpeed * delta;

        if (current >= 1.0) {
          current = 1.0;
          this.autoAnimDirection = -1;
          this.autoAnimPause = 0.8; // Pausa breve totalmente aberto
        } else if (current <= 0.0) {
          current = 0.0;
          this.autoAnimDirection = 1;
          this.autoAnimPause = 0.8; // Pausa breve totalmente fechado
        }

        this.setExpansion(current);
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
