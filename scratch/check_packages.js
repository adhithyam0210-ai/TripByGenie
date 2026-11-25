const fs = require('fs');

// Read fallbackData.ts
const text = fs.readFileSync('src/data/fallbackData.ts', 'utf8');

// Parse destinations
const destStart = text.indexOf('"destinations": [');
const destEnd = text.indexOf('"packages": [');
const pkgEnd = text.indexOf('"package_itineraries": [');

console.log('Indices:', { destStart, destEnd, pkgEnd });

// Let's search for "pkg_andaman" in text
const andamanPkgIndex = text.indexOf('pkg_andaman');
console.log('andamanPkgIndex in fallbackData:', andamanPkgIndex);

// Let's search for "dest_andaman"
let pos = 0;
while (true) {
  const idx = text.indexOf('dest_andaman', pos);
  if (idx === -1) break;
  console.log('Found dest_andaman at:', idx);
  console.log('Snippet:', text.substring(Math.max(0, idx - 40), Math.min(text.length, idx + 80)));
  pos = idx + 12;
}
