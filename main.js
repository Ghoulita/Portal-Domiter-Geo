import './js/security.js';
import './js/components.js';
import './js/render.js';

function toggleMenu(){let e=document.getElementById("mobile-menu"),o=document.getElementById("hamburger-btn");e.classList.toggle("open"),o.classList.toggle("open")}function closeMenu(){document.getElementById("mobile-menu").classList.remove("open"),document.getElementById("hamburger-btn").classList.remove("open")}function abrirModal(e){document.getElementById(e).classList.add("active");if(e==="arma-horario-modal")iniciarModuloHorario();}function cerrarModal(e){document.getElementById(e).classList.remove("active"),"pensum-modal"===e&&limpiarSeleccion(),"horario-modal"===e&&limpiarFiltroHorario()}function abrirModalConFiltroLimpio(){limpiarFiltroHorario(),abrirModal("horario-modal")}function filtrarHorario(e){abrirModal("horario-modal"),document.getElementById("buscador-horario").value="",document.getElementById("horario-title").innerHTML=`Horario de Clases <span class="text-sm bg-[#fefce8] text-[#a57c00] border border-[#d4af37] px-2 py-1 rounded ml-2">Filtrando: ${e}</span>`,document.getElementById("btn-limpiar-filtro").style.display="inline-block",aplicarFiltro(e,!0)}function buscarEnHorario(){let e=document.getElementById("buscador-horario").value.toLowerCase().trim();if(""===e){limpiarFiltroHorario();return}document.getElementById("btn-limpiar-filtro").style.display="inline-block",document.getElementById("horario-title").innerHTML=`Horario de Clases <span class="text-sm bg-[#fcfcfc] text-gray-600 border border-gray-300 px-2 py-1 rounded ml-2">Buscando: "${e}"</span>`,aplicarFiltro(e,!1)}function aplicarFiltro(e,o){let t=document.querySelectorAll(".tab-content"),l=!1;t.forEach(t=>{let a=!1,r=t.querySelectorAll(".mb-8");r.forEach(t=>{let l=t.querySelector("h3"),r=l?l.textContent.toLowerCase():"",i=e.toLowerCase();if(o&&r.includes(i))t.style.display="block",t.querySelectorAll("li").forEach(e=>e.style.display="block"),a=!0;else{let n=!1,s=t.querySelectorAll("li");s.forEach(e=>{e.textContent.toLowerCase().includes(i)?(e.style.display="block",n=!0,a=!0):e.style.display="none"}),n?t.style.display="block":t.style.display="none"}});let i=document.querySelector(`.tab-btn[onclick*="${t.id}"]`);i&&(a?(i.style.display="inline-block",l||(i.click(),l=!0)):i.style.display="none")})}function limpiarFiltroHorario(){document.getElementById("buscador-horario").value="";let e=document.getElementById("horario-title");e&&(e.innerHTML="Horario de Clases 2026");let o=document.getElementById("btn-limpiar-filtro");o&&(o.style.display="none"),document.querySelectorAll(".tab-btn").forEach(e=>e.style.display="inline-block"),document.querySelectorAll(".tab-content .mb-8").forEach(e=>{e.style.display="block",e.querySelectorAll("li").forEach(e=>e.style.display="block")})}function cambiarTab(e,o){document.querySelectorAll(".tab-content").forEach(e=>e.style.display="none"),document.querySelectorAll(".tab-btn").forEach(e=>e.classList.remove("active")),document.getElementById(o).style.display="block",e.currentTarget.classList.add("active")}const prelaciones={presem:["eco1","ing1"],est1:["est2","ing1"],mat1:["mat2","ing1"],carto1:["carto2","ing1"],introgeo:["geofisica","ing1"],eco1:["geohumana"],est2:["meteo","geoeconomica"],mat2:["mat3"],carto2:["carto3"],geofisica:["geomorfo1"],ing1:["ing2"],geohumana:["geoeconomica"],meteo:["clima1"],mat3:["clima1"],carto3:["foto"],geomorfo1:["edafo1","geomorfo2"],geoeconomica:["geourbana","geopoblacion"],clima1:["clima2","biogeo"],edafo1:["edafo2"],geourbana:["semurbana"],geopoblacion:["semregional"],biogeo:["taller1","semregional"],edafo2:["taller1","semregional"],semurbana:["semagraria"],semregional:["seminv"],taller1:["taller2"],semagraria:["semteoria"],seminv:["semsub"],taller2:["taller3"],semteoria:["semmetodo"],taller3:["taller4"],semmetodo:["tesis"],taller4:["tesis"],pasantia:["tesis"],semtesis:["tesis"]};function obtenerHaciaAdelante(e,o=[]){return prelaciones[e]&&prelaciones[e].forEach(e=>{o.includes(e)||(o.push(e),obtenerHaciaAdelante(e,o))}),o}function obtenerHaciaAtras(e,o=[]){for(let[t,l]of Object.entries(prelaciones))l.includes(e)&&!o.includes(t)&&(o.push(t),obtenerHaciaAtras(t,o));return o}function limpiarSeleccion(){document.querySelectorAll(".materia-box").forEach(e=>e.classList.remove("active","pre-req","post-req"))}function seleccionar(e){limpiarSeleccion();let o=document.getElementById(e);o&&(o.classList.add("active"),obtenerHaciaAdelante(e).forEach(e=>{let o=document.getElementById(e);o&&o.classList.add("post-req")}),obtenerHaciaAtras(e).forEach(e=>{let o=document.getElementById(e);o&&o.classList.add("pre-req")}))}

