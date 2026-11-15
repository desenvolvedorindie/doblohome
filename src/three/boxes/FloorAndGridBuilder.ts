import * as THREE from 'three';
import { InternalGridConfig, InternalBoxItem, CentralTableConfig } from '../../types';
import { FLOOR_Y, PLYWOOD_THICKNESS } from './BoxGeometryHelpers';

export class FloorAndGridBuilder {
  floorMesh?: THREE.Mesh;
  floorGroup: THREE.Group;
  gridLinesGroup: THREE.Group;

  constructor(floorGroup: THREE.Group, gridLinesGroup: THREE.Group) {
    this.floorGroup = floorGroup;
    this.gridLinesGroup = gridLinesGroup;
  }

    buildFloor(grid: InternalGridConfig, widthM: number, lengthM: number, floorY: number) {
    const centerZ = -lengthM / 2;
    const floorThicknessMm = grid.floorThicknessMm || 15;
    const floorThickness = floorThicknessMm / 1000;

    // Chapa de compensado naval na base do assoalho (serve de fundo para todas as caixas)
    const floorGeo = new THREE.BoxGeometry(widthM, floorThickness, lengthM);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x92613b, // Madeira compensado naval quente e sólida
      roughness: 0.80,
      metalness: 0.04
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(0, floorY - floorThickness / 2, centerZ);
    floorMesh.receiveShadow = true;
    floorMesh.name = 'BaseNavalPlywoodFloor';
    floorMesh.userData = {
      isWoodPart: true,
      dimW: widthM,
      dimH: floorThickness,
      dimL: lengthM,
      thicknessMm: floorThicknessMm,
      partLabel: `Chapa Base do Assoalho Doblò (Compensado Naval ${floorThicknessMm}mm)`,
      isInternalFloorPlywood: true,
      isBasePlywood: true,
      name: `Chapa de Compensado Naval ${floorThicknessMm}mm`,
      category: '🪵 Assoalho Base Campervan',
      barProfile: `${Math.round(widthM * 1000)} × ${Math.round(lengthM * 1000)} × ${floorThicknessMm} mm`,
      capacity: 'Fundo Comum dos Módulos',
      material: `Compensado Naval ${floorThicknessMm}mm Impermeabilizado`,
      woodMaterial: 'Compensado Naval',
      moduleName: 'Assoalho Base',
      partType: 'floor',
      purpose: 'Base estrutural de nivelamento da Doblò que serve como fundo unificado para todos os baús e nichos'
    };
    this.floorMesh = floorMesh;
    this.floorGroup.add(floorMesh);

    // Borda perimetral de acabamento em alumínio
    const edgeGeo = new THREE.EdgesGeometry(floorGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
    const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat);
    edgeLine.position.copy(floorMesh.position);
    this.floorGroup.add(edgeLine);

    // Caixas de roda estilizadas (referência dimensional real da Doblò)
    const wheelArchGeo = new THREE.BoxGeometry(0.18, 0.32, 0.72);
    const wheelArchMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7,
      metalness: 0.2
    });

    // Lado Esquerdo (Motorista — esquerda do observador olhando da traseira)
    const archLeft = new THREE.Mesh(wheelArchGeo, wheelArchMat);
    archLeft.position.set(widthM / 2 + 0.09, floorY + 0.16, -1.15);
    this.floorGroup.add(archLeft);

    // Lado Direito (Passageiro — direita do observador olhando da traseira)
    const archRight = new THREE.Mesh(wheelArchGeo, wheelArchMat);
    archRight.position.set(-(widthM / 2 + 0.09), floorY + 0.16, -1.15);
    this.floorGroup.add(archRight);

    // ─── MESA DINETTE CENTRAL (FIXADA NA CHAPA DE COMPENSADO NAVAL 15mm) ───
    if (grid.centralTable?.enabled) {
      this.buildFloorCentralTable(this.floorGroup, widthM, lengthM, floorY, grid.centralTable);
    }
  }

  buildGrid(grid: InternalGridConfig, widthM: number, lengthM: number, floorY: number) {
    const cols = Math.max(1, grid.colsX);
    const rows = Math.max(1, grid.rowsZ);
    const cellWM = widthM / cols;
    const cellLM = lengthM / rows;

    const lineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.4
    });

    // Linhas transversais (eixo X)
    for (let r = 0; r <= rows; r++) {
      const z = -r * cellLM;
      const pts = [
        new THREE.Vector3(-widthM / 2, floorY + 0.001, z),
        new THREE.Vector3(widthM / 2, floorY + 0.001, z)
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      this.gridLinesGroup.add(new THREE.Line(geo, lineMat));
    }

    // Linhas longitudinais (eixo Z)
    for (let c = 0; c <= cols; c++) {
      const x = widthM / 2 - c * cellWM;
      const pts = [
        new THREE.Vector3(x, floorY + 0.001, 0),
        new THREE.Vector3(x, floorY + 0.001, -lengthM)
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      this.gridLinesGroup.add(new THREE.Line(geo, lineMat));
    }
  }

  /**
   * Constrói as linhas e etiquetas do grid paramétrico no piso
   */
  buildFloorCentralTable(
    floorGroup: THREE.Group,
    widthM: number,
    lengthM: number,
    floorY: number,
    cfg: CentralTableConfig
  ) {
    const tableWM = (cfg.widthMm ?? 450) / 1000;
    const tableLM = (cfg.lengthMm ?? 650) / 1000;
    const heightFromFloorM = (cfg.heightMm ?? 720) / 1000; // padrão 72cm a partir da face superior da chapa de 15mm
    const tableThickness = 0.018; // 18mm de madeira maciça

    const centerZ = -lengthM / 2;
    const offX = (cfg.offsetX ?? 0) / 1000;
    const offZ = (cfg.offsetZ ?? 0) / 1000;
    const rotRad = ((cfg.rotationDeg ?? 0) * Math.PI) / 180;

    const tableGroup = new THREE.Group();
    tableGroup.name = 'FloorCentralTable';
    // Assentada diretamente sobre a face superior do compensado naval de 15mm (floorY = 0.48)
    tableGroup.position.set(offX, floorY, centerZ + offZ);

    // ─── 1. FLANGE NÁUTICA CIRCULAR DE PISO (FIXADA NO COMPENSADO NAVAL 15mm) ───
    const flangeRadius = 0.08; // Ø160mm base de piso
    const flangeH = 0.010; // 10mm de espessura
    const flangeMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Alumínio usinado / inox acetinado
      metalness: 0.90,
      roughness: 0.22
    });
    const floorFlangeGeo = new THREE.CylinderGeometry(flangeRadius, flangeRadius, flangeH, 24);
    const floorFlangeMesh = new THREE.Mesh(floorFlangeGeo, flangeMat);
    floorFlangeMesh.name = 'FloorTableFlange_BasePiso';
    floorFlangeMesh.position.set(0, flangeH / 2, 0);
    floorFlangeMesh.castShadow = true;
    floorFlangeMesh.receiveShadow = true;
    floorFlangeMesh.userData = {
      isHardware: true,
      partLabel: 'Flange Náutica de Piso Ø160mm (Compensado Naval 15mm)',
      name: 'Flange Circular de Piso Náutica',
      category: '🔩 Ferragens de Fixação no Assoalho',
      purpose: 'Flange circular de alumínio usinado com parafusos inox fixados na chapa de compensado naval de 15mm'
    };
    tableGroup.add(floorFlangeMesh);

    // ─── 2. PEDESTAL METÁLICO (COLUNA TUBULAR PRETA) ───
    const tubeRadius = 0.0225; // Ø45mm diâmetro
    const tubeHeight = Math.max(0.20, heightFromFloorM - tableThickness);
    const tubeGeo = new THREE.CylinderGeometry(tubeRadius, tubeRadius, tubeHeight, 24);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x18181b, // preto acetinado automotivo
      metalness: 0.85,
      roughness: 0.30
    });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    tubeMesh.name = 'FloorTablePedestal_Column';
    tubeMesh.position.set(0, tubeHeight / 2, 0);
    tubeMesh.castShadow = true;
    tubeMesh.receiveShadow = true;
    tubeMesh.userData = {
      isHardware: true,
      partLabel: `Pedestal Tubular Central Náutico Ø45mm (${Math.round(tubeHeight * 1000)} mm)`,
      name: 'Coluna Tubular Náutica Removível',
      category: '🔩 Ferragens Marítimas & Camper',
      purpose: 'Coluna central de apoio com encaixe rápido na flange de piso fixada no compensado naval 15mm'
    };
    tableGroup.add(tubeMesh);

    // ─── 3. BRAÇADEIRAS DUPLAS DE FIXAÇÃO COM MANÍPULOS ───
    const clampMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
    const knobMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 });

    const clampHeights = [
      Math.min(0.18, tubeHeight * 0.25),
      Math.min(0.38, tubeHeight * 0.55)
    ];

    clampHeights.forEach((cY, idx) => {
      const clampGeo = new THREE.BoxGeometry(tubeRadius * 3.2, 0.035, 0.03);
      const clampMesh = new THREE.Mesh(clampGeo, clampMat);
      clampMesh.name = `FloorTableClamp_Bracket_${idx}`;
      clampMesh.position.set(0, cY, 0.015);
      clampMesh.castShadow = true;
      tableGroup.add(clampMesh);

      const knobGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.032, 12);
      knobGeo.rotateZ(Math.PI / 2);
      const knobMesh = new THREE.Mesh(knobGeo, knobMat);
      knobMesh.name = `FloorTableKnob_${idx}`;
      knobMesh.position.set(tubeRadius * 2.0, cY, 0.015);
      tableGroup.add(knobMesh);
    });

    // ─── 4. FLANGE SUPERIOR SOB O TAMPO ───
    const topFlangeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.012, 24);
    const topFlangeMesh = new THREE.Mesh(topFlangeGeo, clampMat);
    topFlangeMesh.name = 'FloorTableTopFlange';
    topFlangeMesh.position.set(0, heightFromFloorM - tableThickness - 0.006, 0);
    topFlangeMesh.castShadow = true;
    tableGroup.add(topFlangeMesh);

    // ─── 5. TAMPO DE MADEIRA COM CANTOS ARREDONDADOS ───
    const radius = Math.min(0.05, Math.min(tableWM, tableLM) * 0.15);
    const hw = tableWM / 2;
    const hl = tableLM / 2;

    const shape = new THREE.Shape();
    shape.moveTo(-hw + radius, -hl);
    shape.lineTo(hw - radius, -hl);
    shape.quadraticCurveTo(hw, -hl, hw, -hl + radius);
    shape.lineTo(hw, hl - radius);
    shape.quadraticCurveTo(hw, hl, hw - radius, hl);
    shape.lineTo(-hw + radius, hl);
    shape.quadraticCurveTo(-hw, hl, -hw, hl - radius);
    shape.lineTo(-hw, -hl + radius);
    shape.quadraticCurveTo(-hw, -hl, -hw + radius, -hl);

    const tableTopGeo = new THREE.ExtrudeGeometry(shape, {
      depth: tableThickness,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.003,
      bevelThickness: 0.003
    });
    tableTopGeo.rotateX(-Math.PI / 2);

    let finishColor = 0xd4a373; // Pinus / Compensado padrão
    if (cfg.finish === 'teak') finishColor = 0xb45309;
    if (cfg.finish === 'dark_wood') finishColor = 0x78350f;
    if (cfg.finish === 'pine_block') finishColor = 0xd97706;

    const tableMat = new THREE.MeshStandardMaterial({
      color: finishColor,
      roughness: 0.65,
      metalness: 0.05
    });

    const tableTopMesh = new THREE.Mesh(tableTopGeo, tableMat);
    tableTopMesh.position.set(0, heightFromFloorM - tableThickness / 2, 0);
    tableTopMesh.rotation.y = rotRad;
    tableTopMesh.castShadow = true;
    tableTopMesh.receiveShadow = true;
    const tableThicknessMm = Math.round(tableThickness * 1000);
    const tableWoodMaterial = (cfg.finish === 'teak' || cfg.finish === 'dark_wood')
      ? 'Madeira Nobre Maciça'
      : 'Compensado Naval';
    tableTopMesh.userData = {
      isWoodPart: true,
      dimW: tableWM,
      dimH: tableThickness,
      dimL: tableLM,
      thicknessMm: tableThicknessMm,
      woodMaterial: tableWoodMaterial,
      moduleName: 'Mesa Dinette Central',
      partType: 'table',
      partLabel: `Tampo de Mesa Dinette Central (${Math.round(tableWM * 1000)}×${Math.round(tableLM * 1000)}×${tableThicknessMm}mm)`,
      name: 'Tampo Mesa Dinette Central',
      category: '🍽️ Mobília & Mesas Campervan',
      material: `${tableWoodMaterial} ${tableThicknessMm}mm Bordas Boleadas`,
      purpose: 'Mesa de refeições, notebook e convivência com pedestal náutico fixada na chapa de compensado naval de 15mm'
    };
    tableGroup.add(tableTopMesh);

    // Borda perimetral suave
    const topEdgeGeo = new THREE.EdgesGeometry(tableTopGeo, 25);
    const topEdgeMat = new THREE.LineBasicMaterial({ color: 0x78350f, transparent: true, opacity: 0.6 });
    const topEdgeLine = new THREE.LineSegments(topEdgeGeo, topEdgeMat);
    topEdgeLine.position.copy(tableTopMesh.position);
    topEdgeLine.rotation.copy(tableTopMesh.rotation);
    tableGroup.add(topEdgeLine);

    floorGroup.add(tableGroup);
  }

  /**
   * Constrói o perfil de alumínio cantoneira de quina 45° com fita LED COB na base do módulo.
   * Iluminação indireta de piso e balizamento noturno indicada em cada módulo individual.
   */
}
