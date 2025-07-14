import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Trash2, Save, RefreshCw, Search, Package, CheckCircle, AlertCircle, Layers, Calculator, AlertTriangle, Eye } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import Tarjeta from '../../../shared/components/layout/Tarjeta.jsx';

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
  
  // Estados para recuento integrado
  const [recuentoIniciado, setRecuentoIniciado] = useState(false);
  const [stockContado, setStockContado] = useState({});
  const [observacionesRecuento, setObservacionesRecuento] = useState('');
  const [mostrarSoloDiferencias, setMostrarSoloDiferencias] = useState(false);
  
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

  // Funciones de recuento integrado
  const iniciarRecuento = () => {
    setRecuentoIniciado(true);
    setStockContado({});
    setObservacionesRecuento('');
    setMostrarSoloDiferencias(false);
  };

  const actualizarStockContado = (repuestoId, cantidad) => {
    setStockContado(prev => ({
      ...prev,
      [repuestoId]: parseInt(cantidad) || 0
    }));
  };

  const calcularDiferencias = () => {
    const diferencias = [];
    const repuestosContados = [];

    repuestos.forEach(repuesto => {
      const stockSistema = repuesto.cantidad || 0;
      const stockReal = stockContado[repuesto.id];

      if (stockReal !== undefined) {
        repuestosContados.push({
          id: repuesto.id,
          item: repuesto.item,
          categoria: repuesto.categoria,
          stockSistema,
          stockReal
        });

        if (stockReal !== stockSistema) {
          diferencias.push({
            id: repuesto.id,
            item: repuesto.item,
            categoria: repuesto.categoria,
            stockSistema,
            stockReal,
            diferencia: stockReal - stockSistema
          });
        }
      }
    });

    return { diferencias, repuestosContados };
  };

  const finalizarRecuento = async () => {
    const { diferencias, repuestosContados } = calcularDiferencias();

    if (repuestosContados.length === 0) {
      alert('No se han contado repuestos. Debe contar al menos un repuesto.');
      return;
    }

    try {
      // Guardar recuento en la tabla de recuentos
      const { error: recuentoError } = await supabase
        .from('recuentos_repuestos')
        .insert([{
          fecha_recuento: new Date().toISOString().split('T')[0],
          tipo_recuento: repuestosContados.length === repuestos.length ? 'completo' : 'parcial',
          repuestos_contados: JSON.stringify(repuestosContados),
          diferencias_encontradas: JSON.stringify(diferencias),
          observaciones: observacionesRecuento,
          usuario_recuento: 'admin',
          estado: diferencias.length > 0 ? 'con_diferencias' : 'sin_diferencias'
        }]);

      if (recuentoError) throw recuentoError;
      
      if (diferencias.length === 0) {
        alert('✅ Recuento finalizado sin diferencias');
      } else {
        const confirmar = confirm(
          `⚠️ Se encontraron ${diferencias.length} diferencias.\\n\\n` +
          '¿Desea aplicar los ajustes al sistema automáticamente?'
        );

        if (confirmar) {
          // Aplicar ajustes al stock
          for (const ajuste of diferencias) {
            const { error: ajusteError } = await supabase
              .from('repuestos')
              .update({ 
                cantidad: ajuste.stockReal,
                disponible: ajuste.stockReal > 0 
              })
              .eq('id', ajuste.id);
            
            if (ajusteError) throw ajusteError;
          }
          
          alert('✅ Ajustes aplicados al sistema');
          fetchRepuestos(); // Refrescar datos
        }
      }

      // Reiniciar formulario
      setRecuentoIniciado(false);
      setStockContado({});
      setObservacionesRecuento('');
      setMostrarSoloDiferencias(false);

    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  // Filtrar repuestos
  const repuestosFiltrados = repuestos.filter(repuesto => {
    const cumpleFiltro = filtro === '' || 
      repuesto.item.toLowerCase().includes(filtro.toLowerCase()) ||
      repuesto.categoria.toLowerCase().includes(filtro.toLowerCase());
    
    const cumpleCategoria = categoriaFiltro === 'todas' || repuesto.categoria === categoriaFiltro;
    
    // Filtro para mostrar solo diferencias (cuando está en modo recuento)
    if (mostrarSoloDiferencias && recuentoIniciado) {
      const stockSistema = repuesto.cantidad || 0;
      const stockReal = stockContado[repuesto.id] || 0;
      return cumpleFiltro && cumpleCategoria && (stockReal !== stockSistema);
    }
    
    return cumpleFiltro && cumpleCategoria;
  });

  // Obtener categorías únicas de los repuestos
  const categoriasExistentes = [...new Set(repuestos.map(r => r.categoria))].sort();

  // Obtener estadísticas del recuento
  const { diferencias, repuestosContados } = calcularDiferencias();

  return (
    <div className="">
      {/* Header con botón de recuento */}
      <div className="bg-white rounded border border-slate-200 mb-4">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Wrench className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-semibold">Gestión de Repuestos</h2>
                <p className="text-slate-300 mt-1">Control de inventario y stock de repuestos</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {!recuentoIniciado ? (
                <button
                  onClick={iniciarRecuento}
                  className="bg-emerald-600 text-white px-6 py-3 rounded hover:bg-emerald-700 flex items-center gap-2 font-medium transition-colors"
                >
                  <Calculator size={18} />
                  Iniciar Recuento
                </button>
              ) : (
                <button
                  onClick={finalizarRecuento}
                  className="bg-emerald-600 text-white px-6 py-3 rounded hover:bg-emerald-700 flex items-center gap-2 font-medium transition-colors"
                >
                  <Save size={18} />
                  Finalizar Recuento
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
     
      {/* Estadísticas */}
      {repuestos.length > 0 && (
        <div className="bg-slate-50 p-6 border-t border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Tarjeta
              icon={Wrench}   
              titulo="Repuestos Disponibles"
              valor={repuestos.filter(r => r.disponible).length}
            />

            {/* Tarjeta de memorias en stock */}
            <Tarjeta
              icon={Layers}
              titulo="Memorias en Stock"
              valor={repuestos.filter(r => r.categoria && r.categoria.toLowerCase().includes('memoria')).reduce((acc, r) => acc + (r.cantidad || 0), 0)}
            />

            <Tarjeta
              icon={Layers}
              titulo="SSD en Stock"
              valor={repuestos.filter(r => r.categoria && r.categoria.toLowerCase().includes('SSD')).reduce((acc, r) => acc + (r.cantidad || 0), 0)}
            />
          </div>
        </div>
      )}

      {/* Estado del recuento */}
      {recuentoIniciado && (
        <div className="bg-white rounded border border-slate-200 mb-4">
          <div className="bg-slate-50 border-b border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-emerald-600 rounded-full animate-pulse"></div>
                  <span className="font-medium text-slate-800">Recuento en proceso</span>
                </div>
                <div className="text-sm text-slate-700">
                  Repuestos contados: {repuestosContados.length} / {repuestos.length}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {diferencias.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <AlertTriangle size={16} className="text-slate-600" />
                    <span className="text-sm text-slate-600 font-medium">
                      {diferencias.length} diferencias encontradas
                    </span>
                  </div>
                )}
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={mostrarSoloDiferencias}
                    onChange={(e) => setMostrarSoloDiferencias(e.target.checked)}
                    className="rounded border-slate-200"
                  />
                  <span>Solo diferencias</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded border border-slate-200 overflow-hidden">
        {/* Formulario para agregar repuesto */}
        <div className="bg-slate-50 p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Plus size={20} className="mr-2" />
            Agregar Nuevo Repuesto
          </h3>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-800 mb-1">
                Item *
              </label>
              <input
                type="text"
                value={formData.item}
                onChange={(e) => handleInputChange('item', e.target.value)}
                placeholder="ej: Memoria RAM DDR4 8GB Kingston"
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">
                Categoría *
              </label>
              <select
                value={formData.categoria}
                onChange={(e) => handleInputChange('categoria', e.target.value)}
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                required
              >
                <option value="">Seleccionar...</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">
                Precio Compra *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precio_compra}
                  onChange={(e) => handleInputChange('precio_compra', e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">
                Precio Venta *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precio_venta}
                  onChange={(e) => handleInputChange('precio_venta', e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">
                Cantidad *
              </label>
              <input
                type="number"
                min="0"
                value={formData.cantidad}
                onChange={(e) => handleInputChange('cantidad', e.target.value)}
                placeholder="0"
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                required
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Save size={16} />
                Agregar
              </button>
            </div>
          </form>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  placeholder="Buscar repuestos..."
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>
            <div>
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <span className="ml-3 text-slate-600">Cargando repuestos...</span>
          </div>
        )}

        {error && (
          <div className="bg-slate-50 border-l-4 border-slate-400 p-4 m-6">
            <span className="text-slate-800">{error}</span>
          </div>
        )}

        {/* Tabla de repuestos */}
        {!loading && !error && (
          <div className="p-6">
            <div className="mb-4">
              <p className="text-slate-800 font-semibold">
                🔧 {repuestosFiltrados.length} repuestos encontrados
                {filtro || categoriaFiltro !== 'todas' ? ` (de ${repuestos.length} totales)` : ''}
              </p>
            </div>

            {repuestosFiltrados.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-slate-200 rounded shadow-sm">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Categoría</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Precio Compra</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Precio Venta</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Margen</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Cantidad</th>
                      {recuentoIniciado && (
                        <>
                          <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase">Stock Real</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase">Diferencia</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase">Estado</th>
                        </>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Stock</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {repuestosFiltrados.map((repuesto) => {
                      const margen = (repuesto.precio_venta || 0) - (repuesto.precio_compra || 0);
                      const porcentajeMargen = repuesto.precio_compra > 0 
                        ? ((margen / repuesto.precio_compra) * 100).toFixed(1)
                        : 0;
                      
                      // Variables para recuento
                      const stockSistema = repuesto.cantidad || 0;
                      const stockReal = stockContado[repuesto.id];
                      const diferencia = stockReal !== undefined ? stockReal - stockSistema : null;
                      const contado = stockReal !== undefined;
                      
                      return (
                        <tr key={repuesto.id} className={`hover:bg-slate-50 ${
                          recuentoIniciado && diferencia !== null && diferencia !== 0 ? 'bg-slate-100' : 
                          recuentoIniciado && contado ? 'bg-emerald-50' : ''
                        }`}>
                          <td className="px-4 py-3 text-sm text-slate-900 font-medium max-w-xs">
                            <div className="truncate" title={repuesto.item}>
                              {repuesto.item}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-medium">
                              {repuesto.categoria}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900">
                            ${repuesto.precio_compra?.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900 font-semibold">
                            ${repuesto.precio_venta?.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div>
                              <span className={`font-medium ${margen >= 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                                ${margen.toFixed(2)}
                              </span>
                              <div className="text-xs text-slate-500">
                                ({porcentajeMargen}%)
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              repuesto.cantidad > 10 ? 'bg-emerald-100 text-emerald-800' :
                              repuesto.cantidad > 5 ? 'bg-slate-100 text-slate-800' :
                              repuesto.cantidad > 0 ? 'bg-slate-100 text-slate-800' :
                              'bg-slate-200 text-slate-800'
                            }`}>
                              {repuesto.cantidad}
                            </span>
                          </td>
                          {recuentoIniciado && (
                            <>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={stockReal || ''}
                                  onChange={(e) => actualizarStockContado(repuesto.id, e.target.value)}
                                  className="w-20 px-2 py-1 border border-slate-200 rounded text-center text-sm focus:ring-2 focus:ring-emerald-600"
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                {diferencia !== null ? (
                                  <span className={`font-medium ${
                                    diferencia === 0 ? 'text-emerald-600' :
                                    diferencia > 0 ? 'text-emerald-600' : 'text-slate-600'
                                  }`}>
                                    {diferencia > 0 ? '+' : ''}{diferencia}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {!contado ? (
                                  <span className="text-slate-400 text-sm">Pendiente</span>
                                ) : diferencia === 0 ? (
                                  <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto" />
                                ) : (
                                  <AlertTriangle className="w-5 h-5 text-slate-600 mx-auto" />
                                )}
                              </td>
                            </>
                          )}
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              repuesto.cantidad > 10 ? 'bg-emerald-100 text-emerald-800' :
                              repuesto.cantidad > 5 ? 'bg-slate-100 text-slate-800' :
                              repuesto.cantidad > 0 ? 'bg-slate-100 text-slate-800' :
                              'bg-slate-200 text-slate-800'
                            }`}>
                              {repuesto.cantidad > 0 ? 'Disponible' : 'Sin Stock'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => handleDelete(repuesto.id)}
                              className="text-slate-600 hover:text-slate-800 p-1"
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
                <Package size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500 mb-4">
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
                    className="text-slate-600 hover:underline flex items-center gap-2 mx-auto"
                  >
                    <RefreshCw size={16} />
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Observaciones del recuento */}
        {recuentoIniciado && (
          <div className="border-t bg-slate-50 p-6">
            <div className="max-w-2xl">
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Observaciones del recuento
              </label>
              <textarea
                value={observacionesRecuento}
                onChange={(e) => setObservacionesRecuento(e.target.value)}
                placeholder="Comentarios sobre el recuento, repuestos dañados, faltantes, etc..."
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-600"
                rows="3"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepuestosSection;