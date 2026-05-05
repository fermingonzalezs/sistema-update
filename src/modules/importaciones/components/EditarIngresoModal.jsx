import React, { useState, useMemo, useEffect } from 'react';
import { X, Save, Calculator } from 'lucide-react';

const EditarIngresoModal = ({ ingreso, onClose, onSuccess }) => {
  const [fechaRecepcion, setFechaRecepcion] = useState('');
  const [pesoTotalConCaja, setPesoTotalConCaja] = useState('');
  const [precioPorKg, setPrecioPorKg] = useState('');
  const [pagoCourier, setPagoCourier] = useState('');
  const [costoPickingShipping, setCostoPickingShipping] = useState('');
  const [pesosReales, setPesosReales] = useState({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (ingreso) {
      setFechaRecepcion(ingreso.fecha_recepcion || '');
      setPesoTotalConCaja(ingreso.peso_total_con_caja_kg || '');
      setPrecioPorKg(ingreso.precio_por_kg_usd || '');
      setPagoCourier(ingreso.pago_courier_usd || '');
      setCostoPickingShipping(ingreso.costo_picking_shipping_usd || '');
      const map = {};
      (ingreso.importaciones_items || []).forEach(item => {
        map[item.id] = item.peso_real_unitario_kg !== null && item.peso_real_unitario_kg !== undefined
          ? item.peso_real_unitario_kg
          : (item.peso_estimado_unitario_kg || 0);
      });
      setPesosReales(map);
    }
  }, [ingreso]);

  // Auto-calcular pago courier cuando cambia precio/kg o peso con caja
  const handlePrecioPorKgChange = (val) => {
    setPrecioPorKg(val);
    const peso = parseFloat(pesoTotalConCaja);
    const precio = parseFloat(val);
    if (!isNaN(peso) && !isNaN(precio) && peso > 0 && precio > 0) {
      setPagoCourier((peso * precio).toFixed(2));
    }
  };

  const handlePesoConCajaChange = (val) => {
    setPesoTotalConCaja(val);
    const peso = parseFloat(val);
    const precio = parseFloat(precioPorKg);
    if (!isNaN(peso) && !isNaN(precio) && peso > 0 && precio > 0) {
      setPagoCourier((peso * precio).toFixed(2));
    }
  };

  const preview = useMemo(() => {
    const items = ingreso?.importaciones_items || [];
    const costoTotal = parseFloat(pagoCourier || 0) + parseFloat(costoPickingShipping || 0);

    let totalPesoReal = 0;
    const pesosMap = {};
    for (const item of items) {
      const pesoIngresado = parseFloat(pesosReales?.[item.id]);
      const pesoUnitario = !isNaN(pesoIngresado) ? pesoIngresado : parseFloat(item.peso_estimado_unitario_kg || 0);
      pesosMap[item.id] = pesoUnitario;
      totalPesoReal += pesoUnitario * (item.cantidad || 1);
    }

    const resultados = [];
    for (const item of items) {
      const pesoUnitario = pesosMap[item.id];
      const pesoTotalItem = pesoUnitario * (item.cantidad || 1);
      const proporcion = totalPesoReal > 0 ? pesoTotalItem / totalPesoReal : 0;
      const costoEnvioTotal = proporcion * costoTotal;
      const costoEnvioUnitario = (item.cantidad || 1) > 0 ? costoEnvioTotal / item.cantidad : 0;
      const porcentajeFinanciero = parseFloat(item.importaciones_recibos?.porcentaje_financiero || 0);
      const costoFinancieroUnitario = parseFloat(item.precio_unitario_usd || 0) * porcentajeFinanciero / 100;
      const costoTotalUnitario = costoEnvioUnitario + costoFinancieroUnitario;
      const costoFinalUnitario = parseFloat(item.precio_unitario_usd || 0) + costoTotalUnitario;

      resultados.push({
        item,
        pesoUnitario,
        pesoTotalItem,
        proporcion,
        costoEnvioUnitario,
        costoFinancieroUnitario,
        costoTotalUnitario,
        costoFinalUnitario
      });
    }
    return { resultados, totalPesoReal, costoTotal };
  }, [ingreso, pesosReales, pagoCourier, costoPickingShipping]);

  const grupos = useMemo(() => {
    const g = {};
    (ingreso?.importaciones_items || []).forEach(item => {
      const rid = item.recibo_id || 'sin-recibo';
      if (!g[rid]) g[rid] = { recibo: item.importaciones_recibos, items: [] };
      g[rid].items.push(item);
    });
    return Object.values(g);
  }, [ingreso]);

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await onSuccess({
        fecha_recepcion: fechaRecepcion,
        peso_total_con_caja_kg: pesoTotalConCaja,
        precio_por_kg_usd: precioPorKg,
        pago_courier_usd: pagoCourier,
        costo_picking_shipping_usd: costoPickingShipping,
        pesosReales
      });
      onClose();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (!ingreso) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded border border-slate-300 w-full max-w-[95vw] mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Calculator size={20} />
            <div>
              <h3 className="text-base font-semibold">Editar Ingreso</h3>
              <p className="text-slate-300 text-xs">{ingreso.numero_caja}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Datos del ingreso */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Datos del ingreso</h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Fecha recepción</label>
                <input
                  type="date"
                  value={fechaRecepcion}
                  onChange={e => setFechaRecepcion(e.target.value)}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Peso total c/ caja (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={pesoTotalConCaja}
                  onChange={e => handlePesoConCajaChange(e.target.value)}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Precio / kg (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={precioPorKg}
                  onChange={e => handlePrecioPorKgChange(e.target.value)}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Pago courier (USD)
                  {parseFloat(pesoTotalConCaja) > 0 && parseFloat(precioPorKg) > 0 && (
                    <span className="text-slate-400 font-normal ml-1">(auto: {parseFloat(pesoTotalConCaja)} × {parseFloat(precioPorKg)})</span>
                  )}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={pagoCourier}
                  onChange={e => setPagoCourier(e.target.value)}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Picking / shipping (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={costoPickingShipping}
                  onChange={e => setCostoPickingShipping(e.target.value)}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Peso real por item */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Peso real por item</h4>
            {grupos.map((grupo, gi) => (
              <div key={gi} className="mb-4">
                <div className="bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 border-b-0 rounded-t">
                  {grupo.recibo?.numero_recibo || 'Pedido'} — {grupo.recibo?.proveedores?.nombre || 'Sin proveedor'}
                </div>
                <div className="border border-slate-200 rounded-b overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-slate-800 text-white">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase">Producto</th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase">Color</th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase">Almac.</th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase">Cant.</th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase">Peso actual (kg)</th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase">Nuevo peso/u (kg)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {grupo.items.map((item, idx) => (
                        <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="px-3 py-2 text-sm text-slate-800">{item.item}</td>
                          <td className="px-3 py-2 text-center text-xs text-slate-600">{item.color || '—'}</td>
                          <td className="px-3 py-2 text-center text-xs text-slate-600">{item.almacenamiento || '—'}</td>
                          <td className="px-3 py-2 text-center text-xs text-slate-600">{item.cantidad}</td>
                          <td className="px-3 py-2 text-center text-xs text-slate-600">
                            {parseFloat(item.peso_real_unitario_kg || 0).toFixed(3)} kg
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="number"
                              step="0.001"
                              value={pesosReales[item.id] ?? ''}
                              onChange={e => setPesosReales(prev => ({ ...prev, [item.id]: e.target.value }))}
                              className="w-28 border border-slate-200 rounded px-2 py-1 text-xs text-center focus:ring-2 focus:ring-emerald-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* Preview de recálculo */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Preview de recálculo (no guardado)
            </h4>
            <div className="bg-emerald-50 border border-emerald-200 rounded p-3 mb-3 text-xs text-emerald-800 flex items-center gap-2">
              <Calculator size={14} />
              <span>Peso sin caja: <strong>{preview.totalPesoReal.toFixed(3)} kg</strong> · Courier total: <strong>U$ {preview.costoTotal.toFixed(2)}</strong></span>
            </div>
            {grupos.map((grupo, gi) => (
              <div key={gi} className="mb-4">
                <div className="bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 border-b-0 rounded-t">
                  {grupo.recibo?.numero_recibo || 'Pedido'} — {grupo.recibo?.proveedores?.nombre || 'Sin proveedor'}
                </div>
                <div className="border border-slate-200 rounded-b overflow-x-auto">
                  <table className="w-full min-w-[1100px]">
                    <thead className="bg-slate-800 text-white">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase">Producto</th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase">Cant.</th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase">Peso total item</th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase">Proporción %</th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase">Nuevo envío/u</th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase">Nuevo final/u</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {grupo.items.map((item, idx) => {
                        const p = preview.resultados.find(r => r.item.id === item.id);
                        if (!p) return null;
                        return (
                          <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="px-3 py-2 text-sm text-slate-800">{item.item}</td>
                            <td className="px-3 py-2 text-center text-xs text-slate-600">{item.cantidad}</td>
                            <td className="px-3 py-2 text-center text-xs text-slate-600">{p.pesoTotalItem.toFixed(3)} kg</td>
                            <td className="px-3 py-2 text-center text-xs text-slate-600">{(p.proporcion * 100).toFixed(2)}%</td>
                            <td className="px-3 py-2 text-center text-xs text-blue-700 font-medium">U$ {p.costoEnvioUnitario.toFixed(2)}</td>
                            <td className="px-3 py-2 text-center text-xs text-emerald-700 font-semibold">U$ {p.costoFinalUnitario.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="shrink-0 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {guardando ? 'Guardando...' : 'Guardar y Recalcular'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditarIngresoModal;
