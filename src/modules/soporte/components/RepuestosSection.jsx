import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Trash2, Save, RefreshCw, Search, Package, CheckCircle, AlertCircle, Layers, Calculator, AlertTriangle, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import Tarjeta from '../../../shared/components/layout/Tarjeta';

// Servicio para Repuestos
const repuestosService = {
  async getAll() {
    console.log('🔧 Obteniendo repuestos...');
    
    const { data, error } = await supabase
      .from('repuestos')
      .select('*')
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
        nombre_producto: repuesto.item,
        descripcion: repuesto.descripcion || '',
        categoria: repuesto.categoria,
        precio_compra_usd: parseFloat(repuesto.precio_compra) || 0,
        precio_venta_usd: parseFloat(repuesto.precio_venta) || 0,
        cantidad_la_plata: parseInt(repuesto.cantidad_la_plata) || 0,
        cantidad_mitre: parseInt(repuesto.cantidad_mitre) || 0,
        garantia: repuesto.garantia || '',
        observaciones: repuesto.observaciones || ''
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
  const [sucursalRecuento, setSucursalRecuento] = useState('');
  const [stockContado, setStockContado] = useState({});
  const [observacionesRecuento, setObservacionesRecuento] = useState('');
  const [mostrarSoloDiferencias, setMostrarSoloDiferencias] = useState(false);
  const [mostrarModalSucursal, setMostrarModalSucursal] = useState(false);

  // Estados para historial
  const [recuentosAnteriores, setRecuentosAnteriores] = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(true);
  const [recuentoExpandido, setRecuentoExpandido] = useState(null);
  const [aplicarAjustes, setAplicarAjustes] = useState(false);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    item: '',
    descripcion: '',
    precio_compra: '',
    cantidad_la_plata: '',
    cantidad_mitre: '',
    precio_venta: '',
    categoria: '',
    garantia: '',
    observaciones: ''
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
    fetchRecuentosAnteriores();
  }, []);

  const fetchRecuentosAnteriores = async () => {
    try {
      const { data, error } = await supabase
        .from('recuentos_repuestos')
        .select('*')
        .order('id', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecuentosAnteriores(data || []);
    } catch (err) {
      console.error('Error cargando recuentos anteriores:', err);
    }
  };

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
    // Validar que al menos una cantidad sea válida
    const cantidadLaPlata = parseInt(formData.cantidad_la_plata) || 0;
    const cantidadMitre = parseInt(formData.cantidad_mitre) || 0;
    
    if (cantidadLaPlata < 0 || cantidadMitre < 0) {
      alert('Las cantidades no pueden ser negativas');
      return;
    }
    
    if (cantidadLaPlata === 0 && cantidadMitre === 0) {
      alert('Debe ingresar al menos una cantidad mayor a 0 para alguna sucursal');
      return;
    }

    try {
      await addRepuesto(formData);
      
      // Limpiar formulario
      setFormData({
        item: '',
        descripcion: '',
        precio_compra: '',
        cantidad_la_plata: '',
        cantidad_mitre: '',
        precio_venta: '',
        categoria: '',
        garantia: '',
        observaciones: ''
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
    setMostrarModalSucursal(true);
  };

  const confirmarInicioRecuento = (sucursal) => {
    setSucursalRecuento(sucursal);
    setRecuentoIniciado(true);
    setStockContado({});
    setObservacionesRecuento('');
    setMostrarSoloDiferencias(false);
    setMostrarModalSucursal(false);
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
      // Obtener stock de la sucursal específica
      const stockSistema = sucursalRecuento === 'la_plata'
        ? (repuesto.cantidad_la_plata || 0)
        : (repuesto.cantidad_mitre || 0);
      const stockReal = stockContado[repuesto.id];

      if (stockReal !== undefined) {
        repuestosContados.push({
          id: repuesto.id,
          item: repuesto.nombre_producto,
          categoria: repuesto.categoria,
          stockSistema,
          stockReal,
          sucursal: sucursalRecuento,
          precio_compra_usd: repuesto.precio_compra_usd || 0
        });

        if (stockReal !== stockSistema) {
          diferencias.push({
            id: repuesto.id,
            item: repuesto.nombre_producto,
            categoria: repuesto.categoria,
            stockSistema,
            stockReal,
            diferencia: stockReal - stockSistema,
            sucursal: sucursalRecuento,
            precio_compra_usd: repuesto.precio_compra_usd || 0
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
      // Obtener fecha y timestamp locales
      const ahora = new Date();

      // Fecha en formato YYYY-MM-DD (zona horaria local)
      const fechaLocal = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;

      // Timestamp completo en ISO format (con zona horaria local)
      const offset = ahora.getTimezoneOffset();
      const localTime = new Date(ahora.getTime() - (offset * 60 * 1000));
      const timestampLocal = localTime.toISOString();

      // Guardar recuento en la tabla de recuentos
      const { error: recuentoError } = await supabase
        .from('recuentos_repuestos')
        .insert([{
          fecha_recuento: fechaLocal,
          timestamp_recuento: timestampLocal,
          sucursal: sucursalRecuento,
          tipo_recuento: repuestosContados.length === repuestos.length ? 'completo' : 'parcial',
          repuestos_contados: JSON.stringify(repuestosContados),
          diferencias_encontradas: JSON.stringify(diferencias),
          observaciones: observacionesRecuento,
          usuario_recuento: 'admin',
          estado: diferencias.length > 0 ? 'con_diferencias' : 'sin_diferencias'
        }]);

      if (recuentoError) throw recuentoError;

      if (diferencias.length === 0) {
        alert('✅ Recuento finalizado sin diferencias. Reporte guardado correctamente.');
      } else {
        // Si se marcó aplicar ajustes, aplicarlos
        if (aplicarAjustes) {
          // Aplicar ajustes al stock de la sucursal específica
          for (const ajuste of diferencias) {
            const updateData = {
              updated_at: new Date().toISOString()
            };

            // Actualizar solo la sucursal correspondiente
            if (sucursalRecuento === 'la_plata') {
              updateData.cantidad_la_plata = ajuste.stockReal;
            } else {
              updateData.cantidad_mitre = ajuste.stockReal;
            }

            const { error: ajusteError } = await supabase
              .from('repuestos')
              .update(updateData)
              .eq('id', ajuste.id);

            if (ajusteError) throw ajusteError;
          }

          alert('✅ Recuento guardado y ajustes aplicados al sistema');
          fetchRepuestos(); // Refrescar datos
        } else {
          alert(
            `✅ Recuento finalizado y guardado.\n\n` +
            `⚠️ Se encontraron ${diferencias.length} diferencias que quedan registradas en el reporte.`
          );
        }
      }

      // Actualizar historial
      fetchRecuentosAnteriores();

      // Reiniciar formulario
      setRecuentoIniciado(false);
      setSucursalRecuento('');
      setStockContado({});
      setObservacionesRecuento('');
      setMostrarSoloDiferencias(false);
      setAplicarAjustes(false);

    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  // Filtrar repuestos
  const repuestosFiltrados = repuestos.filter(repuesto => {
    const cumpleFiltro = filtro === '' || 
      repuesto.nombre_producto?.toLowerCase().includes(filtro.toLowerCase()) ||
      repuesto.categoria?.toLowerCase().includes(filtro.toLowerCase());
    
    const cumpleCategoria = categoriaFiltro === 'todas' || repuesto.categoria === categoriaFiltro;
    
    // Filtro para mostrar solo diferencias (cuando está en modo recuento)
    if (mostrarSoloDiferencias && recuentoIniciado) {
      const stockSistema = sucursalRecuento === 'la_plata' 
        ? (repuesto.cantidad_la_plata || 0)
        : (repuesto.cantidad_mitre || 0);
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
              valor={repuestos.filter(r => (r.cantidad_la_plata || 0) + (r.cantidad_mitre || 0) > 0).length}
            />

            {/* Tarjeta de La Plata */}
            <Tarjeta
              icon={Layers}
              titulo="Stock La Plata"
              valor={repuestos.reduce((acc, r) => acc + (r.cantidad_la_plata || 0), 0)}
            />

            {/* Tarjeta de Mitre */}
            <Tarjeta
              icon={Layers}
              titulo="Stock Mitre"
              valor={repuestos.reduce((acc, r) => acc + (r.cantidad_mitre || 0), 0)}
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
                  <span className="font-medium text-slate-800">Recuento en proceso - Sucursal {sucursalRecuento === 'la_plata' ? 'La Plata' : 'Mitre'}</span>
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
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1 - Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  Descripción
                </label>
                <input
                  type="text"
                  value={formData.descripcion}
                  onChange={(e) => handleInputChange('descripcion', e.target.value)}
                  placeholder="Descripción detallada"
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* Row 2 - Prices */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  Cantidad La Plata
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.cantidad_la_plata}
                  onChange={(e) => handleInputChange('cantidad_la_plata', e.target.value)}
                  placeholder="0"
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <p className="text-xs text-slate-500 mt-1">Stock sucursal La Plata</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  Cantidad Mitre
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.cantidad_mitre}
                  onChange={(e) => handleInputChange('cantidad_mitre', e.target.value)}
                  placeholder="0"
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <p className="text-xs text-slate-500 mt-1">Stock sucursal Mitre</p>
              </div>
            </div>

            {/* Row 3 - Additional Information and Submit Button */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  Garantía
                </label>
                <input
                  type="text"
                  value={formData.garantia}
                  onChange={(e) => handleInputChange('garantia', e.target.value)}
                  placeholder="ej: 12 meses"
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  Observaciones
                </label>
                <input
                  type="text"
                  value={formData.observaciones}
                  onChange={(e) => handleInputChange('observaciones', e.target.value)}
                  placeholder="Observaciones adicionales"
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div className="flex items-end justify-end">
                <button
                  type="submit"
                  className="bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700 transition-colors flex items-center gap-2 font-medium"
                >
                  <Save size={16} />
                  Agregar Repuesto
                </button>
              </div>
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
                      <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase">La Plata</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase">Mitre</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase">Total</th>
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
                      const margen = (repuesto.precio_venta_usd || 0) - (repuesto.precio_compra_usd || 0);
                      const porcentajeMargen = repuesto.precio_compra_usd > 0 
                        ? ((margen / repuesto.precio_compra_usd) * 100).toFixed(1)
                        : 0;
                      
                      // Variables para recuento
                      const stockLaPlata = repuesto.cantidad_la_plata || 0;
                      const stockMitre = repuesto.cantidad_mitre || 0;
                      const stockTotalSistema = stockLaPlata + stockMitre;
                      
                      // Para el recuento, usar solo la sucursal seleccionada
                      const stockSistemaRecuento = recuentoIniciado 
                        ? (sucursalRecuento === 'la_plata' ? stockLaPlata : stockMitre)
                        : stockTotalSistema;
                      const stockReal = stockContado[repuesto.id];
                      const diferencia = stockReal !== undefined ? stockReal - stockSistemaRecuento : null;
                      const contado = stockReal !== undefined;
                      
                      return (
                        <tr key={repuesto.id} className={`hover:bg-slate-50 ${
                          recuentoIniciado && diferencia !== null && diferencia !== 0 ? 'bg-slate-100' : 
                          recuentoIniciado && contado ? 'bg-emerald-50' : ''
                        }`}>
                          <td className="px-4 py-3 text-sm text-slate-900 font-medium max-w-xs">
                            <div className="truncate" title={repuesto.nombre_producto}>
                              {repuesto.nombre_producto}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-medium">
                              {repuesto.categoria}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900">
                            ${repuesto.precio_compra_usd?.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900 font-semibold">
                            ${repuesto.precio_venta_usd?.toFixed(2)}
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
                              stockLaPlata > 5 ? 'bg-emerald-100 text-emerald-800' :
                              stockLaPlata > 0 ? 'bg-slate-100 text-slate-800' :
                              'bg-slate-200 text-slate-800'
                            }`}>
                              {stockLaPlata}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              stockMitre > 5 ? 'bg-emerald-100 text-emerald-800' :
                              stockMitre > 0 ? 'bg-slate-100 text-slate-800' :
                              'bg-slate-200 text-slate-800'
                            }`}>
                              {stockMitre}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900 text-center font-semibold">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              stockTotalSistema > 10 ? 'bg-emerald-100 text-emerald-800' :
                              stockTotalSistema > 5 ? 'bg-slate-100 text-slate-800' :
                              stockTotalSistema > 0 ? 'bg-slate-100 text-slate-800' :
                              'bg-slate-200 text-slate-800'
                            }`}>
                              {stockTotalSistema}
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
                              stockTotalSistema > 10 ? 'bg-emerald-100 text-emerald-800' :
                              stockTotalSistema > 5 ? 'bg-slate-100 text-slate-800' :
                              stockTotalSistema > 0 ? 'bg-slate-100 text-slate-800' :
                              'bg-slate-200 text-slate-800'
                            }`}>
                              {stockTotalSistema > 0 ? 'Disponible' : 'Sin Stock'}
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
            <div className="max-w-2xl space-y-4">
              <div>
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

              {diferencias.length > 0 && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="aplicarAjustes"
                    checked={aplicarAjustes}
                    onChange={(e) => setAplicarAjustes(e.target.checked)}
                    className="rounded border-slate-200"
                  />
                  <label htmlFor="aplicarAjustes" className="text-sm text-slate-800 cursor-pointer">
                    Aplicar ajustes al stock automáticamente al finalizar
                  </label>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Modal de selección de sucursal */}
        {mostrarModalSucursal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded border border-slate-200 max-w-md w-full m-4">
              <div className="p-6 bg-slate-800 text-white">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Calculator size={24} />
                  Seleccionar Sucursal para Recuento
                </h3>
              </div>
              
              <div className="p-6">
                <p className="text-slate-600 mb-6">
                  Seleccione la sucursal en la que realizará el recuento de stock:
                </p>
                
                <div className="space-y-4">
                  <button
                    onClick={() => confirmarInicioRecuento('la_plata')}
                    className="w-full p-4 border-2 border-slate-200 rounded hover:border-emerald-600 hover:bg-emerald-50 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-800">Sucursal La Plata</h4>
                        <p className="text-sm text-slate-600">
                          Stock actual: {repuestos.reduce((acc, r) => acc + (r.cantidad_la_plata || 0), 0)} unidades
                        </p>
                      </div>
                      <div className="text-emerald-600">
                        →
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => confirmarInicioRecuento('mitre')}
                    className="w-full p-4 border-2 border-slate-200 rounded hover:border-emerald-600 hover:bg-emerald-50 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-800">Sucursal Mitre</h4>
                        <p className="text-sm text-slate-600">
                          Stock actual: {repuestos.reduce((acc, r) => acc + (r.cantidad_mitre || 0), 0)} unidades
                        </p>
                      </div>
                      <div className="text-emerald-600">
                        →
                      </div>
                    </div>
                  </button>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setMostrarModalSucursal(false)}
                    className="flex-1 bg-slate-600 text-white px-4 py-2 rounded font-medium hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Historial de Recuentos */}
      {!recuentoIniciado && (
        <div className="bg-white rounded border border-slate-200 mt-4">
          <div className="p-6 bg-slate-800 text-white cursor-pointer" onClick={() => setMostrarHistorial(!mostrarHistorial)}>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Eye className="w-6 h-6" />
                <div>
                  <h3 className="text-xl font-semibold">Historial de Recuentos</h3>
                  <p className="text-slate-300 mt-1">Ver recuentos anteriores y sus diferencias</p>
                </div>
              </div>
              {mostrarHistorial ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </div>
          </div>

          {mostrarHistorial && (
            <div className="p-6">
              {recuentosAnteriores.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No hay recuentos registrados
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Fecha</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Sucursal</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Tipo</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Repuestos Contados</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Estado</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {recuentosAnteriores.map((recuento, index) => {
                        const diferencias = JSON.parse(recuento.diferencias_encontradas || '[]');
                        const productosContados = JSON.parse(recuento.repuestos_contados || '[]');
                        const expandido = recuentoExpandido === recuento.id;

                        return (
                          <React.Fragment key={recuento.id}>
                            <tr className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="py-3 px-4 text-sm text-slate-800">
                                {new Date(recuento.fecha_recuento).toLocaleDateString('es-AR')}
                              </td>
                              <td className="text-center py-3 px-4">
                                <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded text-xs capitalize">
                                  {recuento.sucursal === 'la_plata' ? 'La Plata' : 'Mitre'}
                                </span>
                              </td>
                              <td className="text-center py-3 px-4">
                                <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded text-xs capitalize">
                                  {recuento.tipo_recuento}
                                </span>
                              </td>
                              <td className="text-center py-3 px-4 text-sm text-slate-800">
                                {productosContados.length}
                              </td>
                              <td className="text-center py-3 px-4">
                                {diferencias.length === 0 ? (
                                  <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-medium">
                                    Sin diferencias
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded text-xs font-medium">
                                    {diferencias.length} diferencias
                                  </span>
                                )}
                              </td>
                              <td className="text-center py-3 px-4">
                                <button
                                  onClick={() => setRecuentoExpandido(expandido ? null : recuento.id)}
                                  className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mx-auto"
                                >
                                  {expandido ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                  {expandido ? 'Ocultar' : 'Ver detalles'}
                                </button>
                              </td>
                            </tr>

                            {expandido && (
                              <tr>
                                <td colSpan="6" className="p-6 bg-slate-50">
                                  <div className="space-y-4">
                                    {recuento.observaciones && (
                                      <div className="bg-white border border-slate-200 rounded p-4">
                                        <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                                          <Eye size={18} />
                                          Descripción del recuento:
                                        </h4>
                                        <p className="text-sm text-slate-700">{recuento.observaciones}</p>
                                      </div>
                                    )}

                                    {diferencias.length > 0 && (
                                      <div>
                                        <h4 className="font-semibold text-slate-800 mb-3">Diferencias encontradas:</h4>
                                        <table className="w-full">
                                          <thead className="bg-slate-700 text-white">
                                            <tr>
                                              <th className="px-3 py-2 text-left text-xs">Repuesto</th>
                                              <th className="px-3 py-2 text-left text-xs">Categoría</th>
                                              <th className="px-3 py-2 text-center text-xs">Precio Compra (USD)</th>
                                              <th className="px-3 py-2 text-center text-xs">Stock Sistema</th>
                                              <th className="px-3 py-2 text-center text-xs">Stock Real</th>
                                              <th className="px-3 py-2 text-center text-xs">Diferencia</th>
                                              <th className="px-3 py-2 text-center text-xs">Valor USD</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-200">
                                            {diferencias.map((dif, idx) => {
                                              const valorDiferencia = (dif.precio_compra_usd || 0) * dif.diferencia;
                                              return (
                                                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                                  <td className="px-3 py-2 text-sm text-slate-800">{dif.item}</td>
                                                  <td className="px-3 py-2 text-sm text-slate-600">{dif.categoria}</td>
                                                  <td className="px-3 py-2 text-center text-sm text-slate-600">
                                                    U${(dif.precio_compra_usd || 0).toFixed(2)}
                                                  </td>
                                                  <td className="px-3 py-2 text-center text-sm text-slate-800">{dif.stockSistema}</td>
                                                  <td className="px-3 py-2 text-center text-sm text-slate-800">{dif.stockReal}</td>
                                                  <td className="px-3 py-2 text-center text-sm">
                                                    <span className={`font-medium ${dif.diferencia > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                                                      {dif.diferencia > 0 ? '+' : ''}{dif.diferencia}
                                                    </span>
                                                  </td>
                                                  <td className="px-3 py-2 text-center text-sm">
                                                    <span className={`font-semibold ${valorDiferencia > 0 ? 'text-emerald-600' : valorDiferencia < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                                                      {valorDiferencia > 0 ? '+' : ''}U${valorDiferencia.toFixed(2)}
                                                    </span>
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                          <tfoot className="bg-slate-800 text-white">
                                            <tr>
                                              <td colSpan="6" className="px-3 py-3 text-sm font-semibold text-right">
                                                TOTAL DIFERENCIA EN USD:
                                              </td>
                                              <td className="px-3 py-3 text-center text-sm font-semibold">
                                                {(() => {
                                                  const totalUSD = diferencias.reduce((sum, dif) => {
                                                    return sum + ((dif.precio_compra_usd || 0) * dif.diferencia);
                                                  }, 0);
                                                  return (
                                                    <span className={totalUSD > 0 ? 'text-emerald-300' : totalUSD < 0 ? 'text-red-300' : ''}>
                                                      {totalUSD > 0 ? '+' : ''}U${totalUSD.toFixed(2)}
                                                    </span>
                                                  );
                                                })()}
                                              </td>
                                            </tr>
                                          </tfoot>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RepuestosSection;