const https = require('https');

function fetchPage(slug) {
  return new Promise((resolve, reject) => {
    https.get('https://tripbygenie.in/wp-json/wp/v2/pages?slug=' + encodeURIComponent(slug), {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json[0]);
        } catch(e) { resolve(null); }
      });
    }).on('error', reject);
  });
}

async function run() {
  const testSlugs = [
    'experience-castaway-island-holiday-package-in-fijian-paradise',
    'kolkata',
    'tamil-nadu',
    'anchorage-to-denali-tour-package-for-nature-lovers',
    'the-ideal-phuket-tour-package-with-bangkok-escapade'
  ];

  for (const slug of testSlugs) {
    console.log(`\n=================== SLUG: ${slug} ===================`);
    const page = await fetchPage(slug);
    if (!page) {
      console.log('Page not found on WordPress API');
      continue;
    }
    const html = page.content?.rendered || '';
    console.log('Title:', page.title?.rendered);

    // Look for all headings or accordion titles
    const accTitleRegex = /<span[^>]*class=["'][^"']*ekit-accordion-title[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi;
    let match;
    let index = 0;
    while ((match = accTitleRegex.exec(html)) !== null) {
      index++;
      const cleanTitle = match[1].replace(/<[^>]+>/g, '').trim();
      console.log(`Accordion #${index}: "${cleanTitle}"`);
    }

    // Look for sections or headings
    const hRegex = /<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi;
    let hMatch;
    console.log('Headings in page:');
    while ((hMatch = hRegex.exec(html)) !== null) {
      const hText = hMatch[1].replace(/<[^>]+>/g, '').trim();
      if (hText.length > 0 && hText.length < 80) {
        console.log(`  - ${hText}`);
      }
    }
  }
}

run();
