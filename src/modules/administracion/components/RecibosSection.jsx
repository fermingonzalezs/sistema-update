import React, { useState, useEffect } from 'react';
import { FileText, Plus, Eye, Trash2, User, Calendar, DollarSign, Loader } from 'lucide-react';
import { useRecibos } from '../hooks/useRecibos';
import { generarYDescargarRecibo } from '../pdf/ReciboPDF';
import { formatearMonto, formatearFecha } from '../../../shared/utils/formatters';
import ClienteSelector from '../../ventas/components/ClienteSelector';

const RecibosSection = () => {
  const { recibos, loading, error, crearRecibo, eliminarRecibo, refetch } = useRecibos();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [procesando, setProcesando] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    metodo_pago: 'efectivo_pesos',
    moneda: 'USD',
    descuento: 0,
    items: [{ descripcion: '', cantidad: 1, precio_unitario: 0 }]
  });

  // Agregar item al formulario
  const agregarItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { descripcion: '', cantidad: 1, precio_unitario: 0 }]
    });
  };

  // Remover item del formulario
  const removerItem = (index) => {
    const nuevosItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: nuevosItems });
  };

  // Actualizar item
  const actualizarItem = (index, campo, valor) => {
    const nuevosItems = [...formData.items];
    nuevosItems[index] = {
      ...nuevosItems[index],
      [campo]: valor
    };
    setFormData({ ...formData, items: nuevosItems });
  };

  // Calcular precio total de un item
  const calcularPrecioTotalItem = (item) => {
    return (item.cantidad || 0) * (item.precio_unitario || 0);
  };

  // Calcular total general
  const calcularTotal = () => {
    const subtotal = formData.items.reduce((sum, item) =>
      sum + calcularPrecioTotalItem(item), 0
    );
    return subtotal - (formData.descuento || 0);
  };

  // Validar formulario
  const validarFormulario = () => {
    if (!clienteSeleccionado) {
      alert('Por favor selecciona un cliente');
      return false;
    }

    if (formData.items.length === 0) {
      alert('Debes agregar al menos un item');
      return false;
    }

    const itemsValidos = formData.items.every(item =>
      item.descripcion.trim() && item.cantidad > 0 && item.precio_unitario > 0
    );

    if (!itemsValidos) {
      alert('Todos los items deben tener descripción, cantidad y precio válidos');
      return false;
    }

    return true;
  };

  // Manejar submit del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      setProcesando(true);

      // Preparar items con precio total calculado
      const itemsConTotal = formData.items.map(item => ({
        descripcion: item.descripcion.trim(),
        cantidad: parseInt(item.cantidad),
        precio_unitario: parseFloat(item.precio_unitario),
        precio_total: calcularPrecioTotalItem(item)
      }));

      // Preparar datos del recibo
      const datosRecibo = {
        cliente_id: clienteSeleccionado.id,
        cliente_nombre: `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido || ''}`.trim(),
        cliente_direccion: '', // La tabla clientes no tiene columna direccion
        cliente_telefono: clienteSeleccionado.telefono || '',
        cliente_email: clienteSeleccionado.email || '',
        metodo_pago: formData.metodo_pago,
        moneda: formData.moneda,
        descuento: parseFloat(formData.descuento) || 0,
        total: calcularTotal(),
        items: itemsConTotal
      };

      // Crear recibo
      const resultado = await crearRecibo(datosRecibo);

      if (resultado.success) {
        alert('Recibo creado exitosamente');
        // Resetear formulario
        setFormData({
          metodo_pago: 'efectivo_pesos',
          moneda: 'USD',
          descuento: 0,
          items: [{ descripcion: '', cantidad: 1, precio_unitario: 0 }]
        });
        setClienteSeleccionado(null);
        setMostrarFormulario(false);
      } else {
        alert(`Error: ${resultado.error}`);
      }
    } catch (err) {
      console.error('Error al crear recibo:', err);
      alert('Error al crear recibo');
    } finally {
      setProcesando(false);
    }
  };

  // Manejar generación de PDF
  const handleGenerarPDF = async (recibo) => {
    const resultado = await generarYDescargarRecibo(recibo);
    if (!resultado.success) {
      alert(`Error al generar PDF: ${resultado.error}`);
    }
  };

  // Manejar eliminación de recibo
  const handleEliminar = async (reciboId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este recibo?')) return;

    const resultado = await eliminarRecibo(reciboId);
    if (resultado.success) {
      alert('Recibo eliminado exitosamente');
    } else {
      alert(`Error: ${resultado.error}`);
    }
  };

  return (
    <div className="bg-slate-50 h-full w-full p-6">
      {/* Header */}
      <div className="bg-white rounded border border-slate-200 mb-6">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <FileText size={28} />
              <div>
                <h2 className="text-2xl font-semibold">Recibos</h2>
                <p className="text-slate-300 mt-1">Generador de recibos con ingreso manual de productos</p>
              </div>
            </div>
            <button
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
              className="bg-emerald-600 text-white px-6 py-3 rounded hover:bg-emerald-700 flex items-center gap-2 font-medium transition-colors"
            >
              <Plus size={18} />
              {mostrarFormulario ? 'Cancelar' : 'Nuevo Recibo'}
            </button>
          </div>
        </div>
      </div>

      {/* Formulario de nuevo recibo */}
      {mostrarFormulario && (
        <div className="bg-white rounded border border-slate-200 mb-6 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Crear Nuevo Recibo</h3>

          <form onSubmit={handleSubmit}>
            {/* Cliente y detalles de pago */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cliente *</label>
                <ClienteSelector
                  selectedCliente={clienteSeleccionado}
                  onSelectCliente={setClienteSeleccionado}
                  required={true}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Método de Pago</label>
                <select
                  value={formData.metodo_pago}
                  onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="efectivo_pesos">💵 Efectivo en Pesos</option>
                  <option value="dolares_billete">💸 Dólares Billete</option>
                  <option value="transferencia">🏦 Transferencia</option>
                  <option value="criptomonedas">₿ Criptomonedas</option>
                  <option value="tarjeta_credito">💳 Tarjeta de Crédito</option>
                  <option value="cuenta_corriente">🏷️ Cuenta Corriente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Moneda</label>
                <select
                  value={formData.moneda}
                  onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="USD">USD</option>
                  <option value="ARS">ARS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Descuento</label>
                <input
                  type="number"
                  value={formData.descuento}
                  onChange={(e) => setFormData({ ...formData, descuento: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Items */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-semibold text-slate-800">Items del Recibo</h4>
                <button
                  type="button"
                  onClick={agregarItem}
                  className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-700 flex items-center gap-2 text-sm"
                >
                  <Plus size={16} />
                  Agregar Item
                </button>
              </div>

              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end bg-slate-50 p-3 rounded">
                    <div className="col-span-5">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Descripción *</label>
                      <input
                        type="text"
                        value={item.descripcion}
                        onChange={(e) => actualizarItem(index, 'descripcion', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        placeholder="Descripción del item"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Cantidad *</label>
                      <input
                        type="number"
                        value={item.cantidad}
                        onChange={(e) => actualizarItem(index, 'cantidad', e.target.value)}
                        min="1"
                        className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Precio Unit. *</label>
                      <input
                        type="number"
                        value={item.precio_unitario}
                        onChange={(e) => actualizarItem(index, 'precio_unitario', e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Total</label>
                      <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded text-sm font-semibold text-slate-800">
                        {formatearMonto(calcularPrecioTotalItem(item), formData.moneda)}
                      </div>
                    </div>

                    <div className="col-span-1 flex items-end">
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removerItem(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar item"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total y botones */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <div className="text-xl font-bold text-slate-800">
                Total: {formatearMonto(calcularTotal(), formData.moneda)}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  className="px-6 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando}
                  className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {procesando ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Crear Recibo'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Lista de recibos */}
      <div className="bg-white rounded border border-slate-200">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-md font-semibold text-slate-800">
            Historial de Recibos ({recibos.length})
          </h3>
        </div>

        {loading && (
          <div className="p-10 text-center text-slate-600">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
            Cargando recibos...
          </div>
        )}

        {error && (
          <div className="p-10 text-center text-red-600">
            Error: {error}
          </div>
        )}

        {!loading && !error && recibos.length === 0 && (
          <div className="p-10 text-center text-slate-500">
            No hay recibos registrados. Crea uno nuevo para comenzar.
          </div>
        )}

        {!loading && !error && recibos.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">Número</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">Cliente</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase">Items</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recibos.map((recibo, index) => (
                  <tr
                    key={recibo.id}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                  >
                    <td className="px-4 py-3 text-sm font-mono text-slate-800">
                      {recibo.numero_recibo}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatearFecha(recibo.fecha)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-800">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-slate-500" />
                        {recibo.cliente_nombre}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-600">
                      {recibo.items?.length || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-slate-800">
                      {formatearMonto(recibo.total, recibo.moneda)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleGenerarPDF(recibo)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="Ver PDF"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEliminar(recibo.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecibosSection;
