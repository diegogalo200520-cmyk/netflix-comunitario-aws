// Identificador único simulado del usuario de la sesión actual
const ID_USUARIO_ACTUAL = "usuario_sesion_local";

// Función para cargar y reproducir el video MP4 seleccionado
function cargarYReproducir(urlVideo) {
  const reproductor = document.getElementById('reproductorPrincipal');
  if (reproductor) {
    reproductor.pause();
    reproductor.removeAttribute('src');
    reproductor.src = urlVideo;
    reproductor.load();
    reproductor.play().catch(error => {
      console.log("Presiona el botón de Play en el reproductor para iniciar la reproducción:", error);
    });
  }
}

// Función para eliminar únicamente si el usuario es el propietario del video
function eliminarVideoPropio(elementoBoton, IDPropietario) {
  if (IDPropietario !== ID_USUARIO_ACTUAL) {
    alert("⛔ Acceso denegado: Solo el propietario que subió este video tiene permisos para eliminarlo.");
    return;
  }

  const confirmacion = confirm("¿Estás seguro de que deseas eliminar este video de tu catálogo?");
  if (confirmacion) {
    const tarjeta = elementoBoton.closest('.tarjeta-video');
    if (tarjeta) {
      tarjeta.remove();
      alert("✅ El video ha sido eliminado de tu catálogo.");
    }
  }
}

// Inicialización de la interfaz y control de subida de archivos MP4
document.addEventListener('DOMContentLoaded', () => {
  const formulario = document.getElementById('formularioSubida');
  const inputArchivo = document.getElementById('archivoVideo');
  const listaVideos = document.getElementById('listaVideos');

  if (formulario) {
    formulario.addEventListener('submit', (e) => {
      e.preventDefault();

      if (inputArchivo.files && inputArchivo.files[0]) {
        const archivo = inputArchivo.files[0];

        // Validar extensión explícitamente a formato .mp4
        if (!archivo.name.toLowerCase().endsWith('.mp4')) {
          alert("Por favor selecciona un archivo en formato .mp4 válido.");
          return;
        }

        // Crear una URL local temporal para la sesión
        const urlObjeto = URL.createObjectURL(archivo);

        // Crear la tarjeta interactiva para el video subido
        const nuevaTarjeta = document.createElement('div');
        nuevaTarjeta.className = 'tarjeta-video';
        nuevaTarjeta.dataset.propietario = ID_USUARIO_ACTUAL;

        nuevaTarjeta.innerHTML = `
          <div class="info-video">
            <p><strong>${archivo.name}</strong></p>
            <p class="etiqueta-propietario">Propietario: Tú (Sesión activa)</p>
          </div>
          <div class="acciones-video">
            <button type="button" class="btn-ver">▶ Ver Video</button>
            <button type="button" class="btn-eliminar">🗑️ Eliminar</button>
          </div>
        `;

        // Evento para reproducir el video en pantalla grande
        nuevaTarjeta.querySelector('.btn-ver').addEventListener('click', () => {
          cargarYReproducir(urlObjeto);
        });

        // Evento con control de permisos para eliminar el video
        nuevaTarjeta.querySelector('.btn-eliminar').addEventListener('click', (e) => {
          eliminarVideoPropio(e.target, nuevaTarjeta.dataset.propietario);
        });

        // Insertar tarjeta en la lista y reproducir automáticamente
        listaVideos.appendChild(nuevaTarjeta);
        cargarYReproducir(urlObjeto);

        alert(`¡El video "${archivo.name}" se subió y guardó correctamente en el catálogo!`);
        formulario.reset();
      }
    });
  }
});