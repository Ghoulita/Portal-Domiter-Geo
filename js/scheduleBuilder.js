/**
 * ============================================================
 * SCHEDULE BUILDER v3 - Portal Domiter Geo
 * IDs del DOM real: horario-tabla-body, horario-pdf-container,
 *   buscador-materias-creador, lista-materias-buscador,
 *   lista-materias-seleccionadas, contador-materias,
 *   seccion-selector-modal, seccion-selector-materia,
 *   seccion-selector-opciones, horario-empty-overlay
 * ============================================================
 */

/* ─── ESTADO GLOBAL ─── */
window.catalogoMaterias    = {};
window.horarioSeleccionado = [];
window.materiaPendiente    = null;

/* ─── BLOQUES HORARIOS ─── */
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

const PALETA = [
  { bg: '#dbeafe', borde: '#3b82f6', texto: '#1e3a5f' },
  { bg: '#d1fae5', borde: '#10b981', texto: '#064e3b' },
  { bg: '#ede9fe', borde: '#8b5cf6', texto: '#3b0764' },
  { bg: '#fce7f3', borde: '#ec4899', texto: '#831843' },
  { bg: '#ffedd5', borde: '#f97316', texto: '#7c2d12' },
  { bg: '#e0f2fe', borde: '#0ea5e9', texto: '#0c4a6e' },
  { bg: '#dcfce7', borde: '#22c55e', texto: '#14532d' },
  { bg: '#fef9c3', borde: '#eab308', texto: '#713f12' },
];
const getColor = i => PALETA[i % PALETA.length];

/* ─── HELPERS ─── */
function toMin(s) {
  s = s.trim().toLowerCase();
  const colon = s.indexOf(':');
  const hr  = parseInt(s.slice(0, colon));
  const min = parseInt(s.slice(colon + 1, colon + 3));
  const pm  = s.includes('pm');
  let h = hr;
  if (pm && h !== 12) h += 12;
  if (!pm && h === 12) h = 0;
  return h * 60 + min;
}

function parsearHora(texto) {
  const DIAS_MAP = ['Lunes','Martes','Miércoles','Jueves','Viernes'];
  let dia = null;
  for (const d of DIAS_MAP) { if (texto.includes(d)) { dia = d; break; } }
  if (!dia) return null;
  const rx = /(\d{1,2}:\d{2}\s*(?:am|pm))\s*-\s*(\d{1,2}:\d{2}\s*(?:am|pm))/i;
  const m = texto.match(rx);
  if (!m) return null;
  return { dia, inicio: toMin(m[1]), fin: toMin(m[2]), texto: m[0] };
}

function $id(id) { return document.getElementById(id); }

/* ─── INIT ─── */
function initScheduleBuilder() {
  extraerCatalogo();
  renderTabla();
  renderLista();
  inyectarEstilos();
  console.log('[SB] Inicializado. Materias:', Object.keys(window.catalogoMaterias).length);
}

/* ─── EXTRAER CATÁLOGO DEL DOM REAL ─── */
function extraerCatalogo() {
  const catalogo = {};
  /* El modal de horario tiene tabs con clase tab-content,
     dentro bloques .mb-8 con h3 (seccion) y li (materia) */
  const modal = $id('horario-modal');
  if (!modal) { console.warn('[SB] horario-modal no encontrado'); return; }

  modal.querySelectorAll('.tab-content').forEach(tab => {
    tab.querySelectorAll('.mb-8').forEach(bloque => {
      const h3 = bloque.querySelector('h3');
      if (!h3) return;
      const seccion = h3.textContent.trim();
      bloque.querySelectorAll('li').forEach(li => {
        const h4 = li.querySelector('h4');
        if (!h4) return;
        const nombre = h4.textContent.replace(/electiva/i, '').trim();
        const profe  = li.querySelector('p')?.textContent.trim() || '';
        const tiempos = [];
        li.querySelectorAll('span').forEach(span => {
          if (span.textContent.match(/\d:\d{2}\s*(?:am|pm)/i)) {
            const t = parsearHora(span.textContent.trim());
            if (t) tiempos.push(t);
          }
        });
        if (!catalogo[nombre]) catalogo[nombre] = [];
        if (!catalogo[nombre].find(s => s.seccion === seccion)) {
          catalogo[nombre].push({ seccion, profe, tiempos });
        }
      });
    });
  });

  window.catalogoMaterias = catalogo;
  console.log('[SB] Catálogo:', catalogo);
}

