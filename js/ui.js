import { feriadosArgentina2026, esDiaLectivo, calcularPresentismo } from "./feriados.js";
import { iniciarCalendario } from "./calendario.js";

export function renderizarInterfaz(todasLasFaltas, filtroMes, filtroAnio, busquedaMotivo) {
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
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
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

      const badgeEditado = item.editado
        ? `<span class="badge-editado" title="Modificado el ${item.fechaEdicion}"><i class="fa-solid fa-pencil"></i> Editado</span>`
        : "";

      li.innerHTML = `
                <div class="falta-info">
                    <span><i class="fa-solid ${item.esFeriado ? "fa-calendar-check" : "fa-calendar-day"}"></i> ${day}/${month}/${year}</span>
                    <span class="falta-motivo">${item.motivo} ${badgeEditado}</span>
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
  iniciarCalendario(todasLasFaltas, feriadosArgentina2026);
}