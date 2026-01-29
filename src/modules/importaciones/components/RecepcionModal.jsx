import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { useImportaciones } from '../hooks/useImportaciones';
import { calculosImportacion } from '../utils/calculosImportacion';
import { obtenerFechaLocal } from '../../../shared/utils/formatters';

const RecepcionModal = ({ recibo, onClose, onSuccess }) => {
  const { recepcionarEnArgentina } = useImportaciones();

  const [formDatos, setFormDatos] = useState({
    fecha_recepcion: obtenerFechaLocal(),
    peso_total_con_caja_kg: '',
    peso_sin_caja_kg: '',
    precio_por_kg_usd: '',
    pago_courier_usd: '',
    costo_picking_shipping_usd: ''
  });

  // Estado para pesos reales de cada producto
  const [pesosReales, setPesosReales] = useState(
    (recibo.importaciones_items || []).reduce((acc, item) => {
      acc[item.id] = '';
      return acc;
    }, {})
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatNumber = (num) => {
    return Math.round(num).toLocaleString('es-AR');
  };

  const totalPreciosItems = (recibo.importaciones_items || []).reduce(
    (sum, item) => sum + (item.precio_total_usd || 0),
    0
  );

  const totalPesoEstimado = (recibo.importaciones_items || []).reduce(
    (sum, item) => sum + (item.peso_estimado_total_kg || 0),
    0
  );

  // Calcular peso total REAL basado en los pesos unitarios editados
  const totalPesoReal = useMemo(() => {
    return (recibo.importaciones_items || []).reduce((sum, item) => {
      const pesoUnitarioReal = pesosReales[item.id] !== '' ? parseFloat(pesosReales[item.id]) : item.peso_estimado_unitario_kg;
      return sum + (pesoUnitarioReal * item.cantidad);
    }, 0);
  }, [pesosReales, recibo.importaciones_items]);

  const costoTotalAdicional = calculosImportacion.calcularCostoTotalImportacion(
    formDatos.pago_courier_usd,
    formDatos.costo_picking_shipping_usd
  );

  // Proyección de distribución de costos POR PESO
  const costosPorItem = useMemo(() => {
    return (recibo.importaciones_items || []).map(item => {
      const pesoEstimado = item.peso_estimado_total_kg || 0;
      const proporcionPeso = totalPesoEstimado > 0 ? pesoEstimado / totalPesoEstimado : 0;
      const costoAdicional = proporcionPeso * costoTotalAdicional;
      const costoFinalUnitario = item.precio_unitario_usd + (costoAdicional / item.cantidad);
      return {
        item_id: item.id,
        costoAdicional: costoAdicional,
        costoFinalUnitario: costoFinalUnitario
      };
    });
  }, [recibo.importaciones_items, totalPesoEstimado, costoTotalAdicional]);

  const guardarRecepcion = async () => {
    // Validaciones
    if (!formDatos.fecha_recepcion) {
      alert('Por favor ingresa la fecha de recepción');
      return;
    }

    if (!formDatos.peso_total_con_caja_kg || parseFloat(formDatos.peso_total_con_caja_kg) <= 0) {
      alert('El peso total con caja es obligatorio y debe ser mayor a 0');
      return;
    }

    if (!formDatos.peso_sin_caja_kg || parseFloat(formDatos.peso_sin_caja_kg) <= 0) {
      alert('El peso sin caja es obligatorio y debe ser mayor a 0');
      return;
    }

    if (!formDatos.precio_por_kg_usd || parseFloat(formDatos.precio_por_kg_usd) <= 0) {
      alert('El precio por kg es obligatorio y debe ser mayor a 0');
      return;
    }

    if (parseFloat(formDatos.pago_courier_usd || 0) < 0) {
      alert('El pago courier no puede ser negativo');
      return;
    }

    if (parseFloat(formDatos.costo_picking_shipping_usd || 0) < 0) {
      alert('El costo picking/shipping no puede ser negativo');
      return;
    }

    // Los pesos reales son opcionales, si no se ingresan se usan los estimados
    setIsSubmitting(true);
    try {
      // Convertir pesosReales a números, usando pesos estimados si no se ingresó un peso real
      const pesosRealesNumericos = {};
      for (const item of recibo.importaciones_items) {
        const pesoIngresado = pesosReales[item.id];
        // Si el peso está vacío o es inválido, usar el peso estimado
        pesosRealesNumericos[item.id] = (pesoIngresado !== '' && pesoIngresado !== null && pesoIngresado !== undefined)
          ? parseFloat(pesoIngresado)
          : (item.peso_estimado_unitario_kg || 0);
      }

      // Convertir todos los formDatos a números
      const datosConPesos = {
        fecha_recepcion: formDatos.fecha_recepcion,
        peso_total_con_caja_kg: parseFloat(formDatos.peso_total_con_caja_kg) || 0,
        peso_sin_caja_kg: parseFloat(formDatos.peso_sin_caja_kg) || 0,
        precio_por_kg_usd: parseFloat(formDatos.precio_por_kg_usd) || 0,
        pago_courier_usd: parseFloat(formDatos.pago_courier_usd) || 0,
        costo_picking_shipping_usd: parseFloat(formDatos.costo_picking_shipping_usd) || 0,
        pesosReales: pesosRealesNumericos
      };
      await recepcionarEnArgentina(recibo.id, datosConPesos);
      alert('✅ Importación recepcionada exitosamente');
      onSuccess();
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="p-6 bg-slate-800 text-white flex justify-between items-center sticky top-0">
          <h3 className="text-xl font-semibold">Recepcionar Importación: {recibo.numero_recibo}</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* ITEMS UNIFICADO */}
          <div className="space-y-3">
            <div className="bg-slate-200 p-4 rounded-t border border-slate-300 text-center">
              <h4 className="font-semibold text-slate-800 uppercase">Items</h4>
            </div>
            <div className="border border-slate-300 border-t-0 rounded-b overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Producto</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Cant.</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">P. Unit. USD</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Precio Total USD</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Peso Unit. (kg)</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Peso Total (kg)</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Costo Adic. Unit. USD</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Costo Adic. Total USD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(recibo.importaciones_items || []).map((item, idx) => {
                    const pesoUnitarioReal = pesosReales[item.id] !== '' ? parseFloat(pesosReales[item.id]) : item.peso_estimado_unitario_kg;
                    const pesoTotalReal = pesoUnitarioReal * item.cantidad;
                    return (
                      <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="px-4 py-3 text-slate-800">{item.item}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{item.cantidad}</td>
                        <td className="px-4 py-3 text-center text-slate-600">${formatNumber(item.precio_unitario_usd)}</td>
                        <td className="px-4 py-3 text-center font-semibold text-slate-800">${formatNumber(item.precio_total_usd)}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            step="0.01"
                            value={pesosReales[item.id] !== '' ? pesosReales[item.id] : item.peso_estimado_unitario_kg}
                            onChange={(e) => setPesosReales({ ...pesosReales, [item.id]: e.target.value })}
                            className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">{pesoTotalReal.toFixed(2)} kg</td>
                        <td className="px-4 py-3 text-center font-semibold text-slate-800">
                          ${formatNumber((costosPorItem[idx]?.costoAdicional || 0) / item.cantidad)}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-slate-800">
                          ${formatNumber(costosPorItem[idx]?.costoAdicional || 0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* DATOS DE RECEPCIÓN */}
          <div className="space-y-3">
            <div className="bg-slate-200 p-4 rounded-t border border-slate-300 text-center">
              <h4 className="font-semibold text-slate-800 uppercase">Datos de Recepción</h4>
            </div>
            <div className="border border-slate-300 border-t-0 rounded-b p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Recepción *</label>
                  <input
                    type="date"
                    value={formDatos.fecha_recepcion}
                    onChange={(e) => setFormDatos({ ...formDatos, fecha_recepcion: e.target.value })}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Peso Total con Caja (kg) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formDatos.peso_total_con_caja_kg}
                    onChange={(e) => setFormDatos({ ...formDatos, peso_total_con_caja_kg: e.target.value })}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Peso sin Caja (kg) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formDatos.peso_sin_caja_kg}
                    onChange={(e) => setFormDatos({ ...formDatos, peso_sin_caja_kg: e.target.value })}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Referencia items: {totalPesoReal.toFixed(2)} kg
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Precio por KG (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formDatos.precio_por_kg_usd}
                    onChange={(e) => setFormDatos({ ...formDatos, precio_por_kg_usd: e.target.value })}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pago Courier (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formDatos.pago_courier_usd}
                    onChange={(e) => setFormDatos({ ...formDatos, pago_courier_usd: e.target.value })}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Estimado: ${formatNumber(
                      parseFloat(formDatos.peso_total_con_caja_kg || 0) * parseFloat(formDatos.precio_por_kg_usd || 0)
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Costo Picking/Shipping (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formDatos.costo_picking_shipping_usd}
                    onChange={(e) => setFormDatos({ ...formDatos, costo_picking_shipping_usd: e.target.value })}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RESUMEN */}
          <div className="space-y-3">
            <div className="bg-slate-200 p-4 rounded-t border border-slate-300 text-center">
              <h4 className="font-semibold text-slate-800 uppercase">Resumen</h4>
            </div>
            <div className="border border-slate-300 border-t-0 rounded-b p-4 space-y-3 text-sm">
              <div className="flex justify-between text-slate-600 pb-3 border-b border-slate-200">
                <span>Costo Courier (USD):</span>
                <span className="font-semibold text-slate-800">USD ${formatNumber(parseFloat(formDatos.pago_courier_usd || 0))}</span>
              </div>
              <div className="flex justify-between text-slate-600 pb-3 border-b border-slate-200">
                <span>Costo Picking/Shipping (USD):</span>
                <span className="font-semibold text-slate-800">USD ${formatNumber(parseFloat(formDatos.costo_picking_shipping_usd || 0))}</span>
              </div>
              <div className="flex justify-between text-slate-600 pb-3 border-b border-slate-200">
                <span>Costo Total Adicional (USD):</span>
                <span className="font-semibold text-slate-800">USD ${formatNumber(costoTotalAdicional)}</span>
              </div>
              <div className="flex justify-between text-slate-600 pb-3 border-b border-slate-200">
                <span>Costo Productos (USD):</span>
                <span className="font-semibold text-slate-800">USD ${formatNumber(totalPreciosItems)}</span>
              </div>

              <div className="bg-slate-100 border border-slate-300 rounded p-3 mt-3">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>COSTO TOTAL IMPORTACIÓN:</span>
                  <span>USD ${formatNumber(totalPreciosItems + costoTotalAdicional)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* BOTONES */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              onClick={guardarRecepcion}
              className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Recepcionando...' : 'Confirmar Recepción'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecepcionModal;
