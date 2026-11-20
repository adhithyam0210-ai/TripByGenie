const fs = require('fs');

const complete = JSON.parse(fs.readFileSync('server/extracted_complete_packages.json', 'utf8'));
const db = JSON.parse(fs.readFileSync('server/database.json', 'utf8'));

console.log('Complete crawl package count:', complete.length);
console.log('DB packages count:', db.packages.length);
console.log('DB package_itineraries count:', db.package_itineraries.length);

// Check if fallbackData.ts is in sync
const fbText = fs.readFileSync('src/data/fallbackData.ts', 'utf8');
const fbJsonMatch = fbText.match(/export const fallbackData = (\{[\s\S]*\});\s*$/);
if (fbJsonMatch) {
  try {
    const fbData = JSON.parse(fbJsonMatch[1]);
    console.log('FallbackData packages count:', fbData.packages.length);
    console.log('FallbackData itineraries count:', fbData.package_itineraries.length);
  } catch (e) {
    console.log('FallbackData JSON parse failed:', e.message);
  }
} else {
  console.log('FallbackData regex match not found, checking file size:', fbText.length);
}
