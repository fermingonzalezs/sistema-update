import React, { useState, useMemo } from 'react';
import { X, PackageCheck, ChevronDown, ChevronRight, ArrowRight, User } from 'lucide-react';
import { useCajas } from '../hooks/useCajas';
import { obtenerFechaArgentina, formatearFechaDisplay } from '../../../shared/config/timezone';
import { COLORES_ESTADOS, LABELS_ESTADOS } from '../constants/estadosImportacion';

const NuevoIngresoModal = ({ recibos, onClose, onSuccess }) => {
  const { crearIngreso } = useCajas();

  const [paso, setPaso] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Paso 1 — selección
  const [descripcion, setDescripcion] = useState('');
  const [itemsSeleccionados, setItemsSeleccionados] = useState({});       // { [itemId]: bool } — para importacion/courier_empresa
  const [courierClientesSel, setCourierClientesSel] = useState({});       // { [reciboId]: bool } — para courier_cliente

  const [gruposExpandidos, setGruposExpandidos] = useState({});

  // Paso 2 — costos y pesos
  const [form, setForm] = useState({
    fecha_recepcion: obtenerFechaArgentina(),
    peso_total_con_caja_kg: '',
    precio_por_kg_usd: '',
    pago_courier_usd: '',
    costo_picking_shipping_usd: ''
  });
  const [pesosReales, setPesosReales] = useState({});          // { [itemId]: kg } — items normales
  const [pesosCourierCliente, setPesosCourierCliente] = useState({});  // { [reciboId]: kg } — pedidos courier cliente

  // ── Separar tipos de recibos ──
  const pedidosConItems = useMemo(() =>
    (recibos || []).filter(r =>
      r.estado !== 'recepcionado' &&
      r.tipo !== 'courier_cliente' &&
      (r.importaciones_items || []).length > 0
    ), [recibos]);

  const courierClientesDisponibles = useMemo(() =>
    (recibos || []).filter(r =>
      r.tipo === 'courier_cliente' &&
      r.estado !== 'recepcionado'
    ), [recibos]);

  // ── IDs seleccionados ──
  const idsItemsSeleccionados = useMemo(
    () => Object.entries(itemsSeleccionados).filter(([, v]) => v).map(([id]) => id),
    [itemsSeleccionados]
  );
  const idsCourierClientesSel = useMemo(
    () => Object.entries(courierClientesSel).filter(([, v]) => v).map(([id]) => id),
    [courierClientesSel]
  );

  const haySeleccion = idsItemsSeleccionados.length > 0 || idsCourierClientesSel.length > 0;

  // Items completos seleccionados (para paso 2)
  const itemsCompletos = useMemo(() => {
    const allItems = pedidosConItems.flatMap(r =>
      (r.importaciones_items || []).map(i => ({ ...i, importaciones_recibos: r }))
    );
    return allItems.filter(i => idsItemsSeleccionados.includes(String(i.id)));
  }, [pedidosConItems, idsItemsSeleccionados]);

  // Recibos courier_cliente seleccionados completos
  const courierClientesCompletos = useMemo(() =>
    courierClientesDisponibles.filter(r => idsCourierClientesSel.includes(r.id)),
    [courierClientesDisponibles, idsCourierClientesSel]
  );

  // Grupos por recibo para paso 2 (items normales)
  const gruposPaso2 = useMemo(() => {
    const grupos = {};
    itemsCompletos.forEach(item => {
      const rid = item.recibo_id;
      if (!grupos[rid]) grupos[rid] = { recibo: item.importaciones_recibos, items: [] };
      grupos[rid].items.push(item);
    });
    return Object.values(grupos);
  }, [itemsCompletos]);

  // Al pasar al paso 2, inicializar pesos
  const irPaso2 = () => {
    const pesos = {};
    itemsCompletos.forEach(item => {
      pesos[item.id] = item.peso_estimado_unitario_kg ?? '';
    });
    const pesosCli = {};
    courierClientesCompletos.forEach(r => {
      pesosCli[r.id] = '';
    });
    setPesosReales(pesos);
    setPesosCourierCliente(pesosCli);
    setPaso(2);
  };

  // ── Selección items normales ──
  const toggleItem = (itemId) =>
    setItemsSeleccionados(prev => ({ ...prev, [itemId]: !prev[itemId] }));

  const toggleTodosDelRecibo = (recibo) => {
    const items = (recibo.importaciones_items || []).filter(i => !i.caja_id);
    const todos = items.every(i => itemsSeleccionados[i.id]);
    const updates = {};
    items.forEach(i => { updates[i.id] = !todos; });
    setItemsSeleccionados(prev => ({ ...prev, ...updates }));
  };

  const toggleGrupo = (reciboId) =>
    setGruposExpandidos(prev => ({ ...prev, [reciboId]: !prev[reciboId] }));

  // ── Selección courier cliente ──
  const toggleCourierCliente = (reciboId) =>
    setCourierClientesSel(prev => ({ ...prev, [reciboId]: !prev[reciboId] }));

  // ── Cálculos costo distribución (solo items normales) ──
  const costoTotal = parseFloat(form.pago_courier_usd || 0) + parseFloat(form.costo_picking_shipping_usd || 0);

  const totalPesoReal = useMemo(() =>
    itemsCompletos.reduce((sum, item) => {
      const pesoUnit = parseFloat(pesosReales[item.id] || 0);
      return sum + pesoUnit * (item.cantidad || 1);
    }, 0),
    [pesosReales, itemsCompletos]
  );

  const proyeccion = useMemo(() =>
    itemsCompletos.map(item => {
      const pesoUnit = parseFloat(pesosReales[item.id] || 0);
      const pesoTotal = pesoUnit * (item.cantidad || 1);
      const proporcion = totalPesoReal > 0 ? pesoTotal / totalPesoReal : 0;
      const costoEnvioUnit = (item.cantidad || 1) > 0
        ? (proporcion * costoTotal) / item.cantidad
        : 0;
      const porcFin = parseFloat(item.importaciones_recibos?.porcentaje_financiero || 0);
      const costoFinUnit = parseFloat(item.precio_unitario_usd || 0) * porcFin / 100;
      const costoFinalUnit = parseFloat(item.precio_unitario_usd || 0) + costoEnvioUnit + costoFinUnit;
      return { id: item.id, costoEnvioUnit, costoFinUnit, costoFinalUnit };
    }),
    [itemsCompletos, pesosReales, totalPesoReal, costoTotal]
  );

  const formatNum = (n) => isNaN(n) || n === 0 ? '—' : `$${parseFloat(n).toFixed(2)}`;

  // ── Submit ──
  const handleSubmit = async () => {
    if (!form.fecha_recepcion) { alert('La fecha de ingreso es obligatoria'); return; }
    setIsSubmitting(true);
    try {
      await crearIngreso({
        descripcion,
        observaciones: '',
        itemIds: idsItemsSeleccionados,
        datosRecepcion: { ...form, peso_sin_caja_kg: totalPesoReal > 0 ? totalPesoReal.toFixed(3) : null },
        pesosReales,
        courierClienteRecibos: courierClientesCompletos.map(r => ({
          reciboId: r.id,
          peso: pesosCourierCliente[r.id] || null
        }))
      });
      onSuccess();
    } catch (err) {
      alert('Error al crear ingreso: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded border border-slate-200 w-full max-w-5xl flex flex-col max-h-[94vh]">

        {/* Header */}
        <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between rounded-t flex-shrink-0">
          <div className="flex items-center gap-3">
            <PackageCheck size={22} />
            <div>
              <h3 className="text-lg font-semibold">Nuevo Ingreso</h3>
              <p className="text-slate-300 text-xs mt-0.5">
                {paso === 1 ? 'Paso 1 — Seleccioná los pedidos o servicios a ingresar' : 'Paso 2 — Pesos y costos de courier'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center bg-slate-50 border-b border-slate-200 px-6 py-3 flex-shrink-0">
          <div className={`flex items-center gap-2 text-sm font-medium ${paso === 1 ? 'text-emerald-700' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${paso === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-white'}`}>1</span>
            Selección
          </div>
          <ArrowRight size={16} className="mx-4 text-slate-300" />
          <div className={`flex items-center gap-2 text-sm font-medium ${paso === 2 ? 'text-emerald-700' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${paso === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-white'}`}>2</span>
            Pesos y Costos
          </div>
        </div>

        {/* ══ PASO 1 ══ */}
        {paso === 1 && (
          <>
            <div className="px-6 pt-4 pb-2 flex-shrink-0">
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripción del ingreso (opcional)</label>
              <input
                type="text"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Ej: Celulares enero, Notebooks batch 3..."
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto">

              {/* — Pedidos con items (importacion / courier_empresa) — */}
              {pedidosConItems.length > 0 && (
                <div className="flex flex-col">
                  {/* Header de la lista de pedidos */}
                  <div className="flex items-center gap-3 px-4 py-2 bg-slate-200 border-y border-slate-300 sticky top-0 z-10">
                    <div className="w-[44px] shrink-0"></div>
                    <span className="text-xs font-semibold text-slate-600 uppercase w-24 shrink-0">Pedido</span>
                    <span className="text-xs font-semibold text-slate-600 uppercase w-24 shrink-0">Logística</span>
                    <span className="text-xs font-semibold text-slate-600 uppercase flex-1 text-center">Descripción</span>
                    <div className="flex gap-4 ml-auto items-center shrink-0">
                      <span className="text-xs font-semibold text-slate-600 uppercase w-20 text-center">Cant. Items</span>
                      <span className="text-xs font-semibold text-slate-600 uppercase w-20 text-center">Precio Total</span>
                      <span className="text-xs font-semibold text-slate-600 uppercase w-24 text-center">Peso Total Est.</span>
                      <span className="text-xs font-semibold text-slate-600 uppercase w-28 text-center">Estado</span>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {pedidosConItems.map(recibo => {
                      const items = recibo.importaciones_items || [];
                      const itemsLibres = items.filter(i => !i.caja_id);
                      const todosSeleccionados = itemsLibres.length > 0 && itemsLibres.every(i => itemsSeleccionados[i.id]);
                      const expanded = !!gruposExpandidos[recibo.id]; // cerrado por defecto
                      
                      const precioTotal = items.reduce((sum, i) => sum + (parseFloat(i.precio_total_usd) || (parseFloat(i.precio_unitario_usd) || 0) * (i.cantidad || 0)), 0);
                      const pesoTotalEstimado = items.reduce((sum, i) => sum + (parseFloat(i.peso_estimado_total_kg) || (parseFloat(i.peso_estimado_unitario_kg) || 0) * (i.cantidad || 0)), 0);

                      return (
                        <div key={recibo.id}>
                          <div
                            className="flex items-center gap-3 px-4 py-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => toggleGrupo(recibo.id)}
                          >
                            <div className="flex items-center gap-3 w-[44px] shrink-0 justify-between">
                              {expanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                              <input
                                type="checkbox"
                                checked={todosSeleccionados}
                                onChange={() => toggleTodosDelRecibo(recibo)}
                                onClick={e => e.stopPropagation()}
                                className="w-4 h-4 accent-emerald-600"
                                title="Seleccionar todos"
                              />
                            </div>
                            <div className="w-24 flex flex-col shrink-0">
                              <span className="font-mono text-sm font-semibold text-slate-700 truncate" title={recibo.numero_recibo}>{recibo.numero_recibo}</span>
                              <span className="text-[10px] text-slate-400">{formatearFechaDisplay(recibo.fecha_compra)}</span>
                            </div>
                            <span className="text-sm text-slate-500 w-24 shrink-0 truncate" title={recibo.proveedores?.nombre || 'Sin proveedor'}>
                              {recibo.proveedores?.nombre || 'Sin proveedor'}
                            </span>
                            <span className="text-sm text-slate-600 truncate flex-1 text-center" title={recibo.observaciones || 'Sin descripción'}>
                              {recibo.observaciones || 'Sin descripción'}
                            </span>
                            
                            <div className="flex gap-4 ml-auto items-center shrink-0">
                              <span className="text-sm font-medium text-slate-600 w-20 text-center">{items.length}</span>
                              <span className="text-sm font-medium text-slate-700 w-20 text-center" title="Precio total">
                                U$ {Math.round(precioTotal)}
                              </span>
                              <span className="text-sm font-medium text-slate-500 w-24 text-center" title="Peso estimado total">
                                {pesoTotalEstimado > 0 ? `${pesoTotalEstimado.toFixed(2)} kg` : '—'}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide w-28 text-center truncate ${COLORES_ESTADOS[recibo.estado] || ''}`}>
                                {LABELS_ESTADOS[recibo.estado] || recibo.estado}
                              </span>
                            </div>
                          </div>


                          {expanded && (
                            <div className="overflow-x-auto bg-white border-y border-slate-100">
                              <table className="w-full min-w-[700px]">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                  <tr>
                                    <th className="w-10 px-4 py-2"></th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Modelo</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 uppercase">Cantidad</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Color</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Almacenamiento</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase">Precio Unitario</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 uppercase">Peso Total</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 uppercase">Estado</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map(item => {
                                    const enOtraCaja = !!item.caja_id;
                                    const pesoTotalItem = (parseFloat(item.peso_estimado_unitario_kg) || 0) * (item.cantidad || 0);

                                    return (
                                      <tr key={item.id} className={`border-b border-slate-50 ${enOtraCaja ? 'opacity-40 bg-slate-50' : 'hover:bg-slate-50'}`}>
                                        <td className="w-10 px-4 py-2 text-center">
                                          <input
                                            type="checkbox"
                                            checked={!!itemsSeleccionados[item.id]}
                                            onChange={() => toggleItem(item.id)}
                                            disabled={enOtraCaja}
                                            className="w-4 h-4 accent-emerald-600"
                                          />
                                        </td>
                                        <td className="px-3 py-2 text-sm text-slate-800 font-medium">{item.item}</td>
                                        <td className="px-3 py-2 text-sm text-slate-600 text-center font-medium">{item.cantidad}</td>
                                        <td className="px-3 py-2 text-sm text-slate-500">{item.color || '—'}</td>
                                        <td className="px-3 py-2 text-sm text-slate-500">{item.almacenamiento || '—'}</td>
                                        <td className="px-3 py-2 text-sm text-right font-medium text-slate-700">
                                          U$ {Math.round(parseFloat(item.precio_unitario_usd || 0))}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-slate-500 text-center">
                                          {pesoTotalItem > 0 ? `${pesoTotalItem.toFixed(2)} kg` : '—'}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-slate-400 text-center">
                                          {enOtraCaja ? 'Ya asignado' : ''}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* — Servicios courier a cargo del cliente — */}
              {courierClientesDisponibles.length > 0 && (
                <div>
                  <div className="px-6 py-2 bg-blue-50 border-y border-blue-200">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider flex items-center gap-2">
                      <User size={12} /> Servicios Courier — A cargo del cliente
                    </p>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {courierClientesDisponibles.map(recibo => (
                      <div
                        key={recibo.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => toggleCourierCliente(recibo.id)}
                      >
                        <input
                          type="checkbox"
                          checked={!!courierClientesSel[recibo.id]}
                          onChange={() => toggleCourierCliente(recibo.id)}
                          onClick={e => e.stopPropagation()}
                          className="w-4 h-4 accent-blue-600 flex-shrink-0"
                        />
                        <User size={16} className="text-blue-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm font-semibold text-slate-700">{recibo.numero_recibo}</span>
                            {recibo.clientes && (
                              <span className="text-sm text-slate-600">
                                {recibo.clientes.nombre} {recibo.clientes.apellido || ''}
                              </span>
                            )}
                            <span className="text-xs text-slate-400">{formatearFechaDisplay(recibo.fecha_compra)}</span>
                          </div>
                          {recibo.observaciones && (
                            <p className="text-xs text-slate-400 mt-0.5 truncate">{recibo.observaciones}</p>
                          )}
                        </div>
                        <span className="text-xs text-blue-600 font-medium">Sin items — ingreso por peso</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pedidosConItems.length === 0 && courierClientesDisponibles.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No hay pedidos disponibles para ingresar
                </div>
              )}
            </div>

            {/* Footer paso 1 */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between flex-shrink-0 bg-white">
              <span className="text-sm text-slate-500">
                {!haySeleccion
                  ? 'Seleccioná al menos un item o servicio para continuar'
                  : <span className="text-emerald-700 font-medium">
                      {idsItemsSeleccionados.length > 0 && `${idsItemsSeleccionados.length} item(s)`}
                      {idsItemsSeleccionados.length > 0 && idsCourierClientesSel.length > 0 && ' + '}
                      {idsCourierClientesSel.length > 0 && `${idsCourierClientesSel.length} courier cliente(s)`}
                      {' seleccionado(s)'}
                    </span>
                }
              </span>
              <div className="flex gap-3">
                <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={irPaso2}
                  disabled={!haySeleccion}
                  className="px-6 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:opacity-50 font-medium flex items-center gap-2"
                >
                  Continuar <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* ══ PASO 2 ══ */}
        {paso === 2 && (
          <>
            <div className="flex-1 overflow-y-auto">

              {/* Datos del ingreso (caja) */}
              <div className="p-6 border-b border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Datos del Ingreso</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Fecha Ingreso *</label>
                    <input type="date" value={form.fecha_recepcion}
                      onChange={e => setForm(p => ({ ...p, fecha_recepcion: e.target.value }))}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1" title="Suma de los pesos reales de los items">Peso s/ caja (kg)</label>
                    <input type="number" 
                      disabled 
                      value={totalPesoReal > 0 ? totalPesoReal.toFixed(2) : ''}
                      placeholder="0.00"
                      className="w-full border border-slate-200 bg-slate-50 rounded px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Peso c/ caja (kg)</label>
                    <input type="number" step="0.01" min="0" value={form.peso_total_con_caja_kg}
                      onChange={e => setForm(p => ({ ...p, peso_total_con_caja_kg: e.target.value }))}
                      placeholder="0.00"
                      className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Precio / kg (USD)</label>
                    <input type="number" step="0.01" min="0" value={form.precio_por_kg_usd}
                      onChange={e => setForm(p => ({ ...p, precio_por_kg_usd: e.target.value }))}
                      placeholder="0.00"
                      className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Pago Courier (USD)</label>
                    <input type="number" step="0.01" min="0" value={form.pago_courier_usd}
                      onChange={e => setForm(p => ({ ...p, pago_courier_usd: e.target.value }))}
                      placeholder="0.00"
                      className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    {parseFloat(form.peso_total_con_caja_kg) > 0 && parseFloat(form.precio_por_kg_usd) > 0 && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          Estimado: U$ {(parseFloat(form.peso_total_con_caja_kg) * parseFloat(form.precio_por_kg_usd)).toFixed(2)}
                        </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Picking / Shipping (USD)</label>
                    <input type="number" step="0.01" min="0" value={form.costo_picking_shipping_usd}
                      onChange={e => setForm(p => ({ ...p, costo_picking_shipping_usd: e.target.value }))}
                      placeholder="0.00"
                      className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
                {costoTotal > 0 && itemsCompletos.length > 0 && (
                  <div className="mt-4 flex items-center gap-6 text-sm">
                    <span className="text-slate-500">Costo total a distribuir:</span>
                    <span className="font-semibold text-slate-800">${costoTotal.toFixed(2)} USD</span>
                    <span className="text-slate-500 ml-4">Peso real total:</span>
                    <span className="font-semibold text-slate-800">{totalPesoReal.toFixed(3)} kg</span>
                  </div>
                )}
              </div>

              {/* Tabla items normales (importacion / courier_empresa) */}
              {gruposPaso2.length > 0 && (
                <div className="p-6 border-b border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                    Items — Pesos Reales y Distribución de Costos
                  </h4>
                  {gruposPaso2.map((grupo, gi) => (
                    <div key={gi} className="mb-4">
                      <div className="bg-slate-100 px-4 py-2 border border-slate-200 rounded-t flex items-center gap-3">
                        <span className="font-mono text-xs font-semibold text-slate-700">
                          {grupo.recibo?.numero_recibo || 'Pedido'}
                        </span>
                        <span className="text-xs text-slate-500">{grupo.recibo?.proveedores?.nombre || ''}</span>
                        {grupo.recibo?.porcentaje_financiero > 0 && (
                          <span className="text-xs text-slate-400 ml-auto">
                            Costo financiero: {grupo.recibo.porcentaje_financiero}%
                          </span>
                        )}
                      </div>
                      <table className="w-full border border-slate-200 border-t-0 rounded-b overflow-hidden">
                        <thead className="bg-slate-800 text-white">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase">Producto</th>
                            <th className="px-3 py-2 text-center text-xs font-medium uppercase">Cant.</th>
                            <th className="px-3 py-2 text-center text-xs font-medium uppercase">FOB/u</th>
                            <th className="px-3 py-2 text-center text-xs font-medium uppercase w-28">Peso Real (kg/u)</th>
                            <th className="px-3 py-2 text-center text-xs font-medium uppercase">Peso Total</th>
                            <th className="px-3 py-2 text-center text-xs font-medium uppercase">C. Envío/u</th>
                            <th className="px-3 py-2 text-center text-xs font-medium uppercase">C. Fin./u</th>
                            <th className="px-3 py-2 text-center text-xs font-medium uppercase">Final/u</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {grupo.items.map((item, ii) => {
                            const proj = proyeccion.find(p => p.id === item.id) || {};
                            const pesoUnit = parseFloat(pesosReales[item.id] || 0);
                            const pesoTot = pesoUnit * (item.cantidad || 1);
                            return (
                              <tr key={item.id} className={ii % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                <td className="px-3 py-2 text-sm text-slate-800">
                                  {item.item}
                                  {item.color && <span className="text-xs text-slate-400 ml-1">· {item.color}</span>}
                                  {item.almacenamiento && <span className="text-xs text-slate-400 ml-1">· {item.almacenamiento}</span>}
                                </td>
                                <td className="px-3 py-2 text-sm text-center text-slate-600">{item.cantidad}</td>
                                <td className="px-3 py-2 text-sm text-center text-slate-700">
                                  ${parseFloat(item.precio_unitario_usd || 0).toFixed(2)}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <input
                                    type="number" step="0.001" min="0"
                                    value={pesosReales[item.id] ?? ''}
                                    onChange={e => setPesosReales(prev => ({ ...prev, [item.id]: e.target.value }))}
                                    className="w-24 border border-slate-300 rounded px-2 py-1 text-sm text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="0.000"
                                  />
                                </td>
                                <td className="px-3 py-2 text-sm text-center text-slate-500">
                                  {pesoTot > 0 ? `${pesoTot.toFixed(3)} kg` : '—'}
                                </td>
                                <td className="px-3 py-2 text-sm text-center text-blue-700 font-medium">
                                  {costoTotal > 0 ? formatNum(proj.costoEnvioUnit) : '—'}
                                </td>
                                <td className="px-3 py-2 text-sm text-center text-purple-700 font-medium">
                                  {formatNum(proj.costoFinUnit)}
                                </td>
                                <td className="px-3 py-2 text-sm text-center font-semibold text-emerald-700">
                                  {costoTotal > 0 ? formatNum(proj.costoFinalUnit) : '—'}
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

              {/* Courier clientes — solo peso del pedido */}
              {courierClientesCompletos.length > 0 && (
                <div className="p-6">
                  <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <User size={16} className="text-blue-500" />
                    Servicios Courier Cliente — Peso del Pedido
                  </h4>
                  <table className="w-full border border-slate-200 rounded overflow-hidden">
                    <thead className="bg-slate-800 text-white">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase">N° Servicio</th>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase">Cliente</th>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase">Descripción</th>
                        <th className="px-4 py-2 text-center text-xs font-medium uppercase w-36">Peso Pedido (kg)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {courierClientesCompletos.map((recibo, ii) => (
                        <tr key={recibo.id} className={ii % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-700">
                            {recibo.numero_recibo}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {recibo.clientes
                              ? `${recibo.clientes.nombre} ${recibo.clientes.apellido || ''}`
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500 truncate max-w-xs">
                            {recibo.observaciones || '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number" step="0.001" min="0"
                              value={pesosCourierCliente[recibo.id] ?? ''}
                              onChange={e => setPesosCourierCliente(prev => ({ ...prev, [recibo.id]: e.target.value }))}
                              className="w-28 border border-slate-300 rounded px-2 py-1 text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0.000"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer paso 2 */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between flex-shrink-0 bg-white">
              <div className="text-sm text-slate-500">
                {itemsCompletos.length > 0 && <span>{itemsCompletos.length} item(s) en {gruposPaso2.length} pedido(s)</span>}
                {courierClientesCompletos.length > 0 && (
                  <span className={itemsCompletos.length > 0 ? 'ml-4' : ''}>
                    {courierClientesCompletos.length} courier cliente(s)
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setPaso(1)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded hover:bg-slate-50 transition-colors">
                  Volver
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:opacity-50 font-medium"
                >
                  {isSubmitting ? 'Registrando...' : 'Confirmar Ingreso'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NuevoIngresoModal;
