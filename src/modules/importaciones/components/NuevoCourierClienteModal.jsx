import React, { useState } from 'react';
import { X, Truck } from 'lucide-react';
import EmpresaLogisticaSelector from './EmpresaLogisticaSelector';
import { useImportaciones } from '../hooks/useImportaciones';
import { obtenerFechaArgentina } from '../../../shared/config/timezone';
import ClienteSelector from '../../ventas/components/ClienteSelector';

const NuevoCourierClienteModal = ({ onClose, onSuccess }) => {
  const { crearCourierCliente } = useImportaciones();

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [form, setForm] = useState({
    empresa_logistica: '',
    tracking_number: '',
    descripcion: '',
    fecha: obtenerFechaArgentina(),
    observaciones: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!clienteSeleccionado) {
      alert('El cliente es obligatorio');
      return;
    }
    if (!form.descripcion.trim()) {
      alert('La descripción del servicio es obligatoria');
      return;
    }
    setIsSubmitting(true);
    try {
      await crearCourierCliente({ ...form, cliente_id: clienteSeleccionado.id });
      onSuccess();
    } catch (err) {
      alert('Error al crear el servicio: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded border border-slate-300 w-full max-w-lg mx-4">
        {/* Header */}
        <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between rounded-t">
          <div className="flex items-center gap-3">
            <Truck size={20} />
            <div>
              <h3 className="text-lg font-semibold">Servicio de Courier</h3>
              <p className="text-slate-300 text-xs mt-0.5">A cargo del cliente</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Cliente <span className="text-red-500">*</span>
            </label>
            <ClienteSelector
              selectedCliente={clienteSeleccionado}
              onSelectCliente={setClienteSeleccionado}
              required={true}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descripción del Servicio <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.descripcion}
              onChange={e => handleChange('descripcion', e.target.value)}
              rows={3}
              placeholder="Ej: Courier para compra personal de iPhone 15, aprox 2kg..."
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
              <input
                type="date"
                value={form.fecha}
                onChange={e => handleChange('fecha', e.target.value)}
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tracking Number</label>
              <input
                type="text"
                value={form.tracking_number}
                onChange={e => handleChange('tracking_number', e.target.value)}
                placeholder="Número de seguimiento"
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Empresa Logística</label>
            <EmpresaLogisticaSelector
              value={form.empresa_logistica}
              onChange={val => handleChange('empresa_logistica', val)}
            />
          </div>
        </div>

        {/* Footer */}
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
            {isSubmitting ? 'Guardando...' : 'Registrar Servicio'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NuevoCourierClienteModal;
