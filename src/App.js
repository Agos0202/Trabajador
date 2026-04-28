import { useState, useEffect } from 'react';
import PantallaInicio from './PantallaInicio';
import TarjetaEvento from './TarjetaEvento';
import Administracion from './Administracion';
import Login from './Login';

const obtenerPantallaDesdeRuta = () => {
  if (window.location.pathname.startsWith('/4dmin2026c0mun4')) {
    return 'administracion';
  }
  if (window.location.pathname === '/evento') {
    return 'evento';
  }
  return 'inicio';
};

function App() {
  const [pantalla, setPantalla] = useState(obtenerPantallaDesdeRuta);
  const [adminLogueado, setAdminLogueado] = useState(() => {
    return window.localStorage.getItem('adminLogueado') === '1';
  });

  const irAEvento = () => {
    window.history.pushState({ pantalla: 'evento' }, '', '/evento');
    setPantalla('evento');
  };

  const irAInicio = () => {
    window.history.pushState({ pantalla: 'inicio' }, '', '/');
    setPantalla('inicio');
  };

  useEffect(() => {
    const onPopState = () => {
      setPantalla(obtenerPantallaDesdeRuta());
    };

    window.addEventListener('popstate', onPopState);
    setPantalla(obtenerPantallaDesdeRuta());

    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleLogin = () => {
    setAdminLogueado(true);
    window.localStorage.setItem('adminLogueado', '1');
  };

  const handleLogout = () => {
    setAdminLogueado(false);
    window.localStorage.removeItem('adminLogueado');
    irAInicio();
  };

  return (
    <>
      {pantalla === 'administracion' ? (
        adminLogueado ? (
          <Administracion onVolver={irAInicio} onLogout={handleLogout} />
        ) : (
          <Login onLogin={handleLogin} />
        )
      ) : pantalla === 'inicio' ? (
        <PantallaInicio onEnter={irAEvento} />
      ) : (
        <TarjetaEvento onVolver={irAInicio} />
      )}
    </>
  );
}

export default App;
