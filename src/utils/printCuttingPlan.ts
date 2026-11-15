import { CuttingResult, SheetPlan } from './cuttingOptimizerTypes';

const PALETTE = [
  { fill: '#e0f2fe', stroke: '#0284c7', text: '#0369a1' },
  { fill: '#d1fae5', stroke: '#059669', text: '#047857' },
  { fill: '#fef3c7', stroke: '#d97706', text: '#b45309' },
  { fill: '#ede9fe', stroke: '#7c3aed', text: '#6d28d9' },
  { fill: '#ffe4e6', stroke: '#e11d48', text: '#be123c' },
  { fill: '#cffafe', stroke: '#0891b2', text: '#0e7490' },
  { fill: '#fef9c3', stroke: '#ca8a04', text: '#a16207' },
  { fill: '#f1f5f9', stroke: '#475569', text: '#334155' }
];

export function printCuttingPlan(currentPlan: CuttingResult, allPlans?: CuttingResult[]): void {
  const plansToPrint = allPlans && allPlans.length > 0 ? allPlans : [currentPlan];

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permita pop-ups no navegador para visualizar e imprimir o plano de corte.');
    return;
  }

  let sheetsHtml = '';
  let globalSheetIndex = 1;

  for (const plan of plansToPrint) {
    for (const sheet of plan.sheets) {
      const isFoam = Boolean(
        sheet.material?.includes('Espuma') ||
        sheet.woodMaterial?.includes('Espuma') ||
        sheet.placedPieces.some((p) => p.isUpholstery)
      );

      // Gera os nós SVG das peças
      const piecesSvg = sheet.placedPieces
        .map((p, pIdx) => {
          const color = PALETTE[pIdx % PALETTE.length];
          const hasHoles = p.holes && p.holes.length > 0;

          const holesSvg = hasHoles
            ? p.holes!
                .map(
                  (h) =>
                    `<circle cx="${h.x}" cy="${h.y}" r="${h.r}" fill="#ffffff" stroke="${color.stroke}" stroke-width="1.2" stroke-dasharray="3,2"/>`
                )
                .join('')
            : '';

          const fontSize = Math.min(18, Math.max(9, p.w / 14));
          const textSvg =
            p.w > 60 && p.h > 35
              ? `<text x="${p.w / 2}" y="${p.h / 2 - (p.h > 60 ? 7 : 0)}" text-anchor="middle" dominant-baseline="middle" fill="#0f172a" font-size="${fontSize}px" font-weight="800" font-family="sans-serif">${escapeHtml(
                  p.label.length > 25 ? p.label.substring(0, 23) + '..' : p.label
                )}</text>
                 <text x="${p.w / 2}" y="${p.h / 2 + 11}" text-anchor="middle" dominant-baseline="middle" fill="${color.text}" font-size="${Math.max(
                  8,
                  fontSize - 1.5
                )}px" font-weight="700" font-family="monospace">${p.w} × ${p.h} mm ${p.rotated ? '↻' : ''}</text>`
              : '';

          return `
            <g transform="translate(${p.x}, ${p.y})">
              <rect x="0" y="0" width="${p.w}" height="${p.h}" rx="2" ry="2" fill="${color.fill}" stroke="${color.stroke}" stroke-width="1.5" />
              ${holesSvg}
              ${textSvg}
            </g>
          `;
        })
        .join('');

      // Mini tabela das peças no rodapé da folha
      const tableRows = sheet.placedPieces
        .map(
          (p, idx) => `
            <tr>
              <td>#${idx + 1}</td>
              <td style="font-weight: 700;">${escapeHtml(p.label)}</td>
              <td>${p.moduleName ? escapeHtml(p.moduleName) : '-'}</td>
              <td>X=${p.x}mm, Y=${p.y}mm</td>
              <td style="font-weight: 700; color: #0284c7;">${p.w} × ${p.h} mm ${p.rotated ? '(Girada 90°)' : ''}</td>
              <td>${((p.w * p.h) / 1_000_000).toFixed(3)} m²</td>
              <td>${p.isPerforated ? 'Vazado CNC Ø40' : p.hasCabinetCutout ? 'Recorte Especial' : 'Corte Reto'}</td>
            </tr>
          `
        )
        .join('');

      sheetsHtml += `
        <div class="sheet-page">
          <div class="sheet-header">
            <div>
              <div class="brand">FIAT DOBLÒ CAMPERVAN • SISTEMA SOLAR & MARCENARIA 3D</div>
              <h2 class="sheet-title">CHAPA ${String(globalSheetIndex).padStart(2, '0')} — ${escapeHtml(
        sheet.woodMaterial || plan.woodMaterial || 'Compensado'
      )} ${sheet.thicknessMm}mm</h2>
              <div class="sheet-sub">Dimensão Nominal da Chapa: ${sheet.sheetWidthMm} × ${sheet.sheetHeightMm} mm</div>
            </div>
            <div class="stats-box">
              <div class="badge badge-primary">⚡ Aproveitamento: ${sheet.efficiencyPct.toFixed(1)}%</div>
              <div class="stat-item">Área Útil: <strong>${sheet.usedAreaM2.toFixed(2)} m²</strong></div>
              <div class="stat-item">Sobra / Retalho: <strong>${sheet.wastePct.toFixed(1)}%</strong></div>
              <div class="stat-item">Refilo: <strong>${sheet.marginMm} mm</strong> | Kerf: <strong>${sheet.kerfMm} mm</strong></div>
              <div class="stat-item">Peças: <strong>${sheet.placedPieces.length} un</strong></div>
            </div>
          </div>

          <div class="svg-container">
            <svg viewBox="0 0 ${sheet.sheetWidthMm} ${sheet.sheetHeightMm}" class="sheet-svg">
              <rect x="0" y="0" width="${sheet.sheetWidthMm}" height="${sheet.sheetHeightMm}" fill="${
        isFoam ? '#f0f9ff' : '#f8fafc'
      }" stroke="#334155" stroke-width="2" />
              ${
                sheet.marginMm > 0
                  ? `<rect x="${sheet.marginMm}" y="${sheet.marginMm}" width="${sheet.sheetWidthMm - 2 * sheet.marginMm}" height="${
                      sheet.sheetHeightMm - 2 * sheet.marginMm
                    }" fill="none" stroke="#ea580c" stroke-width="1.5" stroke-dasharray="6,4" />`
                  : ''
              }
              ${piecesSvg}
            </svg>
            <div class="dimensions-note">↔ Comprimento Nominal: ${sheet.sheetWidthMm} mm &nbsp;|&nbsp; ↕ Largura Nominal: ${sheet.sheetHeightMm} mm</div>
          </div>

          <div class="table-container">
            <table class="pieces-table">
              <thead>
                <tr>
                  <th style="width: 36px;">#</th>
                  <th>Peça / Identificação</th>
                  <th>Módulo</th>
                  <th>Posição (X, Y)</th>
                  <th>Dimensões (C × L)</th>
                  <th>Área Unit.</th>
                  <th>Usinagem CNC</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>
        </div>
      `;

      globalSheetIndex++;
    }
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Plano de Corte & Desenho dos Cortes — Fiat Doblò Campervan</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 8mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
        }
        .sheet-page {
          width: 100%;
          height: 100vh;
          max-height: 190mm;
          page-break-after: always;
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
          padding: 6px;
        }
        .sheet-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #0284c7;
          padding-bottom: 6px;
          margin-bottom: 6px;
        }
        .brand {
          font-size: 8px;
          font-weight: 800;
          color: #0369a1;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .sheet-title {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
          margin: 2px 0;
        }
        .sheet-sub {
          font-size: 9.5px;
          color: #64748b;
        }
        .stats-box {
          display: flex;
          gap: 12px;
          align-items: center;
          font-size: 9px;
          background: #f1f5f9;
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
        }
        .badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 800;
          font-size: 9.5px;
        }
        .badge-primary {
          background: #059669;
          color: #ffffff;
        }
        .svg-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justifyContent: center;
          position: relative;
          min-height: 0;
          max-height: 108mm;
          margin: 4px 0;
        }
        .sheet-svg {
          width: 100%;
          height: 100%;
          max-height: 102mm;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          border-radius: 4px;
        }
        .dimensions-note {
          font-size: 8px;
          color: #64748b;
          font-weight: 700;
          margin-top: 2px;
        }
        .table-container {
          max-height: 48mm;
          overflow: hidden;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
        }
        .pieces-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8px;
        }
        .pieces-table th {
          background: #0369a1;
          color: #ffffff;
          padding: 3px 6px;
          text-align: left;
          font-weight: 700;
        }
        .pieces-table td {
          padding: 2.5px 6px;
          border-bottom: 1px solid #e2e8f0;
        }
        .pieces-table tr:nth-child(even) td {
          background: #f8fafc;
        }
        @media screen {
          body {
            background: #475569;
            padding: 20px;
          }
          .sheet-page {
            background: #ffffff;
            margin: 0 auto 20px auto;
            max-width: 297mm;
            min-height: 200mm;
            padding: 16px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
            border-radius: 8px;
          }
        }
      </style>
    </head>
    <body>
      ${sheetsHtml}
      <script>
        window.addEventListener('load', () => {
          setTimeout(() => {
            window.print();
          }, 400);
        });
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
