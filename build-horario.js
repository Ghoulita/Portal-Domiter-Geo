/**
 * build-horario.js
 * Script de construcción para agregar la sección "Arma tu Horario" al portal.
 * Uso: node build-horario.js
 */

const fs = require('fs');
const path = require('path');

// ─── 1. Leer y decodificar el Base64 actual ────────────────────────────────

const componentsPath = path.join(__dirname, 'js', 'components.js');
const componentsRaw = fs.readFileSync(componentsPath, 'utf8');

// Extraer el string Base64 del layout
const layoutMatch = componentsRaw.match(/APP_LAYOUT_ENCODED\s*=\s*"([^"]+)"/);
const modalsMatch = componentsRaw.match(/APP_MODALS_ENCODED\s*=\s*"([^"]+)"/);

if (!layoutMatch || !modalsMatch) {
    console.error('No se pudo encontrar APP_LAYOUT_ENCODED o APP_MODALS_ENCODED');
    process.exit(1);
}

const decodeBase64 = (b64) => Buffer.from(b64, 'base64').toString('utf8');
const encodeBase64 = (str) => Buffer.from(str, 'utf8').toString('base64');

let layoutHtml = decodeBase64(layoutMatch[1]);
let modalsHtml = decodeBase64(modalsMatch[1]);

// ─── 2. Modificar el LAYOUT: Tarjeta "Arma tu Horario" ────────────────────

// Cambiar grid de 3 a 4 columnas (solo si no ya fue cambiado)
if (!layoutHtml.includes('class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4')) {
    layoutHtml = layoutHtml.replace(
        'class="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"',
        'class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"'
    );
}

// Insertar la nueva tarjeta solo si no existe ya
const serviciosSectionEnd = '</section>\n\n        <section id="tramites"';
const nuevaTarjeta = `
            <div class="minimalist-card p-8 sm:p-10 text-center flex flex-col items-center">
                <i class="fas fa-calendar-week text-4xl text-yellow-600 mb-6"></i>
                <h3 class="text-[#a57c00] tracking-wide mb-3 uppercase">Arma tu Horario</h3>
                <p class="text-[#374151] mb-8 text-sm">Construye tu propio horario semanal combinando materias de distintos semestres y descárgalo en PDF.</p>
                <button onclick="abrirModal('arma-horario-modal')" class="mt-auto border border-gray-300 px-6 py-2 uppercase text-xs tracking-widest hover:bg-yellow-600 hover:text-white hover:border-yellow-600 transition w-full">Armar Horario</button>
            </div>

        </section>\n\n        <section id="tramites"`;

if (!layoutHtml.includes("arma-horario-modal")) {
    layoutHtml = layoutHtml.replace(serviciosSectionEnd, nuevaTarjeta);
}

// ─── 3. Agregar el modal "Arma tu Horario" al final de los modales ─────────

