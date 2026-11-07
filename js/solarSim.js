/**
 * Simulador Solar, Iluminação e Autonomia Energética
 * Controla a trajetória do sol, sombras dinâmicas e cálculo de consumo off-grid
 * Bateria: Kingbo Power MB12560 LiFePO4 12.8V 560Ah (7.168 kWh)
 */

class SolarSimulation {
  constructor(scene) {
    this.scene = scene;
    this.sunHour = 12.0; // 12:00 (Sol a pino)

    // Constantes da Bateria Kingbo LiFePO4 12V 560Ah
    this.BAT_CAPACITY_AH  = 560;      // Ah
    this.BAT_VOLTAGE      = 12.8;     // Tensão nominal LiFePO4
    this.BAT_CAPACITY_WH  = 7168;     // Wh (7.168 kWh)
    this.BAT_DOD          = 0.80;     // Profundidade de descarga máxima recomendada (80%)
    this.BAT_USABLE_WH    = 7168 * 0.80; // 5734.4 Wh utilizáveis

    this.SOLAR_PEAK_HOURS = 5.5; // Horas de pico solar médias (Brasil Centro-Sul)

    // Carrega ou inicializa a lista dinâmica de equipamentos e consumo
    this.loadAppliances();

    this.initLights();
  }

  /**
   * Lista recomendada inicial de equipamentos típicos de um motorhome
   */
  getDefaultAppliances() {
    return [
      { id: 'app_1', name: 'Geladeira 12V (compressor ciclo 40%)', watts: 45, hours: 9.5, qty: 1, enabled: true },
      { id: 'app_2', name: 'Iluminação LED (fita + spots)',       watts: 15, hours: 5.0, qty: 1, enabled: true },
      { id: 'app_3', name: 'Bomba d\'água Seaflo 12V',           watts: 60, hours: 0.75, qty: 1, enabled: true },
      { id: 'app_4', name: 'Smartphones e Tablets',              watts: 20, hours: 3.5, qty: 1, enabled: true },
      { id: 'app_5', name: 'Notebook (Trabalho Remoto)',         watts: 60, hours: 5.0, qty: 1, enabled: true },
      { id: 'app_6', name: 'Starlink Mini / Roteador 4G',         watts: 25, hours: 6.0, qty: 1, enabled: true },
      { id: 'app_7', name: 'Ventilador / Climatizador 12V',       watts: 20, hours: 8.0, qty: 1, enabled: true }
    ];
  }

  /**
   * Carrega os equipamentos salvos no localStorage (ou restaura os padrões)
   */
  loadAppliances() {
    try {
      const raw = localStorage.getItem('doblo_solar_loads');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.APPLIANCES = parsed.map((item, idx) => ({
            id: item.id || `app_${Date.now()}_${idx}`,
            name: String(item.name || 'Equipamento'),
            watts: Math.max(0, parseFloat(item.watts) || 0),
            hours: Math.max(0, Math.min(24, parseFloat(item.hours) || 0)),
            qty: Math.max(1, parseInt(item.qty) || 1),
            enabled: item.enabled !== false,
            whPerDay: Math.round((parseFloat(item.watts) || 0) * (parseFloat(item.hours) || 0) * (parseInt(item.qty) || 1))
          }));
          this.recalculateConsumption();
          return;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar lista de consumo do localStorage:', e);
    }
    this.APPLIANCES = this.getDefaultAppliances();
    this.recalculateConsumption();
  }

  /**
   * Salva a lista de equipamentos atual no localStorage
   */
  saveAppliances() {
    try {
      localStorage.setItem('doblo_solar_loads', JSON.stringify(this.APPLIANCES));
    } catch (e) {
      console.warn('Erro ao salvar lista de consumo no localStorage:', e);
    }
  }

  /**
   * Recalcula a potência e Wh diários totais com base nos itens habilitados
   */
  recalculateConsumption() {
    let total = 0;
    this.APPLIANCES.forEach(item => {
      item.whPerDay = Math.round(item.watts * item.hours * (item.qty || 1));
      if (item.enabled !== false) {
        total += item.whPerDay;
      }
    });
    // Garante no mínimo 1 Wh para evitar divisões por zero
    this.DAILY_CONSUMPTION_WH = Math.max(1, total);
  }

  /**
   * Adiciona um novo equipamento à lista
   */
  addAppliance(name, watts, hours, qty = 1) {
    const item = {
      id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: (name && name.trim()) ? name.trim() : 'Novo Equipamento',
      watts: Math.max(0, parseFloat(watts) || 0),
      hours: Math.max(0, Math.min(24, parseFloat(hours) || 0)),
      qty: Math.max(1, parseInt(qty) || 1),
      enabled: true,
      whPerDay: 0
    };
    item.whPerDay = Math.round(item.watts * item.hours * item.qty);
    this.APPLIANCES.push(item);
    this.recalculateConsumption();
    this.saveAppliances();
    return item;
  }

  /**
   * Atualiza propriedades de um equipamento existente
   */
  updateAppliance(id, updates) {
    const item = this.APPLIANCES.find(a => a.id === id);
    if (!item) return false;
    if (updates.name !== undefined) item.name = String(updates.name).trim();
    if (updates.watts !== undefined) item.watts = Math.max(0, parseFloat(updates.watts) || 0);
    if (updates.hours !== undefined) item.hours = Math.max(0, Math.min(24, parseFloat(updates.hours) || 0));
    if (updates.qty !== undefined) item.qty = Math.max(1, parseInt(updates.qty) || 1);
    if (updates.enabled !== undefined) item.enabled = Boolean(updates.enabled);
    this.recalculateConsumption();
    this.saveAppliances();
    return true;
  }

