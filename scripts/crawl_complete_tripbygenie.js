const https = require('https');
const fs = require('fs');
const path = require('path');

function decodeEntities(str) {
  if (!str) return '';
  return str
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers });
        } catch (e) {
          reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

function extractDestinationsFromTitles(titles) {
  const destSet = new Set();
  const knownPlaces = [
    'Anchorage', 'Talkeetna', 'Denali', 'Fairbanks', 'Seward', 'Skagway', 'Juneau',
    'Phuket', 'Bangkok', 'Pattaya', 'Krabi', 'Phi Phi', 'Koh Samui', 'Chiang Mai',
    'Singapore', 'Kuala Lumpur', 'Penang', 'Langkawi', 'Malacca', 'Cameron Highlands', 'Kota Kinabalu',
    'Bali', 'Ubud', 'Kuta', 'Seminyak', 'Nusa Dua', 'Lombok', 'Gili Islands',
    'Hanoi', 'Halong Bay', 'Saigon', 'Da Nang', 'Hoi An', 'Hue', 'Ninh Binh', 'Mekong Delta', 'Siem Reap', 'Phnom Penh',
    'Tokyo', 'Kyoto', 'Osaka', 'Mount Fuji', 'Hakone', 'Nara', 'Hiroshima', 'Sapporo',
    'Dubai', 'Abu Dhabi', 'Sharjah', 'Doha', 'Muscat', 'Salalah', 'Cairo', 'Alexandria', 'Luxor', 'Aswan',
    'London', 'Paris', 'Rome', 'Florence', 'Venice', 'Milan', 'Zurich', 'Lucerne', 'Interlaken', 'Geneva',
    'Amsterdam', 'Brussels', 'Frankfurt', 'Munich', 'Vienna', 'Prague', 'Budapest', 'Barcelona', 'Madrid',
    'Athens', 'Santorini', 'Mykonos', 'Olympia', 'Oslo', 'Bergen', 'Stockholm', 'Copenhagen', 'Helsinki', 'Rovaniemi',
    'Sydney', 'Melbourne', 'Brisbane', 'Cairns', 'Gold Coast', 'Adelaide', 'Perth', 'Hobart', 'Auckland', 'Queenstown', 'Fiji', 'Nadi',
    'Cape Town', 'Johannesburg', 'Kruger', 'Durban', 'Nairobi', 'Masai Mara', 'Amboseli', 'Serengeti', 'Zanzibar',
    'Casablanca', 'Marrakech', 'Fes', 'Rabat', 'Victoria Falls', 'Harare', 'Mahe', 'Praslin',
    'Kashmir', 'Srinagar', 'Gulmarg', 'Pahalgam', 'Sonmarg', 'Leh', 'Ladakh', 'Nubra', 'Pangong',
    'Shimla', 'Manali', 'Dharamshala', 'Dalhousie', 'Kullu', 'Amritsar', 'Chandigarh',
    'Delhi', 'Agra', 'Jaipur', 'Udaipur', 'Jodhpur', 'Jaisalmer', 'Pushkar', 'Ranthambore',
    'Goa', 'North Goa', 'South Goa', 'Mumbai', 'Pune', 'Mahabaleshwar', 'Lonavala', 'Aurangabad',
    'Kerala', 'Kochi', 'Munnar', 'Thekkady', 'Alleppey', 'Kumarakom', 'Kovalam', 'Wayanad',
    'Ooty', 'Kodaikanal', 'Coorg', 'Mysore', 'Bangalore', 'Hampi', 'Chikmagalur',
    'Chennai', 'Mahabalipuram', 'Pondicherry', 'Madurai', 'Rameshwaram', 'Kanyakumari',
    'Andaman', 'Port Blair', 'Havelock', 'Neil Island', 'Sikkim', 'Gangtok', 'Darjeeling', 'Pelling',
    'Varanasi', 'Ayodhya', 'Prayagraj', 'Lucknow', 'Rishikesh', 'Haridwar', 'Dehradun', 'Mussoorie', 'Nainital'
  ];

  titles.forEach(t => {
    knownPlaces.forEach(p => {
      const reg = new RegExp(`\\b${p}\\b`, 'i');
      if (reg.test(t)) {
        destSet.add(p);
      }
    });
  });

  return Array.from(destSet);
}

function determineCategory(title, slug) {
  const t = (title + ' ' + slug).toLowerCase();
  if (t.includes('honeymoon') || t.includes('couple') || t.includes('romantic')) return 'Honeymoon Packages';
  if (t.includes('group') || t.includes('fixed departure') || t.includes('escorted')) return 'Group Tours';
  if (t.includes('weekend') || t.includes('short break') || t.includes('getaway')) return 'Weekend Getaways';
  if (t.includes('family')) return 'Family Holiday Packages';
  
  const indianKeywords = ['kashmir', 'ladakh', 'kerala', 'goa', 'himachal', 'manali', 'shimla', 'ooty', 'munnar', 'coorg', 'andaman', 'rajasthan', 'jaipur', 'udaipur', 'sikkim', 'gangtok', 'darjeeling', 'mumbai', 'delhi', 'agra', 'tirupathi', 'varanasi', 'ayodhya'];
  if (indianKeywords.some(k => t.includes(k))) return 'Domestic Holiday Packages';
  
  return 'International Holiday Packages';
}

function determineDestinationId(title, slug, destinationsCovered) {
  const t = (title + ' ' + slug + ' ' + destinationsCovered.join(' ')).toLowerCase();
  
  if (t.includes('anchorage') || t.includes('denali') || t.includes('alaska')) return 'dest_alaska';
  if (t.includes('usa') || t.includes('america') || t.includes('california') || t.includes('vegas') || t.includes('san francisco') || t.includes('hawaii')) return 'dest_america';
  if (t.includes('canada') || t.includes('toronto') || t.includes('vancouver') || t.includes('banff') || t.includes('rockies')) return 'dest_canada';
  if (t.includes('australia') || t.includes('sydney') || t.includes('melbourne') || t.includes('cairns') || t.includes('adelaide')) return 'dest_australia';
  if (t.includes('new zealand') || t.includes('auckland') || t.includes('queenstown')) return 'dest_new_zealand';
  if (t.includes('fiji')) return 'dest_pacific';
  if (t.includes('bali') || t.includes('indonesia')) return 'dest_bali';
  if (t.includes('thailand') || t.includes('phuket') || t.includes('bangkok') || t.includes('pattaya') || t.includes('krabi')) return 'dest_thailand';
  if (t.includes('vietnam') || t.includes('cambodia') || t.includes('hanoi') || t.includes('halong') || t.includes('saigon') || t.includes('angkor')) return 'dest_vietnam';
  if (t.includes('malaysia') || t.includes('singapore') || t.includes('kuala lumpur')) return 'dest_malaysia';
  if (t.includes('japan') || t.includes('tokyo') || t.includes('kyoto') || t.includes('osaka')) return 'dest_japan';
  if (t.includes('dubai') || t.includes('abu dhabi') || t.includes('uae')) return 'dest_dubai';
  if (t.includes('egypt') || t.includes('cairo')) return 'dest_middle_east';
  if (t.includes('switzerland') || t.includes('swiss') || t.includes('zurich') || t.includes('lucerne')) return 'dest_switzerland';
  if (t.includes('paris') || t.includes('france')) return 'dest_paris';
  if (t.includes('london') || t.includes('uk') || t.includes('britain') || t.includes('scotland')) return 'dest_europe';
  if (t.includes('greece') || t.includes('athens') || t.includes('santorini')) return 'dest_europe';
  if (t.includes('italy') || t.includes('rome') || t.includes('florence') || t.includes('venice')) return 'dest_europe';
  if (t.includes('scandinavia') || t.includes('norway') || t.includes('finland') || t.includes('sweden')) return 'dest_europe';
  if (t.includes('south africa') || t.includes('cape town') || t.includes('kruger')) return 'dest_south_africa';
  if (t.includes('kenya') || t.includes('nairobi') || t.includes('tanzania') || t.includes('safari')) return 'dest_africa';
  if (t.includes('morocco') || t.includes('casablanca') || t.includes('marrakech')) return 'dest_africa';
  if (t.includes('seychelles') || t.includes('mahe')) return 'dest_africa';
  if (t.includes('maldives')) return 'dest_maldives';
  
  // India
  if (t.includes('kashmir') || t.includes('srinagar') || t.includes('gulmarg')) return 'dest_kashmir';
  if (t.includes('ladakh') || t.includes('leh')) return 'dest_ladakh';
  if (t.includes('kerala') || t.includes('munnar') || t.includes('alleppey') || t.includes('kochi')) return 'dest_kerala';
  if (t.includes('goa')) return 'dest_goa';
  if (t.includes('himachal') || t.includes('manali') || t.includes('shimla')) return 'dest_himachal';
  if (t.includes('rajasthan') || t.includes('jaipur') || t.includes('udaipur')) return 'dest_rajasthan';
  if (t.includes('andaman') || t.includes('port blair')) return 'dest_andaman';
  if (t.includes('sikkim') || t.includes('gangtok') || t.includes('darjeeling')) return 'dest_northeast';
  if (t.includes('ooty') || t.includes('kodaikanal') || t.includes('coorg')) return 'dest_south_india';
  
  return 'dest_thailand';
}

async function runCompleteCrawl() {
  console.log('Starting complete TripbyGenie crawling...');
  const allExtractedPackages = [];
  const processedSlugs = new Set();
  
  for (let page = 1; page <= 6; page++) {
    console.log(`Fetching page ${page} of 6 (per_page=100)...`);
    try {
      const res = await fetchJson(`https://tripbygenie.in/wp-json/wp/v2/pages?per_page=100&page=${page}`);
      const items = res.data;
      if (!Array.isArray(items) || items.length === 0) break;
      
      console.log(`Page ${page} returned ${items.length} items. Parsing packages...`);
      
      for (const item of items) {
        const slug = item.slug;
        if (!slug || processedSlugs.has(slug)) continue;
        processedSlugs.add(slug);
        
        // Skip administrative / utility pages
        const skipSlugs = ['home', 'about-us', 'contact-us', 'services', 'privacy-policy', 'terms-and-conditions', 'cart', 'checkout', 'my-account', 'blogs', 'blog'];
        if (skipSlugs.includes(slug)) continue;
        
        const html = item.content ? item.content.rendered : '';
        const title = decodeEntities(item.title ? item.title.rendered : slug);
        
        // Extract day-by-day accordions
        const tRegex = /<span class="ekit-accordion-title">([\s\S]*?)<\/span>/gi;
        const cRegex = /class="[^"]*ekit-accordion--content[^"]*">([\s\S]*?)<\/div>/gi;
        
        const dayTitles = [];
        let m;
        while ((m = tRegex.exec(html)) !== null) {
          dayTitles.push(decodeEntities(m[1].replace(/<[^>]+>/g, '')));
        }
        
        const dayContents = [];
        while ((m = cRegex.exec(html)) !== null) {
          dayContents.push(decodeEntities(m[1].replace(/<[^>]+>/g, '')));
        }
        
        const itineraries = [];
        for (let i = 0; i < dayTitles.length; i++) {
          itineraries.push({
            day_number: i + 1,
            title: dayTitles[i],
            description: dayContents[i] || '',
            meals: 'Breakfast Included',
            activities: 'Curated Guided Sightseeing'
          });
        }
        
        // If no accordions, this is likely a destination overview category page, not an individual package with itinerary
        if (itineraries.length === 0) continue;
        
        // Extract lead paragraph for overview
        const pRegex = /<p>([\s\S]*?)<\/p>/gi;
        let overview = '';
        while ((m = pRegex.exec(html)) !== null) {
          const cleanP = decodeEntities(m[1].replace(/<[^>]+>/g, ''));
          // Take the first substantial paragraph that isn't an itinerary day
          if (cleanP.length > 60 && !cleanP.startsWith('Day ') && !cleanP.includes('Airport') && !cleanP.includes('Check in')) {
            overview = cleanP;
            break;
          }
        }
        if (!overview) {
          overview = `Experience ${title} with luxury handpicked accommodations, private chauffeured transfers, and comprehensive guided sightseeing curated by TripbyGenie specialists.`;
        }
        
        // Extract images
        const imgRegex = /<img[^>]+src="([^">]+)"/gi;
        const images = [];
        while ((m = imgRegex.exec(html)) !== null) {
          const src = m[1];
          if (!src.includes('.svg') && !src.includes('logo') && !src.includes('gravatar') && !images.includes(src)) {
            images.push(src);
          }
        }
        
        const destinationsCovered = extractDestinationsFromTitles(dayTitles);
        const durationDays = itineraries.length;
        const durationNights = Math.max(1, durationDays - 1);
        const category = determineCategory(title, slug);
        const destinationId = determineDestinationId(title, slug, destinationsCovered);
        
        // Highlights from day titles
        const highlights = dayTitles.map(t => {
          let clean = t.replace(/^Day\s*\d+\s*[:\-–—\.]\s*/i, '').trim();
          return clean;
        }).filter(Boolean).slice(0, 5);
        
        allExtractedPackages.push({
          wp_id: item.id,
          title,
          slug,
          original_source_url: `https://tripbygenie.in/${slug}/`,
          overview,
          category,
          destination_id: destinationId,
          duration_days: durationDays,
          duration_nights: durationNights,
          destinations_covered: destinationsCovered,
          starting_location: destinationsCovered[0] || 'Origin City',
          ending_location: destinationsCovered[destinationsCovered.length - 1] || destinationsCovered[0] || 'Origin City',
          cover_image: images[0] || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1000&q=80',
          gallery_images: images.slice(0, 6),
          highlights,
          inclusions: [
            `Accommodation for ${durationNights} Nights in Verified 4-Star Stays`,
            'Daily Gourmet Buffet Breakfast',
            'All Intercity Transfers & Airport Pick/Drop by Private AC Vehicle',
            'Entry Tickets & Sightseeing as Mentioned in Itinerary',
            '24/7 Dedicated TripbyGenie Concierge Ground Assistance'
          ],
          exclusions: [
            'International / Domestic Flight Tickets',
            'Personal Expenses, Laundry, and Tips',
            'Optional Adventure Activities & Water Sports',
            'Travel Insurance & Visa Processing Fees'
          ],
          itineraries
        });
      }
    } catch (err) {
      console.error(`Error fetching page ${page}:`, err.message);
    }
  }
  
  console.log(`Extraction complete! Successfully harvested ${allExtractedPackages.length} tour packages with authentic day-by-day itineraries.`);
  
  const totalItinDays = allExtractedPackages.reduce((acc, p) => acc + p.itineraries.length, 0);
  console.log(`Total authentic day-by-day itinerary records: ${totalItinDays}`);
  
  const OUT_FILE = path.join(__dirname, '..', 'server', 'extracted_complete_packages.json');
  fs.writeFileSync(OUT_FILE, JSON.stringify(allExtractedPackages, null, 2), 'utf8');
  console.log(`Saved master dataset to ${OUT_FILE}`);
}

runCompleteCrawl();
