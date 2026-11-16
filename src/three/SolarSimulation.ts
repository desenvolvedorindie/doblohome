import * as THREE from 'three';
import { ApplianceItem, BatteryPerformance, LoadsSummary } from '../types';
import { dbGet, dbSet } from '../data/db';

/**
 * Simulador Solar, Iluminação e Autonomia Energética
 * Controla a trajetória do sol, sombras dinâmicas e cálculo de consumo off-grid
 * Bateria: Kingbo Power MB12560 LiFePO4 12.8V 560Ah (7.168 kWh)
 */
export class SolarSimulation {
  scene: THREE.Scene;
  sunHour: number = 12.0;

  BAT_CAPACITY_AH = 560;
  BAT_VOLTAGE = 12.8;
  BAT_CAPACITY_WH = 7168;
  BAT_DOD = 0.80;
  BAT_USABLE_WH = 7168 * 0.80; // 5734.4 Wh

  SOLAR_PEAK_HOURS = 5.5;

  setBatterySpecs(capacityAh: number, voltage: number = 12.8, dod: number = 0.8) {
    this.BAT_CAPACITY_AH = Math.max(1, capacityAh);
    this.BAT_VOLTAGE = Math.max(1, voltage);
    this.BAT_CAPACITY_WH = Math.round(this.BAT_CAPACITY_AH * this.BAT_VOLTAGE);
    this.BAT_DOD = dod;
    this.BAT_USABLE_WH = this.BAT_CAPACITY_WH * dod;
  }

  APPLIANCES: ApplianceItem[] = [];
  DAILY_CONSUMPTION_WH: number = 1;

