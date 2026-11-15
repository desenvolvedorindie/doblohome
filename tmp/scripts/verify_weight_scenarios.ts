// Verify weight calculation logic for all combinations
interface TestScenario {
  name: string;
  material: 'steel' | 'aluminum';
  stackLevels: number;
  panelCount: number;
  panelUnitKg: number;
  waterEnabled: boolean;
  waterDiamMm: number;
  waterLenMm: number;
  cargoBoxEnabled: boolean;
  cargoBoxLenMm: number;
  awningEnabled: boolean;
  awningType: 'rear' | 'batwing_270';
  isWaterFull: boolean;
}

const scenarios: TestScenario[] = [
  {
    name: 'Padrão Inicial: Alumínio, 4 Placas 100W, Baú 500L, Toldo Batwing, Água Ø100mm Cheia',
    material: 'aluminum',
    stackLevels: 2,
    panelCount: 4,
    panelUnitKg: 1.8,
    waterEnabled: true,
    waterDiamMm: 100,
    waterLenMm: 2200,
    cargoBoxEnabled: true,
    cargoBoxLenMm: 1600,
    awningEnabled: true,
    awningType: 'batwing_270',
    isWaterFull: true
  },
  {
    name: 'Modo Rodovia (Mesmo acima, porém Água Seca)',
    material: 'aluminum',
    stackLevels: 2,
    panelCount: 4,
    panelUnitKg: 1.8,
    waterEnabled: true,
    waterDiamMm: 100,
    waterLenMm: 2200,
    cargoBoxEnabled: true,
    cargoBoxLenMm: 1600,
    awningEnabled: true,
    awningType: 'batwing_270',
    isWaterFull: false
  },
  {
    name: 'Metalon de Aço Carbono (Pesado), 4 Placas, Baú, Sem Água, Sem Toldo',
    material: 'steel',
    stackLevels: 2,
    panelCount: 4,
    panelUnitKg: 1.8,
    waterEnabled: false,
    waterDiamMm: 200,
    waterLenMm: 2200,
    cargoBoxEnabled: true,
    cargoBoxLenMm: 1600,
    awningEnabled: false,
    awningType: 'batwing_270',
    isWaterFull: false
  },
  {
    name: 'Configuração Mínima Ultraleve: Alumínio 1 nível, 2 placas, sem baú, sem água, sem toldo',
    material: 'aluminum',
    stackLevels: 1,
    panelCount: 2,
    panelUnitKg: 1.8,
    waterEnabled: false,
    waterDiamMm: 100,
    waterLenMm: 2200,
    cargoBoxEnabled: false,
    cargoBoxLenMm: 1600,
    awningEnabled: false,
    awningType: 'rear',
    isWaterFull: false
  }
];

for (const s of scenarios) {
  const isSteel = s.material === 'steel';
  const baseWeight = s.cargoBoxEnabled ? (isSteel ? 28.5 : 14.5) : (isSteel ? 26.0 : 11.5);
  const traysWeight = s.stackLevels * (isSteel ? 5.2 : 2.3);
  const slidesWeight = Math.max(0, s.stackLevels - 1) * 3.4;
  const structureWeight = +(baseWeight + traysWeight + slidesWeight).toFixed(1);

  const panelsWeight = +(s.panelCount * s.panelUnitKg).toFixed(1);

  let waterLiters = 0;
  let pipeWeight = 0;
  if (s.waterEnabled) {
    const rMm = Math.round(s.waterDiamMm / 2);
    const rDm = rMm / 100;
    const rM = rMm / 1000;
    const frameInnerX = 0.66;
    const pipeOffsetX = frameInnerX - rM;
    const bendR = Math.max(0.06, rM * 1.35);
    const frontSpanM = Math.max(0.20, (pipeOffsetX - bendR) * 2);
    const frontCircuitAddonM = frontSpanM + Math.PI * bendR;
    const singleLiters = Math.PI * rDm * rDm * (s.waterLenMm / 100);
    const frontLiters = Math.PI * rDm * rDm * (frontCircuitAddonM * 10);
    waterLiters = +(singleLiters * 2 + frontLiters).toFixed(1);
    pipeWeight = +(Math.round((s.waterDiamMm / 100) * 8.5 * 10) / 10).toFixed(1);
  }
  const waterWeight = s.isWaterFull ? waterLiters : 0;
  const waterSystemWeight = +(pipeWeight + waterWeight).toFixed(1);

  const cargoBoxWeight = s.cargoBoxEnabled ? (s.cargoBoxLenMm >= 1800 ? 21.0 : s.cargoBoxLenMm <= 1500 ? 15.5 : 18.0) : 0;
  const awningWeight = s.awningEnabled ? (s.awningType === 'batwing_270' ? 20.0 : 10.5) : 0;
  const hardwareWeight = s.cargoBoxEnabled ? 5.0 : 3.2;

  const totalDry = +(structureWeight + panelsWeight + pipeWeight + cargoBoxWeight + awningWeight + hardwareWeight).toFixed(1);
  const totalFull = +(structureWeight + panelsWeight + pipeWeight + waterLiters + cargoBoxWeight + awningWeight + hardwareWeight).toFixed(1);
  const activeTotal = s.isWaterFull ? totalFull : totalDry;

  console.log(`\n=== ${s.name} ===`);
  console.log(`- Estrutura (${s.material}): ${structureWeight} kg (Base: ${baseWeight}, Bandejas: ${traysWeight}, Trilhos: ${slidesWeight})`);
  console.log(`- Placas (${s.panelCount}x): ${panelsWeight} kg`);
  console.log(`- Água: ${waterSystemWeight} kg (Tubos: ${pipeWeight} kg, Água: ${waterWeight} kg de ${waterLiters}L)`);
  console.log(`- Baú: ${cargoBoxWeight} kg`);
  console.log(`- Toldo: ${awningWeight} kg`);
  console.log(`- Ferragens: ${hardwareWeight} kg`);
  console.log(`=> TOTAL ATIVO: ${activeTotal} kg (Seco: ${totalDry} kg, Cheio: ${totalFull} kg)`);
  console.log(`=> Capacidade Doblò: ${Math.round((activeTotal / 100) * 100)}% (Margem: ${(100 - activeTotal).toFixed(1)} kg)`);
}

