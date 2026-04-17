const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || '').trim().replace(/\/$/, '');

export const buildApiUrl = (path) => {
  if (!path.startsWith('/')) {
    return `${API_BASE_URL}/${path}`;
  }

  return `${API_BASE_URL}${path}`;
};

export const getConexionError = () => {
  return 'No se pudo conectar con la API. Verifica REACT_APP_API_BASE_URL en Netlify.';
};
