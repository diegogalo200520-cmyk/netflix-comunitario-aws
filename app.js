const API_URL = "https://5ylhi77wgl.execute-api.us-east-1.amazonaws.com";
const CLOUDFRONT_URL = "https://d2xiopbjkkrmde.cloudfront.net";

// 1. Escuchar submit
document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById("formularioSubida");
    if (formulario) {
        formulario.addEventListener("submit", subirVideo);
    }
    cargarCatalogo();
});

// 2. Subir video enviando el título en la URL
async function subirVideo(event) {
    if (event) event.preventDefault();

    const fileInput = document.getElementById('archivoVideo');
    const btnSubir = document.getElementById('btnSubir');
    const file = fileInput.files[0];

    if (!file) {
        alert("Por favor selecciona un archivo primero.");
        return;
    }

    btnSubir.innerText = "Obteniendo URL...";
    btnSubir.disabled = true;

    try {
        // Enviar el nombre del archivo codificado en el Query Parameter 'titulo'
        const urlPeticion = `${API_URL}/upload-url?titulo=${encodeURIComponent(file.name)}`;
        
        const response = await fetch(urlPeticion, { method: 'POST' });
        const data = await response.json();

        if (!data.uploadUrl) {
            throw new Error("No se pudo obtener la URL de subida.");
        }

        btnSubir.innerText = "Subiendo a S3...";

        // Subida directa a S3
        const uploadResponse = await fetch(data.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'video/mp4' },
            body: file
        });

        if (uploadResponse.ok) {
            alert("¡Video subido con éxito!");
            fileInput.value = "";
            setTimeout(cargarCatalogo, 1000);
        } else {
            throw new Error("Error al subir el archivo a S3.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error en el proceso de subida.");
    } finally {
        btnSubir.innerText = "Enviar a la Nube";
        btnSubir.disabled = false;
    }
}

// 3. Cargar catálogo mostrando el título de DynamoDB
async function cargarCatalogo() {
    const contenedor = document.getElementById('listaVideos');
    if (!contenedor) return;

    try {
        const res = await fetch(`${API_URL}/videos`);
        const videos = await res.json();

        contenedor.innerHTML = "";

        if (!videos || videos.length === 0) {
            contenedor.innerHTML = "<p>No hay videos disponibles.</p>";
            return;
        }

        videos.forEach(video => {
            const keyS3 = video.nombreArchivo || video.key || video.Key || video.filename;
            
            // Prioriza el título guardado en DynamoDB; si no existe, usa la Key de S3
            const tituloMostrar = video.titulo || keyS3;
            const urlCloudFront = `${CLOUDFRONT_URL}/${keyS3}`;

            const card = document.createElement('div');
            
            card.style.display = "flex";
            card.style.justifyContent = "space-between";
            card.style.alignItems = "center";
            card.style.backgroundColor = "#2b2b2b";
            card.style.padding = "12px 16px";
            card.style.borderRadius = "6px";
            card.style.marginTop = "10px";
            card.style.border = "1px solid #3d3d3d";

            card.innerHTML = `
                <h3 style="margin: 0; font-size: 1rem; color: #ffffff; word-break: break-all;">${tituloMostrar}</h3>
                <button onclick="reproducirVideo('${urlCloudFront}')" style="background-color: #e50914; color: #ffffff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; white-space: nowrap; margin-left: 10px;">▶ Ver Video</button>
            `;
            contenedor.appendChild(card);
        });
    } catch (error) {
        console.error("Error cargando catálogo:", error);
    }
}

// 4. Reproducir video
function reproducirVideo(url) {
    const reproductor = document.getElementById('reproductorPrincipal');
    if (reproductor) {
        reproductor.src = url;
        reproductor.play().catch(err => console.log("Inicia la reproducción manual:", err));
    }
}
