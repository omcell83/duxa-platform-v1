const fs = require('fs');

const en = JSON.parse(fs.readFileSync('i18n/en.json', 'utf8'));
const tr = JSON.parse(fs.readFileSync('i18n/tr.json', 'utf8'));

const enKeys = Object.keys(en);
const trKeys = Object.keys(tr);

const missingInTr = enKeys.filter(key => !trKeys.includes(key));

console.log('Total keys in EN:', enKeys.length);
console.log('Total keys in TR:', trKeys.length);
console.log('Missing keys in TR:', missingInTr);
