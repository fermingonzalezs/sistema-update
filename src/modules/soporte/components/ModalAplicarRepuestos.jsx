import React, { useState } from 'react';
import { Check, X, AlertTriangle, Package } from 'lucide-react';
import { useMovimientosRepuestos } from '../hooks/useMovimientosRepuestos';

const ModalAplicarRepuestos = ({ open, onClose, reparacion, repuestosPresupuesto, onSuccess }) => {
  const { aplicarRepuestosReparacion, loading } = useMovimientosRepuestos();
  const [confirmacion, setConfirmacion] = useState(false);

  if (!open || !reparacion || !repuestosPresupuesto || repuestosPresupuesto.length === 0) {
    return null;
  }

  const handleAplicarRepuestos = async () => {
    if (!confirmacion) {
      alert('Debe confirmar que desea aplicar los repuestos');
      return;
    }

    try {
      // Transformar repuestos del presupuesto al formato esperado
      const repuestosParaAplicar = repuestosPresupuesto.map(repuesto => ({
        id: repuesto.id,
        cantidad: repuesto.cantidad,
        nombre: repuesto.nombre
      }));

      await aplicarRepuestosReparacion(reparacion.id, repuestosParaAplicar);
      
      alert('✅ Repuestos aplicados exitosamente. El stock ha sido actualizado.');
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      alert('❌ Error aplicando repuestos: ' + error.message);
    }
  };

  const calcularTotalUnidades = () => {
    return repuestosPresupuesto.reduce((total, repuesto) => total + repuesto.cantidad, 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
        {/* Header */}
        <div className="bg-orange-600 p-4 rounded-t-lg text-white">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package size={20} />
            Aplicar Repuestos a Reparación
          </h3>
        </div>
        
        <div className="p-4">
          {/* Información de la reparación */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-1">Reparación: {reparacion.numero}</h4>
            <p className="text-sm text-gray-600">Cliente: {reparacion.cliente_nombre}</p>
            <p className="text-sm text-gray-600">Equipo: {reparacion.equipo_tipo} {reparacion.equipo_modelo}</p>
          </div>

          {/* Lista de repuestos a aplicar */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-800 mb-2">Repuestos del presupuesto:</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {repuestosPresupuesto.map((repuesto, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium text-sm">{repuesto.nombre}</div>
                    <div className="text-xs text-gray-500">{repuesto.categoria}</div>
                  </div>
                  <div className="text-sm font-semibold">
                    {repuesto.cantidad} unidades
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-800">
              <AlertTriangle size={16} />
              <span className="text-sm font-medium">
                Se aplicarán {calcularTotalUnidades()} unidades de {repuestosPresupuesto.length} repuesto(s)
              </span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Esta acción descontará el stock automáticamente y registrará los movimientos
            </p>
          </div>

          {/* Confirmación */}
          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={confirmacion}
                onChange={(e) => setConfirmacion(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">
                Confirmo que los repuestos fueron utilizados en esta reparación
              </span>
            </label>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              onClick={handleAplicarRepuestos}
              disabled={loading || !confirmacion}
              className="flex-1 bg-orange-600 text-white px-4 py-2 rounded font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Check size={16} />
              )}
              {loading ? 'Aplicando...' : 'Aplicar Repuestos'}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded font-medium hover:bg-gray-400 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalAplicarRepuestos;