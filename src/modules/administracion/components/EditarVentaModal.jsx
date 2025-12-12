import React, { useState, useEffect } from 'react';
import { X, Monitor, Smartphone, Box, AlertTriangle, Save, Loader } from 'lucide-react';
import { formatearMonto, formatearFechaParaInput, parseFechaLocal } from '../../../shared/utils/formatters';
import ClienteSelector from '../../../modules/ventas/components/ClienteSelector';
import { useVendedores } from '../../../modules/ventas/hooks/useVendedores';
import { useVentas } from '../../../modules/ventas/hooks/useVentas';

const EditarVentaModal = ({ transaccion, onClose, onSave }) => {
  if (!transaccion) return null;

  const { vendedores, fetchVendedores } = useVendedores();
  const { actualizarVenta } = useVentas();

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [items, setItems] = useState([]);
  const [metodoPago1, setMetodoPago1] = useState('');
  const [montoPago1, setMontoPago1] = useState(0);
  const [metodoPago2, setMetodoPago2] = useState('');
  const [montoPago2, setMontoPago2] = useState(0);
  const [vendedor, setVendedor] = useState('');
  const [fechaVenta, setFechaVenta] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [advertenciaCC, setAdvertenciaCC] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Totales calculados
  const [totalVenta, setTotalVenta] = useState(0);
  const [totalCosto, setTotalCosto] = useState(0);
  const [margenTotal, setMargenTotal] = useState(0);
  const [margenPct, setMargenPct] = useState(0);

  const metodosPago = [
    { value: 'efectivo_pesos', label: '💵 Efectivo en Pesos' },
    { value: 'dolares_billete', label: '💸 Dólares Billete' },
    { value: 'transferencia', label: '🏦 Transferencia' },
    { value: 'cuenta_corriente', label: '📋 Cuenta Corriente' },
    { value: 'tarjeta_credito', label: '💳 Tarjeta de Crédito' }
  ];

  // Cargar vendedores
  useEffect(() => {
    fetchVendedores();
  }, []);

  // Inicializar datos
  useEffect(() => {
    if (transaccion) {
      // Cliente inicial (simulado, el selector lo manejará)
      setClienteSeleccionado({
        id: transaccion.cliente_id,
        nombre: transaccion.cliente_nombre?.split(' ')[0] || '',
        apellido: transaccion.cliente_nombre?.split(' ').slice(1).join(' ') || '',
        email: transaccion.cliente_email,
        telefono: transaccion.cliente_telefono
      });

      // Items
      setItems(transaccion.venta_items || []);

      // Métodos de pago
      setMetodoPago1(transaccion.metodo_pago || 'efectivo_pesos');
      setMontoPago1(parseFloat(transaccion.monto_pago_1 || 0));
      setMetodoPago2(transaccion.metodo_pago_2 || '');
      setMontoPago2(parseFloat(transaccion.monto_pago_2 || 0));

      // Vendedor
      setVendedor(transaccion.vendedor || '');

      // Fecha (formato YYYY-MM-DD) - usar split para evitar problemas de timezone
      const fechaStr = transaccion.fecha_venta.split('T')[0];
      setFechaVenta(fechaStr);

      // Observaciones
      setObservaciones(transaccion.observaciones || '');
    }
  }, [transaccion]);

  // Recalcular totales cuando cambian items
  useEffect(() => {
    const total = items.reduce((sum, item) =>
      sum + (parseFloat(item.precio_unitario) * item.cantidad), 0
    );
    const costo = items.reduce((sum, item) =>
      sum + (parseFloat(item.precio_costo) * item.cantidad), 0
    );
    const margen = total - costo;
    const pct = total > 0 ? (margen / total) * 100 : 0;

    setTotalVenta(total);
    setTotalCosto(costo);
    setMargenTotal(margen);
    setMargenPct(pct);
  }, [items]);

  const getIconoProducto = (tipo) => {
    switch (tipo) {
      case 'computadora': return <Monitor className="w-4 h-4 text-slate-600" />;
      case 'celular': return <Smartphone className="w-4 h-4 text-slate-600" />;
      default: return <Box className="w-4 h-4 text-slate-600" />;
    }
  };

  const handlePrecioChange = (itemId, nuevoPrecio) => {
    setItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, precio_unitario: parseFloat(nuevoPrecio) || 0 }
        : item
    ));
  };

  const handleGuardar = async () => {
    // Validaciones
    if (!clienteSeleccionado) {
      alert('Debes seleccionar un cliente');
      return;
    }

    if (!vendedor) {
      alert('Debes seleccionar un vendedor');
      return;
    }

    const sumaPagos = montoPago1 + montoPago2;
    if (Math.abs(sumaPagos - totalVenta) > 0.01) {
      alert(`La suma de pagos ($${sumaPagos.toFixed(2)}) no coincide con el total ($${totalVenta.toFixed(2)})`);
      return;
    }

    if (items.some(i => parseFloat(i.precio_unitario) <= 0)) {
      alert('Todos los precios deben ser mayores a 0');
      return;
    }

    setGuardando(true);

    try {
      const result = await actualizarVenta(transaccion.id, {
        cliente_id: clienteSeleccionado.id,
        cliente_nombre: `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`,
        cliente_email: clienteSeleccionado.email || null,
        cliente_telefono: clienteSeleccionado.telefono || null,
        vendedor,
        fecha_venta: fechaVenta,
        metodo_pago_1: metodoPago1,
        monto_pago_1: montoPago1,
        metodo_pago_2: metodoPago2 || null,
        monto_pago_2: montoPago2 || 0,
        observaciones,
        items: items.map(i => ({
          id: i.id,
          precio_unitario: parseFloat(i.precio_unitario)
        }))
      });

      if (result.advertenciaCC) {
        alert('⚠️ Venta actualizada exitosamente.\n\nEsta venta tiene un movimiento en Cuenta Corriente. Recuerda actualizarlo manualmente si es necesario.');
      } else {
        alert('✅ Venta actualizada exitosamente');
      }

      onSave();
      onClose();
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-slate-800 p-6 text-white flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-xl font-semibold">EDITAR TRANSACCIÓN {transaccion.numero_transaccion}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Sección Cliente */}
          <div className="border border-slate-200 rounded p-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">CLIENTE</h3>
            <ClienteSelector
              selectedCliente={clienteSeleccionado}
              onSelectCliente={setClienteSeleccionado}
              required={true}
            />
          </div>

          {/* Sección Items */}
          <div className="border border-slate-200 rounded p-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">PRODUCTOS</h3>
            <div className="overflow-x-auto mb-4">
              <table className="w-full">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase">Producto</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase">Cant</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase">Precio Unit</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          {getIconoProducto(item.tipo_producto)}
                          <span className="text-slate-800">{item.copy_documento || item.copy}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-slate-800">
                        {item.cantidad}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          step="0.01"
                          value={item.precio_unitario}
                          onChange={(e) => handlePrecioChange(item.id, e.target.value)}
                          className="w-24 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 text-center"
                        />
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-slate-800">
                        {formatearMonto(item.precio_unitario * item.cantidad, 'USD')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista previa totales */}
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <div className="text-xs text-slate-600 uppercase">Total Venta</div>
                <div className="text-lg font-bold text-slate-800">{formatearMonto(totalVenta, 'USD')}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <div className="text-xs text-slate-600 uppercase">Costo</div>
                <div className="text-lg font-bold text-slate-800">{formatearMonto(totalCosto, 'USD')}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <div className="text-xs text-slate-600 uppercase">Ganancia</div>
                <div className={`text-lg font-bold ${margenTotal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatearMonto(margenTotal, 'USD')}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <div className="text-xs text-slate-600 uppercase">Margen %</div>
                <div className={`text-lg font-bold ${margenPct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {margenPct.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Sección Métodos de Pago */}
          <div className="border border-slate-200 rounded p-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">MÉTODOS DE PAGO</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Método 1 *</label>
                <select
                  value={metodoPago1}
                  onChange={(e) => setMetodoPago1(e.target.value)}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  {metodosPago.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monto 1 (USD) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={montoPago1}
                  onChange={(e) => setMontoPago1(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Método 2</label>
                <select
                  value={metodoPago2}
                  onChange={(e) => setMetodoPago2(e.target.value)}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Sin segundo método</option>
                  {metodosPago.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monto 2 (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={montoPago2}
                  onChange={(e) => setMontoPago2(parseFloat(e.target.value) || 0)}
                  disabled={!metodoPago2}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                />
              </div>
            </div>
            {Math.abs((montoPago1 + montoPago2) - totalVenta) > 0.01 && (
              <div className="mt-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 p-2 rounded">
                ⚠️ La suma de pagos (${(montoPago1 + montoPago2).toFixed(2)}) no coincide con el total (${totalVenta.toFixed(2)})
              </div>
            )}
          </div>

          {/* Sección Vendedor y Fecha */}
          <div className="border border-slate-200 rounded p-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">INFORMACIÓN ADICIONAL</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vendedor *</label>
                <select
                  value={vendedor}
                  onChange={(e) => setVendedor(e.target.value)}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Seleccionar vendedor</option>
                  {vendedores.map(v => (
                    <option key={v.id} value={`${v.nombre} ${v.apellido}`}>
                      {v.nombre} {v.apellido}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha *</label>
                <input
                  type="date"
                  value={fechaVenta}
                  onChange={(e) => setFechaVenta(e.target.value)}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Sección Observaciones */}
          <div className="border border-slate-200 rounded p-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">OBSERVACIONES</h3>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              placeholder="Agregar observaciones..."
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Advertencia CC */}
          {advertenciaCC && (
            <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-amber-800 font-semibold mb-1">Advertencia: Cuenta Corriente</h4>
                  <p className="text-amber-700 text-sm">
                    Esta venta tiene un movimiento en Cuenta Corriente. Los cambios NO se reflejarán automáticamente.
                    Deberás actualizar manualmente el movimiento en Cuenta Corriente si es necesario.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-center gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            disabled={guardando}
            className="px-6 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {guardando ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditarVentaModal;
