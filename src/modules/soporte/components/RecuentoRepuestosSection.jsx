import React, { useState, useEffect } from 'react';
import { Wrench, Search, Save, AlertTriangle, CheckCircle, RefreshCw, Eye, FileText, Calculator } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

// Servicio para Recuento de Repuestos
const recuentoRepuestosService = {
  async getRepuestosDisponibles() {
    console.log('🔧 Obteniendo repuestos disponibles...');

    const { data, error } = await supabase
      .from('repuestos')
      .select('*')
      .eq('disponible', true)
      .order('categoria', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo repuestos:', error);
      throw error;
    }

    console.log(`✅ ${data.length} repuestos obtenidos`);
    return data;
  },

  async guardarRecuento(recuentoData) {
    console.log('💾 Guardando recuento de repuestos...');

    const { data, error } = await supabase
      .from('recuentos_repuestos')
      .insert([{
        fecha_recuento: recuentoData.fecha,
        tipo_recuento: recuentoData.tipo, // 'completo' | 'parcial' | 'por_categoria'
        repuestos_contados: recuentoData.repuestosContados,
        diferencias_encontradas: recuentoData.diferencias,
        observaciones: recuentoData.observaciones,
        usuario_recuento: recuentoData.usuario || 'admin',
        estado: recuentoData.diferencias.length > 0 ? 'con_diferencias' : 'sin_diferencias'
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  async getRecuentosAnteriores(limite = 10) {
    console.log('📊 Obteniendo recuentos anteriores...');

    const { data, error } = await supabase
      .from('recuentos_repuestos')
      .select('*')
      .order('fecha_recuento', { ascending: false })
      .limit(limite);

    if (error) throw error;
    return data;
  },

  async actualizarStockRepuesto(ajustes) {
    console.log('🔄 Aplicando ajustes de stock de repuestos...');

    for (const ajuste of ajustes) {
      const { error } = await supabase
        .from('repuestos')
        .update({ 
          cantidad: ajuste.stockReal,
          disponible: ajuste.stockReal > 0 
        })
        .eq('id', ajuste.id);
      
      if (error) throw error;
    }

    console.log('✅ Ajustes aplicados al sistema');
    return true;
  }
};

// Hook personalizado
function useRecuentoRepuestos() {
  const [repuestos, setRepuestos] = useState([]);
  const [recuentosAnteriores, setRecuentosAnteriores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRepuestos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await recuentoRepuestosService.getRepuestosDisponibles();
      setRepuestos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecuentosAnteriores = async () => {
    try {
      const data = await recuentoRepuestosService.getRecuentosAnteriores();
      setRecuentosAnteriores(data);
    } catch (err) {
      console.error('Error cargando recuentos anteriores:', err);
    }
  };

  const guardarRecuento = async (recuentoData) => {
    try {
      setError(null);
      const resultado = await recuentoRepuestosService.guardarRecuento(recuentoData);
      fetchRecuentosAnteriores(); // Actualizar historial
      return resultado;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const aplicarAjustes = async (ajustes) => {
    try {
      setError(null);
      await recuentoRepuestosService.actualizarStockRepuesto(ajustes);
      fetchRepuestos(); // Refrescar inventario
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    repuestos,
    recuentosAnteriores,
    loading,
    error,
    fetchRepuestos,
    fetchRecuentosAnteriores,
    guardarRecuento,
    aplicarAjustes
  };
}

// Componente principal
const RecuentoRepuestosSection = () => {
  const {
    repuestos,
    recuentosAnteriores,
    loading,
    error,
    fetchRepuestos,
    fetchRecuentosAnteriores,
    guardarRecuento,
    aplicarAjustes
  } = useRecuentoRepuestos();

  const [filtro, setFiltro] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [stockContado, setStockContado] = useState({});
  const [observaciones, setObservaciones] = useState('');
  const [mostrarSoloDiferencias, setMostrarSoloDiferencias] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [recuentoIniciado, setRecuentoIniciado] = useState(false);

  useEffect(() => {
    console.log('🚀 Iniciando recuento de repuestos...');
    fetchRepuestos();
    fetchRecuentosAnteriores();
  }, []);

  const iniciarRecuento = () => {
    setRecuentoIniciado(true);
    setStockContado({});
    setObservaciones('');
    setMostrarSoloDiferencias(false);
  };

  const actualizarStockContado = (repuestoId, cantidad) => {
    setStockContado(prev => ({
      ...prev,
      [repuestoId]: parseInt(cantidad) || 0
    }));
  };

  const repuestosFiltrados = repuestos.filter(repuesto => {
    const cumpleCategoria = categoriaFiltro === 'todas' || repuesto.categoria === categoriaFiltro;
    const cumpleFiltro = filtro === '' || 
      repuesto.item?.toLowerCase().includes(filtro.toLowerCase()) ||
      repuesto.categoria?.toLowerCase().includes(filtro.toLowerCase());
    
    if (mostrarSoloDiferencias) {
      const stockSistema = repuesto.cantidad || 0;
      const stockReal = stockContado[repuesto.id] || 0;
      return cumpleCategoria && cumpleFiltro && (stockReal !== stockSistema);
    }
    
    return cumpleCategoria && cumpleFiltro;
  });

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
      const recuentoData = {
        fecha: new Date().toISOString().split('T')[0],
        tipo: repuestosContados.length === repuestos.length ? 'completo' : 'parcial',
        repuestosContados: JSON.stringify(repuestosContados),
        diferencias: JSON.stringify(diferencias),
        observaciones
      };

      await guardarRecuento(recuentoData);
      
      if (diferencias.length === 0) {
        alert('✅ Recuento finalizado sin diferencias');
      } else {
        const confirmar = confirm(
          `⚠️ Se encontraron ${diferencias.length} diferencias.\n\n` +
          '¿Desea aplicar los ajustes al sistema automáticamente?'
        );

        if (confirmar) {
          await aplicarAjustes(diferencias);
          alert('✅ Ajustes aplicados al sistema');
        }
      }

      // Reiniciar formulario
      setRecuentoIniciado(false);
      setStockContado({});
      setObservaciones('');
      setMostrarSoloDiferencias(false);

    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  // Obtener categorías únicas
  const categoriasExistentes = [...new Set(repuestos.map(r => r.categoria))].sort();

  const { diferencias, repuestosContados } = calcularDiferencias();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <span className="ml-3 text-slate-600">Cargando repuestos...</span>
      </div>
    );
  }

  return (
    <div className="">
      {/* Header obligatorio según estándares */}
      <div className="bg-white rounded border border-slate-200 mb-4">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Calculator className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-semibold">Recuento de Repuestos</h2>
                <p className="text-slate-300 mt-1">Verificación física del inventario de repuestos</p>
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

      <div className="bg-white rounded border border-slate-200 overflow-hidden">

        {/* Estado del recuento */}
        {recuentoIniciado && (
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
        )}

        {/* Filtros */}
        <div className="bg-slate-50 p-4 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-800 mb-1">Buscar repuesto</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  placeholder="Nombre del repuesto, categoría..."
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Categoría</label>
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-600"
              >
                <option value="todas">Todas las categorías</option>
                {categoriasExistentes.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Estado del recuento</label>
              <div className="text-sm py-2">
                <div className="text-slate-600">
                  Total repuestos: <span className="font-medium">{repuestos.length}</span>
                </div>
                <div className="text-slate-600">
                  Mostrados: <span className="font-medium">{repuestosFiltrados.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de repuestos */}
        <div className="p-6">
          {repuestosFiltrados.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border border-slate-200 rounded">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-white">Repuesto</th>
                    <th className="text-center py-3 px-4 font-medium text-white">Categoría</th>
                    <th className="text-right py-3 px-4 font-medium text-white">Stock Sistema</th>
                    <th className="text-center py-3 px-4 font-medium text-white">Stock Real</th>
                    <th className="text-center py-3 px-4 font-medium text-white">Diferencia</th>
                    <th className="text-center py-3 px-4 font-medium text-white">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {repuestosFiltrados.map((repuesto) => {
                    const stockSistema = repuesto.cantidad || 0;
                    const stockReal = stockContado[repuesto.id];
                    const diferencia = stockReal !== undefined ? stockReal - stockSistema : null;
                    const contado = stockReal !== undefined;

                    return (
                      <tr key={repuesto.id} className={`border-b border-slate-100 hover:bg-slate-50 ${
                        diferencia !== null && diferencia !== 0 ? 'bg-slate-100' : 
                        contado ? 'bg-emerald-50' : ''
                      }`}>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-slate-900">
                              {repuesto.item}
                            </div>
                            <div className="text-xs text-slate-500">
                              ID: {repuesto.id}
                            </div>
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-medium">
                            {repuesto.categoria}
                          </span>
                        </td>
                        <td className="text-right py-3 px-4 font-medium">
                          {stockSistema}
                        </td>
                        <td className="text-center py-3 px-4">
                          {recuentoIniciado ? (
                            <input
                              type="number"
                              min="0"
                              value={stockReal || ''}
                              onChange={(e) => actualizarStockContado(repuesto.id, e.target.value)}
                              className="w-20 px-2 py-1 border border-slate-200 rounded text-center text-sm focus:ring-2 focus:ring-emerald-600"
                              placeholder="0"
                            />
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="text-center py-3 px-4">
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
                        <td className="text-center py-3 px-4">
                          {!contado ? (
                            <span className="text-slate-400 text-sm">Pendiente</span>
                          ) : diferencia === 0 ? (
                            <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-slate-600 mx-auto" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Wrench size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No se encontraron repuestos con los filtros aplicados</p>
            </div>
          )}
        </div>

        {/* Observaciones */}
        {recuentoIniciado && (
          <div className="border-t bg-slate-50 p-6">
            <div className="max-w-2xl">
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Observaciones del recuento
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Comentarios sobre el recuento, repuestos dañados, faltantes, etc..."
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-600"
                rows="3"
              />
            </div>
          </div>
        )}

        {/* Historial de recuentos */}
        <div className="border-t p-6">
          <button
            onClick={() => setMostrarHistorial(!mostrarHistorial)}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
          >
            <Eye size={16} />
            <span>Ver historial de recuentos ({recuentosAnteriores.length})</span>
          </button>

          {mostrarHistorial && recuentosAnteriores.length > 0 && (
            <div className="bg-slate-50 rounded p-4 border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-slate-200 rounded">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="text-left py-2 px-3 text-white">Fecha</th>
                      <th className="text-center py-2 px-3 text-white">Tipo</th>
                      <th className="text-right py-2 px-3 text-white">Repuestos</th>
                      <th className="text-right py-2 px-3 text-white">Diferencias</th>
                      <th className="text-center py-2 px-3 text-white">Estado</th>
                      <th className="text-left py-2 px-3 text-white">Usuario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recuentosAnteriores.map((recuento, index) => {
                      const repuestosContados = JSON.parse(recuento.repuestos_contados || '[]');
                      const diferencias = JSON.parse(recuento.diferencias_encontradas || '[]');
                      
                      return (
                        <tr key={index} className="border-b border-slate-200">
                          <td className="py-2 px-3">{formatearFecha(recuento.fecha_recuento)}</td>
                          <td className="text-center py-2 px-3 capitalize">{recuento.tipo_recuento}</td>
                          <td className="text-right py-2 px-3">{repuestosContados.length}</td>
                          <td className="text-right py-2 px-3">{diferencias.length}</td>
                          <td className="text-center py-2 px-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              recuento.estado === 'sin_diferencias' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-slate-100 text-slate-800'
                            }`}>
                              {recuento.estado === 'sin_diferencias' ? 'OK' : 'Diferencias'}
                            </span>
                          </td>
                          <td className="py-2 px-3">{recuento.usuario_recuento}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-slate-50 border-l-4 border-slate-400 p-4 m-6">
            <span className="text-slate-800">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecuentoRepuestosSection;