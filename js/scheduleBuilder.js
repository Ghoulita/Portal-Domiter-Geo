/**
 * Schedule Builder v9 - Portal Domiter
 * Soluciona la exportación de PDF cortada usando un clon del DOM para evadir los estilos del padre.
 */

/* ── CONSTANTES ── */
const SB_DIAS   = ['Lunes','Martes','Miércoles','Jueves','Viernes'];
const SB_BLOQUES = [
  {l:'7:00–7:45',  s:420, e:465}, {l:'7:45–8:30',  s:465, e:510},
  {l:'8:45–9:30',  s:525, e:570}, {l:'9:30–10:15', s:570, e:615},
  {l:'10:30–11:15',s:630, e:675}, {l:'11:15–12:00',s:675, e:720},
  {l:'12:00–12:45',s:720, e:765}, {l:'1:00–1:45',  s:780, e:825},
  {l:'1:45–2:30',  s:825, e:870}, {l:'2:30–3:15',  s:870, e:915},
  {l:'3:15–4:15',  s:915, e:975}, {l:'4:15–5:15',  s:975, e:1035},
];
const SB_PALETA = [
  ['#dbeafe','#3b82f6','#1e3a5f'], ['#d1fae5','#10b981','#064e3b'],
  ['#ede9fe','#8b5cf6','#3b0764'], ['#fce7f3','#ec4899','#831843'],
  ['#ffedd5','#f97316','#7c2d12'], ['#e0f2fe','#0ea5e9','#0c4a6e'],
  ['#dcfce7','#22c55e','#14532d'], ['#fef9c3','#eab308','#713f12'],
];

/* ── ESTADO ── */
window.sbCatalogo   = {};
window.sbHorario    = [];
window.sbPendiente  = null;

/* ── HELPERS ── */
const $  = id => document.getElementById(id);
const gc = i  => SB_PALETA[i % SB_PALETA.length];

