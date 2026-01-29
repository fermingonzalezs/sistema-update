import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { useProveedores } from '../hooks/useProveedores';

const PasarAComprasModal = ({ recibo, onClose, onConfirm, isSubmitting }) => {
  const { proveedores } = useProveedores();

  // Estado del recibo
  const [reciboEditado, setReciboEditado] = useState({
    proveedor: recibo.proveedores?.nombre || '',
    proveedor_id: recibo.proveedor_id || '',
    fecha: recibo.fecha_recepcion_argentina || '',
    descripcion: `Tracking: ${recibo.tracking_number || 'N/A'} | ${recibo.observaciones || ''}`,
    metodo_pago: recibo.metodo_pago || ''
  });

  // Estado de items
  const [itemsEditados, setItemsEditados] = useState(
    (recibo.importaciones_items || []).map(item => ({
      id: item.id,
      item: item.item,
      cantidad: item.cantidad,
      precio_unitario_original: item.precio_unitario_usd,
      costos_adicionales_usd: item.costos_adicionales_usd || 0,
      precio_unitario_final: item.costo_final_unitario_usd,
      link_producto: item.link_producto,
      observaciones: item.observaciones
    }))
  );

  const formatNumber = (num) => {
    return Math.round(num).toLocaleString('es-AR');
  };

  // Recalcular totales
  const totales = useMemo(() => {
    return itemsEditados.reduce((acc, item) => {
      const cantidad = parseFloat(item.cantidad) || 0;
      const precioFinal = parseFloat(item.precio_unitario_final) || 0;
      const monto = cantidad * precioFinal;
      const costosTotal = (parseFloat(item.costos_adicionales_usd) || 0) * cantidad;

      return {
        cantidad: acc.cantidad + cantidad,
        montoProductos: acc.montoProductos + (cantidad * (parseFloat(item.precio_unitario_original) || 0)),
        costosAdicionales: acc.costosAdicionales + costosTotal,
        montoTotal: acc.montoTotal + monto
      };
    }, { cantidad: 0, montoProductos: 0, costosAdicionales: 0, montoTotal: 0 });
  }, [itemsEditados]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...itemsEditados];
    newItems[index][field] = value;

    // Si se edita el precio_unitario_final directamente, actualizar
    if (field === 'precio_unitario_final') {
      newItems[index].precio_unitario_final = value;
    }

    setItemsEditados(newItems);
  };

  const handleSubmit = () => {
    // Validaciones
    if (!reciboEditado.fecha) {
      alert('La fecha es obligatoria');
      return;
    }

    if (!reciboEditado.metodo_pago) {
      alert('El método de pago es obligatorio');
      return;
    }

    if (itemsEditados.some(item => !item.cantidad || item.cantidad <= 0)) {
      alert('Todos los items deben tener cantidad mayor a 0');
      return;
    }

    onConfirm(reciboEditado, itemsEditados);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded border border-slate-200 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="p-6 bg-slate-800 text-white flex justify-between items-center sticky top-0">
          <div>
            <h3 className="text-xl font-semibold">Pasar Importación a Compras</h3>
            <p className="text-slate-300 text-sm mt-1">{recibo.numero_recibo}</p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white" disabled={isSubmitting}>
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* INFORMACIÓN DEL RECIBO */}
          <div className="space-y-3">
            <div className="bg-slate-200 p-4 rounded-t border border-slate-300">
              <h4 className="font-semibold text-slate-800 uppercase">Información del Recibo</h4>
            </div>
            <div className="border border-slate-300 border-t-0 rounded-b p-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Proveedor</label>
                    <div className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50 text-slate-600">
                      {reciboEditado.proveedor}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Fecha *</label>
                    <input
                      type="date"
                      value={reciboEditado.fecha}
                      onChange={(e) => setReciboEditado({ ...reciboEditado, fecha: e.target.value })}
                      disabled={isSubmitting}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Método de Pago</label>
                    <select
                      value={reciboEditado.metodo_pago}
                      onChange={(e) => setReciboEditado({ ...reciboEditado, metodo_pago: e.target.value })}
                      disabled={isSubmitting}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">Seleccionar método</option>
                      <option value="efectivo_pesos">💵 Efectivo en Pesos</option>
                      <option value="dolares_billete">💸 Dólares Billete</option>
                      <option value="transferencia">🏦 Transferencia</option>
                      <option value="criptomonedas">₿ Criptomonedas</option>
                      <option value="tarjeta_credito">💳 Tarjeta de Crédito</option>
                      <option value="cuenta_corriente">🏷️ Cuenta Corriente</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Descripción</label>
                    <textarea
                      value={reciboEditado.descripcion}
                      onChange={(e) => setReciboEditado({ ...reciboEditado, descripcion: e.target.value })}
                      disabled={isSubmitting}
                      rows={2}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ITEMS DE COMPRA */}
          <div className="space-y-3">
            <div className="bg-slate-200 p-4 rounded-t border border-slate-300">
              <h4 className="font-semibold text-slate-800 uppercase">Items de Compra</h4>
            </div>
            <div className="border border-slate-300 border-t-0 rounded-b overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Producto</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Cantidad</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">P. Unit. Original USD</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Costos Adic. USD</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">P. Unit. Final USD</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Monto Total USD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {itemsEditados.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-4 py-3 text-slate-800">
                        <input
                          type="text"
                          value={item.item}
                          onChange={(e) => handleItemChange(idx, 'item', e.target.value)}
                          disabled={isSubmitting}
                          className="w-full border border-slate-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {item.link_producto && (
                          <a
                            href={item.link_producto}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-600 hover:text-emerald-700 block mt-1"
                          >
                            Ver link
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => handleItemChange(idx, 'cantidad', e.target.value)}
                          disabled={isSubmitting}
                          min="0"
                          step="0.01"
                          className="w-20 border border-slate-200 rounded px-2 py-1 text-sm text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-center bg-slate-50 text-slate-600">
                        ${Math.round(item.precio_unitario_original)}
                      </td>
                      <td className="px-4 py-3 text-center bg-slate-50 text-slate-600">
                        ${Math.round(item.costos_adicionales_usd)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          value={Math.round(item.precio_unitario_final)}
                          onChange={(e) => handleItemChange(idx, 'precio_unitario_final', e.target.value)}
                          disabled={isSubmitting}
                          step="1"
                          className="w-24 border border-slate-200 rounded px-2 py-1 text-sm text-center font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-800">
                        ${formatNumber((parseFloat(item.cantidad) || 0) * (parseFloat(item.precio_unitario_final) || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-800 text-white">
                  <tr>
                    <td colSpan="1" className="px-4 py-3 text-sm font-semibold">TOTALES</td>
                    <td className="px-4 py-3 text-center text-sm font-semibold">{Math.round(totales.cantidad)}</td>
                    <td className="px-4 py-3 text-center text-sm font-semibold">USD ${formatNumber(totales.montoProductos)}</td>
                    <td className="px-4 py-3 text-center text-sm font-semibold">USD ${formatNumber(totales.costosAdicionales)}</td>
                    <td colSpan="1" className="px-4 py-3 text-center text-sm font-semibold"></td>
                    <td className="px-4 py-3 text-center text-sm font-semibold">USD ${formatNumber(totales.montoTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>


          {/* BOTONES */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-6 py-2 text-slate-700 hover:bg-slate-100 rounded transition-colors font-medium"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
              disabled={isSubmitting || !reciboEditado.fecha || !reciboEditado.metodo_pago}
            >
              {isSubmitting ? 'Procesando...' : 'Confirmar y Pasar a Compras'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasarAComprasModal;
