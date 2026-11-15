import * as THREE from 'three';
import { CeilingConfig, CeilingLedConfig } from '../../types';
import { getCeilingArchOffset } from './CeilingBuilder';

export class CeilingLedBuilder {
  ceilingGroup: THREE.Group;

  constructor(ceilingGroup: THREE.Group) {
    this.ceilingGroup = ceilingGroup;
  }

  buildCeilingLed(
    led: CeilingLedConfig,
    w: number,
    l: number,
    ceilingY: number,
    centerZ: number,
    isSlatted: boolean,
    archM: number = 0.025,
    ceilingThicknessM: number = 0.012,
    ceiling?: CeilingConfig
  ) {
    const ledColorHex = new THREE.Color(led.color || '#fef3c7').getHex();
    const brightness = Math.max(0.1, Math.min(1.5, (led.brightness ?? 85) / 100));

    // Materiais: Perfil de Alumínio Cinza + Difusor Plástico Branco Leitoso Translúcido Emissivo + Fita COB
    const aluMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.30
    });

    const diffuserMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: ledColorHex,
      emissiveIntensity: brightness * 1.6,
      roughness: 0.35,
      metalness: 0.0
    });

    const cobMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: ledColorHex,
      emissiveIntensity: brightness * 2.2,
      roughness: 0.2
    });

    const capMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.5,
      metalness: 0.05
    });

    if (led.type.startsWith('strip')) {
      // Perfil de Fita LED Linear Longitudinal
      const alignXToSlatGap = (targetX: number): number => {
        if (!isSlatted || ceiling?.slatDirection === 'transverse') return targetX;
        const slatWM = (ceiling?.slatWidthMm || 40) / 1000;
        const slatGapM = (ceiling?.slatGapMm || 10) / 1000;
        const pitch = slatWM + slatGapM;
        if (pitch <= 0.001) return targetX;
        const count = Math.max(1, Math.floor((w - slatGapM) / pitch));
        if (count < 2) return targetX;

        const totalSpan = count * slatWM + (count - 1) * slatGapM;
        const startX = -totalSpan / 2 + slatWM / 2;

        let nearestGapX = targetX;
        let minDist = Infinity;
        for (let i = 0; i < count - 1; i++) {
          const gapX = startX + i * pitch + pitch / 2;
          const dist = Math.abs(gapX - targetX);
          if (dist < minDist - 1e-6) {
            minDist = dist;
            nearestGapX = gapX;
          }
        }
        return nearestGapX;
      };

      const rawStripXPositions: number[] = (() => {
        if (led.type === 'strip_center') return [0];
        if (led.type === 'strip_triple') return [-w * 0.30, 0, w * 0.30];
        return [-w * 0.28, w * 0.28]; // strip_double (padrão)
      })();
      const stripXPositions = rawStripXPositions.map(alignXToSlatGap);

      const stripL = Math.max(0.2, l - 0.04);
      const profW = 0.016; // 16mm
      const profH = 0.010; // 10mm
      const wall = 0.0015;
      const bottomProtrusionM = 0.003; // Saliência inferior de 3mm abaixo da face inferior do teto
      const effectiveProfH = Math.min(profH, Math.max(0.005, ceilingThicknessM + bottomProtrusionM - 0.001));

      // Perfil em formato ∏ invertido: fechado no topo (+Y) e aberto para baixo (-Y)
      const uShape = new THREE.Shape();
      uShape.moveTo(-profW / 2, 0);
      uShape.lineTo(-profW / 2, effectiveProfH);
      uShape.lineTo(profW / 2, effectiveProfH);
      uShape.lineTo(profW / 2, 0);
      uShape.lineTo(profW / 2 - wall, 0);
      uShape.lineTo(profW / 2 - wall, effectiveProfH - wall);
      uShape.lineTo(-profW / 2 + wall, effectiveProfH - wall);
      uShape.lineTo(-profW / 2 + wall, 0);
      uShape.closePath();

      const aluGeo = new THREE.ExtrudeGeometry(uShape, { depth: stripL, bevelEnabled: false });
      const cobGeo = new THREE.BoxGeometry(0.008, 0.001, stripL - 0.01);
      const diffGeo = new THREE.BoxGeometry(profW - 2 * wall - 0.0002, 0.002, stripL - 0.004);
      const capGeo = new THREE.BoxGeometry(profW + 0.001, effectiveProfH + 0.001, 0.003);

      stripXPositions.forEach((x, sIdx) => {
        const stripContainer = new THREE.Group();
        stripContainer.name = `CeilingLedStrip_${sIdx + 1}`;

        const aluMesh = new THREE.Mesh(aluGeo, aluMat);
        aluMesh.position.set(0, -effectiveProfH / 2, -stripL / 2);
        stripContainer.add(aluMesh);

        // Fita COB interna montada no fundo superior do canal voltada para baixo
        const cobMesh = new THREE.Mesh(cobGeo, cobMat);
        cobMesh.position.set(0, effectiveProfH / 2 - wall - 0.0006, 0);
        stripContainer.add(cobMesh);

        // Difusor inferior translúcido projetando-se 1mm abaixo das abas de alumínio
        const diffMesh = new THREE.Mesh(diffGeo, diffuserMat);
        diffMesh.position.set(0, -effectiveProfH / 2, 0);
        stripContainer.add(diffMesh);

        // Ponteiras de acabamento frontal e traseira
        const capFront = new THREE.Mesh(capGeo, capMat);
        capFront.position.set(0, -0.0005, stripL / 2 + 0.0015);
        stripContainer.add(capFront);
        const capRear = new THREE.Mesh(capGeo, capMat);
        capRear.position.set(0, -0.0005, -stripL / 2 - 0.0015);
        stripContainer.add(capRear);

        // Posiciona na face inferior do teto curvo acompanhando o arco e a inclinação transversal
        const { yDrop, rotZ } = getCeilingArchOffset(x, w, archM);
        const bottomSurfaceY = ceilingY - ceilingThicknessM + yDrop;
        stripContainer.position.set(x, bottomSurfaceY - bottomProtrusionM + effectiveProfH / 2, centerZ);
        stripContainer.rotation.z = rotZ;
        this.ceilingGroup.add(stripContainer);
      });

      // Luzes pontuais (PointLights) suaves emitindo luz para baixo dentro do camper
      const lightZ1 = centerZ + l * 0.25;
      const lightZ2 = centerZ - l * 0.25;

      const p1 = new THREE.PointLight(ledColorHex, brightness * 1.8, 3.2, 1.8);
      p1.position.set(0, ceilingY - 0.08, lightZ1);
      this.ceilingGroup.add(p1);

      const p2 = new THREE.PointLight(ledColorHex, brightness * 1.8, 3.2, 1.8);
      p2.position.set(0, ceilingY - 0.08, lightZ2);
      this.ceilingGroup.add(p2);

      if (led.type === 'strip_triple' || l > 1.8) {
        const pCenter = new THREE.PointLight(ledColorHex, brightness * 1.4, 3.0, 1.8);
        pCenter.position.set(0, ceilingY - 0.08, centerZ);
        this.ceilingGroup.add(pCenter);
      }
    } else {
      // Spots circulares de LED embutidos dispostos longitudinalmente
      const spotCount = led.spotsCount || 4;
      const spotLocations: Array<{ x: number; z: number }> = [];

      const xSpan = w * 0.28;
      if (spotCount === 2) {
        [-0.26, 0.26].forEach((factor) => {
          spotLocations.push({ x: 0, z: centerZ + l * factor });
        });
      } else if (spotCount === 6) {
        [-0.32, 0, 0.32].forEach((factor) => {
          spotLocations.push({ x: -xSpan, z: centerZ + l * factor });
          spotLocations.push({ x: xSpan, z: centerZ + l * factor });
        });
      } else if (spotCount === 8) {
        [-0.36, -0.12, 0.12, 0.36].forEach((factor) => {
          spotLocations.push({ x: -xSpan, z: centerZ + l * factor });
          spotLocations.push({ x: xSpan, z: centerZ + l * factor });
        });
      } else {
        // 4 spots (padrão)
        [-0.26, 0.26].forEach((factor) => {
          spotLocations.push({ x: -xSpan, z: centerZ + l * factor });
          spotLocations.push({ x: xSpan, z: centerZ + l * factor });
        });
      }

      const outerR = 0.034; // 68mm diâmetro externo
      const innerR = 0.025; // 50mm difusor
      const spotH = 0.005; // 5mm saliência/embutido

      const bezelGeo = new THREE.CylinderGeometry(outerR, outerR, spotH, 24);
      const lensGeo = new THREE.CylinderGeometry(innerR, innerR, 0.003, 24);

      spotLocations.forEach((loc, idx) => {
        const spotGroup = new THREE.Group();
        spotGroup.name = `CeilingSpot_${idx + 1}`;

        const bezel = new THREE.Mesh(bezelGeo, aluMat);
        spotGroup.add(bezel);

        const lens = new THREE.Mesh(lensGeo, diffuserMat);
        lens.position.y = -spotH / 2 + 0.0005;
        spotGroup.add(lens);

        // Posiciona na face inferior do teto curvo acompanhando o arco e a inclinação rotacional em Z
        const { yDrop, rotZ } = getCeilingArchOffset(loc.x, w, archM);
        const bottomSurfaceY = ceilingY - ceilingThicknessM + yDrop;
        spotGroup.position.set(loc.x, bottomSurfaceY - spotH / 2 + 0.001, loc.z);
        spotGroup.rotation.z = rotZ;
        this.ceilingGroup.add(spotGroup);
      });

      // PointLights para os spots
      const pFront = new THREE.PointLight(ledColorHex, brightness * 1.7, 3.2, 1.8);
      pFront.position.set(0, ceilingY - 0.08, centerZ + l * 0.25);
      this.ceilingGroup.add(pFront);

      const pRear = new THREE.PointLight(ledColorHex, brightness * 1.7, 3.2, 1.8);
      pRear.position.set(0, ceilingY - 0.08, centerZ - l * 0.25);
      this.ceilingGroup.add(pRear);
    }
  }
}
