/**
 * Sistema Mecânico do Rack Solar Retrátil para Fiat Doblò
 * 
 * ALGORITMO TOTALMENTE REFEITO PARA PAINÉIS SOLARES FLEXÍVEIS DE 100W:
 * - Especificações do Painel: 100W monocristalino, 60cm de largura x 1.00m de comprimento, 3mm de espessura, 1.6kg.
 * - Parâmetros Elétricos: Voc 22.28V, Vmax 24V (Vmp ~ 18.2V, Isc ~ 5.8A).
 * - Fixação Mecânica Direta nos Ilhoses: Presilhas de alumínio e parafusos Allen M5/M6 fixados nas ranhuras T do perfil.
 * - Sistema de Empilhamento Paramétrico em Andares (Stack): 2, 3 ou 4 níveis (1 fixo superior + N gavetas telescópicas).
 * - Encaixe e Direção Configuráveis:
 *   * Direção de Abertura: Longitudinal (Frente/Trás alternado) ou Lateral (Asas/Toldo).
 *   * Orientação do Painel: Longitudinal (1.00m em Z x 0.60m em X) ou Transversal (0.60m em Z x 1.00m em X).
 *   * Placas por Nível: 1 placa (100W), 2 placas (200W) ou 4 placas (400W).
 * - Modelagem 3D Hiper-Realista:
 *   * Células monocristalinas pretas profundas, borda branca laminada, ilhoses metálicos 3D;
 *   * Caixa de junção frontal com cabos solares fotovoltaicos e conectores MC4;
 *   * Guias telescópicas pesadas, travessas de apoio anti-vento e esteira porta-cabos.
 */

class SolarSystem {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = "SolarSystem";
    this.scene.add(this.group);

    // Parâmetros de alinhamento real na Fiat Doblò
    this.RACK_OFFSET_Z = +0.40; // Z positivo = frente da cena = teto central/dianteiro
    this.BASE_Y = 2.06;         // Eleva para assentar nas calhas acima da curvatura do teto

    // Parâmetros de perfis e folgas reais para empilhamento físico perfeito (em metros):
    this.BASE_PROFILE_H = 0.040; // 40 mm (Metalon ou T-Slot 40x40 do rack base)
    this.TRAY_PROFILE_H = 0.030; // 30 mm (Perfil T-Slot 30x30 da moldura das bandejas)
    this.DRAWER_STAGE_H = 0.060; // Altura de cada andar de gaveta (espaçamento vertical útil)
    this.GAP_THERMAL = 0.035;   // Folga térmica e aerodinâmica entre o nível de baixo e o nível de cima

    // Alturas físicas calculadas para Nível 1 (Gaveta Inferior e Gaveta Superior) e Nível 2:
    // Gaveta Inferior (N1 Baixo): assentada 10mm acima do topo das longarinas do rack base (sem tocar no rack)
    this.Y_LEVEL1_LOWER = this.BASE_Y + 0.045;
    // Gaveta Superior (N1 Cima): empilhada perfeitamente 1 EM CIMA DA OUTRA com 19mm de folga livre dos parafusos
    this.Y_LEVEL1_UPPER = this.BASE_Y + 0.105;
    // Nível 2 (Superior / Topo Fixo): elevado com 29mm de folga térmica acima da gaveta superior de baixo
    this.Y_LEVEL2 = this.BASE_Y + 0.175;

    // Especificações físicas da Placa Solar Flexível 100W
    this.PANEL_SPECS = {
      width: 0.60,      // 60 cm
      length: 1.00,     // 1.00 m
      thickness: 0.003, // 3 mm
      weightKg: 1.6,    // 1.6 kg
      powerWatts: 100,  // 100 Wp
      voc: 22.28,       // 22.28 V
      vmp: 18.2,        // 18.2 V
      isc: 5.8,         // 5.8 A
      imp: 5.5          // 5.5 A
    };

    // Parâmetros do Algoritmo de Empilhamento e Encaixe por Nível
    this.stackLevels = 2;                  // Quantidade de níveis (1 ou 2 níveis)

    // Configuração do NÍVEL 1 (EM BAIXO / INFERIOR - Base do Rack)
    this.level1 = {
      panels: 2,                      // 1, 2, 3 ou 4 placas
      slideDirection: 'longitudinal', // 'longitudinal' (frente/trás), 'lateral', 'fixed', 'rear_only', 'front_only'
      orientation: 'longitudinal'     // 'longitudinal' ou 'transverse'
    };

    // Configuração do NÍVEL 2 (EM CIMA / SUPERIOR - Elevado)
    this.level2 = {
      panels: 2,                      // 1, 2, 3 ou 4 placas
      slideDirection: 'fixed',        // 'fixed', 'longitudinal', 'lateral', 'rear_only', 'front_only'
      orientation: 'longitudinal'     // 'longitudinal' ou 'transverse'
    };

    // Parâmetros de estado visual
    this.expansionProgress = 0.0;
    this.explodedProgress = 0.0;
    this.structureMaterial = 'aluminum';
    this.aluminumColor = 'silver';         // 'silver' ou 'black'
    this.showDimensions = true;
    this.showCableChain = false;
    this.upperTransparent = false;

    // Grupos estruturais principais
    this.fixedFrameGroup = new THREE.Group();
    this.upperLayerGroup = new THREE.Group();    // Nível de Topo Fixo (Nível 0)
    this.slidingLayerGroup1 = new THREE.Group(); // Gaveta 1 (Nível 1)
    this.slidingLayerGroup2 = new THREE.Group(); // Gaveta 2 (Nível 2)
    this.slidingLayerGroup3 = new THREE.Group(); // Gaveta 3 (Nível 3, se 4 andares)
    this.intermediateRailsGroup1 = new THREE.Group(); // Extensor telescópico gaveta 1
    this.intermediateRailsGroup2 = new THREE.Group(); // Extensor telescópico gaveta 2
    this.intermediateRailsGroup3 = new THREE.Group(); // Extensor telescópico gaveta 3
    this.intermediateRailsGroup4 = new THREE.Group(); // Extensor telescópico gaveta 4
    this.dimensionsGroup = new THREE.Group();
    this.cableChainGroup = new THREE.Group();
    this.batteryGroup = new THREE.Group();
    this.weldGussetsGroup = new THREE.Group();
    this.aluminumBracketsGroup = new THREE.Group();
    this.mpptGroup = new THREE.Group(); // Controlador MPPT Kingbo 60A

    this.group.add(this.fixedFrameGroup);
    this.group.add(this.upperLayerGroup);
    this.group.add(this.slidingLayerGroup1);
    this.group.add(this.slidingLayerGroup2);
    this.group.add(this.slidingLayerGroup3);
    this.group.add(this.intermediateRailsGroup1);
    this.group.add(this.intermediateRailsGroup2);
    this.group.add(this.intermediateRailsGroup3);
    this.group.add(this.intermediateRailsGroup4);
    this.group.add(this.dimensionsGroup);
    this.group.add(this.cableChainGroup);
    this.group.add(this.batteryGroup);
    this.group.add(this.weldGussetsGroup);
    this.group.add(this.aluminumBracketsGroup);
    this.group.add(this.mpptGroup);

    this.slidingLayers = [
      this.slidingLayerGroup1,
      this.slidingLayerGroup2,
      this.slidingLayerGroup3
    ];

    this.rackMeshes = [];

