import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDg_0WcubPwsjw1hbFFze4otLWW6l8fAE4",
    authDomain: "faltas-cata.firebaseapp.com",
    projectId: "faltas-cata",
    storageBucket: "faltas-cata.firebasestorage.app",
    messagingSenderId: "54091544008",
    appId: "1:54091544008:web:c3f494eaf23d9e3c3e3cfd",
    measurementId: "G-L509S3Y5F4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const faltasRef = collection(db, "faltas");

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end', 
    showConfirmButton: false,
    timer: 2000, 
    timerProgressBar: true,
    background: 'var(--card-bg)',
    color: 'var(--text-main)',
    customClass: {
        popup: 'swal2-toast-custom'
    }
});

let todasLasFaltas = []; 
let fechasGuardadas = []; 

const fechaInput = document.getElementById("fechaInput");
const motivoInput = document.getElementById("motivoInput");
const filtroMes = document.getElementById("filtroMes");
const filtroAnio = document.getElementById("filtroAnio");
const busquedaMotivo = document.getElementById("busquedaMotivo");
const btnBuscarLupa = document.getElementById("btnBuscarLupa");
const btnExportar = document.getElementById("btnExportar");
const emptyState = document.getElementById("emptyState");

let ordenDescendente = true;
function esDiaLectivo(fechaString) {
    const partes = fechaString.split('-');
    const fecha = new Date(partes[0], partes[1] - 1, partes[2]);
    
    const inicioClases = new Date(2026, 2, 2); // 2 de Marzo
    const finClases = new Date(2026, 11, 22);  // 22 de Diciembre
    const recesoInicio = new Date(2026, 6, 20); // 20 de Julio
    const recesoFin = new Date(2026, 6, 31);    // 31 de Julio

    if (fecha < inicioClases || fecha > finClases) return false;
    if (fecha >= recesoInicio && fecha <= recesoFin) return false;

    const diaSemana = fecha.getDay();
    if (diaSemana === 0 || diaSemana === 6) return false; 
    return true;
}

if (fechaInput) {
    const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
    fechaInput.value = hoy;
    fechaInput.setAttribute("max", hoy); 
}

const q = query(faltasRef, orderBy("fecha", "desc"));
onSnapshot(q, (snapshot) => {
    todasLasFaltas = [];
    fechasGuardadas = [];

    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        todasLasFaltas.push({ id: docSnap.id, fecha: data.fecha, motivo: data.motivo || "" });
        fechasGuardadas.push(data.fecha);
    });

    renderizarLista();
});

