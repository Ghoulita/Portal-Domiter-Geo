/**
 * fix-duplicates.js
 * Elimina duplicados de #arma-horario-modal y la tarjeta en el layout.
 * Uso: node fix-duplicates.js
 */

const fs = require('fs');
const path = require('path');

const componentsPath = path.join(__dirname, 'js', 'components.js');
const raw = fs.readFileSync(componentsPath, 'utf8');

const layoutMatch = raw.match(/APP_LAYOUT_ENCODED\s*=\s*"([^"]+)"/);
const modalsMatch = raw.match(/APP_MODALS_ENCODED\s*=\s*"([^"]+)"/);

if (!layoutMatch || !modalsMatch) {
    console.error('No se encontraron las variables.');
    process.exit(1);
}

const decode = (b64) => Buffer.from(b64, 'base64').toString('utf8');
const encode = (str) => Buffer.from(str, 'utf8').toString('base64');

let layoutHtml = decode(layoutMatch[1]);
let modalsHtml = decode(modalsMatch[1]);

// ── Limpiar duplicados de la tarjeta en el layout ─────────────────────────
// La tarjeta tiene un patrón identificable: el botón que llama a arma-horario-modal
const cardPattern = /\s*<div class="minimalist-card[^>]*>[\s\S]*?arma-horario-modal[\s\S]*?<\/div>\s*/g;
const cardMatches = [...layoutHtml.matchAll(cardPattern)];
console.log(`Tarjetas "Arma tu Horario" encontradas en layout: ${cardMatches.length}`);

if (cardMatches.length > 1) {
    // Mantener solo la primera, eliminar el resto
    let firstOccurrence = true;
    layoutHtml = layoutHtml.replace(cardPattern, (match) => {
        if (firstOccurrence) {
            firstOccurrence = false;
            return match;
        }
        return '';
    });
    console.log('✅ Tarjetas duplicadas del layout eliminadas.');
}

// ── Limpiar duplicados del modal ───────────────────────────────────────────
// El modal comienza con <div id="arma-horario-modal" y el PDF preview
// Dividir por la ocurrencia del modal
const modalStartMarker = '<div id="arma-horario-modal"';
const pdfPreviewMarker = '<div id="horario-pdf-preview"';

const modalCount = (modalsHtml.match(new RegExp(modalStartMarker, 'g')) || []).length;
console.log(`Modales "arma-horario-modal" encontrados: ${modalCount}`);

if (modalCount > 1) {
    // Encontrar el PRIMER inicio del modal y cortar todo lo que venga después de la primera instancia completa
    // Estrategia: encontrar la primera ocurrencia, luego la segunda y eliminar desde allí
    const firstIdx = modalsHtml.indexOf(modalStartMarker);
    const secondIdx = modalsHtml.indexOf(modalStartMarker, firstIdx + 1);
    
    if (secondIdx !== -1) {
        // Hay al menos un duplicado. Buscar el pdf-preview que precede al primer modal
        // El bloque completo del horario es: desde pdfPreviewMarker o modalStartMarker hasta el final
        // Cortar justo antes del segundo modal
        modalsHtml = modalsHtml.substring(0, secondIdx).trimEnd();
        
        // Verificar que el bloque del modal esté balanceado (termina correctamente)
        // Agregar los cierres necesarios si faltan
        const openDivsBefore = (modalsHtml.match(/<div/g) || []).length;
        const closeDivsBefore = (modalsHtml.match(/<\/div>/g) || []).length;
        const missing = openDivsBefore - closeDivsBefore;
        for (let i = 0; i < missing; i++) {
            modalsHtml += '\n    </div>';
        }
        
        console.log(`✅ Modales duplicados eliminados. (tenía ${modalCount}, ahora 1)`);
    }
}

// También eliminar el bloque pdf-preview duplicado si existe
const pdfCount = (modalsHtml.match(new RegExp(pdfPreviewMarker, 'g')) || []).length;
if (pdfCount > 1) {
    const firstPdf = modalsHtml.indexOf(pdfPreviewMarker);
    const secondPdf = modalsHtml.indexOf(pdfPreviewMarker, firstPdf + 1);
    if (secondPdf !== -1) {
        // Cortar antes del segundo pdf-preview
        modalsHtml = modalsHtml.substring(0, secondPdf).trimEnd();
        // Cerrar el modal principal y el bloque raíz
        modalsHtml += '\n    </div>\n</div>';
        console.log(`✅ PDF-preview duplicados eliminados.`);
    }
}

// ── Verificar que el grid sea correcto ───────────────────────────────────── 
// Asegurar que el grid tenga 4 columnas
if (layoutHtml.includes('class="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"')) {
    layoutHtml = layoutHtml.replace(
        'class="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"',
        'class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"'
    );
    console.log('✅ Grid corregido a 4 columnas.');
}

// ── Guardar ───────────────────────────────────────────────────────────────
const newContent = `// HTML Components (Obfuscated Base64)\nwindow.APP_LAYOUT_ENCODED = "${encode(layoutHtml)}";\nwindow.APP_MODALS_ENCODED = "${encode(modalsHtml)}";`;
fs.writeFileSync(componentsPath, newContent, 'utf8');

console.log('\n✅ components.js limpio y actualizado.');
console.log(`   Layout: ${encode(layoutHtml).length} chars`);
console.log(`   Modals: ${encode(modalsHtml).length} chars`);
