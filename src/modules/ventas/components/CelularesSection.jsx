import React, { useState, useMemo, useEffect } from 'react';
import { Trash2, X } from 'lucide-react';
import FotoProductoAvanzado from '../../../components/FotoProductoAvanzado';
import { cotizacionSimple } from '../../../services/cotizacionSimpleService';

// Función para formatear precios en USD sin decimales con prefijo U$
const formatPriceUSD = (price) => {
  const numPrice = parseFloat(price) || 0;
  return `U$${Math.round(numPrice)}`;
};


const CelularesSection = ({ celulares, loading, error, onDelete, onUpdate }) => {
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [cotizacionDolar, setCotizacionDolar] = useState(1000);

  // Estados para filtros y ordenamiento
  const [filters, setFilters] = useState({
    sucursal: '',
    condicion: '',
    precioMax: ''
  });
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

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

  const handleEdit = (celular) => {
    // Prevenir edición si está cargando o no hay función de actualización
    if (loading || !onUpdate || typeof onUpdate !== 'function') {
      console.warn('⚠️ [Celulares] No se puede editar: loading:', loading, 'onUpdate disponible:', !!onUpdate);
      alert('No se puede editar en este momento. Intenta nuevamente en unos segundos.');
      return;
    }
    
    console.log('📝 [Celulares] Iniciando edición completa:', celular.id);
    setEditingId(celular.id);
    setEditingData({
      // Campos de precio
      precio_compra_usd: celular.precio_compra_usd || 0,
      repuestos_usd: celular.repuestos_usd || 0,
      precio_venta_usd: celular.precio_venta_usd || 0,
      
      // Información básica
      modelo: celular.modelo || '',
      marca: celular.marca || '',
      color: celular.color || '',
      capacidad: celular.capacidad || '',
      almacenamiento: celular.almacenamiento || '',
      
      // Estado y condición
      condicion: celular.condicion || 'usado',
      sucursal: celular.sucursal || 'la_plata',
      estado: celular.estado || '',
      estado_estetico: celular.estado_estetico || '',
      
      // Batería y ciclos
      bateria: celular.bateria || '',
      porcentaje_bateria: celular.porcentaje_bateria || '',
      ciclos: celular.ciclos || 0,
      
      // Garantías y fallas
      garantia: celular.garantia || '',
      garantia_update: celular.garantia_update || '',
      garantia_oficial: celular.garantia_oficial || '',
      fallas: celular.fallas || 'Ninguna'
    });
    console.log('✅ [Celulares] Edición iniciada para:', celular.id);
  };

  const handleSave = async () => {
    try {
      console.log('💾 [Celulares] Guardando datos:', editingData);
      
      // Verificar que onUpdate esté disponible
      if (!onUpdate || typeof onUpdate !== 'function') {
        console.error('❌ [Celulares] onUpdate no está disponible');
        alert('Error: Función de actualización no disponible. Intenta recargar la página.');
        return;
      }
      
      const updatedData = {
        ...editingData,
        precio_venta_pesos: (parseFloat(editingData.precio_venta_usd) || 0) * cotizacionDolar
      };
      
      console.log('🚀 [Celulares] Enviando actualización:', updatedData);
      await onUpdate(editingId, updatedData);
      
      console.log('✅ [Celulares] Guardado exitoso');
      setEditingId(null);
      setEditingData({});
    } catch (error) {
      console.error('❌ [Celulares] Error al actualizar:', error);
      alert('Error al actualizar: ' + error.message);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({});
  };

  const handleFieldChange = (field, value) => {
    console.log('🔄 [Celulares] Cambiando campo:', { field, value });
    setEditingData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      console.log('💾 [Celulares] Nuevo editingData:', newData);
      return newData;
    });
  };

  const isEditing = (celularId) => editingId === celularId;


  // Devuelve una clase de color según la condición del celular
  const getCelularCondicionColor = (condicion) => {
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
  };

  // Devuelve una clase de color de fondo de fila según la condición
  const getCondicionRowColor = (condicion) => {
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
  };

  // Función para generar el copy automático
  const generateCopy = (celular, enPesos = false) => {
    const precio = enPesos 
      ? `$${((parseFloat(celular.precio_venta_usd) || 0) * cotizacionDolar).toLocaleString('es-AR')}`
      : formatPriceUSD(celular.precio_venta_usd);
    
    const partes = [];
    
    // Emoji del teléfono + modelo
    partes.push('📱' + (celular.modelo || 'Sin modelo'));
    
    // Capacidad de almacenamiento
    if (celular.capacidad) partes.push(celular.capacidad);
    
    // Color
    if (celular.color) partes.push(celular.color.toUpperCase());
    
    // Batería con emoji
    if (celular.bateria) partes.push(`🔋${celular.bateria}%`);
    
    // Condición en mayúsculas
    if (celular.condicion) partes.push(celular.condicion.toUpperCase());
    
    // Precio
    partes.push(precio);
    
    return partes.join(' ');
  };


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

  const sucursalOptions = [
    { value: 'la_plata', label: 'LA PLATA' },
    { value: 'mitre', label: 'MITRE' },
    { value: 'fixcenter', label: 'FIXCENTER' },
    { value: 'en_camino', label: 'EN CAMINO' }
  ];

  // Obtener valores únicos para filtros
  const uniqueValues = useMemo(() => {
    const sucursales = [...new Set(celulares.map(c => c.sucursal).filter(Boolean))];
    const condiciones = [...new Set(celulares.map(c => c.condicion).filter(Boolean))];
    
    // Calcular precio máximo para el slider
    const precios = celulares.map(c => parseFloat(c.precio_venta_usd) || 0).filter(p => p > 0);
    const precioMax = Math.max(...precios) || 1000;
    
    return { sucursales, condiciones, precioMax };
  }, [celulares]);

  // Función para aplicar filtros y ordenamiento
  const filteredAndSortedCelulares = useMemo(() => {
    let filtered = celulares.filter(celular => {
      // Filtro por ubicación
      if (filters.sucursal && celular.sucursal !== filters.sucursal) return false;
      
      // Filtro por condición
      if (filters.condicion && celular.condicion !== filters.condicion) return false;
      
      // Filtro por precio máximo
      const precio = parseFloat(celular.precio_venta_usd) || 0;
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
          case 'ganancia': {
            // Calcular ganancia: precio_venta - precio_costo_total
            const costoA = (parseFloat(a.precio_compra_usd) || 0) + (parseFloat(a.repuestos_usd) || 0);
            const costoB = (parseFloat(b.precio_compra_usd) || 0) + (parseFloat(b.repuestos_usd) || 0);
            valueA = (parseFloat(a.precio_venta_usd) || 0) - costoA;
            valueB = (parseFloat(b.precio_venta_usd) || 0) - costoB;
            break;
          }
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
  }, [celulares, filters, sortBy, sortOrder]);

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
      <div className="mb-8 bg-gradient-to-r from-green-700 to-green-500 rounded-2xl p-8 shadow-lg">
        <div>
          <h2 className="text-4xl font-bold text-white drop-shadow">Stock de Celulares</h2>
          <p className="text-white/80 text-xl mt-2">Inventario actualizado con edición inline</p>
        </div>
      </div>

      {loading && <p className="text-blue-600">Cargando celulares desde Supabase...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      
      {!loading && !error && (
        <>
          {/* Controles de filtrado y ordenamiento - Siempre visibles en una fila */}
          <div className="mb-6 bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <p className="font-semibold text-green-600">
                  📱 {filteredAndSortedCelulares.length} de {celulares.length} celulares
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

              {/* Filtro por ubicación */}
              <div className="flex-shrink-0">
                <label className="block text-xs font-medium text-gray-700 mb-1">Ubicación</label>
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
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Acciones</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Copy USD</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Copy Pesos</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Serial</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Modelo</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Marca</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Foto</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">P.C. USD</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Repuestos USD</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">P.C. Total</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">P.V. USD</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">P.V. Pesos</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Condición</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Ubicación</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Color</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Capacidad</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Almacenamiento</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Batería</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">% Batería</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Ciclos</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Estado</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Estado Estético</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Garantía</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">G. Update</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">G. Oficial</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Fallas</th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-green-900 uppercase whitespace-nowrap">Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedCelulares.map((celular) => (
                  <tr key={celular.id} className={`${getCondicionRowColor(celular.condicion) || 'bg-white'} ${isEditing(celular.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-2 py-3 text-sm whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-1">
                        {isEditing(celular.id) ? (
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
                            onClick={() => handleEdit(celular)}
                            disabled={loading || !onUpdate || typeof onUpdate !== 'function'}
                            className={`px-2 py-1 text-white text-xs rounded transition-colors ${
                              loading || !onUpdate || typeof onUpdate !== 'function'
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                            title={
                              loading || !onUpdate || typeof onUpdate !== 'function'
                                ? 'Edición no disponible'
                                : 'Editar todos los campos'
                            }
                          >
                            Editar
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap w-20 text-center">
                      <div 
                        className="text-xs text-gray-700 cursor-pointer hover:bg-gray-100 p-2 rounded border truncate"
                        onClick={() => navigator.clipboard.writeText(generateCopy(celular, false))}
                        title={generateCopy(celular, false)}
                      >
                        📱📋 USD
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap w-20 text-center">
                      <div 
                        className="text-xs text-gray-700 cursor-pointer hover:bg-gray-100 p-2 rounded border truncate"
                        onClick={() => navigator.clipboard.writeText(generateCopy(celular, true))}
                        title={generateCopy(celular, true)}
                      >
                        📱📋 ARS
                      </div>
                    </td>
                    <td className="px-2 py-3 text-sm font-mono text-gray-900 whitespace-nowrap text-center">{celular.serial}</td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      {isEditing(celular.id) ? (
                        <input
                          type="text"
                          value={editingData.modelo || ''}
                          onChange={(e) => handleFieldChange('modelo', e.target.value)}
                          className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-900" title={celular.modelo}>{celular.modelo}</span>
                      )}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      {isEditing(celular.id) ? (
                        <input
                          type="text"
                          value={editingData.marca || ''}
                          onChange={(e) => handleFieldChange('marca', e.target.value)}
                          className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{celular.marca}</span>
                      )}
                    </td>
                    <FotoProductoAvanzado 
                      productoId={celular.id} 
                      tipoProducto="celular" 
                      nombreProducto={celular.modelo || ''}
                    />
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      {isEditing(celular.id) ? (
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={editingData.precio_compra_usd || ''}
                          onChange={(e) => {
                            if (/^\d*$/.test(e.target.value)) handleFieldChange('precio_compra_usd', e.target.value);
                          }}
                          className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-blue-600">{formatPriceUSD(celular.precio_compra_usd)}</span>
                      )}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      {isEditing(celular.id) ? (
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={editingData.repuestos_usd || ''}
                          onChange={(e) => {
                            if (/^\d*$/.test(e.target.value)) handleFieldChange('repuestos_usd', e.target.value);
                          }}
                          className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-blue-600">{formatPriceUSD(celular.repuestos_usd)}</span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-sm font-semibold text-blue-600 whitespace-nowrap text-center">
                      {formatPriceUSD((parseFloat(celular.precio_compra_usd) || 0) + (parseFloat(editingData.repuestos_usd) || parseFloat(celular.repuestos_usd) || 0))}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      {isEditing(celular.id) ? (
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={editingData.precio_venta_usd || ''}
                          onChange={(e) => {
                            if (/^\d*$/.test(e.target.value)) handleFieldChange('precio_venta_usd', e.target.value);
                          }}
                          className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-blue-600">{formatPriceUSD(celular.precio_venta_usd)}</span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-sm font-semibold text-green-600 whitespace-nowrap text-center">
                      ${((parseFloat(editingData.precio_venta_usd) || parseFloat(celular.precio_venta_usd) || 0) * cotizacionDolar).toLocaleString('es-AR')}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      {isEditing(celular.id) ? (
                        <select
                          value={editingData.condicion || ''}
                          onChange={(e) => handleFieldChange('condicion', e.target.value)}
                          className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 whitespace-nowrap"
                        >
                          {condicionOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span 
                          className={`px-2 py-1 rounded-full text-xs font-bold border transition-colors ${
                            getCelularCondicionColor(celular.condicion)
                          }`}
                        >
                          {(celular.condicion || '').toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      {isEditing(celular.id) ? (
                        <select
                          value={editingData.sucursal || ''}
                          onChange={(e) => handleFieldChange('sucursal', e.target.value)}
                          className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 whitespace-nowrap"
                        >
                          {sucursalOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm text-gray-900">{(celular.sucursal || '').replace('_', ' ').toUpperCase()}</span>
                      )}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      {isEditing(celular.id) ? (
                        <input
                          type="text"
                          value={editingData.color || ''}
                          onChange={(e) => handleFieldChange('color', e.target.value)}
                          className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{celular.color}</span>
                      )}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      {isEditing(celular.id) ? (
                        <input
                          type="text"
                          value={editingData.capacidad || ''}
                          onChange={(e) => handleFieldChange('capacidad', e.target.value)}
                          className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{celular.capacidad}</span>
                      )}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      {isEditing(celular.id) ? (
                        <input
                          type="text"
                          value={editingData.almacenamiento || ''}
                          onChange={(e) => handleFieldChange('almacenamiento', e.target.value)}
                          className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{celular.almacenamiento}</span>
                      )}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      {isEditing(celular.id) ? (
                        <input
                          type="text"
                          value={editingData.bateria || ''}
                          onChange={(e) => handleFieldChange('bateria', e.target.value)}
                          className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{celular.bateria}</span>
                      )}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      {isEditing(celular.id) ? (
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={editingData.porcentaje_bateria || ''}
                          onChange={(e) => {
                            if (/^\d*$/.test(e.target.value)) handleFieldChange('porcentaje_bateria', e.target.value);
                          }}
                          className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{celular.porcentaje_bateria}</span>
                      )}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      {isEditing(celular.id) ? (
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={editingData.ciclos || ''}
                          onChange={(e) => {
                            if (/^\d*$/.test(e.target.value)) handleFieldChange('ciclos', e.target.value);
                          }}
                          className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{celular.ciclos}</span>
                      )}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      {isEditing(celular.id) ? (
                        <input
                          type="text"
                          value={editingData.estado || ''}
                          onChange={(e) => handleFieldChange('estado', e.target.value)}
                          className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{celular.estado}</span>
                      )}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      {isEditing(celular.id) ? (
                        <input
                          type="text"
                          value={editingData.estado_estetico || ''}
                          onChange={(e) => handleFieldChange('estado_estetico', e.target.value)}
                          className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{celular.estado_estetico}</span>
                      )}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      {isEditing(celular.id) ? (
                        <input
                          type="text"
                          value={editingData.garantia || ''}
                          onChange={(e) => handleFieldChange('garantia', e.target.value)}
                          className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{celular.garantia}</span>
                      )}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      {isEditing(celular.id) ? (
                        <input
                          type="text"
                          value={editingData.garantia_update || ''}
                          onChange={(e) => handleFieldChange('garantia_update', e.target.value)}
                          className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{celular.garantia_update}</span>
                      )}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      {isEditing(celular.id) ? (
                        <input
                          type="text"
                          value={editingData.garantia_oficial || ''}
                          onChange={(e) => handleFieldChange('garantia_oficial', e.target.value)}
                          className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{celular.garantia_oficial}</span>
                      )}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      {isEditing(celular.id) ? (
                        <input
                          type="text"
                          value={editingData.fallas || ''}
                          onChange={(e) => handleFieldChange('fallas', e.target.value)}
                          className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{celular.fallas}</span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-sm whitespace-nowrap text-center">
                      <button
                        onClick={() => onDelete(celular.id)}
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
    </div>
  );
};


export default CelularesSection;