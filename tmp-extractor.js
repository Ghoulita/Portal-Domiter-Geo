const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, 'index.html');
const indexHtmlContent = fs.readFileSync(srcFile, 'utf8');

// Extraction
const getBlock = (startTag, endTag) => {
    const start = indexHtmlContent.indexOf(startTag);
    const end = indexHtmlContent.indexOf(endTag) + endTag.length;
    if (start === -1 || end === -1) {
        throw new Error(`Could not find ${startTag} or ${endTag}`);
    }
    return indexHtmlContent.substring(start, end);
};

// Modals specifically
const modalsStart = indexHtmlContent.indexOf('<div id="horario-modal"');
const modalsEnd = indexHtmlContent.indexOf('</div>', indexHtmlContent.lastIndexOf('</div>', indexHtmlContent.lastIndexOf('</div>') - 1) - 1) + 6; // Just grabbing the chunk.
// Actually, looking at the previous file view, the last modal is cronograma-modal, ends around 1161.
// Let's just grab everything between <footer...></footer> and <script src="main.js">
const footerEndTag = '</footer>';
const mainScriptTag = '<script src="main.js"></script>';

const footerEndIndex = indexHtmlContent.indexOf(footerEndTag) + footerEndTag.length;
const scriptStartIndex = indexHtmlContent.indexOf(mainScriptTag);

let modalsHtml = indexHtmlContent.substring(footerEndIndex, scriptStartIndex).trim();

const headerHtml = getBlock('<header', '</header>');
const mainHtml = getBlock('<main', '</main>');
const footerHtml = getBlock('<footer', '</footer>');

// Convert to Base64 (supporting UTF-8)
const encodeBase64 = (str) => {
    return Buffer.from(str, 'utf8').toString('base64');
};

const componentsContent = `
// HTML Components (Obfuscated Base64)
const APP_LAYOUT_ENCODED = "${encodeBase64(headerHtml + '\\n' + mainHtml + '\\n' + footerHtml)}";
const APP_MODALS_ENCODED = "${encodeBase64(modalsHtml)}";
`;

const renderContent = `
// Renderer Engine
(function() {
    // Basic decoder for utf8 base64
    function decodeBase64(str) {
        return decodeURIComponent(escape(window.atob(str)));
    }
    
    document.addEventListener("DOMContentLoaded", function() {
        const rootApp = document.getElementById("root-app");
        const rootModals = document.getElementById("root-modals");
        
        if (rootApp && typeof APP_LAYOUT_ENCODED !== 'undefined') {
            rootApp.innerHTML = decodeBase64(APP_LAYOUT_ENCODED);
        }
        if (rootModals && typeof APP_MODALS_ENCODED !== 'undefined') {
            rootModals.innerHTML = decodeBase64(APP_MODALS_ENCODED);
        }
    });
})();
`;

const securityContent = `
// Anti-DevTools / Security script
(function() {
    // Bloquear click derecho
    document.addEventListener('contextmenu', event => event.preventDefault());

    // Bloquear combinaciones de teclas típicas (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U)
    document.addEventListener('keydown', function(event) {
        // F12
        if (event.keyCode === 123) {
            event.preventDefault();
            return false;
        }
        // Ctrl+Shift+I (Inspeccionar)
        if (event.ctrlKey && event.shiftKey && event.keyCode === 73) {
            event.preventDefault();
            return false;
        }
        // Ctrl+Shift+J (Consola)
        if (event.ctrlKey && event.shiftKey && event.keyCode === 74) {
            event.preventDefault();
            return false;
        }
        // Ctrl+U (Ver código fuente)
        if (event.ctrlKey && event.keyCode === 85) {
            event.preventDefault();
            return false;
        }
    });

    // Pequeña disuasión en consola
    console.log("%c¡Alto ahí!", "color: red; font-size: 40px; font-weight: bold;");
    console.log("%cEl código fuente está protegido. Acceso no autorizado.", "color: gray; font-size: 14px;");
})();
`;

const newIndexContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Domiter UCV - Portal Académico</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="styles.css">
    
    <!-- Security Module -->
    <script src="js/security.js"></script>
</head>
<body class="antialiased">

    <!-- SPA Application Mount Points -->
    <div id="root-app"></div>
    <div id="root-modals"></div>

    <!-- Obfuscated Logic -->
    <script src="js/components.js"></script>
    <script src="js/render.js"></script>

    <!-- Main JS Application -->
    <script src="main.js"></script>
</body>
</html>`;

// Write JS files
if (!fs.existsSync(path.join(__dirname, 'js'))) {
    fs.mkdirSync(path.join(__dirname, 'js'));
}

fs.writeFileSync(path.join(__dirname, 'js', 'components.js'), componentsContent.trim());
console.log('Created js/components.js');

fs.writeFileSync(path.join(__dirname, 'js', 'render.js'), renderContent.trim());
console.log('Created js/render.js');

fs.writeFileSync(path.join(__dirname, 'js', 'security.js'), securityContent.trim());
console.log('Created js/security.js');

// Overwrite index.html
fs.writeFileSync(path.join(__dirname, 'index.html'), newIndexContent);
console.log('Modified index.html');

console.log('Extraction complete!');