window.toggleMenu = toggleMenu;
window.closeMenu = closeMenu;
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;
window.abrirModalConFiltroLimpio = abrirModalConFiltroLimpio;
window.filtrarHorario = filtrarHorario;
window.buscarEnHorario = buscarEnHorario;
window.aplicarFiltro = aplicarFiltro;
window.limpiarFiltroHorario = limpiarFiltroHorario;
window.cambiarTab = cambiarTab;
window.prelaciones = prelaciones;
window.obtenerHaciaAdelante = obtenerHaciaAdelante;
window.obtenerHaciaAtras = obtenerHaciaAtras;
window.limpiarSeleccion = limpiarSeleccion;
window.seleccionar = seleccionar;

// ═══════════════════════════════════════════════════════════════
//  MÓDULO: ARMA TU HORARIO
// ═══════════════════════════════════════════════════════════════

// Estado global del módulo
let _horarioPersonal = [];      // Array de objetos materia seleccionados
let _catalogo = [];             // Todas las materias disponibles
let _catalogoCargado = false;   // Flag para evitar re-parseo

// Paleta de colores (12 colores = clases mc-0 … mc-11)
const _COLORES_TOTAL = 12;

// Días de la semana ordenados
const _DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const _DIAS_MAP = { 'lunes': 0, 'martes': 1, 'miércoles': 2, 'miercoles': 2, 'jueves': 3, 'viernes': 4 };

// Horas de inicio y fin de la tabla (en minutos desde medianoche)
const _HORA_INICIO = 7 * 60;    // 7:00 am
const _HORA_FIN    = 18 * 60;   // 6:00 pm
const _SLOT_MIN    = 15;        // Cada fila = 15 minutos
const _SLOTS       = (_HORA_FIN - _HORA_INICIO) / _SLOT_MIN;

// ─── Utilidades de tiempo ─────────────────────────────────────

/**
 * Convierte "8:45 am", "11:15 am", "1:00 pm" → minutos desde medianoche
 */
function _toMinutos(str) {
    if (!str) return 0;
    str = str.trim().toLowerCase();
    const match = str.match(/(\d+):(\d+)\s*(am|pm)/);
    if (!match) return 0;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const ap = match[3];
    if (ap === 'pm' && h !== 12) h += 12;
    if (ap === 'am' && h === 12) h = 0;
    return h * 60 + m;
}

/**
 * Formatea minutos → "8:45 am"
 */
function _formatHora(min) {
    const h24 = Math.floor(min / 60);
    const m = min % 60;
    const ap = h24 >= 12 ? 'pm' : 'am';
    const h12 = h24 % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
}

/**
 * ¿Se solapan dos bloques horarios?
 */
function _solapan(b1, b2) {
    if (b1.diaIdx !== b2.diaIdx) return false;
    return b1.inicio < b2.fin && b2.inicio < b1.fin;
}

// ─── Extracción del catálogo desde el DOM ─────────────────────

/**
 * Lee todos los <li> del #horario-modal ya renderizado y construye _catalogo.
 * Cada entrada: { id, nombre, profesor, semestre, seccion, bloques, colorIdx }
 */
