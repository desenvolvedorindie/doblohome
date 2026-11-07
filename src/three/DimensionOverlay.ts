import * as THREE from 'three';
import { MaterialLibrary } from './Materials';
import { TextureGenerator } from './Textures';
import { StackLevels } from '../types';

/**
 * Construtor das Cotas Técnicas Tridimensionais e Sprites de Medição
 */
export class DimensionOverlayBuilder {
  static buildDimensionLines(
    targetGroup: THREE.Group,
    trayDims: any,
    zCenter: number,
    currentBaseY: number,
    baseProfileH: number,
    upperTrayY: number,
    stackLevels: StackLevels,
    panelsPerLevel: number
  ) {
    const dims = new THREE.Group();

    // Cota 1: Comprimento do Teto da Doblò (220 cm)
    dims.add(this.createDimensionCallout(
      new THREE.Vector3(0.78, currentBaseY, zCenter - 1.10),
      new THREE.Vector3(0.78, currentBaseY, zCenter + 1.10),
      "220 cm",
      "Comprimento do Teto (Rack Base)",
      new THREE.Vector3(0.98, currentBaseY, zCenter)
    ));

    // Cota 2: Dimensão do Painel Flexível 100W
    const pW_cm = Math.round(trayDims.panelW * 100);
    const pL_cm = Math.round(trayDims.panelL * 100);
    dims.add(this.createDimensionCallout(
      new THREE.Vector3(-trayDims.trayWidth / 2, upperTrayY + 0.08, zCenter),
      new THREE.Vector3(trayDims.trayWidth / 2, upperTrayY + 0.08, zCenter),
      `${pW_cm} x ${pL_cm} cm (100W Flexível)`,
      `${panelsPerLevel} placa(s) por nível • 1.6kg cada`,
      new THREE.Vector3(0, upperTrayY + 0.16, zCenter)
    ));

    // Cota 3: Empilhamento em Níveis (Stack)
    const baseRackTopY = currentBaseY + baseProfileH / 2;
    dims.add(this.createDimensionCallout(
      new THREE.Vector3(-0.76, baseRackTopY, zCenter),
      new THREE.Vector3(-0.76, upperTrayY, zCenter),
      (stackLevels === 1 ? "1 Nível (Fixo)" : "2 Níveis (Duplo)"),
      (stackLevels === 1 ? "Apenas Nível Superior Fixo" : "1 Topo Fixo + Gavetas Telescópicas"),
      new THREE.Vector3(-1.02, (baseRackTopY + upperTrayY) / 2, zCenter)
    ));

    targetGroup.add(dims);
  }

  static createDimensionCallout(
    ptA: THREE.Vector3,
    ptB: THREE.Vector3,
    title: string,
    subtitle?: string,
    spritePos?: THREE.Vector3
  ): THREE.Group {
    const mats = MaterialLibrary.materials;
    const group = new THREE.Group();

    // 1. Linha principal entre os pontos cotados
    const points = [ptA, ptB];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMesh = new THREE.Line(lineGeo, mats.dimensionLine);
    group.add(lineMesh);

    // 2. Ticks de extremidade (linhas perpendiculares curtas)
    const tickDir = new THREE.Vector3(0, 0.04, 0);
    const tickGeoA = new THREE.BufferGeometry().setFromPoints([
      ptA.clone().sub(tickDir),
      ptA.clone().add(tickDir)
    ]);
    group.add(new THREE.Line(tickGeoA, mats.dimensionLine));

    const tickGeoB = new THREE.BufferGeometry().setFromPoints([
      ptB.clone().sub(tickDir),
      ptB.clone().add(tickDir)
    ]);
    group.add(new THREE.Line(tickGeoB, mats.dimensionLine));

    // 3. Sprite Flutuante com texto e medidas
    const sprite = TextureGenerator.createDimensionSprite(
      title,
      subtitle,
      "rgba(15, 23, 42, 0.92)",
      "#38bdf8"
    );

    const sPos = spritePos || ptA.clone().add(ptB).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.08, 0));
    sprite.position.copy(sPos);
    group.add(sprite);

    return group;
  }
}

