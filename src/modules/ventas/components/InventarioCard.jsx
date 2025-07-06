import React, { useState } from 'react';
import { Eye, Copy, ShoppingCart, Edit2, Check, X } from 'lucide-react';

// Función para formatear precios en USD sin decimales con prefijo U$
const formatPriceUSD = (price) => {
  const numPrice = parseFloat(price) || 0;
  return `U$${Math.round(numPrice)}`;
};

// Función para formatear precios en ARS
const formatPriceARS = (price, cotizacion) => {
  const numPrice = parseFloat(price) || 0;
  const arsPrice = Math.round(numPrice * cotizacion);
  return `$${arsPrice.toLocaleString()}`;
};

const InventarioCard = ({ 
  computer, 
  cotizacionDolar, 
  onViewDetails, 
  onAddToCart,
  // onUpdate,
  isEditing,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  // editingData,
  // onFieldChange
}) => {
  const [copySuccess, setCopySuccess] = useState(false);

  // Función para copiar descripción
  const copyDescription = async () => {
    try {
      const description = `${computer.marca} ${computer.modelo} - ${computer.procesador} - ${computer.ram} - ${computer.ssd || computer.hdd} - ${computer.pantalla}" - ${computer.condicion}`;
      await navigator.clipboard.writeText(description);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  // Función para obtener el color del badge de condición
  const getConditionColor = (condicion) => {
    switch (condicion?.toLowerCase()) {
      case 'nuevo':
        return 'bg-green-100 text-green-800';
      case 'usado':
        return 'bg-yellow-100 text-yellow-800';
      case 'reacondicionado':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Función para obtener el color del badge de sucursal
  const getSucursalColor = (sucursal) => {
    switch (sucursal?.toLowerCase()) {
      case 'local':
        return 'bg-purple-100 text-purple-800';
      case 'deposito':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group relative">
      {/* Badge de condición y sucursal */}
      <div className="absolute top-4 right-4 flex space-x-2">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConditionColor(computer.condicion)}`}>
          {computer.condicion}
        </span>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSucursalColor(computer.sucursal)}`}>
          {computer.sucursal}
        </span>
      </div>

      {/* Información principal */}
      <div className="mb-4 pr-24">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {computer.marca} {computer.modelo}
        </h3>
        
        {/* Descripción compacta */}
        <div className="text-sm text-gray-600 space-y-1">
          <p><span className="font-medium">Procesador:</span> {computer.procesador}</p>
          <p><span className="font-medium">Memoria:</span> {computer.ram}</p>
          <p><span className="font-medium">Almacenamiento:</span> {computer.ssd || computer.hdd}</p>
          <p><span className="font-medium">Pantalla:</span> {computer.pantalla}"</p>
        </div>
      </div>

      {/* Precios */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {formatPriceUSD(computer.precio_venta_usd)}
            </p>
            <p className="text-sm text-gray-500">
              {formatPriceARS(computer.precio_venta_usd, cotizacionDolar)} ARS
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Stock</p>
            <p className="text-lg font-semibold text-gray-900">{computer.stock || 1}</p>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex space-x-2">
        {!isEditing ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(computer);
              }}
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Eye size={16} />
              <span>Ver detalles</span>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyDescription();
              }}
              className={`flex items-center justify-center px-3 py-2 rounded-lg transition-colors ${
                copySuccess 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {copySuccess ? <Check size={16} /> : <Copy size={16} />}
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(computer);
              }}
              className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <ShoppingCart size={16} />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(computer);
              }}
              className="flex items-center justify-center px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <Edit2 size={16} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSaveEdit();
              }}
              className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Check size={16} />
              <span>Guardar</span>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancelEdit();
              }}
              className="flex items-center justify-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <X size={16} />
            </button>
          </>
        )}
      </div>

      {/* Overlay de hover para click */}
      <div 
        className="absolute inset-0 bg-transparent"
        onClick={() => onViewDetails(computer)}
      />
    </div>
  );
};

export default InventarioCard;