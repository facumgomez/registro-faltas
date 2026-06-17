
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

let fechasGuardadas = []; 

const fechaInput = document.getElementById('fechaInput');
if (fechaInput) {
    fechaInput.valueAsDate = new Date();
}

const q = query(faltasRef, orderBy("fecha", "desc"));
onSnapshot(q, (snapshot) => {
    const lista = document.getElementById('listaFaltas');
    if (!lista) return;
    
    lista.innerHTML = '';
    let contador = 0;
    fechasGuardadas = []; 

    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const id = docSnap.id;
        
        fechasGuardadas.push(data.fecha); 
        contador++;

        const li = document.createElement('li');
        const [year, month, day] = data.fecha.split('-');
        const fechaFormateada = `${day}/${month}/${year}`;

        li.innerHTML = `
            <span>📅 ${fechaFormateada}</span>
            <button class="btn-borrar" data-id="${id}">X</button>
        `;
        lista.appendChild(li);
    });

    const totalFaltasEl = document.getElementById('totalFaltas');
    if (totalFaltasEl) {
        totalFaltasEl.innerText = contador;
    }

    // Asignar eventos a los botones de borrar recién creados
    document.querySelectorAll('.btn-borrar').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const docId = e.currentTarget.getAttribute('data-id');
            try {
                await deleteDoc(doc(db, "faltas", docId));
            } catch (error) {
                console.error("Error al eliminar el documento:", error);
            }
        });
    });
}, (error) => {
    console.error("Error en la conexión en tiempo real:", error);
});

// Guardar nueva falta con validación
const btnAnotar = document.getElementById('btnAnotar');
if (btnAnotar) {
    btnAnotar.addEventListener('click', async () => {
        const input = document.getElementById('fechaInput');
        if (!input) return;

        const nuevaFecha = input.value;

        if (!nuevaFecha) {
            alert('Por favor seleccioná una fecha.');
            return;
        }

        // Validación para bloquear duplicados
        if (fechasGuardadas.includes(nuevaFecha)) {
            alert('Esa fecha ya está anotada.');
            return;
        }

        try {
            await addDoc(faltasRef, {
                fecha: nuevaFecha
            });
        } catch (error) {
            console.error("Error al escribir en Firestore:", error);
            alert("Error al conectar con la base de datos. Revisá las reglas de Firestore.");
        }
    });
}