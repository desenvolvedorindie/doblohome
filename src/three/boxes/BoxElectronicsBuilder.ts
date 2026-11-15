import * as THREE from 'three';
import { InternalBoxItem } from '../../types';
import { FLOOR_Y, PLYWOOD_THICKNESS, getBoxThickness } from './BoxGeometryHelpers';
import { ELECTRONIC_COMPONENTS_CATALOG } from '../../types/electronics';
import { PowerStorageBuilder } from '../PowerStorage';

export class BoxElectronicsBuilder {
    buildBoxElectronics(
    container: THREE.Group,
    w: number,
    l: number,
    h: number,
    box: InternalBoxItem,
    isSelected: boolean
  ) {
    if (!box.electronics || box.electronics.length === 0) return;

    // Se for gaveta deslizante, anexa ao grupo da gaveta móvel para deslizar junto ao abrir
    const targetParent = (container.getObjectByName('DrawerSlide') as THREE.Group) || container;
    const t = PLYWOOD_THICKNESS; // 15mm

    // Dimensões internas úteis
    const wIn = Math.max(0.10, w - 2 * t);
    const lIn = Math.max(0.10, l - 2 * t);
    const hIn = Math.max(0.10, h - t);

    // Material dos parafusos de fixação (aço zincado brilhante / inox)
    const screwMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.92,
      roughness: 0.18
    });
    const screwHeadGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.003, 10);
    screwHeadGeo.rotateX(Math.PI / 2);

    box.electronics.forEach((item) => {
      const catalogMeta = ELECTRONIC_COMPONENTS_CATALOG[item.id];
      if (!catalogMeta) return;

      let mesh: THREE.Group;
      const compW = catalogMeta.dimensionsMm.width / 1000;
      const compH = catalogMeta.dimensionsMm.height / 1000;
      const compD = catalogMeta.dimensionsMm.depth / 1000;

      // Cria a malha do componente correspondente
      if (item.id === 'battery') {
        mesh = PowerStorageBuilder.createBatteryMesh();
      } else if (item.id === 'mppt') {
        mesh = PowerStorageBuilder.createMPPTMesh({ includeCables: false });
        // MPPT: gira Math.PI para alinhar o verso (aletas) com -Z e frente LCD com +Z
        mesh.rotation.y = Math.PI;
      } else if (item.id === 'b2b') {
        mesh = PowerStorageBuilder.createB2BMesh({ includeCables: false });
      } else if (item.id === 'usina') {
        mesh = PowerStorageBuilder.createUsinaMesh({ includeCables: false });
      } else {
        return;
      }

      // Vincula metadados ao grupo e filhos para seleção e hover
      mesh.userData = {
        ...mesh.userData,
        boxId: box.id,
        boxName: box.name
      };
      mesh.traverse((child: any) => {
        if (child.isMesh) {
          child.userData = {
            ...child.userData,
            boxId: box.id,
            boxName: box.name
          };
        }
      });

      // Wrapper para controle independente de translação, rotação e parafusamento
      const compWrapper = new THREE.Group();
      compWrapper.name = `Installed_${item.id}_${box.id}`;
      compWrapper.add(mesh);

      // Bateria é sempre na base ('bottom')
      const face = item.id === 'battery' ? 'bottom' : (item.mountFace || 'bottom');
      const pos = item.position || 'center';
      const isRotated = Boolean(item.rotationDeg === 90);

      // Micro-deslocamentos customizados pelo usuário em milímetros
      const customOffX = (item.customOffsetXmm || 0) / 1000;
      const customOffY = (item.customOffsetYmm || 0) / 1000;
      const customOffZ = (item.customOffsetZmm || 0) / 1000;

      // ─────────────────────────────────────────────────────────────
      // FIXAÇÃO 1: APOIADO NA BASE / FUNDO (FACE: 'bottom')
      // ─────────────────────────────────────────────────────────────
      if (face === 'bottom') {
        const effW = isRotated ? compD : compW;
        const effL = isRotated ? compW : compD;

        // Fundo do módulo: Y = -h/2 + t (apoiado diretamente sobre a chapa de piso)
        const posY = -h / 2 + t + compH / 2 + customOffY;

        // Espaço disponível para posicionamento no plano XZ
        const spanX = Math.max(0, (wIn - effW) / 2);
        const spanZ = Math.max(0, (lIn - effL) / 2);

        let posX = 0;
        let posZ = 0;

        if (pos.includes('left')) posX = spanX;
        else if (pos.includes('right')) posX = -spanX;

        if (pos.includes('front')) posZ = spanZ;
        else if (pos.includes('rear')) posZ = -spanZ;

        compWrapper.position.set(posX + customOffX, posY, posZ + customOffZ);
        compWrapper.rotation.y = isRotated ? Math.PI / 2 : 0;
      }
      // ─────────────────────────────────────────────────────────────
      // FIXAÇÃO 2: PARAFUSADO NA PAREDE TRASEIRA (FACE: 'rear_wall')
      // ─────────────────────────────────────────────────────────────
      else if (face === 'rear_wall') {
        // Verso encostado na face interna da parede traseira (Z = -l/2 + t)
        const posZ = -l / 2 + t + compD / 2 + customOffZ;

        // X ao longo da parede
        const spanX = Math.max(0, (wIn - compW) / 2);
        let posX = 0;
        if (pos.includes('left')) posX = spanX;
        else if (pos.includes('right')) posX = -spanX;

        // Y na parede
        let posY = -h / 2 + t + compH / 2;
        if (pos.startsWith('top')) posY = h / 2 - t - compH / 2;
        else if (pos.startsWith('mid')) posY = 0;
        else if (pos.startsWith('bottom')) posY = -h / 2 + t + compH / 2;

        compWrapper.position.set(posX + customOffX, posY + customOffY, posZ);
        compWrapper.rotation.y = 0; // Frente voltada para a frente (+Z)

        // 4 Parafusos de fixação nas abas contra a parede de compensado
        this.addWallMountingScrews(compWrapper, compW, compH, -compD / 2, screwHeadGeo, screwMat);
      }
      // ─────────────────────────────────────────────────────────────
      // FIXAÇÃO 3: PARAFUSADO NA PAREDE DIANTEIRA (FACE: 'front_wall')
      // ─────────────────────────────────────────────────────────────
      else if (face === 'front_wall') {
        // Verso encostado na face interna da parede dianteira (Z = +l/2 - t)
        const posZ = l / 2 - t - compD / 2 + customOffZ;

        const spanX = Math.max(0, (wIn - compW) / 2);
        let posX = 0;
        if (pos.includes('left')) posX = spanX;
        else if (pos.includes('right')) posX = -spanX;

        let posY = -h / 2 + t + compH / 2;
        if (pos.startsWith('top')) posY = h / 2 - t - compH / 2;
        else if (pos.startsWith('mid')) posY = 0;
        else if (pos.startsWith('bottom')) posY = -h / 2 + t + compH / 2;

        compWrapper.position.set(posX + customOffX, posY + customOffY, posZ);
        compWrapper.rotation.y = Math.PI; // Frente voltada para trás (-Z)

        this.addWallMountingScrews(compWrapper, compW, compH, -compD / 2, screwHeadGeo, screwMat);
      }
      // ─────────────────────────────────────────────────────────────
      // FIXAÇÃO 4: PARAFUSADO NA PAREDE LATERAL ESQUERDA (FACE: 'left_wall')
      // ─────────────────────────────────────────────────────────────
      else if (face === 'left_wall') {
        // Verso encostado na face interna da parede esquerda (+X = +w/2 - t)
        const posX = w / 2 - t - compD / 2 + customOffX;

        // Z ao longo da lateral
        const spanZ = Math.max(0, (lIn - compW) / 2);
        let posZ = 0;
        if (pos.includes('left')) posZ = -spanZ; // Em direção à traseira
        else if (pos.includes('right')) posZ = spanZ; // Em direção à frente

        let posY = -h / 2 + t + compH / 2;
        if (pos.startsWith('top')) posY = h / 2 - t - compH / 2;
        else if (pos.startsWith('mid')) posY = 0;
        else if (pos.startsWith('bottom')) posY = -h / 2 + t + compH / 2;

        compWrapper.position.set(posX, posY + customOffY, posZ + customOffZ);
        compWrapper.rotation.y = -Math.PI / 2; // Frente voltada para a direita (-X)

        this.addWallMountingScrews(compWrapper, compW, compH, -compD / 2, screwHeadGeo, screwMat);
      }
      // ─────────────────────────────────────────────────────────────
      // FIXAÇÃO 5: PARAFUSADO NA PAREDE LATERAL DIREITA (FACE: 'right_wall')
      // ─────────────────────────────────────────────────────────────
      else if (face === 'right_wall') {
        // Verso encostado na face interna da parede direita (-X = -w/2 + t)
        const posX = -w / 2 + t + compD / 2 + customOffX;

        const spanZ = Math.max(0, (lIn - compW) / 2);
        let posZ = 0;
        if (pos.includes('left')) posZ = spanZ; // Em direção à frente
        else if (pos.includes('right')) posZ = -spanZ; // Em direção à traseira

        let posY = -h / 2 + t + compH / 2;
        if (pos.startsWith('top')) posY = h / 2 - t - compH / 2;
        else if (pos.startsWith('mid')) posY = 0;
        else if (pos.startsWith('bottom')) posY = -h / 2 + t + compH / 2;

        compWrapper.position.set(posX, posY + customOffY, posZ + customOffZ);
        compWrapper.rotation.y = Math.PI / 2; // Frente voltada para a esquerda (+X)

        this.addWallMountingScrews(compWrapper, compW, compH, -compD / 2, screwHeadGeo, screwMat);
      }

      targetParent.add(compWrapper);
    });
  }

  /**
   * Adiciona 4 parafusos de fixação metálicos realistas nos cantos das flanges/abas do componente
   */
  private addWallMountingScrews(
    parent: THREE.Group,
    w: number,
    h: number,
    backZ: number,
    geo: THREE.BufferGeometry,
    mat: THREE.Material
  ) {
    const xOff = w / 2 + 0.008;
    const yOff = h / 2 - 0.015;
    const zPos = backZ + 0.0015;

    [
      [-xOff, yOff],
      [xOff, yOff],
      [-xOff, -yOff],
      [xOff, -yOff]
    ].forEach(([sx, sy]) => {
      const screw = new THREE.Mesh(geo, mat);
      screw.position.set(sx, sy, zPos);
      parent.add(screw);
    });
  }

  /**
   * Constrói o teto / forro do compartimento do campervan (Fiat Doblò)
   * Suporta forro Ripado em madeira nobre/pinus/compensado ou Chapa contínua (MDF ou Compensado)
   * com curvatura transversal acompanhando o arco do teto da Doblò e iluminação LED integrada.
   */
}
