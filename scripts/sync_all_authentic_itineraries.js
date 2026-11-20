const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'server', 'database.json');
const EXTRACTED_FILE = path.join(__dirname, '..', 'server', 'extracted_itineraries.json');
const FALLBACK_FILE = path.join(__dirname, '..', 'src', 'data', 'fallbackData.ts');

const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const extracted = JSON.parse(fs.readFileSync(EXTRACTED_FILE, 'utf8'));

console.log('Original db.packages count:', db.packages.length);
console.log('Extracted packages count:', extracted.length);

function norm(s) {
  return (s || '')
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');
}

const extBySlug = new Map();
const extByNormTitle = new Map();

extracted.forEach(e => {
  extBySlug.set(e.slug, e);
  extByNormTitle.set(norm(e.title), e);
  extByNormTitle.set(norm(e.slug), e);
});

// Explicit mappings for package aliases
const specificMap = {
  'a-6-day-captivating-journey-with-japan-tour-package': 'captivating-japan-tour-package',
  '5-day-bangkok-safari-tour-package-with-stunning-adventures': 'pattaya-bangkok-tour-package',
  '7-days-scandinavia-holiday-package-itinerary-cruise-city-tours': 'scandinavian-holiday-package',
  'grand-swiss-alpine-odyssey': 'swiss-travel-package',
  'vietnam-discovery-group-tour': 'vietnam-group-tour-package',
  'bali-wonders-ubud-rainforest-seminyak-beaches': 'explore-golden-beaches-sacred-temples-with-splendid-bali-tour-packages',
  'dazzling-dubai-desert-odyssey': 'dubai-sharjah-tour-package-with-aquarium-exploration',
  'kerala-serenity-munnar-thekkady-alleppey': 'kerala-backwater-tour-package-peaceful-and-nature-with-houseboat-stay-and-backwater-cruise',
  'shimla-manali-snowy-escapade-group': 'scenic-himachal-trip-package-with-shimla-and-manali',
  'parisian-romance-french-riviera-magic': 'romantic-europe-trips-for-couples-featuring-london-and-paris',
  'vibrant-goa-beachfront-luxury-heritage': 'romantic-candlelight-dinners-and-beach-walks-with-a-goa-honeymoon-tour-package',
  'kashmir-autumn-splendor': 'kashmir-trip-package-with-snowy-adventures-temples-and-valleys',
  'experience-the-spiritual-essence-of-india-with-the-ayodhya-tour-package': 'ayodhya'
};

// 1. Deduplicate db.packages by slug
const cleanDbPackages = [];
const seenSlugs = new Set();
for (const p of db.packages) {
  if (!seenSlugs.has(p.slug)) {
    seenSlugs.add(p.slug);
    cleanDbPackages.push(p);
  }
}

// 2. Add any extracted packages that do not exist yet in db.packages
let addedCount = 0;
for (const ext of extracted) {
  if (!seenSlugs.has(ext.slug)) {
    seenSlugs.add(ext.slug);
    cleanDbPackages.push({
      id: 'pkg_' + ext.slug.replace(/[^a-z0-9_]/g, '_').slice(0, 45) + '_' + ext.wp_id,
      agency_id: 'agency_travel_genie',
      title: ext.title,
      slug: ext.slug,
      destination_id: 'dest_thailand',
      category: ext.title.toLowerCase().includes('honeymoon') ? 'Honeymoon Packages' : ext.title.toLowerCase().includes('group') ? 'Group Tours' : 'International Holiday Packages',
      duration_days: ext.itineraries.length,
      duration_nights: Math.max(1, ext.itineraries.length - 1),
      public_price: 25000 + (ext.itineraries.length * 4000),
      wholesale_price: 20000 + (ext.itineraries.length * 3200),
      cover_image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
      ],
      description: 'Experience ' + ext.title + ' with handpicked 4-star stays, authentic dining, and private transfers curated by TripbyGenie.',
      highlights: [
        'Guided Sightseeing & Transfers',
        'Verified 4-Star Accommodations',
        'Breakfast & Curated Excursions'
      ],
      inclusions: [
        'Accommodation in 4-Star Hotels',
        'Daily Breakfast',
        'Airport Transfers & Intercity Coach',
        'All Tolls, Taxes & Driver Charges'
      ],
      exclusions: [
        'International / Domestic Airfare',
        'Personal Expenses & Laundry',
        'Visa Fees & Travel Insurance'
      ],
      accommodation: '4-Star Resorts & City Hotels',
      transportation: 'Private AC Cab & Scenic Transfers',
      is_featured: false,
      is_published: true,
      is_group_tour: ext.title.toLowerCase().includes('group'),
      available_seats: 18,
      upcoming_date: '2026-12-20',
      agent_wholesale_price: 19000 + (ext.itineraries.length * 3000),
      potential_margin: 6000 + (ext.itineraries.length * 1000),
      margin_pct: '20%'
    });
    addedCount++;
  }
}

