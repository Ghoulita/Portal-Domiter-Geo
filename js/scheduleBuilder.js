/**
 * ============================================================
 * SCHEDULE BUILDER - Portal Domiter Geo (Reescritura completa)
 * Diseño fiel a Horariopitis: bloques por día/sección/aula
 * Choques: advertencia con confirm(), borde rojo si acepta
 * PDF: html2pdf con colores exactos
 * ============================================================
 */

/* ─── ESTADO GLOBAL ─── */
window.catalogoMaterias   = {};
window.horarioSeleccionado = [];
window.materiaPendiente   = null;

/* ─── BLOQUES HORARIOS (45 min c/u, descanso en 8:30 y 10:15) ─── */
const BLOQUES = [
  { label: '7:00–7:45',   inicio: 420,  fin: 465  },
  { label: '7:45–8:30',   inicio: 465,  fin: 510  },
  { label: '8:45–9:30',   inicio: 525,  fin: 570  },
  { label: '9:30–10:15',  inicio: 570,  fin: 615  },
  { label: '10:30–11:15', inicio: 630,  fin: 675  },
  { label: '11:15–12:00', inicio: 675,  fin: 720  },
  { label: '12:00–12:45', inicio: 720,  fin: 765  },
  { label: '1:00–1:45',   inicio: 780,  fin: 825  },
  { label: '1:45–2:30',   inicio: 825,  fin: 870  },
  { label: '2:30–3:15',   inicio: 870,  fin: 915  },
  { label: '3:15–4:15',   inicio: 915,  fin: 975  },
  { label: '4:15–5:15',   inicio: 975,  fin: 1035 },
];

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

/* paleta institucional */
const COLORES_MATERIA = [
  { bg: '#dbeafe', border: '#3b82f6', text: '#1e3a5f' },
  { bg: '#d1fae5', border: '#10b981', text: '#064e3b' },
  { bg: '#ede9fe', border: '#8b5cf6', text: '#3b0764' },
  { bg: '#fce7f3', border: '#ec4899', text: '#831843' },
  { bg: '#ffedd5', border: '#f97316', text: '#7c2d12' },
  { bg: '#e0f2fe', border: '#0ea5e9', text: '#0c4a6e' },
  { bg: '#dcfce7', border: '#22c55e', text: '#14532d' },
  { bg: '#fef9c3', border: '#eab308', text: '#713f12' },
];

function getColor(i) { return COLORES_MATERIA[i % COLORES_MATERIA.length]; }

/* ─── 1. INIT ─── */
function initScheduleBuilder() {
  extraerCatalogo();
  renderTabla();
  renderLista();
  console.log('[ScheduleBuilder] materias en catálogo:', Object.keys(window.catalogoMaterias).length);
}

/* ─── 2. EXTRACCIÓN DEL CATÁLOGO ─── */
function extraerCatalogo() {
  const catalogo = {};
  // Buscar en todas las tabs del modal de horario
  const tabs = document.querySelectorAll('#horario-modal .tab-content');
  tabs.forEach(tab => {
    const bloques = tab.querySelectorAll('.mb-8');
    bloques.forEach(bloque => {
      const h3 = bloque.querySelector('h3');
      if (!h3) return;
      const seccionTexto = h3.textContent.trim();
      bloque.querySelectorAll('li').forEach(li => {
        const h4 = li.querySelector('h4');
        const p  = li.querySelector('p');
        if (!h4) return;
        let nombre = h4.textContent.replace(/electiva/i, '').trim();
        let profe  = p ? p.textContent.trim() : '';
        let tiempos = [];
        li.querySelectorAll('span.bg-yellow-50, span[class*="bg-yellow"]').forEach(span => {
          const t = parsearHora(span.textContent.trim());
          if (t) tiempos.push(t);
        });
        if (!catalogo[nombre]) catalogo[nombre] = [];
        if (!catalogo[nombre].find(s => s.seccion === seccionTexto)) {
          catalogo[nombre].push({ seccion: seccionTexto, profe, tiempos });
        }
      });
    });
  });
  window.catalogoMaterias = catalogo;
}

