import React, { useState } from 'react';
import { X } from 'lucide-react';

const NuevoPesajeModal = ({ nombreInicial = '', crearPesaje, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: nombreInicial,
    peso_kg: ''
  });

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) {
      alert('El nombre del producto es obligatorio');
      return;
    }
    if (!formData.peso_kg || parseFloat(formData.peso_kg) <= 0) {
      alert('Ingresa un peso válido mayor a 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const nuevoPesaje = await crearPesaje({
        nombre: formData.nombre.trim(),
        peso_kg: formData.peso_kg
      });
      onSuccess(nuevoPesaje);
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded border border-slate-300 max-w-sm w-full">
        {/* HEADER */}
        <div className="p-6 bg-slate-800 text-white flex justify-between items-center">
          <h3 className="text-lg font-semibold">Nuevo Producto</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white" disabled={isSubmitting}>
            <X size={24} />
          </button>
        </div>

        {/* CONTENIDO */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del producto *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: iPhone 15 Pro Max"
              autoFocus
              disabled={isSubmitting}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Peso unitario (kg) *</label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={formData.peso_kg}
              onChange={(e) => setFormData({ ...formData, peso_kg: e.target.value })}
              placeholder="0.000"
              disabled={isSubmitting}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
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
            onClick={handleSubmit}
            className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NuevoPesajeModal;
