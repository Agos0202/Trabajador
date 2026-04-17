import { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Administracion.css';
import { buildApiUrl, getConexionError } from './api';

const SESION_STORAGE_KEY = 'adminComunaSesion';

const obtenerSeccionDesdeRuta = () => {
  const path = window.location.pathname.toLowerCase();

  if (path === '/administracion/personal') {
    return 'personal';
  }

  if (path === '/administracion/asistencia') {
    return 'asistencia';
  }

  if (path === '/administracion/sorteo') {
    return 'sorteo';
  }

  return 'menu';
};

const obtenerRutaDeSeccion = (seccion) => {
  if (seccion === 'personal') {
    return '/administracion/personal';
  }

  if (seccion === 'asistencia') {
    return '/administracion/asistencia';
  }

  if (seccion === 'sorteo') {
    return '/administracion/sorteo';
  }

  return '/administracion';
};

const cargarLogoComoDataUrl = () => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;

      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('No se pudo procesar el logo.'));
        return;
      }

      context.drawImage(image, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = () => reject(new Error('No se pudo cargar el logo.'));
    image.src = '/logo.PNG';
  });
};

function Administracion({ onVolver }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [logueado, setLogueado] = useState(() => sessionStorage.getItem(SESION_STORAGE_KEY) === 'ok');

  const [asistencias, setAsistencias] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
  });

  const [busqueda, setBusqueda] = useState('');
  const [busquedaAsistencia, setBusquedaAsistencia] = useState('');
  const [crudError, setCrudError] = useState('');
  const [descargandoPdf, setDescargandoPdf] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState(obtenerSeccionDesdeRuta);
  const [fechaActual] = useState(() => new Date());
  const [cantidadSorteos, setCantidadSorteos] = useState('');
  const [resultadosSorteo, setResultadosSorteo] = useState([]);
  const [errorSorteo, setErrorSorteo] = useState('');
  const [sorteoEnCurso, setSorteoEnCurso] = useState(false);
  const [ruletaNombre, setRuletaNombre] = useState('');
  const [ruletaDetalle, setRuletaDetalle] = useState('');

  const totalAsistencias = useMemo(() => asistencias.length, [asistencias]);

  const asistenciasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    if (!termino) {
      return asistencias;
    }

    return asistencias.filter((item) => {
      const texto = `${item.apellido} ${item.nombre} ${item.telefono} ${item.email}`.toLowerCase();
      return texto.includes(termino);
    });
  }, [asistencias, busqueda]);

  const asistenciasEventoFiltradas = useMemo(() => {
    const termino = busquedaAsistencia.trim().toLowerCase();

    if (!termino) {
      return asistencias;
    }

    return asistencias.filter((item) => {
      const texto = `${item.apellido} ${item.nombre} ${item.telefono} ${item.email}`.toLowerCase();
      return texto.includes(termino);
    });
  }, [asistencias, busquedaAsistencia]);

  const presentesSorteo = useMemo(() => {
    return asistencias.filter((item) => item.estadoAsistencia === 'presente');
  }, [asistencias]);

  useEffect(() => {
    const cargarAsistencias = async () => {
      if (!logueado) {
        return;
      }

      try {
        const response = await fetch(buildApiUrl('/api/asistencias'));
        if (!response.ok) {
          throw new Error('No se pudo cargar el listado.');
        }

        const data = await response.json();
        setAsistencias(Array.isArray(data) ? data : []);
      } catch (error) {
        setCrudError(error.message || getConexionError());
      }
    };

    cargarAsistencias();
  }, [logueado]);

  useEffect(() => {
    const onPopState = () => {
      setSeccionActiva(obtenerSeccionDesdeRuta());
    };

    window.addEventListener('popstate', onPopState);
    setSeccionActiva(obtenerSeccionDesdeRuta());

    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const irASeccion = (seccion) => {
    const ruta = obtenerRutaDeSeccion(seccion);
    window.history.pushState({ pantalla: 'administracion', seccion }, '', ruta);
    setSeccionActiva(seccion);
  };

  const onSubmitLogin = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(buildApiUrl('/api/admin/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usuario, password }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Credenciales invalidas.');
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error(getConexionError());
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || getConexionError());
      }

      setLoginError('');
      setLogueado(true);
      sessionStorage.setItem(SESION_STORAGE_KEY, 'ok');
    } catch (error) {
      setLoginError(error.message || getConexionError());
    }
  };

  const onChangeFormulario = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCrudError('');
  };

  const validarFormulario = () => {
    if (!formData.nombre.trim() || !formData.apellido.trim() || !formData.telefono.trim() || !formData.email.trim()) {
      setCrudError('Todos los campos son obligatorios.');
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setCrudError('Ingresa un email valido.');
      return false;
    }

    return true;
  };

  const resetFormulario = () => {
    setFormData({ nombre: '', apellido: '', telefono: '', email: '' });
    setEditandoId(null);
    setCrudError('');
  };

  const onGuardarAsistencia = async (event) => {
    event.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    try {
      const endpoint = editandoId ? buildApiUrl(`/api/asistencias/${editandoId}`) : buildApiUrl('/api/asistencias');
      const method = editandoId ? 'PUT' : 'POST';

      const payload = editandoId
        ? {
            ...formData,
            estadoAsistencia:
              asistencias.find((item) => item.id === editandoId)?.estadoAsistencia || 'pendiente',
          }
        : { ...formData, estadoAsistencia: 'pendiente' };

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'No se pudo guardar la asistencia.');
      }

      const asistencia = await response.json();

      if (editandoId) {
        setAsistencias((prev) => prev.map((item) => (item.id === asistencia.id ? asistencia : item)));
      } else {
        setAsistencias((prev) => [...prev, asistencia]);
      }

      resetFormulario();
    } catch (error) {
      setCrudError(error.message || 'No se pudo guardar la asistencia en Cloudinary.');
    }
  };

  const onEditar = (asistencia) => {
    setEditandoId(asistencia.id);
    setFormData({
      nombre: asistencia.nombre,
      apellido: asistencia.apellido,
      telefono: asistencia.telefono,
      email: asistencia.email,
    });
    irASeccion('personal');
  };

  const onEliminar = async (id) => {
    try {
      const response = await fetch(buildApiUrl(`/api/asistencias/${id}`), {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'No se pudo eliminar la asistencia.');
      }

      setAsistencias((prev) => prev.filter((item) => item.id !== id));
      if (editandoId === id) {
        resetFormulario();
      }
    } catch (error) {
      setCrudError(error.message || 'No se pudo eliminar la asistencia en Cloudinary.');
    }
  };

  const onCambiarEstadoAsistencia = async (asistencia, estadoAsistencia) => {
    try {
      let response = await fetch(buildApiUrl(`/api/asistencias/${asistencia.id}/estado`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estadoAsistencia,
        }),
      });

      if (response.status === 404 || response.status === 405) {
        response = await fetch(buildApiUrl(`/api/asistencias/${asistencia.id}`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombre: asistencia.nombre,
            apellido: asistencia.apellido,
            telefono: asistencia.telefono,
            email: asistencia.email,
            estadoAsistencia,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'No se pudo actualizar la asistencia al evento.');
      }

      const actualizada = await response.json();
      setAsistencias((prev) => prev.map((item) => (item.id === actualizada.id ? actualizada : item)));
    } catch (error) {
      setCrudError(error.message || 'No se pudo actualizar la asistencia al evento.');
    }
  };

  const onCerrarSesion = () => {
    setLogueado(false);
    setUsuario('');
    setPassword('');
    setLoginError('');
    sessionStorage.removeItem(SESION_STORAGE_KEY);
  };

  const onDescargarPdf = async () => {
    if (asistenciasFiltradas.length === 0 || descargandoPdf) {
      return;
    }

    setDescargandoPdf(true);

    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const colorPrimario = [32, 78, 53];
      const colorSecundario = [231, 244, 230];
      const colorTextoSuave = [75, 94, 84];

      doc.setFillColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
      doc.rect(0, 0, pageWidth, 90, 'F');

      try {
        const logoDataUrl = await cargarLogoComoDataUrl();
        doc.addImage(logoDataUrl, 'PNG', 36, 18, 56, 56);
      } catch (error) {
        // Si el logo falla, el PDF se genera igual.
      }

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text('Listado Fiesta Dia del Trabajador', 102, 42);
      doc.setFontSize(11);
      doc.text(`Generado: ${new Date().toLocaleString('es-AR')}`, 102, 62);

      autoTable(doc, {
        startY: 110,
        head: [['N°', 'Apellido', 'Nombre', 'Telefono', 'Mail']],
        body: asistenciasFiltradas.map((item, index) => [
          index + 1,
          item.apellido,
          item.nombre,
          item.telefono,
          item.email,
        ]),
        theme: 'grid',
        headStyles: {
          fillColor: colorPrimario,
          textColor: [255, 255, 255],
        },
        alternateRowStyles: {
          fillColor: colorSecundario,
        },
        styles: {
          fontSize: 10,
          textColor: colorTextoSuave,
        },
      });

      doc.save('listado_fiesta_dia_del_trabajador.pdf');
    } finally {
      setDescargandoPdf(false);
    }
  };

  const esperar = (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

  const onGenerarSorteo = async () => {
    setErrorSorteo('');
    setResultadosSorteo([]);

    const totalPresentes = presentesSorteo.length;
    const cantidad = Number.parseInt(cantidadSorteos, 10);

    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      setErrorSorteo('Ingresa una cantidad de sorteos valida.');
      return;
    }

    if (totalPresentes === 0) {
      setErrorSorteo('No hay presentes para sortear.');
      return;
    }

    if (cantidad > totalPresentes) {
      setErrorSorteo('La cantidad de sorteos no puede superar la cantidad de presentes.');
      return;
    }

    setSorteoEnCurso(true);

    try {
      const resultados = [];

      for (let i = 0; i < cantidad; i += 1) {
        const inicio = Math.floor((i * totalPresentes) / cantidad);
        const fin = Math.floor(((i + 1) * totalPresentes) / cantidad);
        const rango = presentesSorteo.slice(inicio, fin);

        if (rango.length === 0) {
          continue;
        }

        setRuletaDetalle(`Sorteo ${i + 1} - Rango ${inicio + 1} a ${fin}`);

        const vueltas = 18 + Math.floor(Math.random() * 8);
        for (let paso = 0; paso < vueltas; paso += 1) {
          const candidato = rango[paso % rango.length];
          setRuletaNombre(`${candidato.apellido}, ${candidato.nombre}`);
          await esperar(70 + paso * 6);
        }

        const indiceGanador = Math.floor(Math.random() * rango.length);
        const ganador = rango[indiceGanador];
        setRuletaNombre(`${ganador.apellido}, ${ganador.nombre}`);
        await esperar(500);

        resultados.push({
          sorteoNumero: i + 1,
          rangoDesde: inicio + 1,
          rangoHasta: fin,
          ganador,
        });
      }

      setResultadosSorteo(resultados);
    } finally {
      setSorteoEnCurso(false);
    }
  };

  if (!logueado) {
    return (
      <main className="admin-page">
        <section className="admin-card">
          <h1 className="admin-title">Administracion</h1>
          <p className="admin-subtitle">Ingresa con tus credenciales para gestionar asistentes.</p>

          <form onSubmit={onSubmitLogin} className="admin-form" noValidate>
            <label htmlFor="usuario" className="admin-label">Usuario</label>
            <input
              id="usuario"
              name="usuario"
              type="text"
              className="admin-input"
              value={usuario}
              onChange={(event) => setUsuario(event.target.value)}
            />

            <label htmlFor="password" className="admin-label">Contrasena</label>
            <input
              id="password"
              name="password"
              type="password"
              className="admin-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            {loginError ? <p className="admin-error">{loginError}</p> : null}

            <button type="submit" className="admin-button primary">Ingresar</button>
            <button type="button" className="admin-button secondary" onClick={onVolver}>Volver al inicio</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <section className="admin-panel">
        <header className="admin-header">
          <nav className="admin-topbar" aria-label="Navegacion principal administracion">
            <button
              type="button"
              className="admin-top-icon"
              onClick={() => irASeccion('menu')}
              aria-label="Ir al dashboard"
            >
              ⌂
            </button>

            <p className="admin-topbar-title">Comuna La Florida y Luisiana</p>

            <button
              type="button"
              className="admin-top-icon danger"
              onClick={onCerrarSesion}
              aria-label="Cerrar sesion"
            >
              ⏻
            </button>
          </nav>
        </header>

        <section className="admin-route-shell">
          {seccionActiva === 'menu' ? (
            <>
              <div className="admin-dashboard-welcome">
                <h2 className="admin-dashboard-title">
                  Bienvenido, <span>{usuario || 'Administrador'}</span>
                </h2>
                <p className="admin-dashboard-subtitle">Panel de control principal · Fiesta Dia del Trabajador</p>
              </div>

              <h3 className="admin-modules-title">
                <span className="admin-modules-mark" />
                Modulos del sistema
              </h3>

              <div className="admin-route-grid">
                <article className="admin-route-card">
                  <div className="admin-route-card-bg" />
                  <div className="admin-route-head">
                    <span className="admin-route-tag">PERSONAL</span>
                  </div>
                  <h2 className="admin-route-title">Personal Invitado</h2>
                  <p className="admin-route-text">Alta, edicion y listado completo de invitados al evento.</p>
                  <button type="button" className="admin-route-arrow" onClick={() => irASeccion('personal')}>
                    Ingresar
                  </button>
                </article>

                <article className="admin-route-card">
                  <div className="admin-route-card-bg" />
                  <div className="admin-route-head">
                    
                    <span className="admin-route-tag">ASISTENCIA</span>
                  </div>
                  <h2 className="admin-route-title">Asistencia al evento</h2>
                  <p className="admin-route-text">Buscador y marcado de invitadas e invitados por estado.</p>
                  <button type="button" className="admin-route-arrow" onClick={() => irASeccion('asistencia')}>
                    Ingresar
                  </button>
                </article>

                <article className="admin-route-card">
                  <div className="admin-route-card-bg" />
                  <div className="admin-route-head">
                    
                    <span className="admin-route-tag">SORTEO</span>
                  </div>
                  <h2 className="admin-route-title">Sorteo</h2>
                  <p className="admin-route-text">Listado de presentes para realizar sorteos del evento.</p>
                  <button type="button" className="admin-route-arrow" onClick={() => irASeccion('sorteo')}>
                    Ingresar
                  </button>
                </article>
              </div>

              <div className="admin-dashboard-footer">
                <span>Fiesta del Trabajador · Administracion</span>
                <span>Ultima actualizacion: {fechaActual.toLocaleString('es-AR')}</span>
              </div>
            </>
          ) : null}

          {seccionActiva === 'personal' ? (
            <article className="admin-card">
              <h2 className="admin-section-title">Personal Invitado</h2>
              <p className="admin-subtitle">Total de asistencias confirmadas: {totalAsistencias}</p>

              <h3 className="admin-subcard-title">{editandoId ? 'Editar asistencia' : 'Nueva asistencia'}</h3>
              <form className="admin-form" onSubmit={onGuardarAsistencia} noValidate>
                <label htmlFor="nombre" className="admin-label">Nombre</label>
                <input id="nombre" name="nombre" type="text" className="admin-input" value={formData.nombre} onChange={onChangeFormulario} />

                <label htmlFor="apellido" className="admin-label">Apellido</label>
                <input id="apellido" name="apellido" type="text" className="admin-input" value={formData.apellido} onChange={onChangeFormulario} />

                <label htmlFor="telefono" className="admin-label">Telefono</label>
                <input id="telefono" name="telefono" type="tel" className="admin-input" value={formData.telefono} onChange={onChangeFormulario} />

                <label htmlFor="email" className="admin-label">Email</label>
                <input id="email" name="email" type="email" className="admin-input" value={formData.email} onChange={onChangeFormulario} />

                {crudError ? <p className="admin-error">{crudError}</p> : null}

                <button type="submit" className="admin-button primary">{editandoId ? 'Guardar cambios' : 'Agregar asistencia'}</button>
                <button type="button" className="admin-button secondary" onClick={resetFormulario}>Limpiar</button>
              </form>

              <div className="admin-subcard-header">
                <h3 className="admin-subcard-title">Lista de invitados</h3>
                <div className="admin-header-actions">
                  <input
                    type="text"
                    className="admin-input admin-search-input"
                    placeholder="Buscar por apellido, nombre, telefono o mail"
                    value={busqueda}
                    onChange={(event) => setBusqueda(event.target.value)}
                  />
                  <button
                    type="button"
                    className="admin-button primary"
                    onClick={onDescargarPdf}
                    disabled={asistenciasFiltradas.length === 0 || descargandoPdf}
                  >
                    {descargandoPdf ? 'Generando PDF...' : 'Descargar PDF'}
                  </button>
                </div>
              </div>

              {asistenciasFiltradas.length === 0 ? (
                <p className="admin-empty">
                  {asistencias.length === 0 ? 'No hay asistencias confirmadas todavia.' : 'No hay resultados para la busqueda actual.'}
                </p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>N°</th>
                        <th>Apellido</th>
                        <th>Nombre</th>
                        <th>Telefono</th>
                        <th>Mail</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asistenciasFiltradas.map((asistencia, index) => (
                        <tr key={asistencia.id}>
                          <td>{index + 1}</td>
                          <td>{asistencia.apellido}</td>
                          <td>{asistencia.nombre}</td>
                          <td>{asistencia.telefono}</td>
                          <td>{asistencia.email}</td>
                          <td className="admin-actions-cell">
                            <button type="button" className="admin-inline-btn edit" onClick={() => onEditar(asistencia)}>Editar</button>
                            <button type="button" className="admin-inline-btn delete" onClick={() => onEliminar(asistencia.id)}>Eliminar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          ) : null}

          {seccionActiva === 'asistencia' ? (
            <article className="admin-card admin-mini-card">
              <h2 className="admin-section-title">Asistencia al evento</h2>

              <input
                type="text"
                className="admin-input admin-search-input"
                placeholder="Buscar invitado para marcar asistencia"
                value={busquedaAsistencia}
                onChange={(event) => setBusquedaAsistencia(event.target.value)}
              />

              {asistenciasEventoFiltradas.length === 0 ? (
                <p className="admin-mini-text">No hay invitados para mostrar.</p>
              ) : (
                <div className="admin-asistencia-list">
                  {asistenciasEventoFiltradas.map((item) => (
                    <div className="admin-asistencia-row" key={`asistencia-${item.id}`}>
                      <div>
                        <p className="admin-mini-text admin-person-name">{item.apellido}, {item.nombre}</p>
                        <p className="admin-status-text">
                          Estado: {item.estadoAsistencia === 'presente' ? 'Presente' : item.estadoAsistencia === 'ausente' ? 'Ausente' : 'Pendiente'}
                        </p>
                      </div>
                      <div className="admin-asistencia-actions">
                        <button
                          type="button"
                          className={`admin-inline-btn present ${item.estadoAsistencia === 'presente' ? 'active' : ''}`}
                          onClick={() => onCambiarEstadoAsistencia(item, 'presente')}
                        >
                          Presente
                        </button>
                        <button
                          type="button"
                          className={`admin-inline-btn absent ${item.estadoAsistencia === 'ausente' ? 'active' : ''}`}
                          onClick={() => onCambiarEstadoAsistencia(item, 'ausente')}
                        >
                          Ausente
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ) : null}

          {seccionActiva === 'sorteo' ? (
            <article className="admin-card admin-mini-card">
              <h2 className="admin-section-title">Sorteo</h2>
              <p className="admin-subtitle">Participantes presentes: {presentesSorteo.length}</p>

              <div className={`admin-ruleta ${sorteoEnCurso ? 'is-spinning' : ''}`}>
                <p className="admin-ruleta-detail">{ruletaDetalle || 'Configura la cantidad y genera la ruleta por rangos'}</p>
                <p className="admin-ruleta-name">{ruletaNombre || 'Esperando sorteo...'}</p>
              </div>

              <div className="admin-sorteo-controls">
                <label htmlFor="cantidadSorteos" className="admin-label">Cantidad de sorteos</label>
                <div className="admin-sorteo-actions">
                  <input
                    id="cantidadSorteos"
                    type="number"
                    min="1"
                    className="admin-input"
                    value={cantidadSorteos}
                    onChange={(event) => setCantidadSorteos(event.target.value)}
                    placeholder="Ej: 7"
                  />
                  <button
                    type="button"
                    className="admin-button primary"
                    onClick={onGenerarSorteo}
                    disabled={sorteoEnCurso}
                  >
                    {sorteoEnCurso ? 'Girando ruleta...' : 'Generar sorteo'}
                  </button>
                </div>
              </div>

              {errorSorteo ? <p className="admin-error">{errorSorteo}</p> : null}

              {presentesSorteo.length === 0 ? (
                <p className="admin-mini-text">Aun no hay personas marcadas como presentes.</p>
              ) : (
                <ul className="admin-sorteo-list">
                  {presentesSorteo.map((item, index) => (
                    <li key={`sorteo-${item.id}`} className="admin-sorteo-item">
                      <span>{index + 1}. {item.apellido}, {item.nombre}</span>
                    </li>
                  ))}
                </ul>
              )}

              {resultadosSorteo.length > 0 ? (
                <div className="admin-sorteo-results">
                  <h3 className="admin-subcard-title">Ganadores por rango</h3>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Sorteo</th>
                          <th>Rango</th>
                          <th>Ganador</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultadosSorteo.map((resultado) => (
                          <tr key={`resultado-${resultado.sorteoNumero}`}>
                            <td>{resultado.sorteoNumero}</td>
                            <td>{resultado.rangoDesde} a {resultado.rangoHasta}</td>
                            <td>{resultado.ganador.apellido}, {resultado.ganador.nombre}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </article>
          ) : null}
        </section>
      </section>
    </main>
  );
}

export default Administracion;
