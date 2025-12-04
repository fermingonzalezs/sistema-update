import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useProveedores } from '../hooks/useProveedores';

const NuevoProveedorModal = ({ onClose, onSuccess }) => {
  const { crearProveedor } = useProveedores();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    pais: '',
    direccion: '',
    barrio: ''
  });

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) {
      alert('El nombre del proveedor es obligatorio');
      return;
    }

    setIsSubmitting(true);
    try {
      const proveedorCreado = await crearProveedor(formData);
      alert('✅ Proveedor creado exitosamente');
      onSuccess(proveedorCreado);
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded border border-slate-200 max-w-md w-full">
        {/* HEADER */}
        <div className="p-6 bg-slate-800 text-white flex justify-between items-center">
          <h3 className="text-lg font-semibold">Nuevo Proveedor</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white" disabled={isSubmitting}>
            <X size={24} />
          </button>
        </div>

        {/* CONTENIDO */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Nombre del proveedor"
              disabled={isSubmitting}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@ejemplo.com"
              disabled={isSubmitting}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
            <input
              type="text"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              placeholder="Teléfono"
              disabled={isSubmitting}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">País</label>
            <input
              type="text"
              value={formData.pais}
              onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
              placeholder="País"
              disabled={isSubmitting}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Dirección"
              disabled={isSubmitting}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Barrio</label>
            <input
              type="text"
              value={formData.barrio}
              onChange={(e) => setFormData({ ...formData, barrio: e.target.value })}
              placeholder="Barrio"
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
            onClick={handleSubmit}
            className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creando...' : 'Crear Proveedor'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NuevoProveedorModal;
