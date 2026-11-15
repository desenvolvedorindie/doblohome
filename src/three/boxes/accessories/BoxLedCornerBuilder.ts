import * as THREE from 'three';
import { InternalBoxItem, BoxLedEdge } from '../../../types';

export function buildBoxLedCornerAccessory(
  container: THREE.Group,
  w: number,
  l: number,
  h: number,
  box: InternalBoxItem,
  _isSelected: boolean
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
