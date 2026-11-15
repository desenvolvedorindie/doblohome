async function check() {
  const r = await fetch('http://localhost:5173/src/three/InternalBoxesBuilder.ts');
  const t = await r.text();
  const lines = t.split('\n');
  const idx = lines.findIndex(l => l.includes('strutAngle'));
  console.log('Served InternalBoxesBuilder.ts lines around strutAngle:');
  console.log(lines.slice(idx - 5, idx + 10).join('\n'));
}
check();

