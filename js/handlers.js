import { db } from "./firebase-config.js";
import { doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export function asignarEventosBorrar(Toast) {
  document.querySelectorAll(".btn-borrar").forEach((btn) => {
    if (btn.dataset.listener) return;
    btn.dataset.listener = "true";
    btn.addEventListener("click", async (e) => {
      const botonActual = e.currentTarget.closest(".btn-borrar");
      const docId = botonActual.getAttribute("data-id");
      const liElement = botonActual.closest("li");

      if (liElement) liElement.classList.add("eliminando");

      let cancelado = false;
      Swal.fire({
        title: "Falta eliminada",
        text: "¿Te arrepentiste?",
        icon: "info",
        toast: true,
        position: "top-end",
        showConfirmButton: true,
        confirmButtonText: "Deshacer",
        confirmButtonColor: "#8b5cf6",
        timer: 3500,
        timerProgressBar: true,
        background: "var(--card-bg)",
        color: "var(--text-main)",
        customClass: { popup: "swal2-toast-custom" },
        didOpen: (toast) => {
          toast.addEventListener("mouseenter", Swal.stopTimer);
          toast.addEventListener("mouseleave", Swal.resumeTimer);
        },
      }).then(async (result) => {
        if (result.isConfirmed) {
          cancelado = true;
          if (liElement) liElement.classList.remove("eliminando");
          Toast.fire({ icon: "success", title: "Acción cancelada" });
        }
      });

      setTimeout(async () => {
        if (!cancelado) {
          try {
            await deleteDoc(doc(db, "faltas", docId));
          } catch (error) {
            if (liElement) liElement.classList.remove("eliminando");
            Toast.fire({
              icon: "error",
              title: "Error al eliminar en la nube",
            });
          }
        }
      }, 3500);
    });
  });
}

export function asignarEventosEditar(filtroMes, filtroAnio, renderizarCallback, Toast) {
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
            const fechaHoraActual = new Date().toLocaleString("es-AR", {
              timeZone: "America/Argentina/Buenos_Aires",
              dateStyle: "short",
              timeStyle: "short",
            });
            await updateDoc(doc(db, "faltas", docId), {
              motivo: nuevoMotivo,
              editado: true,
              fechaEdicion: fechaHoraActual,
            });

            Toast.fire({
              icon: "success",
              title: "Motivo actualizado y registrado",
            });
          } catch (error) {
            Toast.fire({ icon: "error", title: "Error al actualizar" });
          }
        }
      });
    });
  });

  if (filtroMes && !filtroMes.dataset.listener) {
    filtroMes.dataset.listener = "true";
    filtroMes.addEventListener("change", renderizarCallback);
  }
  if (filtroAnio && !filtroAnio.dataset.listener) {
    filtroAnio.dataset.listener = "true";
    filtroAnio.addEventListener("change", renderizarCallback);
  }
}