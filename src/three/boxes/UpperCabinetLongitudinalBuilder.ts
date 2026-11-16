import * as THREE from 'three';
import { addPanel } from './BoxGeometryHelpers';
import { UpperCabinetContext } from './UpperCabinetContext';

export class UpperCabinetLongitudinalBuilder {
  buildLongitudinalCabinet(ctx: UpperCabinetContext) {
    const {
      container,
      upperGroup,
      box,
      side,
      boxWM,
      boxLM,
      cabinetH,
      cabinetCenterY,
      t,
      tMm,
      woodMat,
      cabinetUserData,
      cabinetMat,
      edgeMat,
      offsetM,
      depthOffsetM,
      positionMode,
      behindOffsetM,
      transverseMode,
      besideSide,
      besideOffsetM,
      closure,
      hasDoors,
      isSlidingDoors,
      isDrawer,
      numShelves,
      isOpen,
      isSelected,
      innerH,
      interiorBottomY,
      backY,
      hasBasePanel
    } = ctx;

    // --- ARMARIO LONGITUDINAL (LATERAL ESQUERDA OU LATERAL DIREITA) ---
    // Profundidade (avanço da parede para o centro da van, eixo X):
    const maxDepthMm = Math.max(Math.round(boxWM * 1000), 1000);
    const depthMm = Math.max(100, Math.min(maxDepthMm, box.upperCabinetDepthMm ?? 250));
    const cabinetDepthM = depthMm / 1000;

    // Comprimento útil ao longo da van (eixo Z):
    const maxLMm = Math.max(Math.round(boxLM * 1000), 1800);
    const lengthMm = Math.max(100, Math.min(maxLMm, box.upperCabinetWidthMm ?? Math.round(boxLM * 1000)));
    const cabinetLengthM = lengthMm / 1000;

    let cabinetCenterX = side === 'left'
      ? (boxWM / 2 - cabinetDepthM / 2 - depthOffsetM)
      : (-boxWM / 2 + cabinetDepthM / 2 + depthOffsetM);

    if (transverseMode === 'beside_box') {
      if (side === 'left') {
        // Face lateral esquerda (+X). O corredor fica em -X (além da face interna -boxWM/2):
        cabinetCenterX = (besideSide === 'outer')
          ? (boxWM / 2 + cabinetDepthM / 2 + besideOffsetM)
          : (-boxWM / 2 - cabinetDepthM / 2 - besideOffsetM);
      } else {
        // Face lateral direita (-X). O corredor fica em +X (além da face interna +boxWM/2):
        cabinetCenterX = (besideSide === 'outer')
          ? (-boxWM / 2 - cabinetDepthM / 2 - besideOffsetM)
          : (boxWM / 2 + cabinetDepthM / 2 + besideOffsetM);
      }
    }

    // Ponto de início longitudinal com recuo:
    // Se positionMode === 'behind_box', posiciona ATRÁS do móvel (em direção à traseira / porta-malas, eixo -Z):
    // Se positionMode === 'on_box', fica delimitado sobre a caixa (entre o início e o fim).
    let cabinetCenterZ = (-boxLM / 2 + cabinetLengthM / 2) + offsetM;
    if (positionMode === 'behind_box') {
      // A face frontal do aéreo encosta na face traseira da caixa base (-boxLM / 2) menos o recuo para trás
      cabinetCenterZ = (-boxLM / 2 - cabinetLengthM / 2) - behindOffsetM;
    }

    upperGroup.position.set(cabinetCenterX, cabinetCenterY, cabinetCenterZ);

    const innerL = cabinetLengthM - 2 * t;
    const innerD = cabinetDepthM - t;

    // 1. Fechamento Traseiro (-Z) 15mm
    addPanel(
      upperGroup,
      cabinetDepthM,
      cabinetH,
      t,
      0,
      0,
      -cabinetLengthM / 2 + t / 2,
      cabinetMat,
      edgeMat,
      box.id,
      container,
      `${box.name} • Armário Aéreo (${side}) Fechamento Traseiro (${Math.round(cabinetDepthM * 1000)}×${Math.round(cabinetH * 1000)}mm)`,
      cabinetUserData
    );

    // 2. Fechamento Dianteiro (+Z) 15mm
    addPanel(
      upperGroup,
      cabinetDepthM,
      cabinetH,
      t,
      0,
      0,
      cabinetLengthM / 2 - t / 2,
      cabinetMat,
      edgeMat,
      box.id,
      container,
      `${box.name} • Armário Aéreo (${side}) Fechamento Frontal (${Math.round(cabinetDepthM * 1000)}×${Math.round(cabinetH * 1000)}mm)`,
      cabinetUserData
    );

    // 3. Tampo Superior (Teto) 15mm
    addPanel(
      upperGroup,
      cabinetDepthM,
      t,
      innerL,
      0,
      cabinetH / 2 - t / 2,
      0,
      cabinetMat,
      edgeMat,
      box.id,
      container,
      `${box.name} • Armário Aéreo (${side}) Tampo Teto (${Math.round(cabinetDepthM * 1000)}×${Math.round(innerL * 1000)}mm)`,
      cabinetUserData
    );

    // 4. Base Inferior 15mm
    if (hasBasePanel) {
      addPanel(
        upperGroup,
        cabinetDepthM,
        t,
        innerL,
        0,
        -cabinetH / 2 + t / 2,
        0,
        cabinetMat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Armário Aéreo (${side}) Base Inferior (${Math.round(cabinetDepthM * 1000)}×${Math.round(innerL * 1000)}mm)`,
        cabinetUserData
      );
    }

    // 5. Fundo encostado na lataria lateral (X)
    const backX = side === 'left' ? (cabinetDepthM / 2 - t / 2) : (-cabinetDepthM / 2 + t / 2);
    addPanel(
      upperGroup,
      t,
      innerH,
      innerL,
      backX,
      backY,
      0,
      cabinetMat,
      edgeMat,
      box.id,
      container,
      `${box.name} • Armário Aéreo (${side}) Fundo (${Math.round(innerL * 1000)}×${Math.round(innerH * 1000)}mm)`,
      cabinetUserData
    );

    // 6. Prateleiras Internas (apenas para armário convencional com porta ou nicho aberto)
    if (!isDrawer) {
      const shelfSpacing = innerH / (numShelves + 1);
      for (let s = 1; s <= numShelves; s++) {
        const shelfY = interiorBottomY + s * shelfSpacing;
        addPanel(
          upperGroup,
          innerD - 0.01,
          t,
          innerL,
          side === 'left' ? -0.005 : 0.005,
          shelfY,
          0,
          cabinetMat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Armário Aéreo (${side}) Prateleira #${s} (${Math.round(innerD * 1000)}×${Math.round(innerL * 1000)}mm)`,
          cabinetUserData
        );
      }
    }

