import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, DollarSign, TrendingUp, Monitor, Smartphone, User, CreditCard, Box, ChevronDown, ChevronRight } from 'lucide-react';

const VentasSection = ({ ventas, loading, error, onLoadStats }) => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroFecha, setFiltroFecha] = useState('todos');
  const [transaccionesExpandidas, setTransaccionesExpandidas] = useState(new Set());

  useEffect(() => {
    if (onLoadStats) {
      cargarEstadisticas();
    }
  }, [onLoadStats]);

  const cargarEstadisticas = async () => {
    try {
      const stats = await onLoadStats();
      setEstadisticas(stats);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const toggleTransaccion = (transaccionId) => {
    const nuevasExpandidas = new Set(transaccionesExpandidas);
    if (nuevasExpandidas.has(transaccionId)) {
      nuevasExpandidas.delete(transaccionId);
    } else {
      nuevasExpandidas.add(transaccionId);
    }
    setTransaccionesExpandidas(nuevasExpandidas);
  };

  const ventasFiltradas = ventas.filter(transaccion => {
    // Si no hay items, no mostrar la transacción
    if (!transaccion.venta_items || transaccion.venta_items.length === 0) return false;
    
    const cumpleTipo = filtroTipo === 'todos' || 
      transaccion.venta_items.some(item => item.tipo_producto === filtroTipo);
    
    let cumpleFecha = true;
    if (filtroFecha !== 'todos') {
      const fechaVenta = new Date(transaccion.fecha_venta);
      const hoy = new Date();
      
      switch (filtroFecha) {
        case 'hoy':
          cumpleFecha = fechaVenta.toDateString() === hoy.toDateString();
          break;
        case 'semana':
          const unaSemanaAtras = new Date(hoy);
          unaSemanaAtras.setDate(hoy.getDate() - 7);
          cumpleFecha = fechaVenta >= unaSemanaAtras;
          break;
        case 'mes':
          const unMesAtras = new Date(hoy);
          unMesAtras.setMonth(hoy.getMonth() - 1);
          cumpleFecha = fechaVenta >= unMesAtras;
          break;
        default:
          cumpleFecha = true;
      }
    }
    
    return cumpleTipo && cumpleFecha;
  });

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(valor);
  };

  const getIconoProducto = (tipo) => {
    switch (tipo) {
      case 'computadora': return <Monitor className="w-4 h-4 text-blue-600" />;
      case 'celular': return <Smartphone className="w-4 h-4 text-blue-400" />;
      case 'otro': return <Box className="w-4 h-4 text-blue-300" />;
      default: return <Box className="w-4 h-4 text-gray-600" />;
    }
  };

  const getProductosResumen = (items) => {
    return items.map(item => item.modelo_producto).join(' • ');
  };

  return (
    <div className="p-8">
      {/* Header con estilo de ReporteMovimientosSection */}
      <div className="flex items-center justify-between mb-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl py-10 px-8">
        <div>
          <h2 className="text-4xl font-bold text-white">Registro de Ventas</h2>
          <p className="text-blue-100 mt-2 text-lg">Análisis detallado de ventas y estadísticas</p>
        </div>
        <button
          onClick={cargarEstadisticas}
          className="bg-white text-blue-700 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors font-bold shadow text-base"
        >
          Actualizar Stats
        </button>
      </div>

      {/* Estadísticas generales */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-600 p-6 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Transacciones</p>
                <p className="text-2xl font-bold">{estadisticas.totalVentas}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-emerald-600 p-6 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Ingresos Totales</p>
                <p className="text-2xl font-bold">{formatearMoneda(estadisticas.totalIngresos)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-200" />
            </div>
          </div>

          <div className="bg-orange-500 p-6 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Ganancias</p>
                <p className="text-2xl font-bold">{formatearMoneda(estadisticas.totalGanancias)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-200" />
            </div>
          </div>

          <div className="bg-violet-600 p-6 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100 text-sm">Margen Promedio</p>
                <p className="text-2xl font-bold">
                  {estadisticas.totalVentas > 0 
                    ? Math.round((estadisticas.totalGanancias / estadisticas.totalIngresos) * 100) + '%'
                    : '0%'
                  }
                </p>
              </div>
              <Calendar className="w-8 h-8 text-violet-200" />
            </div>
          </div>
        </div>
      )}

      {/* Distribución por tipo de producto */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Productos Vendidos</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Monitor className="w-5 h-5 text-blue-600" />
                  <span>Computadoras</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">{estadisticas.ventasComputadoras}</span>
                  <div className="w-24 bg-blue-100 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{
                        width: `${estadisticas.totalVentas > 0 ? (estadisticas.ventasComputadoras / (estadisticas.ventasComputadoras + estadisticas.ventasCelulares + (estadisticas.ventasOtros || 0))) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-5 h-5 text-blue-400" />
                  <span>Celulares</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">{estadisticas.ventasCelulares}</span>
                  <div className="w-24 bg-blue-100 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-400 h-2 rounded-full" 
                      style={{
                        width: `${estadisticas.totalVentas > 0 ? (estadisticas.ventasCelulares / (estadisticas.ventasComputadoras + estadisticas.ventasCelulares + (estadisticas.ventasOtros || 0))) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              {estadisticas.ventasOtros && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Box className="w-5 h-5 text-blue-300" />
                    <span>Otros</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{estadisticas.ventasOtros}</span>
                    <div className="w-24 bg-blue-100 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-300 h-2 rounded-full" 
                        style={{
                          width: `${estadisticas.totalVentas > 0 ? (estadisticas.ventasOtros / (estadisticas.ventasComputadoras + estadisticas.ventasCelulares + estadisticas.ventasOtros)) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Producto</label>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="todos">Todos</option>
            <option value="computadora">Computadoras</option>
            <option value="celular">Celulares</option>
            <option value="otro">Otros</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
          <select
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="todos">Todos</option>
            <option value="hoy">Hoy</option>
            <option value="semana">Última semana</option>
            <option value="mes">Último mes</option>
          </select>
        </div>
      </div>

      {/* Tabla de transacciones */}
      {loading && <p className="text-blue-600">Cargando ventas...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      {!loading && !error && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-white">
              {ventasFiltradas.length} transacciones encontradas
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Nº Transacción</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Productos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Método Pago</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Margen</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Vendedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Detalles</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ventasFiltradas.map((transaccion) => (
                  <React.Fragment key={transaccion.id}>
                    <tr className="hover:bg-blue-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatearFecha(transaccion.fecha_venta)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {transaccion.numero_transaccion}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={getProductosResumen(transaccion.venta_items || [])}>
                          {getProductosResumen(transaccion.venta_items || [])}
                        </div>
                        <div className="text-xs text-gray-500">
                          {transaccion.venta_items?.length || 0} items
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-blue-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{transaccion.cliente_nombre}</div>
                            {transaccion.cliente_email && (
                              <div className="text-sm text-gray-500">{transaccion.cliente_email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                        {formatearMoneda(transaccion.total_venta)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-gray-900 capitalize">{transaccion.metodo_pago}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          transaccion.margen_total >= 0 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {formatearMoneda(transaccion.margen_total)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaccion.vendedor || '-'}
                        {transaccion.sucursal && (
                          <div className="text-xs text-gray-500">{transaccion.sucursal}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => toggleTransaccion(transaccion.id)}
                          className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                        >
                          {transaccionesExpandidas.has(transaccion.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          <span>Ver</span>
                        </button>
                      </td>
                    </tr>
                    
                    {/* Fila expandida con detalles de productos */}
                    {transaccionesExpandidas.has(transaccion.id) && (
                      <tr>
                        <td colSpan="9" className="px-6 py-4 bg-blue-50">
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-700 mb-3">Productos vendidos:</h4>
                            <div className="grid gap-2">
                              {transaccion.venta_items?.map((item, index) => (
                                <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                                  <div className="flex items-center space-x-3">
                                    {getIconoProducto(item.tipo_producto)}
                                    <div>
                                      <span className="font-medium">{item.modelo_producto}</span>
                                      <div className="text-sm text-gray-500">
                                        Serial: {item.serial_producto} • Cantidad: {item.cantidad}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium text-blue-600">{formatearMoneda(item.precio_total)}</div>
                                    <div className="text-sm text-gray-500">
                                      {formatearMoneda(item.precio_unitario)} x {item.cantidad}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default VentasSection;