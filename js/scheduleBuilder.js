/**
 * Schedule Builder Logic para Portal Domiter
 * Permite a los estudiantes armar su horario dinámicamente.
 */

window.catalogoMaterias = {}; // { "Matematicas I": [ {seccion: "Sección A", profe: "...", tiempos: [{dia: "Lunes", inicio: 420, fin: 510, texto: "7:00 am - 8:30 am"}] } ] }
window.horarioSeleccionado = []; // [{nombre: "Matematicas I", seccionObj: {...}}]

const HORAS_GRID = [
    {texto: "7:00 am", min: 420},
    {texto: "7:45 am", min: 465},
    {texto: "8:30 am", min: 510},
    {texto: "8:45 am", min: 525},
    {texto: "9:30 am", min: 570},
    {texto: "10:15 am", min: 615},
    {texto: "10:30 am", min: 630},
    {texto: "11:15 am", min: 675},
    {texto: "12:00 pm", min: 720},
    {texto: "12:45 pm", min: 765},
    {texto: "1:00 pm", min: 780},
    {texto: "1:45 pm", min: 825},
    {texto: "2:30 pm", min: 870},
    {texto: "3:15 pm", min: 915},
    {texto: "4:15 pm", min: 975},
    {texto: "5:15 pm", min: 1035}
];

function initScheduleBuilder() {
    extraerCatalogo();
    dibujarTablaVacia();
    console.log("Schedule Builder Inicializado. Materias encontradas:", Object.keys(window.catalogoMaterias).length);
}

// 1. EXTRAER CATALOGO DEL DOM
function extraerCatalogo() {
    const tabs = document.querySelectorAll('#horario-modal .tab-content');
    let catalogo = {};

    tabs.forEach(tab => {
        const bloquesSeccion = tab.querySelectorAll('.mb-8');
        bloquesSeccion.forEach(bloque => {
            const h3 = bloque.querySelector('h3');
            if (!h3) return;
            const seccionTexto = h3.textContent.trim(); // "Sección A (Aula 24)"
            
            const lis = bloque.querySelectorAll('li');
            lis.forEach(li => {
                const h4 = li.querySelector('h4');
                const p = li.querySelector('p');
                if (!h4 || !p) return;
                
                // Limpiar nombre de materia
                let nombreMateria = h4.textContent.replace('Electiva', '').trim();
                let profe = p.textContent.trim();
                
                let tiempos = [];
                const spansHora = li.querySelectorAll('span.bg-yellow-50');
                spansHora.forEach(span => {
                    const textoHora = span.textContent.trim(); // "Lunes 7:00 am - 8:30 am"
                    const parseado = parsearHoraTexto(textoHora);
                    if(parseado) tiempos.push(parseado);
                });

                if (!catalogo[nombreMateria]) {
                    catalogo[nombreMateria] = [];
                }

                // Verificar si ya existe esta sección para esta materia
                const existe = catalogo[nombreMateria].find(s => s.seccion === seccionTexto);
                if (!existe) {
                    catalogo[nombreMateria].push({
                        seccion: seccionTexto,
                        profe: profe,
                        tiempos: tiempos
                    });
                }
            });
        });
    });

    window.catalogoMaterias = catalogo;
}

function parsearHoraTexto(texto) {
    // Ejemplo: "Lunes 7:00 am - 8:30 am"
    // Extraer dia
    const diasStr = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
    let diaEncontrado = null;
    for(let d of diasStr) {
        if(texto.includes(d)) {
            diaEncontrado = d;
            break;
        }
    }
    if(!diaEncontrado) return null;

    // Extraer horas
    const regex = /(\d{1,2}:\d{2}\s*(?:am|pm))\s*-\s*(\d{1,2}:\d{2}\s*(?:am|pm))/i;
    const match = texto.match(regex);
    if(match) {
        return {
            dia: diaEncontrado,
            inicio: convertirAMinutos(match[1]),
            fin: convertirAMinutos(match[2]),
            texto: match[0]
        };
    }
    return null;
}

