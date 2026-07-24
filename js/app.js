import { faltasRef } from "./firebase-config.js";
import { feriadosArgentina2026, esDiaValidoParaFaltar } from "./feriados.js";
import { iniciarCalendario } from "./calendario.js";
import { configurarExportacionPDF } from "./pdf-exporter.js";
import { renderizarInterfaz } from "./ui.js";
import { asignarEventosBorrar, asignarEventosEditar } from "./handlers.js";
import { addDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
  background: "var(--card-bg)",
  color: "var(--text-main)",
  customClass: { popup: "swal2-toast-custom" },
});

let todasLasFaltas = [];
let fechasGuardadas = [];

const fechaInput = document.getElementById("fechaInput");
const motivoInput = document.getElementById("motivoInput");
const filtroMes = document.getElementById("filtroMes");
const filtroAnio = document.getElementById("filtroAnio");
const busquedaMotivo = document.getElementById("busquedaMotivo");
const btnBuscarLupa = document.getElementById("btnBuscarLupa");

if (fechaInput) {
  const hoy = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
  fechaInput.value = hoy;
  fechaInput.setAttribute("max", hoy);
}

// Configurar exportación a PDF
configurarExportacionPDF(
  () => todasLasFaltas,
  feriadosArgentina2026,
  (fecha) => {
    const dia = new Date(fecha + "T00:00:00").getDay();
    return dia !== 0 && dia !== 6 && !feriadosArgentina2026[fecha];
  },
  filtroMes,
  filtroAnio,
  Toast,
);

const CACHE_KEY = "faltas_cache_local";
const cacheLocal = localStorage.getItem(CACHE_KEY);
if (cacheLocal) {
  try {
    todasLasFaltas = JSON.parse(cacheLocal);
    fechasGuardadas = todasLasFaltas.map(f => f.fecha);
    renderizarTodo(); 
  } catch (e) {
    console.error("Error al leer la caché local:", e);
  }
}

const q = query(faltasRef, orderBy("fecha", "desc"));
onSnapshot(q, (snapshot) => {
  todasLasFaltas = [];
  fechasGuardadas = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    todasLasFaltas.push({
      id: docSnap.id,
      fecha: data.fecha,
      motivo: data.motivo || "",
      editado: data.editado || false,
      fechaEdicion: data.fechaEdicion || "",
    });
    fechasGuardadas.push(data.fecha);
  });

  localStorage.setItem(CACHE_KEY, JSON.stringify(todasLasFaltas));
  renderizarTodo();
});

function renderizarTodo() {
  renderizarInterfaz(todasLasFaltas, filtroMes, filtroAnio, busquedaMotivo);
  asignarEventosBorrar(Toast);
  asignarEventosEditar(filtroMes, filtroAnio, renderizarTodo, Toast);
}

if (busquedaMotivo)
  busquedaMotivo.addEventListener("input", () => renderizarTodo());
if (btnBuscarLupa)
  btnBuscarLupa.addEventListener("click", () => renderizarTodo());

const btnAnotar = document.getElementById("btnAnotar");
if (btnAnotar) {
  btnAnotar.addEventListener("click", async () => {
    const nuevaFecha = fechaInput.value;
    const nuevoMotivo = motivoInput ? motivoInput.value.trim() : "";

    if (!nuevaFecha) {
      Toast.fire({ icon: "info", title: "Seleccioná una fecha" });
      return;
    }

    const hoy = new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
    });

    if (nuevaFecha > hoy) {
      Toast.fire({
        icon: "error",
        title: "Fecha no permitida",
        text: "No podés seleccionar una fecha superior a la de hoy",
      });
      return;
    }

    if (!esDiaValidoParaFaltar(nuevaFecha, feriadosArgentina2026)) {
      Toast.fire({
        icon: "error",
        title: "Día no laborable / lectivo",
        text: "No se pueden registrar faltas en fines de semana, feriados o vacaciones.",
      });
      return;
    }

    if (fechasGuardadas.includes(nuevaFecha)) {
      Toast.fire({ icon: "warning", title: "Esa fecha ya está anotada" });
      return;
    }

    const loadingBar = document.getElementById("loadingBar");
    if (loadingBar) loadingBar.classList.add("active");

    try {
      await addDoc(faltasRef, {
        fecha: nuevaFecha,
        motivo: nuevoMotivo,
      });
      Toast.fire({ icon: "success", title: "Anotado correctamente" });
      if (motivoInput) motivoInput.value = "";
    } catch (error) {
      console.error("Error al conectar con Firestore:", error);
      Toast.fire({
        icon: "error",
        title: "Error de red",
        text: "No se pudo guardar la falta. Verificá tu conexión a internet.",
      });
    } finally {
      if (loadingBar) loadingBar.classList.remove("active");
    }
  });
}

const btnVerCalendario = document.getElementById("btnVerCalendario");
const calendarModal = document.getElementById("calendarModal");
const closeCalendar = document.getElementById("closeCalendar");

if (btnVerCalendario && calendarModal) {
  btnVerCalendario.addEventListener("click", () => {
    calendarModal.classList.remove("hidden");
    iniciarCalendario(todasLasFaltas, feriadosArgentina2026);
  });
}
if (closeCalendar)
  closeCalendar.addEventListener("click", () =>
    calendarModal.classList.add("hidden"),
  );

window.addEventListener("click", (e) => {
  if (e.target === calendarModal) calendarModal.classList.add("hidden");
});

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const moonIcon = `<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>`;
const sunIcon = `<circle cx="12" cy="12" r="4"></circle><line x1="12" y1="2" x2="12" y2="5"></line><line x1="12" y1="19" x2="12" y2="22"></line><line x1="2" y1="12" x2="5" y2="12"></line><line x1="19" y1="12" x2="22" y2="12"></line><line x1="4.22" y1="4.22" x2="6.34" y2="6.34"></line><line x1="17.66" y1="17.66" x2="19.78" y2="19.78"></line><line x1="4.22" y1="19.78" x2="6.34" y2="17.66"></line><line x1="17.66" y1="6.34" x2="19.78" y2="4.22"></line>`;
const savedTheme = localStorage.getItem("theme");
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
  document.body.classList.add("dark");
  if (themeIcon) themeIcon.innerHTML = sunIcon;
} else {
  document.body.classList.remove("dark");
  if (themeIcon) themeIcon.innerHTML = moonIcon;
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const darkMode = document.body.classList.contains("dark");
    if (themeIcon) {
      themeIcon.style.transform = "rotate(180deg)";
      setTimeout(() => {
        themeIcon.innerHTML = darkMode ? sunIcon : moonIcon;
        themeIcon.style.transform = "rotate(0deg)";
      }, 150);
    }
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  });
}