/* ─── BUSCADOR ─── */
function buscarMateriaCreador() {
  const input = $id('buscador-materias-creador');
  const box   = $id('lista-materias-buscador');
  if (!input || !box) return;
  const q = input.value.toLowerCase().trim();
  if (q.length < 2) { box.classList.add('hidden'); return; }

  let html = '';
  Object.keys(window.catalogoMaterias).forEach(nombre => {
    if (!nombre.toLowerCase().includes(q)) return;
    const ya = window.horarioSeleccionado.find(m => m.nombre === nombre);
    html += `<div class="sb-item${ya ? ' sb-item--ya' : ''}" onclick="intentarAgregarMateria('${nombre.replace(/'/g, "\\'")}')">
      <span>${nombre}</span>
      <i class="fas ${ya ? 'fa-check' : 'fa-plus-circle'}"></i>
    </div>`;
  });
  if (!html) html = `<div class="sb-empty">No se encontraron materias.</div>`;
  box.innerHTML = html;
  box.classList.remove('hidden');
}

document.addEventListener('click', e => {
  const box   = $id('lista-materias-buscador');
  const input = $id('buscador-materias-creador');
  if (box && !box.contains(e.target) && e.target !== input) box.classList.add('hidden');
});

/* ─── AGREGAR / SELECCIONAR ─── */
function intentarAgregarMateria(nombre) {
  $id('lista-materias-buscador')?.classList.add('hidden');
  const inp = $id('buscador-materias-creador');
  if (inp) inp.value = '';

  if (window.horarioSeleccionado.find(m => m.nombre === nombre)) {
    sbToast(`<b>${nombre}</b> ya está en tu horario.`, 'info'); return;
  }
  const secs = window.catalogoMaterias[nombre];
  if (!secs?.length) return;
  if (secs.length === 1) {
    procesarAgregar(nombre, secs[0]);
  } else {
    window.materiaPendiente = nombre;
    abrirSelectorSeccion(nombre, secs);
  }
}

function abrirSelectorSeccion(nombre, secs) {
  const titleEl = $id('seccion-selector-materia');
  const optsEl  = $id('seccion-selector-opciones');
  if (!titleEl || !optsEl) return;
  titleEl.textContent = nombre;
  optsEl.innerHTML = secs.map((s, i) => {
    const tags = s.tiempos.map(t => `<span class="sb-tag">${t.dia} ${t.texto}</span>`).join('');
    return `<div class="sb-sec-card" onclick="seleccionarSeccion(${i})">
      <div>
        <div class="sb-sec-nombre">${s.seccion}</div>
        <div class="sb-sec-profe">${s.profe}</div>
        <div>${tags}</div>
      </div>
      <i class="fas fa-chevron-right" style="color:#d1d5db"></i>
    </div>`;
  }).join('');
  const m = $id('seccion-selector-modal');
  if (m) { m.classList.remove('hidden'); m.classList.add('flex'); }
}

function cerrarSelectorSeccion() {
  const m = $id('seccion-selector-modal');
  if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
  window.materiaPendiente = null;
}

function seleccionarSeccion(index) {
  if (!window.materiaPendiente) return;
  const nombre = window.materiaPendiente;
  const sec    = window.catalogoMaterias[nombre][index];
  cerrarSelectorSeccion();
  procesarAgregar(nombre, sec);
}

