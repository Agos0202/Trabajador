import { useEffect, useMemo, useState } from 'react';
import './TarjetaEvento.css';
import FooterComuna from './FooterComuna';
import { db } from './firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const dniNormalizado = normalizarDni(formData.dni);

    try {
      // 🚫 validar duplicado LOCAL
      if (dnisRegistrados.includes(dniNormalizado)) {
        throw new Error('Ya te encuentras registrado/a');
      }

      // 💾 guardar
      await addDoc(collection(db, 'asistencias'), {
        ...formData,
        dni: dniNormalizado,
        estadoAsistencia: 'pendiente',
        createdAt: new Date()
      });

      setModalAlerta({
        visible: true,
        tipo: 'success',
        titulo: 'Registro exitoso',
        mensaje: 'Asistencia confirmada'
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

          <p className="evento-subtitle">
            Te invitamos a compartir un locro criollo.
          </p>

          <p><b>Fecha:</b> {eventDateText} - 12:00 hs</p>

          {/* ⏱ contador */}
          <div className="countdown-grid">
            <div>{timeLeft.days} días</div>
            <div>{timeLeft.hours} hs</div>
            <div>{timeLeft.minutes} min</div>
            <div>{timeLeft.seconds} seg</div>
          </div>

          {/* 📋 formulario */}
          <form onSubmit={onSubmit}>

            <input
              name="nombre"
              placeholder="Nombre"
              value={formData.nombre}
              onChange={onInputChange}
            />
            <p>{errors.nombre}</p>

            <input
              name="apellido"
              placeholder="Apellido"
              value={formData.apellido}
              onChange={onInputChange}
            />
            <p>{errors.apellido}</p>

            <input
              name="telefono"
              placeholder="Teléfono"
              value={formData.telefono}
              onChange={onInputChange}
            />
            <p>{errors.telefono}</p>

            <input
              name="dni"
              placeholder="DNI"
              value={formData.dni}
              onChange={onInputChange}
            />
            <p>{errors.dni}</p>

            <button type="submit">Confirmar</button>
          </form>

          <button onClick={onVolver}>Volver</button>

        </div>
      </main>

      <FooterComuna />

      {/* 🔔 modal */}
      {modalAlerta.visible && (
        <div className="modal">
          <h2>{modalAlerta.titulo}</h2>
          <p>{modalAlerta.mensaje}</p>
          <button onClick={cerrarModal}>Cerrar</button>
        </div>
      )}

    </div>
  );
}

export default TarjetaEvento;