import React, { useState, useMemo } from 'react';
import { X, Package, ChevronDown, ChevronRight } from 'lucide-react';
import { useCajas } from '../hooks/useCajas';
import NuevaCajaModal from './NuevaCajaModal';
import { formatearFechaDisplay } from '../../../shared/config/timezone';
import { COLORES_ESTADOS, LABELS_ESTADOS } from '../constants/estadosImportacion';

const AsignarCajaModal = ({ recibos, onClose, onSuccess, cajaPreseleccionada }) => {
  const { cajas, fetchCajas, crearCaja, asignarItems } = useCajas();
  const [cajaSeleccionada, setCajaSeleccionada] = useState(cajaPreseleccionada?.id || '');
  const [itemsSeleccionados, setItemsSeleccionados] = useState({});
  const [gruposExpandidos, setGruposExpandidos] = useState({});
  const [showNuevaCaja, setShowNuevaCaja] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Solo pedidos con items no recepcionados
  const recibosConItems = useMemo(() => {
    return (recibos || []).filter(r => r.estado !== 'recepcionado' && (r.importaciones_items || []).length > 0);
  }, [recibos]);

  const toggleGrupo = (reciboId) => {
    setGruposExpandidos(prev => ({ ...prev, [reciboId]: !prev[reciboId] }));
  };

  const toggleItem = (itemId) => {
    setItemsSeleccionados(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const toggleTodosDelRecibo = (recibo) => {
    const items = recibo.importaciones_items || [];
    const itemsLibres = items.filter(i => !i.caja_id || i.caja_id === cajaSeleccionada);
    const todosSeleccionados = itemsLibres.every(i => itemsSeleccionados[i.id]);

    const updates = {};
    itemsLibres.forEach(i => {
      updates[i.id] = !todosSeleccionados;
    });
    setItemsSeleccionados(prev => ({ ...prev, ...updates }));
  };

  const itemsSeleccionadosTotal = Object.values(itemsSeleccionados).filter(Boolean).length;

  const handleCrearCaja = async (formData) => {
    try {
      const nueva = await crearCaja(formData);
      setCajaSeleccionada(nueva.id);
      await fetchCajas();
      setShowNuevaCaja(false);
    } catch (err) {
      throw err;
    }
  };

  const handleAsignar = async () => {
    if (!cajaSeleccionada) {
      alert('Seleccioná una caja');
      return;
    }
    if (itemsSeleccionadosTotal === 0) {
      alert('Seleccioná al menos un item');
      return;
    }

    const ids = Object.entries(itemsSeleccionados)
      .filter(([, sel]) => sel)
      .map(([id]) => id);

    setIsSubmitting(true);
    try {
      await asignarItems(cajaSeleccionada, ids);
      onSuccess();
    } catch (err) {
      alert('Error al asignar: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cajaNombre = cajas.find(c => c.id === cajaSeleccionada)?.numero_caja || '';

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded border border-slate-200 w-full max-w-3xl mx-4 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between rounded-t flex-shrink-0">
            <div className="flex items-center gap-3">
              <Package size={20} />
              <h3 className="text-lg font-semibold">Asignar Items a Caja</h3>
            </div>
            <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Selector de caja */}
          <div className="px-6 py-4 border-b border-slate-200 flex-shrink-0">
            <label className="block text-sm font-medium text-slate-700 mb-2">Caja destino</label>
            <div className="flex gap-3">
              <select
                value={cajaSeleccionada}
                onChange={e => setCajaSeleccionada(e.target.value)}
                className="flex-1 border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Seleccionar caja...</option>
                {cajas.filter(c => c.estado !== 'recepcionada').map(c => (
                  <option key={c.id} value={c.id}>
                    {c.numero_caja}{c.descripcion ? ` — ${c.descripcion}` : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowNuevaCaja(true)}
                className="px-4 py-2 text-sm bg-slate-700 text-white rounded hover:bg-slate-800 transition-colors font-medium flex items-center gap-1"
              >
                + Nueva Caja
              </button>
            </div>
          </div>

          {/* Lista de pedidos con items */}
          <div className="flex-1 overflow-y-auto">
            {recibosConItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No hay pedidos con items disponibles para asignar
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {recibosConItems.map(recibo => {
                  const items = recibo.importaciones_items || [];
                  const itemsLibres = items.filter(i => !i.caja_id || i.caja_id === cajaSeleccionada);
                  const todosSeleccionados = itemsLibres.length > 0 && itemsLibres.every(i => itemsSeleccionados[i.id]);
                  const expanded = gruposExpandidos[recibo.id] !== false; // por defecto expandido

                  return (
                    <div key={recibo.id}>
                      {/* Header del grupo */}
                      <div
                        className="flex items-center gap-3 px-4 py-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                        onClick={() => toggleGrupo(recibo.id)}
                      >
                        {expanded ? <ChevronDown size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronRight size={16} className="text-slate-400 flex-shrink-0" />}
                        <input
                          type="checkbox"
                          checked={todosSeleccionados}
                          onChange={() => toggleTodosDelRecibo(recibo)}
                          onClick={e => e.stopPropagation()}
                          className="w-4 h-4 accent-emerald-600"
                          title="Seleccionar todos"
                        />
                        <span className="font-mono text-sm font-semibold text-slate-700">{recibo.numero_recibo}</span>
                        <span className="text-sm text-slate-500">{recibo.proveedores?.nombre || 'Sin proveedor'}</span>
                        <span className="text-xs text-slate-400">{formatearFechaDisplay(recibo.fecha_compra)}</span>
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded font-medium ${COLORES_ESTADOS[recibo.estado]}`}>
                          {LABELS_ESTADOS[recibo.estado]}
                        </span>
                        <span className="text-xs text-slate-400 ml-2">{items.length} item(s)</span>
                      </div>

                      {/* Items del grupo */}
                      {expanded && (
                        <table className="w-full">
                          <tbody>
                            {items.map(item => {
                              const enOtraCaja = item.caja_id && item.caja_id !== cajaSeleccionada;
                              return (
                                <tr
                                  key={item.id}
                                  className={`border-t border-slate-100 ${enOtraCaja ? 'opacity-50' : 'hover:bg-slate-50'}`}
                                >
                                  <td className="w-10 px-4 py-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={!!itemsSeleccionados[item.id]}
                                      onChange={() => toggleItem(item.id)}
                                      disabled={enOtraCaja}
                                      className="w-4 h-4 accent-emerald-600"
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-sm text-slate-800">{item.item}</td>
                                  <td className="px-3 py-2 text-sm text-slate-500 text-center">x{item.cantidad}</td>
                                  <td className="px-3 py-2 text-sm text-slate-500">{item.color || '—'}</td>
                                  <td className="px-3 py-2 text-sm text-slate-500">{item.almacenamiento || '—'}</td>
                                  <td className="px-3 py-2 text-sm text-right font-medium text-slate-700">
                                    {item.costo_final_unitario_usd ? `$${parseFloat(item.costo_final_unitario_usd).toFixed(2)}` : `$${parseFloat(item.precio_unitario_usd || 0).toFixed(2)}`}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    {item.importaciones_cajas && (
                                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                                        {item.importaciones_cajas.numero_caja}
                                      </span>
                                    )}
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

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
            <span className="text-sm text-slate-500">
              {itemsSeleccionadosTotal} item(s) seleccionado(s)
              {cajaNombre && <span className="text-emerald-700 font-medium"> → {cajaNombre}</span>}
            </span>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAsignar}
                disabled={isSubmitting || itemsSeleccionadosTotal === 0 || !cajaSeleccionada}
                className="px-6 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:opacity-50 font-medium"
              >
                {isSubmitting ? 'Asignando...' : `Asignar ${itemsSeleccionadosTotal > 0 ? itemsSeleccionadosTotal : ''} items`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showNuevaCaja && (
        <NuevaCajaModal
          onClose={() => setShowNuevaCaja(false)}
          onSuccess={handleCrearCaja}
        />
      )}
    </>
  );
};

export default AsignarCajaModal;
