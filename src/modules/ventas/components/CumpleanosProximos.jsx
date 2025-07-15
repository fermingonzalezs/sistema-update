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
      <div className="flex items-center space-x-3 mb-6">
        <Gift className="w-5 h-5 text-emerald-600" />
        <h3 className="text-lg font-semibold text-slate-800">Cumpleaños Próximos</h3>
        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-sm font-medium">
          {cumpleanos.length} cliente{cumpleanos.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-4">
        {cumpleanos.map((cliente) => {
          const diasParaCumple = calcularDiasParaCumple(cliente.cumpleanos);
          const totalGastado = calcularTotalGastado(cliente.historialCompras);
          const ultimaCompra = obtenerUltimaCompra(cliente.historialCompras);
          const isExpanded = expandedClient === cliente.id;

          return (
            <div key={cliente.id} className="border border-slate-200 rounded p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  {/* Información del cliente */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-semibold text-slate-800">
                        {cliente.nombre} {cliente.apellido}
                      </h4>
                      <div className="flex items-center space-x-1 text-emerald-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {formatearDiasParaCumple(diasParaCumple)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-2 text-sm text-slate-600">
                      <span>
                        📅 {new Date(cliente.cumpleanos).toLocaleDateString('es-AR', { 
                          day: 'numeric', 
                          month: 'long' 
                        })}
                      </span>
                      
                      {totalGastado > 0 && (
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4" />
                          <span>Total gastado: {formatearMonto(totalGastado, 'USD')}</span>
                        </div>
                      )}
                      
                      {ultimaCompra && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>Última compra: {formatearFecha(ultimaCompra.fecha_venta)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats rápidas */}
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="text-center">
                      <div className="text-slate-800 font-semibold">{cliente.historialCompras.length}</div>
                      <div className="text-slate-500">Compras</div>
                    </div>
                    
                    {cliente.historialCompras.length > 0 && (
                      <button
                        onClick={() => toggleExpansion(cliente.id)}
                        className="flex items-center space-x-1 text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded hover:bg-emerald-50"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Ver historial</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Historial expandido */}
              {isExpanded && cliente.historialCompras.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <h5 className="font-medium text-slate-700 mb-3">Historial de Compras</h5>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {cliente.historialCompras.map((compra, index) => (
                      <div key={compra.id} className="bg-slate-50 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">
                            {formatearFecha(compra.fecha_venta)}
                          </span>
                          <span className="text-sm font-semibold text-slate-800">
                            {formatearMonto(compra.total_venta, compra.moneda_pago || 'USD')}
                          </span>
                        </div>
                        
                        {compra.venta_items && compra.venta_items.length > 0 && (
                          <div className="space-y-1">
                            {compra.venta_items.map((item, itemIndex) => (
                              <div key={item.id} className="text-xs text-slate-600">
                                <span className="font-medium">{item.cantidad}x</span> {item.copy}
                                {item.serial_producto && (
                                  <span className="text-slate-500 ml-2">S/N: {item.serial_producto}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                          <span>Método: {compra.metodo_pago?.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CumpleanosProximos;