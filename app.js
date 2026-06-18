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

// ==========================================
// CONFIGURACIÓN DE NOTIFICACIONES SUTILES
// ==========================================
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end', // Aparece arriba a la derecha
    showConfirmButton: false,
    timer: 2500, // Desaparece en 2.5 segundos
    timerProgressBar: true,
    background: 'var(--card)', // Respeta el modo oscuro
    color: 'var(--text)',
    customClass: {
        popup: 'swal2-toast-custom'
    }
});

let fechasGuardadas = [];

const fechaInput = document.getElementById("fechaInput");

if (fechaInput) {
    fechaInput.valueAsDate = new Date();
}

const q = query(faltasRef, orderBy("fecha", "desc"));

onSnapshot(q, (snapshot) => {

    const lista = document.getElementById("listaFaltas");

    if (!lista) return;

    lista.innerHTML = "";

    let contador = 0;
    fechasGuardadas = [];

    snapshot.forEach((docSnap) => {

        const data = docSnap.data();
        const id = docSnap.id;

        fechasGuardadas.push(data.fecha);
        contador++;

        const li = document.createElement("li");

        const [year, month, day] = data.fecha.split("-");

        li.innerHTML = `
            <span>📅 ${day}/${month}/${year}</span>
            <button class="btn-borrar" data-id="${id}">
                X
            </button>
        `;

        lista.appendChild(li);
    });

    document.getElementById("totalFaltas").textContent = contador;

    document.querySelectorAll(".btn-borrar").forEach(btn => {

        btn.addEventListener("click", (e) => {

            const docId = e.currentTarget.getAttribute("data-id");

            // Este es el único que queda en el centro por seguridad
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
                    
                    // Notificación sutil de borrado
                    Toast.fire({
                        icon: 'success',
                        title: 'Falta eliminada'
                    });
                }
            });
        });
    });

});

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

        const hoy = new Date().toISOString().split('T')[0];
        if (nuevaFecha > hoy) {
            Toast.fire({
                icon: 'error',
                title: 'Fecha no permitida, es superior a la actual'
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

    const darkMode =
        document.body.classList.contains("dark");

    themeIcon.style.transform = "rotate(180deg)";

    setTimeout(() => {
        themeIcon.innerHTML =
            darkMode
                ? sunIcon
                : moonIcon;

        themeIcon.style.transform = "rotate(0deg)";
    }, 150);

    localStorage.setItem(
        "theme",
        darkMode ? "dark" : "light"
    );

});