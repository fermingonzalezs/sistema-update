import React, { useState } from 'react';
import { Monitor, Smartphone, Box, Plus } from 'lucide-react';

const CargaEquiposUnificada = ({ onAddComputer, onAddCelular, onAddOtro, loading }) => {
  const [tipoEquipo, setTipoEquipo] = useState('notebook');

  const tiposEquipo = [
    {
      id: 'notebook',
      label: 'Notebook',
      icon: Monitor,
      color: 'from-blue-500 to-blue-600',
      description: 'Laptops y computadoras portátiles'
    },
    {
      id: 'celular',
      label: 'Celular',
      icon: Smartphone,
      color: 'from-green-500 to-green-600',
      description: 'Dispositivos móviles'
    },
    {
      id: 'otro',
      label: 'Otro Producto',
      icon: Box,
      color: 'from-purple-500 to-purple-600',
      description: 'Accesorios y otros productos'
    }
  ];

  return (
    <div className="p-8">
      <div className="flex items-center space-x-3 mb-6">
        <Plus className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Carga de Equipos</h2>
      </div>

      {/* Selector de tipo de equipo */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Seleccionar Tipo de Equipo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiposEquipo.map((tipo) => {
            const Icon = tipo.icon;
            const isSelected = tipoEquipo === tipo.id;
            
            return (
              <button
                key={tipo.id}
                onClick={() => setTipoEquipo(tipo.id)}
                className={`p-6 rounded-lg border-2 transition-all duration-300 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${tipo.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-lg font-semibold text-gray-800">{tipo.label}</h4>
                    <p className="text-sm text-gray-600">{tipo.description}</p>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Renderizar el formulario correspondiente */}
      {tipoEquipo === 'notebook' && (
        <FormularioNotebook onAdd={onAddComputer} loading={loading} />
      )}
      {tipoEquipo === 'celular' && (
        <FormularioCelular onAdd={onAddCelular} loading={loading} />
      )}
      {tipoEquipo === 'otro' && (
        <FormularioOtro onAdd={onAddOtro} loading={loading} />
      )}
    </div>
  );
};

// Formulario para Notebook (copiado exacto de AgregarSection)
const FormularioNotebook = ({ onAdd, loading }) => {
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
      const precio_compra_total = 
        (parseFloat(formData.precio_compra_usd) || 0) + 
        (parseFloat(formData.precio_repuestos_usd) || 0);

      const dataToSubmit = {
        ...formData,
        precio_compra_total,
        porcentaje_de_bateria: parseInt(formData.porcentaje_de_bateria) || 0,
        disponible: true
      };

      await onAdd(dataToSubmit);
      
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
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Agregar Nueva Computadora</h3>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Información Básica */}
        <div className="col-span-full">
          <h4 className="text-lg font-semibold text-gray-700 mb-4">Información Básica</h4>
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
          <h4 className="text-lg font-semibold text-gray-700 mb-4 mt-6">Precios</h4>
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
          <h4 className="text-lg font-semibold text-gray-700 mb-4 mt-6">Especificaciones Técnicas</h4>
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
          <h4 className="text-lg font-semibold text-gray-700 mb-4 mt-6">Características Físicas</h4>
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

// Formulario para Celular (copiado exacto de AgregarCelularSection)
const FormularioCelular = ({ onAdd, loading }) => {
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
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Agregar Nuevo Celular</h3>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Información Básica */}
        <div className="col-span-full">
          <h4 className="text-lg font-semibold text-gray-700 mb-4">Información Básica</h4>
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
          <h4 className="text-lg font-semibold text-gray-700 mb-4 mt-6">Precios</h4>
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
          <h4 className="text-lg font-semibold text-gray-700 mb-4 mt-6">Estado y Condición</h4>
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

// Formulario para Otro Producto (copiado exacto de AgregarOtroSection)
const FormularioOtro = ({ onAdd, loading }) => {
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
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Agregar Nuevo Producto</h3>
      
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Información del Producto */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-700 mb-4">Información del Producto</h4>
            
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
            <h4 className="text-lg font-semibold text-gray-700 mb-4">Precios</h4>
            
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
                <h5 className="font-medium text-gray-700 mb-2">Análisis de Margen</h5>
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
              <h5 className="font-medium text-purple-800 mb-2">Resumen del Producto</h5>
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

export default CargaEquiposUnificada;