function convertirAMinutos(horaStr) {
    horaStr = horaStr.trim().toLowerCase();
    let [hora, resto] = horaStr.split(':');
    let min = parseInt(resto.substring(0, 2));
    let esPm = horaStr.includes('pm');
    let h = parseInt(hora);
    
    if(esPm && h !== 12) h += 12;
    if(!esPm && h === 12) h = 0;
    
    return (h * 60) + min;
}

// 2. BUSCADOR
function buscarMateriaCreador() {
    const input = document.getElementById('buscador-materias-creador').value.toLowerCase().trim();
    const contenedor = document.getElementById('lista-materias-buscador');
    
    if (input.length < 2) {
        contenedor.classList.add('hidden');
        return;
    }

    let html = '';
    let matches = 0;

    for (let materia in window.catalogoMaterias) {
        if (materia.toLowerCase().includes(input)) {
            matches++;
            html += `<div class="p-3 border-b border-gray-100 hover:bg-yellow-50 cursor-pointer flex justify-between items-center transition" onclick="intentarAgregarMateria('${materia}')">
                        <span class="font-semibold text-gray-800 text-sm">${materia}</span>
                        <i class="fas fa-plus-circle text-[#a57c00]"></i>
                     </div>`;
        }
    }

    if (matches === 0) {
        html = `<div class="p-3 text-sm text-gray-500 italic text-center">No se encontraron materias.</div>`;
    }

    contenedor.innerHTML = html;
    contenedor.classList.remove('hidden');
}

// Ocultar buscador al hacer clic fuera
document.addEventListener('click', function(e) {
    const contenedor = document.getElementById('lista-materias-buscador');
    const input = document.getElementById('buscador-materias-creador');
    if(contenedor && !contenedor.contains(e.target) && e.target !== input) {
        contenedor.classList.add('hidden');
    }
});

// 3. AGREGAR MATERIA Y VALIDAR SOLAPAMIENTO
window.materiaPendiente = null;

function intentarAgregarMateria(materia) {
    document.getElementById('lista-materias-buscador').classList.add('hidden');
    document.getElementById('buscador-materias-creador').value = '';
    
    // Ya la tengo?
    if (window.horarioSeleccionado.find(m => m.nombre === materia)) {
        mostrarAlerta(`Ya agregaste <strong>${materia}</strong> a tu horario.`);
        return;
    }

    const secciones = window.catalogoMaterias[materia];
    if (!secciones || secciones.length === 0) return;

    if (secciones.length === 1) {
        validarYAgregar(materia, secciones[0]);
    } else {
        // Multiples secciones
        window.materiaPendiente = materia;
        abrirSelectorSeccion(materia, secciones);
    }
}

function abrirSelectorSeccion(materia, secciones) {
    document.getElementById('seccion-selector-materia').textContent = materia;
    const contenedor = document.getElementById('seccion-selector-opciones');
    let html = '';

    secciones.forEach((sec, index) => {
        let horasHtml = sec.tiempos.map(t => `<span class="inline-block bg-white text-xs px-1 border border-gray-200 rounded text-gray-600 mr-1 mb-1">${t.dia} ${t.texto}</span>`).join('');
        html += `
        <div class="border border-gray-200 p-3 rounded bg-white hover:border-[#a57c00] cursor-pointer transition flex justify-between items-center" onclick="seleccionarSeccion(${index})">
            <div>
                <div class="font-bold text-[#a57c00] text-sm">${sec.seccion}</div>
                <div class="text-xs text-gray-500 mb-1">${sec.profe}</div>
                <div>${horasHtml}</div>
            </div>
            <i class="fas fa-chevron-right text-gray-300"></i>
        </div>`;
    });

    contenedor.innerHTML = html;
    document.getElementById('seccion-selector-modal').classList.remove('hidden');
    document.getElementById('seccion-selector-modal').classList.add('flex');
}

function cerrarSelectorSeccion() {
    document.getElementById('seccion-selector-modal').classList.add('hidden');
    document.getElementById('seccion-selector-modal').classList.remove('flex');
    window.materiaPendiente = null;
}

function seleccionarSeccion(index) {
    if (!window.materiaPendiente) return;
    const materia = window.materiaPendiente;
    const seccionObj = window.catalogoMaterias[materia][index];
    cerrarSelectorSeccion();
    validarYAgregar(materia, seccionObj);
}

