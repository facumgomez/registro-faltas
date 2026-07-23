export const feriadosArgentina2026 = {
  "2026-01-01": "Año Nuevo",
  "2026-02-16": "Carnaval",
  "2026-03-23": "Día no laborable con fines turísticos.",
  "2026-03-24": "Día Nacional de la Memoria",
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
  "2026-12-25": "Navidad",
};

export function esDiaLectivo(fechaString) {
  const partes = fechaString.split("-");
  const fecha = new Date(partes[0], partes[1] - 1, partes[2]);
  const inicioClases = new Date(2026, 2, 2);
  const finClases = new Date(2026, 11, 22);
  const recesoInicio = new Date(2026, 6, 20);
  const recesoFin = new Date(2026, 6, 31);

  if (fecha < inicioClases || fecha > finClases) return false;
  if (fecha >= recesoInicio && fecha <= recesoFin) return false;

  const diaSemana = fecha.getDay();
  if (diaSemana === 0 || diaSemana === 6) return false;
  return true;
}

export function calcularPresentismo(mesFiltro, anioFiltro, todasLasFaltas) {
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
    const m = (iterador.getMonth() + 1).toString().padStart(2, "0");
    const d = iterador.getDate().toString().padStart(2, "0");
    const fString = `${y}-${m}-${d}`;

    const cumpleFiltro =
      (mesFiltro === "todos" || mesFiltro === m) &&
      (anioFiltro === "todos" || anioFiltro === y);
    if (
      cumpleFiltro &&
      esDiaLectivo(fString) &&
      !feriadosArgentina2026[fString]
    ) {
      diasHabilesLectivos++;
    }
    iterador.setDate(iterador.getDate() + 1);
  }

  const faltasRealesAlumno = todasLasFaltas.filter((f) => {
    const [y, m] = f.fecha.split("-");
    const cumpleFiltros =
      (mesFiltro === "todos" || mesFiltro === m) &&
      (anioFiltro === "todos" || anioFiltro === y);
    return (
      cumpleFiltros &&
      f.fecha <=
        `${hoy.getFullYear()}-${(hoy.getMonth() + 1).toString().padStart(2, "0")}-${hoy.getDate().toString().padStart(2, "0")}`
    );
  }).length;

  const porcentaje =
    diasHabilesLectivos === 0
      ? 100
      : Math.max(
          0,
          Math.round(
            ((diasHabilesLectivos - faltasRealesAlumno) / diasHabilesLectivos) *
              100,
          ),
        );
  txtPresentismo.textContent = `${porcentaje}%`;
}

export function esDiaValidoParaFaltar(fechaString, feriadosArgentina2026) {
  if (!esDiaLectivo(fechaString)) return false;
  if (feriadosArgentina2026[fechaString]) return false;

  const [y, m, d] = fechaString.split("-").map(Number);
  if (y === 2026 && m === 7 && d >= 20 && d <= 31) {
    return false; 
  }

  return true;
}
