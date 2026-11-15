// Test unified Level 1 positioning and height calculations

function testHeight(boxH, liftMm, levels) {
  const baseProfileMm = 40;
  const clearanceHingesMm = 30;
  const verticalLiftMm = liftMm || 0;
  
  // Superestrutura solar otimizada:
  // Nível 1 coplanar: 30 mm acima da base
  // Nível 2 (se ativo): +50 mm acima do Nível 1
  // Perfil 30x30 (15mm de semi-altura) + 3mm de placa fotovoltaica
  const solarTraysH_Mm = levels === 2 ? 95 : 48; // 95mm (2 níveis) ou 48mm (1 nível)
  const panelThicknessMm = 3;

  const totalRackHeightMm = baseProfileMm + boxH + clearanceHingesMm + verticalLiftMm + solarTraysH_Mm;
  const totalRackHeightCm = +(totalRackHeightMm / 10).toFixed(1);
  const limitContranMm = 500;
  const isAbove = totalRackHeightMm > limitContranMm;
  const diffMm = totalRackHeightMm - limitContranMm;
  const diffCm = +(diffMm / 10).toFixed(1);
  const pctOfLimit = Math.round((totalRackHeightMm / limitContranMm) * 100);
  const pctAbove = isAbove ? Math.round(((totalRackHeightMm - limitContranMm) / limitContranMm) * 100) : 0;

  const dobloHeightM = 1.84;
  const totalVehicleM = +(dobloHeightM + totalRackHeightMm / 1000).toFixed(2);

  return {
    totalRackHeightMm,
    totalRackHeightCm,
    totalVehicleM,
    isAbove,
    diffCm,
    pctOfLimit,
    pctAbove
  };
}

console.log('--- Configuração Padrão (Baú 330mm, 2 Níveis, Lift 0) ---');
console.log(testHeight(330, 0, 2));

console.log('\n--- Configuração Baú Slim 270mm (2 Níveis, Lift 0) ---');
console.log(testHeight(270, 0, 2));

console.log('\n--- Configuração Sem Baú (2 Níveis) ---');
console.log(testHeight(0, 0, 2));

console.log('\n--- Configuração Baú 330mm (1 Nível) ---');
console.log(testHeight(330, 0, 1));
