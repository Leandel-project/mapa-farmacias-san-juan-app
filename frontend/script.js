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

    // Checkbox para mostrar/ocultar en mapa
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !f.oculto;
    checkbox.addEventListener('change', () => {
      f.oculto = !checkbox.checked;
      mostrarFarmacias();
    });

    const label = document.createElement('label');
    label.innerHTML = `<b>${f.nombre}</b><br>
      Lat: ${f.coords[0]}, Lng: ${f.coords[1]}<br>
      Radio: ${f.radio} m`;

    const editBtn = document.createElement('button');
    editBtn.textContent = "Editar";
    editBtn.className = "editar-btn";
    editBtn.addEventListener('click', () => {
      abrirFormularioEdicion(f);
    });

    const delBtn = document.createElement('button');
    delBtn.textContent = "Eliminar";
    delBtn.className = "eliminar-btn";
    delBtn.addEventListener('click', async () => {
      if (confirm(`¿Eliminar farmacia "${f.nombre}"?`)) {
        await eliminarFarmacia(f.id);
      }
    });

    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(editBtn);
    li.appendChild(delBtn);

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
})

// Abrir formulario en modo edición
function abrirFormularioEdicion(f) {
  document.getElementById("farmaciaId").value = f.id;
  document.getElementById("farmaciaNombre").value = f.nombre;
  document.getElementById("farmaciaLat").value = f.coords[0];
  document.getElementById("farmaciaLng").value = f.coords[1];
  document.getElementById("farmaciaRadio").value = f.radio;
  document.getElementById("farmaciaColor").value = f.color;
}

// Guardar (agregar o editar)
document.getElementById("farmaciaForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("farmaciaId").value;
  const nombre = document.getElementById("farmaciaNombre").value;
  const lat = parseFloat(document.getElementById("farmaciaLat").value);
  const lng = parseFloat(document.getElementById("farmaciaLng").value);
  const radio = parseInt(document.getElementById("farmaciaRadio").value);
  const color = document.getElementById("farmaciaColor").value;

  if (id) {
    // EDITAR en memoria
    const idx = farmacias.findIndex(f => f.id == id);
    if (idx !== -1) {
      farmacias[idx] = { ...farmacias[idx], nombre, coords:[lat,lng], radio, color };
    }
  } else {
    // AGREGAR nueva
    const nuevoId = farmacias.length ? Math.max(...farmacias.map(f => f.id)) + 1 : 1;
    farmacias.push({ id: nuevoId, nombre, coords:[lat,lng], radio, color });
  }

  mostrarFarmacias();
  actualizarLista();

  // limpiar form
  e.target.reset();
  document.getElementById("farmaciaId").value = "";
})

// Toggle del sidebar (botón hamburguesa)
document.addEventListener('DOMContentLoaded', () => {
  const toggleSidebar = document.getElementById('toggleSidebar');
  const sidebar = document.getElementById('sidebar');

  toggleSidebar.addEventListener('click', () => {
    sidebar.classList.toggle('hidden'); // oculta / muestra el sidebar
  });
})

// Coordenadas de San Juan de la Maguana
const sanJuan = [18.8059, -71.2299];
let bloqueado = false; // estado del mapa

const btnBloquear = document.getElementById('btnBloquear');

btnBloquear.addEventListener('click', () => {
  if (!bloqueado) {
    // BLOQUEAR: centrar en San Juan y limitar límites del mapa
    map.setView(sanJuan, 14);

    // Limites aproximados de San Juan
    const bounds = L.latLngBounds(
      [18.78, -71.27], // suroeste
      [18.83, -71.19]  // noreste
    );
    map.setMaxBounds(bounds);

    // Limitar zoom máximo y mínimo si quieres
    map.setMinZoom(13); // no alejarse demasiado
    map.setMaxZoom(19); // máximo acercamiento permitido

    btnBloquear.textContent = "🔓 Desbloquear Vista";
    bloqueado = true;
  } else {
    // DESBLOQUEAR: quitar límites, mantener control completo
    map.setMaxBounds(null);
    map.setMinZoom(0);
    map.setMaxZoom(19);

    btnBloquear.textContent = "🔒 Bloquear Vista";
    bloqueado = false;
  }
});

// Botón buscar farmacia
document.getElementById('btnBuscar').addEventListener('click', () => {
  const nombre = document.getElementById('search').value.trim().toLowerCase();
  const farmacia = farmacias.find(f => f.nombre.toLowerCase().includes(nombre));

  if (!farmacia) {
    alert("No se encontró la farmacia");
    return;
  }

  // Si el mapa está bloqueado temporalmente quitamos límites
  if (bloqueado) map.setMaxBounds(null);

  // Centramos y hacemos zoom
  map.setView(farmacia.coords, 16, { animate: true });

  // Abrimos el popup del marker
  const capa = capas[farmacia.id];
  if (capa && capa.marker) {
    capa.marker.openPopup();
  }

  // Restauramos límites si estaba bloqueado
  if (bloqueado) map.setMaxBounds(sanJuanBounds);
});

// Inicializar carga
cargarFarmacias();

