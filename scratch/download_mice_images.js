const https = require('https');
const fs = require('fs');
const path = require('path');

const targetDir = 'public/images/mice';
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const items = [
  {
    name: 'mice-meetings.webp',
    url: 'https://tripbygenie.in/wp-content/uploads/2025/06/modern-equipped-computer-lab_23-2149241213.webp'
  },
  {
    name: 'mice-incentives.webp',
    url: 'https://tripbygenie.in/wp-content/uploads/2025/06/istockphoto-1410593443-612x612-1.webp'
  },
  {
    name: 'mice-conferences.webp',
    url: 'https://tripbygenie.in/wp-content/uploads/2025/06/speaker-conducts-business-conference-journalists-novice-entrepreneurs_160672-31557.webp'
  },
  {
    name: 'mice-exhibitions.webp',
    url: 'https://tripbygenie.in/wp-content/uploads/2025/06/istockphoto-887680492-612x612-1.webp'
  }
];

function download(item) {
  return new Promise((resolve, reject) => {
    const dest = path.join(targetDir, item.name);
    const file = fs.createWriteStream(dest);
    https.get(item.url, res => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed ${item.url}: status ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Saved ${dest} (${fs.statSync(dest).size} bytes)`);
        resolve();
      });
    }).on('error', err => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

(async () => {
  for (const item of items) {
    try {
      await download(item);
    } catch (e) {
      console.error(e);
    }
  }
})();
