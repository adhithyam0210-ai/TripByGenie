const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');
console.log('Total ts/tsx files:', files.length);

const responsivePatterns = [
  'sm:hidden',
  'md:hidden',
  'lg:hidden',
  'hidden sm:',
  'hidden md:',
  'hidden lg:',
  'block sm:hidden',
  'hidden sm:block',
  'hidden md:block',
  'hidden lg:block',
  'hidden sm:flex',
  'hidden md:flex',
  'hidden lg:flex',
  'hidden sm:grid',
  'hidden md:grid',
  'hidden lg:grid'
];

const findings = [];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    for (const pat of responsivePatterns) {
      if (line.includes(pat)) {
        findings.push({ file, line: idx + 1, pat, text: line.trim() });
        break;
      }
    }
  });
}

console.log('Total responsive conditional lines:', findings.length);

// Group by file
const byFile = {};
findings.forEach(f => {
  byFile[f.file] = byFile[f.file] || [];
  byFile[f.file].push(f);
});

for (const [file, list] of Object.entries(byFile)) {
  if (file.includes('pages/public') || file.includes('components/travel') || file.includes('components/layout')) {
    console.log(`\n=== ${file} (${list.length}) ===`);
    list.forEach(l => console.log(`  L${l.line}: ${l.text.substring(0, 110)}`));
  }
}
