import React from 'react';
import './ModalAlerta.css';

function ModalAlerta({ visible, tipo, titulo, mensaje, onClose }) {
  if (!visible) return null;
  return (
    <div className="modal-alerta-overlay" role="dialog" aria-modal="true">
      <div className={`modal-alerta modal-alerta-${tipo || 'info'}`}> 
        <h3 className="modal-alerta-title">{titulo}</h3>
        <p className="modal-alerta-mensaje">{mensaje}</p>
        <button className="modal-alerta-btn" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}

export default ModalAlerta;
