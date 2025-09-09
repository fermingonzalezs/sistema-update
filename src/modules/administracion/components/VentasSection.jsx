import React, { useState, useEffect } from 'react';
import { BarChart3, DollarSign, TrendingUp, Monitor, Smartphone, User, CreditCard, Box, Eye, Search } from 'lucide-react';
import { generarYDescargarRecibo as abrirReciboPDF } from '../../../components/pdf/ventas/ReciboVentaPDF_NewTab';
import { obtenerTextoBoton } from '../../../shared/utils/documentTypeUtils';
import Tarjeta from '../../../shared/components/layout/Tarjeta';
import { formatearMonto, formatearFecha } from '../../../shared/utils/formatters';

const VentasSection = ({ ventas, loading, error, onLoadStats }) => {
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [estadisticas, setEstadisticas] = useState(null);

  useEffect(() => {
    if (onLoadStats) {
      onLoadStats().then(setEstadisticas);
    }
  }, [onLoadStats]);

  // Filtrado simple con buscador
  const ventasFiltradas = ventas.filter(transaccion => {
    if (!transaccion.venta_items?.length) return false;
    
    if (filtroTipo !== 'todos') {
      const tieneProducto = transaccion.venta_items.some(item => item.tipo_producto === filtroTipo);
      if (!tieneProducto) return false;
    }
    
    if (busqueda.trim()) {
      const buscar = busqueda.toLowerCase();
      
      // Buscar en datos de la transacción
      const camposTransaccion = [
        transaccion.cliente_nombre,
        transaccion.vendedor
      ].filter(Boolean);
      
      const coincideTransaccion = camposTransaccion.some(campo => 
        campo.toLowerCase().includes(buscar)
      );
      
      // Buscar en productos y seriales
      const coincideProductos = transaccion.venta_items?.some(item => {
        const camposItem = [
          item.copy,
          item.serial_producto
        ].filter(Boolean);
        
        return camposItem.some(campo => 
          campo.toLowerCase().includes(buscar)
        );
      });
      
      if (!coincideTransaccion && !coincideProductos) return false;
    }
    
    return true;
  });

  // Limitar resultados para evitar problemas de rendimiento
  const MAX_RESULTS = 200;
  const ventasLimitadas = ventasFiltradas.slice(0, MAX_RESULTS);


  const formatearFechaCompleta = (fecha) => {
    return formatearFecha(fecha);
  };

  const getIconoProducto = (tipo) => {
    switch (tipo) {
      case 'computadora': return <Monitor className="w-4 h-4 text-slate-600" />;
      case 'celular': return <Smartphone className="w-4 h-4 text-slate-600" />;
      case 'otro': return <Box className="w-4 h-4 text-slate-600" />;
      default: return <Box className="w-4 h-4 text-slate-600" />;
    }
  };

  const getProductosDetallados = (items) => {
    if (!items || items.length === 0) return 'Sin productos';
    
    return items.map((item, index) => (
      <div key={index} className="mb-1 last:mb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {getIconoProducto(item.tipo_producto)}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-xs text-slate-800 truncate">{item.copy}</div>
              {item.serial_producto && (
                <div className="text-xs text-slate-500 font-mono truncate">
                  S/N: {item.serial_producto}
                </div>
              )}
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-700 ml-2">
            {formatearMonto(item.precio_total, 'USD')}
          </span>
        </div>
      </div>
    ));
  };

  const manejarAbrirRecibo = (transaccion) => {
    abrirReciboPDF(transaccion);
  };

  const calcularMargenPorcentaje = () => {
    if (!estadisticas || estadisticas.totalIngresos === 0) return 0;
    return Math.round((estadisticas.totalGanancias / estadisticas.totalIngresos) * 100);
  };

  return (
    <div className="bg-slate-50 w-full min-w-0">
      
      {/* Estadísticas generales usando Tarjeta */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Tarjeta 
            icon={BarChart3}
            titulo="Total Transacciones"
            valor={estadisticas.totalVentas}
          />
          <Tarjeta 
            icon={DollarSign}
            titulo="Ingresos Totales"
            valor={formatearMonto(estadisticas.totalIngresos, 'USD')}
          />
          <Tarjeta 
            icon={TrendingUp}
            titulo="Ganancias"
            valor={formatearMonto(estadisticas.totalGanancias, 'USD')}
          />
          <Tarjeta 
            icon={TrendingUp}
            titulo="Margen Promedio"
            valor={`${calcularMargenPorcentaje()}%`}
          />
        </div>
      )}
      
      {/* Filtros y Búsqueda */}
      <div className="bg-white p-6 rounded border border-slate-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Producto</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="todos">Todos los productos</option>
              <option value="computadora">Computadoras</option>
              <option value="celular">Celulares</option>
              <option value="otro">Otros</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por producto, serial, cliente, vendedor..."
                className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de transacciones - VERSIÓN SIMPLE */}
      {loading && <p className="text-slate-600">Cargando ventas...</p>}
      {error && <p className="text-slate-600">Error: {error}</p>}
      {!loading && !error && (
        <div className="bg-white rounded border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">
              {ventasFiltradas.length > MAX_RESULTS 
                ? `${ventasLimitadas.length} de ${ventasFiltradas.length} transacciones (limitado por rendimiento)`
                : `${ventasFiltradas.length} transacciones encontradas`
              }
            </h3>
          </div>
          
          {/* Vista de tabla para desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Productos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Método Pago</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Vendedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {ventasLimitadas.map((transaccion) => (
                  <tr key={transaccion.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                      {formatearFechaCompleta(transaccion.fecha_venta)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-800 max-w-sm">
                      <div className="space-y-1">
                        {getProductosDetallados(transaccion.venta_items || [])}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-slate-600" />
                        <div>
                          <div className="text-sm font-medium text-slate-800">{transaccion.cliente_nombre}</div>
                          {transaccion.cliente_email && (
                            <div className="text-sm text-slate-500">{transaccion.cliente_email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">
                      {formatearMonto(transaccion.total_venta, 'USD')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-slate-600" />
                        <span className="text-sm text-slate-800 capitalize">
                          {transaccion.metodo_pago.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                      {transaccion.vendedor || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => manejarAbrirRecibo(transaccion)}
                        className="text-slate-600 hover:text-slate-800 flex items-center space-x-1 px-2 py-1 rounded hover:bg-slate-100"
                        title={`Ver ${obtenerTextoBoton(transaccion.metodo_pago).toLowerCase()}`}
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-xs">{obtenerTextoBoton(transaccion.metodo_pago)}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista de cards para móviles */}
          <div className="md:hidden">
            {ventasLimitadas.map((transaccion) => (
              <div key={transaccion.id} className="border-b border-slate-200 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{transaccion.cliente_nombre}</div>
                    <div className="text-xs text-slate-500">{formatearFechaCompleta(transaccion.fecha_venta)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-800">{formatearMonto(transaccion.total_venta, 'USD')}</div>
                    <div className="text-xs text-slate-500 capitalize">{transaccion.metodo_pago.replace(/_/g, ' ')}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-slate-800">
                    <div className="space-y-1">
                      {getProductosDetallados(transaccion.venta_items || [])}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <div className="text-xs text-slate-500">
                      Vendedor: {transaccion.vendedor || '-'}
                    </div>
                    <button
                      onClick={() => manejarAbrirRecibo(transaccion)}
                      className="text-slate-600 hover:text-slate-800 flex items-center space-x-1 px-2 py-1 rounded hover:bg-slate-100"
                      title={`Ver ${obtenerTextoBoton(transaccion.metodo_pago).toLowerCase()}`}
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-xs">{obtenerTextoBoton(transaccion.metodo_pago)}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VentasSection;