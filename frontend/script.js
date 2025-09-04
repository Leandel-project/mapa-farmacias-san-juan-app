// Inicializa el mapa centrado en San Juan
const map = L.map('map').setView([18.80823, -71.22503], 13);

// Agrega el mapa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Variables de estado
let farmacias = [];    // Lista de farmacias cargadas

// Carga las farmacias desde el backend y las muestra en el mapa
async function cargarFarmacias() {
  const res = await fetch("http://localhost:3000/farmacias");
  farmacias = await res.json();
  mostrarEnMapa();
}

// Muestra todas las farmacias en el mapa
function mostrarEnMapa() {
  farmacias.forEach(f => {
    L.marker(f.coords).addTo(map).bindPopup(f.nombre);
    L.circle(f.coords, { 
      radius: f.radio, 
      color: f.color || "blue",
      fillColor: f.color || "blue",
      fillOpacity: 0.4 
    }).addTo(map);
  });
}

// Muestra el panel con la lista de farmacias
function mostrarLista() {
  const panel = document.getElementById("panel");
  panel.classList.remove("hidden");
  const lista = document.getElementById("listaFarmacias");
  lista.innerHTML = "";
  // Agrega cada farmacia como elemento de la lista
  farmacias.forEach(f => {
    const li = document.createElement("li");
    li.textContent = `${f.nombre} (${f.coords[0]}, ${f.coords[1]})`;
    lista.appendChild(li);
  });
}

// Oculta el panel de la lista de farmacias
function cerrarPanel() {
  document.getElementById("panel").classList.add("hidden");
}

// Carga las farmacias al iniciar la aplicación
cargarFarmacias();
