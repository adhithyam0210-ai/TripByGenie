const https = require('https');
const fs = require('fs');

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
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function testPage1() {
  console.log('Fetching page 1...');
  const res = await fetchJson('https://tripbygenie.in/wp-json/wp/v2/pages?per_page=10&page=1');
  console.log('Fetched 10 items. Total pages header:', res.headers['x-wp-totalpages'], 'Total items:', res.headers['x-wp-total']);
  
  for (const page of res.data) {
    const html = page.content ? page.content.rendered : '';
    
    // Extract accordion titles & descriptions
    const itineraries = [];
    const tRegex = /<span class="ekit-accordion-title">([\s\S]*?)<\/span>/gi;
    const cRegex = /class="[^"]*ekit-accordion--content[^"]*">([\s\S]*?)<\/div>/gi;
    
    const titles = [];
    let m;
    while ((m = tRegex.exec(html)) !== null) {
      titles.push(decodeEntities(m[1].replace(/<[^>]+>/g, '')));
    }
    const contents = [];
    while ((m = cRegex.exec(html)) !== null) {
      contents.push(decodeEntities(m[1].replace(/<[^>]+>/g, '')));
    }
    
    for (let i = 0; i < titles.length; i++) {
      itineraries.push({
        day_number: i + 1,
        title: titles[i],
        description: contents[i] || ''
      });
    }

    if (itineraries.length > 0) {
      console.log('Package:', decodeEntities(page.title.rendered), '| Days:', itineraries.length);
    }
  }
}

testPage1();
