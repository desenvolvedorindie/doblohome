import * as THREE from 'three';
import {
  buildMetalonTubeShape,
  createMetalonTubeMesh,
  getCachedTubeGeometry,
  getCachedTubeShape
} from './metalon/MetalonRectGeometry';
import {
  buildPvcCapMesh,
  buildPvcElbowMesh,
  getCachedPvcPipeGeometry
} from './metalon/PvcPipeFittingsGeometry';

/**
 * Fábrica de Tubos Estruturais (Metalon de Ferro / Aço Carbono e Alumínio Tubular)
 * Modelação paramétrica de tubos ocos de secção retangular ou quadrada com espessura de parede configurável.
 */
export class MetalonTubeFactory {
  static geoCache = new Map<string, THREE.BufferGeometry>();
  static shapeCache = new Map<string, THREE.Shape>();

  /**
   * Limpa o cache de geometrias e shapes (útil quando espessuras ou configurações mudam)
   */
  static clearCache(): void {
    this.geoCache.forEach(geo => geo.dispose());
    this.geoCache.clear();
    this.shapeCache.clear();
  }

  /**
   * Constrói o Shape 2D de um perfil tubular oco (metalon) com espessura de parede e furo central
   */
  static buildTubeShape(
    width: number,
    height: number,
    thickness: number,
    radius: number = 0.0025
  ): THREE.Shape {
    return buildMetalonTubeShape(width, height, thickness, radius);
  }

  /**
   * Retorna o Shape 2D em cache para as dimensões e espessura solicitadas
   */
  static getTubeShape(
    width = 0.040,
    height = 0.040,
    thickness = 0.0020,
    radius = 0.0025
  ): THREE.Shape {
    return getCachedTubeShape(this.shapeCache, width, height, thickness, radius);
  }

  /**
   * Retorna ou gera a geometria 3D extrudada do tubo oco (metalon) com cache
   */
  static getTubeGeometry(
    length: number,
    width = 0.040,
    height = 0.040,
    thickness = 0.0020,
    axis: 'x' | 'y' | 'z' = 'z',
    radius = 0.0025
  ): THREE.BufferGeometry {
    return getCachedTubeGeometry(this.geoCache, this.shapeCache, length, width, height, thickness, axis, radius);
  }

  /**
   * Cria uma barra completa em perfil tubular oco (Metalon).
   * Adiciona hitbox invisível BoxGeometry para garantir raycasting e hover 100% responsivos.
   */
  static createTubeMesh(
    length: number,
    material: THREE.Material,
    options: {
      axis?: 'x' | 'y' | 'z';
      size?: number;
      width?: number;
      height?: number;
      thickness?: number;
      radius?: number;
      showCutFace?: boolean;
      cutFaceMaterial?: THREE.Material;
    } = {}
  ): THREE.Mesh {
    return createMetalonTubeMesh(this.geoCache, this.shapeCache, length, material, options);
  }

  /**
   * Constrói e retorna a geometria tubular oca para tubos de PVC (com furo central e espessura de parede real)
   */
  static getPvcPipeGeometry(
    length: number,
    diameter: number = 0.200,
    wallThickness: number = 0.0042,
    axis: 'x' | 'y' | 'z' = 'z',
    segments: number = 36
  ): THREE.BufferGeometry {
    return getCachedPvcPipeGeometry(this.geoCache, length, diameter, wallThickness, axis, segments);
  }

  /**
   * Constrói e retorna um Mesh 3D do Joelho 90° em PVC com bolsas reforçadas nas extremidades
   */
  static createPvcElbowMesh(
    diameter: number = 0.200,
    material: THREE.Material
  ): THREE.Group {
    return buildPvcElbowMesh(diameter, material);
  }

  /**
   * Constrói e retorna um Mesh 3D do CAP (Tampão de Vedação) em PVC
   */
  static createPvcCapMesh(
    diameter: number = 0.200,
    material: THREE.Material
  ): THREE.Group {
    return buildPvcCapMesh(diameter, material);
  }
}
