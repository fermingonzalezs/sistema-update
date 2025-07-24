import React, { useState, useEffect } from 'react';
import { Calendar, Gift, ShoppingBag, DollarSign, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { formatearMonto, formatearFecha } from '../../../shared/utils/formatters';

const CumpleanosProximos = ({ getProximosCumpleanosConHistorial }) => {
  const [cumpleanos, setCumpleanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedClient, setExpandedClient] = useState(null);

  useEffect(() => {
    cargarCumpleanos();
  }, []);

  const cargarCumpleanos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProximosCumpleanosConHistorial();
      setCumpleanos(data);
    } catch (err) {
      setError('Error al cargar cumpleaños próximos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calcularDiasParaCumple = (fechaCumple) => {
    const hoy = new Date();
    const cumple = new Date(fechaCumple);
    const cumpleEsteAno = new Date(hoy.getFullYear(), cumple.getMonth(), cumple.getDate());
    
    if (cumpleEsteAno < hoy) {
      cumpleEsteAno.setFullYear(hoy.getFullYear() + 1);
    }
    
    const diffTime = cumpleEsteAno - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatearDiasParaCumple = (dias) => {
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Mañana';
    return `En ${dias} días`;
  };

  const calcularTotalGastado = (historial) => {
    return historial.reduce((total, compra) => total + (compra.total_venta || 0), 0);
  };

  const obtenerUltimaCompra = (historial) => {
    if (!historial.length) return null;
    return historial[0]; // Ya está ordenado por fecha descendente
  };

  const toggleExpansion = (clienteId) => {
    setExpandedClient(expandedClient === clienteId ? null : clienteId);
  };

  if (loading) {
    return (
      <div className="bg-white rounded border border-slate-200 p-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <Gift className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-800">Cumpleaños Próximos</h3>
        </div>
        <div className="text-slate-500">Cargando cumpleaños próximos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded border border-slate-200 p-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <Gift className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-800">Cumpleaños Próximos</h3>
        </div>
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!cumpleanos.length) {
    return (
      <div className="bg-white rounded border border-slate-200 p-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <Gift className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-800">Cumpleaños Próximos</h3>
        </div>
        <div className="text-slate-500">No hay cumpleaños próximos en los próximos 30 días.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded border border-slate-200 p-6 mb-6">
      <div className="flex items-center space-x-3 mb-4">
        <Gift className="w-5 h-5 text-emerald-600" />
        <h3 className="text-lg font-semibold text-slate-800">Cumpleaños Próximos</h3>
        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-sm font-medium">
          {cumpleanos.length} cliente{cumpleanos.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 px-3 text-sm font-medium text-slate-600">Cliente</th>
              <th className="text-left py-2 px-3 text-sm font-medium text-slate-600">Cumpleaños</th>
              <th className="text-left py-2 px-3 text-sm font-medium text-slate-600">Días</th>
              <th className="text-right py-2 px-3 text-sm font-medium text-slate-600">Compras</th>
              <th className="text-right py-2 px-3 text-sm font-medium text-slate-600">Total Gastado</th>
              <th className="text-center py-2 px-3 text-sm font-medium text-slate-600">Historial</th>
            </tr>
          </thead>
          <tbody>
            {cumpleanos.map((cliente) => {
              const diasParaCumple = calcularDiasParaCumple(cliente.cumpleanos);
              const totalGastado = calcularTotalGastado(cliente.historialCompras);
              const ultimaCompra = obtenerUltimaCompra(cliente.historialCompras);
              const isExpanded = expandedClient === cliente.id;

              return (
                <React.Fragment key={cliente.id}>
                  <tr className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800">
                        {cliente.nombre} {cliente.apellido}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-sm text-slate-600">
                        {new Date(cliente.cumpleanos).toLocaleDateString('es-AR', { 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-600">
                          {formatearDiasParaCumple(diasParaCumple)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-sm font-medium text-slate-800">
                        {cliente.historialCompras.length}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-sm font-medium text-slate-800">
                        {totalGastado > 0 ? formatearMonto(totalGastado, 'USD') : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {cliente.historialCompras.length > 0 && (
                        <button
                          onClick={() => toggleExpansion(cliente.id)}
                          className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="Ver historial de compras"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Fila expandida con historial */}
                  {isExpanded && cliente.historialCompras.length > 0 && (
                    <tr>
                      <td colSpan="6" className="py-0">
                        <div className="bg-slate-50 border-l-4 border-emerald-500 p-4 mx-3 mb-3 rounded">
                          <div className="flex items-center space-x-2 mb-3">
                            <ShoppingBag className="w-4 h-4 text-emerald-600" />
                            <h5 className="font-medium text-slate-700">Historial de Compras</h5>
                            {ultimaCompra && (
                              <span className="text-xs text-slate-500">
                                Última: {formatearFecha(ultimaCompra.fecha_venta)}
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                            {cliente.historialCompras.slice(0, 9).map((compra) => (
                              <div key={compra.id} className="bg-white rounded p-3 border border-slate-200">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium text-slate-600">
                                    {formatearFecha(compra.fecha_venta)}
                                  </span>
                                  <span className="text-sm font-semibold text-slate-800">
                                    {formatearMonto(compra.total_venta, compra.moneda_pago || 'USD')}
                                  </span>
                                </div>
                                
                                <div className="text-xs text-slate-500">
                                  Método: {compra.metodo_pago_1?.replace(/_/g, ' ') || 'N/A'}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {cliente.historialCompras.length > 9 && (
                            <div className="text-center mt-3">
                              <span className="text-xs text-slate-500">
                                Mostrando 9 de {cliente.historialCompras.length} compras
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CumpleanosProximos;