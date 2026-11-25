const fs = require('fs');
let db = null;
if (fs.existsSync('server/database.json')) {
  db = JSON.parse(fs.readFileSync('server/database.json', 'utf8'));
} else {
  const { seedData } = require('../server/seedData');
  db = seedData;
}

const andamanPkgs = (db.packages || []).filter(p => (p.destination_id || '').includes('andaman') || (p.title || '').toLowerCase().includes('andaman'));
console.log('Andaman packages in server db:');
console.log(JSON.stringify(andamanPkgs, null, 2));

const andamanItins = (db.package_itineraries || []).filter(it => andamanPkgs.some(p => p.id === it.package_id));
console.log('Andaman itineraries count:', andamanItins.length);
