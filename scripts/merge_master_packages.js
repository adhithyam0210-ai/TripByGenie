const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../server/database.json');
const COMPLETE_PATH = path.join(__dirname, '../server/extracted_complete_packages.json');
const FALLBACK_PATH = path.join(__dirname, '../src/data/fallbackData.ts');

const completePackages = JSON.parse(fs.readFileSync(COMPLETE_PATH, 'utf8'));
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

console.log('Loaded extracted packages:', completePackages.length);
console.log('Current DB packages:', db.packages.length);
console.log('Current DB itineraries:', db.package_itineraries.length);

// Build slug lookup for existing DB packages
const dbBySlug = new Map();
db.packages.forEach((p) => {
  if (p.slug) dbBySlug.set(p.slug.toLowerCase().trim(), p);
});

let updatedPkgs = 0;
let createdPkgs = 0;
let updatedItins = 0;

// Track existing itinerary IDs to avoid orphan or duplicate records
const completePkgIds = new Set();

for (const ext of completePackages) {
  const slug = ext.slug.toLowerCase().trim();
  let pkg = dbBySlug.get(slug);

  if (!pkg) {
    const newId = `pkg_${slug.replace(/[^a-z0-9]+/g, '_').substring(0, 40)}_${Date.now() % 10000}`;
    pkg = {
      id: newId,
      agency_id: 'agency_travel_genie',
      title: ext.title,
      slug: ext.slug,
      destination_id: ext.destination_id || 'dest_international',
      category: ext.category || 'International Holiday Packages',
      duration_days: ext.duration_days || 5,
      duration_nights: ext.duration_nights || Math.max(1, (ext.duration_days || 5) - 1),
      public_price: 45000 + (ext.duration_days || 5) * 8000,
      wholesale_price: Math.round((45000 + (ext.duration_days || 5) * 8000) * 0.8),
      agent_wholesale_price: Math.round((45000 + (ext.duration_days || 5) * 8000) * 0.78),
      cover_image: ext.cover_image,
      gallery: ext.gallery_images || [ext.cover_image],
      description: ext.overview || '',
      highlights: ext.highlights || [],
      inclusions: ext.inclusions || [],
      exclusions: ext.exclusions || [],
      accommodation: 'Handpicked 4-Star Boutique Hotels & Resorts',
      transportation: 'Dedicated Air-Conditioned Vehicle with Private Driver',
      starting_location: ext.starting_location || '',
      ending_location: ext.ending_location || '',
      destinations_covered: ext.destinations_covered || [],
      original_source_url: ext.original_source_url,
      is_featured: false,
      is_published: true,
      is_group_tour: false,
      created_at: new Date().toISOString()
    };
    db.packages.push(pkg);
    dbBySlug.set(slug, pkg);
    createdPkgs++;
  } else {
    // Update with real scraped content
    if (ext.overview && ext.overview.length > 20) {
      pkg.description = ext.overview;
    }
    if (ext.starting_location) pkg.starting_location = ext.starting_location;
    if (ext.ending_location) pkg.ending_location = ext.ending_location;
    if (ext.destinations_covered && ext.destinations_covered.length > 0) {
      pkg.destinations_covered = ext.destinations_covered;
    }
    pkg.original_source_url = ext.original_source_url;
    if (ext.duration_days) pkg.duration_days = ext.duration_days;
    if (ext.duration_nights) pkg.duration_nights = ext.duration_nights;
    if (ext.cover_image) pkg.cover_image = ext.cover_image;
    if (ext.gallery_images && ext.gallery_images.length > 0) pkg.gallery = ext.gallery_images;
    if (ext.highlights && ext.highlights.length > 0) pkg.highlights = ext.highlights;
    if (ext.inclusions && ext.inclusions.length > 0) pkg.inclusions = ext.inclusions;
    if (ext.exclusions && ext.exclusions.length > 0) pkg.exclusions = ext.exclusions;
    updatedPkgs++;
  }

  completePkgIds.add(pkg.id);

  // Remove existing itineraries for this package
  db.package_itineraries = db.package_itineraries.filter((it) => it.package_id !== pkg.id);

  // Insert authentic itineraries from crawl
  if (Array.isArray(ext.itineraries)) {
    const seenDays = new Set();
    for (const it of ext.itineraries) {
      const dayNum = Number(it.day_number) || 1;
      if (seenDays.has(dayNum)) continue;
      seenDays.add(dayNum);

      db.package_itineraries.push({
        id: `itin_${pkg.id}_day_${dayNum}`,
        package_id: pkg.id,
        day_number: dayNum,
        title: it.title,
        description: it.description,
        meals: it.meals || 'Breakfast Included',
        activities: it.activities || 'Sightseeing & Transfers'
      });
      updatedItins++;
    }
  }
}

console.log(`Updated ${updatedPkgs} packages, Created ${createdPkgs} packages.`);
console.log(`Inserted ${updatedItins} authentic itineraries across all packages.`);
console.log('Total packages in DB now:', db.packages.length);
console.log('Total itineraries in DB now:', db.package_itineraries.length);

// Persist database.json
fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
console.log('Saved updated database.json');

// Sync to fallbackData.ts
const fallbackTs = `export const fallbackData: any = ${JSON.stringify(db, null, 2)};\n`;
fs.writeFileSync(FALLBACK_PATH, fallbackTs, 'utf8');
console.log('Saved updated fallbackData.ts');
