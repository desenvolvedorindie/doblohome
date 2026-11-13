import * as THREE from 'three';
import { MaterialLibrary } from './Materials';
import { TextureGenerator } from './Textures';
import { AluminumExtrusionFactory } from './AluminumExtrusion';
import { CargoBoxConfig, StructureMaterial, AluminumColor, SteelProfileUnit, getSteelProfileSpec } from '../types';

export interface GasStrutRuntime {
  lowerAnchor: THREE.Vector3;
  upperLocalAnchor: THREE.Vector3;
  cylinderMesh: THREE.Mesh;
  rodMesh: THREE.Mesh;
  group: THREE.Group;
}

/**
 * Módulo 3D do Baú de Teto Motobul Off Road e Mecanismo Basculante
 * Integra o baú aerodinâmico comercial, subchassi base 40x40, dobradiças industriais inox,
 * travas de pressão (toggle clamps) e amortecedores / pistões a gás dinâmicos.
 */
export class CargoBoxSystem {
  group: THREE.Group;
  subchassisGroup: THREE.Group;
  boxGroup: THREE.Group;
  boxLidGroup: THREE.Group;
  tiltingPivotGroup: THREE.Group;
  tiltingMountGroup: THREE.Group;
  gasStrutsGroup: THREE.Group;

  config: CargoBoxConfig;
  baseY: number;
  rackOffsetZ: number;
  structureMaterial: StructureMaterial;
  steelProfileUnit: SteelProfileUnit;
  aluminumColor: AluminumColor;

  // Dimensões do subchassi base
  readonly SUBCHASSIS_WIDTH = 1.40;
  readonly SUBCHASSIS_LENGTH = 2.20;
  readonly PROFILE_SIZE = 0.04;

  private struts: GasStrutRuntime[] = [];
  private emblemTexture: THREE.CanvasTexture | null = null;

  constructor(
    config: CargoBoxConfig,
    baseY: number = 2.06,
    rackOffsetZ: number = 0.40,
    structureMaterial: StructureMaterial = 'aluminum',
    aluminumColor: AluminumColor = 'silver',
    steelProfileUnit: SteelProfileUnit = 'mm'
  ) {
    this.config = { ...config };
    this.baseY = baseY;
    this.rackOffsetZ = rackOffsetZ;
    this.structureMaterial = structureMaterial;
    this.aluminumColor = aluminumColor;
    this.steelProfileUnit = steelProfileUnit;

    this.group = new THREE.Group();
    this.group.name = "CargoBoxSystem";

    this.subchassisGroup = new THREE.Group();
    this.subchassisGroup.name = "SubchassisBase";

    this.boxGroup = new THREE.Group();
    this.boxGroup.name = "MotobulBox";

    this.boxLidGroup = new THREE.Group();
    this.boxLidGroup.name = "MotobulLid";

    this.tiltingPivotGroup = new THREE.Group();
    this.tiltingPivotGroup.name = "SolarTiltPivot";

    this.tiltingMountGroup = new THREE.Group();
    this.tiltingMountGroup.name = "SolarSuperstructureMount";

    this.gasStrutsGroup = new THREE.Group();
    this.gasStrutsGroup.name = "GasStruts";

    // Hierarquia
    this.group.add(this.subchassisGroup);
    this.group.add(this.boxGroup);
    this.group.add(this.gasStrutsGroup);
    this.group.add(this.tiltingPivotGroup);
    this.tiltingPivotGroup.add(this.tiltingMountGroup);

    this.build();
  }

  /**
   * Constrói todo o subsistema (Subchassi, Baú Motobul, Dobradiças, Travas e Pistões)
   */
  build() {
    this.clearGroup(this.subchassisGroup);
    this.clearGroup(this.boxGroup);
    this.clearGroup(this.boxLidGroup);
    this.clearGroup(this.gasStrutsGroup);
    this.struts = [];

    if (!this.config.enabled) {
      this.group.visible = false;
      this.tiltingPivotGroup.rotation.z = 0;
      this.tiltingPivotGroup.position.set(0, 0, 0);
      this.tiltingMountGroup.position.set(0, 0, 0);
      return;
    }

    this.group.visible = true;

    // Converte mm para metros e limita a abertura vertical ao curso físico real da barra telescópica (mantendo >= 90mm de engaste interno)
    const boxL = (this.config.length || 1600) / 1000;
    const boxW = (this.config.width || 1000) / 1000;
    const boxH = (this.config.height || 330) / 1000;
    const maxLiftM = Math.max(0.06, boxH - 0.10);
    const liftM = Math.min(maxLiftM, Math.max(0, (this.config.verticalLiftMm || 0) / 1000));

    const pivotElevationY = this.baseY + this.PROFILE_SIZE + boxH + 0.03 + liftM; // Folga de 30mm + abertura vertical regulável
    const pivotX = (this.config.hingeSide === 'driver' ? -1 : 1) * (this.SUBCHASSIS_WIDTH / 2 - this.PROFILE_SIZE / 2);

    // 1. Constrói o Subchassi Base com Torres Verticais de Elevação
    this.buildSubchassis(boxL, boxW, boxH, pivotElevationY, pivotX);

    // 2. Constrói o Baú Motobul Off Road Hiper-Realista
    this.buildMotobulBox(boxL, boxW, boxH);

    // 3. Posiciona o Grupo de Pivô de Basculamento
    this.tiltingPivotGroup.position.set(pivotX, pivotElevationY, 0);
    this.tiltingMountGroup.position.set(-pivotX, -pivotElevationY, 0);

    // 4. Constrói os Pistões a Gás Dinâmicos
    this.buildGasStruts(pivotElevationY, pivotX);

    // 5. Atualiza os ângulos iniciais
    this.setTiltAngle(this.config.tiltAngle || 0);
    this.setLidAngle(this.config.lidAngle || 0);
  }

