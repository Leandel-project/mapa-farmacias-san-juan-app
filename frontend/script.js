const map = L.map("map").setView([18.805, -71.229], 14);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

let bloqueado = false;
let markers = [];
let farmacias = [];

async function cargarFarmacias() {
  const res = await fetch("http://localhost:3000/farmacias");
  farmacias = await res.json();
  mostrarEnMapa();
}

function mostrarEnMapa() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  farmacias.forEach(f => {
    const marker = L.marker(f.coords).addTo(map).bindPopup(f.nombre);
    const circle = L.circle(f.coords, { radius: f.radio, color: "blue", fillOpacity: 0.1 }).addTo(map);
    markers.push(marker, circle);
  });
}

function mostrarLista() {
  const panel = document.getElementById("panel");
  panel.classList.remove("hidden");
  const lista = document.getElementById("listaFarmacias");
  lista.innerHTML = "";
  farmacias.forEach(f => {
    const li = document.createElement("li");
    li.innerHTML = `${f.nombre} (${f.coords}) <br>
      <button onclick="eliminarFarmacia(${f.id})">🗑️ Eliminar</button>
      <button onclick="editarFarmacia(${f.id})">✏️ Editar</button>`;
    lista.appendChild(li);
  });
}

function cerrarPanel() {
  document.getElementById("panel").classList.add("hidden");
}

async function agregarFarmacia() {
  const nombre = document.getElementById("nuevoNombre").value;
  const lat = parseFloat(document.getElementById("nuevoLat").value);
  const lng = parseFloat(document.getElementById("nuevoLng").value);
  const radio = parseInt(document.getElementById("nuevoRadio").value) || 600;

  await fetch("http://localhost:3000/farmacias", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, coords: [lat, lng], radio })
  });
  cargarFarmacias();
}

async function eliminarFarmacia(id) {
  await fetch(`http://localhost:3000/farmacias/${id}`, { method: "DELETE" });
  cargarFarmacias();
}

async function editarFarmacia(id) {
  const nuevoRadio = prompt("Nuevo radio en metros:");
  if (!nuevoRadio) return;
  await fetch(`http://localhost:3000/farmacias/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ radio: parseInt(nuevoRadio) })
  });
  cargarFarmacias();
}

function centrarSanJuan() {
  map.setView([18.805, -71.229], 14);
}
function toggleBloqueo() {
  bloqueado = !bloqueado;
  if (bloqueado) {
    map.dragging.disable();
    map.scrollWheelZoom.disable();
    alert("Vista bloqueada");
  } else {
    map.dragging.enable();
    map.scrollWheelZoom.enable();
    alert("Vista desbloqueada");
  }
}

cargarFarmacias();
