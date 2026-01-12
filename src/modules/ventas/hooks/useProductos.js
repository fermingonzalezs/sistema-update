import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export const useProductos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar productos desde la tabla 'otros'
  const fetchProductos = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('otros')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transformar datos para que coincidan con la estructura esperada
      const productosTransformados = (data || []).map(item => ({
        id: item.id,
        nombre: item.nombre_producto,
        descripcion: item.descripcion,
        marca: extractMarca(item.nombre_producto),
        modelo: extractModelo(item.nombre_producto),
        categoria: item.categoria,
        precio_venta_usd: item.precio_venta_usd,
        precio_costo_usd: item.precio_compra_usd,
        stock: item.cantidad,
        condicion: item.condicion,
        estado: item.condicion,
        ubicacion: item.sucursal,
        especificaciones: parseEspecificaciones(item.descripcion, item.categoria),
        garantia: item.garantia,
        fallas: item.fallas,
        activo: item.disponible,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      setProductos(productosTransformados);
    } catch (err) {
      console.error('Error cargando productos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para extraer marca de la descripción
  const extractMarca = (descripcion) => {
    const marcasConocidas = ['Intel', 'AMD', 'NVIDIA', 'Apple', 'Samsung', 'Lenovo', 'ASUS', 'MSI', 'Corsair', 'Kingston', 'WD', 'Seagate', 'LG', 'Sony', 'JBL', 'Logitech', 'Razer', 'HyperX', 'SteelSeries'];
    const desc = descripcion.toLowerCase();
    return marcasConocidas.find(marca => desc.includes(marca.toLowerCase())) || 'Genérica';
  };

  // Función para extraer modelo de la descripción
  const extractModelo = (descripcion) => {
    // Intentar extraer modelo después de la marca
    const palabras = descripcion.split(' ');
    return palabras.length > 1 ? palabras.slice(0, 3).join(' ') : descripcion;
  };

  // Función para parsear especificaciones básicas desde la descripción
  const parseEspecificaciones = (descripcion, categoria) => {
    if (!descripcion) return {};
    const desc = descripcion.toLowerCase();
    const specs = {};

    // Parsear especificaciones comunes según categoría
    switch (categoria) {
      case 'desktop':
        if (desc.includes('intel')) specs.procesador = 'Intel';
        if (desc.includes('amd')) specs.procesador = 'AMD';
        if (desc.includes('ram')) specs.ram = extractValue(desc, 'ram', 'gb');
        if (desc.includes('ssd')) specs.almacenamiento = extractValue(desc, 'ssd', 'gb');
        break;
      case 'tablets':
        if (desc.includes('"')) specs.pantalla = extractValue(desc, '', '"');
        if (desc.includes('mah')) specs.bateria = extractValue(desc, '', 'mah');
        break;
      case 'placas-de-video':
        if (desc.includes('gb')) specs.memoria = extractValue(desc, '', 'gb');
        if (desc.includes('mhz')) specs.boost_clock = extractValue(desc, '', 'mhz');
        break;
      default:
        specs.descripcion = descripcion;
    }

    return specs;
  };

  // Función auxiliar para extraer valores
  const extractValue = (text, prefix, suffix) => {
    const regex = new RegExp(`${prefix}\\s*(\\d+)\\s*${suffix}`, 'i');
    const match = text.match(regex);
    return match ? `${match[1]}${suffix.toUpperCase()}` : '';
  };

  // Cargar productos por categoría
  const fetchProductosPorCategoria = async (categoria) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('otros')
        .select('*')
        .eq('categoria', categoria)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('Error cargando productos por categoría:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Crear producto
  const createProducto = async (producto) => {
    try {
      setError(null);

      // Transformar a estructura de tabla 'otros'
      const nuevoItem = {
        descripcion_producto: producto.nombre || producto.descripcion,
        cantidad: producto.stock || 1,
        precio_compra_usd: producto.precio_costo_usd || 0,
        precio_venta_usd: producto.precio_venta_usd || 0,
        categoria: producto.categoria || 'otros',
        condicion: producto.condicion || 'nueva',
        sucursal: producto.ubicacion || 'la_plata',
        garantia: producto.garantia || '',
        fallas: producto.fallas || ''
      };

      const { data, error } = await supabase
        .from('otros')
        .insert([nuevoItem])
        .select()
        .single();

      if (error) throw error;

      await fetchProductos(); // Recargar productos
      return data;
    } catch (err) {
      console.error('Error creando producto:', err);
      setError(err.message);
      throw err;
    }
  };

  // Actualizar producto
  const updateProducto = async (id, updates) => {
    try {
      setError(null);

      // Transformar updates a estructura de tabla 'otros'
      const updatesTransformados = {};
      if (updates.nombre) updatesTransformados.descripcion_producto = updates.nombre;
      if (updates.stock !== undefined) updatesTransformados.cantidad = updates.stock;
      if (updates.precio_venta_usd !== undefined) updatesTransformados.precio_venta_usd = updates.precio_venta_usd;
      if (updates.precio_costo_usd !== undefined) updatesTransformados.precio_compra_usd = updates.precio_costo_usd;
      if (updates.categoria) updatesTransformados.categoria = updates.categoria;
      if (updates.condicion) updatesTransformados.condicion = updates.condicion;
      if (updates.ubicacion) updatesTransformados.sucursal = updates.ubicacion;
      if (updates.garantia) updatesTransformados.garantia = updates.garantia;
      if (updates.fallas) updatesTransformados.fallas = updates.fallas;

      const { data, error } = await supabase
        .from('otros')
        .update(updatesTransformados)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await fetchProductos(); // Recargar productos
      return data;
    } catch (err) {
      console.error('Error actualizando producto:', err);
      setError(err.message);
      throw err;
    }
  };

  // Eliminar producto (marcar como no disponible)
  const deleteProducto = async (id) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('otros')
        .update({ disponible: false })
        .eq('id', id);

      if (error) throw error;

      setProductos(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error eliminando producto:', err);
      setError(err.message);
      throw err;
    }
  };

  // Actualizar stock
  const updateStock = async (id, nuevoStock) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('otros')
        .update({ cantidad: nuevoStock })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await fetchProductos(); // Recargar productos
      return data;
    } catch (err) {
      console.error('Error actualizando stock:', err);
      setError(err.message);
      throw err;
    }
  };

  // Obtener categorías únicas
  const getCategorias = () => {
    const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
    return categorias.sort();
  };

  // Filtrar productos por categoría
  const getProductosPorCategoria = (categoria) => {
    return productos.filter(p => p.categoria === categoria);
  };

  // Obtener valores únicos para filtros
  const getValoresUnicos = (campo) => {
    const valores = [...new Set(productos.map(p => p[campo]).filter(Boolean))];
    return valores.sort();
  };

  // Buscar productos
  const buscarProductos = (termino) => {
    const terminoLower = termino.toLowerCase();
    return productos.filter(p =>
      p.nombre?.toLowerCase().includes(terminoLower) ||
      p.descripcion?.toLowerCase().includes(terminoLower) ||
      p.marca?.toLowerCase().includes(terminoLower) ||
      p.modelo?.toLowerCase().includes(terminoLower) ||
      p.categoria?.toLowerCase().includes(terminoLower)
    );
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    fetchProductos();
  }, []);

  return {
    // Datos
    productos,
    loading,
    error,

    // Funciones CRUD
    fetchProductos,
    fetchProductosPorCategoria,
    createProducto,
    updateProducto,
    deleteProducto,
    updateStock,

    // Utilidades
    getCategorias,
    getProductosPorCategoria,
    getValoresUnicos,
    buscarProductos
  };
};