const nuevoModal = `
    <div id="arma-horario-modal" class="modal-overlay fixed inset-0 bg-black bg-opacity-60 z-50 items-center justify-center p-3 sm:p-4">
        <div class="bg-white w-full max-w-6xl h-[90vh] p-5 sm:p-8 relative shadow-2xl flex flex-col border-t-4 border-[#d4af37]">
            <button onclick="cerrarModal('arma-horario-modal')" class="absolute top-4 right-6 text-gray-400 hover:text-gray-800 text-3xl">&times;</button>

            <!-- Header del modal -->
            <div class="mb-4 border-b border-gray-200 pb-4 shrink-0">
                <h2 class="text-xl sm:text-3xl text-[#a57c00] mb-1 flex items-center gap-3">
                    <i class="fas fa-calendar-week"></i> Arma tu Horario
                </h2>
                <p class="text-[#374151] italic text-xs sm:text-sm">Selecciona las materias que cursarás este semestre. Se te avisará si hay solapamientos.</p>
            </div>

            <!-- Alerta de solapamiento -->
            <div id="solapamiento-alert" class="hidden mb-3 bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded flex items-start gap-3 shrink-0 text-sm">
                <i class="fas fa-exclamation-triangle text-red-500 mt-0.5 text-lg shrink-0"></i>
                <div>
                    <strong class="block mb-0.5">⚠ Solapamiento detectado</strong>
                    <span id="solapamiento-detalle"></span>
                    <span class="block text-xs text-red-600 mt-1 italic">Se agregó igual, pero revisa si es intencional.</span>
                </div>
            </div>

            <!-- Cuerpo en 3 columnas -->
            <div class="flex gap-4 flex-1 overflow-hidden min-h-0">

                <!-- Panel Izquierdo: Catálogo de Materias -->
                <div class="w-64 shrink-0 flex flex-col border border-gray-200 rounded bg-gray-50">
                    <div class="p-3 border-b border-gray-200 shrink-0">
                        <p class="text-xs font-bold text-[#a57c00] uppercase tracking-widest mb-2">Materias Disponibles</p>
                        <div class="relative">
                            <i class="fas fa-search absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                            <input type="text" id="catalogo-buscador" oninput="filtrarCatalogo(this.value)" placeholder="Buscar materia..." class="w-full border border-gray-300 pl-7 pr-2 py-1.5 text-xs focus:outline-none focus:border-[#d4af37] transition rounded">
                        </div>
                    </div>
                    <div id="catalogo-lista" class="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                        <p class="text-xs text-gray-400 italic text-center py-4">Cargando materias...</p>
                    </div>
                </div>

                <!-- Panel Central: Tabla Semanal -->
                <div class="flex-1 flex flex-col min-w-0">
                    <p class="text-xs font-bold text-[#a57c00] uppercase tracking-widest mb-2 shrink-0">Vista Semanal</p>
                    <div class="flex-1 overflow-auto custom-scrollbar" id="tabla-semanal-wrapper">
                        <div id="tabla-semanal" class="horario-tabla-grid">
                            <!-- Generado por JS -->
                        </div>
                    </div>
                </div>

                <!-- Panel Derecho: Seleccionadas + Acciones -->
                <div class="w-56 shrink-0 flex flex-col gap-3">
                    <!-- Lista de seleccionadas -->
                    <div class="border border-gray-200 rounded bg-gray-50 flex flex-col flex-1 overflow-hidden">
                        <div class="p-3 border-b border-gray-200 shrink-0">
                            <p class="text-xs font-bold text-[#a57c00] uppercase tracking-widest">Mi Selección</p>
                            <p id="contador-materias" class="text-xs text-gray-400 mt-0.5">0 materia(s) seleccionada(s)</p>
                        </div>
                        <div id="lista-seleccionadas" class="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                            <p class="text-xs text-gray-400 italic text-center py-4">Ninguna materia seleccionada</p>
                        </div>
                    </div>

                    <!-- Campo nombre para PDF -->
                    <div class="border border-gray-200 rounded bg-gray-50 p-3">
                        <label class="text-xs font-bold text-[#a57c00] uppercase tracking-widest block mb-2">Nombre en PDF <span class="text-gray-400 normal-case font-normal">(opcional)</span></label>
                        <input type="text" id="nombre-estudiante-pdf" placeholder="Tu nombre aquí..." maxlength="60" class="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:border-[#d4af37] transition rounded">
                    </div>

                    <!-- Botones de acción -->
                    <div class="space-y-2">
                        <button onclick="descargarHorarioPDF()" id="btn-descargar-pdf" disabled
                            class="w-full border border-gray-300 px-4 py-2 text-xs uppercase tracking-widest transition bg-white text-gray-400 cursor-not-allowed" 
                            title="Agrega al menos una materia">
                            <i class="fas fa-file-pdf mr-1.5"></i> Descargar PDF
                        </button>
                        <button onclick="limpiarHorarioPersonal()"
                            class="w-full border border-gray-200 px-4 py-2 text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition text-gray-500">
                            <i class="fas fa-trash-alt mr-1.5"></i> Limpiar todo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- DIV oculto para captura PDF (fuera del viewport) -->
    <div id="horario-pdf-preview" style="position:absolute; left:-9999px; top:0; width:1100px; padding:30px; font-family:Arial,sans-serif; background:#fff;">
        <div style="display:flex; align-items:center; gap:16px; border-bottom:3px solid #d4af37; padding-bottom:16px; margin-bottom:20px;">
            <div style="flex:1;">
                <h1 style="font-size:20px; color:#a57c00; margin:0; font-weight:bold; letter-spacing:2px;">PORTAL INFORMATIVO DOMITER</h1>
                <p style="font-size:13px; color:#666; margin:4px 0 0;">Escuela de Geografía · Universidad Central de Venezuela</p>
            </div>
            <div style="text-align:right;">
                <p style="font-size:11px; color:#999; margin:0;">Horario Personalizado 2026</p>
                <p id="pdf-fecha-generacion" style="font-size:11px; color:#999; margin:2px 0 0;"></p>
            </div>
        </div>
        <div id="pdf-nombre-header" style="display:none; background:#fefce8; border:1px solid #d4af37; border-radius:6px; padding:10px 16px; margin-bottom:16px; font-size:14px; color:#a57c00; font-weight:bold;"></div>
        <div id="tabla-semanal-pdf" style="margin-bottom:24px;"></div>
        <div id="lista-materias-pdf" style="border-top:2px solid #eee; padding-top:16px;"></div>
        <div style="border-top:1px solid #eee; padding-top:12px; margin-top:20px; font-size:10px; color:#999; text-align:center; font-style:italic;">
            Generado por el Portal Informativo Domiter · portaldomiter.webflow.io
        </div>
    </div>`;

// Agregar modal solo si no existe ya
if (!modalsHtml.includes('id="arma-horario-modal"')) {
    modalsHtml = modalsHtml + nuevoModal;
}

// ─── 4. Re-codificar a Base64 ──────────────────────────────────────────────

const newLayoutB64 = encodeBase64(layoutHtml);
const newModalsB64 = encodeBase64(modalsHtml);

const newComponentsContent = `// HTML Components (Obfuscated Base64)\nwindow.APP_LAYOUT_ENCODED = "${newLayoutB64}";\nwindow.APP_MODALS_ENCODED = "${newModalsB64}";`;

fs.writeFileSync(componentsPath, newComponentsContent, 'utf8');
console.log('✅ js/components.js actualizado con "Arma tu Horario"');
console.log(`   Layout: ${newLayoutB64.length} chars`);
console.log(`   Modals: ${newModalsB64.length} chars`);
