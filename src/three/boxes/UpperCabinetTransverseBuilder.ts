import * as THREE from 'three';
import { addPanel } from './BoxGeometryHelpers';
import { UpperCabinetContext } from './UpperCabinetContext';

export class UpperCabinetTransverseBuilder {
  buildTransverseCabinet(ctx: UpperCabinetContext) {
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
      doorT,
      doorTMm,
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
      shelfDoorDiscountM,
      shelfDoorDiscountMm,
      isOpen,
      isSelected,
      innerH,
      interiorBottomY,
      backY,
      hasBasePanel
    } = ctx;

        // --- ARMARIO TRANSVERSAL (FRENTE OU TRASEIRA) ---
        const maxDepthMm = Math.max(Math.round(boxLM * 1000), 1200);
        const depthMm = Math.max(100, Math.min(maxDepthMm, box.upperCabinetDepthMm ?? 250));
        const cabinetDepthM = depthMm / 1000;

        const maxWMm = Math.max(Math.round(boxWM * 1000), 1600);
        const widthMm = Math.max(100, Math.min(maxWMm, box.upperCabinetWidthMm ?? Math.round(boxWM * 1000)));
        const cabinetWidthM = widthMm / 1000;

        let cabinetCenterX = (-boxWM / 2 + cabinetWidthM / 2) + offsetM;
        if (transverseMode === 'beside_box') {
          cabinetCenterX = (besideSide === 'outer')
            ? (-boxWM / 2 - cabinetWidthM / 2 - besideOffsetM)
            : (boxWM / 2 + cabinetWidthM / 2 + besideOffsetM);
        }

        let cabinetCenterZ = side === 'rear'
          ? (-boxLM / 2 + cabinetDepthM / 2 + depthOffsetM)
          : (boxLM / 2 - cabinetDepthM / 2 - depthOffsetM);

        if (positionMode === 'behind_box') {
          cabinetCenterZ = side === 'rear'
            ? (-boxLM / 2 - cabinetDepthM / 2 - behindOffsetM)
            : (boxLM / 2 + cabinetDepthM / 2 + behindOffsetM);
        }

        upperGroup.position.set(cabinetCenterX, cabinetCenterY, cabinetCenterZ);

        const jointStyle = box.upperCabinetJointStyle || 'sides_outside';
        const backCoverMode = box.upperCabinetBackCoverMode || (jointStyle === 'back_over_all' ? 'overlay_all' : 'inset');
        const isBackOverlay = backCoverMode === 'overlay_all' || jointStyle === 'back_over_all';
        const isTopBottomCap = jointStyle === 'top_bottom_cap';

        const innerW = cabinetWidthM - 2 * t;
        const innerD = cabinetDepthM - t;

        // Se o fundo traseiro for sobreposto (overlay_all), ele fecha todas as bordas na face traseira,
        // portanto as laterais, o tampo e a base têm profundidade innerD (cabinetDepthM - t) e deslocam na direção frontal:
        const sideAndCapDepth = isBackOverlay ? innerD : cabinetDepthM;
        const sideAndCapZ = isBackOverlay ? (side === 'rear' ? t / 2 : -t / 2) : 0;

        // Se 'top_bottom_cap' (em cima e embaixo maiores), o tampo e a base têm largura total cabinetWidthM,
        // e as laterais ficam entre o tampo e a base (altura innerH, centradas em backY).
        // Se 'sides_outside' (laterais maiores), as laterais têm altura total cabinetH, e o tampo/base têm largura innerW.
        const sideHeight = isTopBottomCap ? innerH : cabinetH;
        const sideCenterY = isTopBottomCap ? backY : 0;
        const capWidth = isTopBottomCap ? cabinetWidthM : innerW;

        // 1. Lateral Esquerda 15mm
        addPanel(
          upperGroup,
          t,
          sideHeight,
          sideAndCapDepth,
          cabinetWidthM / 2 - t / 2,
          sideCenterY,
          sideAndCapZ,
          cabinetMat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Armário Aéreo (${side}) Lateral Esq. (${Math.round(sideAndCapDepth * 1000)}×${Math.round(sideHeight * 1000)}mm)`,
          cabinetUserData
        );

        // 2. Lateral Direita 15mm
        addPanel(
          upperGroup,
          t,
          sideHeight,
          sideAndCapDepth,
          -cabinetWidthM / 2 + t / 2,
          sideCenterY,
          sideAndCapZ,
          cabinetMat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Armário Aéreo (${side}) Lateral Dir. (${Math.round(sideAndCapDepth * 1000)}×${Math.round(sideHeight * 1000)}mm)`,
          cabinetUserData
        );

        // 3. Tampo Superior 15mm
        addPanel(
          upperGroup,
          capWidth,
          t,
          sideAndCapDepth,
          0,
          cabinetH / 2 - t / 2,
          sideAndCapZ,
          cabinetMat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Armário Aéreo (${side}) Tampo Teto (${Math.round(capWidth * 1000)}×${Math.round(sideAndCapDepth * 1000)}mm)`,
          cabinetUserData
        );

        // 4. Base Inferior 15mm
        if (hasBasePanel) {
          addPanel(
            upperGroup,
            capWidth,
            t,
            sideAndCapDepth,
            0,
            -cabinetH / 2 + t / 2,
            sideAndCapZ,
            cabinetMat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Armário Aéreo (${side}) Base Inferior (${Math.round(capWidth * 1000)}×${Math.round(sideAndCapDepth * 1000)}mm)`,
            cabinetUserData
          );
        }

        // 5. Fundo Traseiro (Embutido nas 4 partes vs Sobreposto fechando as 5 partes)
        const backZ = side === 'rear' ? (-cabinetDepthM / 2 + t / 2) : (cabinetDepthM / 2 - t / 2);
        const backW = isBackOverlay ? cabinetWidthM : innerW;
        const backH = isBackOverlay ? cabinetH : innerH;
        const backPanelY = isBackOverlay ? 0 : backY;
        const backLabel = isBackOverlay
          ? `${box.name} • Armário Aéreo (${side}) Tampo de Fundo Sobreposto (${Math.round(backW * 1000)}×${Math.round(backH * 1000)}mm)`
          : `${box.name} • Armário Aéreo (${side}) Fundo Embutido (${Math.round(backW * 1000)}×${Math.round(backH * 1000)}mm)`;
        addPanel(
          upperGroup,
          backW,
          backH,
          t,
          0,
          backPanelY,
          backZ,
          cabinetMat,
          edgeMat,
          box.id,
          container,
          backLabel,
          cabinetUserData
        );

        // 6. Prateleiras Internas (com desconto frontal para as portas/trilhos e encostadas no fundo)
        if (!isDrawer) {
          const shelfDepthM = Math.max(0.05, innerD - shelfDoorDiscountM);
          const shelfSpacing = innerH / (numShelves + 1);
          // O fundo do armário (face interna) está em:
          // side === 'rear' ? (-cabinetDepthM / 2 + t) : (+cabinetDepthM / 2 - t)
          // A prateleira encosta no fundo e termina recuada da frente por shelfDoorDiscountM.
          // Centro da prateleira no eixo Z:
          const shelfZ = (side === 'rear')
            ? (t - shelfDoorDiscountM) / 2
            : (-t + shelfDoorDiscountM) / 2;

          for (let s = 1; s <= numShelves; s++) {
            const shelfY = interiorBottomY + s * shelfSpacing;
            addPanel(
              upperGroup,
              innerW,
              t,
              shelfDepthM,
              0,
              shelfY,
              shelfZ,
              cabinetMat,
              edgeMat,
              box.id,
              container,
              `${box.name} • Armário Aéreo (${side}) Prateleira #${s} (${Math.round(innerW * 1000)}×${Math.round(shelfDepthM * 1000)}mm)`,
              {
                ...cabinetUserData,
                isUpperCabinetShelf: true,
                shelfIndex: s,
                doorDiscountMm: Math.round(shelfDoorDiscountM * 1000)
              }
            );
          }
        }

        // 7. Fechamento Frontal: Portas de Correr vs Porta Basculante vs Nicho Aberto
        const frontZ = side === 'rear' ? (cabinetDepthM / 2) : (-cabinetDepthM / 2);
        if (isSlidingDoors) {
          // ─── PORTAS DE CORRER BIPARTIDAS (2 FOLHAS CENTRAIS C/ TRILHOS) ───
          const slidingGroup = new THREE.Group();
          slidingGroup.name = `UpperCabinetSlidingDoors_${box.id}_${side}`;

          // Transpasse central padrão (30mm)
          const overlap = 0.030;
          const leafW = (innerW + overlap) / 2;
          const leafH = Math.max(0.08, innerH - 0.008);
          const corridorDir = side === 'rear' ? 1 : -1;
          const centerY = interiorBottomY + innerH / 2;

          const doorUserData = {
            ...cabinetUserData,
            partType: 'door',
            thicknessMm: doorTMm,
            material: `${woodMat} ${doorTMm}mm Impermeabilizado`
          };

          // Posições no eixo transversal X quando fechado:
          // Folha 1 (Esquerda, -X): cobre de -innerW / 2 até +overlap / 2
          const leaf1ClosedX = -innerW / 4 + overlap / 4;
          // Folha 2 (Direita, +X): cobre de -overlap / 2 até +innerW / 2
          const leaf2ClosedX = innerW / 4 - overlap / 4;

          // Posições no eixo Z dos trilhos paralelos (folha 2 externa rente à face do armário, folha 1 interna deslizando por trás):
          // A folha 2 (externa) tem sua face externa exatamente no plano frontZ (rente ao armário):
          const leaf2Z = frontZ - corridorDir * (doorT / 2);
          // A folha 1 (interna) fica recuada para dentro do armário com folga de 2mm para correr livre:
          const leaf1Z = frontZ - corridorDir * (doorT * 1.5 + 0.002);

          // Deslocamento de abertura no trilho:
          // A Folha 2 corre sobre a Folha 1 ao longo da largura (eixo X), liberando a metade direita do armário
          const slideDistanceX = leaf2ClosedX - leaf1ClosedX;
          const leaf2X = isOpen ? (leaf2ClosedX - slideDistanceX) : leaf2ClosedX;

          // ── FOLHA 1 (Esquerda - Trilho Interno) ──
          const leaf1Group = new THREE.Group();
          leaf1Group.name = `UpperCabinetSlidingDoor1_${box.id}_${side}`;
          addPanel(
            leaf1Group,
            leafW,
            leafH,
            doorT,
            leaf1ClosedX,
            centerY,
            leaf1Z,
            cabinetMat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Armário Aéreo (${side}) Porta de Correr (#1) (${Math.round(leafW * 1000)}×${Math.round(leafH * 1000)}mm)`,
            doorUserData
          );

          // Puxador concha embutido náutico Folha 1
          const pullGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.002, 24);
          pullGeo.rotateX(Math.PI / 2);
          const pullMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.2 });
          const pull1Mesh = new THREE.Mesh(pullGeo, pullMat);
          pull1Mesh.position.set(
            leaf1ClosedX - leafW / 2 + 0.05,
            centerY,
            leaf1Z + corridorDir * (doorT / 2 + 0.0005)
          );
          pull1Mesh.userData = {
            isHardware: true,
            partLabel: 'Puxador Concha Embutido Náutico (Folha 1)',
            category: '🔩 Ferragens Marítimas & Camper'
          };
          leaf1Group.add(pull1Mesh);
          slidingGroup.add(leaf1Group);

          // ── FOLHA 2 (Direita - Móvel, corre no Trilho Externo) ──
          const leaf2Group = new THREE.Group();
          leaf2Group.name = `UpperCabinetSlidingDoor2_${box.id}_${side}`;
          addPanel(
            leaf2Group,
            leafW,
            leafH,
            doorT,
            leaf2X,
            centerY,
            leaf2Z,
            cabinetMat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Armário Aéreo (${side}) Porta de Correr (#2) (${Math.round(leafW * 1000)}×${Math.round(leafH * 1000)}mm)`,
            doorUserData
          );

          // Puxador concha embutido náutico Folha 2
          const pull2Mesh = new THREE.Mesh(pullGeo, pullMat);
          pull2Mesh.position.set(
            leaf2X + leafW / 2 - 0.05,
            centerY,
            leaf2Z + corridorDir * (doorT / 2 + 0.0005)
          );
          pull2Mesh.userData = {
            isHardware: true,
            partLabel: 'Puxador Concha Embutido Náutico (Folha 2)',
            category: '🔩 Ferragens Marítimas & Camper'
          };
          leaf2Group.add(pull2Mesh);

          // Trava Náutica Trava-Porta de Correr
          const lockGeo = new THREE.BoxGeometry(0.016, 0.020, 0.008);
          const lockMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
          const lockMesh = new THREE.Mesh(lockGeo, lockMat);
          lockMesh.position.set(
            leaf2X - leafW / 2 + 0.02,
            centerY - leafH / 2 + 0.03,
            leaf2Z + corridorDir * (doorT / 2 + 0.004)
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
            const trackGeo = new THREE.BoxGeometry(innerW, trackThickness, trackDepth);
            const trackMesh = new THREE.Mesh(trackGeo, trackMat);
            trackMesh.position.set(0, trackY, frontZ - corridorDir * (trackDepth / 2));
            trackMesh.userData = {
              isHardware: true,
              partLabel: `Trilho Duplo Alumínio para Portas de Correr (${dirY === 1 ? 'Superior' : 'Inferior'})`,
              category: '🔩 Ferragens Marítimas & Camper'
            };
            slidingGroup.add(trackMesh);
          });

          upperGroup.add(slidingGroup);
        } else if (hasDoors) {
          const doorW = cabinetWidthM - 0.006;
          const doorH = cabinetH - 0.006;
          const doorZ = frontZ + (side === 'rear' ? doorT / 2 : -doorT / 2);

          // Eixo pivotante superior para porta basculante (abertura típica de motorhome/campervan para cima)
          const doorPivot = new THREE.Group();
          doorPivot.name = `UpperCabinetDoorPivot_${box.id}_${side}`;
          doorPivot.position.set(0, cabinetH / 2, doorZ);

          const openAngle = Math.PI * 0.42; // ~75 graus basculante para cima
          if (isOpen) {
            // Se o armário está na traseira (-Z), abrir para dentro da van (+Z) requer rotX negativo
            // Se está na frente (+Z), abrir para trás (-Z) requer rotX positivo
            doorPivot.rotation.x = side === 'rear' ? -openAngle : openAngle;
          }

          addPanel(
            doorPivot,
            doorW,
            doorH,
            doorT,
            0,
            -doorH / 2,
            0,
            cabinetMat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Armário Aéreo (${side}) Porta c/ Trava (${Math.round(doorW * 1000)}×${Math.round(doorH * 1000)}×${doorTMm}mm)`,
            {
              ...cabinetUserData,
              partType: 'door',
              thicknessMm: doorTMm,
              material: `${woodMat} ${doorTMm}mm Impermeabilizado`
            }
          );

          // Dobradiça superior contínua / articulador
          const hingeGeo = new THREE.CylinderGeometry(0.005, 0.005, doorW * 0.94, 12);
          hingeGeo.rotateZ(Math.PI / 2);
          const hingeMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            metalness: 0.85,
            roughness: 0.25
          });
          const hingeMesh = new THREE.Mesh(hingeGeo, hingeMat);
          hingeMesh.position.set(0, 0, 0);
          hingeMesh.userData = { isHardware: true, partLabel: 'Dobradiça Articulador Superior para Aéreo', category: '🔩 Ferragens Marítimas & Camper' };
          doorPivot.add(hingeMesh);

          // Botão Push-Lock Náutico na parte inferior da porta
          const knobGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.018, 20);
          knobGeo.rotateX(Math.PI / 2);
          const knobMat = new THREE.MeshStandardMaterial({
            color: 0xe2e8f0,
            metalness: 0.95,
            roughness: 0.15
          });
          const knobMesh = new THREE.Mesh(knobGeo, knobMat);
          knobMesh.position.set(
            cabinetWidthM / 2 - 0.05,
            -doorH + 0.04,
            side === 'rear' ? (doorT / 2 + 0.009) : (-doorT / 2 - 0.009)
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
            innerW,
            lipH,
            t,
            0,
            lipY,
            frontZ + (side === 'rear' ? -t / 2 : t / 2),
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
