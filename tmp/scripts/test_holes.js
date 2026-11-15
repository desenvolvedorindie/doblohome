// Test hole calculation logic
function testHoles(w, l, holeDiameterMm, spacingMm) {
  const diameterMm = Math.max(15, Math.min(85, holeDiameterMm ?? 40));
  const customHoleRadius = (diameterMm / 1000) / 2;

  const effSpacingMm = Math.max(diameterMm + 12, Math.min(180, spacingMm ?? 85));
  const targetSpacing = effSpacingMm / 1000;

  const margin = Math.min(0.05, Math.min(w, l) * 0.12);
  const usableW = Math.max(0.02, w - 2 * margin);
  const usableL = Math.max(0.02, l - 2 * margin);

  const cols = Math.max(1, Math.round(usableW / targetSpacing));
  const rows = Math.max(1, Math.round(usableL / targetSpacing));
  const stepX = usableW / cols;
  const stepZ = usableL / rows;

  const maxSafeRadius = Math.max(0.008, Math.min(stepX, stepZ) * 0.44);
  const holeRadius = Math.min(customHoleRadius, maxSafeRadius);
  const renderedDiameterMm = holeRadius * 2 * 1000;

  console.log({
    inputDiam: holeDiameterMm,
    inputSpacing: spacingMm,
    cols,
    rows,
    stepXmm: Math.round(stepX * 1000),
    stepZmm: Math.round(stepZ * 1000),
    maxSafeDiamMm: Math.round(maxSafeRadius * 2 * 1000),
    renderedDiameterMm: Math.round(renderedDiameterMm)
  });
}

console.log("=== For box 0.40m x 0.85m ===");
[20, 25, 30, 35, 40, 50, 60, 70, 80].forEach(d => {
  testHoles(0.40, 0.85, d, 85);
});
