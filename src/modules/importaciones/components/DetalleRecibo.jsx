import React, { useState, useEffect } from 'react';
import { X, Edit2, Save, XCircle, Plus, Trash2, AlertCircle, ExternalLink } from 'lucide-react';
import { ESTADOS_IMPORTACION, LABELS_ESTADOS, COLORES_ESTADOS } from '../constants/estadosImportacion';

const METODOS_PAGO = [
  { value: 'efectivo_pesos', label: '💵 Efectivo en Pesos' },
  { value: 'dolares_billete', label: '💸 Dólares Billete' },
  { value: 'transferencia', label: '🏦 Transferencia' },
  { value: 'criptomonedas', label: '₿ Criptomonedas' },
  { value: 'tarjeta_credito', label: '💳 Tarjeta de Crédito' },
  { value: 'cuenta_corriente', label: '🏷️ Cuenta Corriente' },
  { value: 'cliente_abona', label: '👤 Cliente Abona' }
];

const DetalleRecibo = ({
  recibo,
  onClose,
  proveedores = [],
  clientes = [],
  onActualizarRecibo,
  onActualizarItem,
  onEliminarItem,
  onAgregarItems,
  onRecalcularCostos,
  onRefresh
}) => {
  // Estados de edición
  const [modoEdicion, setModoEdicion] = useState(false);
  const [datosEditados, setDatosEditados] = useState({});
  const [itemsEditados, setItemsEditados] = useState([]);
  const [itemsNuevos, setItemsNuevos] = useState([]);
  const [itemsEliminados, setItemsEliminados] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState({});

  // Inicializar datos cuando cambia el recibo o se activa edición
  useEffect(() => {
    if (recibo) {
      setDatosEditados({
        proveedor_id: recibo.proveedor_id,
        cliente_id: recibo.cliente_id || '',
        fecha_compra: recibo.fecha_compra,
        metodo_pago: recibo.metodo_pago,
        tracking_number: recibo.tracking_number || '',
        empresa_logistica: recibo.empresa_logistica || '',
        fecha_estimada_ingreso: recibo.fecha_estimada_ingreso || '',
        observaciones: recibo.observaciones || '',
        // Campos de recepción (solo si está recepcionado)
        peso_total_con_caja_kg: recibo.peso_total_con_caja_kg || '',
        peso_sin_caja_kg: recibo.peso_sin_caja_kg || '',
        precio_por_kg_usd: recibo.precio_por_kg_usd || '',
        pago_courier_usd: recibo.pago_courier_usd || '',
        costo_picking_shipping_usd: recibo.costo_picking_shipping_usd || ''
      });
      setItemsEditados((recibo.importaciones_items || []).map(item => ({ ...item })));
      setItemsNuevos([]);
      setItemsEliminados([]);
      setErrores({});
    }
  }, [recibo]);

  const formatNumber = (num) => {
    if (num === null || num === undefined || num === '') return '-';
    return Math.round(parseFloat(num)).toLocaleString('es-AR');
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-AR');
  };

  const getMetodoPagoLabel = (metodo) => {
    const m = METODOS_PAGO.find(mp => mp.value === metodo);
    return m ? m.label : metodo;
  };

  const getEstadoColor = (estado) => {
    return COLORES_ESTADOS[estado] || 'text-slate-800 bg-slate-100';
  };

  const getEstadoLabel = (estado) => {
    return LABELS_ESTADOS[estado] || estado;
  };

  // Handlers para edición de datos generales
  const handleDatoChange = (campo, valor) => {
    setDatosEditados(prev => ({ ...prev, [campo]: valor }));
    // Limpiar error del campo si existe
    if (errores[campo]) {
      setErrores(prev => {
        const newErrors = { ...prev };
        delete newErrors[campo];
        return newErrors;
      });
    }
  };

  // Handlers para edición de items
  const handleItemChange = (itemId, campo, valor) => {
    setItemsEditados(prev => prev.map(item =>
      item.id === itemId ? { ...item, [campo]: valor } : item
    ));
  };

  // Agregar item nuevo
  const agregarItemNuevo = () => {
    const nuevoItem = {
      tempId: Date.now(),
      item: '',
      cantidad: 1,
      precio_unitario_usd: 0,
      peso_estimado_unitario_kg: 0
    };
    setItemsNuevos(prev => [...prev, nuevoItem]);
  };

  // Actualizar item nuevo
  const handleItemNuevoChange = (tempId, campo, valor) => {
    setItemsNuevos(prev => prev.map(item =>
      item.tempId === tempId ? { ...item, [campo]: valor } : item
    ));
  };

  // Eliminar item nuevo (antes de guardar)
  const eliminarItemNuevo = (tempId) => {
    setItemsNuevos(prev => prev.filter(item => item.tempId !== tempId));
  };

  // Marcar item existente para eliminar
  const marcarItemParaEliminar = (itemId) => {
    if (itemsEditados.length + itemsNuevos.length - itemsEliminados.length <= 1) {
      alert('Debe haber al menos un item en el recibo');
      return;
    }
    if (window.confirm('¿Eliminar este item?')) {
      setItemsEliminados(prev => [...prev, itemId]);
    }
  };

  // Restaurar item marcado para eliminar
  const restaurarItem = (itemId) => {
    setItemsEliminados(prev => prev.filter(id => id !== itemId));
  };

  // Validar antes de guardar
  const validar = () => {
    const nuevosErrores = {};

    if (!datosEditados.proveedor_id) {
      nuevosErrores.proveedor_id = 'Proveedor es requerido';
    }
    if (!datosEditados.fecha_compra) {
      nuevosErrores.fecha_compra = 'Fecha de compra es requerida';
    }
    if (!datosEditados.metodo_pago) {
      nuevosErrores.metodo_pago = 'Método de pago es requerido';
    }

    // Validar que haya al menos un item
    const totalItems = itemsEditados.filter(i => !itemsEliminados.includes(i.id)).length + itemsNuevos.length;
    if (totalItems === 0) {
      nuevosErrores.items = 'Debe haber al menos un item';
    }

    // Validar items existentes
    itemsEditados.forEach((item, idx) => {
      if (!itemsEliminados.includes(item.id)) {
        if (!item.item?.trim()) {
          nuevosErrores[`item_${item.id}_nombre`] = 'Nombre requerido';
        }
        if (!item.cantidad || parseInt(item.cantidad) <= 0) {
          nuevosErrores[`item_${item.id}_cantidad`] = 'Cantidad debe ser mayor a 0';
        }
        if (item.precio_unitario_usd === undefined || parseFloat(item.precio_unitario_usd) < 0) {
          nuevosErrores[`item_${item.id}_precio`] = 'Precio debe ser >= 0';
        }
      }
    });

    // Validar items nuevos
    itemsNuevos.forEach((item, idx) => {
      if (!item.item?.trim()) {
        nuevosErrores[`nuevo_${item.tempId}_nombre`] = 'Nombre requerido';
      }
      if (!item.cantidad || parseInt(item.cantidad) <= 0) {
        nuevosErrores[`nuevo_${item.tempId}_cantidad`] = 'Cantidad debe ser mayor a 0';
      }
      if (item.precio_unitario_usd === undefined || parseFloat(item.precio_unitario_usd) < 0) {
        nuevosErrores[`nuevo_${item.tempId}_precio`] = 'Precio debe ser >= 0';
      }
    });

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Guardar cambios
  const guardarCambios = async () => {
    if (!validar()) {
      return;
    }

    setGuardando(true);

    try {
      // 1. Actualizar datos del recibo
      const datosParaActualizar = {
        proveedor_id: datosEditados.proveedor_id,
        cliente_id: datosEditados.cliente_id || null,
        fecha_compra: datosEditados.fecha_compra,
        metodo_pago: datosEditados.metodo_pago,
        tracking_number: datosEditados.tracking_number?.trim() || null,
        empresa_logistica: datosEditados.empresa_logistica?.trim() || null,
        fecha_estimada_ingreso: datosEditados.fecha_estimada_ingreso || null,
        observaciones: datosEditados.observaciones?.trim() || null
      };

      // Si está recepcionado, incluir datos de recepción
      if (recibo.estado === ESTADOS_IMPORTACION.RECEPCIONADO) {
        datosParaActualizar.peso_total_con_caja_kg = parseFloat(datosEditados.peso_total_con_caja_kg) || 0;
        datosParaActualizar.peso_sin_caja_kg = parseFloat(datosEditados.peso_sin_caja_kg) || 0;
        datosParaActualizar.precio_por_kg_usd = parseFloat(datosEditados.precio_por_kg_usd) || 0;
        datosParaActualizar.pago_courier_usd = parseFloat(datosEditados.pago_courier_usd) || 0;
        datosParaActualizar.costo_picking_shipping_usd = parseFloat(datosEditados.costo_picking_shipping_usd) || 0;
        datosParaActualizar.costo_total_importacion_usd =
          (parseFloat(datosEditados.pago_courier_usd) || 0) +
          (parseFloat(datosEditados.costo_picking_shipping_usd) || 0);
      }

      await onActualizarRecibo(recibo.id, datosParaActualizar);

      // 2. Actualizar items modificados
      for (const item of itemsEditados) {
        if (!itemsEliminados.includes(item.id)) {
          const itemOriginal = recibo.importaciones_items.find(i => i.id === item.id);
          const cambios = {};

          if (item.item !== itemOriginal.item) cambios.item = item.item.trim();
          if (parseInt(item.cantidad) !== itemOriginal.cantidad) cambios.cantidad = parseInt(item.cantidad);
          if (parseFloat(item.precio_unitario_usd) !== itemOriginal.precio_unitario_usd) {
            cambios.precio_unitario_usd = parseFloat(item.precio_unitario_usd);
          }
          if (parseFloat(item.peso_estimado_unitario_kg || 0) !== (itemOriginal.peso_estimado_unitario_kg || 0)) {
            cambios.peso_estimado_unitario_kg = parseFloat(item.peso_estimado_unitario_kg || 0);
          }

          // Si está recepcionado, también actualizar peso real
          if (recibo.estado === ESTADOS_IMPORTACION.RECEPCIONADO) {
            if (parseFloat(item.peso_real_unitario_kg || 0) !== (itemOriginal.peso_real_unitario_kg || 0)) {
              cambios.peso_real_unitario_kg = parseFloat(item.peso_real_unitario_kg || 0);
            }
          }

          if (Object.keys(cambios).length > 0) {
            await onActualizarItem(item.id, cambios);
          }
        }
      }

      // 3. Eliminar items marcados
      for (const itemId of itemsEliminados) {
        await onEliminarItem(itemId);
      }

      // 4. Insertar items nuevos
      if (itemsNuevos.length > 0) {
        await onAgregarItems(recibo.id, itemsNuevos);
      }

      // 5. Si está recepcionado y cambió peso/costos, recalcular
      if (recibo.estado === ESTADOS_IMPORTACION.RECEPCIONADO) {
        const costosCambiaron =
          parseFloat(datosEditados.pago_courier_usd) !== (recibo.pago_courier_usd || 0) ||
          parseFloat(datosEditados.costo_picking_shipping_usd) !== (recibo.costo_picking_shipping_usd || 0) ||
          itemsNuevos.length > 0 ||
          itemsEliminados.length > 0 ||
          itemsEditados.some(item => {
            const original = recibo.importaciones_items.find(i => i.id === item.id);
            return original &&
              (parseInt(item.cantidad) !== original.cantidad ||
                parseFloat(item.peso_real_unitario_kg || 0) !== (original.peso_real_unitario_kg || 0));
          });

        if (costosCambiaron) {
          await onRecalcularCostos(recibo.id);
        }
      }

      // 6. Refrescar y salir del modo edición
      if (onRefresh) {
        await onRefresh();
      }
      setModoEdicion(false);
      alert('✅ Cambios guardados correctamente');

    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  // Cancelar edición
  const cancelarEdicion = () => {
    if (window.confirm('¿Descartar los cambios?')) {
      setModoEdicion(false);
      // Reset to original values
      setDatosEditados({
        proveedor_id: recibo.proveedor_id,
        cliente_id: recibo.cliente_id || '',
        fecha_compra: recibo.fecha_compra,
        metodo_pago: recibo.metodo_pago,
        tracking_number: recibo.tracking_number || '',
        empresa_logistica: recibo.empresa_logistica || '',
        fecha_estimada_ingreso: recibo.fecha_estimada_ingreso || '',
        observaciones: recibo.observaciones || '',
        peso_total_con_caja_kg: recibo.peso_total_con_caja_kg || '',
        peso_sin_caja_kg: recibo.peso_sin_caja_kg || '',
        precio_por_kg_usd: recibo.precio_por_kg_usd || '',
        pago_courier_usd: recibo.pago_courier_usd || '',
        costo_picking_shipping_usd: recibo.costo_picking_shipping_usd || ''
      });
      setItemsEditados((recibo.importaciones_items || []).map(item => ({ ...item })));
      setItemsNuevos([]);
      setItemsEliminados([]);
      setErrores({});
    }
  };

  const totalProductos = (recibo.importaciones_items || []).reduce((sum, item) => sum + (item.precio_total_usd || 0), 0);
  const totalCostos = (recibo.costo_total_importacion_usd || 0);
  const totalGeneral = totalProductos + totalCostos;

  // Calcular totales para edición
  const itemsVisibles = itemsEditados.filter(i => !itemsEliminados.includes(i.id));
  const totalProductosEdicion = [...itemsVisibles, ...itemsNuevos].reduce((sum, item) => {
    return sum + (parseFloat(item.precio_unitario_usd) || 0) * (parseInt(item.cantidad) || 0);
  }, 0);

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded border border-slate-200 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="p-6 bg-slate-800 text-white flex justify-between items-center sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-semibold">
              {modoEdicion ? 'Editar Importación' : 'Detalle de Importación'}
            </h3>
            <p className="text-slate-300 text-sm mt-1">{recibo.numero_recibo}</p>
          </div>
          <div className="flex items-center gap-3">
            {!modoEdicion ? (
              <button
                onClick={() => setModoEdicion(true)}
                className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 flex items-center gap-2 font-medium transition-colors"
              >
                <Edit2 size={16} />
                Editar
              </button>
            ) : (
              <>
                <button
                  onClick={cancelarEdicion}
                  disabled={guardando}
                  className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-700 flex items-center gap-2 font-medium transition-colors disabled:opacity-50"
                >
                  <XCircle size={16} />
                  Cancelar
                </button>
                <button
                  onClick={guardarCambios}
                  disabled={guardando}
                  className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 flex items-center gap-2 font-medium transition-colors disabled:opacity-50"
                >
                  {guardando ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Guardar
                    </>
                  )}
                </button>
              </>
            )}
            <button onClick={onClose} className="text-slate-300 hover:text-white">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* ERRORES GLOBALES */}
          {errores.items && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex items-center text-red-700">
                <AlertCircle size={18} className="mr-2" />
                {errores.items}
              </div>
            </div>
          )}

          {/* INFORMACIÓN GENERAL */}
          <div className="space-y-3">
            <div className="bg-slate-200 p-4 rounded-t border border-slate-300">
              <h4 className="font-semibold text-slate-800 uppercase">Información General</h4>
            </div>
            <div className="border border-slate-300 border-t-0 rounded-b p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {/* Número de Recibo (no editable) */}
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Recibo</label>
                  <p className="font-medium text-slate-800 mt-1">{recibo.numero_recibo}</p>
                </div>

                {/* Proveedor */}
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Proveedor</label>
                  {modoEdicion ? (
                    <select
                      value={datosEditados.proveedor_id || ''}
                      onChange={(e) => handleDatoChange('proveedor_id', e.target.value)}
                      className={`w-full border rounded px-2 py-1 text-sm mt-1 ${errores.proveedor_id ? 'border-red-500' : 'border-slate-200'}`}
                    >
                      <option value="">Seleccionar...</option>
                      {proveedores.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="font-medium text-slate-800 mt-1">{recibo.proveedores?.nombre || '-'}</p>
                  )}
                </div>

                {/* Estado (no editable) */}
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Estado</label>
                  <span className={`px-3 py-1 rounded text-xs font-semibold ${getEstadoColor(recibo.estado)} inline-block mt-1`}>
                    {getEstadoLabel(recibo.estado)}
                  </span>
                </div>

                {/* Fecha Compra */}
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Fecha Compra</label>
                  {modoEdicion ? (
                    <input
                      type="date"
                      value={datosEditados.fecha_compra || ''}
                      onChange={(e) => handleDatoChange('fecha_compra', e.target.value)}
                      className={`w-full border rounded px-2 py-1 text-sm mt-1 ${errores.fecha_compra ? 'border-red-500' : 'border-slate-200'}`}
                    />
                  ) : (
                    <p className="font-medium text-slate-800 mt-1">{formatDate(recibo.fecha_compra)}</p>
                  )}
                </div>

                {/* Método Pago */}
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Método Pago</label>
                  {modoEdicion ? (
                    <select
                      value={datosEditados.metodo_pago || ''}
                      onChange={(e) => handleDatoChange('metodo_pago', e.target.value)}
                      className={`w-full border rounded px-2 py-1 text-sm mt-1 ${errores.metodo_pago ? 'border-red-500' : 'border-slate-200'}`}
                    >
                      <option value="">Seleccionar...</option>
                      {METODOS_PAGO.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="font-medium text-slate-800 mt-1 text-xs">{getMetodoPagoLabel(recibo.metodo_pago)}</p>
                  )}
                </div>

                {/* Empresa Logística */}
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Empresa Logística</label>
                  {modoEdicion ? (
                    <input
                      type="text"
                      value={datosEditados.empresa_logistica || ''}
                      onChange={(e) => handleDatoChange('empresa_logistica', e.target.value)}
                      className="w-full border border-slate-200 rounded px-2 py-1 text-sm mt-1"
                      placeholder="Ej: FedEx, DHL..."
                    />
                  ) : (
                    <p className="font-medium text-slate-800 mt-1">{recibo.empresa_logistica || '-'}</p>
                  )}
                </div>

                {/* Tracking Number */}
                <div className="text-center md:col-span-3">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Tracking Number</label>
                  {modoEdicion ? (
                    <input
                      type="text"
                      value={datosEditados.tracking_number || ''}
                      onChange={(e) => handleDatoChange('tracking_number', e.target.value)}
                      className="w-full border border-slate-200 rounded px-2 py-1 text-sm mt-1"
                      placeholder="Número de seguimiento"
                    />
                  ) : (
                    <p className="font-medium text-slate-800 mt-1">{recibo.tracking_number || '-'}</p>
                  )}
                </div>

                {/* Fecha Estimada Ingreso */}
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">F. Est. Ingreso</label>
                  {modoEdicion ? (
                    <input
                      type="date"
                      value={datosEditados.fecha_estimada_ingreso || ''}
                      onChange={(e) => handleDatoChange('fecha_estimada_ingreso', e.target.value)}
                      className="w-full border border-slate-200 rounded px-2 py-1 text-sm mt-1"
                    />
                  ) : (
                    <p className="font-medium text-slate-800 mt-1">{formatDate(recibo.fecha_estimada_ingreso)}</p>
                  )}
                </div>

                {/* Fecha Ingreso Depósito USA (no editable) */}
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">F. Ingreso Depósito USA</label>
                  <p className="font-medium text-slate-800 mt-1">{formatDate(recibo.fecha_ingreso_deposito_usa)}</p>
                </div>

                {/* Fecha Recepción Argentina (no editable) */}
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">F. Recepción Argentina</label>
                  <p className="font-medium text-slate-800 mt-1">{formatDate(recibo.fecha_recepcion_argentina)}</p>
                </div>

                {/* Cliente */}
                <div className="text-center md:col-span-3">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Cliente (Opcional)</label>
                  {modoEdicion ? (
                    <select
                      value={datosEditados.cliente_id || ''}
                      onChange={(e) => handleDatoChange('cliente_id', e.target.value)}
                      className="w-full border border-slate-200 rounded px-2 py-1 text-sm mt-1"
                    >
                      <option value="">Sin cliente asignado</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>
                      ))}
                    </select>
                  ) : (
                    recibo.cliente_id ? (
                      <p className="font-medium text-slate-800 mt-1">
                        {recibo.clientes ? `${recibo.clientes.nombre} ${recibo.clientes.apellido}` : '-'}
                      </p>
                    ) : (
                      <p className="font-medium text-slate-400 mt-1">Sin cliente asignado</p>
                    )
                  )}
                </div>
              </div>

              {/* Observaciones */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <label className="text-xs font-semibold text-slate-500 uppercase block mb-2">Observaciones</label>
                {modoEdicion ? (
                  <textarea
                    value={datosEditados.observaciones || ''}
                    onChange={(e) => handleDatoChange('observaciones', e.target.value)}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                    rows={3}
                    placeholder="Notas adicionales..."
                  />
                ) : (
                  recibo.observaciones ? (
                    <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded p-3">
                      {recibo.observaciones}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400">Sin observaciones</p>
                  )
                )}
              </div>
            </div>
          </div>

          {/* PRODUCTOS */}
          <div className="space-y-3">
            <div className="bg-slate-200 p-4 rounded-t border border-slate-300 flex justify-between items-center">
              <h4 className="font-semibold text-slate-800 uppercase">
                Productos ({modoEdicion ? itemsVisibles.length + itemsNuevos.length : (recibo.importaciones_items || []).length})
              </h4>
              {modoEdicion && (
                <button
                  onClick={agregarItemNuevo}
                  className="bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700 flex items-center gap-1 text-sm font-medium transition-colors"
                >
                  <Plus size={14} />
                  Agregar Item
                </button>
              )}
            </div>
            <div className="border border-slate-300 border-t-0 rounded-b overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Producto</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-20">Cant.</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-28">P. Unit. USD</th>
                    {recibo.estado !== ESTADOS_IMPORTACION.RECEPCIONADO ? (
                      <>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-28">Peso Est. (kg)</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-28">Total USD</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-24">Peso Est.</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-24">Peso Real</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-24">Costo Adic.</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-24">P. Unit. Total</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-24">Total USD</th>
                      </>
                    )}
                    {modoEdicion && (
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-16">Acción</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {/* Items existentes */}
                  {(modoEdicion ? itemsEditados : (recibo.importaciones_items || [])).map((item, idx) => {
                    const estaEliminado = itemsEliminados.includes(item.id);

                    return (
                      <tr
                        key={item.id}
                        className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} ${estaEliminado ? 'opacity-40 line-through' : ''}`}
                      >
                        <td className="px-4 py-3 text-slate-800">
                          {modoEdicion && !estaEliminado ? (
                            <div>
                              <input
                                type="text"
                                value={item.item || ''}
                                onChange={(e) => handleItemChange(item.id, 'item', e.target.value)}
                                className={`w-full border rounded px-2 py-1 text-sm ${errores[`item_${item.id}_nombre`] ? 'border-red-500' : 'border-slate-200'}`}
                                placeholder="Nombre del producto"
                              />
                              {item.link_producto && (
                                <a
                                  href={item.link_producto}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-1"
                                >
                                  <ExternalLink size={12} />
                                  Ver link
                                </a>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div>{item.item}</div>
                              {item.link_producto && (
                                <a
                                  href={item.link_producto}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                >
                                  <ExternalLink size={12} />
                                  Ver link
                                </a>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">
                          {modoEdicion && !estaEliminado ? (
                            <input
                              type="number"
                              min="1"
                              value={item.cantidad || ''}
                              onChange={(e) => handleItemChange(item.id, 'cantidad', e.target.value)}
                              className={`w-full border rounded px-2 py-1 text-sm text-center ${errores[`item_${item.id}_cantidad`] ? 'border-red-500' : 'border-slate-200'}`}
                            />
                          ) : (
                            item.cantidad
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">
                          {modoEdicion && !estaEliminado ? (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.precio_unitario_usd || ''}
                              onChange={(e) => handleItemChange(item.id, 'precio_unitario_usd', e.target.value)}
                              className={`w-full border rounded px-2 py-1 text-sm text-center ${errores[`item_${item.id}_precio`] ? 'border-red-500' : 'border-slate-200'}`}
                            />
                          ) : (
                            `$${formatNumber(item.precio_unitario_usd)}`
                          )}
                        </td>

                        {recibo.estado !== ESTADOS_IMPORTACION.RECEPCIONADO ? (
                          <>
                            <td className="px-4 py-3 text-center text-slate-600">
                              {modoEdicion && !estaEliminado ? (
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.peso_estimado_unitario_kg || ''}
                                  onChange={(e) => handleItemChange(item.id, 'peso_estimado_unitario_kg', e.target.value)}
                                  className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-center"
                                />
                              ) : (
                                item.peso_estimado_total_kg ? item.peso_estimado_total_kg.toFixed(2) : '-'
                              )}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-slate-800">
                              ${formatNumber((parseFloat(item.precio_unitario_usd) || 0) * (parseInt(item.cantidad) || 0))}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-center text-slate-600">
                              {item.peso_estimado_unitario_kg ? item.peso_estimado_unitario_kg.toFixed(2) : '-'}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-600">
                              {modoEdicion && !estaEliminado ? (
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.peso_real_unitario_kg || ''}
                                  onChange={(e) => handleItemChange(item.id, 'peso_real_unitario_kg', e.target.value)}
                                  className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-center"
                                />
                              ) : (
                                item.peso_real_unitario_kg ? item.peso_real_unitario_kg.toFixed(2) : '-'
                              )}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-slate-800">
                              {item.costos_adicionales_usd ? `$${formatNumber(item.costos_adicionales_usd)}` : '-'}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-slate-800">
                              ${formatNumber(parseFloat(item.precio_unitario_usd) + (parseFloat(item.costos_adicionales_usd) || 0))}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-slate-800">
                              ${formatNumber((parseFloat(item.precio_unitario_usd) + (parseFloat(item.costos_adicionales_usd) || 0)) * item.cantidad)}
                            </td>
                          </>
                        )}

                        {modoEdicion && (
                          <td className="px-4 py-3 text-center">
                            {estaEliminado ? (
                              <button
                                onClick={() => restaurarItem(item.id)}
                                className="text-emerald-600 hover:text-emerald-700"
                                title="Restaurar"
                              >
                                ↩️
                              </button>
                            ) : (
                              <button
                                onClick={() => marcarItemParaEliminar(item.id)}
                                className="text-red-600 hover:text-red-700"
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}

                  {/* Items nuevos (en modo edición) */}
                  {modoEdicion && itemsNuevos.map((item, idx) => (
                    <tr key={item.tempId} className="bg-emerald-50">
                      <td className="px-4 py-3 text-slate-800">
                        <input
                          type="text"
                          value={item.item || ''}
                          onChange={(e) => handleItemNuevoChange(item.tempId, 'item', e.target.value)}
                          className={`w-full border rounded px-2 py-1 text-sm ${errores[`nuevo_${item.tempId}_nombre`] ? 'border-red-500' : 'border-slate-200'}`}
                          placeholder="Nombre del producto *"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.cantidad || ''}
                          onChange={(e) => handleItemNuevoChange(item.tempId, 'cantidad', e.target.value)}
                          className={`w-full border rounded px-2 py-1 text-sm text-center ${errores[`nuevo_${item.tempId}_cantidad`] ? 'border-red-500' : 'border-slate-200'}`}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.precio_unitario_usd || ''}
                          onChange={(e) => handleItemNuevoChange(item.tempId, 'precio_unitario_usd', e.target.value)}
                          className={`w-full border rounded px-2 py-1 text-sm text-center ${errores[`nuevo_${item.tempId}_precio`] ? 'border-red-500' : 'border-slate-200'}`}
                        />
                      </td>
                      {recibo.estado !== ESTADOS_IMPORTACION.RECEPCIONADO ? (
                        <>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.peso_estimado_unitario_kg || ''}
                              onChange={(e) => handleItemNuevoChange(item.tempId, 'peso_estimado_unitario_kg', e.target.value)}
                              className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-center"
                            />
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-slate-800">
                            ${formatNumber((parseFloat(item.precio_unitario_usd) || 0) * (parseInt(item.cantidad) || 0))}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-center text-slate-400">-</td>
                          <td className="px-4 py-3 text-center text-slate-400">-</td>
                          <td className="px-4 py-3 text-center text-slate-400">-</td>
                          <td className="px-4 py-3 text-center text-slate-400">-</td>
                          <td className="px-4 py-3 text-center font-semibold text-slate-800">
                            ${formatNumber((parseFloat(item.precio_unitario_usd) || 0) * (parseInt(item.cantidad) || 0))}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => eliminarItemNuevo(item.tempId)}
                          className="text-red-600 hover:text-red-700"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Total */}
                <tfoot className="bg-slate-800 text-white">
                  <tr>
                    {/*
                      NO recepcionado: 5 cols (Producto, Cant, P.Unit, Peso Est, Total) + 1 si edición
                      Recepcionado: 8 cols (Producto, Cant, P.Unit, Peso Est, Peso Real, Costo Adic, P.Unit Total, Total) + 1 si edición
                    */}
                    <td className="px-4 py-3 text-sm font-semibold" colSpan={recibo.estado !== ESTADOS_IMPORTACION.RECEPCIONADO ? 4 : 7}>
                      TOTAL PRODUCTOS
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">
                      ${formatNumber(modoEdicion ? totalProductosEdicion : totalProductos)}
                    </td>
                    {modoEdicion && <td></td>}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* INFORMACIÓN DE RECEPCIÓN (si está recepcionada) */}
          {recibo.estado === ESTADOS_IMPORTACION.RECEPCIONADO && (
            <div className="space-y-3">
              <div className="bg-slate-200 p-4 rounded-t border border-slate-300">
                <h4 className="font-semibold text-slate-800 uppercase">Información de Recepción</h4>
              </div>
              <div className="border border-slate-300 border-t-0 rounded-b p-4">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                    <div className="text-center">
                      <label className="text-xs font-semibold text-slate-500 uppercase block">Peso con Caja</label>
                      {modoEdicion ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={datosEditados.peso_total_con_caja_kg || ''}
                          onChange={(e) => handleDatoChange('peso_total_con_caja_kg', e.target.value)}
                          className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-center mt-1"
                        />
                      ) : (
                        <p className="font-medium text-slate-800 mt-1">{formatNumber(recibo.peso_total_con_caja_kg)} kg</p>
                      )}
                    </div>

                    <div className="text-center">
                      <label className="text-xs font-semibold text-slate-500 uppercase block">Peso sin Caja</label>
                      {modoEdicion ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={datosEditados.peso_sin_caja_kg || ''}
                          onChange={(e) => handleDatoChange('peso_sin_caja_kg', e.target.value)}
                          className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-center mt-1"
                        />
                      ) : (
                        <p className="font-medium text-slate-800 mt-1">{formatNumber(recibo.peso_sin_caja_kg)} kg</p>
                      )}
                    </div>

                    <div className="text-center">
                      <label className="text-xs font-semibold text-slate-500 uppercase block">Precio por KG</label>
                      {modoEdicion ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={datosEditados.precio_por_kg_usd || ''}
                          onChange={(e) => handleDatoChange('precio_por_kg_usd', e.target.value)}
                          className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-center mt-1"
                        />
                      ) : (
                        <p className="font-medium text-slate-800 mt-1">USD ${formatNumber(recibo.precio_por_kg_usd)}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                    <div className="text-center">
                      <label className="text-xs font-semibold text-slate-500 uppercase block">Pago Courier</label>
                      {modoEdicion ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={datosEditados.pago_courier_usd || ''}
                          onChange={(e) => handleDatoChange('pago_courier_usd', e.target.value)}
                          className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-center mt-1"
                        />
                      ) : (
                        <p className="font-medium text-slate-800 mt-1">USD ${formatNumber(recibo.pago_courier_usd)}</p>
                      )}
                    </div>

                    <div className="text-center">
                      <label className="text-xs font-semibold text-slate-500 uppercase block">Picking/Shipping</label>
                      {modoEdicion ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={datosEditados.costo_picking_shipping_usd || ''}
                          onChange={(e) => handleDatoChange('costo_picking_shipping_usd', e.target.value)}
                          className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-center mt-1"
                        />
                      ) : (
                        <p className="font-medium text-slate-800 mt-1">USD ${formatNumber(recibo.costo_picking_shipping_usd)}</p>
                      )}
                    </div>

                    <div className="text-center">
                      <label className="text-xs font-semibold text-slate-500 uppercase block">Costo Total Adicional</label>
                      <p className="font-medium text-slate-800 mt-1">
                        USD ${formatNumber(
                          modoEdicion
                            ? (parseFloat(datosEditados.pago_courier_usd) || 0) + (parseFloat(datosEditados.costo_picking_shipping_usd) || 0)
                            : totalCostos
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                    <div className="text-center">
                      <label className="text-xs font-semibold text-slate-500 uppercase block">Costo Productos</label>
                      <p className="font-medium text-slate-800 mt-1">USD ${formatNumber(modoEdicion ? totalProductosEdicion : totalProductos)}</p>
                    </div>

                    <div className="text-center">
                      <label className="text-xs font-semibold text-slate-500 uppercase block">Costo Total Final</label>
                      <p className="font-medium text-slate-800 mt-1">
                        USD ${formatNumber(
                          modoEdicion
                            ? totalProductosEdicion + (parseFloat(datosEditados.pago_courier_usd) || 0) + (parseFloat(datosEditados.costo_picking_shipping_usd) || 0)
                            : totalGeneral
                        )}
                      </p>
                    </div>

                    <div className="text-center">
                      <label className="text-xs font-semibold text-slate-500 uppercase block">Cantidad de Productos</label>
                      <p className="font-medium text-slate-800 mt-1">
                        {modoEdicion
                          ? [...itemsVisibles, ...itemsNuevos].reduce((sum, item) => sum + (parseInt(item.cantidad) || 0), 0)
                          : (recibo.importaciones_items || []).reduce((sum, item) => sum + (item.cantidad || 0), 0)
                        }
                      </p>
                    </div>
                  </div>

                  {modoEdicion && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                      <AlertCircle size={16} className="inline mr-2" />
                      Al guardar los cambios, los costos adicionales se recalcularán automáticamente y se distribuirán proporcionalmente según el peso real de cada item.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* BOTÓN CERRAR */}
          {!modoEdicion && (
            <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-slate-700 text-white rounded hover:bg-black transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetalleRecibo;