function renderizarLista() {
    const lista = document.getElementById("listaFaltas");
    const skeletonList = document.getElementById("skeletonList");
    if (skeletonList) skeletonList.style.display = "none";
    if (!lista) return;
    
    lista.innerHTML = "";
    
    const mesSel = filtroMes ? filtroMes.value : "todos";
    const anioSel = filtroAnio ? filtroAnio.value : "todos";
    const textoBusqueda = busquedaMotivo ? busquedaMotivo.value.toLowerCase().trim() : "";

    const hoyObj = new Date();
    const hoyString = `${hoyObj.getFullYear()}-${(hoyObj.getMonth() + 1).toString().padStart(2, '0')}-${hoyObj.getDate().toString().padStart(2, '0')}`;

    let itemsParaMostrar = [...todasLasFaltas];
    
    Object.keys(feriadosArgentina2026).forEach(fechaFeriado => {
        if (fechaFeriado <= hoyString && esDiaLectivo(fechaFeriado)) {
            itemsParaMostrar.push({
                fecha: fechaFeriado,
                motivo: `Feriado: ${feriadosArgentina2026[fechaFeriado]}`,
                esFeriado: true,
                id: `feriado-${fechaFeriado}` 
            });
        }
    });

    const inicioVac = new Date(2026, 6, 20);
    const finVac = new Date(2026, 6, 31);
    let currVac = new Date(inicioVac);
    while (currVac <= finVac) {
        const y = currVac.getFullYear();
        const m = String(currVac.getMonth() + 1).padStart(2, '0');
        const d = String(currVac.getDate()).padStart(2, '0');
        const fechaVacStr = `${y}-${m}-${d}`;
        const diaSemana = currVac.getDay();
        
        if (diaSemana !== 0 && diaSemana !== 6 && fechaVacStr <= hoyString) {
            itemsParaMostrar.push({
                fecha: fechaVacStr,
                motivo: "Vacaciones de invierno",
                esFeriado: true,
                id: `vacacion-${fechaVacStr}`
            });
        }
        currVac.setDate(currVac.getDate() + 1);
    }

    itemsParaMostrar.sort((a, b) => {
        return ordenDescendente ? b.fecha.localeCompare(a.fecha) : a.fecha.localeCompare(b.fecha);
    });

    let contadorTotalFaltasYFeriados = 0;
    const mesesNombres = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    let ultimoMesAnio = "";

    itemsParaMostrar.forEach((item) => {
        const [year, month, day] = item.fecha.split("-");
        
        const coincideMes = mesSel === "todos" || mesSel === month;
        const coincideAnio = anioSel === "todos" || anioSel === year;
        const coincideBusqueda = !textoBusqueda || (item.motivo && item.motivo.toLowerCase().includes(textoBusqueda));

        if (coincideMes && coincideAnio && coincideBusqueda) {
            contadorTotalFaltasYFeriados++;
            const mesAnioActual = `${mesesNombres[parseInt(month) - 1]} ${year}`;
            if (mesAnioActual !== ultimoMesAnio) {
                const separator = document.createElement("li");
                separator.classList.add("month-separator");
                separator.innerHTML = `<span>${mesAnioActual}</span>`;
                lista.appendChild(separator);
                ultimoMesAnio = mesAnioActual;
            }

            const li = document.createElement("li");
            li.classList.add(item.esFeriado ? "item-feriado" : "item-falta");
            
            li.innerHTML = `
                <div class="falta-info">
                    <span><i class="fa-solid ${item.esFeriado ? 'fa-calendar-check' : 'fa-calendar-day'}"></i> ${day}/${month}/${year}</span>
                    <span class="falta-motivo">${item.motivo}</span>
                </div>
                ${!item.esFeriado ? `
                <div class="acciones">
                    <button class="btn-editar" data-id="${item.id}" data-motivo="${item.motivo}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-borrar" data-id="${item.id}"><i class="fa-solid fa-trash-can"></i></button>
                </div>` : ''}
            `;
            lista.appendChild(li);
        }
    });
    const txtTotalFaltas = document.getElementById("totalFaltas");
    if (txtTotalFaltas) txtTotalFaltas.textContent = contadorTotalFaltasYFeriados;
    
    calcularPresentismo(mesSel, anioSel);

    if (typeof asignarEventosBorrar === "function") asignarEventosBorrar();
    if (typeof asignarEventosEditar === "function") asignarEventosEditar();
    if (typeof renderizarCalendario === "function") renderizarCalendario();
}

///ALGORITMO DE PRESENTISMO (FERIADOS ARGENTINA 2026)
    const feriadosArgentina2026 = {
        "2026-01-01": "Año Nuevo",
        "2026-02-16": "Carnaval",
        "2026-02-16": "Carnaval",
        "2026-03-23": "Día no laborable con fines turísticos.",
        "2026-03-24": "Día Nacional de la Memoria por la Verdad y la Justicia",
        "2026-04-02": "Día del Veterano y de los Caídos en la Guerra de Malvinas",
        "2026-04-03": "Viernes Santo",
        "2026-05-01": "Día del Trabajador",
        "2026-05-25": "Revolución de Mayo",
        "2026-06-15": "Paso a la Inmortalidad del Gral. Don Martín Miguel de Güemes",
        "2026-06-20": "Día de la Bandera",
        "2026-07-09": "Día de la Independencia",
        "2026-07-10": "Día no laborable con fines turísticos.",
        "2026-08-17": "Paso a la Inmortalidad del Gral. José de San Martín",
        "2026-10-12": "Día de la Diversidad Cultural",
        "2026-11-23": "Día de la Soberanía",
        "2026-12-07": "Día no laborable con fines turísticos.",
        "2026-12-08": "Inmaculada Concepción de María",
        "2026-12-24": "Noche Buena",
        "2026-12-24": "Navidad"
};

