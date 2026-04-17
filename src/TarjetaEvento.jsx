import { useEffect, useMemo, useState } from 'react';
import './TarjetaEvento.css';
import FooterComuna from './FooterComuna';

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

function TarjetaEvento({ onVolver }) {
  const eventDate = useMemo(() => getNextEventDate(), []);

  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(eventDate));
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(eventDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [eventDate]);

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

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio.';
    }
    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es obligatorio.';
    }
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El telefono es obligatorio.';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Ingresa un email valido.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const response = await fetch('/api/asistencias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          estadoAsistencia: 'pendiente',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'No se pudo guardar tu confirmacion.');
      }

      alert('Asistencia confirmada');
      setFormData({ nombre: '', apellido: '', telefono: '', email: '' });
    } catch (error) {
      alert(error.message || 'Hubo un problema guardando la asistencia. Intenta nuevamente.');
    }
  };

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
            En reconocimiento a tu esfuerzo y dedicación, te invitamos a celebrar el Día del Trabajador junto a nosotros. Será un honor contar con tu presencia en este evento especial.
          </p>

          <div className="evento-meta">
            <p className="mb-0">
              <span className="fw-semibold">Lugar:Predio .......</span>
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
                  <label htmlFor="email" className="form-label evento-label">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={`form-control elegant-input ${errors.email ? 'is-invalid' : ''}`}
                    value={formData.email}
                    onChange={onInputChange}
                  />
                  <div className="invalid-feedback">{errors.email}</div>
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
    </div>
  );
}

export default TarjetaEvento;
