import React, { useState } from 'react';
import { Monitor, Smartphone, Box, Plus } from 'lucide-react';
import { obtenerFechaLocal } from '../../../shared/utils/formatters';
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
import {
  RESOLUCIONES_ARRAY,
  RESOLUCIONES_LABELS
} from '../../../shared/constants/resolutionConstants';
import MarcaSelector from '../../../shared/components/ui/MarcaSelector';
import { useProveedores } from '../../importaciones/hooks/useProveedores';
import NuevoProveedorModal from '../../importaciones/components/NuevoProveedorModal';

const NuevoCargaEquipos = ({ onAddComputer, onAddCelular, onAddOtro, loading, modoCarrito = false, modoCompra = false, onReturnData }) => {
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
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded transition-colors ${isSelected
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
        <FormularioNotebook onAdd={onAddComputer} loading={loading} modoCarrito={modoCarrito} modoCompra={modoCompra} onReturnData={onReturnData} />
      )}
      {tipoEquipo === 'celular' && (
        <FormularioCelular onAdd={onAddCelular} loading={loading} modoCarrito={modoCarrito} modoCompra={modoCompra} onReturnData={onReturnData} />
      )}
      {tipoEquipo === 'otro' && (
        <FormularioOtro onAdd={onAddOtro} loading={loading} modoCarrito={modoCarrito} modoCompra={modoCompra} onReturnData={onReturnData} />
      )}
    </div>
  );
};

// Formulario para Notebook renovado y organizado
const FormularioNotebook = ({ onAdd, loading, modoCompra = false, onReturnData }) => {
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

    // Proveedor
    proveedor_id: '',

    // Especificaciones principales
    procesador: '',
    slots: '',
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
    garantia_update: '3 meses',
    garantia_oficial: '',
    garantia_oficial_fecha: '', // Fecha para cuando se selecciona "Garantía oficial con vencimiento"
    fallas: '',

    // Fotos
    fotos: '',

    // Fecha de ingreso
    ingreso: obtenerFechaLocal()
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hook de proveedores
  const { proveedores, loading: proveedoresLoading } = useProveedores();
  const [showNuevoProveedorModal, setShowNuevoProveedorModal] = useState(false);

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
      // Formatear garantía oficial con vencimiento si está seleccionada
      let garantiaUpdate = formData.garantia_update;
      if (formData.garantia_update === 'Garantía oficial con vencimiento' && formData.garantia_oficial_fecha) {
        const fecha = new Date(formData.garantia_oficial_fecha + 'T00:00:00');
        const fechaFormateada = fecha.toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          timeZone: 'America/Argentina/Buenos_Aires'
        });
        garantiaUpdate = `Garantía oficial con vencimiento (${fechaFormateada})`;
      }

      const { garantia_oficial_fecha, ...dataRest } = formData; // Excluir campo que no existe en BD

      const dataToSubmit = {
        ...dataRest,
        garantia_update: garantiaUpdate,
        // Si condicion es 'nuevo', asegurar que estado sea null
        estado: formData.condicion === CONDICIONES.NUEVO ? null : formData.estado,
        // Si slots está vacío, convertir a null
        slots: formData.slots === '' ? null : formData.slots,
        fotos: formData.fotos,
        // Agregar proveedor_id (nullable)
        proveedor_id: formData.proveedor_id || null
      };

      // Si está en modo compra, solo retornar los datos sin guardar en BD
      if (modoCompra && onReturnData) {
        onReturnData('notebook', dataToSubmit);

        // Reset form para permitir agregar más productos
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
          estado: null,
          proveedor_id: '',
          procesador: '',
          slots: '',
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
          garantia_update: '3 meses',
          garantia_oficial: '',
          garantia_oficial_fecha: '',
          fallas: '',
          fotos: '',
          ingreso: obtenerFechaLocal()
        });
      } else {
        // Modo normal: guardar en BD
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
          estado: null,
          proveedor_id: '',
          procesador: '',
          slots: '',
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
          garantia_update: '3 meses',
          garantia_oficial: '',
          garantia_oficial_fecha: '',
          fallas: '',
          fotos: '',
          ingreso: obtenerFechaLocal()
        });

        alert('✅ Computadora agregada exitosamente!');
      }
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

          {/* Sección: Información del Equipo */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
              <div className="w-2 h-2 bg-emerald-600 rounded-full mr-3"></div>
              Información del Equipo
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* SERIAL */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Serial *
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

              {/* CATEGORIA */}
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
                  {CATEGORIAS_NOTEBOOKS_ARRAY.map(categoria => (
                    <option key={categoria} value={categoria}>
                      {CATEGORIAS_NOTEBOOKS_LABELS[categoria]}
                    </option>
                  ))}
                </select>
              </div>

              {/* MARCA */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Marca
                </label>
                <MarcaSelector
                  value={formData.marca}
                  onChange={(valor) => handleChange({ target: { name: 'marca', value: valor } })}
                  placeholder="Seleccionar o agregar marca"
                  className="w-full"
                />
              </div>

              {/* CONDICION */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Condición
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

              {/* MODELO */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Modelo *
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

              {/* COLOR */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Color
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

              {/* ESTADO ESTETICO - Solo mostrar si NO es nuevo */}
              {formData.condicion !== CONDICIONES.NUEVO && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Estado Estético
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

              {/* PROVEEDOR */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Proveedor
                </label>
                <div className="flex gap-2">
                  <select
                    name="proveedor_id"
                    value={formData.proveedor_id}
                    onChange={handleChange}
                    disabled={proveedoresLoading}
                    className="flex-1 p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  >
                    <option value="">Sin especificar</option>
                    {proveedores.map(prov => (
                      <option key={prov.id} value={prov.id}>
                        {prov.nombre}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNuevoProveedorModal(true)}
                    className="px-3 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    title="Nuevo Proveedor"
                    disabled={proveedoresLoading}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* ESPECIFICACIONES TÉCNICAS */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <h5 className="text-sm font-semibold text-slate-700 mb-4">Especificaciones Técnicas</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Procesador</label>
                  <input
                    type="text"
                    name="procesador"
                    value={formData.procesador}
                    onChange={handleChange}
                    placeholder="Ej: Intel i5-12400H"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Memoria RAM (GB)</label>
                  <input
                    type="number"
                    name="ram"
                    value={formData.ram}
                    onChange={handleChange}
                    placeholder="Ej: 8, 16, 32"
                    min="0"
                    step="1"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de RAM</label>
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Slots RAM</label>
                  <input
                    type="number"
                    name="slots"
                    value={formData.slots}
                    onChange={handleChange}
                    placeholder="Ej: 2"
                    min="1"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">SSD (GB)</label>
                  <input
                    type="number"
                    name="ssd"
                    value={formData.ssd}
                    onChange={handleChange}
                    placeholder="Ej: 256, 512, 1024"
                    min="0"
                    step="1"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">HDD (GB)</label>
                  <input
                    type="number"
                    name="hdd"
                    value={formData.hdd}
                    onChange={handleChange}
                    placeholder="Ej: 1000, 2000 o vacío"
                    min="0"
                    step="1"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sistema Operativo</label>
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Placa de Video</label>
                  <input
                    type="text"
                    name="placa_video"
                    value={formData.placa_video}
                    onChange={handleChange}
                    placeholder="Ej: RTX 4060, Integrada"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">VRAM</label>
                  <input
                    type="text"
                    name="vram"
                    value={formData.vram}
                    onChange={handleChange}
                    placeholder="Ej: 4GB, 8GB, 16GB"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tamaño de Pantalla (pulgadas)</label>
                  <input
                    type="number"
                    name="pantalla"
                    value={formData.pantalla}
                    onChange={handleChange}
                    placeholder="Ej: 15.6"
                    min="10"
                    max="20"
                    step="0.1"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Resolución</label>
                  <select
                    name="resolucion"
                    value={formData.resolucion}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  >
                    <option value="">Seleccionar resolución</option>
                    {RESOLUCIONES_ARRAY.map(resolucion => (
                      <option key={resolucion} value={resolucion}>
                        {RESOLUCIONES_LABELS[resolucion]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Refresh Rate</label>
                  <input
                    type="text"
                    name="refresh"
                    value={formData.refresh}
                    onChange={handleChange}
                    placeholder="Ej: 60Hz, 120Hz"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Teclado Retroiluminado</label>
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Idioma del Teclado</label>
                  <select
                    name="idioma_teclado"
                    value={formData.idioma_teclado}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  >
                    <option value="Español">Español</option>
                    <option value="Inglés">Inglés</option>
                    <option value="Internacional">Internacional</option>
                  </select>
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

            {/* INFORMACIÓN DE BATERÍA - Solo mostrar si NO es nuevo */}
            {formData.condicion !== CONDICIONES.NUEVO && (
              <div className="mt-6 pt-4 border-t border-slate-200">
                <h5 className="text-sm font-semibold text-slate-700 mb-4">Información de Batería</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Batería</label>
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">Duración de Batería</label>
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
            )}

            {/* GARANTÍAS Y OBSERVACIONES */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <h5 className="text-sm font-semibold text-slate-700 mb-4">Garantía y Observaciones</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Garantía</label>
                  <select
                    name="garantia_update"
                    value={formData.garantia_update}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  >
                    <option value="1 mes">1 mes</option>
                    <option value="3 meses">3 meses</option>
                    <option value="6 meses">6 meses</option>
                    <option value="12 meses">12 meses</option>
                    <option value="Garantía oficial Apple (12 meses)">Garantía oficial Apple (12 meses)</option>
                    <option value="Garantía oficial con vencimiento">Garantía oficial con vencimiento</option>
                    <option value="Sin garantía">Sin garantía</option>
                  </select>
                </div>

                {formData.garantia_update === 'Garantía oficial con vencimiento' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Fecha de vencimiento
                    </label>
                    <input
                      type="date"
                      name="garantia_oficial_fecha"
                      value={formData.garantia_oficial_fecha}
                      onChange={handleChange}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Observaciones</label>
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
                  Sucursal
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Precio de Costo *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500 font-medium">U$</span>
                  <input
                    type="number"
                    name="precio_costo_usd"
                    value={formData.precio_costo_usd}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Gastos Adicionales
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500 font-medium">U$</span>
                  <input
                    type="number"
                    name="envios_repuestos"
                    value={formData.envios_repuestos}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Precio de Venta *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500 font-medium">U$</span>
                  <input
                    type="number"
                    name="precio_venta_usd"
                    value={formData.precio_venta_usd}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Costo Total USD
                </label>
                <input
                  type="text"
                  value={`U$${((parseFloat(formData.precio_costo_usd) || 0) + (parseFloat(formData.envios_repuestos) || 0)).toFixed(2)}`}
                  disabled
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-600 cursor-not-allowed font-medium"
                  title="Campo calculado automáticamente"
                />
              </div>
            </div>
          </div>

          {/* Sección: Fotos */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              Link de Fotos
            </h4>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                URL de Fotos (Opcional)
              </label>
              <input
                type="url"
                name="fotos"
                value={formData.fotos}
                onChange={handleChange}
                placeholder="https://drive.google.com/... o cualquier enlace"
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
              />
              <p className="text-xs text-slate-500 mt-1">
                Google Drive, Dropbox, OneDrive o cualquier servicio en la nube
              </p>
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

        {/* Modal para crear nuevo proveedor */}
        {showNuevoProveedorModal && (
          <NuevoProveedorModal
            onClose={() => setShowNuevoProveedorModal(false)}
            onSuccess={(nuevoProveedor) => {
              setShowNuevoProveedorModal(false);
              setFormData({ ...formData, proveedor_id: nuevoProveedor.id });
            }}
          />
        )}
      </div>
    </div>
  );
};

// Formulario para Celular actualizado
const FormularioCelular = ({ onAdd, loading, modoCompra = false, onReturnData }) => {
  const [formData, setFormData] = useState({
    // Campos básicos obligatorios según tabla celulares
    serial: '',
    categoria: CATEGORIAS_CELULARES.ANDROID, // Categoría por defecto
    marca: '',
    condicion: CONDICIONES.NUEVO,
    modelo: '',
    capacidad: '',
    color: '',
    sim_esim: 'SIM', // Nueva opción SIM/ESIM
    estado: null, // null por defecto cuando es nuevo

    // Proveedor
    proveedor_id: '',

    // Información específica del dispositivo
    bateria: '', // Solo porcentaje, ej: "85%"
    ciclos: '', // Integer opcional
    ram: '', // Memoria RAM (mostrada solo si es ANDROID)

    // Información comercial
    sucursal: UBICACIONES.LA_PLATA,
    precio_compra_usd: '',
    costos_adicionales: '0',
    precio_venta_usd: '',

    // Garantía y observaciones
    garantia: '3 meses',
    garantia_oficial_fecha: '', // Fecha para cuando se selecciona "Garantía oficial con vencimiento"
    fallas: '',
    fotos: '',

    // Fecha de ingreso
    ingreso: obtenerFechaLocal()
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hook de proveedores
  const { proveedores, loading: proveedoresLoading } = useProveedores();
  const [showNuevoProveedorModal, setShowNuevoProveedorModal] = useState(false);

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
      // Formatear garantía oficial con vencimiento si está seleccionada
      let garantia = formData.garantia;
      if (formData.garantia === 'Garantía oficial con vencimiento' && formData.garantia_oficial_fecha) {
        const fecha = new Date(formData.garantia_oficial_fecha + 'T00:00:00');
        const fechaFormateada = fecha.toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          timeZone: 'America/Argentina/Buenos_Aires'
        });
        garantia = `Garantía oficial con vencimiento (${fechaFormateada})`;
      }

      const { garantia_oficial_fecha, ...dataRest } = formData; // Excluir campo que no existe en BD

      const dataToSubmit = {
        ...dataRest,
        garantia: garantia,
        // Si condicion es 'nuevo', asegurar que estado sea null
        estado: formData.condicion === CONDICIONES.NUEVO ? null : formData.estado,
        // Convertir ciclos a integer si tiene valor
        ciclos: formData.ciclos ? parseInt(formData.ciclos) : null,
        // Convertir precios a numeric
        precio_compra_usd: parseFloat(formData.precio_compra_usd) || null,
        precio_venta_usd: parseFloat(formData.precio_venta_usd) || null,
        // Incluir RAM y SIM/eSIM si existen
        ram: formData.ram || null,
        sim_esim: formData.sim_esim || null,
        fotos: formData.fotos,
        // Agregar proveedor_id (nullable)
        proveedor_id: formData.proveedor_id || null
      };

      // Si está en modo compra, solo retornar los datos sin guardar en BD
      if (modoCompra && onReturnData) {
        onReturnData('celular', dataToSubmit);

        // Reset form para permitir agregar más productos
        setFormData({
          serial: '',
          categoria: CATEGORIAS_CELULARES.ANDROID,
          marca: '',
          condicion: CONDICIONES.NUEVO,
          modelo: '',
          capacidad: '',
          color: '',
          sim_esim: 'SIM',
          estado: null,
          proveedor_id: '',
          bateria: '',
          ciclos: '',
          ram: '',
          sucursal: UBICACIONES.LA_PLATA,
          precio_compra_usd: '',
          costos_adicionales: '0',
          precio_venta_usd: '',
          garantia: '3 meses',
          garantia_oficial_fecha: '',
          fallas: '',
          fotos: '',
          ingreso: obtenerFechaLocal()
        });
      } else {
        // Modo normal: guardar en BD
        await onAdd(dataToSubmit);

        // Reset form
        setFormData({
          serial: '',
          categoria: CATEGORIAS_CELULARES.ANDROID,
          marca: '',
          condicion: CONDICIONES.NUEVO,
          modelo: '',
          capacidad: '',
          color: '',
          sim_esim: 'SIM',
          estado: null,
          proveedor_id: '',
          bateria: '',
          ciclos: '',
          ram: '',
          sucursal: UBICACIONES.LA_PLATA,
          precio_compra_usd: '',
          costos_adicionales: '0',
          precio_venta_usd: '',
          garantia: '3 meses',
          garantia_oficial_fecha: '',
          fallas: '',
          fotos: '',
          ingreso: obtenerFechaLocal()
        });

        alert('✅ Celular agregado exitosamente!');
      }
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

          {/* Sección: Información del Equipo */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
              <div className="w-2 h-2 bg-emerald-600 rounded-full mr-3"></div>
              Información del Equipo
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* SERIAL */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Serial *
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

              {/* CATEGORIA */}
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
                  {CATEGORIAS_CELULARES_ARRAY.map(categoria => (
                    <option key={categoria} value={categoria}>
                      {CATEGORIAS_CELULARES_LABELS[categoria]}
                    </option>
                  ))}
                </select>
              </div>

              {/* MARCA */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Marca
                </label>
                <MarcaSelector
                  value={formData.marca}
                  onChange={(valor) => handleChange({ target: { name: 'marca', value: valor } })}
                  placeholder="Seleccionar o agregar marca"
                  className="w-full"
                />
              </div>

              {/* CONDICION */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Condición
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

              {/* MODELO */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Modelo *
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

              {/* ALMACENAMIENTO */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Almacenamiento
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

              {/* COLOR */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Color
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

              {/* SIM/ESIM */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo de SIM
                </label>
                <select
                  name="sim_esim"
                  value={formData.sim_esim}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                >
                  <option value="SIM">SIM Físico</option>
                  <option value="ESIM">eSIM</option>
                  <option value="Dual">Dual (SIM + eSIM)</option>
                </select>
              </div>

              {/* PROVEEDOR */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Proveedor
                </label>
                <div className="flex gap-2">
                  <select
                    name="proveedor_id"
                    value={formData.proveedor_id}
                    onChange={handleChange}
                    disabled={proveedoresLoading}
                    className="flex-1 p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  >
                    <option value="">Sin especificar</option>
                    {proveedores.map(prov => (
                      <option key={prov.id} value={prov.id}>
                        {prov.nombre}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNuevoProveedorModal(true)}
                    className="px-3 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    title="Nuevo Proveedor"
                    disabled={proveedoresLoading}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* ESPECIFICACIONES - Solo mostrar campos si NO es nuevo */}
            {(formData.condicion !== CONDICIONES.NUEVO || formData.categoria === CATEGORIAS_CELULARES.ANDROID) && (
              <div className="mt-6 pt-4 border-t border-slate-200">
                <h5 className="text-sm font-semibold text-slate-700 mb-4">Especificaciones</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* ESTADO ESTETICO - Solo mostrar si NO es nuevo */}
                  {formData.condicion !== CONDICIONES.NUEVO && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Estado Estético
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

                  {/* BATERIA - Solo mostrar si NO es nuevo */}
                  {formData.condicion !== CONDICIONES.NUEVO && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Estado de Batería
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
                  )}

                  {/* CICLOS DE BATERIA - Solo mostrar si NO es nuevo */}
                  {formData.condicion !== CONDICIONES.NUEVO && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Ciclos de Batería
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
                  )}

                  {/* MEMORIA RAM - Solo mostrar si es ANDROID */}
                  {formData.categoria === CATEGORIAS_CELULARES.ANDROID && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Memoria RAM (GB)
                      </label>
                      <input
                        type="number"
                        name="ram"
                        value={formData.ram}
                        onChange={handleChange}
                        placeholder="Ej: 4, 6, 8, 12"
                        min="0"
                        step="1"
                        className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* GARANTÍA Y OBSERVACIONES */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <h5 className="text-sm font-semibold text-slate-700 mb-4">Garantía y Observaciones</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Garantía
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
                    <option value="Garantía oficial Apple (12 meses)">Garantía oficial Apple (12 meses)</option>
                    <option value="Garantía oficial con vencimiento">Garantía oficial con vencimiento</option>
                    <option value="Sin garantía">Sin garantía</option>
                  </select>
                </div>

                {/* Mostrar selector de fecha si se selecciona "Garantía oficial con vencimiento" */}
                {formData.garantia === 'Garantía oficial con vencimiento' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Fecha de vencimiento
                    </label>
                    <input
                      type="date"
                      name="garantia_oficial_fecha"
                      value={formData.garantia_oficial_fecha}
                      onChange={handleChange}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Observaciones
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
          </div>

          {/* Sección: Información Comercial (Precios) */}
          <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
            <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
              <div className="w-2 h-2 bg-emerald-600 rounded-full mr-3"></div>
              Información Comercial
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Sucursal
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Precio de Compra *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500 font-medium">U$</span>
                  <input
                    type="number"
                    name="precio_compra_usd"
                    value={formData.precio_compra_usd}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Costos Adicionales
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500 font-medium">U$</span>
                  <input
                    type="number"
                    name="costos_adicionales"
                    value={formData.costos_adicionales}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Precio de Venta *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500 font-medium">U$</span>
                  <input
                    type="number"
                    name="precio_venta_usd"
                    value={formData.precio_venta_usd}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Costo Total USD
                </label>
                <input
                  type="text"
                  value={`U$${((parseFloat(formData.precio_compra_usd) || 0) + (parseFloat(formData.costos_adicionales) || 0)).toFixed(2)}`}
                  disabled
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-600 cursor-not-allowed font-medium"
                  title="Campo calculado automáticamente"
                />
              </div>
            </div>
          </div>

          {/* Sección: Fotos */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              Link de Fotos
            </h4>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                URL de Fotos (Opcional)
              </label>
              <input
                type="url"
                name="fotos"
                value={formData.fotos}
                onChange={handleChange}
                placeholder="https://drive.google.com/... o cualquier enlace"
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
              />
              <p className="text-xs text-slate-500 mt-1">
                Google Drive, Dropbox, OneDrive o cualquier servicio en la nube
              </p>
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

        {/* Modal para crear nuevo proveedor */}
        {showNuevoProveedorModal && (
          <NuevoProveedorModal
            onClose={() => setShowNuevoProveedorModal(false)}
            onSuccess={(nuevoProveedor) => {
              setShowNuevoProveedorModal(false);
              setFormData({ ...formData, proveedor_id: nuevoProveedor.id });
            }}
          />
        )}
      </div>
    </div>
  );
};

// Formulario para Otro Producto actualizado
const FormularioOtro = ({ onAdd, loading, modoCompra = false, onReturnData }) => {
  const [formData, setFormData] = useState({
    // Información básica del producto
    nombre_producto: '',
    descripcion: '',
    categoria: '',
    marca: '',
    modelo: '',
    color: '',

    // Condición del producto
    condicion: CONDICIONES.NUEVO,
    estado: null,

    // Proveedor
    proveedor_id: '',

    // Precios
    precio_compra_usd: '',
    precio_venta_usd: '',

    // Costos adicionales (envíos, reparaciones, etc.)
    costos_adicionales: '0',

    // Cantidades por sucursal
    cantidad_la_plata: 0,
    cantidad_mitre: 0,

    // Serial opcional (solo para productos únicos)
    serial: '',

    // Especificaciones para DESKTOP
    procesador: '',
    motherboard: '',
    memoria: '',
    gpu: '',
    ssd: '',
    hdd: '',
    gabinete: '',
    fuente: '',

    // Especificaciones para TABLET
    capacidad_almacenamiento: '',
    tamano_pantalla: '',
    conectividad: 'WiFi only',

    // Garantía y observaciones
    garantia: '3 meses',
    garantia_oficial_fecha: '',
    observaciones: '',
    fotos: '',

    // Fecha de ingreso
    ingreso: obtenerFechaLocal()
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hook de proveedores
  const { proveedores, loading: proveedoresLoading } = useProveedores();
  const [showNuevoProveedorModal, setShowNuevoProveedorModal] = useState(false);

  // Determinar si es Desktop o Tablet
  const isDesktop = formData.categoria === CATEGORIAS_OTROS.DESKTOP;
  const isTablet = formData.categoria === CATEGORIAS_OTROS.TABLETS;

  // Usar constantes centralizadas en lugar de hardcodear y ordenar alfabéticamente
  const opcionesCategorias = CATEGORIAS_OTROS_ARRAY
    .map(cat => ({
      value: cat,
      label: CATEGORIAS_OTROS_LABELS[cat]
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedData = {
      ...formData,
      [name]: value
    };

    setFormData(updatedData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Para Desktop o Tablet, validar modelo; para otros, validar nombre_producto
    if (isDesktop || isTablet) {
      if (!formData.modelo.trim()) {
        alert('El modelo es obligatorio');
        return;
      }
    } else {
      if (!formData.nombre_producto.trim()) {
        alert('El nombre del producto es obligatorio');
        return;
      }
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

    // Validación: si cantidad > 1 y hay serial, advertencia
    const cantidadTotal = (parseInt(formData.cantidad_la_plata) || 0) + (parseInt(formData.cantidad_mitre) || 0);
    if (cantidadTotal > 1 && formData.serial?.trim()) {
      const confirm = window.confirm(
        `⚠️ Tienes ${cantidadTotal} unidades pero ingresaste un serial. El serial solo aplica a productos únicos.\n\n¿Deseas continuar?`
      );
      if (!confirm) {
        setIsSubmitting(false);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Formatear garantía oficial con vencimiento si está seleccionada
      let garantia = formData.garantia;
      if (formData.garantia === 'Garantía oficial con vencimiento' && formData.garantia_oficial_fecha) {
        const fecha = new Date(formData.garantia_oficial_fecha + 'T00:00:00');
        const fechaFormateada = fecha.toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          timeZone: 'America/Argentina/Buenos_Aires'
        });
        garantia = `Garantía oficial con vencimiento (${fechaFormateada})`;
      }

      // Si es Desktop, concatenar especificaciones en descripcion
      let descripcion = formData.descripcion;
      if (formData.categoria === CATEGORIAS_OTROS.DESKTOP) {
        const specs = [
          formData.procesador && `Procesador: ${formData.procesador}`,
          formData.motherboard && `Motherboard: ${formData.motherboard}`,
          formData.memoria && `Memoria: ${formData.memoria}`,
          formData.gpu && `GPU: ${formData.gpu}`,
          formData.ssd && `SSD: ${formData.ssd}`,
          formData.hdd && `HDD: ${formData.hdd}`,
          formData.gabinete && `Gabinete: ${formData.gabinete}`,
          formData.fuente && `Fuente: ${formData.fuente}`
        ].filter(Boolean);

        if (specs.length > 0) {
          descripcion = specs.join(' - ');
          if (formData.descripcion?.trim()) {
            descripcion = `${formData.descripcion} - ${descripcion}`;
          }
        }
      }

      // Si es Tablet, construir nombre_producto = MODELO PANTALLA" ALMACENAMIENTO
      let nombreProductoFinal = formData.nombre_producto;
      if (formData.categoria === CATEGORIAS_OTROS.TABLETS) {
        const nombreParts = [
          formData.modelo,
          formData.tamano_pantalla && `${formData.tamano_pantalla}"`,
          formData.capacidad_almacenamiento
        ].filter(Boolean);

        nombreProductoFinal = nombreParts.join(' ');
        descripcion = '';

        // Conectividad va en observaciones junto con las observaciones del usuario
        const obsParts = [
          formData.conectividad,
          formData.observaciones?.trim()
        ].filter(Boolean);
        formData.observaciones = obsParts.join(' - ');
      }

      const { garantia_oficial_fecha, procesador, motherboard, memoria, gpu, ssd, hdd, gabinete, fuente, capacidad_almacenamiento, tamano_pantalla, conectividad, ...dataRest } = formData; // Excluir campos especiales

      const dataToSubmit = {
        ...dataRest,
        nombre_producto: isDesktop ? formData.modelo : (isTablet ? nombreProductoFinal : formData.nombre_producto),
        descripcion: descripcion,
        garantia: garantia,
        cantidad_la_plata: parseInt(formData.cantidad_la_plata) || 0,
        cantidad_mitre: parseInt(formData.cantidad_mitre) || 0,
        precio_compra_usd: parseFloat(formData.precio_compra_usd) || 0,
        precio_venta_usd: parseFloat(formData.precio_venta_usd) || 0,
        costos_adicionales: parseFloat(formData.costos_adicionales) || 0,
        serial: formData.serial?.trim() || null,
        fotos: formData.fotos,
        // Agregar proveedor_id (nullable)
        proveedor_id: formData.proveedor_id || null
      };

      // Si está en modo compra, solo retornar los datos sin guardar en BD
      if (modoCompra && onReturnData) {
        onReturnData('otro', dataToSubmit);

        // Reset form para permitir agregar más productos
        setFormData({
          nombre_producto: '',
          descripcion: '',
          categoria: '',
          marca: '',
          modelo: '',
          color: '',
          condicion: CONDICIONES.NUEVO,
          estado: null,
          proveedor_id: '',
          precio_compra_usd: '',
          precio_venta_usd: '',
          costos_adicionales: '0',
          cantidad_la_plata: 0,
          cantidad_mitre: 0,
          serial: '',
          procesador: '',
          motherboard: '',
          memoria: '',
          gpu: '',
          ssd: '',
          hdd: '',
          gabinete: '',
          fuente: '',
          capacidad_almacenamiento: '',
          tamano_pantalla: '',
          conectividad: 'WiFi only',
          garantia: '3 meses',
          garantia_oficial_fecha: '',
          observaciones: '',
          fotos: '',
          ingreso: obtenerFechaLocal()
        });
      } else {
        // Modo normal: guardar en BD
        await onAdd(dataToSubmit);

        // Reset form
        setFormData({
          nombre_producto: '',
          descripcion: '',
          categoria: '',
          marca: '',
          modelo: '',
          color: '',
          condicion: CONDICIONES.NUEVO,
          estado: null,
          proveedor_id: '',
          precio_compra_usd: '',
          precio_venta_usd: '',
          costos_adicionales: '0',
          cantidad_la_plata: 0,
          cantidad_mitre: 0,
          serial: '',
          procesador: '',
          motherboard: '',
          memoria: '',
          gpu: '',
          ssd: '',
          hdd: '',
          gabinete: '',
          fuente: '',
          capacidad_almacenamiento: '',
          tamano_pantalla: '',
          conectividad: 'WiFi only',
          garantia: '3 meses',
          garantia_oficial_fecha: '',
          observaciones: '',
          fotos: '',
          ingreso: obtenerFechaLocal()
        });

        alert('✅ Producto agregado exitosamente!');
      }
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determinar título y descripción basado en categoría
  const titulo = isDesktop ? 'Nuevo Desktop' : (isTablet ? 'Nueva Tablet' : 'Nuevo Producto');
  const descripcion = isDesktop ? 'Complete la información de la computadora de escritorio' :
    (isTablet ? 'Complete la información de la tablet' :
      'Complete la información del producto');

  return (
    <div className="bg-white rounded border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
        <div className="flex items-center space-x-3">
          <Box className="w-5 h-5 text-white" />
          <h3 className="text-lg font-semibold text-white">{titulo}</h3>
        </div>
        <p className="text-slate-300 text-xs mt-1">{descripcion}</p>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica - DESKTOP */}
          {isDesktop ? (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
                <div className="w-2 h-2 bg-emerald-600 rounded-full mr-3"></div>
                Información del Equipo
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Serial *</label>
                  <input
                    type="text"
                    name="serial"
                    value={formData.serial}
                    onChange={handleChange}
                    placeholder="Ej: SN123456"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Categoría *</label>
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Marca</label>
                  <MarcaSelector
                    value={formData.marca}
                    onChange={(valor) => handleChange({ target: { name: 'marca', value: valor } })}
                    placeholder="Seleccionar o agregar marca"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Condición *</label>
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Modelo *</label>
                  <input
                    type="text"
                    name="modelo"
                    value={formData.modelo}
                    onChange={handleChange}
                    placeholder="Ej: Pavilion 15"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Procesador</label>
                  <input
                    type="text"
                    name="procesador"
                    value={formData.procesador}
                    onChange={handleChange}
                    placeholder="Ej: Intel i5-12400, AMD Ryzen 5 5600X"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Motherboard</label>
                  <input
                    type="text"
                    name="motherboard"
                    value={formData.motherboard}
                    onChange={handleChange}
                    placeholder="Ej: ASUS ROG STRIX B550"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Memoria RAM</label>
                  <input
                    type="text"
                    name="memoria"
                    value={formData.memoria}
                    onChange={handleChange}
                    placeholder="Ej: 16GB DDR4"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">GPU/Tarjeta Gráfica</label>
                  <input
                    type="text"
                    name="gpu"
                    value={formData.gpu}
                    onChange={handleChange}
                    placeholder="Ej: RTX 3060 Ti, Integrada"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">SSD</label>
                  <input
                    type="text"
                    name="ssd"
                    value={formData.ssd}
                    onChange={handleChange}
                    placeholder="Ej: 500GB NVMe"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">HDD</label>
                  <input
                    type="text"
                    name="hdd"
                    value={formData.hdd}
                    onChange={handleChange}
                    placeholder="Ej: 1TB, Sin HDD"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Gabinete</label>
                  <input
                    type="text"
                    name="gabinete"
                    value={formData.gabinete}
                    onChange={handleChange}
                    placeholder="Ej: NZXT H510 Flow"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Fuente de Poder</label>
                  <input
                    type="text"
                    name="fuente"
                    value={formData.fuente}
                    onChange={handleChange}
                    placeholder="Ej: 650W Modular"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color || ''}
                    onChange={handleChange}
                    placeholder="Ej: Negro, Blanco"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de Ingreso *</label>
                  <input
                    type="date"
                    name="ingreso"
                    value={formData.ingreso}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                    required
                  />
                </div>

                {/* ESTADO ESTETICO - Solo mostrar si NO es nuevo */}
                {formData.condicion !== CONDICIONES.NUEVO && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Estado Estético</label>
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

                {/* OBSERVACIONES - Campo adicional para Desktop */}
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Observaciones</label>
                  <textarea
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                    rows="3"
                    placeholder="Notas adicionales sobre el equipo, accesorios incluidos, estado específico, etc."
                  />
                </div>
              </div>
            </div>
          ) : isTablet ? (
            // Formulario TABLET
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
                <div className="w-2 h-2 bg-emerald-600 rounded-full mr-3"></div>
                Información de la Tablet
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Serial *</label>
                  <input
                    type="text"
                    name="serial"
                    value={formData.serial}
                    onChange={handleChange}
                    placeholder="Ej: SN123456"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Categoría *</label>
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Marca</label>
                  <MarcaSelector
                    value={formData.marca}
                    onChange={(valor) => handleChange({ target: { name: 'marca', value: valor } })}
                    placeholder="Seleccionar o agregar marca"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Condición *</label>
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Modelo *</label>
                  <input
                    type="text"
                    name="modelo"
                    value={formData.modelo}
                    onChange={handleChange}
                    placeholder="Ej: iPad Pro 11, Galaxy Tab S9"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    placeholder="Ej: Space Gray, Silver, Black"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Capacidad/Almacenamiento</label>
                  <select
                    name="capacidad_almacenamiento"
                    value={formData.capacidad_almacenamiento}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="64GB">64GB</option>
                    <option value="128GB">128GB</option>
                    <option value="256GB">256GB</option>
                    <option value="512GB">512GB</option>
                    <option value="1TB">1TB</option>
                    <option value="2TB">2TB</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tamaño de Pantalla</label>
                  <input
                    type="text"
                    name="tamano_pantalla"
                    value={formData.tamano_pantalla}
                    onChange={handleChange}
                    placeholder='Ej: 10.2", 11", 12.9"'
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Conectividad</label>
                  <select
                    name="conectividad"
                    value={formData.conectividad}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  >
                    <option value="WiFi only">WiFi only</option>
                    <option value="WiFi + Cellular">WiFi + Cellular</option>
                    <option value="WiFi + 5G">WiFi + 5G</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de Ingreso *</label>
                  <input
                    type="date"
                    name="ingreso"
                    value={formData.ingreso}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                    required
                  />
                </div>
                {formData.condicion !== CONDICIONES.NUEVO && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Estado Estético</label>
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
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Observaciones</label>
                  <textarea
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                    rows="3"
                    placeholder="Notas adicionales sobre la tablet, accesorios incluidos, estado específico, etc."
                  />
                </div>
              </div>
            </div>
          ) : (
            // Formulario genérico para otros productos
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
                  </label>
                  <MarcaSelector
                    value={formData.marca}
                    onChange={(valor) => handleChange({ target: { name: 'marca', value: valor } })}
                    placeholder="Seleccionar o agregar marca"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Color
                  </label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color || ''}
                    onChange={handleChange}
                    placeholder="Ej: Negro, Blanco"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Condición *
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

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Serial (Opcional)
                  </label>
                  <input
                    type="text"
                    name="serial"
                    value={formData.serial}
                    onChange={handleChange}
                    placeholder="Ej: SN123456 (solo para productos únicos)"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                  <p className="text-xs text-slate-500 mt-1">Solo úsalo si la cantidad es 1</p>
                </div>

                {/* PROVEEDOR */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Proveedor
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="proveedor_id"
                      value={formData.proveedor_id}
                      onChange={handleChange}
                      disabled={proveedoresLoading}
                      className="flex-1 p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                    >
                      <option value="">Sin especificar</option>
                      {proveedores.map(prov => (
                        <option key={prov.id} value={prov.id}>
                          {prov.nombre}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNuevoProveedorModal(true)}
                      className="px-3 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      title="Nuevo Proveedor"
                      disabled={proveedoresLoading}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Descripción del Producto
                  </label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Descripción adicional del producto..."
                    rows={2}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>
              </div>

              {/* GARANTÍA Y OBSERVACIONES - Subsección separada */}
              <div className="mt-6 pt-4 border-t border-slate-200">
                <h5 className="text-sm font-semibold text-slate-700 mb-4">Garantía y Observaciones</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Garantía
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
                      <option value="Garantía oficial Apple (12 meses)">Garantía oficial Apple (12 meses)</option>
                      <option value="Garantía oficial con vencimiento">Garantía oficial con vencimiento</option>
                      <option value="Sin garantía">Sin garantía</option>
                    </select>
                  </div>

                  {/* Mostrar selector de fecha si se selecciona "Garantía oficial con vencimiento" */}
                  {formData.garantia === 'Garantía oficial con vencimiento' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Fecha de vencimiento
                      </label>
                      <input
                        type="date"
                        name="garantia_oficial_fecha"
                        value={formData.garantia_oficial_fecha}
                        onChange={handleChange}
                        className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                      />
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Observaciones
                    </label>
                    <textarea
                      name="observaciones"
                      value={formData.observaciones}
                      onChange={handleChange}
                      placeholder="Comentarios adicionales sobre el producto..."
                      rows={2}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

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
                  Precio de Compra USD *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-medium">U$</span>
                  <input
                    type="number"
                    name="precio_compra_usd"
                    value={formData.precio_compra_usd}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Precio de Venta USD *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-medium">U$</span>
                  <input
                    type="number"
                    name="precio_venta_usd"
                    value={formData.precio_venta_usd}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Costos Adicionales USD
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-medium">U$</span>
                  <input
                    type="number"
                    name="costos_adicionales"
                    value={formData.costos_adicionales}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Envíos, reparaciones u otros costos adicionales</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Costo Total USD
                </label>
                <input
                  type="text"
                  value={`U$${((parseFloat(formData.precio_compra_usd) || 0) + (parseFloat(formData.costos_adicionales) || 0)).toFixed(2)}`}
                  disabled
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-600 cursor-not-allowed font-medium"
                  title="Campo calculado automáticamente"
                />
              </div>
            </div>
          </div>

          {/* Sección: Fotos */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              Link de Fotos
            </h4>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                URL de Fotos (Opcional)
              </label>
              <input
                type="url"
                name="fotos"
                value={formData.fotos}
                onChange={handleChange}
                placeholder="https://drive.google.com/... o cualquier enlace"
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
              />
              <p className="text-xs text-slate-500 mt-1">
                Google Drive, Dropbox, OneDrive o cualquier servicio en la nube
              </p>
            </div>
          </div>

          {/* Botón de envío */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || loading || !formData.categoria || ((isDesktop || isTablet) ? !formData.modelo?.trim() : !formData.nombre_producto?.trim())}
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

        {/* Modal para crear nuevo proveedor */}
        {showNuevoProveedorModal && (
          <NuevoProveedorModal
            onClose={() => setShowNuevoProveedorModal(false)}
            onSuccess={(nuevoProveedor) => {
              setShowNuevoProveedorModal(false);
              setFormData({ ...formData, proveedor_id: nuevoProveedor.id });
            }}
          />
        )}
      </div>
    </div>
  );
};

export default NuevoCargaEquipos;