import * as THREE from 'three';
import { InternalBoxItem, getFoldingBracketForHeight, BoxLedEdge, FridgePreset, PortaPottiPreset, StovePreset } from '../../types';
import { DEFAULT_FRIDGE_PRESETS, loadFridgePresets } from '../../data/fridgePresets';
import { DEFAULT_PORTAPOTTI_PRESETS, loadPortaPottiPresets } from '../../data/portaPottiPresets';
import { DEFAULT_STOVE_PRESETS, loadStovePresets } from '../../data/stovePresets';
import {
  PLYWOOD_THICKNESS,
  FLOOR_Y,
  getBoxThickness,
  getWoodMaterialName
} from './BoxGeometryHelpers';

export class BoxAccessoriesBuilder {
  buildRearFoldShelf(
    container: THREE.Group,
    w: number,
    l: number,
    h: number,
    box: InternalBoxItem,
    isSelected: boolean,
    isOpen: boolean
  ) {
    const isShelfOpen = box.isRearShelfOpen !== undefined ? box.isRearShelfOpen : isOpen;
    const targetParent = (container.getObjectByName('DrawerSlide') as THREE.Group) || container;

    // Cálculo da mão francesa comercial ideal pela altura disponível
    const bracketSpec = getFoldingBracketForHeight(Math.round(h * 1000), box.rearShelfBracketInches);

    // Dimensões da prancha da prateleira decorativa
    const shelfTMm = box.panelThickness?.shelf || 18;
    const shelfT = shelfTMm / 1000;
    const shelfW = Math.max(0.15, w - 0.03); // Margem de 1.5cm de cada lado para a moldura do baú
    const shelfH = Math.max(0.15, Math.min(h - 0.04, 0.38)); // Profundidade da bancada

    // Geometria estrutural da mão francesa (padrão comercial em chapa de aço inox estampada)
    const W_b = 0.022; // 22mm largura da canaleta
    const D_b = 0.016; // 16mm profundidade da canaleta
    const t_s = 0.002; // 2mm espessura da chapa estampada

    const Hv = Math.min(shelfH * 0.65, bracketSpec.heightMm / 1000);
    const Lh = Math.min(shelfH * 0.85, bracketSpec.lengthMm / 1000);

    const isDrawer = box.type === 'drawer';
    const faceZ = isDrawer ? -l / 2 - PLYWOOD_THICKNESS : -l / 2;
    const pivotY = h / 2 - 0.022;
    const pivotZ = faceZ - D_b + 0.004;

    // Materiais dos suportes dobráveis em aço inoxidável escovado brilhante
    const bracketSteelMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Inox escovado brilhante / prata metalizado
      metalness: 0.94,
      roughness: 0.18
    });

    const rivetMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Pinos e rebites em inox polido
      metalness: 0.98,
      roughness: 0.12
    });

    const triggerGripMat = new THREE.MeshStandardMaterial({
      color: 0x18181b, // Grip emborrachado preto da alavanca de destravamento rápido
      metalness: 0.25,
      roughness: 0.75
    });

    // Material da madeira decorativa da prateleira
    let woodColor = 0xdf9a57; // Pinus Finger-Joint / Golden Birch (tom quente)
    let woodRoughness = 0.45;
    let woodMetalness = 0.04;
    let finishLabel = 'Pinus Finger-Joint';

    const finish = box.rearShelfFinish || 'pine_block';
    if (finish === 'teak') {
      woodColor = 0xb45309; // Teca naval
      woodRoughness = 0.40;
      finishLabel = 'Teca Naval';
    } else if (finish === 'dark_wood') {
      woodColor = 0x58240c; // Imbuia / Madeira escura nobre
      woodRoughness = 0.50;
      finishLabel = 'Imbuia Nobre';
    } else if (finish === 'plywood') {
      woodColor = 0xd4a373; // Compensado naval
      woodRoughness = 0.65;
      finishLabel = 'Compensado Naval';
    }

    const shelfMat = new THREE.MeshStandardMaterial({
      color: isSelected ? 0x38bdf8 : woodColor,
      roughness: woodRoughness,
      metalness: woodMetalness
    });

    const edgeColor = isSelected ? 0x38bdf8 : (finish === 'dark_wood' ? 0x270f05 : 0x92400e);
    const shelfEdgeMat = new THREE.LineBasicMaterial({
      color: edgeColor,
      linewidth: 1,
      transparent: true,
      opacity: 0.8
    });

    const bracketOffsetX = shelfW * 0.32;
    const bracketXPositions = [-bracketOffsetX, bracketOffsetX];

    // ─── 1. PEÇAS FIXAS: CANALETAS VERTICAIS DE FIXAÇÃO NO BAÚ (Vertical Wall Arms) ───
    bracketXPositions.forEach((bx, idx) => {
      const fixedBracketGroup = new THREE.Group();
      fixedBracketGroup.name = `FoldingBracket_Base_${idx === 0 ? 'Left' : 'Right'}`;

      // Chapa de fundo da canaleta vertical encostada na madeira do baú
      const vertBackGeo = new THREE.BoxGeometry(W_b, Hv, t_s);
      const vertBackMesh = new THREE.Mesh(vertBackGeo, bracketSteelMat);
      vertBackMesh.position.set(bx, pivotY - Hv / 2, faceZ - t_s / 2);
      fixedBracketGroup.add(vertBackMesh);

      // Flanges laterais estruturais da canaleta em U
      const vertFlangeGeo = new THREE.BoxGeometry(t_s, Hv, D_b);
      const leftFlange = new THREE.Mesh(vertFlangeGeo, bracketSteelMat);
      leftFlange.position.set(bx - W_b / 2 + t_s / 2, pivotY - Hv / 2, faceZ - D_b / 2);
      fixedBracketGroup.add(leftFlange);

      const rightFlange = new THREE.Mesh(vertFlangeGeo, bracketSteelMat);
      rightFlange.position.set(bx + W_b / 2 - t_s / 2, pivotY - Hv / 2, faceZ - D_b / 2);
      fixedBracketGroup.add(rightFlange);

      // Parafusos escareados inox de fixação no painel
      [Hv * 0.15, Hv * 0.50, Hv * 0.85].forEach((offY) => {
        const screwGeo = new THREE.CylinderGeometry(0.0035, 0.0035, 0.002, 10);
        screwGeo.rotateX(Math.PI / 2);
        const screwMesh = new THREE.Mesh(screwGeo, rivetMat);
        screwMesh.position.set(bx, pivotY - offY, faceZ - t_s);
        fixedBracketGroup.add(screwMesh);
      });

      // Eixo / Pino fixo da articulação superior
      const mainPivotPinGeo = new THREE.CylinderGeometry(0.0035, 0.0035, W_b + 0.004, 16);
      mainPivotPinGeo.rotateZ(Math.PI / 2);
      const mainPivotPin = new THREE.Mesh(mainPivotPinGeo, rivetMat);
      mainPivotPin.position.set(bx, pivotY, pivotZ);
      fixedBracketGroup.add(mainPivotPin);

      // Pino fixo inferior da haste diagonal
      const lowerPivotY = pivotY - Hv * 0.75;
      const lowerPivotZ = faceZ - D_b * 0.65;
      const lowerPivotPin = new THREE.Mesh(mainPivotPinGeo, rivetMat);
      lowerPivotPin.position.set(bx, lowerPivotY, lowerPivotZ);
      fixedBracketGroup.add(lowerPivotPin);

      // Haste Diagonal Articulada com Trava
      if (isShelfOpen) {
        // MODO ABERTO: Haste a ~45°-60° com pino de trava encaixado sob o braço horizontal
        const upperLockY = pivotY - 0.009; // Posicionada sob a canaleta horizontal, abaixo da madeira
        const upperLockZ = faceZ - D_b - Lh * 0.62;
        const dY = upperLockY - lowerPivotY;
        const dZ = upperLockZ - lowerPivotZ;
        const strutLength = Math.sqrt(dY * dY + dZ * dZ);
        const strutAngle = Math.atan2(dZ, dY);

        const strutGeo = new THREE.BoxGeometry(0.012, strutLength, 0.004);
        const strutMesh = new THREE.Mesh(strutGeo, bracketSteelMat);
        strutMesh.position.set(bx, (lowerPivotY + upperLockY) / 2, (lowerPivotZ + upperLockZ) / 2);
        strutMesh.rotation.x = strutAngle;
        fixedBracketGroup.add(strutMesh);

        const lockPin = new THREE.Mesh(mainPivotPinGeo, rivetMat);
        lockPin.position.set(bx, upperLockY, upperLockZ);
        fixedBracketGroup.add(lockPin);
      } else {
        // MODO FECHADO: Haste articulada dobrada recolhida dentro da canaleta
        const foldStrutGeo = new THREE.BoxGeometry(0.012, Hv * 0.7, 0.004);
        const foldStrutMesh = new THREE.Mesh(foldStrutGeo, bracketSteelMat);
        foldStrutMesh.position.set(bx, pivotY - Hv * 0.45, faceZ - D_b / 2);
        fixedBracketGroup.add(foldStrutMesh);
      }

      fixedBracketGroup.userData = {
        isHardware: true,
        partLabel: `Suporte Articulado Dobrável c/ Trava Inox ${bracketSpec.inches}" (${bracketSpec.lengthMm} mm) (Par)`,
        name: 'Mão Francesa Dobrável Inox c/ Gatilho (2PCS)',
        category: '🔩 Ferragens de Sustentação & Articulação',
        purpose: 'Suporte dobrável de aço inox escovado com trava automática 90° e gatilho de liberação rápida para bancada/mesa traseira'
      };

      targetParent.add(fixedBracketGroup);
    });

    // ─── 2. GRUPO MÓVEL / ARTICULADO (TAMPO DE MADEIRA + BRAÇOS HORIZONTAIS C/ GATILHO) ───
    const shelfPivot = new THREE.Group();
    shelfPivot.name = 'RearFoldShelfPivot';
    shelfPivot.position.set(0, pivotY, pivotZ);

    if (isShelfOpen) {
      shelfPivot.rotation.x = Math.PI / 2;
    }

    // Tampo de Madeira Maciça de 18mm
    const shelfGeo = new THREE.BoxGeometry(shelfW, shelfH, shelfT);
    const shelfMesh = new THREE.Mesh(shelfGeo, shelfMat);
    shelfMesh.position.set(0, -shelfH / 2, -shelfT / 2 - 0.003);
    shelfMesh.castShadow = true;
    shelfMesh.receiveShadow = true;
    const shelfWoodMaterial = finish === 'plywood'
      ? 'Compensado Naval'
      : (finish === 'dark_wood' || finish === 'teak' ? 'Madeira Nobre Maciça' : getWoodMaterialName(box.material));

    shelfMesh.userData = {
      isWoodPart: true,
      dimW: shelfW,
      dimH: shelfT,
      dimL: shelfH,
      thicknessMm: shelfTMm,
      partLabel: `${box.name} • Prateleira Rebatível Traseira [${finishLabel} ${shelfTMm}mm]`,
      isInternalBox: Boolean(box.id),
      boxId: box.id,
      boxRoot: container,
      isRearShelf: true,
      material: `${shelfWoodMaterial} ${shelfTMm}mm (${finishLabel})`,
      woodMaterial: shelfWoodMaterial,
      moduleName: box.name,
      partType: 'shelf'
    };
    shelfPivot.add(shelfMesh);

    const shelfEdgeGeo = new THREE.EdgesGeometry(shelfGeo);
    const shelfEdgeLine = new THREE.LineSegments(shelfEdgeGeo, shelfEdgeMat);
    shelfEdgeLine.position.copy(shelfMesh.position);
    shelfPivot.add(shelfEdgeLine);

    // Braços Horizontais aparafusados sob o tampo de madeira (Giram junto com o tampo)
    bracketXPositions.forEach((bx) => {
      // Canaleta do braço horizontal em U invertido
      const armGeo = new THREE.BoxGeometry(W_b - 0.003, Lh, D_b - 0.003);
      const armMesh = new THREE.Mesh(armGeo, bracketSteelMat);
      armMesh.position.set(bx, -Lh / 2, (D_b - 0.003) / 2 - 0.003);
      shelfPivot.add(armMesh);

      // Nariz frontal arredondado característico da mão francesa estampada
      const noseGeo = new THREE.CylinderGeometry(0.006, 0.006, W_b - 0.004, 12);
      noseGeo.rotateZ(Math.PI / 2);
      const noseMesh = new THREE.Mesh(noseGeo, bracketSteelMat);
      noseMesh.position.set(bx, -Lh + 0.006, (D_b - 0.003) / 2 - 0.003);
      shelfPivot.add(noseMesh);

      // Alavanca / Gatilho de Liberação Rápida com mola (Release Trigger)
      const triggerY = -Lh * 0.45;
      const leverBarGeo = new THREE.BoxGeometry(0.008, 0.045, 0.003);
      const leverBarMesh = new THREE.Mesh(leverBarGeo, bracketSteelMat);
      leverBarMesh.position.set(bx, triggerY, (D_b - 0.003) + 0.002);
      shelfPivot.add(leverBarMesh);

      const triggerTabGeo = new THREE.BoxGeometry(0.010, 0.006, 0.012);
      const triggerTabMesh = new THREE.Mesh(triggerTabGeo, triggerGripMat);
      triggerTabMesh.position.set(bx, triggerY - 0.015, (D_b - 0.003) + 0.006);
      shelfPivot.add(triggerTabMesh);
    });

    targetParent.add(shelfPivot);
  }

  /**
   * Constrói o Armário Aéreo sobre a Caixa até o limite do teto da Doblò.
   * Suporta instalação em qualquer uma das 4 faces:
   * 'rear' (traseira), 'front' (frente), 'left' (lateral esquerda / motorista)
   * ou 'right' (lateral direita / passageiro), bem como múltiplas laterais ('all').
   */

  buildBoxLedCorner(
    container: THREE.Group,
    w: number,
    l: number,
    h: number,
    box: InternalBoxItem,
    isSelected: boolean
  ) {
    const ledCfg = box.ledCorner || { enabled: true };
    if (ledCfg.enabled === false && !box.hasLedCorner) return;

    const ledColorHex = new THREE.Color(ledCfg.color || '#fef3c7').getHex();
    const brightness = Math.max(0.1, Math.min(1.5, (ledCfg.brightness ?? 85) / 100));

    // Determina quais quinas inferiores receberão o perfil
    const edges: BoxLedEdge[] = (ledCfg.edges && ledCfg.edges.length > 0)
      ? ledCfg.edges
      : ['rear'];

    const hasRear = edges.includes('rear');
    const hasFront = edges.includes('front');

    const ledGroup = new THREE.Group();
    ledGroup.name = `BoxLedCorners_${box.id}`;

    // Materiais: Perfil de Alumínio Cinza + Capa Plástica Branca Leitosa + Ponteiras Brancas + Fita COB
    const aluminumMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Alumínio anodizado cinza natural fosco
      metalness: 0.85,
      roughness: 0.32
    });

    const whitePlasticMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Plástico branco leitoso puro (policarbonato fosco translúcido)
      roughness: 0.45,
      metalness: 0.0,
      emissive: ledColorHex,
      emissiveIntensity: brightness * 0.45 // Luz suave através do plástico preservando a tonalidade branca da capa plástica
    });

    const capMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9, // Ponteiras plásticas brancas de fechamento nas extremidades
      roughness: 0.55,
      metalness: 0.0
    });

    const stripMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24, // Fita COB interna amarelo fósforo
      emissive: ledColorHex,
      emissiveIntensity: brightness * 1.6,
      roughness: 0.3
    });

    const S = 0.016; // Perfil de quina 16x16mm
    const yBottom = -h / 2;

    edges.forEach((edge) => {
      // Ajuste de comprimento para junção limpa nos cantos sem sobreposição
      let length = (edge === 'rear' || edge === 'front') ? w : l;
      if (edge === 'left' || edge === 'right') {
        if (hasRear) length -= S;
        if (hasFront) length -= S;
      }
      length = Math.max(0.04, length);

      // 1. Perfil de Alumínio Cinza (Cantoneira 90° com abas de retenção do difusor)
      const profileShape = new THREE.Shape();
      profileShape.moveTo(0, 0);
      profileShape.lineTo(0, S);
      profileShape.lineTo(0.0028, S);
      profileShape.lineTo(0.0028, S - 0.0014);
      profileShape.lineTo(0.0014, S - 0.0025);
      profileShape.lineTo(0.0014, 0.0014);
      profileShape.lineTo(S - 0.0025, 0.0014);
      profileShape.lineTo(S - 0.0014, 0.0028);
      profileShape.lineTo(S, 0.0028);
      profileShape.lineTo(S, 0);
      profileShape.closePath();

      const profileGeo = new THREE.ExtrudeGeometry(profileShape, {
        depth: length,
        bevelEnabled: false
      });

      const profileMesh = new THREE.Mesh(profileGeo, aluminumMat);
      profileMesh.name = `BoxLedProfile_Aluminum_${edge}_${box.id}`;

      // Linhas de quina metálicas no perfil para realçar os cantos de alumínio cinza
      const profileEdgeGeo = new THREE.EdgesGeometry(profileGeo, 30);
      const profileEdgeMat = new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.45 });
      const profileEdgeLine = new THREE.LineSegments(profileEdgeGeo, profileEdgeMat);

      // 2. Capa Difusora em Plástico Branco Leitoso (Lente 45° com abaulamento sutil)
      const diffuserShape = new THREE.Shape();
      const midX = S / 2 + 0.0006;
      const midY = S / 2 + 0.0006;
      const inMidX = S / 2 - 0.0004;
      const inMidY = S / 2 - 0.0004;

      diffuserShape.moveTo(0.0025, S - 0.0010);
      diffuserShape.quadraticCurveTo(midX, midY, S - 0.0010, 0.0025);
      diffuserShape.lineTo(S - 0.0022, 0.0035);
      diffuserShape.quadraticCurveTo(inMidX, inMidY, 0.0035, S - 0.0022);
      diffuserShape.closePath();

      const diffuserGeo = new THREE.ExtrudeGeometry(diffuserShape, {
        depth: Math.max(0.02, length - 0.004),
        bevelEnabled: false
      });

      const diffuserMesh = new THREE.Mesh(diffuserGeo, whitePlasticMat);
      diffuserMesh.name = `BoxLedDiffuser_WhitePlastic_${edge}_${box.id}`;
      diffuserMesh.position.z = 0.002;

      // 3. Ponteiras Plásticas Brancas nas duas extremidades
      const capShape = new THREE.Shape();
      capShape.moveTo(0, 0);
      capShape.lineTo(0, S);
      capShape.lineTo(S, 0);
      capShape.closePath();

      const capGeo = new THREE.ExtrudeGeometry(capShape, {
        depth: 0.0015,
        bevelEnabled: false
      });

      const capStart = new THREE.Mesh(capGeo, capMat);
      capStart.name = `BoxLedCap_Start_${edge}_${box.id}`;
      capStart.position.set(0, 0, -0.001);

      const capEnd = new THREE.Mesh(capGeo, capMat);
      capEnd.name = `BoxLedCap_End_${edge}_${box.id}`;
      capEnd.position.set(0, 0, length - 0.0005);

      // 4. Fita LED COB interna (fita amarela interna visível no canal)
      const stripGeo = new THREE.BoxGeometry(0.006, 0.0006, Math.max(0.02, length - 0.006));
      const stripMesh = new THREE.Mesh(stripGeo, stripMat);
      stripMesh.name = `BoxLedStrip_${edge}_${box.id}`;
      stripMesh.position.set(0.005, 0.005, length / 2);
      stripMesh.rotation.z = -Math.PI / 4;

      const edgeGroup = new THREE.Group();
      edgeGroup.add(profileMesh);
      edgeGroup.add(profileEdgeLine);
      edgeGroup.add(diffuserMesh);
      edgeGroup.add(capStart);
      edgeGroup.add(capEnd);
      edgeGroup.add(stripMesh);

      const edgeLabel = edge === 'rear'
        ? 'Face Traseira (Porta-malas)'
        : edge === 'front'
          ? 'Face Frontal'
          : edge === 'left'
            ? 'Lateral Esquerda'
            : 'Lateral Direita';

      const partData = {
        isHardware: true,
        isElectrical: true,
        partLabel: `Perfil Quina LED 45° Cinza c/ Difusor Plástico Branco (${Math.round(length * 1000)} mm) - ${box.name}`,
        name: 'Perfil Alumínio Cantoneira 45° Cinza c/ Capa Plástica Branca Leitosa e LED COB',
        category: '💡 Iluminação de Quina do Módulo',
        barProfile: `${Math.round(length * 1000)} mm • 12V 10W/m`,
        capacity: 'Iluminação Indireta de Chão / Cortesia',
        purpose: `Perfil de quina 16×16mm em alumínio cinza anodizado com capa difusora em plástico branco leitoso e fita LED COB 12V na quina inferior (${edgeLabel})`
      };

      profileMesh.userData = partData;
      diffuserMesh.userData = {
        ...partData,
        partLabel: `Difusor Plástico Branco Leitoso 45° (${Math.round(length * 1000)} mm) - ${box.name}`,
        name: 'Capa Plástica Branca Leitosa (Difusor Policarbonato)'
      };
      capStart.userData = {
        isHardware: true,
        partLabel: 'Ponteira Plástica Branca Terminal c/ Passa-fio',
        category: '💡 Acessórios Plásticos LED'
      };
      capEnd.userData = {
        isHardware: true,
        partLabel: 'Ponteira Plástica Branca Terminal c/ Passa-fio',
        category: '💡 Acessórios Plásticos LED'
      };

      if (edge === 'rear') {
        edgeGroup.rotation.y = Math.PI / 2;
        edgeGroup.position.set(-length / 2, yBottom, -l / 2);
      } else if (edge === 'front') {
        edgeGroup.rotation.y = -Math.PI / 2;
        edgeGroup.position.set(length / 2, yBottom, l / 2);
      } else if (edge === 'left') {
        const zOffset = hasRear ? -l / 2 + S : -l / 2;
        edgeGroup.position.set(w / 2, yBottom, zOffset);
      } else if (edge === 'right') {
        const zOffset = hasRear ? l / 2 - S : l / 2;
        edgeGroup.rotation.y = Math.PI;
        edgeGroup.position.set(-w / 2, yBottom, zOffset);
      }

      ledGroup.add(edgeGroup);
    });

    // Ponto de luz suave iluminando o chão próximo ao módulo
    const pointLight = new THREE.PointLight(ledColorHex, brightness * 0.7, 1.4, 1.6);
    pointLight.position.set(0, yBottom + 0.05, hasRear ? -l / 2 - 0.05 : 0);
    ledGroup.add(pointLight);

    container.add(ledGroup);
  }

  /**
   * Constrói e instala a Geladeira Portátil 12V/24V (Resfri Ar 35L ou preset selecionado)
   * no interior do módulo (gavetão corrediço, bandeja retrátil ou baú).
   */
  buildFridgeAppliance(
    container: THREE.Group,
    w: number,
    l: number,
    h: number,
    box: InternalBoxItem,
    isSelected: boolean
  ) {
    const drawerSlide = container.getObjectByName('DrawerSlide') as THREE.Group;
    const targetParent = drawerSlide || container;

    const allPresets = loadFridgePresets();
    const preset = (box.fridgePresetId && allPresets.find(p => p.id === box.fridgePresetId)) || DEFAULT_FRIDGE_PRESETS[0];

    const fw = Math.min(w - 0.03, preset.width / 1000);
    const fd = Math.min(l - 0.03, preset.depth / 1000);
    const fh = Math.min(h - 0.02, preset.height / 1000);

    const fridgeGroup = new THREE.Group();
    fridgeGroup.name = `FridgeAppliance_${box.id}`;

    // 1. Corpo principal em polipropileno/ABS grafite escuro
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1f2630,
      roughness: 0.55,
      metalness: 0.15
    });

    const bodyGeo = new THREE.BoxGeometry(fw, fh * 0.88, fd);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(0, -fh * 0.06, 0);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    fridgeGroup.add(bodyMesh);

    // 2. Tampa superior com fecho e puxador
    const lidMat = new THREE.MeshStandardMaterial({
      color: 0x333d4b,
      roughness: 0.45,
      metalness: 0.2
    });
    const lidGeo = new THREE.BoxGeometry(fw + 0.004, fh * 0.12, fd + 0.004);
    const lidMesh = new THREE.Mesh(lidGeo, lidMat);
    lidMesh.position.set(0, fh / 2 - (fh * 0.12) / 2, 0);
    lidMesh.castShadow = true;
    fridgeGroup.add(lidMesh);

    // 3. Fecho/trava frontal
    const latchMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.3,
      metalness: 0.8
    });
    const latchGeo = new THREE.BoxGeometry(fw * 0.28, 0.016, 0.018);
    const latchMesh = new THREE.Mesh(latchGeo, latchMat);
    latchMesh.position.set(0, fh / 2 - 0.015, -fd / 2 - 0.004);
    fridgeGroup.add(latchMesh);

    // 4. Painel de Controle Digital Frontal / Superior com display ciano
    const displayMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.75,
      roughness: 0.2,
      metalness: 0.5
    });
    const displayGeo = new THREE.BoxGeometry(fw * 0.26, 0.024, 0.045);
    const displayMesh = new THREE.Mesh(displayGeo, displayMat);
    displayMesh.position.set(fw * 0.25, fh / 2 + 0.001, -fd / 2 + 0.04);
    fridgeGroup.add(displayMesh);

    // 5. Grelhas de ventilação lateral para o compressor
    const grilleMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.3
    });
    const grilleGeo = new THREE.BoxGeometry(0.006, fh * 0.35, fd * 0.28);
    const grilleL = new THREE.Mesh(grilleGeo, grilleMat);
    grilleL.position.set(fw / 2 + 0.001, -fh * 0.15, fd * 0.25);
    fridgeGroup.add(grilleL);

    const grilleR = new THREE.Mesh(grilleGeo, grilleMat);
    grilleR.position.set(-fw / 2 - 0.001, -fh * 0.15, fd * 0.25);
    fridgeGroup.add(grilleR);

    // 6. Alças laterais de transporte
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.6
    });
    const handleGeo = new THREE.BoxGeometry(0.012, 0.03, fd * 0.24);
    const handleL = new THREE.Mesh(handleGeo, handleMat);
    handleL.position.set(fw / 2 + 0.004, fh * 0.15, 0);
    fridgeGroup.add(handleL);

    const handleR = new THREE.Mesh(handleGeo, handleMat);
    handleR.position.set(-fw / 2 - 0.004, fh * 0.15, 0);
    fridgeGroup.add(handleR);

    // Posição no interior do módulo (assentada no fundo)
    const bottomY = -h / 2 + fh / 2 + 0.018;
    fridgeGroup.position.set(0, bottomY, 0);

    const partData = {
      isAppliance: true,
      isFridge: true,
      boxId: box.id,
      boxRoot: container,
      applianceRoot: fridgeGroup,
      partLabel: `${preset.name} (${preset.volumeLiters}L)`,
      name: `${preset.brand} ${preset.model} (12V/24V)`,
      category: '❄️ Refrigeração Automotiva 12V',
      power: `${preset.powerEcoWatts}W ECO / ${preset.powerMaxWatts}W MAX`,
      capacity: `${preset.volumeLiters} Litros (${preset.canCapacity350ml || 46} latas 350ml)`,
      dimensions: {
        widthMm: preset.width,
        depthMm: preset.depth,
        heightMm: preset.height
      },
      weightKg: preset.weightKg,
      voltage: preset.voltage,
      tempRange: preset.tempRange,
      features: preset.features,
      purpose: `Geladeira veicular portátil instalada no módulo '${box.name}'. Opera com compressor 12V e controle Bluetooth via smartphone.`
    };

    fridgeGroup.userData = partData;
    bodyMesh.userData = partData;
    lidMesh.userData = partData;
    displayMesh.userData = partData;

    targetParent.add(fridgeGroup);
  }

  /**
   * Constrói e instala o Vaso Sanitário Químico Portátil Porta Potti (Seaflo 20L ou preset selecionado)
   * no interior do módulo (gavetão corrediço, bandeja retrátil ou baú).
   */
  buildPortaPottiAppliance(
    container: THREE.Group,
    w: number,
    l: number,
    h: number,
    box: InternalBoxItem,
    isSelected: boolean
  ) {
    const drawerSlide = container.getObjectByName('DrawerSlide') as THREE.Group;
    const targetParent = drawerSlide || container;

    const allPresets = loadPortaPottiPresets();
    const preset = (box.portaPottiPresetId && allPresets.find(p => p.id === box.portaPottiPresetId)) || DEFAULT_PORTAPOTTI_PRESETS[0];

    // Dimensões nominais do porta potti ajustadas à escala do módulo
    const pw = Math.min(w - 0.03, preset.width / 1000);   // Largura (transversal)
    const pd = Math.min(l - 0.03, preset.depth / 1000);   // Profundidade (longitudinal)
    const ph = Math.min(h - 0.02, preset.height / 1000);  // Altura total

    const portaPottiGroup = new THREE.Group();
    portaPottiGroup.name = `PortaPottiAppliance_${box.id}`;

    // Materiais plásticos ABS com acabamento semi-brilhante sanitário
    const lowerTankMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Cinza claro / polietileno de alta densidade
      roughness: 0.45,
      metalness: 0.08
    });

    const upperTankMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Branco marfim suave sanitário
      roughness: 0.35,
      metalness: 0.05
    });

    const seatLidMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Branco brilhante ABS
      roughness: 0.25,
      metalness: 0.05
    });

    const darkAccentMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Grafite escuro para travas e puxadores
      roughness: 0.5,
      metalness: 0.2
    });

    // 1. Tanque inferior de dejetos (Waste Tank) - ~48% da altura
    const lowerH = ph * 0.48;
    const lowerGeo = new THREE.BoxGeometry(pw * 0.96, lowerH, pd * 0.96);
    const lowerMesh = new THREE.Mesh(lowerGeo, lowerTankMat);
    lowerMesh.position.set(0, -ph / 2 + lowerH / 2, 0);
    lowerMesh.castShadow = true;
    lowerMesh.receiveShadow = true;
    portaPottiGroup.add(lowerMesh);

    // 2. Tanque superior de água limpa e bacia sanitária - ~44% da altura
    const upperH = ph * 0.44;
    const upperGeo = new THREE.BoxGeometry(pw, upperH, pd);
    const upperMesh = new THREE.Mesh(upperGeo, upperTankMat);
    upperMesh.position.set(0, -ph / 2 + lowerH + upperH / 2, 0);
    upperMesh.castShadow = true;
    upperMesh.receiveShadow = true;
    portaPottiGroup.add(upperMesh);

    // 3. Assento e Tampa com Fechamento Suave (Soft Close Lid)
    const lidH = 0.022;
    const lidGeo = new THREE.BoxGeometry(pw * 0.94, lidH, pd * 0.94);
    const lidMesh = new THREE.Mesh(lidGeo, seatLidMat);
    lidMesh.position.set(0, -ph / 2 + lowerH + upperH + lidH / 2, 0);
    lidMesh.castShadow = true;
    portaPottiGroup.add(lidMesh);

    // Friso de relevo ergonômico na tampa
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.4
    });
    const rimGeo = new THREE.BoxGeometry(pw * 0.88, 0.006, pd * 0.88);
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.set(0, -ph / 2 + lowerH + upperH + lidH + 0.003, 0);
    portaPottiGroup.add(rimMesh);

    // 4. Botão da Bomba de Pistão Manual (Top Corner)
    const pumpGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.024, 16);
    const pumpMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Azul Seaflo
      metalness: 0.3,
      roughness: 0.3
    });
    const pumpMesh = new THREE.Mesh(pumpGeo, pumpMat);
    pumpMesh.position.set(-pw * 0.36, -ph / 2 + lowerH + upperH + 0.012, -pd * 0.36);
    portaPottiGroup.add(pumpMesh);

    // 5. Tampa de abastecimento do reservatório de água limpa
    const capGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.014, 16);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.2,
      roughness: 0.4
    });
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.set(pw * 0.36, -ph / 2 + lowerH + upperH + 0.007, -pd * 0.36);
    portaPottiGroup.add(capMesh);

    // 6. Puxador frontal da válvula hermética antivazamento
    const valveHandleGeo = new THREE.BoxGeometry(pw * 0.22, 0.02, 0.025);
    const valveHandle = new THREE.Mesh(valveHandleGeo, darkAccentMat);
    valveHandle.position.set(0, -ph / 2 + lowerH * 0.75, -pd / 2 - 0.008);
    portaPottiGroup.add(valveHandle);

    // 7. Travas laterais de desengate rápido dos dois tanques
    const latchGeo = new THREE.BoxGeometry(0.012, lowerH * 0.35, 0.04);
    const latchL = new THREE.Mesh(latchGeo, darkAccentMat);
    latchL.position.set(pw / 2 + 0.003, -ph / 2 + lowerH, 0);
    portaPottiGroup.add(latchL);

    const latchR = new THREE.Mesh(latchGeo, darkAccentMat);
    latchR.position.set(-pw / 2 - 0.003, -ph / 2 + lowerH, 0);
    portaPottiGroup.add(latchR);

    // 8. Indicador de Nível de Dejetos frontal
    if (preset.levelIndicator) {
      const indicatorGeo = new THREE.BoxGeometry(0.016, 0.04, 0.004);
      const indicatorMat = new THREE.MeshStandardMaterial({
        color: 0x10b981, // Verde de nível normal
        emissive: 0x059669,
        emissiveIntensity: 0.5
      });
      const indicatorMesh = new THREE.Mesh(indicatorGeo, indicatorMat);
      indicatorMesh.position.set(pw * 0.32, -ph / 2 + lowerH * 0.6, -pd / 2 - 0.002);
      portaPottiGroup.add(indicatorMesh);
    }

    // Posição no interior do módulo (assentado no piso do gavetão ou baú)
    const bottomY = -h / 2 + ph / 2 + 0.018;
    portaPottiGroup.position.set(0, bottomY, 0);

    const partData = {
      isAppliance: true,
      isPortaPotti: true,
      boxId: box.id,
      boxRoot: container,
      applianceRoot: portaPottiGroup,
      partLabel: `${preset.name} (${preset.wasteCapacityLiters}L)`,
      name: `${preset.brand} ${preset.model} (${preset.wasteCapacityLiters}L Dejetos)`,
      category: '🚽 Sanitário Químico Portátil',
      capacity: `${preset.wasteCapacityLiters}L Dejetos / ${preset.freshWaterCapacityLiters}L Água Limpa`,
      dimensions: {
        widthMm: preset.width,
        depthMm: preset.depth,
        heightMm: preset.height
      },
      weightKg: preset.weightEmptyKg,
      weightFullKg: preset.weightFullKg,
      maxLoadKg: preset.maxLoadKg,
      flushType: preset.flushType,
      material: preset.material,
      hasSoftClose: preset.hasSoftClose,
      features: preset.features,
      purpose: `Vaso sanitário químico portátil instalado no módulo '${box.name}'. Conta com reservatório de dejetos de 20L, tampa Soft Close e válvula hermética antivazamento.`
    };

    portaPottiGroup.userData = partData;
    lowerMesh.userData = partData;
    upperMesh.userData = partData;
    lidMesh.userData = partData;

    targetParent.add(portaPottiGroup);
  }

  /**
   * Constrói e instala o Fogareiro Portátil (NTK Duo Ceramik ou preset selecionado)
   * no interior do módulo (gaveta, bandeja corrediça ou baú), sobre o tampo superior
   * ou sobre a mesa/prateleira rebatível traseira.
   */
  buildStoveAppliance(
    container: THREE.Group,
    w: number,
    l: number,
    h: number,
    box: InternalBoxItem,
    isSelected: boolean,
    isOpen: boolean = false
  ) {
    const drawerSlide = container.getObjectByName('DrawerSlide') as THREE.Group | undefined;
    const targetParent = drawerSlide || container;

    const allPresets = loadStovePresets();
    const preset: StovePreset =
      (box.stovePresetId && allPresets.find(p => p.id === box.stovePresetId)) ||
      DEFAULT_STOVE_PRESETS[0];

    const placement = box.stovePlacement || 'inside';
    const isRotated = box.stoveRotation === 90;

    const swRaw = preset.width / 1000;
    const sdRaw = preset.depth / 1000;
    const shRaw = preset.height / 1000;

    let scale = 1;
    if (placement === 'inside') {
      const availW = Math.max(0.12, w - 0.036);
      const availD = Math.max(0.12, l - 0.036);
      const availH = Math.max(0.05, h - 0.024);
      const effW = isRotated ? sdRaw : swRaw;
      const effD = isRotated ? swRaw : sdRaw;
      scale = Math.min(1, availW / effW, availD / effD, availH / shRaw);
    }

    const sw = swRaw * scale;
    const sd = sdRaw * scale;
    const sh = shRaw * scale;

    const stoveGroup = new THREE.Group();
    stoveGroup.name = `StoveAppliance_${box.id}`;
    stoveGroup.rotation.y = isRotated ? Math.PI / 2 : 0;

    const isInox = preset.id === 'ntk-bistro-inox' || preset.material.toLowerCase().includes('inox');
    const isCeramic = preset.burnerType.toLowerCase().includes('cerâm') || preset.burnerType.toLowerCase().includes('ceram');

    // Materiais realistas do NTK Duo Ceramik
    const chassisMat = new THREE.MeshStandardMaterial({
      color: isInox ? 0xcbd5e1 : 0x5c3a21, // Bronze terroso esmaltado característico do NTK Duo Ceramik (ou inox)
      roughness: isInox ? 0.25 : 0.34,
      metalness: isInox ? 0.85 : 0.38
    });

    const darkSkirtMat = new THREE.MeshStandardMaterial({
      color: 0x111827, // Base inferior e painel preto fosco
      roughness: 0.6,
      metalness: 0.25
    });

    const enamelTrayMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Bandeja coletora em enamel atóxico preto brilhante
      roughness: 0.22,
      metalness: 0.32
    });

    const stainlessMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Aço inox escovado para aro do queimador e detalhes
      roughness: 0.22,
      metalness: 0.9
    });

    const ceramicMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7, // Placa cerâmica porosa infravermelho (favo de mel)
      emissive: 0xea580c,
      emissiveIntensity: 0.22,
      roughness: 0.85,
      metalness: 0.02
    });

    const castIronMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937, // Trempe / apoio de panelas em aço esmaltado
      roughness: 0.45,
      metalness: 0.55
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Conector de latão dourado Flex Fuel para botijão GLP
      roughness: 0.25,
      metalness: 0.88
    });

    const redAccentMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Trava de segurança / marcador de ignição Piezo
      roughness: 0.35,
      metalness: 0.2
    });

    // 1. 4 Sapatas emborrachadas na base
    const footH = sh * 0.1;
    const footGeo = new THREE.CylinderGeometry(0.011 * scale, 0.013 * scale, footH, 12);
    const footPositions: [number, number][] = [
      [-sw * 0.42, -sd * 0.40],
      [sw * 0.42, -sd * 0.40],
      [-sw * 0.42, sd * 0.40],
      [sw * 0.42, sd * 0.40]
    ];
    footPositions.forEach(([fx, fz]) => {
      const foot = new THREE.Mesh(footGeo, darkSkirtMat);
      foot.position.set(fx, -sh / 2 + footH / 2, fz);
      stoveGroup.add(foot);
    });

    // 2. Saia inferior e chassi principal em aço esmaltado epóxi
    const skirtH = sh * 0.14;
    const skirtGeo = new THREE.BoxGeometry(sw * 0.98, skirtH, sd * 0.98);
    const skirtMesh = new THREE.Mesh(skirtGeo, darkSkirtMat);
    skirtMesh.position.set(0, -sh / 2 + footH + skirtH / 2, 0);
    skirtMesh.castShadow = true;
    skirtMesh.receiveShadow = true;
    stoveGroup.add(skirtMesh);

    const bodyH = sh * 0.50;
    const bodyBaseY = -sh / 2 + footH + skirtH;
    const bodyCenterY = bodyBaseY + bodyH / 2;
    const bodyTopY = bodyBaseY + bodyH;

    const bodyGeo = new THREE.BoxGeometry(sw, bodyH, sd);
    const bodyMesh = new THREE.Mesh(bodyGeo, chassisMat);
    bodyMesh.position.set(0, bodyCenterY, 0);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    stoveGroup.add(bodyMesh);

    // Helper para construir um conjunto queimador + bandeja + trempe
    const addBurnerAssembly = (bx: number, bz: number, radiusScale: number) => {
      const traySize = Math.min(sw * 0.56, sd * 0.78) * radiusScale;
      const trayGeo = new THREE.BoxGeometry(traySize, 0.008 * scale, traySize);
      const trayMesh = new THREE.Mesh(trayGeo, enamelTrayMat);
      trayMesh.position.set(bx, bodyTopY + 0.002 * scale, bz);
      trayMesh.receiveShadow = true;
      stoveGroup.add(trayMesh);

      // Rebaixo circular da bandeja
      const bowlOuterR = traySize * 0.36;
      const bowlGeo = new THREE.CylinderGeometry(bowlOuterR, bowlOuterR * 0.85, 0.006 * scale, 24);
      const bowlMesh = new THREE.Mesh(bowlGeo, enamelTrayMat);
      bowlMesh.position.set(bx, bodyTopY + 0.006 * scale, bz);
      stoveGroup.add(bowlMesh);

      // Anel protetor do queimador em aço inox
      const burnerOuterR = traySize * 0.23;
      const ringGeo = new THREE.CylinderGeometry(burnerOuterR, burnerOuterR * 1.06, 0.012 * scale, 24);
      const ringMesh = new THREE.Mesh(ringGeo, stainlessMat);
      ringMesh.position.set(bx, bodyTopY + 0.010 * scale, bz);
      stoveGroup.add(ringMesh);

      // Núcleo do queimador (Cerâmica infravermelho vs Coroa alumínio)
      const coreR = burnerOuterR * 0.78;
      const coreGeo = new THREE.CylinderGeometry(coreR, coreR, 0.0135 * scale, 24);
      const coreMesh = new THREE.Mesh(coreGeo, isCeramic ? ceramicMat : stainlessMat);
      coreMesh.position.set(bx, bodyTopY + 0.0105 * scale, bz);
      stoveGroup.add(coreMesh);

      if (isCeramic) {
        // Anel metálico central característico do queimador cerâmico
        const centerCapGeo = new THREE.CylinderGeometry(coreR * 0.22, coreR * 0.22, 0.015 * scale, 16);
        const centerCap = new THREE.Mesh(centerCapGeo, stainlessMat);
        centerCap.position.set(bx, bodyTopY + 0.011 * scale, bz);
        stoveGroup.add(centerCap);
      }

      // Trempe / Apoio de panelas removível com 4 hastes radiais
      const trempeH = Math.max(0.010 * scale, sh - (bodyTopY + sh / 2) - 0.004 * scale);
      const trempeY = bodyTopY + trempeH * 0.65;
      const trempeRingR = traySize * 0.42;

      const trempeRingGeo = new THREE.TorusGeometry(trempeRingR, 0.0032 * scale, 8, 28);
      trempeRingGeo.rotateX(Math.PI / 2);
      const trempeRing = new THREE.Mesh(trempeRingGeo, castIronMat);
      trempeRing.position.set(bx, trempeY, bz);
      trempeRing.castShadow = true;
      stoveGroup.add(trempeRing);

      // 4 braços de suporte da trempe
      const armLen = trempeRingR * 0.85;
      [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach((ang) => {
        const armGroup = new THREE.Group();
        armGroup.position.set(bx, trempeY + 0.003 * scale, bz);
        armGroup.rotation.y = ang + Math.PI / 4;

        const armGeo = new THREE.BoxGeometry(armLen, 0.007 * scale, 0.004 * scale);
        const armMesh = new THREE.Mesh(armGeo, castIronMat);
        armMesh.position.set(trempeRingR * 0.62, 0, 0);
        armMesh.castShadow = true;
        armGroup.add(armMesh);
        stoveGroup.add(armGroup);
      });
    };

    const interactiveMeshes: THREE.Mesh[] = [bodyMesh, skirtMesh];

    if (preset.burnersCount >= 2) {
      // Fogareiro 2 Bocas
      addBurnerAssembly(sw * 0.24, 0, 0.72);
      addBurnerAssembly(-sw * 0.24, 0, 0.72);

      // 2 Botões frontais
      [-sw * 0.24, sw * 0.24].forEach((kx) => {
        const knobGeo = new THREE.CylinderGeometry(0.015 * scale, 0.016 * scale, 0.014 * scale, 18);
        knobGeo.rotateX(Math.PI / 2);
        const knob = new THREE.Mesh(knobGeo, darkSkirtMat);
        knob.position.set(kx, bodyCenterY, -sd / 2 - 0.007 * scale);
        stoveGroup.add(knob);
      });

      // Entrada lateral de mangueira GLP em latão
      const nozzleGeo = new THREE.CylinderGeometry(0.006 * scale, 0.006 * scale, 0.020 * scale, 12);
      nozzleGeo.rotateZ(Math.PI / 2);
      const nozzle = new THREE.Mesh(nozzleGeo, brassMat);
      nozzle.position.set(-sw / 2 - 0.009 * scale, bodyCenterY, sd * 0.25);
      stoveGroup.add(nozzle);
    } else {
      // Fogareiro 1 Boca (NTK Duo Ceramik / Frontier / Bistro)
      // Queimador à esquerda (+X na visão traseira)
      addBurnerAssembly(sw * 0.13, 0, 1.0);

      // Compartimento lateral do cartucho Campgás à direita (-X)
      const bayW = sw * 0.26;
      const bayLidGeo = new THREE.BoxGeometry(bayW, 0.008 * scale, sd * 0.80);
      const bayLidMesh = new THREE.Mesh(bayLidGeo, chassisMat);
      bayLidMesh.position.set(-sw * 0.34, bodyTopY + 0.003 * scale, sd * 0.06);
      bayLidMesh.castShadow = true;
      stoveGroup.add(bayLidMesh);
      interactiveMeshes.push(bayLidMesh);

      // Ranhuras de ventilação na tampa do cartucho
      for (let i = -1; i <= 1; i++) {
        const ventGeo = new THREE.BoxGeometry(bayW * 0.55, 0.002 * scale, 0.008 * scale);
        const vent = new THREE.Mesh(ventGeo, darkSkirtMat);
        vent.position.set(-sw * 0.34, bodyTopY + 0.007 * scale, sd * 0.06 + i * 0.025 * scale);
        stoveGroup.add(vent);
      }

      // Painel de controle frontal direito (-X, face -Z)
      const panelGeo = new THREE.BoxGeometry(bayW * 0.96, bodyH * 0.86, 0.006 * scale);
      const panelMesh = new THREE.Mesh(panelGeo, darkSkirtMat);
      panelMesh.position.set(-sw * 0.34, bodyCenterY, -sd / 2 - 0.002 * scale);
      stoveGroup.add(panelMesh);
      interactiveMeshes.push(panelMesh);

      // Knob giratório de ignição Piezoelétrica + controle de chama
      const knobGeo = new THREE.CylinderGeometry(0.017 * scale, 0.019 * scale, 0.015 * scale, 20);
      knobGeo.rotateX(Math.PI / 2);
      const knobMesh = new THREE.Mesh(knobGeo, castIronMat);
      knobMesh.position.set(-sw * 0.31, bodyCenterY + 0.002 * scale, -sd / 2 - 0.009 * scale);
      stoveGroup.add(knobMesh);

      const indicatorGeo = new THREE.BoxGeometry(0.004 * scale, 0.012 * scale, 0.003 * scale);
      const indicator = new THREE.Mesh(indicatorGeo, redAccentMat);
      indicator.position.set(-sw * 0.31, bodyCenterY + 0.008 * scale, -sd / 2 - 0.017 * scale);
      stoveGroup.add(indicator);

      // Alavanca vertical de trava do cartucho (LOCK / UNLOCK)
      const lockSlotGeo = new THREE.BoxGeometry(0.010 * scale, bodyH * 0.55, 0.006 * scale);
      const lockLever = new THREE.Mesh(lockSlotGeo, redAccentMat);
      lockLever.position.set(-sw * 0.41, bodyCenterY, -sd / 2 - 0.006 * scale);
      stoveGroup.add(lockLever);

      // Adaptador lateral em latão dourado Flex Fuel (para mangueira de botijão GLP)
      if (preset.dualFuelAdapter) {
        const adapterNutGeo = new THREE.CylinderGeometry(0.009 * scale, 0.009 * scale, 0.008 * scale, 6);
        adapterNutGeo.rotateZ(Math.PI / 2);
        const adapterNut = new THREE.Mesh(adapterNutGeo, brassMat);
        adapterNut.position.set(-sw / 2 - 0.004 * scale, bodyCenterY, -sd * 0.14);
        stoveGroup.add(adapterNut);

        const nozzleGeo = new THREE.CylinderGeometry(0.0045 * scale, 0.0055 * scale, 0.016 * scale, 12);
        nozzleGeo.rotateZ(Math.PI / 2);
        const nozzle = new THREE.Mesh(nozzleGeo, brassMat);
        nozzle.position.set(-sw / 2 - 0.014 * scale, bodyCenterY, -sd * 0.14);
        stoveGroup.add(nozzle);
      }
    }

    // Metadados para Tooltip 3D e seleção da caixa
    const partData = {
      isAppliance: true,
      isStove: true,
      isInternalBox: true,
      boxId: box.id,
      boxName: box.name,
      boxRoot: container,
      applianceRoot: stoveGroup,
      partLabel: `${preset.name} (${preset.burnersCount} ${preset.burnersCount === 1 ? 'Boca' : 'Bocas'})`,
      name: `${preset.brand} ${preset.model}`,
      category: '🔥 Fogareiro Portátil a Gás (Flex Fuel)',
      power: `${preset.gasConsumptionGh} g/h • ${preset.burnerType}`,
      capacity: `${preset.burnersCount} ${preset.burnersCount === 1 ? 'Boca' : 'Bocas'} • ${preset.fuelType}`,
      dimensions: {
        widthMm: preset.width,
        depthMm: preset.depth,
        heightMm: preset.height
      },
      weightKg: preset.weightKg,
      material: preset.material,
      features: preset.features,
      purpose: `Fogareiro portátil instalado no módulo '${box.name}' (${
        placement === 'top'
          ? 'Sobre o Tampo / Bancada'
          : placement === 'rear_shelf'
            ? 'Sobre a Mesa Traseira Rebatível'
            : 'Interior / Gaveta / Bandeja'
      }). ${preset.ignitionType}.`
    };

    stoveGroup.userData = partData;
    interactiveMeshes.forEach((m) => {
      m.userData = partData;
    });

    // Posicionamento conforme o local escolhido
    if (placement === 'top') {
      stoveGroup.position.set(0, h / 2 + sh / 2 + 0.001, 0);
      container.add(stoveGroup);
    } else if (placement === 'rear_shelf') {
      const rearPivot = targetParent.getObjectByName('RearFoldShelfPivot') as THREE.Group | undefined;
      const isRearShelfOpen = Boolean(rearPivot && Math.abs(rearPivot.rotation.x - Math.PI / 2) < 0.1);
      if (rearPivot && isRearShelfOpen) {
        const shelfTMm = box.panelThickness?.shelf || 18;
        const shelfT = shelfTMm / 1000;
        const shelfH = Math.max(0.15, Math.min(h - 0.04, 0.38));

        const uprightWrapper = new THREE.Group();
        uprightWrapper.name = `StoveRearShelfUpright_${box.id}`;
        uprightWrapper.position.set(0, -shelfH / 2, -shelfT - 0.003 - sh / 2);
        uprightWrapper.rotation.x = -Math.PI / 2;
        uprightWrapper.add(stoveGroup);
        rearPivot.add(uprightWrapper);
      } else {
        // Quando a prateleira traseira está fechada, guarda no interior do módulo
        const bottomY = -h / 2 + sh / 2 + 0.018;
        stoveGroup.position.set(0, bottomY, 0);
        targetParent.add(stoveGroup);
      }
    } else {
      const bottomY = -h / 2 + sh / 2 + 0.018;
      stoveGroup.position.set(0, bottomY, 0);
      targetParent.add(stoveGroup);
    }
  }

  /**
   * Constrói e instala componentes elétricos no interior de um módulo do camper:
   * - Bateria Kingbo LiFePO4 560Ah: estritamente apoiada na base (fundo do móvel), posições na base e rotação 0°/90°
   * - Controlador MPPT 60A, DC-DC B2B e Usina: fixação parafusada nas paredes internas (traseira, dianteira, esquerda, direita) ou base
   * - Inclui parafusos zincados/inox nas abas de fixação para parafusamento realista em compensado naval
   */
}
