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
const btnExportar = document.getElementById("btnExportar");
const emptyState = document.getElementById("emptyState");

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
    let contador = 0;

    const mesSel = filtroMes ? filtroMes.value : "todos";
    const anioSel = filtroAnio ? filtroAnio.value : "todos";

    todasLasFaltas.forEach((falta) => {
        const [year, month, day] = falta.fecha.split("-");

        const coincideMes = mesSel === "todos" || mesSel === month;
        const coincideAnio = anioSel === "todos" || anioSel === year;

        if (coincideMes && coincideAnio) {
            contador++;
            const li = document.createElement("li");
            li.innerHTML = `
                <div class="falta-info">
                    <span><i class="fa-solid fa-calendar-day"></i> ${day}/${month}/${year}</span>
                    ${falta.motivo ? `<span class="falta-motivo">${falta.motivo}</span>` : ""}
                </div>
                <div class="acciones">
                    <button class="btn-editar" data-id="${falta.id}" data-motivo="${falta.motivo}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-borrar" data-id="${falta.id}"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `;
            lista.appendChild(li);
        }
    });

    document.getElementById("totalFaltas").textContent = contador;
    if (emptyState) emptyState.classList.toggle("hidden", contador > 0);

    asignarEventosBorrar();
    asignarEventosEditar();
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
}

if (filtroMes) filtroMes.addEventListener("change", renderizarLista);
if (filtroAnio) filtroAnio.addEventListener("change", renderizarLista);

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

            todasLasFaltas.forEach(f => {
                const [y, m, d] = f.fecha.split("-");
                const coincideMes = mesSel === "todos" || mesSel === m;
                const coincideAnio = anioSel === "todos" || anioSel === y;

                if (coincideMes && coincideAnio) {
                    const fechaFormateada = `${d}/${m}/${y}`;
                    const motivo = f.motivo ? f.motivo : "-";
                    datosParaPDF.push([fechaFormateada, motivo]);
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