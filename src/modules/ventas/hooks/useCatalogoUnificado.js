// Hook unificado para el catálogo de productos
import { useState, useEffect, useMemo } from 'react';
import { useInventario } from './useInventario';
import { useCelulares } from './useCelulares';
import { useOtros } from './useOtros';
import { useProductos } from './useProductos';
import {
  CATEGORIAS_OTROS,
  CATEGORIAS_OTROS_ARRAY,
  getCategoriaLabel
} from '../../../shared/constants/categoryConstants';

export const useCatalogoUnificado = () => {
  const [categoriaActiva, setCategoriaActiva] = useState('notebooks');
  const [filtrosUnificados, setFiltrosUnificados] = useState({
    marca: '',
    condicion: '',
    estado: '',
    sucursal: '',
    precioMax: '',
    precioMin: '',
    busqueda: '',
    categoria: ''
  });
  const [ordenamiento, setOrdenamiento] = useState({
    campo: '',
    direccion: 'asc'
  });
  const [categoriasOtros, setCategoriasOtros] = useState([]);

  // Hooks de datos por categoría
  const {
    computers,
    loading: loadingNotebooks,
    error: errorNotebooks,
    fetchComputers,
    deleteComputer,
    updateComputer
  } = useInventario();

  const {
    celulares,
    loading: loadingCelulares,
    error: errorCelulares,
    fetchCelulares,
    deleteCelular,
    updateCelular
  } = useCelulares();

  const {
    otros,
    loading: loadingOtros,
    error: errorOtros,
    fetchOtros,
    deleteOtro,
    updateOtro
  } = useOtros();

  // Hook para productos unificados
  const {
    productos,
    loading: loadingProductos,
    error: errorProductos,
    fetchProductos,
    deleteProducto: deleteProductoUnificado,
    updateProducto: updateProductoUnificado,
    getProductosPorCategoria,
    getCategorias
  } = useProductos();

  // Generar categorías dinámicamente
  const categoriasBase = useMemo(() => {
    const base = {
      notebooks: {
        id: 'notebooks',
        label: 'Notebooks',
        icon: '💻',
        data: computers,
        loading: loadingNotebooks,
        error: errorNotebooks,
        fetch: fetchComputers,
        delete: deleteComputer,
        update: updateComputer,
        filtrosDisponibles: ['marca', 'condicion', 'sucursal', 'precio'],
        camposOrdenamiento: [
          { value: 'modelo-asc', label: 'Nombre (A-Z)' },
          { value: 'precio_venta_usd-asc', label: 'Precio menor a mayor' },
          { value: 'precio_venta_usd-desc', label: 'Precio mayor a menor' },
          { value: 'marca', label: 'Marca' },
          { value: 'condicion', label: 'Condición' },
          { value: 'ingreso-desc', label: 'Fecha de ingreso (más reciente)' },
          { value: 'ingreso-asc', label: 'Fecha de ingreso (más antigua)' }
        ]
      },
      celulares: {
        id: 'celulares',
        label: 'Celulares',
        icon: '📱',
        data: celulares,
        loading: loadingCelulares,
        error: errorCelulares,
        fetch: fetchCelulares,
        delete: deleteCelular,
        update: updateCelular,
        filtrosDisponibles: ['marca', 'condicion', 'ubicacion', 'precio'],
        camposOrdenamiento: [
          { value: 'modelo-asc', label: 'Nombre (A-Z)' },
          { value: 'precio_venta_usd-asc', label: 'Precio menor a mayor' },
          { value: 'precio_venta_usd-desc', label: 'Precio mayor a menor' },
          { value: 'marca', label: 'Marca' },
          { value: 'condicion', label: 'Condición' },
          { value: 'ingreso-desc', label: 'Fecha de ingreso (más reciente)' },
          { value: 'ingreso-asc', label: 'Fecha de ingreso (más antigua)' }
        ]
      }
    };

    // Agregar categoría "Otros productos" que incluye todos los productos de "otros"
    // Esta será la única categoría principal para "otros", las subcategorías se manejan con filtros
    base['otros'] = {
      id: 'otros',
      label: 'Otros productos',
      icon: '📦',
      data: otros, // Todos los productos de "otros"
      loading: loadingOtros,
      error: errorOtros,
      fetch: fetchOtros,
      delete: deleteOtro,
      update: updateOtro,
      filtrosDisponibles: ['marca', 'condicion', 'precio'],
      camposOrdenamiento: [
        { value: 'nombre_producto-asc', label: 'Nombre (A-Z)' },
        { value: 'precio_venta_usd-asc', label: 'Precio menor a mayor' },
        { value: 'precio_venta_usd-desc', label: 'Precio mayor a menor' },
        { value: 'marca', label: 'Marca' },
        { value: 'condicion', label: 'Condición' },
        { value: 'categoria', label: 'Categoría' },
        { value: 'ingreso-desc', label: 'Fecha de ingreso (más reciente)' },
        { value: 'ingreso-asc', label: 'Fecha de ingreso (más antigua)' }
      ]
    };

    console.log('🏷️ Categorías finales generadas:', Object.keys(base));
    return base;
  }, [computers, celulares, otros, productos, loadingNotebooks, loadingCelulares, loadingOtros, loadingProductos, errorNotebooks, errorCelulares, errorOtros, errorProductos, getCategorias, getProductosPorCategoria]);

  const categorias = categoriasBase;

  // Obtener configuración de la categoría activa
  const categoriaConfig = categorias[categoriaActiva];

  // Datos y estado actuales
  const datosActuales = categoriaConfig?.data || [];
  const loading = categoriaConfig?.loading || false;
  const error = categoriaConfig?.error || null;

  // Generar valores únicos para filtros
  const valoresUnicos = useMemo(() => {
    if (!datosActuales.length) return {};

    const marcas = [...new Set(datosActuales.map(item => item.marca).filter(Boolean))];
    const condiciones = [...new Set(datosActuales.map(item => item.condicion).filter(Boolean))];
    const estados = [...new Set(datosActuales.map(item => item.estado).filter(Boolean))];
    const sucursales = [...new Set(datosActuales.map(item => {
      // Para productos "otros" que usan cantidad_la_plata y cantidad_mitre
      if (item.cantidad_la_plata !== undefined || item.cantidad_mitre !== undefined) {
        const sucursalesConStock = [];
        if ((item.cantidad_la_plata || 0) > 0) sucursalesConStock.push('LA PLATA');
        if ((item.cantidad_mitre || 0) > 0) sucursalesConStock.push('MITRE');
        return sucursalesConStock;
      }
      
      // Para notebooks y celulares que usan ubicacion/sucursal
      const sucursal = item.ubicacion || item.sucursal;
      return sucursal || null;
    }).flat().filter(Boolean))];
    
    // Para categorías específicas, extraer categorías de productos
    const categorias = [...new Set(datosActuales.map(item => item.categoria).filter(Boolean))];

    const precioMin = Math.min(...datosActuales.map(item => parseFloat(item.precio_venta_usd) || 0));
    const precioMax = Math.max(...datosActuales.map(item => parseFloat(item.precio_venta_usd) || 0));

    return {
      marcas: marcas.sort(),
      condiciones: condiciones.sort(),
      estados: estados.sort(),
      sucursales: sucursales.sort(),
      categorias: categorias.sort(),
      precioMin,
      precioMax
    };
  }, [datosActuales, categoriaActiva]);

  // Aplicar filtros y ordenamiento
  const datosFilteredAndSorted = useMemo(() => {
    let filtered = [...datosActuales];

    // Aplicar filtros
    if (filtrosUnificados.marca) {
      filtered = filtered.filter(item => item.marca === filtrosUnificados.marca);
    }

    if (filtrosUnificados.condicion) {
      filtered = filtered.filter(item => item.condicion === filtrosUnificados.condicion);
    }

    if (filtrosUnificados.estado) {
      filtered = filtered.filter(item => item.estado === filtrosUnificados.estado);
    }

    if (filtrosUnificados.sucursal) {
      filtered = filtered.filter(item => {
        // Para productos "otros" que usan cantidad_la_plata y cantidad_mitre
        if (item.cantidad_la_plata !== undefined || item.cantidad_mitre !== undefined) {
          // CAMBIO: Mostrar TODOS los productos "otros" cuando se filtra por sucursal
          // El filtro de ubicación ahora solo organiza visualmente, no filtra por stock
          return true; // Mostrar todos los productos "otros" independientemente del stock
        }
        
        // Para notebooks y celulares que usan ubicacion/sucursal
        const sucursalItem = item.ubicacion || item.sucursal || '';
        const sucursalFiltro = filtrosUnificados.sucursal;
        return sucursalItem === sucursalFiltro;
      });
    }

    if (filtrosUnificados.precioMin) {
      filtered = filtered.filter(item => 
        parseFloat(item.precio_venta_usd) >= parseFloat(filtrosUnificados.precioMin)
      );
    }

    if (filtrosUnificados.precioMax) {
      filtered = filtered.filter(item => 
        parseFloat(item.precio_venta_usd) <= parseFloat(filtrosUnificados.precioMax)
      );
    }

    // Filtrar por categoría
    if (filtrosUnificados.categoria) {
      // Para notebooks: filtrar por categoría de notebook
      if (categoriaActiva === 'notebooks') {
        filtered = filtered.filter(item => item.categoria === filtrosUnificados.categoria);
      }
      // Para celulares: filtrar por categoría de celular
      if (categoriaActiva === 'celulares') {
        filtered = filtered.filter(item => item.categoria === filtrosUnificados.categoria);
      }
      // Para "otros": filtrar por categoría de otros
      if (categoriaActiva === 'otros') {
        filtered = filtered.filter(item => item.categoria === filtrosUnificados.categoria);
      }
    }

    // Para productos "otros", aplicar filtro básico de stock positivo
    if (categoriaActiva === 'otros') {
      filtered = filtered.filter(item => {
        // Mostrar solo productos "otros" que tienen stock en alguna sucursal
        if (item.cantidad_la_plata !== undefined || item.cantidad_mitre !== undefined) {
          return (item.cantidad_la_plata || 0) + (item.cantidad_mitre || 0) > 0;
        }
        return true;
      });
    }

    // Filtrar por búsqueda (serial o modelo)
    if (filtrosUnificados.busqueda) {
      const busquedaLower = filtrosUnificados.busqueda.toLowerCase();
      filtered = filtered.filter(item => {
        const serial = (item.serial || item.imei || '').toLowerCase();
        const modelo = (item.modelo || item.nombre_producto || '').toLowerCase();
        const marca = (item.marca || '').toLowerCase();
        return serial.includes(busquedaLower) || 
               modelo.includes(busquedaLower) ||
               marca.includes(busquedaLower);
      });
    }

    // Aplicar ordenamiento
    if (ordenamiento.campo) {
      filtered.sort((a, b) => {
        let valorA = a[ordenamiento.campo];
        let valorB = b[ordenamiento.campo];

        // Manejar precios como números
        if (ordenamiento.campo === 'precio_venta_usd') {
          valorA = parseFloat(valorA) || 0;
          valorB = parseFloat(valorB) || 0;
        }

        // Manejar fechas (ingreso, created_at)
        if (ordenamiento.campo === 'ingreso' || ordenamiento.campo === 'created_at') {
          valorA = valorA ? new Date(valorA).getTime() : 0;
          valorB = valorB ? new Date(valorB).getTime() : 0;
        }

        // Manejar strings
        if (typeof valorA === 'string') {
          valorA = valorA.toLowerCase();
          valorB = valorB.toLowerCase();
        }

        if (valorA < valorB) return ordenamiento.direccion === 'asc' ? -1 : 1;
        if (valorA > valorB) return ordenamiento.direccion === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [datosActuales, filtrosUnificados, ordenamiento, categoriaActiva]);

  // Funciones de control
  const cambiarCategoria = (nuevaCategoria) => {
    setCategoriaActiva(nuevaCategoria);
    // Limpiar filtros al cambiar categoría
    setFiltrosUnificados({
      marca: '',
      condicion: '',
      sucursal: '',
      precioMax: '',
      precioMin: '',
      categoria: '',
      busqueda: ''
    });
    setOrdenamiento({ campo: '', direccion: 'asc' });
  };

  const actualizarFiltro = (campo, valor) => {
    setFiltrosUnificados(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const limpiarFiltros = () => {
    setFiltrosUnificados({
      marca: '',
      condicion: '',
      sucursal: '',
      precioMax: '',
      precioMin: '',
      categoria: '',
      busqueda: ''
    });
    setOrdenamiento({ campo: '', direccion: 'asc' });
  };

  const actualizarOrdenamiento = (campoCompleto, direccion = 'asc') => {
    // Si el campo viene con sufijo -asc o -desc, extraerlo
    let campo = campoCompleto;
    let dir = direccion;

    if (typeof campoCompleto === 'string') {
      if (campoCompleto.endsWith('-asc')) {
        campo = campoCompleto.replace('-asc', '');
        dir = 'asc';
      } else if (campoCompleto.endsWith('-desc')) {
        campo = campoCompleto.replace('-desc', '');
        dir = 'desc';
      }
    }

    setOrdenamiento({ campo, direccion: dir });
  };

  // Funciones de acción
  const eliminarProducto = async (id) => {
    const deleteFunction = categoriaConfig?.delete;
    if (deleteFunction) {
      await deleteFunction(id);
    }
  };

  const actualizarProducto = async (id, datos) => {
    const updateFunction = categoriaConfig?.update;
    if (updateFunction) {
      await updateFunction(id, datos);
    }
  };

  // Cargar datos iniciales para todas las categorías
  useEffect(() => {
    console.log('🚀 Cargando datos iniciales de todas las categorías...');
    fetchProductos(); // Cargar productos unificados
    fetchComputers(); // Cargar notebooks
    fetchCelulares(); // Cargar celulares
    fetchOtros(); // Cargar otros productos
  }, []);

  // No necesitamos cargar datos individualmente ya que se cargan todos al inicio
  // useEffect(() => {
  //   const fetchFunction = categoriaConfig?.fetch;
  //   if (fetchFunction) {
  //     fetchFunction();
  //   }
  // }, [categoriaActiva]);

  return {
    // Estado actual
    categoriaActiva,
    categoriaConfig,
    categorias,
    
    // Datos
    datos: datosFilteredAndSorted,
    datosOriginales: datosActuales,
    loading,
    error,
    
    // Filtros y ordenamiento
    filtros: filtrosUnificados,
    ordenamiento,
    valoresUnicos,
    
    // Funciones de control
    cambiarCategoria,
    actualizarFiltro,
    limpiarFiltros,
    actualizarOrdenamiento,
    
    // Funciones de acción
    eliminarProducto,
    actualizarProducto,
    
    // Estadísticas
    totalProductos: datosActuales.length,
    productosFiltrados: datosFilteredAndSorted.length,
    tieneProductos: datosActuales.length > 0,
    hayFiltrosActivos: Object.values(filtrosUnificados).some(valor => valor) || ordenamiento.campo
  };
};