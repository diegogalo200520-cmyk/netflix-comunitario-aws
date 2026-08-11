// Función para reproducir un video en el reproductor principal
function cargarYReproducir(urlVideo) {
  const reproductor = document.getElementById('reproductorPrincipal');
  if (reproductor) {
    reproductor.src = urlVideo;
    reproductor.load();
    reproductor.play().catch(error => {
      console.log("Autoplay bloqueado o interactuar primero:", error);
    });
  }
}

// Manejo de la subida local de videos en MP4
document.addEventListener('DOMContentLoaded', () => {
  const formulario = document.getElementById('formularioSubida');
  const inputArchivo = document.getElementById('archivoVideo');
  const listaVideos = document.getElementById('listaVideos');

  if (formulario) {
    formulario.addEventListener('submit', (e) => {
      e.preventDefault();

      if (inputArchivo.files && inputArchivo.files[0]) {
        const archivo = inputArchivo.files[0];
        // Crear una URL local para el archivo MP4 seleccionado
        const urlObjeto = URL.createObjectURL(archivo);

        // Crear una nueva tarjeta en la lista
        const nuevaTarjeta = document.createElement('div');
        nuevaTarjeta.className = 'tarjeta-video';
        nuevaTarjeta.style.cssText = 'padding: 15px; background: #222; border-radius: 8px; margin-top: 10px;';
        
        nuevaTarjeta.innerHTML = `
          <p><strong>${archivo.name}</strong></p>
          <button type="button">▶ Ver Video</button>
        `;

        // Asignar evento al botón de la nueva tarjeta
        const botonVer = nuevaTarjeta.querySelector('button');
        botonVer.addEventListener('click', () => {
          cargarYReproducir(urlObjeto);
        });

        // Agregar a la lista y reproducir directamente
        listaVideos.appendChild(nuevaTarjeta);
        cargarYReproducir(urlObjeto);

        alert(`¡Video "${archivo.name}" cargado exitosamente en el catálogo!`);
        formulario.reset();
      }
    });
  }
});