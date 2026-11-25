const fs = require('fs');

const serverDb = JSON.parse(fs.readFileSync('server/database.json', 'utf8'));
const andamanPkgs = serverDb.packages.filter(p => (p.destination_id || '').includes('andaman') || (p.title || '').toLowerCase().includes('andaman'));
const andamanItins = serverDb.package_itineraries.filter(it => andamanPkgs.some(p => p.id === it.package_id));

const seedDataContent = fs.readFileSync('server/seedData.js', 'utf8');
const { seedData } = require('../server/seedData');

// Add Andaman packages if missing
const existingPkgIds = new Set(seedData.packages.map(p => p.id));
for (const p of andamanPkgs) {
  if (!existingPkgIds.has(p.id)) {
    seedData.packages.push(p);
  }
}

// Add Andaman itineraries if missing
const existingItinIds = new Set(seedData.package_itineraries.map(it => it.id));
for (const it of andamanItins) {
  if (!existingItinIds.has(it.id)) {
    seedData.package_itineraries.push(it);
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

// Update package_count for each destination
for (const dest of seedData.destinations) {
  dest.package_count = seedData.packages.filter(p => helperMatch(p, dest)).length;
}

const updatedSeedDataContent = 'const seedData = ' + JSON.stringify(seedData, null, 2) + ';\n\nmodule.exports = { seedData };\n';
fs.writeFileSync('server/seedData.js', updatedSeedDataContent, 'utf8');
console.log('Successfully updated server/seedData.js!');
console.log('SeedData packages:', seedData.packages.length);
console.log('SeedData itineraries:', seedData.package_itineraries.length);
