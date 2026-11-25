const https = require('https');
const fs = require('fs');

https.get('https://tripbygenie.in/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const idx = data.indexOf('M - Meetings');
    if (idx !== -1) {
      const headingSlice = data.substring(idx - 2500, idx);
      fs.writeFileSync('scratch/mice_heading.html', headingSlice);
      console.log('Saved headingSlice!');
    }
  });
}).on('error', err => console.error(err));