/* ─── VALIDACIÓN DE SOLAPAMIENTOS ─── */
function procesarAgregar(nombre, seccionObj) {
  const choques = [];
  seccionObj.tiempos.forEach(tN => {
    window.horarioSeleccionado.forEach(ex => {
      ex.seccionObj.tiempos.forEach(tE => {
        if (tN.dia === tE.dia &&
            Math.max(tN.inicio, tE.inicio) < Math.min(tN.fin, tE.fin)) {
          if (!choques.find(c => c.m === ex.nombre && c.d === tN.dia)) {
            choques.push({ m: ex.nombre, d: tN.dia });
          }
        }
      });
    });
  });

  if (choques.length > 0) {
    const detalle = choques.map(c => `• ${c.m} (${c.d})`).join('\n');
    const ok = confirm(
      `⚠️ CHOQUE DE HORARIO\n\n` +
      `"${nombre}" colisiona con:\n${detalle}\n\n` +
      `¿Deseas agregarlo igual? El bloque se marcará en rojo.`
    );
    if (!ok) return;
    agregarMateria(nombre, seccionObj, true);
  } else {
    agregarMateria(nombre, seccionObj, false);
  }
}

function agregarMateria(nombre, seccionObj, conChoque) {
  window.horarioSeleccionado.push({
    nombre, seccionObj,
    color: getColor(window.horarioSeleccionado.length),
    conChoque
  });
  renderTabla();
  renderLista();
  sbToast(`<b>${nombre}</b> agregada.${conChoque ? ' ⚠️ Choque marcado.' : ''}`, conChoque ? 'warn' : 'ok');
}

function removerMateria(index) {
  window.horarioSeleccionado.splice(index, 1);
  window.horarioSeleccionado.forEach((m, i) => { m.color = getColor(i); });
  renderTabla();
  renderLista();
}

function limpiarHorarioCreado() {
  window.horarioSeleccionado = [];
  renderTabla();
  renderLista();
}

