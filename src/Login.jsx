import React, { useState } from 'react';
import './Login.css';

function Login({ onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Usuario y clave hardcodeados para administración simple
    if (usuario === 'FloridaLuisiana' && clave === 'comuna2026*') {
      onLogin();
    } else {
      setError('Usuario o clave incorrectos');
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Acceso Administración</h2>
        <label htmlFor="usuario">Usuario</label>
        <input
          id="usuario"
          type="text"
          value={usuario}
          onChange={e => setUsuario(e.target.value)}
          autoComplete="username"
        />
        <label htmlFor="clave">Clave</label>
        <input
          id="clave"
          type="password"
          value={clave}
          onChange={e => setClave(e.target.value)}
          autoComplete="current-password"
        />
        {error && <p className="login-error">{error}</p>}
        <button type="submit" className="login-btn">Ingresar</button>
      </form>
    </div>
  );
}

export default Login;
