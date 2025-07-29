import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

// Configuración de campos por tipo de producto
const CONFIGURACION_PRODUCTOS = {
  notebook: {
    tabla: 'inventario',
    titulo: 'Notebook/Computadora',
    camposObligatorios: ['serial', 'modelo'],
    camposEspecificos: [
      'procesador', 'slots', 'tipo_ram', 'ram', 'ssd', 'hdd', 'so', 
      'pantalla', 'resolucion', 'refresh', 'touchscreen', 'placa_video', 
      'vram', 'teclado_retro', 'idioma_teclado', 'bateria', 'duracion'
    ],
    mapeoPrecios: {
      precio_compra: 'precio_costo_usd',
      precio_venta: 'precio_venta_usd',
      repuestos: 'envios_repuestos'
    }
  },
  celular: {
    tabla: 'celulares',
    titulo: 'Celular/Smartphone',
    camposObligatorios: ['serial', 'condicion'],
    camposEspecificos: ['capacidad', 'bateria', 'ciclos'],
    mapeoPrecios: {
      precio_compra: 'precio_compra_usd',
      precio_venta: 'precio_venta_usd'
    }
  },
  otros: {
    tabla: 'otros',
    titulo: 'Otro Producto',
    camposObligatorios: ['nombre_producto', 'cantidad', 'precio_compra_usd', 'precio_venta_usd', 'categoria', 'condicion', 'sucursal'],
    camposEspecificos: ['descripcion', 'precio_venta_pesos'],
    mapeoPrecios: {
      precio_compra: 'precio_compra_usd',
      precio_venta: 'precio_venta_usd',
      precio_venta_pesos: 'precio_venta_pesos'
    }
  }
};

// Opciones para selects
const OPCIONES = {
  sucursal: [
    { value: 'la_plata', label: 'LA PLATA' },
    { value: 'mitre', label: 'MITRE' }
  ],
  condicion: [
    { value: 'nuevo', label: 'Nuevo' },
    { value: 'usado', label: 'Usado' },
    { value: 'reacondicionado', label: 'Reacondicionado' },
    { value: 'reparacion', label: 'Reparación' },
    { value: 'reservado', label: 'Reservado' },
    { value: 'prestado', label: 'Prestado' },
    { value: 'sin_reparacion', label: 'Sin Reparación' },
    { value: 'defectuoso', label: 'Defectuoso' },
    { value: 'en_preparacion', label: 'En Preparación' },
    { value: 'otro', label: 'Otro' },
    { value: 'uso_oficina', label: 'Uso Oficina' }
  ],
  marca: {
    notebook: ['ASUS', 'Acer', 'HP', 'Lenovo', 'Dell', 'MSI', 'Apple'],
    celular: ['Apple', 'Samsung', 'Xiaomi', 'Motorola', 'Huawei', 'OnePlus']
  },
  capacidad: ['64GB', '128GB', 'GB', '512GB', '1TB', '2TB'],
  categoria: [
    'accesorios', 'cables', 'cargadores', 'mouse', 'teclados', 'headsets',
    'webcam', 'monitores', 'speakers', 'almacenamiento', 'memorias', 
    'componentes', 'fundas', 'repuestos', 'otros'
  ],
  tipo_ram: ['DDR3', 'DDR4', 'DDR5'],
  so: ['WIN11', 'WIN10', 'Linux', 'macOS', 'Sin SO'],
  resolucion: ['HD', 'FHD', '2K', '4K'],
  estado: [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'A', label: 'A' },
    { value: 'B+', label: 'B+' },
    { value: 'B', label: 'B' },
    { value: 'B-', label: 'B-' },
    { value: 'C', label: 'C' }
  ]
};

