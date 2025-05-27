import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Monitor, Smartphone, DollarSign, User, Calendar, Box, Plus } from 'lucide-react';
import { inventarioService, celularesService, otrosService } from '../lib/supabase';

const ProcesarVentaSection = ({ onVenta, loading, carrito, onAddToCart }) => {
  const [tipoProducto, setTipoProducto] = useState('computadora');
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loadingProductos, setLoadingProductos] = useState(false);

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
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <ShoppingCart className="w-8 h-8 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-800">Vender Productos</h2>
        </div>
        {carrito.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            <span className="text-green-800 font-medium">
              🛒 {carrito.length} productos en carrito
            </span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Selector de tipo de producto */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Seleccionar Tipo de Producto</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                setTipoProducto('computadora');
                setBusqueda('');
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                tipoProducto === 'computadora'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Monitor className="w-6 h-6" />
                <span className="font-medium">Computadoras</span>
              </div>
            </button>
            <button
              onClick={() => {
                setTipoProducto('celular');
                setBusqueda('');
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                tipoProducto === 'celular'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Smartphone className="w-6 h-6" />
                <span className="font-medium">Celulares</span>
              </div>
            </button>
            <button
              onClick={() => {
                setTipoProducto('otro');
                setBusqueda('');
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                tipoProducto === 'otro'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Box className="w-6 h-6" />
                <span className="font-medium">Otros</span>
              </div>
            </button>
          </div>
        </div>

        {/* Buscador */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Buscar Productos</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`Buscar ${tipoProducto === 'computadora' ? 'computadora' : tipoProducto === 'celular' ? 'celular' : 'producto'} por modelo, serial${tipoProducto === 'computadora' ? ' o procesador' : ''}...`}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Lista de productos */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-700">
              {loadingProductos ? 'Cargando...' : `${productosFiltrados.length} productos disponibles`}
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
                <p>No se encontraron productos</p>
                <p className="text-sm">Intenta con otros términos de búsqueda</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {productosFiltrados.map((producto) => {
                  const enCarrito = isProductoEnCarrito(producto);
                  const puedeAgregar = puedeAgregarMas(producto);
                  const cantidadDisponible = getCantidadDisponible(producto);
                  
                  return (
                    <div
                      key={producto.id}
                      className={`p-4 transition-colors ${
                        enCarrito ? 'bg-green-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {getIconoTipo(tipoProducto)}
                            <span className="font-medium text-gray-900">
                              {producto.modelo || producto.descripcion_producto}
                            </span>
                            {enCarrito && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                En carrito
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Serial:</span> {producto.serial || 'N/A'}
                            </div>
                            {tipoProducto === 'computadora' && (
                              <div>
                                <span className="font-medium">Procesador:</span> {producto.procesador}
                              </div>
                            )}
                            {tipoProducto === 'celular' && (
                              <div>
                                <span className="font-medium">Capacidad:</span> {producto.capacidad}
                              </div>
                            )}
                            {tipoProducto === 'otro' && (
                              <div>
                                <span className="font-medium">Stock:</span> {cantidadDisponible}/{producto.cantidad}
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Condición:</span> 
                              <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
                                producto.condicion === 'nuevo' ? 'bg-green-100 text-green-800' :
                                producto.condicion === 'usado' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {producto.condicion}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-semibold text-green-600 text-lg">
                              ${producto.precio_venta_usd}
                            </p>
                            <p className="text-sm text-gray-500">
                              {producto.sucursal}
                            </p>
                          </div>

                          <button
                            onClick={() => onAddToCart(producto, tipoProducto)}
                            disabled={!puedeAgregar || cantidadDisponible === 0}
                            className={`p-2 rounded-lg transition-colors ${
                              puedeAgregar && cantidadDisponible > 0
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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

        {/* Información del carrito */}
        {carrito.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Productos en el carrito</h4>
                <p className="text-sm text-blue-600">
                  {carrito.length} productos • Total: ${carrito.reduce((total, item) => total + (item.precio_unitario * item.cantidad), 0).toFixed(2)}
                </p>
              </div>
              <div className="text-blue-600">
                <ShoppingCart className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-blue-500 mt-2">
              💡 Haz clic en el carrito flotante para finalizar la venta
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcesarVentaSection;