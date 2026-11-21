const fs = require('fs');

// 1. Update database.json
const db = JSON.parse(fs.readFileSync('server/database.json', 'utf8'));
db.users.forEach((u, i) => {
  if (!u.display_id) {
    if (u.role === 'admin') u.display_id = `ADM-${1000 + i}`;
    else if (u.role === 'manager') u.display_id = `MGR-${1000 + i}`;
    else if (u.role === 'staff') u.display_id = `STF-${2000 + i}`;
    else if (u.role === 'agent') u.display_id = `AGT-${3000 + i}`;
    else if (u.role === 'customer') u.display_id = `CUS-${4000 + i}`;
  }
});
fs.writeFileSync('server/database.json', JSON.stringify(db, null, 2), 'utf8');

// 2. Update fallbackData.ts
let tsContent = fs.readFileSync('src/data/fallbackData.ts', 'utf8');
const prefix = 'export const fallbackData: any = ';
const idx = tsContent.indexOf(prefix);
if (idx !== -1) {
  const jsonPart = tsContent.slice(idx + prefix.length).replace(/;\s*$/, '');
  const fb = JSON.parse(jsonPart);
  fb.users.forEach((u, i) => {
    if (!u.display_id) {
      if (u.role === 'admin') u.display_id = `ADM-${1000 + i}`;
      else if (u.role === 'manager') u.display_id = `MGR-${1000 + i}`;
      else if (u.role === 'staff') u.display_id = `STF-${2000 + i}`;
      else if (u.role === 'agent') u.display_id = `AGT-${3000 + i}`;
      else if (u.role === 'customer') u.display_id = `CUS-${4000 + i}`;
    }
  });
  fs.writeFileSync('src/data/fallbackData.ts', `${prefix}${JSON.stringify(fb, null, 2)};\n`, 'utf8');
}
console.log('Successfully synced display_ids in database.json and fallbackData.ts');
