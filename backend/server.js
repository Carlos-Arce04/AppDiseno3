const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Configuración conexión a PostgreSQL (Railway)
const pool = new Pool({
  connectionString: 'postgresql://postgres:CinlcUvwPoXsKyKqsUyaqVNPqXsJbYIZ@shuttle.proxy.rlwy.net:54698/railway',
  ssl: { rejectUnauthorized: false },
});

// Endpoint para obtener datos de la tabla test
app.get('/api/datos', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre FROM test LIMIT 5');
    res.json(result.rows);
  } catch (error) {
    console.error('Error en BD:', error);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en puerto ${PORT}`);
});
