import React, { useState } from 'react';
import { X, Copy, Edit2, Check, Trash2, Shield, Eye } from 'lucide-react';
import FotoProductoAvanzado from '../../../components/FotoProductoAvanzado';

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

const InventarioModal = ({ 
  computer, 
  isOpen, 
  onClose, 
  cotizacionDolar,
  // onUpdate,
  onDelete,
  isEditing,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  editingData,
  onFieldChange
}) => {
  const [copySuccess, setCopySuccess] = useState(false);
  // const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  if (!isOpen || !computer) return null;

  // Función para copiar descripción
  const copyDescription = async (includePrice = false) => {
    try {
      const description = `${computer.marca} ${computer.modelo} - ${computer.procesador} - ${computer.ram} - ${computer.ssd || computer.hdd} - ${computer.pantalla}" - ${computer.condicion}${includePrice ? ` - ${formatPriceUSD(computer.precio_venta_usd)}` : ''}`;
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

  // Opciones para campos editables
  const condicionOptions = [
    { value: 'Nuevo', label: 'Nuevo' },
    { value: 'Usado', label: 'Usado' },
    { value: 'Reacondicionado', label: 'Reacondicionado' }
  ];

  const sucursalOptions = [
    { value: 'Local', label: 'Local' },
    { value: 'Deposito', label: 'Depósito' }
  ];

  const marcaOptions = [
    { value: 'Lenovo', label: 'Lenovo' },
    { value: 'HP', label: 'HP' },
    { value: 'Dell', label: 'Dell' },
    { value: 'Acer', label: 'Acer' },
    { value: 'Asus', label: 'Asus' },
    { value: 'Apple', label: 'Apple' },
    { value: 'MSI', label: 'MSI' },
    { value: 'Toshiba', label: 'Toshiba' },
    { value: 'Samsung', label: 'Samsung' },
    { value: 'Sony', label: 'Sony' }
  ];

  // Componente para campos editables
  const EditableField = ({ label, field, type = 'text', options = null, className = '', multiline = false }) => {
    const value = isEditing ? (editingData[field] || '') : (computer[field] || '');
    
    if (!isEditing) {
      return (
        <div className={className}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <p className="text-sm text-gray-900 p-2 bg-gray-50 rounded border">
            {value || 'N/A'}
          </p>
        </div>
      );
    }

    if (type === 'select') {
      return (
        <div className={className}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <select
            value={value}
            onChange={(e) => onFieldChange(field, e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Seleccionar...</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (multiline) {
      return (
        <div className={className}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <textarea
            value={value}
            onChange={(e) => onFieldChange(field, e.target.value)}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      );
    }

    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
          type={type}
          value={value}
          onChange={(e) => {
            if (type === 'number') {
              if (/^\d*$/.test(e.target.value)) onFieldChange(field, e.target.value);
            } else {
              onFieldChange(field, e.target.value);
            }
          }}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {computer.marca} {computer.modelo}
            </h2>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getConditionColor(computer.condicion)}`}>
              {computer.condicion}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => copyDescription(false)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    copySuccess 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                  <span>Copiar</span>
                </button>
                
                
                <button
                  onClick={() => onEdit(computer)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit2 size={16} />
                  <span>Editar</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onSaveEdit}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Check size={16} />
                  <span>Guardar</span>
                </button>
                
                <button
                  onClick={onCancelEdit}
                  className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <X size={16} />
                  <span>Cancelar</span>
                </button>
              </>
            )}
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Información principal y fotos */}
            <div className="space-y-6">
              {/* Precios */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Precios</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Precio USD</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatPriceUSD(computer.precio_venta_usd)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Precio ARS</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {formatPriceARS(computer.precio_venta_usd, cotizacionDolar)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Precio Costo USD</p>
                    <p className="text-lg font-medium text-gray-700">
                      {formatPriceUSD(computer.precio_costo_usd)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Stock</p>
                    <p className="text-lg font-medium text-gray-700">
                      {computer.stock || 1}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fotos */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fotos</h3>
                <FotoProductoAvanzado 
                  productId={computer.id} 
                  productType="inventario"
                  className="w-full"
                />
              </div>
            </div>

            {/* Especificaciones técnicas */}
            <div className="space-y-6">
              {/* Información básica */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <EditableField 
                    label="Serial" 
                    field="serial" 
                    type="text"
                  />
                  <EditableField 
                    label="Marca" 
                    field="marca" 
                    type="select"
                    options={marcaOptions}
                  />
                  <EditableField 
                    label="Modelo" 
                    field="modelo" 
                    type="text"
                  />
                  <EditableField 
                    label="Condición" 
                    field="condicion" 
                    type="select"
                    options={condicionOptions}
                  />
                  <EditableField 
                    label="Sucursal" 
                    field="sucursal" 
                    type="select"
                    options={sucursalOptions}
                  />
                  <EditableField 
                    label="Fecha Ingreso" 
                    field="fecha_ingreso" 
                    type="date"
                  />
                </div>
              </div>

              {/* Especificaciones de hardware */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hardware</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <EditableField 
                    label="Procesador" 
                    field="procesador" 
                    type="text"
                  />
                  <EditableField 
                    label="Memoria RAM" 
                    field="ram" 
                    type="text"
                  />
                  <EditableField 
                    label="Tipo RAM" 
                    field="tipo_ram" 
                    type="text"
                  />
                  <EditableField 
                    label="Slots RAM" 
                    field="slots_ram" 
                    type="text"
                  />
                  <EditableField 
                    label="SSD" 
                    field="ssd" 
                    type="text"
                  />
                  <EditableField 
                    label="SSD" 
                    field="ssd" 
                    type="text"
                  />
                  <EditableField 
                    label="HDD" 
                    field="hdd" 
                    type="text"
                  />
                  <EditableField 
                    label="Sistema Operativo" 
                    field="so" 
                    type="text"
                  />
                  <EditableField 
                    label="GPU" 
                    field="placa_video" 
                    type="text"
                  />
                  <EditableField 
                    label="VRAM" 
                    field="vram" 
                    type="text"
                  />
                </div>
              </div>

              {/* Pantalla */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pantalla</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <EditableField 
                    label="Tamaño" 
                    field="pantalla" 
                    type="text"
                  />
                  <EditableField 
                    label="Resolución" 
                    field="resolucion" 
                    type="text"
                  />
                  <EditableField 
                    label="Refresh Rate" 
                    field="refresh_rate" 
                    type="text"
                  />
                  <EditableField 
                    label="Touchscreen" 
                    field="touchscreen" 
                    type="text"
                  />
                </div>
              </div>

              {/* Otros detalles */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Otros Detalles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <EditableField 
                    label="Teclado" 
                    field="teclado_retro" 
                    type="text"
                  />
                  <EditableField 
                    label="Idioma" 
                    field="idioma_teclado" 
                    type="text"
                  />
                  <EditableField 
                    label="Color" 
                    field="color" 
                    type="text"
                  />
                  <EditableField 
                    label="Batería" 
                    field="bateria" 
                    type="text"
                  />
                  <EditableField 
                    label="Duración Batería" 
                    field="duracion" 
                    type="text"
                  />
                  <EditableField 
                    label="Garantía" 
                    field="garantia_update" 
                    type="text"
                  />
                  <EditableField 
                    label="Garantía Oficial" 
                    field="garantia_oficial" 
                    type="text"
                  />
                </div>
              </div>

              {/* Observaciones */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Observaciones</h3>
                <EditableField 
                  label="Fallas/Observaciones" 
                  field="fallas" 
                  type="text"
                  multiline={true}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer con botones adicionales */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex space-x-2">
            <button
              onClick={() => copyDescription(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <Copy size={16} />
              <span>Copiar con precio</span>
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => onDelete(computer.id)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 size={16} />
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventarioModal;