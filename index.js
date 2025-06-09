const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

app.get('/productos/filtrar', async (req, res) => {
  const { tipo_prenda } = req.query;

  try {
    const result = await pool.query(
      `SELECT talla, color, precio_50_u, precio_100_u, precio_200_u, categoria, descripcion
       FROM productos
       WHERE unaccent(lower(tipo_prenda)) = unaccent(lower($1))`,
      [tipo_prenda]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/stock', async (req, res) => {
  const { tipo_prenda, talla, color } = req.query;

  try {
    const result = await pool.query(
      `SELECT cantidad_disponible
       FROM productos
       WHERE unaccent(lower(tipo_prenda)) = unaccent(lower($1))
         AND unaccent(lower(talla)) = unaccent(lower($2))
         AND unaccent(lower(color)) = unaccent(lower($3))`,
      [tipo_prenda, talla, color]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/productos/search', async (req, res) => {
  const { tipo_prenda, talla, color } = req.body;

  try {
    const result = await pool.query(
      `SELECT * FROM productos 
       WHERE unaccent(tipo_prenda) ILIKE unaccent($1)
         AND unaccent(talla) ILIKE unaccent($2)
         AND unaccent(color) ILIKE unaccent($3)`,
      [tipo_prenda, talla, color]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar productos' });
  }
});

app.post('/pedidos', async (req, res) => {
  const { tipo_prenda, talla, color, cantidad } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO pedidos (tipo_prenda, talla, color, cantidad) VALUES ($1, $2, $3, $4) RETURNING *',
      [tipo_prenda, talla, color, cantidad]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear pedido:', error);
    res.status(500).json({ error: 'Error al crear pedido' });
  }
});

app.get('/pedidos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM pedidos WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/pedidos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pedidos');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

app.delete('/pedidos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM pedidos WHERE id = $1', [id]);
    res.json({ mensaje: `Pedido ${id} eliminado correctamente` });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el pedido' });
  }
});

app.put('/editar-pedido/:id', async (req, res) => {
  const { id } = req.params;
  const { tipo_prenda, talla, color, cantidad } = req.body;
  const pedido = await pool.query('SELECT * FROM pedidos WHERE id = $1', [id]);

if (!pedido.rows.length) {
  return res.status(404).json({ error: 'Pedido no encontrado' });
}

const fechaCreacion = new Date(pedido.rows[0].fecha);
const ahora = new Date();
const diferenciaMinutos = (ahora - fechaCreacion) / 60000;

if (diferenciaMinutos > 5) {
  return res.status(403).json({ error: 'El pedido solo puede editarse dentro de los primeros 5 minutos.' });
}

  try {
    const result = await pool.query(
      `UPDATE pedidos 
       SET tipo_prenda = $1, talla = $2, color = $3, cantidad = $4 
       WHERE id = $5 
       RETURNING *`,
      [tipo_prenda, talla, color, cantidad, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    res.status(500).json({ error: 'Error al actualizar pedido' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
