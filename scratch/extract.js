const fs = require('fs');

const html = fs.readFileSync('scratch/privacy_policy.html', 'utf8');

// Strip out non-content
let content = html;
const m = html.match(/<article[\s\S]*?<\/article>/i) || html.match(/<main[\s\S]*?<\/main>/i);
if (m) content = m[0];

content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
content = content.replace(/<style[\s\S]*?<\/style>/gi, '');

const elements = [];
const tagRegex = /<(h[1-6]|p|li)[\s\S]*?>([\s\S]*?)<\/\1>/gi;
let match;
while ((match = tagRegex.exec(content)) !== null) {
  const tag = match[1].toLowerCase();
  const text = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length > 0 && !text.includes('cli-') && !text.includes('Cookie')) {
    elements.push({ tag, text });
  }
}

fs.writeFileSync('scratch/extracted_privacy.json', JSON.stringify(elements, null, 2), 'utf8');
console.log('Saved extracted elements:', elements.length);
