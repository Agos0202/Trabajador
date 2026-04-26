const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { v2: cloudinary } = require('cloudinary');

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || process.env.PORT || 4000;
const CLOUDINARY_DB_PUBLIC_ID = process.env.CLOUDINARY_DB_PUBLIC_ID || 'comuna_asistencias_db';
const ADMIN_USER = process.env.ADMIN_USER || 'FloridaLuisiana';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Comuna2026*';
const CLOUDINARY_CLOUD_NAME = (process.env.CLOUDINARY_CLOUD_NAME || '').trim().toLowerCase();
const CLOUDINARY_API_KEY = (process.env.CLOUDINARY_API_KEY || '').trim();
const CLOUDINARY_API_SECRET = (process.env.CLOUDINARY_API_SECRET || '').trim();

app.use(cors());
app.use(express.json());

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const getErrorMessage = (error, fallback) => {
  return error?.error?.message || error?.message || fallback;
};

const normalizarDni = (value) => {
  return String(value ?? '').replace(/\D/g, '');
};

const parseNumeroSorteo = (value) => {
  const numero = Number.parseInt(value, 10);
  return Number.isFinite(numero) && numero > 0 ? numero : null;
};

const obtenerMaxNumeroSorteo = (asistencias) => {
  let maxNumero = 0;

  asistencias.forEach((item) => {
    const numero = parseNumeroSorteo(item.numeroSorteo);
    if (numero && numero > maxNumero) {
      maxNumero = numero;
    }
  });

  return maxNumero;
};

const normalizarDb = (dbRaw) => {
  if (Array.isArray(dbRaw)) {
    const maxNumero = obtenerMaxNumeroSorteo(dbRaw);
    return {
      asistencias: dbRaw,
      ultimoNumeroSorteo: maxNumero,
    };
  }

  const asistencias = Array.isArray(dbRaw?.asistencias) ? dbRaw.asistencias : [];
  const ultimoNumero = parseNumeroSorteo(dbRaw?.ultimoNumeroSorteo);
  const maxNumero = obtenerMaxNumeroSorteo(asistencias);

  return {
    asistencias,
    ultimoNumeroSorteo: ultimoNumero && ultimoNumero > maxNumero ? ultimoNumero : maxNumero,
  };
};

const asegurarNumerosSorteo = async (db) => {
  const { asistencias } = db;
  let siguienteNumero = db.ultimoNumeroSorteo;
  let huboCambios = false;

  asistencias.forEach((item) => {
    const numero = parseNumeroSorteo(item.numeroSorteo);
    if (!numero) {
      siguienteNumero += 1;
      item.numeroSorteo = siguienteNumero;
      huboCambios = true;
    }
  });

  if (db.ultimoNumeroSorteo !== siguienteNumero) {
    db.ultimoNumeroSorteo = siguienteNumero;
    huboCambios = true;
  }

  if (huboCambios) {
    await saveDb(db);
  }
};

const isCloudinaryNotFound = (error) => {
  const httpCode = error?.http_code || error?.error?.http_code;
  const message = error?.message || error?.error?.message || '';

  return httpCode === 404 || (typeof message === 'string' && message.toLowerCase().includes('not found'));
};

const getDb = async () => {
  try {
    const resource = await cloudinary.api.resource(CLOUDINARY_DB_PUBLIC_ID, { resource_type: 'raw' });
    const bustCacheUrl = `${resource.secure_url}?t=${Date.now()}`;
    const response = await fetch(bustCacheUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error('No se pudo leer la base desde Cloudinary.');
    }

    const json = await response.json();
    return normalizarDb(json);
  } catch (error) {
    if (isCloudinaryNotFound(error)) {
      return {
        asistencias: [],
        ultimoNumeroSorteo: 0,
      };
    }
    throw error;
  }
};

const saveDb = async (db) => {
  const payload = Buffer.from(
    JSON.stringify({
      asistencias: db.asistencias,
      ultimoNumeroSorteo: db.ultimoNumeroSorteo,
    }, null, 2),
    'utf8'
  );

  await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        public_id: CLOUDINARY_DB_PUBLIC_ID,
        overwrite: true,
        invalidate: true,
      },
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      }
    );

    uploadStream.end(payload);
  });
};

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

const logCloudinaryStatus = async () => {
  try {
    await cloudinary.api.ping();
    console.log('Cloudinary OK');
  } catch (error) {
    console.error('Cloudinary error:', getErrorMessage(error, 'Error desconocido'));
  }
};

app.post('/api/admin/login', (req, res) => {
  const { usuario, password } = req.body || {};

  if (usuario === ADMIN_USER && password === ADMIN_PASSWORD) {
    res.json({ ok: true });
    return;
  }

  res.status(401).json({ ok: false, message: 'Credenciales invalidas.' });
});

app.get('/api/asistencias', async (req, res) => {
  try {
    const db = await getDb();
    await asegurarNumerosSorteo(db);
    res.json(db.asistencias);
  } catch (error) {
    res.status(500).json({ message: getErrorMessage(error, 'No se pudo obtener asistencias.') });
  }
});

