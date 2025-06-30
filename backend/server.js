// backend/server.js

// **¡IMPORTANTE!** Carga las variables de entorno lo más pronto posible.
require('dotenv').config();

// --- Logs de depuración iniciales ---
console.log('--- Configuración de Entorno ---');
console.log('  DATABASE_URL cargada:', process.env.DATABASE_URL ? 'Sí' : 'NO (Undefined/Null/Vacío)');
console.log('  JWT_SECRET cargada:', process.env.JWT_SECRET ? 'Sí' : 'NO (Undefined/Null/Vacío)');
if (!process.env.DATABASE_URL) console.error('ADVERTENCIA: DATABASE_URL no está definida. ¡Verifica tu archivo .env!');
if (!process.env.JWT_SECRET) console.error('ADVERTENCIA: JWT_SECRET no está definida. ¡Verifica tu archivo .env!');
console.log('-----------------------------------');

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Accede a las variables de entorno
const JWT_SECRET = process.env.JWT_SECRET;

// Inicializa el Pool de la base de datos con la cadena de conexión del .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Mantén esto si Railway lo requiere
});

// --- Log para verificar la conexión al pool ---
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Conexión inicial a la base de datos exitosa.'))
  .catch(err => console.error('❌ Error al conectar a la base de datos:', err.message, err.stack));
console.log('-----------------------------------');


