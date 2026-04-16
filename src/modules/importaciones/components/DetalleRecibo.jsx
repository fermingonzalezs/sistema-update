import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Edit2, Save, XCircle, Plus, Trash2, AlertCircle, ExternalLink, FileText, Upload, Trash, Image, Paperclip } from 'lucide-react';
import EmpresaLogisticaSelector from './EmpresaLogisticaSelector';
import importacionesService from '../services/importacionesService';
import { ESTADOS_IMPORTACION, LABELS_ESTADOS, COLORES_ESTADOS } from '../constants/estadosImportacion';
import { formatearFechaDisplay } from '../../../shared/config/timezone';
import { METODOS_PAGO } from '../../../shared/constants/paymentMethods';

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

  // Estados para archivos adjuntos
  const [archivos, setArchivos] = useState([]);
  const [cargandoArchivos, setCargandoArchivos] = useState(false);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const fileInputRef = useRef(null);

  // Estados para factura PDF (legacy)
  const [gestionandoPdf, setGestionandoPdf] = useState(false);
  const fileInputPdfRef = useRef(null);

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
        fecha_ingreso_deposito_usa: recibo.fecha_ingreso_deposito_usa || '',
        observaciones: recibo.observaciones || '',
        numero_invoice: recibo.numero_invoice || '',
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

  // Cargar archivos adjuntos
  const cargarArchivos = useCallback(async () => {
    if (!recibo?.id) return;
    setCargandoArchivos(true);
    try {
      const data = await importacionesService.obtenerArchivos(recibo.id);
      setArchivos(data);
    } catch (err) {
      console.error('Error cargando archivos:', err);
    } finally {
      setCargandoArchivos(false);
    }
  }, [recibo?.id]);

  useEffect(() => {
    cargarArchivos();
  }, [cargarArchivos]);

  const handleAgregarArchivos = async (e) => {
    const nuevos = Array.from(e.target.files);
    e.target.value = '';
    if (!nuevos.length) return;

    const tiposPermitidos = ['application/pdf', 'image/'];
    const maxSize = 20 * 1024 * 1024;
    setSubiendoArchivo(true);
    for (const archivo of nuevos) {
      if (!tiposPermitidos.some(t => archivo.type.startsWith(t))) {
        alert(`"${archivo.name}": Solo se permiten PDFs e imágenes`);
        continue;
      }
      if (archivo.size > maxSize) {
        alert(`"${archivo.name}": El archivo no puede superar los 20MB`);
        continue;
      }
      try {
        await importacionesService.subirArchivo(recibo.id, archivo);
      } catch (err) {
        alert(`Error al subir "${archivo.name}": ${err.message}`);
      }
    }
    await cargarArchivos();
    setSubiendoArchivo(false);
  };

  const handleEliminarArchivo = async (archivo) => {
    if (!window.confirm(`¿Eliminar "${archivo.nombre_original}"?`)) return;
    try {
      await importacionesService.eliminarArchivo(archivo.id, archivo.url);
      setArchivos(prev => prev.filter(a => a.id !== archivo.id));
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined || num === '') return '-';
    return Math.round(parseFloat(num)).toLocaleString('es-AR');
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return formatearFechaDisplay(date);
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
      color: '',
      almacenamiento: '',
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
        fecha_ingreso_deposito_usa: datosEditados.fecha_ingreso_deposito_usa || null,
        observaciones: datosEditados.observaciones?.trim() || null,
        numero_invoice: datosEditados.numero_invoice?.trim() || null
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
          if ((item.color?.trim() || null) !== (itemOriginal.color || null)) cambios.color = item.color?.trim() || null;
          if ((item.almacenamiento?.trim() || null) !== (itemOriginal.almacenamiento || null)) cambios.almacenamiento = item.almacenamiento?.trim() || null;
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
        fecha_ingreso_deposito_usa: recibo.fecha_ingreso_deposito_usa || '',
        observaciones: recibo.observaciones || '',
        numero_invoice: recibo.numero_invoice || '',
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

  // Handlers para PDF de factura
  const handleSubirPdf = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    if (archivo.type !== 'application/pdf') { alert('Solo se permiten archivos PDF'); return; }
    if (archivo.size > 10 * 1024 * 1024) { alert('El archivo no puede superar los 10MB'); return; }

    setGestionandoPdf(true);
    try {
      if (recibo.factura_pdf_url) {
        await importacionesService.reemplazarFacturaPdf(recibo.id, archivo, recibo.factura_pdf_url);
      } else {
        await importacionesService.subirFacturaPdf(recibo.id, archivo);
      }
      if (onRefresh) await onRefresh();
      alert('✅ Factura PDF actualizada correctamente');
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setGestionandoPdf(false);
      if (fileInputPdfRef.current) fileInputPdfRef.current.value = '';
    }
  };

  const handleEliminarPdf = async () => {
    if (!window.confirm('¿Eliminar el PDF de factura adjunto?')) return;
    setGestionandoPdf(true);
    try {
      await importacionesService.eliminarFacturaPdf(recibo.id, recibo.factura_pdf_url);
      if (onRefresh) await onRefresh();
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setGestionandoPdf(false);
    }
  };

  const totalProductos = (recibo.importaciones_items || []).reduce((sum, item) => sum + (item.precio_total_usd || 0), 0);
  const totalCostos = (recibo.costo_total_importacion_usd || 0);
  const totalFinanciero = (recibo.importaciones_items || []).reduce((sum, item) => sum + (parseFloat(item.costo_financiero_usd) || 0), 0);
  const totalGeneral = totalProductos + totalCostos + totalFinanciero;

  // Calcular totales para edición
  const itemsVisibles = itemsEditados.filter(i => !itemsEliminados.includes(i.id));
  const totalProductosEdicion = [...itemsVisibles, ...itemsNuevos].reduce((sum, item) => {
    return sum + (parseFloat(item.precio_unitario_usd) || 0) * (parseInt(item.cantidad) || 0);
  }, 0);

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded border border-slate-200 max-w-[78vw] w-full max-h-[90vh] overflow-y-auto">
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
                    <div className="mt-1">
                      <EmpresaLogisticaSelector
                        value={datosEditados.empresa_logistica || ''}
                        onChange={(valor) => handleDatoChange('empresa_logistica', valor)}
                        placeholder="Seleccionar empresa..."
                      />
                    </div>
                  ) : (
                    <p className="font-medium text-slate-800 mt-1">{recibo.empresa_logistica || '-'}</p>
                  )}
                </div>

                {/* Número de Invoice */}
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Número de Invoice</label>
                  {modoEdicion ? (
                    <input
                      type="text"
                      value={datosEditados.numero_invoice || ''}
                      onChange={(e) => handleDatoChange('numero_invoice', e.target.value)}
                      className="w-full border border-slate-200 rounded px-2 py-1 text-sm mt-1"
                      placeholder="Ej: INV-2024-001"
                    />
                  ) : (
                    <p className="font-medium text-slate-800 mt-1">{recibo.numero_invoice || '-'}</p>
                  )}
                </div>

                {/* Tracking Number */}
                <div className="text-center">
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

                {/* Fecha Ingreso Depósito USA */}
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">F. Ingreso Depósito USA</label>
                  {modoEdicion ? (
                    <input
                      type="date"
                      value={datosEditados.fecha_ingreso_deposito_usa || ''}
                      onChange={(e) => handleDatoChange('fecha_ingreso_deposito_usa', e.target.value)}
                      className="w-full border border-slate-200 rounded px-2 py-1 text-sm mt-1"
                    />
                  ) : (
                    <p className="font-medium text-slate-800 mt-1">{formatDate(recibo.fecha_ingreso_deposito_usa)}</p>
                  )}
                </div>

                {/* Fecha Recepción Argentina (no editable) */}
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">F. Recepción Argentina</label>
                  <p className="font-medium text-slate-800 mt-1">{formatDate(recibo.fecha_recepcion_argentina)}</p>
                </div>

                {/* Costo Financiero */}
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Costo Financiero</label>
                  <p className="font-medium text-slate-800 mt-1">
                    {recibo.porcentaje_financiero != null ? `${recibo.porcentaje_financiero}%` : '-'}
                  </p>
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

              {/* Archivos adjuntos */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
                    <Paperclip size={12} />
                    Archivos adjuntos {archivos.length > 0 && `(${archivos.length})`}
                  </label>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={subiendoArchivo}
                    className="text-xs text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1 disabled:opacity-50"
                  >
                    <Plus size={12} />
                    Agregar
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/*"
                  multiple
                  onChange={handleAgregarArchivos}
                  className="hidden"
                />
                {cargandoArchivos ? (
                  <p className="text-xs text-slate-400 py-2">Cargando archivos...</p>
                ) : (
                  <div className="space-y-2">
                    {/* Archivo PDF legacy */}
                    {recibo.factura_pdf_url && (
                      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded px-3 py-2">
                        <FileText size={16} className="text-emerald-600 flex-shrink-0" />
                        <span className="text-sm text-slate-700 truncate flex-1">Factura adjunta</span>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <a
                            href={recibo.factura_pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-800 transition-colors"
                            title="Ver PDF"
                          >
                            <ExternalLink size={18} />
                          </a>
                          <button
                            onClick={handleEliminarPdf}
                            disabled={gestionandoPdf}
                            className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                            title="Eliminar PDF"
                          >
                            <Trash size={18} />
                          </button>
                        </div>
                      </div>
                    )}
                    {/* Archivos nuevos */}
                    {archivos.map(archivo => (
                      <div key={archivo.id} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded px-3 py-2">
                        {archivo.tipo_mime === 'application/pdf'
                          ? <FileText size={16} className="text-emerald-600 flex-shrink-0" />
                          : <Image size={16} className="text-blue-500 flex-shrink-0" />
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 truncate">{archivo.nombre_original}</p>
                          {archivo.tamano_bytes && (
                            <p className="text-xs text-slate-400">{(archivo.tamano_bytes / 1024).toFixed(0)} KB</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <a
                            href={archivo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-800 transition-colors"
                            title="Ver archivo"
                          >
                            <ExternalLink size={18} />
                          </a>
                          <button
                            onClick={() => handleEliminarArchivo(archivo)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Eliminar"
                          >
                            <Trash size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {/* Estado vacío */}
                    {archivos.length === 0 && !recibo.factura_pdf_url && (
                      <div
                        onClick={() => !subiendoArchivo && fileInputRef.current?.click()}
                        className="border border-dashed border-slate-300 rounded p-4 flex items-center gap-3 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                      >
                        <Upload size={18} className="text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-600 font-medium">
                            {subiendoArchivo ? 'Subiendo...' : 'Adjuntar archivos'}
                          </p>
                          <p className="text-xs text-slate-400">PDFs e imágenes, máx. 20MB c/u</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {subiendoArchivo && (
                  <p className="text-xs text-emerald-600 mt-1">Subiendo archivos...</p>
                )}
              </div>
            </div>
          </div>

          {/* PRODUCTOS */}
          <div className="space-y-3">
            <div className="bg-slate-200 p-4 rounded-t border border-slate-300 flex justify-between items-center">
              <h4 className="font-semibold text-slate-800 uppercase">
                {(() => {
                  if (modoEdicion) {
                    return `Productos (${itemsVisibles.length + itemsNuevos.length})`;
                  }
                  const items = recibo.importaciones_items || [];
                  const total = items.length;
                  const ingresados = items.filter(i => i.caja_id).length;
                  if (ingresados > 0 && ingresados < total) {
                    return (
                      <span>
                        Productos ({total}) —{' '}
                        <span className="text-emerald-700">{ingresados}</span>
                        <span className="text-slate-500 font-normal text-xs"> ingresados</span>
                      </span>
                    );
                  }
                  return `Productos (${total})`;
                })()}
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
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ minWidth: '220px' }}>Producto</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-24">Color</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-28">Almacenamiento</th>
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
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-24">C. Envío</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-24">C. Financiero</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-24">C. Total</th>
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
                        <td className="px-4 py-3 text-slate-800" style={{ minWidth: '220px' }}>
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
                              {item.caja_id && (
                                <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                                  ✓ Ingresado · {item.importaciones_cajas?.numero_caja || item.caja_id}
                                </span>
                              )}
                              {item.link_producto && (
                                <a
                                  href={item.link_producto}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-0.5"
                                >
                                  <ExternalLink size={12} />
                                  Ver link
                                </a>
                              )}
                            </div>
                          )}
                        </td>
                        {/* Color */}
                        <td className="px-4 py-3 text-center text-slate-600">
                          {modoEdicion && !estaEliminado ? (
                            <input
                              type="text"
                              value={item.color || ''}
                              onChange={(e) => handleItemChange(item.id, 'color', e.target.value)}
                              className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-center text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="-"
                            />
                          ) : (
                            item.color || '-'
                          )}
                        </td>
                        {/* Almacenamiento */}
                        <td className="px-4 py-3 text-center text-slate-600">
                          {modoEdicion && !estaEliminado ? (
                            <input
                              type="text"
                              value={item.almacenamiento || ''}
                              onChange={(e) => handleItemChange(item.id, 'almacenamiento', e.target.value)}
                              className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-center text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="-"
                            />
                          ) : (
                            item.almacenamiento || '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">
                          {modoEdicion && !estaEliminado ? (
                            <input
                              type="number"
                              min="1"
                              value={item.cantidad || ''}
                              onChange={(e) => handleItemChange(item.id, 'cantidad', e.target.value)}
                              className={`w-full border rounded px-2 py-1 text-sm text-center text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errores[`item_${item.id}_cantidad`] ? 'border-red-500' : 'border-slate-200'}`}
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
                              className={`w-full border rounded px-2 py-1 text-sm text-center text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errores[`item_${item.id}_precio`] ? 'border-red-500' : 'border-slate-200'}`}
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
                                  className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-center text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                                  className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-center text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              ) : (
                                item.peso_real_unitario_kg ? item.peso_real_unitario_kg.toFixed(2) : '-'
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-600">
                              {item.costo_envio_usd != null ? `$${formatNumber(item.costo_envio_usd)}` : '-'}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-600">
                              {item.costo_financiero_usd != null ? `$${formatNumber(item.costo_financiero_usd)}` : '-'}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-emerald-700">
                              {item.costos_adicionales_usd != null ? `$${formatNumber(item.costos_adicionales_usd)}` : '-'}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-slate-800">
                              ${formatNumber(parseFloat(item.precio_unitario_usd) + (parseFloat(item.costos_adicionales_usd) || 0) + (parseFloat(item.costo_financiero_usd) || 0))}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-slate-800">
                              ${formatNumber((parseFloat(item.precio_unitario_usd) + (parseFloat(item.costos_adicionales_usd) || 0) + (parseFloat(item.costo_financiero_usd) || 0)) * item.cantidad)}
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
                      {/* Color */}
                      <td className="px-4 py-3 text-center">
                        <input
                          type="text"
                          value={item.color || ''}
                          onChange={(e) => handleItemNuevoChange(item.tempId, 'color', e.target.value)}
                          className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-center text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="-"
                        />
                      </td>
                      {/* Almacenamiento */}
                      <td className="px-4 py-3 text-center">
                        <input
                          type="text"
                          value={item.almacenamiento || ''}
                          onChange={(e) => handleItemNuevoChange(item.tempId, 'almacenamiento', e.target.value)}
                          className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-center text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="-"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.cantidad || ''}
                          onChange={(e) => handleItemNuevoChange(item.tempId, 'cantidad', e.target.value)}
                          className={`w-full border rounded px-2 py-1 text-sm text-center text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errores[`nuevo_${item.tempId}_cantidad`] ? 'border-red-500' : 'border-slate-200'}`}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.precio_unitario_usd || ''}
                          onChange={(e) => handleItemNuevoChange(item.tempId, 'precio_unitario_usd', e.target.value)}
                          className={`w-full border rounded px-2 py-1 text-sm text-center text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errores[`nuevo_${item.tempId}_precio`] ? 'border-red-500' : 'border-slate-200'}`}
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
                              className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-center text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                      NO recepcionado: 6 cols (Producto, Color, Almacenamiento, Cant, P.Unit, Peso Est) + Total + 1 si edición
                      Recepcionado: 11 cols (Producto, Color, Almacenamiento, Cant, P.Unit, Peso Est, Peso Real, C.Envío, C.Financiero, C.Total, P.Unit Total) + Total + 1 si edición
                    */}
                    <td className="px-4 py-3 text-sm font-semibold" colSpan={recibo.estado !== ESTADOS_IMPORTACION.RECEPCIONADO ? 6 : 11}>
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
                        <p className="font-medium text-slate-800 mt-1">{recibo.peso_total_con_caja_kg != null ? parseFloat(recibo.peso_total_con_caja_kg).toFixed(2) : '-'} kg</p>
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
                        <p className="font-medium text-slate-800 mt-1">{recibo.peso_sin_caja_kg != null ? parseFloat(recibo.peso_sin_caja_kg).toFixed(2) : '-'} kg</p>
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

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
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
                      <label className="text-xs font-semibold text-slate-500 uppercase block">Costo Financiero Total</label>
                      <p className="font-medium text-slate-800 mt-1">USD ${formatNumber(totalFinanciero)}</p>
                    </div>

                    <div className="text-center">
                      <label className="text-xs font-semibold text-slate-500 uppercase block">Costo Total Adicional</label>
                      <p className="font-medium text-slate-800 mt-1">
                        USD ${formatNumber(
                          modoEdicion
                            ? (parseFloat(datosEditados.pago_courier_usd) || 0) + (parseFloat(datosEditados.costo_picking_shipping_usd) || 0) + totalFinanciero
                            : totalCostos + totalFinanciero
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
                            ? totalProductosEdicion + (parseFloat(datosEditados.pago_courier_usd) || 0) + (parseFloat(datosEditados.costo_picking_shipping_usd) || 0) + totalFinanciero
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