app.post('/api/asistencias', async (req, res) => {
  try {
    const { nombre, apellido, telefono, dni, email, estadoAsistencia } = req.body || {};
    const dniNormalizado = normalizarDni(dni ?? email);

    if (!nombre || !apellido || !telefono || !dniNormalizado) {
      res.status(400).json({ message: 'Todos los campos son obligatorios.' });
      return;
    }

    const db = await getDb();
    await asegurarNumerosSorteo(db);
    const { asistencias } = db;

    const yaRegistrado = asistencias.some(
      (item) => normalizarDni(item.dni ?? item.email) === dniNormalizado
    );

    if (yaRegistrado) {
      res.status(409).json({ message: 'Ya te encuentras registrado/a' });
      return;
    }

    const proximoNumeroSorteo = db.ultimoNumeroSorteo + 1;

    const nuevaAsistencia = {
      id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      nombre: String(nombre).trim(),
      apellido: String(apellido).trim(),
      telefono: String(telefono).trim(),
      dni: dniNormalizado,
      numeroSorteo: proximoNumeroSorteo,
      estadoAsistencia: ['presente', 'ausente', 'pendiente'].includes(estadoAsistencia)
        ? estadoAsistencia
        : 'pendiente',
      fechaConfirmacion: new Date().toISOString(),
    };

    asistencias.push(nuevaAsistencia);
    db.ultimoNumeroSorteo = proximoNumeroSorteo;
    await saveDb(db);

    res.status(201).json({
      ...nuevaAsistencia,
      numeroLista: nuevaAsistencia.numeroSorteo,
    });
  } catch (error) {
    res.status(500).json({ message: getErrorMessage(error, 'No se pudo guardar la asistencia.') });
  }
});

app.put('/api/asistencias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, telefono, dni, email, estadoAsistencia } = req.body || {};

    const db = await getDb();
    await asegurarNumerosSorteo(db);
    const { asistencias } = db;
    const index = asistencias.findIndex((item) => item.id === id);

    if (index === -1) {
      res.status(404).json({ message: 'Asistencia no encontrada.' });
      return;
    }

    const dniNormalizado = normalizarDni(dni ?? email ?? asistencias[index].dni ?? asistencias[index].email);
    if (!dniNormalizado) {
      res.status(400).json({ message: 'El DNI es obligatorio.' });
      return;
    }

    const yaRegistrado = asistencias.some((item, itemIndex) => {
      if (itemIndex === index) {
        return false;
      }

      return normalizarDni(item.dni ?? item.email) === dniNormalizado;
    });

    if (yaRegistrado) {
      res.status(409).json({ message: 'Ya existe un invitado con ese DNI.' });
      return;
    }

    asistencias[index] = {
      ...asistencias[index],
      nombre: String(nombre ?? asistencias[index].nombre).trim(),
      apellido: String(apellido ?? asistencias[index].apellido).trim(),
      telefono: String(telefono ?? asistencias[index].telefono).trim(),
      dni: dniNormalizado,
      email: dniNormalizado,
      estadoAsistencia: ['presente', 'ausente', 'pendiente'].includes(estadoAsistencia)
        ? estadoAsistencia
        : asistencias[index].estadoAsistencia || 'pendiente',
    };

    await saveDb(db);
    res.json(asistencias[index]);
  } catch (error) {
    res.status(500).json({ message: getErrorMessage(error, 'No se pudo actualizar la asistencia.') });
  }
});

app.patch('/api/asistencias/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estadoAsistencia } = req.body || {};

    if (!['presente', 'ausente', 'pendiente'].includes(estadoAsistencia)) {
      res.status(400).json({ message: 'Estado de asistencia invalido.' });
      return;
    }

    const db = await getDb();
    await asegurarNumerosSorteo(db);
    const { asistencias } = db;
    const index = asistencias.findIndex((item) => item.id === id);

    if (index === -1) {
      res.status(404).json({ message: 'Asistencia no encontrada.' });
      return;
    }

    asistencias[index] = {
      ...asistencias[index],
      estadoAsistencia,
    };

    await saveDb(db);
    res.json(asistencias[index]);
  } catch (error) {
    res.status(500).json({ message: getErrorMessage(error, 'No se pudo actualizar el estado de asistencia.') });
  }
});

app.delete('/api/asistencias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    await asegurarNumerosSorteo(db);
    const { asistencias } = db;
    const siguiente = asistencias.filter((item) => item.id !== id);

    if (siguiente.length === asistencias.length) {
      res.status(404).json({ message: 'Asistencia no encontrada.' });
      return;
    }

    db.asistencias = siguiente;
    await saveDb(db);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: getErrorMessage(error, 'No se pudo eliminar la asistencia.') });
  }
});

// Exportar app para uso en Netlify Functions
module.exports = { app };

// Solo escuchar si se ejecuta directamente (desarrollo local)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API escuchando en http://localhost:${PORT}`);
    logCloudinaryStatus();
  });
}
