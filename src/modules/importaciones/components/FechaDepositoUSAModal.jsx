import React, { useState } from 'react';
import { X } from 'lucide-react';
import { obtenerFechaLocal } from '../../../shared/utils/formatters';

const FechaDepositoUSAModal = ({ recibo, onClose, onConfirm, isSubmitting }) => {
  const [fecha, setFecha] = useState(obtenerFechaLocal());

  const handleConfirm = () => {
    if (!fecha) {
      alert('Por favor selecciona una fecha');
      return;
    }
    onConfirm(fecha);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded border border-slate-200 max-w-md w-full">
        {/* HEADER */}
        <div className="p-6 bg-slate-800 text-white flex justify-between items-center">
          <h3 className="text-lg font-semibold">Fecha de Ingreso a Depósito USA</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white" disabled={isSubmitting}>
            <X size={24} />
          </button>
        </div>

        {/* CONTENIDO */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Recibo: {recibo.numero_recibo}</label>
            <p className="text-xs text-slate-500">Selecciona la fecha en que la importación llegó al depósito USA</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Fecha *</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              disabled={isSubmitting}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* BOTONES */}
        <div className="flex gap-3 justify-end p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded transition-colors"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Procesando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FechaDepositoUSAModal;
