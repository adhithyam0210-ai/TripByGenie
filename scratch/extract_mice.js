const https = require('https');
const fs = require('fs');

https.get('https://tripbygenie.in/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const idx = data.indexOf('ekit-image-accordion elementskit-image-accordion-wraper');
    if (idx !== -1) {
      const slice = data.substring(idx - 1000, idx + 6000);
      fs.writeFileSync('scratch/mice_slice.html', slice);
      console.log('Saved mice_slice.html successfully!');
    } else {
      console.log('Not found');
    }
  });
}).on('error', err => console.error(err));
