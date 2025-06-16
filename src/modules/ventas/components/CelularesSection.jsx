import React, { useState, useMemo } from 'react';
import { Trash2, X } from 'lucide-react';
import FotoProductoAvanzado from '../../../components/FotoProductoAvanzado';

const CelularesSection = ({ celulares, loading, error, onDelete, onUpdate }) => {
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [cotizacionDolar, setCotizacionDolar] = useState(1150);

  // Estados para filtros y ordenamiento
  const [filters, setFilters] = useState({
    ubicacion: '',
    condicion: '',
    precioMax: ''
  });
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  const handleEdit = (celular) => {
    setEditingId(celular.id);
    setEditingData({
      repuestos_usd: celular.repuestos_usd || 0,
      precio_venta_usd: celular.precio_venta_usd || 0,
      condicion: celular.condicion || 'usado',
      ubicacion: celular.ubicacion || 'la_plata',
      garantia_update: celular.garantia_update || '',
      garantia_oficial: celular.garantia_oficial || '',
      fallas: celular.fallas || 'Ninguna'
    });
  };

  const handleSave = async () => {
    try {
      const updatedData = {
        ...editingData,
        precio_venta_pesos: (parseFloat(editingData.precio_venta_usd) || 0) * cotizacionDolar
      };
      
      await onUpdate(editingId, updatedData);
      setEditingId(null);
      setEditingData({});
    } catch (error) {
      alert('Error al actualizar: ' + error.message);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({});
  };

  const handleFieldChange = (field, value) => {
    setEditingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isEditing = (celularId) => editingId === celularId;

  // Función para generar el copy automático
  const generateCopy = (celular, enPesos = false) => {
    const precio = enPesos 
      ? `$${((parseFloat(celular.precio_venta_usd) || 0) * cotizacionDolar).toLocaleString('es-AR')}`
      : `U$${celular.precio_venta_usd || 0}`;
    
    const condicion = celular.condicion ? celular.condicion.toUpperCase() : '';
    const modelo = celular.modelo || '';
    const almacenamiento = celular.almacenamiento || '';
    const color = celular.color || '';
    const bateria = celular.porcentaje_bateria || '';
    const estado = celular.estado_estetico || '';
    const garantia = celular.garantia_update || '';

    return `📱${modelo} - Almacenamiento: ${almacenamiento} - Color: ${color} - Batería: ${bateria} - Estado: ${estado} - Condición: ${condicion} - Garantía: ${garantia} - ${precio}`;
  };

  const EditableCell = ({ celular, field, type = 'text', options = null, className = '' }) => {
    if (!isEditing(celular.id)) {
      const value = celular[field] || '';
      return (
        <span 
          className={`text-sm cursor-pointer hover:bg-gray-100 p-1 rounded whitespace-nowrap ${className}`}
          onDoubleClick={() => handleEdit(celular)}
          title="Doble clic para editar"
        >
          {type === 'currency' ? `${value}` : value}
        </span>
      );
    }

    if (type === 'select') {
      return (
        <select
          value={editingData[field] || ''}
          onChange={(e) => handleFieldChange(field, e.target.value)}
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
        type={type === 'currency' ? 'number' : 'text'}
        value={editingData[field] || ''}
        onChange={(e) => handleFieldChange(field, e.target.value)}
        step={type === 'currency' ? '0.01' : undefined}
        className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 whitespace-nowrap"
      />
    );
  };

  const condicionOptions = [
    { value: 'nuevo', label: 'NUEVO' },
    { value: 'usado', label: 'USADO' },
    { value: 'reparacion', label: 'REPARACION' }
  ];

  const ubicacionOptions = [
    { value: 'la_plata', label: 'LA PLATA' },
    { value: 'mitre', label: 'MITRE' },
    { value: 'fixcenter', label: 'FIXCENTER' },
    { value: 'en_camino', label: 'EN CAMINO' }
  ];

  // Obtener valores únicos para filtros
  const uniqueValues = useMemo(() => {
    const ubicaciones = [...new Set(celulares.map(c => c.ubicacion).filter(Boolean))];
    const condiciones = [...new Set(celulares.map(c => c.condicion).filter(Boolean))];
    
    // Calcular precio máximo para el slider
    const precios = celulares.map(c => parseFloat(c.precio_venta_usd) || 0).filter(p => p > 0);
    const precioMax = Math.max(...precios) || 1000;
    
    return { ubicaciones, condiciones, precioMax };
  }, [celulares]);

  // Función para aplicar filtros y ordenamiento
  const filteredAndSortedCelulares = useMemo(() => {
    let filtered = celulares.filter(celular => {
      // Filtro por ubicación
      if (filters.ubicacion && celular.ubicacion !== filters.ubicacion) return false;
      
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
          case 'ganancia':
            // Calcular ganancia: precio_venta - precio_costo_total
            const costoA = (parseFloat(a.precio_compra_usd) || 0) + (parseFloat(a.repuestos_usd) || 0);
            const costoB = (parseFloat(b.precio_compra_usd) || 0) + (parseFloat(b.repuestos_usd) || 0);
            valueA = (parseFloat(a.precio_venta_usd) || 0) - costoA;
            valueB = (parseFloat(b.precio_venta_usd) || 0) - costoB;
            break;
          case 'ingreso':
            valueA = new Date(a.ingreso || '1970-01-01');
            valueB = new Date(b.ingreso || '1970-01-01');
            break;
          case 'ubicacion':
            valueA = (a.ubicacion || '').toString();
            valueB = (b.ubicacion || '').toString();
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
      ubicacion: '',
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
    { value: 'ubicacion', label: 'Ubicación' }
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 bg-gradient-to-r from-green-700 to-green-500 rounded-2xl p-8 flex items-center justify-between shadow-lg">
        <div>
          <h2 className="text-4xl font-bold text-white drop-shadow">Stock de Celulares</h2>
          <p className="text-white/80 text-xl mt-2">Inventario actualizado con edición inline</p>
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
                <span>💡 Haz doble clic en cualquier celda para editarla</span>
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
                  value={filters.ubicacion}
                  onChange={(e) => handleFilterChange('ubicacion', e.target.value)}
                  className="p-2 border border-gray-300 rounded-md text-sm min-w-[140px]"
                >
                  <option value="">Todas</option>
                  {uniqueValues.ubicaciones.map(ubicacion => (
                    <option key={ubicacion} value={ubicacion}>
                      {ubicacion.replace('_', ' ').toUpperCase()}
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
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Foto</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">P.C. USD</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Repuestos USD</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">P.C. Total</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">P.V. USD</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">P.V. Pesos</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Condición</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Ubicación</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Color</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Almacenamiento</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">% Batería</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Estado Estético</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Garantía</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">G. Oficial</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Fallas</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Copy USD</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Copy Pesos</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedCelulares.map((celular, index) => (
                  <tr key={celular.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-green-50'} ${isEditing(celular.id) ? 'bg-blue-100' : ''}`}>
                    <td className="px-2 py-3 text-sm font-mono text-gray-900 whitespace-nowrap">{celular.serial}</td>
                    <td className="px-2 py-3 text-sm font-medium text-gray-900 whitespace-nowrap" title={celular.modelo}>
                      {celular.modelo}
                    </td>
                    <FotoProductoAvanzado 
                      productoId={celular.id} 
                      tipoProducto="celular" 
                      nombreProducto={celular.modelo || ''}
                    />
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap">${celular.precio_compra_usd}</td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <EditableCell celular={celular} field="repuestos_usd" type="currency" />
                    </td>
                    <td className="px-2 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
                      ${((parseFloat(celular.precio_compra_usd) || 0) + (parseFloat(editingData.repuestos_usd) || parseFloat(celular.repuestos_usd) || 0)).toFixed(2)}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <EditableCell celular={celular} field="precio_venta_usd" type="currency" />
                    </td>
                    <td className="px-2 py-3 text-sm font-semibold text-green-600 whitespace-nowrap">
                      ${((parseFloat(editingData.precio_venta_usd) || parseFloat(celular.precio_venta_usd) || 0) * cotizacionDolar).toLocaleString('es-AR')}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
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
                          className={`px-2 py-1 rounded-full text-xs font-bold cursor-pointer hover:bg-gray-100 ${
                            celular.condicion === 'nuevo' ? 'bg-green-100 text-green-800' :
                            celular.condicion === 'usado' ? 'bg-blue-100 text-blue-800' :
                            celular.condicion === 'reservado' ? 'bg-yellow-100 text-yellow-800' :
                            celular.condicion === 'reparacion' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                          onDoubleClick={() => handleEdit(celular)}
                          title="Doble clic para editar"
                        >
                          {(celular.condicion || '').toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <EditableCell 
                        celular={celular} 
                        field="ubicacion" 
                        type="select"
                        options={ubicacionOptions}
                      />
                    </td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap">{celular.color}</td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap">{celular.almacenamiento}</td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap">{celular.porcentaje_bateria}</td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap">{celular.estado_estetico}</td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <EditableCell celular={celular} field="garantia_update" />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <EditableCell celular={celular} field="garantia_oficial" />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <EditableCell celular={celular} field="fallas" />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap w-20">
                      <div 
                        className="text-xs text-gray-700 cursor-pointer hover:bg-gray-100 p-2 rounded border truncate"
                        onClick={() => navigator.clipboard.writeText(generateCopy(celular, false))}
                        title={generateCopy(celular, false)}
                      >
                        📱📋 USD
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap w-20">
                      <div 
                        className="text-xs text-gray-700 cursor-pointer hover:bg-gray-100 p-2 rounded border truncate"
                        onClick={() => navigator.clipboard.writeText(generateCopy(celular, true))}
                        title={generateCopy(celular, true)}
                      >
                        📱📋 ARS
                      </div>
                    </td>
                    <td className="px-2 py-3 text-sm whitespace-nowrap">
                      <div className="flex space-x-1">
                        {isEditing(celular.id) ? (
                          <>
                            <button
                              onClick={handleSave}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                              title="Guardar cambios"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={handleCancel}
                              className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                              title="Cancelar"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(celular)}
                              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                              title="Editar"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => onDelete(celular.id)}
                              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                              title="Eliminar"
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
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