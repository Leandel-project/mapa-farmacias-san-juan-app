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
