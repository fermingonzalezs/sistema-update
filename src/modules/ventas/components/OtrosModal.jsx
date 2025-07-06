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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-gray-900">
              Detalles del Producto
            </h2>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getConditionColor(producto.condicion)}`}>
              {producto.condicion}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Precios */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Precios</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Precio USD</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatPriceUSD(producto.precio_venta_usd)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Precio ARS</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatPriceARS(producto.precio_venta_usd, cotizacionDolar)}
                  </p>
                </div>
              </div>
            </div>

            {/* Descripción completa del producto */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Descripción del Producto</h3>
              <p className="text-gray-800 text-lg leading-relaxed">
                {producto.descripcion_producto}
              </p>
            </div>

            {/* Información adicional básica */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Cantidad en Stock</p>
                <p className="text-lg font-semibold text-gray-900">
                  {producto.cantidad}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Garantía</p>
                <p className="text-lg font-semibold text-gray-900">
                  {producto.garantia || 'No especificada'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtrosModal;