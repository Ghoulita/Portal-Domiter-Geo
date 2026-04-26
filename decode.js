const fs = require('fs'); 
const code = fs.readFileSync('js/components.js', 'utf8'); 
const layoutMatch = code.match(/const APP_LAYOUT_ENCODED = "([^"]+)"/); 
const modalsMatch = code.match(/const APP_MODALS_ENCODED = "([^"]+)"/); 
fs.writeFileSync('layout.html', Buffer.from(layoutMatch[1], 'base64').toString('utf8')); 
fs.writeFileSync('modals.html', Buffer.from(modalsMatch[1], 'base64').toString('utf8')); 
console.log('Decoded');
