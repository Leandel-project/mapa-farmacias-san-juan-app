const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const DATA_FILE = "./farmacias.json";

function getFarmacias() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}
function saveFarmacias(farmacias) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(farmacias, null, 2));
}

app.get("/farmacias", (req, res) => {
  res.json(getFarmacias());
});

app.post("/farmacias", (req, res) => {
  const farmacias = getFarmacias();
  const nueva = { id: Date.now(), ...req.body };
  farmacias.push(nueva);
  saveFarmacias(farmacias);
  res.status(201).json(nueva);
});

app.put("/farmacias/:id", (req, res) => {
  const farmacias = getFarmacias();
  const id = parseInt(req.params.id);
  const index = farmacias.findIndex(f => f.id === id);
  if (index === -1) return res.status(404).json({ error: "No encontrada" });

  farmacias[index] = { ...farmacias[index], ...req.body };
  saveFarmacias(farmacias);
  res.json(farmacias[index]);
});

app.delete("/farmacias/:id", (req, res) => {
  const farmacias = getFarmacias();
  const id = parseInt(req.params.id);
  const filtradas = farmacias.filter(f => f.id !== id);
  saveFarmacias(filtradas);
  res.json({ message: "Eliminada correctamente" });
});

app.listen(PORT, () =>
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`)
);