function validarYAgregar(nombre, seccionObj) {
    // 1. Validar solapamiento
    for (let tNuevo of seccionObj.tiempos) {
        for (let mExistente of window.horarioSeleccionado) {
            for (let tEx of mExistente.seccionObj.tiempos) {
                if (tNuevo.dia === tEx.dia) {
                    // Hay solapamiento si Max(inicio) < Min(fin)
                    let maxInicio = Math.max(tNuevo.inicio, tEx.inicio);
                    let minFin = Math.min(tNuevo.fin, tEx.fin);
                    if (maxInicio < minFin) {
                        mostrarAlerta(`<strong>${nombre}</strong> choca con <strong>${mExistente.nombre}</strong> el ${tNuevo.dia} a las ${tNuevo.texto.split('-')[0].trim()}.`);
                        return;
                    }
                }
            }
        }
    }

    // 2. Agregar
    ocultarAlerta();
    window.horarioSeleccionado.push({
        nombre: nombre,
        seccionObj: seccionObj,
        colorClass: getColorParaMateria(window.horarioSeleccionado.length)
    });
    
    actualizarUI();
}

function removerMateria(index) {
    window.horarioSeleccionado.splice(index, 1);
    ocultarAlerta();
    actualizarUI();
}

function limpiarHorarioCreado() {
    window.horarioSeleccionado = [];
    ocultarAlerta();
    actualizarUI();
}

const COLORES = [
    'bg-blue-100 border-blue-300 text-blue-800',
    'bg-green-100 border-green-300 text-green-800',
    'bg-purple-100 border-purple-300 text-purple-800',
    'bg-pink-100 border-pink-300 text-pink-800',
    'bg-indigo-100 border-indigo-300 text-indigo-800',
    'bg-rose-100 border-rose-300 text-rose-800',
    'bg-orange-100 border-orange-300 text-orange-800',
    'bg-teal-100 border-teal-300 text-teal-800'
];

function getColorParaMateria(index) {
    return COLORES[index % COLORES.length];
}

// 4. ACTUALIZAR INTERFAZ Y TABLA
function actualizarUI() {
    const lista = document.getElementById('lista-materias-seleccionadas');
    const contador = document.getElementById('contador-materias');
    const overlay = document.getElementById('horario-empty-overlay');
    
    contador.textContent = window.horarioSeleccionado.length;

    if (window.horarioSeleccionado.length === 0) {
        lista.innerHTML = `<li id="empty-state-materias" class="text-xs text-gray-500 italic text-center py-6 bg-white border border-dashed border-gray-300 rounded"><i class="fas fa-inbox text-2xl text-gray-300 mb-2 block"></i>Busca y agrega materias<br>para empezar a armar tu horario.</li>`;
        if(overlay) overlay.style.opacity = '1';
        dibujarTablaVacia();
        return;
    }

    if(overlay) overlay.style.opacity = '0';
    setTimeout(() => { if(overlay && window.horarioSeleccionado.length > 0) overlay.style.pointerEvents = 'none'; }, 300);

    // Renderizar lista
    let htmlLista = '';
    window.horarioSeleccionado.forEach((m, index) => {
        let baseColor = m.colorClass.split(' ')[0]; // eg. bg-blue-100
        let dotColor = baseColor.replace('100', '400');
        
        htmlLista += `
        <li class="p-3 border border-gray-200 rounded bg-white shadow-sm flex justify-between items-start">
            <div class="flex-1">
                <div class="font-bold text-gray-800 text-sm flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full ${dotColor}"></span>
                    ${m.nombre}
                </div>
                <div class="text-[0.65rem] text-gray-500 mt-1 uppercase tracking-wide">${m.seccionObj.seccion}</div>
            </div>
            <button onclick="removerMateria(${index})" class="text-gray-400 hover:text-red-500 transition px-2 py-1"><i class="fas fa-times"></i></button>
        </li>`;
    });
    lista.innerHTML = htmlLista;

    dibujarTablaConMaterias();
}

function dibujarTablaVacia() {
    const tbody = document.getElementById('horario-tabla-body');
    if(!tbody) return;
    let html = '';
    
    HORAS_GRID.forEach(h => {
        html += `
        <tr>
            <td class="border border-gray-200 p-1 text-center font-semibold text-gray-500 bg-gray-50">${h.texto}</td>
            <td class="border border-gray-200 p-0 relative h-8" data-dia="Lunes" data-min="${h.min}"></td>
            <td class="border border-gray-200 p-0 relative h-8" data-dia="Martes" data-min="${h.min}"></td>
            <td class="border border-gray-200 p-0 relative h-8" data-dia="Miércoles" data-min="${h.min}"></td>
            <td class="border border-gray-200 p-0 relative h-8" data-dia="Jueves" data-min="${h.min}"></td>
            <td class="border border-gray-200 p-0 relative h-8" data-dia="Viernes" data-min="${h.min}"></td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

function dibujarTablaConMaterias() {
    dibujarTablaVacia();
    const tbody = document.getElementById('horario-tabla-body');
    
    window.horarioSeleccionado.forEach(m => {
        m.seccionObj.tiempos.forEach(t => {
            let filaInicio = null;
            let duracionMinutos = t.fin - t.inicio;
            
            const celdas = tbody.querySelectorAll(`td[data-dia="${t.dia}"]`);
            celdas.forEach(celda => {
                let minCelda = parseInt(celda.getAttribute('data-min'));
                if (minCelda === t.inicio || (minCelda <= t.inicio && minCelda + 45 > t.inicio)) {
                    if (!filaInicio) filaInicio = celda;
                }
            });

            if (filaInicio) {
                let slotsAbarcados = 0;
                for(let h of HORAS_GRID) {
                    if(h.min >= t.inicio && h.min < t.fin) slotsAbarcados++;
                }
                if(slotsAbarcados === 0) slotsAbarcados = 1;

                const bloque = document.createElement('div');
                bloque.className = `w-full h-full p-1 border-l-4 rounded-r shadow-sm flex flex-col justify-center items-center text-center leading-tight absolute top-0 left-0 z-10 ${m.colorClass} border-[currentColor]`;
                bloque.style.height = `calc(${slotsAbarcados * 100}% + ${slotsAbarcados - 1}px)`;
                
                bloque.innerHTML = `
                    <span class="font-bold text-[10px] sm:text-xs mb-0.5 line-clamp-2">${m.nombre}</span>
                    <span class="text-[8px] sm:text-[9px] opacity-80 uppercase">${m.seccionObj.seccion.split(' ')[0]} ${m.seccionObj.seccion.split(' ')[1] || ''}</span>
                `;
                
                filaInicio.classList.add('relative'); 
                filaInicio.appendChild(bloque);
            }
        });
    });
}

function mostrarAlerta(htmlMensaje) {
    const alerta = document.getElementById('alerta-solapamiento');
    const texto = document.getElementById('alerta-solapamiento-texto');
    if(alerta && texto) {
        texto.innerHTML = htmlMensaje;
        alerta.classList.remove('hidden');
    }
}

function ocultarAlerta() {
    const alerta = document.getElementById('alerta-solapamiento');
    if(alerta) alerta.classList.add('hidden');
}

// 5. EXPORTAR PDF
function exportarHorarioPDF() {
    if (window.horarioSeleccionado.length === 0) {
        alert("Debes agregar al menos una materia para exportar el horario.");
        return;
    }

    const elemento = document.getElementById('horario-pdf-container');
    const overlay = document.getElementById('horario-empty-overlay');
    if(overlay) overlay.style.display = 'none';

    var opt = {
        margin:       [10, 10, 10, 10],
        filename:     'Mi_Horario_Domiter_2026.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(elemento).save().then(() => {
        if(overlay) overlay.style.display = 'flex';
    });
}

// Esperar agresivamente a que render.js haya inyectado todo
function verificarEInicializar() {
    if (document.getElementById('horario-modal') && document.getElementById('horario-modal').innerHTML.length > 100) {
        initScheduleBuilder();
    } else {
        setTimeout(verificarEInicializar, 200); // Reintentar en 200ms
    }
}

document.addEventListener("DOMContentLoaded", function() {
    verificarEInicializar();
});