const ModalProducto = ({ 
  isOpen, 
  onClose, 
  onSave, 
  tipo, // 'notebook', 'celular', 'otros'
  modo = 'crear', // 'crear', 'editar', 'cargar_desde_testeo'
  data = null, // datos del producto o equipo de testeo
  equipoTesteo = null // datos específicos del testeo si viene desde ahí
}) => {
  const configuracion = CONFIGURACION_PRODUCTOS[tipo];
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  // Inicializar form data según el modo
  useEffect(() => {
    if (!isOpen) return;

    const inicializarDatos = () => {
      // Valores por defecto según tipo
      const defaults = {
        notebook: {
          sucursal: 'la_plata',
          condicion: 'usado',
          disponible: true,
          precio_costo_usd: 0,
          envios_repuestos: 0,
          precio_venta_usd: 0,
          slots: '2',
          tipo_ram: 'DDR4',
          so: 'WIN11',
          resolucion: 'FHD',
          touchscreen: false,
          teclado_retro: 'SI',
          idioma_teclado: 'Español',
          garantia_update: '6 meses',
          fallas: 'Ninguna'
        },
        celular: {
          sucursal: 'la_plata',
          condicion: 'usado',
          disponible: true,
          precio_compra_usd: 0,
          precio_venta_usd: 0
        },
        otros: {
          sucursal: 'la_plata',
          condicion: 'usado',
          disponible: true,
          cantidad: 1,
          precio_compra_usd: 0,
          precio_venta_usd: 0,
          precio_venta_pesos: 0
        }
      };

      if (modo === 'editar' && data) {
        // Editar producto existente
        setFormData({ ...defaults[tipo], ...data });
      } else if (modo === 'cargar_desde_testeo' && equipoTesteo) {
        // Cargar desde testeo - mapear campos básicos
        const datosBase = {
          ...defaults[tipo],
          serial: equipoTesteo.serial || '',
          modelo: equipoTesteo.modelo || '',
          marca: equipoTesteo.marca || '',
          // Agregar otros campos mapeables del testeo
        };
        setFormData(datosBase);
      } else {
        // Crear nuevo
        setFormData(defaults[tipo]);
      }
    };

    inicializarDatos();
  }, [isOpen, modo, tipo, data, equipoTesteo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validar campos obligatorios
      const camposFaltantes = configuracion.camposObligatorios.filter(
        campo => !formData[campo] || formData[campo] === ''
      );

      if (camposFaltantes.length > 0) {
        alert(`Campos obligatorios faltantes: ${camposFaltantes.join(', ')}`);
        return;
      }

      // Preparar datos según la tabla
      const datosParaGuardar = prepararDatosSegunTabla();

      let resultado;
      if (modo === 'editar') {
        // Actualizar registro existente
        resultado = await supabase
          .from(configuracion.tabla)
          .update(datosParaGuardar)
          .eq('id', data.id)
          .select()
          .single();
      } else {
        // Crear nuevo registro
        resultado = await supabase
          .from(configuracion.tabla)
          .insert([datosParaGuardar])
          .select()
          .single();
      }

      if (resultado.error) throw resultado.error;

      // Si viene desde testeo, marcar como completado
      if (modo === 'cargar_desde_testeo' && equipoTesteo) {
        await supabase
          .from('testeo_equipos')
          .update({ estado_testeo: 'completado' })
          .eq('id', equipoTesteo.id);
      }

      onSave(resultado.data);
      onClose();
    } catch (err) {
      console.error('Error guardando producto:', err);
      alert('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const prepararDatosSegunTabla = () => {
    const datos = { ...formData };
    
    // Transformaciones específicas por tipo
    if (tipo === 'notebook') {
      datos.touchscreen = datos.touchscreen === true || datos.touchscreen === 'SI';
      // No incluir precio_costo_total - se calcula automáticamente
      delete datos.precio_costo_total;
    }
    
    if (tipo === 'celular') {
      if (datos.ciclos) datos.ciclos = parseInt(datos.ciclos) || null;
    }
    
    if (tipo === 'otros') {
      datos.cantidad = parseInt(datos.cantidad) || 1;
    }

    // Convertir números
    ['precio_costo_usd', 'envios_repuestos', 'precio_venta_usd', 'precio_compra_usd', 'precio_venta_pesos'].forEach(campo => {
      if (datos[campo] !== undefined && datos[campo] !== '') {
        datos[campo] = parseFloat(datos[campo]) || 0;
      }
    });

    return datos;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                {modo === 'editar' ? 'Editar' : 'Agregar'} {configuracion.titulo}
              </h3>
              {modo === 'cargar_desde_testeo' && (
                <p className="text-sm text-slate-600 mt-1">
                  Cargando desde testeo - Serial: {equipoTesteo?.serial}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-slate-800 border-b border-slate-200 pb-2">
              Información Básica
            </h4>
            
            {renderCamposBasicos()}
          </div>

          {/* Precios */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-slate-800 border-b border-slate-200 pb-2">
              Precios
            </h4>
            
            {renderCamposPrecios()}
          </div>

          {/* Campos específicos por tipo */}
          {configuracion.camposEspecificos.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-md font-medium text-slate-800 border-b border-slate-200 pb-2">
                Especificaciones
              </h4>
              
              {renderCamposEspecificos()}
            </div>
          )}

          {/* Otros datos */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-slate-800 border-b border-slate-200 pb-2">
              Otros Datos
            </h4>
            
            {renderOtrosCampos()}
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors disabled:bg-emerald-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Guardando...' : 'Guardar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Funciones para renderizar secciones específicas
  function renderCamposBasicos() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Serial - Solo para notebooks y celulares */}
        {tipo !== 'otros' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Serial * {tipo === 'celular' && '(Único)'}
            </label>
            <input
              type="text"
              value={formData.serial || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, serial: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
              placeholder={tipo === 'notebook' ? 'Ej: NB123456' : 'Ej: CEL123456'}
              required
            />
          </div>
        )}

        {/* Nombre del producto - Solo para otros */}
        {tipo === 'otros' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nombre del Producto *</label>
            <input
              type="text"
              value={formData.nombre_producto || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre_producto: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Ej: Mouse Logitech"
              required
            />
          </div>
        )}

        {/* Modelo - Para notebooks y celulares */}
        {tipo !== 'otros' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Modelo {configuracion.camposObligatorios.includes('modelo') ? '*' : ''}
            </label>
            <input
              type="text"
              value={formData.modelo || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, modelo: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
              placeholder={tipo === 'notebook' ? 'Ej: ThinkPad X1' : 'Ej: iPhone 14 Pro'}
              required={configuracion.camposObligatorios.includes('modelo')}
            />
          </div>
        )}

        {/* Marca */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Marca</label>
          <select
            value={formData.marca || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, marca: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Seleccionar...</option>
            {OPCIONES.marca[tipo]?.map(marca => (
              <option key={marca} value={marca}>{marca}</option>
            ))}
          </select>
        </div>

        {/* Condición */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Condición {configuracion.camposObligatorios.includes('condicion') ? '*' : ''}
          </label>
          <select
            value={formData.condicion || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, condicion: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
            required={configuracion.camposObligatorios.includes('condicion')}
          >
            <option value="">Seleccionar...</option>
            {OPCIONES.condicion.map(opcion => (
              <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
            ))}
          </select>
        </div>

        {/* Sucursal */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Sucursal {configuracion.camposObligatorios.includes('sucursal') ? '*' : ''}
          </label>
          <select
            value={formData.sucursal || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, sucursal: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
            required={configuracion.camposObligatorios.includes('sucursal')}
          >
            <option value="">Seleccionar...</option>
            {OPCIONES.sucursal.map(opcion => (
              <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
            ))}
          </select>
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
          <input
            type="text"
            value={formData.color || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Ej: Negro, Plata, Azul"
          />
        </div>

        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Estado</label>
          <select
            value={formData.estado || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Seleccionar...</option>
            {OPCIONES.estado.map(opcion => (
              <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
            ))}
          </select>
        </div>

        {/* Cantidad - Solo para otros */}
        {tipo === 'otros' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Cantidad *</label>
            <input
              type="number"
              value={formData.cantidad || 1}
              onChange={(e) => setFormData(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
              min="1"
              required
            />
          </div>
        )}

        {/* Categoría - Solo para otros */}
        {tipo === 'otros' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Categoría *</label>
            <select
              value={formData.categoria || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
              required
            >
              <option value="">Seleccionar...</option>
              {OPCIONES.categoria.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  }

  function renderCamposPrecios() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Precio de compra */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {tipo === 'notebook' ? 'Precio Costo USD' : 'Precio Compra USD'}
            {configuracion.camposObligatorios.includes('precio_compra_usd') || configuracion.camposObligatorios.includes('precio_costo_usd') ? ' *' : ''}
          </label>
          <input
            type="number"
            value={formData[tipo === 'notebook' ? 'precio_costo_usd' : 'precio_compra_usd'] || 0}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              [tipo === 'notebook' ? 'precio_costo_usd' : 'precio_compra_usd']: parseFloat(e.target.value) || 0 
            }))}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
            step="0.01"
            min="0"
            placeholder="0.00"
            required={configuracion.camposObligatorios.includes('precio_compra_usd') || configuracion.camposObligatorios.includes('precio_costo_usd')}
          />
        </div>

        {/* Envíos/Repuestos - Solo para notebooks */}
        {tipo === 'notebook' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Envíos/Repuestos USD</label>
            <input
              type="number"
              value={formData.envios_repuestos || 0}
              onChange={(e) => setFormData(prev => ({ ...prev, envios_repuestos: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
              step="0.01"
              min="0"
              placeholder="0.00"
            />
          </div>
        )}

        {/* Precio de venta USD */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Precio Venta USD
            {configuracion.camposObligatorios.includes('precio_venta_usd') ? ' *' : ''}
          </label>
          <input
            type="number"
            value={formData.precio_venta_usd || 0}
            onChange={(e) => setFormData(prev => ({ ...prev, precio_venta_usd: parseFloat(e.target.value) || 0 }))}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
            step="0.01"
            min="0"
            placeholder="0.00"
            required={configuracion.camposObligatorios.includes('precio_venta_usd')}
          />
        </div>

        {/* Precio de venta en pesos - Solo para otros */}
        {tipo === 'otros' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Precio Venta Pesos
              {configuracion.camposObligatorios.includes('precio_venta_pesos') ? ' *' : ''}
            </label>
            <input
              type="number"
              value={formData.precio_venta_pesos || 0}
              onChange={(e) => setFormData(prev => ({ ...prev, precio_venta_pesos: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
              step="0.01"
              min="0"
              placeholder="0.00"
              required={configuracion.camposObligatorios.includes('precio_venta_pesos')}
            />
          </div>
        )}
      </div>
    );
  }

  function renderCamposEspecificos() {
    if (tipo === 'notebook') {
      return (
        <div className="space-y-4">
          {/* Especificaciones técnicas de notebook */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Procesador</label>
              <input
                type="text"
                value={formData.procesador || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, procesador: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Ej: Intel i5-12400H"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">RAM</label>
              <input
                type="text"
                value={formData.ram || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, ram: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Ej: 16GB"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tipo RAM</label>
              <select
                value={formData.tipo_ram || 'DDR4'}
                onChange={(e) => setFormData(prev => ({ ...prev, tipo_ram: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
              >
                {OPCIONES.tipo_ram.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Slots RAM</label>
              <input
                type="text"
                value={formData.slots || '2'}
                onChange={(e) => setFormData(prev => ({ ...prev, slots: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Ej: 2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">SSD</label>
              <input
                type="text"
                value={formData.ssd || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, ssd: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Ej: 512GB"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">HDD</label>
              <input
                type="text"
                value={formData.hdd || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, hdd: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Ej: 1TB"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Sistema Operativo</label>
              <select
                value={formData.so || 'WIN11'}
                onChange={(e) => setFormData(prev => ({ ...prev, so: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
              >
                {OPCIONES.so.map(so => (
                  <option key={so} value={so}>{so}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Pantalla</label>
              <input
                type="text"
                value={formData.pantalla || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, pantalla: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Ej: 15.6 pulgadas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Resolución</label>
              <select
                value={formData.resolucion || 'FHD'}
                onChange={(e) => setFormData(prev => ({ ...prev, resolucion: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
              >
                {OPCIONES.resolucion.map(res => (
                  <option key={res} value={res}>{res}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Refresh (Hz)</label>
              <input
                type="text"
                value={formData.refresh || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, refresh: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Ej: 60Hz, 120Hz"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Placa de Video</label>
              <input
                type="text"
                value={formData.placa_video || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, placa_video: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Ej: RTX 4060"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">VRAM</label>
              <input
                type="text"
                value={formData.vram || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, vram: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Ej: 8GB"
              />
            </div>
          </div>

          {/* Características adicionales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="touchscreen"
                checked={formData.touchscreen || false}
                onChange={(e) => setFormData(prev => ({ ...prev, touchscreen: e.target.checked }))}
                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="touchscreen" className="text-sm font-medium text-slate-700">
                Pantalla Táctil
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Teclado Retroiluminado</label>
              <select
                value={formData.teclado_retro || 'SI'}
                onChange={(e) => setFormData(prev => ({ ...prev, teclado_retro: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="SI">Sí</option>
                <option value="NO">No</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Idioma Teclado</label>
              <select
                value={formData.idioma_teclado || 'Español'}
                onChange={(e) => setFormData(prev => ({ ...prev, idioma_teclado: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="Español">Español</option>
                <option value="Inglés">Inglés</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Batería</label>
              <input
                type="text"
                value={formData.bateria || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, bateria: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Ej: Li-ion 53Wh"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Duración Batería</label>
              <input
                type="text"
                value={formData.duracion || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, duracion: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Ej: 8 horas"
              />
            </div>
          </div>
        </div>
      );
    }

    if (tipo === 'celular') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Capacidad</label>
            <select
              value={formData.capacidad || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, capacidad: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Seleccionar...</option>
              {OPCIONES.capacidad.map(cap => (
                <option key={cap} value={cap}>{cap}</option>
              ))}
            </select>
          </div>


          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Batería</label>
            <input
              type="text"
              value={formData.bateria || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, bateria: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Ej: 85%, 100%"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Ciclos</label>
            <input
              type="number"
              value={formData.ciclos || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, ciclos: parseInt(e.target.value) || null }))}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
              min="0"
              placeholder="Número de ciclos"
            />
          </div>
        </div>
      );
    }

    if (tipo === 'otros') {
      return (
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Descripción</label>
            <textarea
              value={formData.descripcion || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
              rows="3"
              placeholder="Descripción detallada del producto"
            />
          </div>
        </div>
      );
    }

    return null;
  }

  function renderOtrosCampos() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Garantía</label>
          <input
            type="text"
            value={formData.garantia || (tipo === 'notebook' ? formData.garantia_update : '')}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              [tipo === 'notebook' ? 'garantia_update' : 'garantia']: e.target.value 
            }))}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Ej: 12 meses, 6 meses"
          />
        </div>

        {tipo === 'notebook' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Garantía Oficial</label>
            <input
              type="text"
              value={formData.garantia_oficial || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, garantia_oficial: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Garantía del fabricante"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Fallas</label>
          <input
            type="text"
            value={formData.fallas || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, fallas: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Ej: Ninguna, Pantalla rayada"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="disponible"
            checked={formData.disponible !== false}
            onChange={(e) => setFormData(prev => ({ ...prev, disponible: e.target.checked }))}
            className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
          />
          <label htmlFor="disponible" className="text-sm font-medium text-slate-700">
            Disponible para venta
          </label>
        </div>
      </div>
    );
  }
};

export default ModalProducto;