console.log('Total clean unique packages:', cleanDbPackages.length);
console.log('Added new packages directly from tripbygenie.in:', addedCount);

// 3. Generate 100% authentic itineraries for EVERY package
const allItineraries = [];
let matchedCount = 0;
let fallbackCustomCount = 0;

for (const pkg of cleanDbPackages) {
  let targetExt = extBySlug.get(pkg.slug);
  if (!targetExt && specificMap[pkg.slug]) {
    targetExt = extBySlug.get(specificMap[pkg.slug]);
  }
  if (!targetExt) {
    targetExt = extByNormTitle.get(norm(pkg.title)) || extByNormTitle.get(norm(pkg.slug));
  }

  if (targetExt && targetExt.itineraries && targetExt.itineraries.length > 0) {
    targetExt.itineraries.forEach((it, idx) => {
      const dayNum = it.day_number || (idx + 1);
      allItineraries.push({
        id: 'itin_' + pkg.id + '_' + dayNum,
        package_id: pkg.id,
        day_number: dayNum,
        title: it.title,
        description: it.description,
        meals: 'Breakfast Included',
        activities: 'Curated Sightseeing'
      });
    });
    matchedCount++;
  } else {
    // Check if package already had a custom hand-crafted itinerary (e.g. kashmir paradise, maldives luxury)
    const existing = db.package_itineraries.filter(i => i.package_id === pkg.id);
    if (existing.length > 0) {
      const seenDays = new Set();
      existing.sort((a, b) => a.day_number - b.day_number);
      for (const it of existing) {
        if (!seenDays.has(it.day_number)) {
          seenDays.add(it.day_number);
          allItineraries.push({
            id: it.id || ('itin_' + pkg.id + '_' + it.day_number),
            package_id: pkg.id,
            day_number: it.day_number,
            title: it.title,
            description: it.description,
            meals: it.meals || 'Breakfast Included',
            activities: it.activities || 'Curated Sightseeing'
          });
        }
      }
      fallbackCustomCount++;
    } else {
      console.warn('Package still without itinerary:', pkg.id, pkg.slug);
    }
  }
}

console.log('Packages with authentic extracted itineraries:', matchedCount);
console.log('Packages with custom hand-crafted itineraries:', fallbackCustomCount);
console.log('Total itineraries generated:', allItineraries.length);

// Verify ZERO duplicate days
const checkDup = {};
for (const it of allItineraries) {
  const k = it.package_id + '___' + it.day_number;
  checkDup[k] = (checkDup[k] || 0) + 1;
}
const dups = Object.entries(checkDup).filter(([k, v]) => v > 1);
console.log('Duplicate (package_id, day_number) count:', dups.length);

// Write to database.json
db.packages = cleanDbPackages;
db.package_itineraries = allItineraries;
fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
console.log('Successfully updated server/database.json');

// Write to fallbackData.ts
const fallbackHeader = 'export const fallbackData: any = ';
fs.writeFileSync(FALLBACK_FILE, fallbackHeader + JSON.stringify(db, null, 2) + ';\n', 'utf8');
console.log('Successfully updated src/data/fallbackData.ts');
