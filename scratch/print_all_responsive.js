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
const responsivePatterns = [
  'sm:hidden', 'md:hidden', 'lg:hidden', 'xl:hidden',
  'hidden sm:', 'hidden md:', 'hidden lg:', 'hidden xl:',
  'block sm:hidden', 'hidden sm:block', 'hidden md:block', 'hidden lg:block',
  'hidden sm:flex', 'hidden md:flex', 'hidden lg:flex',
  'hidden sm:grid', 'hidden md:grid', 'hidden lg:grid'
];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    for (const pat of responsivePatterns) {
      if (line.includes(pat)) {
        console.log(`${file}:${idx + 1} -> ${line.trim()}`);
        break;
      }
    }
  });
}
