import React, { useState, useEffect } from 'react';
import { FileText, Plus, Eye, Trash2, User, Calendar, DollarSign, Loader, FileCheck, Calculator } from 'lucide-react';
import { useRecibos } from '../hooks/useRecibos';
import { generarYDescargarRecibo } from '../pdf/ReciboPDF';
import { generarYDescargarRemito } from '../pdf/RemitoPDF';
import { generarYDescargarPresupuesto } from '../pdf/PresupuestoPDF';
import { formatearMonto, formatearFecha, obtenerFechaLocal } from '../../../shared/utils/formatters';
import ClienteSelector from '../../ventas/components/ClienteSelector';
import SelectorProductosStock from './SelectorProductosStock';

const RecibosSection = () => {
  const { recibos, loading, error, crearRecibo, crearRemito, crearPresupuesto, eliminarRecibo, refetch } = useRecibos();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tipoDocumento, setTipoDocumento] = useState('recibo'); // 'recibo', 'remito', 'presupuesto'
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

    // Campos de presupuesto
    vigencia_horas: 72,
    condiciones: '',

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

  // Calcular total general (solo para recibos y presupuestos)
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

    // Validación específica para recibos y presupuestos
    if (tipoDocumento === 'recibo' || tipoDocumento === 'presupuesto') {
      const preciosValidos = formData.items.every(item => item.precio_unitario > 0);
      if (!preciosValidos) {
        alert('Todos los items deben tener precio válido');
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
        ...((tipoDocumento === 'recibo' || tipoDocumento === 'presupuesto') && {
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
      } else if (tipoDocumento === 'remito') {
        // Crear remito
        const datosRemito = {
          ...datosBase,
          fecha_entrega: formData.fecha_entrega || null,
          quien_retira: formData.quien_retira.trim() || '',
          observaciones: formData.observaciones.trim() || ''
        };
        resultado = await crearRemito(datosRemito);
      } else if (tipoDocumento === 'presupuesto') {
        // Crear presupuesto
        const datosPresupuesto = {
          ...datosBase,
          moneda: formData.moneda,
          descuento: parseFloat(formData.descuento) || 0,
          total: calcularTotal(),
          vigencia_horas: parseInt(formData.vigencia_horas) || 72,
          condiciones: formData.condiciones.trim() || '',
          observaciones: formData.observaciones.trim() || ''
        };
        resultado = await crearPresupuesto(datosPresupuesto);
      }

      if (resultado.success) {
        let nombreDoc = 'Documento';
        if (tipoDocumento === 'recibo') nombreDoc = 'Recibo';
        if (tipoDocumento === 'remito') nombreDoc = 'Remito';
        if (tipoDocumento === 'presupuesto') nombreDoc = 'Presupuesto';

        alert(`${nombreDoc} creado exitosamente`);
        // Resetear formulario
        setFormData({
          items: [{ descripcion: '', cantidad: 1, precio_unitario: 0, serial: '' }],
          fecha: obtenerFechaLocal(),
          metodo_pago: 'efectivo_pesos',
          moneda: 'USD',
          descuento: 0,
          fecha_entrega: '',
          quien_retira: '',
          vigencia_horas: 72,
          condiciones: '',
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
  const handleGenerarPDF = async (documento, formato = null) => {
    // Si se especifica formato, usarlo, sino usar el tipo del documento
    const tipo = formato || documento.tipo_documento;

    if (tipo === 'remito') {
      const resultado = await generarYDescargarRemito(documento);
      if (!resultado.success) alert(`Error al generar Remito PDF: ${resultado.error}`);
    } else if (tipo === 'presupuesto') {
      const resultado = await generarYDescargarPresupuesto(documento);
      if (!resultado.success) alert(`Error al generar Presupuesto PDF: ${resultado.error}`);
    } else {
      const resultado = await generarYDescargarRecibo(documento);
      if (!resultado.success) alert(`Error al generar Recibo PDF: ${resultado.error}`);
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
      // Default vigencia
      vigencia_horas: 72,
      // Defaults comunes
      ...(nuevoTipo !== 'remito' ? {
        moneda: 'USD',
        descuento: 0
      } : {
        moneda: 'USD',
        descuento: 0
      }),
      // Limpiar específicos al cambiar
      condiciones: '',
      fecha_entrega: '',
      quien_retira: ''
    });
  };

  const getBadgeColor = (tipo) => {
    switch (tipo) {
      case 'recibo': return 'bg-emerald-100 text-emerald-700';
      case 'remito': return 'bg-blue-100 text-blue-700';
      case 'presupuesto': return 'bg-orange-100 text-orange-700';
      default: return 'bg-slate-100 text-slate-700';
    }
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
                <h2 className="text-2xl font-semibold">Recibos, Remitos y Presupuestos</h2>
                <p className="text-slate-300 mt-1">Generación de comprobantes y cotizaciones</p>
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
                  Recibo
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
                  Remito
                </div>
              </button>
              <button
                type="button"
                onClick={() => cambiarTipoDocumento('presupuesto')}
                className={`px-6 py-3 font-medium transition-colors ${tipoDocumento === 'presupuesto'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-slate-600 hover:text-slate-800'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Calculator size={18} />
                  Presupuesto
                </div>
              </button>
            </div>

            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Crear Nuevo/a {tipoDocumento === 'recibo' ? 'Recibo' : tipoDocumento === 'remito' ? 'Remito' : 'Presupuesto'}
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

                {/* Campos de Recibo */}
                {tipoDocumento === 'recibo' && (
                  <>
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

                {/* Campos de Presupuesto */}
                {tipoDocumento === 'presupuesto' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Vigencia (Horas)</label>
                      <input
                        type="number"
                        value={formData.vigencia_horas}
                        onChange={(e) => setFormData({ ...formData, vigencia_horas: e.target.value })}
                        min="1"
                        className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
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

                {/* Campos de Remito */}
                {tipoDocumento === 'remito' && (
                  <>
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

                {/* Campo de observaciones común para todos */}
                <div className="md:col-span-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={tipoDocumento === 'presupuesto' ? '' : 'md:col-span-2'}>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Observaciones</label>
                    <textarea
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      placeholder="Observaciones generales (opcional)"
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>

                  {tipoDocumento === 'presupuesto' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Condiciones / Aclaraciones</label>
                      <textarea
                        value={formData.condiciones}
                        onChange={(e) => setFormData({ ...formData, condiciones: e.target.value })}
                        placeholder="Ej: Precios sujetos a modificación..."
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-md font-semibold text-slate-800">
                    Items del {tipoDocumento === 'recibo' ? 'Recibo' : tipoDocumento === 'remito' ? 'Remito' : 'Presupuesto'}
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
                      <div className={
                        tipoDocumento === 'presupuesto' ? 'col-span-7' :
                          tipoDocumento === 'remito' ? 'col-span-5' :
                            'col-span-4'
                      }>
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

                      {tipoDocumento !== 'presupuesto' && (
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
                      )}

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

                      {tipoDocumento !== 'remito' && (
                        <>
                          <div className={tipoDocumento === 'presupuesto' ? 'col-span-2' : 'col-span-2'}>
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

                          <div className={tipoDocumento === 'presupuesto' ? 'col-span-1' : 'col-span-2'}>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Total</label>
                            <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded text-sm font-semibold text-slate-800 truncate">
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
                  {tipoDocumento !== 'remito' && (
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
                      `Crear ${tipoDocumento === 'recibo' ? 'Recibo' : tipoDocumento === 'remito' ? 'Remito' : 'Presupuesto'}`
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
                      <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${getBadgeColor(documento.tipo_documento)}`}>
                        {documento.tipo_documento}
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
                      {documento.tipo_documento !== 'remito'
                        ? formatearMonto(documento.total, documento.moneda)
                        : '-'
                      }
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {documento.tipo_documento === 'recibo' && (
                          <button
                            onClick={() => handleGenerarPDF(documento)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                            title="Ver Recibo"
                          >
                            <FileText size={18} />
                          </button>
                        )}

                        {documento.tipo_documento === 'presupuesto' && (
                          <button
                            onClick={() => handleGenerarPDF(documento)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                            title="Ver Presupuesto"
                          >
                            <Calculator size={18} />
                          </button>
                        )}

                        {documento.tipo_documento === 'remito' && (
                          <button
                            onClick={() => handleGenerarPDF(documento)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Ver Remito"
                          >
                            <FileCheck size={18} />
                          </button>
                        )}

                        {/* Funcionalidad extra: Ver recibo como remito (útil para envíos) */}
                        {documento.tipo_documento === 'recibo' && (
                          <button
                            onClick={() => handleGenerarPDF(documento, 'remito')}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Generar Remito de este Recibo"
                          >
                            <FileCheck size={18} />
                          </button>
                        )}
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
