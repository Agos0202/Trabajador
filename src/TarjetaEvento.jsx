import { useEffect, useMemo, useState } from 'react';
import './TarjetaEvento.css';
import FooterComuna from './FooterComuna';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';

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

  const [timeLeft, setTimeLeft] = useState(getTimeLeft(eventDate));
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
});
const [guardando, setGuardando] = useState(false);
  // ⏱ contador
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(eventDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [eventDate]);

  // 🔥 cargar DNIs UNA sola vez
  useEffect(() => {
    const cargarDnis = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'asistencias'));
        const lista = snapshot.docs.map(doc =>
          normalizarDni(doc.data()?.dni)
        );
        setDnisRegistrados(lista);
      } catch (e) {
        console.error("Error cargando DNIs", e);
      }
    };

    cargarDnis();
  }, []);

  const onInputChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    if (!formData.apellido.trim()) newErrors.apellido = 'El apellido es obligatorio';
    if (!formData.telefono.trim()) newErrors.telefono = 'El teléfono es obligatorio';
    if (!formData.dni.trim()) newErrors.dni = 'El DNI es obligatorio';

    // Validar que el DNI no esté repetido
    const dniNormalizado = normalizarDni(formData.dni);
    if (dniNormalizado && dnisRegistrados.includes(dniNormalizado)) {
      newErrors.dni = 'Ya existe una persona registrada con este DNI';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (guardando) return;

    if (!validateForm()) {
      setModalAlerta({
        visible: true,
        tipo: 'error',
        titulo: 'Error',
        mensaje: 'Por favor completá todos los campos obligatorios y asegurate de que el DNI no esté repetido.'
      });
      return;
    }

    setGuardando(true);
    const dniNormalizado = normalizarDni(formData.dni);

    try {
      // Obtener el mayor número de sorteo existente
      const q = query(collection(db, 'asistencias'), orderBy('numeroSorteo', 'desc'));
      const snapshot = await getDocs(q);
      let numeroSorteo = 1;
      if (!snapshot.empty) {
        const max = snapshot.docs[0].data().numeroSorteo;
        numeroSorteo = (typeof max === 'number' && max > 0) ? max + 1 : 1;
      }

      // 💾 guardar
      await addDoc(collection(db, 'asistencias'), {
        ...formData,
        dni: dniNormalizado,
        estadoAsistencia: 'pendiente',
        createdAt: new Date(),
        numeroSorteo
      });

      setModalAlerta({
        visible: true,
        tipo: 'success',
        titulo: 'Registro exitoso',
        mensaje: '¡Asistencia confirmada!',
        numeroSorteo
      });

      // actualizar lista local
      setDnisRegistrados(prev => [...prev, dniNormalizado]);

      // limpiar form
      setFormData({
        nombre: '',
        apellido: '',
        telefono: '',
        dni: ''
      });

    } catch (error) {
      setModalAlerta({
        visible: true,
        tipo: 'error',
        titulo: 'Error',
        mensaje: error.message
      });
    } finally {
      setGuardando(false);
    }
  };

  const cerrarModal = () => {
    setModalAlerta(prev => ({ ...prev, visible: false }));
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
            En reconocimiento a tu esfuerzo y dedicación, te invitamos a celebrar el Día del Trabajador junto a nosotros compartiendo un rico locro criollo entre amigos.<br />Será un honor contar con tu presencia en este evento especial.
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
          <form className="form-shell" onSubmit={onSubmit} autoComplete="off">
            <h2 className="form-title">Confirmar asistencia</h2>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.2rem',
              marginBottom: '1.2rem',
              maxWidth: '600px',
              width: '100%',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="form-label evento-label" htmlFor="nombre">Nombre</label>
                <input
                  id="nombre"
                  name="nombre"
                  className="elegant-input"
                  placeholder="Nombre"
                  value={formData.nombre}
                  onChange={onInputChange}
                  autoComplete="off"
                />
                {errors.nombre && <p className="form-error">{errors.nombre}</p>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="form-label evento-label" htmlFor="apellido">Apellido</label>
                <input
                  id="apellido"
                  name="apellido"
                  className="elegant-input"
                  placeholder="Apellido"
                  value={formData.apellido}
                  onChange={onInputChange}
                  autoComplete="off"
                />
                {errors.apellido && <p className="form-error">{errors.apellido}</p>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="form-label evento-label" htmlFor="telefono">Teléfono</label>
                <input
                  id="telefono"
                  name="telefono"
                  className="elegant-input"
                  placeholder="Teléfono"
                  value={formData.telefono}
                  onChange={onInputChange}
                  autoComplete="off"
                />
                {errors.telefono && <p className="form-error">{errors.telefono}</p>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="form-label evento-label" htmlFor="dni">DNI</label>
                <input
                  id="dni"
                  name="dni"
                  className="elegant-input"
                  placeholder="DNI"
                  value={formData.dni}
                  onChange={onInputChange}
                  autoComplete="off"
                />
                {errors.dni && <p className="form-error">{errors.dni}</p>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center' }}>
              <button type="submit" className="btn-confirmar" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Confirmar'}
              </button>
              <button type="button" className="btn-volver" onClick={onVolver}>Volver</button>
            </div>
          </form>
          <p className="evento-subtitle">
            Exclusivo para trabajadores de la Comuna La Florida y Luisiana.
          </p>
        </div>
      </main>
      <FooterComuna />
      {/* Modal de alerta elegante */}
      {modalAlerta.visible && (
        <div className="modal-alerta-overlay">
          <div className="modal-alerta-contenido">
            <div className={`modal-alerta-header modal-alerta-header-${modalAlerta.tipo === 'success' ? 'success' : 'error'}`}> 
              <div className={`modal-alerta-icono ${modalAlerta.tipo === 'success' ? 'modal-alerta-icon-success' : 'modal-alerta-icon-error'}`}>{modalAlerta.tipo === 'success' ? '✔' : '✖'}</div>
              <h2 className="modal-alerta-titulo">{modalAlerta.titulo}</h2>
            </div>
            <div className="modal-alerta-cuerpo">
              <p className="modal-alerta-mensaje">{modalAlerta.mensaje}</p>
              <p className="modal-alerta-mensaje">Tu numero de sorteo es:</p>
              {modalAlerta.tipo === 'success' && modalAlerta.numeroSorteo && (
                <>
                  <div className="modal-alerta-numero">{modalAlerta.numeroSorteo}</div>
                  <div style={{ color: '#c2372f', fontWeight: 700, marginTop: '1rem', textAlign: 'center' }}>
                    ¡No te olvides de sacar captura para participar ese día!
                  </div>
                  <div className="modal-alerta-recordatorio">
                    Recuerda que los ganadores deben estar presente en el momento del sorteo.
                  </div>
                </>
              )}
            </div>
            <div className="modal-alerta-acciones">
              <button className="modal-alerta-boton" onClick={cerrarModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TarjetaEvento;