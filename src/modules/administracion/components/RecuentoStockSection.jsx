import React, { useState, useEffect } from 'react';
import { Package, Search, Save, AlertTriangle, CheckCircle, RefreshCw, Eye, FileText, Monitor, Smartphone, Box, Calculator } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

// Servicio para Recuento de Stock
const recuentoStockService = {
  async getInventarioCompleto() {
    console.log('📦 Obteniendo inventario completo...');

    const [computadoras, celulares, otros] = await Promise.all([
      supabase.from('inventario').select('*').eq('disponible', true),
      supabase.from('celulares').select('*').eq('disponible', true),
      supabase.from('otros').select('*').eq('disponible', true)
    ]);

    if (computadoras.error) throw computadoras.error;
    if (celulares.error) throw celulares.error;
    if (otros.error) throw otros.error;

    const inventario = [
      ...computadoras.data.map(item => ({ ...item, tipo: 'computadora' })),
      ...celulares.data.map(item => ({ ...item, tipo: 'celular' })),
      ...otros.data.map(item => ({ ...item, tipo: 'otro' }))
    ];

    console.log(`✅ ${inventario.length} productos obtenidos`);
    return inventario;
  },

  async guardarRecuento(recuentoData) {
    console.log('💾 Guardando recuento de stock...');

    const { data, error } = await supabase
      .from('recuentos_stock')
      .insert([{
        fecha_recuento: recuentoData.fecha,
        tipo_recuento: recuentoData.tipo, // 'completo' | 'parcial'
        productos_contados: recuentoData.productosContados,
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
      .from('recuentos_stock')
      .select('*')
      .order('fecha_recuento', { ascending: false })
      .limit(limite);

    if (error) throw error;
    return data;
  },

  async actualizarStockSistema(ajustes) {
    console.log('🔄 Aplicando ajustes de stock...');

    for (const ajuste of ajustes) {
      const tabla = ajuste.tipo === 'computadora' ? 'inventario' : 
                   ajuste.tipo === 'celular' ? 'celulares' : 'otros';

      if (ajuste.tipo === 'otro') {
        // Para productos "otros", actualizar cantidad
        const { error } = await supabase
          .from(tabla)
          .update({ cantidad: ajuste.stockReal })
          .eq('id', ajuste.id);
        
        if (error) throw error;
      } else {
        // Para computadoras y celulares, cambiar disponibilidad
        const { error } = await supabase
          .from(tabla)
          .update({ disponible: ajuste.stockReal > 0 })
          .eq('id', ajuste.id);
        
        if (error) throw error;
      }
    }

    console.log('✅ Ajustes aplicados al sistema');
    return true;
  }
};

// Hook personalizado
function useRecuentoStock() {
  const [inventario, setInventario] = useState([]);
  const [recuentosAnteriores, setRecuentosAnteriores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInventario = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await recuentoStockService.getInventarioCompleto();
      setInventario(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecuentosAnteriores = async () => {
    try {
      const data = await recuentoStockService.getRecuentosAnteriores();
      setRecuentosAnteriores(data);
    } catch (err) {
      console.error('Error cargando recuentos anteriores:', err);
    }
  };

  const guardarRecuento = async (recuentoData) => {
    try {
      setError(null);
      const resultado = await recuentoStockService.guardarRecuento(recuentoData);
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
      await recuentoStockService.actualizarStockSistema(ajustes);
      fetchInventario(); // Refrescar inventario
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    inventario,
    recuentosAnteriores,
    loading,
    error,
    fetchInventario,
    fetchRecuentosAnteriores,
    guardarRecuento,
    aplicarAjustes
  };
}

// Componente principal
const RecuentoStockSection = () => {
  const {
    inventario,
    recuentosAnteriores,
    loading,
    error,
    fetchInventario,
    fetchRecuentosAnteriores,
    guardarRecuento,
    aplicarAjustes
  } = useRecuentoStock();

  const [filtro, setFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('todos');
  const [stockContado, setStockContado] = useState({});
  const [observaciones, setObservaciones] = useState('');
  const [mostrarSoloDiferencias, setMostrarSoloDiferencias] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [recuentoIniciado, setRecuentoIniciado] = useState(false);

  useEffect(() => {
    console.log('🚀 Iniciando recuento de stock...');
    fetchInventario();
    fetchRecuentosAnteriores();
  }, []);

  const iniciarRecuento = () => {
    setRecuentoIniciado(true);
    setStockContado({});
    setObservaciones('');
    setMostrarSoloDiferencias(false);
  };

  const actualizarStockContado = (productoId, cantidad) => {
    setStockContado(prev => ({
      ...prev,
      [productoId]: parseInt(cantidad) || 0
    }));
  };

  const inventarioFiltrado = inventario.filter(producto => {
    const cumpleTipo = tipoFiltro === 'todos' || producto.tipo === tipoFiltro;
    const cumpleFiltro = filtro === '' || 
      producto.modelo?.toLowerCase().includes(filtro.toLowerCase()) ||
      producto.descripcion_producto?.toLowerCase().includes(filtro.toLowerCase()) ||
      producto.serial?.toLowerCase().includes(filtro.toLowerCase());
    
    if (mostrarSoloDiferencias) {
      const stockSistema = producto.tipo === 'otro' ? producto.cantidad : (producto.disponible ? 1 : 0);
      const stockReal = stockContado[producto.id] || 0;
      return cumpleTipo && cumpleFiltro && (stockReal !== stockSistema);
    }
    
    return cumpleTipo && cumpleFiltro;
  });

  const calcularDiferencias = () => {
    const diferencias = [];
    const productosContados = [];

    inventario.forEach(producto => {
      const stockSistema = producto.tipo === 'otro' ? producto.cantidad : (producto.disponible ? 1 : 0);
      const stockReal = stockContado[producto.id];

      if (stockReal !== undefined) {
        productosContados.push({
          id: producto.id,
          tipo: producto.tipo,
          descripcion: producto.modelo || producto.descripcion_producto,
          serial: producto.serial || `${producto.tipo}-${producto.id}`,
          stockSistema,
          stockReal
        });

        if (stockReal !== stockSistema) {
          diferencias.push({
            id: producto.id,
            tipo: producto.tipo,
            descripcion: producto.modelo || producto.descripcion_producto,
            serial: producto.serial || `${producto.tipo}-${producto.id}`,
            stockSistema,
            stockReal,
            diferencia: stockReal - stockSistema
          });
        }
      }
    });

    return { diferencias, productosContados };
  };

  const finalizarRecuento = async () => {
    const { diferencias, productosContados } = calcularDiferencias();

    if (productosContados.length === 0) {
      alert('No se han contado productos. Debe contar al menos un producto.');
      return;
    }

    try {
      const recuentoData = {
        fecha: new Date().toISOString().split('T')[0],
        tipo: productosContados.length === inventario.length ? 'completo' : 'parcial',
        productosContados: JSON.stringify(productosContados),
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

  const getIconoProducto = (tipo) => {
    switch (tipo) {
      case 'computadora': return <Monitor className="w-5 h-5 text-gray-600" />;
      case 'celular': return <Smartphone className="w-5 h-5 text-gray-600" />;
      case 'otro': return <Box className="w-5 h-5 text-purple-600" />;
      default: return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  const { diferencias, productosContados } = calcularDiferencias();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-3 text-gray-600">Cargando inventario...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-black text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Package className="w-8 h-8" />
                Recuento de Stock
              </h2>
              <p className="text-gray-300 mt-2">Verificación física del inventario</p>
            </div>
            <div className="flex items-center space-x-3">
              {!recuentoIniciado ? (
                <button
                  onClick={iniciarRecuento}
                  className="bg-white text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-medium transition-colors"
                >
                  <Calculator size={18} />
                  Iniciar Recuento
                </button>
              ) : (
                <button
                  onClick={finalizarRecuento}
                  className="bg-white text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-medium transition-colors"
                >
                  <Save size={18} />
                  Finalizar Recuento
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Estado del recuento */}
        {recuentoIniciado && (
          <div className="bg-yellow-50 border-b border-yellow-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-yellow-800">Recuento en proceso</span>
                </div>
                <div className="text-sm text-yellow-700">
                  Productos contados: {productosContados.length} / {inventario.length}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {diferencias.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <AlertTriangle size={16} className="text-red-600" />
                    <span className="text-sm text-red-600 font-medium">
                      {diferencias.length} diferencias encontradas
                    </span>
                  </div>
                )}
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={mostrarSoloDiferencias}
                    onChange={(e) => setMostrarSoloDiferencias(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span>Solo diferencias</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-gray-50 p-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar producto</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  placeholder="Modelo, descripción, serial..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de producto</label>
              <select
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="todos">Todos los tipos</option>
                <option value="computadora">Computadoras</option>
                <option value="celular">Celulares</option>
                <option value="otro">Otros</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado del recuento</label>
              <div className="text-sm py-2">
                <div className="text-gray-600">
                  Total productos: <span className="font-medium">{inventario.length}</span>
                </div>
                <div className="text-gray-600">
                  Mostrados: <span className="font-medium">{inventarioFiltrado.length}</span>
                </div>
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFiltro('');
                  setTipoFiltro('todos');
                  setMostrarSoloDiferencias(false);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Lista de productos */}
        <div className="p-6">
          {inventarioFiltrado.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-orange-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-blue-700">Producto</th>
                    <th className="text-center py-3 px-4 font-medium text-emerald-700">Tipo</th>
                    <th className="text-right py-3 px-4 font-medium text-orange-700">Stock Sistema</th>
                    <th className="text-center py-3 px-4 font-medium text-violet-700">Stock Real</th>
                    <th className="text-center py-3 px-4 font-medium text-orange-700">Diferencia</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {inventarioFiltrado.map((producto) => {
                    const stockSistema = producto.tipo === 'otro' ? producto.cantidad : (producto.disponible ? 1 : 0);
                    const stockReal = stockContado[producto.id];
                    const diferencia = stockReal !== undefined ? stockReal - stockSistema : null;
                    const contado = stockReal !== undefined;

                    return (
                      <tr key={`${producto.tipo}-${producto.id}`} className={`border-b border-gray-100 hover:bg-gray-50 ${
                        diferencia !== null && diferencia !== 0 ? 'bg-red-50' : 
                        contado ? 'bg-green-50' : ''
                      }`}>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900">
                              {producto.modelo || producto.descripcion_producto}
                            </div>
                            <div className="text-sm text-gray-500">
                              Serial: {producto.serial || `${producto.tipo}-${producto.id}`}
                            </div>
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          <div className="flex items-center justify-center">
                            {getIconoProducto(producto.tipo)}
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 font-medium">
                          {stockSistema}
                        </td>
                        <td className="text-center py-3 px-4">
                          {recuentoIniciado ? (
                            <input
                              type="number"
                              min="0"
                              max={producto.tipo === 'otro' ? "999" : "1"}
                              value={stockReal || ''}
                              onChange={(e) => actualizarStockContado(producto.id, e.target.value)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                              placeholder="0"
                            />
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="text-center py-3 px-4">
                          {diferencia !== null ? (
                            <span className={`font-medium ${
                              diferencia === 0 ? 'text-green-600' :
                              diferencia > 0 ? 'text-blue-600' : 'text-red-600'
                            }`}>
                              {diferencia > 0 ? '+' : ''}{diferencia}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="text-center py-3 px-4">
                          {!contado ? (
                            <span className="text-gray-400 text-sm">Pendiente</span>
                          ) : diferencia === 0 ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-red-600 mx-auto" />
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
              <Package size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No se encontraron productos con los filtros aplicados</p>
            </div>
          )}
        </div>

        {/* Observaciones */}
        {recuentoIniciado && (
          <div className="border-t bg-gray-50 p-6">
            <div className="max-w-2xl">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones del recuento
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Comentarios sobre el recuento, productos dañados, faltantes, etc..."
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                rows="3"
              />
            </div>
          </div>
        )}

        {/* Historial de recuentos */}
        <div className="border-t p-6">
          <button
            onClick={() => setMostrarHistorial(!mostrarHistorial)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <Eye size={16} />
            <span>Ver historial de recuentos ({recuentosAnteriores.length})</span>
          </button>

          {mostrarHistorial && recuentosAnteriores.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left py-2 px-3">Fecha</th>
                      <th className="text-center py-2 px-3">Tipo</th>
                      <th className="text-right py-2 px-3">Productos</th>
                      <th className="text-right py-2 px-3">Diferencias</th>
                      <th className="text-center py-2 px-3">Estado</th>
                      <th className="text-left py-2 px-3">Usuario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recuentosAnteriores.map((recuento, index) => {
                      const productos = JSON.parse(recuento.productos_contados || '[]');
                      const diferencias = JSON.parse(recuento.diferencias_encontradas || '[]');
                      
                      return (
                        <tr key={index} className="border-b border-gray-200">
                          <td className="py-2 px-3">{formatearFecha(recuento.fecha_recuento)}</td>
                          <td className="text-center py-2 px-3 capitalize">{recuento.tipo_recuento}</td>
                          <td className="text-right py-2 px-3">{productos.length}</td>
                          <td className="text-right py-2 px-3">{diferencias.length}</td>
                          <td className="text-center py-2 px-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              recuento.estado === 'sin_diferencias' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
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
          <div className="bg-red-50 border-l-4 border-red-400 p-4 m-6">
            <span className="text-red-800">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecuentoStockSection;