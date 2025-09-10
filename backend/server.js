const express = require('express');
const path = require('path');
const fs = require('fs').promises; // Usamos la versión de promesas de fs
const app = express();

const dataPath = path.join(__dirname, 'farmacias.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Helper: leer farmacias desde disco
async function readFarmacias() {
  const raw = await fs.readFile(dataPath, 'utf-8');
  return JSON.parse(raw);
}

// Helper: escribir farmacias en disco (ahora asíncrono)
async function writeFarmacias(data) {
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf-8');
}

// GET list
app.get('/farmacias', async (req, res) => {
  try {
    const farmacias = await readFarmacias();
    res.json(farmacias);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error leyendo farmacias' });
  }
});

// POST para crear una nueva farmacia
app.post('/farmacias', async (req, res) => {
  try {
    const farmacias = await readFarmacias();
    const nuevaFarmacia = req.body;

    // Asignar un nuevo ID (el máximo ID existente + 1)
    const nuevoId = farmacias.length ? Math.max(...farmacias.map(f => f.id)) + 1 : 1;
    nuevaFarmacia.id = nuevoId;

    farmacias.push(nuevaFarmacia);
    await writeFarmacias(farmacias);

    res.status(201).json(nuevaFarmacia); // Devolver la farmacia creada con su nuevo ID
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error agregando farmacia' });
  }
});

// PUT para actualizar una farmacia existente por ID
app.put('/farmacias/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const farmaciaActualizada = req.body;
    let farmacias = await readFarmacias();
    const index = farmacias.findIndex(f => f.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'No existe la farmacia' });
    }
    farmacias[index] = { ...farmacias[index], ...farmaciaActualizada, id }; // Mantener el ID original
    await writeFarmacias(farmacias);
    res.json(farmacias[index]); // Devolver la farmacia actualizada
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error actualizando farmacia' });
  }
});

// DELETE por id
app.delete('/farmacias/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    let farmacias = await readFarmacias();
    const before = farmacias.length;
    farmacias = farmacias.filter(f => f.id !== id);
    if (farmacias.length === before) {
      return res.status(404).json({ error: 'No existe la farmacia' });
    }
    await writeFarmacias(farmacias);
    return res.status(204).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error eliminando farmacia' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor iniciado en puerto ${PORT}`));
