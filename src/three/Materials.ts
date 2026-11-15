import { initSolarMaterials } from './materials/SolarMaterials';
import { initVehicleMaterials } from './materials/VehicleMaterials';
import { initCargoBoxMaterials } from './materials/CargoBoxMaterials';

/**
 * Biblioteca de Materiais PBR (Physically Based Rendering)
 * Para o sistema solar, Fiat Doblò, trilhos, corrediças e esteira porta-cabos
 */
export const MaterialLibrary = {
  materials: {} as Record<string, any>,
  initialized: false,

  init: function () {
    if (this.initialized) return;

    initSolarMaterials(this.materials);
    initVehicleMaterials(this.materials);
    initCargoBoxMaterials(this.materials);

    this.initialized = true;
  },

  get: function (name: string): any {
    if (!this.initialized) this.init();
    return this.materials[name];
  }
};
