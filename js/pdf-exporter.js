export function configurarExportacionPDF(
  obtenerFaltas,
  feriadosArgentina2026,
  esDiaLectivo,
  filtroMes,
  filtroAnio,
  Toast,
) {
  const btnExportar = document.getElementById("btnExportar");
  if (!btnExportar) return;

  btnExportar.addEventListener("click", () => {
    const todasLasFaltas = obtenerFaltas();

    if (todasLasFaltas.length === 0) {
      Toast.fire({ icon: "info", title: "No hay datos para exportar" });
      return;
    }

    const loadingBar = document.getElementById("loadingBar");
    if (loadingBar) loadingBar.classList.add("active");

    setTimeout(() => {
      const mesSel = filtroMes.value;
      const anioSel = filtroAnio.value;
      const datosParaPDF = [];
      const busquedaInput = document.getElementById("busquedaMotivo");
      const textoBusqueda = busquedaInput
        ? busquedaInput.value.toLowerCase().trim()
        : "";
      let itemsParaPDF = [...todasLasFaltas];
      const hoyObj = new Date();
      const hoyString = `${hoyObj.getFullYear()}-${(hoyObj.getMonth() + 1).toString().padStart(2, "0")}-${hoyObj.getDate().toString().padStart(2, "0")}`;

      Object.keys(feriadosArgentina2026).forEach((fechaFeriado) => {
        if (fechaFeriado <= hoyString && esDiaLectivo(fechaFeriado)) {
          itemsParaPDF.push({
            fecha: fechaFeriado,
            motivo: `Feriado: ${feriadosArgentina2026[fechaFeriado]}`,
            esFeriado: true,
          });
        }
      });

      const inicioVacPDF = new Date(2026, 6, 20);
      const finVacPDF = new Date(2026, 6, 31);
      let currVacPDF = new Date(inicioVacPDF);
      while (currVacPDF <= finVacPDF) {
        const y = currVacPDF.getFullYear();
        const m = String(currVacPDF.getMonth() + 1).padStart(2, "0");
        const d = String(currVacPDF.getDate()).padStart(2, "0");
        const fechaVacStr = `${y}-${m}-${d}`;
        const diaSemana = currVacPDF.getDay();
        if (diaSemana !== 0 && diaSemana !== 6 && fechaVacStr <= hoyString) {
          itemsParaPDF.push({
            fecha: fechaVacStr,
            motivo: "Vacaciones de invierno",
            esFeriado: true,
          });
        }
        currVacPDF.setDate(currVacPDF.getDate() + 1);
      }

      itemsParaPDF.sort((a, b) => b.fecha.localeCompare(a.fecha));

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
      let ultimoMesAnioPDF = "";
      itemsParaPDF.forEach((f) => {
        const [y, m, d] = f.fecha.split("-");
        const coincideMes = mesSel === "todos" || mesSel === m;
        const coincideAnio = anioSel === "todos" || anioSel === y;
        const coincideBusqueda =
          !textoBusqueda ||
          (f.motivo && f.motivo.toLowerCase().includes(textoBusqueda));

        if (coincideMes && coincideAnio && coincideBusqueda) {
          const mesAnioActual = `${mesesNombres[parseInt(m) - 1]} ${y}`;
          if (mesAnioActual !== ultimoMesAnioPDF) {
            datosParaPDF.push([
              {
                content: mesAnioActual.toUpperCase(),
                colSpan: 2,
                styles: {
                  halign: "center",
                  fillColor: [248, 250, 252],
                  textColor: [100, 116, 139],
                  fontStyle: "bold",
                  fontSize: 9,
                },
              },
            ]);
            ultimoMesAnioPDF = mesAnioActual;
          }

          const fechaFormateada = `${d}/${m}/${y}`;
          const motivo = f.motivo ? f.motivo : "-";
          if (f.esFeriado) {
            datosParaPDF.push([
              {
                content: fechaFormateada,
                styles: { textColor: [14, 165, 233] },
              },
              {
                content: motivo,
                styles: { textColor: [14, 165, 233], fontStyle: "bold" },
              },
            ]);
          } else {
            datosParaPDF.push([fechaFormateada, motivo]);
          }
        }
      });

      if (datosParaPDF.length === 0) {
        Toast.fire({
          icon: "info",
          title: "No hay datos para exportar en este período",
        });
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
      doc.text(
        "Técnica en Acompañamiento Terapéutico: Nadia Luján Sosa",
        14,
        32,
      );

      const fechaEmision = new Date().toLocaleDateString("es-AR");
      doc.text(`Fecha de emisión del reporte: ${fechaEmision}`, 14, 38);

      if (mesSel !== "todos") {
        const nombreMes = filtroMes.options[filtroMes.selectedIndex].text;
        doc.text(
          `Período filtrado: ${nombreMes} ${anioSel !== "todos" ? anioSel : ""}`,
          14,
          44,
        );
      }

      doc.autoTable({
        startY: 52,
        head: [["Fecha de Ausencia", "Motivo / Justificación"]],
        body: datosParaPDF,
        theme: "striped",
        headStyles: {
          fillColor: [139, 92, 246],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        styles: { font: "helvetica", fontSize: 10, cellPadding: 6 },
        columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: "auto" } },
      });

      let nombreArchivo = "Reporte_Asistencia_Completo";

      if (mesSel !== "todos" || anioSel !== "todos") {
        const nombreMesPDF =
          mesSel !== "todos"
            ? filtroMes.options[filtroMes.selectedIndex].text
            : "Todos_los_meses";
        const nombreAnioPDF = anioSel !== "todos" ? anioSel : "Todos_los_anios";
        nombreArchivo = `Reporte_${nombreMesPDF}_${nombreAnioPDF}`;
      }

      doc.save(`${nombreArchivo}.pdf`);
      Toast.fire({ icon: "success", title: "PDF generado con éxito" });

      if (loadingBar) loadingBar.classList.remove("active");
    }, 100);
  });
}