  /**
   * Constrói o Subchassi Base Inferior (perfis 40x40 fixados ao teto da Doblò)
   * e as colunas de apoio onde se fixam as dobradiças e travas.
   */
  private buildSubchassis(boxL: number, boxW: number, boxH: number, pivotElevationY: number, pivotX: number) {
    const mats = MaterialLibrary.materials;
    const isAlu = (this.structureMaterial === 'aluminum');
    const steelSpec40 = getSteelProfileSpec(40, this.steelProfileUnit);
    const steelSpec30 = getSteelProfileSpec(30, this.steelProfileUnit);
    const frameMat = isAlu
      ? (this.aluminumColor === 'black' ? mats.aluminumProfileBlack : mats.aluminumProfileSilver)
      : mats.weldedSteelMetalon;

    const length = this.SUBCHASSIS_LENGTH;
    const width = this.SUBCHASSIS_WIDTH;
    const pSize = this.PROFILE_SIZE;
    const zCenter = this.rackOffsetZ;
    const yBase = this.baseY;

    // 1. Longarinas do Subchassi (2.20m em Z)
    const longLeft = isAlu
      ? AluminumExtrusionFactory.createProfileMesh(length, frameMat, { axis: 'z', showCutFace: true })
      : new THREE.Mesh(new THREE.BoxGeometry(pSize, pSize, length), frameMat);
    longLeft.position.set(-width / 2 + pSize / 2, yBase, zCenter);
    longLeft.castShadow = true;
    longLeft.userData = { isBar: true, barLength: length, barLabel: 'Longarina do Subchassi Base (Esquerda)', profileSpec: isAlu ? 'Perfil T-Slot 40x40' : steelSpec40 };
    this.subchassisGroup.add(longLeft);

    const longRight = isAlu
      ? AluminumExtrusionFactory.createProfileMesh(length, frameMat, { axis: 'z', showCutFace: true })
      : new THREE.Mesh(new THREE.BoxGeometry(pSize, pSize, length), frameMat);
    longRight.position.set(width / 2 - pSize / 2, yBase, zCenter);
    longRight.castShadow = true;
    longRight.userData = { isBar: true, barLength: length, barLabel: 'Longarina do Subchassi Base (Direita)', profileSpec: isAlu ? 'Perfil T-Slot 40x40' : steelSpec40 };
    this.subchassisGroup.add(longRight);

    // 2. Travessas Transversais de Apoio ao Baú (em X)
    const crossBarLength = width - pSize * 2;
    const zFront = zCenter + length / 2 - pSize / 2;
    const zRear = zCenter - length / 2 + pSize / 2;
    const maxBoxHalf = (length / 2) - pSize * 3;
    const boxSupportHalf = Math.min(maxBoxHalf, Math.max(0.25, boxL / 2 - 0.10));
    const zPositions = [
      zFront,                           // Dianteira extrema
      zRear,                            // Traseira extrema
      zCenter + boxSupportHalf,         // Apoio dianteiro do baú
      zCenter - boxSupportHalf,         // Apoio traseiro do baú
      zCenter                           // Apoio central do baú
    ];

    zPositions.forEach(z => {
      const cross = isAlu
        ? AluminumExtrusionFactory.createProfileMesh(crossBarLength, frameMat, { axis: 'x' })
        : new THREE.Mesh(new THREE.BoxGeometry(crossBarLength, pSize, pSize), frameMat);
      cross.position.set(0, yBase, z);
      cross.castShadow = true;
      cross.userData = { isBar: true, barLength: crossBarLength, barLabel: 'Travessa do Subchassi de Apoio ao Baú', profileSpec: isAlu ? 'Perfil T-Slot 40x40' : steelSpec40 };
      this.subchassisGroup.add(cross);
    });

    // 3. Sapatas de ancoragem nas calhas do teto da Doblò (alinhadas exatamente sob a face inferior das longarinas)
    const riserH = 0.06;
    const riserGeo = new THREE.BoxGeometry(0.05, riserH, 0.08);
    const riserY = yBase - pSize / 2 - riserH / 2;
    const risersPos = [
      [-width / 2 + pSize / 2, riserY, zCenter + 0.85],
      [width / 2 - pSize / 2, riserY, zCenter + 0.85],
      [-width / 2 + pSize / 2, riserY, zCenter - 0.85],
      [width / 2 - pSize / 2, riserY, zCenter - 0.85]
    ];
    risersPos.forEach((p, idx) => {
      const riser = new THREE.Mesh(riserGeo, frameMat);
      riser.position.set(p[0], p[1], p[2]);
      riser.userData = { isBar: true, barLength: 0.08, barLabel: `Sapata do Subchassi Base (#${idx + 1})`, profileSpec: 'Sapata de Ancoragem 50x60x80mm' };
      this.subchassisGroup.add(riser);
    });

    // 4. Torres Verticais Telescópicas Reguláveis (Permitem deslocar para cima/baixo para baús de diversas alturas)
    const towerBottomY = yBase + pSize / 2;
    const towerTopY = pivotElevationY - pSize / 2;
    const isDriverHinge = (this.config.hingeSide === 'driver');
    const hingeX = pivotX;
    const latchX = isDriverHinge ? (width / 2 - pSize / 2) : (-width / 2 + pSize / 2);

    // Divisão em 2 estágios com comprimento físico constante (a barra interna desliza de dentro da camisa externa sem esticar):
    // - Camisa Base Fixa (40x40): altura fixa = boxH (ex: 330mm)
    // - Coluna Telescópica Interna (30x30): comprimento físico fixo = boxH + 20mm (ex: 350mm), mantendo no mínimo 90mm de engaste dentro da camisa 40x40 no curso máximo
    const baseSleeveH = Math.max(0.18, boxH);
    const innerBarLength = baseSleeveH + 0.02;
    const jointY = towerBottomY + baseSleeveH;
    const baseSleeveCenterY = towerBottomY + baseSleeveH / 2;
    const upperSlideCenterY = towerTopY - innerBarLength / 2;

    const telescopicMat = mats.telescopicMid || new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      metalness: 0.80,
      roughness: 0.20,
      emissive: new THREE.Color(0x0284c7),
      emissiveIntensity: 0.22
    });
    const collarMat = mats.telescopicBracket || mats.weldedSteelMetalon;
    const pinHoleMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

    // 4 torres nas quinas principais
    const maxTowerHalf = (length / 2) - pSize;
    const towerHalfZ = Math.min(maxTowerHalf, boxL / 2 + 0.12);
    const towerZCoords = [zCenter + towerHalfZ, zCenter - towerHalfZ];

    const buildTelescopicTower = (xPos: number, zPos: number, roleLabel: string, outwardSign: number) => {
      // 4.1 Camisa Inferior Fixa no Subchassi (40x40)
      const lowerTower = isAlu
        ? AluminumExtrusionFactory.createProfileMesh(baseSleeveH, frameMat, { axis: 'y', size: 0.040 })
        : new THREE.Mesh(new THREE.BoxGeometry(pSize, baseSleeveH, pSize), frameMat);
      lowerTower.position.set(xPos, baseSleeveCenterY, zPos);
      lowerTower.castShadow = true;
      lowerTower.userData = {
        isBar: true,
        isTelescopicRail: true,
        barLength: baseSleeveH,
        barLabel: `Torre Base Fixa (${roleLabel})`,
        profileSpec: isAlu ? 'Perfil T-Slot 40x40' : steelSpec40
      };
      this.subchassisGroup.add(lowerTower);

      // 4.2 Coluna Telescópica Regulável de Altura (30x30 de comprimento fixo que desliza de dentro da camisa 40x40)
      const upperSlide = isAlu
        ? AluminumExtrusionFactory.createProfileMesh(innerBarLength, telescopicMat, { axis: 'y', size: 0.030 })
        : new THREE.Mesh(new THREE.BoxGeometry(0.030, innerBarLength, 0.030), telescopicMat);
      upperSlide.position.set(xPos, upperSlideCenterY, zPos);
      upperSlide.castShadow = true;
      upperSlide.userData = {
        isBar: true,
        isTelescopicRail: true,
        barLength: innerBarLength,
        barLabel: `Coluna Telescópica de Ajuste de Altura (${roleLabel})`,
        profileSpec: isAlu
          ? 'Perfil Telescópico 30x30 (Regulagem Vertical)'
          : (this.steelProfileUnit === 'inch' ? 'Tubo Telescópico 1 ¼" x 1 ¼" (Regulagem Vertical)' : 'Tubo Telescópico 30x30 (Regulagem Vertical)')
      };
      this.subchassisGroup.add(upperSlide);

      // 4.3 Colar de Travamento e Pino de Regulagem Rápida na junção telescópica
      const collar = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.022, 0.046), collarMat);
      collar.position.set(xPos, jointY, zPos);
      this.subchassisGroup.add(collar);

      const lockPin = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.056, 12), mats.toggleClampGrip || collarMat);
      lockPin.rotation.z = Math.PI / 2;
      lockPin.position.set(xPos + outwardSign * 0.006, jointY, zPos);
      this.subchassisGroup.add(lockPin);

      // 4.4 Furos visuais de regulagem de altura a cada 30mm solidários à coluna telescópica (apenas os visíveis acima do colar)
      const holeStep = 0.030;
      const totalHolesOnBar = Math.floor((innerBarLength - 0.06) / holeStep);
      for (let h = 1; h <= totalHolesOnBar; h++) {
        const hy = (towerTopY - innerBarLength) + 0.03 + h * holeStep;
        if (hy <= jointY + 0.014 || hy >= towerTopY - 0.015) continue;
        const holeDot = new THREE.Mesh(new THREE.CylinderGeometry(0.0032, 0.0032, 0.032, 10), pinHoleMat);
        holeDot.rotation.z = Math.PI / 2;
        holeDot.position.set(xPos, hy, zPos);
        this.subchassisGroup.add(holeDot);
      }
    };

    towerZCoords.forEach(tz => {
      // Torres telescópicas no lado da dobradiça
      buildTelescopicTower(hingeX, tz, 'Dobradiça', isDriverHinge ? -1 : 1);

      // Dobradiça industrial em inox montada no topo da torre
      this.buildStainlessHinge(hingeX, pivotElevationY, tz);

      // Torres telescópicas no lado da trava / abertura
      buildTelescopicTower(latchX, tz, 'Trava Rápida', isDriverHinge ? 1 : -1);

      // Coxim de borracha de assentamento no topo da torre de trava
      const restPad = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.015, 16), mats.rubberRestPad);
      restPad.position.set(latchX, pivotElevationY - 0.0075, tz);
      this.subchassisGroup.add(restPad);

      // Fecho Rápido de Compressão (Toggle Clamp)
      this.buildToggleClamp(latchX, pivotElevationY, tz, isDriverHinge ? 1 : -1);
    });
  }

  /**
   * Constrói uma dobradiça industrial reforçada em aço inox 304
   */
  private buildStainlessHinge(x: number, y: number, z: number) {
    const mats = MaterialLibrary.materials;
    const hinge = new THREE.Group();

    // Pino cilíndrico central
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.08, 16), mats.stainlessHinge);
    pin.rotation.x = Math.PI / 2;
    hinge.add(pin);

    // Folha inferior fixa no subchassi
    const leafLower = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.004, 0.07), mats.stainlessHinge);
    leafLower.position.set(-0.015 * Math.sign(x), -0.004, 0);
    hinge.add(leafLower);

    hinge.position.set(x, y, z);
    this.subchassisGroup.add(hinge);
  }

  /**
   * Constrói fecho rápido de compressão (Toggle Clamp) com manopla de vinil vermelho
   */
  private buildToggleClamp(x: number, y: number, z: number, outwardSign: number) {
    const mats = MaterialLibrary.materials;
    const clamp = new THREE.Group();

    // Base fixa de ancoragem
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.04, 0.035), mats.toggleClamp);
    base.position.set(0, -0.02, 0);
    clamp.add(base);

    // Braço de pressão articulado
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.008, 0.02), mats.toggleClamp);
    arm.position.set(outwardSign * 0.015, 0.01, 0);
    clamp.add(arm);

    // Manopla vermelha de trava
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.007, 0.05, 12), mats.toggleClampGrip);
    handle.position.set(outwardSign * 0.025, 0.035, 0);
    handle.rotation.z = outwardSign * 0.4;
    clamp.add(handle);

    clamp.position.set(x + outwardSign * 0.025, y, z);
    this.subchassisGroup.add(clamp);
  }

  /**
   * Constrói o modelo 3D do Baú Motobul Off Road fiel à fotografia enviada:
   * Carcaça aerodinâmica em cinza ardósia / grafite texturizado,
   * tampa nervurada com quadrantes de reforço, fecho central, fivelas laterais
   * e emblema estilizado "MOTOBUL OFF ROAD".
   */
  private buildMotobulBox(L: number, W: number, H: number) {
    const mats = MaterialLibrary.materials;
    const zCenter = this.rackOffsetZ;
    const yBase = this.baseY + this.PROFILE_SIZE / 2; // Assentado exatamente na face superior das travessas do subchassi

    const tubH = H * 0.42; // Cuba inferior
    const lidH = H * 0.58; // Tampa superior

    // --- 1. CUBA INFERIOR (Preto acetinado com borda de vedação) ---
    const tubGroup = new THREE.Group();

    // Casco principal da cuba
    const tubGeo = new THREE.BoxGeometry(W * 0.96, tubH, L * 0.96);
    const tubMesh = new THREE.Mesh(tubGeo, mats.cargoBoxBase);
    tubMesh.position.set(0, tubH / 2, 0);
    tubMesh.castShadow = true;
    tubMesh.receiveShadow = true;
    tubMesh.userData = { isCargoBoxVolume: true, barLabel: 'Baú de Teto (Cuba Inferior)', profileSpec: `${Math.round(L * 1000)}x${Math.round(W * 1000)}x${Math.round(H * 1000)}mm` };
    tubGroup.add(tubMesh);

    // Aba perimetral de vedação (Flange)
    const flangeGeo = new THREE.BoxGeometry(W, 0.018, L);
    const flangeMesh = new THREE.Mesh(flangeGeo, mats.cargoBoxBase);
    flangeMesh.position.set(0, tubH, 0);
    flangeMesh.castShadow = true;
    tubGroup.add(flangeMesh);

    // Abraçadeiras U-Bolt metálicas de fixação nas travessas do subchassi
    const clampZOffsets = [-L * 0.35, L * 0.35];
    clampZOffsets.forEach(cz => {
      const uClampL = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, W * 0.18, 12), mats.stainlessHinge);
      uClampL.rotation.z = Math.PI / 2;
      uClampL.position.set(-W * 0.32, -0.01, cz);
      tubGroup.add(uClampL);

      const uClampR = uClampL.clone();
      uClampR.position.x = W * 0.32;
      tubGroup.add(uClampR);
    });

    tubGroup.position.set(0, yBase, zCenter);
    this.boxGroup.add(tubGroup);

    // --- 2. TAMPA SUPERIOR NERVURADA (MOTOBUL OFF ROAD) ---
    this.boxLidGroup.position.set(
      this.config.hingeSide === 'driver' ? -W * 0.48 : W * 0.48,
      yBase + tubH,
      zCenter
    );

    const lidInner = new THREE.Group();
    // Offset para girar suavemente em torno da lateral articulada
    lidInner.position.set(this.config.hingeSide === 'driver' ? W * 0.48 : -W * 0.48, 0, 0);

    // Casco principal da tampa (Cinza Motobul Off Road)
    const lidShellGeo = new THREE.BoxGeometry(W * 0.98, lidH, L * 0.98);
    const lidShell = new THREE.Mesh(lidShellGeo, mats.cargoBoxShell);
    lidShell.position.set(0, lidH / 2, 0);
    lidShell.castShadow = true;
    lidShell.receiveShadow = true;
    lidShell.userData = { isCargoBoxVolume: true, barLabel: 'Baú de Teto (Tampa Superior)', profileSpec: `${Math.round(L * 1000)}x${Math.round(W * 1000)}x${Math.round(H * 1000)}mm` };
    lidInner.add(lidShell);

    // Aba perimetral larga escalonada / saia inferior da tampa (idêntica à foto)
    const skirtGeo = new THREE.BoxGeometry(W * 1.025, 0.038, L * 1.025);
    const skirtMesh = new THREE.Mesh(skirtGeo, mats.cargoBoxShell);
    skirtMesh.position.set(0, 0.019, 0);
    skirtMesh.castShadow = true;
    skirtMesh.receiveShadow = true;
    lidInner.add(skirtMesh);

    // Chanfro / corte aerodinâmico dianteiro (frente em cunha)
    const noseGeo = new THREE.BoxGeometry(W * 0.96, lidH * 0.72, L * 0.20);
    const noseMesh = new THREE.Mesh(noseGeo, mats.cargoBoxShell);
    noseMesh.position.set(0, lidH * 0.44, L * 0.43);
    noseMesh.rotation.x = -0.22; // Inclinação aerodinâmica para frente
    lidInner.add(noseMesh);

    // Chanfro aerodinâmico traseiro
    const tailMesh = noseMesh.clone();
    tailMesh.position.z = -L * 0.43;
    tailMesh.rotation.x = 0.22;
    lidInner.add(tailMesh);

    // Nervuras estruturais superiores (Quadrantes waffle característicos do Motobul Off Road)
    const ribRows = 5;
    const ribCols = 4;
    const ribPadX = (W * 0.82) / ribCols;
    const ribPadZ = (L * 0.74) / ribRows;

    for (let r = 0; r < ribRows; r++) {
      for (let c = 0; c < ribCols; c++) {
        const rx = -W * 0.41 + ribPadX * (c + 0.5);
        const rz = -L * 0.37 + ribPadZ * (r + 0.5);

        const ribBox = new THREE.Mesh(
          new THREE.BoxGeometry(ribPadX * 0.74, 0.015, ribPadZ * 0.70),
          mats.cargoBoxRib
        );
        ribBox.position.set(rx, lidH + 0.0075, rz);
        ribBox.castShadow = true;
        lidInner.add(ribBox);
      }
    }

    // Gomos verticais da face traseira (idênticos à foto enviada: 6 colunas trapezoidais salientes)
    const rearRibCols = [-W * 0.38, -W * 0.24, -W * 0.09, W * 0.09, W * 0.24, W * 0.38];
    rearRibCols.forEach(rx => {
      const rib = new THREE.Mesh(
        new THREE.BoxGeometry(W * 0.09, lidH * 0.75, 0.024),
        mats.cargoBoxRib
      );
      rib.position.set(rx, lidH * 0.45, -L * 0.495);
      rib.castShadow = true;
      lidInner.add(rib);
    });

    // Gomos verticais laterais (reforço estrutural dos flancos)
    const sideGillsCount = 5;
    const gillSpacing = (L * 0.68) / (sideGillsCount - 1);
    for (let i = 0; i < sideGillsCount; i++) {
      const gz = -L * 0.34 + i * gillSpacing;

      const gillL = new THREE.Mesh(new THREE.BoxGeometry(0.020, lidH * 0.80, 0.065), mats.cargoBoxRib);
      gillL.position.set(-W * 0.492, lidH * 0.46, gz);
      lidInner.add(gillL);

      const gillR = gillL.clone();
      gillR.position.x = W * 0.492;
      lidInner.add(gillR);
    }

    // Fechadura central traseira (idêntica à foto: carcaça com miolo cilíndrico metálico em zinco/inox)
    const lockHousing = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.08, 0.025), mats.cargoBoxLatch);
    lockHousing.position.set(0, lidH * 0.22, -L * 0.498);
    lidInner.add(lockHousing);

    const lockPlate = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.05, 0.012), (mats as any).cargoBoxLock || mats.cargoBoxLatch);
    lockPlate.position.set(0, lidH * 0.20, -L * 0.508);
    lidInner.add(lockPlate);

    const keyHole = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.015, 12), mats.cargoBoxLatch);
    keyHole.rotation.x = Math.PI / 2;
    keyHole.position.set(0, lidH * 0.22, -L * 0.512);
    lidInner.add(keyHole);

    // Travas / fivelas traseiras pretas (duas fivelas flanqueando a fechadura central, como na foto)
    const rearBucklesX = [-W * 0.24, W * 0.24];
    rearBucklesX.forEach(bx => {
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.07, 0.028), mats.cargoBoxLatch);
      bMesh.position.set(bx, lidH * 0.16, -L * 0.502);
      lidInner.add(bMesh);
    });

    // Fecho frontal dianteiro
    const frontLatch = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.025), mats.cargoBoxLatch);
    frontLatch.position.set(0, lidH * 0.15, L * 0.49);
    lidInner.add(frontLatch);

    // Presilhas / fivelas laterais de segurança
    const buckleZOffsets = [-L * 0.26, 0, L * 0.26];
    buckleZOffsets.forEach(bz => {
      const bL = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.05, 0.032), mats.cargoBoxLatch);
      bL.position.set(-W * 0.495, lidH * 0.12, bz);
      lidInner.add(bL);

      const bR = bL.clone();
      bR.position.x = W * 0.495;
      lidInner.add(bR);
    });

    // Emblema "MOTOBUL OFF ROAD"
    if (!this.emblemTexture) {
      this.emblemTexture = TextureGenerator.createMotobulEmblemTexture();
    }
    const emblemMat = new THREE.MeshBasicMaterial({
      map: this.emblemTexture,
      transparent: true,
      side: THREE.DoubleSide
    });

    // Emblema na face traseira (lado esquerdo inferior, idêntico à fotografia da Motobul)
    const emblemRearGeo = new THREE.PlaneGeometry(0.18, 0.09);
    const emblemRear = new THREE.Mesh(emblemRearGeo, emblemMat);
    emblemRear.rotation.y = Math.PI;
    emblemRear.position.set(-W * 0.36, lidH * 0.26, -L * 0.505);
    lidInner.add(emblemRear);

    // Emblemas nas laterais
    const emblemGeo = new THREE.PlaneGeometry(0.24, 0.12);
    const emblemL = new THREE.Mesh(emblemGeo, emblemMat);
    emblemL.rotation.y = -Math.PI / 2;
    emblemL.position.set(-W * 0.498, lidH * 0.45, L * 0.25);
    lidInner.add(emblemL);

    const emblemR = new THREE.Mesh(emblemGeo, emblemMat);
    emblemR.rotation.y = Math.PI / 2;
    emblemR.position.set(W * 0.498, lidH * 0.45, L * 0.25);
    lidInner.add(emblemR);

    this.boxLidGroup.add(lidInner);
    this.boxGroup.add(this.boxLidGroup);
  }

  /**
   * Constrói os Pistões a Gás (amortecedores) dinâmicos
   */
  private buildGasStruts(pivotElevationY: number, pivotX: number) {
    const mats = MaterialLibrary.materials;
    const isDriverHinge = (this.config.hingeSide === 'driver');
    const width = this.SUBCHASSIS_WIDTH;
    const pSize = this.PROFILE_SIZE;
    const zCenter = this.rackOffsetZ;

    // Âncoras inferiores fixas no subchassi
    // Posicionadas a meia distância entre o pivô e o centro, para alavanca ideal de elevação
    const hingeSideSign = isDriverHinge ? -1 : 1;
    const strutLowerX = pivotX + hingeSideSign * 0.05;
    const strutUpperRelX = pivotX - hingeSideSign * 0.38; // 38cm de braço de alavanca a partir do pivô

    const strutZOffsets = [zCenter + 0.65, zCenter - 0.65];

    strutZOffsets.forEach((sz, idx) => {
      const strutGroup = new THREE.Group();
      strutGroup.name = `GasStrut_${idx}`;

      const lowerAnchorY = Math.max(this.baseY + pSize + 0.02, pivotElevationY - 0.34);
      const lowerAnchor = new THREE.Vector3(strutLowerX, lowerAnchorY, sz);
      const upperLocalAnchor = new THREE.Vector3(strutUpperRelX, pivotElevationY, sz);

      // Terminal inferior (olhal esférico)
      const lowerEyelet = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 12), mats.gasStrutMount);
      lowerEyelet.position.copy(lowerAnchor);
      this.subchassisGroup.add(lowerEyelet);

      // Cilindro (corpo do pistão)
      const cylGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.28, 16);
      cylGeo.translate(0, 0.14, 0); // Pivô na base inferior
      const cylMesh = new THREE.Mesh(cylGeo, mats.gasStrutCylinder);
      cylMesh.castShadow = true;
      strutGroup.add(cylMesh);

      // Haste cromada telescópica
      const rodGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.26, 16);
      rodGeo.translate(0, 0.13, 0);
      const rodMesh = new THREE.Mesh(rodGeo, mats.gasStrutRod);
      rodMesh.castShadow = true;
      strutGroup.add(rodMesh);

      this.gasStrutsGroup.add(strutGroup);

      this.struts.push({
        lowerAnchor,
        upperLocalAnchor,
        cylinderMesh: cylMesh,
        rodMesh: rodMesh,
        group: strutGroup
      });
    });
  }

  /**
   * Atualiza dinamicamente os amortecedores a gás acompanhando o basculamento do rack
   */
  private updateGasStruts(tiltRad: number) {
    if (!this.config.enabled || this.struts.length === 0) return;

    const isDriverHinge = (this.config.hingeSide === 'driver');
    const boxH = (this.config.height || 330) / 1000;
    const maxLiftM = Math.max(0.06, boxH - 0.10);
    const liftM = Math.min(maxLiftM, Math.max(0, (this.config.verticalLiftMm || 0) / 1000));
    const pivotElevationY = this.baseY + this.PROFILE_SIZE + boxH + 0.03 + liftM;
    const pivotX = (isDriverHinge ? -1 : 1) * (this.SUBCHASSIS_WIDTH / 2 - this.PROFILE_SIZE / 2);

    this.struts.forEach(st => {
      // Calcula posição mundial atual do ponto de fixação superior (que gira com o rack)
      const relX = st.upperLocalAnchor.x - pivotX;
      const relY = st.upperLocalAnchor.y - pivotElevationY;

      // Rotação 2D em torno de (pivotX, pivotElevationY)
      const rotAngle = isDriverHinge ? tiltRad : -tiltRad;
      const cosA = Math.cos(rotAngle);
      const sinA = Math.sin(rotAngle);

      const rotatedX = pivotX + (relX * cosA - relY * sinA);
      const rotatedY = pivotElevationY + (relX * sinA + relY * cosA);
      const currentUpper = new THREE.Vector3(rotatedX, rotatedY, st.upperLocalAnchor.z);

      // Vetor da base inferior até a ponta superior
      const dir = new THREE.Vector3().subVectors(currentUpper, st.lowerAnchor);
      const dist = dir.length();
      dir.normalize();

      // Posiciona o grupo do pistão na base inferior
      st.group.position.copy(st.lowerAnchor);

      // Orienta o pistão na direção do ponto de fixação superior
      const upAxis = new THREE.Vector3(0, 1, 0);
      const quat = new THREE.Quaternion().setFromUnitVectors(upAxis, dir);
      st.group.quaternion.copy(quat);

      // Ajusta proporcionalmente cilindro e haste telescópica para qualquer abertura vertical
      const cylLen = Math.max(0.28, dist * 0.55);
      st.cylinderMesh.scale.set(1, cylLen / 0.28, 1);
      const rodLen = Math.max(0.04, dist - cylLen);
      st.rodMesh.position.set(0, cylLen, 0);
      st.rodMesh.scale.set(1, rodLen / 0.26, 1);
    });
  }

  /**
   * Define o ângulo de basculamento da estrutura solar (0° a 70°)
   */
  setTiltAngle(angleDeg: number) {
    this.config.tiltAngle = Math.max(0, Math.min(70, angleDeg));
    const rad = THREE.MathUtils.degToRad(this.config.tiltAngle);
    const isDriver = (this.config.hingeSide === 'driver');

    // Se a dobradiça está na esquerda (motorista), abre para a direita girando positivo em Z
    this.tiltingPivotGroup.rotation.z = isDriver ? rad : -rad;

    this.updateGasStruts(rad);
  }

  /**
   * Define o ângulo de abertura da tampa do próprio baú (0° a 45°)
   */
  setLidAngle(angleDeg: number) {
    this.config.lidAngle = Math.max(0, Math.min(45, angleDeg));
    const rad = THREE.MathUtils.degToRad(this.config.lidAngle);
    const isDriver = (this.config.hingeSide === 'driver');

    // Abre a tampa do baú
    this.boxLidGroup.rotation.z = isDriver ? rad : -rad;
  }

  /**
   * Atualiza configurações paramétricas completas do baú e subchassi
   */
  updateConfig(newConfig: Partial<CargoBoxConfig>, baseY?: number, rackOffsetZ?: number) {
    if (baseY !== undefined) this.baseY = baseY;
    if (rackOffsetZ !== undefined) this.rackOffsetZ = rackOffsetZ;
    this.config = { ...this.config, ...newConfig };
    this.build();
  }

  /**
   * Dimensionamento de engenharia dos pistões a gás
   * @param solarRackWeightKg Peso total estimado da superestrutura solar basculante
   */
  calculateEngineeringSpecs(solarRackWeightKg: number) {
    const W_rack = (this.SUBCHASSIS_WIDTH || 1.40);
    const boxH = (this.config.height || 330) / 1000;
    const boxL = (this.config.length || 1600) / 1000;
    const boxW = (this.config.width || 1000) / 1000;

    // Centro de gravidade da superestrutura no meio da largura
    const d_cm = W_rack / 2; // 0.70m
    const totalMass = Math.max(25, solarRackWeightKg);
    const gravity = 9.81;
    const weightForceN = totalMass * gravity;
    const maxTorqueNm = weightForceN * d_cm; // Momento de flexão máximo com rack fechado/horizontal

    // 2 pistões a gás com fixação a 0.38m do pivô
    const d_strut = 0.38;
    // Ângulo inicial do pistão com a horizontal ~25°
    const sinTheta = Math.sin(THREE.MathUtils.degToRad(25));
    // Força necessária por amortecedor
    const rawForce = maxTorqueNm / (2 * d_strut * sinTheta);
    // Margem de segurança de engenharia de 15% para vento e frio
    const designForce = rawForce * 1.15;
    // Arredondamento comercial para múltiplos de 50N
    const commercialForceN = Math.round(designForce / 50) * 50;
    const commercialForceKgf = Math.round(commercialForceN / 9.81);

    // Volume útil estimado do baú (Litros)
    const volumeLiters = Math.round(boxL * boxW * boxH * 1000 * 0.88); // ~88% eficiência de embalagem

    return {
      rackWeightKg: totalMass,
      maxTorqueNm: Math.round(maxTorqueNm),
      strutForceN: Math.max(300, Math.min(800, commercialForceN)),
      strutForceKgf: Math.max(30, Math.min(82, commercialForceKgf)),
      strutStrokeMm: 300,
      strutTotalLengthMm: 620,
      volumeLiters,
      cargoBoxWeightKg: 18,
      subchassisWeightKg: 14.5,
      totalAddedRoofWeightKg: Math.round(18 + 14.5 + totalMass)
    };
  }

  private clearGroup(grp: THREE.Group) {
    if (!grp) return;
    while (grp.children.length > 0) {
      const obj = grp.children[0];
      grp.remove(obj);
      if ((obj as any).geometry) (obj as any).geometry.dispose();
      if ((obj as any).material) {
        if (Array.isArray((obj as any).material)) {
          (obj as any).material.forEach((m: any) => m.dispose());
        } else {
          (obj as any).material.dispose();
        }
      }
    }
  }

  dispose() {
    this.clearGroup(this.subchassisGroup);
    this.clearGroup(this.boxGroup);
    this.clearGroup(this.boxLidGroup);
    this.clearGroup(this.gasStrutsGroup);
    this.clearGroup(this.tiltingPivotGroup);
    this.clearGroup(this.tiltingMountGroup);
    this.clearGroup(this.group);
  }
}

