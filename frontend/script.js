// Variable global para almacenar las farmacias
let farmacias = [];
let capas = {};
const PALETA = ["red", "blue", "green", "purple", "orange", "brown", "teal", "magenta", "cyan", "gold"];

// --- MAPA ---
const map = L.map("map").setView([18.805, -71.229], 14);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

// --- LÍMITES SAN JUAN ---
const boundsSanJuan = L.latLngBounds([18.790, -71.260], [18.820, -71.210]);
let locked = true;

function aplicarBloqueo() {
  if (locked) {
    map.fitBounds(boundsSanJuan);
    map.setMaxBounds(boundsSanJuan);
    map.setMinZoom(13);
    map.setMaxZoom(18);
    document.getElementById("btnBloquear").innerText = "🔒 Bloquear Vista";
  } else {
    map.setMaxBounds(null);
    map.setMinZoom(2);
    map.setMaxZoom(19);
    document.getElementById("btnBloquear").innerText = "🔓 Desbloquear Vista";
  }
}
function toggleBloqueo() { locked = !locked; aplicarBloqueo(); }
map.on("drag", () => { if (locked) map.panInsideBounds(boundsSanJuan, { animate: false }); });
aplicarBloqueo();

// --- CARGAR Y MOSTRAR FARMACIAS ---
async function cargarFarmacias() {
  try {
    const response = await fetch('http://localhost:3000/farmacias');
    if (!response.ok) {
      throw new Error('No se pudieron obtener los datos del servidor.');
    }
    farmacias = await response.json();
    mostrarFarmacias();
  } catch (error) {
    console.error('Error al cargar las farmacias:', error);
    alert('Error al cargar las farmacias. Asegúrate de que el servidor esté corriendo.');
  }
}

function mostrarFarmacias() {
  Object.values(capas).forEach(c => { map.removeLayer(c.marker); map.removeLayer(c.circle); });
  capas = {};
  farmacias.forEach((f, i) => {
    const color = f.color || PALETA[i % PALETA.length];
    const marker = L.marker(f.coords).addTo(map).bindPopup(`${f.nombre}<br>Lat: ${f.coords[0]}<br>Lng: ${f.coords[1]}`);
    const circle = L.circle(f.coords, { radius: f.radio, color, fillOpacity: 0.1 }).addTo(map);
    capas[f.nombre] = { marker, circle };
  });
  actualizarLista();
}

// --- PANEL Y EVENTOS ---
function actualizarLista() {
  const lista = document.getElementById("listaFarmacias");
  lista.innerHTML = "";
  farmacias.forEach((f) => {
    const li = document.createElement("li");
    li.className = "farmacia-item";
    li.dataset.id = f.id;
    li.innerHTML = `
      <b>${f.nombre}</b><br>
      Lat: ${f.coords[0]}, Lng: ${f.coords[1]}<br>
      Radio: ${f.radio} m
      <br>
      <button class="eliminar-btn">Eliminar</button>
    `;
    lista.appendChild(li);
  });
}

// Obtiene los nuevos elementos de la ventana modal
const sidebar = document.getElementById("sidebar");
const modalWindow = document.getElementById("modal-window");
const modalBackdrop = document.getElementById("modal-backdrop");
const closeModalBtn = document.querySelector(".close-btn");

// Muestra/oculta el menú lateral
document.getElementById("toggleSidebar").addEventListener('click', () => {
    sidebar.classList.toggle("hidden");
});

// Muestra la ventana modal
document.getElementById("btnLista").addEventListener('click', () => {
  modalWindow.classList.remove("hidden");
  modalBackdrop.classList.remove("hidden");
});

// Oculta la ventana modal
closeModalBtn.addEventListener('click', () => {
  modalWindow.classList.add("hidden");
  modalBackdrop.classList.add("hidden");
});

modalBackdrop.addEventListener('click', () => {
  modalWindow.classList.add("hidden");
  modalBackdrop.classList.add("hidden");
});

document.getElementById("listaFarmacias").addEventListener('click', async (e) => {
  if (e.target.classList.contains('eliminar-btn')) {
    const id = e.target.closest('.farmacia-item').dataset.id;
    if (confirm(`¿Estás seguro de que quieres eliminar la farmacia con ID ${id}?`)) {
      await eliminarFarmacia(id);
    }
  }
});

document.getElementById("btnBloquear").addEventListener('click', toggleBloqueo);

document.getElementById("btnZoomIn").addEventListener('click', () => {
  map.zoomIn();
});

document.getElementById("btnZoomOut").addEventListener('click', () => {
  map.zoomOut();
});

async function eliminarFarmacia(id) {
  try {
    const response = await fetch(`http://localhost:3000/farmacias/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Error al eliminar la farmacia.');
    }
    await cargarFarmacias(); // Recarga la lista para reflejar el cambio
  } catch (error) {
    console.error('Error al eliminar:', error);
    alert('Error al eliminar la farmacia.');
  }
}

// Inicializa la aplicación
cargarFarmacias();