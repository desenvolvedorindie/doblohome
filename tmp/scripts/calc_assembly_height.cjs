// Test assembly height calculations under different configurations
function calcRackHeight(config) {
  const baseProfileMm = 40; // Subchassi de ancoragem nas calhas
  let cargoBoxH_Mm = 0;
  let verticalLiftMm = 0;
  let clearanceHingesMm = 0;

  if (config.cargoBoxEnabled) {
    cargoBoxH_Mm = config.cargoBoxHeight || 330;
    clearanceHingesMm = 30; // Folga e dobradiças/sapatas
    const maxLiftMm = Math.max(60, cargoBoxH_Mm - 100);
    verticalLiftMm = Math.min(maxLiftMm, Math.max(0, config.verticalLiftMm || 0));
  }

  // Superestrutura de bandejas solares retráteis
  // 2 níveis: Y_LEVEL2 - curBaseY + TRAY_PROFILE_H = 175 + 30 = 205 mm
  // 1 nível: Y_LEVEL1_UPPER - curBaseY + TRAY_PROFILE_H = 105 + 30 = 135 mm
  const solarTraysH_Mm = config.stackLevels === 2 ? 205 : 135;
  const panelThicknessMm = Math.round((config.panelThickness || 0.003) * 1000);

  const totalRackHeightMm = baseProfileMm + cargoBoxH_Mm + clearanceHingesMm + verticalLiftMm + solarTraysH_Mm + panelThicknessMm;
  const totalRackHeightCm = +(totalRackHeightMm / 10).toFixed(1);
  const totalRackHeightM = +(totalRackHeightMm / 1000).toFixed(2);

  // Legislação CONTRAN Resolução nº 955/2022 (antiga 349/2010), Art. 5º:
  // Carga máxima permitida sobre o teto de veículos de passeio: 50 cm (500 mm)
  const limitContranMm = 500;
  const limitContranCm = 50.0;

  const diffMm = totalRackHeightMm - limitContranMm;
  const diffCm = +(diffMm / 10).toFixed(1);
  const pctOfLimit = Math.round((totalRackHeightMm / limitContranMm) * 100);
  const isAboveLimit = totalRackHeightMm > limitContranMm;
  const pctAbove = isAboveLimit ? Math.round(((totalRackHeightMm - limitContranMm) / limitContranMm) * 100) : 0;

  // Altura da Fiat Doblò de fábrica
  const vehicleBaseHeightM = 1.84;
  const totalVehicleHeightM = +(vehicleBaseHeightM + totalRackHeightMm / 1000).toFixed(2);

  return {
    totalRackHeightMm,
    totalRackHeightCm,
    totalRackHeightM,
    diffCm,
    pctOfLimit,
    isAboveLimit,
    pctAbove,
    totalVehicleHeightM
  };
}

const tests = [
  { name: 'Padrão (Baú 330mm, 2 níveis, lift 0)', config: { cargoBoxEnabled: true, cargoBoxHeight: 330, verticalLiftMm: 0, stackLevels: 2 } },
  { name: 'Baú 400mm com 50mm lift, 2 níveis', config: { cargoBoxEnabled: true, cargoBoxHeight: 400, verticalLiftMm: 50, stackLevels: 2 } },
  { name: 'Baú Slim 270mm, 1 nível, lift 0', config: { cargoBoxEnabled: true, cargoBoxHeight: 270, verticalLiftMm: 0, stackLevels: 1 } },
  { name: 'Sem baú (apenas rack solar), 2 níveis', config: { cargoBoxEnabled: false, stackLevels: 2 } },
  { name: 'Sem baú (apenas rack solar), 1 nível', config: { cargoBoxEnabled: false, stackLevels: 1 } },
];

for (const t of tests) {
  console.log(`\n--- ${t.name} ---`);
  const res = calcRackHeight(t.config);
  console.log(`Altura do Conjunto no Teto: ${res.totalRackHeightCm} cm (${res.totalRackHeightMm} mm)`);
  console.log(`Limite CONTRAN (Res 955/22): 50.0 cm`);
  console.log(`Status: ${res.isAboveLimit ? `⚠️ Acima da Lei em +${res.diffCm} cm (+${res.pctAbove}%)` : `✅ Dentro da Lei (${res.pctOfLimit}% do limite)`}`);
  console.log(`Altura Total com Doblò (1.84m): ${res.totalVehicleHeightM} m`);
}
