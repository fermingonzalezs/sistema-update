import React, { useEffect, useState, useMemo } from 'react';
import { Trash2, ChevronRight, ChevronDown, AlertCircle, Eye, Pencil, User, Package } from 'lucide-react';
import { useCajas } from '../hooks/useCajas';
import { useImportaciones } from '../hooks/useImportaciones';
import NuevoIngresoModal from './NuevoIngresoModal';
import DetalleIngresoModal from './DetalleIngresoModal';
import EditarIngresoModal from './EditarIngresoModal';
import { formatearFechaDisplay } from '../../../shared/config/timezone';
import { supabase } from '../../../lib/supabase';

const IngresosSection = ({ showNuevoIngreso, setShowNuevoIngreso, onIngresoUpdated }) => {
  const { cajas, loading, error, fetchCajas, eliminarIngreso, editarIngreso } = useCajas();
  const { recibos, fetchRecibos } = useImportaciones();

  const [expandedIngresos, setExpandedIngresos] = useState({});
  const [ingresoDetalle, setIngresoDetalle] = useState(null);
  const [ingresoEditar, setIngresoEditar] = useState(null);

  // Estado para editar courier
  const [courierEditando, setCourierEditando] = useState(null);
  const [courierEditPeso, setCourierEditPeso] = useState('');
  const [courierEditMonto, setCourierEditMonto] = useState('');
  const [courierEditCosto, setCourierEditCosto] = useState('');
  const [guardandoCourier, setGuardandoCourier] = useState(false);

  useEffect(() => {
    fetchCajas();
    fetchRecibos();
  }, [fetchCajas, fetchRecibos]);

  const toggleIngreso = (id) => {
    setExpandedIngresos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const ingresos = useMemo(() => cajas.filter(c => c.estado === 'recepcionada'), [cajas]);

  const couriersRecepcionados = useMemo(() =>
    recibos.filter(r => r.tipo === 'courier_cliente' && r.estado === 'recepcionado'),
  [recibos]);

  // Lista unificada ordenada por fecha desc
  const entradas = useMemo(() => {
    const cajasEntry = ingresos.map(c => ({ _tipo: 'caja', _fecha: c.fecha_recepcion || '', _data: c }));
    const couriersEntry = couriersRecepcionados.map(r => ({ _tipo: 'courier', _fecha: r.fecha_recepcion_argentina || '', _data: r }));
    return [...cajasEntry, ...couriersEntry].sort((a, b) => b._fecha.localeCompare(a._fecha));
  }, [ingresos, couriersRecepcionados]);

  const handleEliminar = async (ingreso) => {
    const totalItems = (ingreso.importaciones_items || []).length;
    const msg = totalItems > 0
      ? `¿Eliminar el ingreso ${ingreso.numero_caja}?\n\nSus ${totalItems} item(s) volverán al estado "no ingresado" y los recibos afectados podrían revertir su estado.`
      : `¿Eliminar el ingreso ${ingreso.numero_caja}?`;
    if (!window.confirm(msg)) return;
    try {
      await eliminarIngreso(ingreso.id);
      await fetchRecibos();
      if (onIngresoUpdated) await onIngresoUpdated();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const agruparPorRecibo = (ingreso) => {
    const grupos = {};
    (ingreso.importaciones_items || []).forEach(item => {
      const rid = item.recibo_id;
      if (!grupos[rid]) grupos[rid] = { recibo: item.importaciones_recibos, items: [] };
      grupos[rid].items.push(item);
    });
    return Object.values(grupos);
  };

  const calcularFOBTotal = (ingreso) => {
    return (ingreso.importaciones_items || []).reduce((sum, i) => {
      return sum + parseFloat(i.precio_unitario_usd || 0) * (i.cantidad || 1);
    }, 0);
  };

  const handleEliminarCourier = async (recibo) => {
    if (!window.confirm(`¿Quitar el ingreso del courier ${recibo.numero_recibo}?\n\nEl servicio volverá al estado "en tránsito" y podrá ingresarse nuevamente.`)) return;
    try {
      const { error } = await supabase
        .from('importaciones_recibos')
        .update({
          estado: 'en_transito_usa',
          fecha_recepcion_argentina: null,
          peso_sin_caja_kg: null,
          monto_cobrado_usd: null,
          costo_courier_usd: null,
        })
        .eq('id', recibo.id);
      if (error) throw error;
      await fetchRecibos();
      if (onIngresoUpdated) await onIngresoUpdated();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const abrirEditCourier = (recibo) => {
    setCourierEditando(recibo);
    setCourierEditPeso(recibo.peso_sin_caja_kg != null ? String(recibo.peso_sin_caja_kg) : '');
    setCourierEditMonto(recibo.monto_cobrado_usd != null ? String(recibo.monto_cobrado_usd) : '');
    setCourierEditCosto(recibo.costo_courier_usd != null ? String(recibo.costo_courier_usd) : '');
  };

  const guardarCourier = async () => {
    if (!courierEditando) return;
    setGuardandoCourier(true);
    try {
      const updateData = {};
      if (courierEditPeso !== '') updateData.peso_sin_caja_kg = parseFloat(courierEditPeso);
      if (courierEditMonto !== '') updateData.monto_cobrado_usd = parseFloat(courierEditMonto);
      if (courierEditCosto !== '') updateData.costo_courier_usd = parseFloat(courierEditCosto);
      const { error: err } = await supabase
        .from('importaciones_recibos')
        .update(updateData)
        .eq('id', courierEditando.id);
      if (err) throw err;
      setCourierEditando(null);
      await fetchRecibos();
      if (onIngresoUpdated) await onIngresoUpdated();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setGuardandoCourier(false);
    }
  };

  return (
    <div>
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-slate-600">Cargando ingresos...</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mb-4">
          <div className="text-red-700">Error: {error}</div>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white">
          {entradas.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <AlertCircle size={32} className="mx-auto mb-3 text-slate-300" />
              <p>No hay ingresos registrados</p>
              <p className="text-sm text-slate-400 mt-1">Hacé clic en "Nuevo Ingreso" para registrar la llegada de mercadería</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: '800px' }}>
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="w-8 py-3"></th>
                    <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider w-24">Tipo</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-28">N° Ingreso</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-28">F. Ingreso</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-16">Items</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Pedidos / Cliente</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-28">Peso c/ caja</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-28">FOB</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-28">Costo Courier</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-20">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {entradas.map((entrada, idx) => {
                    const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50';

                    if (entrada._tipo === 'courier') {
                      const recibo = entrada._data;
                      const expandKey = `c_${recibo.id}`;
                      const isExpanded = expandedIngresos[expandKey];
                      return (
                        <React.Fragment key={expandKey}>
                          <tr className={rowBg}>
                            <td className="py-3 text-center">
                              <button
                                onClick={() => toggleIngreso(expandKey)}
                                className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                              >
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </button>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded uppercase tracking-wider">
                                <User size={10} />Courier
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="font-mono text-xs text-slate-800">{recibo.numero_recibo}</span>
                            </td>
                            <td className="px-4 py-3 text-xs text-center text-slate-500">
                              {recibo.fecha_recepcion_argentina ? formatearFechaDisplay(recibo.fecha_recepcion_argentina) : '—'}
                            </td>
                            <td className="px-4 py-3 text-xs text-center text-slate-800">1</td>
                            <td className="px-4 py-3 text-xs text-slate-700">
                              {recibo.clientes
                                ? `${recibo.clientes.nombre} ${recibo.clientes.apellido || ''}`.trim()
                                : '—'}
                              {recibo.observaciones && (
                                <span className="text-slate-400"> — {recibo.observaciones}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs text-center text-slate-600">
                              {recibo.peso_sin_caja_kg
                                ? `${parseFloat(recibo.peso_sin_caja_kg).toFixed(2)} kg`
                                : <span className="text-red-400">—</span>}
                            </td>
                            <td className="px-4 py-3 text-xs text-center text-slate-800">
                              {'—'}
                            </td>
                            <td className="px-4 py-3 text-xs text-center text-emerald-700 font-medium">
                              {recibo.costo_courier_usd
                                ? `U$ ${Math.round(parseFloat(recibo.costo_courier_usd))}`
                                : <span className="text-red-400">—</span>}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex justify-center gap-3">
                                <button
                                  onClick={() => toggleIngreso(expandKey)}
                                  className="text-emerald-600 hover:text-emerald-700 transition-colors"
                                  title="Ver detalles"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => abrirEditCourier(recibo)}
                                  className="text-blue-500 hover:text-blue-700 transition-colors"
                                  title="Editar courier"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={() => handleEliminarCourier(recibo)}
                                  className="text-red-400 hover:text-red-600 transition-colors"
                                  title="Eliminar courier"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={10} className="bg-slate-50 px-0 py-0">
                                <div className="divide-y divide-slate-200">
                                  <div className="flex items-center gap-8 px-6 py-2 bg-slate-800 text-white text-xs">
                                    <span className="whitespace-nowrap">
                                      <span className="text-slate-400 uppercase tracking-wider text-[10px] mr-1.5">Servicio</span>
                                      {recibo.numero_recibo}
                                    </span>
                                    <span className="whitespace-nowrap">
                                      <span className="text-slate-400 uppercase tracking-wider text-[10px] mr-1.5">Cliente</span>
                                      {recibo.clientes ? `${recibo.clientes.nombre} ${recibo.clientes.apellido || ''}`.trim() : '—'}
                                    </span>
                                    {recibo.empresa_logistica && (
                                      <span className="whitespace-nowrap">
                                        <span className="text-slate-400 uppercase tracking-wider text-[10px] mr-1.5">Logística</span>
                                        {recibo.empresa_logistica}
                                      </span>
                                    )}
                                  </div>
                                  <table className="w-full">
                                    <thead className="bg-slate-700 text-white">
                                      <tr>
                                        <th className="w-6 py-1"></th>
                                        <th className="px-2 py-1 text-left text-[10px] font-medium uppercase tracking-wider">DESCRIPCIÓN</th>
                                        <th className="px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wider whitespace-nowrap">PESO TOTAL</th>
                                        <th className="px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wider whitespace-nowrap">COBRADO</th>
                                        <th className="px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wider whitespace-nowrap">TRACKING</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr className="hover:bg-white transition-colors">
                                        <td className="w-6 py-1 text-slate-300 text-xs text-center">↳</td>
                                        <td className="px-2 py-1.5 text-xs text-slate-600">{recibo.observaciones || '—'}</td>
                                        <td className="px-2 py-1.5 text-xs text-center text-slate-600 whitespace-nowrap">
                                          {recibo.peso_sin_caja_kg ? `${parseFloat(recibo.peso_sin_caja_kg).toFixed(3)} kg` : '—'}
                                        </td>
                                        <td className="px-2 py-1.5 text-xs text-center text-emerald-700 font-medium whitespace-nowrap">
                                          {recibo.monto_cobrado_usd ? `U$ ${parseFloat(recibo.monto_cobrado_usd).toFixed(2)}` : '—'}
                                        </td>
                                        <td className="px-2 py-1.5 text-xs text-center text-slate-500 whitespace-nowrap">
                                          {recibo.tracking_number || '—'}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    }

                    // Caja normal
                    const ingreso = entrada._data;
                    const grupos = agruparPorRecibo(ingreso);
                    const totalItems = (ingreso.importaciones_items || []).length;
                    const fobTotal = calcularFOBTotal(ingreso);
                    const isExpanded = expandedIngresos[ingreso.id];
                    return (
                      <React.Fragment key={`caja_${ingreso.id}`}>
                        <tr className={rowBg}>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => toggleIngreso(ingreso.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                            >
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded uppercase tracking-wider">
                              <Package size={10} />Caja
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-mono text-xs text-slate-800">{ingreso.numero_caja}</span>
                            {ingreso.descripcion && (
                              <span className="text-xs text-slate-400 ml-1">· {ingreso.descripcion}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-center text-slate-500">
                            {ingreso.fecha_recepcion ? formatearFechaDisplay(ingreso.fecha_recepcion) : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-center text-slate-800">{totalItems}</td>
                          <td className="px-4 py-3 text-xs text-slate-600 max-w-0 overflow-hidden">
                            <div className="flex flex-col gap-0.5 text-left w-full overflow-hidden">
                              {grupos.map((grupo, gi) => {
                                const fullText = [
                                  grupo.recibo?.proveedores?.nombre ? `(${grupo.recibo.proveedores.nombre})` : null,
                                  grupo.recibo?.observaciones
                                ].filter(Boolean).join(' ');
                                return (
                                  <span key={gi} className="block truncate" title={fullText || undefined}>
                                    {grupo.recibo?.proveedores?.nombre && (
                                      <span className="text-slate-400">({grupo.recibo.proveedores.nombre}) </span>
                                    )}
                                    {grupo.recibo?.observaciones || '—'}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-center text-slate-600">
                            {ingreso.peso_total_con_caja_kg
                              ? `${parseFloat(ingreso.peso_total_con_caja_kg).toFixed(2)} kg`
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-center text-slate-800">
                            {fobTotal > 0 ? `U$ ${Math.round(fobTotal).toLocaleString('es-AR')}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-center text-emerald-700">
                            {ingreso.costo_total_usd
                              ? `U$ ${Math.round(parseFloat(ingreso.costo_total_usd)).toLocaleString('es-AR')}`
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-3">
                              <button
                                onClick={() => setIngresoDetalle(ingreso)}
                                className="text-emerald-600 hover:text-emerald-700 transition-colors"
                                title="Ver detalles"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => setIngresoEditar(ingreso)}
                                className="text-blue-500 hover:text-blue-700 transition-colors"
                                title="Editar ingreso"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => handleEliminar(ingreso)}
                                className="text-red-400 hover:text-red-600 transition-colors"
                                title="Eliminar ingreso"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan={10} className="bg-slate-50 px-0 py-0">
                              {grupos.length === 0 ? (
                                <div className="px-8 py-4 text-xs text-slate-400 italic">Sin items</div>
                              ) : (
                                <div className="divide-y divide-slate-200">
                                  {grupos.map((grupo, gi) => (
                                    <div key={gi}>
                                      <div className="flex items-center justify-center gap-8 px-6 py-2 bg-slate-800 text-white text-xs">
                                        <span className="whitespace-nowrap">
                                          <span className="text-slate-400 uppercase tracking-wider text-[10px] mr-1.5">Pedido</span>
                                          {grupo.recibo?.numero_recibo || '—'}
                                        </span>
                                        <span className="whitespace-nowrap">
                                          <span className="text-slate-400 uppercase tracking-wider text-[10px] mr-1.5">Proveedor</span>
                                          {grupo.recibo?.proveedores?.nombre || '—'}
                                        </span>
                                        <span className="truncate max-w-xs">
                                          <span className="text-slate-400 uppercase tracking-wider text-[10px] mr-1.5">Descripción</span>
                                          {grupo.recibo?.observaciones || '—'}
                                        </span>
                                      </div>
                                      <table className="w-full">
                                        <thead className="bg-slate-700 text-white">
                                          <tr>
                                            <th className="w-6 py-1"></th>
                                            <th className="px-2 py-1 text-left text-[10px] font-medium uppercase tracking-wider">PRODUCTO</th>
                                            <th className="px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wider whitespace-nowrap">CANT.</th>
                                            <th className="px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wider whitespace-nowrap">COLOR</th>
                                            <th className="px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wider whitespace-nowrap">ALMAC.</th>
                                            <th className="px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wider whitespace-nowrap">PESO</th>
                                            <th className="px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wider whitespace-nowrap">FOB</th>
                                            <th className="px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wider whitespace-nowrap">ENVÍO</th>
                                            <th className="px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wider whitespace-nowrap">C. FINANCIERO</th>
                                            <th className="px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wider whitespace-nowrap">P. FINAL UNIT</th>
                                            <th className="px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wider whitespace-nowrap">P. FINAL TOTAL</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {grupo.items.map(item => {
                                            const precioFinalUnit =
                                              parseFloat(item.precio_unitario_usd || 0) +
                                              parseFloat(item.costo_envio_usd || 0) +
                                              parseFloat(item.costo_financiero_usd || 0);
                                            const precioFinalTotal = precioFinalUnit * (item.cantidad || 1);
                                            return (
                                              <tr key={item.id} className="hover:bg-white transition-colors">
                                                <td className="w-6 py-1 text-slate-300 text-xs text-center">↳</td>
                                                <td className="px-2 py-1 text-xs text-slate-600 max-w-0 overflow-hidden">
                                                  <span className="block truncate" title={item.item}>{item.item}</span>
                                                </td>
                                                <td className="px-2 py-1 text-xs text-center text-slate-600 whitespace-nowrap">{item.cantidad}</td>
                                                <td className="px-2 py-1 text-xs text-center text-slate-600 whitespace-nowrap">{item.color || '—'}</td>
                                                <td className="px-2 py-1 text-xs text-center text-slate-600 whitespace-nowrap">{item.almacenamiento || '—'}</td>
                                                <td className="px-2 py-1 text-xs text-center text-slate-600 whitespace-nowrap">
                                                  {parseFloat(item.peso_real_unitario_kg || 0).toFixed(3)} kg
                                                </td>
                                                <td className="px-2 py-1 text-xs text-center text-slate-600 whitespace-nowrap">
                                                  U$ {parseFloat(item.precio_unitario_usd || 0).toFixed(1)}
                                                </td>
                                                <td className="px-2 py-1 text-xs text-center text-slate-600 whitespace-nowrap">
                                                  {item.costo_envio_usd ? `U$ ${parseFloat(item.costo_envio_usd).toFixed(1)}` : '—'}
                                                </td>
                                                <td className="px-2 py-1 text-xs text-center text-slate-600 whitespace-nowrap">
                                                  {item.costo_financiero_usd ? `U$ ${parseFloat(item.costo_financiero_usd).toFixed(1)}` : '—'}
                                                </td>
                                                <td className="px-2 py-1 text-xs text-center text-slate-600 whitespace-nowrap">
                                                  {precioFinalUnit > 0 ? `U$ ${precioFinalUnit.toFixed(1)}` : '—'}
                                                </td>
                                                <td className="px-2 py-1 text-xs text-center text-slate-600 whitespace-nowrap">
                                                  {precioFinalTotal > 0 ? `U$ ${precioFinalTotal.toFixed(1)}` : '—'}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal editar courier */}
      {courierEditando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded border border-slate-200 w-80 p-6">
            <h3 className="font-semibold text-slate-800 mb-1">Editar Courier</h3>
            <p className="text-xs text-slate-500 mb-4 font-mono">{courierEditando.numero_recibo}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peso total (kg)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={courierEditPeso}
                  onChange={e => setCourierEditPeso(e.target.value)}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Costo courier (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={courierEditCosto}
                  onChange={e => setCourierEditCosto(e.target.value)}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto cobrado (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={courierEditMonto}
                  onChange={e => setCourierEditMonto(e.target.value)}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={guardarCourier}
                  disabled={guardandoCourier}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {guardandoCourier ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={() => setCourierEditando(null)}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 rounded text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNuevoIngreso && (
        <NuevoIngresoModal
          recibos={recibos}
          onClose={() => setShowNuevoIngreso(false)}
          onSuccess={async () => {
            setShowNuevoIngreso(false);
            await fetchCajas();
            await fetchRecibos();
            if (onIngresoUpdated) await onIngresoUpdated();
          }}
        />
      )}

      {ingresoDetalle && (
        <DetalleIngresoModal
          ingreso={ingresoDetalle}
          onClose={() => setIngresoDetalle(null)}
          onEdit={(ing) => { setIngresoEditar(ing); }}
        />
      )}

      {ingresoEditar && (
        <EditarIngresoModal
          ingreso={ingresoEditar}
          onClose={() => setIngresoEditar(null)}
          onSuccess={async (datos) => {
            await editarIngreso(ingresoEditar.id, datos);
            await fetchRecibos();
            if (onIngresoUpdated) await onIngresoUpdated();
            setIngresoEditar(null);
          }}
        />
      )}
    </div>
  );
};

export default IngresosSection;
