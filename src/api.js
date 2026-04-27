const normalizeApiBaseUrl = (value) => {
  const trimmed = (value || '').trim();

  if (!trimmed) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/$/, '');
  }

  // Permite configurar solo el dominio en Netlify (ej: mi-api.onrender.com).
  if (/^[a-z0-9.-]+(?::\d+)?(?:\/.*)?$/i.test(trimmed)) {
    return `https://${trimmed}`.replace(/\/$/, '');
  }

  return trimmed.replace(/\/$/, '');
};

const API_BASE_URL = normalizeApiBaseUrl(process.env.REACT_APP_API_BASE_URL);

export const buildApiUrl = (path) => {
  // Si hay API_BASE_URL, usarla
  if (API_BASE_URL) {
    if (!path.startsWith('/')) {
      return `${API_BASE_URL}/${path}`;
    }
    return `${API_BASE_URL}${path}`;
  }
  // Si no hay API_BASE_URL, usar la ruta de Netlify Functions
  // Si la ruta ya empieza con /api, anteponer /.netlify/functions/api
  if (path.startsWith('/api')) {
    return `/.netlify/functions/api${path}`;
  }
  // Si no, devolver la ruta tal cual (por compatibilidad)
  return path;
};

export const getConexionError = () => {
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const enLocal = host === 'localhost' || host === '127.0.0.1';
  const baseConfigurada = API_BASE_URL || '(vacia, usando /api en el mismo dominio)';

  if (enLocal) {
    return 'No se pudo conectar con la API local. Inicia backend con "npm run api" o "npm run dev".';
  }

  return `No se pudo conectar con la API. Verifica REACT_APP_API_BASE_URL en Netlify. Valor actual: ${baseConfigurada}`;
};

export const resolveApiErrorMessage = (error, fallback) => {
  const message = String(error?.message || '').trim();
  const normalized = message.toLowerCase();

  if (!message || normalized === 'failed to fetch' || normalized.includes('networkerror')) {
    return fallback || getConexionError();
  }

  return message;
};
