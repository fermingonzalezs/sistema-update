import React, { useState, useEffect } from 'react';
import { FileText, Plus, Eye, Trash2, User, Calendar, DollarSign, Loader, FileCheck } from 'lucide-react';
import { useRecibos } from '../hooks/useRecibos';
import { generarYDescargarRecibo } from '../pdf/ReciboPDF';
import { generarYDescargarRemito } from '../pdf/RemitoPDF';
import { formatearMonto, formatearFecha, obtenerFechaLocal } from '../../../shared/utils/formatters';
import ClienteSelector from '../../ventas/components/ClienteSelector';
import SelectorProductosStock from './SelectorProductosStock';

const RecibosSection = () => {
  const { recibos, loading, error, crearRecibo, crearRemito, eliminarRecibo, refetch } = useRecibos();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tipoDocumento, setTipoDocumento] = useState('recibo'); // 'recibo' o 'remito'
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [procesando, setProcesando] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    // Campos comunes
    items: [{ descripcion: '', cantidad: 1, precio_unitario: 0, serial: '' }],
    fecha: obtenerFechaLocal(), // Fecha actual por defecto

    // Campos de recibo
    metodo_pago: 'efectivo_pesos',
    moneda: 'USD',
    descuento: 0,

    // Campos de remito
    fecha_entrega: '',
    quien_retira: '',
    observaciones: ''
  });

  // Agregar item al formulario
  const agregarItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { descripcion: '', cantidad: 1, precio_unitario: 0, serial: '' }]
    });
  };

  // Agregar producto del stock
  const agregarProductoDelStock = (productoItem) => {
    setFormData({
      ...formData,
      items: [...formData.items, productoItem]
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

  // Calcular total general (solo para recibos)
  const calcularTotal = () => {
    if (tipoDocumento === 'remito') return 0;
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
      item.descripcion.trim() && item.cantidad > 0
    );

    if (!itemsValidos) {
      alert('Todos los items deben tener descripción y cantidad válidos');
      return false;
    }

    // Validación específica para recibos
    if (tipoDocumento === 'recibo') {
      const preciosValidos = formData.items.every(item => item.precio_unitario > 0);
      if (!preciosValidos) {
        alert('Todos los items de un recibo deben tener precio válido');
        return false;
      }
    }

    return true;
  };

  // Manejar submit del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      setProcesando(true);

      // Preparar items
      const itemsPreparados = formData.items.map(item => ({
        descripcion: item.descripcion.trim(),
        cantidad: parseInt(item.cantidad),
        serial: item.serial?.trim() || null,
        ...(tipoDocumento === 'recibo' && {
          precio_unitario: parseFloat(item.precio_unitario),
          precio_total: calcularPrecioTotalItem(item)
        })
      }));

      // Preparar datos base del documento
      const datosBase = {
        fecha: formData.fecha || obtenerFechaLocal(),
        cliente_id: clienteSeleccionado.id,
        cliente_nombre: `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido || ''}`.trim(),
        cliente_direccion: clienteSeleccionado.direccion || '',
        cliente_telefono: clienteSeleccionado.telefono || '',
        cliente_email: clienteSeleccionado.email || '',
        items: itemsPreparados
      };

      let resultado;

      if (tipoDocumento === 'recibo') {
        // Crear recibo
        const datosRecibo = {
          ...datosBase,
          metodo_pago: formData.metodo_pago,
          moneda: formData.moneda,
          descuento: parseFloat(formData.descuento) || 0,
          total: calcularTotal(),
          observaciones: formData.observaciones.trim() || ''
        };
        resultado = await crearRecibo(datosRecibo);
      } else {
        // Crear remito
        const datosRemito = {
          ...datosBase,
          fecha_entrega: formData.fecha_entrega || null,
          quien_retira: formData.quien_retira.trim() || '',
          observaciones: formData.observaciones.trim() || ''
        };
        resultado = await crearRemito(datosRemito);
      }

      if (resultado.success) {
        alert(`${tipoDocumento === 'recibo' ? 'Recibo' : 'Remito'} creado exitosamente`);
        // Resetear formulario
        setFormData({
          items: [{ descripcion: '', cantidad: 1, precio_unitario: 0, serial: '' }],
          fecha: obtenerFechaLocal(),
          metodo_pago: 'efectivo_pesos',
          moneda: 'USD',
          descuento: 0,
          fecha_entrega: '',
          quien_retira: '',
          observaciones: ''
        });
        setClienteSeleccionado(null);
        setMostrarFormulario(false);
      } else {
        alert(`Error: ${resultado.error}`);
      }
    } catch (err) {
      console.error('Error al crear documento:', err);
      alert('Error al crear documento');
    } finally {
      setProcesando(false);
    }
  };

  // Manejar generación de PDF
  const handleGenerarPDF = async (documento, comoRemito = false) => {
    if (comoRemito || documento.tipo_documento === 'remito') {
      const resultado = await generarYDescargarRemito(documento);
      if (!resultado.success) {
        alert(`Error al generar Remito PDF: ${resultado.error}`);
      }
    } else {
      const resultado = await generarYDescargarRecibo(documento);
      if (!resultado.success) {
        alert(`Error al generar Recibo PDF: ${resultado.error}`);
      }
    }
  };

  // Manejar eliminación de documento
  const handleEliminar = async (documentoId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este documento?')) return;

    const resultado = await eliminarRecibo(documentoId);
    if (resultado.success) {
      alert('Documento eliminado exitosamente');
    } else {
      alert(`Error: ${resultado.error}`);
    }
  };

  // Cambiar tipo de documento resetea ciertos campos
  const cambiarTipoDocumento = (nuevoTipo) => {
    setTipoDocumento(nuevoTipo);
    // Mantener items y observaciones pero resetear campos específicos
    setFormData({
      ...formData,
      // Resetear campos de recibo si cambio a remito
      ...(nuevoTipo === 'remito' && {
        metodo_pago: 'efectivo_pesos',
        moneda: 'USD',
        descuento: 0
      }),
      // Resetear campos de remito si cambio a recibo
      ...(nuevoTipo === 'recibo' && {
        fecha_entrega: '',
        quien_retira: ''
      })
    });
  };

  return (
    <div className="h-full w-full">
      <div className="bg-white rounded border border-slate-200 mb-4">
        {/* Header */}
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <FileText size={28} />
              <div>
                <h2 className="text-2xl font-semibold">Recibos y Remitos</h2>
                <p className="text-slate-300 mt-1">Generador de comprobantes con ingreso manual o desde stock</p>
              </div>
            </div>
            <button
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
              className="bg-emerald-600 text-white px-6 py-3 rounded hover:bg-emerald-700 flex items-center gap-2 font-medium transition-colors"
            >
              <Plus size={18} />
              {mostrarFormulario ? 'Cancelar' : 'Nuevo Documento'}
            </button>
          </div>
        </div>

        {/* Formulario de nuevo documento */}
        {mostrarFormulario && (
          <div className="p-6 border-t border-slate-200">
            {/* Tabs para elegir tipo de documento */}
            <div className="flex gap-2 mb-6 border-b border-slate-200">
              <button
                type="button"
                onClick={() => cambiarTipoDocumento('recibo')}
                className={`px-6 py-3 font-medium transition-colors ${tipoDocumento === 'recibo'
                  ? 'border-b-2 border-emerald-600 text-emerald-600'
                  : 'text-slate-600 hover:text-slate-800'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <DollarSign size={18} />
                  Recibo (con precios)
                </div>
              </button>
              <button
                type="button"
                onClick={() => cambiarTipoDocumento('remito')}
                className={`px-6 py-3 font-medium transition-colors ${tipoDocumento === 'remito'
                  ? 'border-b-2 border-emerald-600 text-emerald-600'
                  : 'text-slate-600 hover:text-slate-800'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <FileCheck size={18} />
                  Remito (sin precios)
                </div>
              </button>
            </div>

            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Crear Nuevo {tipoDocumento === 'recibo' ? 'Recibo' : 'Remito'}
            </h3>

            <form onSubmit={handleSubmit}>
              {/* Cliente y detalles específicos */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Cliente *</label>
                  <ClienteSelector
                    selectedCliente={clienteSeleccionado}
                    onSelectCliente={setClienteSeleccionado}
                    required={true}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Fecha</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {tipoDocumento === 'recibo' && (
                  <>
                    {/* Campos específicos de recibo */}
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

                    <div className="col-span-2 md:col-span-1">
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
                  </>
                )}

                {/* Campo de observaciones común para ambos tipos */}
                <div className="md:col-span-5">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Observaciones</label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    placeholder="Observaciones generales (opcional)"
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                {tipoDocumento === 'remito' && (
                  <>
                    {/* Campos específicos de remito */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de Entrega</label>
                      <input
                        type="date"
                        value={formData.fecha_entrega}
                        onChange={(e) => setFormData({ ...formData, fecha_entrega: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Quién Retira</label>
                      <input
                        type="text"
                        value={formData.quien_retira}
                        onChange={(e) => setFormData({ ...formData, quien_retira: e.target.value })}
                        placeholder="Nombre de quien retira"
                        className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Items */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-md font-semibold text-slate-800">
                    Items del {tipoDocumento === 'recibo' ? 'Recibo' : 'Remito'}
                  </h4>
                  <div className="flex gap-2">
                    <SelectorProductosStock onAgregarProducto={agregarProductoDelStock} />
                    <button
                      type="button"
                      onClick={agregarItem}
                      className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-700 flex items-center gap-2 text-sm"
                    >
                      <Plus size={16} />
                      Agregar Item Manual
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end bg-slate-50 p-3 rounded">
                      <div className={tipoDocumento === 'recibo' ? 'col-span-4' : 'col-span-5'}>
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
                        <label className="block text-xs font-medium text-slate-700 mb-1">Serial</label>
                        <input
                          type="text"
                          value={item.serial}
                          onChange={(e) => actualizarItem(index, 'serial', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                          placeholder="S/N"
                        />
                      </div>

                      <div className="col-span-1">
                        <label className="block text-xs font-medium text-slate-700 mb-1">Cant. *</label>
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => actualizarItem(index, 'cantidad', e.target.value)}
                          min="1"
                          className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                          required
                        />
                      </div>

                      {tipoDocumento === 'recibo' && (
                        <>
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
                        </>
                      )}

                      <div className="col-span-1 flex items-end justify-center">
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
                <div>
                  {tipoDocumento === 'recibo' && (
                    <div className="text-xl font-bold text-slate-800">
                      Total: {formatearMonto(calcularTotal(), formData.moneda)}
                    </div>
                  )}
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
                      `Crear ${tipoDocumento === 'recibo' ? 'Recibo' : 'Remito'}`
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Lista de documentos */}
      <div className="bg-white rounded border border-slate-200 mb-4">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-md font-semibold text-slate-800">
            Historial de Documentos ({recibos.length})
          </h3>
        </div>

        {loading && (
          <div className="p-10 text-center text-slate-600">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
            Cargando documentos...
          </div>
        )}

        {error && (
          <div className="p-10 text-center text-red-600">
            Error: {error}
          </div>
        )}

        {!loading && !error && recibos.length === 0 && (
          <div className="p-10 text-center text-slate-500">
            No hay documentos registrados. Crea uno nuevo para comenzar.
          </div>
        )}

        {!loading && !error && recibos.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">Número</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">Cliente</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase">Items</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase">Ver Como</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recibos.map((documento, index) => (
                  <tr
                    key={documento.id}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                  >
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${documento.tipo_documento === 'recibo'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-blue-100 text-blue-700'
                        }`}>
                        {documento.tipo_documento === 'recibo' ? 'RECIBO' : 'REMITO'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-800">
                      {documento.numero_recibo}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatearFecha(documento.fecha)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-800">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-slate-500" />
                        {documento.cliente_nombre}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-600">
                      {documento.items?.length || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-slate-800">
                      {documento.tipo_documento === 'recibo'
                        ? formatearMonto(documento.total, documento.moneda)
                        : '-'
                      }
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleGenerarPDF(documento, false)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="Ver como Recibo"
                        >
                          <FileText size={18} />
                        </button>
                        <button
                          onClick={() => handleGenerarPDF(documento, true)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Ver como Remito"
                        >
                          <FileCheck size={18} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleEliminar(documento.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
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
