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
    sucursal: 'LA PLATA',
    condicion: 'usado',
    estado: 'A',
    
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
    touchscreen: false,
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
    
    // Fecha de ingreso
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
    if (!formData.serial || !formData.modelo || !formData.precio_costo_usd || !formData.precio_venta_usd) {
      alert('Serial, Modelo, Precio de Compra y Precio de Venta son campos obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      // No incluir precio_costo_total ya que es una columna generada automáticamente
      const dataToSubmit = {
        ...formData,
        disponible: true
        // precio_costo_total se calcula automáticamente como precio_costo_usd + envios_repuestos
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
        sucursal: 'LA PLATA',
        condicion: 'usado',
        estado: 'A',
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
        touchscreen: false,
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
    <div className="bg-white rounded border border-slate-200 overflow-hidden">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
        <div className="flex items-center space-x-3">
          <Monitor className="w-6 h-6 text-white" />
          <h3 className="text-xl font-semibold text-white">Nueva Notebook</h3>
        </div>
        <p className="text-slate-300 text-sm mt-1">Complete la información del equipo</p>
      </div>
      
      <div className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Sección: Información Básica */}
          <div className="bg-slate-50 rounded p-6 border border-slate-200">
            <h4 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
              <div className="w-2 h-2 bg-emerald-600 rounded-full mr-3"></div>
              Información Básica
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Número de Serie *
                  <span className="text-xs text-slate-500 ml-1">(Serial)</span>
                </label>
                <input
                  type="text"
                  name="serial"
                  value={formData.serial}
                  onChange={handleChange}
                  placeholder="Ej: ABC123456789"
                  className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Modelo *
                  <span className="text-xs text-slate-500 ml-1">(Modelo)</span>
                </label>
                <input
                  type="text"
                  name="modelo"
                  value={formData.modelo}
                  onChange={handleChange}
                  placeholder="Ej: ThinkPad X1 Carbon"
                  className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Marca
                  <span className="text-xs text-slate-500 ml-1">(Marca)</span>
                </label>
                <input
                  type="text"
                  name="marca"
                  value={formData.marca}
                  onChange={handleChange}
                  placeholder="Ej: Lenovo, HP, Dell"
                  className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Fecha de Ingreso *
                  <span className="text-xs text-slate-500 ml-1">(Ingreso)</span>
                </label>
                <input
                  type="date"
                  name="ingreso"
                  value={formData.ingreso}
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Condición
                  <span className="text-xs text-slate-500 ml-1">(Estado físico)</span>
                </label>
                <select
                  name="condicion"
                  value={formData.condicion}
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                >
                  <option value="nuevo">Nuevo</option>
                  <option value="usado">Usado</option>
                  <option value="reacondicionado">Reacondicionado</option>
                  <option value="reparacion">En Reparación</option>
                  <option value="reservado">Reservado</option>
                  <option value="prestado">Prestado</option>
                  <option value="sin_reparacion">Sin Reparación</option>
                  <option value="en_preparacion">En Preparación</option>
                  <option value="uso_oficina">Uso Oficina</option>
                  <option value="defectuoso">Defectuoso</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Sucursal
                  <span className="text-xs text-slate-500 ml-1">(Ubicación)</span>
                </label>
                <select
                  name="sucursal"
                  value={formData.sucursal}
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                >
                  <option value="LA PLATA">La Plata</option>
                  <option value="MITRE">Mitre</option>
                  <option value="RSN/IDM/FIXCENTER">RSN/IDM/FixCenter</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Estado de Calidad
                  <span className="text-xs text-slate-500 ml-1">(Grado)</span>
                </label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                >
                  <option value="A+">A+ (Excelente)</option>
                  <option value="A">A (Muy Bueno)</option>
                  <option value="A-">A- (Bueno)</option>
                  <option value="B+">B+ (Regular)</option>
                  <option value="B">B (Funcional)</option>
                  <option value="B-">B- (Con detalles)</option>
                  <option value="C">C (Para repuestos)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sección: Información Comercial */}
          <div className="bg-emerald-50 rounded p-6 border border-emerald-200">
            <h4 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
              <div className="w-2 h-2 bg-emerald-600 rounded-full mr-3"></div>
              Información Comercial
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Precio de Costo *
                  <span className="text-xs text-slate-500 ml-1">(USD)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500">$</span>
                  <input
                    type="number"
                    name="precio_costo_usd"
                    value={formData.precio_costo_usd}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Gastos Adicionales
                  <span className="text-xs text-slate-500 ml-1">(Envíos/Repuestos USD)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500">$</span>
                  <input
                    type="number"
                    name="envios_repuestos"
                    value={formData.envios_repuestos}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Precio de Venta *
                  <span className="text-xs text-slate-500 ml-1">(USD)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500">$</span>
                  <input
                    type="number"
                    name="precio_venta_usd"
                    value={formData.precio_venta_usd}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sección: Especificaciones Técnicas */}
          <div className="bg-blue-50 rounded p-6 border border-blue-200">
            <h4 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              Especificaciones Técnicas
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Procesador
                  <span className="text-xs text-slate-500 ml-1">(CPU)</span>
                </label>
                <input
                  type="text"
                  name="procesador"
                  value={formData.procesador}
                  onChange={handleChange}
                  placeholder="Ej: Intel Core i7-1165G7"
                  className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
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
          <label className="block text-sm font-medium text-slate-800 mb-2">Touchscreen</label>
          <select
            name="touchscreen"
            value={formData.touchscreen}
            onChange={handleChange}
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          >
            <option value={false}>No</option>
            <option value={true}>Sí</option>
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

            </div>
          </div>

          {/* Sección: Garantía y Observaciones */}
          <div className="bg-amber-50 rounded p-6 border border-amber-200">
            <h4 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
              <div className="w-2 h-2 bg-amber-600 rounded-full mr-3"></div>
              Garantía y Observaciones
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Garantía Update
                  <span className="text-xs text-slate-500 ml-1">(Período)</span>
                </label>
                <input
                  type="text"
                  name="garantia_update"
                  value={formData.garantia_update}
                  onChange={handleChange}
                  placeholder="Ej: 6 meses"
                  className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Garantía Oficial
                  <span className="text-xs text-slate-500 ml-1">(Fabricante)</span>
                </label>
                <input
                  type="text"
                  name="garantia_oficial"
                  value={formData.garantia_oficial}
                  onChange={handleChange}
                  placeholder="Ej: Apple, Lenovo"
                  className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Fallas Conocidas
                  <span className="text-xs text-slate-500 ml-1">(Observaciones)</span>
                </label>
                <input
                  type="text"
                  name="fallas"
                  value={formData.fallas}
                  onChange={handleChange}
                  placeholder="Ej: Ninguna"
                  className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Botón de envío */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="bg-emerald-600 text-white px-8 py-3 rounded font-semibold hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Monitor className="w-4 h-4" />
                  <span>Agregar Notebook</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Formulario para Celular actualizado