function calcularPresentismo(mesFiltro, anioFiltro) {
    const txtPresentismo = document.getElementById("porcentajePresentismo");
    if (!txtPresentismo) return;

    let diasHabilesLectivos = 0;
    
    const fechaInicio = new Date(2026, 2, 2); 
    const fechaFin = new Date(2026, 11, 22); 
    const hoy = new Date();
    const limiteCalculo = hoy < fechaFin ? hoy : fechaFin;

    let iterador = new Date(fechaInicio);
    
    while (iterador <= limiteCalculo) {
        const y = iterador.getFullYear().toString();
        const m = (iterador.getMonth() + 1).toString().padStart(2, '0');
        const d = iterador.getDate().toString().padStart(2, '0');
        const fString = `${y}-${m}-${d}`;

        const cumpleFiltro = (mesFiltro === "todos" || mesFiltro === m) && 
                            (anioFiltro === "todos" || anioFiltro === y);
        if (cumpleFiltro && esDiaLectivo(fString) && !feriadosArgentina2026[fString]) {
            diasHabilesLectivos++;
        }
        iterador.setDate(iterador.getDate() + 1);
    }

    const faltasRealesAlumno = todasLasFaltas.filter(f => {
        const [y, m] = f.fecha.split("-");
        const cumpleFiltros = (mesFiltro === "todos" || mesFiltro === m) && 
                                (anioFiltro === "todos" || anioFiltro === y);

        return cumpleFiltros && f.fecha <= `${hoy.getFullYear()}-${(hoy.getMonth() + 1).toString().padStart(2, '0')}-${hoy.getDate().toString().padStart(2, '0')}`;
    }).length;

    const porcentaje = diasHabilesLectivos === 0 ? 100 : 
                       Math.max(0, Math.round(((diasHabilesLectivos - faltasRealesAlumno) / diasHabilesLectivos) * 100));
    
    txtPresentismo.textContent = `${porcentaje}%`;
}

function asignarEventosBorrar() {
    document.querySelectorAll(".btn-borrar").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const docId = e.currentTarget.closest('.btn-borrar').getAttribute("data-id");

            Swal.fire({
                title: '¿Borrar esta falta?',
                text: "No se puede deshacer.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444', 
                cancelButtonColor: '#334155',
                confirmButtonText: 'Borrar',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    await deleteDoc(doc(db, "faltas", docId));
                    Toast.fire({
                        icon: 'success',
                        title: 'Falta eliminada'
                    });
                }
            });
        });
    });
}

function asignarEventosEditar() {
    document.querySelectorAll(".btn-editar").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const botonActual = e.currentTarget.closest('.btn-editar');
            const docId = botonActual.getAttribute("data-id");
            const motivoActual = botonActual.getAttribute("data-motivo");

            Swal.fire({
                title: 'Editar motivo',
                input: 'text',
                inputValue: motivoActual,
                inputPlaceholder: 'Ej: Turno médico, Enfermedad...',
                showCancelButton: true,
                confirmButtonColor: '#8b5cf6', 
                cancelButtonColor: '#334155',
                confirmButtonText: 'Guardar',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const nuevoMotivo = result.value.trim();
                        const faltaRef = doc(db, "faltas", docId);
                        
                        await updateDoc(faltaRef, {
                            motivo: nuevoMotivo
                        });

                        Toast.fire({
                            icon: 'success',
                            title: 'Motivo actualizado'
                        });
                    } catch (error) {
                        console.error(error);
                        Toast.fire({
                            icon: 'error',
                            title: 'Error al actualizar'
                        });
                    }
                }
            });
        });
    });
    if (filtroMes) filtroMes.addEventListener("change", renderizarLista);
    if (filtroAnio) filtroAnio.addEventListener("change", renderizarLista);
}

    if (busquedaMotivo) {
        busquedaMotivo.addEventListener("input", () => { 
            renderizarLista();
        });
    }
    if (btnBuscarLupa) {
        btnBuscarLupa.addEventListener("click", () => {
        renderizarLista();
        });
    }

