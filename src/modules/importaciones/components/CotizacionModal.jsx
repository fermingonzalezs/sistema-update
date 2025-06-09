// src/components/CotizacionModal.jsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  Calculator, 
  User, 
  Package, 
  DollarSign, 
  Weight, 
  Percent, 
  Truck, 
  ExternalLink,
  Plus,
  AlertCircle 
} from 'lucide-react';
import ClienteSelector from '../../ventas/components/ClienteSelector';
import ProveedorSelector from './ProveedorSelector';

const CotizacionModal = ({ isOpen, onClose, onSave, cotizacion = null }) => {
  const [formData, setFormData] = useState({
    cliente_id: '',
    descripcion: '',
    link_producto: '',
    proveedor_nombre: '',
    precio_compra_usd: '',
    peso_estimado_kg: '',
    impuestos_usa_porcentaje: '0',
    envio_usa_fijo: '0',
    envio_arg_fijo: '0',
    precio_por_kg: ''
  });

  const [selectedCliente, setSelectedCliente] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [totalCalculado, setTotalCalculado] = useState(0);

  // Reiniciar form cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      if (cotizacion) {
        // Modo edición
        setFormData({
          cliente_id: cotizacion.cliente_id || '',
          descripcion: cotizacion.descripcion || '',
          link_producto: cotizacion.link_producto || '',
          proveedor_nombre: cotizacion.proveedor_nombre || '',
          precio_compra_usd: cotizacion.precio_compra_usd?.toString() || '',
          peso_estimado_kg: cotizacion.peso_estimado_kg?.toString() || '',
          impuestos_usa_porcentaje: cotizacion.impuestos_usa_porcentaje?.toString() || '0',
          envio_usa_fijo: cotizacion.envio_usa_fijo?.toString() || '0',
          envio_arg_fijo: cotizacion.envio_arg_fijo?.toString() || '0',
          precio_por_kg: cotizacion.precio_por_kg?.toString() || ''
        });
        setSelectedCliente(cotizacion.clientes || null);
      } else {
        // Modo creación
        setFormData({
          cliente_id: '',
          descripcion: '',
          link_producto: '',
          proveedor_nombre: '',
          precio_compra_usd: '',
          peso_estimado_kg: '',
          impuestos_usa_porcentaje: '0',
          envio_usa_fijo: '0',
          envio_arg_fijo: '0',
          precio_por_kg: ''
        });
        setSelectedCliente(null);
      }
      setErrors({});
    }
  }, [isOpen, cotizacion]);

  // Calcular total automáticamente cuando cambian los valores
  useEffect(() => {
    const calcularTotal = () => {
      const precioCompra = parseFloat(formData.precio_compra_usd) || 0;
      const pesoEstimado = parseFloat(formData.peso_estimado_kg) || 0;
      const impuestos = parseFloat(formData.impuestos_usa_porcentaje) || 0;
      const envioUsa = parseFloat(formData.envio_usa_fijo) || 0;
      const envioArg = parseFloat(formData.envio_arg_fijo) || 0;
      const precioPorKg = parseFloat(formData.precio_por_kg) || 0;

      const subtotal = precioCompra + (precioCompra * impuestos / 100);
      const costoEnvioPeso = pesoEstimado * precioPorKg;
      const total = subtotal + envioUsa + envioArg + costoEnvioPeso;

      setTotalCalculado(total);
    };

    calcularTotal();
  }, [
    formData.precio_compra_usd,
    formData.peso_estimado_kg,
    formData.impuestos_usa_porcentaje,
    formData.envio_usa_fijo,
    formData.envio_arg_fijo,
    formData.precio_por_kg
  ]);

  const validateForm = () => {
    const newErrors = {};

    if (!selectedCliente) {
      newErrors.cliente_id = 'Debe seleccionar un cliente';
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es obligatoria';
    }

    if (!formData.precio_compra_usd || parseFloat(formData.precio_compra_usd) <= 0) {
      newErrors.precio_compra_usd = 'El precio de compra debe ser mayor a 0';
    }

    if (!formData.peso_estimado_kg || parseFloat(formData.peso_estimado_kg) <= 0) {
      newErrors.peso_estimado_kg = 'El peso estimado debe ser mayor a 0';
    }

    if (!formData.precio_por_kg || parseFloat(formData.precio_por_kg) <= 0) {
      newErrors.precio_por_kg = 'El precio por kg debe ser mayor a 0';
    }

    if (formData.link_producto && !isValidUrl(formData.link_producto)) {
      newErrors.link_producto = 'Debe ser una URL válida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const cotizacionData = {
        ...formData,
        cliente_id: selectedCliente.id,
        precio_compra_usd: parseFloat(formData.precio_compra_usd),
        peso_estimado_kg: parseFloat(formData.peso_estimado_kg),
        impuestos_usa_porcentaje: parseFloat(formData.impuestos_usa_porcentaje),
        envio_usa_fijo: parseFloat(formData.envio_usa_fijo),
        envio_arg_fijo: parseFloat(formData.envio_arg_fijo),
        precio_por_kg: parseFloat(formData.precio_por_kg)
      };

      await onSave(cotizacionData);
    } catch (error) {
      console.error('❌ Error guardando cotización:', error);
      alert('Error guardando cotización: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleClose = (e) => {
    e?.stopPropagation();
    onClose();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
            <Calculator className="w-6 h-6 text-teal-600" />
            <span>{cotizacion ? 'Editar Cotización' : 'Nueva Cotización'}</span>
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Cliente y Descripción */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Cliente *
              </label>
              <ClienteSelector
                selectedCliente={selectedCliente}
                onSelectCliente={setSelectedCliente}
                required={true}
              />
              {errors.cliente_id && (
                <p className="text-red-500 text-sm mt-1">{errors.cliente_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Package className="w-4 h-4 inline mr-1" />
                Proveedor
              </label>
              <ProveedorSelector
                selectedProveedor={formData.proveedor_nombre}
                onSelectProveedor={(proveedor) => handleChange('proveedor_nombre', proveedor)}
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📝 Descripción del Producto *
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                errors.descripcion ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe el producto que se va a importar..."
            />
            {errors.descripcion && (
              <p className="text-red-500 text-sm mt-1">{errors.descripcion}</p>
            )}
          </div>

          {/* Link del producto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ExternalLink className="w-4 h-4 inline mr-1" />
              Link del Producto
            </label>
            <input
              type="url"
              value={formData.link_producto}
              onChange={(e) => handleChange('link_producto', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                errors.link_producto ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="https://ejemplo.com/producto"
            />
            {errors.link_producto && (
              <p className="text-red-500 text-sm mt-1">{errors.link_producto}</p>
            )}
          </div>

          {/* Costos principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Precio de Compra (USD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.precio_compra_usd}
                onChange={(e) => handleChange('precio_compra_usd', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  errors.precio_compra_usd ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.precio_compra_usd && (
                <p className="text-red-500 text-sm mt-1">{errors.precio_compra_usd}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Weight className="w-4 h-4 inline mr-1" />
                Peso Estimado (kg) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.peso_estimado_kg}
                onChange={(e) => handleChange('peso_estimado_kg', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  errors.peso_estimado_kg ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.peso_estimado_kg && (
                <p className="text-red-500 text-sm mt-1">{errors.peso_estimado_kg}</p>
              )}
            </div>
          </div>

          {/* Impuestos y Envíos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Percent className="w-4 h-4 inline mr-1" />
                Impuestos USA (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.impuestos_usa_porcentaje}
                onChange={(e) => handleChange('impuestos_usa_porcentaje', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Truck className="w-4 h-4 inline mr-1" />
                Envío USA (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.envio_usa_fijo}
                onChange={(e) => handleChange('envio_usa_fijo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Truck className="w-4 h-4 inline mr-1" />
                Envío ARG (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.envio_arg_fijo}
                onChange={(e) => handleChange('envio_arg_fijo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Precio por kg */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Precio por Kg (USD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.precio_por_kg}
                onChange={(e) => handleChange('precio_por_kg', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  errors.precio_por_kg ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.precio_por_kg && (
                <p className="text-red-500 text-sm mt-1">{errors.precio_por_kg}</p>
              )}
            </div>

            {/* Total calculado */}
            <div className="flex items-end">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💰 Total Cotizado
                </label>
                <div className="w-full px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalCalculado)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Desglose del cálculo */}
          {totalCalculado > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Desglose del cálculo:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Precio de compra:</span>
                  <span>{formatCurrency(parseFloat(formData.precio_compra_usd) || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Impuestos USA ({formData.impuestos_usa_porcentaje}%):</span>
                  <span>{formatCurrency((parseFloat(formData.precio_compra_usd) || 0) * (parseFloat(formData.impuestos_usa_porcentaje) || 0) / 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío USA:</span>
                  <span>{formatCurrency(parseFloat(formData.envio_usa_fijo) || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío ARG:</span>
                  <span>{formatCurrency(parseFloat(formData.envio_arg_fijo) || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Costo por peso ({formData.peso_estimado_kg} kg × {formatCurrency(parseFloat(formData.precio_por_kg) || 0)}):</span>
                  <span>{formatCurrency((parseFloat(formData.peso_estimado_kg) || 0) * (parseFloat(formData.precio_por_kg) || 0))}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-green-600">
                  <span>Total:</span>
                  <span>{formatCurrency(totalCalculado)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || totalCalculado === 0}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:bg-teal-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : cotizacion ? 'Actualizar Cotización' : 'Crear Cotización'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default CotizacionModal;