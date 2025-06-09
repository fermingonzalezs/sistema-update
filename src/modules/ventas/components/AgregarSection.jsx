import React, { useState } from 'react';

const AgregarSection = ({ onAdd, loading }) => {
  const [formData, setFormData] = useState({
    serial: '',
    condicion: 'usado',
    sucursal: '',
    precio_compra_usd: '',
    precio_repuestos_usd: '',
    precio_venta_usd: '',
    modelo: '',
    procesador: '',
    memoria_ram: '',
    ssd: '',
    hdd: '',
    pantalla: '',
    resolucion: '',
    sistema_operativo: '',
    placa_de_video: '',
    idioma: 'Español',
    retroiluminacion_teclado: 'Sí',
    estado_estetico: 'Bueno',
    porcentaje_de_bateria: '',
    duracion_de_bateria: '',
    color: '',
    garantia: '',
    fallas: 'Ninguna',
    ingreso: new Date().toISOString().split('T')[0]
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
      // Calcular precio_compra_total
      const precio_compra_total = 
        (parseFloat(formData.precio_compra_usd) || 0) + 
        (parseFloat(formData.precio_repuestos_usd) || 0);

      const dataToSubmit = {
        ...formData,
        precio_compra_total,
        // Convertir porcentaje de batería a número
        porcentaje_de_bateria: parseInt(formData.porcentaje_de_bateria) || 0,
        disponible: true
      };

      await onAdd(dataToSubmit);
      
      // Resetear formulario
      setFormData({
        serial: '',
        condicion: 'usado',
        sucursal: '',
        precio_compra_usd: '',
        precio_repuestos_usd: '',
        precio_venta_usd: '',
        modelo: '',
        procesador: '',
        memoria_ram: '',
        ssd: '',
        hdd: '',
        pantalla: '',
        resolucion: '',
        sistema_operativo: '',
        placa_de_video: '',
        idioma: 'Español',
        retroiluminacion_teclado: 'Sí',
        estado_estetico: 'Bueno',
        porcentaje_de_bateria: '',
        duracion_de_bateria: '',
        color: '',
        garantia: '',
        fallas: 'Ninguna',
        ingreso: new Date().toISOString().split('T')[0]
      });
      
      alert('✅ Computadora agregada exitosamente!');
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Agregar Nueva Computadora</h2>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Precio Repuestos USD</label>
          <input
            type="number"
            name="precio_repuestos_usd"
            value={formData.precio_repuestos_usd}
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

        {/* Especificaciones Técnicas */}
        <div className="col-span-full">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 mt-6">Especificaciones Técnicas</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Procesador</label>
          <input
            type="text"
            name="procesador"
            value={formData.procesador}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Memoria RAM</label>
          <input
            type="text"
            name="memoria_ram"
            value={formData.memoria_ram}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">SSD</label>
          <input
            type="text"
            name="ssd"
            value={formData.ssd}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">HDD</label>
          <input
            type="text"
            name="hdd"
            value={formData.hdd}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pantalla</label>
          <input
            type="text"
            name="pantalla"
            value={formData.pantalla}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Resolución</label>
          <input
            type="text"
            name="resolucion"
            value={formData.resolucion}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sistema Operativo</label>
          <input
            type="text"
            name="sistema_operativo"
            value={formData.sistema_operativo}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Placa de Video</label>
          <input
            type="text"
            name="placa_de_video"
            value={formData.placa_de_video}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Características Físicas */}
        <div className="col-span-full">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 mt-6">Características Físicas</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
          <select
            name="idioma"
            value={formData.idioma}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Español">Español</option>
            <option value="Inglés">Inglés</option>
            <option value="Portugués">Portugués</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Retroiluminación Teclado</label>
          <select
            name="retroiluminacion_teclado"
            value={formData.retroiluminacion_teclado}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Sí">Sí</option>
            <option value="No">No</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Estado Estético</label>
          <select
            name="estado_estetico"
            value={formData.estado_estetico}
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
            type="number"
            name="porcentaje_de_bateria"
            value={formData.porcentaje_de_bateria}
            onChange={handleChange}
            min="0"
            max="100"
            placeholder="95"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Duración de Batería</label>
          <input
            type="text"
            name="duracion_de_bateria"
            value={formData.duracion_de_bateria}
            onChange={handleChange}
            placeholder="ej: 8 horas"
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Garantía</label>
          <input
            type="text"
            name="garantia"
            value={formData.garantia}
            onChange={handleChange}
            placeholder="ej: 6 meses"
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Ingreso</label>
          <input
            type="date"
            name="ingreso"
            value={formData.ingreso}
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
            {isSubmitting ? 'Guardando...' : 'Agregar Computadora'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AgregarSection;