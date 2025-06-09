import React, { useState } from 'react';
import { Box } from 'lucide-react';

const AgregarOtroSection = ({ onAdd, loading }) => {
  const [formData, setFormData] = useState({
    descripcion_producto: '',
    cantidad: 1,
    precio_compra_usd: '',
    precio_venta_usd: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.descripcion_producto) {
      alert('La descripción del producto es obligatoria');
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSubmit = {
        ...formData,
        disponible: true
      };

      await onAdd(dataToSubmit);
      
      // Resetear formulario
      setFormData({
        descripcion_producto: '',
        cantidad: 1,
        precio_compra_usd: '',
        precio_venta_usd: ''
      });
      
      alert('✅ Producto agregado exitosamente!');
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calcularMargen = () => {
    const precioVenta = parseFloat(formData.precio_venta_usd) || 0;
    const precioCompra = parseFloat(formData.precio_compra_usd) || 0;
    return precioVenta - precioCompra;
  };

  const calcularPorcentajeMargen = () => {
    const precioCompra = parseFloat(formData.precio_compra_usd) || 0;
    if (precioCompra === 0) return 0;
    return ((calcularMargen() / precioCompra) * 100).toFixed(1);
  };

  return (
    <div className="p-8">
      <div className="flex items-center space-x-3 mb-6">
        <Box className="w-8 h-8 text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-800">Agregar Nuevo Producto</h2>
      </div>
      
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Información del Producto */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Información del Producto</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción del Producto *
                </label>
                <input
                  type="text"
                  name="descripcion_producto"
                  value={formData.descripcion_producto}
                  onChange={handleChange}
                  placeholder="ej: Mouse Logitech MX Master 3"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad en Stock
                </label>
                <input
                  type="number"
                  name="cantidad"
                  value={formData.cantidad}
                  onChange={handleChange}
                  min="1"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Precios */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Precios</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio de Compra USD
                </label>
                <input
                  type="number"
                  name="precio_compra_usd"
                  value={formData.precio_compra_usd}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="0.00"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio de Venta USD
                </label>
                <input
                  type="number"
                  name="precio_venta_usd"
                  value={formData.precio_venta_usd}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="0.00"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Cálculo de margen */}
            {formData.precio_compra_usd && formData.precio_venta_usd && (
              <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Análisis de Margen</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Margen por unidad:</span>
                    <p className={`font-medium ${calcularMargen() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${calcularMargen().toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Porcentaje:</span>
                    <p className={`font-medium ${calcularMargen() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {calcularPorcentajeMargen()}%
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Margen total:</span>
                    <p className={`font-medium ${calcularMargen() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${(calcularMargen() * (parseInt(formData.cantidad) || 1)).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resumen del producto */}
          {formData.descripcion_producto && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-800 mb-2">Resumen del Producto</h4>
              <div className="text-sm text-purple-700">
                <p><strong>Producto:</strong> {formData.descripcion_producto}</p>
                <p><strong>Cantidad:</strong> {formData.cantidad} unidades</p>
                {formData.precio_venta_usd && (
                  <p><strong>Valor total del inventario:</strong> ${(parseFloat(formData.precio_venta_usd) * parseInt(formData.cantidad)).toFixed(2)}</p>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Guardando...' : 'Agregar Producto'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AgregarOtroSection;