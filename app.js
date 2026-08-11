// URLs DE LA API Y CLOUDFRONT
const API_URL = "https://5ylhi77wgl.execute-api.us-east-1.amazonaws.com";
const CLOUDFRONT_DOMAIN = "https://d2xiopbjkkrmde.cloudfront.net";

// obtencion de videos reales de DynamoDB
document.addEventListener("DOMContentLoaded", () => {
  cargarCatálogo();

  // Escuchar cuando el usuario sube un archivo
  const formulario = document.getElementById("formularioSubida");
  if (formulario) {
    formulario.addEventListener("submit", gestionarSubida);
  }
});

// 1. OBTENER Y MOSTRAR EL CATÁLOGO DE VIDEOS (GET /videos)
async function cargarCatálogo() {
  try {
    const respuesta = await fetch(`${API_URL}/videos`);
    const videos = await respuesta.json();
    mostrarListaDeVideos(videos);
  } catch (error) {
    console.error("Error al obtener el catálogo:", error);
  }
}

function mostrarListaDeVideos(lista) {
  const contenedor = document.getElementById("listaVideos");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  if (!lista || lista.length === 0) {
    contenedor.innerHTML = "<p style='color: #aaa;'>Aún no hay videos o películas registradas en la plataforma.</p>";
    return;
  }

  lista.forEach(video => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta-video";
    
    // Obtenemos el nombre del archivo o la ruta devuelta por DynamoDB
    const nombreArchivo = video.fileName || video.s3Key || video.videoId;
    const titulo = video.title || video.titulo || nombreArchivo;

    tarjeta.innerHTML = `
      <h3>${titulo}</h3>
      <button onclick="reproducir('${nombreArchivo}')">▶ Ver Video</button>
    `;
    contenedor.appendChild(tarjeta);
  });
}

// 2. REPRODUCIR EL VIDEO DESDE CLOUDFRONT
function reproducir(nombreArchivo) {
  const reproductor = document.getElementById("reproductorPrincipal");
  const fuente = document.getElementById("fuenteVideo");

  if (!reproductor || !fuente) return;

  // Si la ruta ya trae carpeta (ej. hls/video.m3u8) o es directa
  let urlFinal = "";
  if (nombreArchivo.startsWith("http")) {
    urlFinal = nombreArchivo;
  } else {
    urlFinal = `${CLOUDFRONT_DOMAIN}/${nombreArchivo}`;
  }

  fuente.src = urlFinal;
  reproductor.load();
  reproductor.play();
}

// 3. SUBIR ARCHIVO A S3 MEDIANTE URL PRESIGNADA (POST /upload-url)
async function gestionarSubida(evento) {
  evento.preventDefault();

  const inputArchivo = document.getElementById("archivoVideo");
  if (!inputArchivo.files || inputArchivo.files.length === 0) {
    alert("Por favor selecciona un archivo.");
    return;
  }

  const archivo = inputArchivo.files[0];
  const botonSubmit = evento.target.querySelector("button");
  
  try {
    botonSubmit.disabled = true;
    botonSubmit.textContent = "Obteniendo permiso de subida...";

    // Paso A: Solicitar URL presignada a API Gateway
    const resUrl = await fetch(`${API_URL}/upload-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: archivo.name,
        fileType: archivo.type
      })
    });

    const datosSubida = await resUrl.json();
    const uploadUrl = datosSubida.uploadUrl || datosSubida.url;

    botonSubmit.textContent = "Subiendo archivo a AWS...";

    // Paso B: Subir directamente el archivo a S3
    await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": archivo.type },
      body: archivo
    });

    alert("¡Video subido exitosamente a la nube!");
    inputArchivo.value = "";
    
    // Actualizar catálogo
    setTimeout(() => {
      cargarCatálogo();
    }, 2000);

  } catch (error) {
    console.error("Error al subir el video:", error);
    alert("Ocurrió un error al intentar subir el archivo.");
  } finally {
    botonSubmit.disabled = false;
    botonSubmit.textContent = "Subir Película / Video";
  }
}