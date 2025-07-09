import React from 'react';
import { X } from 'lucide-react';

const OtrosModal = ({ producto, isOpen, onClose, cotizacionDolar }) => {
  if (!isOpen || !producto) return null;

  // Función para formatear precios en USD sin decimales con prefijo U$
  const formatPriceUSD = (price) => {
    const numPrice = parseFloat(price) || 0;
    return `U$${Math.round(numPrice)}`;
  };

  // Función para formatear precios en ARS
  const formatPriceARS = (price, cotizacion) => {
    const numPrice = parseFloat(price) || 0;
    const arsPrice = Math.round(numPrice * cotizacion);
    return `$${arsPrice.toLocaleString('es-AR')}`;
  };

  // Función para obtener el color del badge de condición
  const getConditionColor = (condicion) => {
    switch ((condicion || '').toUpperCase()) {
      case 'NUEVO':
        return 'bg-green-100 text-green-800';
      case 'USADO':
        return 'bg-blue-100 text-blue-800';
      case 'REACONDICIONADO':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Función para capitalizar la primera letra
  const capitalizeFirst = (str) => {
    if (!str) return 'N/A';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Función para formatear fecha
  const formatFecha = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      return new Date(fecha).toLocaleDateString('es-AR');
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] overflow-hidden flex">
        
        {/* Panel izquierdo */}
        <div className="w-1/3 bg-gray-900 text-white p-6 border-r-4 border-gray-900">
          <div className="space-y-6">
            
            <div className="text-center pb-4 border-b border-gray-500">
              <h2 className="text-xl font-bold">{producto.nombre_producto}</h2>
              <p className="text-gray-300 text-sm">{capitalizeFirst(producto.categoria)}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-300 text-center">CONDICIÓN</h3>
              <div className="bg-gray-500 p-3 rounded-lg text-center">
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-white text-gray-900">
                  {producto.condicion?.toUpperCase() || 'N/A'}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-300 text-center">UBICACIÓN</h3>
              <div className="bg-gray-500 p-3 rounded-lg text-center">
                <p className="text-white font-medium">
                  {(producto.sucursal || 'N/A')?.replace('_', ' ').toUpperCase()}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-300 text-center">STOCK</h3>
              <div className="bg-gray-500 p-3 rounded-lg text-center">
                <p className="text-white font-medium">
                  {producto.cantidad ?? 'N/A'} unidades
                </p>
              </div>
            </div>

            {producto.garantia && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-300 text-center">GARANTÍA</h3>
                <div className="bg-gray-500 p-3 rounded-lg text-center">
                  <p className="text-white font-medium">{producto.garantia}</p>
                </div>
              </div>
            )}


          </div>
        </div>

        {/* Panel derecho */}
        <div className="w-2/3 bg-white p-6 overflow-y-auto">
          
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Información Completa</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-900"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white bg-gray-500 px-3 py-2 rounded">Información Básica</h3>
              <div className="space-y-2 text-gray-900">
                <div><strong>Fecha de Ingreso:</strong> {formatFecha(producto.ingreso)}</div>
                <div><strong>Cantidad:</strong> {producto.cantidad ?? 'N/A'}</div>
                <div><strong>Categoría:</strong> {capitalizeFirst(producto.categoria)}</div>
                {producto.fallas && producto.fallas !== 'Ninguna' && (
                  <div><strong>Fallas:</strong> {producto.fallas}</div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white bg-gray-500 px-3 py-2 rounded">Descripción del Producto</h3>
              <div className="bg-white border border-gray-500 p-6 rounded-lg">
                <p className="text-gray-900 text-lg leading-relaxed">
                  {producto.descripcion}
                </p>
              </div>
            </div>

          </div>

          <div className="space-y-4 mt-6">
            <h3 className="text-lg font-semibold text-white bg-slate-600 px-3 py-2 rounded">Precios</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Tarjeta Compra */}
              <div className="border-2 border-gray-900 rounded-lg overflow-hidden">
                <div className="bg-gray-900 text-white text-center py-2">
                  <h4 className="text-lg font-bold">COMPRA</h4>
                </div>
                <div className="bg-white text-center py-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPriceUSD(producto.precio_compra_usd)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatPriceARS(producto.precio_compra_usd, cotizacionDolar)}
                  </p>
                </div>
              </div>

              {/* Tarjeta Venta */}
              <div className="border-2 border-gray-900 rounded-lg overflow-hidden">
                <div className="bg-gray-900 text-white text-center py-2">
                  <h4 className="text-lg font-bold">VENTA</h4>
                </div>
                <div className="bg-white text-center py-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPriceUSD(producto.precio_venta_usd)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatPriceARS(producto.precio_venta_usd, cotizacionDolar)}
                  </p>
                </div>
              </div>

              {/* Tarjeta Ganancia */}
              <div className="border-2 border-gray-900 rounded-lg overflow-hidden">
                <div className="bg-gray-900 text-white text-center py-2">
                  <h4 className="text-lg font-bold">GANANCIA</h4>
                </div>
                <div className="bg-white text-center py-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPriceUSD(producto.precio_venta_usd - producto.precio_compra_usd)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatPriceARS(producto.precio_venta_usd - producto.precio_compra_usd, cotizacionDolar)}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtrosModal;