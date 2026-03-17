import React, { useState, useEffect } from 'react';
import { X, Monitor, Smartphone, Box, AlertTriangle, Save, Loader, Trash2 } from 'lucide-react';
import { formatearMonto } from '../../../shared/utils/formatters';
import ClienteSelector from '../../../modules/ventas/components/ClienteSelector';
import { useVendedores } from '../../../modules/ventas/hooks/useVendedores';
import { useVentas } from '../../../modules/ventas/hooks/useVentas';
import MetodoPagoSelector from '../../../shared/components/ui/MetodoPagoSelector';

// Parsear string formateado (con puntos de miles y coma decimal) a número
const parsearMonto = (valor) => {
  if (!valor && valor !== 0) return 0;
  if (typeof valor === 'number') return valor;
  const str = String(valor).replace(/\./g, '').replace(',', '.');
  return parseFloat(str) || 0;
};

// Formatear número para mostrar en input (puntos de miles, sin decimales salvo que existan)
const formatearMontoInput = (valor) => {
  const num = parsearMonto(valor);
  if (!num) return '';
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(num);
};

// Métodos que se ingresan en pesos ARS
const esMetodoEnPesos = (metodo) =>
  ['efectivo_pesos', 'transferencia', 'tarjeta_credito'].includes(metodo);

const EditarVentaModal = ({ transaccion, onClose, onSave }) => {
  if (!transaccion) return null;

  const { vendedores, fetchVendedores } = useVendedores();
  const { actualizarVenta } = useVentas();

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [items, setItems] = useState([]);

  // 3 métodos de pago — montos almacenados en moneda nativa del método (ARS o USD)
  const [metodoPago1, setMetodoPago1] = useState('');
  const [montoPago1, setMontoPago1] = useState('');
  const [metodoPago2, setMetodoPago2] = useState('');
  const [montoPago2, setMontoPago2] = useState('');
  const [metodoPago3, setMetodoPago3] = useState('');
  const [montoPago3, setMontoPago3] = useState('');

  // Seña y vuelto
  const [metodoPagoSena, setMetodoPagoSena] = useState('');
  const [montoPagoSena, setMontoPagoSena] = useState('');
  const [metodoPagoVuelto, setMetodoPagoVuelto] = useState('');
  const [montoPagoVuelto, setMontoPagoVuelto] = useState('');

  const [cotizacion, setCotizacion] = useState(1000);
  const [vendedor, setVendedor] = useState('');
  const [fechaVenta, setFechaVenta] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Totales calculados
  const [totalVenta, setTotalVenta] = useState(0);
  const [totalCosto, setTotalCosto] = useState(0);
  const [margenTotal, setMargenTotal] = useState(0);
  const [margenPct, setMargenPct] = useState(0);

  useEffect(() => { fetchVendedores(); }, []);

  // Inicializar datos
  useEffect(() => {
    if (!transaccion) return;

    setClienteSeleccionado({
      id: transaccion.cliente_id,
      nombre: transaccion.cliente_nombre?.split(' ')[0] || '',
      apellido: transaccion.cliente_nombre?.split(' ').slice(1).join(' ') || '',
      email: transaccion.cliente_email,
      telefono: transaccion.cliente_telefono
    });

    setItems((transaccion.venta_items || []).map(item => ({
      ...item,
      precio_unitario: formatearMontoInput(item.precio_unitario)
    })));

    const cotiz = transaccion.cotizacion_dolar || 1000;
    setCotizacion(cotiz);

    // Método 1: si era en pesos, mostrar el monto en ARS almacenado
    const m1 = transaccion.metodo_pago || 'efectivo_pesos';
    setMetodoPago1(m1);
    const monto1 = esMetodoEnPesos(m1)
      ? (transaccion.monto_pago_1_ars || (transaccion.monto_pago_1 || 0) * cotiz)
      : (transaccion.monto_pago_1 || 0);
    setMontoPago1(formatearMontoInput(monto1));

    // Método 2
    const m2 = transaccion.metodo_pago_2 || '';
    setMetodoPago2(m2);
    if (m2) {
      const monto2 = esMetodoEnPesos(m2)
        ? (transaccion.monto_pago_2_ars || (transaccion.monto_pago_2 || 0) * cotiz)
        : (transaccion.monto_pago_2 || 0);
      setMontoPago2(formatearMontoInput(monto2));
    }

    // Método 3
    const m3 = transaccion.metodo_pago_3 || '';
    setMetodoPago3(m3);
    if (m3) {
      const monto3 = esMetodoEnPesos(m3)
        ? (transaccion.monto_pago_3_ars || (transaccion.monto_pago_3 || 0) * cotiz)
        : (transaccion.monto_pago_3 || 0);
      setMontoPago3(formatearMontoInput(monto3));
    }

    // Seña
    const ms = transaccion.sena_metodo || '';
    setMetodoPagoSena(ms);
    if (ms && parseFloat(transaccion.sena_monto) > 0) {
      const montoSena = esMetodoEnPesos(ms)
        ? (transaccion.sena_monto_ars || (transaccion.sena_monto || 0) * cotiz)
        : (transaccion.sena_monto || 0);
      setMontoPagoSena(formatearMontoInput(montoSena));
    }

    // Vuelto
    const mv = transaccion.vuelto_metodo || '';
    setMetodoPagoVuelto(mv);
    if (mv && parseFloat(transaccion.vuelto_monto) > 0) {
      const montoVuelto = esMetodoEnPesos(mv)
        ? (transaccion.vuelto_monto_ars || (transaccion.vuelto_monto || 0) * cotiz)
        : (transaccion.vuelto_monto || 0);
      setMontoPagoVuelto(formatearMontoInput(montoVuelto));
    }

    setVendedor(transaccion.vendedor || '');
    setFechaVenta(transaccion.fecha_venta.split('T')[0]);
    setObservaciones(transaccion.observaciones || '');
  }, [transaccion]);

  // Recalcular totales cuando cambian items
  useEffect(() => {
    const total = items.reduce((sum, item) =>
      sum + (parsearMonto(item.precio_unitario) * item.cantidad), 0
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

  // Convertir monto nativo a USD según método
  const aUSD = (monto, metodo) => {
    const num = parsearMonto(monto);
    return esMetodoEnPesos(metodo) ? num / cotizacion : num;
  };

  const sumaPagosUSD =
    aUSD(montoPago1, metodoPago1) +
    (metodoPago2 ? aUSD(montoPago2, metodoPago2) : 0) +
    (metodoPago3 ? aUSD(montoPago3, metodoPago3) : 0) +
    (metodoPagoSena ? aUSD(montoPagoSena, metodoPagoSena) : 0) -
    (metodoPagoVuelto ? aUSD(montoPagoVuelto, metodoPagoVuelto) : 0);

  const getIconoProducto = (tipo) => {
    switch (tipo) {
      case 'computadora': return <Monitor className="w-4 h-4 text-slate-600" />;
      case 'celular': return <Smartphone className="w-4 h-4 text-slate-600" />;
      default: return <Box className="w-4 h-4 text-slate-600" />;
    }
  };

  const handleEliminarItem = (itemId) => {
    if (items.length <= 1) {
      alert('La venta debe tener al menos un producto.');
      return;
    }
    if (!window.confirm('¿Eliminar este producto de la venta?')) return;
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handlePrecioChange = (itemId, valor) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, precio_unitario: valor } : item
    ));
  };

  const handlePrecioBlur = (itemId, valor) => {
    const num = parsearMonto(valor);
    if (num > 0) handlePrecioChange(itemId, formatearMontoInput(num));
  };

  const handleMontoBlur = (setter, valor) => {
    const num = parsearMonto(valor);
    if (num > 0) setter(formatearMontoInput(num));
  };

  // Cuando cambia el método, resetear el monto
  const handleMetodoChange = (setMetodo, setMonto, nuevoMetodo) => {
    setMetodo(nuevoMetodo);
    setMonto('');
  };

  const handleGuardar = async () => {
    if (!clienteSeleccionado) { alert('Debes seleccionar un cliente'); return; }
    if (!vendedor) { alert('Debes seleccionar un vendedor'); return; }
    if (items.some(i => parsearMonto(i.precio_unitario) <= 0)) {
      alert('Todos los precios deben ser mayores a 0');
      return;
    }
    if (Math.abs(sumaPagosUSD - totalVenta) > 0.01) {
      alert(`La suma de pagos (U$ ${sumaPagosUSD.toFixed(2)}) no coincide con el total (U$ ${totalVenta.toFixed(2)})`);
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
        monto_pago_1: aUSD(montoPago1, metodoPago1),
        metodo_pago_2: metodoPago2 || null,
        monto_pago_2: metodoPago2 ? aUSD(montoPago2, metodoPago2) : 0,
        metodo_pago_3: metodoPago3 || null,
        monto_pago_3: metodoPago3 ? aUSD(montoPago3, metodoPago3) : 0,
        sena_metodo: metodoPagoSena || null,
        sena_monto: metodoPagoSena ? aUSD(montoPagoSena, metodoPagoSena) : 0,
        sena_monto_ars: metodoPagoSena && esMetodoEnPesos(metodoPagoSena) ? parsearMonto(montoPagoSena) : null,
        sena_caja: transaccion.sena_caja || null,
        vuelto_metodo: metodoPagoVuelto || null,
        vuelto_monto: metodoPagoVuelto ? aUSD(montoPagoVuelto, metodoPagoVuelto) : 0,
        vuelto_monto_ars: metodoPagoVuelto && esMetodoEnPesos(metodoPagoVuelto) ? parsearMonto(montoPagoVuelto) : null,
        vuelto_caja: transaccion.vuelto_caja || null,
        cotizacion_dolar: cotizacion,
        observaciones,
        items: items.map(i => ({
          id: i.id,
          precio_unitario: parsearMonto(i.precio_unitario)
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

  const renderFilaPago = (num, metodo, setMetodo, monto, setMonto) => {
    const enPesos = esMetodoEnPesos(metodo);
    const monedaLabel = enPesos ? 'ARS' : 'USD';
    const esOpcional = num > 1;

    return (
      <div key={num} className="grid grid-cols-2 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Método {num}{!esOpcional ? ' *' : ''}
          </label>
          <MetodoPagoSelector
            value={metodo}
            onChange={(e) => handleMetodoChange(setMetodo, setMonto, e.target.value)}
            exclude={['cliente_abona']}
            showEmpty={esOpcional}
            emptyLabel={`Sin método ${num}`}
            className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Monto ({monedaLabel}){!esOpcional ? ' *' : ''}
            {enPesos && cotizacion > 0 && parsearMonto(monto) > 0 && (
              <span className="text-xs text-slate-500 ml-2">
                = U$ {(parsearMonto(monto) / cotizacion).toFixed(2)}
              </span>
            )}
          </label>
          <input
            type="text"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            onBlur={(e) => handleMontoBlur(setMonto, e.target.value)}
            disabled={esOpcional && !metodo}
            className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
            placeholder={enPesos ? '0' : '0'}
          />
        </div>
      </div>
    );
  };

  const renderFilaSenaVuelto = (label, metodo, setMetodo, monto, setMonto) => {
    const enPesos = esMetodoEnPesos(metodo);
    const monedaLabel = metodo ? (enPesos ? 'ARS' : 'USD') : '';

    return (
      <div className="grid grid-cols-2 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
          <MetodoPagoSelector
            value={metodo}
            onChange={(e) => handleMetodoChange(setMetodo, setMonto, e.target.value)}
            exclude={['cliente_abona']}
            showEmpty={true}
            emptyLabel={`Sin ${label.toLowerCase()}`}
            className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Monto{monedaLabel ? ` (${monedaLabel})` : ''}
            {enPesos && cotizacion > 0 && parsearMonto(monto) > 0 && (
              <span className="text-xs text-slate-500 ml-2">
                = U$ {(parsearMonto(monto) / cotizacion).toFixed(2)}
              </span>
            )}
          </label>
          <input
            type="text"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            onBlur={(e) => handleMontoBlur(setMonto, e.target.value)}
            disabled={!metodo}
            className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
            placeholder="0"
          />
        </div>
      </div>
    );
  };

  const diferencia = Math.abs(sumaPagosUSD - totalVenta);

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-slate-800 p-6 text-white flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-xl font-semibold">EDITAR TRANSACCIÓN {transaccion.numero_transaccion}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Cliente */}
          <div className="border border-slate-200 rounded p-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">CLIENTE</h3>
            <ClienteSelector
              selectedCliente={clienteSeleccionado}
              onSelectCliente={setClienteSeleccionado}
              required={true}
            />
          </div>

          {/* Productos */}
          <div className="border border-slate-200 rounded p-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">PRODUCTOS</h3>
            <div className="overflow-x-auto mb-4">
              <table className="w-full">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase">Producto</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase">Cant</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase">Precio Unit (USD)</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase">Subtotal</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase">Eliminar</th>
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
                      <td className="px-4 py-3 text-center text-sm text-slate-800">{item.cantidad}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="text"
                          value={item.precio_unitario}
                          onChange={(e) => handlePrecioChange(item.id, e.target.value)}
                          onBlur={(e) => handlePrecioBlur(item.id, e.target.value)}
                          className="w-28 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 text-center"
                        />
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-slate-800">
                        {formatearMonto(parsearMonto(item.precio_unitario) * item.cantidad, 'USD')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleEliminarItem(item.id)}
                          disabled={items.length <= 1}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Eliminar producto de la venta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totales */}
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

          {/* Métodos de Pago */}
          <div className="border border-slate-200 rounded p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">MÉTODOS DE PAGO</h3>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600">Cotización U$:</label>
                <input
                  type="text"
                  value={cotizacion}
                  onChange={(e) => setCotizacion(parseFloat(e.target.value) || 0)}
                  className="w-24 border border-slate-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-emerald-500 text-center"
                />
              </div>
            </div>

            <div className="space-y-4">
              {renderFilaPago(1, metodoPago1, setMetodoPago1, montoPago1, setMontoPago1)}
              {renderFilaPago(2, metodoPago2, setMetodoPago2, montoPago2, setMontoPago2)}
              {renderFilaPago(3, metodoPago3, setMetodoPago3, montoPago3, setMontoPago3)}
              <div className="border-t border-slate-200 pt-4 space-y-4">
                {renderFilaSenaVuelto('Seña', metodoPagoSena, setMetodoPagoSena, montoPagoSena, setMontoPagoSena)}
                {renderFilaSenaVuelto('Vuelto', metodoPagoVuelto, setMetodoPagoVuelto, montoPagoVuelto, setMontoPagoVuelto)}
              </div>
            </div>

            {diferencia > 0.01 && (
              <div className="mt-4 text-sm text-amber-600 bg-amber-50 border border-amber-200 p-2 rounded">
                ⚠️ Suma de pagos (U$ {sumaPagosUSD.toFixed(2)}) ≠ total venta (U$ {totalVenta.toFixed(2)})
              </div>
            )}
          </div>

          {/* Vendedor y Fecha */}
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

          {/* Observaciones */}
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
          {(transaccion.metodo_pago === 'cuenta_corriente' ||
            transaccion.metodo_pago_2 === 'cuenta_corriente' ||
            transaccion.metodo_pago_3 === 'cuenta_corriente') && (
            <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-amber-800 font-semibold mb-1">Advertencia: Cuenta Corriente</h4>
                  <p className="text-amber-700 text-sm">
                    Esta venta tiene un movimiento en Cuenta Corriente. Los cambios NO se reflejarán automáticamente.
                    Deberás actualizar manualmente el movimiento si es necesario.
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
              <><Loader className="w-4 h-4 animate-spin" />Guardando...</>
            ) : (
              <><Save className="w-4 h-4" />Guardar Cambios</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditarVentaModal;