    this.buildSystem();
  }

  // --- SETTERS DE CONFIGURAÇÃO PARAMÉTRICA ---

  // Compatibilidade com propriedades antigas
  get panelsPerLevel() {
    return this.level1.panels;
  }
  set panelsPerLevel(val) {
    const v = parseInt(val);
    if (![1, 2, 3, 4].includes(v)) return;
    this.level1.panels = v;
    this.level2.panels = v;
  }

  get slideDirection() {
    return this.level2.slideDirection;
  }
  set slideDirection(val) {
    this.level2.slideDirection = val;
  }

  get panelOrientation() {
    return this.level1.orientation;
  }
  set panelOrientation(val) {
    this.level1.orientation = val;
    this.level2.orientation = val;
  }

  get currentMode() {
    return `stack_${this.stackLevels}L_N1(${this.level1.panels}P_${this.level1.orientation})_N2(${this.level2.panels}P_${this.level2.slideDirection})`;
  }

  setStackLevels(levels) {
    const val = parseInt(levels);
    if (this.stackLevels === val || ![1, 2].includes(val)) return;
    this.stackLevels = val;
    this.buildSystem();
    this.updateExpansion(this.expansionProgress);
    this.updateExploded(this.explodedProgress);
  }

  // Métodos específicos do NÍVEL 1 (EM BAIXO / INFERIOR)
  setLevel1Panels(count) {
    const val = parseInt(count);
    if (![1, 2, 3, 4].includes(val)) return;
    this.level1.panels = val;
    this.buildSystem();
    this.updateExpansion(this.expansionProgress);
    this.updateExploded(this.explodedProgress);
  }

  setLevel1Direction(direction) {
    if (!['longitudinal', 'lateral', 'fixed', 'rear_only', 'front_only'].includes(direction)) return;
    this.level1.slideDirection = direction;
    this.buildSystem();
    this.updateExpansion(this.expansionProgress);
    this.updateExploded(this.explodedProgress);
  }

  setLevel1Orientation(orientation) {
    if (!['longitudinal', 'transverse'].includes(orientation)) return;
    this.level1.orientation = orientation;
    this.buildSystem();
    this.updateExpansion(this.expansionProgress);
    this.updateExploded(this.explodedProgress);
  }

  // Métodos específicos do NÍVEL 2 (EM CIMA / SUPERIOR)
  setLevel2Panels(count) {
    const val = parseInt(count);
    if (![1, 2, 3, 4].includes(val)) return;
    this.level2.panels = val;
    this.buildSystem();
    this.updateExpansion(this.expansionProgress);
    this.updateExploded(this.explodedProgress);
  }

  setLevel2Direction(direction) {
    if (!['longitudinal', 'lateral', 'fixed', 'rear_only', 'front_only'].includes(direction)) return;
    this.level2.slideDirection = direction;
    this.buildSystem();
    this.updateExpansion(this.expansionProgress);
    this.updateExploded(this.explodedProgress);
  }

  setLevel2Orientation(orientation) {
    if (!['longitudinal', 'transverse'].includes(orientation)) return;
    this.level2.orientation = orientation;
    this.buildSystem();
    this.updateExpansion(this.expansionProgress);
    this.updateExploded(this.explodedProgress);
  }

  setSlideDirection(direction) {
    this.setLevel2Direction(direction);
  }

  setPanelOrientation(orientation) {
    this.setLevel1Orientation(orientation);
    this.setLevel2Orientation(orientation);
  }

  setPanelsPerLevel(count) {
    this.setLevel1Panels(count);
    this.setLevel2Panels(count);
  }

  setStructureMaterial(type) {
    if (this.structureMaterial === type) return;
    this.structureMaterial = type;
    this.buildSystem();
    this.updateExpansion(this.expansionProgress);
    this.updateExploded(this.explodedProgress);
  }

  setAluminumColor(color) {
    if (this.aluminumColor === color) return;
    this.aluminumColor = color;
    if (this.structureMaterial === 'aluminum') {
      this.buildSystem();
      this.updateExpansion(this.expansionProgress);
      this.updateExploded(this.explodedProgress);
    }
  }

  setCableChainVisible(visible) {
    this.showCableChain = visible;
    this.cableChainGroup.visible = visible;
  }

  setDimensionsVisible(visible) {
    this.showDimensions = visible;
    this.dimensionsGroup.visible = visible;
  }

  setUpperTransparency(transparent) {
    this.upperTransparent = transparent;
    this.upperLayerGroup.traverse(child => {
      if (child.isMesh && child.material) {
        if (transparent) {
          if (!child.userData.origMaterial) {
            child.userData.origMaterial = child.material;
          }
          child.material = child.userData.origMaterial.clone();
          child.material.transparent = true;
          child.material.opacity = 0.35;
          child.material.needsUpdate = true;
        } else if (child.userData.origMaterial) {
          child.material = child.userData.origMaterial;
          child.material.needsUpdate = true;
        }
      }
    });
  }

  setGroupOffsetZ(z) {
    this.groupOffsetZ = z;
    this.group.position.z = z;
  }

  setGroupOffsetY(y) {
    this.groupOffsetY = y;
    this.group.position.y = y;
  }

  // --- RECONSTRUÇÃO DO SISTEMA COMPLETO ---

  buildSystem() {
    this.clearGroup(this.fixedFrameGroup);
    this.clearGroup(this.upperLayerGroup);
    this.clearGroup(this.slidingLayerGroup1);
    this.clearGroup(this.slidingLayerGroup2);
    this.clearGroup(this.slidingLayerGroup3);
    this.clearGroup(this.intermediateRailsGroup1);
    this.clearGroup(this.intermediateRailsGroup2);
    this.clearGroup(this.intermediateRailsGroup3);
    this.clearGroup(this.intermediateRailsGroup4);
    this.clearGroup(this.dimensionsGroup);
    this.clearGroup(this.cableChainGroup);
    this.clearGroup(this.batteryGroup);
    this.clearGroup(this.weldGussetsGroup);
    this.clearGroup(this.aluminumBracketsGroup);
    this.clearGroup(this.mpptGroup);
    this.rackMeshes = [];

    // Reset de posições relativas dos grupos
    this.fixedFrameGroup.position.set(0, 0, 0);
    this.upperLayerGroup.position.set(0, 0, 0);
    this.slidingLayerGroup1.position.set(0, 0, 0);
    this.slidingLayerGroup2.position.set(0, 0, 0);
    this.slidingLayerGroup3.position.set(0, 0, 0);
    this.intermediateRailsGroup1.position.set(0, 0, 0);
    this.intermediateRailsGroup2.position.set(0, 0, 0);
    this.intermediateRailsGroup3.position.set(0, 0, 0);
    this.intermediateRailsGroup4.position.set(0, 0, 0);

    // 1. Calcula dimensões geométricas da bandeja com base na orientação e placas por nível
    const trayDimsL1 = this.calculateTrayDimensions(this.level1.panels, this.level1.orientation);
    const trayDimsL2 = (this.stackLevels === 2)
      ? this.calculateTrayDimensions(this.level2.panels, this.level2.orientation)
      : trayDimsL1;
    const trayDims = trayDimsL2;
    this.currentTrayDims = trayDims;

    // 2. Constrói o Rack Base montado nas calhas da Doblò (com travessas alinhadas às quinas)
    this.buildBaseRack(trayDimsL2);

    // 3. Constrói o Empilhamento em Níveis (Stack)
    this.buildStackStructure(trayDimsL2);

    // 4. Esteiras porta-cabos para cada gaveta retrátil
    this.buildCableChains();

    // 5. Bateria Kingbo LiFePO4 de 560Ah
    this.buildKingboBattery();

    // 5b. Controlador MPPT Kingbo 60A (posicionado ao lado da bateria)
    this.buildKingboMPPT();

    // 6. Cotas Técnicas 3D atualizadas com as medidas do painel flexível
    this.buildDimensionLines(trayDims);

    this.dimensionsGroup.visible = this.showDimensions;
    this.cableChainGroup.visible = false;

    this.updateExpansion(this.expansionProgress);
    this.updateExploded(this.explodedProgress);
  }

  clearGroup(grp) {
    if (!grp) return;
    while (grp.children.length > 0) {
      const obj = grp.children[0];
      grp.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }
  }

  /**
   * Determina largura e comprimento de cada bandeja de acordo com
   * a orientação física da placa e o número de placas por andar.
   */
  calculateTrayDimensions(panelCount, orientation) {
    const pCount = (panelCount !== undefined) ? parseInt(panelCount) : (this.level1 ? this.level1.panels : 2);
    const orient = orientation || (this.level1 ? this.level1.orientation : 'longitudinal');

    const pW = (orient === 'longitudinal') ? this.PANEL_SPECS.width : this.PANEL_SPECS.length;
    const pL = (orient === 'longitudinal') ? this.PANEL_SPECS.length : this.PANEL_SPECS.width;

    let cols = 1;
    let rows = 1;

    if (pCount === 1) {
      cols = 1;
      rows = 1;
    } else if (pCount === 2) {
      if (orient === 'longitudinal') {
        cols = 2; // 2 placas de 60cm lado a lado = 1.20m de largura útil
        rows = 1;
      } else {
        cols = 1; // 1 placa de 1.00m de largura cruzada
        rows = 2; // 2 placas em fila = 1.20m de comprimento
      }
    } else if (pCount === 3) {
      if (orient === 'longitudinal') {
        cols = 2;
        rows = 2; // 3 placas ocupando a bandeja
      } else {
        cols = 1;
        rows = 3; // 3 placas de 1.00m largura x 0.60m = 1.80m de comprimento
      }
    } else if (pCount === 4) {
      cols = 2;
      rows = 2;
    }

    const gapCol = (cols > 1) ? 0.030 : 0.0;
    const gapRow = (rows > 1) ? 0.030 : 0.0;
    const marginFrame = 0.08; // Margem para perfis e furações
    const trayWidth = (cols * pW) + ((cols - 1) * gapCol) + marginFrame;
    const trayLength = (rows * pL) + ((rows - 1) * gapRow) + marginFrame;

    return {
      panelW: pW,
      panelL: pL,
      cols: cols,
      rows: rows,
      panelCount: pCount,
      trayWidth: Math.max(0.68, trayWidth),
      trayLength: Math.max(0.68, trayLength)
    };
  }

  /**
   * Constrói o Rack Base (220 x 140 cm) apoiado nas calhas originais da Doblò
   */
  buildBaseRack(trayDims) {
    const mats = MaterialLibrary.materials;
    const rack = new THREE.Group();

    const length = 2.20;
    const width = 1.40;
    const profileSize = 0.04;
    const zCenter = this.RACK_OFFSET_Z;
    const isAluminum = (this.structureMaterial === 'aluminum');

    const frameMat = isAluminum
      ? (this.aluminumColor === 'black' ? mats.aluminumProfileBlack : mats.aluminumProfileSilver)
      : mats.weldedSteelMetalon;

    // 1. Longarinas Principais (2.20m ao longo do teto)
    let barLeft, barRight;
    if (isAluminum) {
      barLeft = AluminumExtrusionFactory.createProfileMesh(length, frameMat, { axis: 'z', showCutFace: true });
      barRight = AluminumExtrusionFactory.createProfileMesh(length, frameMat, { axis: 'z', showCutFace: true });
    } else {
      const longBarGeo = new THREE.BoxGeometry(profileSize, profileSize, length);
      barLeft = new THREE.Mesh(longBarGeo, frameMat);
      barRight = new THREE.Mesh(longBarGeo, frameMat);
    }

    barLeft.position.set(-width / 2 + profileSize / 2, this.BASE_Y, zCenter);
    barLeft.castShadow = true;
    barLeft.userData = { isBar: true, barLength: length, barLabel: 'Longarina Lateral do Rack Base', profileSpec: isAluminum ? 'Perfil T-Slot 40x40' : 'Metalon 40x40' };
    rack.add(barLeft);
    this.rackMeshes.push(barLeft);

    barRight.position.set(width / 2 - profileSize / 2, this.BASE_Y, zCenter);
    barRight.castShadow = true;
    barRight.userData = { isBar: true, barLength: length, barLabel: 'Longarina Lateral do Rack Base', profileSpec: isAluminum ? 'Perfil T-Slot 40x40' : 'Metalon 40x40' };
    rack.add(barRight);
    this.rackMeshes.push(barRight);

    // 2. Travessas Transversais Contínuas (Frente, Trás e Apoio sob as Quinas da Bandeja)
    const crossBarLength = width - profileSize * 2;
    const zFront = zCenter + length / 2 - profileSize / 2;
    const zRear = zCenter - length / 2 + profileSize / 2;
    const tL = (trayDims && trayDims.trayLength) ? trayDims.trayLength : 1.08;
    const zMidFront = zCenter + (tL / 2) - 0.015;
    const zMidRear = zCenter - (tL / 2) + 0.015;
    const crossZPositions = [zFront, zRear, zMidFront, zMidRear];

    crossZPositions.forEach(zPos => {
      let crossBar;
      if (isAluminum) {
        crossBar = AluminumExtrusionFactory.createProfileMesh(crossBarLength, frameMat, { axis: 'x' });
      } else {
        const crossGeo = new THREE.BoxGeometry(crossBarLength, profileSize, profileSize);
        crossBar = new THREE.Mesh(crossGeo, frameMat);
      }
      crossBar.position.set(0, this.BASE_Y, zPos);
      crossBar.castShadow = true;
      crossBar.userData = { isBar: true, barLength: crossBarLength, barLabel: 'Travessa Transversal do Rack Base', profileSpec: isAluminum ? 'Perfil T-Slot 40x40' : 'Metalon 40x40' };
      rack.add(crossBar);
      this.rackMeshes.push(crossBar);
    });

    // 2.1 Segmentos Longitudinais Centrais de Apoio e Leito das Gavetas
    // Encaixados perfeitamente ENTRE as travessas transversais (sem cruzamento ou sobreposição)
    const midXPositions = [-0.34, 0.34];
    const longitudinalSpans = [
      // Vão Dianteiro: entre zMidFront e zFront
      {
        len: (zFront - profileSize / 2) - (zMidFront + profileSize / 2),
        z: ((zFront - profileSize / 2) + (zMidFront + profileSize / 2)) / 2
      },
      // Vão Central: entre zMidRear e zMidFront
      {
        len: (zMidFront - profileSize / 2) - (zMidRear + profileSize / 2),
        z: ((zMidFront - profileSize / 2) + (zMidRear + profileSize / 2)) / 2
      },
      // Vão Traseiro: entre zRear e zMidRear
      {
        len: (zMidRear - profileSize / 2) - (zRear + profileSize / 2),
        z: ((zMidRear - profileSize / 2) + (zRear + profileSize / 2)) / 2
      }
    ];

    midXPositions.forEach(mx => {
      longitudinalSpans.forEach(span => {
        if (span.len <= 0.02) return;
        let midBar;
        if (isAluminum) {
          midBar = AluminumExtrusionFactory.createProfileMesh(span.len, frameMat, { axis: 'z' });
        } else {
          const midGeo = new THREE.BoxGeometry(profileSize, profileSize, span.len);
          midBar = new THREE.Mesh(midGeo, frameMat);
        }
        midBar.position.set(mx, this.BASE_Y, span.z);
        midBar.castShadow = true;
        midBar.userData = { isBar: true, barLength: span.len, barLabel: 'Longarina Central de Apoio do Leito', profileSpec: isAluminum ? 'Perfil T-Slot 40x40' : 'Metalon 40x40' };
        rack.add(midBar);
        this.rackMeshes.push(midBar);
      });
    });

    // 3. Cantoneiras com parafusos Allen
    if (isAluminum) {
      AluminumExtrusionFactory.addRackBrackets(this.aluminumBracketsGroup, width, length, zCenter, this.BASE_Y, profileSize, [zMidFront, zMidRear]);
      this.aluminumBracketsGroup.visible = true;
      this.weldGussetsGroup.visible = false;
    } else {
      this.aluminumBracketsGroup.visible = false;
      this.weldGussetsGroup.visible = true;
      const gussetGeo = new THREE.BoxGeometry(0.06, 0.008, 0.06);
      const gussetCorners = [
        [-width / 2 + 0.04, zCenter + length / 2 - 0.04],
        [width / 2 - 0.04, zCenter + length / 2 - 0.04],
        [-width / 2 + 0.04, zCenter - length / 2 + 0.04],
        [width / 2 - 0.04, zCenter - length / 2 + 0.04]
      ];
      gussetCorners.forEach(([gx, gz]) => {
        const gusset = new THREE.Mesh(gussetGeo, mats.weldedSteelMetalon);
        gusset.position.set(gx, this.BASE_Y + 0.02, gz);
        this.weldGussetsGroup.add(gusset);
      });
    }

    // 4. Sapatas de elevação para as calhas da Doblò
    const riserGeo = new THREE.BoxGeometry(0.06, 0.08, 0.08);
    const risersPos = [
      [-width / 2 + 0.05, this.BASE_Y - 0.04, zCenter + 0.85],
      [width / 2 - 0.05, this.BASE_Y - 0.04, zCenter + 0.85],
      [-width / 2 + 0.05, this.BASE_Y - 0.04, zCenter - 0.85],
      [width / 2 - 0.05, this.BASE_Y - 0.04, zCenter - 0.85]
    ];
    risersPos.forEach(p => {
      const riser = new THREE.Mesh(riserGeo, frameMat);
      riser.position.set(...p);
      rack.add(riser);
      this.rackMeshes.push(riser);
    });

    this.fixedFrameGroup.add(rack);
  }

  /**
   * Constrói a Estrutura Paramétrica em Níveis (Stack):
   * NÍVEL 1: EM BAIXO (inferior, sobre o rack do teto).
   * NÍVEL 2: EM CIMA (superior, elevado sobre postes espaçadores).
   * Cada nível possui quantidade de placas e direção de abertura/movimento independentes!
   */
  buildStackStructure() {
    const zCenter = this.RACK_OFFSET_Z;

    // Alturas físicas calculadas para acomodar as 2 placas empilhadas (1 em cima da outra) no nível de baixo
    // e o nível superior elevado sem nenhuma colisão com a estrutura:
    const yLevel1_Lower = this.Y_LEVEL1_LOWER; // Gaveta inferior do Nível 1 (2.105m)
    const yLevel1_Upper = this.Y_LEVEL1_UPPER; // Gaveta superior do Nível 1 (2.165m - 1 em cima da outra!)
    const yLevel2 = this.Y_LEVEL2;             // Nível 2 (Superior / Topo Fixo: 2.235m)
    this.UPPER_TRAY_Y = (this.stackLevels === 2) ? yLevel2 : yLevel1_Upper;

    // Dimensões do nível 2 de referência (para calcular o deslocamento necessário das gavetas)
    const dimsL2 = (this.stackLevels === 2)
      ? this.calculateTrayDimensions(this.level2.panels, this.level2.orientation)
      : { trayWidth: 1.28, trayLength: 1.08 };

    // 1. Constrói NÍVEL 1 (EM BAIXO / INFERIOR)
    // Passa yLevel1_Lower e yLevel1_Upper para empilhar perfeitamente 1 em cima da outra no nível de baixo
    this.buildLevel(1, this.level1, yLevel1_Lower, yLevel1_Upper, this.slidingLayerGroup1, this.slidingLayerGroup2, dimsL2);

    // 2. Se for 2 Níveis: Constrói NÍVEL 2 (EM CIMA / SUPERIOR)
    if (this.stackLevels === 2) {
      this.buildLevel(2, this.level2, yLevel2, yLevel2, this.upperLayerGroup, this.slidingLayerGroup3, dimsL2);

      // Desvio de sustentação estrutural: pilares externos com braço de desvio para sustentar as quinas
      // sem colidir com os painéis inferiores nem sobrepor perfis
      this.addSpacerPosts(
        this.fixedFrameGroup,
        dimsL2.trayWidth,
        dimsL2.trayLength,
        this.BASE_Y + this.BASE_PROFILE_H / 2, // Assenta no topo físico das longarinas do rack base (y = 2.08)
        yLevel2,
        zCenter,
        this.level1 ? this.level1.slideDirection : 'longitudinal'
      );
    } else {
      this.level2Motion = { dir: 'fixed', travelA: 0, travelB: 0 };
    }
  }

  /**
   * Constrói um nível completo (1 ou 2) baseado em sua configuração própria:
   * As gavetas sempre partem do CENTRO (recolhidas sob o nível superior)
   * e deslizam suavemente com corrediças telescópicas industriais sem flutuar.
   */
  buildLevel(levelNumber, levelConfig, yLower, yUpper, targetGroupA, targetGroupB, refL2Dims) {
    const zCenter = this.RACK_OFFSET_Z;
    const panels = (levelConfig && levelConfig.panels) ? levelConfig.panels : 2;
    const orient = (levelConfig && levelConfig.orientation) ? levelConfig.orientation : 'longitudinal';
    const dir = (levelConfig && levelConfig.slideDirection)
      ? levelConfig.slideDirection
      : (levelNumber === 1 ? 'longitudinal' : 'fixed');

    const l2Length = refL2Dims ? refL2Dims.trayLength : 1.08;
    const l2Width = refL2Dims ? refL2Dims.trayWidth : 1.28;

    if (dir === 'fixed') {
      const dims = this.calculateTrayDimensions(panels, orient);
      const yFixed = (levelNumber === 2) ? yUpper : yLower;
      this.buildTrayLevel(targetGroupA, dims, 0, yFixed, zCenter, levelNumber, `Nível ${levelNumber} (Fixo)`);
      if (levelNumber === 1) {
        this.level1Motion = { dir: 'fixed', travelA: 0, travelB: 0 };
      } else {
        this.level2Motion = { dir: 'fixed', travelA: 0, travelB: 0 };
      }
    } else if (dir === 'longitudinal') {
      // Modo Bipartido Frente / Trás (metade frente, metade trás)
      let frontCount = 0;
      let rearCount = 0;
      if (panels === 1) { frontCount = 0; rearCount = 1; }
      else if (panels === 2) { frontCount = 1; rearCount = 1; }
      else if (panels === 3) { frontCount = 2; rearCount = 1; }
      else if (panels === 4) { frontCount = 2; rearCount = 2; }

      // Sub-andares telescópicos verticais:
      // Gaveta Dianteira (Grupo A) fica no andar superior (yUpper)
      // Gaveta Traseira (Grupo B) fica no andar inferior (yLower)
      // As duas placas encaixam perfeitamente 1 EM CIMA DA OUTRA quando recolhidas no centro!
      const yFront = yUpper;
      const yRear = yLower;

      let travelFront = 0;
      let travelRear = 0;

      if (frontCount > 0) {
        const frontDims = this.calculateTrayDimensions(frontCount, orient);
        // PARTE RIGOROSAMENTE DO CENTRO: zCenter
        this.buildTrayLevel(
          targetGroupA,
          frontDims,
          0,
          yFront,
          zCenter,
          levelNumber,
          `Nível ${levelNumber} (Gaveta Dianteira)`
        );
        this.addTelescopicRails(
          this.fixedFrameGroup,
          (levelNumber === 1 ? this.intermediateRailsGroup1 : this.intermediateRailsGroup3),
          targetGroupA,
          frontDims.trayWidth,
          frontDims.trayLength,
          0,
          yFront,
          zCenter,
          +1 // frente
        );
        travelFront = (l2Length / 2) + (frontDims.trayLength / 2) + 0.02;
      }

      if (rearCount > 0) {
        const rearDims = this.calculateTrayDimensions(rearCount, orient);
        // PARTE RIGOROSAMENTE DO CENTRO: zCenter
        this.buildTrayLevel(
          targetGroupB,
          rearDims,
          0,
          yRear,
          zCenter,
          levelNumber,
          `Nível ${levelNumber} (Gaveta Traseira)`
        );
        this.addTelescopicRails(
          this.fixedFrameGroup,
          (levelNumber === 1 ? this.intermediateRailsGroup2 : this.intermediateRailsGroup4),
          targetGroupB,
          rearDims.trayWidth,
          rearDims.trayLength,
          0,
          yRear,
          zCenter,
          -1 // trás
        );
        travelRear = (l2Length / 2) + (rearDims.trayLength / 2) + 0.02;
      }

      if (levelNumber === 1) {
        this.level1Motion = { dir: 'longitudinal', travelA: travelFront, travelB: travelRear };
      } else {
        this.level2Motion = { dir: 'longitudinal', travelA: travelFront, travelB: travelRear };
      }
    } else if (dir === 'lateral') {
      // Modo Bipartido Lateral (Esquerda / Direita)
      let leftCount = 0;
      let rightCount = 0;
      if (panels === 1) { leftCount = 0; rightCount = 1; }
      else if (panels === 2) { leftCount = 1; rightCount = 1; }
      else if (panels === 3) { leftCount = 2; rightCount = 1; }
      else if (panels === 4) { leftCount = 2; rightCount = 2; }

      // Sub-andares telescópicos verticais:
      // Gaveta Esquerda (Grupo A) fica no andar superior (yUpper)
      // Gaveta Direita (Grupo B) fica no andar inferior (yLower)
      // As duas placas encaixam perfeitamente 1 EM CIMA DA OUTRA quando recolhidas no centro!
      const yLeft = yUpper;
      const yRight = yLower;

      let travelLeft = 0;
      let travelRight = 0;

      if (leftCount > 0) {
        const leftDims = this.calculateTrayDimensions(leftCount, orient);
        // PARTE RIGOROSAMENTE DO CENTRO: x = 0, z = zCenter
        this.buildTrayLevel(
          targetGroupA,
          leftDims,
          0,
          yLeft,
          zCenter,
          levelNumber,
          `Nível ${levelNumber} (Gaveta Esquerda)`
        );
        this.addLateralTelescopicRails(
          this.fixedFrameGroup,
          (levelNumber === 1 ? this.intermediateRailsGroup1 : this.intermediateRailsGroup3),
          targetGroupA,
          leftDims.trayWidth,
          leftDims.trayLength,
          0,
          yLeft,
          zCenter,
          -1 // esquerda
        );
        travelLeft = (l2Width / 2) + (leftDims.trayWidth / 2) + 0.02;
      }

      if (rightCount > 0) {
        const rightDims = this.calculateTrayDimensions(rightCount, orient);
        // PARTE RIGOROSAMENTE DO CENTRO: x = 0, z = zCenter
        this.buildTrayLevel(
          targetGroupB,
          rightDims,
          0,
          yRight,
          zCenter,
          levelNumber,
          `Nível ${levelNumber} (Gaveta Direita)`
        );
        this.addLateralTelescopicRails(
          this.fixedFrameGroup,
          (levelNumber === 1 ? this.intermediateRailsGroup2 : this.intermediateRailsGroup4),
          targetGroupB,
          rightDims.trayWidth,
          rightDims.trayLength,
          0,
          yRight,
          zCenter,
          +1 // direita
        );
        travelRight = (l2Width / 2) + (rightDims.trayWidth / 2) + 0.02;
      }

      if (levelNumber === 1) {
        this.level1Motion = { dir: 'lateral', travelA: travelLeft, travelB: travelRight };
      } else {
        this.level2Motion = { dir: 'lateral', travelA: travelLeft, travelB: travelRight };
      }
    } else if (dir === 'rear_only') {
      // Gaveta única para Trás
      const dims = this.calculateTrayDimensions(panels, orient);
      // PARTE RIGOROSAMENTE DO CENTRO: zCenter
      this.buildTrayLevel(
        targetGroupB,
        dims,
        0,
        yLower,
        zCenter,
        levelNumber,
        `Nível ${levelNumber} (Gaveta Traseira Única)`
      );
      this.addTelescopicRails(
        this.fixedFrameGroup,
        (levelNumber === 1 ? this.intermediateRailsGroup2 : this.intermediateRailsGroup4),
        targetGroupB,
        dims.trayWidth,
        dims.trayLength,
        0,
        yLower,
        zCenter,
        -1 // trás
      );
      const travelRear = (l2Length / 2) + (dims.trayLength / 2) + 0.02;
      if (levelNumber === 1) {
        this.level1Motion = { dir: 'rear_only', travelA: 0, travelB: travelRear };
      } else {
        this.level2Motion = { dir: 'rear_only', travelA: 0, travelB: travelRear };
      }
    } else if (dir === 'front_only') {
      // Gaveta única para Frente
      const dims = this.calculateTrayDimensions(panels, orient);
      // PARTE RIGOROSAMENTE DO CENTRO: zCenter
      this.buildTrayLevel(
        targetGroupA,
        dims,
        0,
        yLower,
        zCenter,
        levelNumber,
        `Nível ${levelNumber} (Gaveta Dianteira Única)`
      );
      this.addTelescopicRails(
        this.fixedFrameGroup,
        (levelNumber === 1 ? this.intermediateRailsGroup1 : this.intermediateRailsGroup3),
        targetGroupA,
        dims.trayWidth,
        dims.trayLength,
        0,
        yLower,
        zCenter,
        +1 // frente
      );
      const travelFront = (l2Length / 2) + (dims.trayLength / 2) + 0.02;
      if (levelNumber === 1) {
        this.level1Motion = { dir: 'front_only', travelA: travelFront, travelB: 0 };
      } else {
        this.level2Motion = { dir: 'front_only', travelA: travelFront, travelB: 0 };
      }
    }
  }

  /**
   * Constrói uma bandeja individual com quadro de perfil de alumínio,
   * travessas de reforço contra vento e os painéis solares flexíveis
   * fixados mecanicamente através de seus ilhoses metálicos.
   */
  buildTrayLevel(targetGroup, trayDims, xCenter, yLevel, zCenter, levelIndex, labelText) {
    const mats = MaterialLibrary.materials;
    const tray = new THREE.Group();
    tray.name = labelText;

    const isAluminum = (this.structureMaterial === 'aluminum');
    const frameMat = isAluminum
      ? (this.aluminumColor === 'black' ? mats.aluminumProfileBlack : mats.aluminumProfileSilver)
      : mats.weldedSteelMetalon;

    const tW = trayDims.trayWidth;
    const tL = trayDims.trayLength;
    const profileH = 0.030; // Perfil compacto de bandeja 30x30 / T-slot
    // As travessas frontal e traseira ficam perfeitamente ENTRE as longarinas laterais
    const innerTrayW = Math.max(0.10, tW - (profileH * 2));

    // Quadro Perimetral da Bandeja
    let sideL, sideR, frontBar, rearBar;
    if (isAluminum) {
      sideL = AluminumExtrusionFactory.createProfileMesh(tL, frameMat, { axis: 'z', size: 0.030 });
      sideR = AluminumExtrusionFactory.createProfileMesh(tL, frameMat, { axis: 'z', size: 0.030 });
      frontBar = AluminumExtrusionFactory.createProfileMesh(innerTrayW, frameMat, { axis: 'x', size: 0.030 });
      rearBar = AluminumExtrusionFactory.createProfileMesh(innerTrayW, frameMat, { axis: 'x', size: 0.030 });
    } else {
      const longGeo = new THREE.BoxGeometry(0.03, 0.03, tL);
      const crossGeo = new THREE.BoxGeometry(innerTrayW, 0.03, 0.03);
      sideL = new THREE.Mesh(longGeo, frameMat);
      sideR = new THREE.Mesh(longGeo, frameMat);
      frontBar = new THREE.Mesh(crossGeo, frameMat);
      rearBar = new THREE.Mesh(crossGeo, frameMat);
    }

    sideL.position.set(xCenter - tW / 2 + profileH / 2, yLevel, zCenter);
    sideR.position.set(xCenter + tW / 2 - profileH / 2, yLevel, zCenter);
    frontBar.position.set(xCenter, yLevel, zCenter + tL / 2 - profileH / 2);
    rearBar.position.set(xCenter, yLevel, zCenter - tL / 2 + profileH / 2);

    sideL.userData = { isBar: true, barLength: tL, barLabel: `Longarina da Bandeja (${labelText})`, profileSpec: isAluminum ? 'Perfil T-Slot 30x30' : 'Metalon 30x30' };
    sideR.userData = { isBar: true, barLength: tL, barLabel: `Longarina da Bandeja (${labelText})`, profileSpec: isAluminum ? 'Perfil T-Slot 30x30' : 'Metalon 30x30' };
    frontBar.userData = { isBar: true, barLength: innerTrayW, barLabel: `Travessa Frontal da Bandeja (${labelText})`, profileSpec: isAluminum ? 'Perfil T-Slot 30x30' : 'Metalon 30x30' };
    rearBar.userData = { isBar: true, barLength: innerTrayW, barLabel: `Travessa Traseira da Bandeja (${labelText})`, profileSpec: isAluminum ? 'Perfil T-Slot 30x30' : 'Metalon 30x30' };

    tray.add(sideL);
    tray.add(sideR);
    tray.add(frontBar);
    tray.add(rearBar);

    // Instala os Painéis Solares Flexíveis de 100W na bandeja
    const pW = trayDims.panelW;
    const pL = trayDims.panelL;
    const cols = trayDims.cols;
    const rows = trayDims.rows;

    const gapCol = (cols > 1) ? 0.030 : 0.0;
    const gapRow = (rows > 1) ? 0.030 : 0.0;
    const stepX = pW + gapCol;
    const stepZ = pL + gapRow;

    const startX = xCenter - ((cols - 1) * stepX) / 2;
    const startZ = zCenter - ((rows - 1) * stepZ) / 2;

    // --- BARRAS ESTRUTURAIS DE ALUMÍNIO NO MEIO ENTRE OS PAINÉIS ---
    // 1. Barra(s) Longitudinais centrais (entre colunas adjacentes de painéis)
    const midLongBarPositions = [];
    if (cols > 1) {
      const divLength = tL - (profileH * 2); // Encosta exatamente nas faces internas de frontBar e rearBar
      for (let c = 0; c < cols - 1; c++) {
        const xDiv = startX + c * stepX + (pW / 2) + (gapCol / 2);
        midLongBarPositions.push(xDiv);
        let midLongBar;
        if (isAluminum) {
          midLongBar = AluminumExtrusionFactory.createProfileMesh(divLength, frameMat, { axis: 'z', size: 0.030 });
        } else {
          const midLongGeo = new THREE.BoxGeometry(0.03, 0.03, divLength);
          midLongBar = new THREE.Mesh(midLongGeo, frameMat);
        }
        midLongBar.position.set(xDiv, yLevel, zCenter);
        midLongBar.castShadow = true;
        midLongBar.userData = { isBar: true, barLength: divLength, barLabel: 'Longarina Central da Bandeja', profileSpec: isAluminum ? 'Perfil T-Slot 30x30' : 'Metalon 30x30' };
        tray.add(midLongBar);
      }
    }

    // 2. Barra(s) Transversais centrais (entre linhas adjacentes de painéis)
    // Se houver longarina central (cols > 1), a travessa é segmentada entre as longarinas para NÃO cruzar por dentro
    if (rows > 1) {
      for (let r = 0; r < rows - 1; r++) {
        const zDiv = startZ + r * stepZ + (pL / 2) + (gapRow / 2);

        if (cols === 1) {
          const divWidth = tW - (profileH * 2);
          let midCrossBar;
          if (isAluminum) {
            midCrossBar = AluminumExtrusionFactory.createProfileMesh(divWidth, frameMat, { axis: 'x', size: 0.030 });
          } else {
            const midCrossGeo = new THREE.BoxGeometry(divWidth, 0.03, 0.03);
            midCrossBar = new THREE.Mesh(midCrossGeo, frameMat);
          }
          midCrossBar.position.set(xCenter, yLevel, zDiv);
          midCrossBar.castShadow = true;
          midCrossBar.userData = { isBar: true, barLength: divWidth, barLabel: 'Travessa Divisória da Bandeja', profileSpec: isAluminum ? 'Perfil T-Slot 30x30' : 'Metalon 30x30' };
          tray.add(midCrossBar);
        } else {
          // Múltiplas colunas: divide em segmentos perfeitamente ajustados entre longarinas
          const xBounds = [
            xCenter - tW / 2 + profileH, // Face interna de sideL
            ...midLongBarPositions,
            xCenter + tW / 2 - profileH  // Face interna de sideR
          ];

          for (let b = 0; b < xBounds.length - 1; b++) {
            const xLeft = (b === 0) ? xBounds[b] : (xBounds[b] + profileH / 2);
            const xRight = (b === xBounds.length - 2) ? xBounds[b + 1] : (xBounds[b + 1] - profileH / 2);
            const segW = xRight - xLeft;
            if (segW <= 0.01) continue;

            const segCenterX = (xLeft + xRight) / 2;
            let segMesh;
            if (isAluminum) {
              segMesh = AluminumExtrusionFactory.createProfileMesh(segW, frameMat, { axis: 'x', size: 0.030 });
            } else {
              const segGeo = new THREE.BoxGeometry(segW, 0.03, 0.03);
              segMesh = new THREE.Mesh(segGeo, frameMat);
            }
            segMesh.position.set(segCenterX, yLevel, zDiv);
            segMesh.castShadow = true;
            segMesh.userData = { isBar: true, barLength: segW, barLabel: 'Travessa Divisória da Bandeja', profileSpec: isAluminum ? 'Perfil T-Slot 30x30' : 'Metalon 30x30' };
            tray.add(segMesh);
          }
        }
      }
    }

    const maxPanels = (trayDims.panelCount !== undefined) ? trayDims.panelCount : (cols * rows);
    let countPlaced = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (countPlaced >= maxPanels) break;

        const posX = startX + c * stepX;
        const posZ = startZ + r * stepZ;

        const panelMesh = this.createFlexiblePanelMesh(
          pW,
          pL,
          this.PANEL_SPECS.thickness,
          `PainelFlexivel_${levelIndex}_${r}_${c}`
        );

        // Assenta a placa diretamente sobre o topo dos perfis da bandeja
        panelMesh.position.set(posX, yLevel + 0.015 + (this.PANEL_SPECS.thickness / 2), posZ);
        tray.add(panelMesh);
        countPlaced++;
      }
    }

    targetGroup.add(tray);
  }

  /**
   * Constrói o Painel Solar Flexível de 100W (60cm x 1.00m) RENDERIZANDO OS OBJETOS FÍSICOS EM 3D:
   * (NÃO UTILIZA TEXTURA DE IMAGEM — CADA ELEMENTO É UM OBJETO 3D REAL)
   * 1. Substrato laminado branco polimérico com bordas de vedação;
   * 2. Matriz de 32 células solares monocristalinas individuais (wafers de silício com cantos chanfrados em 3D);
   * 3. Fitas condutoras de prata em 3D (2 busbars por célula percorrendo cada coluna);
   * 4. Lâmina protetora superior de ETFE transparente de alto brilho;
   * 5. Ilhoses metálicos vazados (anéis de aço inox 3D) prensados nos cantos e laterais;
   * 6. Presilhas de alumínio e parafusos Allen com arruelas travando os ilhoses nas canaletas;
   * 7. Caixa de junção frontal, cabos solares em curva 3D e conectores industriais MC4.
   */
  createFlexiblePanelMesh(width, length, thickness, labelText) {
    const mats = MaterialLibrary.materials;
    const panelGroup = new THREE.Group();
    panelGroup.name = labelText || "FlexibleSolarPanel100W";

    // 1. Substrato Laminado Polimérico Branco (Base física do painel)
    const baseGeo = new THREE.BoxGeometry(width, thickness, length);
    const baseMesh = new THREE.Mesh(baseGeo, mats.flexiblePanelSubstrate);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    baseMesh.userData = { isBar: true, barLength: length, barWidth: width, barLabel: 'Painel Solar Flexível 100W', profileSpec: `${Math.round(width * 100)} x ${Math.round(length * 100)} cm • 100Wp Monocristalino • 1.6kg` };
    panelGroup.add(baseMesh);

    // 2. Dimensões e Posicionamento da Matriz de Células de Silício em 3D
    const cols = 4;
    const rows = 8;
    const totalCells = cols * rows; // 32 células monocristalinas

    const marginX = 0.026;
    const marginTop = 0.048; // Margem superior maior para a junction box
    const marginBottom = 0.026;
    const cellGap = 0.0035;  // 3.5 mm de espaço entre células onde o substrato branco aparece

    const activeW = width - (marginX * 2);
    const activeH = length - marginTop - marginBottom;

    const cellW = (activeW - (cellGap * (cols - 1))) / cols;
    const cellH = (activeH - (cellGap * (rows - 1))) / rows;

    // Geometria 3D de cada célula monocristalina com cantos chanfrados (corte de wafer)
    const chamfer = Math.min(cellW, cellH) * 0.12;
    const cellShape = new THREE.Shape();
    const hw = cellW / 2;
    const hh = cellH / 2;

    cellShape.moveTo(-hw + chamfer, hh);
    cellShape.lineTo(hw - chamfer, hh);
    cellShape.lineTo(hw, hh - chamfer);
    cellShape.lineTo(hw, -hh + chamfer);
    cellShape.lineTo(hw - chamfer, -hh);
    cellShape.lineTo(-hw + chamfer, -hh);
    cellShape.lineTo(-hw, -hh + chamfer);
    cellShape.lineTo(-hw, hh - chamfer);
    cellShape.closePath();

    const waferGeo = new THREE.ShapeGeometry(cellShape);
    waferGeo.rotateX(-Math.PI / 2);

    // InstancedMesh de alto desempenho para as 32 células de silício fotovoltaico
    const waferInstanced = new THREE.InstancedMesh(waferGeo, mats.monocrystallineWafer, totalCells);
    waferInstanced.receiveShadow = true;

    // 3. Fitas Condutoras de Circuito Traseiro (Circuitos montados em baixo da placa)
    const busbarsPerCell = 2;
    const totalBusbars = totalCells * busbarsPerCell;
    const busbarGeo = new THREE.BoxGeometry(0.0022, 0.0004, cellH);
    const busbarInstanced = new THREE.InstancedMesh(busbarGeo, mats.silverBusbar, totalBusbars);
    busbarInstanced.castShadow = false;

    const dummy = new THREE.Object3D();
    const dummyBB = new THREE.Object3D();

    const startX = -width / 2 + marginX + cellW / 2;
    const startZ = length / 2 - marginTop - cellH / 2;

    let cellIndex = 0;
    let bbIndex = 0;
    const waferY = thickness / 2 + 0.0004;
    // Circuitos e barramentos montados em baixo (face inferior)
    const circuitY = -thickness / 2 - 0.0004;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = startX + c * (cellW + cellGap);
        const cz = startZ - r * (cellH + cellGap);

        // Células de silício fotovoltaico no topo voltadas para o sol
        dummy.position.set(cx, waferY, cz);
        dummy.updateMatrix();
        waferInstanced.setMatrixAt(cellIndex, dummy.matrix);

        // Circuitos e fitas condutoras posicionados na face inferior (em baixo)
        const bbOffset = cellW * 0.24;
        dummyBB.position.set(cx - bbOffset, circuitY, cz);
        dummyBB.updateMatrix();
        busbarInstanced.setMatrixAt(bbIndex++, dummyBB.matrix);

        dummyBB.position.set(cx + bbOffset, circuitY, cz);
        dummyBB.updateMatrix();
        busbarInstanced.setMatrixAt(bbIndex++, dummyBB.matrix);

        cellIndex++;
      }
    }

    waferInstanced.instanceMatrix.needsUpdate = true;
    busbarInstanced.instanceMatrix.needsUpdate = true;
    panelGroup.add(waferInstanced);
    panelGroup.add(busbarInstanced);

    // 4. Fitas de interconexão de circuito em baixo (Jumpers inferiores)
    const jumperGeo = new THREE.BoxGeometry(cellW * 0.52, 0.0004, 0.0024);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = startX + c * (cellW + cellGap);
        const czTop = startZ - r * (cellH + cellGap) + cellH / 2;
        const jumper = new THREE.Mesh(jumperGeo, mats.silverBusbar);
        jumper.position.set(cx, circuitY, czTop);
        panelGroup.add(jumper);
      }
    }

    // 5. Lâmina Protetora Superior ETFE Translúcida (Encapsulante brilhante em 3D no topo)
    const etfeGeo = new THREE.BoxGeometry(activeW + 0.006, 0.0006, activeH + 0.006);
    const etfeMesh = new THREE.Mesh(etfeGeo, mats.etfeEncapsulant);
    const etfeZ = (startZ + (startZ - (rows - 1) * (cellH + cellGap))) / 2;
    etfeMesh.position.set(0, waferY + 0.0006, etfeZ);
    panelGroup.add(etfeMesh);

    // 6. Ilhoses Metálicos Vazados 3D (Anéis com furo central e abas)
    const eyeletPositions = [
      // 4 Cantos
      [-width / 2 + 0.022, length / 2 - 0.022],
      [width / 2 - 0.022, length / 2 - 0.022],
      [-width / 2 + 0.022, -length / 2 + 0.022],
      [width / 2 - 0.022, -length / 2 + 0.022],
      // Bordas Laterais Centrais
      [-width / 2 + 0.022, 0],
      [width / 2 - 0.022, 0]
    ];

    // Ilhós modelado como toroide metálico com furo central vazado
    const grommetGeo = new THREE.TorusGeometry(0.0065, 0.0022, 8, 18);
    grommetGeo.rotateX(Math.PI / 2);

    const grommetHoleGeo = new THREE.CylinderGeometry(0.0042, 0.0042, thickness + 0.002, 14);
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x111827 });

    const boltGeo = new THREE.CylinderGeometry(0.0035, 0.0035, 0.008, 12);
    const bracketGeo = new THREE.BoxGeometry(0.022, 0.004, 0.026);

    eyeletPositions.forEach(([gx, gz]) => {
      // Furo escuro através do laminado
      const holeMesh = new THREE.Mesh(grommetHoleGeo, holeMat);
      holeMesh.position.set(gx, 0, gz);
      panelGroup.add(holeMesh);

      // Anel metálico do ilhós prensado no topo
      const grommetTop = new THREE.Mesh(grommetGeo, mats.grommetMetal);
      grommetTop.position.set(gx, thickness / 2 + 0.0012, gz);
      panelGroup.add(grommetTop);

      // Anel metálico do ilhós prensado na parte inferior
      const grommetBottom = new THREE.Mesh(grommetGeo, mats.grommetMetal);
      grommetBottom.position.set(gx, -thickness / 2 - 0.0012, gz);
      panelGroup.add(grommetBottom);

      // Fixação Mecânica Direta nos Ilhoses
      const bracket = new THREE.Mesh(bracketGeo, mats.eyeletBracket);
      bracket.position.set(gx, thickness / 2 + 0.0038, gz);
      panelGroup.add(bracket);

      const bolt = new THREE.Mesh(boltGeo, mats.eyeletBolt);
      bolt.position.set(gx, thickness / 2 + 0.0075, gz);
      panelGroup.add(bolt);
    });

    // 7. Caixa de Junção e Circuitos Elétricos EM BAIXO DA PLACA (Face Inferior)
    const jBoxW = 0.082;
    const jBoxH = 0.016;
    const jBoxL = 0.054;
    const jBoxGeo = new THREE.BoxGeometry(jBoxW, jBoxH, jBoxL);
    const jBox = new THREE.Mesh(jBoxGeo, mats.junctionBox);
    const jBoxZ = length / 2 - 0.038;
    // Posiciona na parte de BAIXO (face inferior protegida)
    jBox.position.set(0, -thickness / 2 - jBoxH / 2 - 0.0005, jBoxZ);
    jBox.castShadow = true;
    panelGroup.add(jBox);

    // Detalhe da tampa da Junction Box (voltada para baixo)
    const jBoxLidGeo = new THREE.BoxGeometry(jBoxW - 0.004, 0.002, jBoxL - 0.004);
    const jBoxLid = new THREE.Mesh(jBoxLidGeo, mats.junctionBox);
    jBoxLid.position.set(0, -thickness / 2 - jBoxH - 0.001, jBoxZ);
    panelGroup.add(jBoxLid);

    // 8. Cabos Solares Fotovoltaicos 3D EM BAIXO (Passando por baixo na calha da bandeja)
    const cableR = 0.0024;
    const underY = -thickness / 2 - 0.014;

    const curveRed = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.022, -thickness / 2 - 0.008, jBoxZ),
      new THREE.Vector3(-0.055, underY, jBoxZ - 0.025),
      new THREE.Vector3(-0.085, underY - 0.004, jBoxZ - 0.050),
      new THREE.Vector3(-0.105, underY, jBoxZ - 0.025)
    ]);
    const geoCableRed = new THREE.TubeGeometry(curveRed, 16, cableR, 8, false);
    const meshCableRed = new THREE.Mesh(geoCableRed, mats.cableRed);
    panelGroup.add(meshCableRed);

    const curveBlack = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.022, -thickness / 2 - 0.008, jBoxZ),
      new THREE.Vector3(0.055, underY, jBoxZ - 0.025),
      new THREE.Vector3(0.085, underY - 0.004, jBoxZ - 0.050),
      new THREE.Vector3(0.105, underY, jBoxZ - 0.025)
    ]);
    const geoCableBlack = new THREE.TubeGeometry(curveBlack, 16, cableR, 8, false);
    const meshCableBlack = new THREE.Mesh(geoCableBlack, mats.cableBlack);
    panelGroup.add(meshCableBlack);

    // Conectores Industriais MC4 nas pontas dos cabos em baixo da estrutura
    const mc4Geo = new THREE.CylinderGeometry(0.0062, 0.0062, 0.038, 12);
    mc4Geo.rotateX(Math.PI / 2);

    const mc4Pos = new THREE.Mesh(mc4Geo, mats.mc4Connector);
    mc4Pos.position.set(-0.105, underY, jBoxZ - 0.025);
    panelGroup.add(mc4Pos);

    const mc4Neg = new THREE.Mesh(mc4Geo, mats.mc4Connector);
    mc4Neg.position.set(0.105, underY, jBoxZ - 0.025);
    panelGroup.add(mc4Neg);

    return panelGroup;
  }

  // --- COMPONENTES AUXILIARES E ESTRUTURAIS ---

  addSpacerPosts(targetGroup, l2Width, l2Length, yFrom, yTo, zCenter, slideDir = 'longitudinal') {
    const mats = MaterialLibrary.materials;
    const isAluminum = (this.structureMaterial === 'aluminum');
    const postMat = isAluminum
      ? (this.aluminumColor === 'black' ? mats.aluminumProfileBlack : mats.aluminumProfileSilver)
      : mats.weldedSteelMetalon;
    const postSize = 0.030; // 30 mm T-Slot

    // Longarinas externas do rack base (largura 1.40m) — onde os pilares assentam:
    const rackOuterX = 1.40 / 2 - 0.04 / 2; // 0.68 m

    // Longarinas laterais da bandeja L2 — onde os braços de topo chegam:
    const trayOuterX = l2Width / 2 - postSize / 2; // ex: 0.64m para 2 placas longitudinais

    // Pilares sempre partem das longarinas do rack base (ancoragem firme):
    const pillarX = rackOuterX; // 0.68m

    // Braço horizontal no topo existe apenas quando bandeja é mais estreita que o rack:
    const needsTopArm = trayOuterX < rackOuterX - 0.005;
    const topArmLen = needsTopArm ? (rackOuterX - trayOuterX) : 0;

    // X onde a longarina superior contínua fica (na bandeja L2, não no rack):
    const topRailX = needsTopArm ? trayOuterX : rackOuterX;

    // Altura útil do pilar vertical:
    // O pilar sobe da longarina do rack (yFrom) até onde a longarina superior se apoia (yTo)
    const yTopPillar = yTo - postSize / 2;
    const postH = Math.max(0.04, yTopPillar - yFrom);
    const yCenterPillar = yFrom + postH / 2;

    // Coordenadas longitudinais dos pilares (desvio de 8cm para livre saída das gavetas):
    const zPillarFront = zCenter + (l2Length / 2 + 0.08);
    const zPillarRear  = zCenter - (l2Length / 2 + 0.08);

    // 1. Pilares Verticais nos 4 cantos — assentados nas longarinas do rack base
    const pillarsConfig = [
      { xSign: -1, z: zPillarFront, label: 'Dianteira Esquerda' },
      { xSign:  1, z: zPillarFront, label: 'Dianteira Direita'  },
      { xSign: -1, z: zPillarRear,  label: 'Traseira Esquerda'  },
      { xSign:  1, z: zPillarRear,  label: 'Traseira Direita'   }
    ];

    pillarsConfig.forEach(cfg => {
      const xP = cfg.xSign * pillarX;

      // Pilar vertical
      let post;
      if (isAluminum) {
        post = AluminumExtrusionFactory.createProfileMesh(postH, postMat, { axis: 'y', size: postSize, showCutFace: true });
      } else {
        const postGeo = new THREE.BoxGeometry(postSize, postH, postSize);
        post = new THREE.Mesh(postGeo, postMat);
      }
      post.position.set(xP, yCenterPillar, cfg.z);
      post.castShadow = true;
      post.userData = {
        isBar: true,
        barLength: postH,
        barLabel: `Pilar de Sustentação (${cfg.label})`,
        profileSpec: isAluminum ? 'Perfil T-Slot 30x30' : 'Metalon 30x30'
      };
      targetGroup.add(post);

      // Cantoneira de fixação na base sobre a longarina do rack
      const baseBracketGeo = new THREE.BoxGeometry(0.036, 0.008, 0.036);
      const baseBracket = new THREE.Mesh(baseBracketGeo, mats.telescopicRail || postMat);
      baseBracket.position.set(xP, yFrom + 0.004, cfg.z);
      targetGroup.add(baseBracket);

      // Braço horizontal NO TOPO do pilar:
      // Vai DO pilar (rackOuterX) PARA DENTRO, até a longarina da bandeja L2 (trayOuterX).
      // Isso conecta o topo do pilar à bandeja, que é mais estreita que a base.
      if (needsTopArm) {
        let armMesh;
        if (isAluminum) {
          armMesh = AluminumExtrusionFactory.createProfileMesh(topArmLen, postMat, { axis: 'x', size: postSize });
        } else {
          const armGeo = new THREE.BoxGeometry(topArmLen, postSize, postSize);
          armMesh = new THREE.Mesh(armGeo, postMat);
        }
        // Centro do braço: entre o pilar (outer) e a bandeja (inner), no topo
        const armCenterX = cfg.xSign * (trayOuterX + topArmLen / 2);
        armMesh.position.set(armCenterX, yTo, cfg.z);
        armMesh.castShadow = true;
        armMesh.userData = {
          isBar: true,
          barLength: topArmLen,
          barLabel: `Braço de Topo (${cfg.label})`,
          profileSpec: isAluminum ? 'Perfil T-Slot 30x30' : 'Metalon 30x30'
        };
        targetGroup.add(armMesh);
      }
    });

    // 2. Longarinas Longitudinais Contínuas no TOPO (Esquerda e Direita)
    // Ficam na posição X da bandeja L2 (topRailX), conectando pilar dianteiro ao traseiro.
    // Se tiver braço de topo, essas longarinas encostam no fim interno do braço.
    const zLongStart = zPillarRear  - postSize / 2;
    const zLongEnd   = zPillarFront + postSize / 2;
    const longLen     = zLongEnd - zLongStart;
    const longCenterZ = (zLongStart + zLongEnd) / 2;

    const longSides = [
      { xSign: -1, label: 'Esquerda' },
      { xSign:  1, label: 'Direita'  }
    ];

    longSides.forEach(side => {
      const xPos = side.xSign * topRailX;
      let longMesh;
      if (isAluminum) {
        longMesh = AluminumExtrusionFactory.createProfileMesh(longLen, postMat, { axis: 'z', size: postSize, showCutFace: true });
      } else {
        const longGeo = new THREE.BoxGeometry(postSize, postSize, longLen);
        longMesh = new THREE.Mesh(longGeo, postMat);
      }
      longMesh.position.set(xPos, yTo, longCenterZ);
      longMesh.castShadow = true;
      longMesh.userData = {
        isBar: true,
        barLength: longLen,
        barLabel: `Longarina Superior (${side.label})`,
        profileSpec: isAluminum ? 'Perfil T-Slot 30x30' : 'Metalon 30x30'
      };
      targetGroup.add(longMesh);
    });

    // 3. Travessas Transversais no TOPO (entre as longarinas superiores)
    // Comprimento = distância entre as longarinas superiores (da bandeja L2)
    const xInnerL  = -topRailX + postSize / 2;
    const xInnerR  =  topRailX - postSize / 2;
    const transLen  = xInnerR - xInnerL;
    const transCenterX = 0;

    const transPositions = [
      { z: zPillarFront, label: 'Dianteira' },
      { z: zPillarRear,  label: 'Traseira'  }
    ];

    transPositions.forEach(tp => {
      if (transLen <= 0.01) return;
      let transMesh;
      if (isAluminum) {
        transMesh = AluminumExtrusionFactory.createProfileMesh(transLen, postMat, { axis: 'x', size: postSize });
      } else {
        const transGeo = new THREE.BoxGeometry(transLen, postSize, postSize);
        transMesh = new THREE.Mesh(transGeo, postMat);
      }
      transMesh.position.set(transCenterX, yTo, tp.z);
      transMesh.castShadow = true;
      transMesh.userData = {
        isBar: true,
        barLength: transLen,
        barLabel: `Travessa Superior (${tp.label})`,
        profileSpec: isAluminum ? 'Perfil T-Slot 30x30' : 'Metalon 30x30'
      };
      targetGroup.add(transMesh);

      [-1, 1].forEach(xSign => {
        const cornerBracketGeo = new THREE.BoxGeometry(0.026, 0.026, 0.026);
        const cornerBracket = new THREE.Mesh(cornerBracketGeo, mats.telescopicRail || postMat);
        cornerBracket.position.set(xSign * (topRailX - postSize / 2 - 0.013), yTo, tp.z);
        targetGroup.add(cornerBracket);
      });
    });

    // 4. Cantoneiras de fixação da bandeja L2 às longarinas superiores
    const zCorners = [
      zCenter + (l2Length / 2 - postSize / 2),
      zCenter - (l2Length / 2 - postSize / 2)
    ];
    zCorners.forEach(zC => {
      [-1, 1].forEach(xSign => {
        const xTrayOuter = xSign * (l2Width / 2);
        const trayBracketGeo = new THREE.BoxGeometry(0.026, 0.026, 0.026);
        const trayBracket = new THREE.Mesh(trayBracketGeo, mats.telescopicRail || postMat);
        trayBracket.position.set(xTrayOuter, yTo, zC);
        targetGroup.add(trayBracket);
      });
    });
  }

  addTelescopicRails(fixedGroup, intermediateGroup, movingGroup, width, length, xCenter, yLevel, zCenter, directionSign) {
    const mats = MaterialLibrary.materials;
    const railH = 0.024;
    const railW = 0.016;
    const isFront = (directionSign > 0);

    // Trilhos encostados perfeitamente na face EXTERNA das longarinas da bandeja (sem penetração)
    const railX_L = (xCenter - width / 2) - (railW / 2);
    const railX_R = (xCenter + width / 2) + (railW / 2);

    // 1. Calha Fixa no Rack Base (Stationary Outer Track)
    // Fixada firmemente na estrutura do rack da van, cobrindo o percurso do leito
    const baseTrackLength = Math.max(1.10, length + 0.20);
    const outerGeo = new THREE.BoxGeometry(railW, railH, baseTrackLength);
    const zBaseTrack = zCenter + (isFront ? (baseTrackLength / 4) : -(baseTrackLength / 4));

    const outerL = new THREE.Mesh(outerGeo, mats.telescopicRail);
    outerL.position.set(railX_L, yLevel, zBaseTrack);
    outerL.castShadow = true;
    outerL.userData = { isBar: true, barLength: baseTrackLength, barLabel: 'Calha Fixa Base da Corrediça', profileSpec: 'Trilho Telescópico Heavy Duty' };
    if (fixedGroup) fixedGroup.add(outerL);

    const outerR = new THREE.Mesh(outerGeo, mats.telescopicRail);
    outerR.position.set(railX_R, yLevel, zBaseTrack);
    outerR.castShadow = true;
    outerR.userData = { isBar: true, barLength: baseTrackLength, barLabel: 'Calha Fixa Base da Corrediça', profileSpec: 'Trilho Telescópico Heavy Duty' };
    if (fixedGroup) fixedGroup.add(outerR);

    // Braquetes de ancoragem vertical da calha fixa nas travessas do rack base
    const baseTopY = this.BASE_Y + this.BASE_PROFILE_H / 2; // 2.08m
    const bracketHeight = Math.max(0.012, yLevel - railH / 2 - baseTopY);
    const bracketGeo = new THREE.BoxGeometry(railW + 0.02, bracketHeight, 0.04);
    const bracketCenterY = baseTopY + bracketHeight / 2;

    const zBrackets = [zCenter, zCenter + (isFront ? 0.45 : -0.45)];
    zBrackets.forEach(zb => {
      const bL = new THREE.Mesh(bracketGeo, mats.telescopicRail);
      bL.position.set(railX_L, bracketCenterY, zb);
      if (fixedGroup) fixedGroup.add(bL);

      const bR = new THREE.Mesh(bracketGeo, mats.telescopicRail);
      bR.position.set(railX_R, bracketCenterY, zb);
      if (fixedGroup) fixedGroup.add(bR);
    });

    // 2. Braço Telescópico Intermediário (Intermediate Extension Beam)
    // Desliza a meio curso (* 0.5) servindo de ponte de sustentação contínua
    const interLength = length * 1.05;
    const interGeo = new THREE.BoxGeometry(railW * 0.82, railH * 0.82, interLength);

    const interL = new THREE.Mesh(interGeo, mats.telescopicInner);
    interL.position.set(railX_L, yLevel, zCenter);
    interL.castShadow = true;
    interL.userData = { isBar: true, barLength: interLength, barLabel: 'Braço Extensor da Corrediça', profileSpec: 'Aço Laminado / Corrediça' };
    if (intermediateGroup) intermediateGroup.add(interL);

    const interR = new THREE.Mesh(interGeo, mats.telescopicInner);
    interR.position.set(railX_R, yLevel, zCenter);
    interR.castShadow = true;
    interR.userData = { isBar: true, barLength: interLength, barLabel: 'Braço Extensor da Corrediça', profileSpec: 'Aço Laminado / Corrediça' };
    if (intermediateGroup) intermediateGroup.add(interR);

    // 3. Trilho Interno Solidário à Bandeja Móvel (Inner Tray Slider)
    // Desliza com a bandeja (* 1.0) preso nas longarinas
    const innerGeo = new THREE.BoxGeometry(railW * 0.65, railH * 0.65, length);

    const innerL = new THREE.Mesh(innerGeo, mats.telescopicRail);
    innerL.position.set(railX_L, yLevel, zCenter);
    innerL.userData = { isBar: true, barLength: length, barLabel: 'Trilho Móvel da Gaveta', profileSpec: 'Corrediça Telescópica' };
    if (movingGroup) movingGroup.add(innerL);

    const innerR = new THREE.Mesh(innerGeo, mats.telescopicRail);
    innerR.position.set(railX_R, yLevel, zCenter);
    innerR.userData = { isBar: true, barLength: length, barLabel: 'Trilho Móvel da Gaveta', profileSpec: 'Corrediça Telescópica' };
    if (movingGroup) movingGroup.add(innerR);

    // Braquetes de fixação na moldura da bandeja
    const trayBracketGeo = new THREE.BoxGeometry(0.012, railH, 0.035);
    const stepZ = length / 3;
    for (let i = -1; i <= 1; i++) {
      const bz = zCenter + i * stepZ;
      const tbL = new THREE.Mesh(trayBracketGeo, mats.telescopicRail);
      tbL.position.set(railX_L + railW / 2 + 0.006, yLevel, bz);
      if (movingGroup) movingGroup.add(tbL);

      const tbR = new THREE.Mesh(trayBracketGeo, mats.telescopicRail);
      tbR.position.set(railX_R - railW / 2 - 0.006, yLevel, bz);
      if (movingGroup) movingGroup.add(tbR);
    }
  }

  addLateralTelescopicRails(fixedGroup, intermediateGroup, movingGroup, width, length, xCenter, yLevel, zCenter, directionSign) {
    const mats = MaterialLibrary.materials;
    const railH = 0.024;
    const railL = 0.016;
    const isRight = (directionSign > 0);

    // Trilhos encostados perfeitamente na face EXTERNA das travessas da bandeja (sem penetração)
    const railZ_F = (zCenter + length / 2) + (railL / 2);
    const railZ_R = (zCenter - length / 2) - (railL / 2);

    // 1. Calhas transversais fixas no rack base
    const baseTrackWidth = Math.max(1.10, width + 0.20);
    const outerGeo = new THREE.BoxGeometry(baseTrackWidth, railH, railL);
    const xBaseTrack = xCenter + (isRight ? (baseTrackWidth / 4) : -(baseTrackWidth / 4));

    const outerF = new THREE.Mesh(outerGeo, mats.telescopicRail);
    outerF.position.set(xBaseTrack, yLevel, railZ_F);
    outerF.userData = { isBar: true, barLength: baseTrackWidth, barLabel: 'Calha Fixa Transversal da Corrediça', profileSpec: 'Trilho Telescópico Lateral' };
    if (fixedGroup) fixedGroup.add(outerF);

    const outerR = new THREE.Mesh(outerGeo, mats.telescopicRail);
    outerR.position.set(xBaseTrack, yLevel, railZ_R);
    outerR.userData = { isBar: true, barLength: baseTrackWidth, barLabel: 'Calha Fixa Transversal da Corrediça', profileSpec: 'Trilho Telescópico Lateral' };
    if (fixedGroup) fixedGroup.add(outerR);

    // Suportes de ancoragem verticais conectando a calha fixa à base do rack
    // Apoiam a calha com precisão sobre as longarinas e travessas sem passar por dentro de nada
    const baseTopY = this.BASE_Y + this.BASE_PROFILE_H / 2; // 2.08m
    const bracketHeight = Math.max(0.012, yLevel - railH / 2 - baseTopY);
    const bracketGeo = new THREE.BoxGeometry(0.035, bracketHeight, railL + 0.010);
    const bracketCenterY = baseTopY + bracketHeight / 2;
    const xAnchorPoints = [xCenter, (isRight ? 0.60 : -0.60)];

    xAnchorPoints.forEach(bx => {
      const bF = new THREE.Mesh(bracketGeo, mats.telescopicRail);
      bF.position.set(bx, bracketCenterY, railZ_F);
      if (fixedGroup) fixedGroup.add(bF);

      const bR = new THREE.Mesh(bracketGeo, mats.telescopicRail);
      bR.position.set(bx, bracketCenterY, railZ_R);
      if (fixedGroup) fixedGroup.add(bR);
    });

    // 2. Braço intermediário telescópico lateral (desloca 0.5 em X)
    const interWidth = width * 1.05;
    const interGeo = new THREE.BoxGeometry(interWidth, railH * 0.82, railL * 0.82);

    const interF = new THREE.Mesh(interGeo, mats.telescopicInner);
    interF.position.set(xCenter, yLevel, railZ_F);
    interF.userData = { isBar: true, barLength: interWidth, barLabel: 'Braço Extensor Lateral da Corrediça', profileSpec: 'Trilho Telescópico Lateral' };
    if (intermediateGroup) intermediateGroup.add(interF);

    const interR = new THREE.Mesh(interGeo, mats.telescopicInner);
    interR.position.set(xCenter, yLevel, railZ_R);
    interR.userData = { isBar: true, barLength: interWidth, barLabel: 'Braço Extensor Lateral da Corrediça', profileSpec: 'Trilho Telescópico Lateral' };
    if (intermediateGroup) intermediateGroup.add(interR);

    // 3. Trilho interno solidário à bandeja lateral (desloca 1.0 em X)
    const innerGeo = new THREE.BoxGeometry(width, railH * 0.65, railL * 0.65);

    const innerF = new THREE.Mesh(innerGeo, mats.telescopicRail);
    innerF.position.set(xCenter, yLevel, railZ_F);
    innerF.userData = { isBar: true, barLength: width, barLabel: 'Trilho Móvel da Gaveta Lateral', profileSpec: 'Trilho Telescópico Lateral' };
    if (movingGroup) movingGroup.add(innerF);

    const innerR = new THREE.Mesh(innerGeo, mats.telescopicRail);
    innerR.position.set(xCenter, yLevel, railZ_R);
    innerR.userData = { isBar: true, barLength: width, barLabel: 'Trilho Móvel da Gaveta Lateral', profileSpec: 'Trilho Telescópico Lateral' };
    if (movingGroup) movingGroup.add(innerR);
  }

  buildCableChains() {
    // Esteira porta-cabos (lagarta) removida conforme solicitado
  }

  updateCableChains(progress) {
    // Esteira porta-cabos (lagarta) desativada
  }

  buildKingboBattery() {
    const mats = MaterialLibrary.materials;
    const batGroup = new THREE.Group();
    batGroup.name = "KingboBattery560Ah";

    const length = 0.52;
    const width = 0.27;
    const height = 0.24;

    const caseGeo = new THREE.BoxGeometry(width, height, length);
    const caseMesh = new THREE.Mesh(caseGeo, mats.kingboCase);
    caseMesh.castShadow = true;
    caseMesh.receiveShadow = true;
    batGroup.add(caseMesh);

    const lidGeo = new THREE.BoxGeometry(width + 0.02, 0.02, length + 0.02);
    const lidMesh = new THREE.Mesh(lidGeo, mats.kingboCase);
    lidMesh.position.set(0, height / 2 + 0.01, 0);
    batGroup.add(lidMesh);

    const screenGeo = new THREE.PlaneGeometry(0.14, 0.08);
    screenGeo.rotateX(-Math.PI / 2);
    const screenMesh = new THREE.Mesh(screenGeo, mats.kingboScreen);
    screenMesh.position.set(0, height / 2 + 0.022, 0);
    batGroup.add(screenMesh);

    const termPosGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.035, 16);
    const termPos = new THREE.Mesh(termPosGeo, mats.kingboTerminalPos);
    termPos.position.set(-width / 2 + 0.06, height / 2 + 0.035, -length / 2 + 0.08);
    batGroup.add(termPos);

    const termNegGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.035, 16);
    const termNeg = new THREE.Mesh(termNegGeo, mats.kingboTerminalNeg);
    termNeg.position.set(width / 2 - 0.06, height / 2 + 0.035, -length / 2 + 0.08);
    batGroup.add(termNeg);

    const batLabel = TextureGenerator.createDimensionSprite(
      "KINGBO LiFePO4 560Ah",
      "12.8V • 7.168 kWh • JK BMS 4.3\"",
      "rgba(10, 24, 18, 0.94)",
      "#10b981"
    );
    batLabel.position.set(0, height / 2 + 0.22, 0);
    batGroup.add(batLabel);

    // Centralizado diretamente abaixo das placas solares, no interior da Doblò (nível da bancada/assoalho interno)
    // X=−0.25 (lado esquerdo), Y=0.75m (interior do veículo), Z=RACK_OFFSET_Z (centro sob as placas)
    batGroup.position.set(-0.25, 0.75, this.RACK_OFFSET_Z);
    this.batteryGroup.add(batGroup);
  }

  /**
   * Controlador de Carga Solar MPPT Kingbo 60A (230Vdc entrada FV)
   * Dimensões reais aproximadas do modelo 60A: 202mm × 215mm × 100mm
   * Posicionado no centro abaixo das placas, ao lado direito da bateria Kingbo 560Ah.
   * RS485 + WiFi para monitoramento; suporte 12V–96V bateria; eficiência 96.5–99%.
   */
  buildKingboMPPT() {
    const mats = MaterialLibrary.materials;
    const mppt = new THREE.Group();
    mppt.name = "KingboMPPT60A";

    // --- Dimensões físicas (metros) ---
    // Modelo 60A: 202 × 215 × 100 mm → escala 1:1 em metros
    const W = 0.202;  // largura (eixo X)
    const H = 0.215;  // altura  (eixo Y)
    const D = 0.100;  // profundidade (eixo Z, encostado à parede)

    // 1. Carcaça principal em ABS/alumínio
    const caseGeo = new THREE.BoxGeometry(W, H, D);
    const caseMesh = new THREE.Mesh(caseGeo, mats.mpptCase);
    caseMesh.castShadow = true;
    caseMesh.receiveShadow = true;
    mppt.add(caseMesh);

    // 2. Dissipador de calor em alumínio anodizado (aletas na parte de trás — eixo Z+)
    const finCount = 7;
    const finW = W * 0.88;
    const finH = H * 0.70;
    const finD = 0.012;
    const finSpacing = (W * 0.80) / (finCount - 1);
    for (let i = 0; i < finCount; i++) {
      const finGeo = new THREE.BoxGeometry(finD, finH, 0.028);
      const fin = new THREE.Mesh(finGeo, mats.mpptHeatsink);
      fin.position.set(
        -finW / 2 + i * finSpacing + (W * 0.10) / 2,
        H * 0.05,
        D / 2 + 0.014
      );
      mppt.add(fin);
    }

    // 3. Display LCD no painel frontal (face Z-)
    const lcdW = W * 0.60;
    const lcdH = H * 0.30;
    const lcdGeo = new THREE.PlaneGeometry(lcdW, lcdH);
    const lcd = new THREE.Mesh(lcdGeo, mats.mpptScreen);
    lcd.position.set(0, H * 0.18, -D / 2 - 0.001);
    lcd.rotation.y = Math.PI; // face frontal
    mppt.add(lcd);

    // 4. Botão de toque LCD (pequeno cilindro azul)
    const btnGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.006, 12);
    const btn = new THREE.Mesh(btnGeo, mats.mpptButton);
    btn.rotation.x = Math.PI / 2;
    btn.position.set(W * 0.30, H * 0.18, -D / 2 - 0.004);
    mppt.add(btn);

    // 5. Bloco de terminais PV entrada (topo, 2 terminais: +/−)
    const termGeo = new THREE.BoxGeometry(0.022, 0.018, 0.022);
    const termPVPos = new THREE.Mesh(termGeo, mats.mpptTerminalPV);
    termPVPos.position.set(-W * 0.18, H / 2 + 0.009, -D * 0.15);
    mppt.add(termPVPos);

    const termPVNeg = new THREE.Mesh(termGeo, mats.mpptTerminalPV);
    termPVNeg.position.set(W * 0.18, H / 2 + 0.009, -D * 0.15);
    mppt.add(termPVNeg);

    // 6. Bloco de terminais bateria (base, 2 terminais: +/−)
    const termBatPos = new THREE.Mesh(termGeo, mats.mpptTerminalBat);
    termBatPos.position.set(-W * 0.18, -H / 2 - 0.009, -D * 0.15);
    mppt.add(termBatPos);

    const termBatNeg = new THREE.Mesh(termGeo, mats.mpptTerminalBat);
    termBatNeg.position.set(W * 0.18, -H / 2 - 0.009, -D * 0.15);
    mppt.add(termBatNeg);

    // 7. Cabo MC4 de entrada FV (vermelho) — sobe em direção ao teto/placas solares
    const pvCablePoints = [
      new THREE.Vector3(-W * 0.18, H / 2 + 0.009, -D * 0.15),
      new THREE.Vector3(-W * 0.18, H / 2 + 0.35,  -D * 0.15),
      new THREE.Vector3(-W * 0.18, H / 2 + 0.75,   0.0)
    ];
    const pvCurve = new THREE.CatmullRomCurve3(pvCablePoints);
    const pvCableGeo = new THREE.TubeGeometry(pvCurve, 10, 0.005, 6, false);
    mppt.add(new THREE.Mesh(pvCableGeo, mats.cableRed));

    // 8. Cabo de saída bateria (preto) — conecta à bateria Kingbo à esquerda
    const batCablePoints = [
      new THREE.Vector3(W * 0.18,  -H / 2 - 0.009, -D * 0.15),
      new THREE.Vector3(W * 0.18,  -H / 2 - 0.08,  -D * 0.15),
      new THREE.Vector3(-0.50,     -H / 2 - 0.08,  -D * 0.15)
    ];
    const batCurve = new THREE.CatmullRomCurve3(batCablePoints);
    const batCableGeo = new THREE.TubeGeometry(batCurve, 10, 0.005, 6, false);
    mppt.add(new THREE.Mesh(batCableGeo, mats.cableBlack));

    // 9. Label flutuante (sprite)
    const mpptLabel = TextureGenerator.createDimensionSprite(
      "KINGBO MPPT 60A",
      "12–96V · 230Vdc PV · RS485+WiFi · η≥96.5%",
      "rgba(14, 30, 24, 0.94)",
      "#10b981"
    );
    mpptLabel.position.set(0, H / 2 + 0.22, 0);
    mppt.add(mpptLabel);

    // --- Posicionamento: no interior da Doblò, diretamente sob as placas solares ---
    // X=+0.25 (ao lado direito da bateria), Y=0.85m (painel interno / bancada), Z=RACK_OFFSET_Z
    // Face frontal (Z−) voltada para a frente da cena (para visão da câmera)
    mppt.position.set(0.25, 0.85, this.RACK_OFFSET_Z);
    mppt.rotation.y = 0; // face do display voltada para frente (Z−)

    this.mpptGroup.add(mppt);
  }

  buildDimensionLines(trayDims) {
    const dims = new THREE.Group();
    const zCenter = this.RACK_OFFSET_Z;

    // Cota 1: Comprimento do Teto da Doblò (220 cm)
    dims.add(this.createDimensionCallout(
      new THREE.Vector3(0.78, this.BASE_Y, zCenter - 1.10),
      new THREE.Vector3(0.78, this.BASE_Y, zCenter + 1.10),
      "220 cm",
      "Comprimento do Teto (Rack Base)",
      new THREE.Vector3(0.98, this.BASE_Y, zCenter)
    ));

    // Cota 2: Dimensão do Painel Flexível 100W
    const pW_cm = Math.round(trayDims.panelW * 100);
    const pL_cm = Math.round(trayDims.panelL * 100);
    dims.add(this.createDimensionCallout(
      new THREE.Vector3(-trayDims.trayWidth / 2, this.UPPER_TRAY_Y + 0.08, zCenter),
      new THREE.Vector3(trayDims.trayWidth / 2, this.UPPER_TRAY_Y + 0.08, zCenter),
      `${pW_cm} x ${pL_cm} cm (100W Flexível)`,
      `${this.panelsPerLevel} placa(s) por nível • 1.6kg cada`,
      new THREE.Vector3(0, this.UPPER_TRAY_Y + 0.16, zCenter)
    ));

    // Cota 3: Empilhamento em Níveis (Stack)
    const baseRackTopY = this.BASE_Y + this.BASE_PROFILE_H / 2; // 2.08m
    dims.add(this.createDimensionCallout(
      new THREE.Vector3(-0.76, baseRackTopY, zCenter),
      new THREE.Vector3(-0.76, this.UPPER_TRAY_Y, zCenter),
      (this.stackLevels === 1 ? "1 Nível (Fixo)" : "2 Níveis (Duplo)"),
      (this.stackLevels === 1 ? "Apenas Nível Superior Fixo" : "1 Topo Fixo + Gavetas Telescópicas"),
      new THREE.Vector3(-1.02, (baseRackTopY + this.UPPER_TRAY_Y) / 2, zCenter)
    ));

    this.dimensionsGroup.add(dims);
  }

  createDimensionCallout(ptA, ptB, title, subtitle, spritePos) {
    const mats = MaterialLibrary.materials;
    const callout = new THREE.Group();

    const lineGeo = new THREE.BufferGeometry().setFromPoints([ptA, ptB]);
    const line = new THREE.Line(lineGeo, mats.dimensionLine);
    callout.add(line);

    const tickLen = 0.04;
    const tick1Geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(ptA.x - tickLen, ptA.y, ptA.z),
      new THREE.Vector3(ptA.x + tickLen, ptA.y, ptA.z)
    ]);
    callout.add(new THREE.Line(tick1Geo, mats.dimensionLineAccent));

    const tick2Geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(ptB.x - tickLen, ptB.y, ptB.z),
      new THREE.Vector3(ptB.x + tickLen, ptB.y, ptB.z)
    ]);
    callout.add(new THREE.Line(tick2Geo, mats.dimensionLineAccent));

    const sprite = TextureGenerator.createDimensionSprite(title, subtitle);
    sprite.position.copy(spritePos);
    callout.add(sprite);

    return callout;
  }

  // --- CINEMÁTICA E EXPANSÃO DAS GAVETAS ---

  /**
   * Atualiza a posição de cada gaveta retrátil e seus braços telescópicos intermediários:
   * As gavetas partem rigorosamente do centro (recolhidas sob o nível superior)
   * e deslizam suavemente até a extensão total, sempre apoiadas por corrediças industriais.
   */
  updateExpansion(progress) {
    this.expansionProgress = Math.max(0.0, Math.min(1.0, progress));

    // 1. Aplica movimento ao NÍVEL 1 (EM BAIXO)
    this.applyLevelMotion(
      this.level1,
      this.level1Motion,
      this.slidingLayerGroup1,
      this.slidingLayerGroup2,
      this.intermediateRailsGroup1,
      this.intermediateRailsGroup2,
      this.expansionProgress
    );

    // 2. Aplica movimento ao NÍVEL 2 (EM CIMA)
    if (this.stackLevels === 2) {
      this.applyLevelMotion(
        this.level2,
        this.level2Motion,
        this.upperLayerGroup,
        this.slidingLayerGroup3,
        this.intermediateRailsGroup3,
        this.intermediateRailsGroup4,
        this.expansionProgress
      );
    } else {
      if (this.upperLayerGroup) this.upperLayerGroup.position.set(0, 0, 0);
      if (this.slidingLayerGroup3) this.slidingLayerGroup3.position.set(0, 0, 0);
      if (this.intermediateRailsGroup3) this.intermediateRailsGroup3.position.set(0, 0, 0);
      if (this.intermediateRailsGroup4) this.intermediateRailsGroup4.position.set(0, 0, 0);
    }

    this.updateCableChains(this.expansionProgress);
  }

  applyLevelMotion(config, motionInfo, groupA, groupB, interA, interB, progress) {
    if (!config || !motionInfo) return;
    const dir = motionInfo.dir;
    const travelA = (motionInfo.travelA || 0) * progress;
    const travelB = (motionInfo.travelB || 0) * progress;

    if (dir === 'longitudinal') {
      if (groupA) { groupA.position.z = travelA; groupA.position.x = 0; }
      if (groupB) { groupB.position.z = -travelB; groupB.position.x = 0; }
      if (interA) { interA.position.z = travelA * 0.5; interA.position.x = 0; }
      if (interB) { interB.position.z = -travelB * 0.5; interB.position.x = 0; }
    } else if (dir === 'lateral') {
      if (groupA) { groupA.position.x = -travelA; groupA.position.z = 0; }
      if (groupB) { groupB.position.x = travelB; groupB.position.z = 0; }
      if (interA) { interA.position.x = -travelA * 0.5; interA.position.z = 0; }
      if (interB) { interB.position.x = travelB * 0.5; interB.position.z = 0; }
    } else if (dir === 'rear_only') {
      if (groupA) groupA.position.set(0, 0, 0);
      if (groupB) { groupB.position.z = -travelB; groupB.position.x = 0; }
      if (interA) interA.position.set(0, 0, 0);
      if (interB) { interB.position.z = -travelB * 0.5; interB.position.x = 0; }
    } else if (dir === 'front_only') {
      if (groupA) { groupA.position.z = travelA; groupA.position.x = 0; }
      if (groupB) groupB.position.set(0, 0, 0);
      if (interA) { interA.position.z = travelA * 0.5; interA.position.x = 0; }
      if (interB) interB.position.set(0, 0, 0);
    } else {
      // 'fixed'
      if (groupA) groupA.position.set(0, 0, 0);
      if (groupB) groupB.position.set(0, 0, 0);
      if (interA) interA.position.set(0, 0, 0);
      if (interB) interB.position.set(0, 0, 0);
    }
  }

  updateExploded(progress) {
    this.explodedProgress = Math.max(0.0, Math.min(1.0, progress));
    const offset = this.explodedProgress * 0.35;

    // Nível 2 (Em Cima / Superior) sobe com maior amplitude
    if (this.upperLayerGroup) this.upperLayerGroup.position.y = offset * 2.0;
    if (this.slidingLayerGroup3) this.slidingLayerGroup3.position.y = offset * 2.0;
    if (this.intermediateRailsGroup3) this.intermediateRailsGroup3.position.y = offset * 2.0;
    if (this.intermediateRailsGroup4) this.intermediateRailsGroup4.position.y = offset * 2.0;

    // Gaveta Superior do Nível 1 (1B - Grupo A) sobe intermediário
    if (this.slidingLayerGroup1) this.slidingLayerGroup1.position.y = offset * 1.0;
    if (this.intermediateRailsGroup1) this.intermediateRailsGroup1.position.y = offset * 1.0;

    // Gaveta Inferior do Nível 1 (1A - Grupo B) sobe suavemente
    if (this.slidingLayerGroup2) this.slidingLayerGroup2.position.y = offset * 0.35;
    if (this.intermediateRailsGroup2) this.intermediateRailsGroup2.position.y = offset * 0.35;
  }

  // --- CÁLCULO ELÉTRICO E PESOS EM TEMPO REAL ---

  getEnergyStats() {
    const l1Count = this.level1 ? this.level1.panels : 2;
    const l2Count = (this.stackLevels === 2 && this.level2) ? this.level2.panels : 0;
    const totalPanels = l1Count + l2Count;

    // No modo rodovia (fechado): O nível que fica em cima (Nível 2 se duplo, ou Nível 1 se simples) capta sol
    const powerClosed = ((this.stackLevels === 2) ? l2Count : l1Count) * this.PANEL_SPECS.powerWatts;
    const powerOpen = totalPanels * this.PANEL_SPECS.powerWatts;

    const currentWatts = Math.round(powerClosed + (powerOpen - powerClosed) * this.expansionProgress);
    const dailyKWh = ((currentWatts * 5.2) / 1000).toFixed(2);
    const currentAmps12V = (currentWatts / 13.6).toFixed(1);

    // Parâmetros elétricos do arranjo
    const isSeriesPair = (totalPanels >= 2);
    const vocTotal = (isSeriesPair ? this.PANEL_SPECS.voc * 2 : this.PANEL_SPECS.voc).toFixed(2);
    const vmpTotal = (isSeriesPair ? this.PANEL_SPECS.vmp * 2 : this.PANEL_SPECS.vmp).toFixed(1);
    const iscTotal = (isSeriesPair ? this.PANEL_SPECS.isc * Math.max(1, Math.round(totalPanels / 2)) : this.PANEL_SPECS.isc * totalPanels).toFixed(1);

    // Peso discriminado com base na especificação de 1.6kg por painel flexível
    const weightPanels = (totalPanels * this.PANEL_SPECS.weightKg).toFixed(1);
    const baseRackWeight = (this.structureMaterial === 'steel') ? 26.0 : 11.5;
    const trayWeightPerLevel = (this.structureMaterial === 'steel') ? 5.2 : 2.3;
    const slidesWeight = ((this.stackLevels - 1) * 3.4);
    const weightStructure = (baseRackWeight + (trayWeightPerLevel * this.stackLevels)).toFixed(1);
    const weightTotal = (parseFloat(weightPanels) + parseFloat(weightStructure) + slidesWeight).toFixed(1);

    return {
      watts: currentWatts,
      powerClosed: powerClosed,
      powerOpen: powerOpen,
      dailyKWh: dailyKWh,
      currentAmps12V: currentAmps12V,
      voc: vocTotal,
      vmp: vmpTotal,
      isc: iscTotal,
      totalPanels: totalPanels,
      stackLevels: this.stackLevels,
      panelsPerLevel: l1Count,
      level1Panels: l1Count,
      level2Panels: l2Count,
      slideDirection: this.level1 ? this.level1.slideDirection : 'longitudinal',
      panelOrientation: this.level1 ? this.level1.orientation : 'longitudinal',
      structureMaterial: this.structureMaterial,
      weightPanels: weightPanels,
      weightStructure: weightStructure,
      weightTotal: weightTotal,
      percent: Math.round(this.expansionProgress * 100)
    };
  }
}
