const fs = require('fs');

const serverDb = JSON.parse(fs.readFileSync('server/database.json', 'utf8'));
const andamanPkgs = serverDb.packages.filter(p => (p.destination_id || '').includes('andaman') || (p.title || '').toLowerCase().includes('andaman'));
const andamanItins = serverDb.package_itineraries.filter(it => andamanPkgs.some(p => p.id === it.package_id));

console.log('Andaman pkgs to add:', andamanPkgs.length);
console.log('Andaman itins to add:', andamanItins.length);

// Read fallbackData.ts
const fbContent = fs.readFileSync('src/data/fallbackData.ts', 'utf8');
const jsonStart = fbContent.indexOf('{');
const jsonEnd = fbContent.lastIndexOf('}');
const fbData = JSON.parse(fbContent.slice(jsonStart, jsonEnd + 1));

// Add Andaman packages if not present
const existingPkgIds = new Set(fbData.packages.map(p => p.id));
for (const p of andamanPkgs) {
  if (!existingPkgIds.has(p.id)) {
    fbData.packages.push(p);
  }
}

// Add Andaman itineraries if not present
const existingItinIds = new Set(fbData.package_itineraries.map(it => it.id));
for (const it of andamanItins) {
  if (!existingItinIds.has(it.id)) {
    fbData.package_itineraries.push(it);
  }
}

// Helper matcher
const helperMatch = (pkg, dest) => {
  if (pkg.is_published === false) return false;
  const dId = (dest.id || '').toLowerCase().trim();
  const dName = (dest.name || '').toLowerCase().trim();
  const dSlug = (dest.slug || '').toLowerCase().trim();
  const pDestId = (pkg.destination_id || '').toLowerCase().trim();
  const pDest = (pkg.destination || '').toLowerCase().trim();
  const pTitle = (pkg.title || '').toLowerCase().trim();

  if (pDestId && pDestId === dId) return true;
  if (pDest && (pDest === dName || pDest === dSlug)) return true;
  if (dName && (pTitle.includes(dName) || pDest.includes(dName))) return true;

  if (dName === 'kashmir' && (pDestId === 'dest_jammu_and_kashmir' || pTitle.includes('kashmir') || pTitle.includes('srinagar') || pTitle.includes('gulmarg'))) return true;
  if (dName.includes('andaman') && (pDestId === 'dest_andaman' || pTitle.includes('andaman') || pTitle.includes('havelock') || pTitle.includes('port blair'))) return true;
  if (dName === 'goa' && (pDestId === 'dest_goa' || pTitle.includes('goa'))) return true;

  return false;
};

// Update package_count for every destination
for (const dest of fbData.destinations) {
  dest.package_count = fbData.packages.filter(p => helperMatch(p, dest)).length;
}

// Format back to typescript
const updatedFbContent = 'export const fallbackData = ' + JSON.stringify(fbData, null, 2) + ';\n';
fs.writeFileSync('src/data/fallbackData.ts', updatedFbContent, 'utf8');
console.log('Successfully wrote src/data/fallbackData.ts!');
console.log('Total destinations:', fbData.destinations.length);
console.log('Total packages:', fbData.packages.length);
console.log('Total itineraries:', fbData.package_itineraries.length);

const andamanDest = fbData.destinations.find(d => d.slug === 'andaman');
console.log('Andaman destination verified:', {
  name: andamanDest.name,
  package_count: andamanDest.package_count,
  matched_packages: fbData.packages.filter(p => helperMatch(p, andamanDest)).map(p => p.title)
});
