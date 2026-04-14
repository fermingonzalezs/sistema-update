import React, { useState, useMemo } from 'react';
import { BarChart3, DollarSign, TrendingUp, Monitor, Smartphone, User, CreditCard, Box, Search, CheckCircle, Circle, Loader, Eye, Edit, Mail, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { generarYDescargarRecibo as abrirReciboPDF } from '../../ventas/components/pdf/ReciboVentaPDF_NewTab';
import { obtenerTextoBoton } from '../../../shared/utils/documentTypeUtils';
import Tarjeta from '../../../shared/components/layout/Tarjeta';
import { formatearMonto, formatearFecha } from '../../../shared/utils/formatters';
import { supabase } from '../../../lib/supabase';
import DetalleVentaModal from './DetalleVentaModal';
import EditarVentaModal from './EditarVentaModal';
import { generarPDFsVenta, extraerInfoProductosParaEmail } from '../../ventas/utils/pdfGeneratorService';
import { enviarVentaPorEmail } from '../../ventas/utils/emailService';
import {
  CATEGORIAS_NOTEBOOKS_LABELS,
  CATEGORIAS_CELULARES_LABELS
} from '../../../shared/constants/productConstants';
import {
  CATEGORIAS_OTROS_LABELS
} from '../../../shared/constants/categoryConstants';

const VentasSection = ({ ventas, loading, error, onLoadStats }) => {
  // Filtro unificado: 'todos', 'notebooks', 'notebooks:macbook', 'celulares:iphone', 'otros:WATCHES', etc.
  const [filtroSeleccionado, setFiltroSeleccionado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [actualizandoContabilizado, setActualizandoContabilizado] = useState({});
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [ventaEnEdicion, setVentaEnEdicion] = useState(null);
  const [enviandoEmail, setEnviandoEmail] = useState({});
  const [eliminandoVenta, setEliminandoVenta] = useState({});

  // Parsear el filtro seleccionado en categoría y subcategoría
  const { filtroCategoria, filtroSubcategoria } = useMemo(() => {
    if (filtroSeleccionado === 'todos') return { filtroCategoria: 'todos', filtroSubcategoria: 'todos' };
    const parts = filtroSeleccionado.split(':');
    return {
      filtroCategoria: parts[0],
      filtroSubcategoria: parts[1] || 'todos'
    };
  }, [filtroSeleccionado]);

  const ventasFiltradas = useMemo(() => ventas.filter(transaccion => {
    if (!transaccion.venta_items?.length) return false;

    const fechaVenta = transaccion.fecha_venta.split('T')[0];
    if (fechaDesde && fechaVenta < fechaDesde) return false;
    if (fechaHasta && fechaVenta > fechaHasta) return false;

    // Filtro por categoría y subcategoría
    if (filtroCategoria !== 'todos') {
      const tieneProducto = transaccion.venta_items.some(item => {
        if (filtroCategoria === 'notebooks') {
          if (item.tipo_producto !== 'computadora') return false;
          if (filtroSubcategoria !== 'todos') {
            const categoriaProducto = item.producto_snapshot?.categoria || '';
            return categoriaProducto.toLowerCase() === filtroSubcategoria.toLowerCase();
          }
          return true;
        } else if (filtroCategoria === 'celulares') {
          if (item.tipo_producto !== 'celular') return false;
          if (filtroSubcategoria !== 'todos') {
            const categoriaProducto = item.producto_snapshot?.categoria || '';
            return categoriaProducto.toLowerCase() === filtroSubcategoria.toLowerCase();
          }
          return true;
        } else if (filtroCategoria === 'otros') {
          if (item.tipo_producto === 'computadora' || item.tipo_producto === 'celular') return false;
          if (filtroSubcategoria !== 'todos') {
            return item.tipo_producto === filtroSubcategoria.toUpperCase() ||
                   item.tipo_producto === filtroSubcategoria;
          }
          return true;
        }
        return false;
      });
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
  }), [ventas, fechaDesde, fechaHasta, filtroCategoria, filtroSubcategoria, busqueda]);

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

  const ITEMS_PER_PAGE = 50;
  const totalPaginas = Math.max(1, Math.ceil(ventasFiltradas.length / ITEMS_PER_PAGE));
  // Resetear a página 1 cuando cambian los filtros
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const ventasPaginadas = ventasFiltradas.slice((paginaSegura - 1) * ITEMS_PER_PAGE, paginaSegura * ITEMS_PER_PAGE);

  const formatearFechaCompleta = (fecha) => formatearFecha(fecha);

  const getIconoProducto = (tipo) => {
    switch (tipo) {
      case 'computadora': return <Monitor className="w-4 h-4 text-slate-600" />;
      case 'celular': return <Smartphone className="w-4 h-4 text-slate-600" />;
      default: return <Box className="w-4 h-4 text-slate-600" />;
    }
  };

  const formatearNombreProducto = (nombre) => {
    if (!nombre) return '';
    return nombre
      .replace(/_/g, ' / ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const getProductosDetallados = (items) => {
    if (!items || items.length === 0) return 'Sin productos';

    const itemsAMostrar = items.slice(0, 3);
    const itemsRestantes = items.length - 3;

    return (
      <>
        {itemsAMostrar.map((item, index) => (
          <div key={index} className="mb-1 last:mb-0">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {getIconoProducto(item.tipo_producto)}
              <div className="min-w-0 text-left">
                <div className="font-medium text-xs text-slate-800 truncate">{formatearNombreProducto(item.copy_documento || item.copy)}</div>
                {item.serial_producto && <div className="text-xs text-slate-500 font-mono truncate">{item.serial_producto}</div>}
              </div>
            </div>
          </div>
        ))}
        {itemsRestantes > 0 && (
          <div className="text-xs text-slate-500 italic mt-1">
            +{itemsRestantes} más...
          </div>
        )}
      </>
    );
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

  const manejarEnviarEmail = async (transaccion) => {
    // Obtener email actualizado del cliente si tiene cliente_id
    let emailDestino = transaccion.cliente_email || '';
    if (transaccion.cliente_id) {
      const { data: clienteActual } = await supabase
        .from('clientes')
        .select('email')
        .eq('id', transaccion.cliente_id)
        .single();
      if (clienteActual?.email) {
        emailDestino = clienteActual.email;
      }
    }

    // Pedir confirmación antes de enviar
    const clienteEmail = emailDestino || 'sin email';
    const confirmar = window.confirm(
      `¿Enviar email con recibo y garantías?\n\n` +
      `Cliente: ${transaccion.cliente_nombre}\n` +
      `Email: ${clienteEmail}\n` +
      `Transacción: ${transaccion.numero_transaccion}\n\n` +
      `Nota: El email puede aparecer como spam`
    );

    if (!confirmar) return;

    try {
      setEnviandoEmail(prev => ({ ...prev, [transaccion.id]: true }));

      // Generar PDFs
      const { reciboPDF, garantiasPDF } = await generarPDFsVenta(
        transaccion,
        {
          cliente_nombre: transaccion.cliente_nombre,
          cliente_email: emailDestino,
          cliente_telefono: transaccion.cliente_telefono,
          dni: transaccion.cliente_dni || ''
        }
      );

      // Extraer info de productos para el mensaje
      const productosInfo = extraerInfoProductosParaEmail(transaccion.venta_items);

      // Enviar email
      const resultadoEmail = await enviarVentaPorEmail({
        destinatario: emailDestino || 'soporte.updatenotebooks@gmail.com',
        nombreCliente: transaccion.cliente_nombre,
        reciboPDF,
        garantiasPDF,
        productos: productosInfo,
        numeroTransaccion: transaccion.numero_transaccion,
        totalVenta: (parseFloat(transaccion.monto_pago_1 || 0) + parseFloat(transaccion.monto_pago_2 || 0)),
        transaccion: transaccion
      });

      console.log('📧 Resultado del envío:', resultadoEmail);

      if (resultadoEmail.success) {
        alert(`✅ Email enviado exitosamente con ${resultadoEmail.adjuntosEnviados} adjuntos`);
      } else {
        throw new Error(resultadoEmail.error);
      }
    } catch (error) {
      console.error('❌ Error completo enviando email:', error);
      console.error('Stack trace:', error.stack);
      alert('❌ Error al enviar email: ' + error.message);
    } finally {
      setEnviandoEmail(prev => ({ ...prev, [transaccion.id]: false }));
    }
  };

  const manejarEliminarVenta = async (transaccion) => {
    // Pedir confirmación antes de eliminar
    const confirmar = window.confirm(
      `⚠️ ¿Estás seguro de eliminar esta venta?\n\n` +
      `Cliente: ${transaccion.cliente_nombre}\n` +
      `Transacción: ${transaccion.numero_transaccion}\n` +
      `Total: ${formatearMonto(transaccion.total_venta, 'USD')}\n\n` +
      `Esta acción NO se puede deshacer.`
    );

    if (!confirmar) return;

    try {
      setEliminandoVenta(prev => ({ ...prev, [transaccion.id]: true }));
      console.log('🗑️ Eliminando venta:', transaccion.numero_transaccion);

      // 1. Eliminar items de venta
      const { error: errorItems } = await supabase
        .from('venta_items')
        .delete()
        .eq('transaccion_id', transaccion.id);

      if (errorItems) throw errorItems;
      console.log('✅ Items de venta eliminados');

      // 2. Eliminar transacción
      const { error: errorVenta } = await supabase
        .from('transacciones')
        .delete()
        .eq('id', transaccion.id);

      if (errorVenta) throw errorVenta;
      console.log('✅ Venta eliminada');

      alert('✅ Venta eliminada exitosamente');

      // Recargar estadísticas
      if (onLoadStats) {
        onLoadStats();
      }
    } catch (error) {
      console.error('❌ Error eliminando venta:', error);
      alert('❌ Error al eliminar venta: ' + error.message);
    } finally {
      setEliminandoVenta(prev => ({ ...prev, [transaccion.id]: false }));
    }
  };

  // Obtener la etiqueta del filtro activo para mostrar
  const etiquetaFiltroActivo = useMemo(() => {
    if (filtroSeleccionado === 'todos') return null;
    if (filtroCategoria === 'notebooks') {
      if (filtroSubcategoria === 'todos') return 'Notebooks';
      return `Notebooks → ${CATEGORIAS_NOTEBOOKS_LABELS[filtroSubcategoria] || filtroSubcategoria}`;
    }
    if (filtroCategoria === 'celulares') {
      if (filtroSubcategoria === 'todos') return 'Celulares';
      return `Celulares → ${CATEGORIAS_CELULARES_LABELS[filtroSubcategoria] || filtroSubcategoria}`;
    }
    if (filtroCategoria === 'otros') {
      if (filtroSubcategoria === 'todos') return 'Otros';
      return `Otros → ${CATEGORIAS_OTROS_LABELS[filtroSubcategoria] || filtroSubcategoria}`;
    }
    return null;
  }, [filtroSeleccionado, filtroCategoria, filtroSubcategoria]);

  return (
    <div className="bg-slate-50 min-h-full w-full">
      {/* Top section: Cards and Filters */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Tarjeta icon={BarChart3} titulo="Transacciones" valor={estadisticasFiltradas.totalVentas} />
          <Tarjeta icon={DollarSign} titulo="Ingresos" valor={formatearMonto(estadisticasFiltradas.totalIngresos, 'USD')} />
          <Tarjeta icon={TrendingUp} titulo="Ganancias" valor={formatearMonto(estadisticasFiltradas.totalGanancias, 'USD')} />
          <Tarjeta icon={TrendingUp} titulo="Margen Promedio" valor={`${estadisticasFiltradas.margenPromedio}%`} />
        </div>

        <div className="bg-white p-4 rounded border border-slate-200">
          <div className="flex flex-wrap items-end gap-3">
            {/* Categoría unificada con optgroup */}
            <div className="min-w-[240px]">
              <label className="block text-xs font-medium text-slate-700 mb-1">Categoría</label>
              <select
                value={filtroSeleccionado}
                onChange={(e) => { setFiltroSeleccionado(e.target.value); setPaginaActual(1); }}
                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                <option value="todos">Todos</option>
                <optgroup label="NOTEBOOKS">
                  <option value="notebooks">NOTEBOOKS (todas)</option>
                  {Object.entries(CATEGORIAS_NOTEBOOKS_LABELS).sort((a, b) => a[1].localeCompare(b[1])).map(([key, label]) => (
                    <option key={key} value={`notebooks:${key}`}>&nbsp;&nbsp;{label}</option>
                  ))}
                </optgroup>
                <optgroup label="CELULARES">
                  <option value="celulares">CELULARES (todos)</option>
                  {Object.entries(CATEGORIAS_CELULARES_LABELS).sort((a, b) => a[1].localeCompare(b[1])).map(([key, label]) => (
                    <option key={key} value={`celulares:${key}`}>&nbsp;&nbsp;{label}</option>
                  ))}
                </optgroup>
                <optgroup label="OTROS">
                  <option value="otros">OTROS (todos)</option>
                  {Object.entries(CATEGORIAS_OTROS_LABELS).sort((a, b) => a[1].localeCompare(b[1])).map(([key, label]) => (
                    <option key={key} value={`otros:${key}`}>&nbsp;&nbsp;{label}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            {/* Buscar */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-slate-700 mb-1">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input type="text" value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }} placeholder="Producto, serial, cliente..." className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
              </div>
            </div>
            {/* Desde */}
            <div className="min-w-[160px]">
              <label className="block text-xs font-medium text-slate-700 mb-1">Desde</label>
              <input type="date" value={fechaDesde} onChange={(e) => { setFechaDesde(e.target.value); setPaginaActual(1); }} className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
            </div>
            {/* Hasta */}
            <div className="min-w-[160px]">
              <label className="block text-xs font-medium text-slate-700 mb-1">Hasta</label>
              <input type="date" value={fechaHasta} onChange={(e) => { setFechaHasta(e.target.value); setPaginaActual(1); }} className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
            </div>
            {/* Limpiar */}
            {(filtroSeleccionado !== 'todos' || busqueda || fechaDesde || fechaHasta) && (
              <button
                onClick={() => {
                  setFiltroSeleccionado('todos');
                  setBusqueda('');
                  setFechaDesde('');
                  setFechaHasta('');
                  setPaginaActual(1);
                }}
                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors whitespace-nowrap"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table section - no internal scroll, page scrolls */}
      <div className="px-6 pb-6">
        {loading && <p className="text-slate-600 text-center py-10">Cargando ventas...</p>}
        {error && <p className="text-red-600 text-center py-10">Error: {error}</p>}
        {!loading && !error && (
          <div className="bg-white rounded border border-slate-200">
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
              <p className="text-sm text-slate-700">
                {ventasFiltradas.length} transacciones
                {ventasFiltradas.length > ITEMS_PER_PAGE && (
                  <span className="text-slate-500"> — Página {paginaSegura} de {totalPaginas}</span>
                )}
                {etiquetaFiltroActivo && (
                  <span className="ml-2 text-emerald-600 font-medium">
                    — {etiquetaFiltroActivo}
                  </span>
                )}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-slate-200 table-fixed">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="px-4 py-2 text-center text-xs font-medium uppercase w-10">Contab.</th>
                    <th className="px-4 py-2 text-center text-xs font-medium uppercase w-24">Fecha</th>
                    <th className="px-4 py-2 text-center text-xs font-medium uppercase">Productos</th>
                    <th className="px-4 py-2 text-center text-xs font-medium uppercase w-48">Cliente</th>
                    <th className="px-4 py-2 text-center text-xs font-medium uppercase w-24">Total</th>
                    <th className="px-4 py-2 text-center text-xs font-medium uppercase w-24">Ganancia</th>
                    <th className="px-4 py-2 text-center text-xs font-medium uppercase w-24">Vendedor</th>
                    <th className="px-4 py-2 text-center text-xs font-medium uppercase w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {ventasPaginadas.map((transaccion, idx) => (
                    <tr
                      key={transaccion.id}
                      onClick={() => setVentaSeleccionada(transaccion)}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${transaccion.contabilizado ? 'bg-emerald-50' : ''}`}
                    >
                      {/* Contabilizado */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleContabilizado(transaccion.id, transaccion.contabilizado);
                          }}
                          disabled={actualizandoContabilizado[transaccion.id]}
                          className="p-1 rounded hover:bg-slate-100 disabled:opacity-50 transition-colors"
                          title={transaccion.contabilizado ? 'Marcar como no contabilizado' : 'Marcar como contabilizado'}
                        >
                          {actualizandoContabilizado[transaccion.id] ? (
                            <Loader className="w-4 h-4 text-slate-400 animate-spin" />
                          ) : transaccion.contabilizado ? (
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </td>

                      {/* Fecha */}
                      <td className="px-4 py-3 text-xs text-slate-800 whitespace-nowrap text-center">
                        {formatearFechaCompleta(transaccion.fecha_venta)}
                      </td>

                      {/* Productos */}
                      <td className="px-4 py-3 text-sm text-slate-800 text-start">
                        {getProductosDetallados(transaccion.venta_items || [])}
                      </td>

                      {/* Cliente */}
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-slate-800 font-medium truncate">{transaccion.cliente_nombre}</p>
                            {transaccion.cliente_email && <p className="text-xs text-slate-500 truncate">{transaccion.cliente_email}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3 text-center text-sm font-semibold text-slate-800">
                        {formatearMonto((parseFloat(transaccion.monto_pago_1 || 0) + parseFloat(transaccion.monto_pago_2 || 0)), 'USD')}
                      </td>

                      {/* Ganancia */}
                      <td className="px-4 py-3 text-center text-sm font-semibold">
                        <span className={transaccion.margen_total >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                          {formatearMonto(transaccion.margen_total || 0, 'USD')}
                        </span>
                      </td>

                      {/* Vendedor */}
                      <td className="px-4 py-3 text-center text-sm text-slate-800">
                        {transaccion.vendedor || '-'}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              manejarAbrirRecibo(transaccion);
                            }}
                            className="text-slate-600 hover:text-slate-800 p-1 rounded hover:bg-slate-100 transition-colors"
                            title="Ver recibo"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              manejarEnviarEmail(transaccion);
                            }}
                            disabled={enviandoEmail[transaccion.id]}
                            className="text-slate-600 hover:text-emerald-600 p-1 rounded hover:bg-emerald-50 transition-colors disabled:opacity-50"
                            title="Enviar email con recibo y garantías"
                          >
                            {enviandoEmail[transaccion.id] ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <Mail className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  {(paginaSegura - 1) * ITEMS_PER_PAGE + 1}–{Math.min(paginaSegura * ITEMS_PER_PAGE, ventasFiltradas.length)} de {ventasFiltradas.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                    disabled={paginaSegura <= 1}
                    className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                  </button>
                  <span className="text-sm font-medium text-slate-700 min-w-[80px] text-center">
                    {paginaSegura} / {totalPaginas}
                  </span>
                  <button
                    onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                    disabled={paginaSegura >= totalPaginas}
                    className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {ventaSeleccionada && (
        <DetalleVentaModal
          transaccion={ventaSeleccionada}
          onClose={() => setVentaSeleccionada(null)}
          onEditar={(transaccion) => {
            setVentaSeleccionada(null);
            setVentaEnEdicion(transaccion);
          }}
          onEliminar={(transaccion) => {
            setVentaSeleccionada(null);
            manejarEliminarVenta(transaccion);
          }}
        />
      )}

      {/* Modal de edición */}
      {ventaEnEdicion && (
        <EditarVentaModal
          transaccion={ventaEnEdicion}
          onClose={() => setVentaEnEdicion(null)}
          onSave={() => {
            setVentaEnEdicion(null);
            if (onLoadStats) onLoadStats();
          }}
        />
      )}
    </div>
  );
};

export default VentasSection;

