import React, { useState } from 'react';
import { Smartphone } from 'lucide-react';

const AgregarCelularSection = ({ onAdd, loading }) => {
  const [formData, setFormData] = useState({
    serial: '',
    sucursal: '',
    precio_compra_usd: '',
    precio_venta_usd: '',
    modelo: '',
    capacidad: '128GB',
    condicion: 'usado',
    color: '',
    estado: 'Bueno',
    bateria: '',
    ciclos: '',
    garantia: '',
    fallas: 'Ninguna'
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
    if (!formData.serial || !formData.modelo) {
      alert('Serial y Modelo son campos obligatorios');
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
        serial: '',
        sucursal: '',
        precio_compra_usd: '',
        precio_venta_usd: '',
        modelo: '',
        capacidad: '128GB',
        condicion: 'usado',
        color: '',
        estado: 'Bueno',
        bateria: '',
        ciclos: '',
        garantia: '',
        fallas: 'Ninguna'
      });
      
      alert('✅ Celular agregado exitosamente!');
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center space-x-3 mb-6">
        <Smartphone className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Agregar Nuevo Celular</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Información Básica */}
        <div className="col-span-full">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Información Básica</h3>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Serial *</label>
          <input
            type="text"
            name="serial"
            value={formData.serial}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Modelo *</label>
          <input
            type="text"
            name="modelo"
            value={formData.modelo}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Capacidad</label>
          <select
            name="capacidad"
            value={formData.capacidad}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="64GB">64GB</option>
            <option value="128GB">128GB</option>
            <option value="256GB">256GB</option>
            <option value="512GB">512GB</option>
            <option value="1TB">1TB</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Condición</label>
          <select
            name="condicion"
            value={formData.condicion}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="nuevo">Nuevo</option>
            <option value="usado">Usado</option>
            <option value="reacondicionado">Reacondicionado</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sucursal</label>
          <input
            type="text"
            name="sucursal"
            value={formData.sucursal}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
          <input
            type="text"
            name="color"
            value={formData.color}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Precios */}
        <div className="col-span-full">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 mt-6">Precios</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Precio Compra USD</label>
          <input
            type="number"
            name="precio_compra_usd"
            value={formData.precio_compra_usd}
            onChange={handleChange}
            step="0.01"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Precio Venta USD</label>
          <input
            type="number"
            name="precio_venta_usd"
            value={formData.precio_venta_usd}
            onChange={handleChange}
            step="0.01"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Estado y Condición */}
        <div className="col-span-full">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 mt-6">Estado y Condición</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
          <select
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Nuevo">Nuevo</option>
            <option value="Excelente">Excelente</option>
            <option value="Muy Bueno">Muy Bueno</option>
            <option value="Bueno">Bueno</option>
            <option value="Regular">Regular</option>
            <option value="Malo">Malo</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Porcentaje de Batería</label>
          <input
            type="text"
            name="bateria"
            value={formData.bateria}
            onChange={handleChange}
            placeholder="ej: 85%"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ciclos de Batería</label>
          <input
            type="number"
            name="ciclos"
            value={formData.ciclos}
            onChange={handleChange}
            min="0"
            placeholder="ej: 156"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Garantía</label>
          <input
            type="text"
            name="garantia"
            value={formData.garantia}
            onChange={handleChange}
            placeholder="ej: 3 meses"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fallas</label>
          <input
            type="text"
            name="fallas"
            value={formData.fallas}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Botón de envío */}
        <div className="col-span-full mt-6">
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Guardando...' : 'Agregar Celular'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AgregarCelularSection;