if (btnExportar) {
    btnExportar.addEventListener("click", () => {
        if (todasLasFaltas.length === 0) {
            Toast.fire({ icon: 'info', title: 'No hay datos para exportar' });
            return;
        }

        const loadingBar = document.getElementById("loadingBar");
        if (loadingBar) loadingBar.classList.add("active");

        setTimeout(() => {
            const mesSel = filtroMes.value;
            const anioSel = filtroAnio.value;
            const datosParaPDF = [];
            const busquedaInput = document.getElementById("busquedaMotivo");
            const textoBusqueda = busquedaInput ? busquedaInput.value.toLowerCase().trim() : "";
            let itemsParaPDF = [...todasLasFaltas];
            const hoyObj = new Date();
            const hoyString = `${hoyObj.getFullYear()}-${(hoyObj.getMonth() + 1).toString().padStart(2, '0')}-${hoyObj.getDate().toString().padStart(2, '0')}`;

            Object.keys(feriadosArgentina2026).forEach(fechaFeriado => {
                if (fechaFeriado <= hoyString && typeof esDiaLectivo === 'function' && esDiaLectivo(fechaFeriado)) {
                    itemsParaPDF.push({
                        fecha: fechaFeriado,
                        motivo: `Feriado: ${feriadosArgentina2026[fechaFeriado]}`,
                        esFeriado: true
                    });
                }
            });

            const inicioVacPDF = new Date(2026, 6, 20);
            const finVacPDF = new Date(2026, 6, 31);
            let currVacPDF = new Date(inicioVacPDF);
            while (currVacPDF <= finVacPDF) {
                const y = currVacPDF.getFullYear();
                const m = String(currVacPDF.getMonth() + 1).padStart(2, '0');
                const d = String(currVacPDF.getDate()).padStart(2, '0');
                const fechaVacStr = `${y}-${m}-${d}`;
                const diaSemana = currVacPDF.getDay();
                if (diaSemana !== 0 && diaSemana !== 6 && fechaVacStr <= hoyString) {
                    itemsParaPDF.push({
                        fecha: fechaVacStr,
                        motivo: "Vacaciones de invierno",
                        esFeriado: true
                    });
                }
                currVacPDF.setDate(currVacPDF.getDate() + 1);
            }

            itemsParaPDF.sort((a, b) => {
        return ordenDescendente ? b.fecha.localeCompare(a.fecha) : a.fecha.localeCompare(b.fecha);
    });

    const mesesNombres = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    let ultimoMesAnioPDF = "";
    itemsParaPDF.forEach(f => {
        const [y, m, d] = f.fecha.split("-");
        const coincideMes = mesSel === "todos" || mesSel === m;
        const coincideAnio = anioSel === "todos" || anioSel === y;
        const coincideBusqueda = !textoBusqueda || (f.motivo && f.motivo.toLowerCase().includes(textoBusqueda));

        if (coincideMes && coincideAnio && coincideBusqueda) {
            const mesAnioActual = `${mesesNombres[parseInt(m) - 1]} ${y}`;
            if (mesAnioActual !== ultimoMesAnioPDF) {
                datosParaPDF.push([
                    {
                        content: mesAnioActual.toUpperCase(),
                        colSpan: 2,
                        styles: { halign: 'center', fillColor: [248, 250, 252], textColor: [100, 116, 139], fontStyle: 'bold', fontSize: 9 }
                    }
                ]);
                ultimoMesAnioPDF = mesAnioActual;
            }

            const fechaFormateada = `${d}/${m}/${y}`;
            const motivo = f.motivo ? f.motivo : "-";
            if (f.esFeriado) {
                datosParaPDF.push([
                    { content: fechaFormateada, styles: { textColor: [14, 165, 233] } },
                    { content: motivo, styles: { textColor: [14, 165, 233], fontStyle: 'bold' } }
                ]);
            } else {
                datosParaPDF.push([fechaFormateada, motivo]);
            }
        }
    });

            if (datosParaPDF.length === 0) {
                Toast.fire({ icon: 'info', title: 'El filtro actual está vacío' });
                if (loadingBar) loadingBar.classList.remove("active");
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.setTextColor(17, 24, 39); 
            doc.text("Reporte de Asistencia - Cata", 14, 22);
            
            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 116, 139); 
            doc.text("Técnica en Acompañamiento Terapéutico: Nadia Luján Sosa", 14, 32);
            
            const fechaEmision = new Date().toLocaleDateString('es-AR');
            doc.text(`Fecha de emisión del reporte: ${fechaEmision}`, 14, 38);

            if (mesSel !== "todos") {
                const nombreMes = filtroMes.options[filtroMes.selectedIndex].text;
                doc.text(`Período filtrado: ${nombreMes} ${anioSel !== "todos" ? anioSel : ""}`, 14, 44);
            }

            doc.autoTable({
                startY: 52, 
                head: [['Fecha de Ausencia', 'Motivo / Justificación']],
                body: datosParaPDF,
                theme: 'striped',
                headStyles: { 
                    fillColor: [139, 92, 246],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                styles: { 
                    font: 'helvetica',
                    fontSize: 10, 
                    cellPadding: 6 
                },
                columnStyles: {
                    0: { cellWidth: 40 },
                    1: { cellWidth: 'auto' } 
                }
            });

            doc.save(`Reporte_Faltas_Cata_${new Date().getTime()}.pdf`);
            Toast.fire({ icon: 'success', title: 'PDF generado con éxito' });
            
            if (loadingBar) loadingBar.classList.remove("active");
        }, 100);
    });
}

const btnAnotar = document.getElementById("btnAnotar");
if (btnAnotar) {
    btnAnotar.addEventListener("click", async () => {
        const nuevaFecha = fechaInput.value;
        const nuevoMotivo = motivoInput ? motivoInput.value.trim() : "";

        if (!nuevaFecha) {
            Toast.fire({ icon: 'info', title: 'Seleccioná una fecha' });
            return;
        }

        const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });

        if (nuevaFecha > hoy) {
            Toast.fire({
                icon: 'error',
                title: 'Fecha no permitida',
                text: 'No podés seleccionar una fecha superior a la de hoy'
            });
            return;
        }

        if (fechasGuardadas.includes(nuevaFecha)) {
            Toast.fire({ icon: 'warning', title: 'Esa fecha ya está anotada' });
            return;
        }

        const loadingBar = document.getElementById("loadingBar");
        if (loadingBar) loadingBar.classList.add("active");

        try {
            await addDoc(faltasRef, {
                fecha: nuevaFecha,
                motivo: nuevoMotivo
            });
            Toast.fire({ icon: 'success', title: 'Anotado correctamente' });
            if (motivoInput) motivoInput.value = "";
        } catch (error) {
            console.error(error);
            Toast.fire({ icon: 'error', title: 'Error de conexión' });
        } finally {
            if (loadingBar) loadingBar.classList.remove("active");
        }
    });
}

