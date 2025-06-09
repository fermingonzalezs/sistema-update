import React, { useState } from 'react';
import { User, Phone, Mail, Laptop, X, ChevronDown, ChevronUp, Wrench } from 'lucide-react';
import ClienteSelector from '../../ventas/components/ClienteSelector';

function ModalNuevaReparacion({ open, onClose, onSave }) {
  const [form, setForm] = useState({
    cliente: null, // objeto cliente seleccionado
    tipo: 'Notebook',
    marca: '',
    modelo: '',
    serial: '',
    accesorios: '',
    problema: '',
    prioridad: 'media', // Valor por defecto corregido
    observaciones: '',
  });
  const [expand, setExpand] = useState(true);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-0 md:p-8 relative animate-fadeIn">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">
          <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-2xl font-bold text-orange-700 mb-6 flex items-center gap-2">
          <Laptop className="w-6 h-6" /> 
          Nueva Reparación
        </h2>
        
        <form 
          className="grid grid-cols-1 md:grid-cols-2 gap-6" 
          onSubmit={e => { 
            e.preventDefault(); 
            onSave(form); 
          }}
        >
          {/* Cliente */}
          <div className="col-span-full">
            <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-orange-600" /> 
              Cliente
            </h3>
            <div>
              <ClienteSelector
                selectedCliente={form.cliente}
                onSelectCliente={cliente => setForm(f => ({ ...f, cliente }))}
                required
              />
            </div>
          </div>

          {/* Equipo */}
          <div className="col-span-full">
            <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Laptop className="w-5 h-5 text-orange-600" /> 
              Equipo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select 
                  name="tipo" 
                  value={form.tipo} 
                  onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Notebook">Notebook</option>
                  <option value="PC ESCRITORIO">PC ESCRITORIO</option>
                  <option value="CELULAR">CELULAR</option>
                  <option value="iPhone">iPhone</option>
                  <option value="Desktop">Desktop</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                <input 
                  type="text" 
                  name="marca" 
                  value={form.marca} 
                  onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="ej: Apple, HP, Dell"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                <input 
                  type="text" 
                  name="modelo" 
                  value={form.modelo} 
                  onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="ej: MacBook Air M1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Serial</label>
                <input 
                  type="text" 
                  name="serial" 
                  value={form.serial} 
                  onChange={e => setForm(f => ({ ...f, serial: e.target.value }))} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Número de serie"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accesorios</label>
                <input 
                  type="text" 
                  name="accesorios" 
                  value={form.accesorios} 
                  onChange={e => setForm(f => ({ ...f, accesorios: e.target.value }))} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="ej: cargador, mouse, funda"
                />
              </div>
            </div>
          </div>

          {/* Reparación */}
          <div className="col-span-full">
            <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-orange-600" /> 
              Reparación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Problema reportado *
                </label>
                <textarea
                  required 
                  name="problema" 
                  value={form.problema} 
                  onChange={e => setForm(f => ({ ...f, problema: e.target.value }))} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" 
                  placeholder="Describe el problema principal"
                  rows="3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                <select 
                  name="prioridad" 
                  value={form.prioridad} 
                  onChange={e => setForm(f => ({ ...f, prioridad: e.target.value }))} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <textarea
                  name="observaciones" 
                  value={form.observaciones} 
                  onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" 
                  placeholder="Notas adicionales"
                  rows="2"
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="col-span-full flex justify-end mt-6 gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold shadow hover:from-orange-700 hover:to-red-700 transition-all"
            >
              Guardar Reparación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalNuevaReparacion;