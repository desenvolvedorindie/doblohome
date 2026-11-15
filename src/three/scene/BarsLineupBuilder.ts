import * as THREE from 'three';
import { PartsGroupFilter } from '../../types';
import { LineupItem, LineupRowGroup } from './LineupTypes';
import { BarsLineupCollector } from './BarsLineupCollector';
import { MetalonTubeFactory } from '../MetalonTube';
import { InternalBoxesBuilder } from '../InternalBoxesBuilder';

export class BarsLineupBuilder {
  static build(
    barsLineupGroup: THREE.Group,
    solarSystem: any,
    internalBoxesBuilder: any,
    filter: PartsGroupFilter = 'all',
    caller?: any
  ): number {
    while (barsLineupGroup.children.length > 0) {
      const child = barsLineupGroup.children[0];
      barsLineupGroup.remove(child);
    }

    const {
      sortedWoodRows,
      sortedUpholsteryRows,
      sortedMetalRows,
      sortedPvcRows,
      metalItems,
      woodItems,
      upholsteryItems,
      totalPvc
    } = BarsLineupCollector.collect(solarSystem, internalBoxesBuilder);

    let activeRows: LineupRowGroup[] = [];
    if (filter === 'wood') {
      activeRows = sortedWoodRows;
    } else if (filter === 'upholstery') {
      activeRows = sortedUpholsteryRows;
    } else if (filter === 'metal') {
      activeRows = sortedMetalRows;
    } else if (filter === 'pvc') {
      activeRows = sortedPvcRows;
    } else {
      activeRows = [...sortedWoodRows, ...sortedUpholsteryRows, ...sortedMetalRows, ...sortedPvcRows];
    }

    const gapX = 0.05;
    const rowGapZ = 0.55;
    let currentZ = 0;
    let maxRowSpanX = 0;

    activeRows.forEach((row, rowIdx) => {
      const items = row.items;
      if (items.length === 0) return;

      const rowSpanX = items.reduce((sum, it) => sum + it.width, 0) + Math.max(0, items.length - 1) * gapX;
      const rowMaxLen = items.reduce((max, it) => Math.max(max, it.length), 0.1);
      if (rowSpanX > maxRowSpanX) maxRowSpanX = rowSpanX;

      const startX = -rowSpanX / 2;
      const rowBaselineZ = currentZ;

      // Linha guia visual no solo delimitando a bancada desta linha
      const linePts = [
        new THREE.Vector3(startX - 0.25, 0.004, rowBaselineZ),
        new THREE.Vector3(startX + rowSpanX + 0.25, 0.004, rowBaselineZ)
      ];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
      const lineMat = new THREE.LineBasicMaterial({
        color: row.colorHex,
        transparent: true,
        opacity: 0.85
      });
      barsLineupGroup.add(new THREE.Line(lineGeo, lineMat));

      // Header 3D da Linha
      const headerColor = row.type === 'upholstery'
        ? '#38bdf8'
        : row.type === 'metal'
          ? '#38bdf8'
          : (row.woodMaterial?.includes('MDF') ? '#38bdf8' : '#f59e0b');
      const headerSprite = (typeof caller?.createGroupHeaderSprite === 'function')
        ? caller.createGroupHeaderSprite(row.title, row.subtitle, headerColor)
        : BarsLineupBuilder.createGroupHeaderSprite(row.title, row.subtitle, headerColor);
      headerSprite.position.set(0, 0.45, rowBaselineZ - 0.28);
      barsLineupGroup.add(headerSprite);

      // Renderização das peças lado a lado nesta linha
      let curX = startX;
      items.forEach((item, idx) => {
        const xPos = curX + item.width / 2;
        curX += item.width + gapX;

        const yPos = item.thickness / 2;
        const zPos = rowBaselineZ + item.length / 2;

        let partObj: THREE.Object3D;
        const isFitting = item.type === 'pvc' && (item.pvcFittingType === 'elbow_90' || item.pvcFittingType === 'cap');

        if (item.type === 'pvc') {
          const pvcMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            roughness: 0.35,
            metalness: 0.20,
            side: THREE.DoubleSide
          });

          if (item.pvcFittingType === 'elbow_90') {
            partObj = MetalonTubeFactory.createPvcElbowMesh(item.thicknessMm / 1000, pvcMat);
            partObj.rotation.y = Math.PI;
          } else if (item.pvcFittingType === 'cap') {
            partObj = MetalonTubeFactory.createPvcCapMesh(item.thicknessMm / 1000, pvcMat);
            // Cap Esq voltado para frente mostrando a bolsa de encaixe; Cap Dir voltado para trás mostrando o domo e bujão de latão
            if (item.name?.includes('Dir')) {
              partObj.rotation.y = Math.PI;
            }
          } else {
            const wallThickM = Math.max(0.0032, Math.min(0.0055, item.width * 0.022));
            const geo = MetalonTubeFactory.getPvcPipeGeometry(item.length, item.width, wallThickM, 'z', 36);
            const mesh = new THREE.Mesh(geo, pvcMat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            const hitGeo = new THREE.CylinderGeometry(item.width / 2, item.width / 2, item.length, 16);
            hitGeo.rotateX(Math.PI / 2);
            const hitMesh = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
            hitMesh.name = '__pvc_hitbox';
            mesh.add(hitMesh);

            const edgeGeo = new THREE.EdgesGeometry(geo, 25);
            const edgeMat = new THREE.LineBasicMaterial({
              color: row.colorHex,
              transparent: true,
              opacity: 0.9
            });
            mesh.add(new THREE.LineSegments(edgeGeo, edgeMat));

            partObj = mesh;
          }
        } else {
          let geo: THREE.BufferGeometry;
          const isMetalonOrTube = item.type === 'metal' && (item.profileSpec?.includes('Metalon') || item.profileSpec?.includes('Tubo'));
          if (item.isPerforated) {
            geo = InternalBoxesBuilder.createPerforatedGeometry(item.width, item.thickness, item.length, {
              holeDiameterMm: item.sourceMesh?.userData?.holeDiameterMm,
              spacingMm: item.sourceMesh?.userData?.spacingMm,
              exclusionZones: item.sourceMesh?.userData?.exclusionZones
            });
          } else if (isMetalonOrTube) {
            const tMm = item.profileSpec?.includes('40') ? (solarSystem.metalonThickness40 || 2.0) : (solarSystem.metalonThickness30 || 1.5);
            geo = MetalonTubeFactory.getTubeGeometry(item.length, item.width, item.thickness, tMm / 1000, 'z');
          } else {
            geo = new THREE.BoxGeometry(item.width, item.thickness, item.length);
          }

          const baseMat = item.sourceMesh
            ? (Array.isArray(item.sourceMesh.material) ? item.sourceMesh.material[0] : item.sourceMesh.material)
            : null;
          const mat = baseMat ? (baseMat.clone ? baseMat.clone() : baseMat) : new THREE.MeshStandardMaterial({ color: row.colorHex });
          if ('transparent' in mat) (mat as any).transparent = false;
          if ('opacity' in mat) (mat as any).opacity = 1.0;

          const mesh = new THREE.Mesh(geo, mat);
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          const edgeGeo = new THREE.EdgesGeometry(geo, item.isPerforated ? 25 : undefined);
          const edgeMat = new THREE.LineBasicMaterial({
            color: row.colorHex,
            transparent: true,
            opacity: 0.75
          });
          mesh.add(new THREE.LineSegments(edgeGeo, edgeMat));

          partObj = mesh;
        }

        partObj.position.set(xPos, yPos, zPos);

        partObj.userData = {
          isLineupPart: true,
          isBar: item.type === 'metal',
          isWoodPart: item.type === 'wood',
          isUpholstery: item.type === 'upholstery',
          isPvcPart: item.type === 'pvc',
          isPvcFitting: isFitting,
          pvcFittingType: item.pvcFittingType,
          isPerforated: item.isPerforated,
          hasCabinetExclusion: item.hasCabinetExclusion,
          hasCabinetCutout: item.hasCabinetCutout,
          woodMaterial: item.woodMaterial,
          thicknessMm: item.thicknessMm,
          groupKey: row.key,
          rowIndex: rowIdx + 1,
          rank: idx + 1,
          name: `${row.title} #${idx + 1} • ${item.name}${item.hasCabinetCutout ? ' ✂️ [Recorte Armário Aéreo]' : item.isPerforated ? (item.hasCabinetExclusion ? ' 🕳️ [Vazado CNC + Base Maciça Aéreo]' : ' 🕳️ [Vazado CNC]') : ''}`,
          barLength: item.length,
          barWidth: item.width,
          barThickness: item.thickness,
          area: item.area,
          profileSpec: item.profileSpec,
          material: item.material,
          category: row.title,
          purpose: isFitting
            ? (item.pvcFittingType === 'elbow_90'
              ? 'Conexão 90° de alta resistência com bolsas para fusão soldável a frio na tubulação de água limpa'
              : 'Vedação estanque final traseira com ponto rosqueado para inspeção/dreno de fundo')
            : item.type === 'upholstery'
              ? `Espuma D33 Estofaria${item.hasCabinetCutout ? ' (com Recorte Especial para Armário Aéreo)' : ''} | Área: ${item.area.toFixed(2)} m² (${Math.round(item.width * 1000)} × ${Math.round(item.length * 1000)} × ${item.thicknessMm} mm)`
              : `${item.isPerforated ? (item.hasCabinetExclusion ? '🍃 Vazado CNC c/ Apoio Maciço p/ Armário Aéreo | ' : '🍃 Vazado CNC (-35% peso / Aeração) | ') : ''}Área: ${item.area >= 0.1 ? item.area.toFixed(2) + ' m²' : Math.round(item.area * 10000) + ' cm²'} (${Math.round(item.width * 1000)} × ${Math.round(item.length * 1000)} mm)`
        };

        barsLineupGroup.add(partObj);

        const customLabel = item.pvcFittingType === 'elbow_90'
          ? 'Joelho 90°'
          : item.pvcFittingType === 'cap'
            ? 'CAP Tampão'
            : undefined;
        const labelSprite = (typeof caller?.createBarLengthSprite === 'function')
          ? caller.createBarLengthSprite(idx + 1, item.length, item.width, item.area, item.type, customLabel)
          : BarsLineupBuilder.createBarLengthSprite(idx + 1, item.length, item.width, item.area, item.type, customLabel);
        labelSprite.position.set(xPos, yPos + 0.05, rowBaselineZ + item.length + 0.05);
        barsLineupGroup.add(labelSprite);
      });

      currentZ += rowMaxLen + rowGapZ;
    });

    const totalRendered =
      filter === 'metal' ? metalItems.length
        : filter === 'wood' ? woodItems.length
          : filter === 'upholstery' ? upholsteryItems.length
            : filter === 'pvc' ? totalPvc
              : metalItems.length + woodItems.length + upholsteryItems.length + totalPvc;

    barsLineupGroup.userData.totalBars = totalRendered;
    barsLineupGroup.userData.totalSpanX = Math.max(maxRowSpanX, 3.5);
    barsLineupGroup.userData.totalDepthZ = Math.max(currentZ, 2.0);
    barsLineupGroup.userData.maxLen = Math.max(currentZ, 2.0);
    barsLineupGroup.userData.centerX = 0;
    barsLineupGroup.userData.centerZ = currentZ / 2;
    barsLineupGroup.userData.metalCount = metalItems.length;
    barsLineupGroup.userData.woodCount = woodItems.length;
    barsLineupGroup.userData.upholsteryCount = upholsteryItems.length;
    barsLineupGroup.userData.pvcCount = totalPvc;

    return totalRendered;
  }

  static createGroupHeaderSprite(
    title: string,
    subtitle: string,
    colorHex: string
  ): THREE.Sprite {
    if (typeof document === 'undefined') {
      const s = new THREE.Sprite();
      s.name = `HeaderSprite_${title}`;
      return s;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 140;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.beginPath();
    ctx.roundRect(8, 8, canvas.width - 16, canvas.height - 16, 16);
    ctx.fill();

    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 4;
    ctx.stroke();

    const maxWidth = canvas.width - 64;
    const centerX = canvas.width / 2;

    let titleFontSize = 28;
    ctx.font = `bold ${titleFontSize}px "Segoe UI", Inter, Arial, sans-serif`;
    let titleMetrics = ctx.measureText(title);
    if (titleMetrics.width > maxWidth) {
      titleFontSize = Math.max(18, Math.floor((maxWidth / titleMetrics.width) * titleFontSize));
      ctx.font = `bold ${titleFontSize}px "Segoe UI", Inter, Arial, sans-serif`;
    }
    ctx.fillStyle = colorHex;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, centerX, 50);

    let subFontSize = 19;
    ctx.font = `600 ${subFontSize}px "Segoe UI", Inter, Arial, sans-serif`;
    let subMetrics = ctx.measureText(subtitle);
    if (subMetrics.width > maxWidth) {
      subFontSize = Math.max(14, Math.floor((maxWidth / subMetrics.width) * subFontSize));
      ctx.font = `600 ${subFontSize}px "Segoe UI", Inter, Arial, sans-serif`;
    }
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(subtitle, centerX, 94);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2.40, 0.35, 1);
    return sprite;
  }

  static createBarLengthSprite(
    rank: number,
    lengthM: number,
    widthM: number,
    areaM2: number,
    type: 'metal' | 'wood' | 'upholstery' | 'pvc',
    customLabel?: string
  ): THREE.Sprite {
    if (typeof document === 'undefined') {
      const s = new THREE.Sprite();
      s.name = `LengthSprite_${rank}`;
      return s;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 220;
    canvas.height = 76;
    const ctx = canvas.getContext('2d')!;

    const isWood = type === 'wood';
    const isUpholstery = type === 'upholstery';
    const isPvc = type === 'pvc';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = isWood
      ? 'rgba(245, 158, 11, 0.85)'
      : isUpholstery
        ? 'rgba(56, 189, 248, 0.95)'
        : isPvc
          ? 'rgba(14, 165, 233, 0.85)'
          : 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(4, 4, canvas.width - 8, canvas.height - 8, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isWood ? '#f59e0b' : isUpholstery ? '#38bdf8' : isPvc ? '#38bdf8' : '#38bdf8';
    ctx.font = 'bold 13.5px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${isWood ? '🪵' : isUpholstery ? '🛏️' : isPvc ? '💧' : '🔩'} #${rank}`, 12, 26);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12.5px monospace';
    ctx.textAlign = 'right';
    const areaStr = isPvc
      ? `Ø${Math.round(widthM * 1000)}mm`
      : (areaM2 >= 0.1 ? `${areaM2.toFixed(2)}m²` : `${Math.round(areaM2 * 10000)}cm²`);
    ctx.fillText(areaStr, canvas.width - 12, 26);

    ctx.fillStyle = isWood ? '#fed7aa' : isPvc ? '#7dd3fc' : '#bae6fd';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    const centerX = canvas.width / 2;
    if (customLabel) {
      ctx.fillText(customLabel, centerX, 53);
    } else {
      const lMm = Math.round(lengthM * 1000);
      const wMm = Math.round(widthM * 1000);
      ctx.fillText(isPvc ? `${lMm} mm` : `${lMm} × ${wMm} mm`, centerX, 53);
    }

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(0.095, 0.033, 1);
    return sprite;
  }
}