function parsearHora(texto) {
  const DIAS_MAP = ['Lunes','Martes','Miércoles','Jueves','Viernes'];
  let dia = null;
  for (let d of DIAS_MAP) { if (texto.includes(d)) { dia = d; break; } }
  if (!dia) return null;
  const rx = /(\d{1,2}:\d{2}\s*(?:am|pm))\s*-\s*(\d{1,2}:\d{2}\s*(?:am|pm))/i;
  const m = texto.match(rx);
  if (!m) return null;
  return { dia, inicio: toMin(m[1]), fin: toMin(m[2]), texto: m[0] };
}

function toMin(s) {
  s = s.trim().toLowerCase();
  const [h, rest] = s.split(':');
  const min = parseInt(rest);
  let hr = parseInt(h);
  const pm = s.includes('pm');
  if (pm && hr !== 12) hr += 12;
  if (!pm && hr === 12) hr = 0;
  return hr * 60 + min;
}

/* ─── 3. BUSCADOR ─── */
function buscarMateriaCreador() {
  const q   = (document.getElementById('buscador-materias-creador')?.value || '').toLowerCase().trim();
  const box = document.getElementById('lista-materias-buscador');
  if (!box) return;
  if (q.length < 2) { box.classList.add('hidden'); return; }

  let html = '';
  Object.keys(window.catalogoMaterias).forEach(nombre => {
    if (!nombre.toLowerCase().includes(q)) return;
    const yaAgregada = window.horarioSeleccionado.find(m => m.nombre === nombre);
    html += `<div class="sb-search-item${yaAgregada ? ' sb-added' : ''}"
      onclick="intentarAgregarMateria('${nombre.replace(/'/g,"\\'")}')">
      <span>${nombre}</span>
      <i class="fas ${yaAgregada ? 'fa-check' : 'fa-plus-circle'}"></i>
    </div>`;
  });
  if (!html) html = `<div class="sb-search-empty">No se encontraron materias.</div>`;
  box.innerHTML = html;
  box.classList.remove('hidden');
}

document.addEventListener('click', e => {
  const box   = document.getElementById('lista-materias-buscador');
  const input = document.getElementById('buscador-materias-creador');
  if (box && !box.contains(e.target) && e.target !== input) box.classList.add('hidden');
});

/* ─── 4. AGREGAR / SELECCIONAR SECCIÓN ─── */
function intentarAgregarMateria(nombre) {
  document.getElementById('lista-materias-buscador')?.classList.add('hidden');
  if (document.getElementById('buscador-materias-creador'))
    document.getElementById('buscador-materias-creador').value = '';

  if (window.horarioSeleccionado.find(m => m.nombre === nombre)) {
    mostrarToast(`<strong>${nombre}</strong> ya está en tu horario.`, 'warn');
    return;
  }
  const secciones = window.catalogoMaterias[nombre];
  if (!secciones?.length) return;
  if (secciones.length === 1) {
    procesarAgregarMateria(nombre, secciones[0]);
  } else {
    window.materiaPendiente = nombre;
    abrirSelectorSeccion(nombre, secciones);
  }
}

