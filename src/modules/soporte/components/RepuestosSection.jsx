import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Trash2, Save, RefreshCw, Search, Package, CheckCircle, AlertCircle, Layers } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

// Servicio para Repuestos
const repuestosService = {
  async getAll() {
    console.log('🔧 Obteniendo repuestos...');
    
    const { data, error } = await supabase
      .from('repuestos')
      .select('*')
      .eq('disponible', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error obteniendo repuestos:', error);
      throw error;
    }
    
    console.log(`✅ ${data.length} repuestos obtenidos`);
    return data;
  },

  async create(repuesto) {
    console.log('💾 Creando repuesto:', repuesto.item);
    
    const { data, error } = await supabase
      .from('repuestos')
      .insert([{
        ...repuesto,
        precio_compra: parseFloat(repuesto.precio_compra) || 0,
        precio_venta: parseFloat(repuesto.precio_venta) || 0,
        cantidad: parseInt(repuesto.cantidad) || 0,
        disponible: true
      }])
      .select();
    
    if (error) {
      console.error('❌ Error creando repuesto:', error);
      throw error;
    }
    
    console.log('✅ Repuesto creado exitosamente');
    return data[0];
  },

  async update(id, updates) {
    console.log(`🔄 Actualizando repuesto ID: ${id}`);
    
    const { data, error } = await supabase
      .from('repuestos')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('❌ Error actualizando repuesto:', error);
      throw error;
    }
    
    console.log('✅ Repuesto actualizado');
    return data[0];
  },

  async delete(id) {
    console.log(`🗑️ Eliminando repuesto ID: ${id}`);
    
    const { error } = await supabase
      .from('repuestos')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('❌ Error eliminando repuesto:', error);
      throw error;
    }
    
    console.log('✅ Repuesto eliminado');
    return true;
  }
};

