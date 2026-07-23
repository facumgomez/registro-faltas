export function iniciarCalendario(todasLasFaltas, feriadosArgentina2026) {
  let calMes = new Date().getMonth();
  let calAnio = new Date().getFullYear();

  const calendarGrid = document.getElementById("calendarGrid");
  const calendarTitle = document.getElementById("calendarTitle");
  const btnPrevMonth = document.getElementById("prevMonth");
  const btnNextMonth = document.getElementById("nextMonth");

  if (!calendarGrid || !calendarTitle) return;

  function renderizarCalendario() {
    const mesesStr = [
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
    calendarTitle.textContent = `${mesesStr[calMes]} ${calAnio}`;

    const daysToKeep = calendarGrid.querySelectorAll(".day-name");
    calendarGrid.innerHTML = "";
    daysToKeep.forEach((day) => calendarGrid.appendChild(day));

    const primerDia = new Date(calAnio, calMes, 1).getDay();
    const diasEnMes = new Date(calAnio, calMes + 1, 0).getDate();

    for (let i = 0; i < primerDia; i++) {
      const emptyDiv = document.createElement("div");
      emptyDiv.classList.add("calendar-day", "empty");
      calendarGrid.appendChild(emptyDiv);
    }

    const esVacacionesDeInvierno = (fStr) => {
      const [y, m, d] = fStr.split("-").map(Number);
      if (y === 2026 && m === 7 && d >= 20 && d <= 31) {
        const fecha = new Date(y, m - 1, d);
        const diaSemana = fecha.getDay();
        return diaSemana !== 0 && diaSemana !== 6;
      }
      return false;
    };

    for (let i = 1; i <= diasEnMes; i++) {
      const dayDiv = document.createElement("div");
      dayDiv.classList.add("calendar-day");
      dayDiv.textContent = i;

      const mesStr = (calMes + 1).toString().padStart(2, "0");
      const diaStr = i.toString().padStart(2, "0");
      const fechaCompleta = `${calAnio}-${mesStr}-${diaStr}`;
      const faltaDelDia = todasLasFaltas.find((f) => f.fecha === fechaCompleta);
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
          document.querySelectorAll(".calendar-day").forEach((d) => {
            if (d !== dayDiv) d.classList.remove("show-tooltip");
          });
          dayDiv.classList.toggle("show-tooltip");
          e.stopPropagation();
        });
      }

      calendarGrid.appendChild(dayDiv);
    }
  }

  if (btnPrevMonth && !btnPrevMonth.dataset.listener) {
    btnPrevMonth.dataset.listener = "true";
    btnPrevMonth.addEventListener("click", () => {
      calMes--;
      if (calMes < 0) {
        calMes = 11;
        calAnio--;
      }
      renderizarCalendario();
    });
  }

  if (btnNextMonth && !btnNextMonth.dataset.listener) {
    btnNextMonth.dataset.listener = "true";
    btnNextMonth.addEventListener("click", () => {
      calMes++;
      if (calMes > 11) {
        calMes = 0;
        calAnio++;
      }
      renderizarCalendario();
    });
  }

  renderizarCalendario();
}
