import React, { useState, useEffect } from 'react';
import { X, Filter, ChevronDown, Edit, Save, AlertCircle } from 'lucide-react';
import { useCatalogoUnificado } from '../hooks/useCatalogoUnificado';
import { cotizacionService } from '../../../shared/services/cotizacionService';
import ProductModal from '../../../shared/components/base/ProductModal';

// Importar formatter unificado y copyGenerator
import { formatearMonto } from '../../../shared/utils/formatters';
import { generateCopy } from '../../../shared/utils/copyGenerator';

// La función generateUnifiedCopy ahora está unificada en copyGenerator.js

// Modal de detalle unificado

const Catalogo = ({ onAddToCart }) => {
  const {
    categoriaActiva,
    categoriaConfig,
    categorias,
    datos,
    loading,
    error,
    filtros,
    ordenamiento,
    valoresUnicos,
    cambiarCategoria,
    actualizarFiltro,
    limpiarFiltros,
    actualizarOrdenamiento,
    eliminarProducto,
    actualizarProducto,
    totalProductos,
    productosFiltrados,
    hayFiltrosActivos
  } = useCatalogoUnificado();

  const [cotizacionDolar, setCotizacionDolar] = useState(1000);
  const [modalDetalle, setModalDetalle] = useState({ open: false, producto: null });
  const [modalEdit, setModalEdit] = useState({ open: false, producto: null });
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  // Cargar cotización
  useEffect(() => {
    const cargarCotizacion = async () => {
      try {
        const cotizacionData = await cotizacionService.obtenerCotizacionActual();
        setCotizacionDolar(cotizacionData.valor);
      } catch (error) {
        console.error('❌ Error cargando cotización:', error);
      }
    };

    cargarCotizacion();
    const interval = setInterval(cargarCotizacion, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const generateCopyWithPrice = (producto, usePesos = false) => {
    const precio = usePesos 
      ? `${Math.round(producto.precio_venta_usd * cotizacionDolar).toLocaleString('es-AR')}`
      : formatearMonto(producto.precio_venta_usd, 'USD');
    
    // Determinar tipo simple con emoji para botones copy
    let tipoSimple = 'otro_simple';
    if (categoriaActiva === 'notebooks') {
      tipoSimple = 'notebook_simple';
    } else if (categoriaActiva === 'celulares') {
      tipoSimple = 'celular_simple';
    }
    
    const infoBase = generateCopy(producto, { 
      tipo: tipoSimple
    });
    return `${infoBase} - Estado: ${producto.condicion} - Precio: ${precio}`;
  };

  const handleAddToCart = (producto) => {
    if (onAddToCart) {
      // Determinar el tipo según la categoría activa
      let tipo = 'computadora'; // default
      if (categoriaActiva === 'celulares') {
        tipo = 'celular';
      } else if (categoriaActiva === 'otros' || categoriaActiva.startsWith('otros-')) {
        tipo = 'otro';
      } else if (['desktop', 'tablets', 'gpu', 'apple', 'componentes', 'audio'].includes(categoriaActiva)) {
        tipo = 'otro'; // Categorías especiales se clasifican como 'otro'
      }
      
      onAddToCart(producto, tipo);
    }
  };

  // Funciones para el modal de edición
  const openEditModal = (producto) => {
    setModalEdit({ open: true, producto });
    setEditForm({ ...producto });
    setEditError(null);
  };

  const closeEditModal = () => {
    setModalEdit({ open: false, producto: null });
    setEditForm({});
    setEditError(null);
  };

  const handleEditSubmit = async () => {
    try {
      setEditLoading(true);
      setEditError(null);
      
      await actualizarProducto(modalEdit.producto.id, editForm);
      
      closeEditModal();
      alert('✅ Producto actualizado exitosamente');
    } catch (error) {
      console.error('Error actualizando producto:', error);
      setEditError(error.message || 'Error al actualizar el producto');
    } finally {
      setEditLoading(false);
    }
  };

  const updateEditField = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Función para renderizar el formulario de edición según el tipo de producto
  const renderEditForm = () => {
    if (!modalEdit.producto) return null;

    // Formulario específico para notebooks - COMPLETO con TODOS los campos
    if (categoriaActiva === 'notebooks') {
      return (
        <div className="max-h-96 overflow-y-auto">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Editar Notebook - Todos los Campos</h3>
          
          {/* Información básica */}
          <div className="bg-slate-50 p-4 rounded mb-4">
            <h4 className="font-medium text-slate-700 mb-3">Información Básica</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Modelo *</label>
                <input type="text" value={editForm.modelo || ''} onChange={(e) => updateEditField('modelo', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Serial</label>
                <input type="text" value={editForm.serial || ''} onChange={(e) => updateEditField('serial', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                <input type="text" value={editForm.marca || ''} onChange={(e) => updateEditField('marca', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                <input type="text" value={editForm.color || ''} onChange={(e) => updateEditField('color', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Condición</label>
                <select value={editForm.condicion || ''} onChange={(e) => updateEditField('condicion', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500">
                  <option value="">Seleccionar</option>
                  <option value="excelente">Excelente</option>
                  <option value="muy bueno">Muy Bueno</option>
                  <option value="bueno">Bueno</option>
                  <option value="regular">Regular</option>
                  <option value="malo">Malo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sucursal</label>
                <select value={editForm.sucursal || ''} onChange={(e) => updateEditField('sucursal', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500">
                  <option value="">Seleccionar</option>
                  <option value="la_plata">La Plata</option>
                  <option value="caba">CABA</option>
                  <option value="deposito">Depósito</option>
                </select>
              </div>
            </div>
          </div>

          {/* Precios y Costos */}
          <div className="bg-emerald-50 p-4 rounded mb-4">
            <h4 className="font-medium text-slate-700 mb-3">Precios y Costos</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Precio Costo USD</label>
                <input type="number" step="0.01" value={editForm.precio_costo_usd || ''} onChange={(e) => updateEditField('precio_costo_usd', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Precio Costo Total</label>
                <input type="number" step="0.01" value={editForm.precio_costo_total || ''} onChange={(e) => updateEditField('precio_costo_total', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Precio Venta USD *</label>
                <input type="number" step="0.01" value={editForm.precio_venta_usd || ''} onChange={(e) => updateEditField('precio_venta_usd', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Envíos/Repuestos</label>
                <input type="number" step="0.01" value={editForm.envios_repuestos || ''} onChange={(e) => updateEditField('envios_repuestos', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
          </div>

          {/* Especificaciones Técnicas */}
          <div className="bg-slate-50 p-4 rounded mb-4">
            <h4 className="font-medium text-slate-700 mb-3">Especificaciones Técnicas</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Procesador</label>
                <input type="text" value={editForm.procesador || ''} onChange={(e) => updateEditField('procesador', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">RAM</label>
                <input type="text" value={editForm.ram || ''} onChange={(e) => updateEditField('ram', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo RAM</label>
                <input type="text" value={editForm.tipo_ram || ''} onChange={(e) => updateEditField('tipo_ram', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Slots RAM</label>
                <input type="text" value={editForm.slots || ''} onChange={(e) => updateEditField('slots', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">SSD</label>
                <input type="text" value={editForm.ssd || ''} onChange={(e) => updateEditField('ssd', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">HDD</label>
                <input type="text" value={editForm.hdd || ''} onChange={(e) => updateEditField('hdd', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sistema Operativo</label>
                <input type="text" value={editForm.so || ''} onChange={(e) => updateEditField('so', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Placa de Video</label>
                <input type="text" value={editForm.placa_video || ''} onChange={(e) => updateEditField('placa_video', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">VRAM</label>
                <input type="text" value={editForm.vram || ''} onChange={(e) => updateEditField('vram', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
          </div>

          {/* Pantalla y Display */}
          <div className="bg-slate-50 p-4 rounded mb-4">
            <h4 className="font-medium text-slate-700 mb-3">Pantalla y Display</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pantalla</label>
                <input type="text" value={editForm.pantalla || ''} onChange={(e) => updateEditField('pantalla', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Resolución</label>
                <input type="text" value={editForm.resolucion || ''} onChange={(e) => updateEditField('resolucion', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Refresh Rate</label>
                <input type="text" value={editForm.refresh || ''} onChange={(e) => updateEditField('refresh', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Touchscreen</label>
                <select value={editForm.touchscreen || ''} onChange={(e) => updateEditField('touchscreen', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500">
                  <option value="">No especificado</option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
          </div>

          {/* Características Adicionales */}
          <div className="bg-slate-50 p-4 rounded mb-4">
            <h4 className="font-medium text-slate-700 mb-3">Características Adicionales</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teclado Retroiluminado</label>
                <select value={editForm.teclado_retro || ''} onChange={(e) => updateEditField('teclado_retro', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500">
                  <option value="">No especificado</option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Idioma Teclado</label>
                <input type="text" value={editForm.idioma_teclado || ''} onChange={(e) => updateEditField('idioma_teclado', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Batería</label>
                <input type="text" value={editForm.bateria || ''} onChange={(e) => updateEditField('bateria', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Duración Batería</label>
                <input type="text" value={editForm.duracion || ''} onChange={(e) => updateEditField('duracion', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
          </div>

          {/* Estado y Garantía */}
          <div className="bg-slate-50 p-4 rounded mb-4">
            <h4 className="font-medium text-slate-700 mb-3">Estado y Garantía</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Disponible</label>
                <select value={editForm.disponible || ''} onChange={(e) => updateEditField('disponible', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500">
                  <option value="">No especificado</option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Ingreso</label>
                <input type="date" value={editForm.ingreso || ''} onChange={(e) => updateEditField('ingreso', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Garantía Update</label>
                <input type="text" value={editForm.garantia_update || ''} onChange={(e) => updateEditField('garantia_update', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Garantía Oficial</label>
                <input type="text" value={editForm.garantia_oficial || ''} onChange={(e) => updateEditField('garantia_oficial', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Fallas</label>
                <textarea value={editForm.fallas || ''} onChange={(e) => updateEditField('fallas', e.target.value)} rows="2" className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Formulario específico para celulares - COMPLETO con TODOS los campos
    if (categoriaActiva === 'celulares') {
      return (
        <div className="max-h-96 overflow-y-auto">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Editar Celular - Todos los Campos</h3>
          
          {/* Información básica */}
          <div className="bg-slate-50 p-4 rounded mb-4">
            <h4 className="font-medium text-slate-700 mb-3">Información Básica</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Modelo *</label>
                <input type="text" value={editForm.modelo || ''} onChange={(e) => updateEditField('modelo', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Serial</label>
                <input type="text" value={editForm.serial || ''} onChange={(e) => updateEditField('serial', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                <input type="text" value={editForm.marca || ''} onChange={(e) => updateEditField('marca', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                <input type="text" value={editForm.color || ''} onChange={(e) => updateEditField('color', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Condición</label>
                <select value={editForm.condicion || ''} onChange={(e) => updateEditField('condicion', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500">
                  <option value="">Seleccionar</option>
                  <option value="excelente">Excelente</option>
                  <option value="muy bueno">Muy Bueno</option>
                  <option value="bueno">Bueno</option>
                  <option value="regular">Regular</option>
                  <option value="malo">Malo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ubicación</label>
                <select value={editForm.ubicacion || ''} onChange={(e) => updateEditField('ubicacion', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500">
                  <option value="">Seleccionar</option>
                  <option value="la_plata">La Plata</option>
                  <option value="caba">CABA</option>
                  <option value="deposito">Depósito</option>
                </select>
              </div>
            </div>
          </div>

          {/* Precios */}
          <div className="bg-emerald-50 p-4 rounded mb-4">
            <h4 className="font-medium text-slate-700 mb-3">Precios</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Precio Compra USD</label>
                <input type="number" step="0.01" value={editForm.precio_compra_usd || ''} onChange={(e) => updateEditField('precio_compra_usd', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Precio Venta USD *</label>
                <input type="number" step="0.01" value={editForm.precio_venta_usd || ''} onChange={(e) => updateEditField('precio_venta_usd', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Precio Venta Pesos</label>
                <input type="number" step="0.01" value={editForm.precio_venta_pesos || ''} onChange={(e) => updateEditField('precio_venta_pesos', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Repuestos USD</label>
                <input type="number" step="0.01" value={editForm.repuestos_usd || ''} onChange={(e) => updateEditField('repuestos_usd', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
          </div>

          {/* Especificaciones Técnicas */}
          <div className="bg-slate-50 p-4 rounded mb-4">
            <h4 className="font-medium text-slate-700 mb-3">Especificaciones Técnicas</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Almacenamiento</label>
                <input type="text" value={editForm.almacenamiento || ''} onChange={(e) => updateEditField('almacenamiento', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Capacidad</label>
                <input type="text" value={editForm.capacidad || ''} onChange={(e) => updateEditField('capacidad', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Batería %</label>
                <input type="number" min="0" max="100" value={editForm.bateria || ''} onChange={(e) => updateEditField('bateria', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Porcentaje Batería</label>
                <input type="number" min="0" max="100" value={editForm.porcentaje_bateria || ''} onChange={(e) => updateEditField('porcentaje_bateria', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ciclos</label>
                <input type="number" min="0" value={editForm.ciclos || ''} onChange={(e) => updateEditField('ciclos', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                <input type="text" value={editForm.estado || ''} onChange={(e) => updateEditField('estado', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estado Estético</label>
                <input type="text" value={editForm.estado_estetico || ''} onChange={(e) => updateEditField('estado_estetico', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
          </div>

          {/* Estado y Garantía */}
          <div className="bg-slate-50 p-4 rounded mb-4">
            <h4 className="font-medium text-slate-700 mb-3">Estado y Garantía</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Disponible</label>
                <select value={editForm.disponible || ''} onChange={(e) => updateEditField('disponible', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500">
                  <option value="">No especificado</option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Ingreso</label>
                <input type="date" value={editForm.ingreso || ''} onChange={(e) => updateEditField('ingreso', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Garantía</label>
                <input type="text" value={editForm.garantia || ''} onChange={(e) => updateEditField('garantia', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Garantía Update</label>
                <input type="text" value={editForm.garantia_update || ''} onChange={(e) => updateEditField('garantia_update', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Garantía Oficial</label>
                <input type="text" value={editForm.garantia_oficial || ''} onChange={(e) => updateEditField('garantia_oficial', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Fallas</label>
                <textarea value={editForm.fallas || ''} onChange={(e) => updateEditField('fallas', e.target.value)} rows="2" className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Formulario para otros productos - COMPLETO con TODOS los campos
    return (
      <div className="max-h-96 overflow-y-auto">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Editar Producto - Todos los Campos</h3>
        
        {/* Información básica */}
        <div className="bg-slate-50 p-4 rounded mb-4">
          <h4 className="font-medium text-slate-700 mb-3">Información Básica</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Producto *</label>
              <input type="text" value={editForm.nombre_producto || editForm.nombre || ''} onChange={(e) => updateEditField(editForm.hasOwnProperty('nombre_producto') ? 'nombre_producto' : 'nombre', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
              <input type="text" value={editForm.categoria || ''} onChange={(e) => updateEditField('categoria', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
              <input type="text" value={editForm.marca || ''} onChange={(e) => updateEditField('marca', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Condición</label>
              <select value={editForm.condicion || ''} onChange={(e) => updateEditField('condicion', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500">
                <option value="">Seleccionar</option>
                <option value="excelente">Excelente</option>
                <option value="muy bueno">Muy Bueno</option>
                <option value="bueno">Bueno</option>
                <option value="regular">Regular</option>
                <option value="malo">Malo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sucursal</label>
              <select value={editForm.sucursal || ''} onChange={(e) => updateEditField('sucursal', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500">
                <option value="">Seleccionar</option>
                <option value="la_plata">La Plata</option>
                <option value="caba">CABA</option>
                <option value="deposito">Depósito</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Stock/Cantidad</label>
              <input type="number" min="0" value={editForm.cantidad || editForm.stock || ''} onChange={(e) => updateEditField(editForm.hasOwnProperty('cantidad') ? 'cantidad' : 'stock', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
        </div>

        {/* Precios */}
        <div className="bg-emerald-50 p-4 rounded mb-4">
          <h4 className="font-medium text-slate-700 mb-3">Precios</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Precio Compra USD</label>
              <input type="number" step="0.01" value={editForm.precio_compra_usd || ''} onChange={(e) => updateEditField('precio_compra_usd', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Precio Venta USD *</label>
              <input type="number" step="0.01" value={editForm.precio_venta_usd || ''} onChange={(e) => updateEditField('precio_venta_usd', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Precio Venta Pesos</label>
              <input type="number" step="0.01" value={editForm.precio_venta_pesos || ''} onChange={(e) => updateEditField('precio_venta_pesos', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
        </div>

        {/* Estado y Garantía */}
        <div className="bg-slate-50 p-4 rounded mb-4">
          <h4 className="font-medium text-slate-700 mb-3">Estado y Garantía</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Disponible</label>
              <select value={editForm.disponible || ''} onChange={(e) => updateEditField('disponible', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500">
                <option value="">No especificado</option>
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Ingreso</label>
              <input type="date" value={editForm.ingreso || ''} onChange={(e) => updateEditField('ingreso', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Garantía</label>
              <input type="text" value={editForm.garantia || ''} onChange={(e) => updateEditField('garantia', e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Fallas</label>
              <textarea value={editForm.fallas || ''} onChange={(e) => updateEditField('fallas', e.target.value)} rows="2" className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
        </div>

        {/* Descripción */}
        <div className="bg-slate-50 p-4 rounded mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
          <textarea value={editForm.descripcion || ''} onChange={(e) => updateEditField('descripcion', e.target.value)} rows="3" className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
        </div>
      </div>
    );
  };

  return (
    <div className="p-0">

      {/* Selector de categorías */}
      <div className="mb-4 bg-slate-800 rounded border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Categorías de Productos</h3>
          <div className="text-sm text-white">
            {productosFiltrados} de {totalProductos} productos
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {Object.values(categorias).map((cat) => (
            <button
              key={cat.id}
              onClick={() => cambiarCategoria(cat.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded transition-colors ${
                categoriaActiva === cat.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700 text-white hover:bg-slate-200'
              }`}
            >
              <span className="text-lg">{cat.icon}</span>
              <span className="font-medium">{cat.label}</span>
              <span className={`text-xs px-2 py-1 rounded ${
                categoriaActiva === cat.id
                  ? 'bg-slate-200 text-slate-800'
                  : 'bg-slate-300 text-slate-800'
              }`}>
                {cat.data?.length || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-4 bg-white rounded border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Filtros</h3>
          {hayFiltrosActivos && (
            <button
              onClick={limpiarFiltros}
              className="flex items-center space-x-1 px-3 py-1 bg-slate-600 text-white text-sm rounded hover:bg-slate-700 transition-colors"
            >
              <X size={14} />
              <span>Limpiar</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          
          {/* Ordenamiento */}
          <div>
            <label className="block text-xs font-medium text-slate-800 mb-1">Ordenar por</label>
            <select
              value={ordenamiento.campo}
              onChange={(e) => actualizarOrdenamiento(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Sin ordenar</option>
              {categoriaConfig?.camposOrdenamiento?.map(campo => (
                <option key={campo.value} value={campo.value}>
                  {campo.label}
                </option>
              ))}
            </select>
          </div>

          {/* Marca */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Marca</label>
            <select
              value={filtros.marca}
              onChange={(e) => actualizarFiltro('marca', e.target.value)}
              className="w-full p-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Todas</option>
              {valoresUnicos.marcas?.map(marca => (
                <option key={marca} value={marca}>{marca}</option>
              ))}
            </select>
          </div>

          {/* Condición */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Condición</label>
            <select
              value={filtros.condicion}
              onChange={(e) => actualizarFiltro('condicion', e.target.value)}
              className="w-full p-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Todas</option>
              {valoresUnicos.condiciones?.map(condicion => (
                <option key={condicion} value={condicion}>{condicion.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Sucursal/Ubicación */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Ubicación</label>
            <select
              value={filtros.sucursal}
              onChange={(e) => actualizarFiltro('sucursal', e.target.value)}
              className="w-full p-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Todas</option>
              {valoresUnicos.sucursales?.map(sucursal => (
                <option key={sucursal} value={sucursal}>
                  {sucursal.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Categoría para "otros" */}
          {categoriaActiva === 'otros' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Categoría</label>
              <select
                value={filtros.categoria}
                onChange={(e) => actualizarFiltro('categoria', e.target.value)}
                className="w-full p-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Todas</option>
                {valoresUnicos.categorias?.map(categoria => (
                  <option key={categoria} value={categoria}>{categoria}</option>
                ))}
              </select>
            </div>
          )}

          {/* Precio máximo */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Precio máximo</label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="5000"
                step="50"
                value={filtros.precioMax || 0}
                onChange={(e) => actualizarFiltro('precioMax', e.target.value)}
                className="w-full h-2 bg-slate-200 rounded appearance-none cursor-pointer slider"
              />
              <div className="text-xs text-center text-slate-600">
                {filtros.precioMax ? `U${filtros.precioMax}` : 'Sin límite'}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Lista de productos */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2 text-slate-600">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600"></div>
            <span className="text-lg">Cargando {categoriaConfig?.label?.toLowerCase()}...</span>
          </div>
        </div>
      )}
      {error && (
        <div className="bg-slate-100 border border-slate-200 rounded p-4 text-center">
          <p className="text-slate-800 font-medium">Error al cargar {categoriaConfig?.label?.toLowerCase()}</p>
          <p className="text-slate-700 text-sm mt-1">{error}</p>
        </div>
      )}
      
      {!loading && !error && (
        <div className="space-y-3">
          {/* Header */}
          <div className="rounded p-4 grid grid-cols-12 gap-4 bg-slate-800">
            <div className="col-span-4 text-sm font-bold text-white uppercase">Información del Producto</div>
            <div className="col-span-2 text-sm font-bold text-white uppercase">Condición</div>
            <div className="col-span-2 text-sm font-bold text-white uppercase">Precio</div>
            <div className="col-span-2 text-center text-sm font-bold text-white uppercase">Copys</div>
            <div className="col-span-2 text-center text-sm font-bold text-white uppercase">Acciones</div>
          </div>
          
          {/* Productos */}
          {datos.map((producto) => (
            <div 
              key={producto.id} 
              className="group cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-colors duration-200 border border-slate-200 rounded p-4 bg-white grid grid-cols-12 gap-4 items-center shadow-sm hover:shadow-md"
              onClick={() => setModalDetalle({ open: true, producto })}
            >
              {/* Información del producto */}
              <div className="col-span-4">
                {categoriaActiva === 'otros' ? (
                  <div>
                    <div className="text-sm font-medium">
                      {producto.nombre_producto}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {producto.descripcion}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm font-medium">
                      {generateCopy(producto, { 
                        tipo: categoriaActiva === 'notebooks' ? 'notebook_completo' : 
                              categoriaActiva === 'celulares' ? 'celular_completo' : 
                              'otro_completo'
                      })}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {producto.descripcion && <span>{producto.descripcion}</span>}
                      {producto.stock > 0 && <span className="ml-2 text-emerald-600">Stock: {producto.stock}</span>}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Condición */}
              <div className="col-span-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  producto.condicion === 'excelente' ? 'bg-emerald-100 text-emerald-800' :
                  producto.condicion === 'muy bueno' ? 'bg-slate-100 text-slate-800' :
                  producto.condicion === 'bueno' ? 'bg-slate-100 text-slate-800' :
                  producto.condicion === 'regular' ? 'bg-slate-100 text-slate-800' :
                  producto.condicion === 'malo' ? 'bg-slate-100 text-slate-800' :
                  'bg-slate-100 text-slate-800'
                }`}>
                  {producto.condicion?.toUpperCase() || 'N/A'}
                </span>
              </div>
              
              {/* Precio */}
              <div className="col-span-2">
                <div className="text-lg font-bold text-slate-800">
                  {formatearMonto(producto.precio_venta_usd, 'USD')}
                </div>
                <div className="text-xs text-slate-500">
                  ${Math.round(producto.precio_venta_usd * cotizacionDolar).toLocaleString('es-AR')}
                </div>
              </div>
              
              {/* Copys */}
              <div className="col-span-2 flex justify-center space-x-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => navigator.clipboard.writeText(generateCopyWithPrice(producto, false))}
                  className="px-2 py-1 text-white text-[5px] rounded bg-slate-600 hover:bg-slate-700 transition-colors"
                  title="Copiar información USD"
                >
                  USD
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(generateCopyWithPrice(producto, true))}
                  className="px-2 py-1 text-white text-[10px] rounded bg-slate-600 hover:bg-slate-700 transition-colors"
                  title="Copiar información Pesos"
                >
                  ARS
                </button>
              </div>

              {/* Acciones */}
              <div className="col-span-2 flex justify-center space-x-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleAddToCart(producto)}
                  className="px-2 py-1 text-white text-xs rounded bg-slate-600 hover:bg-slate-700 transition-colors"
                  title="Agregar al carrito"
                >
                  <svg className="w-6 h-6 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                  </svg>
                </button>
                <button
                  onClick={() => openEditModal(producto)}
                  className="px-2 py-1 text-white text-xs rounded bg-emerald-600 hover:bg-emerald-700 transition-colors"
                  title="Editar producto"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => eliminarProducto(producto.id)}
                  className="px-2 py-1 text-white text-xs rounded bg-slate-600 hover:bg-slate-700 transition-colors"
                  title="Eliminar producto"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
          
          {datos.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No se encontraron productos con los filtros aplicados
            </div>
          )}
        </div>
      )}

      {/* Modal de detalle unificado */}
      <ProductModal
        isOpen={modalDetalle.open}
        producto={modalDetalle.producto}
        onClose={() => setModalDetalle({ open: false, producto: null })}
        cotizacionDolar={cotizacionDolar}
        tipoProducto={
          categoriaActiva === 'celulares' ? 'celular' :
          categoriaActiva === 'notebooks' ? 'notebook' : 'otro'
        }
      />

      {/* Modal de edición */}
      {modalEdit.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center space-x-2">
                  <Edit size={20} />
                  <span>Editar Producto</span>
                </h2>
                <button
                  onClick={closeEditModal}
                  className="p-2 hover:bg-slate-100 rounded transition-colors"
                  disabled={editLoading}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6">
              {editError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle size={16} className="text-red-600" />
                    <span className="text-red-800 text-sm">{editError}</span>
                  </div>
                </div>
              )}

              {renderEditForm()}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 flex justify-end space-x-4">
              <button
                onClick={closeEditModal}
                disabled={editLoading}
                className="px-4 py-2 text-slate-600 border border-slate-200 rounded hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={editLoading}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {editLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalogo;
