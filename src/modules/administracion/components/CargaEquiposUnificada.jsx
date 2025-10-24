import React, { useState } from 'react';
import { Monitor, Smartphone, Box, Plus } from 'lucide-react';
import {
  CONDICIONES,
  CONDICIONES_ARRAY,
  CONDICIONES_LABELS,
  ESTADOS,
  ESTADOS_ARRAY,
  ESTADOS_LABELS,
  UBICACIONES,
  UBICACIONES_ARRAY,
  UBICACIONES_LABELS,
  CATEGORIAS_NOTEBOOKS,
  CATEGORIAS_NOTEBOOKS_ARRAY,
  CATEGORIAS_NOTEBOOKS_LABELS,
  CATEGORIAS_CELULARES,
  CATEGORIAS_CELULARES_ARRAY,
  CATEGORIAS_CELULARES_LABELS
} from '../../../shared/constants/productConstants';
import {
  CATEGORIAS_OTROS,
  CATEGORIAS_OTROS_ARRAY,
  CATEGORIAS_OTROS_LABELS
} from '../../../shared/constants/categoryConstants';

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

// Formulario para Notebook renovado y organizado
const FormularioNotebook = ({ onAdd, loading }) => {
  const [formData, setFormData] = useState({
    // Campos básicos obligatorios
    serial: '',
    modelo: '',
    marca: '',
    categoria: CATEGORIAS_NOTEBOOKS.WINDOWS, // Categoría por defecto

    // Precios
    precio_costo_usd: '',
    envios_repuestos: '0',
    precio_venta_usd: '',

    // Estado
    sucursal: UBICACIONES.LA_PLATA,
    condicion: CONDICIONES.NUEVO,
    estado: null, // null por defecto cuando es nuevo

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

    // Si se cambia la condición a 'nuevo', establecer estado como null
    if (name === 'condicion' && value === CONDICIONES.NUEVO) {
      updatedData.estado = null;
    }

    // La disponibilidad ahora se maneja por eliminación directa tras venta
    // No es necesario actualizar el campo 'disponible'

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
      const dataToSubmit = {
        ...formData,
        // Si condicion es 'nuevo', asegurar que estado sea null
        estado: formData.condicion === CONDICIONES.NUEVO ? null : formData.estado
      };

      await onAdd(dataToSubmit);

      // Reset form
      setFormData({
        serial: '',
        modelo: '',
        marca: '',
        categoria: CATEGORIAS_NOTEBOOKS.WINDOWS,
        precio_costo_usd: '',
        envios_repuestos: '0',
        precio_venta_usd: '',
        sucursal: UBICACIONES.LA_PLATA,
        condicion: CONDICIONES.NUEVO,
        estado: null, // null por defecto cuando es nuevo
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
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
        <div className="flex items-center space-x-3">
          <Monitor className="w-5 h-5 text-white" />
          <h3 className="text-lg font-semibold text-white">Nueva Notebook</h3>
        </div>
        <p className="text-slate-300 text-xs mt-1">Complete la información del equipo</p>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Sección: Información Básica */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
              <div className="w-2 h-2 bg-emerald-600 rounded-full mr-3"></div>
              Información Básica
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

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
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
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
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
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
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Categoría *
                  <span className="text-xs text-slate-500 ml-1">(Tipo de notebook)</span>
                </label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  required
                >
                  {CATEGORIAS_NOTEBOOKS_ARRAY.map(categoria => (
                    <option key={categoria} value={categoria}>
                      {CATEGORIAS_NOTEBOOKS_LABELS[categoria]}
                    </option>
                  ))}
                </select>
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
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
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
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                >
                  {CONDICIONES_ARRAY.map(condicion => (
                    <option key={condicion} value={condicion}>
                      {CONDICIONES_LABELS[condicion]}
                    </option>
                  ))}
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
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                >
                  {UBICACIONES_ARRAY.map(ubicacion => (
                    <option key={ubicacion} value={ubicacion}>
                      {UBICACIONES_LABELS[ubicacion]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Solo mostrar Estado Estético si NO es nuevo */}
              {formData.condicion !== CONDICIONES.NUEVO && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Estado Estético
                    <span className="text-xs text-slate-500 ml-1">(Grado)</span>
                  </label>
                  <select
                    name="estado"
                    value={formData.estado || ''}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  >
                    <option value="">Seleccionar...</option>
                    {ESTADOS_ARRAY.map(estado => (
                      <option key={estado} value={estado}>
                        {ESTADOS_LABELS[estado]}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Resto del formulario permanece igual... */}
          {/* Sección: Información Comercial */}
          <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
            <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
              <div className="w-2 h-2 bg-emerald-600 rounded-full mr-3"></div>
              Información Comercial
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

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
                    className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
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
                    className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
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
                    className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sección: Especificaciones Técnicas */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              Especificaciones Técnicas
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

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
                  placeholder="Ej: Intel i5-12400H, AMD Ryzen 5"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Memoria RAM
                  <span className="text-xs text-slate-500 ml-1">(GB)</span>
                </label>
                <input
                  type="text"
                  name="ram"
                  value={formData.ram}
                  onChange={handleChange}
                  placeholder="Ej: 8GB, 16GB, 32GB"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Slots RAM
                  <span className="text-xs text-slate-500 ml-1">(Número)</span>
                </label>
                <select
                  name="slots"
                  value={formData.slots}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                >
                  <option value="1">1 Slot</option>
                  <option value="2">2 Slots</option>
                  <option value="3">3 Slots</option>
                  <option value="4">4 Slots</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo de RAM
                  <span className="text-xs text-slate-500 ml-1">(Generación)</span>
                </label>
                <select
                  name="tipo_ram"
                  value={formData.tipo_ram}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                >
                  <option value="DDR3">DDR3</option>
                  <option value="DDR4">DDR4</option>
                  <option value="DDR5">DDR5</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  SSD
                  <span className="text-xs text-slate-500 ml-1">(Almacenamiento sólido)</span>
                </label>
                <input
                  type="text"
                  name="ssd"
                  value={formData.ssd}
                  onChange={handleChange}
                  placeholder="Ej: 256GB, 512GB, 1TB"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  HDD
                  <span className="text-xs text-slate-500 ml-1">(Disco duro mecánico)</span>
                </label>
                <input
                  type="text"
                  name="hdd"
                  value={formData.hdd}
                  onChange={handleChange}
                  placeholder="Ej: 1TB, 2TB o vacío si no tiene"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Sistema Operativo
                  <span className="text-xs text-slate-500 ml-1">(SO)</span>
                </label>
                <select
                  name="so"
                  value={formData.so}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                >
                  <option value="WIN11">Windows 11</option>
                  <option value="WIN10">Windows 10</option>
                  <option value="Linux">Linux</option>
                  <option value="macOS">macOS</option>
                  <option value="Sin SO">Sin SO</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Placa de Video
                  <span className="text-xs text-slate-500 ml-1">(GPU)</span>
                </label>
                <input
                  type="text"
                  name="placa_video"
                  value={formData.placa_video}
                  onChange={handleChange}
                  placeholder="Ej: RTX 4060, GTX 1650, Integrada"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  VRAM
                  <span className="text-xs text-slate-500 ml-1">(Memoria de video)</span>
                </label>
                <input
                  type="text"
                  name="vram"
                  value={formData.vram}
                  onChange={handleChange}
                  placeholder="Ej: 4GB, 8GB, 16GB"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Sección: Pantalla y Características */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
              <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
              Pantalla y Características
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tamaño de Pantalla
                  <span className="text-xs text-slate-500 ml-1">(Pulgadas)</span>
                </label>
                <input
                  type="text"
                  name="pantalla"
                  value={formData.pantalla}
                  onChange={handleChange}
                  placeholder="Ej: 15.6 pulgadas, 14 pulgadas"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Resolución
                  <span className="text-xs text-slate-500 ml-1">(Calidad)</span>
                </label>
                <input
                  type="text"
                  name="resolucion"
                  value={formData.resolucion}
                  onChange={handleChange}
                  placeholder="Ej: FHD, 2K, 4K, 1920x1080, 2560x1600"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Refresh Rate
                  <span className="text-xs text-slate-500 ml-1">(Hz)</span>
                </label>
                <input
                  type="text"
                  name="refresh"
                  value={formData.refresh}
                  onChange={handleChange}
                  placeholder="Ej: 60Hz, 120Hz, 144Hz"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="touchscreen"
                  name="touchscreen"
                  checked={formData.touchscreen}
                  onChange={handleChange}
                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="touchscreen" className="text-sm font-medium text-slate-700">
                  Pantalla Táctil
                </label>
              </div>
            </div>
          </div>

          {/* Sección: Teclado y Características Físicas */}
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
              <div className="w-2 h-2 bg-orange-600 rounded-full mr-3"></div>
              Teclado y Características Físicas
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Teclado Retroiluminado
                  <span className="text-xs text-slate-500 ml-1">(Backlight)</span>
                </label>
                <select
                  name="teclado_retro"
                  value={formData.teclado_retro}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                >
                  <option value="SI">Sí</option>
                  <option value="NO">No</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Idioma del Teclado
                  <span className="text-xs text-slate-500 ml-1">(Layout)</span>
                </label>
                <select
                  name="idioma_teclado"
                  value={formData.idioma_teclado}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                >
                  <option value="Español">Español (QWERTY)</option>
                  <option value="Inglés">Inglés (US)</option>
                  <option value="Internacional">Internacional</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Color
                  <span className="text-xs text-slate-500 ml-1">(Exterior)</span>
                </label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  placeholder="Ej: Negro, Plata, Gris"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Sección: Batería */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
              <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
              Información de Batería
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo de Batería
                  <span className="text-xs text-slate-500 ml-1">(Especificaciones)</span>
                </label>
                <input
                  type="text"
                  name="bateria"
                  value={formData.bateria}
                  onChange={handleChange}
                  placeholder="Ej: Li-ion 53Wh, 4-cell 56Wh"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Duración de Batería
                  <span className="text-xs text-slate-500 ml-1">(Horas aprox.)</span>
                </label>
                <input
                  type="text"
                  name="duracion"
                  value={formData.duracion}
                  onChange={handleChange}
                  placeholder="Ej: 6-8 horas, 10 horas"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Sección: Garantía y Estado Técnico */}
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
              <div className="w-2 h-2 bg-amber-600 rounded-full mr-3"></div>
              Garantía y Estado Técnico
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Garantía Update
                  <span className="text-xs text-slate-500 ml-1">(Tiempo)</span>
                </label>
                <select
                  name="garantia_update"
                  value={formData.garantia_update}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                >
                  <option value="3 meses">3 meses</option>
                  <option value="6 meses">6 meses</option>
                  <option value="12 meses">12 meses</option>
                  <option value="24 meses">24 meses</option>
                  <option value="Sin garantía">Sin garantía</option>
                </select>
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
                  placeholder="Ej: 12 meses fabricante, Vencida"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Fallas o Observaciones
                  <span className="text-xs text-slate-500 ml-1">(Problemas conocidos)</span>
                </label>
                <textarea
                  name="fallas"
                  value={formData.fallas}
                  onChange={handleChange}
                  placeholder="Ej: Ninguna, batería agotada, tecla space pegajosa, etc."
                  rows={3}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Botón de envío */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
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
    condicion: CONDICIONES.NUEVO,

    // Campos opcionales
    modelo: '',
    marca: '',
    categoria: CATEGORIAS_CELULARES.ANDROID, // Categoría por defecto
    sucursal: UBICACIONES.LA_PLATA,
    precio_compra_usd: '',
    costos_adicionales: '0',
    precio_venta_usd: '',
    capacidad: '',
    color: '',
    estado: null, // null por defecto cuando es nuevo
    bateria: '', // Solo porcentaje, ej: "85%"
    ciclos: '', // Integer opcional
    garantia: '3 meses',
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

    // Si se cambia la condición a 'nuevo', establecer estado como null
    if (name === 'condicion' && value === CONDICIONES.NUEVO) {
      updatedData.estado = null;
    }

    // La disponibilidad ahora se maneja por eliminación directa tras venta
    // No es necesario actualizar el campo 'disponible'

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
        // Si condicion es 'nuevo', asegurar que estado sea null
        estado: formData.condicion === CONDICIONES.NUEVO ? null : formData.estado,
        // Convertir ciclos a integer si tiene valor
        ciclos: formData.ciclos ? parseInt(formData.ciclos) : null,
        // Convertir precios a numeric
        precio_compra_usd: parseFloat(formData.precio_compra_usd) || null,
        precio_venta_usd: parseFloat(formData.precio_venta_usd) || null
      };

      await onAdd(dataToSubmit);

      // Reset form
      setFormData({
        serial: '',
        condicion: CONDICIONES.NUEVO,
        modelo: '',
        marca: '',
        categoria: CATEGORIAS_CELULARES.ANDROID,
        sucursal: UBICACIONES.LA_PLATA,
        precio_compra_usd: '',
        costos_adicionales: '0',
        precio_venta_usd: '',
        capacidad: '',
        color: '',
        estado: null, // null por defecto cuando es nuevo
        bateria: '',
        ciclos: '',
        garantia: '3 meses',
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
    <div className="bg-white rounded border border-slate-200 overflow-hidden">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
        <div className="flex items-center space-x-3">
          <Smartphone className="w-5 h-5 text-white" />
          <h3 className="text-lg font-semibold text-white">Nuevo Celular</h3>
        </div>
        <p className="text-slate-300 text-xs mt-1">Complete la información del dispositivo móvil</p>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Sección: Información Básica */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
              <div className="w-2 h-2 bg-emerald-600 rounded-full mr-3"></div>
              Información Básica
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

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
                  placeholder="Ej: A12BC34567DEF"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
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
                  placeholder="Ej: iPhone 14 Pro"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
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
                  placeholder="Ej: Apple, Samsung"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Categoría *
                  <span className="text-xs text-slate-500 ml-1">(Tipo de celular)</span>
                </label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  required
                >
                  {CATEGORIAS_CELULARES_ARRAY.map(categoria => (
                    <option key={categoria} value={categoria}>
                      {CATEGORIAS_CELULARES_LABELS[categoria]}
                    </option>
                  ))}
                </select>
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
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
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
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                >
                  {CONDICIONES_ARRAY.map(condicion => (
                    <option key={condicion} value={condicion}>
                      {CONDICIONES_LABELS[condicion]}
                    </option>
                  ))}
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
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                >
                  {UBICACIONES_ARRAY.map(ubicacion => (
                    <option key={ubicacion} value={ubicacion}>
                      {UBICACIONES_LABELS[ubicacion]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Solo mostrar Estado Estético si NO es nuevo */}
              {formData.condicion !== CONDICIONES.NUEVO && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Estado Estético
                    <span className="text-xs text-slate-500 ml-1">(Grado)</span>
                  </label>
                  <select
                    name="estado"
                    value={formData.estado || ''}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  >
                    <option value="">Seleccionar...</option>
                    {ESTADOS_ARRAY.map(estado => (
                      <option key={estado} value={estado}>
                        {ESTADOS_LABELS[estado]}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Sección: Información Comercial */}
          <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
            <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
              <div className="w-2 h-2 bg-emerald-600 rounded-full mr-3"></div>
              Información Comercial
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Precio de Compra *
                  <span className="text-xs text-slate-500 ml-1">(USD)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500">$</span>
                  <input
                    type="number"
                    name="precio_compra_usd"
                    value={formData.precio_compra_usd}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Costos Adicionales
                  <span className="text-xs text-slate-500 ml-1">(Envíos/Repuestos USD)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500">$</span>
                  <input
                    type="number"
                    name="costos_adicionales"
                    value={formData.costos_adicionales}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
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
                    className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sección: Especificaciones del Dispositivo */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              Especificaciones del Dispositivo
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Capacidad de Almacenamiento
                  <span className="text-xs text-slate-500 ml-1">(GB/TB)</span>
                </label>
                <input
                  type="text"
                  name="capacidad"
                  value={formData.capacidad}
                  onChange={handleChange}
                  placeholder="Ej: 128GB, 256GB, 1TB"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Color
                  <span className="text-xs text-slate-500 ml-1">(Color del dispositivo)</span>
                </label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  placeholder="Ej: Negro, Blanco, Azul"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Estado de Batería
                  <span className="text-xs text-slate-500 ml-1">(% de salud)</span>
                </label>
                <input
                  type="text"
                  name="bateria"
                  value={formData.bateria}
                  onChange={handleChange}
                  placeholder="Ej: 85%, 92%"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ciclos de Batería
                  <span className="text-xs text-slate-500 ml-1">(Número de ciclos)</span>
                </label>
                <input
                  type="number"
                  name="ciclos"
                  value={formData.ciclos}
                  onChange={handleChange}
                  placeholder="Ej: 150, 300"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Sección: Garantía y Fallas */}
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
              <div className="w-2 h-2 bg-amber-600 rounded-full mr-3"></div>
              Garantía y Estado Técnico
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Garantía Update
                  <span className="text-xs text-slate-500 ml-1">(Tiempo de garantía)</span>
                </label>
                <select
                  name="garantia"
                  value={formData.garantia}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                >
                  <option value="1 mes">1 mes</option>
                  <option value="3 meses">3 meses</option>
                  <option value="6 meses">6 meses</option>
                  <option value="12 meses">12 meses</option>
                  <option value="Sin garantía">Sin garantía</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Fallas o Observaciones
                  <span className="text-xs text-slate-500 ml-1">(Problemas conocidos)</span>
                </label>
                <textarea
                  name="fallas"
                  value={formData.fallas}
                  onChange={handleChange}
                  placeholder="Ej: Ninguna, pantalla con rayones menores, etc."
                  rows={3}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Botón de envío */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4" />
                  <span>Agregar Celular</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Formulario para Otro Producto actualizado
const FormularioOtro = ({ onAdd, loading }) => {
  const [formData, setFormData] = useState({
    // Información básica del producto
    nombre_producto: '',
    descripcion: '',
    categoria: '',
    marca: '',

    // Condición del producto
    condicion: CONDICIONES.NUEVO,

    // Precios
    precio_compra_usd: '',
    precio_venta_usd: '',

    // Cantidades por sucursal
    cantidad_la_plata: 0,
    cantidad_mitre: 0,

    // Garantía y observaciones
    garantia: '',
    observaciones: '',

    // Fecha de ingreso
    ingreso: new Date().toISOString().split('T')[0]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Usar constantes centralizadas en lugar de hardcodear
  const opcionesCategorias = CATEGORIAS_OTROS_ARRAY.map(cat => ({
    value: cat,
    label: CATEGORIAS_OTROS_LABELS[cat]
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
        cantidad_la_plata: parseInt(formData.cantidad_la_plata) || 0,
        cantidad_mitre: parseInt(formData.cantidad_mitre) || 0,
        precio_compra_usd: parseFloat(formData.precio_compra_usd) || 0,
        precio_venta_usd: parseFloat(formData.precio_venta_usd) || 0
      };

      await onAdd(dataToSubmit);

      // Reset form
      setFormData({
        nombre_producto: '',
        descripcion: '',
        categoria: '',
        marca: '',
        condicion: CONDICIONES.NUEVO,
        precio_compra_usd: '',
        precio_venta_usd: '',
        cantidad_la_plata: 0,
        cantidad_mitre: 0,
        garantia: '',
        observaciones: '',
        ingreso: new Date().toISOString().split('T')[0]
      });

      alert('✅ Producto agregado exitosamente!');
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
        <div className="flex items-center space-x-3">
          <Box className="w-5 h-5 text-white" />
          <h3 className="text-lg font-semibold text-white">Nuevo Producto</h3>
        </div>
        <p className="text-slate-300 text-xs mt-1">Complete la información del producto</p>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
              <div className="w-2 h-2 bg-emerald-600 rounded-full mr-3"></div>
              Información del Producto
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  name="nombre_producto"
                  value={formData.nombre_producto}
                  onChange={handleChange}
                  placeholder="Ej: Mouse Logitech MX Master 3"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Categoría *
                </label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {opcionesCategorias.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Marca
                  <span className="text-xs text-slate-500 ml-1">(Opcional)</span>
                </label>
                <input
                  type="text"
                  name="marca"
                  value={formData.marca}
                  onChange={handleChange}
                  placeholder="Ej: Logitech, Samsung, HP..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Condición *
                  <span className="text-xs text-slate-500 ml-1">(Estado funcional)</span>
                </label>
                <select
                  name="condicion"
                  value={formData.condicion}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  required
                >
                  {CONDICIONES_ARRAY.map(condicion => (
                    <option key={condicion} value={condicion}>
                      {CONDICIONES_LABELS[condicion]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Fecha de Ingreso *
                </label>
                <input
                  type="date"
                  name="ingreso"
                  value={formData.ingreso}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  required
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Serial/Descripción
                  <span className="text-xs text-slate-500 ml-1">(Opcional)</span>
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Serial del producto o descripción adicional..."
                  rows={2}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Inventario por sucursal */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              Inventario por Sucursal
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cantidad La Plata
                </label>
                <input
                  type="number"
                  name="cantidad_la_plata"
                  value={formData.cantidad_la_plata}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cantidad Mitre
                </label>
                <input
                  type="number"
                  name="cantidad_mitre"
                  value={formData.cantidad_mitre}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Información comercial */}
          <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
            <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
              <div className="w-2 h-2 bg-emerald-600 rounded-full mr-3"></div>
              Información Comercial
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Precio de Compra * (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                  <input
                    type="number"
                    name="precio_compra_usd"
                    value={formData.precio_compra_usd}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Precio de Venta * (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                  <input
                    type="number"
                    name="precio_venta_usd"
                    value={formData.precio_venta_usd}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botón de envío */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || loading || !formData.nombre_producto || !formData.categoria}
              className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Box className="w-4 h-4" />
                  <span>Agregar Producto</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NuevoCargaEquipos;