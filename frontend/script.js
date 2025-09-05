// frontend/script.js - versión corregida y compacta

// Paleta por si falta color
const PALETA = ["red","blue","green","purple","orange","brown","teal","magenta","cyan","gold"];

// Inicializar mapa (San Juan de la Maguana aprox.)
const map = L.map("map").setView([18.8059, -71.2299], 14);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

let farmacias = [];
let capas = {}; // guardará { id: { marker, circle } }

// Cargar farmacias (ruta relativa para evitar problemas de host)
async function cargarFarmacias() {
  try {
    const res = await fetch('/farmacias');
    if (!res.ok) throw new Error('Respuesta no OK');
    farmacias = await res.json();
    mostrarFarmacias();
    // Centrar mapa automáticamente en todas las farmacias (si hay)
    if (farmacias.length) {
      const bounds = L.latLngBounds(farmacias.map(f => f.coords));
      map.fitBounds(bounds, { padding: [50,50] });
    }
  } catch (err) {
    console.error('Error cargando farmacias:', err);
    alert('No se pudieron cargar las farmacias. Asegúrate de iniciar el servidor (node backend/server.js).');
  }
}

function mostrarFarmacias() {
  // limpiar capas previas
  Object.values(capas).forEach(c => {
    if (c.marker) map.removeLayer(c.marker);
    if (c.circle) map.removeLayer(c.circle);
  });
  capas = {};

  farmacias.forEach((f, i) => {
    const color = f.color || PALETA[i % PALETA.length];
    const marker = L.marker(f.coords).addTo(map).bindPopup(`<b>${f.nombre}</b><br>Lat: ${f.coords[0]}, Lng: ${f.coords[1]}`);
    const circle = L.circle(f.coords, { radius: f.radio || 200, color, fillOpacity: 0.15 }).addTo(map);
    capas[f.id] = { marker, circle }; // usar id como key para evitar colisiones por nombre
  });

  actualizarLista();
}

function actualizarLista() {
  const lista = document.getElementById("listaFarmacias");
  if (!lista) return;
  lista.innerHTML = "";
  farmacias.forEach(f => {
    const li = document.createElement('li');
    li.className = 'farmacia-item';
    li.dataset.id = f.id;
    li.innerHTML = `
      <b>${f.nombre}</b><br>
      Lat: ${f.coords[0]}, Lng: ${f.coords[1]}<br>
      Radio: ${f.radio} m
      <br><button class="eliminar-btn">Eliminar</button>
    `;
    lista.appendChild(li);
  });
}

// Mostrar / ocultar modal: usar clase 'visible' (CSS ya define .visible {display:block !important;})
function abrirModal() {
  const modal = document.getElementById('modal-window');
  const backdrop = document.getElementById('modal-backdrop');
  if (!modal || !backdrop) return;
  modal.classList.remove('hidden'); modal.classList.add('visible');
  backdrop.classList.remove('hidden'); backdrop.classList.add('visible');
}

function cerrarModal() {
  const modal = document.getElementById('modal-window');
  const backdrop = document.getElementById('modal-backdrop');
  if (!modal || !backdrop) return;
  modal.classList.add('hidden'); modal.classList.remove('visible');
  backdrop.classList.add('hidden'); backdrop.classList.remove('visible');
}

// Eliminar farmacia (usa DELETE a la ruta que añadimos en server.js)
async function eliminarFarmacia(id) {
  try {
    const res = await fetch(`/farmacias/${id}`, { method: 'DELETE' });
    if (res.status === 204) {
      // quitar de la lista local y recargar vista
      farmacias = farmacias.filter(f => f.id != id);
      mostrarFarmacias();
    } else {
      const txt = await res.text();
      throw new Error(txt || 'Error al eliminar');
    }
  } catch (err) {
    console.error(err);
    alert('No se pudo eliminar la farmacia.');
  }
}

// Event listeners DOM-ready
document.addEventListener('DOMContentLoaded', () => {
  // botones UI
  const btnLista = document.getElementById('btnLista');
  const closeBtn = document.querySelector('.close-btn');
  const backdrop = document.getElementById('modal-backdrop');
  const lista = document.getElementById('listaFarmacias');

  if (btnLista) btnLista.addEventListener('click', abrirModal);
  if (closeBtn) closeBtn.addEventListener('click', cerrarModal);
  if (backdrop) backdrop.addEventListener('click', cerrarModal);

  // delegado para boton eliminar dentro de la lista
  if (lista) {
    lista.addEventListener('click', async (e) => {
      if (e.target.classList.contains('eliminar-btn')) {
        const id = e.target.closest('.farmacia-item').dataset.id;
        if (confirm(`¿Eliminar farmacia ID ${id}?`)) {
          await eliminarFarmacia(id);
        }
      }
    });
  }

  // inicializar carga
  cargarFarmacias();
});
