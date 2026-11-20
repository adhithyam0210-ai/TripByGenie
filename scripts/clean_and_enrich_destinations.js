const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../server/database.json');
const FALLBACK_PATH = path.join(__dirname, '../src/data/fallbackData.ts');

const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

// The 104 destination guide slugs
const guideSlugs = new Set([
  'kolkata', 'tamil-nadu', 'uttarakhand', 'united-states', 'hyderabad', 'karnataka',
  'south-india', 'kerala', 'maharashtra', 'mumbai', 'pune', 'west-india', 'kochi',
  'mysore', 'bangalore', 'goa', 'arunachal-pradesh', 'darjeeling', 'west-bengal',
  'east-india', 'pelling', 'gangtok', 'north-east', 'jammu-and-kashmir', 'ladakh',
  'jaipur', 'shimla', 'manali', 'delhi', 'agra-tour-package', 'north-india', 'greece',
  'italy', 'seychelles', 'switzerland', 'mauritius', 'honeymoon', 'egypt', 'dubai',
  'uae', 'qatar', 'oman', 'jordan', 'israel', 'middle-east', 'sri-lanka', 'reunion',
  'madagascar', 'island', 'united-kingdom', 'turkey', 'sweden', 'slovakia', 'russia',
  'romania', 'portugal', 'norway', 'netherlands', 'london', 'ireland', 'iceland',
  'hungary', 'greenland', 'germany', 'france', 'finland-republic', 'denmark-republic',
  'czech-republic', 'croatia', 'bulgaria', 'belgium', 'austria', 'europe', 'uzbekistan',
  'vietnam', 'thailand', 'taiwan', 'philippines', 'singapore', 'malaysia', 'south-korea',
  'kazakhstan', 'indonesia', 'japan', 'hong-kong', 'china', 'cambodia', 'bali',
  'asia', 'new-zealand', 'fiji', 'australia', 'pacific', 'canada', 'central-america',
  'south-america', 'alaska-tour-packages', 'america', 'tanzania', 'zimbabwe',
  'south-africa', 'morocco', 'kenya', 'africa'
]);

console.log('Original packages count:', db.packages.length);
console.log('Original destinations count:', db.destinations.length);
console.log('Original package_itineraries count:', db.package_itineraries.length);

// 1. Enrich destinations with authentic guide accordions
let enrichedDestCount = 0;
for (const slug of guideSlugs) {
  const guidePkg = db.packages.find((p) => p.slug === slug);
  if (!guidePkg) continue;

  const guideItins = db.package_itineraries.filter((it) => it.package_id === guidePkg.id);
  const accordions = guideItins.map((it) => ({
    title: it.title,
    content: it.description
  }));

  // Find or create matching destination
  let dest = db.destinations.find(
    (d) =>
      d.slug === slug ||
      d.id === `dest_${slug.replace(/-/g, '_')}` ||
      d.name.toLowerCase() === guidePkg.title.toLowerCase()
  );

  if (!dest) {
    dest = {
      id: `dest_${slug.replace(/[^a-z0-9]+/g, '_')}`,
      agency_id: 'agency_travel_genie',
      name: guidePkg.title,
      slug: slug,
      country: guidePkg.destination_id?.includes('india') ? 'India' : 'International',
      cover_image: guidePkg.cover_image,
      description: guidePkg.description,
      accordions: accordions,
      is_featured: false,
      created_at: new Date().toISOString()
    };
    db.destinations.push(dest);
  } else {
    dest.accordions = accordions;
    if (guidePkg.description && guidePkg.description.length > (dest.description?.length || 0)) {
      dest.description = guidePkg.description;
    }
  }
  enrichedDestCount++;
}

console.log(`Enriched ${enrichedDestCount} destinations with authentic guide accordions!`);

// 2. Remove guide pages from packages table
const guidePkgIds = new Set(
  db.packages.filter((p) => guideSlugs.has(p.slug)).map((p) => p.id)
);

db.packages = db.packages.filter((p) => !guideSlugs.has(p.slug));
db.package_itineraries = db.package_itineraries.filter(
  (it) => !guidePkgIds.has(it.package_id)
);

// 3. Clean up any trailing junk accordions in genuine packages (e.g. Castaway Island)
const castaway = db.packages.find(
  (p) => p.slug === 'experience-castaway-island-holiday-package-in-fijian-paradise'
);
if (castaway) {
  db.package_itineraries = db.package_itineraries.filter(
    (it) =>
      it.package_id !== castaway.id ||
      (it.title !== 'Accordion Item' && !it.description?.includes('Far far away'))
  );
  castaway.duration_days = 4;
  castaway.duration_nights = 3;
}

// 4. Clean up any remaining non-travel dummy items across all remaining packages
db.package_itineraries = db.package_itineraries.filter((it) => {
  const t = (it.title || '').trim().toLowerCase();
  const d = (it.description || '').trim().toLowerCase();
  if (t === 'accordion item' || d.includes('far far away, behind the word mountains')) {
    return false;
  }
  return true;
});

// 5. Ensure package duration_days matches authentic itineraries count
for (const p of db.packages) {
  const itins = db.package_itineraries.filter((i) => i.package_id === p.id);
  if (itins.length > 0 && Math.abs(p.duration_days - itins.length) > 0) {
    p.duration_days = itins.length;
    p.duration_nights = Math.max(1, itins.length - 1);
  }
}

console.log('--- CLEANUP RESULTS ---');
console.log('Total genuine tour packages:', db.packages.length);
console.log('Total destinations in catalog:', db.destinations.length);
console.log('Total authentic itinerary records:', db.package_itineraries.length);

// Persist database.json
fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
console.log('Saved updated server/database.json');

// Persist fallbackData.ts
const fallbackTs = `export const fallbackData: any = ${JSON.stringify(db, null, 2)};\n`;
fs.writeFileSync(FALLBACK_PATH, fallbackTs, 'utf8');
console.log('Saved updated src/data/fallbackData.ts');
