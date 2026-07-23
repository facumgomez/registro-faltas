import { db, faltasRef } from "./firebase-config.js";
import {
  feriadosArgentina2026,
  esDiaLectivo,
  calcularPresentismo,
  esDiaValidoParaFaltar,
} from "./feriados.js";
import { iniciarCalendario } from "./calendario.js";
import { configurarExportacionPDF } from "./pdf-exporter.js";
import {
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  query,
  orderBy,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
  todasLasFaltas,
  feriadosArgentina2026,
  esDiaLectivo,
  filtroMes,
  filtroAnio,
  Toast,
);

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
    });
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
  const textoBusqueda = busquedaMotivo
    ? busquedaMotivo.value.toLowerCase().trim()
    : "";

  const hoyObj = new Date();
  const hoyString = `${hoyObj.getFullYear()}-${(hoyObj.getMonth() + 1).toString().padStart(2, "0")}-${hoyObj.getDate().toString().padStart(2, "0")}`;

  let itemsParaMostrar = [...todasLasFaltas];

  Object.keys(feriadosArgentina2026).forEach((fechaFeriado) => {
    if (fechaFeriado <= hoyString && esDiaLectivo(fechaFeriado)) {
      itemsParaMostrar.push({
        fecha: fechaFeriado,
        motivo: `Feriado: ${feriadosArgentina2026[fechaFeriado]}`,
        esFeriado: true,
        id: `feriado-${fechaFeriado}`,
      });
    }
  });

  const inicioVac = new Date(2026, 6, 20);
  const finVac = new Date(2026, 6, 31);
  let currVac = new Date(inicioVac);
  while (currVac <= finVac) {
    const y = currVac.getFullYear();
    const m = String(currVac.getMonth() + 1).padStart(2, "0");
    const d = String(currVac.getDate()).padStart(2, "0");
    const fechaVacStr = `${y}-${m}-${d}`;
    const diaSemana = currVac.getDay();

    if (diaSemana !== 0 && diaSemana !== 6 && fechaVacStr <= hoyString) {
      itemsParaMostrar.push({
        fecha: fechaVacStr,
        motivo: "Vacaciones de invierno",
        esFeriado: true,
        id: `vacacion-${fechaVacStr}`,
      });
    }
    currVac.setDate(currVac.getDate() + 1);
  }

  itemsParaMostrar.sort((a, b) => b.fecha.localeCompare(a.fecha));

  let contadorTotalFaltasYFeriados = 0;
  const mesesNombres = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  let ultimoMesAnio = "";

  itemsParaMostrar.forEach((item) => {
    const [year, month, day] = item.fecha.split("-");
    const coincideMes = mesSel === "todos" || mesSel === month;
    const coincideAnio = anioSel === "todos" || anioSel === year;
    const coincideBusqueda =
      !textoBusqueda ||
      (item.motivo && item.motivo.toLowerCase().includes(textoBusqueda));

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
                    <span><i class="fa-solid ${item.esFeriado ? "fa-calendar-check" : "fa-calendar-day"}"></i> ${day}/${month}/${year}</span>
                    <span class="falta-motivo">${item.motivo}</span>
                </div>
                ${
                  !item.esFeriado
                    ? `
                <div class="acciones">
                    <button class="btn-editar" data-id="${item.id}" data-motivo="${item.motivo}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-borrar" data-id="${item.id}"><i class="fa-solid fa-trash-can"></i></button>
                </div>`
                    : ""
                }
            `;
      lista.appendChild(li);
    }
  });

  const txtTotalFaltas = document.getElementById("totalFaltas");
  if (txtTotalFaltas) txtTotalFaltas.textContent = contadorTotalFaltasYFeriados;

  const emptyStateElement = document.getElementById("emptyState");

  if (emptyStateElement) {
    if (contadorTotalFaltasYFeriados === 0) {
      emptyStateElement.classList.remove("hidden");
      emptyStateElement.style.display = "flex";

      emptyStateElement.style.flexDirection = "column";
      emptyStateElement.style.alignItems = "center";
      emptyStateElement.style.justifyContent = "center";
      emptyStateElement.style.gap = "15px";
      emptyStateElement.style.padding = "30px 10px";
      emptyStateElement.style.textAlign = "center";

      if (lista) lista.style.display = "none";
    } else {
      emptyStateElement.classList.add("hidden");
      emptyStateElement.style.display = "none";
      if (lista) lista.style.display = "block";
    }
  }

  calcularPresentismo(mesSel, anioSel, todasLasFaltas);
  asignarEventosBorrar();
  asignarEventosEditar();
  iniciarCalendario(todasLasFaltas, feriadosArgentina2026);
}

function asignarEventosBorrar() {
  document.querySelectorAll(".btn-borrar").forEach((btn) => {
    if (btn.dataset.listener) return;
    btn.dataset.listener = "true";
    btn.addEventListener("click", async (e) => {
      const docId = e.currentTarget
        .closest(".btn-borrar")
        .getAttribute("data-id");
      Swal.fire({
        title: "¿Borrar esta falta?",
        text: "No se puede deshacer.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#334155",
        confirmButtonText: "Borrar",
        cancelButtonText: "Cancelar",
      }).then(async (result) => {
        if (result.isConfirmed) {
          await deleteDoc(doc(db, "faltas", docId));
          Toast.fire({ icon: "success", title: "Falta eliminada" });
        }
      });
    });
  });
}

function asignarEventosEditar() {
  document.querySelectorAll(".btn-editar").forEach((btn) => {
    if (btn.dataset.listener) return;
    btn.dataset.listener = "true";
    btn.addEventListener("click", (e) => {
      const botonActual = e.currentTarget.closest(".btn-editar");
      const docId = botonActual.getAttribute("data-id");
      const motivoActual = botonActual.getAttribute("data-motivo");

      Swal.fire({
        title: "Editar motivo",
        input: "text",
        inputValue: motivoActual,
        inputPlaceholder: "Ej: Turno médico, Enfermedad...",
        showCancelButton: true,
        confirmButtonColor: "#8b5cf6",
        cancelButtonColor: "#334155",
        confirmButtonText: "Guardar",
        cancelButtonText: "Cancelar",
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const nuevoMotivo = result.value.trim();
            await updateDoc(doc(db, "faltas", docId), { motivo: nuevoMotivo });
            Toast.fire({ icon: "success", title: "Motivo actualizado" });
          } catch (error) {
            Toast.fire({ icon: "error", title: "Error al actualizar" });
          }
        }
      });
    });
  });
  if (filtroMes && !filtroMes.dataset.listener) {
    filtroMes.dataset.listener = "true";
    filtroMes.addEventListener("change", renderizarLista);
  }
  if (filtroAnio && !filtroAnio.dataset.listener) {
    filtroAnio.dataset.listener = "true";
    filtroAnio.addEventListener("change", renderizarLista);
  }
}

if (busquedaMotivo)
  busquedaMotivo.addEventListener("input", () => renderizarLista());
if (btnBuscarLupa)
  btnBuscarLupa.addEventListener("click", () => renderizarLista());

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
      console.error(error);
      Toast.fire({ icon: "error", title: "Error de conexión" });
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

if (localStorage.getItem("theme") === "dark") {
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
