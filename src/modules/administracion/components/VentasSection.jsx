import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, DollarSign, TrendingUp, Monitor, Smartphone, User, CreditCard, Box, Eye, Search, CheckCircle, Circle, Loader } from 'lucide-react';
import { generarYDescargarRecibo as abrirReciboPDF } from '../../ventas/components/pdf/ReciboVentaPDF_NewTab';
import { obtenerTextoBoton } from '../../../shared/utils/documentTypeUtils';
import Tarjeta from '../../../shared/components/layout/Tarjeta';
import { formatearMonto, formatearFecha } from '../../../shared/utils/formatters';
import { supabase } from '../../../lib/supabase';

const VentasSection = ({ ventas, loading, error, onLoadStats }) => {
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [actualizandoContabilizado, setActualizandoContabilizado] = useState({});

  const ventasFiltradas = useMemo(() => ventas.filter(transaccion => {
    if (!transaccion.venta_items?.length) return false;

    const fechaVenta = transaccion.fecha_venta.split('T')[0];
    if (fechaDesde && fechaVenta < fechaDesde) return false;
    if (fechaHasta && fechaVenta > fechaHasta) return false;

    if (filtroTipo !== 'todos') {
      const tieneProducto = transaccion.venta_items.some(item => item.tipo_producto === filtroTipo);
      if (!tieneProducto) return false;
    }

    if (busqueda.trim()) {
      const buscar = busqueda.toLowerCase();
      const camposTransaccion = [transaccion.cliente_nombre, transaccion.vendedor].filter(Boolean);
      const coincideTransaccion = camposTransaccion.some(campo => campo.toLowerCase().includes(buscar));
      const coincideProductos = transaccion.venta_items?.some(item => {
        const camposItem = [item.copy, item.serial_producto].filter(Boolean);
        return camposItem.some(campo => campo.toLowerCase().includes(buscar));
      });
      if (!coincideTransaccion && !coincideProductos) return false;
    }

    return true;
  }), [ventas, fechaDesde, fechaHasta, filtroTipo, busqueda]);

  const estadisticasFiltradas = useMemo(() => {
    const totalIngresos = ventasFiltradas.reduce((acc, v) => acc + (parseFloat(v.monto_pago_1) || 0) + (parseFloat(v.monto_pago_2) || 0), 0);
    const totalGanancias = ventasFiltradas.reduce((acc, v) => acc + (parseFloat(v.margen_total) || 0), 0);
    const margenPromedio = totalIngresos > 0 ? Math.round((totalGanancias / totalIngresos) * 100) : 0;

    return {
      totalVentas: ventasFiltradas.length,
      totalIngresos,
      totalGanancias,
      margenPromedio
    };
  }, [ventasFiltradas]);

  const MAX_RESULTS = 200;
  const ventasLimitadas = ventasFiltradas.slice(0, MAX_RESULTS);

  const formatearFechaCompleta = (fecha) => formatearFecha(fecha);

  const getIconoProducto = (tipo) => {
    switch (tipo) {
      case 'computadora': return <Monitor className="w-4 h-4 text-slate-600" />;
      case 'celular': return <Smartphone className="w-4 h-4 text-slate-600" />;
      default: return <Box className="w-4 h-4 text-slate-600" />;
    }
  };

  const getProductosDetallados = (items) => {
    if (!items || items.length === 0) return 'Sin productos';
    return items.map((item, index) => (
      <div key={index} className="mb-1 last:mb-0">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {getIconoProducto(item.tipo_producto)}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-xs text-slate-800 truncate">{item.copy}</div>
            {item.serial_producto && <div className="text-xs text-slate-500 font-mono truncate">S/N: {item.serial_producto}</div>}
          </div>
        </div>
      </div>
    ));
  };

  const getTotalesUnitarios = (items) => {
    if (!items || items.length === 0) return 'Sin precios';
    return items.map((item, index) => (
      <div key={index} className="mb-1 last:mb-0">
        <div className="text-xs font-semibold text-slate-700">{formatearMonto(item.precio_total, 'USD')}</div>
      </div>
    ));
  };

  const getMetodosPago = (transaccion) => {
    const metodos = [];
    if (transaccion.metodo_pago) metodos.push({ metodo: transaccion.metodo_pago, monto: transaccion.monto_pago_1 || 0 });
    if (transaccion.metodo_pago_2) metodos.push({ metodo: transaccion.metodo_pago_2, monto: transaccion.monto_pago_2 || 0 });
    return metodos.map((pago, index) => (
      <div key={index} className="mb-1 last:mb-0">
        <div className="text-sm text-slate-800 capitalize">{pago.metodo.replace(/_/g, ' ')}</div>
        <div className="text-xs text-slate-500">{formatearMonto(pago.monto, 'USD')}</div>
      </div>
    ));
  };

  const manejarAbrirRecibo = (transaccion) => abrirReciboPDF(transaccion);

  const toggleContabilizado = async (transaccionId, valorActual) => {
    try {
      setActualizandoContabilizado(prev => ({ ...prev, [transaccionId]: true }));
      const { error } = await supabase.from('transacciones').update({ contabilizado: !valorActual }).eq('id', transaccionId);
      if (error) throw error;
      const transaccion = ventas.find(v => v.id === transaccionId);
      if (transaccion) transaccion.contabilizado = !valorActual;
    } catch (err) {
      console.error('Error al actualizar contabilizado:', err);
      alert('Error al actualizar el estado de contabilizado');
    } finally {
      setActualizandoContabilizado(prev => ({ ...prev, [transaccionId]: false }));
    }
  };

  return (
    <div className="bg-slate-50 h-full w-full flex flex-col">
      {/* Top section: Cards and Filters */}
      <div className="p-6 flex-shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Tarjeta icon={BarChart3} titulo="Transacciones Filtradas" valor={estadisticasFiltradas.totalVentas} />
          <Tarjeta icon={DollarSign} titulo="Ingresos Filtrados" valor={formatearMonto(estadisticasFiltradas.totalIngresos, 'USD')} />
          <Tarjeta icon={TrendingUp} titulo="Ganancias Filtradas" valor={formatearMonto(estadisticasFiltradas.totalGanancias, 'USD')} />
          <Tarjeta icon={TrendingUp} titulo="Margen Promedio" valor={`${estadisticasFiltradas.margenPromedio}%`} />
        </div>

        <div className="bg-white p-6 rounded border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Producto</label>
              <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="todos">Todos</option>
                <option value="computadora">Computadoras</option>
                <option value="celular">Celulares</option>
                <option value="perifericos">Periféricos</option>
                <option value="monitores">Monitores</option>
                <option value="componentes">Componentes</option>
                <option value="accesorios">Accesorios</option>
                <option value="fundas_templados">Fundas/Templados</option>
                <option value="otro">Otros</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Producto, serial, cliente..." className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Desde</label>
              <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Hasta</label>
              <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section: Table */}
      <div className="px-6 pb-6 flex-grow flex flex-col min-h-0">
        {loading && <p className="text-slate-600 text-center py-10">Cargando ventas...</p>}
        {error && <p className="text-red-600 text-center py-10">Error: {error}</p>}
        {!loading && !error && (
          <div className="bg-white rounded border border-slate-200 flex-grow flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex-shrink-0">
              <h3 className="text-lg font-semibold text-slate-800">
                {ventasFiltradas.length > MAX_RESULTS ? `${ventasLimitadas.length} de ${ventasFiltradas.length} (mostrando ${MAX_RESULTS})` : `${ventasFiltradas.length} transacciones`}
              </h3>
            </div>
            <div className="overflow-x-auto flex-grow">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase sticky left-0 bg-slate-800 z-10">Contab.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Productos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Total Unitario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Cliente</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase">Total</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase">Costo</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase">Ganancia</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Método Pago</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Vendedor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Acciones</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {ventasLimitadas.map((transaccion) => (
                    <tr key={transaccion.id} className={`hover:bg-slate-50 ${transaccion.contabilizado ? 'bg-emerald-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-center sticky left-0 bg-white z-10 ${transaccion.contabilizado ? 'bg-emerald-50' : ''} group-hover:bg-slate-50">
                        <button onClick={() => toggleContabilizado(transaccion.id, transaccion.contabilizado)} disabled={actualizandoContabilizado[transaccion.id]} className="p-1 rounded hover:bg-slate-100 disabled:opacity-50" title={transaccion.contabilizado ? 'No contabilizado' : 'Contabilizado'}>
                          {actualizandoContabilizado[transaccion.id] ? <Loader className="w-5 h-5 text-slate-400 animate-spin" /> : transaccion.contabilizado ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <Circle className="w-5 h-5 text-slate-400" />}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">{formatearFechaCompleta(transaccion.fecha_venta)}</td>
                      <td className="px-6 py-4 text-sm text-slate-800 max-w-sm">{getProductosDetallados(transaccion.venta_items || [])}</td>
                      <td className="px-6 py-4 text-sm text-slate-800">{getTotalesUnitarios(transaccion.venta_items || [])}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-slate-600" />
                          <div>
                            <div className="text-sm font-medium text-slate-800">{transaccion.cliente_nombre}</div>
                            {transaccion.cliente_email && <div className="text-sm text-slate-500">{transaccion.cliente_email}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800 text-right">{formatearMonto((parseFloat(transaccion.monto_pago_1 || 0) + parseFloat(transaccion.monto_pago_2 || 0)), 'USD')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-right">{formatearMonto(transaccion.total_costo || 0, 'USD')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right">
                        <span className={transaccion.margen_total >= 0 ? 'text-emerald-600' : 'text-red-600'}>{formatearMonto(transaccion.margen_total || 0, 'USD')}</span>
                      </td>
                      <td className="px-6 py-4" style={{ minWidth: '160px' }}>
                        <div className="flex items-start space-x-2">
                          <CreditCard className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
                          <div className="space-y-1">{getMetodosPago(transaccion)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">{transaccion.vendedor || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button onClick={() => manejarAbrirRecibo(transaccion)} className="text-slate-600 hover:text-slate-800 flex items-center space-x-1 px-2 py-1 rounded hover:bg-slate-100" title={`Ver ${obtenerTextoBoton(transaccion.metodo_pago).toLowerCase()}`}>
                          <Eye className="w-4 h-4" />
                          <span className="text-xs">{obtenerTextoBoton(transaccion.metodo_pago)}</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-800" style={{ minWidth: '300px', maxWidth: '500px' }}>
                        <div className="whitespace-normal break-words">{transaccion.observaciones || '-'}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VentasSection;