import React, { useState } from 'react';
import { User, Laptop, X, Wrench } from 'lucide-react';
import ClienteSelector from '../../ventas/components/ClienteSelector';

function ModalNuevaReparacion({ open, onClose, onSave }) {
  const [form, setForm] = useState({
    cliente: null,
    tipo: 'Notebook',
    marca: '',
    modelo: '',
    serial: '',
    accesorios: '',
    problema: '',
    prioridad: 'media',
    observaciones: '',
  });

  if (!open) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleClienteChange = (cliente) => {
    setForm(prev => ({ ...prev, cliente }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.cliente) {
      alert('Debe seleccionar un cliente.');
      return;
    }
    if (!form.problema.trim()) {
      alert('Debe describir el problema reportado.');
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
      <div className="bg-white rounded shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header del Modal */}
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center rounded-t">
          <h2 className="text-lg font-semibold flex items-center gap-3">
            <Laptop className="w-6 h-6 text-slate-300" />
            Nueva Reparación
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Sección Cliente */}
            <div>
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
                <User className="w-5 h-5 text-slate-500" />
                Información del Cliente
              </h3>
              <ClienteSelector
                selectedCliente={form.cliente}
                onSelectCliente={handleClienteChange}
                required
              />
            </div>

            {/* Sección Equipo */}
            <div>
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
                <Laptop className="w-5 h-5 text-slate-500" />
                Información del Equipo
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                  <select name="tipo" value={form.tipo} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition">
                    <option>Notebook</option>
                    <option>PC Escritorio</option>
                    <option>Celular</option>
                    <option>iPhone</option>
                    <option>Tablet</option>
                    <option>Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                  <input type="text" name="marca" value={form.marca} onChange={handleInputChange} placeholder="Ej: Apple, HP, Dell" className="w-full p-2 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                  <input type="text" name="modelo" value={form.modelo} onChange={handleInputChange} placeholder="Ej: MacBook Air M1" className="w-full p-2 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Número de Serie</label>
                  <input type="text" name="serial" value={form.serial} onChange={handleInputChange} placeholder="Opcional" className="w-full p-2 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Accesorios</label>
                  <input type="text" name="accesorios" value={form.accesorios} onChange={handleInputChange} placeholder="Ej: cargador, funda" className="w-full p-2 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" />
                </div>
              </div>
            </div>

            {/* Sección Reparación */}
            <div>
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
                <Wrench className="w-5 h-5 text-slate-500" />
                Detalles de la Reparación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Problema Reportado *</label>
                  <textarea name="problema" value={form.problema} onChange={handleInputChange} required placeholder="Describe el problema principal que reporta el cliente" rows="4" className="w-full p-2 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prioridad</label>
                  <select name="prioridad" value={form.prioridad} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition">
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones Internas</label>
                  <textarea name="observaciones" value={form.observaciones} onChange={handleInputChange} placeholder="Notas adicionales para el técnico (ej: estado estético, contraseñas, etc.)" rows="2" className="w-full p-2 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"></textarea>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer con Botones */}
        <div className="bg-slate-50 p-4 flex justify-end gap-4 border-t border-slate-200 rounded-b">
          <button type="button" onClick={onClose} className="px-6 py-2 rounded bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors">
            Cancelar
          </button>
          <button type="submit" form="reparacion-form" onClick={handleSubmit} className="px-6 py-2 rounded bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors">
            Guardar Reparación
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalNuevaReparacion;
