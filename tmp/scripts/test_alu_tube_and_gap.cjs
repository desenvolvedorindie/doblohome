// Test calculations for Aluminum Tube and reduced gap

function calcWeight(material, hasCargoBox, stackLevels, isTelescopic) {
  const isSteel = material === 'steel';
  const isAluTube = material === 'aluminum_tube';
  // T-slot
  const teleBonus = isTelescopic ? 0 : (isSteel ? -3.0 : isAluTube ? -1.0 : -1.8);

  const baseWeight = hasCargoBox
    ? (isSteel ? 28.5 : isAluTube ? 8.5 : 14.5) + teleBonus
    : (isSteel ? 26.0 : isAluTube ? 6.5 : 11.5);

  const traysWeight = stackLevels * (isSteel ? 5.2 : isAluTube ? 1.2 : 2.3);
  const slidesWeight = Math.max(0, stackLevels - 1) * 3.4;

  return +(baseWeight + traysWeight + slidesWeight).toFixed(1);
}

console.log('--- Comparação de Peso da Estrutura Metálica (Com Baú, 2 Níveis) ---');
console.log('Metalon Aço (Telescópica):', calcWeight('steel', true, 2, true), 'kg');
console.log('Metalon Aço (Fixa):', calcWeight('steel', true, 2, false), 'kg');
console.log('Alumínio T-Slot (Telescópica):', calcWeight('aluminum', true, 2, true), 'kg');
console.log('Alumínio T-Slot (Fixa):', calcWeight('aluminum', true, 2, false), 'kg');
console.log('Metalon Alumínio Tubular (Telescópica):', calcWeight('aluminum_tube', true, 2, true), 'kg');
console.log('Metalon Alumínio Tubular (Fixa):', calcWeight('aluminum_tube', true, 2, false), 'kg');

console.log('\n--- Altura do Conjunto com Gap Otimizado (6mm) ---');
const baseH = 40;
const boxH = 330;
const gapMm = 6;
const traysH = 75; // 30mm perfil L1 + 12mm folga + 30mm perfil L2 + 3mm placa
const totalH = baseH + boxH + gapMm + traysH;
console.log(`Altura Total no Teto: ${totalH} mm (${(totalH / 10).toFixed(1)} cm)`);
console.log(`Limite CONTRAN: 50.0 cm`);
console.log(`Margem de Folga: ${(500 - totalH) / 10} cm abaixo do limite máximo!`);
