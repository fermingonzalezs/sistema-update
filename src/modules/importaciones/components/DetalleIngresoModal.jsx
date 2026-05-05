import React, { useMemo } from 'react';
import { X, PackageCheck } from 'lucide-react';
import { formatearFechaDisplay } from '../../../shared/config/timezone';

const DetalleIngresoModal = ({ ingreso, onClose, onEdit }) => {
  const formatMoney = (value, decimals = 2) => {
    const num = parseFloat(value || 0);
    if (!Number.isFinite(num)) return 'U$ 0.00';
    return `U$ ${num.toLocaleString('es-AR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`;
  };

  const formatWeight = (value, decimals = 3) => {
    const num = parseFloat(value || 0);
    if (!Number.isFinite(num) || num === 0) return '-';
    return `${num.toFixed(decimals)} kg`;
  };

  const gruposPorRecibo = useMemo(() => {
    const grupos = {};
    (ingreso.importaciones_items || []).forEach(item => {
      const reciboId = item.recibo_id || 'sin-recibo';
      if (!grupos[reciboId]) {
        grupos[reciboId] = {
          recibo: item.importaciones_recibos,
          items: []
        };
      }
      grupos[reciboId].items.push(item);
    });
    return Object.values(grupos);
  }, [ingreso.importaciones_items]);

  const resumen = useMemo(() => {
    return (ingreso.importaciones_items || []).reduce((acc, item) => {
      const cantidad = parseFloat(item.cantidad || 0);
      const fobUnitario = parseFloat(item.precio_unitario_usd || 0);
      const envioUnitario = parseFloat(item.costo_envio_usd || 0);
      const financieroUnitario = parseFloat(item.costo_financiero_usd || 0);
      const finalUnitario = fobUnitario + envioUnitario + financieroUnitario;
      const pesoRealUnitario = parseFloat(item.peso_real_unitario_kg || 0);

      acc.items += 1;
      acc.unidades += cantidad;
      acc.fob += fobUnitario * cantidad;
      acc.envio += envioUnitario * cantidad;
      acc.financiero += financieroUnitario * cantidad;
      acc.final += finalUnitario * cantidad;
      acc.pesoReal += pesoRealUnitario * cantidad;
      return acc;
    }, {
      items: 0,
      unidades: 0,
      fob: 0,
      envio: 0,
      financiero: 0,
      final: 0,
      pesoReal: 0
    });
  }, [ingreso.importaciones_items]);

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded border border-slate-300 max-w-[82vw] w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 bg-slate-800 text-white flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <PackageCheck size={24} />
            <div>
              <h3 className="text-xl font-semibold">Detalle de Ingreso</h3>
              <p className="text-slate-300 text-sm mt-1">{ingreso.numero_caja}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="bg-slate-200 p-4 rounded-t border border-slate-300">
              <h4 className="font-semibold text-slate-800 uppercase">Información General</h4>
            </div>
            <div className="border border-slate-300 border-t-0 rounded-b p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Ingreso</label>
                  <p className="font-medium text-slate-800 mt-1">{ingreso.numero_caja}</p>
                </div>
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Estado</label>
                  <p className="font-medium text-emerald-700 mt-1 uppercase">{ingreso.estado || '-'}</p>
                </div>
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Fecha Ingreso</label>
                  <p className="font-medium text-slate-800 mt-1">
                    {ingreso.fecha_recepcion ? formatearFechaDisplay(ingreso.fecha_recepcion) : '-'}
                  </p>
                </div>
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Pedidos</label>
                  <p className="font-medium text-slate-800 mt-1">{gruposPorRecibo.length}</p>
                </div>
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Items</label>
                  <p className="font-medium text-slate-800 mt-1">{resumen.items}</p>
                </div>
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Unidades</label>
                  <p className="font-medium text-slate-800 mt-1">{resumen.unidades}</p>
                </div>
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Peso s/ caja</label>
                  <p className="font-medium text-slate-800 mt-1">{formatWeight(ingreso.peso_sin_caja_kg)}</p>
                </div>
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Peso c/ caja</label>
                  <p className="font-medium text-slate-800 mt-1">{formatWeight(ingreso.peso_total_con_caja_kg)}</p>
                </div>
              </div>

              {ingreso.descripcion && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <label className="text-xs font-semibold text-slate-500 uppercase block mb-2">Descripción</label>
                  <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded p-3">{ingreso.descripcion}</p>
                </div>
              )}

              {ingreso.observaciones && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <label className="text-xs font-semibold text-slate-500 uppercase block mb-2">Observaciones</label>
                  <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded p-3">{ingreso.observaciones}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-200 p-4 rounded-t border border-slate-300">
              <h4 className="font-semibold text-slate-800 uppercase">Costos</h4>
            </div>
            <div className="border border-slate-300 border-t-0 rounded-b p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Precio / kg</label>
                  <p className="font-medium text-slate-800 mt-1">{formatMoney(ingreso.precio_por_kg_usd)}</p>
                </div>
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Pago Courier</label>
                  <p className="font-medium text-slate-800 mt-1">{formatMoney(ingreso.pago_courier_usd)}</p>
                </div>
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Picking / Shipping</label>
                  <p className="font-medium text-slate-800 mt-1">{formatMoney(ingreso.costo_picking_shipping_usd)}</p>
                </div>
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Courier Total</label>
                  <p className="font-semibold text-emerald-700 mt-1">{formatMoney(ingreso.costo_total_usd)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200 text-sm">
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">FOB Total</label>
                  <p className="font-semibold text-slate-800 mt-1">{formatMoney(resumen.fob)}</p>
                </div>
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Envío Distribuido</label>
                  <p className="font-semibold text-blue-700 mt-1">{formatMoney(resumen.envio)}</p>
                </div>
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Costo Financiero</label>
                  <p className="font-semibold text-purple-700 mt-1">{formatMoney(resumen.financiero)}</p>
                </div>
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Final Total</label>
                  <p className="font-semibold text-emerald-700 mt-1">{formatMoney(resumen.final)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-200 p-4 rounded-t border border-slate-300">
              <h4 className="font-semibold text-slate-800 uppercase">Items Ingresados</h4>
            </div>
            <div className="border border-slate-300 border-t-0 rounded-b overflow-x-auto">
              {gruposPorRecibo.length === 0 ? (
                <div className="p-6 text-center text-slate-500">Sin items asociados</div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {gruposPorRecibo.map((grupo, idx) => (
                    <div key={grupo.recibo?.id || idx}>
                      <div className="bg-slate-100 px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-slate-200">
                        <span className="font-mono text-sm font-semibold text-slate-800">
                          {grupo.recibo?.numero_recibo || 'Pedido'}
                        </span>
                        <span className="text-sm text-slate-600">
                          {grupo.recibo?.proveedores?.nombre || 'Sin proveedor'}
                        </span>
                        {grupo.recibo?.clientes && (
                          <span className="text-sm text-slate-500">
                            Cliente: {grupo.recibo.clientes.nombre} {grupo.recibo.clientes.apellido || ''}
                          </span>
                        )}
                        {grupo.recibo?.fecha_compra && (
                          <span className="text-xs text-slate-400">
                            Compra: {formatearFechaDisplay(grupo.recibo.fecha_compra)}
                          </span>
                        )}
                        {grupo.recibo?.porcentaje_financiero > 0 && (
                          <span className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                            Fin.: {grupo.recibo.porcentaje_financiero}%
                          </span>
                        )}
                      </div>
                      {(grupo.recibo?.tracking_number || grupo.recibo?.empresa_logistica || grupo.recibo?.observaciones) && (
                        <div className="px-4 py-2 bg-white border-b border-slate-100 text-xs text-slate-500 flex flex-wrap gap-x-5 gap-y-1">
                          {grupo.recibo?.empresa_logistica && <span>Logística: {grupo.recibo.empresa_logistica}</span>}
                          {grupo.recibo?.tracking_number && <span>Tracking: {grupo.recibo.tracking_number}</span>}
                          {grupo.recibo?.observaciones && <span>Descripción: {grupo.recibo.observaciones}</span>}
                        </div>
                      )}
                      <table className="w-full text-sm min-w-[980px]">
                        <thead className="bg-slate-800 text-white">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase">Producto</th>
                            <th className="px-3 py-2 text-center text-xs font-medium uppercase">Color</th>
                            <th className="px-3 py-2 text-center text-xs font-medium uppercase">Almac.</th>
                            <th className="px-3 py-2 text-center text-xs font-medium uppercase">Cant.</th>
                            <th className="px-3 py-2 text-center text-xs font-medium uppercase">Peso Real/u</th>
                            <th className="px-3 py-2 text-center text-xs font-medium uppercase">Peso Total</th>
                            <th className="px-3 py-2 text-center text-xs font-medium uppercase">FOB/u</th>
                            <th className="px-3 py-2 text-center text-xs font-medium uppercase">Envío/u</th>
                            <th className="px-3 py-2 text-center text-xs font-medium uppercase">Fin./u</th>
                            <th className="px-3 py-2 text-center text-xs font-medium uppercase">Final/u</th>
                            <th className="px-3 py-2 text-center text-xs font-medium uppercase">Final Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {grupo.items.map((item, itemIdx) => {
                            const cantidad = parseFloat(item.cantidad || 0);
                            const pesoUnitario = parseFloat(item.peso_real_unitario_kg || 0);
                            const finalUnitario =
                              parseFloat(item.precio_unitario_usd || 0) +
                              parseFloat(item.costo_envio_usd || 0) +
                              parseFloat(item.costo_financiero_usd || 0);
                            return (
                              <tr key={item.id} className={itemIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                <td className="px-3 py-2 text-slate-800 font-medium">{item.item}</td>
                                <td className="px-3 py-2 text-center text-slate-600">{item.color || '-'}</td>
                                <td className="px-3 py-2 text-center text-slate-600">{item.almacenamiento || '-'}</td>
                                <td className="px-3 py-2 text-center text-slate-600">{item.cantidad}</td>
                                <td className="px-3 py-2 text-center text-slate-600">{formatWeight(item.peso_real_unitario_kg)}</td>
                                <td className="px-3 py-2 text-center text-slate-600">{formatWeight(pesoUnitario * cantidad)}</td>
                                <td className="px-3 py-2 text-center text-slate-700">{formatMoney(item.precio_unitario_usd)}</td>
                                <td className="px-3 py-2 text-center text-blue-700 font-medium">{formatMoney(item.costo_envio_usd)}</td>
                                <td className="px-3 py-2 text-center text-purple-700 font-medium">{formatMoney(item.costo_financiero_usd)}</td>
                                <td className="px-3 py-2 text-center text-emerald-700 font-semibold">{formatMoney(finalUnitario)}</td>
                                <td className="px-3 py-2 text-center text-emerald-700 font-semibold">{formatMoney(finalUnitario * cantidad)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded transition-colors"
            >
              Cerrar
            </button>
            {onEdit && (
              <button
                onClick={() => { onClose(); onEdit(ingreso); }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
              >
                Editar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleIngresoModal;
