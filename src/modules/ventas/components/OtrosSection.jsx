import React, { useState, useMemo } from 'react';
import { Trash2, Box, ShoppingCart, X } from 'lucide-react';

const OtrosSection = ({ otros, loading, error, onDelete, onAddToCart, onUpdate }) => {
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [cotizacionDolar, setCotizacionDolar] = useState(1150);

  // Estados para filtros y ordenamiento
  const [filters, setFilters] = useState({
    categoria: '',
    condicion: '',
    precioMax: ''
  });
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  const handleEdit = (producto) => {
    setEditingId(producto.id);
    setEditingData({
      condicion: producto.condicion || 'nuevo',
      categoria: producto.categoria || 'gadgets',
      precio_venta_usd: producto.precio_venta_usd || 0,
      garantia: producto.garantia || '',
      fallas: producto.fallas || 'Ninguna'
    });
  };

  const handleSave = async () => {
    try {
      await onUpdate(editingId, editingData);
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

  const isEditing = (productoId) => editingId === productoId;

  const EditableCell = ({ producto, field, type = 'text', options = null, className = '' }) => {
    if (!isEditing(producto.id)) {
      const value = producto[field] || '';
      return (
        <span 
          className={`text-sm cursor-pointer hover:bg-gray-100 p-1 rounded whitespace-nowrap ${className}`}
          onDoubleClick={() => handleEdit(producto)}
          title="Doble clic para editar"
        >
          {type === 'currency' ? `$${value}` : value}
        </span>
      );
    }

    if (type === 'select') {
      return (
        <select
          value={editingData[field] || ''}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 whitespace-nowrap"
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
        className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 whitespace-nowrap"
      />
    );
  };

  const condicionOptions = [
    { value: 'nuevo', label: 'NUEVO' },
    { value: 'usado', label: 'USADO' },
    { value: 'reparacion', label: 'REPARACION' }
  ];

  const categoriaOptions = [
    { value: 'fundas_templados', label: 'FUNDAS/TEMPLADOS' },
    { value: 'teclados_mouse', label: 'TECLADOS/MOUSE' },
    { value: 'monitores', label: 'MONITORES' },
    { value: 'placas_video', label: 'PLACAS DE VIDEO' },
    { value: 'gadgets', label: 'GADGETS' },
    { value: 'cargadores', label: 'CARGADORES' },
    { value: 'motherboard', label: 'MOTHERBOARD' }
  ];

  const getCategoriaColor = (categoria) => {
    switch (categoria) {
      case 'fundas_templados': return 'bg-blue-100 text-blue-800';
      case 'teclados_mouse': return 'bg-green-100 text-green-800';
      case 'monitores': return 'bg-purple-100 text-purple-800';
      case 'placas_video': return 'bg-red-100 text-red-800';
      case 'gadgets': return 'bg-yellow-100 text-yellow-800';
      case 'cargadores': return 'bg-orange-100 text-orange-800';
      case 'motherboard': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoriaLabel = (categoria) => {
    const option = categoriaOptions.find(opt => opt.value === categoria);
    return option ? option.label : categoria?.toUpperCase() || 'SIN CATEGORÍA';
  };

  // Obtener valores únicos para filtros
  const uniqueValues = useMemo(() => {
    const categorias = [...new Set(otros.map(p => p.categoria).filter(Boolean))];
    const condiciones = [...new Set(otros.map(p => p.condicion).filter(Boolean))];
    
    // Calcular precio máximo para el slider
    const precios = otros.map(p => parseFloat(p.precio_venta_usd) || 0).filter(p => p > 0);
    const precioMax = Math.max(...precios) || 1000;
    
    return { categorias, condiciones, precioMax };
  }, [otros]);

  // Función para aplicar filtros y ordenamiento
  const filteredAndSortedOtros = useMemo(() => {
    let filtered = otros.filter(producto => {
      // Filtro por categoría
      if (filters.categoria && producto.categoria !== filters.categoria) return false;
      
      // Filtro por condición
      if (filters.condicion && producto.condicion !== filters.condicion) return false;
      
      // Filtro por precio máximo
      const precio = parseFloat(producto.precio_venta_usd) || 0;
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
            // Calcular ganancia: precio_venta - precio_compra
            valueA = (parseFloat(a.precio_venta_usd) || 0) - (parseFloat(a.precio_compra_usd) || 0);
            valueB = (parseFloat(b.precio_venta_usd) || 0) - (parseFloat(b.precio_compra_usd) || 0);
            break;
          case 'ingreso':
            valueA = new Date(a.ingreso || '1970-01-01');
            valueB = new Date(b.ingreso || '1970-01-01');
            break;
          case 'categoria':
            valueA = (a.categoria || '').toString();
            valueB = (b.categoria || '').toString();
            break;
          case 'cantidad':
            valueA = parseInt(a.cantidad) || 0;
            valueB = parseInt(b.cantidad) || 0;
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
  }, [otros, filters, sortBy, sortOrder]);

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({
      categoria: '',
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
    { value: 'cantidad', label: 'Cantidad' },
    { value: 'categoria', label: 'Categoría' }
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 bg-gradient-to-r from-green-700 to-green-500 rounded-2xl p-8 flex items-center justify-between shadow-lg">
        <div>
          <h2 className="text-4xl font-bold text-white drop-shadow">Stock de Otros Productos</h2>
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
      
      {loading && <p className="text-blue-600">Cargando productos desde Supabase...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      
      {!loading && !error && (
        <>
          {/* Controles de filtrado y ordenamiento - Siempre visibles en una fila */}
          <div className="mb-6 bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <p className="font-semibold text-green-600">
                  📦 {filteredAndSortedOtros.length} de {otros.length} productos
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

              {/* Filtro por categoría */}
              <div className="flex-shrink-0">
                <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={filters.categoria}
                  onChange={(e) => handleFilterChange('categoria', e.target.value)}
                  className="p-2 border border-gray-300 rounded-md text-sm min-w-[160px]"
                >
                  <option value="">Todas</option>
                  {uniqueValues.categorias.map(categoria => (
                    <option key={categoria} value={categoria}>
                      {getCategoriaLabel(categoria)}
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
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Descripción</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Cantidad</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">P.C. USD</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">P.V. USD</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">P.V. Pesos</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Condición</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Categoría</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Garantía</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Fallas</th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-green-900 uppercase whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedOtros.map((producto, index) => (
                  <tr key={producto.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-green-50'} ${isEditing(producto.id) ? 'bg-blue-100' : ''}`}>
                    <td className="px-2 py-3 text-sm text-gray-900 font-medium whitespace-nowrap" title={producto.descripcion_producto}>
                      {producto.descripcion_producto}
                    </td>
                    <td className="px-2 py-3 text-sm text-center whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        producto.cantidad > 10 ? 'bg-green-100 text-green-800' :
                        producto.cantidad > 5 ? 'bg-yellow-100 text-yellow-800' :
                        producto.cantidad > 0 ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {producto.cantidad}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap">${producto.precio_compra_usd}</td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <EditableCell producto={producto} field="precio_venta_usd" type="currency" />
                    </td>
                    <td className="px-2 py-3 text-sm font-semibold text-green-600 whitespace-nowrap">
                      ${((parseFloat(editingData.precio_venta_usd) || parseFloat(producto.precio_venta_usd) || 0) * cotizacionDolar).toLocaleString('es-AR')}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      {isEditing(producto.id) ? (
                        <select
                          value={editingData.condicion || ''}
                          onChange={(e) => handleFieldChange('condicion', e.target.value)}
                          className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 whitespace-nowrap"
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
                            producto.condicion === 'nuevo' ? 'bg-green-100 text-green-800' :
                            producto.condicion === 'usado' ? 'bg-blue-100 text-blue-800' :
                            producto.condicion === 'reparacion' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                          onDoubleClick={() => handleEdit(producto)}
                          title="Doble clic para editar"
                        >
                          {(producto.condicion || '').toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      {isEditing(producto.id) ? (
                        <select
                          value={editingData.categoria || ''}
                          onChange={(e) => handleFieldChange('categoria', e.target.value)}
                          className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 whitespace-nowrap"
                        >
                          {categoriaOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span 
                          className={`px-2 py-1 rounded-full text-xs font-bold cursor-pointer hover:bg-gray-100 ${getCategoriaColor(producto.categoria)}`}
                          onDoubleClick={() => handleEdit(producto)}
                          title="Doble clic para editar"
                        >
                          {getCategoriaLabel(producto.categoria)}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <EditableCell producto={producto} field="garantia" />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <EditableCell producto={producto} field="fallas" />
                    </td>
                    <td className="px-2 py-3 text-sm whitespace-nowrap">
                      <div className="flex space-x-1">
                        {isEditing(producto.id) ? (
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
                              onClick={() => handleEdit(producto)}
                              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                              title="Editar"
                            >
                              Editar
                            </button>
                            {producto.cantidad > 0 && onAddToCart && (
                              <button
                                onClick={() => onAddToCart(producto, 'otro')}
                                className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                                title="Agregar al carrito"
                              >
                                Carrito
                              </button>
                            )}
                            <button
                              onClick={() => onDelete(producto.id)}
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

export default OtrosSection;