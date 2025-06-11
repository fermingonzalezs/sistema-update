import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Trash2, Filter, X, ChevronDown } from 'lucide-react';

const InventarioSection = ({ computers, loading, error, onDelete, onUpdate }) => {
  const [editingId, setEditingId] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [cotizacionDolar, setCotizacionDolar] = useState(1150);
  const inputRef = useRef(null);

  // Estados para filtros y ordenamiento
  const [filters, setFilters] = useState({
    sucursal: '',
    condicion: '',
    precioMax: ''
  });
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  // Estado para el modal de edición
  const [modalOpen, setModalOpen] = useState(false);
  const [modalField, setModalField] = useState(null);
  const [modalValue, setModalValue] = useState('');
  const [modalComputer, setModalComputer] = useState(null);
  const [modalType, setModalType] = useState('text');
  const modalInputRef = useRef(null);

  // Focus automático cuando se abre la edición
  useEffect(() => {
    if (editingId && editingField && inputRef.current && typeof inputRef.current.select === 'function') {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId, editingField]);

  const handleEdit = (computer, field = null) => {
    // Si ya estamos editando este registro, no hacer nada
    if (editingId === computer.id && !field) return;
    
    setEditingId(computer.id);
    setEditingField(field);
    setEditingData({
      sucursal: computer.sucursal || '',
      condicion: computer.condicion || 'usado',
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
      fallas: computer.fallas || 'Ninguna'
    });
  };

  const handleSave = async () => {
    try {
      // Validar que onUpdate sea una función
      if (typeof onUpdate !== 'function') {
        console.error('onUpdate no es una función');
        alert('Error: función de actualización no disponible');
        return;
      }

      // No incluir precio_costo_total ya que se calcula automáticamente en la DB
      const updatedData = { ...editingData };
      delete updatedData.precio_costo_total;
      
      await onUpdate(editingId, updatedData);
      setEditingId(null);
      setEditingField(null);
      setEditingData({});
    } catch (error) {
      console.error('Error al actualizar:', error);
      alert('Error al actualizar: ' + error.message);
    }
  };

  const handleFieldSave = async (field, value) => {
    try {
      // Validar que onUpdate sea una función
      if (typeof onUpdate !== 'function') {
        console.error('onUpdate no es una función');
        return;
      }

      // Crear objeto con solo el campo que cambió
      const updateData = { [field]: value };
      
      await onUpdate(editingId, updateData);
      setEditingId(null);
      setEditingField(null);
      setEditingData({});
    } catch (error) {
      console.error('Error al actualizar campo:', error);
      alert('Error al actualizar: ' + error.message);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingField(null);
    setEditingData({});
  };

  const handleFieldChange = (field, value) => {
    setEditingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleKeyPress = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (editingField) {
        // Edición de campo individual
        handleFieldSave(field, editingData[field]);
      } else {
        // Edición completa
        handleSave();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      handleCancel();
    }
  };

  const isEditing = (computerId, field = null) => {
    if (field) {
      return editingId === computerId && editingField === field;
    }
    return editingId === computerId;
  };

  // Función para generar el copy automático
  const generateCopy = (computer, enPesos = false) => {
    const precio = enPesos 
      ? `$${((parseFloat(computer.precio_venta_usd) || 0) * cotizacionDolar).toLocaleString('es-AR')}`
      : `U$${computer.precio_venta_usd || 0}`;
    
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

  // Componente para celdas editables mejorado
  const EditableCell = ({ computer, field, type = 'text', options = null, className = '' }) => {
    // Si es select, edición inline
    if (type === 'select') {
      const isFieldEdit = isEditing(computer.id, field);
      const value = (isEditing(computer.id) ? editingData[field] : computer[field]) ?? '';
      return isFieldEdit ? (
        <select
          ref={isFieldEdit ? inputRef : null}
          value={value}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          onKeyDown={isFieldEdit ? handleKeyPress : undefined}
          className="w-full p-1 text-xs border-2 border-blue-500 rounded focus:ring-2 focus:ring-blue-300 bg-white"
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <span
          className={`text-sm cursor-pointer hover:bg-gray-100 p-2 rounded whitespace-nowrap transition-colors ${className}`}
          onClick={() => handleEdit(computer, field)}
          title="Clic para editar"
        >
          {(computer[field] || '').toString().replace('_', ' ').toUpperCase()}
        </span>
      );
    }
    // Para los demás campos, abrir modal al hacer clic
    return (
      <span
        className={`text-sm cursor-pointer hover:bg-gray-100 p-2 rounded whitespace-nowrap transition-colors ${className}`}
        onClick={() => openFieldModal(computer, field, type)}
        title="Clic para editar"
      >
        {(computer[field] ?? '').toString()}
      </span>
    );
  };

  // Abrir modal para editar cualquier campo (menos selects)
  const openFieldModal = (computer, field, type) => {
    setModalComputer(computer);
    setModalField(field);
    setModalValue((computer[field] ?? '').toString());
    setModalOpen(true);
    setEditingId(null);
    setEditingField(null);
    setModalType(type);
  };

  // Guardar valor del modal
  const handleModalSave = async () => {
    if (!modalComputer || !modalField) return;
    if (typeof onUpdate !== 'function') return;
    let value = modalValue;
    if (modalType === 'currency') {
      value = /^\d+$/.test(value) ? parseInt(value, 10) : 0;
    }
    await onUpdate(modalComputer.id, { [modalField]: value });
    setModalOpen(false);
    setModalField(null);
    setModalValue('');
    setModalComputer(null);
    setModalType('text');
  };

  // Cancelar modal
  const handleModalCancel = () => {
    setModalOpen(false);
    setModalField(null);
    setModalValue('');
    setModalComputer(null);
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
        return 'bg-orange-100 border-orange-400 text-orange-800';
      case 'reacondicionado':
        return 'bg-blue-100 border-blue-400 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-700';
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
    { value: 'sin reparacion', label: 'SIN REPARACION' },
  ];

  // Obtener valores únicos para filtros
  const uniqueValues = useMemo(() => {
    const sucursales = [...new Set(computers.map(c => c.sucursal).filter(Boolean))];
    const condiciones = [...new Set(computers.map(c => c.condicion).filter(Boolean))];
    
    // Calcular precio máximo para el slider
    const precios = computers.map(c => parseFloat(c.precio_venta_usd) || 0).filter(p => p > 0);
    const precioMax = Math.max(...precios) || 1000;
    
    return { sucursales, condiciones, precioMax };
  }, [computers]);

  // Función para aplicar filtros y ordenamiento
  const filteredAndSortedComputers = useMemo(() => {
    let filtered = computers.filter(computer => {
      // Filtro por sucursal
      if (filters.sucursal && computer.sucursal !== filters.sucursal) return false;
      
      // Filtro por condición
      if (filters.condicion && computer.condicion !== filters.condicion) return false;
      
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
      <div className="mb-8 bg-gradient-to-r from-green-700 to-green-500 rounded-2xl p-8 flex items-center justify-between shadow-lg">
        <div>
          <h2 className="text-4xl font-bold text-white drop-shadow">Inventario de Notebooks</h2>
          <p className="text-white/80 text-xl mt-2">Gestión completa del stock con edición inline</p>
        </div>
        <div className="text-right text-white">
          <div className="text-sm opacity-80">Cotización Dólar Blue</div>
          <input
            type="number"
            value={cotizacionDolar}
            onChange={(e) => setCotizacionDolar(parseFloat(e.target.value) || 0)}
            className="bg-white/20 text-white placeholder-white/70 p-2 rounded text-right font-bold"
            placeholder="1150"
          />
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
                <span>💡 Clic en cualquier celda para editarla</span>
                <span>⌨️ Enter para guardar, Esc para cancelar</span>
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
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Serial</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Modelo</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">P.C. USD</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Envíos/Rep</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">P.C. Total</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">P.V. USD</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">P.V. Pesos</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Ingreso</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Sucursal</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Condición</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Procesador</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Slots</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Tipo RAM</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">RAM</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">SSD</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">HDD</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">SO</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Pantalla</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Resolución</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">GPU</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">VRAM</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Teclado</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Idioma</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Color</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Batería</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Duración</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Garantía</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">G. Oficial</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Fallas</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Copy USD</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Copy Pesos</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedComputers.map((computer, index) => (
                  <tr key={computer.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-green-50'} ${isEditing(computer.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-2 py-3 text-sm font-mono text-gray-900 whitespace-nowrap">{computer.serial}</td>
                    <td className="px-2 py-3 text-sm font-medium text-gray-900 whitespace-nowrap" title={computer.modelo}>
                      {computer.modelo}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <EditableCell computer={computer} field="precio_costo_usd" type="currency" />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <EditableCell computer={computer} field="envios_repuestos" type="currency" />
                    </td>
                    <td className="px-2 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
                      ${computer.precio_costo_total?.toFixed(2) || ((parseFloat(computer.precio_costo_usd) || 0) + (parseFloat(computer.envios_repuestos) || 0)).toFixed(2)}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <EditableCell computer={computer} field="precio_venta_usd" type="currency" />
                    </td>
                    <td className="px-2 py-3 text-sm font-semibold text-green-600 whitespace-nowrap">
                      ${((parseFloat(computer.precio_venta_usd) || 0) * cotizacionDolar).toLocaleString('es-AR')}
                    </td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap">{computer.ingreso}</td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      {(isEditing(computer.id, 'sucursal') || (isEditing(computer.id) && !editingField)) ? (
                        <EditableCell 
                          computer={computer} 
                          field="sucursal" 
                          type="select"
                          options={sucursalOptions}
                        />
                      ) : (
                        <span 
                          className={`px-2 py-1 rounded-full text-xs font-bold cursor-pointer border transition-colors ${getSucursalColor(computer.sucursal)}`}
                          onClick={() => handleEdit(computer, 'sucursal')}
                          title="Clic para editar"
                        >
                          {(computer.sucursal || '').replace('_', ' ').toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      {(isEditing(computer.id, 'condicion') || (isEditing(computer.id) && !editingField)) ? (
                        <EditableCell 
                          computer={computer} 
                          field="condicion" 
                          type="select"
                          options={condicionOptions}
                        />
                      ) : (
                        <span 
                          className={`px-2 py-1 rounded-full text-xs font-bold cursor-pointer border transition-colors ${getCondicionColor(computer.condicion)}`}
                          onClick={() => handleEdit(computer, 'condicion')}
                          title="Clic para editar"
                        >
                          {(computer.condicion || '').toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap" title={computer.procesador}>
                      {computer.procesador}
                    </td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap">{computer.slots}</td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap">{computer.tipo_ram}</td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <EditableCell computer={computer} field="ram" />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <EditableCell computer={computer} field="ssd" />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <EditableCell computer={computer} field="hdd" />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <EditableCell computer={computer} field="so" />
                    </td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap">{computer.pantalla}</td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap">{computer.resolucion}</td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap" title={computer.placa_video}>
                      {computer.placa_video}
                    </td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap">{computer.vram}</td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap">{computer.teclado_retro}</td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap">{computer.idioma_teclado}</td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap">{computer.color}</td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap">{computer.bateria}</td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <EditableCell computer={computer} field="duracion" />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <EditableCell computer={computer} field="garantia_update" />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <EditableCell computer={computer} field="garantia_oficial" />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <EditableCell computer={computer} field="fallas" />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap w-20">
                      <div 
                        className="text-xs text-gray-700 cursor-pointer hover:bg-gray-100 p-2 rounded border truncate transition-colors"
                        onClick={() => navigator.clipboard.writeText(generateCopy(computer, false))}
                        title={generateCopy(computer, false)}
                      >
                        💻📋 USD
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap w-20">
                      <div 
                        className="text-xs text-gray-700 cursor-pointer hover:bg-gray-100 p-2 rounded border truncate transition-colors"
                        onClick={() => navigator.clipboard.writeText(generateCopy(computer, true))}
                        title={generateCopy(computer, true)}
                      >
                        💻📋 ARS
                      </div>
                    </td>
                    <td className="px-2 py-3 text-sm whitespace-nowrap">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => onDelete(computer.id)}
                          className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                          title="Eliminar"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal para edición de cualquier campo */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 min-w-[300px] flex flex-col items-center">
            <h3 className="text-lg font-bold mb-2">Editar valor</h3>
            <input
              ref={modalInputRef}
              type={modalType === 'currency' ? 'text' : 'text'}
              inputMode={modalType === 'currency' ? 'numeric' : undefined}
              pattern={modalType === 'currency' ? '[0-9]*' : undefined}
              value={modalValue}
              onChange={e => {
                if (modalType === 'currency') {
                  if (/^\d*$/.test(e.target.value)) setModalValue(e.target.value);
                } else {
                  setModalValue(e.target.value);
                }
              }}
              className="border p-2 rounded text-center text-lg mb-4 w-full"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleModalSave}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >Guardar</button>
              <button
                onClick={handleModalCancel}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventarioSection;