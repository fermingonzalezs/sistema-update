import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Monitor, Smartphone, DollarSign, User, Calendar, Box, Plus } from 'lucide-react';
import { inventarioService, celularesService, otrosService } from '../../../lib/supabase';
import { cotizacionSimple } from '../../../services/cotizacionSimpleService';

const ProcesarVentaSection = ({ onVenta, loading, carrito, onAddToCart }) => {
  const [tipoProducto, setTipoProducto] = useState('computadora');
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [cotizacionDolar, setCotizacionDolar] = useState(1000);

  // Función para formatear precios en USD sin decimales con prefijo U$
  const formatPriceUSD = (price) => {
    const numPrice = parseFloat(price) || 0;
    return `U$${Math.round(numPrice)}`;
  };

  // Cargar cotización al montar el componente
  useEffect(() => {
    cargarCotizacion();
    const interval = setInterval(cargarCotizacion, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Función para cargar cotización desde dolarAPI
  const cargarCotizacion = async () => {
    try {
      const cotizacionData = await cotizacionSimple.obtenerCotizacion();
      setCotizacionDolar(cotizacionData.valor);
    } catch (error) {
      console.error('❌ Error cargando cotización:', error);
    }
  };

  // Calcular totales del carrito
  const calcularTotalUSD = () => {
    return carrito.reduce((total, item) => total + (item.precio_unitario * item.cantidad), 0);
  };

  const calcularTotalPesos = () => {
    return calcularTotalUSD() * cotizacionDolar;
  };

  const calcularCantidadTotal = () => {
    return carrito.reduce((total, item) => total + item.cantidad, 0);
  };

  // Cargar productos cuando cambia el tipo
  useEffect(() => {
    cargarProductos();
  }, [tipoProducto]);

  // Filtrar productos cuando cambia la búsqueda
  useEffect(() => {
    if (!busqueda.trim()) {
      setProductosFiltrados(productos);
    } else {
      const filtrados = productos.filter(producto => {
        const searchTerm = busqueda.toLowerCase();
        return (
          producto.modelo?.toLowerCase().includes(searchTerm) ||
          producto.serial?.toLowerCase().includes(searchTerm) ||
          producto.descripcion_producto?.toLowerCase().includes(searchTerm) ||
          (tipoProducto === 'computadora' && producto.procesador?.toLowerCase().includes(searchTerm))
        );
      });
      setProductosFiltrados(filtrados);
    }
  }, [busqueda, productos]);

  const cargarProductos = async () => {
    setLoadingProductos(true);
    try {
      let data;
      switch (tipoProducto) {
        case 'computadora':
          data = await inventarioService.getAll();
          break;
        case 'celular':
          data = await celularesService.getAll();
          break;
        case 'otro':
          data = await otrosService.getAll();
          break;
        default:
          data = [];
      }
      setProductos(data);
      setProductosFiltrados(data);
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoadingProductos(false);
    }
  };

  const getIconoTipo = (tipo) => {
    switch (tipo) {
      case 'computadora': return <Monitor className="w-4 h-4 text-blue-600" />;
      case 'celular': return <Smartphone className="w-4 h-4 text-green-600" />;
      case 'otro': return <Box className="w-4 h-4 text-purple-600" />;
      default: return <Box className="w-4 h-4 text-gray-600" />;
    }
  };

  const isProductoEnCarrito = (producto) => {
    return carrito.some(item => 
      item.producto.id === producto.id && item.tipo === tipoProducto
    );
  };

  const puedeAgregarMas = (producto) => {
    if (tipoProducto === 'otro') {
      const cantidadEnCarrito = carrito
        .filter(item => item.producto.id === producto.id && item.tipo === tipoProducto)
        .reduce((total, item) => total + item.cantidad, 0);
      return cantidadEnCarrito < producto.cantidad;
    }
    return !isProductoEnCarrito(producto);
  };

  const getCantidadDisponible = (producto) => {
    if (tipoProducto === 'otro') {
      const cantidadEnCarrito = carrito
        .filter(item => item.producto.id === producto.id && item.tipo === tipoProducto)
        .reduce((total, item) => total + item.cantidad, 0);
      return producto.cantidad - cantidadEnCarrito;
    }
    return isProductoEnCarrito(producto) ? 0 : 1;
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header - mantiene el verde */}
      <div className="mb-8 bg-gradient-to-r from-green-700 to-green-500 rounded-2xl p-8 flex items-center justify-between shadow-lg">
        <div>
          <h2 className="text-4xl font-bold text-white drop-shadow">Procesar Venta</h2>
          <p className="text-white/80 text-xl mt-2">Selecciona productos y completa la venta</p>
        </div>
        <div className="text-white">
          <ShoppingCart className="w-12 h-12" />
        </div>
      </div>

      {/* Totales del carrito - arriba del selector de productos */}
      {carrito.length > 0 && (
        <div className="mb-6 bg-white rounded-xl shadow-lg border-2 border-green-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Carrito de Compras</h3>
                <p className="text-sm text-gray-600">{calcularCantidadTotal()} productos agregados</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex flex-col space-y-1">
                <div className="text-2xl font-bold text-blue-600">
                  {formatPriceUSD(calcularTotalUSD())}
                </div>
                <div className="text-lg font-semibold text-green-600">
                  ${calcularTotalPesos().toLocaleString('es-AR')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Selector de tipo de producto - ahora con fondo blanco y bordes coloridos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-gray-800 font-semibold mb-4 flex items-center">
            <Box className="w-5 h-5 mr-2 text-gray-600" />
            Seleccionar Tipo de Producto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                setTipoProducto('computadora');
                setBusqueda('');
              }}
              className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                tipoProducto === 'computadora'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg transform scale-105'
                  : 'border-gray-200 hover:border-blue-300 bg-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Monitor className={`w-6 h-6 ${tipoProducto === 'computadora' ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className="font-medium">Computadoras</span>
              </div>
            </button>
            <button
              onClick={() => {
                setTipoProducto('celular');
                setBusqueda('');
              }}
              className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                tipoProducto === 'celular'
                  ? 'border-green-500 bg-green-50 text-green-700 shadow-lg transform scale-105'
                  : 'border-gray-200 hover:border-green-300 bg-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Smartphone className={`w-6 h-6 ${tipoProducto === 'celular' ? 'text-green-600' : 'text-gray-500'}`} />
                <span className="font-medium">Celulares</span>
              </div>
            </button>
            <button
              onClick={() => {
                setTipoProducto('otro');
                setBusqueda('');
              }}
              className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                tipoProducto === 'otro'
                  ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-lg transform scale-105'
                  : 'border-gray-200 hover:border-purple-300 bg-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Box className={`w-6 h-6 ${tipoProducto === 'otro' ? 'text-purple-600' : 'text-gray-500'}`} />
                <span className="font-medium">Otros</span>
              </div>
            </button>
          </div>
        </div>

        {/* Buscador - ahora más elegante */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-gray-800 font-semibold mb-4 flex items-center">
            <Search className="w-5 h-5 mr-2 text-gray-600" />
            Buscar Productos
          </h3>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`Buscar ${tipoProducto === 'computadora' ? 'computadora' : tipoProducto === 'celular' ? 'celular' : 'producto'} por modelo, serial${tipoProducto === 'computadora' ? ' o procesador' : ''}...`}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white"
            />
          </div>
        </div>

        {/* Lista de productos - diseño más limpio */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200">
            <h3 className="text-gray-800 font-semibold flex items-center">
              <Monitor className="w-5 h-5 mr-2 text-gray-600" />
              {productosFiltrados.length} productos disponibles
              {busqueda && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">"{busqueda}"</span>}
            </h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loadingProductos ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                Cargando productos...
              </div>
            ) : productosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No se encontraron productos</p>
                <p className="text-sm">Intenta con otros términos de búsqueda</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {productosFiltrados.map((producto, index) => {
                  const enCarrito = isProductoEnCarrito(producto);
                  const puedeAgregar = puedeAgregarMas(producto);
                  const cantidadDisponible = getCantidadDisponible(producto);
                  
                  return (
                    <div
                      key={producto.id}
                      className={`p-5 transition-all duration-200 ${
                        enCarrito 
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500' 
                          : index % 2 === 0 
                            ? 'bg-white hover:bg-gray-50' 
                            : 'bg-gray-50/50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            {getIconoTipo(tipoProducto)}
                            <span className="font-semibold text-gray-900 text-lg">
                              {producto.modelo || producto.descripcion_producto}
                            </span>
                            {enCarrito && (
                              <span className="px-3 py-1 bg-green-500 text-white text-xs rounded-full font-medium shadow-sm">
                                ✓ En carrito
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-500 text-xs uppercase tracking-wide">Serial</span>
                              <span className="text-gray-800 font-mono">{producto.serial || 'N/A'}</span>
                            </div>
                            {tipoProducto === 'computadora' && (
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-500 text-xs uppercase tracking-wide">Procesador</span>
                                <span className="text-gray-800">{producto.procesador}</span>
                              </div>
                            )}
                            {tipoProducto === 'celular' && (
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-500 text-xs uppercase tracking-wide">Almacenamiento</span>
                                <span className="text-gray-800">{producto.almacenamiento}</span>
                              </div>
                            )}
                            {tipoProducto === 'otro' && (
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-500 text-xs uppercase tracking-wide">Stock</span>
                                <span className="text-gray-800 font-semibold">{cantidadDisponible}/{producto.cantidad}</span>
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-500 text-xs uppercase tracking-wide">Condición</span>
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium w-fit ${
                                producto.condicion === 'nuevo' ? 'bg-green-100 text-green-800' :
                                producto.condicion === 'usado' ? 'bg-blue-100 text-blue-800' :
                                'bg-orange-100 text-orange-800'
                              }`}>
                                {(producto.condicion || '').toUpperCase()}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-500 text-xs uppercase tracking-wide">Ubicación</span>
                              <span className="text-gray-800">{(producto.sucursal || producto.ubicacion || '').toUpperCase()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6 ml-6">
                          <div className="text-right">
                            <p className="font-bold text-blue-600 text-2xl">
                              {formatPriceUSD(producto.precio_venta_usd)}
                            </p>
                            <p className="text-sm font-medium text-green-600">
                              ${((parseFloat(producto.precio_venta_usd) || 0) * cotizacionDolar).toLocaleString('es-AR')}
                            </p>
                          </div>

                          <button
                            onClick={() => onAddToCart(producto, tipoProducto)}
                            disabled={!puedeAgregar || cantidadDisponible === 0}
                            className={`p-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md ${
                              puedeAgregar && cantidadDisponible > 0
                                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-green-200'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-gray-100'
                            }`}
                            title={
                              cantidadDisponible === 0 
                                ? 'Sin stock disponible'
                                : puedeAgregar 
                                  ? 'Agregar al carrito' 
                                  : 'Ya está en el carrito'
                            }
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Información del carrito - diseño mejorado */}
        {carrito.length > 0 && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-lg mb-2 flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Productos en el carrito
                </h4>
                <p className="text-green-100">
                  {carrito.length} productos • Total: <span className="font-bold text-xl">${carrito.reduce((total, item) => total + (item.precio_unitario * item.cantidad), 0).toFixed(2)}</span>
                </p>
              </div>
              <div className="text-white bg-white/20 p-3 rounded-full">
                <ShoppingCart className="w-8 h-8" />
              </div>
            </div>
            <div className="mt-4 p-3 bg-white/10 rounded-lg">
              <p className="text-sm text-green-100 flex items-center">
                <span className="mr-2">💡</span>
                Haz clic en el carrito flotante para finalizar la venta
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcesarVentaSection;