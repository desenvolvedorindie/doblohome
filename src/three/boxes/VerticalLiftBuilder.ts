import * as THREE from 'three';
import { InternalBoxItem, LiftMechanismType } from '../../types';
import {
  getBoxThickness,
  getWoodMaterialName,
  getUpperCabinetExclusionZones,
  addPerforatedPanel,
  addPanel,
  buildHollowBox
} from './BoxGeometryHelpers';

export class VerticalLiftBuilder {
  buildVerticalLiftModule(
    container: THREE.Group,
    w: number,
    l: number,
    h: number,
    mat: THREE.Material,
    box: InternalBoxItem,
    isSelected: boolean,
    isOpen: boolean
  ) {
    const tConfig = getBoxThickness(box);
    const tTop = tConfig.top;
    const tTopMm = Math.round(tTop * 1000);
    const woodMat = getWoodMaterialName(box.material);

    const edgeMat = new THREE.LineBasicMaterial({
      color: isSelected ? 0x38bdf8 : 0x78350f,
      linewidth: 1,
      transparent: true,
      opacity: 0.6
    });

    const hasTop = box.panels?.top ?? true;
    const hasBottom = box.panels?.bottom ?? false;
    const tBottom = hasBottom ? tConfig.bottom : 0;
    const baseInsideHeight = Math.max(0.05, h - (hasTop ? tTop : 0) - (hasBottom ? tBottom : 0));

    // Regra técnica do pistão industrial (DIN 71805 / Stabilus):
    // A haste não pode estender mais do que o curso útil que fica alojado dentro do cilindro fechado.
    const closedSpanM = Math.max(0.06, baseInsideHeight - 0.050);
    const cylLenM = Math.max(0.05, closedSpanM - 0.052);
    const maxPistonStrokeM = Math.max(0.03, cylLenM - 0.020);
    const maxLiftDist = Math.min(h, maxPistonStrokeM);
    const configuredLift = (box.liftHeightMm !== undefined ? box.liftHeightMm : Math.min(250, Math.round(maxLiftDist * 1000))) / 1000;
    const liftDist = isOpen ? Math.max(0.03, Math.min(maxLiftDist, configuredLift)) : 0;
    const mechanism: LiftMechanismType = box.liftMechanism === 'telescopic' ? 'telescopic' : 'pantograph';

    // 1. Corpo inferior oco feito com paredes de madeira (descontando o tampo móvel superior)
    const bodyHeight = Math.max(0.05, h - (hasTop ? tTop : 0));
    const bodyGroup = new THREE.Group();
    bodyGroup.name = 'VerticalLiftBaseBody';
    bodyGroup.position.set(0, hasTop ? -tTop / 2 : 0, 0);
    buildHollowBox(
      bodyGroup,
      w,
      bodyHeight,
      l,
      tConfig.default,
      mat,
      edgeMat,
      false,
      box.id,
      container,
      { ...box.panels, top: false },
      box.name,
      box
    );
    container.add(bodyGroup);

    // 2. Materiais metálicos para as barras de ferro e ferragens de elevação
    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Aço carbono escuro / ferro estrutural
      metalness: 0.88,
      roughness: 0.32
    });

    const ironHighlightMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Ferro usinado / guias
      metalness: 0.82,
      roughness: 0.38
    });

    const chromeRodMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Haste interna de elevação / aço galvanizado
      metalness: 0.95,
      roughness: 0.16
    });

    const boltMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1, // Parafusos e pinos de articulação
      metalness: 0.9,
      roughness: 0.2
    });

    const gasStrutMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Corpo do pistão a gás
      metalness: 0.7,
      roughness: 0.4
    });

    // Dimensões internas livres do módulo
    const innerW = Math.max(0.06, w - tConfig.left - tConfig.right);
    const innerL = Math.max(0.06, l - tConfig.front - tConfig.rear);
    const innerBottomY = -h / 2 + (hasBottom ? tConfig.bottom : 0);
    const baseTopY = h / 2 - (hasTop ? tTop : 0);

    // Grupo do mecanismo interno de ferro
    const metalMechanismGroup = new THREE.Group();
    metalMechanismGroup.name = 'VerticalLiftIronBarsMechanism';
    container.add(metalMechanismGroup);

    // 3. Colunas de Ferro Telescópicas Tubulares nos 4 cantos internos (somente no modo 'telescopic')
    if (mechanism === 'telescopic') {
      const sleeveW = 0.024; // Barra de ferro tubular 25x25mm (manga fixa)
      const sleeveH = Math.max(0.05, baseInsideHeight - 0.012);
      const rodW = 0.018;    // Barra/haste interna telescópica 18x18mm

      // Folga mínima de 1.5mm para encostar perfeitamente rente às quinas internas da caixa
      const cornerClearance = 0.0015;
      const postXOffsets = [
        -innerW / 2 + sleeveW / 2 + cornerClearance,
        innerW / 2 - sleeveW / 2 - cornerClearance
      ];
      const postZOffsets = [
        -innerL / 2 + sleeveW / 2 + cornerClearance,
        innerL / 2 - sleeveW / 2 - cornerClearance
      ];

      const cornerLabels = [
        'Quina Traseira Direita',
        'Quina Frente Direita',
        'Quina Traseira Esquerda',
        'Quina Frente Esquerda'
      ];
      let cornerIdx = 0;

      for (const cx of postXOffsets) {
        for (const cz of postZOffsets) {
          const cornerName = cornerLabels[cornerIdx++] || 'Quina';

          // A) Manga de ferro exterior fixa na base (bem na quina)
          const sleeveGeo = new THREE.BoxGeometry(sleeveW, sleeveH, sleeveW);
          const sleeveMesh = new THREE.Mesh(sleeveGeo, ironMat);
          const sleeveY = innerBottomY + sleeveH / 2 + 0.004;
          sleeveMesh.position.set(cx, sleeveY, cz);
          sleeveMesh.castShadow = true;
          sleeveMesh.receiveShadow = true;
          sleeveMesh.userData = {
            isHardware: true,
            isBar: true,
            barLabel: `${box.name} • Coluna Guia de Ferro 25x25mm (${cornerName})`,
            material: 'Aço Carbono / Ferro Tubo Quadrado 25×25mm Estrutural',
            moduleName: box.name
          };
          metalMechanismGroup.add(sleeveMesh);

          // Cantoneira de fixação angular 90° em chapa de aço que abraça o tubo na quina
          const bracketThick = 0.002;
          const bracketH = Math.min(0.04, sleeveH * 0.25);
          const bracketW = sleeveW + 0.008;

          // Aba contra a parede frontal/traseira (eixo Z)
          const bracketZGeo = new THREE.BoxGeometry(bracketW, bracketH, bracketThick);
          const bracketZMesh = new THREE.Mesh(bracketZGeo, ironHighlightMat);
          const signZ = cz > 0 ? 1 : -1;
          bracketZMesh.position.set(cx, innerBottomY + bracketH / 2 + 0.003, cz + signZ * (sleeveW / 2 + bracketThick / 2));
          metalMechanismGroup.add(bracketZMesh);

          // Aba contra a parede lateral (eixo X)
          const bracketXGeo = new THREE.BoxGeometry(bracketThick, bracketH, bracketW);
          const bracketXMesh = new THREE.Mesh(bracketXGeo, ironHighlightMat);
          const signX = cx > 0 ? 1 : -1;
          bracketXMesh.position.set(cx + signX * (sleeveW / 2 + bracketThick / 2), innerBottomY + bracketH / 2 + 0.003, cz);
          metalMechanismGroup.add(bracketXMesh);

          // Sapata inferior horizontal de ancoragem metálica
          const flangeGeo = new THREE.BoxGeometry(sleeveW + 0.008, 0.004, sleeveW + 0.008);
          const flangeMesh = new THREE.Mesh(flangeGeo, ironHighlightMat);
          flangeMesh.position.set(cx, innerBottomY + 0.002, cz);
          metalMechanismGroup.add(flangeMesh);

          // B) Haste telescópica interna de ferro que sobe acompanhando o tampo
          const currentRodLen = sleeveH * 0.75 + liftDist;
          const rodGeo = new THREE.BoxGeometry(rodW, currentRodLen, rodW);
          const rodMesh = new THREE.Mesh(rodGeo, chromeRodMat);
          const rodTopY = baseTopY + liftDist;
          const rodCenterY = rodTopY - currentRodLen / 2;
          rodMesh.position.set(cx, rodCenterY, cz);
          rodMesh.castShadow = true;
          rodMesh.receiveShadow = true;
          rodMesh.userData = {
            isHardware: true,
            isBar: true,
            barLabel: `${box.name} • Barra de Ferro Telescópica Guia (${cornerName})`,
            material: 'Aço Galvanizado 18×18mm c/ Bucha Guia',
            moduleName: box.name
          };
          metalMechanismGroup.add(rodMesh);

          // Flange superior de fixação sob o tampo elevatório
          const topFlangeGeo = new THREE.BoxGeometry(sleeveW + 0.008, 0.004, sleeveW + 0.008);
          const topFlangeMesh = new THREE.Mesh(topFlangeGeo, boltMat);
          topFlangeMesh.position.set(cx, rodTopY - 0.002, cz);
          metalMechanismGroup.add(topFlangeMesh);
        }
      }
    }

    // 4. Mecanismo Pantográfico de Barras de Ferro em X (somente no modo 'pantograph')
    if (mechanism === 'pantograph') {
      const pantographSides = [-innerW / 2 + 0.02, innerW / 2 - 0.02];
      const spanZ = Math.max(0.12, innerL * 0.65);
      const ironBarThick = 0.006; // Espessura da barra chata de ferro (6mm)
      const ironBarHeight = 0.025; // Largura nominal da barra chata (25mm)

      const pivotBottomY = innerBottomY + 0.03;
      const pivotTopY = baseTopY + liftDist - 0.01;
      const verticalGap = Math.max(0.04, pivotTopY - pivotBottomY);
      const scissorCenterY = (pivotBottomY + pivotTopY) / 2;

      // Comprimento da barra pantográfica diagonal
      const barLen = Math.hypot(spanZ, verticalGap);
      const angle = Math.atan2(verticalGap, spanZ);

      pantographSides.forEach((px, sIdx) => {
        const sideLabel = sIdx === 0 ? 'Lateral Direita' : 'Lateral Esquerda';

        // Barra diagonal 1 (frente-baixo para trás-cima)
        const bar1Geo = new THREE.BoxGeometry(ironBarThick, ironBarHeight, barLen);
        const bar1Mesh = new THREE.Mesh(bar1Geo, ironMat);
        bar1Mesh.position.set(px, scissorCenterY, 0);
        bar1Mesh.rotation.x = angle;
        bar1Mesh.castShadow = true;
        bar1Mesh.userData = {
          isHardware: true,
          isBar: true,
          barLabel: `${box.name} • Barra de Ferro Pantográfica em X (${sideLabel} #1)`,
          material: 'Barra Chata de Ferro Estrutural 25×6mm',
          moduleName: box.name
        };
        metalMechanismGroup.add(bar1Mesh);

        // Barra diagonal 2 (trás-baixo para frente-cima)
        const bar2Geo = new THREE.BoxGeometry(ironBarThick, ironBarHeight, barLen);
        const bar2Mesh = new THREE.Mesh(bar2Geo, ironHighlightMat);
        // Desloca ligeiramente em X para as duas barras cruzarem sem sobrepor no mesmo plano
        bar2Mesh.position.set(px + (sIdx === 0 ? ironBarThick : -ironBarThick), scissorCenterY, 0);
        bar2Mesh.rotation.x = -angle;
        bar2Mesh.castShadow = true;
        bar2Mesh.userData = {
          isHardware: true,
          isBar: true,
          barLabel: `${box.name} • Barra de Ferro Pantográfica em X (${sideLabel} #2)`,
          material: 'Barra Chata de Ferro Estrutural 25×6mm',
          moduleName: box.name
        };
        metalMechanismGroup.add(bar2Mesh);

        // Pino central de articulação metálico com arruela
        const pinGeo = new THREE.CylinderGeometry(0.007, 0.007, ironBarThick * 3.5, 16);
        pinGeo.rotateZ(Math.PI / 2);
        const pinMesh = new THREE.Mesh(pinGeo, boltMat);
        pinMesh.position.set(px + (sIdx === 0 ? ironBarThick / 2 : -ironBarThick / 2), scissorCenterY, 0);
        metalMechanismGroup.add(pinMesh);

        // Trilhos / Guias horizontais de aço nas extremidades da tesoura
        const railLen = spanZ + 0.04;
        const railGeo = new THREE.BoxGeometry(0.015, 0.008, railLen);
        const railBottom = new THREE.Mesh(railGeo, ironMat);
        railBottom.position.set(px, pivotBottomY, 0);
        metalMechanismGroup.add(railBottom);

        const railTop = new THREE.Mesh(railGeo, ironMat);
        railTop.position.set(px, pivotTopY, 0);
        metalMechanismGroup.add(railTop);
      });
    }

    // 5. Pistões a Gás Verticais conforme Desenho Técnico Industrial (DIN 71805 / Stabilus LIFT-O-MAT)
    const gasStrutTubeMat = new THREE.MeshStandardMaterial({
      color: 0x090d16, // Pintura epóxi automotiva preta acetinada
      metalness: 0.55,
      roughness: 0.35
    });
    const gasStrutSealMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Colar retentor e bucha usinada em alumínio/inox
      metalness: 0.92,
      roughness: 0.15
    });
    const gasStrutLabelMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1, // Faixa técnica serigrafada prateada
      metalness: 0.75,
      roughness: 0.25
    });
    const gasStrutRodMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Haste de precisão cromo-duro retificada espelhada
      metalness: 0.98,
      roughness: 0.05
    });
    const ballJointMat = new THREE.MeshStandardMaterial({
      color: 0x64748b, // Terminal de rótula esférica fundida DIN 71805
      metalness: 0.85,
      roughness: 0.28
    });
    const bracketMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Sapata angular estampada 90° em aço zincado
      metalness: 0.82,
      roughness: 0.32
    });

    const strutSides = [-innerW / 2 + 0.020, innerW / 2 - 0.020];
    const strutZ = 0; // 100% vertical no centro longitudinal (sem inclinação/rotação torta)

    strutSides.forEach((sx, sIdx) => {
      const isRightSide = sIdx === 0;
      const wallX = isRightSide ? -innerW / 2 : innerW / 2;
      const normalX = isRightSide ? 1 : -1; // Aponta da parede para o centro da caixa

      const yBottom = innerBottomY + 0.035;
      const yTopClosed = baseTopY - 0.015;
      const closedDist = Math.max(0.08, yTopClosed - yBottom);
      const cylLen = Math.max(0.06, closedDist - 0.052);

      // Regra técnica de extensão: o curso da haste não pode exceder o comprimento que cabe dentro do cilindro
      const maxStroke = Math.max(0.03, cylLen - 0.020);
      const safeLiftDist = Math.min(liftDist, maxStroke);

      const rodVisLen = 0.015 + safeLiftDist; // Haste cromo-duro exposta fora da camisa
      const rodInsideLen = Math.max(0.020, cylLen - safeLiftDist); // Guia que permanece apoiada dentro da camisa
      const rodTotalLen = rodVisLen + rodInsideLen;

      // Distância exata entre eixos dos pinos esféricos
      const totalH = 0.052 + cylLen + safeLiftDist;

      const strutGroup = new THREE.Group();
      strutGroup.name = 'GasStrutAssembly';
      strutGroup.position.set(sx, yBottom, strutZ);

      // (A) Sapata de Ancoragem Inferior (Chapa estampada 90° em aço zincado contra a parede lateral)
      const bracketThick = 0.0025;
      const baseBracketPlate = new THREE.Mesh(
        new THREE.BoxGeometry(bracketThick, 0.038, 0.032),
        bracketMat
      );
      // Encostada rente à face interna da parede de madeira
      baseBracketPlate.position.set(wallX - sx + normalX * bracketThick / 2, 0, 0);
      strutGroup.add(baseBracketPlate);

      // Parafusos philips de fixação da sapata inferior
      [-0.010, 0.010].forEach((pz) => {
        const screwHead = new THREE.Mesh(
          new THREE.CylinderGeometry(0.0022, 0.0022, 0.0015, 12),
          boltMat
        );
        screwHead.rotateZ(Math.PI / 2);
        screwHead.position.set(wallX - sx + normalX * (bracketThick + 0.0008), 0.008, pz);
        strutGroup.add(screwHead);
      });

      // Pino esférico inferior horizontal (Ball stud DIN 71803) que sai da chapa em direção ao centro da caixa
      const studPinLen = Math.abs(sx - wallX) - bracketThick;
      const studPin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.004, studPinLen, 16),
        ballJointMat
      );
      studPin.rotateZ(Math.PI / 2);
      studPin.position.set((wallX - sx + normalX * bracketThick) + normalX * studPinLen / 2, 0, 0);
      strutGroup.add(studPin);

      // Esfera inferior de articulação D10mm
      const ballSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.005, 16, 16),
        ballJointMat
      );
      ballSphere.position.set(0, 0, 0);
      strutGroup.add(ballSphere);

      // Cabeça da rótula esférica inferior (Ball socket DIN 71805)
      const socketBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0065, 0.0065, 0.015, 16),
        ballJointMat
      );
      socketBody.position.set(0, 0.0075, 0);
      strutGroup.add(socketBody);

      // (B) Cilindro de Pressão / Camisa de Aço (D18mm) - 100% Vertical
      const cylMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.009, 0.009, cylLen, 24),
        gasStrutTubeMat
      );
      const cylCenterY = 0.015 + cylLen / 2;
      cylMesh.position.set(0, cylCenterY, 0);
      cylMesh.castShadow = true;
      strutGroup.add(cylMesh);

      // Tampa inferior selada da camisa
      const capMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0093, 0.0093, 0.005, 24),
        gasStrutTubeMat
      );
      capMesh.position.set(0, 0.015 + 0.0025, 0);
      strutGroup.add(capMesh);

      // Faixa técnica serigrafada prateada (especificação de pressão e carga 150N/200N)
      const labelMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.00915, 0.00915, 0.026, 24),
        gasStrutLabelMat
      );
      labelMesh.position.set(0, 0.015 + cylLen * 0.42, 0);
      strutGroup.add(labelMesh);

      // Colar usinado de vedação / Guia raspadora da haste (Gland Seal Ring)
      const glandMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0096, 0.0096, 0.007, 24),
        gasStrutSealMat
      );
      glandMesh.position.set(0, 0.015 + cylLen + 0.0035, 0);
      strutGroup.add(glandMesh);

      // (C) Haste do Pistão Retificada Cromo-Duro (D8mm) - 100% Vertical
      // Desliza a partir do interior da camisa até a rótula superior, sem nunca exceder o cilindro
      const rodMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.004, rodTotalLen, 20),
        gasStrutRodMat
      );
      const rodCenterY = (0.015 + cylLen + 0.007 + rodVisLen) - rodTotalLen / 2;
      rodMesh.position.set(0, rodCenterY, 0);
      rodMesh.castShadow = true;
      strutGroup.add(rodMesh);

      // (D) Rótula Esférica Superior (Ball socket DIN 71805)
      const topSocket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0065, 0.0065, 0.015, 16),
        ballJointMat
      );
      topSocket.position.set(0, totalH - 0.0075, 0);
      strutGroup.add(topSocket);

      // Esfera superior de articulação D10mm
      const topBall = new THREE.Mesh(
        new THREE.SphereGeometry(0.005, 16, 16),
        ballJointMat
      );
      topBall.position.set(0, totalH, 0);
      strutGroup.add(topBall);

      // Pino horizontal superior ligando à sapata
      const topStudPin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.004, studPinLen, 16),
        ballJointMat
      );
      topStudPin.rotateZ(Math.PI / 2);
      topStudPin.position.set((wallX - sx + normalX * bracketThick) + normalX * studPinLen / 2, totalH, 0);
      strutGroup.add(topStudPin);

      // Sapata superior angular em chapa de aço estampada aparafusada sob o tampo elevatório
      const topBracketPlate = new THREE.Mesh(
        new THREE.BoxGeometry(bracketThick, 0.032, 0.032),
        bracketMat
      );
      topBracketPlate.position.set(wallX - sx + normalX * bracketThick / 2, totalH + 0.006, 0);
      strutGroup.add(topBracketPlate);

      strutGroup.userData = {
        isHardware: true,
        isBar: false,
        barLabel: `${box.name} • Pistão a Gás Auxiliar de Elevação (150N)`,
        material: 'Mola a Gás Industrial DIN 71805 Aço Cromo-Duro / Epóxi',
        moduleName: box.name
      };
      metalMechanismGroup.add(strutGroup);
    });

    // 6. Grupo Superior Elevatório (acompanha o deslocamento vertical +Y do mecanismo telescópico)
    const lidGroup = new THREE.Group();
    lidGroup.name = 'VerticalLiftLidGroup';
    const lidCenterY = h / 2 - (hasTop ? tTop / 2 : 0) + liftDist;
    lidGroup.position.set(0, lidCenterY, 0);
    container.add(lidGroup);

    if (hasTop) {
      const exclusionZones = box ? getUpperCabinetExclusionZones(box, w, l) : [];
      const hasCabExcl = exclusionZones.length > 0;
      const lidLabel = hasCabExcl
        ? `${box.name} • Tampo Superior Elevatório Vazado CNC c/ Apoio do Aéreo (${tTopMm}mm)`
        : isOpen
        ? `${box.name} • Tampo Superior Elevatório (+${Math.round(liftDist * 1000)}mm) (${tTopMm}mm)`
        : `${box.name} • Tampo Superior Elevatório (${tTopMm}mm)`;

      if (box.topPerforated) {
        addPerforatedPanel(
          lidGroup,
          w,
          tTop,
          l,
          0,
          0,
          0,
          mat,
          edgeMat,
          box.id,
          container,
          lidLabel,
          box,
          {
            thicknessMm: tTopMm,
            woodMaterial: woodMat,
            moduleName: box.name,
            partType: 'top_lift'
          }
        );
      } else {
        addPanel(
          lidGroup,
          w,
          tTop,
          l,
          0,
          0,
          0,
          mat,
          edgeMat,
          box.id,
          container,
          lidLabel,
          {
            thicknessMm: tTopMm,
            woodMaterial: woodMat,
            moduleName: box.name,
            partType: 'top_lift',
            material: `${woodMat} ${tTopMm}mm Impermeabilizado`
          }
        );
      }

      // Moldura inferior de madeira de reforço sob o tampo (sub-quadro de ancoragem dos suportes de ferro)
      const apronThick = 0.015;
      const apronH = 0.025;
      const apronW = Math.max(0.04, innerW - 0.01);
      const apronL = Math.max(0.04, innerL - 0.01);
      const apronMat = mat;

      // Travessa longitudinal direita sob o tampo
      const apronR = new THREE.Mesh(new THREE.BoxGeometry(apronThick, apronH, apronL), apronMat);
      apronR.position.set(-apronW / 2 + apronThick / 2, -tTop / 2 - apronH / 2, 0);
      apronR.userData = {
        isWoodPart: true,
        dimW: apronThick,
        dimH: apronH,
        dimL: apronL,
        thicknessMm: 15,
        partLabel: `${box.name} • Sarrafo Reforço Sob Tampo (Direito 25×15mm)`,
        woodMaterial: woodMat,
        moduleName: box.name,
        partType: 'reinforcement'
      };
      lidGroup.add(apronR);

      // Travessa longitudinal esquerda sob o tampo
      const apronLMesh = new THREE.Mesh(new THREE.BoxGeometry(apronThick, apronH, apronL), apronMat);
      apronLMesh.position.set(apronW / 2 - apronThick / 2, -tTop / 2 - apronH / 2, 0);
      apronLMesh.userData = {
        isWoodPart: true,
        dimW: apronThick,
        dimH: apronH,
        dimL: apronL,
        thicknessMm: 15,
        partLabel: `${box.name} • Sarrafo Reforço Sob Tampo (Esquerdo 25×15mm)`,
        woodMaterial: woodMat,
        moduleName: box.name,
        partType: 'reinforcement'
      };
      lidGroup.add(apronLMesh);
    }
  }
}
