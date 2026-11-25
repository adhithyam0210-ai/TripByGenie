const fs = require('fs');

const serverDb = JSON.parse(fs.readFileSync('server/database.json', 'utf8'));
const fbText = fs.readFileSync('src/data/fallbackData.ts', 'utf8');
const jsonStart = fbText.indexOf('{');
const jsonEnd = fbText.lastIndexOf('}');
const fbData = JSON.parse(fbText.slice(jsonStart, jsonEnd + 1));

console.log('Server packages count:', serverDb.packages.length);
console.log('Fallback packages count:', fbData.packages.length);

const serverPkgIds = new Set(serverDb.packages.map(p => p.id));
const fbPkgIds = new Set(fbData.packages.map(p => p.id));

const inServerNotFb = serverDb.packages.filter(p => !fbPkgIds.has(p.id));
const inFbNotServer = fbData.packages.filter(p => !serverPkgIds.has(p.id));

console.log('In Server but not in Fallback:', inServerNotFb.map(p => ({ id: p.id, title: p.title })));
console.log('In Fallback but not in Server:', inFbNotServer.map(p => ({ id: p.id, title: p.title })));

// Check package_itineraries
console.log('Server itineraries count:', serverDb.package_itineraries.length);
console.log('Fallback itineraries count:', fbData.package_itineraries.length);

const serverItinIds = new Set(serverDb.package_itineraries.map(it => it.id));
const fbItinIds = new Set(fbData.package_itineraries.map(it => it.id));

const itinsInServerNotFb = serverDb.package_itineraries.filter(it => !fbItinIds.has(it.id));
console.log('Itineraries in Server but not in Fallback:', itinsInServerNotFb.length);