  /**
   * Remove um equipamento da lista
   */
  removeAppliance(id) {
    const idx = this.APPLIANCES.findIndex(a => a.id === id);
    if (idx >= 0) {
      this.APPLIANCES.splice(idx, 1);
      this.recalculateConsumption();
      this.saveAppliances();
      return true;
    }
    return false;
  }

  /**
   * Restaura os itens padrão de fábrica
   */
  resetDefaultAppliances() {
    this.APPLIANCES = this.getDefaultAppliances();
    this.recalculateConsumption();
    this.saveAppliances();
  }

  /**
   * Retorna resumo de cargas (total de W, Wh/dia e Ah/dia @ 12.8V)
   */
  getLoadsSummary() {
    const active = this.APPLIANCES.filter(a => a.enabled !== false);
    const totalWatts = active.reduce((s, a) => s + (a.watts * (a.qty || 1)), 0);
    const totalWh = this.DAILY_CONSUMPTION_WH;
    const totalAh = +(totalWh / this.BAT_VOLTAGE).toFixed(1);
    return {
      count: this.APPLIANCES.length,
      activeCount: active.length,
      totalWatts,
      totalWh,
      totalAh,
      totalKWh: +(totalWh / 1000).toFixed(2)
    };
  }

  initLights() {
    // 1. Luz ambiente difusa (céu + solo)
    this.hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 0.7);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    // 2. Luz Solar Direta com sombras
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width  = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near   = 0.5;
    this.sunLight.shadow.camera.far    = 25;
    const d = 3.5;
    this.sunLight.shadow.camera.left   = -d;
    this.sunLight.shadow.camera.right  =  d;
    this.sunLight.shadow.camera.top    =  d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias          = -0.0008;
    this.scene.add(this.sunLight);

    // 3. Esfera visual do sol
    const sunGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    this.sunVisual = new THREE.Mesh(sunGeo, sunMat);
    this.scene.add(this.sunVisual);

    this.updateSunPosition(12.0);
  }

  /**
   * Atualiza a posição do sol (6h → 18h)
   */
  updateSunPosition(hour) {
    this.sunHour = hour;
    const angle    = ((hour - 6) / 12) * Math.PI;
    const distance = 12;
    const y = Math.sin(angle) * distance;
    const x = -Math.cos(angle) * distance;
    const z = 3.0; // Inclinação hemisférica sul

    this.sunLight.position.set(x, Math.max(0.5, y), z);
    this.sunVisual.position.copy(this.sunLight.position);

    if (hour < 8 || hour > 16) {
      this.sunLight.color.setHex(0xfba260);
      this.sunLight.intensity = 0.9;
    } else {
      this.sunLight.color.setHex(0xfffaed);
      this.sunLight.intensity = 1.4;
    }
  }

  /**
   * Calcula a performance da bateria Kingbo LiFePO4 12V 560Ah
   * @param {number} currentWatts   Potência solar gerada (W)
   * @param {number} dailyKWh       Energia solar diária gerada (kWh)
   * @returns {object}              Métricas completas de bateria e autonomia
   */
  calculateBatteryPerformance(currentWatts, dailyKWh) {
    const dailyWhGenerated = (dailyKWh || 0) * 1000;
    const watts            = currentWatts || 0;

    // Corrente solar injetada na bateria (12V)
    const solarAmps12V     = watts > 0 ? (watts / this.BAT_VOLTAGE) : 0;

    // Ah injetados por dia (considerando horas de pico)
    const dailyAhInjected  = Math.round(solarAmps12V * this.SOLAR_PEAK_HOURS);

    // Balanço energético
    const surplusWh        = dailyWhGenerated - this.DAILY_CONSUMPTION_WH;
    const isAutonomous     = surplusWh >= 0;
    const autonomyPercent  = Math.min(200, Math.round((dailyWhGenerated / this.DAILY_CONSUMPTION_WH) * 100));

    // Tempo para carregar a bateria do 20% para 100% (usando energia solar excedente OU toda geração)
    // Se não autônomo: toda geração vai para bateria; se autônomo: apenas o excedente vai
    const whAvailableForBat = isAutonomous ? surplusWh : dailyWhGenerated;
    const whNeededFull      = this.BAT_USABLE_WH; // 5734 Wh (80% DoD)

    // Horas de sol para carregar do 0% ao 100% (kWp do painel em modo atual)
    const kWp               = watts > 0 ? watts / 1000 : 0.001;
    const solarHoursToFull  = kWp > 0
      ? +(whNeededFull / (kWp * 1000)).toFixed(1)
      : 999;
    const solarDaysToFull   = kWp > 0
      ? Math.ceil(whNeededFull / (kWp * 1000 * this.SOLAR_PEAK_HOURS))
      : 999;

    // Autonomia com bateria cheia + consumo diário (sem sol)
    const daysRainAutonomy  = +(this.BAT_USABLE_WH / this.DAILY_CONSUMPTION_WH).toFixed(1);

    return {
      dailyWhGenerated:   Math.round(dailyWhGenerated),
      dailyConsumptionWh: this.DAILY_CONSUMPTION_WH,
      surplusWh:          Math.round(surplusWh),
      isAutonomous,
      percent:            autonomyPercent,
      solarAmps12V:       +solarAmps12V.toFixed(1),
      dailyAhInjected,
      solarHoursToFull,
      solarDaysToFull,
      daysRainAutonomy,
      batCapacityWh:      this.BAT_CAPACITY_WH,
      batUsableWh:        Math.round(this.BAT_USABLE_WH),
      appliances:         this.APPLIANCES,
      loadsSummary:       this.getLoadsSummary(),
    };
  }

  /**
   * Calcula autonomia geral (alias de compatibilidade — só recebe kWh)
   */
  calculateAutonomy(dailyKWh) {
    return this.calculateBatteryPerformance(0, dailyKWh);
  }
}