function _extraerCatalogo() {
    if (_catalogoCargado) return;
    _catalogo = [];

    const horarioModal = document.getElementById('horario-modal');
    if (!horarioModal) return;

    let idx = 0;

    // Recorrer cada tab-content (sem1, sem2, …)
    horarioModal.querySelectorAll('.tab-content').forEach(tab => {
        // Obtener nombre de semestre del botón correspondiente
        const btnSem = document.querySelector(`.tab-btn[onclick*="'${tab.id}'"]`);
        const semNombre = btnSem ? btnSem.textContent.trim() : tab.id;

        tab.querySelectorAll('.mb-8').forEach(seccionDiv => {
            const h3 = seccionDiv.querySelector('h3');
            const seccionNombre = h3 ? h3.textContent.trim() : '';

            seccionDiv.querySelectorAll('li').forEach(li => {
                const h4 = li.querySelector('h4');
                const pProf = li.querySelector('p');
                const spans = li.querySelectorAll('span');

                if (!h4) return;

                const nombre = h4.textContent.trim().replace(/\s+/g, ' ');
                const profesor = pProf ? pProf.textContent.trim() : '';

                // Parsear bloques horarios de cada <span> de horario
                const bloques = [];
                spans.forEach(sp => {
                    // Texto ejemplo: "Lunes 8:45 am - 10:15 am"
                    const txt = sp.textContent.trim();
                    const matchBloque = txt.match(/(lunes|martes|mi[eé]rcoles|jueves|viernes)\s+(\d+:\d+\s*[ap]m)\s*-\s*(\d+:\d+\s*[ap]m)/i);
                    if (matchBloque) {
                        const diaStr = matchBloque[1].toLowerCase();
                        const diaIdx = _DIAS_MAP[diaStr] ?? -1;
                        if (diaIdx >= 0) {
                            bloques.push({
                                diaIdx,
                                diaLabel: _DIAS[diaIdx],
                                inicio: _toMinutos(matchBloque[2]),
                                fin:    _toMinutos(matchBloque[3]),
                                inicioStr: matchBloque[2].trim(),
                                finStr:    matchBloque[3].trim()
                            });
                        }
                    }
                });

                if (bloques.length === 0) return; // Sin horario definido, omitir

                _catalogo.push({
                    id: `cat-${idx++}`,
                    nombre,
                    profesor,
                    semestre: semNombre,
                    seccion: seccionNombre,
                    bloques
                });
            });
        });
    });

    _catalogoCargado = true;
}

// ─── Renderizado de la tabla semanal ─────────────────────────

function _renderizarTabla() {
    const contenedor = document.getElementById('tabla-semanal');
    if (!contenedor) return;

    // Cabecera
    let html = `<div class="ht-header-col">Hora</div>`;
    _DIAS.forEach(d => { html += `<div class="ht-header-col">${d}</div>`; });

    // Filas de tiempo
    for (let s = 0; s < _SLOTS; s++) {
        const minActual = _HORA_INICIO + s * _SLOT_MIN;
        const esHoraEnPunto = minActual % 60 === 0;

        // Columna de hora
        html += `<div class="ht-time-label" style="height:18px;">${esHoraEnPunto ? _formatHora(minActual) : ''}</div>`;

        // 5 columnas de días
        for (let d = 0; d < 5; d++) {
            // Verificar si alguna materia seleccionada empieza en este slot/día
            let bloqueHtml = '';
            _horarioPersonal.forEach((mat) => {
                mat.bloques.forEach(b => {
                    if (b.diaIdx !== d) return;
                    if (b.inicio !== minActual) return;

                    // Calcular altura en píxeles proporcional (18px por slot de 15min)
                    const duracion = b.fin - b.inicio;
                    const slots = duracion / _SLOT_MIN;
                    const alturaPx = slots * 18;

                    bloqueHtml += `
                        <div class="ht-bloque mc-${mat.colorIdx}" style="height:${alturaPx - 2}px;" title="${mat.nombre}">
                            <span class="ht-bloque-nombre">${mat.nombre}</span>
                            <span class="ht-bloque-hora">${b.inicioStr} - ${b.finStr}</span>
                        </div>`;
                });
            });

            html += `<div class="ht-cell" style="height:18px;">${bloqueHtml}</div>`;
        }
    }

    contenedor.innerHTML = html;
}

// ─── Renderizado del catálogo (panel izquierdo) ───────────────

