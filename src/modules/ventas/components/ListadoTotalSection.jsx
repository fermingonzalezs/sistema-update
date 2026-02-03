import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Package, DollarSign, TrendingUp, Download, ChevronDown, Pencil, Check, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatearMonto } from '../../../shared/utils/formatters';
import { getCategoriaLabel } from '../../../shared/constants/categoryConstants';
import { useInventario } from '../hooks/useInventario';
import { useCelulares } from '../hooks/useCelulares';
import { useOtros } from '../hooks/useOtros';
import * as XLSX from 'xlsx-js-style';

// Cotización mock (en producción vendría de una API)
const COTIZACION_MOCK = 1200;

const ListadoTotalSection = () => {
  // Hooks para obtener datos reales
  const {
    computers,
    loading: loadingNotebooks,
    error: errorNotebooks,
    fetchComputers,
    updateComputer,
    setComputers
  } = useInventario();

  const {
    celulares,
    loading: loadingCelulares,
    error: errorCelulares,
    fetchCelulares,
    updateCelular,
    setCelulares
  } = useCelulares();

  const {
    otros,
    loading: loadingOtros,
    error: errorOtros,
    fetchOtros,
    updateOtro,
    setOtros
  } = useOtros();

  // Estado de carga y error general
  const loading = loadingNotebooks || loadingCelulares || loadingOtros;
  const error = errorNotebooks || errorCelulares || errorOtros;

  // Estados
  const [filtros, setFiltros] = useState({
    busqueda: '',
    categoria: '',
    condicion: '',
    ordenamiento: 'categoria-asc' // Default: categoría ascendente
  });

  // Estado para el menú desplegable de exportar
  const [mostrarMenuExportar, setMostrarMenuExportar] = useState(false);
  const menuExportarRef = useRef(null);

  // Estados para edición inline
  const [filaEditando, setFilaEditando] = useState(null);
  const [valoresEdicion, setValoresEdicion] = useState({
    precioCompra: 0,
    envioRepuestos: 0,
    precioVenta: 0
  });

  // Estados para edición masiva
  const [modoEdicionMasiva, setModoEdicionMasiva] = useState(false);
  const [cambiosMasivos, setCambiosMasivos] = useState(new Map());
  const [guardandoMasivo, setGuardandoMasivo] = useState(false);



  // Cargar datos al montar el componente
  useEffect(() => {
    fetchComputers();
    fetchCelulares();
    fetchOtros();
  }, []);

  // Cerrar menú de exportar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuExportarRef.current && !menuExportarRef.current.contains(event.target)) {
        setMostrarMenuExportar(false);
      }
    };

    if (mostrarMenuExportar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mostrarMenuExportar]);

  //Definicion de emojis para categorías
  const EMOJI_CATEGORIAS = {
    'NOTEBOOKS': '💻',
    'CELULARES': '📱',
    'DESKTOP': '🖥️',
    'ACCESORIOS': '🔌',
    'MONITORES': '📺',
    'COMPONENTES': '⚙️',
    'FUNDAS_TEMPLADOS': '🛡️',
    'TABLETS': '📖',
    'MOUSE_TECLADOS': '⌨️',
    'AUDIO': '🎧',
    'ALMACENAMIENTO': '💾',
    'CAMARAS': '📷',
    'CONSOLAS': '🎮',
    'GAMING': '🎯',
    'DRONES': '🚁',
    'WATCHES': '⌚',
    'PLACAS_VIDEO': '🎨',
    'STREAMING': '📹',
    'REDES': '🌐',
    'BAGS_CASES': '💼',
    'CABLES_CARGADORES': '🔌',
    'MEMORIA': '🧠',
    'REPUESTOS': '🔧',
    'OTROS': '📦'
  };


  // Funciones helper para cálculos
  const calcularDiasEnStock = (fechaIngreso) => {
    if (!fechaIngreso) return null;
    const hoy = new Date();
    const ingreso = new Date(fechaIngreso);
    return Math.floor((hoy - ingreso) / (1000 * 60 * 60 * 24));
  };

  const getColorDias = (dias) => {
    if (dias === null || dias === undefined) return 'bg-gray-100 text-gray-700';
    if (dias <= 30) return 'bg-green-100 text-green-700';
    if (dias <= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const calcularMargen = (precioVenta, costoTotal) => {
    if (!costoTotal || costoTotal === 0) return 0;
    return ((precioVenta - costoTotal) / costoTotal) * 100;
  };

  // Unificar todos los productos en un solo array
  const todosLosProductos = useMemo(() => {
    const productos = [];

    // Agregar notebooks
    computers.forEach(comp => {
      // Agregar TODOS los notebooks sin filtros
      const precioCompraTotal = comp.precio_costo_total || comp.precio_costo_usd || 0;
      const diasEnStock = calcularDiasEnStock(comp.ingreso);
      const margen = calcularMargen(comp.precio_venta_usd || 0, precioCompraTotal);

      productos.push({
        id: `notebook-${comp.id}`,
        idOriginal: comp.id,
        tabla: 'inventario',
        categoria: 'NOTEBOOKS',
        info: `💻 ${comp.modelo} - ${comp.procesador}, ${comp.ram}, ${comp.ssd}, ${comp.pantalla}, ${comp.placa_video}, ${comp.color}`,
        stock: 1,

        // Nuevos campos detallados
        precioCompra: comp.precio_costo_usd || 0,
        envioRepuestos: comp.envios_repuestos || 0,
        precioCompraTotal: precioCompraTotal,
        precioVenta: comp.precio_venta_usd || 0,
        serial: comp.serial || '',
        fechaIngreso: comp.ingreso,
        diasEnStock: diasEnStock,
        margen: margen,

        // Mantener campos legacy para compatibilidad
        precioCompraUSD: precioCompraTotal,
        precioUSD: comp.precio_venta_usd || 0,
        condicion: comp.condicion
      });
    });

    // Agregar celulares
    celulares.forEach(cel => {
      // Agregar TODOS los celulares sin filtros
      let infoAdicional = '';

      if (cel.condicion === 'usado' || cel.condicion === 'refurbished') {
        // Usando cel.estado para la condición estética
        const estetica = cel.estado ? `${cel.estado}` : '';

        const bateria = cel.bateria ? `🔋${cel.bateria}` : '';

        const partesAdicionales = [estetica, bateria].filter(p => p !== '');
        if (partesAdicionales.length > 0) {
          infoAdicional = ` ${partesAdicionales.join(' ')}`;
        }
      }

      const precioCompraTotal = cel.costo_total_usd || cel.precio_compra_usd || 0;
      const diasEnStock = calcularDiasEnStock(cel.ingreso);
      const margen = calcularMargen(cel.precio_venta_usd || 0, precioCompraTotal);

      productos.push({
        id: `celular-${cel.id}`,
        idOriginal: cel.id,
        tabla: 'celulares',
        categoria: 'CELULARES',
        info: `📱 ${cel.modelo} ${cel.capacidad} ${cel.color || ''} ${infoAdicional}`,
        stock: 1,

        // Nuevos campos detallados
        precioCompra: cel.precio_compra_usd || 0,
        envioRepuestos: cel.costos_adicionales || 0,
        precioCompraTotal: precioCompraTotal,
        precioVenta: cel.precio_venta_usd || 0,
        serial: cel.serial || '',
        fechaIngreso: cel.ingreso,
        diasEnStock: diasEnStock,
        margen: margen,

        // Mantener campos legacy para compatibilidad
        precioCompraUSD: precioCompraTotal,
        precioUSD: cel.precio_venta_usd || 0,
        condicion: cel.condicion
      });
    });

    // Agregar otros productos por categoría
    otros.forEach(otro => {
      // Agregar TODOS los otros productos sin filtros
      const stockTotal = (otro.cantidad_la_plata || 0) + (otro.cantidad_mitre || 0);

      // Construir info solo con el nombre del producto (sin marca)
      const info = otro.nombre_producto || '';
      const emoji = EMOJI_CATEGORIAS[otro.categoria] || EMOJI_CATEGORIAS['OTROS'];

      const precioCompraTotal = otro.costo_total_usd || otro.precio_compra_usd || 0;
      const diasEnStock = calcularDiasEnStock(otro.ingreso);
      const margen = calcularMargen(otro.precio_venta_usd || 0, precioCompraTotal);

      productos.push({
        id: `otro-${otro.id}`,
        idOriginal: otro.id,
        tabla: 'otros',
        categoria: otro.categoria || 'OTROS',
        info: `${emoji} ${info.trim()}`,
        stock: stockTotal,

        // Nuevos campos detallados
        precioCompra: otro.precio_compra_usd || 0,
        envioRepuestos: otro.costos_adicionales || 0,
        precioCompraTotal: (otro.precio_compra_usd || 0) + (otro.costos_adicionales || 0),
        precioVenta: otro.precio_venta_usd || 0,
        serial: otro.serial || '',
        fechaIngreso: otro.ingreso,
        diasEnStock: diasEnStock,
        margen: margen,

        // Mantener campos legacy para compatibilidad
        precioCompraUSD: precioCompraTotal,
        precioUSD: otro.precio_venta_usd || 0,
        condicion: otro.condicion
      });
    });

    return productos;
  }, [computers, celulares, otros]);




  // Configuración de colores por categoría
  const coloresCategorias = {
    'NOTEBOOKS': 'bg-blue-100 text-blue-700',
    'CELULARES': 'bg-green-100 text-green-700',
    'DESKTOP': 'bg-slate-100 text-slate-700',
    'MONITORES': 'bg-purple-100 text-purple-700',
    'ACCESORIOS': 'bg-cyan-100 text-cyan-700',
    'COMPONENTES': 'bg-red-100 text-red-700',
    'FUNDAS_TEMPLADOS': 'bg-pink-100 text-pink-700',
    'TABLETS': 'bg-yellow-100 text-yellow-700',
    'MOUSE_TECLADOS': 'bg-orange-100 text-orange-700',
    'AUDIO': 'bg-indigo-100 text-indigo-700',
    'ALMACENAMIENTO': 'bg-teal-100 text-teal-700',
    'CAMARAS': 'bg-rose-100 text-rose-700',
    'CONSOLAS': 'bg-violet-100 text-violet-700',
    'GAMING': 'bg-fuchsia-100 text-fuchsia-700',
    'DRONES': 'bg-sky-100 text-sky-700',
    'WATCHES': 'bg-amber-100 text-amber-700',
    'PLACAS_VIDEO': 'bg-lime-100 text-lime-700',
    'STREAMING': 'bg-emerald-100 text-emerald-700',
    'REDES': 'bg-blue-100 text-blue-700',
    'BAGS_CASES': 'bg-slate-100 text-slate-700',
    'CABLES_CARGADORES': 'bg-cyan-100 text-cyan-700',
    'MEMORIA': 'bg-fuchsia-100 text-fuchsia-700',
    'REPUESTOS': 'bg-gray-100 text-gray-700'
  };

  // Configuración de colores por condición
  const coloresCondiciones = {
    'nuevo': 'bg-emerald-100 text-emerald-700',
    'usado': 'bg-yellow-100 text-yellow-700',
    'refurbished': 'bg-blue-100 text-blue-700',
    'reparacion': 'bg-orange-100 text-orange-700',
    'reservado': 'bg-purple-100 text-purple-700',
    'prestado': 'bg-cyan-100 text-cyan-700',
    'sin_reparacion': 'bg-red-100 text-red-700',
    'uso_oficina': 'bg-slate-100 text-slate-700',
    'consignacion': 'bg-slate-500 text-white'
  };

  // Labels de categorías - versión corta para gráficos (máx 7 caracteres)
  const labelsCategorias = {
    'NOTEBOOKS': 'Notebks',
    'CELULARES': 'Celular',
    'DESKTOP': 'Desktop',
    'MONITORES': 'Monitor',
    'ACCESORIOS': 'Acceso',
    'COMPONENTES': 'Compone',
    'FUNDAS_TEMPLADOS': 'Fundas',
    'TABLETS': 'Tablets',
    'MOUSE_TECLADOS': 'Mouse/T',
    'AUDIO': 'Audio',
    'ALMACENAMIENTO': 'Almacen',
    'CAMARAS': 'Cámaras',
    'CONSOLAS': 'Console',
    'GAMING': 'Gaming',
    'DRONES': 'Drones',
    'WATCHES': 'Watches',
    'PLACAS_VIDEO': 'GPU',
    'STREAMING': 'Stream',
    'REDES': 'Redes',
    'BAGS_CASES': 'Bags',
    'CABLES_CARGADORES': 'Cables',
    'MEMORIA': 'Memoria',
    'REPUESTOS': 'Repuest',
    'OTROS': 'Otros'
  };

  // Labels de categorías - versión completa para tabla
  const labelsCategoriaTabla = {
    'NOTEBOOKS': 'Notebooks',
    'CELULARES': 'Celulares',
    'DESKTOP': 'Desktop',
    'MONITORES': 'Monitores',
    'ACCESORIOS': 'Accesorios',
    'COMPONENTES': 'Componentes',
    'FUNDAS_TEMPLADOS': 'Fundas/Templados',
    'TABLETS': 'Tablets',
    'MOUSE_TECLADOS': 'Mouse/Teclados',
    'AUDIO': 'Audio',
    'ALMACENAMIENTO': 'Almacenamiento',
    'CAMARAS': 'Cámaras',
    'CONSOLAS': 'Consolas',
    'GAMING': 'Gaming',
    'DRONES': 'Drones',
    'WATCHES': 'Watches',
    'PLACAS_VIDEO': 'Placas de Video',
    'STREAMING': 'Streaming',
    'REDES': 'Redes',
    'BAGS_CASES': 'Bags/Cases',
    'CABLES_CARGADORES': 'Cables/Cargadores',
    'MEMORIA': 'Memoria',
    'REPUESTOS': 'Repuestos',
    'OTROS': 'Otros'
  };

  // Labels de condiciones
  const labelsCondiciones = {
    'nuevo': 'NUEVO',
    'usado': 'USADO',
    'refurbished': 'REFURBISHED',
    'reparacion': 'REPARACIÓN',
    'reservado': 'RESERVADO',
    'prestado': 'PRESTADO',
    'sin_reparacion': 'SIN REPARACIÓN',
    'uso_oficina': 'USO OFICINA',
    'consignacion': 'EN CONSIGNACIÓN'
  };

  // Aplicar filtros
  const productosFiltrados = useMemo(() => {
    let resultado = [...todosLosProductos];

    // Filtro de búsqueda
    if (filtros.busqueda) {
      const busquedaLower = filtros.busqueda.toLowerCase();
      resultado = resultado.filter(p =>
        p.info.toLowerCase().includes(busquedaLower)
      );
    }

    // Filtro de categoría
    if (filtros.categoria) {
      if (filtros.categoria === 'OTROS_TOTAL') {
        // Mostrar todos los productos que NO sean notebooks ni celulares
        resultado = resultado.filter(p => p.categoria !== 'NOTEBOOKS' && p.categoria !== 'CELULARES');
      } else {
        resultado = resultado.filter(p => p.categoria === filtros.categoria);
      }
    }

    // Filtro de condición
    if (filtros.condicion) {
      resultado = resultado.filter(p => p.condicion === filtros.condicion);
    }

    // Aplicar ordenamiento
    resultado.sort((a, b) => {
      switch (filtros.ordenamiento) {
        case 'precio-asc':
          return a.precioUSD - b.precioUSD;
        case 'precio-desc':
          return b.precioUSD - a.precioUSD;
        case 'condicion-asc':
          return a.condicion.localeCompare(b.condicion);
        case 'condicion-desc':
          return b.condicion.localeCompare(a.condicion);
        case 'categoria-asc':
          return a.categoria.localeCompare(b.categoria);
        case 'categoria-desc':
          return b.categoria.localeCompare(a.categoria);
        case 'nombre-asc':
          return a.info.localeCompare(b.info);
        case 'nombre-desc':
          return b.info.localeCompare(a.info);
        default:
          // Por defecto: categoría ascendente, luego precio
          if (a.categoria !== b.categoria) {
            return a.categoria.localeCompare(b.categoria);
          }
          return a.precioUSD - b.precioUSD;
      }
    });

    return resultado;
  }, [filtros, todosLosProductos]);

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    const totalProductos = productosFiltrados.length;
    const totalStock = productosFiltrados.reduce((sum, p) => sum + p.stock, 0);
    const valorTotalCompraUSD = productosFiltrados.reduce((sum, p) => sum + (p.precioCompraUSD * p.stock), 0);
    const valorTotalVentaUSD = productosFiltrados.reduce((sum, p) => sum + (p.precioUSD * p.stock), 0);

    return {
      totalProductos,
      totalStock,
      valorTotalCompraUSD,
      valorTotalVentaUSD
    };
  }, [productosFiltrados]);

  // Calcular datos para gráficos de torta
  const datosGraficoStock = useMemo(() => {
    const stockPorCategoria = {};

    productosFiltrados.forEach(producto => {
      if (!stockPorCategoria[producto.categoria]) {
        stockPorCategoria[producto.categoria] = 0;
      }
      stockPorCategoria[producto.categoria] += producto.stock;
    });

    return Object.entries(stockPorCategoria).map(([categoria, stock]) => ({
      name: labelsCategorias[categoria],
      value: stock,
      categoria
    }));
  }, [productosFiltrados]);

  const datosGraficoPrecio = useMemo(() => {
    const precioPorCategoria = {};

    productosFiltrados.forEach(producto => {
      if (!precioPorCategoria[producto.categoria]) {
        precioPorCategoria[producto.categoria] = 0;
      }
      precioPorCategoria[producto.categoria] += producto.precioUSD * producto.stock;
    });

    return Object.entries(precioPorCategoria).map(([categoria, valor]) => ({
      name: labelsCategorias[categoria],
      value: Math.round(valor),
      categoria
    }));
  }, [productosFiltrados]);

  const datosGraficoCondicion = useMemo(() => {
    const cantidadPorCondicion = {};

    productosFiltrados.forEach(producto => {
      if (!cantidadPorCondicion[producto.condicion]) {
        cantidadPorCondicion[producto.condicion] = 0;
      }
      cantidadPorCondicion[producto.condicion] += 1;
    });

    return Object.entries(cantidadPorCondicion).map(([condicion, cantidad]) => ({
      name: labelsCondiciones[condicion],
      value: cantidad,
      condicion
    }));
  }, [productosFiltrados]);

  // Colores para los gráficos (coinciden con las categorías)
  const COLORES_GRAFICOS = {
    'NOTEBOOKS': '#3b82f6',        // blue-500
    'CELULARES': '#10b981',        // green-500
    'DESKTOP': '#64748b',          // slate-500
    'MONITORES': '#a855f7',        // purple-500
    'ACCESORIOS': '#06b6d4',       // cyan-500
    'COMPONENTES': '#ef4444',      // red-500
    'FUNDAS_TEMPLADOS': '#ec4899', // pink-500
    'TABLETS': '#eab308',          // yellow-500
    'MOUSE_TECLADOS': '#f97316',   // orange-500
    'AUDIO': '#6366f1',            // indigo-500
    'ALMACENAMIENTO': '#14b8a6',   // teal-500
    'CAMARAS': '#f43f5e',          // rose-500
    'CONSOLAS': '#8b5cf6',         // violet-500
    'GAMING': '#d946ef',           // fuchsia-500
    'DRONES': '#0ea5e9',           // sky-500
    'WATCHES': '#f59e0b',          // amber-500
    'PLACAS_VIDEO': '#84cc16',     // lime-500
    'STREAMING': '#059669',        // emerald-600
    'REDES': '#2563eb',            // blue-600
    'BAGS_CASES': '#64748b',       // slate-500
    'CABLES_CARGADORES': '#0891b2', // cyan-600
    'MEMORIA': '#d946ef',          // fuchsia-500
    'REPUESTOS': '#6b7280',        // gray-500
    'OTROS': '#9ca3af'             // gray-400
  };

  const COLORES_CONDICIONES = {
    'nuevo': '#10b981',
    'usado': '#eab308',
    'refurbished': '#3b82f6',
    'reparacion': '#f97316',
    'reservado': '#a855f7',
    'prestado': '#06b6d4',
    'sin_reparacion': '#ef4444',
    'uso_oficina': '#64748b',
    'consignacion': '#64748b'
  };

  // Función para exportar a Excel
  const exportarExcel = () => {
    try {
      // Agrupar productos por categoría
      const productosPorCategoria = {};
      productosFiltrados.forEach(producto => {
        if (!productosPorCategoria[producto.categoria]) {
          productosPorCategoria[producto.categoria] = [];
        }
        productosPorCategoria[producto.categoria].push(producto);
      });

      // Preparar datos para Excel con categorías como separadores
      const datosExcel = [];
      let numeroFila = 1;

      // Obtener categorías ordenadas
      const categoriasOrdenadas = Object.keys(productosPorCategoria).sort();

      categoriasOrdenadas.forEach(categoria => {
        // Agregar fila separadora de categoría
        datosExcel.push({
          '#': '',
          'Producto': `═══ ${labelsCategoriaTabla[categoria]} ═══`,
          'Stock': '',
          'Precio Venta USD': ''
        });

        // Agregar productos de esta categoría
        productosPorCategoria[categoria].forEach(producto => {
          datosExcel.push({
            '#': numeroFila++,
            'Producto': producto.info.replace(/[📱💻🔌🖱️🛡️🖥️⚙️📖📦]/g, '').trim(),
            'Stock': producto.stock,
            'Precio Venta USD': `U$${producto.precioVenta.toFixed(0)}`
          });
        });

        // Agregar fila vacía entre categorías
        datosExcel.push({
          '#': '',
          'Producto': '',
          'Stock': '',
          'Precio Venta USD': ''
        });
      });

      // Crear libro de trabajo
      const ws = XLSX.utils.json_to_sheet(datosExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Listado Stock');

      // Ajustar ancho de columnas
      ws['!cols'] = [
        { wch: 5 },   // #
        { wch: 70 },  // Producto
        { wch: 10 },  // Stock
        { wch: 18 }   // Precio Venta USD
      ];

      // Aplicar alineación centrada a TODAS las celdas
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellAddress]) continue;

          // Centrar todo el contenido
          ws[cellAddress].s = {
            alignment: {
              horizontal: 'center',
              vertical: 'center'
            }
          };
        }
      }

      // Generar nombre de archivo con fecha
      const fecha = new Date().toLocaleDateString('es-AR').replace(/\//g, '-');
      const nombreArchivo = `Listado_Stock_Total_${fecha}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, nombreArchivo);

      setMostrarMenuExportar(false);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      alert('Error al exportar a Excel');
    }
  };

  // Función para exportar a mensaje (WhatsApp)
  const exportarMensaje = () => {
    try {
      // Agrupar productos por categoría
      const productosPorCategoria = {};
      productosFiltrados.forEach(producto => {
        if (!productosPorCategoria[producto.categoria]) {
          productosPorCategoria[producto.categoria] = [];
        }
        productosPorCategoria[producto.categoria].push(producto);
      });

      // Construir mensaje
      let mensaje = '*LISTADO STOCK - UPDATE TECH*\n_Tu store tecnológico de confianza_\n\n';

      // Obtener categorías ordenadas
      const categoriasOrdenadas = Object.keys(productosPorCategoria).sort();

      categoriasOrdenadas.forEach((categoria, index) => {
        // Agregar categoría con emoji en negrita y subrayada
        const emoji = EMOJI_CATEGORIAS[categoria] || '📦';
        mensaje += `*_${emoji} ${labelsCategoriaTabla[categoria]}_*\n`;

        // Agregar productos de esta categoría
        productosPorCategoria[categoria].forEach((producto) => {
          const nombreProducto = producto.info.replace(/[📱💻🔌🖱️🛡️🖥️⚙️📖📦]/g, '').trim();
          const precioVenta = Math.round(producto.precioVenta);
          const stock = producto.stock;

          // Formato: • PRODUCTO - Stock: X - U$PRECIO
          mensaje += `• ${nombreProducto} - Stock: ${stock} - U$${precioVenta}\n`;
        });

        // Agregar línea vacía entre categorías (excepto la última)
        if (index < categoriasOrdenadas.length - 1) {
          mensaje += '\n';
        }
      });

      // Copiar al portapapeles
      navigator.clipboard.writeText(mensaje).then(() => {
        alert('✅ Mensaje copiado al portapapeles!\n\nPuedes pegarlo directamente en WhatsApp.');
      }).catch(() => {
        // Si falla el portapapeles, mostrar en un prompt para copiar manualmente
        prompt('Copia este texto para WhatsApp:', mensaje);
      });

      setMostrarMenuExportar(false);
    } catch (error) {
      console.error('Error al exportar mensaje:', error);
      alert('Error al exportar mensaje');
    }
  };

  // Funciones para edición inline
  const iniciarEdicionFila = (producto) => {
    setFilaEditando(producto.id);
    setValoresEdicion({
      precioCompra: producto.precioCompra || 0,
      envioRepuestos: producto.envioRepuestos || 0,
      precioVenta: producto.precioVenta || 0
    });
  };

  const cancelarEdicionFila = () => {
    setFilaEditando(null);
    setValoresEdicion({ precioCompra: 0, envioRepuestos: 0, precioVenta: 0 });
  };

  const guardarEdicionFila = async (producto) => {
    try {
      const { tabla, idOriginal } = producto;
      let productoActualizado;

      if (tabla === 'inventario') {
        productoActualizado = await updateComputer(idOriginal, {
          precio_costo_usd: parseFloat(valoresEdicion.precioCompra) || 0,
          envios_repuestos: parseFloat(valoresEdicion.envioRepuestos) || 0,
          precio_venta_usd: parseFloat(valoresEdicion.precioVenta) || 0
        });
        // Actualizar solo este item en el estado local
        setComputers(prev => prev.map(comp =>
          comp.id === idOriginal ? productoActualizado : comp
        ));
      } else if (tabla === 'celulares') {
        productoActualizado = await updateCelular(idOriginal, {
          precio_compra_usd: parseFloat(valoresEdicion.precioCompra) || 0,
          costos_adicionales: parseFloat(valoresEdicion.envioRepuestos) || 0,
          precio_venta_usd: parseFloat(valoresEdicion.precioVenta) || 0
        });
        // Actualizar solo este item en el estado local
        setCelulares(prev => prev.map(cel =>
          cel.id === idOriginal ? productoActualizado : cel
        ));
      } else if (tabla === 'otros') {
        productoActualizado = await updateOtro(idOriginal, {
          precio_compra_usd: parseFloat(valoresEdicion.precioCompra) || 0,
          costos_adicionales: parseFloat(valoresEdicion.envioRepuestos) || 0,
          precio_venta_usd: parseFloat(valoresEdicion.precioVenta) || 0
        });
        // Actualizar solo este item en el estado local
        setOtros(prev => prev.map(otro =>
          otro.id === idOriginal ? productoActualizado : otro
        ));
      }

      // Limpiar estado
      cancelarEdicionFila();
      alert('✅ Producto actualizado correctamente');
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('❌ Error al actualizar: ' + error.message);
    }
  };

  // Funciones para edición masiva
  const toggleEdicionMasiva = () => {
    if (modoEdicionMasiva) {
      // Si está activado, preguntar si quiere descartar cambios
      if (cambiosMasivos.size > 0) {
        if (window.confirm('¿Descartar cambios pendientes?')) {
          setCambiosMasivos(new Map());
          setModoEdicionMasiva(false);
        }
      } else {
        setModoEdicionMasiva(false);
      }
    } else {
      setModoEdicionMasiva(true);
    }
  };

  const actualizarCambioMasivo = (productoId, nuevoPrecio) => {
    const nuevosCambios = new Map(cambiosMasivos);
    if (nuevoPrecio && parseFloat(nuevoPrecio) > 0) {
      nuevosCambios.set(productoId, parseFloat(nuevoPrecio));
    } else {
      nuevosCambios.delete(productoId);
    }
    setCambiosMasivos(nuevosCambios);
  };

  const guardarEdicionesMasivas = async () => {
    if (cambiosMasivos.size === 0) {
      alert('No hay cambios para guardar');
      return;
    }

    if (!window.confirm(`¿Guardar ${cambiosMasivos.size} cambios de precio?`)) {
      return;
    }

    setGuardandoMasivo(true);

    try {
      const cambiosArray = Array.from(cambiosMasivos.entries());
      let exitosos = 0;
      let fallidos = 0;

      for (const [productoId, nuevoPrecio] of cambiosArray) {
        const producto = productosFiltrados.find(p => p.id === productoId);
        if (!producto) continue;

        try {
          if (producto.tabla === 'inventario') {
            await updateComputer(producto.idOriginal, { precio_venta_usd: nuevoPrecio });
          } else if (producto.tabla === 'celulares') {
            await updateCelular(producto.idOriginal, { precio_venta_usd: nuevoPrecio });
          } else if (producto.tabla === 'otros') {
            await updateOtro(producto.idOriginal, { precio_venta_usd: nuevoPrecio });
          }
          exitosos++;
        } catch (error) {
          console.error('Error actualizando', productoId, error);
          fallidos++;
        }
      }

      // Refrescar datos
      await Promise.all([fetchComputers(), fetchCelulares(), fetchOtros()]);

      // Limpiar y cerrar modo edición
      setCambiosMasivos(new Map());
      setModoEdicionMasiva(false);

      alert(`✅ Actualización completa\n\nExitosos: ${exitosos}\nFallidos: ${fallidos}`);
    } catch (error) {
      console.error('Error en edición masiva:', error);
      alert('❌ Error en la actualización masiva');
    } finally {
      setGuardandoMasivo(false);
    }
  };

  // Mostrar loading
  if (loading) {
    return (
      <div className="p-0">
        <div className="bg-slate-800 p-4 text-white rounded border border-slate-200 mb-4">
          <div className="flex items-center space-x-3">
            <Package className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Listado Stock Total</h2>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando inventario...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="p-0">
        <div className="bg-slate-800 p-4 text-white rounded border border-slate-200 mb-4">
          <div className="flex items-center space-x-3">
            <Package className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Listado Stock Total</h2>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded p-6 text-center">
          <p className="text-red-600 font-semibold mb-2">Error al cargar el inventario</p>
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-0">
      {/* Header */}
      <div className="bg-slate-800 p-4 text-white rounded border border-slate-200 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Listado Stock Total</h2>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-3">
            {/* Botón Edición Masiva */}
            <button
              onClick={toggleEdicionMasiva}
              className={`px-4 py-2 rounded flex items-center gap-2 transition-colors font-medium ${modoEdicionMasiva
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
            >
              📝 {modoEdicionMasiva ? 'Salir edición' : 'Editar todos'}
            </button>

            {/* Botón Exportar con menú desplegable */}
            <div className="relative" ref={menuExportarRef}>
              <button
                onClick={() => setMostrarMenuExportar(!mostrarMenuExportar)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Exportar
                <ChevronDown className={`w-4 h-4 transition-transform ${mostrarMenuExportar ? 'rotate-180' : ''}`} />
              </button>

              {/* Menú desplegable */}
              {mostrarMenuExportar && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded border border-slate-200 shadow-lg z-10">
                  <button
                    onClick={exportarExcel}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Sheets
                  </button>
                  <button
                    onClick={exportarMensaje}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 border-t border-slate-200"
                  >
                    <Download className="w-4 h-4" />
                    Mensaje
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resumen de Totales */}
      <div className="mt-4 bg-slate-800 text-white p-4 rounded border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm text-slate-300">Total Productos</p>
            <p className="text-xl font-bold">{estadisticas.totalProductos}</p>
          </div>
          <div>
            <p className="text-sm text-slate-300">Stock Total</p>
            <p className="text-xl font-bold">{estadisticas.totalStock} unidades</p>
          </div>
          <div>
            <p className="text-sm text-slate-300">Valor Total Compra USD</p>
            <p className="text-xl font-bold">{formatearMonto(estadisticas.valorTotalCompraUSD, 'USD')}</p>
          </div>
          <div>
            <p className="text-sm text-slate-300">Valor Total Venta USD</p>
            <p className="text-xl font-bold">{formatearMonto(estadisticas.valorTotalVentaUSD, 'USD')}</p>
          </div>
        </div>
      </div>

      {/* Gráficos de Torta */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gráfico de Stock por Categoría */}
        <div className="bg-white border border-slate-200 rounded">
          <h3 className="text-sm font-semibold text-slate-800 py-2 text-center uppercase border-b border-slate-200">Stock por Categoría</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={datosGraficoStock}
                cx="35%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {datosGraficoStock.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORES_GRAFICOS[entry.categoria]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                wrapperStyle={{
                  fontSize: '9px',
                  lineHeight: '14px',
                  width: '180px',
                  columnCount: 2,
                  columnGap: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Precio USD por Categoría */}
        <div className="bg-white border border-slate-200 rounded">
          <h3 className="text-sm font-semibold text-slate-800 py-2 text-center uppercase border-b border-slate-200">Valor USD por Categoría</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={datosGraficoPrecio}
                cx="35%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {datosGraficoPrecio.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORES_GRAFICOS[entry.categoria]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                wrapperStyle={{
                  fontSize: '9px',
                  lineHeight: '14px',
                  width: '180px',
                  columnCount: 2,
                  columnGap: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Distribución por Condición */}
        <div className="bg-white border border-slate-200 rounded">
          <h3 className="text-sm font-semibold text-slate-800 py-2 text-center uppercase border-b border-slate-200">Distribución por Condición</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={datosGraficoCondicion}
                cx="40%"
                cy="50%"
                outerRadius={85}
                fill="#8884d8"
                dataKey="value"
              >
                {datosGraficoCondicion.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORES_CONDICIONES[entry.condicion]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                wrapperStyle={{ fontSize: '11px', lineHeight: '18px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filtros */}
      <div className="mt-4 bg-gray-50 p-4 border border-slate-200 rounded">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Búsqueda
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={filtros.busqueda}
                onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                placeholder="Buscar producto..."
                className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              value={filtros.categoria}
              onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Todas las categorías</option>
              <option value="NOTEBOOKS">Notebooks</option>
              <option value="CELULARES">Celulares</option>
              <option value="DESKTOP">Desktop</option>
              <option value="OTROS_TOTAL">Otros productos total</option>
              <option disabled>───────────────</option>
              <option value="ACCESORIOS">Accesorios</option>
              <option value="ALMACENAMIENTO">Almacenamiento</option>
              <option value="AUDIO">Audio</option>
              <option value="BAGS_CASES">Bags/Cases</option>
              <option value="CABLES_CARGADORES">Cables/Cargadores</option>
              <option value="CAMARAS">Cámaras</option>
              <option value="COMPONENTES">Componentes</option>
              <option value="CONSOLAS">Consolas</option>
              <option value="DRONES">Drones</option>
              <option value="FUNDAS_TEMPLADOS">Fundas/Templados</option>
              <option value="GAMING">Gaming</option>
              <option value="MEMORIA">Memoria</option>
              <option value="MONITORES">Monitores</option>
              <option value="MOUSE_TECLADOS">Mouse/Teclados</option>
              <option value="OTROS">Otros</option>
              <option value="PLACAS_VIDEO">Placas de Video</option>
              <option value="REDES">Redes</option>
              <option value="REPUESTOS">Repuestos</option>
              <option value="STREAMING">Streaming</option>
              <option value="TABLETS">Tablets</option>
              <option value="WATCHES">Watches</option>
            </select>
          </div>

          {/* Condición */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condición
            </label>
            <select
              value={filtros.condicion}
              onChange={(e) => setFiltros(prev => ({ ...prev, condicion: e.target.value }))}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Todas las condiciones</option>
              <option value="nuevo">Nuevo</option>
              <option value="usado">Usado</option>
              <option value="refurbished">Refurbished</option>
              <option value="reparacion">Reparación</option>
              <option value="reservado">Reservado</option>
              <option value="prestado">Prestado</option>
              <option value="sin_reparacion">Sin Reparación</option>
              <option value="uso_oficina">Uso Oficina</option>
              <option value="consignacion">En Consignación</option>
            </select>
          </div>

          {/* Ordenamiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ordenar por
            </label>
            <select
              value={filtros.ordenamiento}
              onChange={(e) => setFiltros(prev => ({ ...prev, ordenamiento: e.target.value }))}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="categoria-asc">Categoría (A-Z)</option>
              <option value="categoria-desc">Categoría (Z-A)</option>
              <option value="nombre-asc">Nombre (A-Z)</option>
              <option value="nombre-desc">Nombre (Z-A)</option>
              <option value="precio-asc">Precio (menor a mayor)</option>
              <option value="precio-desc">Precio (mayor a menor)</option>
              <option value="condicion-asc">Condición (A-Z)</option>
              <option value="condicion-desc">Condición (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="mt-4 bg-white border border-slate-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Información del Producto
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Serial
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Condición
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Días
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  PC
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Costos
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  PC Total
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Margen %
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  PV
                </th>
                {modoEdicionMasiva && (
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider bg-emerald-700">
                    Nuevo Precio
                  </th>
                )}
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {productosFiltrados.map((producto, index) => {
                const estaEditando = filaEditando === producto.id;
                const rowClass = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';

                return (
                  <tr
                    key={producto.id}
                    className={rowClass}
                  >
                    {/* Información del Producto */}
                    <td className="px-4 py-2 text-sm text-slate-800 max-w-md truncate">
                      {producto.info}
                    </td>

                    {/* Número de Serie */}
                    <td className="px-4 py-2 text-center text-xs text-slate-600">
                      {producto.serial || '-'}
                    </td>

                    {/* Categoría */}
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${coloresCategorias[producto.categoria]}`}>
                        {labelsCategoriaTabla[producto.categoria]}
                      </span>
                    </td>

                    {/* Condición */}
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${coloresCondiciones[producto.condicion]}`}>
                        {labelsCondiciones[producto.condicion]}
                      </span>
                    </td>

                    {/* Días en Stock */}
                    <td className="px-4 py-2 text-center">
                      {producto.diasEnStock !== null ? (
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getColorDias(producto.diasEnStock)}`}>
                          {producto.diasEnStock}d
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${producto.stock > 5 ? 'bg-green-100 text-green-700' :
                        producto.stock > 0 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                        {producto.stock}
                      </span>
                    </td>

                    {/* Precio Compra (PC) */}
                    <td className="px-4 py-2 text-center text-sm text-slate-600" onClick={(e) => e.stopPropagation()}>
                      {estaEditando ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={valoresEdicion.precioCompra}
                          onChange={(e) => setValoresEdicion({ ...valoresEdicion, precioCompra: e.target.value })}
                          className="w-full px-2 py-1 border border-emerald-500 rounded text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      ) : (
                        producto.precioCompra !== null ? formatearMonto(producto.precioCompra, 'USD') : '-'
                      )}
                    </td>

                    {/* Costos Extras (Envío/Repuestos) */}
                    <td className="px-4 py-2 text-center text-sm text-slate-600" onClick={(e) => e.stopPropagation()}>
                      {estaEditando ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={valoresEdicion.envioRepuestos}
                          onChange={(e) => setValoresEdicion({ ...valoresEdicion, envioRepuestos: e.target.value })}
                          className="w-full px-2 py-1 border border-emerald-500 rounded text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      ) : (
                        producto.envioRepuestos !== null ? formatearMonto(producto.envioRepuestos, 'USD') : '-'
                      )}
                    </td>

                    {/* PC Total */}
                    <td className="px-4 py-2 text-center text-sm font-medium text-slate-700">
                      {formatearMonto(producto.precioCompraTotal, 'USD')}
                    </td>

                    {/* Margen % */}
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${producto.margen > 30 ? 'bg-green-100 text-green-700' :
                        producto.margen > 15 ? 'bg-yellow-100 text-yellow-700' :
                          producto.margen > 0 ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                        }`}>
                        {producto.margen.toFixed(1)}%
                      </span>
                    </td>

                    {/* PV (Precio Venta) */}
                    <td className="px-4 py-2 text-center text-sm font-semibold text-slate-800" onClick={(e) => e.stopPropagation()}>
                      {estaEditando ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={valoresEdicion.precioVenta}
                          onChange={(e) => setValoresEdicion({ ...valoresEdicion, precioVenta: e.target.value })}
                          className="w-full px-2 py-1 border border-emerald-500 rounded text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      ) : (
                        formatearMonto(producto.precioVenta, 'USD')
                      )}
                    </td>

                    {/* Columna Nuevo Precio (Edición Masiva) */}
                    {modoEdicionMasiva && (
                      <td className="px-4 py-2 text-center bg-emerald-50" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder={Math.round(producto.precioVenta)}
                          value={cambiosMasivos.get(producto.id) || ''}
                          onChange={(e) => actualizarCambioMasivo(producto.id, e.target.value)}
                          className="w-full px-2 py-1 border border-emerald-500 rounded text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>
                    )}

                    {/* Columna Acciones */}
                    <td className="px-4 py-2 text-center">
                      <div className="flex gap-1 justify-center">
                        {estaEditando ? (
                          <>
                            {/* Botones cuando está editando - todos 32x32px */}
                            <button
                              onClick={() => guardarEdicionFila(producto)}
                              className="w-8 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors flex items-center justify-center font-bold text-sm"
                              title="Guardar cambios"
                            >
                              G
                            </button>
                            <button
                              onClick={cancelarEdicionFila}
                              className="w-8 h-8 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors flex items-center justify-center font-bold text-sm"
                              title="Cancelar"
                            >
                              C
                            </button>
                          </>
                        ) : (
                          <>
                            {/* Botón E de editar cuando NO está editando - 32x32px */}
                            <button
                              onClick={() => iniciarEdicionFila(producto)}
                              className={`w-8 h-8 rounded transition-colors font-bold text-sm flex items-center justify-center ${modoEdicionMasiva
                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                : 'bg-slate-600 hover:bg-slate-700 text-white'
                                }`}
                              title="Editar producto"
                              disabled={modoEdicionMasiva}
                            >
                              E
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mensaje cuando no hay productos */}
        {productosFiltrados.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No se encontraron productos con los filtros aplicados
          </div>
        )}
      </div>

      {/* Botón Guardar Cambios Masivos */}
      {modoEdicionMasiva && cambiosMasivos.size > 0 && (
        <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-emerald-800">
              <strong>{cambiosMasivos.size}</strong> productos con cambios pendientes
            </div>
            <button
              onClick={guardarEdicionesMasivas}
              disabled={guardandoMasivo}
              className={`px-6 py-3 rounded flex items-center gap-2 font-medium text-white ${guardandoMasivo
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
            >
              {guardandoMasivo ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>
                  💾 Guardar cambios
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListadoTotalSection;
