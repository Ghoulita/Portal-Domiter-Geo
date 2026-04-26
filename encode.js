const fs = require('fs');
const layoutHtml = fs.readFileSync('layout.html', 'utf8');
const modalsHtml = fs.readFileSync('modals.html', 'utf8');
const encodeBase64 = (str) => Buffer.from(str, 'utf8').toString('base64');
const componentsContent = `
// HTML Components (Obfuscated Base64)
const APP_LAYOUT_ENCODED = "${encodeBase64(layoutHtml)}";
const APP_MODALS_ENCODED = "${encodeBase64(modalsHtml)}";
`;
fs.writeFileSync('js/components.js', componentsContent.trim());
console.log('Encoded to js/components.js');
