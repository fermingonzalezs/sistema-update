import React, { useState } from 'react';
import { Monitor, Smartphone, Box, Plus } from 'lucide-react';

const NuevoCargaEquipos = ({ onAddComputer, onAddCelular, onAddOtro, loading }) => {
  const [tipoEquipo, setTipoEquipo] = useState('notebook');

  const tiposEquipo = [
    {
      id: 'notebook',
      label: 'Notebook',
      icon: Monitor,
      description: 'Laptops y computadoras portátiles'
    },
    {
      id: 'celular',
      label: 'Celular',
      icon: Smartphone,
      description: 'Dispositivos móviles'
    },
    {
      id: 'otro',
      label: 'Otro Producto',
      icon: Box,
      description: 'Accesorios y otros productos'
    }
  ];

  return (
    <div className="">
    
      {/* Selector de tipo de equipo */}
      <div className="bg-slate-800 p-6 rounded border border-slate-200 mb-6">
        <div className="flex space-x-1 bg-slate-700 p-1 rounded">
          {tiposEquipo.map((tipo) => {
            const Icon = tipo.icon;
            const isSelected = tipoEquipo === tipo.id;
            
            return (
              <button
                key={tipo.id}
                onClick={() => setTipoEquipo(tipo.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded transition-colors ${
                  isSelected
                    ? 'bg-emerald-600 text-white'
                    : 'text-white hover:text-slate-800 hover:bg-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tipo.label}</span>
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

// Formulario para Notebook actualizado pero simplificado
const FormularioNotebook = ({ onAdd, loading }) => {
  const [formData, setFormData] = useState({
    // Campos básicos obligatorios
    serial: '',
    modelo: '',
    marca: '',
    
    // Precios
    precio_costo_usd: '',
    envios_repuestos: '0',
    precio_venta_usd: '',
    
    // Estado
    sucursal: 'la_plata',
    condicion: 'usado',
    
    // Especificaciones principales
    procesador: '',
    slots: '2',
    tipo_ram: 'DDR4',
    ram: '',
    ssd: '',
    hdd: '',
    so: 'WIN11',
    pantalla: '',
    resolucion: 'FHD',
    refresh: '',
    placa_video: '',
    vram: '',
    
    // Características físicas
    teclado_retro: 'SI',
    idioma_teclado: 'Español',
    color: '',
    
    // Batería
    bateria: '',
    duracion: '',
    
    // Garantía
    garantia_update: '6 meses',
    garantia_oficial: '',
    fallas: 'Ninguna',
    
    // Fecha automática
    ingreso: new Date().toISOString().split('T')[0]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedData = {
      ...formData,
      [name]: value
    };
    
    // Si se cambió la condición, actualizar disponibilidad automáticamente
    if (name === 'condicion') {
      const condicionesNoDisponibles = ['reparacion', 'reservado', 'prestado', 'sin_reparacion'];
      const esNoDisponible = condicionesNoDisponibles.includes(value);
      updatedData.disponible = !esNoDisponible;
    }
    
    setFormData(updatedData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.serial || !formData.modelo) {
      alert('Serial y Modelo son campos obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      const precio_costo_total = 
        (parseFloat(formData.precio_costo_usd) || 0) + 
        (parseFloat(formData.envios_repuestos) || 0);

      const dataToSubmit = {
        ...formData,
        precio_costo_total,
        disponible: true
      };

      await onAdd(dataToSubmit);
      
      // Reset form
      setFormData({
        serial: '',
        modelo: '',
        marca: '',
        precio_costo_usd: '',
        envios_repuestos: '0',
        precio_venta_usd: '',
        sucursal: 'la_plata',
        condicion: 'usado',
        procesador: '',
        slots: '2',
        tipo_ram: 'DDR4',
        ram: '',
        ssd: '',
        hdd: '',
        so: 'WIN11',
        pantalla: '',
        resolucion: 'FHD',
        refresh: '',
        placa_video: '',
        vram: '',
        teclado_retro: 'SI',
        idioma_teclado: 'Español',
        color: '',
        bateria: '',
        duracion: '',
        garantia_update: '6 meses',
        garantia_oficial: '',
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
    <div className="bg-white p-6 rounded border border-slate-200">
      <div className="border-b border-slate-200 mb-3">
        <h3 className="text-xl font-semibold text-slate-800 mb-6">Agregar Nueva Computadora</h3>
      </div>    
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Información Básica */}
        <div className="col-span-full">
          <h4 className="text-lg font-semibold text-slate-800 mb-4">Información Básica</h4>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Serial *</label>
          <input
            type="text"
            name="serial"
            value={formData.serial}
            onChange={handleChange}
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Modelo *</label>
          <input
            type="text"
            name="modelo"
            value={formData.modelo}
            onChange={handleChange}
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Marca</label>
          <input
            type="text"
            name="marca"
            value={formData.marca}
            onChange={handleChange}
            placeholder="ej: Lenovo, HP, Dell"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Condición</label>
          <select
            name="condicion"
            value={formData.condicion}
            onChange={handleChange}
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          >
            <option value="nuevo">NUEVO</option>
            <option value="refurbished">REFURBISHED</option>
            <option value="usado">USADO</option>
            <option value="reparacion">REPARACIÓN</option>
            <option value="reservado">RESERVADO</option>
            <option value="prestado">PRESTADO</option>
            <option value="sin_reparacion">SIN REPARACIÓN</option>
            <option value="reparacion">REPARACION</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Sucursal</label>
          <select
            name="sucursal"
            value={formData.sucursal}
            onChange={handleChange}
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          >
            <option value="la_plata">LA PLATA</option>
            <option value="mitre">MITRE</option>
            <option value="en_camino">EN CAMINO</option>
            <option value="rsn">RSN/IDM/FIXCENTER</option>
          </select>
        </div>

        {/* Precios */}
        <div className="col-span-full">
          <h4 className="text-lg font-semibold text-slate-800 mb-4 mt-6">Precios</h4>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Precio Costo USD</label>
          <input
            type="number"
            name="precio_costo_usd"
            value={formData.precio_costo_usd}
            onChange={handleChange}
            step="0.01"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Envíos/Repuestos USD</label>
          <input
            type="number"
            name="envios_repuestos"
            value={formData.envios_repuestos}
            onChange={handleChange}
            step="0.01"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Precio Venta USD</label>
          <input
            type="number"
            name="precio_venta_usd"
            value={formData.precio_venta_usd}
            onChange={handleChange}
            step="0.01"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        {/* Especificaciones Técnicas */}
        <div className="col-span-full">
          <h4 className="text-lg font-semibold text-slate-800 mb-4 mt-6">Especificaciones Técnicas</h4>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Procesador</label>
          <input
            type="text"
            name="procesador"
            value={formData.procesador}
            onChange={handleChange}
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Slots RAM</label>
          <select
            name="slots"
            value={formData.slots}
            onChange={handleChange}
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="4">4</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Tipo RAM</label>
          <select
            name="tipo_ram"
            value={formData.tipo_ram}
            onChange={handleChange}
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          >
            <option value="DDR3">DDR3</option>
            <option value="DDR4">DDR4</option>
            <option value="DDR5">DDR5</option>
            <option value="LPDDR4X">LPDDR4X</option>
            <option value="LPDDR5">LPDDR5</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">RAM</label>
          <input
            type="text"
            name="ram"
            value={formData.ram}
            onChange={handleChange}
            placeholder="ej: 16GB"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">SSD</label>
          <input
            type="text"
            name="ssd"
            value={formData.ssd}
            onChange={handleChange}
            placeholder="ej: 512GB"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">HDD</label>
          <input
            type="text"
            name="hdd"
            value={formData.hdd}
            onChange={handleChange}
            placeholder="ej: 1TB (opcional)"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Sistema Operativo</label>
          <select
            name="so"
            value={formData.so}
            onChange={handleChange}
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          >
            <option value="WIN11">Windows 11</option>
            <option value="WIN10">Windows 10</option>
            <option value="WIN10_PRO">Windows 10 Pro</option>
            <option value="MacOS">macOS</option>
            <option value="Ubuntu">Ubuntu</option>
            <option value="Sin SO">Sin Sistema</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Pantalla</label>
          <input
            type="text"
            name="pantalla"
            value={formData.pantalla}
            onChange={handleChange}
            placeholder="ej: 13,6''"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Resolución</label>
          <select
            name="resolucion"
            value={formData.resolucion}
            onChange={handleChange}
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          >
            <option value="FHD">FHD</option>
            <option value="QHD">QHD</option>
            <option value="4K">4K</option>
            <option value="5K">5K</option>
            <option value="2560x1664">2560x1664</option>
            <option value="3456x2234">3456x2234</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Refresh Rate</label>
          <input
            type="text"
            name="refresh"
            value={formData.refresh}
            onChange={handleChange}
            placeholder="ej: 60Hz, 120Hz, 144Hz"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">GPU</label>
          <input
            type="text"
            name="placa_video"
            value={formData.placa_video}
            onChange={handleChange}
            placeholder="ej: 8-core GPU"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">VRAM</label>
          <input
            type="text"
            name="vram"
            value={formData.vram}
            onChange={handleChange}
            placeholder="ej: 8GB"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        {/* Características Físicas */}
        <div className="col-span-full">
          <h4 className="text-lg font-semibold text-slate-800 mb-4 mt-6">Características Físicas</h4>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Retroiluminación Teclado</label>
          <select
            name="teclado_retro"
            value={formData.teclado_retro}
            onChange={handleChange}
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          >
            <option value="SI">Sí</option>
            <option value="NO">No</option>
            <option value="-">No aplica</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Idioma Teclado</label>
          <select
            name="idioma_teclado"
            value={formData.idioma_teclado}
            onChange={handleChange}
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          >
            <option value="Español">Español</option>
            <option value="Inglés">Inglés</option>
            <option value="Portugués">Portugués</option>
            <option value="-">No especificado</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Color</label>
          <input
            type="text"
            name="color"
            value={formData.color}
            onChange={handleChange}
            placeholder="ej: SKY BLUE"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        {/* Batería */}
        <div className="col-span-full">
          <h4 className="text-lg font-semibold text-slate-800 mb-4 mt-6">Batería</h4>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Estado Batería</label>
          <input
            type="text"
            name="bateria"
            value={formData.bateria}
            onChange={handleChange}
            placeholder="ej: 100% 59 ciclos"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Duración Batería</label>
          <input
            type="text"
            name="duracion"
            value={formData.duracion}
            onChange={handleChange}
            placeholder="ej: 6-7HS"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        {/* Garantía */}
        <div className="col-span-full">
          <h4 className="text-lg font-semibold text-slate-800 mb-4 mt-6">Garantía y Observaciones</h4>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Garantía</label>
          <input
            type="text"
            name="garantia_update"
            value={formData.garantia_update}
            onChange={handleChange}
            placeholder="ej: 6 meses"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Garantía Oficial</label>
          <input
            type="text"
            name="garantia_oficial"
            value={formData.garantia_oficial}
            onChange={handleChange}
            placeholder="ej: Apple"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Fallas</label>
          <input
            type="text"
            name="fallas"
            value={formData.fallas}
            onChange={handleChange}
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        {/* Botón de envío */}
        <div className="col-span-full mt-6">
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="w-full bg-blue-600 text-white px-8 py-3 rounded font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Guardando...' : 'Agregar Computadora'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Formulario para Celular actualizado
const FormularioCelular = ({ onAdd, loading }) => {
  const [formData, setFormData] = useState({
    // Campos básicos obligatorios
    serial: '',
    modelo: '',
    marca: '',
    
    // Precios
    precio_compra_usd: '',
    repuestos_usd: '0',
    precio_venta_usd: '',
    
    // Estado y ubicación
    condicion: 'usado',
    ubicacion: 'la_plata',
    
    // Características del celular
    color: '',
    capacidad: '',
    almacenamiento: '128GB',
    bateria: '',
    porcentaje_bateria: '',
    ciclos: '',
    estado: '',
    estado_estetico: 'B',
    
    // Garantía y observaciones
    garantia: '3 meses',
    garantia_update: '3 meses',
    garantia_oficial: '',
    fallas: 'Ninguna',
    
    // Fecha automática
    ingreso: new Date().toISOString().split('T')[0]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedData = {
      ...formData,
      [name]: value
    };
    
    // Si se cambió la condición, actualizar disponibilidad automáticamente
    if (name === 'condicion') {
      const condicionesNoDisponibles = ['reparacion', 'reservado', 'prestado', 'sin_reparacion'];
      const esNoDisponible = condicionesNoDisponibles.includes(value);
      updatedData.disponible = !esNoDisponible;
    }
    
    setFormData(updatedData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.serial || !formData.modelo) {
      alert('Serial y Modelo son campos obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      // Calcular precio compra total
      const precio_compra_total = 
        (parseFloat(formData.precio_compra_usd) || 0) + 
        (parseFloat(formData.repuestos_usd) || 0);

      const dataToSubmit = {
        ...formData,
        precio_compra_total,
        disponible: true
      };

      await onAdd(dataToSubmit);
      
      // Reset form
      setFormData({
        serial: '',
        modelo: '',
        precio_compra_usd: '',
        repuestos_usd: '0',
        precio_venta_usd: '',
        condicion: 'usado',
        ubicacion: 'la_plata',
        color: '',
        almacenamiento: '128GB',
        porcentaje_bateria: '',
        estado_estetico: 'B',
        garantia_update: '3 meses',
        garantia_oficial: '',
        fallas: 'Ninguna',
        ingreso: new Date().toISOString().split('T')[0]
      });
      
      alert('✅ Celular agregado exitosamente!');
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded border border-slate-200">

      <div className="border-b border-slate-200 mb-3">
        <h3 className="text-xl font-semibold text-slate-800 mb-6">Agregar Nuevo Celular</h3>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Información Básica */}
        <div className="col-span-full">
          <h4 className="text-lg font-semibold text-slate-800 mb-4">Información Básica</h4>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Serial *</label>
          <input
            type="text"
            name="serial"
            value={formData.serial}
            onChange={handleChange}
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Modelo *</label>
          <input
            type="text"
            name="modelo"
            value={formData.modelo}
            onChange={handleChange}
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Marca</label>
          <input
            type="text"
            name="marca"
            value={formData.marca}
            onChange={handleChange}
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
            placeholder="Apple, Samsung, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Condición</label>
          <select
            name="condicion"
            value={formData.condicion}
            onChange={handleChange}
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          >
            <option value="nuevo">NUEVO</option>
            <option value="refurbished">REFURBISHED</option>
            <option value="usado">USADO</option>
            <option value="reparacion">REPARACIÓN</option>
            <option value="reservado">RESERVADO</option>
            <option value="prestado">PRESTADO</option>
            <option value="sin_reparacion">SIN REPARACIÓN</option>
            <option value="reparacion">REPARACION</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Ubicación</label>
          <select
            name="ubicacion"
            value={formData.ubicacion}
            onChange={handleChange}
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          >
            <option value="la_plata">LA PLATA</option>
            <option value="mitre">MITRE</option>
            <option value="fixcenter">FIXCENTER</option>
            <option value="en_camino">EN CAMINO</option>
          </select>
        </div>

        {/* Precios */}
        <div className="col-span-full">
          <h4 className="text-lg font-semibold text-slate-800 mb-4 mt-6">Precios</h4>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Precio Compra USD</label>
          <input
            type="number"
            name="precio_compra_usd"
            value={formData.precio_compra_usd}
            onChange={handleChange}
            step="0.01"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Repuestos USD</label>
          <input
            type="number"
            name="repuestos_usd"
            value={formData.repuestos_usd}
            onChange={handleChange}
            step="0.01"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Precio Venta USD</label>
          <input
            type="number"
            name="precio_venta_usd"
            value={formData.precio_venta_usd}
            onChange={handleChange}
            step="0.01"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        {/* Mostrar cálculo en tiempo real */}
        {formData.precio_compra_usd && formData.repuestos_usd && (
          <div className="col-span-full">
            <div className="bg-emerald-50 border border-emerald-200 rounded p-4">
              <h5 className="font-medium text-emerald-800 mb-2">💰 Cálculo de Precios</h5>
              <div className="text-sm text-emerald-700">
                <p><strong>Precio Compra Total:</strong> ${((parseFloat(formData.precio_compra_usd) || 0) + (parseFloat(formData.repuestos_usd) || 0)).toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Características del Celular */}
        <div className="col-span-full">
          <h4 className="text-lg font-semibold text-slate-800 mb-4 mt-6">Características del Celular</h4>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Color</label>
          <input
            type="text"
            name="color"
            value={formData.color}
            onChange={handleChange}
            placeholder="ej: Negro, Blanco, Azul"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Capacidad</label>
          <input
            type="text"
            name="capacidad"
            value={formData.capacidad}
            onChange={handleChange}
            placeholder="ej: 128GB, 256GB"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Almacenamiento</label>
          <select
            name="almacenamiento"
            value={formData.almacenamiento}
            onChange={handleChange}
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          >
            <option value="64GB">64GB</option>
            <option value="128GB">128GB</option>
            <option value="256GB">256GB</option>
            <option value="512GB">512GB</option>
            <option value="1TB">1TB</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Batería</label>
          <input
            type="text"
            name="bateria"
            value={formData.bateria}
            onChange={handleChange}
            placeholder="ej: 85%, 3000mAh"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Porcentaje de Batería</label>
          <input
            type="text"
            name="porcentaje_bateria"
            value={formData.porcentaje_bateria}
            onChange={handleChange}
            placeholder="ej: 85%, 100%"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Ciclos de Batería</label>
          <input
            type="text"
            name="ciclos"
            value={formData.ciclos}
            onChange={handleChange}
            placeholder="ej: 150, 200"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Estado General</label>
          <input
            type="text"
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            placeholder="ej: Muy Bueno, Bueno, Regular"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Estado Estético</label>
          <select
            name="estado_estetico"
            value={formData.estado_estetico}
            onChange={handleChange}
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          >
            <option value="A+">A+</option>
            <option value="A">A</option>
            <option value="B+">B+</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </div>

        {/* Garantía y Observaciones */}
        <div className="col-span-full">
          <h4 className="text-lg font-semibold text-slate-800 mb-4 mt-6">Garantía y Observaciones</h4>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Garantía</label>
          <input
            type="text"
            name="garantia"
            value={formData.garantia}
            onChange={handleChange}
            placeholder="ej: 3 meses"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Garantía Update</label>
          <input
            type="text"
            name="garantia_update"
            value={formData.garantia_update}
            onChange={handleChange}
            placeholder="ej: 3 meses"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Garantía Oficial</label>
          <input
            type="text"
            name="garantia_oficial"
            value={formData.garantia_oficial}
            onChange={handleChange}
            placeholder="ej: Samsung, Apple"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Fallas</label>
          <input
            type="text"
            name="fallas"
            value={formData.fallas}
            onChange={handleChange}
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        {/* Botón de envío */}
        <div className="col-span-full mt-6">
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="w-full bg-blue-600 text-white px-8 py-3 rounded font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Guardando...' : 'Agregar Celular'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Formulario para Otro Producto actualizado
// Formulario para Otro Producto actualizado con todas las columnas requeridas
const FormularioOtro = ({ onAdd, loading }) => {
  const [formData, setFormData] = useState({
    // Información básica del producto
    descripcion_producto: '', // DESCRIPCIÓN
    cantidad: 1, // CANTIDAD
    
    // Precios
    precio_compra_usd: '', // P.C. USD
    precio_venta_usd: '', // P.V. USD
    precio_venta_pesos: '', // P.V. PESOS
    
    // Estado y ubicación
    condicion: 'nuevo', // CONDICIÓN
    categoria: '', // CATEGORÍA
    sucursal: 'la_plata',
    
    // Garantía y observaciones
    garantia: '', // GARANTÍA
    fallas: 'Ninguna', // FALLAS
    
    // Fecha automática
    ingreso: new Date().toISOString().split('T')[0],
    disponible: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Opciones para los selects
  const opcionesCondicion = [
    { value: 'nuevo', label: 'NUEVO' },
    { value: 'refurbished', label: 'REFURBISHED' },
    { value: 'usado', label: 'USADO' },
    { value: 'reparacion', label: 'REPARACIÓN' },
    { value: 'reservado', label: 'RESERVADO' },
    { value: 'prestado', label: 'PRESTADO' },
    { value: 'sin_reparacion', label: 'SIN REPARACIÓN' }
  ];

  const opcionesCategorias = [
    { value: 'accesorios', label: 'Accesorios' },
    { value: 'cables', label: 'Cables' },
    { value: 'cargadores', label: 'Cargadores' },
    { value: 'mouse', label: 'Mouse' },
    { value: 'teclados', label: 'Teclados' },
    { value: 'headsets', label: 'Headsets' },
    { value: 'webcam', label: 'Webcam' },
    { value: 'monitores', label: 'Monitores' },
    { value: 'speakers', label: 'Speakers' },
    { value: 'almacenamiento', label: 'Almacenamiento' },
    { value: 'memorias', label: 'Memorias RAM' },
    { value: 'componentes', label: 'Componentes PC' },
    { value: 'fundas', label: 'Fundas y Cases' },
    { value: 'repuestos', label: 'Repuestos' },
    { value: 'otros', label: 'Otros' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedData = {
      ...formData,
      [name]: value
    };
    
    // Si se cambió la condición, actualizar disponibilidad automáticamente
    if (name === 'condicion') {
      const condicionesNoDisponibles = ['reparacion', 'reservado', 'prestado', 'sin_reparacion'];
      const esNoDisponible = condicionesNoDisponibles.includes(value);
      updatedData.disponible = !esNoDisponible;
    }
    
    setFormData(updatedData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.descripcion_producto.trim()) {
      alert('La descripción del producto es obligatoria');
      return;
    }
    
    if (!formData.categoria) {
      alert('Por favor selecciona una categoría');
      return;
    }

    if (formData.cantidad < 1) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSubmit = {
        ...formData,
        // Asegurar que la cantidad sea un número
        cantidad: parseInt(formData.cantidad) || 1,
        // Asegurar que los precios sean números
        precio_compra_usd: parseFloat(formData.precio_compra_usd) || 0,
        precio_venta_usd: parseFloat(formData.precio_venta_usd) || 0,
        precio_venta_pesos: parseFloat(formData.precio_venta_pesos) || 0
      };

      await onAdd(dataToSubmit);
      
      // Reset form
      setFormData({
        descripcion_producto: '',
        cantidad: 1,
        precio_compra_usd: '',
        precio_venta_usd: '',
        precio_venta_pesos: '',
        condicion: 'nueva',
        categoria: '',
        sucursal: 'la_plata',
        garantia: '',
        fallas: 'Ninguna',
        ingreso: new Date().toISOString().split('T')[0],
        disponible: true
      });
      
      alert('✅ Producto agregado exitosamente!');
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Funciones para cálculos
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

  const calcularValorInventario = () => {
    const precioVenta = parseFloat(formData.precio_venta_usd) || 0;
    const cantidad = parseInt(formData.cantidad) || 1;
    return (precioVenta * cantidad).toFixed(2);
  };

  return (
    <div className="bg-white p-6 rounded border border-slate-200">
      <div className="border-b border-slate-200 mb-3">
          <h3 className="text-xl font-semibold text-slate-800 mb-6">Agregar Nuevo Producto</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Información Básica del Producto */}
        <div className="col-span-full">
          <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Box className="w-5 h-5 mr-2 text-emerald-600" />
            Información del Producto
          </h4>
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-800 mb-2">
            Descripción del Producto *
            <span className="text-xs text-slate-500 ml-1">(DESCRIPCIÓN)</span>
          </label>
          <input
            type="text"
            name="descripcion_producto"
            value={formData.descripcion_producto}
            onChange={handleChange}
            placeholder="ej: Mouse Logitech MX Master 3 Wireless"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">
            Cantidad *
            <span className="text-xs text-slate-500 ml-1">(CANTIDAD)</span>
          </label>
          <input
            type="number"
            name="cantidad"
            value={formData.cantidad}
            onChange={handleChange}
            min="1"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">
            Categoría *
            <span className="text-xs text-slate-500 ml-1">(CATEGORÍA)</span>
          </label>
          <select
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
            required
          >
            <option value="">Seleccionar categoría...</option>
            {opcionesCategorias.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">
            Condición *
            <span className="text-xs text-slate-500 ml-1">(CONDICIÓN)</span>
          </label>
          <select
            name="condicion"
            value={formData.condicion}
            onChange={handleChange}
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          >
            {opcionesCondicion.map(cond => (
              <option key={cond.value} value={cond.value}>{cond.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Sucursal</label>
          <select
            name="sucursal"
            value={formData.sucursal}
            onChange={handleChange}
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          >
            <option value="la_plata">LA PLATA</option>
            <option value="mitre">MITRE</option>
            <option value="en_camino">EN CAMINO</option>
            <option value="rsn">RSN/IDM/FIXCENTER</option>
          </select>
        </div>

        {/* Información de Precios */}
        <div className="col-span-full">
          <h4 className="text-lg font-semibold text-slate-800 mb-4 mt-6 flex items-center">
            💰 Precios y Costos
          </h4>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">
            Precio de Compra USD
            <span className="text-xs text-slate-500 ml-1">(P.C. USD)</span>
          </label>
          <input
            type="number"
            name="precio_compra_usd"
            value={formData.precio_compra_usd}
            onChange={handleChange}
            step="0.01"
            placeholder="0.00"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">
            Precio de Venta USD
            <span className="text-xs text-slate-500 ml-1">(P.V. USD)</span>
          </label>
          <input
            type="number"
            name="precio_venta_usd"
            value={formData.precio_venta_usd}
            onChange={handleChange}
            step="0.01"
            placeholder="0.00"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        {/* Análisis de Precios */}
        {(formData.precio_compra_usd || formData.precio_venta_usd) && (
          <div className="col-span-full">
            <div className="bg-emerald-50 border border-emerald-200 rounded p-4">
              <h5 className="font-medium text-emerald-800 mb-3">📊 Análisis de Rentabilidad</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-white p-3 rounded border">
                  <span className="text-slate-600 block text-xs">Margen por unidad (USD)</span>
                  <p className={`font-bold text-lg ${calcularMargen() >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ${calcularMargen().toFixed(2)}
                  </p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <span className="text-slate-600 block text-xs">Porcentaje de ganancia</span>
                  <p className={`font-bold text-lg ${calcularMargen() >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {calcularPorcentajeMargen()}%
                  </p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <span className="text-slate-600 block text-xs">Margen total (USD)</span>
                  <p className={`font-bold text-lg ${calcularMargen() >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ${(calcularMargen() * (parseInt(formData.cantidad) || 1)).toFixed(2)}
                  </p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <span className="text-slate-600 block text-xs">Valor inventario (USD)</span>
                  <p className="font-bold text-lg text-emerald-600">
                    ${calcularValorInventario()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Garantía y Observaciones */}
        <div className="col-span-full">
          <h4 className="text-lg font-semibold text-slate-800 mb-4 mt-6 flex items-center">
            🛡️ Garantía y Observaciones
          </h4>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">
            Garantía
            <span className="text-xs text-slate-500 ml-1">(GARANTÍA)</span>
          </label>
          <input
            type="text"
            name="garantia"
            value={formData.garantia}
            onChange={handleChange}
            placeholder="ej: 1 año, 6 meses, Sin garantía"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-800 mb-2">
            Fallas/Observaciones
            <span className="text-xs text-slate-500 ml-1">(FALLAS)</span>
          </label>
          <input
            type="text"
            name="fallas"
            value={formData.fallas}
            onChange={handleChange}
            placeholder="Describe cualquier defecto o observación importante"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        {/* Resumen del Producto */}
        {formData.descripcion_producto && formData.categoria && (
          <div className="col-span-full">
            <div className="bg-emerald-50 border border-emerald-200 rounded p-4">
              <h5 className="font-medium text-emerald-800 mb-3 flex items-center">
                📦 Resumen del Producto
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Producto:</strong> {formData.descripcion_producto}</p>
                  <p><strong>Categoría:</strong> {opcionesCategorias.find(c => c.value === formData.categoria)?.label}</p>
                  <p><strong>Cantidad:</strong> {formData.cantidad} unidades</p>
                  <p><strong>Condición:</strong> {opcionesCondicion.find(c => c.value === formData.condicion)?.label}</p>
                </div>
                <div>
                  <p><strong>Sucursal:</strong> {formData.sucursal.replace('_', ' ').toUpperCase()}</p>
                  <p><strong>Garantía:</strong> {formData.garantia || 'No especificada'}</p>
                  {formData.precio_venta_usd && (
                    <p><strong>Valor total inventario:</strong> ${calcularValorInventario()}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botón de envío */}
        <div className="col-span-full mt-6">
  <button
    type="submit"
    disabled={isSubmitting || loading || !formData.descripcion_producto || !formData.categoria}
    className="w-full bg-blue-600 text-white px-6 py-3 rounded font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
  >
    {isSubmitting ? (
      <span className="flex items-center justify-center">
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Guardando Producto...
      </span>
    ) : (
      '✅ Agregar Producto'
    )}
  </button>
</div>
      </form>
    </div>
  );
};

export default NuevoCargaEquipos;