function _renderizarCatalogo(filtro = '') {
    const lista = document.getElementById('catalogo-lista');
    if (!lista) return;

    const query = filtro.toLowerCase().trim();
    const agIds = new Set(_horarioPersonal.map(m => m.id));

    const filtradas = _catalogo.filter(m =>
        !query ||
        m.nombre.toLowerCase().includes(query) ||
        m.profesor.toLowerCase().includes(query) ||
        m.semestre.toLowerCase().includes(query)
    );

    if (filtradas.length === 0) {
        lista.innerHTML = '<p class="text-xs text-gray-400 italic text-center py-4">Sin resultados</p>';
        return;
    }

    let html = '';
    filtradas.forEach(m => {
        const yaAgregada = agIds.has(m.id);
        const dotClass = yaAgregada ? `mc-${m.colorIdx}` : '';
        const dotStyle = yaAgregada ? '' : 'background:#d1d5db;';

        html += `
            <div class="catalogo-item ${yaAgregada ? 'ya-agregada' : ''}" 
                 onclick="${yaAgregada ? '' : `agregarMateria('${m.id}')`}"
                 title="${yaAgregada ? 'Ya agregada' : 'Agregar al horario'}">
                <div class="catalogo-item-dot ${dotClass}" style="${dotStyle}"></div>
                <div>
                    <div class="catalogo-item-nombre">${m.nombre}</div>
                    <div class="catalogo-item-detalle">${m.semestre} · ${m.seccion}</div>
                    <div class="catalogo-item-detalle">${m.profesor}</div>
                </div>
            </div>`;
    });

    lista.innerHTML = html;
}

// ─── Renderizado de la lista de seleccionadas ─────────────────

function _renderizarListaSeleccionadas() {
    const lista = document.getElementById('lista-seleccionadas');
    const contador = document.getElementById('contador-materias');
    const btnPdf = document.getElementById('btn-descargar-pdf');
    if (!lista) return;

    if (contador) contador.textContent = `${_horarioPersonal.length} materia(s) seleccionada(s)`;
    if (btnPdf) btnPdf.disabled = _horarioPersonal.length === 0;

    if (_horarioPersonal.length === 0) {
        lista.innerHTML = '<p class="text-xs text-gray-400 italic text-center py-4">Ninguna materia seleccionada</p>';
        return;
    }

    let html = '';
    _horarioPersonal.forEach(m => {
        const horariosStr = m.bloques.map(b => `${b.diaLabel} ${b.inicioStr}-${b.finStr}`).join(', ');
        html += `
            <div class="sel-item">
                <div class="sel-item-dot mc-${m.colorIdx}" style=""></div>
                <div class="sel-item-nombre" title="${m.nombre}&#10;${horariosStr}">${m.nombre}</div>
                <span class="sel-item-remove" onclick="quitarMateria('${m.id}')" title="Quitar">×</span>
            </div>`;
    });

    lista.innerHTML = html;
}

// ─── Funciones públicas del módulo ────────────────────────────

/**
 * Inicializa el módulo cuando se abre el modal por primera vez.
 */
function iniciarModuloHorario() {
    _extraerCatalogo();
    _renderizarCatalogo('');
    _renderizarTabla();
    _renderizarListaSeleccionadas();
    // Limpiar alerta de solapamiento
    const alert = document.getElementById('solapamiento-alert');
    if (alert) alert.classList.add('hidden');
}

/**
 * Agrega una materia al horario personal con verificación de solapamiento.
 */
function agregarMateria(id) {
    const materia = _catalogo.find(m => m.id === id);
    if (!materia) return;
    if (_horarioPersonal.find(m => m.id === id)) return; // Ya existe

    // Asignar color (rotación cíclica)
    const colorIdx = _horarioPersonal.length % _COLORES_TOTAL;
    const materiaConColor = { ...materia, colorIdx };

    // Verificar solapamientos
    let solapamientoDetectado = null;
    for (const yaAgr of _horarioPersonal) {
        for (const b1 of materiaConColor.bloques) {
            for (const b2 of yaAgr.bloques) {
                if (_solapan(b1, b2)) {
                    solapamientoDetectado = yaAgr;
                    break;
                }
            }
            if (solapamientoDetectado) break;
        }
        if (solapamientoDetectado) break;
    }

    // Agregar la materia (siempre, solo advierte)
    _horarioPersonal.push(materiaConColor);

    // Mostrar alerta si hubo solapamiento
    const alertEl = document.getElementById('solapamiento-alert');
    const detalleEl = document.getElementById('solapamiento-detalle');
    if (solapamientoDetectado && alertEl && detalleEl) {
        detalleEl.textContent = `"${materiaConColor.nombre}" se solapa con "${solapamientoDetectado.nombre}".`;
        alertEl.classList.remove('hidden');
        // Auto-ocultar la alerta después de 6 segundos
        setTimeout(() => { alertEl.classList.add('hidden'); }, 6000);
    } else if (alertEl) {
        alertEl.classList.add('hidden');
    }

    // Re-renderizar
    _renderizarTabla();
    _renderizarCatalogo(document.getElementById('catalogo-buscador')?.value || '');
    _renderizarListaSeleccionadas();
}

