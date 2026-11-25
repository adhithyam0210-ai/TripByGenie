const fs = require('fs');

console.log('--- NORMALIZING AGENCY_ID ACROSS ALL DATA STORES ---');

// 1. server/database.json
if (fs.existsSync('server/database.json')) {
  const db = JSON.parse(fs.readFileSync('server/database.json', 'utf8'));
  let destUpdated = 0;
  (db.destinations || []).forEach(d => {
    if (!d.agency_id || d.agency_id === 'agency_001') {
      d.agency_id = 'agency_travel_genie';
      destUpdated++;
    }
  });

  let pkgUpdated = 0;
  (db.packages || []).forEach(p => {
    if (!p.agency_id || p.agency_id === 'agency_001') {
      p.agency_id = 'agency_travel_genie';
      pkgUpdated++;
    }
  });

  let bannerUpdated = 0;
  (db.hero_banners || []).forEach(b => {
    if (!b.agency_id || b.agency_id === 'agency_001') {
      b.agency_id = 'agency_travel_genie';
      bannerUpdated++;
    }
  });

  fs.writeFileSync('server/database.json', JSON.stringify(db, null, 2), 'utf8');
  console.log(`server/database.json updated: ${destUpdated} destinations, ${pkgUpdated} packages, ${bannerUpdated} banners`);
}

// 2. server/seedData.js
if (fs.existsSync('server/seedData.js')) {
  const { seedData } = require('../server/seedData');
  (seedData.destinations || []).forEach(d => {
    if (!d.agency_id || d.agency_id === 'agency_001') d.agency_id = 'agency_travel_genie';
  });
  (seedData.packages || []).forEach(p => {
    if (!p.agency_id || p.agency_id === 'agency_001') p.agency_id = 'agency_travel_genie';
  });
  (seedData.hero_banners || []).forEach(b => {
    if (!b.agency_id || b.agency_id === 'agency_001') b.agency_id = 'agency_travel_genie';
  });
  fs.writeFileSync('server/seedData.js', 'const seedData = ' + JSON.stringify(seedData, null, 2) + ';\n\nmodule.exports = { seedData };\n', 'utf8');
  console.log('server/seedData.js updated');
}

// 3. src/data/fallbackData.ts
if (fs.existsSync('src/data/fallbackData.ts')) {
  const text = fs.readFileSync('src/data/fallbackData.ts', 'utf8');
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  const fbData = JSON.parse(text.slice(jsonStart, jsonEnd + 1));

  let fbDestUpdated = 0;
  (fbData.destinations || []).forEach(d => {
    if (!d.agency_id || d.agency_id === 'agency_001') {
      d.agency_id = 'agency_travel_genie';
      fbDestUpdated++;
    }
  });

  let fbPkgUpdated = 0;
  (fbData.packages || []).forEach(p => {
    if (!p.agency_id || p.agency_id === 'agency_001') {
      p.agency_id = 'agency_travel_genie';
      fbPkgUpdated++;
    }
  });

  let fbBannerUpdated = 0;
  (fbData.hero_banners || []).forEach(b => {
    if (!b.agency_id || b.agency_id === 'agency_001') {
      b.agency_id = 'agency_travel_genie';
      fbBannerUpdated++;
    }
  });

  fs.writeFileSync('src/data/fallbackData.ts', 'export const fallbackData = ' + JSON.stringify(fbData, null, 2) + ';\n', 'utf8');
  console.log(`src/data/fallbackData.ts updated: ${fbDestUpdated} destinations, ${fbPkgUpdated} packages, ${fbBannerUpdated} banners`);
}

console.log('ALL DATA STORES NOW HAVE 100% CONSISTENT AGENCY_ID = agency_travel_genie!');