let calMes = new Date().getMonth(); 
let calAnio = new Date().getFullYear();

const btnPrevMonth = document.getElementById("prevMonth");
const btnNextMonth = document.getElementById("nextMonth");

if (btnPrevMonth) {
    btnPrevMonth.addEventListener("click", () => {
        calMes--;
        if (calMes < 0) { calMes = 11; calAnio--; }
        renderizarCalendario();
    });
}

if (btnNextMonth) {
    btnNextMonth.addEventListener("click", () => {
        calMes++;
        if (calMes > 11) { calMes = 0; calAnio++; }
        renderizarCalendario();
    });
}

function renderizarCalendario() {
    const calendarGrid = document.getElementById("calendarGrid");
    const calendarTitle = document.getElementById("calendarTitle");
    if (!calendarGrid || !calendarTitle) return;

    const mesesStr = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    calendarTitle.textContent = `${mesesStr[calMes]} ${calAnio}`;

    const daysToKeep = calendarGrid.querySelectorAll(".day-name");
    calendarGrid.innerHTML = "";
    daysToKeep.forEach(day => calendarGrid.appendChild(day));

    const primerDia = new Date(calAnio, calMes, 1).getDay(); 
    const diasEnMes = new Date(calAnio, calMes + 1, 0).getDate(); 

    for (let i = 0; i < primerDia; i++) {
        const emptyDiv = document.createElement("div");
        emptyDiv.classList.add("calendar-day", "empty");
        calendarGrid.appendChild(emptyDiv);
    }

    // Helper de vacaciones de invierno para el calendario
    const esVacacionesDeInvierno = (fStr) => {
        const [y, m, d] = fStr.split("-").map(Number);
        if (y === 2026 && m === 7 && d >= 20 && d <= 31) {
            const fecha = new Date(y, m - 1, d);
            const diaSemana = fecha.getDay();
            return diaSemana !== 0 && diaSemana !== 6;
        }
        return false;
    };

    // Días reales del mes
    for (let i = 1; i <= diasEnMes; i++) {
        const dayDiv = document.createElement("div");
        dayDiv.classList.add("calendar-day");
        dayDiv.textContent = i;

        const mesStr = (calMes + 1).toString().padStart(2, '0');
        const diaStr = i.toString().padStart(2, '0');
        const fechaCompleta = `${calAnio}-${mesStr}-${diaStr}`;
        const faltaDelDia = todasLasFaltas.find(f => f.fecha === fechaCompleta);
        const nombreFeriado = feriadosArgentina2026[fechaCompleta];
        const esVacaciones = esVacacionesDeInvierno(fechaCompleta);

        let mensajeTooltip = "";

        if (faltaDelDia) {
            dayDiv.classList.add("falta");
            mensajeTooltip = faltaDelDia.motivo || "Inasistencia";
        } else if (nombreFeriado) {
            dayDiv.classList.add("feriado");
            mensajeTooltip = nombreFeriado;
        } else if (esVacaciones) {
            dayDiv.classList.add("feriado");
            mensajeTooltip = "Vacaciones de invierno";
        }
        if (mensajeTooltip !== "") {
            dayDiv.style.cursor = "pointer";

            const tooltip = document.createElement("span");
            tooltip.classList.add("dia-tooltip");
            tooltip.textContent = mensajeTooltip;
            dayDiv.appendChild(tooltip);
            dayDiv.addEventListener("click", (e) => {
                document.querySelectorAll('.calendar-day').forEach(d => {
                    if (d !== dayDiv) d.classList.remove('show-tooltip');
                });
                dayDiv.classList.toggle("show-tooltip");
                e.stopPropagation();
            });
        }

        calendarGrid.appendChild(dayDiv);
    }
}

