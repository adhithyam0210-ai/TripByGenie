const https = require('https');

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        resolve({ url, status: res.statusCode, length: data.length, title: (data.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] });
      });
    }).on('error', err => resolve({ url, error: err.message }));
  });
}

async function run() {
  const urls = [
    'https://tripbygenie.in/terms-of-service/',
    'https://tripbygenie.in/terms-and-conditions/',
    'https://tripbygenie.in/terms/',
    'https://tripbygenie.in/cancellation-policy/',
    'https://tripbygenie.in/refund-policy/',
    'https://tripbygenie.in/cancellation-refund-policy/'
  ];
  for (const u of urls) {
    const res = await checkUrl(u);
    console.log(JSON.stringify(res));
  }
}
run();