// Middleware de autenticación
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('🚫 Token no proporcionado.');
    return res.status(401).json({ error: 'Token requerido' });
  }

  // Log para depurar JWT_SECRET en el middleware
  if (!JWT_SECRET) {
    console.error('🚫 JWT_SECRET es undefined en authenticateToken. No se puede verificar el token.');
    return res.status(500).json({ error: 'Error de configuración del servidor (JWT_SECRET no definida).' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('❌ Error de verificación de token JWT:', err.message);
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
}

// --- Usuarios ---
app.post('/api/register', async (req, res) => {
  const { cedula, nombre, telefono, correo, contrasena, rol = 'cliente' } = req.body;
  if (!cedula || !nombre || !telefono || !correo || !contrasena)
    return res.status(400).json({ error: 'Faltan campos' });
  if (!['cliente', 'administrador'].includes(rol))
    return res.status(400).json({ error: 'Rol inválido' });
  try {
    const hash = await bcrypt.hash(contrasena, 10);
    const q = `
      INSERT INTO usuarios(cedula,nombre,telefono,correo,contrasena,rol)
      VALUES($1,$2,$3,$4,$5,$6)
      RETURNING cedula,nombre,correo,rol
    `;
    const vals = [cedula, nombre, telefono, correo, hash, rol];
    const { rows } = await pool.query(q, vals);
    console.log(`✅ Usuario ${cedula} registrado con éxito.`);
    res.status(201).json({ mensaje: 'Usuario registrado', usuario: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      console.warn(`⚠️ Intento de registro con cédula o correo existente: ${cedula}, ${correo}`);
      return res.status(409).json({ error: 'Cédula o correo ya registrados' });
    }
    console.error('❌ Error en el registro de usuario:', err.message, err.stack);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.post('/api/login', async (req, res) => {
  const { cedula, contrasena } = req.body;
  if (!cedula || !contrasena)
    return res.status(400).json({ error: 'Cédula y contraseña requeridos' });
  try {
    console.log(`🔎 Intentando login para cédula: ${cedula}`);
    const { rows } = await pool.query(
      'SELECT cedula,nombre,correo,contrasena,rol FROM usuarios WHERE cedula=$1',
      [cedula]
    );

    if (rows.length === 0) {
      console.log(`🚫 Cédula no encontrada: ${cedula}`);
      return res.status(401).json({ error: 'Cédula no encontrada' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(contrasena, user.contrasena);
    if (!valid) {
      console.log(`🚫 Contraseña incorrecta para cédula: ${cedula}`);
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const { contrasena: _, ...userData } = user;

    // Log para asegurar que JWT_SECRET está disponible antes de firmar
    if (!JWT_SECRET) {
      console.error('🚫 JWT_SECRET es undefined antes de firmar el token en /api/login.');
      return res.status(500).json({ error: 'Error de configuración del servidor (JWT_SECRET no definida).' });
    }

    const token = jwt.sign(
      { cedula: userData.cedula, rol: userData.rol },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    console.log(`✅ Login exitoso para usuario: ${cedula}`);
    res.json({ mensaje: 'Login exitoso', usuario: userData, token });
  } catch (err) {
    console.error('❌ Error en el endpoint de login:', err.message, err.stack);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.get('/api/usuarios', authenticateToken, async (req, res) => {
  if (req.user.rol !== 'administrador') {
    console.warn(`🚫 Acceso no autorizado a /api/usuarios por rol: ${req.user.rol}`);
    return res.status(403).json({ error: 'No autorizado' });
  }
  try {
    const { rows } = await pool.query('SELECT cedula,nombre FROM usuarios ORDER BY nombre');
    console.log('✅ Usuarios obtenidos con éxito.');
    res.json(rows);
  } catch (err) {
    console.error('❌ Error obteniendo usuarios:', err.message, err.stack);
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
});

// --- Vehículos ---
app.get('/api/vehiculos', authenticateToken, async (req, res) => {
  const { rol, cedula } = req.user;
  try {
    let q, vals;
    if (rol === 'administrador') {
      q = 'SELECT * FROM vehiculos ORDER BY fecha_registro DESC';
      vals = [];
      console.log('🔎 Administrador solicitando todos los vehículos.');
    } else {
      q = 'SELECT * FROM vehiculos WHERE propietario_cedula=$1 ORDER BY fecha_registro DESC';
      vals = [cedula];
      console.log(`🔎 Cliente ${cedula} solicitando sus vehículos.`);
    }
    const { rows } = await pool.query(q, vals);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error obteniendo vehículos:', err.message, err.stack);
    res.status(500).json({ error: 'Error obteniendo vehículos' });
  }
});

app.post('/api/vehiculos', authenticateToken, async (req, res) => {
  const { rol, cedula } = req.user;
  const { placa, marca, modelo, propietario_cedula } = req.body;
  if (!placa || !marca || !modelo)
    return res.status(400).json({ error: 'Faltan datos' });
  const owner = rol === 'administrador' ? (propietario_cedula || cedula) : cedula;
  try {
    const { rows } = await pool.query(
      'INSERT INTO vehiculos(placa,marca,modelo,propietario_cedula) VALUES($1,$2,$3,$4) RETURNING *',
      [placa, marca, modelo, owner]
    );
    console.log(`✅ Vehículo ${placa} registrado por ${owner}.`);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      console.warn(`⚠️ Intento de registro de vehículo ya existente: ${placa}`);
      return res.status(409).json({ error: 'Vehículo ya existe' });
    }
    console.error('❌ Error insertando vehículo:', err.message, err.stack);
    res.status(500).json({ error: 'Error insertando vehículo' });
  }
});

app.put('/api/vehiculos/:placa', authenticateToken, async (req, res) => {
  const { rol, cedula } = req.user;
  const placa = req.params.placa;
  const { marca, modelo } = req.body;
  if (!marca || !modelo)
    return res.status(400).json({ error: 'Marca y modelo obligatorios' });
  try {
    const { rows } = await pool.query(
      'SELECT propietario_cedula FROM vehiculos WHERE placa=$1',
      [placa]
    );
    if (!rows.length) {
      console.warn(`⚠️ Vehículo no encontrado para actualizar: ${placa}`);
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }
    if (rol === 'cliente' && rows[0].propietario_cedula !== cedula) {
      console.warn(`🚫 Cliente ${cedula} intentó actualizar vehículo ajeno: ${placa}`);
      return res.status(403).json({ error: 'No autorizado' });
    }

    await pool.query(
      'UPDATE vehiculos SET marca=$1,modelo=$2 WHERE placa=$3',
      [marca, modelo, placa]
    );
    console.log(`✅ Vehículo ${placa} actualizado.`);
    res.json({ mensaje: 'Vehículo actualizado' });
  } catch (err) {
    console.error('❌ Error actualizando vehículo:', err.message, err.stack);
    res.status(500).json({ error: 'Error actualizando vehículo' });
  }
});

app.delete('/api/vehiculos/:placa', authenticateToken, async (req, res) => {
  const { rol, cedula } = req.user;
  const placa = req.params.placa;
  try {
    const { rows } = await pool.query(
      'SELECT propietario_cedula FROM vehiculos WHERE placa=$1',
      [placa]
    );
    if (!rows.length) {
      console.warn(`⚠️ Vehículo no encontrado para eliminar: ${placa}`);
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }
    if (rol === 'cliente' && rows[0].propietario_cedula !== cedula) {
      console.warn(`🚫 Cliente ${cedula} intentó eliminar vehículo ajeno: ${placa}`);
      return res.status(403).json({ error: 'No autorizado' });
    }

    await pool.query('DELETE FROM vehiculos WHERE placa=$1', [placa]);
    console.log(`✅ Vehículo ${placa} eliminado.`);
    res.json({ mensaje: 'Vehículo eliminado' });
  } catch (err) {
    console.error('❌ Error eliminando vehículo:', err.message, err.stack);
    res.status(500).json({ error: 'Error eliminando vehículo' });
  }
});

// --- Repuestos ---
app.get('/api/repuestos', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id,nombre,precio FROM Repuestos ORDER BY id');
    console.log('✅ Repuestos obtenidos.');
    res.json(rows);
  } catch (err) {
    console.error('❌ Error obteniendo repuestos:', err.message, err.stack);
    res.status(500).json({ error: 'Error obteniendo repuestos' });
  }
});

app.post('/api/repuestos', authenticateToken, async (req, res) => {
  if (req.user.rol !== 'administrador') {
    console.warn(`🚫 Acceso no autorizado a /api/repuestos (POST) por rol: ${req.user.rol}`);
    return res.status(403).json({ error: 'No autorizado' });
  }
  const { id, nombre, precio } = req.body;
  if (id == null || !nombre || precio == null)
    return res.status(400).json({ error: 'Faltan campos' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO Repuestos(id,nombre,precio) VALUES($1,$2,$3) RETURNING *',
      [id, nombre, precio]
    );
    console.log(`✅ Repuesto ${id} (${nombre}) creado.`);
    res.status(201).json({ mensaje: 'Repuesto creado', repuesto: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      console.warn(`⚠️ Intento de creación de repuesto con ID existente: ${id}`);
      return res.status(409).json({ error: 'ID ya existe' });
    }
    console.error('❌ Error creando repuesto:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

// --- Reparaciones (detalle precios) ---
app.get('/api/reparaciones', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT pr.id, pr.repuesto_id,
             rp.nombre       AS repuesto_nombre,
             pr.cantidad, pr.mano_de_obra,
             pr.total, pr.fecha
      FROM PrecioReparacion pr
      JOIN Repuestos rp ON rp.id = pr.repuesto_id
      ORDER BY pr.fecha DESC
    `);
    console.log('✅ Reparaciones cargadas.');
    res.json(rows);
  } catch (err) {
    console.error('❌ Error cargando reparaciones:', err.message, err.stack);
    res.status(500).json({ error: 'Error cargando reparaciones' });
  }
});

app.post('/api/reparaciones', authenticateToken, async (req, res) => {
  if (req.user.rol !== 'administrador') {
    console.warn(`🚫 Acceso no autorizado a /api/reparaciones (POST) por rol: ${req.user.rol}`);
    return res.status(403).json({ error: 'No autorizado' });
  }
  const { repuesto_id, cantidad, mano_de_obra } = req.body;
  if (!repuesto_id || !cantidad || mano_de_obra == null)
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO PrecioReparacion(repuesto_id,cantidad,mano_de_obra) VALUES($1,$2,$3) RETURNING *',
      [repuesto_id, cantidad, mano_de_obra]
    );
    console.log(`✅ Nueva reparación registrada: ID ${rows[0].id}`);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('❌ Error registrando reparación:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

// --- Revisiones (usa vw_revision_detalle) ---
app.get('/api/revision', authenticateToken, async (req, res) => {
  const { rol, cedula } = req.user;
  try {
    let sql = 'SELECT * FROM vw_revision_detalle';
    const vals = [];
    if (rol !== 'administrador') {
      sql += ' WHERE placa IN (SELECT placa FROM vehiculos WHERE propietario_cedula=$1)';
      vals.push(cedula);
      console.log(`🔎 Cliente ${cedula} solicitando sus revisiones.`);
    } else {
      console.log('🔎 Administrador solicitando todas las revisiones.');
    }
    sql += ' ORDER BY fecha_revision DESC';
    const { rows } = await pool.query(sql, vals);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error en GET /api/revision:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/revision/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const { rows } = await pool.query(
      'SELECT * FROM vw_revision_detalle WHERE id=$1',
      [id]
    );
    if (!rows.length) {
      console.warn(`⚠️ Revisión no encontrada: ID ${id}`);
      return res.status(404).json({ error: 'Revisión no encontrada' });
    }
    console.log(`✅ Revisión ID ${id} obtenida.`);
    res.json(rows[0]);
  } catch (err) {
    console.error('❌ Error obteniendo revisión por ID:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/revision', authenticateToken, async (req, res) => {
  if (req.user.rol !== 'administrador') {
    console.warn(`🚫 Acceso no autorizado a /api/revision (POST) por rol: ${req.user.rol}`);
    return res.status(403).json({ error: 'No autorizado' });
  }
  const { placa, mecanico, detalle_averia } = req.body;
  if (!placa || !mecanico || !detalle_averia)
    return res.status(400).json({ error: 'Faltan campos' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO revision(placa,mecanico,detalle_averia) VALUES($1,$2,$3) RETURNING *',
      [placa, mecanico, detalle_averia]
    );
    console.log(`✅ Nueva revisión para ${placa} creada.`);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('❌ Error creando revisión:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/revision/:id/repuestos', authenticateToken, async (req, res) => {
  if (req.user.rol !== 'administrador') {
    console.warn(`🚫 Acceso no autorizado a /api/revision/:id/repuestos (POST) por rol: ${req.user.rol}`);
    return res.status(403).json({ error: 'No autorizado' });
  }
  const revId = parseInt(req.params.id, 10);
  const { precio_reparacion_id } = req.body;
  if (!precio_reparacion_id)
    return res.status(400).json({ error: 'Falta precio_reparacion_id' });
  try {
    await pool.query(
      'INSERT INTO revision_repuestos(revision_id,precio_reparacion_id) VALUES($1,$2)',
      [revId, precio_reparacion_id]
    );
    console.log(`✅ Repuesto ${precio_reparacion_id} asociado a revisión ${revId}.`);
    res.sendStatus(201);
  } catch (err) {
    console.error('❌ Error asociando repuesto a revisión:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/revision/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { estado, respuesta_cliente } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE revision
          SET estado=$1,
              respuesta_cliente=$2
        WHERE id=$3
        RETURNING *`,
      [estado, respuesta_cliente, id]
    );
    if (!rows.length) {
      console.warn(`⚠️ Revisión no encontrada para actualizar: ID ${id}`);
      return res.status(404).json({ error: 'Revisión no encontrada' });
    }
    console.log(`✅ Revisión ID ${id} actualizada a estado: ${estado}.`);
    res.json(rows[0]);
  } catch (err) {
    console.error('❌ Error actualizando revisión:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/informes', authenticateToken, async (req, res) => {
  console.log('👉 Recibida petición para crear informe');

  const { placa, detalle_informe } = req.body;
  console.log('👉 Datos recibidos para informe:', { placa, detalle_informe });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      'INSERT INTO informe (placa, detalle_informe) VALUES ($1, $2)',
      [placa, detalle_informe]
    );
    console.log('✅ Informe insertado');

    const updateResult = await client.query(
      "UPDATE revision SET estado = 'entrega' WHERE placa = $1 AND estado = 'reparacion' RETURNING id",
      [placa]
    );
    console.log('Revisiones actualizadas:', updateResult.rows.map(row => row.id));

    await client.query('COMMIT');
    console.log('✅ Transacción de informe y actualización de revisión completada.');
    res.sendStatus(201);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error al generar informe y actualizar revisiones (ROLLBACK):', err.message, err.stack);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.get('/api/informes', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM informe ORDER BY fecha DESC');
    console.log('✅ Informes obtenidos.');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error obteniendo informes:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/informes/:id', authenticateToken, async (req, res) => {
  const informeId = parseInt(req.params.id, 10);
  try {
    const result = await pool.query('SELECT * FROM informe WHERE id = $1', [informeId]);
    if (result.rows.length === 0) {
      console.warn(`⚠️ Informe no encontrado: ID ${informeId}`);
      return res.status(404).json({ error: 'Informe no encontrado' });
    }
    console.log(`✅ Informe ID ${informeId} obtenido.`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error obteniendo informe por ID:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/informes/:id/estado', authenticateToken, async (req, res) => {
  const informeId = parseInt(req.params.id, 10);
  // Ahora esperamos tanto 'estado_factura' como 'signature'
  const { estado_factura, signature } = req.body;

  console.log(`\n--- PETICIÓN RECIBIDA: /api/informes/${informeId}/estado ---`);
  console.log(`   - ID del Informe: ${informeId}`);
  console.log(`   - Estado Recibido: ${estado_factura}`);
  console.log(`   - ¿Firma Recibida?: ${signature ? 'Sí, ' + signature.length + ' caracteres.' : 'No'}`);
 

  // Validación del estado de la factura
  if (!['pendiente', 'pagado'].includes(estado_factura)) {
    console.warn(`   [ERROR 400] Estado de factura inválido: ${estado_factura}`);
    return res.status(400).json({ error: 'Estado de factura inválido' });
  }

  // Si se va a pagar, la firma es obligatoria
  if (estado_factura === 'pagado' && !signature) {
    console.warn(`   [ERROR 400] Se intentó pagar sin adjuntar una firma.`);
    return res.status(400).json({ error: 'La firma es requerida para pagar la factura.' });
  }

  try {
    // Convierte la firma de formato base64 a un Buffer, que es el formato que PostgreSQL entiende para el tipo de dato BYTEA.
    const signatureBuffer = Buffer.from(signature, 'base64');
    console.log(`   - Buffer de la firma creado. Tamaño: ${signatureBuffer.length} bytes.`);

    // Ejecuta la consulta para actualizar AMBOS campos en la base de datos
    const { rows } = await pool.query(
      'UPDATE informe SET estado_factura = $1, signature = $2 WHERE id = $3 RETURNING *',
      [estado_factura, signatureBuffer, informeId]
    );

    // Verificación final para asegurarnos de que se guardó
    if (rows.length > 0 && rows[0].signature) {
        console.log(`   [ÉXITO] La firma para el informe ${informeId} se ha guardado correctamente en la base de datos.`);
    } else {
        console.warn(`   [ADVERTENCIA] El estado se actualizó, pero la firma sigue siendo NULL en la base de datos.`);
    }

    res.sendStatus(200);

  } catch (err) {
    console.error('   [ERROR 500] Ocurrió un error en el bloque try/catch:', err.message);
    console.error(err.stack); // Muestra el detalle completo del error
    res.status(500).json({ error: 'Error interno del servidor al procesar la firma.' });
  }
});


app.get('/api/informes-cliente', authenticateToken, async (req, res) => {
  try {
    const clienteCedula = req.user.cedula;
    console.log(`🔎 Cliente ${clienteCedula} solicitando sus informes.`);

    const result = await pool.query(
      `SELECT i.*
        FROM informe i
        JOIN vehiculos v ON v.placa = i.placa
        WHERE v.propietario_cedula = $1
        ORDER BY i.fecha DESC`,
      [clienteCedula]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error obteniendo informes para cliente:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en todas las IPs (puerto ${PORT})`);
});