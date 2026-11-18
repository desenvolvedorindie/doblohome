const fs = require('fs');
const path = require('path');

const canvasPath = path.resolve('src/components/cutting/CuttingSvgCanvas.tsx');
let code = fs.readFileSync(canvasPath, 'utf8');

const oldBlock = `                {/* Texto da Peça: Nome e Medidas em mm */}
                {piece.w > 70 && piece.h > 40 && (
                  <text
                    x={piece.w / 2}
                    y={piece.h / 2 - (piece.h > 65 ? 8 : 0)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isSelected ? '#ffffff' : '#f1f5f9'}
                    fontSize={Math.min(18, Math.max(10, piece.w / 14))}
                    fontWeight="800"
                    fontFamily="sans-serif"
                    pointerEvents="none"
                  >
                    {piece.label.length > 22 ? piece.label.substring(0, 20) + '...' : piece.label}
                  </text>
                )}

                {piece.w > 70 && piece.h > 65 && (
                  <text
                    x={piece.w / 2}
                    y={piece.h / 2 + 12}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#38bdf8"
                    fontSize={Math.min(15, Math.max(9, piece.w / 16))}
                    fontWeight="700"
                    fontFamily="monospace"
                    pointerEvents="none"
                  >
                    {piece.w} × {piece.h} mm {piece.rotated ? '↻' : ''}
                  </text>
                )}`;

const newBlock = `                {/* Texto da Peça: Nome e Medidas em mm */}
                {/* 1. Peças Normais e Largas */}
                {piece.w > 70 && piece.h > 40 && (
                  <>
                    <text
                      x={piece.w / 2}
                      y={piece.h / 2 - (piece.h > 65 ? 8 : 0)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={isSelected ? '#ffffff' : '#f1f5f9'}
                      fontSize={Math.min(18, Math.max(10, piece.w / 14))}
                      fontWeight="800"
                      fontFamily="sans-serif"
                      pointerEvents="none"
                    >
                      {piece.label.length > 22 ? piece.label.substring(0, 20) + '...' : piece.label}
                    </text>

                    {piece.h > 65 && (
                      <text
                        x={piece.w / 2}
                        y={piece.h / 2 + 12}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#38bdf8"
                        fontSize={Math.min(15, Math.max(9, piece.w / 16))}
                        fontWeight="700"
                        fontFamily="monospace"
                        pointerEvents="none"
                      >
                        {piece.w} × {piece.h} mm {piece.rotated ? '↻' : ''}
                      </text>
                    )}
                  </>
                )}

                {/* 2. Peças Estreitas Horizontais (ex: Ripas ou Pés de 35mm a 65mm na horizontal) */}
                {piece.w >= 50 && (piece.h <= 40 || (piece.w <= 70 && piece.h <= 65)) && piece.h >= 16 && (
                  <text
                    x={piece.w / 2}
                    y={piece.h / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isSelected ? '#ffffff' : '#f1f5f9'}
                    fontSize={Math.min(11, Math.max(6.5, piece.h * 0.44))}
                    fontWeight="800"
                    fontFamily="sans-serif"
                    pointerEvents="none"
                  >
                    {piece.label.length > 22 ? piece.label.substring(0, 20) + '..' : piece.label} ({piece.w}×{piece.h})
                  </text>
                )}

                {/* 3. Peças Estreitas Verticais (ex: Ripas ou Pés de 35mm a 65mm de largura na vertical) */}
                {piece.w <= 70 && piece.w >= 16 && piece.h >= 50 && (
                  <g transform={\`rotate(-90, \${piece.w / 2}, \${piece.h / 2})\`}>
                    <text
                      x={piece.w / 2}
                      y={piece.h / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={isSelected ? '#ffffff' : '#f1f5f9'}
                      fontSize={Math.min(11, Math.max(6.5, piece.w * 0.44))}
                      fontWeight="800"
                      fontFamily="sans-serif"
                      pointerEvents="none"
                    >
                      {piece.label.length > 22 ? piece.label.substring(0, 20) + '..' : piece.label} ({piece.h}×{piece.w})
                    </text>
                  </g>
                )}`;

if (!code.includes(oldBlock)) {
  console.error('Could not find oldBlock in CuttingSvgCanvas.tsx');
  process.exit(1);
}
code = code.replace(oldBlock, newBlock);
fs.writeFileSync(canvasPath, code, 'utf8');
console.log('CuttingSvgCanvas.tsx updated successfully');
