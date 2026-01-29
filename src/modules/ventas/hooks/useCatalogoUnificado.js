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
    categoria: '',
    subcategoria: '', // Para filtrar subcategorías en Apple
    almacenamiento: '',
    pantalla: '', // Para filtrar por tamaño/rango de pantalla en notebooks
    idioma_teclado: '', // Para filtrar por idioma de teclado en notebooks
    ram: '' // Para filtrar por RAM en notebooks
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
        filtrosDisponibles: ['marca', 'condicion', 'estado', 'sucursal', 'pantalla', 'idioma_teclado', 'precio', 'linea_procesador'],
        camposOrdenamiento: [
          { value: 'modelo-asc', label: 'Nombre (A-Z)' },
          { value: 'precio_venta_usd-asc', label: 'Precio menor a mayor' },
          { value: 'precio_venta_usd-desc', label: 'Precio mayor a menor' },
          { value: 'marca-asc', label: 'Marca' },
          { value: 'condicion-asc', label: 'Condición' },
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
          { value: 'modelo-asc', label: 'Modelo (A-Z)' },
          { value: 'modelo-desc', label: 'Modelo (Z-A)' },
          { value: 'color-asc', label: 'Color (A-Z)' },
          { value: 'color-desc', label: 'Color (Z-A)' },
          { value: 'almacenamiento-asc', label: 'Almacenamiento (menor a mayor)' },
          { value: 'almacenamiento-desc', label: 'Almacenamiento (mayor a menor)' },
          { value: 'precio_venta_usd-asc', label: 'Precio menor a mayor' },
          { value: 'precio_venta_usd-desc', label: 'Precio mayor a menor' },
          { value: 'marca-asc', label: 'Marca' },
          { value: 'condicion-asc', label: 'Condición' },
          { value: 'ingreso-desc', label: 'Fecha de ingreso (más reciente)' },
          { value: 'ingreso-asc', label: 'Fecha de ingreso (más antigua)' }
        ]
      }
    };

    // Agregar categoría "Otros" que incluye todos los productos de "otros"
    // Esta será la única categoría principal para "otros", las subcategorías se manejan con filtros
    base['otros'] = {
      id: 'otros',
      label: 'Otros',
      icon: '📦',
      data: otros, // Todos los productos de "otros"
      loading: loadingOtros,
      error: errorOtros,
      fetch: fetchOtros,
      delete: deleteOtro,
      update: updateOtro,
      filtrosDisponibles: ['marca', 'condicion', 'color', 'precio'],
      camposOrdenamiento: [
        { value: 'nombre_producto-asc', label: 'Nombre (A-Z)' },
        { value: 'precio_venta_usd-asc', label: 'Precio menor a mayor' },
        { value: 'precio_venta_usd-desc', label: 'Precio mayor a menor' },
        { value: 'marca-asc', label: 'Marca' },
        { value: 'condicion-asc', label: 'Condición' },
        { value: 'categoria-asc', label: 'Categoría' },
        { value: 'ingreso-desc', label: 'Fecha de ingreso (más reciente)' },
        { value: 'ingreso-asc', label: 'Fecha de ingreso (más antigua)' }
      ]
    };

    // Agregar categoría "Apple" que combina productos Apple de todas las tablas
    const appleNotebooks = computers.filter(item => item.marca?.toUpperCase() === 'APPLE');
    const appleCelulares = celulares.filter(item => item.marca?.toUpperCase() === 'APPLE');

    // Para productos Apple en "otros", detectar si son realmente Macbooks o iPhones mal clasificados
    const appleOtrosReales = [];
    const appleOtrosMacbooks = [];
    const appleOtrosiPhones = [];

    otros.filter(item => item.marca?.toUpperCase() === 'APPLE').forEach(item => {
      const nombreProducto = (item.nombre_producto || '').toUpperCase();

      if (nombreProducto.includes('MACBOOK') || nombreProducto.includes('MAC BOOK') ||
        nombreProducto.includes('IMAC') || nombreProducto.includes('MAC MINI') ||
        nombreProducto.includes('MAC PRO') || nombreProducto.includes('MAC STUDIO')) {
        // Es un Macbook/Mac mal clasificado
        appleOtrosMacbooks.push(item);
      } else if (nombreProducto.includes('IPHONE') || nombreProducto.includes('I PHONE')) {
        // Es un iPhone mal clasificado
        appleOtrosiPhones.push(item);
      } else {
        // Es realmente un accesorio Apple
        appleOtrosReales.push(item);
      }
    });

    // Combinar todos los productos Apple con un campo adicional para identificar su origen
    // Reclasificar automáticamente los productos mal clasificados
    const appleProducts = [
      // Notebooks de la tabla correcta
      ...appleNotebooks.map(item => ({ ...item, _tipoProducto: 'notebooks', _tablaOrigen: 'inventario' })),
      // Macbooks mal clasificados en "otros" -> reclasificar como notebooks
      ...appleOtrosMacbooks.map(item => ({ ...item, _tipoProducto: 'notebooks', _tablaOrigen: 'otros_reclasificado' })),
      // Celulares de la tabla correcta
      ...appleCelulares.map(item => ({ ...item, _tipoProducto: 'celulares', _tablaOrigen: 'celulares' })),
      // iPhones mal clasificados en "otros" -> reclasificar como celulares
      ...appleOtrosiPhones.map(item => ({ ...item, _tipoProducto: 'celulares', _tablaOrigen: 'otros_reclasificado' })),
      // Accesorios Apple reales
      ...appleOtrosReales.map(item => ({ ...item, _tipoProducto: 'otros', _tablaOrigen: 'otros' }))
    ];

    // Log de productos Apple para debugging
    console.log('🍎 Productos Apple detectados:');
    console.log('  - Macbooks (tabla inventario):', appleNotebooks.length, appleNotebooks.map(p => p.modelo || p.nombre_producto));
    console.log('  - Macbooks reclasificados (estaban en otros):', appleOtrosMacbooks.length, appleOtrosMacbooks.map(p => p.nombre_producto));
    console.log('  - iPhones (tabla celulares):', appleCelulares.length, appleCelulares.map(p => p.modelo || p.nombre_producto));
    console.log('  - iPhones reclasificados (estaban en otros):', appleOtrosiPhones.length, appleOtrosiPhones.map(p => p.nombre_producto));
    console.log('  - Accesorios Apple (tabla otros):', appleOtrosReales.length, appleOtrosReales.map(p => p.nombre_producto));

    base['apple'] = {
      id: 'apple',
      label: 'Apple',
      icon: '🍎',
      data: appleProducts,
      loading: loadingNotebooks || loadingCelulares || loadingOtros,
      error: errorNotebooks || errorCelulares || errorOtros,
      fetch: () => {
        fetchComputers();
        fetchCelulares();
        fetchOtros();
      },
      delete: async (id, tipoProducto) => {
        // Determinar qué función delete usar según el tipo de producto
        if (tipoProducto === 'notebooks') return deleteComputer(id);
        if (tipoProducto === 'celulares') return deleteCelular(id);
        if (tipoProducto === 'otros') return deleteOtro(id);
      },
      update: async (id, datos, tipoProducto) => {
        // Determinar qué función update usar según el tipo de producto
        if (tipoProducto === 'notebooks') return updateComputer(id, datos);
        if (tipoProducto === 'celulares') return updateCelular(id, datos);
        if (tipoProducto === 'otros') return updateOtro(id, datos);
      },
      filtrosDisponibles: ['subcategoria', 'condicion', 'precio'],
      camposOrdenamiento: [
        { value: 'modelo-asc', label: 'Nombre (A-Z)' },
        { value: 'precio_venta_usd-asc', label: 'Precio menor a mayor' },
        { value: 'precio_venta_usd-desc', label: 'Precio mayor a menor' },
        { value: 'condicion-asc', label: 'Condición' },
        { value: 'ingreso-desc', label: 'Fecha de ingreso (más reciente)' },
        { value: 'ingreso-asc', label: 'Fecha de ingreso (más antigua)' }
      ],
      subcategorias: [
        { value: 'notebooks', label: 'Macbooks' },
        { value: 'celulares', label: 'iPhones' },
        { value: 'otros', label: 'Otros' }
      ]
    };

    console.log('🏷️ Categorías finales generadas:', Object.keys(base));
    console.log('🍎 Total productos Apple:', appleProducts.length);
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

    // Almacenamiento: para celulares es 'capacidad', para notebooks es 'ssd'
    const almacenamientos = categoriaActiva === 'celulares'
      ? [...new Set(datosActuales.map(item => item.capacidad).filter(Boolean))]
      : categoriaActiva === 'notebooks'
        ? [...new Set(datosActuales.map(item => {
          // Normalizar a string para comparación consistente
          const ssd = item.ssd;
          if (!ssd) return null;
          const ssdStr = String(ssd);
          return ssdStr.includes('x') ? null : ssdStr;
        }).filter(Boolean))].sort((a, b) => {
          // Ordenar numéricamente (ya sin GB)
          const numA = parseInt(a) || 0;
          const numB = parseInt(b) || 0;
          return numA - numB;
        })
        : [];

    // Para notebooks: rangos de pantalla predefinidos
    const rangosPantalla = ['<13', '13-14', '14-15', '15-16', '>16'];

    // Para notebooks: RAM y idiomas de teclado
    const rams = categoriaActiva === 'notebooks'
      ? [...new Set(datosActuales.map(item => {
        // Normalizar valores de RAM: "8GB" -> "8", "16 GB" -> "16", etc.
        const ram = item.ram ? item.ram.toString().trim() : '';
        const match = ram.match(/^(\d+)\s*(GB)?$/i);
        return match ? match[1] : null;
      }).filter(Boolean))].sort((a, b) => {
        // Ordenar numéricamente
        const numA = parseInt(a) || 0;
        const numB = parseInt(b) || 0;
        return numA - numB;
      })
      : [];
    const idiomasTeclado = categoriaActiva === 'notebooks' ? [...new Set(datosActuales.map(item => item.idioma_teclado).filter(Boolean))] : [];
    const colores = [...new Set(datosActuales.map(item => item.color).filter(Boolean))];

    return {
      marcas: marcas.sort(),
      condiciones: condiciones.sort(),
      estados: estados.sort(),
      sucursales: sucursales.sort(),
      categorias: categorias.sort(),
      colores: colores.sort(),
      precioMin,
      precioMax,
      almacenamientos,
      rangosPantalla, // Rangos predefinidos para notebooks
      rams, // RAM para notebooks
      idiomasTeclado: idiomasTeclado.sort()
    };
  }, [datosActuales, categoriaActiva]);

  // Aplicar filtros y ordenamiento (PRINCIPAL)
  const datosFilteredAndSorted = useMemo(() => {
    console.log('🔍 Iniciando filtrado. Categoría activa:', categoriaActiva);
    console.log('🔍 Filtros actuales:', filtrosUnificados);
    console.log('🔍 Datos originales:', datosActuales.length);

    let filtered = [...datosActuales];

    // Aplicar filtros
    if (filtrosUnificados.marca) {
      filtered = filtered.filter(item => item.marca === filtrosUnificados.marca);
    }

    if (filtrosUnificados.condicion) {
      filtered = filtered.filter(item => item.condicion === filtrosUnificados.condicion);
    }

    if (filtrosUnificados.color) {
      filtered = filtered.filter(item => item.color === filtrosUnificados.color);
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

        const sucursalItem = item.ubicacion || item.sucursal || '';
        const sucursalFiltro = filtrosUnificados.sucursal;
        return sucursalItem === sucursalFiltro;
      });
    }

    // Filtrar por almacenamiento
    if (categoriaActiva === 'celulares' && filtrosUnificados.almacenamiento) {
      filtered = filtered.filter(item => item.capacidad === filtrosUnificados.almacenamiento);
    }

    if (categoriaActiva === 'notebooks' && filtrosUnificados.almacenamiento) {
      filtered = filtered.filter(item => {
        // Normalizar a string para comparación consistente
        const ssdStr = item.ssd ? String(item.ssd) : '';
        return ssdStr === filtrosUnificados.almacenamiento;
      });
    }

    // Filtrar por RAM (notebooks)
    if (categoriaActiva === 'notebooks' && filtrosUnificados.ram) {
      filtered = filtered.filter(item => {
        // Normalizar el valor de RAM del producto para comparación
        const ramProducto = item.ram ? item.ram.toString().trim() : '';
        const matchProducto = ramProducto.match(/^(\d+)\s*(GB)?$/i);
        const ramNormalizado = matchProducto ? matchProducto[1] : '';
        return ramNormalizado === filtrosUnificados.ram;
      });
    }

    // Filtrar por pantalla con rangos (notebooks)
    if (categoriaActiva === 'notebooks' && filtrosUnificados.pantalla) {
      filtered = filtered.filter(item => {
        const pantalla = item.pantalla ? parseFloat(item.pantalla) : 0;
        const rango = filtrosUnificados.pantalla;

        if (rango === '<13') return pantalla < 13;
        if (rango === '13-14') return pantalla >= 13 && pantalla < 14;
        if (rango === '14-15') return pantalla >= 14 && pantalla < 15;
        if (rango === '15-16') return pantalla >= 15 && pantalla <= 16;
        if (rango === '>16') return pantalla > 16;

        return true;
      });
    }

    // Filtrar por idioma de teclado (notebooks)
    if (categoriaActiva === 'notebooks' && filtrosUnificados.idioma_teclado) {
      filtered = filtered.filter(item => item.idioma_teclado === filtrosUnificados.idioma_teclado);
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

    // Filtrar por subcategoría (específico para Apple)
    if (categoriaActiva === 'apple' && filtrosUnificados.subcategoria) {
      console.log('🔍 Aplicando filtro de subcategoría Apple:', filtrosUnificados.subcategoria);
      filtered = filtered.filter(item => {
        const cumpleFiltro = item._tipoProducto === filtrosUnificados.subcategoria;
        if (!cumpleFiltro) {
          console.log(`❌ Producto filtrado: ${item.id}, _tipoProducto: ${item._tipoProducto}`);
        }
        return cumpleFiltro;
      });
      console.log(`✅ Productos después de filtro Apple: ${filtered.length}`);
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

    // Filtrar por búsqueda (serial, modelo, marca o color)
    if (filtrosUnificados.busqueda) {
      const busquedaLower = filtrosUnificados.busqueda.toLowerCase();
      filtered = filtered.filter(item => {
        const serial = (item.serial || item.imei || '').toLowerCase();
        const modelo = (item.modelo || item.nombre_producto || '').toLowerCase();
        const marca = (item.marca || '').toLowerCase();
        const color = (item.color || '').toLowerCase();
        return serial.includes(busquedaLower) ||
          modelo.includes(busquedaLower) ||
          marca.includes(busquedaLower) ||
          color.includes(busquedaLower);
      });
    }

    // Aplicar ordenamiento
    if (ordenamiento.campo) {
      filtered.sort((a, b) => {
        // Mapear 'almacenamiento' a 'capacidad' para celulares
        const campoReal = ordenamiento.campo === 'almacenamiento' ? 'capacidad' : ordenamiento.campo;

        let valorA = a[campoReal];
        let valorB = b[campoReal];

        // Manejar precios como números
        if (campoReal === 'precio_venta_usd') {
          valorA = parseFloat(valorA) || 0;
          valorB = parseFloat(valorB) || 0;
        }

        // Manejar almacenamiento/capacidad como números (extraer GB)
        if (campoReal === 'capacidad' || campoReal === 'almacenamiento') {
          // Extraer número de GB/TB de strings como "128GB", "256 GB", "1TB"
          const extraerNumeroAlmacenamiento = (str) => {
            if (!str) return 0;
            const match = str.toString().match(/(\d+)\s*(GB|TB|gb|tb)/i);
            if (!match) return 0;
            const numero = parseInt(match[1]);
            const unidad = match[2].toUpperCase();
            // Convertir TB a GB para comparación consistente
            return unidad === 'TB' ? numero * 1024 : numero;
          };

          valorA = extraerNumeroAlmacenamiento(valorA);
          valorB = extraerNumeroAlmacenamiento(valorB);
        }

        // Manejar fechas (ingreso, created_at)
        if (campoReal === 'ingreso' || campoReal === 'created_at') {
          valorA = valorA ? new Date(valorA).getTime() : 0;
          valorB = valorB ? new Date(valorB).getTime() : 0;
        }

        // Manejar strings
        if (typeof valorA === 'string') {
          valorA = valorA.toLowerCase();
          valorB = (valorB || '').toLowerCase();
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
    console.log('🔄 Cambiando categoría de', categoriaActiva, 'a', nuevaCategoria);
    console.log('🧹 Limpiando filtros, subcategoria actual:', filtrosUnificados.subcategoria);

    setCategoriaActiva(nuevaCategoria);

    // Si cambiamos a Apple, activar automáticamente Macbooks
    if (nuevaCategoria === 'apple') {
      setFiltrosUnificados({
        marca: '',
        condicion: '',
        sucursal: '',
        precioMax: '',
        precioMin: '',
        categoria: '',
        busqueda: '',
        subcategoria: 'notebooks', // Activar Macbooks por defecto
        almacenamiento: '',
        pantalla: '',
        idioma_teclado: ''
      });
      console.log('🍎 Apple seleccionado - Activando Macbooks por defecto');
    } else {
      // Para otras categorías, limpiar todos los filtros
      setFiltrosUnificados({
        marca: '',
        condicion: '',
        sucursal: '',
        precioMax: '',
        precioMin: '',
        categoria: '',
        busqueda: '',
        subcategoria: '',
        almacenamiento: '',
        pantalla: '',
        idioma_teclado: ''
      });
    }

    setOrdenamiento({ campo: '', direccion: 'asc' });

    console.log('✅ Filtros configurados');
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
      busqueda: '',
      subcategoria: '',
      almacenamiento: '',
      pantalla: '',
      idioma_teclado: ''
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
  const eliminarProducto = async (id, tipoProducto = null) => {
    const deleteFunction = categoriaConfig?.delete;
    if (deleteFunction) {
      // Para Apple, pasar el tipoProducto
      if (categoriaActiva === 'apple' && tipoProducto) {
        await deleteFunction(id, tipoProducto);
      } else {
        await deleteFunction(id);
      }
    }
  };

  const actualizarProducto = async (id, datos, tipoProducto = null) => {
    const updateFunction = categoriaConfig?.update;
    if (updateFunction) {
      // Para Apple, pasar el tipoProducto
      if (categoriaActiva === 'apple' && tipoProducto) {
        await updateFunction(id, datos, tipoProducto);
      } else {
        await updateFunction(id, datos);
      }
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

  // Función para calcular datos filtrados SIN aplicar filtro de subcategoría/categoría
  // Esto permite contar correctamente los productos por subcategoría considerando
  // los otros filtros activos (marca, condición, ubicación, precio, búsqueda)
  const calcularDatosSinFiltroSubcategoria = useMemo(() => {
    let filtered = [...datosActuales];

    // Aplicar TODOS los filtros EXCEPTO subcategoria y categoria
    if (filtrosUnificados.marca) {
      filtered = filtered.filter(item => item.marca === filtrosUnificados.marca);
    }

    if (filtrosUnificados.condicion) {
      filtered = filtered.filter(item => item.condicion === filtrosUnificados.condicion);
    }

    if (filtrosUnificados.color) {
      filtered = filtered.filter(item => item.color === filtrosUnificados.color);
    }

    if (filtrosUnificados.estado) {
      filtered = filtered.filter(item => item.estado === filtrosUnificados.estado);
    }

    if (filtrosUnificados.sucursal) {
      filtered = filtered.filter(item => {
        if (item.cantidad_la_plata !== undefined || item.cantidad_mitre !== undefined) {
          return true;
        }
        const sucursalItem = item.ubicacion || item.sucursal || '';
        return sucursalItem === filtrosUnificados.sucursal;
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

    // Filtros específicos de notebooks
    // Almacenamiento para notebooks
    if (categoriaActiva === 'notebooks' && filtrosUnificados.almacenamiento) {
      filtered = filtered.filter(item => item.ssd === filtrosUnificados.almacenamiento);
    }

    // RAM para notebooks
    if (categoriaActiva === 'notebooks' && filtrosUnificados.ram) {
      filtered = filtered.filter(item => {
        // Normalizar el valor de RAM del producto para comparación
        const ramProducto = item.ram ? item.ram.toString().trim() : '';
        const matchProducto = ramProducto.match(/^(\d+)\s*(GB)?$/i);
        const ramNormalizado = matchProducto ? matchProducto[1] : '';
        return ramNormalizado === filtrosUnificados.ram;
      });
    }

    // Pantalla con rangos para notebooks
    if (categoriaActiva === 'notebooks' && filtrosUnificados.pantalla) {
      filtered = filtered.filter(item => {
        const pantalla = item.pantalla ? parseFloat(item.pantalla) : 0;
        const rango = filtrosUnificados.pantalla;

        if (rango === '<13') return pantalla < 13;
        if (rango === '13-14') return pantalla >= 13 && pantalla < 14;
        if (rango === '14-15') return pantalla >= 14 && pantalla < 15;
        if (rango === '15-16') return pantalla >= 15 && pantalla <= 16;
        if (rango === '>16') return pantalla > 16;

        return true;
      });
    }

    if (categoriaActiva === 'notebooks' && filtrosUnificados.idioma_teclado) {
      filtered = filtered.filter(item => item.idioma_teclado === filtrosUnificados.idioma_teclado);
    }

    // Para productos "otros", aplicar filtro básico de stock positivo
    if (categoriaActiva === 'otros') {
      filtered = filtered.filter(item => {
        if (item.cantidad_la_plata !== undefined || item.cantidad_mitre !== undefined) {
          return (item.cantidad_la_plata || 0) + (item.cantidad_mitre || 0) > 0;
        }
        return true;
      });
    }

    if (filtrosUnificados.busqueda) {
      const busquedaLower = filtrosUnificados.busqueda.toLowerCase();
      filtered = filtered.filter(item => {
        const serial = (item.serial || item.imei || '').toLowerCase();
        const modelo = (item.modelo || item.nombre_producto || '').toLowerCase();
        const marca = (item.marca || '').toLowerCase();
        const color = (item.color || '').toLowerCase();
        return serial.includes(busquedaLower) ||
          modelo.includes(busquedaLower) ||
          marca.includes(busquedaLower) ||
          color.includes(busquedaLower);
      });
    }

    return filtered;
  }, [datosActuales, filtrosUnificados, categoriaActiva]);

  return {
    // Estado actual
    categoriaActiva,
    categoriaConfig,
    categorias,

    // Datos
    datos: datosFilteredAndSorted,
    datosOriginales: datosActuales,
    datosSinFiltroSubcategoria: calcularDatosSinFiltroSubcategoria,
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
    // Para "otros", usar datosSinFiltroSubcategoria que ya aplica el filtro de stock
    // Para otras categorías, usar datosActuales
    totalProductos: categoriaActiva === 'otros' ? calcularDatosSinFiltroSubcategoria.length : datosActuales.length,
    productosFiltrados: datosFilteredAndSorted.length,
    tieneProductos: datosActuales.length > 0,
    hayFiltrosActivos: Object.values(filtrosUnificados).some(valor => valor) || ordenamiento.campo
  };
};