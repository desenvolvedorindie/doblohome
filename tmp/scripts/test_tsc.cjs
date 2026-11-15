// Verify that the scene builds and there are no issues with the new heights
const { execSync } = require('child_process');

console.log('Testing build...');
try {
  const out = execSync('npx tsc --noEmit', { encoding: 'utf-8' });
  console.log('tsc passed:', out);
} catch (e) {
  console.error('tsc failed:', e.stdout, e.stderr);
}