/**
 * Quita una materia del horario personal.
 */
function quitarMateria(id) {
    _horarioPersonal = _horarioPersonal.filter(m => m.id !== id);
    // Re-asignar colores por orden
    _horarioPersonal.forEach((m, i) => { m.colorIdx = i % _COLORES_TOTAL; });
    // Ocultar alerta si ya no hay nada
    const alertEl = document.getElementById('solapamiento-alert');
    if (alertEl) alertEl.classList.add('hidden');
    _renderizarTabla();
    _renderizarCatalogo(document.getElementById('catalogo-buscador')?.value || '');
    _renderizarListaSeleccionadas();
}

/**
 * Filtra el catálogo según el texto del buscador.
 */
function filtrarCatalogo(valor) {
    _renderizarCatalogo(valor);
}

/**
 * Vacía todo el horario personal.
 */
function limpiarHorarioPersonal() {
    _horarioPersonal = [];
    const alertEl = document.getElementById('solapamiento-alert');
    if (alertEl) alertEl.classList.add('hidden');
    const buscador = document.getElementById('catalogo-buscador');
    if (buscador) buscador.value = '';
    _renderizarTabla();
    _renderizarCatalogo('');
    _renderizarListaSeleccionadas();
}

/**
 * Genera la tabla HTML para el PDF.
 */
function _generarTablaPDF() {
    const CELL_H = 14; // px por slot de 15min en el PDF
    const COL_W  = 160; // px por columna de día

    let html = `<table style="border-collapse:collapse;width:100%;font-size:10px;table-layout:fixed;">`;
    // Cabecera
    html += `<thead><tr>
        <th style="width:60px;background:#a57c00;color:#fff;padding:5px;text-align:center;border:1px solid #ccc;">Hora</th>`;
    _DIAS.forEach(d => {
        html += `<th style="width:${COL_W}px;background:#a57c00;color:#fff;padding:5px;text-align:center;border:1px solid #ccc;">${d}</th>`;
    });
    html += `</tr></thead><tbody>`;

    for (let s = 0; s < _SLOTS; s++) {
        const minActual = _HORA_INICIO + s * _SLOT_MIN;
        const esHoraEnPunto = minActual % 60 === 0;
        const bgRow = s % 2 === 0 ? '#fafafa' : '#fff';

        html += `<tr style="height:${CELL_H}px;">`;
        html += `<td style="background:#f3f4f6;color:#6b7280;text-align:right;padding:0 4px;font-size:9px;border-right:1px solid #e5e7eb;border-bottom:1px solid #f3f4f6;">${esHoraEnPunto ? _formatHora(minActual) : ''}</td>`;

        for (let d = 0; d < 5; d++) {
            let contenido = '';
            _horarioPersonal.forEach(mat => {
                mat.bloques.forEach(b => {
                    if (b.diaIdx !== d || b.inicio !== minActual) return;
                    const duracion = b.fin - b.inicio;
                    const altoSlots = duracion / _SLOT_MIN;
                    const altoPx = altoSlots * CELL_H;
                    const bgColors = [
                        '#fef9c3','#dbeafe','#dcfce7','#fce7f3','#ede9fe','#ffedd5',
                        '#cffafe','#fef2f2','#f0fdf4','#fdf4ff','#fff7ed','#f0f9ff'
                    ];
                    const fgColors = [
                        '#713f12','#1e3a8a','#14532d','#831843','#4c1d95','#7c2d12',
                        '#164e63','#7f1d1d','#052e16','#581c87','#431407','#0c4a6e'
                    ];
                    contenido += `
                        <div style="height:${altoPx - 2}px;background:${bgColors[mat.colorIdx]};color:${fgColors[mat.colorIdx]};
                            border-left:3px solid ${fgColors[mat.colorIdx]};border-radius:3px;
                            padding:2px 4px;font-size:8px;font-weight:bold;overflow:hidden;line-height:1.3;margin:1px;">
                            ${mat.nombre}<br><span style="font-weight:normal;font-size:7px;">${b.inicioStr}-${b.finStr}</span>
                        </div>`;
                });
            });
            html += `<td style="background:${bgRow};border-right:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;vertical-align:top;padding:0;">${contenido}</td>`;
        }

        html += `</tr>`;
    }
    html += `</tbody></table>`;
    return html;
}

