import React, { useState, useEffect } from 'react';
import { Package, Search, Save, AlertTriangle, CheckCircle, RefreshCw, Eye, FileText, Monitor, Smartphone, Box, Calculator, ChevronDown, ChevronUp, Edit2, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import LoadingSpinner from '../../../shared/components/base/LoadingSpinner';

// Servicio para Recuento de Stock
const recuentoStockService = {
  async getInventarioCompleto(sucursal = null) {
    console.log('📦 Obteniendo inventario completo para sucursal:', sucursal || 'todas');

    // Helper para ordenar por nombre/modelo
    const sortByName = (a, b) => {
      const nameA = a.modelo || a.nombre_producto || a.descripcion || '';
      const nameB = b.modelo || b.nombre_producto || b.descripcion || '';
      return nameA.localeCompare(nameB);
    };

    let computadoras, celulares, otros;

    if (sucursal) {
      const sucursalNormalizada = sucursal.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_');

      console.log('🔍 Buscando productos para sucursal normalizada:', sucursalNormalizada);

      // ⭐ IMPORTANTE: Filtrar notebooks y celulares por columna 'sucursal'
      // Los productos "otros" no tienen columna sucursal, se filtran después
      [computadoras, celulares, otros] = await Promise.all([
        supabase.from('inventario').select('*').eq('sucursal', sucursalNormalizada),
        supabase.from('celulares').select('*').eq('sucursal', sucursalNormalizada),
        supabase.from('otros').select('*') // Todos los productos "otros" - se filtran por stock después
      ]);
    } else {
      [computadoras, celulares, otros] = await Promise.all([
        supabase.from('inventario').select('*'),
        supabase.from('celulares').select('*'),
        supabase.from('otros').select('*')
      ]);
    }

    if (computadoras.error) throw computadoras.error;
    if (celulares.error) throw celulares.error;
    if (otros.error) throw otros.error;

    console.log('📊 Productos obtenidos de BD - Notebooks:', computadoras.data.length, 'Celulares:', celulares.data.length, 'Otros:', otros.data.length);

    // Ordenar cada categoría alfabéticamente
    computadoras.data.sort(sortByName);
    celulares.data.sort(sortByName);
    otros.data.sort(sortByName);

    let inventario = [
      ...computadoras.data.map(item => ({ ...item, tipo: 'computadora' })),
      ...celulares.data.map(item => ({ ...item, tipo: 'celular' })),
      ...otros.data.map(item => ({ ...item, tipo: 'otro' }))
    ];

    // ⭐ FILTRADO CRÍTICO: Si hay sucursal seleccionada, filtrar estrictamente
    if (sucursal) {
      const sucursalNormalizada = sucursal.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_');

      inventario = inventario.filter(item => {
        // Para productos "otros": filtrar por stock en la sucursal
        if (item.tipo === 'otro') {
          const stockSucursal = sucursalNormalizada === 'la_plata' ? (item.cantidad_la_plata || 0) :
                                 sucursalNormalizada === 'mitre' ? (item.cantidad_mitre || 0) :
                                 0;
          return stockSucursal > 0;
        }

        // Para notebooks y celulares: verificar que tengan la sucursal correcta
        // (ya vienen filtrados de la DB, pero doble verificación por seguridad)
        if (item.sucursal) {
          const sucursalItem = item.sucursal.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_');
          return sucursalItem === sucursalNormalizada;
        }

        // Si no tiene campo sucursal, no incluir (para evitar productos huérfanos)
        console.warn('⚠️ Producto sin sucursal encontrado:', item.tipo, item.id);
        return false;
      });
    }

    console.log(`✅ ${inventario.length} productos filtrados para recuento - Notebooks: ${inventario.filter(i => i.tipo === 'computadora').length}, Celulares: ${inventario.filter(i => i.tipo === 'celular').length}, Otros: ${inventario.filter(i => i.tipo === 'otro').length}`);

    return inventario;
  },

  async guardarRecuento(recuentoData) {
    console.log('💾 Guardando recuento de stock...');

    const { data, error } = await supabase
      .from('recuentos_stock')
      .insert([{
        fecha_recuento: recuentoData.fecha,
        timestamp_recuento: recuentoData.timestamp,
        sucursal: recuentoData.sucursal,
        tipo_recuento: recuentoData.tipo, // 'completo' | 'parcial'
        productos_contados: recuentoData.productosContados,
        diferencias_encontradas: recuentoData.diferencias,
        observaciones: recuentoData.observaciones,
        usuario_recuento: recuentoData.usuario || 'admin',
        estado: JSON.parse(recuentoData.diferencias).length > 0 ? 'con_diferencias' : 'sin_diferencias'
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
      .order('id', { ascending: false })
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
        // Para productos "otros", actualizar cantidad por sucursal
        const sucursalNormalizada = ajuste.sucursal.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_');
        const campo = sucursalNormalizada === 'la_plata' ? 'cantidad_la_plata' : 'cantidad_mitre';
        const { error } = await supabase
          .from(tabla)
          .update({
            [campo]: ajuste.stockReal,
            updated_at: new Date().toISOString()
          })
          .eq('id', ajuste.id);

        if (error) throw error;
      } else {
        // Para computadoras y celulares, no cambiar disponibilidad
        // El recuento físico NO debe marcar productos como no disponibles
        // Solo registrar la diferencia en el JSON
        console.log(`⚠️ Diferencia detectada en ${tabla} ID ${ajuste.id}, pero no se modifica disponibilidad`);
      }
    }

    console.log('✅ Ajustes aplicados al sistema');
    return true;
  },

  async actualizarComentarioRecuento(recuentoId, nuevoComentario) {
    console.log('💬 Actualizando comentario del recuento...');

    const { data, error } = await supabase
      .from('recuentos_stock')
      .update({
        observaciones: nuevoComentario
      })
      .eq('id', recuentoId)
      .select();

    if (error) throw error;
    return data[0];
  }
};

// Hook personalizado
function useRecuentoStock() {
  const [inventario, setInventario] = useState([]);
  const [recuentosAnteriores, setRecuentosAnteriores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInventario = async (sucursal = null) => {
    try {
      setLoading(true);
      setError(null);
      const data = await recuentoStockService.getInventarioCompleto(sucursal);
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

  const actualizarComentario = async (recuentoId, nuevoComentario) => {
    try {
      setError(null);
      await recuentoStockService.actualizarComentarioRecuento(recuentoId, nuevoComentario);
      fetchRecuentosAnteriores(); // Refrescar historial
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
    aplicarAjustes,
    actualizarComentario
  };
}

// Componente principal
export const RecuentoStockSection = () => {
  const {
    inventario,
    recuentosAnteriores,
    loading,
    error,
    fetchInventario,
    fetchRecuentosAnteriores,
    guardarRecuento,
    aplicarAjustes,
    actualizarComentario
  } = useRecuentoStock();

  const [filtro, setFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('todos');
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState('');
  const [stockContado, setStockContado] = useState({});
  const [observaciones, setObservaciones] = useState('');
  const [mostrarSoloDiferencias, setMostrarSoloDiferencias] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [recuentoIniciado, setRecuentoIniciado] = useState(false);
  const [recuentoExpandido, setRecuentoExpandido] = useState(null);
  const [editandoComentario, setEditandoComentario] = useState(null);
  const [nuevoComentario, setNuevoComentario] = useState('');

  useEffect(() => {
    console.log('🚀 Iniciando recuento de stock...');
    fetchRecuentosAnteriores();
  }, []);

  useEffect(() => {
    if (sucursalSeleccionada) {
      fetchInventario(sucursalSeleccionada);
      // Limpiar filtros al cambiar sucursal
      setFiltro('');
      setTipoFiltro('todos');
      setStockContado({});
      setMostrarSoloDiferencias(false);
      setRecuentoIniciado(false);
    }
  }, [sucursalSeleccionada]);

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
    // Filtro por tipo (computadora, celular, otro, o todos)
    const cumpleTipo = tipoFiltro === 'todos' || producto.tipo === tipoFiltro;

    const cumpleFiltro = filtro === '' ||
      producto.modelo?.toLowerCase().includes(filtro.toLowerCase()) ||
      producto.nombre_producto?.toLowerCase().includes(filtro.toLowerCase()) ||
      producto.descripcion?.toLowerCase().includes(filtro.toLowerCase()) ||
      producto.serial?.toLowerCase().includes(filtro.toLowerCase());

    if (mostrarSoloDiferencias) {
      let stockSistema;
      const sucursalNormalizada = sucursalSeleccionada.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_');
      if (producto.tipo === 'otro') {
        stockSistema = sucursalNormalizada === 'la_plata' ? (producto.cantidad_la_plata || 0) :
                       sucursalNormalizada === 'mitre' ? (producto.cantidad_mitre || 0) :
                       0; // SERVICIO TÉCNICO no maneja productos "otros"
      } else {
        stockSistema = 1; // Para notebooks y celulares, siempre 1 si están en la sucursal
      }
      const stockReal = stockContado[`${producto.tipo}-${producto.id}`] || 0;
      return cumpleTipo && cumpleFiltro && (stockReal !== stockSistema);
    }

    return cumpleTipo && cumpleFiltro;
  });

  const validarRecuentoCompleto = () => {
    // Validar que TODOS los productos del inventario tienen un valor ingresado
    const productosSinContar = inventario.filter(producto => {
      const claveProducto = `${producto.tipo}-${producto.id}`;
      return stockContado[claveProducto] === undefined;
    });

    if (productosSinContar.length > 0) {
      // Agrupar por tipo para mensaje detallado
      const porTipo = productosSinContar.reduce((acc, prod) => {
        acc[prod.tipo] = (acc[prod.tipo] || 0) + 1;
        return acc;
      }, {});

      const mensajeDetalle = Object.entries(porTipo)
        .map(([tipo, cantidad]) => {
          const nombre = tipo === 'computadora' ? 'Notebooks' :
                        tipo === 'celular' ? 'Celulares' : 'Otros';
          return `• ${nombre}: ${cantidad}`;
        })
        .join('\n');

      return {
        valido: false,
        mensaje: `⚠️ RECUENTO INCOMPLETO\n\nDebe contar TODOS los productos de la sucursal antes de finalizar.\n\nProductos faltantes: ${productosSinContar.length}\n\n${mensajeDetalle}\n\nTip: Puede usar el filtro de categoría para facilitar el conteo, pero debe completar todas las categorías.`
      };
    }

    return { valido: true };
  };

  const calcularDiferencias = (inventarioAProcesar) => {
    if (!inventarioAProcesar) return { diferencias: [], productosContados: [] };
    const diferencias = [];
    const productosContados = [];
    const sucursalNormalizada = sucursalSeleccionada.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_');

    console.log('📊 Calculando diferencias para', inventarioAProcesar.length, 'productos de sucursal:', sucursalSeleccionada);
    console.log('📦 Desglose inventario a procesar:', {
      notebooks: inventarioAProcesar.filter(p => p.tipo === 'computadora').length,
      celulares: inventarioAProcesar.filter(p => p.tipo === 'celular').length,
      otros: inventarioAProcesar.filter(p => p.tipo === 'otro').length
    });

    // ⭐ IMPORTANTE: Solo procesar productos que REALMENTE están en el inventario de la sucursal
    for (const producto of inventarioAProcesar) {
      // Verificación de seguridad: asegurar que el producto pertenece a la sucursal
      if (producto.tipo !== 'otro') {
        const sucursalProducto = producto.sucursal?.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_');
        if (sucursalProducto !== sucursalNormalizada) {
          console.warn('⚠️ Producto con sucursal incorrecta detectado y omitido:', producto.tipo, producto.id, 'Sucursal producto:', sucursalProducto, 'Sucursal esperada:', sucursalNormalizada);
          continue; // Saltar este producto
        }
      }

      let stockSistema;
      if (producto.tipo === 'otro') {
        stockSistema = sucursalNormalizada === 'la_plata' ? (producto.cantidad_la_plata || 0) :
                       sucursalNormalizada === 'mitre' ? (producto.cantidad_mitre || 0) :
                       0;
      } else {
        stockSistema = 1;
      }

      // Obtener el stock real contado - debe existir porque ya validamos que todos estén contados
      const claveProducto = `${producto.tipo}-${producto.id}`;
      const stockReal = stockContado[claveProducto] !== undefined ? parseInt(stockContado[claveProducto]) : 0;

      // ⭐ IMPORTANTE: Guardar TODOS los productos de la sucursal con su stock real y sistema
      // Esto crea una "foto" completa del inventario en el día del recuento
      productosContados.push({
        id: producto.id,
        tipo: producto.tipo,
        descripcion: producto.modelo || producto.nombre_producto || producto.descripcion,
        serial: producto.serial || `${producto.tipo}-${producto.id}`,
        stockSistema,
        stockReal: stockReal,
        sucursal: sucursalSeleccionada
      });

      // Solo agregar a diferencias si hay discrepancia
      if (stockReal !== stockSistema) {
        const diferenciaQuantity = stockReal - stockSistema;
        const precioCosto = producto.precio_costo_usd || producto.precio_compra_usd || 0;
        const diferenciaUSD = diferenciaQuantity * precioCosto;

        const diferencia = {
          nombre: producto.modelo || producto.nombre_producto || producto.descripcion,
          diferencia_cantidad: diferenciaQuantity,
          diferencia_usd: diferenciaUSD
        };

        if (diferenciaQuantity < 0) {
          diferencia.serial = producto.serial || `${producto.tipo}-${producto.id}`;
        }
        diferencias.push(diferencia);
      }
    }

    console.log('✅ Productos contados a guardar:', productosContados.length);
    console.log('📦 Desglose productos contados:', {
      notebooks: productosContados.filter(p => p.tipo === 'computadora').length,
      celulares: productosContados.filter(p => p.tipo === 'celular').length,
      otros: productosContados.filter(p => p.tipo === 'otro').length
    });
    console.log('⚠️ Diferencias encontradas:', diferencias.length);

    return { diferencias, productosContados };
  };

  const finalizarRecuento = async () => {
    if (!sucursalSeleccionada) {
      alert('Debe seleccionar una sucursal antes de finalizar el recuento.');
      return;
    }

    // ⭐ VALIDACIÓN DE COMPLETITUD - Debe contar TODOS los productos
    const validacion = validarRecuentoCompleto();
    if (!validacion.valido) {
      alert(validacion.mensaje);
      return;
    }

    console.log('📋 INICIANDO FINALIZACIÓN DE RECUENTO');
    console.log('📦 Total productos en inventario:', inventario.length);
    console.log('🔢 Total productos contados en estado:', Object.keys(stockContado).length);

    // ⭐ IMPORTANTE: Calcular diferencias usando el inventario COMPLETO (sin filtros)
    const { diferencias, productosContados } = calcularDiferencias(inventario);

    console.log('📊 Diferencias calculadas:', diferencias.length);
    console.log('📦 Productos a guardar en JSON:', productosContados.length);
    console.log('🔍 Desglose por tipo:', {
      notebooks: productosContados.filter(p => p.tipo === 'computadora').length,
      celulares: productosContados.filter(p => p.tipo === 'celular').length,
      otros: productosContados.filter(p => p.tipo === 'otro').length
    });

    // Validación final: asegurar que productosContados == inventario
    if (productosContados.length !== inventario.length) {
      console.error('❌ ERROR: Mismatch entre inventario y productos contados');
      console.error('Inventario:', inventario.length, 'Contados:', productosContados.length);
      alert(`❌ Error interno: El número de productos contados (${productosContados.length}) no coincide con el inventario (${inventario.length}). Por favor contacte a soporte.`);
      return;
    }

    if (productosContados.length === 0) {
      alert('No se han contado productos. Debe contar al menos un producto.');
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

      const recuentoData = {
        fecha: fechaLocal,
        timestamp: timestampLocal,
        sucursal: sucursalSeleccionada,
        tipo: productosContados.length === inventario.length ? 'completo' : 'parcial',
        productosContados: JSON.stringify(productosContados),
        diferencias: JSON.stringify(diferencias),
        observaciones
      };

      console.log('💾 Guardando recuento con datos:', {
        fecha: recuentoData.fecha,
        sucursal: recuentoData.sucursal,
        tipo: recuentoData.tipo,
        productos: productosContados.length,
        diferencias: diferencias.length
      });

      // Log detallado del JSON que se va a guardar
      console.log('📄 JSON productos_contados (primeros 5):', JSON.parse(recuentoData.productosContados).slice(0, 5));
      console.log('📄 JSON diferencias (primeros 5):', JSON.parse(recuentoData.diferencias).slice(0, 5));

      await guardarRecuento(recuentoData);

      console.log('✅ Recuento guardado exitosamente en la base de datos');

      if (diferencias.length === 0) {
        alert('✅ Recuento finalizado sin diferencias. Reporte guardado correctamente.');
      } else {
        alert(
          `✅ Recuento finalizado y guardado.\n\n` +
          `⚠️ Se encontraron ${diferencias.length} diferencias que quedan registradas en el reporte.`
        );
      }

      // Reiniciar formulario
      setRecuentoIniciado(false);
      setStockContado({});
      setObservaciones('');
      setMostrarSoloDiferencias(false);

    } catch (err) {
      console.error('❌ Error al guardar recuento:', err);
      alert('❌ Error: ' + err.message);
    }
  };

  const getIconoProducto = (tipo) => {
    switch (tipo) {
      case 'computadora': return <Monitor className="w-5 h-5 text-slate-600" />;
      case 'celular': return <Smartphone className="w-5 h-5 text-slate-600" />;
      case 'otro': return <Box className="w-5 h-5 text-slate-600" />;
      default: return <Package className="w-5 h-5 text-slate-600" />;
    }
  };

  const formatearFecha = (fecha) => {
    // Parsear la fecha como local, no como UTC
    const [year, month, day] = fecha.split('-');
    const fechaLocal = new Date(year, month - 1, day);
    return fechaLocal.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const iniciarEdicionComentario = (recuentoId, comentarioActual) => {
    setEditandoComentario(recuentoId);
    setNuevoComentario(comentarioActual || '');
  };

  const cancelarEdicionComentario = () => {
    setEditandoComentario(null);
    setNuevoComentario('');
  };

  const guardarComentario = async (recuentoId) => {
    try {
      await actualizarComentario(recuentoId, nuevoComentario);
      setEditandoComentario(null);
      setNuevoComentario('');
      alert('✅ Comentario actualizado correctamente');
    } catch (err) {
      alert('❌ Error al actualizar comentario: ' + err.message);
    }
  };

  const { diferencias, productosContados } = calcularDiferencias(inventario);

  if (loading) {
    return <LoadingSpinner text="Cargando inventario..." size="medium" />;
  }

  return (
    <div className="p-6 bg-slate-50">
      <div className="bg-white rounded border border-slate-200 mb-6">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Package className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-semibold">Recuento de Stock</h2>
                <p className="text-slate-300 mt-1">Verificación física del inventario disponible</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {!recuentoIniciado ? (
                <button
                  onClick={iniciarRecuento}
                  disabled={!sucursalSeleccionada}
                  className={`px-4 py-2 rounded flex items-center gap-2 font-medium transition-colors ${
                    sucursalSeleccionada 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Calculator size={18} />
                  Iniciar Recuento
                </button>
              ) : (
                <button
                  onClick={finalizarRecuento}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded flex items-center gap-2 font-medium transition-colors"
                >
                  <Save size={18} />
                  Finalizar Recuento
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Estado del recuento */}
      {recuentoIniciado && (
        <div className="bg-slate-100 border-b border-slate-200 p-4 mb-6 rounded">
          <div className="space-y-3">
            {/* Línea 1: Estado general */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-slate-800">Recuento en proceso - Sucursal {sucursalSeleccionada}</span>
                </div>
                <div className="text-sm text-slate-700">
                  <span className="font-semibold">
                    {Object.keys(stockContado).length} / {inventario.length}
                  </span> productos contados
                  <span className="ml-2 text-slate-500">
                    ({Math.round((Object.keys(stockContado).length / inventario.length) * 100)}%)
                  </span>
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
                    className="rounded border-slate-300"
                  />
                  <span>Solo diferencias</span>
                </label>
              </div>
            </div>

            {/* Línea 2: Progreso por categoría */}
            <div className="flex items-center space-x-6 text-sm">
              {/* Notebooks */}
              {(() => {
                const notebooks = inventario.filter(p => p.tipo === 'computadora');
                const notebooksContados = notebooks.filter(p => stockContado[`${p.tipo}-${p.id}`] !== undefined).length;
                return notebooks.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Monitor size={16} className="text-slate-600" />
                    <span className={notebooksContados === notebooks.length ? 'text-emerald-600 font-medium' : 'text-slate-700'}>
                      Notebooks: {notebooksContados}/{notebooks.length}
                    </span>
                    {notebooksContados === notebooks.length && <CheckCircle size={14} className="text-emerald-600" />}
                  </div>
                );
              })()}

              {/* Celulares */}
              {(() => {
                const celulares = inventario.filter(p => p.tipo === 'celular');
                const celularesContados = celulares.filter(p => stockContado[`${p.tipo}-${p.id}`] !== undefined).length;
                return celulares.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Smartphone size={16} className="text-slate-600" />
                    <span className={celularesContados === celulares.length ? 'text-emerald-600 font-medium' : 'text-slate-700'}>
                      Celulares: {celularesContados}/{celulares.length}
                    </span>
                    {celularesContados === celulares.length && <CheckCircle size={14} className="text-emerald-600" />}
                  </div>
                );
              })()}

              {/* Otros */}
              {(() => {
                const otros = inventario.filter(p => p.tipo === 'otro');
                const otrosContados = otros.filter(p => stockContado[`${p.tipo}-${p.id}`] !== undefined).length;
                return otros.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Box size={16} className="text-slate-600" />
                    <span className={otrosContados === otros.length ? 'text-emerald-600 font-medium' : 'text-slate-700'}>
                      Otros: {otrosContados}/{otros.length}
                    </span>
                    {otrosContados === otros.length && <CheckCircle size={14} className="text-emerald-600" />}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-6 rounded border border-slate-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sucursal *</label>
            <select
              value={sucursalSeleccionada}
              onChange={(e) => setSucursalSeleccionada(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
              disabled={recuentoIniciado}
            >
              <option value="">Seleccionar sucursal...</option>
              <option value="LA PLATA">LA PLATA</option>
              <option value="MITRE">MITRE</option>
              <option value="SERVICIO TECNICO">SERVICIO TECNICO</option>
            </select>
            {recuentoIniciado && (
              <p className="text-xs text-slate-500 mt-1">No se puede cambiar durante el recuento</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Buscar producto</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Modelo, descripción, serial..."
                className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={!sucursalSeleccionada}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de producto</label>
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={!sucursalSeleccionada}
            >
              <option value="todos">Todos los tipos</option>
              <option value="computadora">Notebooks</option>
              <option value="celular">Celulares</option>
              <option value="otro">Otros</option>
            </select>
            {recuentoIniciado && tipoFiltro !== 'todos' && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertTriangle size={12} />
                Filtro visual - Debe completar TODAS las categorías
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estado del recuento</label>
            <div className="text-sm py-2">
              <div className="text-slate-600">
                Total productos: <span className="font-medium">{inventario.length}</span>
              </div>
              <div className="text-slate-600">
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
              className="p-2 bg-slate-600 text-white rounded hover:bg-slate-700 text-sm"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Lista de productos */}
      <div className="bg-white rounded border border-slate-200">
        {!sucursalSeleccionada ? (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 mb-2">Seleccione una sucursal para ver el inventario</p>
            <p className="text-sm text-slate-400">El recuento se realizará solo para la sucursal seleccionada</p>
          </div>
        ) : inventarioFiltrado.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Producto</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-800">Tipo</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-800">Stock Sistema</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-800">Stock Real</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-800">Diferencia</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-800">Estado Recuento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {inventarioFiltrado.map((producto) => {
                  const sucursalNormalizada = sucursalSeleccionada.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_');
                  let stockSistema;
                  if (producto.tipo === 'otro') {
                    stockSistema = sucursalNormalizada === 'la_plata' ? (producto.cantidad_la_plata || 0) :
                       sucursalNormalizada === 'mitre' ? (producto.cantidad_mitre || 0) :
                       0; // SERVICIO TÉCNICO no maneja productos "otros"
                  } else {
                    stockSistema = 1; // Para notebooks y celulares, siempre 1 si están en la sucursal
                  }
                  const stockReal = stockContado[`${producto.tipo}-${producto.id}`];
                  const diferencia = stockReal !== undefined ? stockReal - stockSistema : null;
                  const contado = stockReal !== undefined;

                  return (
                    <tr key={`${producto.tipo}-${producto.id}`} className={`hover:bg-slate-50 ${
                      diferencia !== null && diferencia !== 0 ? 'bg-slate-100' : 
                      contado ? 'bg-emerald-50' : ''
                    }`}>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-slate-800 flex items-center gap-2">
                            {producto.modelo || producto.nombre_producto || producto.descripcion}
                            {/* Info adicional para celulares */}
                            {producto.tipo === 'celular' && (
                              <span className="text-sm font-normal text-slate-600">
                                {producto.capacidad && `• ${producto.capacidad}`}
                                {producto.color && ` • ${producto.color}`}
                              </span>
                            )}
                            {/* Indicador solo para condiciones especiales */}
                            {(['reparacion', 'prestado', 'sin_reparacion'].includes(producto.condicion)) && (
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">{producto.condicion.toUpperCase()}</span>
                            )}
                          </div>
                          <div className="text-sm text-slate-500">
                            Serial: {producto.serial || `${producto.tipo}-${producto.id}`}
                            {producto.condicion && (
                              <span className="ml-2 text-slate-400">• {producto.condicion.toUpperCase()}</span>
                            )}
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
                            onChange={(e) => actualizarStockContado(`${producto.tipo}-${producto.id}`, e.target.value)}
                            className="w-20 px-2 py-1 border border-slate-300 rounded text-center text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="0"
                          />
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="text-center py-3 px-4">
                        {diferencia !== null ? (
                          <span className={`font-medium ${
                            diferencia === 0 ? 'text-emerald-600' : 'text-slate-600'
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
            <Package size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No se encontraron productos con los filtros aplicados</p>
          </div>
        )}
      </div>

      {/* Observaciones */}
      {recuentoIniciado && (
        <div className="bg-white rounded border border-slate-200 mt-6 p-6">
          <div className="max-w-2xl">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Observaciones del recuento
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Comentarios sobre el recuento, productos dañados, faltantes, etc..."
              className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows="3"
            />
          </div>
        </div>
      )}

      {/* Historial de recuentos */}
      <div className="bg-white rounded border border-slate-200 mt-6 p-6">
        <button
          onClick={() => setMostrarHistorial(!mostrarHistorial)}
          className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 mb-4"
        >
          <Eye size={16} />
          <span>Ver historial de recuentos ({recuentosAnteriores.length})</span>
        </button>

        {mostrarHistorial && recuentosAnteriores.length > 0 && (
          <div className="bg-slate-50 rounded p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider">Fecha</th>
                    <th className="text-center py-3 px-4 text-xs font-medium uppercase tracking-wider">Sucursal</th>
                    <th className="text-center py-3 px-4 text-xs font-medium uppercase tracking-wider">Tipo</th>
                    <th className="text-right py-3 px-4 text-xs font-medium uppercase tracking-wider">Productos</th>
                    <th className="text-right py-3 px-4 text-xs font-medium uppercase tracking-wider">Diferencias</th>
                    <th className="text-center py-3 px-4 text-xs font-medium uppercase tracking-wider">Estado</th>
                    <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider">Usuario</th>
                    <th className="text-center py-3 px-4 text-xs font-medium uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recuentosAnteriores.map((recuento, index) => {
                    const productos = JSON.parse(recuento.productos_contados || '[]');
                    const diferencias = JSON.parse(recuento.diferencias_encontradas || '[]');
                    const totalFaltantes = diferencias.filter(d => d.diferencia_cantidad < 0).length;
                    const totalSobrantes = diferencias.filter(d => d.diferencia_cantidad > 0).length;
                    const impactoUSD = diferencias.reduce((sum, d) => sum + (d.diferencia_usd || 0), 0);

                    return (
                      <React.Fragment key={index}>
                        <tr className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="py-3 px-4 text-sm text-slate-800">{formatearFecha(recuento.fecha_recuento)}</td>
                          <td className="text-center py-3 px-4">
                            <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded text-xs capitalize">
                              {recuento.sucursal === 'la_plata' ? 'La Plata' : recuento.sucursal === 'LA PLATA' ? 'La Plata' : recuento.sucursal === 'MITRE' ? 'Mitre' : recuento.sucursal}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4 text-sm text-slate-800 capitalize">{recuento.tipo_recuento}</td>
                          <td className="text-right py-3 px-4 text-sm text-slate-800 font-medium">{productos.length}</td>
                          <td className="text-right py-3 px-4 text-sm font-medium">
                            {diferencias.length > 0 ? (
                              <span className="text-slate-600">{diferencias.length}</span>
                            ) : (
                              <span className="text-emerald-600">0</span>
                            )}
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              recuento.estado === 'sin_diferencias'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}>
                              {recuento.estado === 'sin_diferencias' ? 'OK' : 'Diferencias'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-800">{recuento.usuario_recuento}</td>
                          <td className="text-center py-3 px-4">
                            <button
                              onClick={() => setRecuentoExpandido(recuentoExpandido === index ? null : index)}
                              className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-xs flex items-center gap-1 mx-auto"
                            >
                              {recuentoExpandido === index ? (
                                <>
                                  <ChevronUp size={14} />
                                  Ocultar
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={14} />
                                  Ver detalle
                                </>
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Tabla expandible con detalle de recuento */}
                        {recuentoExpandido === index && (
                          <tr>
                            <td colSpan="8" className="py-4 px-4 bg-slate-100">
                              <div className="max-w-6xl mx-auto">
                                <h4 className="text-sm font-semibold text-slate-800 mb-3">
                                  Detalle de Recuento - {formatearFecha(recuento.fecha_recuento)} - {recuento.sucursal}
                                </h4>

                                {/* Resumen */}
                                <div className="grid grid-cols-4 gap-4 mb-4">
                                  <div className="bg-white border border-slate-200 rounded p-3">
                                    <div className="text-xs text-slate-500 mb-1">Total Productos</div>
                                    <div className="text-lg font-semibold text-slate-800">{productos.length}</div>
                                  </div>
                                  <div className="bg-white border border-slate-200 rounded p-3">
                                    <div className="text-xs text-slate-500 mb-1">Notebooks</div>
                                    <div className="text-lg font-semibold text-slate-600">{productos.filter(p => p.tipo === 'computadora').length}</div>
                                  </div>
                                  <div className="bg-white border border-slate-200 rounded p-3">
                                    <div className="text-xs text-slate-500 mb-1">Celulares</div>
                                    <div className="text-lg font-semibold text-slate-600">{productos.filter(p => p.tipo === 'celular').length}</div>
                                  </div>
                                  <div className="bg-white border border-slate-200 rounded p-3">
                                    <div className="text-xs text-slate-500 mb-1">Otros</div>
                                    <div className="text-lg font-semibold text-slate-600">{productos.filter(p => p.tipo === 'otro').length}</div>
                                  </div>
                                </div>

                                {/* Resumen de diferencias (si hay) */}
                                {diferencias.length > 0 && (
                                  <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="bg-white border border-slate-200 rounded p-3">
                                      <div className="text-xs text-slate-500 mb-1">Faltantes</div>
                                      <div className="text-lg font-semibold text-red-600">{totalFaltantes}</div>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded p-3">
                                      <div className="text-xs text-slate-500 mb-1">Sobrantes</div>
                                      <div className="text-lg font-semibold text-emerald-600">{totalSobrantes}</div>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded p-3">
                                      <div className="text-xs text-slate-500 mb-1">Impacto Total USD</div>
                                      <div className={`text-lg font-semibold ${impactoUSD < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        ${Math.abs(impactoUSD).toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Tabla de todos los productos */}
                                <div className="bg-white border border-slate-200 rounded overflow-hidden">
                                  <table className="w-full">
                                    <thead className="bg-slate-800 text-white">
                                      <tr>
                                        <th className="text-left py-2 px-3 text-xs font-medium uppercase tracking-wider">Producto</th>
                                        <th className="text-center py-2 px-3 text-xs font-medium uppercase tracking-wider">Tipo</th>
                                        <th className="text-left py-2 px-3 text-xs font-medium uppercase tracking-wider">Serial</th>
                                        <th className="text-center py-2 px-3 text-xs font-medium uppercase tracking-wider">Stock Sistema</th>
                                        <th className="text-center py-2 px-3 text-xs font-medium uppercase tracking-wider">Stock Real</th>
                                        <th className="text-center py-2 px-3 text-xs font-medium uppercase tracking-wider">Diferencia</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                      {productos
                                        .sort((a, b) => {
                                          // Orden: computadora (1), celular (2), otro (3)
                                          const ordenTipo = { computadora: 1, celular: 2, otro: 3 };
                                          return (ordenTipo[a.tipo] || 999) - (ordenTipo[b.tipo] || 999);
                                        })
                                        .map((prod, prodIndex) => {
                                          const diferencia = prod.stockReal - prod.stockSistema;
                                          return (
                                            <tr key={prodIndex} className={prodIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                              <td className="py-2 px-3 text-sm text-slate-800">{prod.descripcion}</td>
                                              <td className="text-center py-2 px-3">
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                  prod.tipo === 'computadora' ? 'bg-blue-100 text-blue-800' :
                                                  prod.tipo === 'celular' ? 'bg-purple-100 text-purple-800' :
                                                  'bg-slate-100 text-slate-800'
                                                }`}>
                                                  {prod.tipo === 'computadora' ? 'Notebook' :
                                                   prod.tipo === 'celular' ? 'Celular' : 'Otro'}
                                                </span>
                                              </td>
                                              <td className="py-2 px-3 text-sm text-slate-600">
                                                <span className="font-mono text-xs">{prod.serial}</span>
                                              </td>
                                              <td className="text-center py-2 px-3 text-sm font-medium text-slate-700">
                                                {prod.stockSistema}
                                              </td>
                                              <td className="text-center py-2 px-3 text-sm font-medium text-slate-700">
                                                {prod.stockReal}
                                              </td>
                                              <td className="text-center py-2 px-3">
                                                {diferencia === 0 ? (
                                                  <span className="text-emerald-600 font-medium text-sm">✓</span>
                                                ) : (
                                                  <span className={`text-sm font-medium ${
                                                    diferencia < 0 ? 'text-red-600' : 'text-blue-600'
                                                  }`}>
                                                    {diferencia > 0 ? '+' : ''}{diferencia}
                                                  </span>
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })
                                      }
                                    </tbody>
                                    <tfoot className="bg-slate-800 text-white">
                                      <tr>
                                        <td colSpan="3" className="py-2 px-3 text-sm font-semibold">TOTAL PRODUCTOS</td>
                                        <td className="text-center py-2 px-3 text-sm font-semibold">
                                          {productos.reduce((sum, p) => sum + p.stockSistema, 0)}
                                        </td>
                                        <td className="text-center py-2 px-3 text-sm font-semibold">
                                          {productos.reduce((sum, p) => sum + p.stockReal, 0)}
                                        </td>
                                        <td className="text-center py-2 px-3 text-sm font-semibold">
                                          {productos.reduce((sum, p) => sum + (p.stockReal - p.stockSistema), 0)}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>

                                {/* Observaciones - editables */}
                                <div className="mt-3 bg-white border border-slate-200 rounded p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="text-xs font-medium text-slate-700">Observaciones:</div>
                                    {editandoComentario !== recuento.id && (
                                      <button
                                        onClick={() => iniciarEdicionComentario(recuento.id, recuento.observaciones)}
                                        className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-xs"
                                      >
                                        <Edit2 size={12} />
                                        {recuento.observaciones ? 'Editar' : 'Agregar'}
                                      </button>
                                    )}
                                  </div>

                                  {editandoComentario === recuento.id ? (
                                    <div className="space-y-2">
                                      <textarea
                                        value={nuevoComentario}
                                        onChange={(e) => setNuevoComentario(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        rows="3"
                                        placeholder="Agregar comentarios sobre las diferencias..."
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => guardarComentario(recuento.id)}
                                          className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-xs flex items-center gap-1"
                                        >
                                          <Save size={12} />
                                          Guardar
                                        </button>
                                        <button
                                          onClick={cancelarEdicionComentario}
                                          className="px-3 py-1 bg-slate-600 text-white rounded hover:bg-slate-700 text-xs flex items-center gap-1"
                                        >
                                          <X size={12} />
                                          Cancelar
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-slate-600">
                                      {recuento.observaciones || <span className="text-slate-400 italic">Sin observaciones</span>}
                                    </div>
                                  )}
                                </div>
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
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-slate-100 border-l-4 border-slate-400 p-4 mt-6 rounded">
          <span className="text-slate-800">{error}</span>
        </div>
      )}
    </div>
  );
};


