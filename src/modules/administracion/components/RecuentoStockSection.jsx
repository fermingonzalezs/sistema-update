import React, { useState, useEffect } from 'react';
import { Package, Search, RefreshCw, Monitor, Smartphone, Box, History, Calculator, Save, AlertTriangle, ChevronDown, ChevronUp, MessageSquare, Edit, Edit2, CheckCircle, BarChart3, Eye, X } from 'lucide-react';
import { obtenerFechaLocal } from '../../../shared/utils/formatters';
import { supabase } from '../../../lib/supabase';
import LoadingSpinner from '../../../shared/components/base/LoadingSpinner';
import { CATEGORIAS_OTROS_ARRAY, CATEGORIAS_OTROS_LABELS, getCategoriaLabel } from '../../../shared/constants/categoryConstants';
import { generateCopy } from '../../../shared/utils/copyGenerator';
import { useAuthContext } from '../../../context/AuthContext';

// Servicio para Recuento de Stock
const recuentoStockService = {
  async getInventarioCompleto(sucursal = null, categoria = null) {
    console.log('📦 Obteniendo inventario para sucursal:', sucursal || 'todas', '| Categoría:', categoria || 'todas');

    // Helper para ordenar por nombre/modelo
    const sortByName = (a, b) => {
      const nameA = a.modelo || a.nombre_producto || a.descripcion || '';
      const nameB = b.modelo || b.nombre_producto || b.descripcion || '';
      return nameA.localeCompare(nameB);
    };

    const sucursalNormalizada = sucursal ? sucursal.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_') : null;

    let inventario = [];

    // Determinar qué tipo de productos obtener según la categoría
    // NOTA: Se excluyen productos con condición 'consignacion' del recuento
    if (categoria === 'notebooks') {
      // Solo notebooks (excluyendo consignacion)
      let query = supabase.from('inventario').select('*').neq('condicion', 'consignacion');
      if (sucursalNormalizada) {
        query = query.eq('sucursal', sucursalNormalizada);
      }
      const { data, error } = await query;
      if (error) throw error;
      inventario = data.map(item => ({ ...item, tipo: 'computadora' }));

    } else if (categoria === 'celulares') {
      // Solo celulares (excluyendo consignacion)
      let query = supabase.from('celulares').select('*').neq('condicion', 'consignacion');
      if (sucursalNormalizada) {
        query = query.eq('sucursal', sucursalNormalizada);
      }
      const { data, error } = await query;
      if (error) throw error;
      inventario = data.map(item => ({ ...item, tipo: 'celular' }));

    } else if (categoria && categoria.startsWith('otros_')) {
      // Subcategoría específica de otros (ej: 'otros_AUDIO') - excluyendo consignacion
      const subcategoria = categoria.replace('otros_', '');
      const { data, error } = await supabase
        .from('otros')
        .select('*')
        .eq('categoria', subcategoria)
        .neq('condicion', 'consignacion');
      if (error) throw error;

      // Filtrar por stock en la sucursal
      inventario = data
        .filter(item => {
          if (!sucursalNormalizada) return true;
          const stockSucursal = sucursalNormalizada === 'la_plata' ? (item.cantidad_la_plata || 0) :
            sucursalNormalizada === 'mitre' ? (item.cantidad_mitre || 0) : 0;
          return stockSucursal > 0;
        })
        .map(item => ({ ...item, tipo: 'otro' }));

    } else {
      // Fallback: todos los productos (comportamiento legacy) - excluyendo consignacion
      let computadoras, celulares, otros;

      if (sucursalNormalizada) {
        [computadoras, celulares, otros] = await Promise.all([
          supabase.from('inventario').select('*').eq('sucursal', sucursalNormalizada).neq('condicion', 'consignacion'),
          supabase.from('celulares').select('*').eq('sucursal', sucursalNormalizada).neq('condicion', 'consignacion'),
          supabase.from('otros').select('*').neq('condicion', 'consignacion')
        ]);
      } else {
        [computadoras, celulares, otros] = await Promise.all([
          supabase.from('inventario').select('*').neq('condicion', 'consignacion'),
          supabase.from('celulares').select('*').neq('condicion', 'consignacion'),
          supabase.from('otros').select('*').neq('condicion', 'consignacion')
        ]);
      }

      if (computadoras.error) throw computadoras.error;
      if (celulares.error) throw celulares.error;
      if (otros.error) throw otros.error;

      inventario = [
        ...computadoras.data.map(item => ({ ...item, tipo: 'computadora' })),
        ...celulares.data.map(item => ({ ...item, tipo: 'celular' })),
        ...otros.data.map(item => ({ ...item, tipo: 'otro' }))
      ];

      // Filtrar otros por stock en sucursal
      if (sucursalNormalizada) {
        inventario = inventario.filter(item => {
          if (item.tipo === 'otro') {
            const stockSucursal = sucursalNormalizada === 'la_plata' ? (item.cantidad_la_plata || 0) :
              sucursalNormalizada === 'mitre' ? (item.cantidad_mitre || 0) : 0;
            return stockSucursal > 0;
          }
          return true;
        });
      }
    }

    // Ordenar alfabéticamente
    inventario.sort(sortByName);

    console.log(`✅ ${inventario.length} productos para recuento de categoría: ${categoria || 'todas'}`);
    return inventario;
  },

  async guardarRecuento(recuentoData) {
    console.log('💾 Guardando recuento de stock...', { categoria: recuentoData.categoria });

    const { data, error } = await supabase
      .from('recuentos_stock')
      .insert([{
        fecha_recuento: recuentoData.fecha,
        timestamp_recuento: recuentoData.timestamp,
        sucursal: recuentoData.sucursal,
        categoria: recuentoData.categoria, // 'notebooks' | 'celulares' | 'otros_AUDIO' | etc.
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

  async getRecuentosAnteriores(limite = 20) {
    console.log('📊 Obteniendo recuentos anteriores...');

    const { data, error } = await supabase
      .from('recuentos_stock')
      .select('*')
      .order('id', { ascending: false })
      .limit(limite);

    if (error) throw error;
    return data;
  },

  // NUEVO: Obtener estado de recuentos agrupado por sucursal y categoría
  async getEstadoRecuentos() {
    console.log('📊 Obteniendo estado de recuentos por sucursal/categoría...');

    const { data, error } = await supabase
      .from('recuentos_stock')
      .select('id, fecha_recuento, sucursal, categoria, estado, productos_contados')
      .order('fecha_recuento', { ascending: false });

    if (error) throw error;

    // Agrupar: encontrar el último recuento por cada sucursal+categoría
    const estadoPorSucursalCategoria = {};
    for (const recuento of (data || [])) {
      const key = `${recuento.sucursal}_${recuento.categoria}`;
      if (!estadoPorSucursalCategoria[key]) {
        const productos = JSON.parse(recuento.productos_contados || '[]');
        estadoPorSucursalCategoria[key] = {
          sucursal: recuento.sucursal,
          categoria: recuento.categoria,
          fechaUltimoRecuento: recuento.fecha_recuento,
          estado: recuento.estado,
          cantidadProductos: productos.length
        };
      }
    }

    return Object.values(estadoPorSucursalCategoria);
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
  },

  async eliminarRecuento(recuentoId) {
    console.log('🗑️ Eliminando recuento...', recuentoId);

    const { error } = await supabase
      .from('recuentos_stock')
      .delete()
      .eq('id', recuentoId);

    if (error) throw error;
    return true;
  },

  // Obtener cantidad de stock por categoría y sucursal
  // para saber qué categorías tienen stock real (>0 items)
  async getStockPorCategoriaSucursal() {
    console.log('📊 Obteniendo stock por categoría/sucursal...');

    const sucursales = ['la_plata', 'mitre'];
    const resultado = {}; // { 'LA PLATA_notebooks': 5, 'LA PLATA_celulares': 3, ... }

    // Notebooks por sucursal (excluyendo consignacion)
    for (const suc of sucursales) {
      const { count, error } = await supabase
        .from('inventario')
        .select('id', { count: 'exact', head: true })
        .eq('sucursal', suc)
        .neq('condicion', 'consignacion');
      if (!error) {
        const sucLabel = suc === 'la_plata' ? 'LA PLATA' : 'MITRE';
        resultado[`${sucLabel}_notebooks`] = count || 0;
      }
    }

    // Celulares por sucursal (excluyendo consignacion)
    for (const suc of sucursales) {
      const { count, error } = await supabase
        .from('celulares')
        .select('id', { count: 'exact', head: true })
        .eq('sucursal', suc)
        .neq('condicion', 'consignacion');
      if (!error) {
        const sucLabel = suc === 'la_plata' ? 'LA PLATA' : 'MITRE';
        resultado[`${sucLabel}_celulares`] = count || 0;
      }
    }

    // Otros por subcategoría y sucursal
    const { data: otrosData, error: otrosError } = await supabase
      .from('otros')
      .select('categoria, cantidad_la_plata, cantidad_mitre')
      .neq('condicion', 'consignacion');

    if (!otrosError && otrosData) {
      // Agrupar por categoría y sumar cantidades
      const porCategoria = {};
      for (const item of otrosData) {
        if (!item.categoria) continue;
        if (!porCategoria[item.categoria]) {
          porCategoria[item.categoria] = { la_plata: 0, mitre: 0 };
        }
        porCategoria[item.categoria].la_plata += (item.cantidad_la_plata || 0);
        porCategoria[item.categoria].mitre += (item.cantidad_mitre || 0);
      }

      for (const [cat, cantidades] of Object.entries(porCategoria)) {
        resultado[`LA PLATA_otros_${cat}`] = cantidades.la_plata;
        resultado[`MITRE_otros_${cat}`] = cantidades.mitre;
      }
    }

    console.log('✅ Stock por categoría/sucursal:', resultado);
    return resultado;
  }
};

// Hook personalizado
function useRecuentoStock() {
  const [inventario, setInventario] = useState([]);
  const [recuentosAnteriores, setRecuentosAnteriores] = useState([]);
  const [estadoRecuentos, setEstadoRecuentos] = useState([]); // NUEVO
  const [stockPorCategoria, setStockPorCategoria] = useState({}); // Stock real por categoría/sucursal
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInventario = async (sucursal = null, categoria = null) => {
    try {
      setLoading(true);
      setError(null);
      const data = await recuentoStockService.getInventarioCompleto(sucursal, categoria);
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

  // NUEVO: Cargar estado de recuentos agrupado
  const fetchEstadoRecuentos = async () => {
    try {
      const data = await recuentoStockService.getEstadoRecuentos();
      setEstadoRecuentos(data);
    } catch (err) {
      console.error('Error cargando estado de recuentos:', err);
    }
  };

  // Cargar stock real por categoría/sucursal
  const fetchStockPorCategoria = async () => {
    try {
      const data = await recuentoStockService.getStockPorCategoriaSucursal();
      setStockPorCategoria(data);
    } catch (err) {
      console.error('Error cargando stock por categoría:', err);
    }
  };

  const guardarRecuento = async (recuentoData) => {
    try {
      setError(null);
      const resultado = await recuentoStockService.guardarRecuento(recuentoData);
      fetchRecuentosAnteriores(); // Actualizar historial
      fetchEstadoRecuentos(); // Actualizar estado
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

  const eliminarRecuento = async (recuentoId) => {
    try {
      setError(null);
      await recuentoStockService.eliminarRecuento(recuentoId);
      fetchRecuentosAnteriores(); // Refrescar historial
      fetchEstadoRecuentos(); // Refrescar estado
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    inventario,
    recuentosAnteriores,
    estadoRecuentos,
    stockPorCategoria,
    loading,
    error,
    fetchInventario,
    fetchRecuentosAnteriores,
    fetchEstadoRecuentos,
    fetchStockPorCategoria,
    guardarRecuento,
    aplicarAjustes,
    actualizarComentario,
    eliminarRecuento
  };
}

// Componente principal
export const RecuentoStockSection = () => {
  const {
    inventario,
    recuentosAnteriores,
    estadoRecuentos,
    stockPorCategoria,
    loading,
    error,
    fetchInventario,
    fetchRecuentosAnteriores,
    fetchEstadoRecuentos,
    fetchStockPorCategoria,
    guardarRecuento,
    aplicarAjustes,
    actualizarComentario,
    eliminarRecuento
  } = useRecuentoStock();

  const { user } = useAuthContext(); // Obtener usuario logueado

  const [filtro, setFiltro] = useState('');
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [stockContado, setStockContado] = useState({});
  const [observaciones, setObservaciones] = useState('');
  const [mostrarSoloDiferencias, setMostrarSoloDiferencias] = useState(false);

  const [recuentoIniciado, setRecuentoIniciado] = useState(false);
  const [recuentoExpandido, setRecuentoExpandido] = useState(null);
  const [editandoComentario, setEditandoComentario] = useState(null);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [mostrarEstadoRecuentos, setMostrarEstadoRecuentos] = useState(true);
  const [modalProductos, setModalProductos] = useState(null); // {productos: [], titulo: string}
  const [modalDiferencias, setModalDiferencias] = useState(null); // {diferencias: [], titulo: string}

  // Generar lista de categorías disponibles
  const categoriasDisponibles = [
    { value: 'notebooks', label: '💻 Notebooks', grupo: 'principal' },
    { value: 'celulares', label: '📱 Celulares', grupo: 'principal' },
    ...CATEGORIAS_OTROS_ARRAY.map(cat => ({
      value: `otros_${cat}`,
      label: `📦 ${getCategoriaLabel(cat)}`,
      grupo: 'otros'
    }))
  ];

  useEffect(() => {
    console.log('🚀 Iniciando recuento de stock...');
    fetchRecuentosAnteriores();
    fetchEstadoRecuentos(); // Cargar estado de recuentos
    fetchStockPorCategoria(); // Cargar stock por categoría/sucursal
  }, []);

  // Cargar inventario cuando se selecciona sucursal Y categoría
  useEffect(() => {
    if (sucursalSeleccionada && categoriaSeleccionada) {
      fetchInventario(sucursalSeleccionada, categoriaSeleccionada);
      // Limpiar conteos al cambiar
      setStockContado({});
      setMostrarSoloDiferencias(false);
      setRecuentoIniciado(false);
    }
  }, [sucursalSeleccionada, categoriaSeleccionada]);

  // Limpiar categoría al cambiar sucursal
  useEffect(() => {
    if (sucursalSeleccionada) {
      setCategoriaSeleccionada('');
      setFiltro('');
      setStockContado({});
      setMostrarSoloDiferencias(false);
      setRecuentoIniciado(false);
    }
  }, [sucursalSeleccionada]);

  const iniciarRecuento = () => {
    if (!categoriaSeleccionada) {
      alert('Debe seleccionar una categoría antes de iniciar el recuento.');
      return;
    }
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
    // Filtro por texto (modelo, descripción, serial)
    const cumpleFiltro = filtro === '' ||
      producto.modelo?.toLowerCase().includes(filtro.toLowerCase()) ||
      producto.nombre_producto?.toLowerCase().includes(filtro.toLowerCase()) ||
      producto.descripcion?.toLowerCase().includes(filtro.toLowerCase()) ||
      producto.serial?.toLowerCase().includes(filtro.toLowerCase());

    // Filtro de diferencias (solo mostrar productos con diferencia)
    if (mostrarSoloDiferencias) {
      let stockSistema;
      const sucursalNormalizada = sucursalSeleccionada.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_');
      if (producto.tipo === 'otro') {
        stockSistema = sucursalNormalizada === 'la_plata' ? (producto.cantidad_la_plata || 0) :
          sucursalNormalizada === 'mitre' ? (producto.cantidad_mitre || 0) : 0;
      } else {
        stockSistema = 1;
      }
      const stockReal = stockContado[`${producto.tipo}-${producto.id}`] || 0;
      return cumpleFiltro && (stockReal !== stockSistema);
    }

    return cumpleFiltro;
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

    console.log('📊 Calculando diferencias para', inventarioAProcesar.length, 'productos');

    for (const producto of inventarioAProcesar) {
      // Verificación de seguridad para notebooks/celulares
      if (producto.tipo !== 'otro') {
        const sucursalProducto = producto.sucursal?.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_');
        if (sucursalProducto !== sucursalNormalizada) {
          console.warn('⚠️ Producto con sucursal incorrecta omitido:', producto.id);
          continue;
        }
      }

      let stockSistema;
      if (producto.tipo === 'otro') {
        stockSistema = sucursalNormalizada === 'la_plata' ? (producto.cantidad_la_plata || 0) :
          sucursalNormalizada === 'mitre' ? (producto.cantidad_mitre || 0) : 0;
      } else {
        stockSistema = 1;
      }

      const claveProducto = `${producto.tipo}-${producto.id}`;
      const stockReal = stockContado[claveProducto] !== undefined ? parseInt(stockContado[claveProducto]) : 0;

      // ⭐ FOTO COMPLETA del producto en el momento del recuento
      let copyCompleto = '';
      try {
        copyCompleto = generateCopy(producto, { includePrice: true, includeEmojis: true });
      } catch (e) {
        copyCompleto = producto.modelo || producto.nombre_producto || producto.descripcion || '';
      }

      productosContados.push({
        id: producto.id,
        tipo: producto.tipo,
        nombre: producto.modelo || producto.nombre_producto || producto.descripcion || 'Sin nombre',
        serial: producto.serial || `${producto.tipo}-${producto.id}`,
        sucursal: sucursalSeleccionada,
        categoriaRecuento: categoriaSeleccionada, // La categoría del recuento actual
        stockSistema,
        stockReal,
        // FOTO COMPLETA - Nuevos campos
        copyCompleto,
        precioCompraUSD: producto.precio_compra_usd || producto.precio_costo_usd || 0,
        costosAdicionales: producto.envios_repuestos || producto.costo_adicional || 0,
        precioVentaUSD: producto.precio_venta_usd || 0,
        fechaIngreso: producto.ingreso || producto.created_at?.split('T')[0] || null,
        condicion: producto.condicion || null,
        estado: producto.estado || null,
        subcategoria: producto.categoria || null,
        marca: producto.marca || null
      });

      // Solo agregar a diferencias si hay discrepancia
      if (stockReal !== stockSistema) {
        const diferenciaQuantity = stockReal - stockSistema;
        const precioCosto = producto.precio_costo_usd || producto.precio_compra_usd || 0;
        const diferenciaUSD = diferenciaQuantity * precioCosto;

        diferencias.push({
          id: producto.id,
          nombre: producto.modelo || producto.nombre_producto || producto.descripcion,
          serial: producto.serial || `${producto.tipo}-${producto.id}`,
          diferencia_cantidad: diferenciaQuantity,
          diferencia_usd: diferenciaUSD,
          stockSistema,
          stockReal
        });
      }
    }

    console.log('✅ Productos contados:', productosContados.length, '| Diferencias:', diferencias.length);
    return { diferencias, productosContados };
  };

  const finalizarRecuento = async () => {
    if (!sucursalSeleccionada) {
      alert('Debe seleccionar una sucursal antes de finalizar el recuento.');
      return;
    }

    if (!categoriaSeleccionada) {
      alert('Debe seleccionar una categoría antes de finalizar el recuento.');
      return;
    }

    // ⭐ VALIDACIÓN DE COMPLETITUD - Debe contar TODOS los productos
    const validacion = validarRecuentoCompleto();
    if (!validacion.valido) {
      alert(validacion.mensaje);
      return;
    }

    console.log('📋 INICIANDO FINALIZACIÓN DE RECUENTO');
    console.log('📦 Categoría:', categoriaSeleccionada);
    console.log('📦 Total productos en inventario:', inventario.length);
    console.log('🔢 Total productos contados:', Object.keys(stockContado).length);

    const { diferencias, productosContados } = calcularDiferencias(inventario);

    console.log('📊 Diferencias:', diferencias.length);
    console.log('📦 Productos a guardar:', productosContados.length);

    // Validación final
    if (productosContados.length !== inventario.length) {
      console.error('❌ ERROR: Mismatch entre inventario y productos contados');
      alert(`❌ Error interno: El número de productos contados (${productosContados.length}) no coincide con el inventario (${inventario.length}).`);
      return;
    }

    if (productosContados.length === 0) {
      alert('No se han contado productos. Debe contar al menos un producto.');
      return;
    }

    try {
      const ahora = new Date();
      const fechaLocal = obtenerFechaLocal();
      const offset = ahora.getTimezoneOffset();
      const localTime = new Date(ahora.getTime() - (offset * 60 * 1000));
      const timestampLocal = localTime.toISOString();

      // Obtener label de la categoría para el mensaje
      const categoriaLabel = categoriasDisponibles.find(c => c.value === categoriaSeleccionada)?.label || categoriaSeleccionada;

      const recuentoData = {
        fecha: fechaLocal,
        timestamp: timestampLocal,
        sucursal: sucursalSeleccionada,
        categoria: categoriaSeleccionada, // NUEVO: categoría del recuento
        tipo: 'completo', // Siempre completo porque ahora es por categoría
        productosContados: JSON.stringify(productosContados),
        diferencias: JSON.stringify(diferencias),
        observaciones,
        usuario: user?.nombre || user?.email || 'admin' // Usuario real
      };

      console.log('💾 Guardando recuento:', {
        fecha: recuentoData.fecha,
        sucursal: recuentoData.sucursal,
        categoria: recuentoData.categoria,
        productos: productosContados.length,
        diferencias: diferencias.length
      });

      // Log del primer producto para verificar foto completa
      if (productosContados.length > 0) {
        console.log('📸 Ejemplo de foto completa:', productosContados[0]);
      }

      await guardarRecuento(recuentoData);

      console.log('✅ Recuento guardado exitosamente');

      if (diferencias.length === 0) {
        alert(`✅ Recuento de ${categoriaLabel} finalizado sin diferencias.\n\nReporte guardado correctamente.`);
      } else {
        alert(
          `✅ Recuento de ${categoriaLabel} finalizado y guardado.\n\n` +
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
    if (!fecha) return '';
    if (typeof fecha === 'string' && fecha.includes('-')) {
      const [year, month, day] = fecha.split('-');
      const fechaLocal = new Date(year, month - 1, day);
      return fechaLocal.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    // Fallback para otros formatos
    return new Date(fecha).toLocaleDateString('es-AR', {
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
                  disabled={!sucursalSeleccionada || !categoriaSeleccionada}
                  className={`px-4 py-2 rounded flex items-center gap-2 font-medium transition-colors ${sucursalSeleccionada && categoriaSeleccionada
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

          {/* NUEVO: Selector de Categoría */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Categoría *</label>
            <select
              value={categoriaSeleccionada}
              onChange={(e) => setCategoriaSeleccionada(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
              disabled={!sucursalSeleccionada || recuentoIniciado}
            >
              <option value="">Seleccionar categoría...</option>
              <optgroup label="Principales">
                <option value="notebooks">💻 Notebooks</option>
                <option value="celulares">📱 Celulares</option>
              </optgroup>
              <optgroup label="Otros Productos">
                {CATEGORIAS_OTROS_ARRAY.map(cat => (
                  <option key={cat} value={`otros_${cat}`}>
                    📦 {getCategoriaLabel(cat)}
                  </option>
                ))}
              </optgroup>
            </select>
            {!sucursalSeleccionada && (
              <p className="text-xs text-slate-500 mt-1">Primero seleccione una sucursal</p>
            )}
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
                disabled={!categoriaSeleccionada}
              />
            </div>
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
                  <th className="text-center py-3 px-4 font-semibold text-slate-800">Stock Sistema</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-800">Stock Real</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-800">Diferencia</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-800">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {inventarioFiltrado.map((producto) => {
                  const sucursalNormalizada = sucursalSeleccionada.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_');
                  let stockSistema;
                  if (producto.tipo === 'otro') {
                    stockSistema = sucursalNormalizada === 'la_plata' ? (producto.cantidad_la_plata || 0) :
                      sucursalNormalizada === 'mitre' ? (producto.cantidad_mitre || 0) : 0;
                  } else {
                    stockSistema = 1;
                  }
                  const stockReal = stockContado[`${producto.tipo}-${producto.id}`];
                  const diferencia = stockReal !== undefined ? stockReal - stockSistema : null;
                  const contado = stockReal !== undefined;

                  return (
                    <tr key={`${producto.tipo}-${producto.id}`} className={`hover:bg-slate-50 ${diferencia !== null && diferencia !== 0 ? 'bg-slate-100' :
                      contado ? 'bg-emerald-50' : ''
                      }`}>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-slate-800 flex items-center gap-2">
                            {producto.modelo || producto.nombre_producto || producto.descripcion || 'Sin nombre'}
                            {producto.tipo === 'celular' && (
                              <span className="text-sm font-normal text-slate-600">
                                {producto.capacidad && `• ${producto.capacidad}`}
                                {producto.color && ` • ${producto.color}`}
                              </span>
                            )}
                            {(['reparacion', 'prestado', 'sin_reparacion'].includes(producto.condicion)) && (
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">{producto.condicion.toUpperCase()}</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">
                            Serial: {producto.serial || `${producto.tipo}-${producto.id}`}
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4 font-medium">
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
                            className="w-20 px-2 py-1 border border-slate-300 rounded text-center text-sm focus:ring-2 focus:ring-emerald-500"
                            placeholder="0"
                          />
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="text-center py-3 px-4">
                        {diferencia !== null ? (
                          <span className={`font-medium ${diferencia === 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
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


      {/* Panel de Recuentos por Mes */}
      <div className="bg-white rounded border border-slate-200 mt-6">
        <div className="bg-slate-800 text-white py-3 px-6 rounded-t flex items-center justify-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <h3 className="font-semibold text-sm tracking-wider uppercase">RECUENTOS POR MES</h3>
        </div>
        <div className="p-6">

          {(() => {
            const sucursalesValidas = ['LA PLATA', 'MITRE'];
            const todasLasCategorias = [
              { value: 'notebooks', label: '💻 Notebooks' },
              { value: 'celulares', label: '📱 Celulares' },
              ...CATEGORIAS_OTROS_ARRAY.map(cat => ({
                value: `otros_${cat}`,
                label: `📦 ${getCategoriaLabel(cat)}`
              }))
            ];
            const totalCategorias = todasLasCategorias.length;

            // Agrupar recuentos por mes
            const recuentosPorMes = {};
            (recuentosAnteriores || []).forEach(recuento => {
              if (!recuento.fecha_recuento) return;
              const fecha = new Date(recuento.fecha_recuento);
              const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
              const mesLabel = fecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

              if (!recuentosPorMes[mesKey]) {
                recuentosPorMes[mesKey] = { label: mesLabel, key: mesKey, recuentos: [] };
              }
              recuentosPorMes[mesKey].recuentos.push(recuento);
            });

            const mesesOrdenados = Object.keys(recuentosPorMes).sort((a, b) => b.localeCompare(a));

            if (mesesOrdenados.length === 0) {
              return (
                <div className="text-center py-8 text-slate-500">
                  <Package size={32} className="mx-auto mb-2 text-slate-300" />
                  <p>No hay recuentos registrados aún</p>
                </div>
              );
            }

            return (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800 text-white">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-medium uppercase">Mes</th>
                      <th className="text-center py-3 px-4 text-xs font-medium uppercase">Sucursal</th>
                      <th className="text-center py-3 px-4 text-xs font-medium uppercase">Productos</th>
                      <th className="text-center py-3 px-4 text-xs font-medium uppercase">Diferencias</th>
                      <th className="text-center py-3 px-4 text-xs font-medium uppercase">Completado</th>
                      <th className="text-center py-3 px-4 text-xs font-medium uppercase">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {mesesOrdenados.slice(0, 6).flatMap(mesKey => {
                      const mesData = recuentosPorMes[mesKey];

                      return sucursalesValidas.map((sucursal, sucIdx) => {
                        // Filtrar recuentos de esta sucursal en este mes
                        const recuentosSucursal = mesData.recuentos.filter(r =>
                          r.sucursal?.toUpperCase() === sucursal
                        );

                        // Calcular métricas
                        const categoriasContadas = new Set(recuentosSucursal.map(r => r.categoria).filter(Boolean));
                        const totalProductos = recuentosSucursal.reduce((sum, r) => {
                          const prods = JSON.parse(r.productos_contados || '[]');
                          return sum + prods.length;
                        }, 0);
                        const totalDiferencias = recuentosSucursal.reduce((sum, r) => {
                          const difs = JSON.parse(r.diferencias_encontradas || '[]');
                          return sum + difs.length;
                        }, 0);

                        // Categorías sin stock: no se contabilizan para el porcentaje
                        const categoriasSinStock = todasLasCategorias.filter(cat => {
                          const stockKey = `${sucursal}_${cat.value}`;
                          return (stockPorCategoria[stockKey] || 0) === 0;
                        });
                        const categoriasConStock = totalCategorias - categoriasSinStock.length;
                        const porcentaje = categoriasConStock > 0
                          ? Math.round((categoriasContadas.size / categoriasConStock) * 100)
                          : 100; // Si no hay stock en ninguna categoría, se considera 100%
                        const expandKey = `${mesKey}_${sucursal}`;
                        const isExpanded = recuentoExpandido === expandKey;

                        return (
                          <React.Fragment key={expandKey}>
                            <tr className={`${sucIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100 cursor-pointer`}
                              onClick={() => setRecuentoExpandido(isExpanded ? null : expandKey)}>
                              <td className="py-3 px-4 font-medium text-slate-700 capitalize">
                                {sucIdx === 0 ? mesData.label : ''}
                              </td>
                              <td className="text-center py-3 px-4">
                                <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded text-xs">
                                  {sucursal}
                                </span>
                              </td>
                              <td className="text-center py-3 px-4 font-medium text-slate-800">
                                {totalProductos}
                              </td>
                              <td className="text-center py-3 px-4">
                                {totalDiferencias > 0 ? (
                                  <span
                                    className="text-amber-600 font-medium cursor-pointer hover:underline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Recopilar todas las diferencias de todas las categorías
                                      const todasDiferencias = [];
                                      recuentosSucursal.forEach(r => {
                                        const difs = JSON.parse(r.diferencias_encontradas || '[]');
                                        const catLabel = todasLasCategorias.find(c => c.value === r.categoria)?.label || r.categoria;
                                        difs.forEach(d => todasDiferencias.push({ ...d, categoriaLabel: catLabel, categoriaValue: r.categoria }));
                                      });
                                      setModalDiferencias({
                                        diferencias: todasDiferencias,
                                        titulo: `Diferencias - ${sucursal} - ${mesData.label}`,
                                        sucursal,
                                        mes: mesData.label
                                      });
                                    }}
                                  >{totalDiferencias}</span>
                                ) : (
                                  <span className="text-emerald-600">0</span>
                                )}
                              </td>
                              <td className="text-center py-3 px-4">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-16 bg-slate-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${porcentaje === 100 ? 'bg-emerald-500' : porcentaje > 50 ? 'bg-amber-500' : 'bg-slate-400'}`}
                                      style={{ width: `${porcentaje}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium text-slate-600">{porcentaje}%</span>
                                </div>
                              </td>
                              <td className="text-center py-3 px-4">
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr>
                                <td colSpan={6} className="bg-slate-50 p-4">
                                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                                    {todasLasCategorias.map(cat => {
                                      const recuentoCategoria = recuentosSucursal.find(r => r.categoria === cat.value);
                                      const contada = !!recuentoCategoria;
                                      const stockKey = `${sucursal}_${cat.value}`;
                                      const sinStock = (stockPorCategoria[stockKey] || 0) === 0;

                                      const handleClickCategoria = (e) => {
                                        e.stopPropagation();
                                        if (recuentoCategoria) {
                                          const productos = JSON.parse(recuentoCategoria.productos_contados || '[]');
                                          setModalProductos({
                                            productos,
                                            titulo: `${cat.label} - ${sucursal} - ${mesData.label}`,
                                            fecha: recuentoCategoria.fecha_recuento
                                          });
                                        }
                                      };

                                      // Determinar estilo: verde=contada, amarillo=sin stock, gris=pendiente
                                      let badgeClass, badgeIcon;
                                      if (contada) {
                                        badgeClass = 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200';
                                        badgeIcon = <CheckCircle size={12} />;
                                      } else if (sinStock) {
                                        badgeClass = 'bg-amber-100 text-amber-600 border border-amber-200';
                                        badgeIcon = <span className="text-[10px]">—</span>;
                                      } else {
                                        badgeClass = 'bg-slate-100 text-slate-400';
                                        badgeIcon = <X size={12} />;
                                      }

                                      return (
                                        <div key={cat.value}
                                          onClick={handleClickCategoria}
                                          title={sinStock && !contada ? 'Sin stock en esta sucursal' : ''}
                                          className={`flex items-center gap-1 text-xs p-2 rounded cursor-pointer transition-colors ${badgeClass}`}>
                                          {badgeIcon}
                                          <span className="truncate">{cat.label}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {/* Botón Ver Todas las Diferencias */}
                                  {totalDiferencias > 0 && (
                                    <div className="mt-3 flex justify-end">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const todasDiferencias = [];
                                          recuentosSucursal.forEach(r => {
                                            const difs = JSON.parse(r.diferencias_encontradas || '[]');
                                            const catLabel = todasLasCategorias.find(c => c.value === r.categoria)?.label || r.categoria;
                                            difs.forEach(d => todasDiferencias.push({ ...d, categoriaLabel: catLabel, categoriaValue: r.categoria }));
                                          });
                                          setModalDiferencias({
                                            diferencias: todasDiferencias,
                                            titulo: `Diferencias - ${sucursal} - ${mesData.label}`,
                                            sucursal,
                                            mes: mesData.label
                                          });
                                        }}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded hover:bg-slate-200 transition-colors text-xs font-medium"
                                      >
                                        <AlertTriangle size={14} />
                                        Ver todas las diferencias ({totalDiferencias})
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>

        {/* Modal de Diferencias Consolidadas del Mes */}
        {modalDiferencias && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-4 border-b bg-slate-800 text-white rounded-t-lg">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <AlertTriangle size={20} />
                    {modalDiferencias.titulo}
                  </h3>
                  <p className="text-sm text-slate-300">{modalDiferencias.diferencias.length} diferencias encontradas</p>
                </div>
                <button onClick={() => setModalDiferencias(null)} className="p-2 hover:bg-slate-700 rounded">
                  <X size={20} />
                </button>
              </div>
              <div className="overflow-auto flex-1 p-4">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 sticky top-0">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium">Categoría</th>
                      <th className="text-left py-2 px-3 font-medium">Producto</th>
                      <th className="text-left py-2 px-3 font-medium">Serial</th>
                      <th className="text-center py-2 px-3 font-medium">Sistema</th>
                      <th className="text-center py-2 px-3 font-medium">Real</th>
                      <th className="text-center py-2 px-3 font-medium">Diferencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {modalDiferencias.diferencias.map((dif, idx) => {
                      const difCantidad = (dif.stockReal || 0) - (dif.stockSistema || 0);
                      return (
                        <tr key={idx} className={difCantidad < 0 ? 'bg-red-50' : 'bg-amber-50'}>
                          <td className="py-2 px-3">
                            <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
                              {dif.categoriaLabel || '-'}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-800">{dif.nombre || '-'}</td>
                          <td className="py-2 px-3 text-xs text-slate-500 font-mono">{dif.serial || '-'}</td>
                          <td className="text-center py-2 px-3">{dif.stockSistema ?? '-'}</td>
                          <td className="text-center py-2 px-3">{dif.stockReal ?? '-'}</td>
                          <td className={`text-center py-2 px-3 font-bold ${difCantidad < 0 ? 'text-red-600' : 'text-amber-600'}`}>
                            {difCantidad > 0 ? '+' : ''}{difCantidad}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {modalDiferencias.diferencias.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <CheckCircle size={32} className="mx-auto mb-2 text-emerald-400" />
                    <p>No se encontraron diferencias</p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t bg-slate-50 flex justify-between items-center">
                <div className="text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-3 bg-red-100 border border-red-300 rounded"></span> Faltante
                  </span>
                  <span className="inline-flex items-center gap-1 ml-4">
                    <span className="w-3 h-3 bg-amber-100 border border-amber-300 rounded"></span> Sobrante
                  </span>
                </div>
                <button onClick={() => setModalDiferencias(null)} className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-800">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-slate-100 border-l-4 border-slate-400 p-4 mt-6 rounded">
            <span className="text-slate-800">{error}</span>
          </div>
        )}

        {/* Modal de Productos del Recuento */}
        {modalProductos && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-4 border-b bg-slate-800 text-white rounded-t-lg">
                <div>
                  <h3 className="text-lg font-semibold">{modalProductos.titulo}</h3>
                  <p className="text-sm text-slate-300">{modalProductos.productos.length} productos • {modalProductos.fecha}</p>
                </div>
                <button onClick={() => setModalProductos(null)} className="p-2 hover:bg-slate-700 rounded">
                  <X size={20} />
                </button>
              </div>
              <div className="overflow-auto flex-1 p-4">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 sticky top-0">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium">Producto</th>
                      <th className="text-right py-2 px-3 font-medium">P. Compra</th>
                      <th className="text-right py-2 px-3 font-medium">+ Costos</th>
                      <th className="text-right py-2 px-3 font-medium">Costo Total</th>
                      <th className="text-right py-2 px-3 font-medium">P. Venta</th>
                      <th className="text-center py-2 px-3 font-medium">F. Ingreso</th>
                      <th className="text-left py-2 px-3 font-medium">Proveedor</th>
                      <th className="text-center py-2 px-3 font-medium">Sist.</th>
                      <th className="text-center py-2 px-3 font-medium">Real</th>
                      <th className="text-center py-2 px-3 font-medium">Dif.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {modalProductos.productos.map((prod, idx) => {
                      const costoTotal = (prod.precioCompraUSD || 0) + (prod.costosAdicionales || 0);
                      const dif = (prod.stockReal || 0) - (prod.stockSistema || 0);
                      return (
                        <tr key={idx} className={dif !== 0 ? 'bg-amber-50' : ''}>
                          <td className="py-2 px-3">
                            <div className="font-medium text-slate-800">{prod.nombre || prod.copyCompleto?.split('\n')[0] || 'Sin nombre'}</div>
                            <div className="text-xs text-slate-500">Serial: {prod.serial}</div>
                          </td>
                          <td className="text-right py-2 px-3 text-slate-700">${prod.precioCompraUSD || 0}</td>
                          <td className="text-right py-2 px-3 text-slate-500">{prod.costosAdicionales > 0 ? `+$${prod.costosAdicionales}` : '-'}</td>
                          <td className="text-right py-2 px-3 font-medium text-slate-800">${costoTotal}</td>
                          <td className="text-right py-2 px-3 text-emerald-600 font-medium">${prod.precioVentaUSD || 0}</td>
                          <td className="text-center py-2 px-3 text-xs text-slate-600">{prod.fechaIngreso || '-'}</td>
                          <td className="text-left py-2 px-3 text-xs text-slate-600 max-w-[100px] truncate">{prod.proveedor || '-'}</td>
                          <td className="text-center py-2 px-3">{prod.stockSistema}</td>
                          <td className="text-center py-2 px-3">{prod.stockReal}</td>
                          <td className={`text-center py-2 px-3 font-medium ${dif === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {dif > 0 ? '+' : ''}{dif}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t bg-slate-50 flex justify-between items-center">
                <div className="text-sm text-slate-600">
                  <span className="font-medium">{modalProductos.productos.filter(p => p.stockReal !== p.stockSistema).length}</span> diferencias encontradas
                </div>
                <button onClick={() => setModalProductos(null)} className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-800">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