function abrirSelectorSeccion(nombre, secciones) {
  const titleEl = document.getElementById('seccion-selector-materia');
  const optsEl  = document.getElementById('seccion-selector-opciones');
  if (!titleEl || !optsEl) return;
  titleEl.textContent = nombre;
  optsEl.innerHTML = secciones.map((s, i) => {
    const horas = s.tiempos.map(t => `<span class="sb-tag">${t.dia} ${t.texto}</span>`).join('');
    return `<div class="sb-seccion-card" onclick="seleccionarSeccion(${i})">
      <div>
        <div class="sb-seccion-nombre">${s.seccion}</div>
        <div class="sb-seccion-profe">${s.profe}</div>
        <div>${horas}</div>
      </div>
      <i class="fas fa-chevron-right sb-seccion-arrow"></i>
    </div>`;
  }).join('');
  const modal = document.getElementById('seccion-selector-modal');
  if (modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
}

function cerrarSelectorSeccion() {
  const modal = document.getElementById('seccion-selector-modal');
  if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
  window.materiaPendiente = null;
}

function seleccionarSeccion(index) {
  if (!window.materiaPendiente) return;
  const nombre = window.materiaPendiente;
  const sec    = window.catalogoMaterias[nombre][index];
  cerrarSelectorSeccion();
  procesarAgregarMateria(nombre, sec);
}

/* ─── 5. LÓGICA DE SOLAPAMIENTO ─── */
function procesarAgregarMateria(nombre, seccionObj) {
  const choques = detectarChoques(seccionObj);

  if (choques.length > 0) {
    const detalle = choques.map(c => `• ${c.materia} (${c.dia})`).join('\n');
    const ok = confirm(
      `⚠️ CHOQUE DE HORARIO DETECTADO\n\n` +
      `"${nombre}" coincide con:\n${detalle}\n\n` +
      `¿Deseas agregarlo de todas formas? El bloque se marcará en rojo.`
    );
    if (!ok) return;
    agregarMateria(nombre, seccionObj, true);
  } else {
    agregarMateria(nombre, seccionObj, false);
  }
}

function detectarChoques(seccionNueva) {
  const choques = [];
  for (const tNuevo of seccionNueva.tiempos) {
    for (const existing of window.horarioSeleccionado) {
      for (const tEx of existing.seccionObj.tiempos) {
        if (tNuevo.dia !== tEx.dia) continue;
        if (Math.max(tNuevo.inicio, tEx.inicio) < Math.min(tNuevo.fin, tEx.fin)) {
          if (!choques.find(c => c.materia === existing.nombre && c.dia === tNuevo.dia)) {
            choques.push({ materia: existing.nombre, dia: tNuevo.dia });
          }
        }
      }
    }
  }
  return choques;
}

function agregarMateria(nombre, seccionObj, conChoque) {
  const color = getColor(window.horarioSeleccionado.length);
  window.horarioSeleccionado.push({ nombre, seccionObj, color, conChoque });
  renderTabla();
  renderLista();
  mostrarToast(`<strong>${nombre}</strong> agregada.${conChoque ? ' ⚠️ Choque marcado en rojo.' : ''}`, conChoque ? 'warn' : 'ok');
}

function removerMateria(index) {
  window.horarioSeleccionado.splice(index, 1);
  // Re-asignar colores en orden
  window.horarioSeleccionado.forEach((m, i) => { m.color = getColor(i); });
  renderTabla();
  renderLista();
}

function limpiarHorarioCreado() {
  window.horarioSeleccionado = [];
  renderTabla();
  renderLista();
}

/* ─── 6. RENDER TABLA ESTILO PITIS ─── */
function renderTabla() {
  const wrap = document.getElementById('horario-tabla-wrap');
  if (!wrap) return;

  // Construir HTML de tabla
  let html = `
  <table id="horario-pdf-table" style="
    width:100%; border-collapse:collapse;
    font-family:'Segoe UI',sans-serif; font-size:11px;
    -webkit-print-color-adjust:exact; print-color-adjust:exact;">
    <thead>
      <tr>
        <th style="${thBase} width:70px; background:#1a3c5e; color:#fff;">Hora</th>
        ${DIAS.map(d => `<th style="${thBase} background:#1a3c5e; color:#fff;">${d}</th>`).join('')}
      </tr>
    </thead>
    <tbody>`;

  BLOQUES.forEach(bloque => {
    html += `<tr>
      <td style="${tdHora}">${bloque.label}</td>
      ${DIAS.map(dia => {
        // Buscar materia que ocupe este bloque en este día
        const match = window.horarioSeleccionado.find(m =>
          m.seccionObj.tiempos.some(t =>
            t.dia === dia && t.inicio <= bloque.inicio && t.fin >= bloque.fin
          )
        );
        if (!match) return `<td style="${tdVacioStyle}"></td>`;

        const t = match.seccionObj.tiempos.find(t => t.dia === dia && t.inicio <= bloque.inicio && t.fin >= bloque.fin);
        // Solo pintar en el primer bloque de la materia en este día
        const esPrimerBloque = bloque.inicio === window.horarioSeleccionado
          .filter(m => m.nombre === match.nombre)
          .flatMap(m => m.seccionObj.tiempos)
          .filter(t2 => t2.dia === dia)
          .map(t2 => t2.inicio)[0];

        const borde = match.conChoque ? '2px solid red' : `2px solid ${match.color.border}`;
        const bg    = match.conChoque ? '#fff0f0' : match.color.bg;
        const col   = match.conChoque ? '#c0392b' : match.color.text;

        return `<td style="
          border:1px solid #d1d5db; padding:2px; vertical-align:middle; text-align:center;
          background:${bg}; color:${col}; border-left:${borde};
          -webkit-print-color-adjust:exact; print-color-adjust:exact;">
          <div style="font-weight:700; font-size:10px; line-height:1.2;">${match.nombre}</div>
          <div style="font-size:9px; opacity:.8;">${match.seccionObj.seccion}</div>
          ${match.conChoque ? '<div style="font-size:8px;color:red;font-weight:bold;">⚠ CHOQUE</div>' : ''}
        </td>`;
      }).join('')}
    </tr>`;
  });

  html += `</tbody></table>`;

  // Encabezado PDF institucional (oculto en pantalla pero visible al imprimir)
  const header = `<div id="pdf-header-ucv" style="
    display:none; padding:10px 16px; background:#1a3c5e; color:#fff;
    border-radius:6px 6px 0 0; margin-bottom:4px; -webkit-print-color-adjust:exact;">
    <div style="font-size:13px; font-weight:700;">Universidad Central de Venezuela</div>
    <div style="font-size:11px; opacity:.85;">Escuela de Geografía · Portal DOMITER · Horario 2026</div>
  </div>`;

  const overlay = window.horarioSeleccionado.length === 0
    ? `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
        justify-content:center;background:rgba(255,255,255,.7);border-radius:8px;pointer-events:none;">
        <i class="fas fa-calendar-alt" style="font-size:2rem;color:#d1d5db;margin-bottom:.5rem;"></i>
        <span style="color:#9ca3af;font-size:.85rem;">Agrega materias para ver tu horario aquí</span>
      </div>` : '';

  wrap.innerHTML = `<div id="horario-pdf-container" style="position:relative;">
    ${header}${html}${overlay}
  </div>`;

  // Actualizar contador
  const ctr = document.getElementById('contador-materias');
  if (ctr) ctr.textContent = window.horarioSeleccionado.length;
}

/* ─── Estilos inline reutilizables ─── */
const thBase = `border:1px solid #0f2945; padding:6px 4px; text-align:center;
  font-weight:700; font-size:11px; -webkit-print-color-adjust:exact;`;
const tdHora = `border:1px solid #d1d5db; padding:4px 6px; text-align:center;
  font-size:10px; font-weight:600; color:#4b5563; background:#f8fafc; white-space:nowrap;`;
const tdVacioStyle = `border:1px solid #e5e7eb; padding:2px; min-height:28px;`;

/* ─── 7. RENDER LISTA DE MATERIAS ─── */
function renderLista() {
  const lista = document.getElementById('lista-materias-seleccionadas');
  if (!lista) return;

  if (window.horarioSeleccionado.length === 0) {
    lista.innerHTML = `<li style="text-align:center;padding:1.5rem .5rem;color:#9ca3af;font-size:.8rem;
      border:2px dashed #e5e7eb;border-radius:8px;list-style:none;">
      <i class="fas fa-inbox" style="font-size:1.5rem;display:block;margin-bottom:.4rem;"></i>
      Busca y agrega materias para empezar.
    </li>`;
    return;
  }

  lista.innerHTML = window.horarioSeleccionado.map((m, i) => `
    <li style="display:flex;justify-content:space-between;align-items:flex-start;
      padding:.6rem .75rem;border-radius:8px;margin-bottom:.4rem;list-style:none;
      background:${m.conChoque ? '#fff0f0' : m.color.bg};
      border-left:4px solid ${m.conChoque ? '#ef4444' : m.color.border};">
      <div>
        <div style="font-weight:700;font-size:.8rem;color:${m.conChoque ? '#b91c1c' : m.color.text};">
          ${m.conChoque ? '⚠️ ' : ''}${m.nombre}
        </div>
        <div style="font-size:.7rem;opacity:.75;margin-top:2px;">${m.seccionObj.seccion}</div>
      </div>
      <button onclick="removerMateria(${i})"
        style="background:none;border:none;cursor:pointer;color:#9ca3af;padding:2px 6px;
          font-size:.9rem;line-height:1;" title="Quitar materia">✕</button>
    </li>
  `).join('');
}

/* ─── 8. EXPORTAR PDF ─── */
function exportarHorarioPDF() {
  if (window.horarioSeleccionado.length === 0) {
    mostrarToast('Agrega al menos una materia antes de exportar.', 'warn');
    return;
  }

  // Mostrar encabezado institucional para el PDF
  const header = document.getElementById('pdf-header-ucv');
  if (header) header.style.display = 'block';

  const el = document.getElementById('horario-pdf-container');
  if (!el) { alert('No se encontró el contenedor del horario.'); return; }

  const opt = {
    margin:      [8, 8, 8, 8],
    filename:    'Horario_Geo_UCV_2026.pdf',
    image:       { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
    jsPDF:       { unit: 'mm', format: 'a4', orientation: 'landscape' }
  };

  if (typeof html2pdf === 'undefined') {
    // Inyectar librería si no está
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    s.onload = () => { html2pdf().set(opt).from(el).save().finally(() => { if(header) header.style.display='none'; }); };
    document.head.appendChild(s);
  } else {
    html2pdf().set(opt).from(el).save().finally(() => { if(header) header.style.display='none'; });
  }
}

/* ─── 9. TOAST (reemplaza alert genérico) ─── */
function mostrarToast(htmlMsg, tipo = 'ok') {
  let toast = document.getElementById('sb-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'sb-toast';
    toast.style.cssText = `
      position:fixed; bottom:24px; right:24px; z-index:99999;
      padding:12px 18px; border-radius:10px; font-size:.85rem;
      max-width:320px; box-shadow:0 4px 20px rgba(0,0,0,.15);
      transition:opacity .3s; font-family:'Segoe UI',sans-serif;`;
    document.body.appendChild(toast);
  }
  toast.style.background = tipo === 'ok' ? '#1a3c5e' : '#7f1d1d';
  toast.style.color = '#fff';
  toast.innerHTML = htmlMsg;
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 3500);
}

/* ─── INYECCIÓN DE ESTILOS BUSCADOR ─── */
(function injectStyles() {
  if (document.getElementById('sb-styles')) return;
  const style = document.createElement('style');
  style.id = 'sb-styles';
  style.textContent = `
    #lista-materias-buscador { position:absolute; z-index:999; width:100%;
      background:#fff; border:1px solid #d1d5db; border-radius:8px;
      box-shadow:0 8px 24px rgba(0,0,0,.12); max-height:240px; overflow-y:auto; }
    .sb-search-item { display:flex; justify-content:space-between; align-items:center;
      padding:10px 14px; cursor:pointer; border-bottom:1px solid #f3f4f6;
      font-size:.82rem; color:#1f2937; transition:background .15s; }
    .sb-search-item:hover { background:#eff6ff; }
    .sb-search-item.sb-added { color:#6b7280; }
    .sb-search-empty { padding:12px; text-align:center; font-size:.8rem; color:#9ca3af; font-style:italic; }
    .sb-seccion-card { display:flex; justify-content:space-between; align-items:center;
      border:1px solid #e5e7eb; padding:12px; border-radius:8px; cursor:pointer;
      background:#fff; transition:border-color .2s; margin-bottom:8px; }
    .sb-seccion-card:hover { border-color:#1a3c5e; }
    .sb-seccion-nombre { font-weight:700; color:#1a3c5e; font-size:.85rem; }
    .sb-seccion-profe { font-size:.75rem; color:#6b7280; margin:2px 0; }
    .sb-seccion-arrow { color:#d1d5db; }
    .sb-tag { display:inline-block; background:#e6f2ff; color:#1a3c5e;
      font-size:.7rem; padding:2px 6px; border-radius:4px; margin:2px; border:1px solid #bfdbfe; }
  `;
  document.head.appendChild(style);
})();

/* ─── INIT CON POLLING ─── */
function verificarEInicializar() {
  const modal = document.getElementById('horario-modal');
  if (modal && modal.innerHTML.length > 200) {
    initScheduleBuilder();
  } else {
    setTimeout(verificarEInicializar, 300);
  }
}

document.addEventListener('DOMContentLoaded', verificarEInicializar);
