import fs from 'fs';

const start = performance.now();
const content = fs.readFileSync('assets/doblo.obj', 'utf8');
const readTime = performance.now() - start;
console.log(`Read 26MB in ${readTime.toFixed(1)}ms. Total lines: ${content.split('\n').length}`);