const FormularioCelular = ({ onAdd, loading }) => {
  const [formData, setFormData] = useState({
    // Campos básicos obligatorios según tabla celulares
    serial: '',
    condicion: 'usado',
    
    // Campos opcionales
    modelo: '',
    marca: '',
    sucursal: 'LA PLATA',
    precio_compra_usd: '',
    precio_venta_usd: '',
    capacidad: '',
    color: '',
    estado: 'A',
    bateria: '', // Solo porcentaje, ej: "85%"
    ciclos: '', // Integer opcional
    garantia: '3 meses',
    fallas: 'Ninguna'
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
    if (!formData.serial || !formData.modelo || !formData.precio_compra_usd || !formData.precio_venta_usd) {
      alert('Serial, Modelo, Precio de Compra y Precio de Venta son campos obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSubmit = {
        ...formData,
        // Convertir ciclos a integer si tiene valor
        ciclos: formData.ciclos ? parseInt(formData.ciclos) : null,
        // Convertir precios a numeric
        precio_compra_usd: parseFloat(formData.precio_compra_usd) || null,
        precio_venta_usd: parseFloat(formData.precio_venta_usd) || null,
        disponible: true
      };

      await onAdd(dataToSubmit);
      
      // Reset form
      setFormData({
        serial: '',
        condicion: 'usado',
        modelo: '',
        marca: '',
        sucursal: 'LA PLATA',
        precio_compra_usd: '',
        precio_venta_usd: '',
        capacidad: '',
        color: '',
        estado: 'A',
        bateria: '',
        ciclos: '',
        garantia: '3 meses',
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
            <option value="nuevo">Nuevo</option>
            <option value="usado">Usado</option>
            <option value="reacondicionado">Reacondicionado</option>
            <option value="reparacion">Reparación</option>
            <option value="reservado">Reservado</option>
            <option value="prestado">Prestado</option>
            <option value="sin_reparacion">Sin Reparación</option>
            <option value="en_preparacion">En Preparación</option>
            <option value="otro">Otro</option>
            <option value="uso_oficina">Uso Oficina</option>
            <option value="defectuoso">Defectuoso</option>
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
            <option value="LA PLATA">LA PLATA</option>
            <option value="MITRE">MITRE</option>
            <option value="RSN/IDM/FIXCENTER">RSN/IDM/FIXCENTER</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Estado</label>
          <select
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          >
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="A">A</option>
            <option value="B+">B+</option>
            <option value="B">B</option>
            <option value="B-">B-</option>
            <option value="C">C</option>
          </select>
        </div>

        {/* Precios */}
        <div className="col-span-full">
          <h4 className="text-lg font-semibold text-slate-800 mb-4 mt-6">Precios</h4>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Precio Compra USD *</label>
          <input
            type="number"
            name="precio_compra_usd"
            value={formData.precio_compra_usd}
            onChange={handleChange}
            step="0.01"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Precio Venta USD *</label>
          <input
            type="number"
            name="precio_venta_usd"
            value={formData.precio_venta_usd}
            onChange={handleChange}
            step="0.01"
            placeholder="0.00"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
            required
          />
        </div>

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
          <select
            name="capacidad"
            value={formData.capacidad}
            onChange={handleChange}
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          >
            <option value="">Seleccionar...</option>
            <option value="64GB">64GB</option>
            <option value="128GB">128GB</option>
            <option value="256GB">256GB</option>
            <option value="512GB">512GB</option>
            <option value="1TB">1TB</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Batería (%)</label>
          <input
            type="text"
            name="bateria"
            value={formData.bateria}
            onChange={handleChange}
            placeholder="ej: 85%, 100%"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Ciclos (opcional)</label>
          <input
            type="number"
            name="ciclos"
            value={formData.ciclos}
            onChange={handleChange}
            placeholder="ej: 150"
            min="0"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
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
            className="w-full bg-emerald-600 text-white px-8 py-3 rounded font-semibold hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
    nombre_producto: '', // NOMBRE_PRODUCTO
    descripcion: '', // DESCRIPCIÓN
    categoria: '', // CATEGORÍA
    
    // Precios
    precio_compra_usd: '', // P.C. USD
    precio_venta_usd: '', // P.V. USD
    
    // Cantidades por sucursal
    cantidad_la_plata: 0, // CANTIDAD LA PLATA
    cantidad_mitre: 0, // CANTIDAD MITRE
    
    // Garantía y observaciones
    garantia: '', // GARANTÍA
    observaciones: '' // OBSERVACIONES
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
    if (!formData.nombre_producto.trim()) {
      alert('El nombre del producto es obligatorio');
      return;
    }
    
    if (!formData.categoria) {
      alert('Por favor selecciona una categoría');
      return;
    }

    if (!formData.precio_compra_usd || !formData.precio_venta_usd) {
      alert('Precio de Compra y Precio de Venta son obligatorios');
      return;
    }

    if ((formData.cantidad_la_plata || 0) + (formData.cantidad_mitre || 0) < 1) {
      alert('Debe ingresar al menos 1 unidad en alguna sucursal');
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSubmit = {
        ...formData,
        // Asegurar que las cantidades sean números
        cantidad_la_plata: parseInt(formData.cantidad_la_plata) || 0,
        cantidad_mitre: parseInt(formData.cantidad_mitre) || 0,
        // Asegurar que los precios sean números
        precio_compra_usd: parseFloat(formData.precio_compra_usd) || 0,
        precio_venta_usd: parseFloat(formData.precio_venta_usd) || 0
      };

      await onAdd(dataToSubmit);
      
      // Reset form
      setFormData({
        nombre_producto: '',
        descripcion: '',
        categoria: '',
        precio_compra_usd: '',
        precio_venta_usd: '',
        cantidad_la_plata: 0,
        cantidad_mitre: 0,
        garantia: '',
        observaciones: ''
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
    const cantidadTotal = (parseInt(formData.cantidad_la_plata) || 0) + (parseInt(formData.cantidad_mitre) || 0);
    return (precioVenta * cantidadTotal).toFixed(2);
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
            Nombre del Producto *
            <span className="text-xs text-slate-500 ml-1">(NOMBRE_PRODUCTO)</span>
          </label>
          <input
            type="text"
            name="nombre_producto"
            value={formData.nombre_producto}
            onChange={handleChange}
            placeholder="ej: Mouse Logitech MX Master 3 Wireless"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
            required
          />
        </div>

        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-slate-800 mb-2">
            Descripción
            <span className="text-xs text-slate-500 ml-1">(DESCRIPCION)</span>
          </label>
          <input
            type="text"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            placeholder="Descripción adicional..."
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">
            Cantidad La Plata
            <span className="text-xs text-slate-500 ml-1">(CANTIDAD_LA_PLATA)</span>
          </label>
          <input
            type="number"
            name="cantidad_la_plata"
            value={formData.cantidad_la_plata}
            onChange={handleChange}
            min="0"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">
            Cantidad Mitre
            <span className="text-xs text-slate-500 ml-1">(CANTIDAD_MITRE)</span>
          </label>
          <input
            type="number"
            name="cantidad_mitre"
            value={formData.cantidad_mitre}
            onChange={handleChange}
            min="0"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
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


        {/* Información de Precios */}
        <div className="col-span-full">
          <h4 className="text-lg font-semibold text-slate-800 mb-4 mt-6 flex items-center">
            💰 Precios y Costos
          </h4>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">
            Precio de Compra USD *
            <span className="text-xs text-slate-500 ml-1">(PRECIO_COMPRA_USD)</span>
          </label>
          <input
            type="number"
            name="precio_compra_usd"
            value={formData.precio_compra_usd}
            onChange={handleChange}
            step="0.01"
            placeholder="0.00"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">
            Precio de Venta USD *
            <span className="text-xs text-slate-500 ml-1">(PRECIO_VENTA_USD)</span>
          </label>
          <input
            type="number"
            name="precio_venta_usd"
            value={formData.precio_venta_usd}
            onChange={handleChange}
            step="0.01"
            placeholder="0.00"
            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
            required
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
            <span className="text-xs text-slate-500 ml-1">(GARANTIA)</span>
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
            Observaciones
            <span className="text-xs text-slate-500 ml-1">(OBSERVACIONES)</span>
          </label>
          <input
            type="text"
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            placeholder="Describe cualquier observación importante"
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
    disabled={isSubmitting || loading || !formData.nombre_producto || !formData.categoria}
    className="w-full bg-emerald-600 text-white px-6 py-3 rounded font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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