import { useState, useEffect } from 'react';
import PantallaInicio from './PantallaInicio';
import TarjetaEvento from './TarjetaEvento';
import Administracion from './Administracion';

const obtenerPantallaDesdeRuta = () => {
  if (window.location.pathname.startsWith('/administracion')) {
    return 'administracion';
  }

  if (window.location.pathname === '/evento') {
    return 'evento';
  }

  return 'inicio';
};

function App() {
  const [pantalla, setPantalla] = useState(obtenerPantallaDesdeRuta);

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

  return (
    <>
      {pantalla === 'administracion' ? (
        <Administracion onVolver={irAInicio} />
      ) : pantalla === 'inicio' ? (
        <PantallaInicio onEnter={irAEvento} />
      ) : (
        <TarjetaEvento onVolver={irAInicio} />
      )}
    </>
  );
}

export default App;
