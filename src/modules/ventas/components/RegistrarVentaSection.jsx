import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  Package,
  Plus,
  Minus,
  Trash2,
  User,
  Tag,
  Laptop,
  Smartphone,
  HardDrive,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import ClienteSelector from './ClienteSelector';
import CarritoWidget from '../../../shared/components/layout/CarritoWidget';
import { useInventario } from '../hooks/useInventario';
import { useCelulares } from '../hooks/useCelulares';
import { useOtros, otrosService } from '../hooks/useOtros';
import { useVentas } from '../hooks/useVentas';
import { supabase } from '../../../lib/supabase';
import {
  CONDICIONES_ARRAY,
  CONDICIONES_LABELS,
  getCondicionColor
} from '../../../shared/constants/productConstants';

const RegistrarVentaSection = () => {
  // Estados principales
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [itemsVenta, setItemsVenta] = useState([]);

  // Estados para selector de productos
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [busquedaProducto, setBusquedaProducto] = useState('');

  // Estados para producto custom (fuera de stock)
  const [productoCustom, setProductoCustom] = useState({
    nombre: '',
    serial: '',
    descripcion: '',
    categoria: 'ACCESORIOS',
    condicion: 'usado',
    precioCompra: '',
    precioVenta: '',
    cantidad: 1,
    sucursal: 'mitre' // Por defecto mitre
  });

  // Estados de carga
  const [creandoProducto, setCreandoProducto] = useState(false);

  // Estado para CarritoWidget
  const [carritoParaPago, setCarritoParaPago] = useState([]);

  // Hooks de datos reales
  const { computers: inventario, loading: loadingInventario, fetchComputers } = useInventario();
  const { celulares, loading: loadingCelulares, fetchCelulares } = useCelulares();
  const { otros, loading: loadingOtros, crearProductoCustom, fetchOtros } = useOtros();
  const { procesarCarrito } = useVentas();

  // Estados locales para manejar los datos
  const [inventarioLocal, setInventarioLocal] = useState([]);
  const [celularesLocal, setCelularesLocal] = useState([]);
  const [otrosLocal, setOtrosLocal] = useState([]);
  const [loadingLocal, setLoadingLocal] = useState(true);

  // Cargar datos directamente desde Supabase
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoadingLocal(true);
        console.log('📡 Cargando datos directamente...');

        // Cargar inventario (notebooks)
        const { data: inventarioData, error: errorInventario } = await supabase
          .from('inventario')
          .select('*')
          .order('created_at', { ascending: false });

        if (errorInventario) {
          console.error('❌ Error cargando inventario:', errorInventario);
        } else {
          setInventarioLocal(inventarioData || []);
          console.log('✅ Inventario cargado:', inventarioData?.length || 0);
        }

        // Cargar celulares
        const { data: celularesData, error: errorCelulares } = await supabase
          .from('celulares')
          .select('*')
          .order('created_at', { ascending: false });

        if (errorCelulares) {
          console.error('❌ Error cargando celulares:', errorCelulares);
        } else {
          setCelularesLocal(celularesData || []);
          console.log('✅ Celulares cargados:', celularesData?.length || 0);
        }

        // Cargar otros
        const { data: otrosData, error: errorOtros } = await supabase
          .from('otros')
          .select('*')
          .order('created_at', { ascending: false });

        if (errorOtros) {
          console.error('❌ Error cargando otros:', errorOtros);
        } else {
          setOtrosLocal(otrosData || []);
          console.log('✅ Otros cargados:', otrosData?.length || 0);
        }

      } catch (error) {
        console.error('❌ Error general cargando datos:', error);
      } finally {
        setLoadingLocal(false);
      }
    };

    cargarDatos();
  }, []);

  // Función para recargar solo la tabla "otros"
  const recargarOtros = async () => {
    try {
      console.log('🔄 Recargando otros...');
      const { data: otrosData, error: errorOtros } = await supabase
        .from('otros')
        .select('*')
        .order('created_at', { ascending: false });

      if (errorOtros) {
        console.error('❌ Error recargando otros:', errorOtros);
      } else {
        setOtrosLocal(otrosData || []);
        console.log('✅ Otros recargados:', otrosData?.length || 0);
      }
    } catch (error) {
      console.error('❌ Error general recargando otros:', error);
    }
  };

  // Debug: Logs para verificar datos
  useEffect(() => {
    console.log('🔍 Debug RegistrarVenta - Estado de datos:');
    console.log('💻 Inventario (notebooks):', {
      loading: loadingInventario,
      data: inventario,
      count: inventario?.length || 0
    });
    console.log('📱 Celulares:', {
      loading: loadingCelulares,
      data: celulares,
      count: celulares?.length || 0
    });
    console.log('📦 Otros:', {
      loading: loadingOtros,
      data: otros,
      count: otros?.length || 0
    });
  }, [inventario, celulares, otros, loadingInventario, loadingCelulares, loadingOtros]);

  // Categorías de productos
  const categorias = [
    { id: 'notebooks', nombre: 'Notebooks', icon: Laptop },
    { id: 'celulares', nombre: 'Celulares', icon: Smartphone },
    { id: 'otros', nombre: 'Otros', icon: HardDrive },
    { id: 'custom', nombre: 'Item fuera de stock', icon: Tag }
  ];

  // Datos reales de productos desde estado local (bypass de hooks problemáticos)
  const productosStock = {
    notebooks: inventarioLocal?.map(item => ({
      ...item,
      precio: item.precio_venta_usd,
      stock: 1, // Las computadoras son únicas
      descripcion: item.modelo || item.serial,
      // Asegurar que todos los campos estén disponibles para la búsqueda
      procesador: item.procesador || '',
      ram: item.ram || '',
      ssd: item.ssd || '',
      hdd: item.hdd || '',
      marca: item.marca || '',
      so: item.so || '',
      condicion: item.condicion || 'usado',
      estado: item.estado || ''
    })) || [],
    celulares: celularesLocal?.map(item => ({
      ...item,
      precio: item.precio_venta_usd,
      stock: 1, // Los celulares son únicos
      descripcion: `${item.marca || ''} ${item.modelo || ''} ${item.capacidad || ''} ${item.color || ''}`.trim(),
      // Asegurar que todos los campos estén disponibles para la búsqueda
      marca: item.marca || '',
      modelo: item.modelo || '',
      capacidad: item.capacidad || '',
      color: item.color || '',
      bateria: item.bateria || '',
      condicion: item.condicion || 'usado'
    })) || [],
    otros: otrosLocal?.map(item => ({
      ...item,
      precio: parseFloat(item.precio_venta_usd) || 0,
      precio_venta_usd: parseFloat(item.precio_venta_usd) || 0,
      stock: (item.cantidad_la_plata || 0) + (item.cantidad_mitre || 0),
      descripcion: item.descripcion || item.nombre_producto,
      categoria: item.categoria // Asegurar que la categoría esté disponible
    })) || []
  };

  // Debug: productos stock mapeados desde datos locales
  useEffect(() => {
    console.log('📊 Debug productosStock (datos locales):', {
      notebooks: productosStock.notebooks?.length || 0,
      celulares: productosStock.celulares?.length || 0,
      otros: productosStock.otros?.length || 0,
      otros_con_categoria: productosStock.otros?.filter(p => p.categoria).length || 0,
      ejemplos_otros: productosStock.otros?.slice(0, 3).map(p => ({
        id: p.id,
        nombre: p.nombre_producto,
        categoria: p.categoria
      })),
      inventarioLocalLength: inventarioLocal?.length || 0,
      celularesLocalLength: celularesLocal?.length || 0,
      otrosLocalLength: otrosLocal?.length || 0,
      loadingLocal
    });
  }, [inventarioLocal, celularesLocal, otrosLocal, loadingLocal]);

  // Función mejorada de filtrado por categoría
  const filtrarProductos = (productos, termino, categoria) => {
    if (!termino) return productos;

    const terminoLower = termino.toLowerCase();

    return productos.filter(producto => {
      // Búsqueda básica en todos los productos
      const descripcionMatch = producto.descripcion?.toLowerCase().includes(terminoLower);
      const serialMatch = producto.serial?.toLowerCase().includes(terminoLower);

      if (categoria === 'notebooks') {
        // Para notebooks: buscar también en modelo, procesador, RAM, SSD, marca
        const modeloMatch = producto.modelo?.toLowerCase().includes(terminoLower);
        const procesadorMatch = producto.procesador?.toLowerCase().includes(terminoLower);
        const ramMatch = producto.ram?.toLowerCase().includes(terminoLower);
        const ssdMatch = producto.ssd?.toLowerCase().includes(terminoLower);
        const hddMatch = producto.hdd?.toLowerCase().includes(terminoLower);
        const marcaMatch = producto.marca?.toLowerCase().includes(terminoLower);
        const soMatch = producto.so?.toLowerCase().includes(terminoLower);

        return descripcionMatch || serialMatch || modeloMatch || procesadorMatch ||
               ramMatch || ssdMatch || hddMatch || marcaMatch || soMatch;

      } else if (categoria === 'celulares') {
        // Para celulares: buscar en modelo, marca, capacidad, color
        const modeloMatch = producto.modelo?.toLowerCase().includes(terminoLower);
        const marcaMatch = producto.marca?.toLowerCase().includes(terminoLower);
        const capacidadMatch = producto.capacidad?.toLowerCase().includes(terminoLower);
        const colorMatch = producto.color?.toLowerCase().includes(terminoLower);

        return descripcionMatch || serialMatch || modeloMatch || marcaMatch ||
               capacidadMatch || colorMatch;

      } else if (categoria === 'otros') {
        // Para otros: buscar en nombre_producto y categoría
        const nombreMatch = producto.nombre_producto?.toLowerCase().includes(terminoLower);
        const categoriaMatch = producto.categoria?.toLowerCase().includes(terminoLower);

        return descripcionMatch || serialMatch || nombreMatch || categoriaMatch;
      }

      // Fallback para cualquier otra categoría
      return descripcionMatch || serialMatch;
    });
  };

  // Productos filtrados según categoría y búsqueda
  const productosFiltrados = categoriaSeleccionada && categoriaSeleccionada !== 'custom' && productosStock[categoriaSeleccionada]
    ? filtrarProductos(productosStock[categoriaSeleccionada], busquedaProducto, categoriaSeleccionada)
    : [];

  // Funciones para manejar items de venta
  const agregarProductoStock = (producto) => {
    // Determinar el tipo según la categoría actual
    let tipoProducto = 'otro';
    let categoria = null; // Nueva propiedad para categorías específicas

    if (categoriaSeleccionada === 'notebooks') {
      tipoProducto = 'computadora';
    } else if (categoriaSeleccionada === 'celulares') {
      tipoProducto = 'celular';
    } else if (categoriaSeleccionada === 'otros') {
      tipoProducto = 'otro';
      // Para productos "otros", capturar la categoría específica del producto normalizada en MAYÚSCULAS
      categoria = producto.categoria ? producto.categoria.toUpperCase() : 'ACCESORIOS';
    }

    const itemExistente = itemsVenta.find(item => item.id === producto.id && item.tipo === tipoProducto);

    if (itemExistente) {
      setItemsVenta(prev => prev.map(item =>
        item.id === producto.id && item.tipo === tipoProducto
          ? { ...item, cantidad: Math.min(item.cantidad + 1, producto.stock) }
          : item
      ));
    } else {
      // Determinar el precio correcto según el tipo de producto
      const precioUnitario = producto.precio_venta_usd || producto.precio || 0;

      console.log('🛒 Agregando producto al carrito:', {
        id: producto.id,
        descripcion: producto.descripcion || producto.modelo,
        tipo: tipoProducto,
        categoria: categoria,
        categoria_producto_original: producto.categoria,
        categoriaSeleccionada: categoriaSeleccionada,
        precio_venta_usd: producto.precio_venta_usd,
        precio: producto.precio,
        precioUnitario: precioUnitario
      });

      // ALERTA SI LA CATEGORÍA ES NULL/UNDEFINED
      if (tipoProducto === 'otro' && !categoria) {
        console.error('⚠️ PROBLEMA: Producto "otro" sin categoría!', {
          producto_id: producto.id,
          producto_nombre: producto.nombre_producto || producto.descripcion,
          producto_categoria_bd: producto.categoria,
          categoria_final: categoria
        });
      }

      setItemsVenta(prev => [...prev, {
        id: producto.id,
        tipo: tipoProducto,
        categoria: categoria, // Agregar categoría específica
        cantidad: 1,
        total: precioUnitario,
        precio_unitario: precioUnitario, // CRÍTICO: Usar precio_venta_usd para otros productos
        descripcion: producto.descripcion || producto.modelo || producto.nombre_producto,
        serial: producto.serial,
        producto: producto // Datos completos del producto para la venta
      }]);
    }
  };

  const agregarProductoCustom = async () => {
    if (!productoCustom.nombre) {
      alert('El nombre del producto es requerido');
      return;
    }

    if (!productoCustom.serial) {
      alert('El serial es requerido');
      return;
    }

    if (!productoCustom.descripcion) {
      alert('La descripción es requerida');
      return;
    }

    if (!productoCustom.categoria) {
      alert('La categoría es requerida');
      return;
    }

    if (!productoCustom.precioVenta || !productoCustom.precioCompra) {
      alert('Los precios de compra y venta son requeridos');
      return;
    }

    setCreandoProducto(true);

    try {
      // Crear el producto en la base de datos
      const nuevoProducto = await crearProductoCustom({
        nombre_producto: productoCustom.nombre,
        serial: productoCustom.serial,
        descripcion: productoCustom.descripcion,
        categoria: productoCustom.categoria,
        condicion: productoCustom.condicion,
        precio_compra: parseFloat(productoCustom.precioCompra),
        precio_venta: parseFloat(productoCustom.precioVenta),
        cantidad: parseInt(productoCustom.cantidad),
        sucursal: productoCustom.sucursal // Agregar sucursal
      });

      console.log('✅ Producto custom creado:', nuevoProducto);

      // Agregar al carrito con la cantidad ingresada
      const cantidadIngresada = parseInt(productoCustom.cantidad) || 1;
      const precioUnitario = nuevoProducto.precio_venta_usd || 0;

      const itemCarrito = {
        id: nuevoProducto.id,
        serial: nuevoProducto.nombre_producto,
        descripcion: nuevoProducto.descripcion,
        precio: precioUnitario,
        stock: nuevoProducto.cantidad_la_plata + nuevoProducto.cantidad_mitre,
        condicion: nuevoProducto.condicion,
        tipo: 'otro', // CORREGIDO: Debe ser singular para que coincida con useVentas
        categoria: nuevoProducto.categoria ? nuevoProducto.categoria.toUpperCase() : 'ACCESORIOS', // Categoría normalizada en MAYÚSCULAS
        cantidad: cantidadIngresada,
        total: precioUnitario * cantidadIngresada,
        precio_unitario: precioUnitario, // CRÍTICO: Agregar precio_unitario
        producto: nuevoProducto // Datos completos del producto
      };

      setItemsVenta(prev => [...prev, itemCarrito]);

      // Recargar datos de otros para que aparezca en el selector
      await recargarOtros();

      // Limpiar formulario
      setProductoCustom({
        nombre: '',
        serial: '',
        descripcion: '',
        categoria: 'ACCESORIOS',
        condicion: 'usado',
        precioCompra: '',
        precioVenta: '',
        cantidad: 1,
        sucursal: 'mitre' // Mantener sucursal por defecto
      });

      alert('✅ Producto creado y agregado al carrito exitosamente');

    } catch (error) {
      console.error('❌ Error creando producto custom:', error);
      alert(`Error creando producto: ${error.message}`);
    } finally {
      setCreandoProducto(false);
    }
  };

  const modificarCantidad = (itemId, tipo, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarItem(itemId, tipo);
      return;
    }

    setItemsVenta(prev => prev.map(item =>
      item.id === itemId && item.tipo === tipo
        ? { ...item, cantidad: nuevaCantidad, total: nuevaCantidad * item.precio_unitario }
        : item
    ));
  };

  const eliminarItem = (itemId, tipo) => {
    setItemsVenta(prev => prev.filter(item => !(item.id === itemId && item.tipo === tipo)));
  };

  const totalVenta = itemsVenta.reduce((sum, item) => sum + item.total, 0);

  const handleProcederCarrito = () => {
    if (!clienteSeleccionado) {
      alert('Debe seleccionar un cliente');
      return;
    }
    if (itemsVenta.length === 0) {
      alert('Debe agregar al menos un producto');
      return;
    }

    // Transferir datos al CarritoWidget para procesamiento de pago
    console.log('🛒 Transfiriendo al CarritoWidget:', {
      cliente: clienteSeleccionado,
      items: itemsVenta,
      total: totalVenta
    });

    // Preparar datos para CarritoWidget - formato compatible
    const carritoFormateado = itemsVenta.map(item => {
      const precioFinal = item.precio_unitario || item.precio_venta_usd || item.precio || 0;

      console.log('💰 Formateando item para CarritoWidget:', {
        id: item.id,
        descripcion: item.descripcion,
        precio_unitario_original: item.precio_unitario,
        precio_venta_usd: item.precio_venta_usd,
        precio: item.precio,
        precioFinal: precioFinal,
        itemCompleto: item
      });

      return {
        ...item,
        // Asegurar compatibilidad con CarritoWidget
        precio_unitario: precioFinal,
        precio_original: precioFinal,
        // Agregar información del cliente seleccionado para cada item
        cliente_seleccionado: clienteSeleccionado
      };
    });

    console.log('🎯 Carrito formateado completo:', carritoFormateado);
    setCarritoParaPago(carritoFormateado);
  };

  // Funciones para CarritoWidget
  const handleUpdateCantidad = (itemId, cantidad) => {
    setCarritoParaPago(prev => prev.map(item =>
      item.id === itemId ? { ...item, cantidad: cantidad } : item
    ));
  };

  const handleUpdatePrecio = (itemId, nuevoPrecio) => {
    setCarritoParaPago(prev => prev.map(item =>
      item.id === itemId ? { ...item, precio_unitario: nuevoPrecio, total: nuevoPrecio * item.cantidad } : item
    ));
  };

  const handleRemoverItem = (itemId) => {
    setCarritoParaPago(prev => prev.filter(item => item.id !== itemId));
  };

  const handleLimpiarCarrito = () => {
    setCarritoParaPago([]);
    // Opcional: también limpiar el carrito local
    setItemsVenta([]);
    setClienteSeleccionado(null);
  };

  const handleProcesarVentaFinal = async (carrito, datosCliente) => {
    try {
      console.log('🛒 Procesando venta final:', {
        cliente: datosCliente,
        items: carrito,
        total: carrito.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0)
      });

      // Crear función callback para refrescar inventarios
      const refrescarInventarios = async () => {
        console.log('🔄 Refrescando inventarios en RegistrarVentaSection...')
        await Promise.all([
          fetchComputers(),
          fetchCelulares(),
          fetchOtros()
        ])
        console.log('✅ Inventarios refrescados en RegistrarVentaSection')
      }

      // Pasar callback a procesarCarrito
      const transaccion = await procesarCarrito(carrito, datosCliente, refrescarInventarios);

      console.log('✅ Transacción procesada:', transaccion);

      // Limpiar todos los carritos después de la venta exitosa
      setCarritoParaPago([]);
      setItemsVenta([]);
      setClienteSeleccionado(null);

      alert(`✅ Venta procesada exitosamente!\nTransacción: ${transaccion.numero_transaccion}`);

      return transaccion;
    } catch (error) {
      console.error('❌ Error procesando venta:', error);
      throw error; // CarritoWidget manejará el error
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded border border-slate-200">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-semibold">Registrar Venta</h2>
                <p className="text-slate-300 mt-1">Seleccionar productos y proceder al carrito</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-300">Items seleccionados</div>
              <div className="text-2xl font-bold">{itemsVenta.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Selector de Cliente */}
      <div className="bg-white rounded border border-slate-200">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-800">Cliente</h3>
          </div>
        </div>
        <div className="p-6">
          <ClienteSelector
            selectedCliente={clienteSeleccionado}
            onSelectCliente={setClienteSeleccionado}
            required={true}
            placeholder="Seleccionar cliente o crear nuevo..."
          />
        </div>
      </div>

      {/* Layout principal: Selector de productos (izq) + Items seleccionados (der) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* COLUMNA IZQUIERDA: Selector de Productos */}
        <div className="space-y-4">
          {/* Categorías */}
          <div className="bg-white rounded border border-slate-200">
            <div className="p-4 bg-slate-800 text-white">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <h3 className="font-semibold">Seleccionar Productos</h3>
              </div>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {categorias.map((categoria) => {
                  const IconComponent = categoria.icon;
                  return (
                    <button
                      key={categoria.id}
                      onClick={() => {
                        setCategoriaSeleccionada(categoria.id);
                        setBusquedaProducto('');
                      }}
                      className={`p-3 rounded border transition-colors text-center ${
                        categoriaSeleccionada === categoria.id
                          ? 'bg-slate-100 border-slate-500 text-slate-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <IconComponent className="w-6 h-6 mx-auto mb-1" />
                      <div className="text-xs font-medium">{categoria.nombre}</div>
                    </button>
                  );
                })}
              </div>

              {/* Búsqueda */}
              {categoriaSeleccionada && categoriaSeleccionada !== 'custom' && (
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder={
                      categoriaSeleccionada === 'notebooks'
                        ? "Buscar por modelo, procesador, RAM, SSD, marca..."
                        : categoriaSeleccionada === 'celulares'
                        ? "Buscar por marca, modelo, capacidad, color..."
                        : categoriaSeleccionada === 'otros'
                        ? "Buscar por nombre, categoría, descripción..."
                        : "Buscar producto..."
                    }
                    value={busquedaProducto}
                    onChange={(e) => setBusquedaProducto(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
                  />
                </div>
              )}

              {/* Contador de resultados */}
              {categoriaSeleccionada && categoriaSeleccionada !== 'custom' && busquedaProducto && (
                <div className="text-xs text-slate-500 mb-2">
                  {productosFiltrados.length} resultado{productosFiltrados.length !== 1 ? 's' : ''} encontrado{productosFiltrados.length !== 1 ? 's' : ''}
                </div>
              )}

              {/* Lista de productos o formulario custom */}
              <div className="space-y-2">
                {!categoriaSeleccionada ? (
                  <div className="text-center py-8 text-slate-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>Selecciona una categoría para ver productos</p>
                  </div>
                ) : loadingLocal && categoriaSeleccionada !== 'custom' ? (
                  <div className="text-center py-8 text-slate-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-3"></div>
                    <p>Cargando productos...</p>
                  </div>
                ) : categoriaSeleccionada === 'custom' ? (
                  /* Formulario para item fuera de stock */
                  <div className="space-y-3">
                    {/* Primera fila: Nombre - Serial */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Nombre del Producto *
                        </label>
                        <input
                          type="text"
                          value={productoCustom.nombre}
                          onChange={(e) => setProductoCustom(prev => ({ ...prev, nombre: e.target.value }))}
                          className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
                          placeholder="Ej: Mouse Logitech, Cable USB-C, etc."
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Serial/Código *
                        </label>
                        <input
                          type="text"
                          value={productoCustom.serial}
                          onChange={(e) => setProductoCustom(prev => ({ ...prev, serial: e.target.value }))}
                          className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
                          placeholder="Ej: MON001, SN123456, etc."
                          required
                        />
                      </div>
                    </div>

                    {/* Segunda fila: Descripción - Categoría */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Descripción *
                        </label>
                        <input
                          type="text"
                          value={productoCustom.descripcion}
                          onChange={(e) => setProductoCustom(prev => ({ ...prev, descripcion: e.target.value }))}
                          className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
                          placeholder="Descripción detallada del producto"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Categoría *
                        </label>
                        <select
                          value={productoCustom.categoria}
                          onChange={(e) => setProductoCustom(prev => ({ ...prev, categoria: e.target.value }))}
                          className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
                          required
                        >
                          <option value="ACCESORIOS">Accesorios</option>
                          <option value="MONITORES">Monitores</option>
                          <option value="COMPONENTES">Componentes</option>
                          <option value="FUNDAS_TEMPLADOS">Fundas y Templados</option>
                          <option value="TABLETS">Tablets</option>
                          <option value="APPLE">Apple</option>
                          <option value="MOUSE_TECLADOS">Mouse y Teclados</option>
                          <option value="AUDIO">Audio</option>
                          <option value="ALMACENAMIENTO">Almacenamiento</option>
                          <option value="CAMARAS">Cámaras</option>
                          <option value="CONSOLAS">Consolas</option>
                          <option value="GAMING">Gaming</option>
                          <option value="DRONES">Drones</option>
                          <option value="WATCHES">Watches</option>
                          <option value="PLACAS_VIDEO">Placas de Video</option>
                          <option value="STREAMING">Streaming</option>
                          <option value="REDES">Redes</option>
                          <option value="BAGS_CASES">Bags y Cases</option>
                          <option value="CABLES_CARGADORES">Cables y Cargadores</option>
                          <option value="REPUESTOS">Repuestos</option>
                        </select>
                      </div>
                    </div>

                    {/* Tercera fila: Condición - Cantidad - Sucursal */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Condición *
                        </label>
                        <select
                          value={productoCustom.condicion}
                          onChange={(e) => setProductoCustom(prev => ({ ...prev, condicion: e.target.value }))}
                          className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
                          required
                        >
                          {CONDICIONES_ARRAY.map(condicion => (
                            <option key={condicion} value={condicion}>
                              {CONDICIONES_LABELS[condicion]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Cantidad *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={productoCustom.cantidad}
                          onChange={(e) => setProductoCustom(prev => ({ ...prev, cantidad: e.target.value }))}
                          className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
                          placeholder="1"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Sucursal *
                        </label>
                        <select
                          value={productoCustom.sucursal}
                          onChange={(e) => setProductoCustom(prev => ({ ...prev, sucursal: e.target.value }))}
                          className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
                          required
                        >
                          <option value="mitre">MITRE</option>
                          <option value="la_plata">LA PLATA</option>
                        </select>
                      </div>
                    </div>

                    {/* Cuarta fila: Precio Compra - Precio Venta */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Precio Compra USD *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={productoCustom.precioCompra}
                          onChange={(e) => setProductoCustom(prev => ({ ...prev, precioCompra: e.target.value }))}
                          className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
                          placeholder="0.00"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Precio Venta USD *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={productoCustom.precioVenta}
                          onChange={(e) => setProductoCustom(prev => ({ ...prev, precioVenta: e.target.value }))}
                          className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>

                    <button
                      onClick={agregarProductoCustom}
                      disabled={creandoProducto}
                      className="w-full bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      {creandoProducto ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Creando...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Crear y Agregar</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : productosFiltrados.length === 0 ? (
                  <div className="text-center py-4 text-slate-500">
                    <p>No se encontraron productos</p>
                  </div>
                ) : (
                  productosFiltrados.map((producto) => {
                    // Función para generar información específica por categoría
                    const getInfoEspecifica = (prod, categoria) => {
                      if (categoria === 'notebooks' || categoria === 'celulares') {
                        // Para notebooks y celulares: solo mostrar SERIAL - CONDICIÓN
                        const condicionLabel = CONDICIONES_LABELS[prod.condicion] || prod.condicion;
                        return `${prod.serial} - ${condicionLabel}`;
                      } else if (categoria === 'otros') {
                        const specs = [];
                        if (prod.categoria) specs.push(prod.categoria);
                        if (prod.nombre_producto && prod.nombre_producto !== prod.descripcion) specs.push(prod.nombre_producto);
                        return specs.length > 0 ? specs.slice(0, 2).join(' • ') : '';
                      }
                      return '';
                    };

                    const infoEspecifica = getInfoEspecifica(producto, categoriaSeleccionada);

                    return (
                      <div
                        key={producto.id}
                        className="flex items-center justify-between bg-slate-50 p-3 rounded border border-slate-200 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-slate-800 text-sm">{producto.descripcion}</div>

                          {/* Primera línea: Info específica */}
                          {infoEspecifica && (
                            <div className="text-xs text-slate-600 mt-1">
                              {infoEspecifica}
                            </div>
                          )}

                          {/* Segunda línea: Info general (solo para "otros") */}
                          {categoriaSeleccionada === 'otros' && (
                            <div className="text-xs text-slate-500 mt-1">
                              {producto.serial} • {producto.stock}
                              {producto.condicion && (
                                <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${getCondicionColor(producto.condicion)}`}>
                                  {CONDICIONES_LABELS[producto.condicion] || producto.condicion}
                                </span>
                              )}
                              {producto.estado && ` • ${producto.estado}`}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <div className="text-right">
                            <div className="font-semibold text-slate-800">${producto.precio}</div>
                          </div>
                          <button
                            onClick={() => agregarProductoStock(producto)}
                            disabled={producto.stock <= 0}
                            className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white p-1.5 rounded transition-colors"
                            title={producto.stock > 0 ? "Agregar al carrito" : "Sin stock"}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: Items Seleccionados */}
        <div className="bg-white rounded border border-slate-200">
          <div className="p-4 bg-slate-800 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5" />
                <h3 className="font-semibold">Items Seleccionados</h3>
              </div>
              <span className="text-slate-300 text-sm">
                {itemsVenta.length} item{itemsVenta.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="p-4">
            {itemsVenta.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No hay items seleccionados</p>
                <p className="text-sm">Agrega productos desde el selector de la izquierda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {itemsVenta.map((item) => (
                  <div key={`${item.id}-${item.tipo}`} className="flex items-center justify-between bg-slate-50 p-3 rounded border border-slate-200">
                    <div className="flex-1">
                      <div className="font-medium text-slate-800 text-sm">{item.descripcion}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {item.serial} • ${item.precio_unitario} c/u
                        {item.tipo === 'custom' && <span className="ml-2 bg-slate-600 text-white px-1 py-0.5 rounded text-xs">CUSTOM</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => modificarCantidad(item.id, item.tipo, item.cantidad - 1)}
                          className="text-slate-600 hover:text-slate-800 p-1"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.cantidad}</span>
                        <button
                          onClick={() => modificarCantidad(item.id, item.tipo, item.cantidad + 1)}
                          className="text-slate-600 hover:text-slate-800 p-1"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-right min-w-16">
                        <div className="font-semibold text-slate-800">${item.total}</div>
                      </div>
                      <button
                        onClick={() => eliminarItem(item.id, item.tipo)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div className="border-t border-slate-200 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <div className="text-lg font-semibold text-slate-800">Total:</div>
                    <div className="text-2xl font-bold text-slate-800">${totalVenta}</div>
                  </div>
                </div>

                {/* Botón proceder */}
                <button
                  onClick={handleProcederCarrito}
                  disabled={!clienteSeleccionado || itemsVenta.length === 0}
                  className="w-full bg-slate-700 hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded font-medium transition-colors flex items-center justify-center space-x-2 mt-4"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Procesar Pago</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CarritoWidget para procesamiento de pago */}
      <CarritoWidget
        carrito={carritoParaPago}
        onUpdateCantidad={handleUpdateCantidad}
        onUpdatePrecio={handleUpdatePrecio}
        onRemover={handleRemoverItem}
        onLimpiar={handleLimpiarCarrito}
        onProcesarVenta={handleProcesarVentaFinal}
        clienteInicial={clienteSeleccionado}
      />
    </div>
  );
};

export default RegistrarVentaSection;