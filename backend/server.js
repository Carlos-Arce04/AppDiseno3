// backend/server.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'qwerty12345!@#ASDFGH67890%^&*ZXCVBNM'; // Usa variable de entorno en producción

const pool = new Pool({
  connectionString: 'postgresql://postgres:CinlcUvwPoXsKyKqsUyaqVNPqXsJbYIZ@shuttle.proxy.rlwy.net:54698/railway',
  ssl: { rejectUnauthorized: false },
});

// Middleware para validar token y asignar req.user
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
}

// Registro usuario
app.post('/api/register', async (req, res) => {
  const { cedula, nombre, telefono, correo, contrasena, rol = 'cliente' } = req.body;
  if (!cedula || !nombre || !telefono || !correo || !contrasena) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  if (!['cliente', 'administrador'].includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }
  try {
    const hash = await bcrypt.hash(contrasena, 10);
    const query = `
      INSERT INTO usuarios (cedula, nombre, telefono, correo, contrasena, rol)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING cedula, nombre, correo, rol
    `;
    const values = [cedula, nombre, telefono, correo, hash, rol];
    const result = await pool.query(query, values);
    res.status(201).json({
      mensaje: 'Usuario registrado correctamente',
      usuario: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Cédula o correo ya registrados' });
    }
    if (error.code === '23514') {
      return res.status(400).json({ error: 'Formato inválido en uno de los campos' });
    }
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Login usuario y creación de JWT
app.post('/api/login', async (req, res) => {
  const { cedula, contrasena } = req.body;
  if (!cedula || !contrasena) {
    return res.status(400).json({ error: 'Cédula y contraseña son requeridos' });
  }
  try {
    const query = 'SELECT cedula, nombre, correo, contrasena, rol FROM usuarios WHERE cedula = $1';
    const result = await pool.query(query, [cedula]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Cédula no encontrada' });
    }
    const usuario = result.rows[0];
    const validPassword = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    const { contrasena: _, ...usuarioSinContrasena } = usuario;
    const token = jwt.sign(
      { cedula: usuario.cedula, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({
      mensaje: 'Inicio de sesión exitoso',
      usuario: usuarioSinContrasena,
      token,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Obtener lista de usuarios (solo para admins)
app.get('/api/usuarios', authenticateToken, async (req, res) => {
  try {
    if (req.user.rol !== 'administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const result = await pool.query('SELECT cedula, nombre FROM usuarios ORDER BY nombre ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
});


// GET vehículos
app.get('/api/vehiculos', authenticateToken, async (req, res) => {
  try {
    const { rol, cedula } = req.user;
    let query, params;
    if (rol === 'administrador') {
      query = 'SELECT * FROM vehiculos ORDER BY fecha_registro DESC';
      params = [];
    } else {
      query = 'SELECT * FROM vehiculos WHERE propietario_cedula = $1 ORDER BY fecha_registro DESC';
      params = [cedula];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo vehículos' });
  }
});

// POST crear vehículo
app.post('/api/vehiculos', authenticateToken, async (req, res) => {
  const { rol, cedula } = req.user;
  const { placa, marca, modelo, propietario_cedula } = req.body;
  if (!placa || !marca || !modelo) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }
  const propietarioFinal = rol === 'administrador' ? (propietario_cedula || cedula) : cedula;
  try {
    const query = `
      INSERT INTO vehiculos (placa, marca, modelo, propietario_cedula)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query(query, [placa, marca, modelo, propietarioFinal]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un vehículo con esa placa' });
    }
    res.status(500).json({ error: 'Error insertando vehículo' });
  }
});

// PUT actualizar vehículo
app.put('/api/vehiculos/:placa', authenticateToken, async (req, res) => {
  console.log('PUT /api/vehiculos/:placa llamada con placa:', req.params.placa);
  const { rol, cedula } = req.user;
  const { placa } = req.params;
  const { marca, modelo } = req.body;
  if (!marca || !modelo) {
    return res.status(400).json({ error: 'Marca y modelo son obligatorios' });
  }
  try {
    const vehiculo = await pool.query('SELECT propietario_cedula FROM vehiculos WHERE placa = $1', [placa]);
    if (vehiculo.rows.length === 0) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }
    const propietario = vehiculo.rows[0].propietario_cedula;
    if (rol === 'cliente' && propietario !== cedula) {
      return res.status(403).json({ error: 'No autorizado para modificar este vehículo' });
    }
    await pool.query('UPDATE vehiculos SET marca = $1, modelo = $2 WHERE placa = $3', [marca, modelo, placa]);
    res.json({ mensaje: 'Vehículo actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando vehículo' });
  }
});

// DELETE vehículo
app.delete('/api/vehiculos/:placa', authenticateToken, async (req, res) => {
  const { rol, cedula } = req.user;
  const { placa } = req.params;
  try {
    const vehiculo = await pool.query('SELECT propietario_cedula FROM vehiculos WHERE placa = $1', [placa]);
    if (vehiculo.rows.length === 0) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }
    const propietario = vehiculo.rows[0].propietario_cedula;
    if (rol === 'cliente' && propietario !== cedula) {
      return res.status(403).json({ error: 'No autorizado para eliminar este vehículo' });
    }
    await pool.query('DELETE FROM vehiculos WHERE placa = $1', [placa]);
    res.json({ mensaje: 'Vehículo eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando vehículo' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en puerto ${PORT}`);
});
