import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Package, DollarSign, TrendingUp, Download, ChevronDown } from 'lucide-react';
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
    fetchComputers
  } = useInventario();

  const {
    celulares,
    loading: loadingCelulares,
    error: errorCelulares,
    fetchCelulares
  } = useCelulares();

  const {
    otros,
    loading: loadingOtros,
    error: errorOtros,
    fetchOtros
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
    'ACCESORIOS': '🔌',    // Ej. Cargadores, cables
    'PERIFERICOS': '🖱️',   // Ej. Mouse, teclado, auriculares
    'FUNDAS_TEMPLADOS': '🛡️', // Ej. Fundas y protectores
    'MONITORES': '🖥️',      // Ej. Monitores
    'COMPONENTES': '⚙️',    // Ej. Placas de video, RAM, discos
    'TABLETS': '📖',
    'OTROS': '📦'          // Emoji por defecto
  };


  // Unificar todos los productos en un solo array
  const todosLosProductos = useMemo(() => {
    const productos = [];

    // Agregar notebooks
    computers.forEach(comp => {
      // Solo agregar productos que NO estén en condiciones excluidas
      const condicionesExcluidas = ['reparacion', 'sin_reparacion', 'prestado', 'uso_oficina', 'reservado'];
      if (!condicionesExcluidas.includes(comp.condicion)) {
        productos.push({
          id: `notebook-${comp.id}`,
          categoria: 'NOTEBOOKS',
          info: `💻 ${comp.modelo} - ${comp.procesador}, ${comp.ram}, ${comp.ssd}, ${comp.pantalla}, ${comp.placa_video}, ${comp.color}`,
          stock: 1,
          precioCompraUSD: comp.precio_costo_total || comp.precio_costo_usd || 0,
          precioUSD: comp.precio_venta_usd || 0,
          condicion: comp.condicion
        });
      }
    });

   // Agregar celulares
    celulares.forEach(cel => {
      const condicionesExcluidas = ['reparacion', 'sin_reparacion', 'prestado', 'uso_oficina', 'reservado'];
      if (!condicionesExcluidas.includes(cel.condicion)) {
        
        let infoAdicional = '';

        if(cel.condicion === 'usado' || cel.condicion === 'refurbished'){
          // Usando cel.estado para la condición estética
          const estetica = cel.estado ? `${cel.estado}` : ''; 
          
          // CORRECCIÓN 1: Usar comillas invertidas (`) para template literal
          const bateria = cel.bateria ? `🔋${cel.bateria}` : '';

          const partesAdicionales = [estetica, bateria].filter(p => p !== '');
          if(partesAdicionales.length > 0){
            // CORRECCIÓN 1: Usar comillas invertidas (`) para template literal
            infoAdicional = ` ${partesAdicionales.join(' ')}`;
          }
        } // CORRECCIÓN 3: Aquí faltaba la llave de cierre del if
        
        // CORRECCIÓN 3: Quitar el paréntesis de cierre erróneo en la línea de id
        productos.push({
          id: `celular-${cel.id}`,
          categoria: 'CELULARES',
          // CORRECCIÓN 2: Concatenar infoAdicional al final
          info: `📱 ${cel.modelo} ${cel.capacidad} ${cel.color || ''} ${infoAdicional}`,
          stock: 1,
          precioCompraUSD: cel.costo_total_usd || cel.precio_compra_usd || 0,
          precioUSD: cel.precio_venta_usd || 0,
          condicion: cel.condicion
        });
      }
    });

    // Agregar otros productos por categoría
    otros.forEach(otro => {
      const condicionesExcluidas = ['reparacion', 'sin_reparacion', 'prestado', 'uso_oficina', 'reservado'];
      if (!condicionesExcluidas.includes(otro.condicion)) {
        const stockTotal = (otro.cantidad_la_plata || 0) + (otro.cantidad_mitre || 0);
        if (stockTotal > 0) {

          

          // Construir info limpia sin undefined
          let info = otro.nombre_producto || '';
          if (otro.marca && otro.marca !== 'undefined' && otro.marca !== undefined) {
            info = `${otro.marca} ${info}`;
          }
          const emoji = EMOJI_CATEGORIAS[otro.categoria] || EMOJI_CATEGORIAS['OTROS'];

          productos.push({
            categoria: otro.categoria || 'OTROS',
            info: `${emoji} ${info.trim()}`,
            stock: stockTotal,
            precioCompraUSD: otro.precio_compra_usd || 0,
            precioUSD: otro.precio_venta_usd || 0,
            condicion: otro.condicion
          });
        }
      }
    });

    return productos;
  }, [computers, celulares, otros]);




  // Configuración de colores por categoría
  const coloresCategorias = {
    'NOTEBOOKS': 'bg-blue-100 text-blue-700',
    'CELULARES': 'bg-green-100 text-green-700',
    'MONITORES': 'bg-purple-100 text-purple-700',
    'PERIFERICOS': 'bg-orange-100 text-orange-700',
    'ACCESORIOS': 'bg-cyan-100 text-cyan-700',
    'COMPONENTES': 'bg-red-100 text-red-700',
    'FUNDAS_TEMPLADOS': 'bg-pink-100 text-pink-700',
    'TABLETS': 'bg-yellow-100 text-yellow-700'
  };

  // Configuración de colores por condición
  const coloresCondiciones = {
    'nuevo': 'bg-emerald-100 text-emerald-700',
    'usado': 'bg-yellow-100 text-yellow-700',
    'refurbished': 'bg-blue-100 text-blue-700'
  };

  // Labels de categorías
  const labelsCategorias = {
    'NOTEBOOKS': 'NOTEBOOKS',
    'CELULARES': 'CELULARES',
    'MONITORES': 'MONITORES',
    'PERIFERICOS': 'PERIFÉRICOS',
    'ACCESORIOS': 'ACCESORIOS',
    'COMPONENTES': 'COMPONENTES',
    'FUNDAS_TEMPLADOS': 'FUNDAS/TEMPLADOS',
    'TABLETS': 'TABLETS'
  };

  // Labels de condiciones
  const labelsCondiciones = {
    'nuevo': 'NUEVO',
    'usado': 'USADO',
    'refurbished': 'REFURBISHED'
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
      resultado = resultado.filter(p => p.categoria === filtros.categoria);
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
    'NOTEBOOKS': '#3b82f6',
    'CELULARES': '#10b981',
    'MONITORES': '#a855f7',
    'PERIFERICOS': '#f97316',
    'ACCESORIOS': '#06b6d4',
    'COMPONENTES': '#ef4444',
    'FUNDAS_TEMPLADOS': '#ec4899',
    'TABLETS': '#eab308'
  };

  const COLORES_CONDICIONES = {
    'nuevo': '#10b981',
    'usado': '#eab308',
    'refurbished': '#3b82f6'
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
          'Producto': `═══ ${labelsCategorias[categoria]} ═══`,
          'Stock': '',
          'Valor Venta USD': '',
          'Condición': ''
        });

        // Agregar productos de esta categoría
        productosPorCategoria[categoria].forEach(producto => {
          const valorVenta = Math.round(producto.precioUSD * producto.stock);
          datosExcel.push({
            '#': numeroFila++,
            'Producto': producto.info.replace(/[📱💻🔌🖱️🛡️🖥️⚙️📖📦]/g, '').trim(), // Remover emojis
            'Stock': producto.stock,
            'Valor Venta USD': `U$${valorVenta}`, // Formato U$xxx
            'Condición': labelsCondiciones[producto.condicion]
          });
        });

        // Agregar fila vacía entre categorías
        datosExcel.push({
          '#': '',
          'Producto': '',
          'Stock': '',
          'Valor Venta USD': '',
          'Condición': ''
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
        { wch: 18 },  // Valor Venta USD
        { wch: 15 }   // Condición
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

  // Función para exportar a PDF (placeholder)
  const exportarPDF = () => {
    alert('Exportación a PDF - Por implementar');
    setMostrarMenuExportar(false);
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
        mensaje += `*_${emoji} ${labelsCategorias[categoria]}_*\n`;

        // Agregar productos de esta categoría
        productosPorCategoria[categoria].forEach((producto) => {
          const nombreProducto = producto.info.replace(/[📱💻🔌🖱️🛡️🖥️⚙️📖📦]/g, '').trim();
          const condicion = labelsCondiciones[producto.condicion];
          const valorVenta = Math.round(producto.precioUSD * producto.stock);

          // Formato: • PRODUCTO - CONDICION - PRECIO (con viñeta)
          mensaje += `• ${nombreProducto} - ${condicion} - U$${valorVenta}\n`;
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
                  Exportar a Sheet
                </button>
                <button
                  onClick={exportarPDF}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 border-t border-slate-200"
                >
                  <Download className="w-4 h-4" />
                  Exportar a PDF
                </button>
                <button
                  onClick={exportarMensaje}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 border-t border-slate-200"
                >
                  <Download className="w-4 h-4" />
                  Exportar a Mensaje
                </button>
              </div>
            )}
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
                cx="45%"
                cy="50%"
                outerRadius={85}
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
                wrapperStyle={{ fontSize: '10px', lineHeight: '18px' }}
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
                cx="45%"
                cy="50%"
                outerRadius={85}
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
                wrapperStyle={{ fontSize: '10px', lineHeight: '18px' }}
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
                cx="45%"
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
                wrapperStyle={{ fontSize: '10px', lineHeight: '18px' }}
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
              <option value="MONITORES">Monitores</option>
              <option value="PERIFERICOS">Periféricos</option>
              <option value="ACCESORIOS">Accesorios</option>
              <option value="COMPONENTES">Componentes</option>
              <option value="FUNDAS_TEMPLADOS">Fundas/Templados</option>
              <option value="TABLETS">Tablets</option>
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
              <option value="refurbished">Refurbish</option>
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
                  Categoría
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Valor Compra USD
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Valor Venta USD
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Condición
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {productosFiltrados.map((producto, index) => (
                <tr
                  key={producto.id}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                >
                  {/* Información del Producto */}
                  <td className="px-4 py-2 text-sm text-slate-800 max-w-md truncate">
                    {producto.info}
                  </td>

                  {/* Categoría */}
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${coloresCategorias[producto.categoria]}`}>
                      {labelsCategorias[producto.categoria]}
                    </span>
                  </td>

                  {/* Stock */}
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      producto.stock > 5 ? 'bg-green-100 text-green-700' :
                      producto.stock > 0 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {producto.stock}
                    </span>
                  </td>

                  {/* Valor Compra USD (Total) */}
                  <td className="px-4 py-2 text-center text-sm text-slate-600">
                    {formatearMonto(producto.precioCompraUSD * producto.stock, 'USD')}
                  </td>

                  {/* Valor Venta USD (Total) */}
                  <td className="px-4 py-2 text-center text-sm font-semibold text-slate-800">
                    {formatearMonto(producto.precioUSD * producto.stock, 'USD')}
                  </td>

                  {/* Condición */}
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${coloresCondiciones[producto.condicion]}`}>
                      {labelsCondiciones[producto.condicion]}
                    </span>
                  </td>
                </tr>
              ))}
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
    </div>
  );
};

export default ListadoTotalSection;