// Hook personalizado
function useRepuestos() {
  const [repuestos, setRepuestos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRepuestos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await repuestosService.getAll();
      setRepuestos(data);
    } catch (err) {
      console.error('Error en useRepuestos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addRepuesto = async (repuesto) => {
    try {
      setError(null);
      const newRepuesto = await repuestosService.create(repuesto);
      setRepuestos(prev => [newRepuesto, ...prev]);
      return newRepuesto;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateRepuesto = async (id, updates) => {
    try {
      setError(null);
      const updated = await repuestosService.update(id, updates);
      setRepuestos(prev => prev.map(rep => 
        rep.id === id ? updated : rep
      ));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteRepuesto = async (id) => {
    try {
      setError(null);
      await repuestosService.delete(id);
      setRepuestos(prev => prev.filter(rep => rep.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    repuestos,
    loading,
    error,
    fetchRepuestos,
    addRepuesto,
    updateRepuesto,
    deleteRepuesto
  };
}

// Componente principal
const RepuestosSection = () => {
  const {
    repuestos,
    loading,
    error,
    fetchRepuestos,
    addRepuesto,
    deleteRepuesto
  } = useRepuestos();

  const [filtro, setFiltro] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    item: '',
    precio_compra: '',
    cantidad: '',
    precio_venta: '',
    categoria: ''
  });

  // Categorías predefinidas
  const categorias = [
    'Memoria RAM',
    'Disco Duro',
    'SSD',
    'Procesador',
    'Placa Madre',
    'Fuente',
    'Placa de Video',
    'Ventilador',
    'Batería',
    'Pantalla',
    'Teclado',
    'Touchpad',
    'Cargador',
    'Cable',
    'Otro'
  ];

  useEffect(() => {
    console.log('🚀 Iniciando carga de repuestos...');
    fetchRepuestos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.item.trim()) {
      alert('El nombre del item es obligatorio');
      return;
    }
    if (!formData.categoria) {
      alert('La categoría es obligatoria');
      return;
    }
    if (!formData.precio_compra || parseFloat(formData.precio_compra) <= 0) {
      alert('El precio de compra debe ser mayor a 0');
      return;
    }
    if (!formData.precio_venta || parseFloat(formData.precio_venta) <= 0) {
      alert('El precio de venta debe ser mayor a 0');
      return;
    }
    if (!formData.cantidad || parseInt(formData.cantidad) < 0) {
      alert('La cantidad debe ser 0 o mayor');
      return;
    }

    try {
      await addRepuesto(formData);
      
      // Limpiar formulario
      setFormData({
        item: '',
        precio_compra: '',
        cantidad: '',
        precio_venta: '',
        categoria: ''
      });
      
      alert('✅ Repuesto agregado exitosamente');
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar este repuesto?')) {
      try {
        await deleteRepuesto(id);
        alert('✅ Repuesto eliminado exitosamente');
      } catch (err) {
        alert('❌ Error: ' + err.message);
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Filtrar repuestos
  const repuestosFiltrados = repuestos.filter(repuesto => {
    const cumpleFiltro = filtro === '' || 
      repuesto.item.toLowerCase().includes(filtro.toLowerCase()) ||
      repuesto.categoria.toLowerCase().includes(filtro.toLowerCase());
    
    const cumpleCategoria = categoriaFiltro === 'todas' || repuesto.categoria === categoriaFiltro;
    
    return cumpleFiltro && cumpleCategoria;
  });

  // Obtener categorías únicas de los repuestos
  const categoriasExistentes = [...new Set(repuestos.map(r => r.categoria))].sort();

  return (
    <div className="p-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-black text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Wrench className="w-8 h-8" />
                Repuestos de Computadoras
              </h2>
              <p className="text-gray-300 mt-2">Gestión de inventario de repuestos y componentes</p>
            </div>
          </div>
        </div>

        {/* Formulario para agregar repuesto */}
        <div className="bg-gray-50 p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Plus size={20} className="mr-2" />
            Agregar Nuevo Repuesto
          </h3>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item *
              </label>
              <input
                type="text"
                value={formData.item}
                onChange={(e) => handleInputChange('item', e.target.value)}
                placeholder="ej: Memoria RAM DDR4 8GB Kingston"
                className="w-full border border-gray-400 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría *
              </label>
              <select
                value={formData.categoria}
                onChange={(e) => handleInputChange('categoria', e.target.value)}
                className="w-full border border-gray-400 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-600"
                required
              >
                <option value="">Seleccionar...</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio Compra *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precio_compra}
                  onChange={(e) => handleInputChange('precio_compra', e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 border border-gray-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio Venta *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precio_venta}
                  onChange={(e) => handleInputChange('precio_venta', e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 border border-gray-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad *
              </label>
              <input
                type="number"
                min="0"
                value={formData.cantidad}
                onChange={(e) => handleInputChange('cantidad', e.target.value)}
                placeholder="0"
                className="w-full border border-gray-400 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-600"
                required
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-gray-800 text-white px-4 py-2 rounded hover:bg-black transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Save size={16} />
                Agregar
              </button>
            </div>
          </form>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  placeholder="Buscar repuestos..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
            <div>
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="todas">Todas las categorías</option>
                {categoriasExistentes.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Estado de carga y errores */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
            <span className="ml-3 text-gray-600">Cargando repuestos...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 m-6">
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Tabla de repuestos */}
        {!loading && !error && (
          <div className="p-6">
            <div className="mb-4">
              <p className="text-gray-800 font-semibold">
                🔧 {repuestosFiltrados.length} repuestos encontrados
                {filtro || categoriaFiltro !== 'todas' ? ` (de ${repuestos.length} totales)` : ''}
              </p>
            </div>

            {repuestosFiltrados.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Categoría</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Precio Compra</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Precio Venta</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Margen</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Cantidad</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Stock</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {repuestosFiltrados.map((repuesto) => {
                      const margen = (repuesto.precio_venta || 0) - (repuesto.precio_compra || 0);
                      const porcentajeMargen = repuesto.precio_compra > 0 
                        ? ((margen / repuesto.precio_compra) * 100).toFixed(1)
                        : 0;
                      
                      return (
                        <tr key={repuesto.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium max-w-xs">
                            <div className="truncate" title={repuesto.item}>
                              {repuesto.item}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                              {repuesto.categoria}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            ${repuesto.precio_compra?.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-semibold">
                            ${repuesto.precio_venta?.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div>
                              <span className={`font-medium ${margen >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${margen.toFixed(2)}
                              </span>
                              <div className="text-xs text-gray-500">
                                ({porcentajeMargen}%)
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              repuesto.cantidad > 10 ? 'bg-green-100 text-green-800' :
                              repuesto.cantidad > 5 ? 'bg-yellow-100 text-yellow-800' :
                              repuesto.cantidad > 0 ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {repuesto.cantidad}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              repuesto.cantidad > 10 ? 'bg-green-100 text-green-800' :
                              repuesto.cantidad > 5 ? 'bg-yellow-100 text-yellow-800' :
                              repuesto.cantidad > 0 ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {repuesto.cantidad > 0 ? 'Disponible' : 'Sin Stock'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => handleDelete(repuesto.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Package size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-4">
                  {filtro || categoriaFiltro !== 'todas' 
                    ? 'No se encontraron repuestos con los filtros aplicados'
                    : 'No hay repuestos registrados'
                  }
                </p>
                {(filtro || categoriaFiltro !== 'todas') && (
                  <button
                    onClick={() => {
                      setFiltro('');
                      setCategoriaFiltro('todas');
                    }}
                    className="text-gray-600 hover:underline flex items-center gap-2 mx-auto"
                  >
                    <RefreshCw size={16} />
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Estadísticas */}
        {repuestos.length > 0 && (
          <div className="bg-gray-50 p-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-800 text-sm">Repuestos Totales</p>
                    <p className="text-2xl font-bold text-orange-900">{repuestos.length}</p>
                  </div>
                  <Package className="w-8 h-8 text-orange-600" />
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-800 text-sm">En Stock</p>
                    <p className="text-2xl font-bold text-orange-900">{repuestos.filter(r => r.cantidad > 0).length}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-orange-600" />
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-800 text-sm">Sin Stock</p>
                    <p className="text-2xl font-bold text-orange-900">{repuestos.filter(r => r.cantidad === 0).length}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-800 text-sm">Categorías</p>
                    <p className="text-2xl font-bold text-orange-900">{[...new Set(repuestos.map(r => r.categoria))].length}</p>
                  </div>
                  <Layers className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepuestosSection;
