const fs = require('fs');
let code = fs.readFileSync('server/index.js', 'utf8');
const count = (code.match(/authorize\(\['admin'\]\)/g) || []).length;
console.log('authorize([\'admin\']) count:', count);
code = code.replace(/authorize\(\['admin'\]\)/g, "authorize(['admin', 'manager'])");
fs.writeFileSync('server/index.js', code, 'utf8');
console.log('Successfully updated authorize([\'admin\']) to authorize([\'admin\', \'manager\'])');
