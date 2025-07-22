// Hook unificado para el catálogo de productos
import { useState, useEffect, useMemo } from 'react';
import { useInventario } from './useInventario';
import { useCelulares } from './useCelulares';
import { useOtros } from './useOtros';
import { useProductos } from './useProductos';

export const useCatalogoUnificado = () => {
  const [categoriaActiva, setCategoriaActiva] = useState('notebooks');
  const [filtrosUnificados, setFiltrosUnificados] = useState({
    marca: '',
    condicion: '',
    sucursal: '',
    precioMax: '',
    precioMin: '',
    disponible: '',
    busqueda: ''
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
          { value: 'modelo', label: 'Modelo' },
          { value: 'marca', label: 'Marca' },
          { value: 'precio_venta_usd', label: 'Precio' },
          { value: 'condicion', label: 'Condición' },
          { value: 'fecha_ingreso', label: 'Fecha Ingreso' }
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
          { value: 'modelo', label: 'Modelo' },
          { value: 'marca', label: 'Marca' },
          { value: 'precio_venta_usd', label: 'Precio' },
          { value: 'condicion', label: 'Condición' },
          { value: 'fecha_ingreso', label: 'Fecha Ingreso' }
        ]
      }
    };

    // Generar categorías dinámicamente desde productos
    const categoriasProductos = getCategorias();
    
    const iconosPorCategoria = {
      'desktop': '🖥️',
      'tablets': '📱',
      'gpu': '🎮',
      'apple': '🍎',
      'componentes': '⚡',
      'audio': '🔊',
      'teclados': '⌨️',
      'mouse': '🖱️',
      'monitores': '🖥️',
      'perifericos': '⌨️',
      'cables': '🔌',
      'almacenamiento': '💾',
      'refrigeracion': '❄️',
      'fuentes': '🔋',
      'motherboards': '🔌',
      'procesadores': '⚡',
      'memorias': '🧠',
      'tarjetas-graficas': '🎮'
    };

    // Agregar categorías reales desde productos
    categoriasProductos.forEach(categoria => {
      if (categoria) {
        const categoriaNormalizada = categoria.toLowerCase().replace(/\s+/g, '-');
        const datosCategoria = getProductosPorCategoria(categoria);
        
        base[categoriaNormalizada] = {
          id: categoriaNormalizada,
          label: categoria.charAt(0).toUpperCase() + categoria.slice(1),
          icon: iconosPorCategoria[categoriaNormalizada] || '📦',
          data: datosCategoria,
          loading: loadingProductos,
          error: errorProductos,
          fetch: fetchProductos,
          delete: deleteProductoUnificado,
          update: updateProductoUnificado,
          filtrosDisponibles: ['marca', 'condicion', 'precio'],
          camposOrdenamiento: [
            { value: 'nombre', label: 'Nombre' },
            { value: 'marca', label: 'Marca' },
            { value: 'precio_venta_usd', label: 'Precio' },
            { value: 'condicion', label: 'Condición' },
            { value: 'created_at', label: 'Fecha' }
          ]
        };
      }
    });

    // Generar categorías para "otros" basadas en las categorías únicas
    const categoriasUnicas = [...new Set(otros.map(item => item.categoria).filter(Boolean))];
    
    categoriasUnicas.forEach(categoria => {
      if (categoria) {
        const categoriaNormalizada = categoria.toLowerCase().replace(/\s+/g, '-');
        const datosCategoria = otros.filter(item => item.categoria === categoria);
        
        // Iconos por categoría
        const iconos = {
          'placas de video': '🎮',
          'procesadores': '⚡',
          'memorias': '💾',
          'discos': '💿',
          'mothers': '🔌',
          'fuentes': '🔋',
          'gabinetes': '🏠',
          'monitores': '🖥️',
          'perifericos': '⌨️',
          'cables': '🔗',
          'cooling': '❄️',
          'audio': '🔊'
        };
        
        base[`otros-${categoriaNormalizada}`] = {
          id: `otros-${categoriaNormalizada}`,
          label: categoria.charAt(0).toUpperCase() + categoria.slice(1),
          icon: iconos[categoria.toLowerCase()] || '🔧',
          data: datosCategoria,
          loading: loadingOtros,
          error: errorOtros,
          fetch: fetchOtros,
          delete: deleteOtro,
          update: updateOtro,
          categoriaFiltro: categoria,
          filtrosDisponibles: ['marca', 'condicion', 'precio'],
          camposOrdenamiento: [
            { value: 'nombre_producto', label: 'Nombre' },
            { value: 'marca', label: 'Marca' },
            { value: 'precio_venta_usd', label: 'Precio' },
            { value: 'condicion', label: 'Condición' }
          ]
        };
      }
    });

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
    const sucursales = [...new Set(datosActuales.map(item => 
      item.ubicacion || item.sucursal
    ).filter(Boolean))];
    
    // Para categorías específicas, extraer categorías de productos
    const categorias = [...new Set(datosActuales.map(item => item.categoria).filter(Boolean))];

    const precioMin = Math.min(...datosActuales.map(item => parseFloat(item.precio_venta_usd) || 0));
    const precioMax = Math.max(...datosActuales.map(item => parseFloat(item.precio_venta_usd) || 0));

    return {
      marcas: marcas.sort(),
      condiciones: condiciones.sort(),
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

    if (filtrosUnificados.sucursal) {
      filtered = filtered.filter(item => 
        (item.ubicacion || item.sucursal) === filtrosUnificados.sucursal
      );
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

    // Para "otros", filtrar por categoría
    if (categoriaActiva === 'otros' && filtrosUnificados.categoria) {
      filtered = filtered.filter(item => item.categoria === filtrosUnificados.categoria);
    }

    // Filtrar por disponibilidad
    if (filtrosUnificados.disponible !== '') {
      const disponibleValue = filtrosUnificados.disponible === 'true';
      filtered = filtered.filter(item => {
        // Determinar disponibilidad basada en condición
        const condicionesNoDisponibles = ['reparacion', 'reservado', 'prestado', 'sin_reparacion'];
        const esNoDisponiblePorCondicion = condicionesNoDisponibles.includes(item.condicion);
        const disponibilidadCalculada = item.disponible !== false && !esNoDisponiblePorCondicion;
        return disponibilidadCalculada === disponibleValue;
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
      disponible: '',
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
      disponible: '',
      busqueda: ''
    });
    setOrdenamiento({ campo: '', direccion: 'asc' });
  };

  const actualizarOrdenamiento = (campo, direccion = 'asc') => {
    setOrdenamiento({ campo, direccion });
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

  // Cargar datos al cambiar categoría
  useEffect(() => {
    const fetchFunction = categoriaConfig?.fetch;
    if (fetchFunction) {
      fetchFunction();
    }
  }, [categoriaActiva]);

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