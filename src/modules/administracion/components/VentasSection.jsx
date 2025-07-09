import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, DollarSign, TrendingUp, Monitor, Smartphone, User, CreditCard, Box, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { Eye } from 'lucide-react';
import { generarYDescargarRecibo as abrirReciboPDF } from '../../../components/ReciboVentaPDF';

const VentasSection = ({ ventas, loading, error, onLoadStats }) => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [transaccionesExpandidas, setTransaccionesExpandidas] = useState(new Set());

  // Establecer fechas por defecto (último mes)
  useEffect(() => {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    setFechaInicio(primerDiaMes.toISOString().split('T')[0]);
    setFechaFin(hoy.toISOString().split('T')[0]);
  }, []);

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
    if (fechaInicio || fechaFin) {
      const fechaVenta = new Date(transaccion.fecha_venta);
      
      if (fechaInicio) {
        const fechaInicioDate = new Date(fechaInicio);
        cumpleFecha = cumpleFecha && fechaVenta >= fechaInicioDate;
      }
      
      if (fechaFin) {
        const fechaFinDate = new Date(fechaFin);
        fechaFinDate.setHours(23, 59, 59, 999); // Incluir todo el día final
        cumpleFecha = cumpleFecha && fechaVenta <= fechaFinDate;
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
      case 'computadora': return <Monitor className="w-4 h-4 text-gray-600" />;
      case 'celular': return <Smartphone className="w-4 h-4 text-gray-600" />;
      case 'otro': return <Box className="w-4 h-4 text-gray-600" />;
      default: return <Box className="w-4 h-4 text-gray-600" />;
    }
  };

  const getProductosResumen = (items) => {
    return items.map(item => item.modelo_producto).join(' • ');
  };

  const manejarAbrirRecibo = async (transaccion) => {
    const resultado = await abrirReciboPDF(transaccion);
    if (!resultado.success) {
      alert('Error al generar el recibo: ' + resultado.error);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-black text-white p-6 rounded-t-lg mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-8 h-8" />
              Registro de Ventas
            </h2>
            <p className="text-gray-300 mt-2">Análisis detallado de ventas y estadísticas</p>
          </div>
          <button
            onClick={cargarEstadisticas}
            className="bg-white text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-bold shadow text-base"
          >
            Actualizar Stats
          </button>
        </div>
      </div>

      {/* Estadísticas generales */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-800 text-sm">Total Transacciones</p>
                <p className="text-2xl font-bold text-green-900">{estadisticas.totalVentas}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-800 text-sm">Ingresos Totales</p>
                <p className="text-2xl font-bold text-green-900">{formatearMoneda(estadisticas.totalIngresos)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-800 text-sm">Ganancias</p>
                <p className="text-2xl font-bold text-green-900">{formatearMoneda(estadisticas.totalGanancias)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-800 text-sm">Margen Promedio</p>
                <p className="text-2xl font-bold text-green-900">
                  {estadisticas.totalVentas > 0 
                    ? Math.round((estadisticas.totalGanancias / estadisticas.totalIngresos) * 100) + '%'
                    : '0%'
                  }
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
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
                  <Monitor className="w-5 h-5 text-gray-600" />
                  <span>Computadoras</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">{estadisticas.ventasComputadoras}</span>
                  <div className="w-24 bg-gray-100 rounded-full h-2 mt-1">
                    <div 
                      className="bg-gray-600 h-2 rounded-full" 
                      style={{
                        width: `${estadisticas.totalVentas > 0 ? (estadisticas.ventasComputadoras / (estadisticas.ventasComputadoras + estadisticas.ventasCelulares + (estadisticas.ventasOtros || 0))) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-5 h-5 text-gray-600" />
                  <span>Celulares</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">{estadisticas.ventasCelulares}</span>
                  <div className="w-24 bg-blue-100 rounded-full h-2 mt-1">
                    <div 
                      className="bg-gray-500 h-2 rounded-full" 
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
                    <Box className="w-5 h-5 text-gray-600" />
                    <span>Otros</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{estadisticas.ventasOtros}</span>
                    <div className="w-24 bg-blue-100 rounded-full h-2 mt-1">
                      <div 
                        className="bg-gray-400 h-2 rounded-full" 
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
            className="px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-600"
          >
            <option value="todos">Todos</option>
            <option value="computadora">Computadoras</option>
            <option value="celular">Celulares</option>
            <option value="otro">Otros</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-600"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-600"
          />
        </div>

        {/* Botones de acceso rápido para fechas */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => {
              const hoy = new Date();
              setFechaInicio(hoy.toISOString().split('T')[0]);
              setFechaFin(hoy.toISOString().split('T')[0]);
            }}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
          >
            Hoy
          </button>
          <button
            onClick={() => {
              const hoy = new Date();
              const unaSemanaAtras = new Date(hoy);
              unaSemanaAtras.setDate(hoy.getDate() - 7);
              setFechaInicio(unaSemanaAtras.toISOString().split('T')[0]);
              setFechaFin(hoy.toISOString().split('T')[0]);
            }}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
          >
            Última semana
          </button>
          <button
            onClick={() => {
              const hoy = new Date();
              const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
              setFechaInicio(primerDiaMes.toISOString().split('T')[0]);
              setFechaFin(hoy.toISOString().split('T')[0]);
            }}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
          >
            Este mes
          </button>
          <button
            onClick={() => {
              const hoy = new Date();
              const unMesAtras = new Date(hoy);
              unMesAtras.setMonth(hoy.getMonth() - 1);
              setFechaInicio(unMesAtras.toISOString().split('T')[0]);
              setFechaFin(hoy.toISOString().split('T')[0]);
            }}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
          >
            Último mes
          </button>
          <button
            onClick={() => {
              setFechaInicio('');
              setFechaFin('');
            }}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
          >
            Todos los períodos
          </button>
        </div>
      </div>

      {/* Tabla de transacciones */}
      {loading && <p className="text-gray-600">Cargando ventas...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      {!loading && !error && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-800 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-white">
              {ventasFiltradas.length} transacciones encontradas
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Nº Transacción</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Productos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Método Pago</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Margen</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Vendedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ventasFiltradas.map((transaccion) => (
                  <React.Fragment key={transaccion.id}>
                    <tr className="hover:bg-gray-50">
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
                          <User className="w-4 h-4 text-gray-600" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{transaccion.cliente_nombre}</div>
                            {transaccion.cliente_email && (
                              <div className="text-sm text-gray-500">{transaccion.cliente_email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatearMoneda(transaccion.total_venta)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-900 capitalize">{transaccion.metodo_pago}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          transaccion.margen_total >= 0 ? 'text-gray-900' : 'text-red-600'
                        }`}>
                          {formatearMoneda(transaccion.margen_total)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaccion.vendedor || '-'}
                        {transaccion.sucursal && (
                          <div className="text-xs text-gray-500">{transaccion.sucursal.replace('_', ' ').toUpperCase()}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleTransaccion(transaccion.id)}
                            className="text-gray-600 hover:text-gray-800 flex items-center space-x-1"
                          >
                            {transaccionesExpandidas.has(transaccion.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            <span>Ver</span>
                          </button>
                          <button
                            onClick={() => manejarAbrirRecibo(transaccion)}
                            className="text-gray-600 hover:text-gray-800 flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-50"
                            title="Ver recibo"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-xs">Recibo</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Fila expandida con detalles de productos */}
                    {transaccionesExpandidas.has(transaccion.id) && (
                      <tr>
                        <td colSpan="9" className="px-6 py-4 bg-gray-50">
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
                                    <div className="font-medium text-gray-900">{formatearMoneda(item.precio_total)}</div>
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