import React, { useState, useMemo } from 'react';
import { X, PackageCheck } from 'lucide-react';
import { useCajas } from '../hooks/useCajas';
import { obtenerFechaLocal } from '../../../shared/utils/formatters';

const RecepcionCajaModal = ({ caja, onClose, onSuccess }) => {
  const { recepcionarCaja } = useCajas();

  const items = caja.importaciones_items || [];

  const [form, setForm] = useState({
    fecha_recepcion: obtenerFechaLocal(),
    peso_total_con_caja_kg: '',
    peso_sin_caja_kg: '',
    precio_por_kg_usd: '',
    pago_courier_usd: '',
    costo_picking_shipping_usd: ''
  });

  // Pesos reales por item (editable)
  const [pesosReales, setPesosReales] = useState(
    items.reduce((acc, item) => {
      acc[item.id] = item.peso_estimado_unitario_kg ?? '';
      return acc;
    }, {})
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePesoChange = (itemId, value) => {
    setPesosReales(prev => ({ ...prev, [itemId]: value }));
  };

  // Agrupar items por recibo para mostrar en tabla
  const gruposPorRecibo = useMemo(() => {
    const grupos = {};
    items.forEach(item => {
      const rid = item.recibo_id;
      if (!grupos[rid]) {
        grupos[rid] = { recibo: item.importaciones_recibos, items: [] };
      }
      grupos[rid].items.push(item);
    });
    return Object.values(grupos);
  }, [items]);

  const costoTotal = parseFloat(form.pago_courier_usd || 0) + parseFloat(form.costo_picking_shipping_usd || 0);

  // Calcular peso real total sumando pesos ingresados
  const totalPesoReal = useMemo(() => {
    return items.reduce((sum, item) => {
      const pesoUnit = parseFloat(pesosReales[item.id] || 0);
      return sum + pesoUnit * (item.cantidad || 1);
    }, 0);
  }, [pesosReales, items]);

  // Proyección de costos por item
  const proyeccion = useMemo(() => {
    return items.map(item => {
      const pesoUnit = parseFloat(pesosReales[item.id] || 0);
      const pesoTotal = pesoUnit * (item.cantidad || 1);
      const proporcion = totalPesoReal > 0 ? pesoTotal / totalPesoReal : 0;

      const costoEnvioTotalItem = proporcion * costoTotal;
      const costoEnvioUnit = (item.cantidad || 1) > 0 ? costoEnvioTotalItem / item.cantidad : 0;

      const porcFinanciero = parseFloat(item.importaciones_recibos?.porcentaje_financiero || 0);
      const costoFinUnit = parseFloat(item.precio_unitario_usd || 0) * porcFinanciero / 100;

      const costoFinalUnit = parseFloat(item.precio_unitario_usd || 0) + costoEnvioUnit + costoFinUnit;

      return {
        id: item.id,
        costoEnvioUnit,
        costoFinUnit,
        costoFinalUnit
      };
    });
  }, [items, pesosReales, totalPesoReal, costoTotal]);

  const formatNum = (n) => isNaN(n) ? '-' : `$${parseFloat(n).toFixed(2)}`;

  const handleSubmit = async () => {
    if (!form.fecha_recepcion) { alert('La fecha de recepción es obligatoria'); return; }
    if (!form.peso_sin_caja_kg || parseFloat(form.peso_sin_caja_kg) <= 0) { alert('El peso sin caja es obligatorio'); return; }

    setIsSubmitting(true);
    try {
      await recepcionarCaja(caja.id, { ...form, pesosReales });
      onSuccess();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded border border-slate-200 w-full max-w-5xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between rounded-t flex-shrink-0">
          <div className="flex items-center gap-3">
            <PackageCheck size={22} />
            <div>
              <h3 className="text-lg font-semibold">Recepcionar Caja — {caja.numero_caja}</h3>
              {caja.descripcion && <p className="text-slate-300 text-xs mt-0.5">{caja.descripcion}</p>}
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                <input
                  type="number" step="0.01" min="0"
                  value={form.peso_total_con_caja_kg}
                  onChange={e => handleFormChange('peso_total_con_caja_kg', e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Peso s/ caja (kg) *</label>
                <input
                  type="number" step="0.01" min="0"
                  value={form.peso_sin_caja_kg}
                  onChange={e => handleFormChange('peso_sin_caja_kg', e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Precio / kg (USD)</label>
                <input
                  type="number" step="0.01" min="0"
                  value={form.precio_por_kg_usd}
                  onChange={e => handleFormChange('precio_por_kg_usd', e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Pago Courier (USD)</label>
                <input
                  type="number" step="0.01" min="0"
                  value={form.pago_courier_usd}
                  onChange={e => handleFormChange('pago_courier_usd', e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Picking / Shipping (USD)</label>
                <input
                  type="number" step="0.01" min="0"
                  value={form.costo_picking_shipping_usd}
                  onChange={e => handleFormChange('costo_picking_shipping_usd', e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Resumen de costos */}
            {costoTotal > 0 && (
              <div className="mt-4 flex items-center gap-6 text-sm">
                <span className="text-slate-500">Costo total a distribuir:</span>
                <span className="font-semibold text-slate-800">${costoTotal.toFixed(2)} USD</span>
                <span className="text-slate-500 ml-4">Peso real total:</span>
                <span className="font-semibold text-slate-800">{totalPesoReal.toFixed(3)} kg</span>
              </div>
            )}
          </div>

          {/* Tabla de items con pesos reales y proyección */}
          <div className="p-6">
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
              Items — Ingresar Pesos Reales y Ver Distribución de Costos
            </h4>

            {gruposPorRecibo.map((grupo, gi) => (
              <div key={gi} className="mb-4">
                {/* Sub-header por pedido */}
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
                      <th className="px-3 py-2 text-center text-xs font-medium uppercase">Precio FOB</th>
                      <th className="px-3 py-2 text-center text-xs font-medium uppercase w-28">Peso Real (kg/u)</th>
                      <th className="px-3 py-2 text-center text-xs font-medium uppercase">Peso Total</th>
                      <th className="px-3 py-2 text-center text-xs font-medium uppercase">C. Envío/u</th>
                      <th className="px-3 py-2 text-center text-xs font-medium uppercase">C. Financiero/u</th>
                      <th className="px-3 py-2 text-center text-xs font-medium uppercase">Precio Final/u</th>
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
                              type="number"
                              step="0.001"
                              min="0"
                              value={pesosReales[item.id]}
                              onChange={e => handlePesoChange(item.id, e.target.value)}
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
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between flex-shrink-0 bg-white">
          <div className="text-sm text-slate-500">
            <span>{items.length} item(s) en {gruposPorRecibo.length} pedido(s)</span>
            {costoTotal > 0 && (
              <span className="ml-4 text-slate-700 font-medium">
                Costo total: ${costoTotal.toFixed(2)} USD distribuido por peso
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
              disabled={isSubmitting}
              className="px-6 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:opacity-50 font-medium"
            >
              {isSubmitting ? 'Procesando...' : 'Confirmar Recepción'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecepcionCajaModal;