const btnVerCalendario = document.getElementById("btnVerCalendario");
const calendarModal = document.getElementById("calendarModal");
const closeCalendar = document.getElementById("closeCalendar");

if (btnVerCalendario && calendarModal) {
    btnVerCalendario.addEventListener("click", () => {
        calendarModal.classList.remove("hidden");
        calMes = new Date().getMonth();
        calAnio = new Date().getFullYear();
        renderizarCalendario();
    });
}

if (closeCalendar) {
    closeCalendar.addEventListener("click", () => {
        calendarModal.classList.add("hidden");
    });
}

window.addEventListener("click", (e) => {
    if (e.target === calendarModal) {
        calendarModal.classList.add("hidden");
    }

    document.querySelectorAll('.calendar-day.show-tooltip').forEach(d => {
        if (!d.contains(e.target)) {
            d.classList.remove('show-tooltip');
        }
    });
});

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

const moonIcon = `
<path
d="M21 12.79A9 9 0 1111.21 3
7 7 0 0021 12.79z"
/>
`;

const sunIcon = `
<circle cx="12" cy="12" r="4"></circle>
<line x1="12" y1="2" x2="12" y2="5"></line>
<line x1="12" y1="19" x2="12" y2="22"></line>
<line x1="2" y1="12" x2="5" y2="12"></line>
<line x1="19" y1="12" x2="22" y2="12"></line>
<line x1="4.22" y1="4.22" x2="6.34" y2="6.34"></line>
<line x1="17.66" y1="17.66" x2="19.78" y2="19.78"></line>
<line x1="4.22" y1="19.78" x2="6.34" y2="17.66"></line>
<line x1="17.66" y1="6.34" x2="19.78" y2="4.22"></line>
`;

const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeIcon.innerHTML = sunIcon;
} else {
    themeIcon.innerHTML = moonIcon;
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    const darkMode = document.body.classList.contains("dark");

    themeIcon.style.transform = "rotate(180deg)";

    setTimeout(() => {
        themeIcon.innerHTML = darkMode ? sunIcon : moonIcon;
        themeIcon.style.transform = "rotate(0deg)";
    }, 150);

    localStorage.setItem("theme", darkMode ? "dark" : "light");
});