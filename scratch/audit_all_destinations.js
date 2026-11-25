const fs = require('fs');

const serverDb = JSON.parse(fs.readFileSync('server/database.json', 'utf8'));

// Check server packages matching each destination
const serverMatches = [];
for (const dest of serverDb.destinations) {
  const dId = (dest.id || '').toLowerCase().trim();
  const dName = (dest.name || '').toLowerCase().trim();
  const dSlug = (dest.slug || '').toLowerCase().trim();

  const matched = serverDb.packages.filter(pkg => {
    if (pkg.is_published === false) return false;
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
  });

  serverMatches.push({
    id: dest.id,
    name: dest.name,
    slug: dest.slug,
    package_count: dest.package_count,
    actual_count: matched.length
  });
}

const diffs = serverMatches.filter(m => m.package_count !== m.actual_count);
console.log('Server DB destination count mismatches:', diffs.length);
diffs.forEach(d => console.log(`  ${d.name}: stated=${d.package_count}, actual=${d.actual_count}`));