    // 7. Fechamento Frontal: Portas de Correr vs Porta Basculante vs Nicho Aberto
    const frontX = side === 'left' ? (-cabinetDepthM / 2) : (cabinetDepthM / 2);
    if (isSlidingDoors) {
      // ─── PORTAS DE CORRER BIPARTIDAS (2 FOLHAS CENTRAIS C/ TRILHOS) ───
      const slidingGroup = new THREE.Group();
      slidingGroup.name = `UpperCabinetSlidingDoors_${box.id}_${side}`;

      // Transpasse central padrão (30mm)
      const overlap = 0.030;
      const leafL = (innerL + overlap) / 2;
      const leafH = Math.max(0.08, innerH - 0.008);
      const doorT = 0.006; // 6mm compensado/acrílico/MDF leve para porta de correr
      const corridorDir = side === 'left' ? -1 : 1;
      const centerY = interiorBottomY + innerH / 2;

      const doorUserData = {
        ...cabinetUserData,
        thicknessMm: 6,
        material: `${woodMat} 6mm Impermeabilizado`
      };

      // Posições no eixo longitudinal Z quando fechado:
      // Folha 1 (Traseira, -Z): cobre de -innerL / 2 até +overlap / 2
      const leaf1ClosedZ = -innerL / 4 + overlap / 4;
      // Folha 2 (Dianteira, +Z): cobre de -overlap / 2 até +innerL / 2
      const leaf2ClosedZ = innerL / 4 - overlap / 4;

      // Posições no eixo X dos trilhos paralelos (folha 2 externa rente à face do armário, folha 1 interna deslizando por trás):
      // A folha 2 (externa) tem sua face externa exatamente no plano frontX (rente ao armário):
      const leaf2X = frontX - corridorDir * (doorT / 2);
      // A folha 1 (interna) fica recuada para dentro do armário com folga de 2mm para correr livre:
      const leaf1X = frontX - corridorDir * (doorT * 1.5 + 0.002);

      // Deslocamento de abertura no trilho:
      // A Folha 2 corre sobre a Folha 1 ao longo do comprimento (eixo Z), liberando a metade frontal do armário
      const slideDistanceZ = leaf2ClosedZ - leaf1ClosedZ;
      const leaf2Z = isOpen ? (leaf2ClosedZ - slideDistanceZ) : leaf2ClosedZ;

      // ── FOLHA 1 (Traseira - Trilho Interno) ──
      const leaf1Group = new THREE.Group();
      leaf1Group.name = `UpperCabinetSlidingDoor1_${box.id}_${side}`;
      addPanel(
        leaf1Group,
        doorT,
        leafH,
        leafL,
        leaf1X,
        centerY,
        leaf1ClosedZ,
        cabinetMat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Armário Aéreo (${side}) Porta de Correr (#1) (${Math.round(leafL * 1000)}×${Math.round(leafH * 1000)}mm)`,
        doorUserData
      );

      // Puxador concha embutido náutico Folha 1
      const pullGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.002, 24);
      pullGeo.rotateZ(Math.PI / 2);
      const pullMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.2 });
      const pull1Mesh = new THREE.Mesh(pullGeo, pullMat);
      pull1Mesh.position.set(
        leaf1X + corridorDir * (doorT / 2 + 0.0005),
        centerY,
        leaf1ClosedZ - leafL / 2 + 0.05
      );
      pull1Mesh.userData = {
        isHardware: true,
        partLabel: 'Puxador Concha Embutido Náutico (Folha 1)',
        category: '🔩 Ferragens Marítimas & Camper'
      };
      leaf1Group.add(pull1Mesh);
      slidingGroup.add(leaf1Group);

      // ── FOLHA 2 (Dianteira - Móvel, corre no Trilho Externo) ──
      const leaf2Group = new THREE.Group();
      leaf2Group.name = `UpperCabinetSlidingDoor2_${box.id}_${side}`;
      addPanel(
        leaf2Group,
        doorT,
        leafH,
        leafL,
        leaf2X,
        centerY,
        leaf2Z,
        cabinetMat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Armário Aéreo (${side}) Porta de Correr (#2) (${Math.round(leafL * 1000)}×${Math.round(leafH * 1000)}mm)`,
        doorUserData
      );

      // Puxador concha embutido náutico Folha 2
      const pull2Mesh = new THREE.Mesh(pullGeo, pullMat);
      pull2Mesh.position.set(
        leaf2X + corridorDir * (doorT / 2 + 0.0005),
        centerY,
        leaf2Z + leafL / 2 - 0.05
      );
      pull2Mesh.userData = {
        isHardware: true,
        partLabel: 'Puxador Concha Embutido Náutico (Folha 2)',
        category: '🔩 Ferragens Marítimas & Camper'
      };
      leaf2Group.add(pull2Mesh);

      // Trava Náutica Trava-Porta de Correr
      const lockGeo = new THREE.BoxGeometry(0.008, 0.020, 0.016);
      const lockMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
      const lockMesh = new THREE.Mesh(lockGeo, lockMat);
      lockMesh.position.set(
        leaf2X + corridorDir * (doorT / 2 + 0.004),
        centerY - leafH / 2 + 0.03,
        leaf2Z - leafL / 2 + 0.02
      );
      lockMesh.userData = {
        isHardware: true,
        partLabel: 'Trava Náutica para Porta de Correr (Anti-Abertura)',
        category: '🔩 Ferragens Marítimas & Camper'
      };
      leaf2Group.add(lockMesh);
      slidingGroup.add(leaf2Group);

      // Trilho Duplo Superior e Inferior em Alumínio Anodizado
      const trackMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.25 });
      const trackThickness = 0.008;
      const trackDepth = doorT * 2 + 0.004;
      [-1, 1].forEach((dirY) => {
        const trackY = dirY === 1 ? (cabinetH / 2 - t - trackThickness / 2) : (interiorBottomY + trackThickness / 2);
        const trackGeo = new THREE.BoxGeometry(trackDepth, trackThickness, innerL);
        const trackMesh = new THREE.Mesh(trackGeo, trackMat);
        trackMesh.position.set(frontX - corridorDir * (trackDepth / 2), trackY, 0);
        trackMesh.userData = {
          isHardware: true,
          partLabel: `Trilho Duplo Alumínio para Portas de Correr (${dirY === 1 ? 'Superior' : 'Inferior'})`,
          category: '🔩 Ferragens Marítimas & Camper'
        };
        slidingGroup.add(trackMesh);
      });

      upperGroup.add(slidingGroup);
    } else if (hasDoors) {
      const doorL = cabinetLengthM - 0.006;
      const doorH = cabinetH - 0.006;
      const doorX = frontX + (side === 'left' ? -t / 2 : t / 2);

      // Eixo pivotante superior para porta basculante
      const doorPivot = new THREE.Group();
      doorPivot.name = `UpperCabinetDoorPivot_${box.id}_${side}`;
      doorPivot.position.set(doorX, cabinetH / 2, 0);

      const openAngle = Math.PI * 0.42; // ~75 graus basculante para cima
      if (isOpen) {
        // Se o armário está no lado esquerdo (+X), abrir para o corredor (-X) requer rotZ negativo
        // Se está no lado direito (-X), abrir para o corredor (+X) requer rotZ positivo
        doorPivot.rotation.z = side === 'left' ? -openAngle : openAngle;
      }

      addPanel(
        doorPivot,
        t,
        doorH,
        doorL,
        0,
        -doorH / 2,
        0,
        cabinetMat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Armário Aéreo (${side}) Porta c/ Trava (${Math.round(doorL * 1000)}×${Math.round(doorH * 1000)}mm)`,
        cabinetUserData
      );

      // Dobradiça articuladora superior contínua
      const hingeGeo = new THREE.CylinderGeometry(0.005, 0.005, doorL * 0.94, 12);
      hingeGeo.rotateX(Math.PI / 2);
      const hingeMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.85,
        roughness: 0.25
      });
      const hingeMesh = new THREE.Mesh(hingeGeo, hingeMat);
      hingeMesh.position.set(0, 0, 0);
      hingeMesh.userData = { isHardware: true, partLabel: 'Dobradiça Articulador Superior para Aéreo', category: '🔩 Ferragens Marítimas & Camper' };
      doorPivot.add(hingeMesh);

      // Botão Push-Lock Náutico apontando em X na parte inferior da porta
      const knobGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.018, 20);
      knobGeo.rotateZ(Math.PI / 2);
      const knobMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.95,
        roughness: 0.15
      });
      const knobMesh = new THREE.Mesh(knobGeo, knobMat);
      knobMesh.position.set(
        side === 'left' ? (-t / 2 - 0.009) : (t / 2 + 0.009),
        -doorH + 0.04,
        cabinetLengthM / 2 - 0.05
      );
      knobMesh.userData = {
        isHardware: true,
        partLabel: 'Botão Trava Push-Lock Náutico Cromado',
        category: '🔩 Ferragens Marítimas & Camper'
      };
      doorPivot.add(knobMesh);

      upperGroup.add(doorPivot);
    } else {
      const lipH = 0.025;
      const lipY = interiorBottomY + lipH / 2;
      addPanel(
        upperGroup,
        t,
        lipH,
        innerL,
        frontX + (side === 'left' ? t / 2 : -t / 2),
        lipY,
        0,
        cabinetMat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Armário Aéreo (${side}) Friso Anti-Queda (25mm)`,
        cabinetUserData
      );
    }
  }
}