/* ─── RENDER TABLA (usa horario-tabla-body que SÍ existe) ─── */
function renderTabla() {
  const tbody   = $id('horario-tabla-body');
  const overlay = $id('horario-empty-overlay');

  if (!tbody) { console.warn('[SB] horario-tabla-body no encontrado'); return; }

  /* Limpiar filas previas */
  tbody.innerHTML = '';

  /* Construir mapa: dia+bloque → materia */
  const mapa = {}; // key: "dia|inicioBloque"
  window.horarioSeleccionado.forEach(m => {
    m.seccionObj.tiempos.forEach(t => {
      BLOQUES.forEach(b => {
        if (t.dia === b.label.split('–')[0] || /* match por dia/hora */
            (t.inicio <= b.inicio && t.fin >= b.fin)) {
          if (t.dia) {
            const key = `${t.dia}|${b.inicio}`;
            if (!mapa[key]) mapa[key] = [];
            mapa[key].push(m);
          }
        }
      });
    });
  });

  /* Reconstruir mapa correctamente */
  const mapaFinal = {};
  window.horarioSeleccionado.forEach(m => {
    m.seccionObj.tiempos.forEach(t => {
      BLOQUES.forEach(b => {
        if (t.dia && t.inicio <= b.inicio && t.fin >= b.fin) {
          const key = `${t.dia}|${b.inicio}`;
          if (!mapaFinal[key]) mapaFinal[key] = m;
        }
      });
    });
  });

  /* Construir filas */
  BLOQUES.forEach(b => {
    const tr = document.createElement('tr');

    /* Celda de hora */
    const tdHora = document.createElement('td');
    tdHora.style.cssText = 'border:1px solid #e5e7eb;padding:3px 6px;text-align:center;font-size:10px;font-weight:600;color:#6b7280;background:#f9fafb;white-space:nowrap;';
    tdHora.textContent = b.label;
    tr.appendChild(tdHora);

    /* Celdas por día */
    DIAS.forEach(dia => {
      const td = document.createElement('td');
      td.style.cssText = 'border:1px solid #e5e7eb;padding:2px;vertical-align:middle;text-align:center;min-height:28px;';

      const m = mapaFinal[`${dia}|${b.inicio}`];
      if (m) {
        const bg    = m.conChoque ? '#fff0f0' : m.color.bg;
        const borde = m.conChoque ? '3px solid #ef4444' : `3px solid ${m.color.borde}`;
        const col   = m.conChoque ? '#b91c1c' : m.color.texto;

        td.style.background   = bg;
        td.style.borderLeft   = borde;
        td.style.color        = col;
        td.style.webkitPrintColorAdjust = 'exact';
        td.style.printColorAdjust       = 'exact';

        td.innerHTML = `<div style="font-weight:700;font-size:10px;line-height:1.3;padding:1px 2px;">${m.nombre}</div>
          <div style="font-size:8px;opacity:.75;">${m.seccionObj.seccion.split('(')[0].trim()}</div>
          ${m.conChoque ? '<div style="font-size:8px;color:#dc2626;font-weight:bold;">⚠ CHOQUE</div>' : ''}`;
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  /* Overlay vacío */
  if (overlay) {
    overlay.style.opacity = window.horarioSeleccionado.length === 0 ? '1' : '0';
    overlay.style.pointerEvents = window.horarioSeleccionado.length === 0 ? 'auto' : 'none';
  }

  /* Contador */
  const ctr = $id('contador-materias');
  if (ctr) ctr.textContent = window.horarioSeleccionado.length;
}

/* ─── RENDER LISTA ─── */
function renderLista() {
  const lista = $id('lista-materias-seleccionadas');
  if (!lista) return;

  if (window.horarioSeleccionado.length === 0) {
    lista.innerHTML = `<li id="empty-state-materias" style="
      text-align:center;padding:1.5rem .5rem;color:#9ca3af;
      border:2px dashed #e5e7eb;border-radius:8px;list-style:none;font-size:.8rem;">
      <i class="fas fa-inbox" style="font-size:1.5rem;display:block;margin-bottom:.4rem;"></i>
      Busca y agrega materias<br>para empezar a armar tu horario.
    </li>`;
    return;
  }

  lista.innerHTML = window.horarioSeleccionado.map((m, i) => `
    <li style="display:flex;justify-content:space-between;align-items:flex-start;
      padding:.55rem .75rem;border-radius:8px;margin-bottom:.35rem;list-style:none;
      background:${m.conChoque ? '#fff0f0' : m.color.bg};
      border-left:4px solid ${m.conChoque ? '#ef4444' : m.color.borde};">
      <div>
        <div style="font-weight:700;font-size:.8rem;color:${m.conChoque ? '#b91c1c' : m.color.texto};">
          ${m.conChoque ? '⚠️ ' : ''}${m.nombre}
        </div>
        <div style="font-size:.7rem;opacity:.7;margin-top:1px;">${m.seccionObj.seccion}</div>
      </div>
      <button onclick="removerMateria(${i})"
        style="background:none;border:none;cursor:pointer;color:#9ca3af;
          padding:0 6px;font-size:.9rem;line-height:1;flex-shrink:0;">✕</button>
    </li>`).join('');
}

/* ─── EXPORTAR PDF ─── */
function exportarHorarioPDF() {
  if (window.horarioSeleccionado.length === 0) {
    sbToast('Agrega al menos una materia antes de exportar.', 'warn'); return;
  }

  /* Encabezado institucional */
  const pdfContainer = $id('horario-pdf-container');
  if (!pdfContainer) { alert('No se encontró el contenedor del horario.'); return; }

  /* Crear encabezado temporal */
  const hdr = document.createElement('div');
  hdr.style.cssText = 'background:#1a3c5e;color:#fff;padding:8px 14px;margin-bottom:6px;border-radius:4px;-webkit-print-color-adjust:exact;print-color-adjust:exact;';
  hdr.innerHTML = `<div style="font-size:13px;font-weight:700;">Universidad Central de Venezuela</div>
    <div style="font-size:11px;opacity:.85;">Escuela de Geografía · Portal DOMITER · Horario 2026</div>`;
  pdfContainer.prepend(hdr);

  const opt = {
    margin:      [8, 6, 8, 6],
    filename:    'Horario_Geo_UCV_2026.pdf',
    image:       { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#fff' },
    jsPDF:       { unit: 'mm', format: 'a4', orientation: 'landscape' }
  };

  const doExport = () => {
    html2pdf().set(opt).from(pdfContainer).save()
      .then(() => { hdr.remove(); })
      .catch(err => { console.error(err); hdr.remove(); });
  };

  if (typeof html2pdf === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    s.onload = doExport;
    document.head.appendChild(s);
  } else {
    doExport();
  }
}

/* ─── TOAST ─── */
function sbToast(htmlMsg, tipo) {
  let el = $id('sb-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sb-toast';
    el.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;padding:12px 18px;border-radius:10px;font-size:.83rem;max-width:300px;box-shadow:0 4px 20px rgba(0,0,0,.15);transition:opacity .4s;font-family:system-ui,sans-serif;pointer-events:none;';
    document.body.appendChild(el);
  }
  el.style.background = tipo === 'ok' ? '#1a3c5e' : tipo === 'warn' ? '#7f1d1d' : '#374151';
  el.style.color = '#fff';
  el.innerHTML = htmlMsg;
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.opacity = '0'; }, 3500);
}

/* ─── ESTILOS DEL BUSCADOR ─── */
function inyectarEstilos() {
  if ($id('sb-css')) return;
  const s = document.createElement('style');
  s.id = 'sb-css';
  s.textContent = `
    #lista-materias-buscador{position:absolute;z-index:999;width:100%;
      background:#fff;border:1px solid #d1d5db;border-radius:8px;
      box-shadow:0 8px 24px rgba(0,0,0,.12);max-height:220px;overflow-y:auto;}
    .sb-item{display:flex;justify-content:space-between;align-items:center;
      padding:9px 14px;cursor:pointer;border-bottom:1px solid #f3f4f6;
      font-size:.82rem;color:#1f2937;transition:background .15s;}
    .sb-item:hover{background:#eff6ff;}
    .sb-item--ya{color:#9ca3af;}
    .sb-empty{padding:12px;text-align:center;font-size:.8rem;color:#9ca3af;font-style:italic;}
    .sb-sec-card{display:flex;justify-content:space-between;align-items:center;
      border:1px solid #e5e7eb;padding:10px 12px;border-radius:8px;
      cursor:pointer;background:#fff;transition:border-color .2s;margin-bottom:6px;}
    .sb-sec-card:hover{border-color:#1a3c5e;}
    .sb-sec-nombre{font-weight:700;color:#1a3c5e;font-size:.85rem;}
    .sb-sec-profe{font-size:.73rem;color:#6b7280;margin:2px 0;}
    .sb-tag{display:inline-block;background:#e6f2ff;color:#1a3c5e;
      font-size:.68rem;padding:1px 5px;border-radius:3px;margin:2px;border:1px solid #bfdbfe;}
  `;
  document.head.appendChild(s);
}

/* ─── COMPATIBILIDAD: función que antes existía ─── */
function mostrarAlerta(html) { sbToast(html, 'warn'); }
function ocultarAlerta() {}

/* ─── INIT CON POLLING (espera a que render.js inyecte el DOM) ─── */
function sbVerificarEInit() {
  const modal = $id('crea-horario-modal');
  const tbody = $id('horario-tabla-body');
  if (modal && tbody) {
    initScheduleBuilder();
  } else {
    setTimeout(sbVerificarEInit, 300);
  }
}

document.addEventListener('DOMContentLoaded', sbVerificarEInit);
