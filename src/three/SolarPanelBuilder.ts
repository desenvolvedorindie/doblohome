import * as THREE from 'three';
import { MaterialLibrary } from './Materials';

/**
 * Construtor 3D Hiper-Realista de Painéis Solares Flexíveis de 100W Monocristalinos
 * Reproduz o laminado de ETFE, 32 células monocristalinas com corte chanfrado,
 * barramentos condutores inferiores, ilhoses metálicos vazados, presilhas mecânicas,
 * caixa de junção e cabos solares com conectores MC4.
 */
export class SolarPanelBuilder {
  static createFlexiblePanelMesh(width: number, length: number, thickness: number, labelText?: string): THREE.Group {
    const mats = MaterialLibrary.materials;
    const panelGroup = new THREE.Group();
    panelGroup.name = labelText || "FlexibleSolarPanel100W";

    // 1. Substrato Laminado Polimérico Branco (Base física do painel)
    const baseGeo = new THREE.BoxGeometry(width, thickness, length);
    const baseMesh = new THREE.Mesh(baseGeo, mats.flexiblePanelSubstrate);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    baseMesh.userData = {
      isPanel: true,
      panelLength: length,
      panelWidth: width,
      panelLabel: 'Painel Solar Flexível 100W',
      spec: `${Math.round(width * 100)} x ${Math.round(length * 100)} cm • 100Wp Monocristalino • 1.6kg`
    };
    panelGroup.add(baseMesh);

    // 2. Dimensões e Posicionamento da Matriz de Células de Silício em 3D
    const cols = 4;
    const rows = 8;
    const totalCells = cols * rows; // 32 células monocristalinas

    const marginX = 0.026;
    const marginTop = 0.048; // Margem superior maior para a junction box
    const marginBottom = 0.026;
    const cellGap = 0.0035;  // 3.5 mm de espaço entre células

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
    const circuitY = -thickness / 2 - 0.0004;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = startX + c * (cellW + cellGap);
        const cz = startZ - r * (cellH + cellGap);

        // Células de silício fotovoltaico no topo
        dummy.position.set(cx, waferY, cz);
        dummy.updateMatrix();
        waferInstanced.setMatrixAt(cellIndex, dummy.matrix);

        // Circuitos e fitas condutoras na face inferior
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

    // 5. Lâmina Protetora Superior ETFE Translúcida
    const etfeGeo = new THREE.BoxGeometry(activeW + 0.006, 0.0006, activeH + 0.006);
    const etfeMesh = new THREE.Mesh(etfeGeo, mats.etfeEncapsulant);
    const etfeZ = (startZ + (startZ - (rows - 1) * (cellH + cellGap))) / 2;
    etfeMesh.position.set(0, waferY + 0.0006, etfeZ);
    panelGroup.add(etfeMesh);

    // 6. Ilhoses Metálicos Vazados 3D
    const eyeletPositions = [
      [-width / 2 + 0.022, length / 2 - 0.022],
      [width / 2 - 0.022, length / 2 - 0.022],
      [-width / 2 + 0.022, -length / 2 + 0.022],
      [width / 2 - 0.022, -length / 2 + 0.022],
      [-width / 2 + 0.022, 0],
      [width / 2 - 0.022, 0]
    ];

    const grommetGeo = new THREE.TorusGeometry(0.0065, 0.0022, 8, 18);
    grommetGeo.rotateX(Math.PI / 2);

    const grommetHoleGeo = new THREE.CylinderGeometry(0.0042, 0.0042, thickness + 0.002, 14);
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x111827 });

    const boltGeo = new THREE.CylinderGeometry(0.0035, 0.0035, 0.008, 12);
    const bracketGeo = new THREE.BoxGeometry(0.022, 0.004, 0.026);

    eyeletPositions.forEach(([gx, gz]) => {
      const holeMesh = new THREE.Mesh(grommetHoleGeo, holeMat);
      holeMesh.position.set(gx, 0, gz);
      panelGroup.add(holeMesh);

      const grommetTop = new THREE.Mesh(grommetGeo, mats.grommetMetal);
      grommetTop.position.set(gx, thickness / 2 + 0.0012, gz);
      panelGroup.add(grommetTop);

      const grommetBottom = new THREE.Mesh(grommetGeo, mats.grommetMetal);
      grommetBottom.position.set(gx, -thickness / 2 - 0.0012, gz);
      panelGroup.add(grommetBottom);

      const bracket = new THREE.Mesh(bracketGeo, mats.eyeletBracket);
      bracket.position.set(gx, thickness / 2 + 0.0038, gz);
      panelGroup.add(bracket);

      const bolt = new THREE.Mesh(boltGeo, mats.eyeletBolt);
      bolt.position.set(gx, thickness / 2 + 0.0075, gz);
      panelGroup.add(bolt);
    });

    // 7. Caixa de Junção e Circuitos Elétricos na Face Inferior
    const jBoxW = 0.082;
    const jBoxH = 0.016;
    const jBoxL = 0.054;
    const jBoxGeo = new THREE.BoxGeometry(jBoxW, jBoxH, jBoxL);
    const jBox = new THREE.Mesh(jBoxGeo, mats.junctionBox);
    const jBoxZ = length / 2 - 0.038;
    jBox.position.set(0, -thickness / 2 - jBoxH / 2 - 0.0005, jBoxZ);
    jBox.castShadow = true;
    panelGroup.add(jBox);

    const jBoxLidGeo = new THREE.BoxGeometry(jBoxW - 0.004, 0.002, jBoxL - 0.004);
    const jBoxLid = new THREE.Mesh(jBoxLidGeo, mats.junctionBox);
    jBoxLid.position.set(0, -thickness / 2 - jBoxH - 0.001, jBoxZ);
    panelGroup.add(jBoxLid);

    // 8. Cabos Solares Fotovoltaicos 3D
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

    // Conectores MC4
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
}