  hemiLight!: THREE.HemisphereLight;
  sunLight!: THREE.DirectionalLight;
  sunVisual!: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.loadAppliances();
    this.initLights();
  }

  getDefaultAppliances(): ApplianceItem[] {
    return [
      { id: 'app_1', name: 'Geladeira 12V (compressor ciclo 40%)', watts: 45, hours: 9.5, qty: 1, enabled: true },
      { id: 'app_2', name: 'Iluminação LED (fita + spots)', watts: 15, hours: 5.0, qty: 1, enabled: true },
      { id: 'app_3', name: 'Bomba d\'água Seaflo 12V', watts: 60, hours: 0.75, qty: 1, enabled: true },
      { id: 'app_4', name: 'Smartphones e Tablets', watts: 20, hours: 3.5, qty: 1, enabled: true },
      { id: 'app_5', name: 'Notebook (Trabalho Remoto)', watts: 60, hours: 5.0, qty: 1, enabled: true },
      { id: 'app_6', name: 'Starlink Mini / Roteador 4G', watts: 25, hours: 6.0, qty: 1, enabled: true },
      { id: 'app_7', name: 'Ventilador / Climatizador 12V', watts: 20, hours: 8.0, qty: 1, enabled: true }
    ];
  }

  loadAppliances() {
    // Carrega assincronamente do IndexedDB
    dbGet<any[]>('doblo_solar_loads').then((parsed) => {
      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        this.APPLIANCES = parsed.map((item: any, idx: number) => ({
          id: item.id || `app_${Date.now()}_${idx}`,
          name: String(item.name || 'Equipamento'),
          watts: Math.max(0, parseFloat(item.watts) || 0),
          hours: Math.max(0, Math.min(24, parseFloat(item.hours) || 0)),
          qty: Math.max(1, parseInt(item.qty) || 1),
          enabled: item.enabled !== false,
          whPerDay: Math.round((parseFloat(item.watts) || 0) * (parseFloat(item.hours) || 0) * (parseInt(item.qty) || 1))
        }));
        this.recalculateConsumption();
      }
    }).catch((e) => {
      console.warn('Erro ao carregar lista de consumo do banco de dados:', e);
    });

    this.APPLIANCES = this.getDefaultAppliances();
    this.recalculateConsumption();
  }

  saveAppliances() {
    dbSet('doblo_solar_loads', this.APPLIANCES);
  }

  recalculateConsumption() {
    let total = 0;
    this.APPLIANCES.forEach(item => {
      item.whPerDay = Math.round(item.watts * item.hours * (item.qty || 1));
      if (item.enabled !== false) {
        total += item.whPerDay;
      }
    });
    this.DAILY_CONSUMPTION_WH = Math.max(1, total);
  }

  addAppliance(name: string, watts: number, hours: number, qty: number = 1): ApplianceItem {
    const item: ApplianceItem = {
      id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: (name && name.trim()) ? name.trim() : 'Novo Equipamento',
      watts: Math.max(0, parseFloat(watts as any) || 0),
      hours: Math.max(0, Math.min(24, parseFloat(hours as any) || 0)),
      qty: Math.max(1, parseInt(qty as any) || 1),
      enabled: true,
      whPerDay: 0
    };
    item.whPerDay = Math.round(item.watts * item.hours * item.qty);
    this.APPLIANCES.push(item);
    this.recalculateConsumption();
    this.saveAppliances();
    return item;
  }

  updateAppliance(id: string, updates: Partial<ApplianceItem>): boolean {
    const item = this.APPLIANCES.find(a => a.id === id);
    if (!item) return false;
    if (updates.name !== undefined) item.name = String(updates.name).trim();
    if (updates.watts !== undefined) item.watts = Math.max(0, parseFloat(updates.watts as any) || 0);
    if (updates.hours !== undefined) item.hours = Math.max(0, Math.min(24, parseFloat(updates.hours as any) || 0));
    if (updates.qty !== undefined) item.qty = Math.max(1, parseInt(updates.qty as any) || 1);
    if (updates.enabled !== undefined) item.enabled = Boolean(updates.enabled);
    this.recalculateConsumption();
    this.saveAppliances();
    return true;
  }

  removeAppliance(id: string): boolean {
    const idx = this.APPLIANCES.findIndex(a => a.id === id);
    if (idx >= 0) {
      this.APPLIANCES.splice(idx, 1);
      this.recalculateConsumption();
      this.saveAppliances();
      return true;
    }
    return false;
  }

  moveAppliance(id: string, direction: 'up' | 'down'): boolean {
    const idx = this.APPLIANCES.findIndex(a => a.id === id);
    if (idx < 0) return false;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= this.APPLIANCES.length) return false;
    const temp = this.APPLIANCES[idx];
    this.APPLIANCES[idx] = this.APPLIANCES[targetIdx];
    this.APPLIANCES[targetIdx] = temp;
    this.saveAppliances();
    return true;
  }

  reorderAppliances(fromIndex: number, toIndex: number): boolean {
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= this.APPLIANCES.length ||
      toIndex >= this.APPLIANCES.length ||
      fromIndex === toIndex
    ) {
      return false;
    }
    const [moved] = this.APPLIANCES.splice(fromIndex, 1);
    this.APPLIANCES.splice(toIndex, 0, moved);
    this.saveAppliances();
    return true;
  }

  resetDefaultAppliances() {
    this.APPLIANCES = this.getDefaultAppliances();
    this.recalculateConsumption();
    this.saveAppliances();
  }

  getLoadsSummary(): LoadsSummary {
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
    this.hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x1e3a8a, 1.25);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    // Luz de preenchimento azulada suave para realçar o mundo 3D
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.60);
    fillLight.position.set(-8, 14, -6);
    this.scene.add(fillLight);

    const ambientLight = new THREE.AmbientLight(0x1e3a5f, 0.45);
    this.scene.add(ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.7);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 25;
    const d = 3.5;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0008;
    this.scene.add(this.sunLight);

    const sunGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    this.sunVisual = new THREE.Mesh(sunGeo, sunMat);
    this.scene.add(this.sunVisual);

    this.updateSunPosition(12.0);
  }

  updateSunPosition(hour: number) {
    this.sunHour = hour;
    const angle = ((hour - 6) / 12) * Math.PI;
    const distance = 12;
    const y = Math.sin(angle) * distance;
    const x = -Math.cos(angle) * distance;
    const z = 3.0;

    this.sunLight.position.set(x, Math.max(0.5, y), z);
    this.sunVisual.position.copy(this.sunLight.position);

    if (hour < 8 || hour > 16) {
      this.sunLight.color.setHex(0xfba260);
      this.sunLight.intensity = 1.1;
    } else {
      this.sunLight.color.setHex(0xfffaed);
      this.sunLight.intensity = 1.7;
    }
  }

  calculateBatteryPerformance(currentWatts: number, dailyKWh: number): BatteryPerformance {
    const dailyWhGenerated = (dailyKWh || 0) * 1000;
    const watts = currentWatts || 0;

    const solarAmps12V = watts > 0 ? (watts / this.BAT_VOLTAGE) : 0;
    const dailyAhInjected = Math.round(solarAmps12V * this.SOLAR_PEAK_HOURS);

    const surplusWh = dailyWhGenerated - this.DAILY_CONSUMPTION_WH;
    const isAutonomous = surplusWh >= 0;
    const autonomyPercent = Math.min(200, Math.round((dailyWhGenerated / this.DAILY_CONSUMPTION_WH) * 100));

    const whNeededFull = this.BAT_USABLE_WH;
    const kWp = watts > 0 ? watts / 1000 : 0.001;
    const solarHoursToFull = kWp > 0
      ? +(whNeededFull / (kWp * 1000)).toFixed(1)
      : 999;
    const solarDaysToFull = kWp > 0
      ? Math.ceil(whNeededFull / (kWp * 1000 * this.SOLAR_PEAK_HOURS))
      : 999;

    const daysRainAutonomy = +(this.BAT_USABLE_WH / this.DAILY_CONSUMPTION_WH).toFixed(1);

    return {
      dailyWhGenerated: Math.round(dailyWhGenerated),
      dailyConsumptionWh: this.DAILY_CONSUMPTION_WH,
      surplusWh: Math.round(surplusWh),
      isAutonomous,
      percent: autonomyPercent,
      solarAmps12V: +solarAmps12V.toFixed(1),
      dailyAhInjected,
      solarHoursToFull,
      solarDaysToFull,
      daysRainAutonomy,
      batCapacityWh: this.BAT_CAPACITY_WH,
      batUsableWh: Math.round(this.BAT_USABLE_WH),
      appliances: this.APPLIANCES,
      loadsSummary: this.getLoadsSummary(),
    };
  }

  calculateAutonomy(dailyKWh: number): BatteryPerformance {
    return this.calculateBatteryPerformance(0, dailyKWh);
  }
}

