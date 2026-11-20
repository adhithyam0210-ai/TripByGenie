const https = require('https');

https.get('https://tripbygenie.in/wp-json/wp/v2/pages?slug=anchorage-to-denali-tour-package-for-nature-lovers', { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const list = JSON.parse(d);
    const html = list[0].content.rendered;
    
    // Look for duration or days
    const durationMatch = html.match(/(\d+)\s*Days?\s*[\/\-&]?\s*(\d+)\s*Nights?/i) || html.match(/(\d+)\s*Days?/i);
    console.log('Duration match:', durationMatch ? durationMatch[0] : 'None');

    // Look for images in the content
    const imgMatches = [];
    const imgRegex = /<img[^>]+src="([^">]+)"/gi;
    let m;
    while ((m = imgRegex.exec(html)) !== null) {
      if (!m[1].includes('.svg') && !m[1].includes('logo')) {
        imgMatches.push(m[1]);
      }
    }
    console.log('Images found (' + imgMatches.length + '):', imgMatches.slice(0, 5));

    // Look for overview / description paragraph before accordions
    const pMatches = [];
    const pRegex = /<p>([\s\S]*?)<\/p>/gi;
    while ((m = pRegex.exec(html)) !== null) {
      const clean = m[1].replace(/<[^>]+>/g, '').trim();
      if (clean.length > 50) pMatches.push(clean);
    }
    console.log('Paragraphs found (' + pMatches.length + '):');
    pMatches.slice(0, 4).forEach((p, i) => console.log(' P' + (i+1) + ': ' + p.slice(0, 100) + '...'));

    // Look for accordion titles and content
    const titles = [];
    const tRegex = /<span class="ekit-accordion-title">([\s\S]*?)<\/span>/gi;
    while ((m = tRegex.exec(html)) !== null) {
      titles.push(m[1].replace(/<[^>]+>/g, '').trim());
    }
    console.log('Accordion titles (' + titles.length + '):', titles);
  });
});
