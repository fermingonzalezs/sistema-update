import React from 'react';
import { Package, DollarSign, Weight, Percent, Truck, ExternalLink, User } from 'lucide-react';
import ClienteSelector from '../../ventas/components/ClienteSelector';
import ProveedorSelector from './ProveedorSelector';

const CotizacionFormFields = ({ 
  formData, 
  setFormData, 
  selectedCliente, 
  setSelectedCliente, 
  errors 
}) => {
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClienteChange = (cliente) => {
    setSelectedCliente(cliente);
    setFormData(prev => ({ ...prev, cliente_id: cliente?.id || '' }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Cliente */}
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <User className="w-4 h-4 inline mr-2" />
          Cliente *
        </label>
        <ClienteSelector
          selectedCliente={selectedCliente}
          onClienteChange={handleClienteChange}
          placeholder="Seleccionar cliente..."
        />
        {errors.cliente_id && <p className="text-red-500 text-sm mt-1">{errors.cliente_id}</p>}
      </div>

      {/* Proveedor */}
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <Package className="w-4 h-4 inline mr-2" />
          Proveedor
        </label>
        <ProveedorSelector
          selectedProveedor={formData.proveedor_nombre}
          onSelectProveedor={(proveedor) => handleInputChange('proveedor_nombre', proveedor)}
        />
      </div>

      {/* Descripción */}
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <Package className="w-4 h-4 inline mr-2" />
          Descripción del producto *
        </label>
        <textarea
          value={formData.descripcion}
          onChange={(e) => handleInputChange('descripcion', e.target.value)}
          placeholder="Describe detalladamente el producto a importar..."
          rows={3}
          className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
            errors.descripcion ? 'border-red-500' : 'border-slate-300'
          }`}
        />
        {errors.descripcion && <p className="text-red-500 text-sm mt-1">{errors.descripcion}</p>}
      </div>

      {/* Link del producto */}
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <ExternalLink className="w-4 h-4 inline mr-2" />
          Link del producto
        </label>
        <input
          type="url"
          value={formData.link_producto}
          onChange={(e) => handleInputChange('link_producto', e.target.value)}
          placeholder="https://..."
          className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
            errors.link_producto ? 'border-red-500' : 'border-slate-300'
          }`}
        />
        {errors.link_producto && <p className="text-red-500 text-sm mt-1">{errors.link_producto}</p>}
      </div>

      {/* Precio y Peso */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <DollarSign className="w-4 h-4 inline mr-2" />
          Precio de compra (USD) *
        </label>
        <input
          type="number"
          step="0.01"
          value={formData.precio_compra_usd}
          onChange={(e) => handleInputChange('precio_compra_usd', e.target.value)}
          placeholder="0.00"
          className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
            errors.precio_compra_usd ? 'border-red-500' : 'border-slate-300'
          }`}
        />
        {errors.precio_compra_usd && <p className="text-red-500 text-sm mt-1">{errors.precio_compra_usd}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <Weight className="w-4 h-4 inline mr-2" />
          Peso estimado (kg) *
        </label>
        <input
          type="number"
          step="0.1"
          value={formData.peso_estimado_kg}
          onChange={(e) => handleInputChange('peso_estimado_kg', e.target.value)}
          placeholder="0.0"
          className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
            errors.peso_estimado_kg ? 'border-red-500' : 'border-slate-300'
          }`}
        />
        {errors.peso_estimado_kg && <p className="text-red-500 text-sm mt-1">{errors.peso_estimado_kg}</p>}
      </div>

      {/* Costos adicionales */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <Percent className="w-4 h-4 inline mr-2" />
          Impuestos USA (%)
        </label>
        <input
          type="number"
          step="0.1"
          value={formData.impuestos_usa_porcentaje}
          onChange={(e) => handleInputChange('impuestos_usa_porcentaje', e.target.value)}
          placeholder="0"
          className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <Truck className="w-4 h-4 inline mr-2" />
          Envío USA (USD)
        </label>
        <input
          type="number"
          step="0.01"
          value={formData.envio_usa_fijo}
          onChange={(e) => handleInputChange('envio_usa_fijo', e.target.value)}
          placeholder="0.00"
          className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <Truck className="w-4 h-4 inline mr-2" />
          Envío ARG (USD)
        </label>
        <input
          type="number"
          step="0.01"
          value={formData.envio_arg_fijo}
          onChange={(e) => handleInputChange('envio_arg_fijo', e.target.value)}
          placeholder="0.00"
          className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <DollarSign className="w-4 h-4 inline mr-2" />
          Precio por kg (USD) *
        </label>
        <input
          type="number"
          step="0.01"
          value={formData.precio_por_kg}
          onChange={(e) => handleInputChange('precio_por_kg', e.target.value)}
          placeholder="0.00"
          className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
            errors.precio_por_kg ? 'border-red-500' : 'border-slate-300'
          }`}
        />
        {errors.precio_por_kg && <p className="text-red-500 text-sm mt-1">{errors.precio_por_kg}</p>}
      </div>
    </div>
  );
};

export default CotizacionFormFields;