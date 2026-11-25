const fs = require('fs');

const serverDb = JSON.parse(fs.readFileSync('server/database.json', 'utf8'));
const fbText = fs.readFileSync('src/data/fallbackData.ts', 'utf8');
const jsonStart = fbText.indexOf('{');
const jsonEnd = fbText.lastIndexOf('}');
const fbData = JSON.parse(fbText.slice(jsonStart, jsonEnd + 1));

// The 3 Andaman packages
const andamanPkgs = serverDb.packages.filter(p => (p.destination_id || '').includes('andaman') || (p.title || '').toLowerCase().includes('andaman'));
const andamanItins = serverDb.package_itineraries.filter(it => andamanPkgs.some(p => p.id === it.package_id));

console.log('Adding', andamanPkgs.length, 'packages and', andamanItins.length, 'itineraries to fallbackData...');

fbData.packages.push(...andamanPkgs);
fbData.package_itineraries.push(...andamanItins);

// Now re-calculate and audit EVERY destination in fallbackData
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

let fixedCount = 0;
for (const dest of fbData.destinations) {
  const actualCount = fbData.packages.filter(p => helperMatch(p, dest)).length;
  if (dest.package_count !== actualCount) {
    console.log(`Updating ${dest.name} (${dest.slug}): was ${dest.package_count} -> now ${actualCount}`);
    dest.package_count = actualCount;
    fixedCount++;
  }
}

console.log('Total destinations updated:', fixedCount);

// Check if any destination still has a mismatch
let remainingMismatches = 0;
for (const dest of fbData.destinations) {
  const actualCount = fbData.packages.filter(p => helperMatch(p, dest)).length;
  if (dest.package_count !== actualCount) {
    remainingMismatches++;
  }
}
console.log('Remaining mismatches after fix:', remainingMismatches);
