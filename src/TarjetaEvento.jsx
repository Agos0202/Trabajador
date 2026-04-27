import { useEffect, useMemo, useState } from 'react';
import './TarjetaEvento.css';
import FooterComuna from './FooterComuna';
import { buildApiUrl, getConexionError } from './api';

const getNextEventDate = () => {
  return new Date(2026, 4, 9, 12, 0, 0);
};

const getTimeLeft = (targetDate) => {
  const difference = targetDate.getTime() - new Date().getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};

const normalizarDni = (value) => {
  return String(value ?? '').replace(/\D/g, '');
};

function TarjetaEvento({ onVolver }) {
  const eventDate = useMemo(() => getNextEventDate(), []);

  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(eventDate));
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    dni: '',
  });
  const [errors, setErrors] = useState({});
  const [dnisRegistrados, setDnisRegistrados] = useState([]);
  const [modalAlerta, setModalAlerta] = useState({
    visible: false,
    tipo: 'info',
    titulo: '',
    mensaje: '',
    numeroSorteo: null,
    recordatorio: '',
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(eventDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [eventDate]);

  useEffect(() => {
    const cargarDnisRegistrados = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/asistencias'));
        if (!response.ok) {
          return;
        }

        const asistentes = await response.json();
        if (!Array.isArray(asistentes)) {
          return;
        }

        const dnis = asistentes
          .map((item) => normalizarDni(item?.dni ?? item?.email))
          .filter(Boolean);

        setDnisRegistrados(Array.from(new Set(dnis)));
      } catch (error) {
        // Si falla la carga inicial, la validacion fuerte queda en backend.
      }
    };

    cargarDnisRegistrados();
  }, []);

  const onInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    setErrors({});
    return true;
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const dniNormalizado = normalizarDni(formData.dni);

    try {
      if (dnisRegistrados.includes(dniNormalizado)) {
        throw new Error('Ya te encuentras registrado/a');
      }

      const existentesResponse = await fetch(buildApiUrl('/api/asistencias'));
      if (existentesResponse.ok) {
        const existentes = await existentesResponse.json().catch(() => []);
        const yaRegistrado = Array.isArray(existentes)
          && existentes.some((item) => normalizarDni(item?.dni ?? item?.email) === dniNormalizado);

        if (yaRegistrado) {
          throw new Error('Ya te encuentras registrado/a');
        }
      }

      const response = await fetch(buildApiUrl('/api/asistencias'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          dni: dniNormalizado,
          email: dniNormalizado,
          estadoAsistencia: 'pendiente',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'No se pudo guardar tu confirmacion.');
      }

      const data = await response.json();
      const numeroLista = Number.parseInt(data?.numeroSorteo ?? data?.numeroLista, 10);

      setModalAlerta({
        visible: true,
        tipo: 'success',
        titulo: 'Registro exitoso',
        mensaje: Number.isFinite(numeroLista) ? 'Tu número del sorteo es' : 'Asistencia confirmada.',
        numeroSorteo: Number.isFinite(numeroLista) ? numeroLista : null,
        recordatorio: Number.isFinite(numeroLista)
          ? 'No te olvides de sacar captura para participar ese dia. Recuerda que los ganadores deben estar presente en el momento del sorteo.'
          : '',
      });
      setDnisRegistrados((prev) => (prev.includes(dniNormalizado) ? prev : [...prev, dniNormalizado]));
      setFormData({ nombre: '', apellido: '', telefono: '', dni: '' });
    } catch (error) {
      setModalAlerta({
        visible: true,
        tipo: 'error',
        titulo: 'No se pudo registrar',
        mensaje: error.message || getConexionError(),
        numeroSorteo: null,
        recordatorio: '',
      });
    }
  };

  const cerrarModal = () => {
    setModalAlerta((prev) => ({
      ...prev,
      visible: false,
    }));
  };

  const claseHeaderModal = modalAlerta.tipo === 'success' ? 'modal-alerta-header-success' : 'modal-alerta-header-error';
  const claseIconoModal = modalAlerta.tipo === 'success' ? 'modal-alerta-icon-success' : 'modal-alerta-icon-error';

  const eventDateText = eventDate.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="evento-page">
      <main className="evento-layout">
        <div className="evento-stack">
          <h1 className="evento-title">¡Feliz Día del Trabajador!</h1>
          <div className="evento-divider" aria-hidden="true" />

          <p className="evento-subtitle">
            En reconocimiento a tu esfuerzo y dedicación, te invitamos a celebrar el Día del Trabajador junto a nosotros compartiendo un rico locro criollo entre amigos.
            Será un honor contar con tu presencia en este evento especial.
          </p>

          <div className="evento-meta">
            <p className="mb-0">
              <span className="fw-semibold">Lugar: Transporte SORIANA</span>
            </p>
            <a
              className="evento-place-link"
              href="https://maps.app.goo.gl/8XJZzduTbsrT53BP9"
              target="_blank"
              rel="noreferrer"
            >
              Ver ubicación
            </a>
          </div>

          <div className="evento-bloque-verde">
            <p className="mb-1 evento-bloque-fecha">
              <span className="fw-semibold">El día </span> {eventDateText} - 12:00 hs
            </p>

            <div className="countdown-grid" role="timer" aria-live="polite">
              <div className="countdown-box">
                <div className="countdown-number">{timeLeft.days}</div>
                <small className="countdown-label">Días</small>
              </div>
              <div className="countdown-box">
                <div className="countdown-number">{timeLeft.hours}</div>
                <small className="countdown-label">Horas</small>
              </div>
              <div className="countdown-box">
                <div className="countdown-number">{timeLeft.minutes}</div>
                <small className="countdown-label">Min</small>
              </div>
              <div className="countdown-box">
                <div className="countdown-number">{timeLeft.seconds}</div>
                <small className="countdown-label">Seg</small>
              </div>
            </div>

            <p className="evento-subtitle evento-bloque-subtitle">
              ¡Falta poco para el gran día!   
            </p>
          </div>

           <p className="evento-subtitle">
           Para confirmar tu asistencia, completa el siguiente formulario. ¡Esperamos verte allí para celebrar juntos este día tan especial!
          </p>

          <div className="form-shell">
            <h2 className="form-title">Confirmá tu asistencia</h2>
            <form noValidate onSubmit={onSubmit}>
                <div className="row">
                  <div className="col-12 col-md-6 mb-3">
                    <label htmlFor="nombre" className="form-label evento-label">
                      Nombre
                    </label>
                    <input
                      id="nombre"
                      name="nombre"
                      type="text"
                      className={`form-control elegant-input ${errors.nombre ? 'is-invalid' : ''}`}
                      value={formData.nombre}
                      onChange={onInputChange}
                    />
                    <div className="invalid-feedback">{errors.nombre}</div>
                  </div>

                  <div className="col-12 col-md-6 mb-3">
                    <label htmlFor="apellido" className="form-label evento-label">
                      Apellido
                    </label>
                    <input
                      id="apellido"
                      name="apellido"
                      type="text"
                      className={`form-control elegant-input ${errors.apellido ? 'is-invalid' : ''}`}
                      value={formData.apellido}
                      onChange={onInputChange}
                    />
                    <div className="invalid-feedback">{errors.apellido}</div>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="telefono" className="form-label evento-label">
                    Teléfono
                  </label>
                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    className={`form-control elegant-input ${errors.telefono ? 'is-invalid' : ''}`}
                    value={formData.telefono}
                    onChange={onInputChange}
                  />
                  <div className="invalid-feedback">{errors.telefono}</div>
                </div>

                <div className="mb-3 mt-3">
                  <label htmlFor="dni" className="form-label evento-label">
                    DNI
                  </label>
                  <input
                    id="dni"
                    name="dni"
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    className={`form-control elegant-input ${errors.dni ? 'is-invalid' : ''}`}
                    value={formData.dni}
                    onChange={onInputChange}
                  />
                  <div className="invalid-feedback">{errors.dni}</div>
                </div>

                <button type="submit" className="btn btn-confirmar w-100 mt-3">
                  Confirmar asistencia
                </button>
              </form>

              <button type="button" className="btn btn-volver w-100 mt-2" onClick={onVolver}>
                Volver
              </button>
            </div>
            <p className="evento-subtitle">
           Este evento es solo para trabajadores de nuestro establecimiento.
          </p>
        </div>
      </main>

      <FooterComuna />

      {modalAlerta.visible && (
        <div className="modal-alerta-overlay" role="dialog" aria-modal="true" aria-live="assertive">
          <div className="modal-alerta-contenido">
            <div className={`modal-alerta-header ${claseHeaderModal}`}>
              <div className={`modal-alerta-icono ${claseIconoModal}`}>
                {modalAlerta.tipo === 'success' ? '✓' : '!'}
              </div>
              <h2 className="modal-alerta-titulo">{modalAlerta.titulo}</h2>
            </div>
            <div className="modal-alerta-cuerpo">
              <p className="modal-alerta-mensaje">{modalAlerta.mensaje}</p>
              {modalAlerta.numeroSorteo !== null && (
                <p className="modal-alerta-numero">{modalAlerta.numeroSorteo}</p>
              )}
              {modalAlerta.recordatorio && (
                <p className="modal-alerta-recordatorio">{modalAlerta.recordatorio}</p>
              )}
            </div>
            <div className="modal-alerta-acciones">
              <button type="button" className="btn modal-alerta-boton" onClick={cerrarModal}>
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TarjetaEvento;
