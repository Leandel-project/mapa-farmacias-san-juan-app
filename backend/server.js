const express = require('express');
const path = require('path');
const app = express();
const farmacias = require('./farmacias.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/farmacias', (req, res) => {
  res.json(farmacias);
});

app.listen(3000, () => console.log('Servidor iniciado en puerto 3000'));