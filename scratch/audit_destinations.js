const fs = require('fs');

let serverDb = null;
if (fs.existsSync('server/database.json')) {
  serverDb = JSON.parse(fs.readFileSync('server/database.json', 'utf8'));
} else if (fs.existsSync('server/seedData.js')) {
  const { seedData } = require('../server/seedData');
  serverDb = seedData;
}

console.log('Server DB packages count:', serverDb?.packages?.length);
const serverAndaman = serverDb?.packages?.filter(p => JSON.stringify(p).toLowerCase().includes('andaman')) || [];
console.log('Server DB Andaman packages:', serverAndaman.map(p => ({ id: p.id, title: p.title, destination_id: p.destination_id })));

// Let's also check fallbackData packages
const fbText = fs.readFileSync('src/data/fallbackData.ts', 'utf8');
console.log('fallbackData.ts size in chars:', fbText.length);

// Let's parse fallbackData using a lightweight json parser on the object
// In fallbackData.ts: export const fallbackData = { ... };
const jsonStart = fbText.indexOf('{');
const jsonEnd = fbText.lastIndexOf('}');
const jsonStr = fbText.slice(jsonStart, jsonEnd + 1);

let fbData = null;
try {
  fbData = JSON.parse(jsonStr);
  console.log('Successfully parsed fallbackData!');
} catch (e) {
  console.log('JSON.parse error on fallbackData:', e.message);
}

if (fbData) {
  console.log('fallbackData destinations count:', fbData.destinations?.length);
  console.log('fallbackData packages count:', fbData.packages?.length);

  // Check all destinations in fallbackData vs actual packages matching each destination!
  const results = [];
  for (const dest of fbData.destinations) {
    const dId = (dest.id || '').toLowerCase();
    const dName = (dest.name || '').toLowerCase();
    const dSlug = (dest.slug || '').toLowerCase();

    const matched = fbData.packages.filter(p => {
      const pDestId = (p.destination_id || '').toLowerCase();
      const pDest = (p.destination || '').toLowerCase();
      const pTitle = (p.title || '').toLowerCase();
      return pDestId === dId || pDest === dName || pDest === dSlug || (dName && (pTitle.includes(dName) || pDest.includes(dName)));
    });

    results.push({
      id: dest.id,
      name: dest.name,
      slug: dest.slug,
      package_count_stated: dest.package_count,
      actual_matched_count: matched.length
    });
  }

  const mismatches = results.filter(r => r.package_count_stated !== r.actual_matched_count);
  console.log('Total destinations with count mismatches in fallbackData:', mismatches.length);
  console.log('Mismatches:');
  mismatches.forEach(m => console.log(`  ${m.name} (${m.slug}): stated=${m.package_count_stated}, actual=${m.actual_matched_count}`));
}
