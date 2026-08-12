const API_URL = "https://5ylhi77wgl.execute-api.us-east-1.amazonaws.com";
const CLOUDFRONT_URL = "https://d2xiopbjkkrmde.cloudfront.net";

// 1. Helper para obtener el Token JWT del almacenamiento local
function getAuthToken() {
    return localStorage.getItem('jwtToken');
}

// 2. Cierre de sesión
function cerrarSesion() {
    localStorage.removeItem('jwtToken');
    window.location.href = "login.html";
}

// 3. Inicialización y validación de sesión
document.addEventListener("DOMContentLoaded", () => {
    const token = getAuthToken();

    // Si no hay token activo, forzar login
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // Vincular evento de subida si existe el formulario
    const formulario = document.getElementById("formularioSubida");
    if (formulario) {
        formulario.addEventListener("submit", subirVideo);
    }

    // Vincular botón de cerrar sesión si existe en el HTML
    const btnLogout = document.getElementById("btnLogout");
    if (btnLogout) {
        btnLogout.addEventListener("click", cerrarSesion);
    }

    // Cargar la lista de videos
    cargarCatalogo();
});

// 4. Subir Video enviando el token JWT a API Gateway
async function subirVideo(event) {
    if (event) event.preventDefault();

    const token = getAuthToken();
    if (!token) {
        alert("Sesión expirada. Inicia sesión nuevamente.");
        window.location.href = "login.html";
        return;
    }

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
        const urlPeticion = `${API_URL}/upload-url?titulo=${encodeURIComponent(file.name)}`;
        
        // Petición a API Gateway con Token JWT
        const response = await fetch(urlPeticion, { 
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            alert("Tu sesión ha expirado. Por favor vuelve a iniciar sesión.");
            cerrarSesion();
            return;
        }

        const data = await response.json();

        // VALIDACIÓN DE ERRORES HTTP (400, 500, etc.)
        if (!response.ok) {
            // Muestra el mensaje enviado desde la Lambda ("Límite alcanzado...")
            throw new Error(data.error || "Ocurrió un error al procesar la solicitud.");
        }

        if (!data.uploadUrl) {
            throw new Error("No se pudo obtener la URL presignada de subida.");
        }

        btnSubir.innerText = "Subiendo a S3...";

        // Subida directa a S3 (esta petición NO lleva header Authorization de Cognito)
        const uploadResponse = await fetch(data.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type || 'video/mp4' },
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
        alert(error.message || "Error en el proceso de subida.");
    } finally {
        btnSubir.innerText = "Enviar a la Nube";
        btnSubir.disabled = false;
    }
}

// 5. Cargar Catálogo enviando el token JWT a API Gateway
async function cargarCatalogo() {
    const contenedor = document.getElementById('listaVideos');
    if (!contenedor) return;

    const token = getAuthToken();

    try {
        const res = await fetch(`${API_URL}/videos`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.status === 401) {
            console.warn("Token no autorizado o expirado.");
            cerrarSesion();
            return;
        }

        const videos = await res.json();
        contenedor.innerHTML = "";

        if (!videos || videos.length === 0) {
            contenedor.innerHTML = "<p style='color: #888;'>No hay videos disponibles en el catálogo.</p>";
            return;
        }

        videos.forEach(video => {
            const keyS3 = video.nombreArchivo || video.key || video.Key || video.filename;
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

// 6. Reproducir Video
function reproducirVideo(url) {
    const reproductor = document.getElementById('reproductorPrincipal');
    if (reproductor) {
        reproductor.src = url;
        reproductor.play().catch(err => console.log("Reproducción manual requerida:", err));
    }
}
