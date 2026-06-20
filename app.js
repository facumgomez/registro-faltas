import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
    background: 'var(--card)',
    color: 'var(--text)',
    customClass: {
        popup: 'swal2-toast-custom'
    }
});

let todasLasFaltas = []; // Guarda todo lo que viene de Firebase
let fechasGuardadas = []; // Se usa para validar duplicados

const fechaInput = document.getElementById("fechaInput");
const filtroMes = document.getElementById("filtroMes");
const filtroAnio = document.getElementById("filtroAnio");
const btnExportar = document.getElementById("btnExportar");
const emptyState = document.getElementById("emptyState");

// INICIALIZAR FECHA
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
        todasLasFaltas.push({ id: docSnap.id, fecha: data.fecha });
        fechasGuardadas.push(data.fecha);
    });

    renderizarLista();
});

function renderizarLista() {
    const lista = document.getElementById("listaFaltas");
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
                <span>📅 ${day}/${month}/${year}</span>
                <button class="btn-borrar" data-id="${falta.id}">
                    X
                </button>
            `;
            lista.appendChild(li);
        }
    });

    document.getElementById("totalFaltas").textContent = contador;

    if (emptyState) {
        if (contador === 0) {
            emptyState.classList.remove("hidden");
        } else {
            emptyState.classList.add("hidden");
        }
    }

    asignarEventosBorrar();
}

function asignarEventosBorrar() {
    document.querySelectorAll(".btn-borrar").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const docId = e.currentTarget.getAttribute("data-id");

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

if (filtroMes) filtroMes.addEventListener("change", renderizarLista);
if (filtroAnio) filtroAnio.addEventListener("change", renderizarLista);

if (btnExportar) {
    btnExportar.addEventListener("click", () => {
        if (todasLasFaltas.length === 0) {
            Toast.fire({ icon: 'info', title: 'No hay datos para exportar' });
            return;
        }

        let csv = "Fecha\n";
        const mesSel = filtroMes.value;
        const anioSel = filtroAnio.value;
        let hayDatosFiltrados = false;

        todasLasFaltas.forEach(f => {
            const [y, m, d] = f.fecha.split("-");
            const coincideMes = mesSel === "todos" || mesSel === m;
            const coincideAnio = anioSel === "todos" || anioSel === y;

            if (coincideMes && coincideAnio) {
                csv += `${d}/${m}/${y}\n`;
                hayDatosFiltrados = true;
            }
        });

        if (!hayDatosFiltrados) {
             Toast.fire({ icon: 'info', title: 'El filtro actual está vacío' });
             return;
        }

        // Crear y descargar archivo
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `faltas_cata_${new Date().getFullYear()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

// BOTÓN ANOTAR
const btnAnotar = document.getElementById("btnAnotar");
if (btnAnotar) {
    btnAnotar.addEventListener("click", async () => {
        const nuevaFecha = fechaInput.value;

        if (!nuevaFecha) {
            Toast.fire({
                icon: 'info',
                title: 'Seleccioná una fecha'
            });
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
            Toast.fire({
                icon: 'warning',
                title: 'Esa fecha ya está anotada'
            });
            return;
        }

        try {
            await addDoc(faltasRef, {
                fecha: nuevaFecha
            });

            Toast.fire({
                icon: 'success',
                title: 'Anotado correctamente'
            });

        } catch (error) {
            console.error(error);
            Toast.fire({
                icon: 'error',
                title: 'Error de conexión'
            });
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