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
let tempMarker = null; // Para el marcador temporal al hacer clic en el mapa

// Limites aproximados de San Juan para la función de bloquear/buscar
const sanJuanBounds = L.latLngBounds(
  [18.78, -71.27], // suroeste
  [18.83, -71.19]  // noreste
);


// Cargar farmacias (ruta relativa para evitar problemas de host)
async function cargarFarmacias() {
  try {
    const res = await fetch('/farmacias');
    if (!res.ok) throw new Error('Respuesta no OK');
    const farmaciasData = await res.json();
    // Asegurarnos de que todas las farmacias sean visibles al cargar
    farmacias = farmaciasData.map(f => ({ ...f, oculto: false }));

    mostrarFarmacias();
    actualizarLista(); // Generar la lista en el modal
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
    // Si la farmacia está marcada como oculta, no la dibujamos en el mapa.
    if (f.oculto) return;

    const color = f.color || PALETA[i % PALETA.length];
    const marker = L.marker(f.coords).addTo(map).bindPopup(`<b>${f.nombre}</b><br>Lat: ${f.coords[0]}, Lng: ${f.coords[1]}`);
    const circle = L.circle(f.coords, { radius: f.radio || 200, color, fillOpacity: 0.15 }).addTo(map);
    capas[f.id] = { marker, circle }; // usar id como key para evitar colisiones por nombre
  });
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
      mostrarFarmacias(); // Solo redibujamos el mapa, no hace falta recargar la lista.
    });

    const label = document.createElement('label');
    label.innerHTML = `<b>${f.nombre}</b><br>
      Lat: ${f.coords[0]}, Lng: ${f.coords[1]}<br>
      Radio: ${f.radio} m`;

    li.appendChild(checkbox);
    li.appendChild(label);

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
      actualizarLista(); // <-- CORRECCIÓN: Actualiza la lista en el modal
    } else {
      const txt = await res.text();
      throw new Error(txt || 'Error al eliminar');
    }
  } catch (err) {
    console.error(err);
    alert('No se pudo eliminar la farmacia.');
  }
}

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
async function guardarFarmacia(e) {
  e.preventDefault();

  const id = document.getElementById("farmaciaId").value;
  const farmaciaData = {
    nombre: document.getElementById("farmaciaNombre").value,
    coords: [
      parseFloat(document.getElementById("farmaciaLat").value),
      parseFloat(document.getElementById("farmaciaLng").value)
    ],
    radio: parseInt(document.getElementById("farmaciaRadio").value),
    color: document.getElementById("farmaciaColor").value,
  };

  try {
    const esEdicion = !!id;
    const url = esEdicion ? `/farmacias/${id}` : '/farmacias';
    const method = esEdicion ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(farmaciaData),
    });

    if (!res.ok) {
      // El servidor devolvió un error. Intentamos leer el cuerpo para dar más detalles.
      const errorText = await res.text();
      let errorMessage;
      try {
        // El backend debería enviar errores en formato JSON. Intentamos parsearlo.
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || `Error al ${esEdicion ? 'editar' : 'agregar'}`;
      } catch (e) {
        // Si falla el parseo, es porque la respuesta no era JSON (probablemente HTML).
        console.error("La respuesta del servidor no es JSON:", errorText);
        errorMessage = `El servidor devolvió un error inesperado (Status: ${res.status}). Revisa la consola del navegador para más detalles.`;
      }
      throw new Error(errorMessage);
    }

    // Limpiar formulario y recargar todo para reflejar los cambios desde el servidor
    e.target.reset();
    document.getElementById("farmaciaId").value = "";
    
    alert(`Farmacia ${esEdicion ? 'editada' : 'agregada'} con éxito.`);
    await cargarFarmacias(); // Recarga los datos desde el servidor para tener la lista actualizada

  } catch (err) {
    console.error('Error guardando farmacia:', err);
    alert(`No se pudo guardar la farmacia: ${err.message}`);
  }
}

// Event listeners DOM-ready
document.addEventListener('DOMContentLoaded', () => {
  // Botones y modal
  const btnLista = document.getElementById('btnLista');
  const closeBtn = document.querySelector('.close-btn');
  const backdrop = document.getElementById('modal-backdrop');

  if (btnLista) btnLista.addEventListener('click', abrirModal);
  if (closeBtn) closeBtn.addEventListener('click', cerrarModal);
  if (backdrop) backdrop.addEventListener('click', cerrarModal);

  // Botón hamburguesa para el sidebar
  const toggleSidebar = document.getElementById('toggleSidebar');
  const sidebar = document.getElementById('sidebar');
  if (toggleSidebar && sidebar) {
    toggleSidebar.addEventListener('click', () => {
      sidebar.classList.toggle('hidden');
    });
  }

  // Formulario
  document.getElementById("farmaciaForm").addEventListener("submit", guardarFarmacia);

  // inicializar carga
  cargarFarmacias();
});

// Coordenadas de San Juan de la Maguana
const sanJuan = [18.8059, -71.2299];
let bloqueado = false; // estado del mapa

const btnBloquear = document.getElementById('btnBloquear');

btnBloquear.addEventListener('click', () => {
  if (!bloqueado) {
    // BLOQUEAR: centrar en San Juan y limitar límites del mapa
    map.setView(sanJuan, 14);

    map.setMaxBounds(sanJuanBounds);

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

// --- NUEVA FUNCIONALIDAD: Obtener coordenadas al hacer clic en el mapa ---
map.on('click', function(e) {
  // Evita poner un marcador si se hace clic sobre un marcador existente
  if (e.originalEvent.target.classList.contains('leaflet-marker-icon')) {
    return;
  }

  const lat = e.latlng.lat.toFixed(6); // Coordenadas con 6 decimales para precisión
  const lng = e.latlng.lng.toFixed(6);

  // Rellenar automáticamente los campos del formulario en el modal
  document.getElementById("farmaciaLat").value = lat;
  document.getElementById("farmaciaLng").value = lng;

  // Si ya existe un marcador temporal, lo eliminamos
  if (tempMarker) {
    map.removeLayer(tempMarker);
  }

  // Creamos un nuevo marcador temporal en el punto del clic
  tempMarker = L.marker(e.latlng).addTo(map);

  // Mostramos un popup con la información y lo abrimos
  tempMarker.bindPopup(`<b>Coordenadas seleccionadas:</b><br>Lat: ${lat}<br>Lng: ${lng}<br><br><i>Valores copiados al formulario.</i>`).openPopup();

  // Cuando el popup se cierre, eliminamos el marcador temporal
  tempMarker.on('popupclose', () => {
    if (tempMarker) {
      map.removeLayer(tempMarker);
      tempMarker = null;
    }
  });
});
