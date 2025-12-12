import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Monitor, Smartphone, Box, Eye } from 'lucide-react';
import { useProveedores } from '../../importaciones/hooks/useProveedores';
import NuevoProveedorModal from '../../importaciones/components/NuevoProveedorModal';
import CargaEquiposUnificada from '../../administracion/components/CargaEquiposUnificada';
import { supabase } from '../../../lib/supabase';
import { obtenerFechaLocal } from '../../../shared/utils/formatters';

const NuevaCompraModal = ({ isOpen, onClose, onSave, isLoading = false, isEditing = false, reciboInicial = null }) => {
  const { proveedores } = useProveedores();

  const METODOS_PAGO = [
    { value: 'efectivo_pesos', label: '💵 Efectivo en Pesos' },
    { value: 'dolares_billete', label: '💸 Dólares Billete' },
    { value: 'transferencia', label: '🏦 Transferencia' },
    { value: 'criptomonedas', label: '₿ Criptomonedas' },
    { value: 'tarjeta_credito', label: '💳 Tarjeta de Crédito' },
    { value: 'cuenta_corriente', label: '🏷️ Cuenta Corriente' }
  ];

  const [showNuevoProveedorModal, setShowNuevoProveedorModal] = useState(false);
  const [mostrarModalDestino, setMostrarModalDestino] = useState(false);
  const [destinoSeleccionado, setDestinoSeleccionado] = useState('stock');
  const [procesando, setProcesando] = useState(false);

  const [formRecibo, setFormRecibo] = useState({
    proveedor_id: reciboInicial?.proveedor_id || '',
    proveedor: reciboInicial?.proveedor || '',
    fecha_compra: reciboInicial?.fecha || obtenerFechaLocal(),
    metodo_pago: reciboInicial?.metodo_pago || 'transferencia',
    observaciones: reciboInicial?.descripcion || '',
    costos_adicionales: reciboInicial?.costos_adicionales || 0
  });

  const [items, setItems] = useState([]);
  const [itemExpandido, setItemExpandido] = useState(null);

  // Función para generar descripción del item
  const generarDescripcionItem = (tipo, datos) => {
    switch (tipo) {
      case 'notebook':
        return `${datos.marca || ''} ${datos.modelo || ''} - ${datos.procesador || ''} - ${datos.ram || ''} RAM - ${datos.ssd || ''} SSD`.trim();
      case 'celular':
        return `${datos.marca || ''} ${datos.modelo || ''} - ${datos.capacidad || ''} - ${datos.color || ''}`.trim();
      case 'otro':
        return `${datos.nombre_producto || ''} ${datos.descripcion ? '- ' + datos.descripcion : ''}`.trim();
      default:
        return 'Producto sin descripción';
    }
  };

  // Función para agregar item a la lista temporal (callback de CargaEquiposUnificada)
  const handleAgregarItem = (tipoProducto, datosCompletos) => {
    // Validar serial único en la lista temporal
    if (tipoProducto === 'notebook' || tipoProducto === 'celular') {
      const serialExiste = items.some(item =>
        item.datos_completos.serial === datosCompletos.serial
      );
      if (serialExiste) {
        alert('Ya existe un producto con ese serial en esta compra');
        return;
      }
    }

    // Determinar cantidad según tipo
    const cantidad = tipoProducto === 'otro'
      ? (datosCompletos.cantidad_la_plata || 0) + (datosCompletos.cantidad_mitre || 0)
      : 1;

    // Determinar precio unitario según tipo
    const precioUnitario = tipoProducto === 'notebook'
      ? parseFloat(datosCompletos.precio_costo_usd) + parseFloat(datosCompletos.envios_repuestos || 0)
      : parseFloat(datosCompletos.precio_compra_usd || datosCompletos.precio_costo_usd);

    // Crear item temporal
    const nuevoItem = {
      id: Date.now(),
      tipo_producto: tipoProducto,
      datos_completos: datosCompletos,
      cantidad: cantidad,
      precio_unitario: precioUnitario,
      precio_total: cantidad * precioUnitario,
      descripcion: generarDescripcionItem(tipoProducto, datosCompletos)
    };

    setItems([...items, nuevoItem]);
    alert('✅ Producto agregado a la compra');
  };

  const eliminarItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Cálculo en tiempo real de costos prorrateados
  const calcularCostosProrrateados = () => {
    const totalSinCostos = items.reduce((sum, item) => sum + item.precio_total, 0);
    const costosAdicionales = parseFloat(formRecibo.costos_adicionales) || 0;

    if (totalSinCostos === 0) return items;

    return items.map(item => {
      const proporcion = item.precio_total / totalSinCostos;
      const costoDistribuido = costosAdicionales * proporcion;
      return {
        ...item,
        costos_adicionales: costoDistribuido,
        precio_final: item.precio_total + costoDistribuido
      };
    });
  };

  const calcularTotalItems = () => {
    return items.reduce((sum, item) => sum + item.precio_total, 0);
  };

  // Función para crear notebooks en inventario
  const crearNotebook = async (datos, costosAdicionales) => {
    const { data, error } = await supabase
      .from('inventario')
      .insert({
        serial: datos.serial,
        modelo: datos.modelo,
        precio_costo_usd: datos.precio_costo_usd,
        envios_repuestos: parseFloat(datos.envios_repuestos || 0) + costosAdicionales,
        precio_venta_usd: datos.precio_venta_usd,
        sucursal: datos.sucursal,
        condicion: datos.condicion,
        procesador: datos.procesador,
        slots: datos.slots,
        tipo_ram: datos.tipo_ram,
        ram: datos.ram,
        ssd: datos.ssd,
        hdd: datos.hdd,
        so: datos.so,
        pantalla: datos.pantalla,
        resolucion: datos.resolucion,
        placa_video: datos.placa_video,
        vram: datos.vram,
        teclado_retro: datos.teclado_retro,
        idioma_teclado: datos.idioma_teclado,
        color: datos.color,
        bateria: datos.bateria,
        duracion: datos.duracion,
        garantia_update: datos.garantia_update,
        garantia_oficial: datos.garantia_oficial,
        fallas: datos.fallas,
        ingreso: datos.ingreso,
        marca: datos.marca,
        refresh: datos.refresh,
        touchscreen: datos.touchscreen,
        estado: datos.estado,
        categoria: datos.categoria,
        fotos: datos.fotos
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(`El serial ${datos.serial} ya existe en el sistema (Notebooks).`);
      }
      throw error;
    }
    return data;
  };

  // Función para crear celulares en inventario
  const crearCelular = async (datos, costosAdicionales) => {
    const { data, error } = await supabase
      .from('celulares')
      .insert({
        serial: datos.serial,
        sucursal: datos.sucursal,
        precio_compra_usd: datos.precio_compra_usd,
        precio_venta_usd: datos.precio_venta_usd,
        modelo: datos.modelo,
        capacidad: datos.capacidad,
        condicion: datos.condicion,
        color: datos.color,
        estado: datos.estado,
        bateria: datos.bateria,
        ciclos: datos.ciclos,
        garantia: datos.garantia,
        fallas: datos.fallas,
        marca: datos.marca,
        ingreso: datos.ingreso,
        categoria: datos.categoria,
        costos_adicionales: parseFloat(datos.costos_adicionales || 0) + costosAdicionales,
        fotos: datos.fotos,
        sim_esim: datos.sim_esim,
        ram: datos.ram
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(`El serial ${datos.serial} ya existe en el sistema (Celulares).`);
      }
      throw error;
    }
    return data;
  };

  // Función para crear otros productos en inventario
  const crearOtro = async (datos, costosAdicionales) => {
    const { data, error } = await supabase
      .from('otros')
      .insert({
        nombre_producto: datos.nombre_producto,
        descripcion: datos.descripcion,
        categoria: datos.categoria,
        precio_compra_usd: datos.precio_compra_usd,
        precio_venta_usd: datos.precio_venta_usd,
        cantidad_la_plata: datos.cantidad_la_plata,
        cantidad_mitre: datos.cantidad_mitre,
        garantia: datos.garantia,
        observaciones: datos.observaciones,
        condicion: datos.condicion,
        ingreso: datos.ingreso,
        marca: datos.marca,
        fotos: datos.fotos,
        serial: datos.serial,
        costos_adicionales: parseFloat(datos.costos_adicionales || 0) + costosAdicionales
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  // Función para crear productos en inventario
  const crearProductosEnInventario = async (itemsConCostos, reciboId) => {
    const productosCreados = [];

    for (const item of itemsConCostos) {
      const { tipo_producto, datos_completos, costos_adicionales } = item;

      try {
        let productoCreado;
        switch (tipo_producto) {
          case 'notebook':
            productoCreado = await crearNotebook(datos_completos, costos_adicionales);
            break;
          case 'celular':
            productoCreado = await crearCelular(datos_completos, costos_adicionales);
            break;
          case 'otro':
            productoCreado = await crearOtro(datos_completos, costos_adicionales);
            break;
        }
        productosCreados.push({ item, productoCreado });
      } catch (error) {
        console.error(`Error creando ${tipo_producto}:`, error);
        throw new Error(`Error creando ${tipo_producto}: ${error.message}`);
      }
    }

    return productosCreados;
  };

  // Función para registrar en ingresos_equipos
  const registrarIngresosEquipos = async (itemsConCostos, reciboId, productosCreados) => {
    const ingresosData = itemsConCostos.map((item, index) => ({
      tipo_producto: item.tipo_producto,
      descripcion_completa: item.descripcion,
      precio_compra: item.precio_final,
      proveedor: formRecibo.proveedor,
      garantias: item.datos_completos.garantia_update || item.datos_completos.garantia || '3 meses',
      destino: destinoSeleccionado,
      usuario_ingreso: 'admin', // TODO: Obtener de contexto de autenticación
      notas: `Ingreso desde Compra Nacional (Recibo ID: ${reciboId})`,
      estado: destinoSeleccionado === 'stock' ? 'completado' : 'pendiente',
      referencia_compra_id: reciboId,
      referencia_inventario_id: productosCreados[index]?.productoCreado?.id || null,
      fecha: new Date()
    }));

    const { error } = await supabase
      .from('ingresos_equipos')
      .insert(ingresosData);

    if (error) throw error;
  };

  // Función principal para procesar compra completa
  const procesarCompraCompleta = async () => {
    try {
      setProcesando(true);

      // 1. Calcular items con costos prorrateados
      const itemsConCostos = calcularCostosProrrateados();

      // 2. Crear recibo en compras_recibos
      const reciboData = {
        proveedor_id: formRecibo.proveedor_id,
        proveedor: formRecibo.proveedor,
        fecha: formRecibo.fecha_compra,
        metodo_pago: formRecibo.metodo_pago,
        descripcion: formRecibo.observaciones,
        estado: destinoSeleccionado === 'stock' ? 'ingresado' : 'en_camino',
        costos_adicionales: parseFloat(formRecibo.costos_adicionales) || 0,
        fecha_procesamiento: destinoSeleccionado === 'stock' ? new Date().toISOString() : null
      };

      const { data: recibo, error: errorRecibo } = await supabase
        .from('compras_recibos')
        .insert(reciboData)
        .select()
        .single();

      if (errorRecibo) throw errorRecibo;

      // 3. Crear registros en compra_items (historial)
      const compraItemsData = itemsConCostos.map(item => ({
        recibo_id: recibo.id,
        producto: item.descripcion,
        cantidad: item.cantidad,
        serial: item.datos_completos.serial || null,
        precio_unitario: item.precio_unitario,
        precio_total: item.precio_final,
        costos_adicionales: item.costos_adicionales,
        tipo_producto: item.tipo_producto,
        datos_producto: item.datos_completos
      }));

      const { error: errorItems } = await supabase
        .from('compra_items')
        .insert(compraItemsData);

      if (errorItems) throw errorItems;

      // 4. Crear productos en inventario (si destino = stock)
      let productosCreados = [];
      if (destinoSeleccionado === 'stock') {
        productosCreados = await crearProductosEnInventario(itemsConCostos, recibo.id);
      }

      // 5. Registrar en ingresos_equipos
      await registrarIngresosEquipos(itemsConCostos, recibo.id, productosCreados);

      alert(`✅ Compra procesada exitosamente!\n${destinoSeleccionado === 'stock' ? 'Productos agregados al stock.' : 'Productos enviados a testeo.'}`);

      // Cerrar modal y refrescar
      onClose();
      if (onSave) {
        // Llamar onSave para refrescar la lista
        onSave();
      }

    } catch (error) {
      console.error('Error al procesar compra:', error);
      alert('❌ Error al procesar la compra: ' + error.message);
    } finally {
      setProcesando(false);
      setMostrarModalDestino(false);
    }
  };

  const handleFinalizarCompra = () => {
    // Validaciones
    if (!formRecibo.proveedor_id) {
      alert('Debe seleccionar un proveedor');
      return;
    }

    if (items.length === 0) {
      alert('Debe agregar al menos un producto');
      return;
    }

    // Mostrar modal de destino
    setMostrarModalDestino(true);
  };

  if (!isOpen) return null;

  const itemsConCostosCalculados = calcularCostosProrrateados();
  const totalFinal = itemsConCostosCalculados.reduce((sum, item) => sum + item.precio_final, 0);

  const getIconoTipo = (tipo) => {
    switch (tipo) {
      case 'notebook':
        return <Monitor className="w-4 h-4" />;
      case 'celular':
        return <Smartphone className="w-4 h-4" />;
      case 'otro':
        return <Box className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded border border-slate-200 max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        {/* HEADER */}
        <div className="p-6 bg-slate-800 text-white flex justify-between items-center sticky top-0 z-10">
          <h3 className="text-xl font-semibold">Nueva Compra Nacional</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white" disabled={procesando}>
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* DATOS GENERALES DEL RECIBO */}
          <div className="space-y-3">
            <div className="bg-slate-800 p-4 rounded-t border border-slate-200">
              <h4 className="font-semibold text-white uppercase">Datos Generales</h4>
            </div>
            <div className="border border-slate-200 border-t-0 rounded-b p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* PROVEEDOR */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor *</label>
                  <div className="flex gap-2">
                    <select
                      value={formRecibo.proveedor_id}
                      onChange={(e) => {
                        const proveedorSeleccionado = proveedores.find(p => p.id === parseInt(e.target.value));
                        setFormRecibo({
                          ...formRecibo,
                          proveedor_id: e.target.value,
                          proveedor: proveedorSeleccionado?.nombre || ''
                        });
                      }}
                      className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                      required
                    >
                      <option value="">Seleccionar proveedor</option>
                      {proveedores.map(prov => (
                        <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowNuevoProveedorModal(true)}
                      className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                      title="Nuevo Proveedor"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* FECHA */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha *</label>
                  <input
                    type="date"
                    value={formRecibo.fecha_compra}
                    onChange={(e) => setFormRecibo({ ...formRecibo, fecha_compra: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                    required
                  />
                </div>

                {/* MÉTODO DE PAGO */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Método de Pago *</label>
                  <select
                    value={formRecibo.metodo_pago}
                    onChange={(e) => setFormRecibo({ ...formRecibo, metodo_pago: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                    required
                  >
                    {METODOS_PAGO.map(metodo => (
                      <option key={metodo.value} value={metodo.value}>{metodo.label}</option>
                    ))}
                  </select>
                </div>

                {/* COSTOS ADICIONALES */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Costos Adicionales (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formRecibo.costos_adicionales}
                    onChange={(e) => setFormRecibo({ ...formRecibo, costos_adicionales: e.target.value })}
                    placeholder="0.00"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                  />
                  <p className="text-xs text-slate-500 mt-1">Se distribuirán proporcionalmente</p>
                </div>

                {/* OBSERVACIONES */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
                  <textarea
                    value={formRecibo.observaciones}
                    onChange={(e) => setFormRecibo({ ...formRecibo, observaciones: e.target.value })}
                    placeholder="Notas adicionales..."
                    rows="2"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* FORMULARIO DE CARGA DE EQUIPOS */}
          <div className="space-y-3">
            <div className="bg-slate-800 p-4 rounded-t border border-slate-200">
              <h4 className="font-semibold text-white uppercase">Agregar Productos</h4>
            </div>
            <div className="border border-slate-200 border-t-0 rounded-b p-4">
              <CargaEquiposUnificada
                modoCompra={true}
                onReturnData={handleAgregarItem}
                loading={procesando}
              />
            </div>
          </div>

          {/* TABLA DE ITEMS AGREGADOS */}
          {items.length > 0 && (
            <div className="space-y-3">
              <div className="bg-slate-800 p-4 rounded-t border border-slate-200">
                <h4 className="font-semibold text-white uppercase">Productos en la Compra ({items.length})</h4>
              </div>
              <div className="border border-slate-200 border-t-0 rounded-b overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Descripción</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Cant.</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Precio Unit.</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Subtotal</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Costos Adic.</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Total</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {itemsConCostosCalculados.map((item, index) => (
                        <React.Fragment key={item.id}>
                          <tr className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center gap-2">
                                {getIconoTipo(item.tipo_producto)}
                                <span className="capitalize">{item.tipo_producto}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-800">{item.descripcion}</td>
                            <td className="px-4 py-3 text-sm text-center text-slate-600">{item.cantidad}</td>
                            <td className="px-4 py-3 text-sm text-center text-slate-600">${item.precio_unitario.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-center text-slate-600">${item.precio_total.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-center text-emerald-600 font-medium">${(item.costos_adicionales || 0).toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-center font-semibold text-slate-800">${item.precio_final.toFixed(2)}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setItemExpandido(itemExpandido === item.id ? null : item.id)}
                                  className="text-slate-600 hover:text-slate-800 transition-colors"
                                  title="Ver detalles"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => eliminarItem(item.id)}
                                  className="text-red-600 hover:text-red-700 transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {itemExpandido === item.id && (
                            <tr className={index % 2 === 0 ? 'bg-slate-100' : 'bg-slate-200'}>
                              <td colSpan="8" className="px-4 py-3">
                                <div className="text-xs space-y-1 text-slate-700">
                                  <p><strong>Serial:</strong> {item.datos_completos.serial || 'N/A'}</p>
                                  <p><strong>Marca:</strong> {item.datos_completos.marca || 'N/A'}</p>
                                  <p><strong>Modelo:</strong> {item.datos_completos.modelo || item.datos_completos.nombre_producto || 'N/A'}</p>
                                  {item.tipo_producto === 'notebook' && (
                                    <>
                                      <p><strong>Procesador:</strong> {item.datos_completos.procesador || 'N/A'}</p>
                                      <p><strong>RAM:</strong> {item.datos_completos.ram || 'N/A'}</p>
                                      <p><strong>Almacenamiento:</strong> {item.datos_completos.ssd || 'N/A'}</p>
                                    </>
                                  )}
                                  {item.tipo_producto === 'celular' && (
                                    <>
                                      <p><strong>Capacidad:</strong> {item.datos_completos.capacidad || 'N/A'}</p>
                                      <p><strong>Color:</strong> {item.datos_completos.color || 'N/A'}</p>
                                    </>
                                  )}
                                  <p><strong>Condición:</strong> {item.datos_completos.condicion || 'N/A'}</p>
                                  <p><strong>Sucursal:</strong> {item.datos_completos.sucursal || 'N/A'}</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-800 text-white">
                      <tr>
                        <td colSpan="4" className="px-4 py-3 text-sm font-semibold text-right">SUBTOTAL:</td>
                        <td className="px-4 py-3 text-sm font-semibold text-center">${calcularTotalItems().toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-center">${(parseFloat(formRecibo.costos_adicionales) || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-center">${totalFinal.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* BOTONES DE ACCIÓN */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition-colors font-medium"
              disabled={procesando}
            >
              Cancelar
            </button>
            <button
              onClick={handleFinalizarCompra}
              className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={procesando || items.length === 0 || !formRecibo.proveedor_id}
            >
              {procesando ? 'Procesando...' : 'Finalizar Compra'}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE SELECCIÓN DE DESTINO */}
      {mostrarModalDestino && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded border border-slate-200 max-w-md w-full p-6 space-y-6">
            <h3 className="text-xl font-semibold text-slate-800">Seleccionar Destino</h3>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 border-2 border-slate-300 rounded cursor-pointer hover:border-emerald-600 transition-colors">
                <input
                  type="radio"
                  name="destino"
                  value="stock"
                  checked={destinoSeleccionado === 'stock'}
                  onChange={(e) => setDestinoSeleccionado(e.target.value)}
                  className="mt-1"
                />
                <div>
                  <p className="font-semibold text-slate-800">Stock</p>
                  <p className="text-sm text-slate-600">Los productos quedarán disponibles para venta inmediatamente</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border-2 border-slate-300 rounded cursor-pointer hover:border-emerald-600 transition-colors">
                <input
                  type="radio"
                  name="destino"
                  value="testeo"
                  checked={destinoSeleccionado === 'testeo'}
                  onChange={(e) => setDestinoSeleccionado(e.target.value)}
                  className="mt-1"
                />
                <div>
                  <p className="font-semibold text-slate-800">Testeo</p>
                  <p className="text-sm text-slate-600">Los productos irán a la sección de Testeo para revisión técnica</p>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => setMostrarModalDestino(false)}
                className="px-6 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition-colors font-medium"
                disabled={procesando}
              >
                Cancelar
              </button>
              <button
                onClick={procesarCompraCompleta}
                className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium"
                disabled={procesando}
              >
                {procesando ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO PROVEEDOR */}
      {showNuevoProveedorModal && (
        <NuevoProveedorModal
          onClose={() => setShowNuevoProveedorModal(false)}
          onSuccess={(nuevoProveedor) => {
            setShowNuevoProveedorModal(false);
            setFormRecibo({
              ...formRecibo,
              proveedor_id: nuevoProveedor.id,
              proveedor: nuevoProveedor.nombre
            });
          }}
        />
      )}
    </div>
  );
};

export default NuevaCompraModal;
