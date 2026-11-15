const fs = require('fs');
const path = require('path');

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getFiles(fullPath, fileList);
    } else if (/\.(ts|tsx)$/.test(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const srcDir = path.resolve(__dirname, '../../src');
const allFiles = getFiles(srcDir);
const largeFiles = [];

for (const f of allFiles) {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n').length;
  if (lines >= 500) {
    largeFiles.push({ file: path.relative(srcDir, f), lines });
  }
}

largeFiles.sort((a, b) => b.lines - a.lines);
console.log(`Found ${largeFiles.length} files with >= 500 lines:`);
largeFiles.forEach(item => {
  console.log(`${item.lines} lines: src/${item.file.replace(/\\/g, '/')}`);
});
