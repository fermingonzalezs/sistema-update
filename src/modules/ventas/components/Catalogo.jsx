import React, { useState, useEffect } from 'react';
import { X, Filter, ChevronDown, Edit, Save, AlertCircle, Search, CheckCircle } from 'lucide-react';
import { useCatalogoUnificado } from '../hooks/useCatalogoUnificado';
import { cotizacionService } from '../../../shared/services/cotizacionService';
import ProductModal from '../../../shared/components/base/ProductModal';
import ModalProducto from '../../../shared/components/modals/ModalProducto';
import { supabase } from '../../../lib/supabase';

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
  const [modalEdit, setModalEdit] = useState({ open: false, producto: null, tipo: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editSuccess, setEditSuccess] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [categoriasOtros, setCategoriasOtros] = useState([]);

  // Cargar cotización y categorías
  useEffect(() => {
    const cargarCotizacion = async () => {
      try {
        const cotizacionData = await cotizacionService.obtenerCotizacionActual();
        setCotizacionDolar(cotizacionData.valor);
      } catch (error) {
        console.error('❌ Error cargando cotización:', error);
      }
    };

    const cargarCategoriasOtros = async () => {
      try {
        console.log('🔍 Cargando categorías de otros...');
        const { data, error } = await supabase
          .from('otros')
          .select('categoria')
          .not('categoria', 'is', null);
        
        if (error) {
          console.error('❌ Error en query categorías:', error);
          throw error;
        }
        
        console.log('📊 Datos categorías recibidos:', data);
        const categoriasUnicas = [...new Set(data.map(item => item.categoria))].sort();
        console.log('📝 Categorías únicas:', categoriasUnicas);
        setCategoriasOtros(categoriasUnicas);
      } catch (err) {
        console.error('❌ Error cargando categorías:', err);
      }
    };

    cargarCotizacion();
    cargarCategoriasOtros();
    const interval = setInterval(cargarCotizacion, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const generateCopyWithPrice = (producto, usePesos = false) => {
    const precio = usePesos 
      ? `${Math.round(producto.precio_venta_usd * cotizacionDolar).toLocaleString('es-AR')}`
      : formatearMonto(producto.precio_venta_usd, 'USD');
    
    let infoBase;
    
    if (categoriaActiva === 'otros' || categoriaActiva.startsWith('otros-')) {
      // Para otros productos: formato simple nombre - descripción
      const nombre = producto.nombre_producto || 'Sin nombre';
      const descripcion = producto.descripcion ? ` - ${producto.descripcion}` : '';
      infoBase = `📦 ${nombre}${descripcion}`;
    } else {
      // Para notebooks y celulares: usar copy completo con emoji
      let tipoSimple = 'notebook_simple';
      if (categoriaActiva === 'celulares') {
        tipoSimple = 'celular_simple';
      }
      
      infoBase = generateCopy(producto, { 
        tipo: tipoSimple
      });
    }
    
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
    const tipo = categoriaActiva === 'celulares' ? 'celular' :
                 categoriaActiva === 'notebooks' ? 'notebook' : 'otros';
    
    // Función para normalizar sucursal a valores válidos
    const normalizarSucursal = (sucursal) => {
      const sucursalLower = (sucursal || '').toLowerCase();
      // Mapear sucursales viejas a nuevas
      if (sucursalLower.includes('quilmes') || sucursalLower.includes('san') || sucursalLower.includes('martin')) {
        return 'la_plata'; // Por defecto quilmes/san martin -> la plata
      }
      if (sucursalLower.includes('deposito') || sucursalLower.includes('mitre')) {
        return 'mitre';
      }
      // Si ya es un valor válido, mantenerlo
      if (sucursalLower === 'la_plata' || sucursalLower === 'mitre') {
        return sucursalLower;
      }
      // Por defecto, asignar la plata
      return 'la_plata';
    };
    
    // Inicializar el formulario con los datos del producto según el tipo
    if (tipo === 'notebook') {
      setEditForm({
        // Campos básicos
        modelo: producto.modelo || '',
        serial: producto.serial || '',
        marca: producto.marca || '',
        color: producto.color || '',
        condicion: producto.condicion || '',
        sucursal: normalizarSucursal(producto.sucursal),
        
        // Precios y costos
        precio_costo_usd: producto.precio_costo_usd || '',
        precio_costo_total: producto.precio_costo_total || '',
        precio_venta_usd: producto.precio_venta_usd || '',
        envios_repuestos: producto.envios_repuestos || '',
        
        // Especificaciones técnicas
        procesador: producto.procesador || '',
        ram: producto.ram || '',
        tipo_ram: producto.tipo_ram || '',
        slots: producto.slots || '',
        ssd: producto.ssd || '',
        hdd: producto.hdd || '',
        so: producto.so || '',
        placa_video: producto.placa_video || '',
        vram: producto.vram || '',
        
        // Pantalla y display
        pantalla: producto.pantalla || '',
        resolucion: producto.resolucion || '',
        refresh: producto.refresh || '',
        touchscreen: producto.touchscreen || false,
        
        // Características adicionales
        teclado_retro: producto.teclado_retro || '',
        idioma_teclado: producto.idioma_teclado || '',
        bateria: producto.bateria || '',
        duracion: producto.duracion || '',
        
        // Estado y garantía
        disponible: producto.disponible || true,
        ingreso: producto.ingreso || '',
        garantia_update: producto.garantia_update || '',
        garantia_oficial: producto.garantia_oficial || '',
        fallas: producto.fallas || ''
      });
    } else if (tipo === 'celular') {
      setEditForm({
        // Campos básicos
        modelo: producto.modelo || '',
        serial: producto.serial || '',
        marca: producto.marca || '',
        color: producto.color || '',
        condicion: producto.condicion || '',
        sucursal: normalizarSucursal(producto.sucursal),
        
        // Precios
        precio_compra_usd: producto.precio_compra_usd || '',
        precio_venta_usd: producto.precio_venta_usd || '',
        
        // Especificaciones técnicas
        capacidad: producto.capacidad || '',
        estado: producto.estado || '',
        bateria: producto.bateria || '',
        ciclos: producto.ciclos || '',
        
        // Estado y garantía
        disponible: producto.disponible || true,
        garantia: producto.garantia || '',
        fallas: producto.fallas || ''
      });
    } else {
      setEditForm({
        // Campos básicos
        nombre_producto: producto.nombre_producto || '',
        categoria: producto.categoria || '',
        descripcion: producto.descripcion || '',
        cantidad_la_plata: producto.cantidad_la_plata || 0,
        cantidad_mitre: producto.cantidad_mitre || 0,
        condicion: producto.condicion || 'nuevo',
        
        // Precios
        precio_compra_usd: producto.precio_compra_usd || '',
        precio_venta_usd: producto.precio_venta_usd || '',
        
        // Estado y garantía
        garantia: producto.garantia || '',
        observaciones: producto.observaciones || ''
      });
    }
    
    setModalEdit({ open: true, producto, tipo });
    setEditError(null);
    setEditSuccess(null);
  };

  const closeEditModal = () => {
    setModalEdit({ open: false, producto: null, tipo: '' });
    setEditForm({});
    setEditError(null);
    setEditSuccess(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      // Validaciones básicas
      if (modalEdit.tipo === 'otros' && !editForm.nombre_producto) {
        throw new Error('El nombre del producto es obligatorio');
      }
      
      if ((modalEdit.tipo === 'notebook' || modalEdit.tipo === 'celular') && !editForm.modelo) {
        throw new Error('El modelo es obligatorio');
      }
      
      if (!editForm.precio_venta_usd || editForm.precio_venta_usd <= 0) {
        throw new Error('El precio debe ser mayor a 0');
      }

      // Preparar datos para actualización según el tipo
      let datosActualizados = {
        updated_at: new Date().toISOString()
      };

      if (modalEdit.tipo === 'notebook') {
        datosActualizados = {
          ...datosActualizados,
          // Campos básicos
          modelo: editForm.modelo,
          serial: editForm.serial,
          marca: editForm.marca,
          color: editForm.color,
          condicion: editForm.condicion,
          sucursal: editForm.sucursal,
          
          // Precios y costos
          precio_costo_usd: editForm.precio_costo_usd ? parseFloat(editForm.precio_costo_usd) : null,
          precio_costo_total: editForm.precio_costo_total ? parseFloat(editForm.precio_costo_total) : null,
          precio_venta_usd: parseFloat(editForm.precio_venta_usd),
          envios_repuestos: editForm.envios_repuestos ? parseFloat(editForm.envios_repuestos) : null,
          
          // Especificaciones técnicas
          procesador: editForm.procesador,
          ram: editForm.ram,
          tipo_ram: editForm.tipo_ram,
          slots: editForm.slots,
          ssd: editForm.ssd,
          hdd: editForm.hdd,
          so: editForm.so,
          placa_video: editForm.placa_video,
          vram: editForm.vram,
          
          // Pantalla y display
          pantalla: editForm.pantalla,
          resolucion: editForm.resolucion,
          refresh: editForm.refresh,
          touchscreen: editForm.touchscreen,
          
          // Características adicionales
          teclado_retro: editForm.teclado_retro,
          idioma_teclado: editForm.idioma_teclado,
          bateria: editForm.bateria,
          duracion: editForm.duracion,
          
          // Estado y garantía
          disponible: editForm.disponible,
          ingreso: editForm.ingreso,
          garantia_update: editForm.garantia_update,
          garantia_oficial: editForm.garantia_oficial,
          fallas: editForm.fallas
        };
      } else if (modalEdit.tipo === 'celular') {
        datosActualizados = {
          ...datosActualizados,
          // Campos básicos
          modelo: editForm.modelo,
          serial: editForm.serial,
          marca: editForm.marca,
          color: editForm.color,
          condicion: editForm.condicion,
          sucursal: editForm.sucursal,
          
          // Precios
          precio_compra_usd: editForm.precio_compra_usd ? parseFloat(editForm.precio_compra_usd) : null,
          precio_venta_usd: parseFloat(editForm.precio_venta_usd),
          
          // Especificaciones técnicas
          capacidad: editForm.capacidad,
          estado: editForm.estado,
          bateria: editForm.bateria,
          ciclos: editForm.ciclos,
          
          // Estado y garantía
          disponible: editForm.disponible,
          garantia: editForm.garantia,
          fallas: editForm.fallas
        };
      } else {
        // Productos "otros"
        datosActualizados = {
          ...datosActualizados,
          // Campos básicos
          nombre_producto: editForm.nombre_producto,
          categoria: editForm.categoria,
          descripcion: editForm.descripcion,
          cantidad_la_plata: editForm.cantidad_la_plata ? parseInt(editForm.cantidad_la_plata) : 0,
          cantidad_mitre: editForm.cantidad_mitre ? parseInt(editForm.cantidad_mitre) : 0,
          condicion: editForm.condicion,
          
          // Precios
          precio_compra_usd: editForm.precio_compra_usd ? parseFloat(editForm.precio_compra_usd) : null,
          precio_venta_usd: parseFloat(editForm.precio_venta_usd),
          
          // Estado y garantía
          garantia: editForm.garantia,
          observaciones: editForm.observaciones
        };
      }

      console.log('🔄 Actualizando producto:', modalEdit.producto.id, datosActualizados);

      // Actualizar usando la función del hook
      await actualizarProducto(modalEdit.producto.id, datosActualizados);

      console.log('✅ Producto actualizado exitosamente');
      
      // Mostrar mensaje de éxito
      const tipoProducto = modalEdit.tipo === 'notebook' ? 'Notebook' : 
                          modalEdit.tipo === 'celular' ? 'Celular' : 'Producto';
      setEditSuccess(`${tipoProducto} actualizado correctamente`);
      
      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        closeEditModal();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error actualizando producto:', error);
      setEditError(error.message || 'Error actualizando el producto');
    } finally {
      setEditLoading(false);
    }
  };

  // Manejar cambios en el formulario de edición
  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderEditForm = () => {
    if (!modalEdit.producto) return null;
    
    // Debug de categorías
    console.log('🎨 Estado categorías en render:', categoriasOtros, 'Length:', categoriasOtros.length);

    if (modalEdit.tipo === 'notebook') {
      return (
        <form id="edit-product-form" onSubmit={handleEditSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="bg-slate-50 p-4 rounded border">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Información Básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Modelo *</label>
                <input
                  type="text"
                  value={editForm.modelo}
                  onChange={(e) => handleEditFormChange('modelo', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: ThinkPad E14"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Serial</label>
                <input
                  type="text"
                  value={editForm.serial}
                  onChange={(e) => handleEditFormChange('serial', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Número de serie"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Marca *</label>
                <input
                  type="text"
                  value={editForm.marca}
                  onChange={(e) => handleEditFormChange('marca', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: Lenovo, HP, Dell"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                <input
                  type="text"
                  value={editForm.color}
                  onChange={(e) => handleEditFormChange('color', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Color del equipo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Condición</label>
                <select
                  value={editForm.condicion}
                  onChange={(e) => {
                    const nuevaCondicion = e.target.value;
                    handleEditFormChange('condicion', nuevaCondicion);
                    // Actualizar disponibilidad automáticamente
                    const condicionesNoDisponibles = ['reparacion', 'reservado', 'prestado', 'sin_reparacion'];
                    const esNoDisponible = condicionesNoDisponibles.includes(nuevaCondicion);
                    handleEditFormChange('disponible', !esNoDisponible);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Seleccionar...</option>
                  <option value="nuevo">NUEVO</option>
                  <option value="refurbished">REFURBISHED</option>
                  <option value="usado">USADO</option>
                  <option value="reparacion">REPARACIÓN</option>
                  <option value="reservado">RESERVADO</option>
                  <option value="prestado">PRESTADO</option>
                  <option value="sin_reparacion">SIN REPARACIÓN</option>
                  <option value="en_preparacion">EN PREPARACIÓN</option>
                  <option value="otro">OTRO</option>
                  <option value="uso_oficina">USO OFICINA</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Sucursal</label>
                <select
                  value={editForm.sucursal}
                  onChange={(e) => handleEditFormChange('sucursal', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Seleccionar...</option>
                  <option value="la_plata">LA PLATA</option>
                  <option value="mitre">MITRE</option>
                </select>
              </div>
            </div>
          </div>

          {/* Precios y costos */}
          <div className="bg-slate-50 p-4 rounded border">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Precios y Costos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Precio Costo USD</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.precio_costo_usd}
                  onChange={(e) => handleEditFormChange('precio_costo_usd', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Precio Costo Total</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.precio_costo_total}
                  onChange={(e) => handleEditFormChange('precio_costo_total', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Precio Venta USD *</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.precio_venta_usd}
                  onChange={(e) => handleEditFormChange('precio_venta_usd', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Envíos y Repuestos</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.envios_repuestos}
                  onChange={(e) => handleEditFormChange('envios_repuestos', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Especificaciones técnicas */}
          <div className="bg-slate-50 p-4 rounded border">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Especificaciones Técnicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Procesador</label>
                <input
                  type="text"
                  value={editForm.procesador}
                  onChange={(e) => handleEditFormChange('procesador', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: Intel Core i5-1135G7"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">RAM</label>
                <input
                  type="text"
                  value={editForm.ram}
                  onChange={(e) => handleEditFormChange('ram', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: 8GB"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipo RAM</label>
                <input
                  type="text"
                  value={editForm.tipo_ram}
                  onChange={(e) => handleEditFormChange('tipo_ram', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: DDR4, DDR5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Slots</label>
                <input
                  type="text"
                  value={editForm.slots}
                  onChange={(e) => handleEditFormChange('slots', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: 2x4GB"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">SSD</label>
                <input
                  type="text"
                  value={editForm.ssd}
                  onChange={(e) => handleEditFormChange('ssd', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: 256GB NVMe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">HDD</label>
                <input
                  type="text"
                  value={editForm.hdd}
                  onChange={(e) => handleEditFormChange('hdd', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: 1TB"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Sistema Operativo</label>
                <input
                  type="text"
                  value={editForm.so}
                  onChange={(e) => handleEditFormChange('so', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: Windows 11 Pro"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Placa de Video</label>
                <input
                  type="text"
                  value={editForm.placa_video}
                  onChange={(e) => handleEditFormChange('placa_video', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: NVIDIA GTX 1650"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">VRAM</label>
                <input
                  type="text"
                  value={editForm.vram}
                  onChange={(e) => handleEditFormChange('vram', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: 4GB GDDR6"
                />
              </div>
            </div>
          </div>

          {/* Pantalla y display */}
          <div className="bg-slate-50 p-4 rounded border">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Pantalla y Display</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Pantalla</label>
                <input
                  type="text"
                  value={editForm.pantalla}
                  onChange={(e) => handleEditFormChange('pantalla', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: 14 pulgadas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Resolución</label>
                <input
                  type="text"
                  value={editForm.resolucion}
                  onChange={(e) => handleEditFormChange('resolucion', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: 1920x1080"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Refresh Rate</label>
                <input
                  type="text"
                  value={editForm.refresh}
                  onChange={(e) => handleEditFormChange('refresh', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: 60Hz"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Touchscreen</label>
                <select
                  value={editForm.touchscreen}
                  onChange={(e) => handleEditFormChange('touchscreen', e.target.value === 'true')}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={false}>No</option>
                  <option value={true}>Sí</option>
                </select>
              </div>
            </div>
          </div>

          {/* Características adicionales */}
          <div className="bg-slate-50 p-4 rounded border">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Características Adicionales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Teclado Retroiluminado</label>
                <input
                  type="text"
                  value={editForm.teclado_retro}
                  onChange={(e) => handleEditFormChange('teclado_retro', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Sí/No"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Idioma Teclado</label>
                <input
                  type="text"
                  value={editForm.idioma_teclado}
                  onChange={(e) => handleEditFormChange('idioma_teclado', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: Español, Inglés"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Batería</label>
                <input
                  type="text"
                  value={editForm.bateria}
                  onChange={(e) => handleEditFormChange('bateria', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: 3 celdas, 45Wh"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Duración</label>
                <input
                  type="text"
                  value={editForm.duracion}
                  onChange={(e) => handleEditFormChange('duracion', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: 6 horas"
                />
              </div>
            </div>
          </div>

          {/* Estado y garantía */}
          <div className="bg-slate-50 p-4 rounded border">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Estado y Garantía</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Disponible</label>
                <select
                  value={editForm.disponible}
                  onChange={(e) => handleEditFormChange('disponible', e.target.value === 'true')}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={true}>Disponible</option>
                  <option value={false}>No disponible</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Fecha Ingreso</label>
                <input
                  type="date"
                  value={editForm.ingreso}
                  onChange={(e) => handleEditFormChange('ingreso', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Garantía Update</label>
                <input
                  type="text"
                  value={editForm.garantia_update}
                  onChange={(e) => handleEditFormChange('garantia_update', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: 6 meses"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Garantía Oficial</label>
                <input
                  type="text"
                  value={editForm.garantia_oficial}
                  onChange={(e) => handleEditFormChange('garantia_oficial', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: 12 meses"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Fallas</label>
                <textarea
                  value={editForm.fallas}
                  onChange={(e) => handleEditFormChange('fallas', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Descripción de fallas conocidas..."
                />
              </div>
            </div>
          </div>

          {/* Vista previa del precio en pesos */}
          {editForm.precio_venta_usd && (
            <div className="bg-emerald-50 p-4 rounded border border-emerald-200">
              <p className="text-sm text-slate-600">
                <strong>Precio en pesos:</strong> ${Math.round(editForm.precio_venta_usd * cotizacionDolar).toLocaleString('es-AR')}
              </p>
              <p className="text-xs text-slate-500">
                Cotización: ${cotizacionDolar}
              </p>
            </div>
          )}
        </form>
      );
    } else if (modalEdit.tipo === 'celular') {
      return (
        <form id="edit-product-form" onSubmit={handleEditSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="bg-slate-50 p-4 rounded border">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Información Básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Modelo *</label>
                <input
                  type="text"
                  value={editForm.modelo}
                  onChange={(e) => handleEditFormChange('modelo', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: iPhone 13"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Serial</label>
                <input
                  type="text"
                  value={editForm.serial}
                  onChange={(e) => handleEditFormChange('serial', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Número de serie"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Marca *</label>
                <input
                  type="text"
                  value={editForm.marca}
                  onChange={(e) => handleEditFormChange('marca', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: Apple, Samsung"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                <input
                  type="text"
                  value={editForm.color}
                  onChange={(e) => handleEditFormChange('color', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Color del dispositivo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Condición</label>
                <select
                  value={editForm.condicion}
                  onChange={(e) => {
                    const nuevaCondicion = e.target.value;
                    handleEditFormChange('condicion', nuevaCondicion);
                    // Actualizar disponibilidad automáticamente
                    const condicionesNoDisponibles = ['reparacion', 'reservado', 'prestado', 'sin_reparacion'];
                    const esNoDisponible = condicionesNoDisponibles.includes(nuevaCondicion);
                    handleEditFormChange('disponible', !esNoDisponible);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Seleccionar...</option>
                  <option value="nuevo">NUEVO</option>
                  <option value="refurbished">REFURBISHED</option>
                  <option value="usado">USADO</option>
                  <option value="reparacion">REPARACIÓN</option>
                  <option value="reservado">RESERVADO</option>
                  <option value="prestado">PRESTADO</option>
                  <option value="sin_reparacion">SIN REPARACIÓN</option>
                  <option value="en_preparacion">EN PREPARACIÓN</option>
                  <option value="otro">OTRO</option>
                  <option value="uso_oficina">USO OFICINA</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Sucursal</label>
                <select
                  value={editForm.sucursal}
                  onChange={(e) => handleEditFormChange('sucursal', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Seleccionar...</option>
                  <option value="la_plata">LA PLATA</option>
                  <option value="mitre">MITRE</option>
                </select>
              </div>
            </div>
          </div>

          {/* Precios */}
          <div className="bg-slate-50 p-4 rounded border">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Precios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Precio Compra USD</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.precio_compra_usd}
                  onChange={(e) => handleEditFormChange('precio_compra_usd', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Precio Venta USD *</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.precio_venta_usd}
                  onChange={(e) => handleEditFormChange('precio_venta_usd', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          {/* Especificaciones técnicas */}
          <div className="bg-slate-50 p-4 rounded border">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Especificaciones Técnicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Capacidad</label>
                <input
                  type="text"
                  value={editForm.capacidad}
                  onChange={(e) => handleEditFormChange('capacidad', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: 128GB, 256GB"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Estado</label>
                <input
                  type="text"
                  value={editForm.estado}
                  onChange={(e) => handleEditFormChange('estado', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Estado general del dispositivo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Batería</label>
                <input
                  type="text"
                  value={editForm.bateria}
                  onChange={(e) => handleEditFormChange('bateria', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: 85%, Buena"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ciclos</label>
                <input
                  type="text"
                  value={editForm.ciclos}
                  onChange={(e) => handleEditFormChange('ciclos', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: 500 ciclos"
                />
              </div>
            </div>
          </div>

          {/* Estado y garantía */}
          <div className="bg-slate-50 p-4 rounded border">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Estado y Garantía</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Disponible</label>
                <select
                  value={editForm.disponible}
                  onChange={(e) => handleEditFormChange('disponible', e.target.value === 'true')}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={true}>Disponible</option>
                  <option value={false}>No disponible</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Garantía</label>
                <input
                  type="text"
                  value={editForm.garantia}
                  onChange={(e) => handleEditFormChange('garantia', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: 3 meses"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Fallas</label>
                <textarea
                  value={editForm.fallas}
                  onChange={(e) => handleEditFormChange('fallas', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Descripción de fallas conocidas..."
                />
              </div>
            </div>
          </div>

          {/* Vista previa del precio en pesos */}
          {editForm.precio_venta_usd && (
            <div className="bg-emerald-50 p-4 rounded border border-emerald-200">
              <p className="text-sm text-slate-600">
                <strong>Precio en pesos:</strong> ${Math.round(editForm.precio_venta_usd * cotizacionDolar).toLocaleString('es-AR')}
              </p>
              <p className="text-xs text-slate-500">
                Cotización: ${cotizacionDolar}
              </p>
            </div>
          )}
        </form>
      );
    } else {
      // Formulario para productos "otros"
      return (
        <form id="edit-product-form" onSubmit={handleEditSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="bg-slate-50 p-4 rounded border">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Información Básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nombre del Producto *</label>
                <input
                  type="text"
                  value={editForm.nombre_producto}
                  onChange={(e) => handleEditFormChange('nombre_producto', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: Mouse Logitech"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Categoría</label>
                <select
                  value={editForm.categoria}
                  onChange={(e) => handleEditFormChange('categoria', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Seleccionar categoría...</option>
                  {categoriasOtros.length > 0 ? (
                    categoriasOtros.map(categoria => (
                      <option key={categoria} value={categoria}>
                        {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                      </option>
                    ))
                  ) : (
                    <option disabled>Cargando categorías...</option>
                  )}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Descripción</label>
                <textarea
                  value={editForm.descripcion}
                  onChange={(e) => handleEditFormChange('descripcion', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Descripción detallada del producto..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cantidad La Plata</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.cantidad_la_plata}
                  onChange={(e) => handleEditFormChange('cantidad_la_plata', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cantidad Mitre</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.cantidad_mitre}
                  onChange={(e) => handleEditFormChange('cantidad_mitre', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Condición</label>
                <select
                  value={editForm.condicion}
                  onChange={(e) => handleEditFormChange('condicion', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Seleccionar...</option>
                  <option value="nuevo">NUEVO</option>
                  <option value="usado">USADO</option>
                  <option value="reacondicionado">REACONDICIONADO</option>
                  <option value="defectuoso">DEFECTUOSO</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Garantía</label>
                <input
                  type="text"
                  value={editForm.garantia}
                  onChange={(e) => handleEditFormChange('garantia', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: 3 meses, 1 año"
                />
              </div>
            </div>
          </div>

          {/* Precios */}
          <div className="bg-slate-50 p-4 rounded border">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Precios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Precio Compra USD</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.precio_compra_usd}
                  onChange={(e) => handleEditFormChange('precio_compra_usd', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Precio Venta USD *</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.precio_venta_usd}
                  onChange={(e) => handleEditFormChange('precio_venta_usd', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div className="bg-slate-50 p-4 rounded border">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Observaciones</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Observaciones</label>
              <textarea
                value={editForm.observaciones}
                onChange={(e) => handleEditFormChange('observaciones', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Observaciones adicionales sobre el producto..."
              />
            </div>
            {cotizacionDolar > 0 && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded">
                <p className="text-sm text-emerald-700">
                  💱 Precio estimado en pesos: ${editForm.precio_venta_usd ? Math.round(editForm.precio_venta_usd * cotizacionDolar).toLocaleString('es-AR') : '0'} |
                  Cotización: ${cotizacionDolar}
                </p>
              </div>
            )}
          </div>
        </form>
      );
    }
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
          
          {/* Búsqueda */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Búsqueda</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Serial o modelo..."
                value={filtros.busqueda || ''}
                onChange={(e) => actualizarFiltro('busqueda', e.target.value)}
                className="w-full pl-8 pr-2 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          
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

          {/* Estado */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Estado</label>
            <select
              value={filtros.estado}
              onChange={(e) => actualizarFiltro('estado', e.target.value)}
              className="w-full p-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Todos</option>
              {valoresUnicos.estados?.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
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
              <option value="la_plata">LA PLATA</option>
              <option value="mitre">MITRE</option>
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
          {categoriaActiva === 'otros' || categoriaActiva.startsWith('otros-') ? (
            // Header para otros productos - mostrar stock por sucursal
            <div className="rounded p-4 grid grid-cols-13 gap-4 bg-slate-800">
              <div className="col-span-3 text-sm font-bold text-white uppercase">Información del Producto</div>
              <div className="col-span-1 text-center text-sm font-bold text-white uppercase">Mitre</div>
              <div className="col-span-1 text-center text-sm font-bold text-white uppercase">La Plata</div>
              <div className="col-span-1 text-sm font-bold text-white uppercase">Condición</div>
              <div className="col-span-2 text-sm font-bold text-white uppercase">Precio</div>
              <div className="col-span-2 text-center text-sm font-bold text-white uppercase">Copys</div>
              <div className="col-span-3 text-center text-sm font-bold text-white uppercase">Acciones</div>
            </div>
          ) : (
            // Header para notebooks y celulares - mostrar serial y sucursal
            <div className="rounded p-4 grid grid-cols-13 gap-6 bg-slate-800">
              <div className="col-span-3 text-sm font-bold text-white uppercase">Información del Producto</div>
              <div className="col-span-2 text-sm font-bold text-white uppercase">Serial</div>
              <div className="col-span-1 text-sm font-bold text-white uppercase">Condición</div>
              <div className="col-span-1 text-sm font-bold text-white uppercase">Sucursal</div>
              <div className="col-span-2 text-sm font-bold text-white uppercase">Precio</div>
              <div className="col-span-2 text-center text-sm font-bold text-white uppercase">Copys</div>
              <div className="col-span-2 text-center text-sm font-bold text-white uppercase">Acciones</div>
            </div>
          )}
          
          {/* Productos */}
          {datos.map((producto) => (
            <div 
              key={producto.id} 
              className={`group cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-colors duration-200 border border-slate-200 rounded p-4 bg-white grid items-center shadow-sm hover:shadow-md ${categoriaActiva === 'otros' || categoriaActiva.startsWith('otros-') ? 'grid-cols-13 gap-4' : 'grid-cols-13 gap-6'}`}
              onClick={() => setModalDetalle({ open: true, producto })}
            >
              {/* Información del producto */}
              <div className="col-span-3">
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
                      {categoriaActiva === 'otros' || categoriaActiva.startsWith('otros-') ? (
                        // Para otros productos: solo nombre - descripción
                        <>
                          <span>{producto.nombre_producto || 'Sin nombre'}</span>
                          {producto.descripcion && (
                            <span> - {producto.descripcion}</span>
                          )}
                        </>
                      ) : (
                        // Para notebooks y celulares: copy completo
                        generateCopy(producto, { 
                          tipo: categoriaActiva === 'notebooks' ? 'notebook_completo' : 'celular_completo'
                        })
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {(categoriaActiva === 'notebooks' || categoriaActiva === 'celulares') && producto.descripcion && <span>{producto.descripcion}</span>}
                      {producto.stock > 0 && <span className="ml-2 text-emerald-600">Stock: {producto.stock}</span>}
                    </div>
                  </div>
                )}
              </div>
              
              {categoriaActiva === 'otros' || categoriaActiva.startsWith('otros-') ? (
                // Columnas para otros productos - mostrar stock por sucursal
                <>
                  {/* Stock Mitre */}
                  <div className="col-span-1 text-center">
                    <span className={`px-2 py-1 text-sm font-medium rounded ${
                      (producto.cantidad_mitre || 0) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {producto.cantidad_mitre || 0}
                    </span>
                  </div>
                  
                  {/* Stock La Plata */}
                  <div className="col-span-1 text-center">
                    <span className={`px-2 py-1 text-sm font-medium rounded ${
                      (producto.cantidad_la_plata || 0) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {producto.cantidad_la_plata || 0}
                    </span>
                  </div>
                  
                  {/* Condición */}
                  <div className="col-span-1 flex justify-center">
                    <div className="space-y-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        (() => {
                          const condicion = (producto.condicion || '').toLowerCase().trim();
                          if (condicion === 'nuevo') return 'bg-emerald-100 text-emerald-800';
                          if (condicion === 'usado') return 'bg-yellow-100 text-yellow-800';
                          if (condicion === 'reacondicionado') return 'bg-blue-100 text-blue-800';
                          if (condicion === 'defectuoso') return 'bg-red-100 text-red-800';
                          return 'bg-slate-100 text-slate-800';
                        })()
                      }`}>
                        {(producto.condicion || 'NUEVO').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                // Columnas para notebooks y celulares - mostrar serial, condición y sucursal
                <>
                  {/* Serial */}
                  <div className="col-span-2">
                    <div className="text-sm text-slate-700">
                      {producto.serial || producto.imei || 'N/A'}
                    </div>
                  </div>
                  
                  {/* Condición */}
                  <div className="col-span-1 flex justify-center">
                    <div className="space-y-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        (() => {
                          const condicion = (producto.condicion || producto.estado || '').toLowerCase().trim();
                          if (condicion === 'nuevo') return 'bg-emerald-100 text-emerald-800';
                          if (condicion === 'excelente') return 'bg-emerald-100 text-emerald-800';
                          if (condicion === 'refurbished' || condicion === 'reacondicionado') return 'bg-blue-100 text-blue-800';
                          if (condicion === 'muy bueno') return 'bg-blue-100 text-blue-800';
                          if (condicion === 'usado') return 'bg-yellow-100 text-yellow-800';
                          if (condicion === 'bueno') return 'bg-yellow-100 text-yellow-800';
                          if (condicion === 'regular') return 'bg-orange-100 text-orange-800';
                          if (condicion === 'reparacion' || condicion === 'reparación') return 'bg-red-100 text-red-800';
                          if (condicion === 'reservado') return 'bg-purple-100 text-purple-800';
                          if (condicion === 'prestado') return 'bg-cyan-100 text-cyan-800';
                          if (condicion === 'sin_reparacion' || condicion === 'sin reparación') return 'bg-gray-100 text-gray-800';
                          return 'bg-slate-100 text-slate-800';
                        })()
                      }`}>
                        {(producto.condicion || producto.estado || 'N/A').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Sucursal */}
                  <div className="col-span-1 flex justify-center">
                    <div className="space-y-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        (producto.sucursal === 'la_plata' || producto.ubicacion === 'la_plata') ? 'bg-blue-100 text-blue-800' :
                        (producto.sucursal === 'mitre' || producto.ubicacion === 'mitre') ? 'bg-green-100 text-green-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {(() => {
                          const sucursal = producto.sucursal || producto.ubicacion || 'N/A';
                          if (sucursal === 'la_plata') return 'LA PLATA';
                          if (sucursal === 'mitre') return 'MITRE';
                          // Mapear sucursales viejas para visualización
                          if (sucursal.toLowerCase().includes('quilmes') || sucursal.toLowerCase().includes('san') || sucursal.toLowerCase().includes('martin')) return 'LA PLATA';
                          if (sucursal.toLowerCase().includes('deposito')) return 'MITRE';
                          return sucursal.toUpperCase();
                        })()}
                      </span>
                    </div>
                  </div>
                </>
              )}
              
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
              <div className={`${categoriaActiva === 'otros' || categoriaActiva.startsWith('otros-') ? 'col-span-3' : 'col-span-2'} flex justify-center space-x-1`} onClick={(e) => e.stopPropagation()}>
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
                  onClick={() => {
                    const producto_info = producto.modelo || producto.marca || 'este producto';
                    if (window.confirm(`¿Estás seguro que deseas eliminar "${producto_info}"?\n\nEsta acción no se puede deshacer.`)) {
                      eliminarProducto(producto.id);
                    }
                  }}
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

              {editSuccess && (
                <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle size={16} className="text-emerald-600" />
                    <span className="text-emerald-800 text-sm">{editSuccess}</span>
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
                type="submit"
                form="edit-product-form"
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
