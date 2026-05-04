import React, { useState, useMemo } from 'react';
import { X, PackageCheck, ChevronDown, ChevronRight } from 'lucide-react';
import { useCajas } from '../hooks/useCajas';
import { obtenerFechaLocal } from '../../../shared/utils/formatters';

const NuevaCajaRecepcionModal = ({ recibos, onClose, onSuccess }) => {
  const { crearCaja, recepcionarCaja } = useCajas();

  // Items disponibles: todos los items de recibos que no tienen caja asignada
  const itemsDisponibles = useMemo(() => {
    const grupos = {};
    recibos.forEach(recibo => {
      (recibo.importaciones_items || []).forEach(item => {
        if (item.caja_id) return; // ya asignado a una caja
        if (!grupos[recibo.id]) {
          grupos[recibo.id] = { recibo, items: [] };
        }
        grupos[recibo.id].items.push(item);
      });
    });
    return Object.values(grupos).filter(g => g.items.length > 0);
  }, [recibos]);

  const [form, setForm] = useState({
    descripcion: '',
    observaciones: '',
    fecha_recepcion: obtenerFechaLocal(),
    peso_total_con_caja_kg: '',
    peso_sin_caja_kg: '',
    precio_por_kg_usd: '',
    pago_courier_usd: '',
    costo_picking_shipping_usd: ''
  });

  // Items seleccionados: Set de IDs
  const [selectedItems, setSelectedItems] = useState(new Set());
  // Pesos reales por item (solo para los seleccionados)
  const [pesosReales, setPesosReales] = useState({});
  // Grupos expandidos
  const [expandedGrupos, setExpandedGrupos] = useState(() => {
    const init = {};
    itemsDisponibles.forEach(g => { init[g.recibo.id] = true; });
    return init;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleItem = (itemId, item) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
        // Pre-llenar peso estimado si existe
        if (!pesosReales[itemId]) {
          setPesosReales(p => ({ ...p, [itemId]: item.peso_estimado_unitario_kg ?? '' }));
        }
      }
      return next;
    });
  };

  const toggleGrupo = (reciboId, items) => {
    const allSelected = items.every(i => selectedItems.has(i.id));
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (allSelected) {
        items.forEach(i => next.delete(i.id));
      } else {
        items.forEach(i => {
          next.add(i.id);
          if (!pesosReales[i.id]) {
            setPesosReales(p => ({ ...p, [i.id]: i.peso_estimado_unitario_kg ?? '' }));
          }
        });
      }
      return next;
    });
  };

  const handlePesoChange = (itemId, value) => {
    setPesosReales(prev => ({ ...prev, [itemId]: value }));
  };

  // Calcular todos los items seleccionados en una lista plana
  const itemsSeleccionados = useMemo(() => {
    return itemsDisponibles.flatMap(g => g.items).filter(i => selectedItems.has(i.id));
  }, [itemsDisponibles, selectedItems]);

  const costoTotal = parseFloat(form.pago_courier_usd || 0) + parseFloat(form.costo_picking_shipping_usd || 0);

  const totalPesoReal = useMemo(() => {
    return itemsSeleccionados.reduce((sum, item) => {
      const pesoUnit = parseFloat(pesosReales[item.id] || 0);
      return sum + pesoUnit * (item.cantidad || 1);
    }, 0);
  }, [itemsSeleccionados, pesosReales]);

  const proyeccion = useMemo(() => {
    return itemsSeleccionados.map(item => {
      const pesoUnit = parseFloat(pesosReales[item.id] || 0);
      const pesoTotal = pesoUnit * (item.cantidad || 1);
      const proporcion = totalPesoReal > 0 ? pesoTotal / totalPesoReal : 0;
      const costoEnvioTotalItem = proporcion * costoTotal;
      const costoEnvioUnit = (item.cantidad || 1) > 0 ? costoEnvioTotalItem / item.cantidad : 0;
      const porcFin = parseFloat(item.importaciones_recibos?.porcentaje_financiero || 0);
      const costoFinUnit = parseFloat(item.precio_unitario_usd || 0) * porcFin / 100;
      const costoFinalUnit = parseFloat(item.precio_unitario_usd || 0) + costoEnvioUnit + costoFinUnit;
      return { id: item.id, costoEnvioUnit, costoFinUnit, costoFinalUnit };
    });
  }, [itemsSeleccionados, pesosReales, totalPesoReal, costoTotal]);

  const formatNum = (n) => isNaN(n) ? '-' : `$${parseFloat(n).toFixed(2)}`;

  const handleSubmit = async () => {
    if (!form.fecha_recepcion) { alert('La fecha de recepción es obligatoria'); return; }
    if (!form.peso_sin_caja_kg || parseFloat(form.peso_sin_caja_kg) <= 0) { alert('El peso sin caja es obligatorio'); return; }
    if (selectedItems.size === 0) { alert('Seleccioná al menos un item'); return; }

    setIsSubmitting(true);
    try {
      // 1. Crear la caja
      const caja = await crearCaja({
        descripcion: form.descripcion,
        observaciones: form.observaciones
      });

      // 2. Asignar items + recepcionar en el servicio (recepcionarCaja ya hace asignación via getById tras asignar)
      const { supabase } = await import('../../../lib/supabase.js');
      const itemIds = Array.from(selectedItems);
      const { error: assignError } = await supabase
        .from('importaciones_items')
        .update({ caja_id: caja.id })
        .in('id', itemIds);
      if (assignError) throw assignError;

      // 3. Recepcionar la caja con pesos y costos
      await recepcionarCaja(caja.id, {
        fecha_recepcion: form.fecha_recepcion,
        peso_total_con_caja_kg: form.peso_total_con_caja_kg,
        peso_sin_caja_kg: form.peso_sin_caja_kg,
        precio_por_kg_usd: form.precio_por_kg_usd,
        pago_courier_usd: form.pago_courier_usd,
        costo_picking_shipping_usd: form.costo_picking_shipping_usd,
        pesosReales
      });

      onSuccess();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded border border-slate-300 w-full max-w-6xl flex flex-col max-h-[94vh]">

        {/* Header */}
        <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between rounded-t flex-shrink-0">
          <div className="flex items-center gap-3">
            <PackageCheck size={22} />
            <div>
              <h3 className="text-lg font-semibold">Nueva Caja — Registro de Recepción</h3>
              <p className="text-slate-300 text-xs mt-0.5">Seleccioná los items, ingresá pesos reales y costos de courier</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* Datos de recepción */}
          <div className="p-6 border-b border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Datos de Recepción</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Descripción</label>
                <input
                  type="text"
                  value={form.descripcion}
                  onChange={e => handleFormChange('descripcion', e.target.value)}
                  placeholder="Ej: Celulares enero..."
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Fecha Recepción *</label>
                <input
                  type="date"
                  value={form.fecha_recepcion}
                  onChange={e => handleFormChange('fecha_recepcion', e.target.value)}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Peso c/ caja (kg)</label>
                <input type="number" step="0.01" min="0" value={form.peso_total_con_caja_kg}
                  onChange={e => handleFormChange('peso_total_con_caja_kg', e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Peso s/ caja (kg) *</label>
                <input type="number" step="0.01" min="0" value={form.peso_sin_caja_kg}
                  onChange={e => handleFormChange('peso_sin_caja_kg', e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Precio / kg (USD)</label>
                <input type="number" step="0.01" min="0" value={form.precio_por_kg_usd}
                  onChange={e => handleFormChange('precio_por_kg_usd', e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Pago Courier (USD)</label>
                <input type="number" step="0.01" min="0" value={form.pago_courier_usd}
                  onChange={e => handleFormChange('pago_courier_usd', e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Picking / Shipping</label>
                <input type="number" step="0.01" min="0" value={form.costo_picking_shipping_usd}
                  onChange={e => handleFormChange('costo_picking_shipping_usd', e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            {costoTotal > 0 && (
              <div className="mt-3 flex items-center gap-6 text-sm">
                <span className="text-slate-500">Costo total a distribuir:</span>
                <span className="font-semibold text-slate-800">${costoTotal.toFixed(2)} USD</span>
                {totalPesoReal > 0 && <>
                  <span className="text-slate-500 ml-4">Peso real total:</span>
                  <span className="font-semibold text-slate-800">{totalPesoReal.toFixed(3)} kg</span>
                </>}
              </div>
            )}
          </div>

          {/* Selección de items */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                Items a Incluir en la Caja
              </h4>
              <span className="text-sm text-slate-500">
                {selectedItems.size} item(s) seleccionado(s)
              </span>
            </div>

            {itemsDisponibles.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p>No hay items disponibles para asignar</p>
                <p className="text-xs mt-1">Todos los items están asignados a otras cajas o no hay recibos con items</p>
              </div>
            ) : (
              <div className="space-y-3">
                {itemsDisponibles.map(({ recibo, items }) => {
                  const allSelected = items.every(i => selectedItems.has(i.id));
                  const someSelected = items.some(i => selectedItems.has(i.id));
                  const isExpanded = expandedGrupos[recibo.id] !== false;

                  return (
                    <div key={recibo.id} className="border border-slate-200 rounded">
                      {/* Header del pedido */}
                      <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-100 cursor-pointer select-none"
                        onClick={() => setExpandedGrupos(prev => ({ ...prev, [recibo.id]: !isExpanded }))}>
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                          onChange={() => toggleGrupo(recibo.id, items)}
                          onClick={e => e.stopPropagation()}
                          className="w-4 h-4 accent-emerald-600"
                        />
                        {isExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                        <span className="font-mono text-xs font-semibold text-slate-700">{recibo.numero_recibo}</span>
                        <span className="text-xs text-slate-500">{recibo.proveedores?.nombre || ''}</span>
                        {recibo.porcentaje_financiero > 0 && (
                          <span className="text-xs text-slate-400 ml-auto">Fin. {recibo.porcentaje_financiero}%</span>
                        )}
                      </div>

                      {/* Items del pedido */}
                      {isExpanded && (
                        <table className="w-full border-t border-slate-200">
                          <thead className="bg-slate-800 text-white">
                            <tr>
                              <th className="w-10 px-4 py-2"></th>
                              <th className="px-3 py-2 text-left text-xs font-medium uppercase">Producto</th>
                              <th className="px-3 py-2 text-center text-xs font-medium uppercase">Cant.</th>
                              <th className="px-3 py-2 text-center text-xs font-medium uppercase">Precio FOB</th>
                              <th className="px-3 py-2 text-center text-xs font-medium uppercase w-28">Peso Real (kg/u)</th>
                              <th className="px-3 py-2 text-center text-xs font-medium uppercase">C. Envío/u</th>
                              <th className="px-3 py-2 text-center text-xs font-medium uppercase">C. Fin./u</th>
                              <th className="px-3 py-2 text-center text-xs font-medium uppercase">Precio Final/u</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {items.map((item, ii) => {
                              const isSelected = selectedItems.has(item.id);
                              const proj = proyeccion.find(p => p.id === item.id);
                              return (
                                <tr key={item.id}
                                  className={`${ii % 2 === 0 ? 'bg-white' : 'bg-slate-50'} ${isSelected ? '' : 'opacity-50'} cursor-pointer`}
                                  onClick={() => toggleItem(item.id, item)}
                                >
                                  <td className="px-4 py-2 text-center" onClick={e => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleItem(item.id, item)}
                                      className="w-4 h-4 accent-emerald-600"
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-sm text-slate-800">
                                    {item.item}
                                    {item.color && <span className="text-xs text-slate-400 ml-1">· {item.color}</span>}
                                    {item.almacenamiento && <span className="text-xs text-slate-400 ml-1">· {item.almacenamiento}</span>}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-center text-slate-600">{item.cantidad}</td>
                                  <td className="px-3 py-2 text-sm text-center text-slate-700">
                                    ${parseFloat(item.precio_unitario_usd || 0).toFixed(2)}
                                  </td>
                                  <td className="px-3 py-2 text-center" onClick={e => e.stopPropagation()}>
                                    {isSelected ? (
                                      <input
                                        type="number" step="0.001" min="0"
                                        value={pesosReales[item.id] ?? ''}
                                        onChange={e => handlePesoChange(item.id, e.target.value)}
                                        className="w-24 border border-slate-300 rounded px-2 py-1 text-sm text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="0.000"
                                      />
                                    ) : (
                                      <span className="text-slate-300 text-sm">—</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-center text-blue-700 font-medium">
                                    {isSelected && costoTotal > 0 && proj ? formatNum(proj.costoEnvioUnit) : '—'}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-center text-purple-700 font-medium">
                                    {isSelected && proj ? formatNum(proj.costoFinUnit) : '—'}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-center font-semibold text-emerald-700">
                                    {isSelected && costoTotal > 0 && proj ? formatNum(proj.costoFinalUnit) : '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between flex-shrink-0 bg-white">
          <div className="text-sm text-slate-500">
            {selectedItems.size > 0
              ? <span className="text-slate-700 font-medium">{selectedItems.size} item(s) seleccionado(s)</span>
              : <span>Seleccioná los items que llegaron en esta caja</span>
            }
            {costoTotal > 0 && selectedItems.size > 0 && (
              <span className="ml-4 text-slate-700 font-medium">
                Total courier: ${costoTotal.toFixed(2)} USD
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedItems.size === 0}
              className="px-6 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:opacity-50 font-medium"
            >
              {isSubmitting ? 'Procesando...' : 'Crear y Recepcionar Caja'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default NuevaCajaRecepcionModal;
