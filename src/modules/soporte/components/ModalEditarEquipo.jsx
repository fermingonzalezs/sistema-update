import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import ModalProducto from '../../../shared/components/modals/ModalProducto';

const ModalEditarEquipo = ({ equipo, isOpen, onClose, onSave, modo = 'editar' }) => {
  const [mostrarModalProducto, setMostrarModalProducto] = useState(false);
  const [formData, setFormData] = useState({
    // Campos básicos de testeo
    tipo: '',
    serial: '',
    modelo: '',
    proveedor: '',
    estado_estetico: 'bueno',
    estado_testeo: 'pendiente',
    observaciones: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (equipo) {
      setFormData({
        // Campos básicos de testeo
        tipo: equipo.tipo || '',
        serial: equipo.serial || '',
        modelo: equipo.modelo || '',
        proveedor: equipo.proveedor || '',
        estado_estetico: equipo.estado_estetico || 'bueno',
        estado_testeo: equipo.estado_testeo || 'pendiente',
        observaciones: equipo.observaciones || ''
      });
    }
  }, [equipo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (modo === 'cargar_stock') {
      // Abrir modal unificado para cargar al stock
      setMostrarModalProducto(true);
      return;
    }
    
    setSaving(true);
    
    try {
      // Solo modo editar - actualizar datos básicos de testeo
      const datosTesteo = {
        serial: formData.serial,
        modelo: formData.modelo,
        proveedor: formData.proveedor,
        estado_estetico: formData.estado_estetico,
        estado_testeo: formData.estado_testeo,
        observaciones: formData.observaciones
      };

      const { error } = await supabase
        .from('testeo_equipos')
        .update(datosTesteo)
        .eq('id', equipo.id);

      if (error) throw error;
      
      onSave();
      onClose();
      alert('Equipo actualizado correctamente');
    } catch (err) {
      console.error('Error:', err);
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleProductoGuardado = async () => {
    try {
      // Marcar equipo de testeo como completado
      await supabase
        .from('testeo_equipos')
        .update({ estado_testeo: 'completado' })
        .eq('id', equipo.id);
      
      // Cerrar modales
      setMostrarModalProducto(false);
      onSave();
      onClose();
      alert('Equipo cargado al stock correctamente');
    } catch (err) {
      console.error('Error marcando equipo como completado:', err);
      alert('Error: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">
              {modo === 'cargar_stock' ? 'Cargar Equipo al Stock' : 'Editar Datos de Testeo'}
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {modo === 'editar' ? (
            // Modo editar: solo campos básicos de testeo
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Número de Serie
                  </label>
                  <input
                    type="text"
                    value={formData.serial}
                    onChange={(e) => setFormData(prev => ({ ...prev, serial: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Modelo
                  </label>
                  <input
                    type="text"
                    value={formData.modelo}
                    onChange={(e) => setFormData(prev => ({ ...prev, modelo: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Proveedor
                </label>
                <input
                  type="text"
                  value={formData.proveedor}
                  onChange={(e) => setFormData(prev => ({ ...prev, proveedor: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Estado Estético
                  </label>
                  <select
                    value={formData.estado_estetico}
                    onChange={(e) => setFormData(prev => ({ ...prev, estado_estetico: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="excelente">Excelente</option>
                    <option value="muy_bueno">Muy Bueno</option>
                    <option value="bueno">Bueno</option>
                    <option value="regular">Regular</option>
                    <option value="malo">Malo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Estado del Testeo
                  </label>
                  <select
                    value={formData.estado_testeo}
                    onChange={(e) => setFormData(prev => ({ ...prev, estado_testeo: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="aprobado">Aprobado</option>
                    <option value="rechazado">Rechazado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
                  rows="3"
                  placeholder="Notas sobre el estado del equipo, problemas encontrados, etc."
                />
              </div>
            </>
          ) : (
            // Modo cargar stock: solo mostrar info de que se abrirá el modal unificado
            <div className="text-center py-8">
              <p className="text-slate-600 mb-4">
                Se abrirá el formulario específico para cargar el {formData.tipo} al stock.
              </p>
              <p className="text-sm text-slate-500">
                Haga clic en "Cargar al Stock" para continuar.
              </p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors disabled:bg-emerald-400 flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>
                {saving ? 'Procesando...' : 
                 modo === 'cargar_stock' ? 'Cargar al Stock' : 'Guardar Cambios'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Modal unificado para cargar al stock */}
      {mostrarModalProducto && (
        <ModalProducto
          isOpen={mostrarModalProducto}
          onClose={() => setMostrarModalProducto(false)}
          onSave={handleProductoGuardado}
          tipo={formData.tipo}
          modo="cargar_desde_testeo"
          equipoTesteo={equipo}
        />
      )}
    </div>
  );
};

export default ModalEditarEquipo;