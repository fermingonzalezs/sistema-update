import React, { useState } from 'react';
import { X, Package } from 'lucide-react';

const NuevaCajaModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    descripcion: '',
    observaciones: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSuccess(form);
    } catch (err) {
      alert('Error al crear la caja: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded border border-slate-200 w-full max-w-md mx-4">
        <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between rounded-t">
          <div className="flex items-center gap-3">
            <Package size={20} />
            <h3 className="text-lg font-semibold">Nueva Caja</h3>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <input
              type="text"
              value={form.descripcion}
              onChange={e => setForm(prev => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Ej: Celulares enero, Notebooks batch 3..."
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
            <textarea
              value={form.observaciones}
              onChange={e => setForm(prev => ({ ...prev, observaciones: e.target.value }))}
              rows={2}
              placeholder="Notas adicionales..."
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:opacity-50 font-medium"
          >
            {isSubmitting ? 'Creando...' : 'Crear Caja'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NuevaCajaModal;