/**
 * Genera y descarga el PDF del horario personal.
 */
function descargarHorarioPDF() {
    if (_horarioPersonal.length === 0) return;

    const pdfPreview = document.getElementById('horario-pdf-preview');
    if (!pdfPreview) return;

    // Nombre del estudiante (opcional)
    const nombre = (document.getElementById('nombre-estudiante-pdf')?.value || '').trim();
    const headerNombre = document.getElementById('pdf-nombre-header');
    if (headerNombre) {
        if (nombre) {
            headerNombre.style.display = 'block';
            headerNombre.textContent = `Mi horario: ${nombre}`;
        } else {
            headerNombre.style.display = 'none';
        }
    }

    // Fecha de generación
    const fechaEl = document.getElementById('pdf-fecha-generacion');
    if (fechaEl) {
        const now = new Date();
        fechaEl.textContent = `Generado el ${now.toLocaleDateString('es-VE', { day:'2-digit', month:'long', year:'numeric' })}`;
    }

    // Tabla
    const tablaPdfEl = document.getElementById('tabla-semanal-pdf');
    if (tablaPdfEl) tablaPdfEl.innerHTML = _generarTablaPDF();

    // Lista de materias
    const listaPdfEl = document.getElementById('lista-materias-pdf');
    if (listaPdfEl) {
        const bgColors = [
            '#fef9c3','#dbeafe','#dcfce7','#fce7f3','#ede9fe','#ffedd5',
            '#cffafe','#fef2f2','#f0fdf4','#fdf4ff','#fff7ed','#f0f9ff'
        ];
        let listaHtml = `<h3 style="font-size:12px;color:#a57c00;margin:0 0 10px;font-weight:bold;letter-spacing:1px;">MATERIAS SELECCIONADAS</h3>
            <table style="width:100%;border-collapse:collapse;font-size:10px;">
                <tr style="background:#f3f4f6;">
                    <th style="padding:5px 8px;text-align:left;border-bottom:2px solid #e5e7eb;color:#374151;">Materia</th>
                    <th style="padding:5px 8px;text-align:left;border-bottom:2px solid #e5e7eb;color:#374151;">Profesor/a</th>
                    <th style="padding:5px 8px;text-align:left;border-bottom:2px solid #e5e7eb;color:#374151;">Semestre</th>
                    <th style="padding:5px 8px;text-align:left;border-bottom:2px solid #e5e7eb;color:#374151;">Horario</th>
                </tr>`;
        _horarioPersonal.forEach(m => {
            const horStr = m.bloques.map(b => `${b.diaLabel} ${b.inicioStr}-${b.finStr}`).join(', ');
            listaHtml += `<tr style="background:${bgColors[m.colorIdx]}20;border-bottom:1px solid #f3f4f6;">
                <td style="padding:5px 8px;font-weight:600;color:#374151;">
                    <span style="display:inline-block;width:8px;height:8px;background:${bgColors[m.colorIdx]};border-radius:50%;margin-right:6px;"></span>${m.nombre}
                </td>
                <td style="padding:5px 8px;color:#6b7280;">${m.profesor}</td>
                <td style="padding:5px 8px;color:#6b7280;">${m.semestre}</td>
                <td style="padding:5px 8px;color:#374151;">${horStr}</td>
            </tr>`;
        });
        listaHtml += `</table>`;
        listaPdfEl.innerHTML = listaHtml;
    }

    // Generar PDF con html2pdf
    if (typeof html2pdf !== 'undefined') {
        const opt = {
            margin:       [10, 10],
            filename:     `horario-domiter-${nombre ? nombre.replace(/\s+/g, '-') : 'personal'}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };
        html2pdf().set(opt).from(pdfPreview).save();
    } else {
        alert('La librería de PDF no está disponible. Verifica tu conexión a internet.');
    }
}

// Exportar al scope global
window.iniciarModuloHorario = iniciarModuloHorario;
window.agregarMateria = agregarMateria;
window.quitarMateria = quitarMateria;
window.filtrarCatalogo = filtrarCatalogo;
window.limpiarHorarioPersonal = limpiarHorarioPersonal;
window.descargarHorarioPDF = descargarHorarioPDF;