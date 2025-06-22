import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Trash2, Filter, X, ChevronDown, Shield, Eye } from 'lucide-react';
import FotoProductoAvanzado from '../../../components/FotoProductoAvanzado';
import ModalVistaPreviaPDF from '../../../components/ModalVistaPreviaPDF';
import { cotizacionSimple } from '../../../services/cotizacionSimpleService';

// Función para formatear precios en USD sin decimales con prefijo U$
const formatPriceUSD = (price) => {
  const numPrice = parseFloat(price) || 0;
  return `U$${Math.round(numPrice)}`;
};

// Componente para celdas editables - DEFINIDO FUERA para evitar recreación
const SimpleEditableCell = React.memo(({ computer, field, type = 'text', options = null, className = '', isEditing, editingData, onFieldChange }) => {
  if (!isEditing) {
    // Modo visualización - solo mostrar valor
    const value = computer[field] || '';
    if (type === 'currency') {
      return (
        <span className={`text-sm font-semibold text-blue-600 whitespace-nowrap ${className}`}>
          {formatPriceUSD(value)}
        </span>
      );
    }
    return (
      <span className={`text-sm text-gray-900 whitespace-nowrap ${className}`}>
        {value.toString()}
      </span>
    );
  }

  // Modo edición - mostrar input/select
  if (type === 'select') {
    return (
      <select
        value={editingData[field] || ''}
        onChange={(e) => onFieldChange(field, e.target.value)}
        className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 whitespace-nowrap"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={type === 'currency' ? 'text' : 'text'}
      inputMode={type === 'currency' ? 'numeric' : undefined}
      pattern={type === 'currency' ? '[0-9]*' : undefined}
      value={editingData[field] || ''}
      onChange={(e) => {
        if (type === 'currency') {
          if (/^\d*$/.test(e.target.value)) onFieldChange(field, e.target.value);
        } else {
          onFieldChange(field, e.target.value);
        }
      }}
      className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 whitespace-nowrap"
    />
  );
});

const InventarioSection = ({ computers, loading, error, onDelete, onUpdate }) => {
  const [editingId, setEditingId] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [cotizacionDolar, setCotizacionDolar] = useState(1000);

  // Estados para filtros y ordenamiento
  const [filters, setFilters] = useState({
    sucursal: '',
    condicion: '',
    marca: '',
    precioMax: ''
  });
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [modalGarantia, setModalGarantia] = useState({ open: false, producto: null });


  // Cargar cotización al montar el componente
  useEffect(() => {
    cargarCotizacion();
    // Actualizar cada 5 minutos
    const interval = setInterval(cargarCotizacion, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);


  // Función para cargar cotización desde dolarAPI (sin UI)
  const cargarCotizacion = async () => {
    try {
      const cotizacionData = await cotizacionSimple.obtenerCotizacion();
      setCotizacionDolar(cotizacionData.valor);
    } catch (error) {
      console.error('❌ Error cargando cotización:', error);
      // Mantener valor anterior si falla
    }
  };

  const handleEdit = (computer) => {
    console.log('📝 [Edit/Finish] Iniciando edición completa:', computer.id);
    setEditingId(computer.id);
    setEditingField(null); // No field específico, edición completa
    setEditingData({
      sucursal: computer.sucursal || '',
      condicion: computer.condicion || 'usado',
      marca: computer.marca || '',
      ram: computer.ram || '',
      ssd: computer.ssd || '',
      hdd: computer.hdd || '',
      so: computer.so || '',
      duracion: computer.duracion || '',
      envios_repuestos: computer.envios_repuestos || 0,
      precio_costo_usd: computer.precio_costo_usd || 0,
      precio_venta_usd: computer.precio_venta_usd || 0,
      garantia_update: computer.garantia_update || '',
      garantia_oficial: computer.garantia_oficial || '',
      fallas: computer.fallas || 'Ninguna',
      refresh: computer.refresh || '',
      touchscreen: computer.touchscreen || false
    });
    console.log('✅ [Edit/Finish] Edición iniciada para:', computer.id);
  };

  const handleSave = async () => {
    try {
      console.log('💾 [Edit/Finish] Guardando cambios:', editingData);
      
      if (typeof onUpdate !== 'function') {
        console.error('onUpdate no es una función');
        alert('Error: función de actualización no disponible');
        return;
      }

      // Preparar datos limpios
      const updatedData = { ...editingData };
      delete updatedData.precio_costo_total;
      
      await onUpdate(editingId, updatedData);
      
      console.log('✅ [Edit/Finish] Guardado exitoso');
      setEditingId(null);
      setEditingField(null);
      setEditingData({});
    } catch (error) {
      console.error('❌ [Edit/Finish] Error al actualizar:', error);
      alert('Error al actualizar: ' + error.message);
    }
  };


  const handleCancel = () => {
    console.log('❌ [Edit/Finish] Cancelando edición');
    setEditingId(null);
    setEditingField(null);
    setEditingData({});
  };

  const abrirModalGarantia = (producto) => {
    setModalGarantia({ open: true, producto });
  };

  const cerrarModalGarantia = () => {
    setModalGarantia({ open: false, producto: null });
  };

  const handleFieldChange = (field, value) => {
    console.log('🔄 [Edit/Finish] Cambiando campo:', { field, value });
    setEditingData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      console.log('💾 [Edit/Finish] Nuevo editingData:', newData);
      return newData;
    });
  };


  const isEditing = (computerId) => editingId === computerId;

  // Función para generar el copy automático
  const generateCopy = (computer, enPesos = false) => {
    const precio = enPesos 
      ? `$${((parseFloat(computer.precio_venta_usd) || 0) * cotizacionDolar).toLocaleString('es-AR')}`
      : formatPriceUSD(computer.precio_venta_usd);
    
    const condicion = computer.condicion ? computer.condicion.toUpperCase() : '';
    const procesador = computer.procesador || '';
    const ram = computer.ram || '';
    const ssd = computer.ssd || '';
    const pantalla = computer.pantalla || '';
    const resolucion = computer.resolucion || '';
    const so = computer.so || '';
    const gpu = computer.placa_video || '';
    const duracion = computer.duracion || '';
    const color = computer.color || '';
    const idioma = computer.idioma_teclado || '';
    const garantia = computer.garantia_update || '';

    return `💻${computer.modelo} - Procesador: ${procesador} - Memoria RAM: ${ram} - SSD: ${ssd} - Pantalla: ${pantalla} ${resolucion} - Sistema operativo: ${so} - Placa de video: ${gpu} - Duración: ${duracion} - Color: ${color} - Idioma: ${idioma} - Condición: ${condicion} - Garantía: ${garantia} - ${precio}`;
  };



  // Devuelve una clase de color según la sucursal
  function getSucursalColor(sucursal) {
    switch ((sucursal || '').toLowerCase()) {
      case 'centro':
        return 'bg-blue-100 border-blue-400 text-blue-800';
      case 'norte':
        return 'bg-yellow-100 border-yellow-400 text-yellow-800';
      case 'sur':
        return 'bg-green-100 border-green-400 text-green-800';
      case 'online':
        return 'bg-purple-100 border-purple-400 text-purple-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  }

  // Devuelve una clase de color según la condición
  function getCondicionColor(condicion) {
    switch ((condicion || '').toLowerCase()) {
      case 'nuevo':
        return 'bg-green-200 border-green-400 text-green-900';
      case 'usado':
        return 'bg-blue-200 border-blue-400 text-blue-900';
      case 'reparacion':
        return 'bg-yellow-200 border-yellow-400 text-yellow-900';
      case 'reservado':
        return 'bg-purple-200 border-purple-400 text-purple-900';
      case 'prestado':
        return 'bg-orange-200 border-orange-400 text-orange-900';
      case 'uso oficina':
        return 'bg-cyan-200 border-cyan-400 text-cyan-900';
      case 'sin reparacion':
        return 'bg-red-200 border-red-400 text-red-900';
      case 'perdido':
        return 'bg-slate-200 border-slate-400 text-slate-900';
      case 'en camino':
        return 'bg-indigo-200 border-indigo-400 text-indigo-900';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  }

  // Devuelve una clase de color de fondo de fila según la condición
  function getCondicionRowColor(condicion) {
    switch ((condicion || '').toLowerCase()) {
      case 'nuevo':
        return 'bg-green-50';
      case 'usado':
        return 'bg-blue-50';
      case 'reparacion':
        return 'bg-yellow-50';
      case 'reservado':
        return 'bg-purple-50';
      case 'prestado':
        return 'bg-orange-50';
      case 'uso oficina':
        return 'bg-cyan-50';
      case 'sin reparacion':
        return 'bg-red-50';
      case 'perdido':
        return 'bg-slate-50';
      case 'en camino':
        return 'bg-indigo-50';
      default:
        return '';
    }
  }


  // Opciones para selects (actualizadas)
  const sucursalOptions = [
    { value: 'la plata', label: 'LA PLATA' },
    { value: 'mitre', label: 'MITRE' },
    { value: 'rsn/fixcenter', label: 'RSN/FIXCENTER' },
    { value: 'en camino', label: 'EN CAMINO' },
  ];

  const condicionOptions = [
    { value: 'nuevo', label: 'NUEVO' },
    { value: 'usado', label: 'USADO' },
    { value: 'reparacion', label: 'REPARACION' },
    { value: 'reservado', label: 'RESERVADO' },
    { value: 'prestado', label: 'PRESTADO' },
    { value: 'uso oficina', label: 'USO OFICINA' },
    { value: 'sin reparacion', label: 'SIN REPARACION' },
    { value: 'perdido', label: 'PERDIDO' },
    { value: 'en camino', label: 'EN CAMINO' },
  ];

  const touchscreenOptions = [
    { value: true, label: 'SÍ' },
    { value: false, label: 'NO' },
  ];

  // Obtener valores únicos para filtros
  const uniqueValues = useMemo(() => {
    const sucursales = [...new Set(computers.map(c => c.sucursal).filter(Boolean))];
    const condiciones = [...new Set(computers.map(c => c.condicion).filter(Boolean))];
    const marcas = [...new Set(computers.map(c => c.marca).filter(Boolean))];
    
    // Calcular precio máximo para el slider
    const precios = computers.map(c => parseFloat(c.precio_venta_usd) || 0).filter(p => p > 0);
    const precioMax = Math.max(...precios) || 1000;
    
    return { sucursales, condiciones, marcas, precioMax };
  }, [computers]);

  // Función para aplicar filtros y ordenamiento
  const filteredAndSortedComputers = useMemo(() => {
    let filtered = computers.filter(computer => {
      // Filtro por sucursal
      if (filters.sucursal && computer.sucursal !== filters.sucursal) return false;
      
      // Filtro por condición
      if (filters.condicion && computer.condicion !== filters.condicion) return false;
      
      // Filtro por marca
      if (filters.marca && computer.marca !== filters.marca) return false;
      
      // Filtro por precio máximo
      const precio = parseFloat(computer.precio_venta_usd) || 0;
      if (filters.precioMax && precio > parseFloat(filters.precioMax)) return false;
      
      return true;
    });

    // Aplicar ordenamiento
    if (sortBy) {
      filtered.sort((a, b) => {
        let valueA, valueB;
        
        switch (sortBy) {
          case 'precio_venta_usd':
            valueA = parseFloat(a.precio_venta_usd) || 0;
            valueB = parseFloat(b.precio_venta_usd) || 0;
            break;
          case 'ganancia':
            // Calcular ganancia: precio_venta - precio_costo_total
            const costoA = parseFloat(a.precio_costo_total) || ((parseFloat(a.precio_costo_usd) || 0) + (parseFloat(a.envios_repuestos) || 0));
            const costoB = parseFloat(b.precio_costo_total) || ((parseFloat(b.precio_costo_usd) || 0) + (parseFloat(b.envios_repuestos) || 0));
            valueA = (parseFloat(a.precio_venta_usd) || 0) - costoA;
            valueB = (parseFloat(b.precio_venta_usd) || 0) - costoB;
            break;
          case 'ingreso':
            valueA = new Date(a.ingreso || '1970-01-01');
            valueB = new Date(b.ingreso || '1970-01-01');
            break;
          case 'sucursal':
            valueA = (a.sucursal || '').toString();
            valueB = (b.sucursal || '').toString();
            break;
          default:
            valueA = (a[sortBy] || '').toString();
            valueB = (b[sortBy] || '').toString();
        }
        
        if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return filtered;
  }, [computers, filters, sortBy, sortOrder]);

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({
      sucursal: '',
      condicion: '',
      marca: '',
      precioMax: ''
    });
    setSortBy('');
    setSortOrder('asc');
  };

  // Manejar cambio de filtros
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Opciones de ordenamiento
  const sortOptions = [
    { value: '', label: 'Sin ordenar' },
    { value: 'precio_venta_usd', label: 'Precio venta' },
    { value: 'ganancia', label: 'Ganancia' },
    { value: 'ingreso', label: 'Fecha de ingreso' },
    { value: 'sucursal', label: 'Ubicación' }
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 bg-gradient-to-r from-green-700 to-green-500 rounded-2xl p-8 shadow-lg">
        <div>
          <h2 className="text-4xl font-bold text-white drop-shadow">Inventario de Notebooks</h2>
          <p className="text-white/80 text-xl mt-2">Gestión completa del stock con edición inline</p>
        </div>
      </div>

      {loading && <p className="text-blue-600">Cargando desde Supabase...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      
      {!loading && !error && (
        <>
          {/* Controles de filtrado y ordenamiento - Siempre visibles en una fila */}
          <div className="mb-6 bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <p className="font-semibold text-green-600">
                  ✅ {filteredAndSortedComputers.length} de {computers.length} computadoras
                </p>
                {(Object.values(filters).some(f => f) || sortBy) && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center space-x-1 px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                  >
                    <X size={14} />
                    <span>Limpiar</span>
                  </button>
                )}
              </div>
              
              <div className="text-sm text-gray-600 flex items-center space-x-4">
                <span>💡 Haz clic en "Editar" para modificar todos los campos de una fila</span>
                <span>✅ Luego haz clic en "Finalizar" para guardar los cambios</span>
              </div>
            </div>

            {/* Filtros en una sola fila */}
            <div className="flex items-end space-x-4">
              {/* Ordenamiento - Al principio */}
              <div className="flex-shrink-0">
                <label className="block text-xs font-medium text-gray-700 mb-1">Ordenar por</label>
                <div className="flex space-x-1">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="p-2 border border-gray-300 rounded-md text-sm min-w-[130px]"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {sortBy && (
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-2 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
                      title={`Orden ${sortOrder === 'asc' ? 'ascendente' : 'descendente'}`}
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  )}
                </div>
              </div>

              {/* Filtro por sucursal */}
              <div className="flex-shrink-0">
                <label className="block text-xs font-medium text-gray-700 mb-1">Sucursal</label>
                <select
                  value={filters.sucursal}
                  onChange={(e) => handleFilterChange('sucursal', e.target.value)}
                  className="p-2 border border-gray-300 rounded-md text-sm min-w-[140px]"
                >
                  <option value="">Todas</option>
                  {uniqueValues.sucursales.map(sucursal => (
                    <option key={sucursal} value={sucursal}>
                      {sucursal.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por condición */}
              <div className="flex-shrink-0">
                <label className="block text-xs font-medium text-gray-700 mb-1">Condición</label>
                <select
                  value={filters.condicion}
                  onChange={(e) => handleFilterChange('condicion', e.target.value)}
                  className="p-2 border border-gray-300 rounded-md text-sm min-w-[140px]"
                >
                  <option value="">Todas</option>
                  {uniqueValues.condiciones.map(condicion => (
                    <option key={condicion} value={condicion}>
                      {condicion.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por marca */}
              <div className="flex-shrink-0">
                <label className="block text-xs font-medium text-gray-700 mb-1">Marca</label>
                <select
                  value={filters.marca}
                  onChange={(e) => handleFilterChange('marca', e.target.value)}
                  className="p-2 border border-gray-300 rounded-md text-sm min-w-[120px]"
                >
                  <option value="">Todas</option>
                  {uniqueValues.marcas.map(marca => (
                    <option key={marca} value={marca}>
                      {marca}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro de precio máximo con slider simple */}
              <div className="flex-1 min-w-[250px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Precio máximo USD: ${filters.precioMax || uniqueValues.precioMax}
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max={uniqueValues.precioMax}
                    value={filters.precioMax || uniqueValues.precioMax}
                    onChange={(e) => handleFilterChange('precioMax', e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #10b981 ${((filters.precioMax || uniqueValues.precioMax) / uniqueValues.precioMax) * 100}%, #e5e7eb ${((filters.precioMax || uniqueValues.precioMax) / uniqueValues.precioMax) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>$0</span>
                    <span>${uniqueValues.precioMax}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto shadow-lg rounded-lg">
            <table className="min-w-full bg-white">
              <thead className="bg-green-100">
                <tr>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Acciones</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Copy USD</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Copy Pesos</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Serial</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Modelo</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Marca</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Foto</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">P.C. USD</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Envíos/Rep</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">P.C. Total</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">P.V. USD</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">P.V. Pesos</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Ingreso</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Sucursal</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Condición</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Procesador</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Slots</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Tipo RAM</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">RAM</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">SSD</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">HDD</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">SO</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Pantalla</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Resolución</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Refresh</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Touchscreen</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">GPU</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">VRAM</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Teclado</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Idioma</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Color</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Batería</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Duración</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Garantía</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">G. Oficial</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Fallas</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedComputers.map((computer, index) => (
                  <tr key={computer.id} className={`${getCondicionRowColor(computer.condicion) || 'bg-white'} ${isEditing(computer.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-2 py-3 text-sm whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-1">
                        {isEditing(computer.id) ? (
                          <>
                            <button
                              onClick={handleSave}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                              title="Finalizar y guardar cambios"
                            >
                              Finalizar
                            </button>
                            <button
                              onClick={handleCancel}
                              className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                              title="Cancelar edición"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEdit(computer)}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                            title="Editar todos los campos"
                          >
                            Editar
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap w-20 text-center">
                      <div 
                        className="text-xs text-gray-700 cursor-pointer hover:bg-gray-100 p-2 rounded border truncate transition-colors"
                        onClick={() => navigator.clipboard.writeText(generateCopy(computer, false))}
                        title={generateCopy(computer, false)}
                      >
                        💻📋 USD
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap w-20 text-center">
                      <div 
                        className="text-xs text-gray-700 cursor-pointer hover:bg-gray-100 p-2 rounded border truncate transition-colors"
                        onClick={() => navigator.clipboard.writeText(generateCopy(computer, true))}
                        title={generateCopy(computer, true)}
                      >
                        💻📋 ARS
                      </div>
                    </td>
                    <td className="px-2 py-3 text-sm font-mono text-gray-900 whitespace-nowrap text-center">{computer.serial}</td>
                    <td className="px-2 py-3 text-sm font-medium text-gray-900 whitespace-nowrap text-center" title={computer.modelo}>
                      {computer.modelo}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <SimpleEditableCell 
                        computer={computer} 
                        field="marca" 
                        isEditing={isEditing(computer.id)}
                        editingData={editingData}
                        onFieldChange={handleFieldChange}
                      />
                    </td>
                    <FotoProductoAvanzado 
                      productoId={computer.id} 
                      tipoProducto="computadora" 
                      nombreProducto={computer.modelo || ''}
                    />
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <SimpleEditableCell 
                        computer={computer} 
                        field="precio_costo_usd" 
                        type="currency"
                        isEditing={isEditing(computer.id)}
                        editingData={editingData}
                        onFieldChange={handleFieldChange}
                      />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <SimpleEditableCell 
                        computer={computer} 
                        field="envios_repuestos" 
                        type="currency"
                        isEditing={isEditing(computer.id)}
                        editingData={editingData}
                        onFieldChange={handleFieldChange}
                      />
                    </td>
                    <td className="px-2 py-3 text-sm font-semibold text-blue-600 whitespace-nowrap text-center">
                      {formatPriceUSD(computer.precio_costo_total || ((parseFloat(isEditing(computer.id) ? editingData.precio_costo_usd : computer.precio_costo_usd) || 0) + (parseFloat(isEditing(computer.id) ? editingData.envios_repuestos : computer.envios_repuestos) || 0)))}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <SimpleEditableCell 
                        computer={computer} 
                        field="precio_venta_usd" 
                        type="currency"
                        isEditing={isEditing(computer.id)}
                        editingData={editingData}
                        onFieldChange={handleFieldChange}
                      />
                    </td>
                    <td className="px-2 py-3 text-sm font-semibold text-green-600 whitespace-nowrap text-center">
                      ${((parseFloat(isEditing(computer.id) ? editingData.precio_venta_usd : computer.precio_venta_usd) || 0) * cotizacionDolar).toLocaleString('es-AR')}
                    </td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap text-center">{computer.ingreso}</td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      {isEditing(computer.id) ? (
                        <SimpleEditableCell 
                          computer={computer} 
                          field="sucursal" 
                          type="select"
                          options={sucursalOptions}
                          isEditing={isEditing(computer.id)}
                          editingData={editingData}
                          onFieldChange={handleFieldChange}
                        />
                      ) : (
                        <span 
                          className={`px-2 py-1 rounded-full text-xs font-bold border transition-colors ${getSucursalColor(computer.sucursal)}`}
                        >
                          {(computer.sucursal || '').replace('_', ' ').toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      {isEditing(computer.id) ? (
                        <SimpleEditableCell 
                          computer={computer} 
                          field="condicion" 
                          type="select"
                          options={condicionOptions}
                          isEditing={isEditing(computer.id)}
                          editingData={editingData}
                          onFieldChange={handleFieldChange}
                        />
                      ) : (
                        <span 
                          className={`px-2 py-1 rounded-full text-xs font-bold border transition-colors ${getCondicionColor(computer.condicion)}`}
                        >
                          {(computer.condicion || '').toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap text-center" title={computer.procesador}>
                      {computer.procesador}
                    </td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap text-center">{computer.slots}</td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap text-center">{computer.tipo_ram}</td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <SimpleEditableCell 
                        computer={computer} 
                        field="ram"
                        isEditing={isEditing(computer.id)}
                        editingData={editingData}
                        onFieldChange={handleFieldChange}
                      />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <SimpleEditableCell 
                        computer={computer} 
                        field="ssd"
                        isEditing={isEditing(computer.id)}
                        editingData={editingData}
                        onFieldChange={handleFieldChange}
                      />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <SimpleEditableCell 
                        computer={computer} 
                        field="hdd"
                        isEditing={isEditing(computer.id)}
                        editingData={editingData}
                        onFieldChange={handleFieldChange}
                      />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <SimpleEditableCell 
                        computer={computer} 
                        field="so"
                        isEditing={isEditing(computer.id)}
                        editingData={editingData}
                        onFieldChange={handleFieldChange}
                      />
                    </td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap text-center">{computer.pantalla}</td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap text-center">{computer.resolucion}</td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <SimpleEditableCell 
                        computer={computer} 
                        field="refresh" 
                        className="text-center"
                        isEditing={isEditing(computer.id)}
                        editingData={editingData}
                        onFieldChange={handleFieldChange}
                      />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      {isEditing(computer.id) ? (
                        <SimpleEditableCell 
                          computer={computer} 
                          field="touchscreen" 
                          type="select"
                          options={touchscreenOptions}
                          className="text-center"
                          isEditing={isEditing(computer.id)}
                          editingData={editingData}
                          onFieldChange={handleFieldChange}
                        />
                      ) : (
                        <span 
                          className={`px-2 py-1 rounded-full text-xs font-bold border transition-colors ${
                            computer.touchscreen ? 'bg-green-100 text-green-800 border-green-400' : 'bg-gray-100 text-gray-800 border-gray-400'
                          }`}
                        >
                          {computer.touchscreen ? 'SÍ' : 'NO'}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap text-center" title={computer.placa_video}>
                      {computer.placa_video}
                    </td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap text-center">{computer.vram}</td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap text-center">{computer.teclado_retro}</td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap text-center">{computer.idioma_teclado}</td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap text-center">{computer.color}</td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap text-center">{computer.bateria}</td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <SimpleEditableCell 
                        computer={computer} 
                        field="duracion"
                        isEditing={isEditing(computer.id)}
                        editingData={editingData}
                        onFieldChange={handleFieldChange}
                      />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <SimpleEditableCell 
                        computer={computer} 
                        field="garantia_update"
                        isEditing={isEditing(computer.id)}
                        editingData={editingData}
                        onFieldChange={handleFieldChange}
                      />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <SimpleEditableCell 
                        computer={computer} 
                        field="garantia_oficial"
                        isEditing={isEditing(computer.id)}
                        editingData={editingData}
                        onFieldChange={handleFieldChange}
                      />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <SimpleEditableCell 
                        computer={computer} 
                        field="fallas"
                        isEditing={isEditing(computer.id)}
                        editingData={editingData}
                        onFieldChange={handleFieldChange}
                      />
                    </td>
                    <td className="px-2 py-3 text-sm whitespace-nowrap text-center">
                      <button
                        onClick={() => onDelete(computer.id)}
                        className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                        title="Eliminar"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      
      {/* Modal de vista previa de garantía */}
      {modalGarantia.open && (
        <ModalVistaPreviaPDF
          open={modalGarantia.open}
          onClose={cerrarModalGarantia}
          transaccion={{
            cliente_nombre: 'Cliente Individual',
            numero_transaccion: `INV-${modalGarantia.producto?.id}`,
            fecha_venta: new Date(),
            total_venta: modalGarantia.producto?.precio_venta_usd || 0,
            metodo_pago: 'N/A',
            vendedor: 'Sistema',
            venta_items: [{
              modelo_producto: modalGarantia.producto?.modelo,
              numero_serie: modalGarantia.producto?.serial,
              garantia_dias: modalGarantia.producto?.garantia_update || modalGarantia.producto?.garantia_oficial || '365'
            }]
          }}
          tipo="garantia"
        />
      )}
    </div>
  );
};


export default InventarioSection;