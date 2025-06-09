// backend/server.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'qwerty12345!@#ASDFGH67890%^&*ZXCVBNM';
const pool = new Pool({
  connectionString: 'postgresql://postgres:CinlcUvwPoXsKyKqsUyaqVNPqXsJbYIZ@shuttle.proxy.rlwy.net:54698/railway',
  ssl: { rejectUnauthorized: false },
});

// --- Middleware de autenticación ---
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

// --- Usuarios ---
app.post('/api/register', async (req, res) => {
  const { cedula, nombre, telefono, correo, contrasena, rol = 'cliente' } = req.body;
  if (!cedula || !nombre || !telefono || !correo || !contrasena)
    return res.status(400).json({ error: 'Faltan campos' });
  if (!['cliente','administrador'].includes(rol))
    return res.status(400).json({ error: 'Rol inválido' });
  try {
    const hash = await bcrypt.hash(contrasena, 10);
    const q = `
      INSERT INTO usuarios(cedula,nombre,telefono,correo,contrasena,rol)
      VALUES($1,$2,$3,$4,$5,$6)
      RETURNING cedula,nombre,correo,rol
    `;
    const { rows } = await pool.query(q, [cedula,nombre,telefono,correo,hash,rol]);
    res.status(201).json({ mensaje:'Usuario registrado', usuario:rows[0] });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error:'Cédula o correo ya registrados' });
    res.status(500).json({ error:'Error en el servidor' });
  }
});

app.post('/api/login', async (req, res) => {
  const { cedula, contrasena } = req.body;
  if (!cedula || !contrasena)
    return res.status(400).json({ error:'Cédula y contraseña requeridos' });
  try {
    const { rows } = await pool.query(
      'SELECT cedula,nombre,correo,contrasena,rol FROM usuarios WHERE cedula=$1',
      [cedula]
    );
    if (!rows.length) return res.status(401).json({ error:'Cédula no encontrada' });
    const user = rows[0];
    const valid = await bcrypt.compare(contrasena, user.contrasena);
    if (!valid) return res.status(401).json({ error:'Contraseña incorrecta' });

    const { contrasena:_, ...userData } = user;
    const token = jwt.sign(
      { cedula:userData.cedula, rol:userData.rol },
      JWT_SECRET,
      { expiresIn:'8h' }
    );
    res.json({ mensaje:'Login exitoso', usuario:userData, token });
  } catch (err) {
    res.status(500).json({ error:'Error en el servidor' });
  }
});

app.get('/api/usuarios', authenticateToken, async (req, res) => {
  if (req.user.rol!=='administrador')
    return res.status(403).json({ error:'No autorizado' });
  const { rows } = await pool.query('SELECT cedula,nombre FROM usuarios ORDER BY nombre');
  res.json(rows);
});

// --- Vehículos ---
app.get('/api/vehiculos', authenticateToken, async (req, res) => {
  const { rol, cedula } = req.user;
  let sql = 'SELECT * FROM vehiculos';
  const vals = [];
  if (rol !== 'administrador') {
    sql += ' WHERE propietario_cedula=$1';
    vals.push(cedula);
  }
  sql += ' ORDER BY fecha_registro DESC';
  const { rows } = await pool.query(sql, vals);
  res.json(rows);
});

app.post('/api/vehiculos', authenticateToken, async (req, res) => {
  const { rol, cedula } = req.user;
  const { placa, marca, modelo, propietario_cedula } = req.body;
  if (!placa||!marca||!modelo) return res.status(400).json({ error:'Faltan datos' });
  const owner = rol==='administrador' ? (propietario_cedula||cedula) : cedula;
  const { rows } = await pool.query(
    'INSERT INTO vehiculos(placa,marca,modelo,propietario_cedula) VALUES($1,$2,$3,$4) RETURNING *',
    [placa,marca,modelo,owner]
  );
  res.status(201).json(rows[0]);
});

app.put('/api/vehiculos/:placa', authenticateToken, async (req, res) => {
  const { rol, cedula } = req.user;
  const placa = req.params.placa;
  const { marca, modelo } = req.body;
  if (!marca||!modelo) return res.status(400).json({ error:'Marca y modelo obligatorios' });
  const v = await pool.query('SELECT propietario_cedula FROM vehiculos WHERE placa=$1',[placa]);
  if (!v.rows.length) return res.status(404).json({ error:'Vehículo no encontrado' });
  if (rol==='cliente'&&v.rows[0].propietario_cedula!==cedula)
    return res.status(403).json({ error:'No autorizado' });
  await pool.query('UPDATE vehiculos SET marca=$1,modelo=$2 WHERE placa=$3',[marca,modelo,placa]);
  res.json({ mensaje:'Vehículo actualizado' });
});

app.delete('/api/vehiculos/:placa', authenticateToken, async (req, res) => {
  const { rol, cedula } = req.user;
  const placa = req.params.placa;
  const v = await pool.query('SELECT propietario_cedula FROM vehiculos WHERE placa=$1',[placa]);
  if (!v.rows.length) return res.status(404).json({ error:'Vehículo no encontrado' });
  if (rol==='cliente'&&v.rows[0].propietario_cedula!==cedula)
    return res.status(403).json({ error:'No autorizado' });
  await pool.query('DELETE FROM vehiculos WHERE placa=$1',[placa]);
  res.json({ mensaje:'Vehículo eliminado' });
});

// --- Repuestos ---
app.get('/api/repuestos', authenticateToken, async (req, res) => {
  const { rows } = await pool.query('SELECT id,nombre,precio FROM Repuestos ORDER BY id');
  res.json(rows);
});

app.post('/api/repuestos', authenticateToken, async (req, res) => {
  if (req.user.rol!=='administrador') return res.status(403).json({ error:'No autorizado' });
  const { id,nombre,precio } = req.body;
  if (id==null||!nombre||precio==null) return res.status(400).json({ error:'Faltan campos' });
  const { rows } = await pool.query(
    'INSERT INTO Repuestos(id,nombre,precio) VALUES($1,$2,$3) RETURNING *',[id,nombre,precio]
  );
  res.status(201).json({ mensaje:'Repuesto creado', repuesto:rows[0] });
});

// --- Reparaciones (detalle precios) ---
app.get('/api/reparaciones', authenticateToken, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT pr.id, pr.repuesto_id, rp.nombre AS repuesto_nombre,
           pr.cantidad, pr.mano_de_obra, pr.total, pr.fecha
    FROM PrecioReparacion pr
    JOIN Repuestos rp ON rp.id = pr.repuesto_id
    ORDER BY pr.fecha DESC
  `);
  res.json(rows);
});

app.post('/api/reparaciones', authenticateToken, async (req, res) => {
  if (req.user.rol!=='administrador') return res.status(403).json({ error:'No autorizado' });
  const { repuesto_id,cantidad,mano_de_obra } = req.body;
  if (!repuesto_id||!cantidad||mano_de_obra==null) return res.status(400).json({ error:'Faltan datos' });
  const { rows } = await pool.query(
    'INSERT INTO PrecioReparacion(repuesto_id,cantidad,mano_de_obra) VALUES($1,$2,$3) RETURNING *',
    [repuesto_id,cantidad,mano_de_obra]
  );
  res.status(201).json(rows[0]);
});

// --- Revisiones (usa vw_revision_detalle) ---
app.get('/api/revision', authenticateToken, async (req, res) => {
  const { rol, cedula } = req.user;
  let sql = 'SELECT * FROM vw_revision_detalle';
  const vals = [];
  if (rol!=='administrador') {
    sql += ' WHERE placa IN (SELECT placa FROM vehiculos WHERE propietario_cedula=$1)';
    vals.push(cedula);
  }
  sql += ' ORDER BY fecha_revision DESC';
  const { rows } = await pool.query(sql, vals);
  res.json(rows);
});

app.get('/api/revision/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { rows } = await pool.query('SELECT * FROM vw_revision_detalle WHERE id=$1',[id]);
  if (!rows.length) return res.status(404).json({ error:'Revisión no encontrada' });
  res.json(rows[0]);
});

app.post('/api/revision', authenticateToken, async (req, res) => {
  if (req.user.rol!=='administrador') return res.status(403).json({ error:'No autorizado' });
  const { placa,mecanico,detalle_averia } = req.body;
  if (!placa||!mecanico||!detalle_averia) return res.status(400).json({ error:'Faltan campos' });
  const { rows } = await pool.query(
    'INSERT INTO revision(placa,mecanico,detalle_averia) VALUES($1,$2,$3) RETURNING *',
    [placa,mecanico,detalle_averia]
  );
  res.status(201).json(rows[0]);
});

app.post('/api/revision/:id/repuestos', authenticateToken, async (req, res) => {
  if (req.user.rol!=='administrador') return res.status(403).json({ error:'No autorizado' });
  const revId = parseInt(req.params.id,10);
  const { precio_reparacion_id } = req.body;
  if (!precio_reparacion_id) return res.status(400).json({ error:'Falta precio_reparacion_id' });
  await pool.query(
    'INSERT INTO revision_repuestos(revision_id,precio_reparacion_id) VALUES($1,$2)',
    [revId,precio_reparacion_id]
  );
  res.sendStatus(201);
});

// --- Actualizar estado y respuesta_cliente (cliente) ---
app.patch('/api/revision/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { estado, respuesta_cliente } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE revision
         SET estado = $1,
             respuesta_cliente = $2
       WHERE id = $3
       RETURNING *`,
      [estado, respuesta_cliente, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Revisión no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- Inicia servidor ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