function sbNorm(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function sbMin(s) {
  s = s.trim().toLowerCase();
  const c = s.indexOf(':');
  let h = parseInt(s), m = parseInt(s.slice(c+1,c+3));
  if (s.includes('pm') && h!==12) h+=12;
  if (s.includes('am') && h===12) h=0;
  return h*60+m;
}
function sbParseHora(txt) {
  const dias = ['Lunes','Martes','Miércoles','Jueves','Viernes'];
  let dia = dias.find(d => txt.includes(d));
  if (!dia) return null;
  const m = txt.match(/(\d{1,2}:\d{2}\s*(?:am|pm))\s*-\s*(\d{1,2}:\d{2}\s*(?:am|pm))/i);
  if (!m) return null;
  return {dia, s:sbMin(m[1]), e:sbMin(m[2]), txt:m[0]};
}
function sbToast(html, tipo) {
  let el = $('sb-toast');
  if (!el) {
    el = document.createElement('div'); el.id='sb-toast';
    el.style.cssText='position:fixed;bottom:22px;right:22px;z-index:999999;padding:11px 16px;border-radius:9px;font-size:.82rem;max-width:290px;box-shadow:0 4px 18px rgba(0,0,0,.15);transition:opacity .4s;font-family:system-ui,sans-serif;pointer-events:none;';
    document.body.appendChild(el);
  }
  el.style.background = tipo==='ok'?'#1a3c5e':tipo==='warn'?'#7f1d1d':'#374151';
  el.style.color='#fff'; el.innerHTML=html; el.style.opacity='1';
  clearTimeout(el._t); el._t=setTimeout(()=>el.style.opacity='0', 3500);
}

/* ── MODAL CONTROL ── */
window.sbAbrirModal = function() {
  const m = $('crea-horario-modal-v6');
  if (m) m.style.display = 'flex';
};

window.sbCerrarModal = function() {
  const m = $('crea-horario-modal-v6');
  if (m) m.style.display = 'none';
};

/* ── INYECTAR HTML DEL MODAL DESDE CERO ── */
function sbInyectarUI() {
  let modal = $('crea-horario-modal-v6');
  if (!modal) { 
    modal = document.createElement('div');
    modal.id = 'crea-horario-modal-v6';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.6);z-index:99999;display:none;align-items:center;justify-content:center;padding:1rem;box-sizing:border-box;';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
  <div style="background:#fff;width:100%;max-width:1100px;max-height:95vh;padding:1.5rem;position:relative;box-shadow:0 25px 60px rgba(0,0,0,.25);border-top:4px solid #d4af37;overflow-y:auto;display:flex;flex-direction:column;gap:1rem;border-radius:8px;">
    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:.75rem;border-bottom:1px solid #e5e7eb;padding-bottom:1rem;">
      <div>
        <h2 style="font-size:1.6rem;color:#a57c00;margin:0 0 .25rem;font-family:'Times New Roman',serif;">
          <i class="fas fa-magic"></i> Crea tu Horario
        </h2>
        <p style="color:#6b7280;font-size:.82rem;margin:0;">Busca materias, detecta choques y descarga tu horario en PDF.</p>
      </div>
      <div style="display:flex;gap:.5rem;align-items:center;">
        <button onclick="sbExportarPDF()" style="background:#a57c00;color:#fff;border:none;padding:.5rem 1rem;border-radius:6px;cursor:pointer;font-weight:700;font-size:.82rem;display:flex;align-items:center;gap:.4rem;">
          <i class="fas fa-file-pdf"></i> Exportar PDF
        </button>
        <button onclick="sbCerrarModal()" style="background:none;border:none;font-size:1.8rem;cursor:pointer;color:#9ca3af;line-height:1;padding:0 4px;">&times;</button>
      </div>
    </div>

    <!-- Body: left panel + tabla -->
    <div style="display:flex;gap:1.25rem;flex:1;min-height:0;flex-wrap:wrap;">

      <!-- Panel izquierdo -->
      <div style="width:260px;flex-shrink:0;display:flex;flex-direction:column;gap:.75rem;">
        <!-- Buscador -->
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:.9rem;">
          <div style="font-weight:700;color:#a57c00;font-size:.78rem;text-transform:uppercase;margin-bottom:.6rem;">
            <i class="fas fa-search"></i> Buscar Materia
          </div>
          <div style="position:relative;">
            <input id="sb-input" type="text" autocomplete="off" oninput="sbBuscar()"
              placeholder="Escribe el nombre..."
              style="width:100%;box-sizing:border-box;border:1px solid #d1d5db;padding:.45rem .6rem .45rem 2rem;font-size:.82rem;border-radius:6px;outline:none;"/>
            <i class="fas fa-search" style="position:absolute;left:.5rem;top:50%;transform:translateY(-50%);color:#9ca3af;font-size:.75rem;"></i>
          </div>
          <div id="sb-dropdown" style="display:none;border:1px solid #e5e7eb;border-radius:6px;background:#fff;max-height:200px;overflow-y:auto;margin-top:4px;box-shadow:0 6px 20px rgba(0,0,0,.1);"></div>
        </div>

        <!-- Lista materias -->
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:.9rem;flex:1;overflow:hidden;display:flex;flex-direction:column;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.6rem;">
            <span style="font-weight:700;color:#a57c00;font-size:.78rem;text-transform:uppercase;">
              <i class="fas fa-list"></i> Materias (<span id="sb-contador">0</span>)
            </span>
            <button onclick="sbLimpiar()" style="background:none;border:1px solid #fca5a5;color:#ef4444;border-radius:4px;padding:2px 7px;font-size:.7rem;cursor:pointer;">Limpiar</button>
          </div>
          <ul id="sb-lista" style="list-style:none;margin:0;padding:0;overflow-y:auto;flex:1;"></ul>
        </div>
      </div>

      <!-- Tabla horario -->
      <div style="flex:1;min-width:0;overflow-x:auto;">
        <div id="sb-pdf-container" style="-webkit-print-color-adjust:exact;print-color-adjust:exact;">
          <table id="sb-tabla" style="width:100%;border-collapse:collapse;font-size:11px;font-family:'Segoe UI',sans-serif;min-width:500px;">
            <thead>
              <tr>
                <th style="background:#1a3c5e;color:#fff;border:1px solid #0f2945;padding:6px 4px;font-size:10px;white-space:nowrap;">Hora</th>
                ${SB_DIAS.map(d=>`<th style="background:#1a3c5e;color:#fff;border:1px solid #0f2945;padding:6px 4px;text-align:center;font-size:10px;">${d}</th>`).join('')}
              </tr>
            </thead>
            <tbody id="sb-tbody"></tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- Alerta solapamiento (compat) -->
    <div id="alerta-solapamiento" style="display:none;background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;padding:.6rem .9rem;font-size:.8rem;color:#b91c1c;">
      <span id="alerta-solapamiento-texto"></span>
    </div>

    <!-- Selector de sección (modal interno) -->
    <div id="sb-sec-modal" style="display:none;position:absolute;inset:0;background:rgba(0,0,0,.5);border-radius:4px;align-items:center;justify-content:center;z-index:10;">
      <div style="background:#fff;border-radius:10px;padding:1.5rem;max-width:440px;width:90%;max-height:80vh;overflow-y:auto;">
        <h3 style="color:#a57c00;font-size:1rem;margin:0 0 .75rem;">Selecciona una Sección</h3>
        <p style="font-size:.8rem;color:#6b7280;margin:0 0 .75rem;"><strong id="sb-sec-nombre"></strong></p>
        <div id="sb-sec-opciones"></div>
        <button onclick="sbCerrarSec()" style="margin-top:.75rem;width:100%;border:1px solid #e5e7eb;background:#f9fafb;border-radius:6px;padding:.4rem;cursor:pointer;font-size:.8rem;">Cancelar</button>
      </div>
    </div>
  </div>`;

  sbRenderTabla();
  sbRenderLista();
  return true;
}

/* ── CATÁLOGO ── */
function sbExtraerCatalogo() {
  const cat = {};
  const bloques = document.querySelectorAll('.mb-8');
  
  if (bloques.length === 0) {
      console.warn('[SB] No se encontraron bloques de materias en el DOM (aún)');
      return false;
  }

  bloques.forEach(bloque => {
    const h3  = bloque.querySelector('h3');
    if (!h3) return;
    const sec = h3.textContent.trim();
    bloque.querySelectorAll('li').forEach(li => {
      const h4 = li.querySelector('h4');
      if (!h4) return;
      const nombre = h4.textContent.replace(/electiva/i,'').trim();
      const profe  = li.querySelector('p')?.textContent.trim()||'';
      const tiempos = [];
      li.querySelectorAll('span').forEach(sp => {
        if (/\d:\d{2}\s*(?:am|pm)/i.test(sp.textContent)) {
          const t = sbParseHora(sp.textContent.trim());
          if (t) tiempos.push(t);
        }
      });
      if (!cat[nombre]) cat[nombre]=[];
      if (!cat[nombre].find(s=>s.sec===sec))
        cat[nombre].push({sec, profe, tiempos});
    });
  });
  window.sbCatalogo = cat;
  console.log('[SB] Catálogo:', Object.keys(cat).length, 'materias');
  return Object.keys(cat).length > 0;
}

/* ── BUSCADOR ── */
function sbBuscar() {
  const inp = $('sb-input');
  const box = $('sb-dropdown');
  if (!inp||!box) return;
  const q = sbNorm(inp.value.trim());
  if (q.length < 2) { box.style.display='none'; return; }
  let html='';
  Object.keys(window.sbCatalogo).forEach(n => {
    if (!sbNorm(n).includes(q)) return;
    const ya = window.sbHorario.find(m=>m.nombre===n);
    html+=`<div onclick="sbIntentar('${n.replace(/'/g,"\\'")}') "
      style="padding:8px 12px;cursor:pointer;border-bottom:1px solid #f3f4f6;font-size:.8rem;
             display:flex;justify-content:space-between;align-items:center;
             ${ya?'color:#9ca3af;':''}" onmouseover="this.style.background='#eff6ff'" onmouseout="this.style.background=''">
      <span>${n}</span>
      <i class="fas ${ya?'fa-check':'fa-plus-circle'}" style="color:${ya?'#9ca3af':'#a57c00'}"></i>
    </div>`;
  });
  box.innerHTML = html||`<div style="padding:10px;text-align:center;font-size:.78rem;color:#9ca3af;font-style:italic;">Sin resultados.</div>`;
  box.style.display='block';
}

document.addEventListener('click', e=>{
  const box=$('sb-dropdown'),inp=$('sb-input');
  if(box&&!box.contains(e.target)&&e.target!==inp) box.style.display='none';
});

/* ── AGREGAR ── */
function sbIntentar(nombre) {
  const box=$('sb-dropdown'),inp=$('sb-input');
  if(box) box.style.display='none';
  if(inp) inp.value='';
  if (window.sbHorario.find(m=>m.nombre===nombre)) { sbToast(`<b>${nombre}</b> ya está en tu horario.`,'info'); return; }
  const secs = window.sbCatalogo[nombre];
  if (!secs?.length) return;
  if (secs.length===1) { sbValidar(nombre,secs[0]); }
  else { window.sbPendiente=nombre; sbAbrirSec(nombre,secs); }
}

function sbAbrirSec(nombre,secs) {
  const nm=$('sb-sec-nombre'), op=$('sb-sec-opciones'), modal=$('sb-sec-modal');
  if(!nm||!op||!modal) return;
  nm.textContent=nombre;
  op.innerHTML=secs.map((s,i)=>{
    const tags=s.tiempos.map(t=>`<span style="background:#e6f2ff;color:#1a3c5e;font-size:.68rem;padding:1px 5px;border-radius:3px;margin:2px;border:1px solid #bfdbfe;display:inline-block;">${t.dia} ${t.txt}</span>`).join('');
    return `<div onclick="sbElegirSec(${i})"
      style="border:1px solid #e5e7eb;padding:10px;border-radius:7px;cursor:pointer;margin-bottom:6px;background:#fff;"
      onmouseover="this.style.borderColor='#1a3c5e'" onmouseout="this.style.borderColor='#e5e7eb'">
      <div style="font-weight:700;color:#1a3c5e;font-size:.83rem;">${s.sec}</div>
      <div style="font-size:.72rem;color:#6b7280;margin:2px 0;">${s.profe}</div>
      <div>${tags}</div>
    </div>`;
  }).join('');
  modal.style.display='flex';
}

function sbCerrarSec() { const m=$('sb-sec-modal'); if(m) m.style.display='none'; window.sbPendiente=null; }

function sbElegirSec(i) {
  if(!window.sbPendiente) return;
  const nombre = window.sbPendiente;
  const sec = window.sbCatalogo[nombre][i];
  sbCerrarSec();
  sbValidar(nombre, sec);
}

/* ── SOLAPAMIENTO ── */
function sbValidar(nombre,secObj) {
  const choques=[];
  secObj.tiempos.forEach(tN=>{
    window.sbHorario.forEach(ex=>{
      ex.secObj.tiempos.forEach(tE=>{
        if(tN.dia===tE.dia && Math.max(tN.s,tE.s)<Math.min(tN.e,tE.e))
          if(!choques.find(c=>c.m===ex.nombre&&c.d===tN.dia))
            choques.push({m:ex.nombre,d:tN.dia});
      });
    });
  });
  if(choques.length){
    const det=choques.map(c=>`• ${c.m} (${c.d})`).join('\n');
    if(!confirm(`⚠️ CHOQUE DE HORARIO\n\n"${nombre}" colisiona con:\n${det}\n\n¿Agregar igual? El bloque se marcará en rojo.`)) return;
    sbAgregar(nombre,secObj,true);
  } else {
    sbAgregar(nombre,secObj,false);
  }
}

function sbAgregar(nombre,secObj,choque){
  window.sbHorario.push({nombre,secObj,color:gc(window.sbHorario.length),choque});
  sbRenderTabla(); sbRenderLista();
  sbToast(`<b>${nombre}</b> agregada.${choque?' ⚠️ Choque marcado.':''}`,'ok');
}

function sbRemover(i){
  window.sbHorario.splice(i,1);
  window.sbHorario.forEach((m,j)=>m.color=gc(j));
  sbRenderTabla(); sbRenderLista();
}

function sbLimpiar(){ window.sbHorario=[]; sbRenderTabla(); sbRenderLista(); }

/* ── RENDER TABLA (FUSIONANDO BLOQUES MEDIANTE ROWSPAN) ── */
function sbRenderTabla(){
  const tbody=$('sb-tbody');
  if(!tbody) return;

  // grid[dIdx][bIdx] = materia
  const grid = [];
  SB_DIAS.forEach((dia, dIdx) => {
    grid[dIdx] = [];
    SB_BLOQUES.forEach((b, bIdx) => grid[dIdx][bIdx] = null);
  });

  // Asignar materias a la grilla
  window.sbHorario.forEach(m => {
    m.secObj.tiempos.forEach(t => {
      const dIdx = SB_DIAS.indexOf(t.dia);
      if (dIdx !== -1) {
        SB_BLOQUES.forEach((b, bIdx) => {
          // Si el horario de la clase solapa al menos 25 minutos con el bloque, lo pintamos
          const overlap = Math.max(0, Math.min(t.e, b.e) - Math.max(t.s, b.s));
          if (overlap >= 25) {
            grid[dIdx][bIdx] = m;
          }
        });
      }
    });
  });

  tbody.innerHTML='';
  
  // skipRows[dIdx] lleva la cuenta de cuántas filas hay que saltar por rowspan
  const skipRows = {};
  SB_DIAS.forEach((d, i) => skipRows[i] = 0);

  SB_BLOQUES.forEach((b, bIdx) => {
    const tr = document.createElement('tr');
    
    // Celda de la hora
    const th = document.createElement('td');
    th.style.cssText = 'border:1px solid #e5e7eb;padding:3px 5px;text-align:center;font-size:9px;font-weight:600;color:#6b7280;background:#f8fafc;white-space:nowrap;';
    th.textContent = b.l; 
    tr.appendChild(th);
    
    // Celdas de días
    SB_DIAS.forEach((dia, dIdx) => {
      // Si estamos en medio de un rowspan anterior, ignoramos esta celda
      if (skipRows[dIdx] > 0) {
        skipRows[dIdx]--;
        return;
      }

      const m = grid[dIdx][bIdx];
      const td = document.createElement('td');
      td.style.cssText = 'border:1px solid #e5e7eb;padding:2px;min-height:26px;vertical-align:middle;text-align:center;';
      
      if (m) {
        // Calcular rowspan contando cuántos bloques consecutivos tienen la misma materia
        let rs = 1;
        while (bIdx + rs < SB_BLOQUES.length && grid[dIdx][bIdx + rs] === m) {
          rs++;
        }
        if (rs > 1) {
          td.rowSpan = rs;
          skipRows[dIdx] = rs - 1;
        }

        const [bg, borde, col] = m.choque ? ['#fff0f0','#ef4444','#b91c1c'] : m.color;
        td.style.background = bg;
        td.style.borderLeft = `3px solid ${borde}`;
        td.style.color = col;
        td.style.webkitPrintColorAdjust = 'exact';
        td.style.printColorAdjust = 'exact';
        td.innerHTML = `
          <div style="font-weight:700;font-size:9px;line-height:1.25;">${m.nombre}</div>
          <div style="font-size:8px;opacity:.75;">${m.secObj.sec.split('(')[0].trim()}</div>
          ${m.choque ? '<div style="font-size:7px;color:#dc2626;font-weight:bold;">⚠ CHOQUE</div>' : ''}
        `;
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  const ctr=$('sb-contador');
  if(ctr) ctr.textContent=window.sbHorario.length;
}

/* ── RENDER LISTA ── */
function sbRenderLista(){
  const ul=$('sb-lista');
  if(!ul) return;
  if(!window.sbHorario.length){
    ul.innerHTML=`<li style="text-align:center;padding:1.5rem .5rem;color:#9ca3af;font-size:.78rem;border:2px dashed #e5e7eb;border-radius:7px;">
      <i class="fas fa-inbox" style="display:block;font-size:1.3rem;margin-bottom:.3rem;"></i>Busca y agrega materias.</li>`;
    return;
  }
  ul.innerHTML=window.sbHorario.map((m,i)=>{
    const [bg,borde,col]=m.choque?['#fff0f0','#ef4444','#b91c1c']:m.color;
    return `<li style="display:flex;justify-content:space-between;align-items:flex-start;padding:.5rem .65rem;border-radius:7px;margin-bottom:.3rem;background:${bg};border-left:4px solid ${borde};">
      <div>
        <div style="font-weight:700;font-size:.78rem;color:${col};">${m.choque?'⚠️ ':''}${m.nombre}</div>
        <div style="font-size:.68rem;opacity:.7;">${m.secObj.sec}</div>
      </div>
      <button onclick="sbRemover(${i})" style="background:none;border:none;cursor:pointer;color:#9ca3af;font-size:.9rem;padding:0 4px;flex-shrink:0;">✕</button>
    </li>`;
  }).join('');
}

/* ── PDF ── */
function sbExportarPDF(){
  if(!window.sbHorario.length){ sbToast('Agrega al menos una materia.','warn'); return; }
  const original=$('sb-pdf-container');
  if(!original){ alert('Contenedor no encontrado'); return; }

  // FIX DEFINITIVO: Usar impresión nativa del navegador (Cero librerías, Cero fallos de Canvas)
  const printWindow = window.open('', '_blank');
  if(!printWindow) {
      alert('Por favor permite las ventanas emergentes (pop-ups) para generar el PDF.');
      return;
  }

  // Extraer el HTML de la tabla
  const tablaHtml = original.innerHTML;

  // Estilos específicos para asegurar que la tabla se vea perfecta en impresión
  const printCss = `
    <style>
      @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        padding: 20px;
        color: #000;
        background: #fff;
        margin: 0;
      }
      .header {
        background-color: #1a3c5e !important;
        color: #ffffff !important;
        padding: 12px 16px;
        border-radius: 6px;
        margin-bottom: 20px;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .header-title { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
      .header-sub { font-size: 12px; opacity: 0.9; }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
      }
      th {
        background-color: #1a3c5e !important;
        color: #ffffff !important;
        border: 1px solid #0f2945 !important;
        padding: 8px 4px;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      td {
        border: 1px solid #e5e7eb !important;
        padding: 4px;
      }
      /* Asegurar colores de fondo en los bloques */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      @media print {
        @page {
          size: landscape;
          margin: 10mm;
        }
        body { padding: 0; }
      }
    </style>
  `;

  // Construir el documento
  const contentHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Horario UCV 2026</title>
        ${printCss}
      </head>
      <body>
        <div class="header">
          <div class="header-title">Universidad Central de Venezuela</div>
          <div class="header-sub">Escuela de Geografía · Portal DOMITER · Horario 2026</div>
        </div>
        ${tablaHtml}
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(contentHtml);
  printWindow.document.close();

  // Avisar al usuario en la ventana original
  sbToast('Ventana de impresión abierta. Selecciona "Guardar como PDF" como destino.', 'success');
}

/* ── INIT ── */
function sbHookBotones() {
  const botones = document.querySelectorAll('button');
  let hooked = false;
  botones.forEach(btn => {
      const txt = btn.textContent.trim().toUpperCase();
      if (txt === 'ABRIR CREADOR' || btn.getAttribute('onclick')?.includes('crea-horario-modal')) {
          btn.removeAttribute('onclick');
          btn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              sbAbrirModal();
          });
          hooked = true;
      }
  });
  return hooked;
}

function sbInit() {
  const catalogoListo = sbExtraerCatalogo();
  if (!catalogoListo) {
      setTimeout(sbInit, 300); 
      return;
  }
  
  sbInyectarUI();
  
  const hookInt = setInterval(() => {
    if (sbHookBotones()) {
      clearInterval(hookInt);
      console.log('[SB] v9 botones enlazados correctamente');
    }
  }, 500);

  console.log('[SB] v9 inicializado');
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(sbInit, 100);
} else {
  document.addEventListener('DOMContentLoaded', sbInit);
}
