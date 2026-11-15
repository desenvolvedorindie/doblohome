// Test script for rack weight calculations
const calcRackWeights = (opts: {
  structureMaterial: 'steel' | 'aluminum';
  stackLevels: number;
  panelCount: number;
  panelUnitWeightKg: number;
  waterEnabled: boolean;
  waterDiameterMm: number;
  waterLengthMm: number;
  cargoBoxEnabled: boolean;
  cargoBoxLengthMm: number;
  awningEnabled: boolean;
  awningType: 'rear' | 'batwing_270';
  isWaterFull: boolean;
}) => {
  const isSteel = opts.structureMaterial === 'steel';

  // 1. Metal structure
  const baseWeight = opts.cargoBoxEnabled ? (isSteel ? 28.5 : 14.5) : (isSteel ? 26.0 : 11.5);
  const traysWeight = opts.stackLevels * (isSteel ? 5.2 : 2.3);
  const slidesWeight = (opts.stackLevels - 1) * 3.4;
  const structureWeight = +(baseWeight + traysWeight + slidesWeight).toFixed(1);

  // 2. Solar panels
  const panelsWeight = +(opts.panelCount * opts.panelUnitWeightKg).toFixed(1);

  // 3. Water tank (pipes + water)
  let waterLiters = 0;
  let pipeWeight = 0;
  if (opts.waterEnabled) {
    const rMm = Math.round(opts.waterDiameterMm / 2);
    const rDm = rMm / 100;
    const rM = rMm / 1000;
    const frameInnerX = 0.66;
    const pipeOffsetX = frameInnerX - rM;
    const bendR = Math.max(0.06, rM * 1.35);
    const frontSpanM = Math.max(0.20, (pipeOffsetX - bendR) * 2);
    const frontCircuitAddonM = frontSpanM + Math.PI * bendR;
    const singleLiters = Math.PI * rDm * rDm * (opts.waterLengthMm / 100);
    const frontLiters = Math.PI * rDm * rDm * (frontCircuitAddonM * 10);
    waterLiters = +(singleLiters * 2 + frontLiters).toFixed(1);
    pipeWeight = +(Math.round((opts.waterDiameterMm / 100) * 8.5 * 10) / 10).toFixed(1) as any;
  }
  const waterWeight = opts.isWaterFull ? waterLiters : 0;
  const waterSystemWeight = +(pipeWeight + waterWeight).toFixed(1);

  // 4. Cargo box
  let cargoBoxWeight = 0;
  if (opts.cargoBoxEnabled) {
    cargoBoxWeight = opts.cargoBoxLengthMm >= 1800 ? 21.0 : opts.cargoBoxLengthMm <= 1500 ? 15.5 : 18.0;
  }

  // 5. Awning
  let awningWeight = 0;
  if (opts.awningEnabled) {
    awningWeight = opts.awningType === 'batwing_270' ? 20.0 : 10.5;
  }

  // 6. Hardware & Gas struts
  const hardwareWeight = opts.cargoBoxEnabled ? 5.0 : 3.2;

  // Totals
  const totalWeight = +(structureWeight + panelsWeight + waterSystemWeight + cargoBoxWeight + awningWeight + hardwareWeight).toFixed(1);
  const totalDry = +(structureWeight + panelsWeight + pipeWeight + cargoBoxWeight + awningWeight + hardwareWeight).toFixed(1);

  return {
    isSteel,
    structureWeight,
    panelsWeight,
    pipeWeight,
    waterLiters,
    waterWeight,
    waterSystemWeight,
    cargoBoxWeight,
    awningWeight,
    hardwareWeight,
    totalDry,
    totalWeight,
    limitRoofKg: 100,
    pctDry: Math.round((totalDry / 100) * 100),
    pctFull: Math.round((totalWeight / 100) * 100),
  };
};

console.log('--- TEST CONFIG 1: STEEL, 4 PANELS (100W), CARGO BOX, NO WATER, NO AWNING ---');
console.log(calcRackWeights({
  structureMaterial: 'steel',
  stackLevels: 2,
  panelCount: 4,
  panelUnitWeightKg: 1.8,
  waterEnabled: false,
  waterDiameterMm: 200,
  waterLengthMm: 2200,
  cargoBoxEnabled: true,
  cargoBoxLengthMm: 1600,
  awningEnabled: false,
  awningType: 'batwing_270',
  isWaterFull: false,
}));

console.log('--- TEST CONFIG 2: ALUMINUM, 4 PANELS, WATER D100mm FULL, AWNING BATWING ---');
console.log(calcRackWeights({
  structureMaterial: 'aluminum',
  stackLevels: 2,
  panelCount: 4,
  panelUnitWeightKg: 1.8,
  waterEnabled: true,
  waterDiameterMm: 100,
  waterLengthMm: 2200,
  cargoBoxEnabled: true,
  cargoBoxLengthMm: 1600,
  awningEnabled: true,
  awningType: 'batwing_270',
  isWaterFull: true,
}));

