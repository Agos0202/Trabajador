const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || '').trim().replace(/\/$/, '');

export const buildApiUrl = (path) => {
  if (!path.startsWith('/')) {
    return `${API_BASE_URL}/${path}`;
  }

  return `${API_BASE_URL}${path}`;
};

export const getConexionError = () => {
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const enLocal = host === 'localhost' || host === '127.0.0.1';

  if (enLocal) {
    return 'No se pudo conectar con la API local. Inicia backend con "npm run api" o "npm run dev".';
  }

  return 'No se pudo conectar con la API. Verifica REACT_APP_API_BASE_URL en Netlify.';
};
