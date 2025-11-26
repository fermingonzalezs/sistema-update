import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, DollarSign, Package, TrendingUp, ShoppingCart, Monitor, Smartphone, Box } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { supabase } from '../../../lib/supabase';
import Tarjeta from '../../../shared/components/layout/Tarjeta';
import { formatearMonto } from '../../../shared/utils/formatters';

// Servicio para Dashboard de Reportes
const dashboardService = {
  async getVentasEnPeriodo(fechaInicio, fechaFin) {
    console.log('📊 Obteniendo ventas del período:', fechaInicio, 'al', fechaFin);

    // Primero obtenemos los vendedores para mapear los IDs
    const { data: vendedoresData } = await supabase
      .from('vendedores')
      .select('id, nombre, apellido');

    const vendedoresMap = {};
    if (vendedoresData) {
      vendedoresData.forEach(v => {
        vendedoresMap[v.id.toString()] = `${v.nombre} ${v.apellido}`;
      });
    }

    const { data, error } = await supabase
      .from('transacciones')
      .select(`
        id,
        numero_transaccion,
        fecha_venta,
        cliente_nombre,
        cliente_id,
        vendedor,
        sucursal,
        total_venta,
        monto_pago_1,
        monto_pago_2,
        metodo_pago,
        observaciones,
        clientes (
          procedencia
        ),
        venta_items (
          tipo_producto, 
          copy, 
          cantidad, 
          precio_total,
          producto_id,
          serial_producto,
          precio_costo
        )
      `)
      .gte('fecha_venta', fechaInicio)
      .lte('fecha_venta', fechaFin)
      .order('fecha_venta', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo ventas:', error);
      throw error;
    }

    // Mapear nombres de vendedores y obtener costos del inventario
    const dataWithVendedores = await Promise.all(data.map(async (transaccion) => {
      const transaccionConVendedor = {
        ...transaccion,
        vendedor_nombre: vendedoresMap[transaccion.vendedor] || transaccion.vendedor || 'Sin asignar'
      };

      // Verificar costos para cada item de la venta
      if (transaccion.venta_items && transaccion.venta_items.length > 0) {
        const itemsConCosto = await Promise.all(transaccion.venta_items.map(async (item) => {
          let precioCosto = parseFloat(item.precio_costo || 0);

          // Si no hay precio_costo en venta_items, obtenerlo del inventario como fallback
          if (precioCosto === 0 && item.producto_id) {
            try {
              if (item.tipo_producto === 'computadora') {
                const { data: comp } = await supabase
                  .from('inventario_computadoras')
                  .select('precio_costo_total')
                  .eq('id', item.producto_id)
                  .single();
                precioCosto = parseFloat(comp?.precio_costo_total || 0);
              } else if (item.tipo_producto === 'celular') {
                const { data: cel } = await supabase
                  .from('inventario_celulares')
                  .select('precio_compra_usd')
                  .eq('id', item.producto_id)
                  .single();
                precioCosto = parseFloat(cel?.precio_compra_usd || 0);
              } else if (item.tipo_producto === 'otro') {
                const { data: otro } = await supabase
                  .from('inventario_otros')
                  .select('precio_compra_usd')
                  .eq('id', item.producto_id)
                  .single();
                precioCosto = parseFloat(otro?.precio_compra_usd || 0);
              }
            } catch (error) {
              console.warn(`⚠️ No se pudo obtener costo para producto ${item.producto_id}:`, error);
            }
          }

          return {
            ...item,
            precio_costo: precioCosto,
            ganancia_item: parseFloat(item.precio_total || 0) - precioCosto,
            margen_item: precioCosto > 0 ? (((parseFloat(item.precio_total || 0) - precioCosto) / precioCosto) * 100) : 0
          };
        }));

        transaccionConVendedor.venta_items = itemsConCosto;
      }

      return transaccionConVendedor;
    }));

    console.log('✅ ' + dataWithVendedores.length + ' transacciones obtenidas (con costos)');
    return dataWithVendedores;
  },

  async getInventarioActual() {
    console.log('📦 Obteniendo estado del inventario...');

    try {
      const [computadoras, celulares, otros] = await Promise.all([
        supabase.from('inventario_computadoras').select('*').eq('disponible', true),
        supabase.from('inventario_celulares').select('*').eq('disponible', true),
        supabase.from('inventario_otros').select('*').eq('disponible', true)
      ]);

      // Log errores pero no fallar completamente si una tabla no existe
      if (computadoras.error) console.warn('⚠️ Error inventario computadoras:', computadoras.error);
      if (celulares.error) console.warn('⚠️ Error inventario celulares:', celulares.error);
      if (otros.error) console.warn('⚠️ Error inventario otros:', otros.error);

      return {
        computadoras: computadoras.data || [],
        celulares: celulares.data || [],
        otros: otros.data || []
      };
    } catch (err) {
      console.warn('⚠️ Error general inventario:', err);
      return {
        computadoras: [],
        celulares: [],
        otros: []
      };
    }
  },

  procesarVentasParaGraficos(ventas) {
    console.log('🔄 Procesando ventas para gráficos...', { totalVentas: ventas.length });

    if (!ventas || ventas.length === 0) {
      console.log('⚠️ No hay ventas para procesar');
      return {
        ventasPorDia: [],
        ventasPorDiaSemana: [],
        ventasPorSucursal: [],
        ventasPorProcedencia: [],
        ventasPorVendedor: [],
        ventasPorCategoria: [],
        metodosDePago: [],
        productosVendidos: [],
        tiposProductos: [],
        totales: { totalVentas: 0, totalTransacciones: 0, totalItems: 0, promedioVenta: 0, promedioItemsPorVenta: 0 }
      };
    }

    const ventasPorDia = {};
    const ventasPorDiaSemana = {};
    const ventasPorSucursal = {};
    const ventasPorProcedencia = {};
    const ventasPorVendedor = {};
    const ventasPorCategoria = {};
    const metodosDePago = {};
    const productosVendidos = {};
    const tiposProductos = {};

    // Estructuras para gráficos apilados
    const ventasPorSucursalDiaria = {};
    const ventasPorSemana = {}; // Nueva estructura para ventas semanales

    let totalVentas = 0;
    let totalTransacciones = 0;
    let totalItems = 0;
    let totalDescuentos = 0;
    let totalPromociones = 0;
    let totalEfectivo = 0;
    let totalDebito = 0;
    let totalCredito = 0;
    let totalTransferencia = 0;
    let totalMercadoPago = 0;
    let totalUSD = 0;
    let totalPesosEfectivo = 0;
    let totalPesosDigital = 0;

    // Helper para obtener inicio de semana (Lunes)
    const getStartOfWeek = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // ajustar cuando es domingo
      const monday = new Date(d.setDate(diff));
      return monday.toISOString().split('T')[0];
    };

    // Ventas por día
    ventas.forEach(transaccion => {
      if (!transaccion.fecha_venta) return;

      const fecha = new Date(transaccion.fecha_venta).toISOString().split('T')[0];
      const diaSemana = new Date(transaccion.fecha_venta).toLocaleDateString('es-ES', { weekday: 'long' });
      // Capitalizar día
      const diaSemanaCap = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);

      const semanaInicio = getStartOfWeek(transaccion.fecha_venta);

      const ventaAmount = parseFloat(transaccion.monto_pago_1 || 0) + parseFloat(transaccion.monto_pago_2 || 0);

      // Normalizar sucursal
      const sucursalRaw = transaccion.sucursal || 'No especificado';
      const sucursal = sucursalRaw.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const sucursalKey = sucursal === 'La Plata' ? 'la_plata' : 'mitre'; // Simplificar para keys

      totalVentas += ventaAmount;
      totalTransacciones += 1;

      // Ventas por día (mantenemos para lógica interna si se necesita, pero el gráfico será semanal)
      if (!ventasPorDia[fecha]) {
        ventasPorDia[fecha] = { fecha, ventas: 0, transacciones: 0 };
      }
      ventasPorDia[fecha].ventas += ventaAmount;
      ventasPorDia[fecha].transacciones += 1;

      // Ventas por Semana (Agrupado por sucursal)
      if (!ventasPorSemana[semanaInicio]) {
        ventasPorSemana[semanaInicio] = {
          semana: semanaInicio,
          mitre: 0,
          la_plata: 0,
          total: 0
        };
      }
      ventasPorSemana[semanaInicio][sucursalKey] += ventaAmount;
      ventasPorSemana[semanaInicio].total += ventaAmount;

      // Ventas por día de semana (Agrupado por sucursal)
      if (!ventasPorDiaSemana[diaSemanaCap]) {
        ventasPorDiaSemana[diaSemanaCap] = {
          dia: diaSemanaCap,
          mitre: 0,
          la_plata: 0,
          total: 0,
          orden: new Date(transaccion.fecha_venta).getDay() // Para ordenar correctamente (0=Domingo, 1=Lunes...)
        };
        // Ajustar orden para que Lunes sea 1 y Domingo 7
        if (ventasPorDiaSemana[diaSemanaCap].orden === 0) ventasPorDiaSemana[diaSemanaCap].orden = 7;
      }
      ventasPorDiaSemana[diaSemanaCap][sucursalKey] += ventaAmount;
      ventasPorDiaSemana[diaSemanaCap].total += ventaAmount;

      // Ventas por sucursal (Ahora es contador de transacciones/ventas)
      if (!ventasPorSucursal[sucursal]) {
        ventasPorSucursal[sucursal] = { sucursal, ventas: 0, transacciones: 0 };
      }
      ventasPorSucursal[sucursal].ventas += ventaAmount; // Mantenemos el monto por si acaso
      ventasPorSucursal[sucursal].transacciones += 1; // Usaremos esto para el gráfico

      // Ventas por sucursal diaria (para gráfico apilado)
      if (!ventasPorSucursalDiaria[fecha]) {
        ventasPorSucursalDiaria[fecha] = { fecha };
      }
      ventasPorSucursalDiaria[fecha][sucursal] = (ventasPorSucursalDiaria[fecha][sucursal] || 0) + ventaAmount;

      // Ventas por procedencia del cliente (Ahora es contador)
      // Normalizar procedencia para evitar duplicados por mayúsculas/minúsculas
      let procedencia = transaccion.clientes?.procedencia || 'No especificado';
      // Capitalizar primera letra
      procedencia = procedencia.charAt(0).toUpperCase() + procedencia.slice(1).toLowerCase();

      if (!ventasPorProcedencia[procedencia]) {
        ventasPorProcedencia[procedencia] = { procedencia, ventas: 0, cantidad: 0 };
      }
      ventasPorProcedencia[procedencia].ventas += ventaAmount;
      ventasPorProcedencia[procedencia].cantidad += 1; // Usaremos esto para el gráfico

      // Ventas por vendedor (Ahora es contador de transacciones)
      const vendedor = transaccion.vendedor_nombre || 'Sin asignar';
      if (!ventasPorVendedor[vendedor]) {
        ventasPorVendedor[vendedor] = { vendedor, ventas: 0, transacciones: 0 };
      }
      ventasPorVendedor[vendedor].ventas += ventaAmount;
      ventasPorVendedor[vendedor].transacciones += 1; // Usaremos esto para el gráfico

      // Métodos de pago
      // ... (lógica existente simplificada en el original, se mantiene igual)

      // Procesar items de la venta
      if (transaccion.venta_items) {
        transaccion.venta_items.forEach(item => {
          // Productos más vendidos
          const productoNombre = item.copy || 'Sin especificar';
          const productoKey = item.producto_id ? `${productoNombre}_${item.producto_id}` : productoNombre;

          if (!productosVendidos[productoKey]) {
            productosVendidos[productoKey] = {
              producto: productoNombre,
              cantidad: 0,
              ingresos: 0,
              costo: 0,
              ganancia: 0
            };
          }
          const cantidadItem = parseInt(item.cantidad || 1);
          const precioTotalItem = parseFloat(item.precio_total || 0);
          const costoItem = parseFloat(item.precio_costo || 0) * cantidadItem;

          productosVendidos[productoKey].cantidad += cantidadItem;
          productosVendidos[productoKey].ingresos += precioTotalItem;
          productosVendidos[productoKey].costo += costoItem;
          productosVendidos[productoKey].ganancia += (precioTotalItem - costoItem);

          totalItems += cantidadItem;

          // Ventas por tipo
          const tipo = item.tipo_producto || 'Otros';
          if (!tiposProductos[tipo]) {
            tiposProductos[tipo] = { tipo, ventas: 0, cantidad: 0 };
          }
          tiposProductos[tipo].ventas += precioTotalItem;
          tiposProductos[tipo].cantidad += cantidadItem;

          // Categorías detalladas (tipo_producto directo + desglose de otros si es necesario)
          // El usuario pidió: "las categorias tienen que ser las de la columna tipo_producto... ganancia y margen por categoria tienen que tener todas las categorias, que son notebooks, celulares y todas las categorias de otros"

          let categoria = item.tipo_producto || 'Otros';

          // Normalizar nombres para visualización
          if (categoria === 'computadora') {
            categoria = 'Notebooks';
          } else if (categoria === 'celular') {
            categoria = 'Celulares';
          } else {
            // Revertir a la lógica anterior: todo lo demás es 'Otros'
            categoria = 'Otros';
          }

          const precioVenta = precioTotalItem;
          const precioCosto = parseFloat(item.precio_costo || 0);
          const ganancia = precioVenta - (precioCosto * cantidadItem);

          if (!ventasPorCategoria[categoria]) {
            ventasPorCategoria[categoria] = {
              categoria,
              ventas: 0,
              cantidad: 0,
              costo: 0,
              ganancia: 0,
              margen: 0
            };
          }
          ventasPorCategoria[categoria].ventas += precioVenta;
          ventasPorCategoria[categoria].costo += costoItem;
          ventasPorCategoria[categoria].ganancia += ganancia;
          ventasPorCategoria[categoria].cantidad += cantidadItem;
        });
      }
    });

    const procesarObjeto = (obj) => Object.values(obj).sort((a, b) => b.ventas - a.ventas);
    const procesarObjetoPorCantidad = (obj) => Object.values(obj).sort((a, b) => b.cantidad - a.cantidad);
    const procesarObjetoPorTransacciones = (obj) => Object.values(obj).sort((a, b) => b.transacciones - a.transacciones);

    // Calcular margen final para cada categoría
    Object.values(ventasPorCategoria).forEach(categoria => {
      // Margen = (Ganancia / Costo) * 100
      categoria.margen = categoria.costo > 0 ? ((categoria.ganancia / categoria.costo) * 100) : 0;
      categoria.margenSobreVentas = categoria.ventas > 0 ? ((categoria.ganancia / categoria.ventas) * 100) : 0;
    });

    // Procesar productos vendidos para ranking
    const topProductos = Object.values(productosVendidos)
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 10)
      .map(p => ({
        ...p,
        margen: p.costo > 0 ? ((p.ganancia / p.costo) * 100) : 0
      }));

    // Procesar ventas por sucursal diaria para gráfico apilado
    const ventasSucursalDiariaArr = Object.values(ventasPorSucursalDiaria).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    // Procesar ventas semanales
    const ventasPorSemanaArr = Object.values(ventasPorSemana).sort((a, b) => new Date(a.semana) - new Date(b.semana));

    // Procesar ventas por día de semana (ordenar por día lunes-domingo)
    const ventasPorDiaSemanaArr = Object.values(ventasPorDiaSemana).sort((a, b) => a.orden - b.orden);

    return {
      ventasPorDia: Object.values(ventasPorDia).sort((a, b) => new Date(a.fecha) - new Date(b.fecha)),
      ventasPorDiaSemana: ventasPorDiaSemanaArr,
      ventasPorSemana: ventasPorSemanaArr, // Nuevo
      ventasPorSucursal: procesarObjetoPorTransacciones(ventasPorSucursal), // Ordenar por transacciones
      ventasPorProcedencia: procesarObjetoPorCantidad(ventasPorProcedencia), // Ordenar por cantidad
      ventasPorVendedor: procesarObjetoPorTransacciones(ventasPorVendedor), // Ordenar por transacciones
      ventasPorCategoria: procesarObjeto(ventasPorCategoria), // Mantener por ventas para "Valor Venta Bruta" pero usaremos cantidad para "Ventas por Categoria"
      ventasPorSucursalDiaria: ventasSucursalDiariaArr,
      topProductos,
      metodosDePago: Object.entries(metodosDePago).map(([metodo, cantidad]) => ({
        metodo,
        cantidad
      })),
      productosVendidos: Object.values(productosVendidos).sort((a, b) => b.cantidad - a.cantidad),
      tiposProductos: Object.values(tiposProductos).sort((a, b) => b.ventas - a.ventas),
      totales: {
        totalVentas,
        totalTransacciones,
        totalItems,
        totalDescuentos,
        totalPromociones,
        totalEfectivo,
        totalDebito,
        totalCredito,
        totalTransferencia,
        totalMercadoPago,
        totalUSD,
        totalPesosEfectivo,
        totalPesosDigital,
        promedioVenta: totalVentas / totalTransacciones || 0,
        promedioItemsPorVenta: totalItems / totalTransacciones || 0
      }
    };
  },

  procesarInventario(inventario) {
    console.log('🔄 Procesando inventario...');

    const { computadoras, celulares, otros } = inventario;

    const totalProductos = computadoras.length + celulares.length + otros.length;

    let stockBajo = 0;
    let valorTotalInventario = 0;

    // Analizar stock bajo (menos de 5 unidades)
    [...computadoras, ...celulares, ...otros].forEach(item => {
      const cantidad = item.cantidad || 1;
      const precio = parseFloat(item.precio_venta_usd || 0);

      if (cantidad <= 5) {
        stockBajo += 1;
      }

      valorTotalInventario += precio * cantidad;
    });

    // Distribución por categoría
    const distribucionCategorias = [
      { categoria: 'Computadoras', cantidad: computadoras.length, porcentaje: (computadoras.length / totalProductos) * 100 },
      { categoria: 'Celulares', cantidad: celulares.length, porcentaje: (celulares.length / totalProductos) * 100 },
      { categoria: 'Otros', cantidad: otros.length, porcentaje: (otros.length / totalProductos) * 100 }
    ];

    return {
      totalProductos,
      stockBajo,
      valorTotalInventario,
      distribucionCategorias
    };
  }
};

// Hook personalizado
const useDashboardReportes = () => {
  const [ventasData, setVentasData] = useState(null);
  const [inventarioData, setInventarioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarDatos = async (fechaInicio, fechaFin) => {
    try {
      console.log('📊 Cargando datos dashboard:', { fechaInicio, fechaFin });
      setLoading(true);
      setError(null);

      const [ventas, inventario] = await Promise.all([
        dashboardService.getVentasEnPeriodo(fechaInicio, fechaFin),
        dashboardService.getInventarioActual()
      ]);

      console.log('📊 Datos cargados:', {
        ventasCount: ventas?.length || 0,
        inventarioKeys: Object.keys(inventario || {})
      });

      const ventasProcessed = dashboardService.procesarVentasParaGraficos(ventas);
      const inventarioProcessed = dashboardService.procesarInventario(inventario);

      console.log('📊 Datos procesados:', {
        ventasPorDia: ventasProcessed.ventasPorDia?.length || 0,
        ventasPorVendedor: ventasProcessed.ventasPorVendedor?.length || 0,
        ventasPorCategoria: ventasProcessed.ventasPorCategoria?.length || 0
      });

      setVentasData(ventasProcessed);
      setInventarioData(inventarioProcessed);

    } catch (err) {
      console.error('❌ Error cargando datos del dashboard:', err);
      setError(err.message || 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  return { ventasData, inventarioData, loading, error, cargarDatos };
};

// Componente principal
const DashboardReportesSection = () => {
  const { ventasData, inventarioData, loading, error, cargarDatos } = useDashboardReportes();

  // Colores por categoría
  const COLORES_CATEGORIAS = {
    'Notebooks': '#3b82f6',      // Azul
    'Celulares': '#f59e0b',       // Naranja
    'Otros': '#8b5cf6'            // Púrpura
  };

  // Colores para sucursales
  const COLORES_SUCURSALES = {
    'Mitre': '#ef4444',          // Rojo
    'La Plata': '#10b981',       // Verde
    'Default': '#64748b'         // Gris
  };

  // Colores para vendedores (array cíclico)
  const COLORES_VENDEDORES = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  // Función para obtener color por categoría
  const getColorPorCategoria = (categoria) => {
    return COLORES_CATEGORIAS[categoria] || '#64748b'; // Gris por defecto
  };

  // Función para obtener color por sucursal
  const getColorPorSucursal = (sucursal) => {
    return COLORES_SUCURSALES[sucursal] || COLORES_SUCURSALES['Default'];
  };

  // Función para obtener color por índice (para vendedores)
  const getColorPorIndice = (index) => {
    return COLORES_VENDEDORES[index % COLORES_VENDEDORES.length];
  };

  // Filtros de fecha (últimos 30 días por defecto)
  const [fechaInicio, setFechaInicio] = useState(() => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 30);
    return fecha.toISOString().split('T')[0];
  });

  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos(fechaInicio, fechaFin);
  }, []);

  const aplicarFiltros = () => {
    cargarDatos(fechaInicio, fechaFin);
  };


  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const formattedLabel = label && typeof label === 'string' && label.includes('_')
        ? label.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        : label;

      return (
        <div className="bg-white p-3 border border-slate-200 rounded shadow-sm">
          <p className="font-medium text-slate-800">{formattedLabel}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {typeof entry.value === 'number' && entry.name.includes('$')
                ? formatearMonto(entry.value, 'USD')
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <span className="ml-3 text-slate-600">Generando reportes...</span>
      </div>
    );
  }

  return (
    <div className="p-0 bg-slate-50">
      {/* Header obligatorio según el sistema de diseño */}
      <div className="bg-white rounded border border-slate-200 mb-4">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-semibold">Dashboard de Reportes</h2>
                <p className="text-slate-300 mt-1">Análisis detallado de ventas y rentabilidad</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros de fecha */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Período:</span>
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Fecha inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="border border-slate-200 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Fecha fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="border border-slate-200 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <button
              onClick={aplicarFiltros}
              className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 text-sm"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>

        {/* Contenido */}
        {error ? (
          <div className="p-8 text-center">
            <div className="text-red-600 mb-2">Error: {error}</div>
            <button
              onClick={() => cargarDatos(fechaInicio, fechaFin)}
              className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="p-6">
            {/* Métricas principales usando Tarjeta */}
            {ventasData && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Tarjeta
                  icon={DollarSign}
                  titulo="Total Ventas"
                  valor={formatearMonto(ventasData.totales.totalVentas, 'USD')}
                />
                <Tarjeta
                  icon={ShoppingCart}
                  titulo="Transacciones"
                  valor={ventasData.totales.totalTransacciones}
                />
                <Tarjeta
                  icon={TrendingUp}
                  titulo="Promedio Venta"
                  valor={formatearMonto(ventasData.totales.promedioVenta, 'USD')}
                />
                <Tarjeta
                  icon={Package}
                  titulo="Items Vendidos"
                  valor={ventasData.totales.totalItems}
                />
              </div>
            )}

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Valor de Venta Bruta por Categoría */}
              <div className="bg-white border border-slate-200 rounded">
                <h3 className="text-sm font-semibold text-slate-800 py-2 text-center uppercase border-b border-slate-200">Valor de Venta Bruta por Categoría</h3>
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={ventasData?.ventasPorCategoria}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="categoria" />
                      <YAxis tickFormatter={(value) => formatearMonto(value, 'USD', true)} />
                      <Tooltip
                        formatter={(value) => [formatearMonto(value, 'USD'), 'Ventas Brutas']}
                        labelStyle={{ color: '#1e293b' }}
                      />
                      <Bar dataKey="ventas">
                        {ventasData?.ventasPorCategoria.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getColorPorCategoria(entry.categoria)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Valor de Venta Bruta por Sucursal */}
              <div className="bg-white border border-slate-200 rounded">
                <h3 className="text-sm font-semibold text-slate-800 py-2 text-center uppercase border-b border-slate-200">Valor de Venta Bruta por Sucursal</h3>
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={ventasData?.ventasPorSucursal}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sucursal" />
                      <YAxis tickFormatter={(value) => formatearMonto(value, 'USD', true)} />
                      <Tooltip
                        formatter={(value) => [formatearMonto(value, 'USD'), 'Ventas Brutas']}
                        labelStyle={{ color: '#1e293b' }}
                      />
                      <Bar dataKey="ventas">
                        {ventasData?.ventasPorSucursal.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getColorPorSucursal(entry.sucursal)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Ventas por Categoría (Cantidad) */}
              <div className="bg-white border border-slate-200 rounded">
                <h3 className="text-sm font-semibold text-slate-800 py-2 text-center uppercase border-b border-slate-200">Ventas por Categoría (Cantidad)</h3>
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={ventasData?.ventasPorCategoria}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ categoria, cantidad }) => `${categoria}: ${cantidad}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="cantidad"
                      >
                        {ventasData?.ventasPorCategoria.map((entry, index) => (
                          <Cell key={'cell-' + index} fill={getColorPorCategoria(entry.categoria)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Unidades']} />
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

              {/* Ventas por procedencia del cliente */}
              <div className="bg-white border border-slate-200 rounded">
                <h3 className="text-sm font-semibold text-slate-800 py-2 text-center uppercase border-b border-slate-200">Ventas por Procedencia del Cliente</h3>
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={ventasData?.ventasPorProcedencia.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ procedencia, cantidad }) => `${procedencia}: ${cantidad}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="cantidad"
                        nameKey="procedencia"
                      >
                        {ventasData?.ventasPorProcedencia.slice(0, 6).map((entry, index) => (
                          <Cell key={'cell-' + index} fill={getColorPorIndice(index)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Clientes']} />
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

              {/* Ventas por sucursal */}
              <div className="bg-white border border-slate-200 rounded">
                <h3 className="text-sm font-semibold text-slate-800 py-2 text-center uppercase border-b border-slate-200">Ventas por Sucursal (Transacciones)</h3>
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={ventasData?.ventasPorSucursal}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sucursal" />
                      <YAxis tickFormatter={(value) => String(value)} />
                      <Tooltip
                        formatter={(value) => [value, 'Transacciones']}
                        labelStyle={{ color: '#1e293b' }}
                      />
                      <Bar dataKey="transacciones">
                        {ventasData?.ventasPorSucursal.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getColorPorSucursal(entry.sucursal)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Ventas por vendedor */}
              <div className="bg-white border border-slate-200 rounded">
                <h3 className="text-sm font-semibold text-slate-800 py-2 text-center uppercase border-b border-slate-200">Ventas por Vendedor (Transacciones)</h3>
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={ventasData?.ventasPorVendedor}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="vendedor" angle={-45} textAnchor="end" height={80} />
                      <YAxis tickFormatter={(value) => String(value)} />
                      <Tooltip
                        formatter={(value) => [value, 'Transacciones']}
                        labelStyle={{ color: '#1e293b' }}
                      />
                      <Bar dataKey="transacciones">
                        {ventasData?.ventasPorVendedor.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getColorPorIndice(index)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Ganancia por categoría */}
              <div className="bg-white border border-slate-200 rounded">
                <h3 className="text-sm font-semibold text-slate-800 py-2 text-center uppercase border-b border-slate-200">Ganancia por Categoría</h3>
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={ventasData?.ventasPorCategoria}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="categoria" />
                      <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
                      <Tooltip
                        formatter={(value) => [formatearMonto(value, 'USD'), 'Ganancia']}
                        labelStyle={{ color: '#1e293b' }}
                      />
                      <Bar dataKey="ganancia">
                        {ventasData?.ventasPorCategoria.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getColorPorCategoria(entry.categoria)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Margen por categoría */}
              <div className="bg-white border border-slate-200 rounded">
                <h3 className="text-sm font-semibold text-slate-800 py-2 text-center uppercase border-b border-slate-200">Margen por Categoría</h3>
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={ventasData?.ventasPorCategoria}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="categoria" />
                      <YAxis tickFormatter={(value) => `${value.toFixed(0)}%`} />
                      <Tooltip
                        formatter={(value) => [`${value.toFixed(1)}%`, 'Margen']}
                        labelStyle={{ color: '#1e293b' }}
                      />
                      <Bar dataKey="margen">
                        {ventasData?.ventasPorCategoria.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getColorPorCategoria(entry.categoria)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Ventas por Semana (Agrupado por Sucursal) */}
              <div className="bg-white border border-slate-200 rounded col-span-1 lg:col-span-2">
                <h3 className="text-sm font-semibold text-slate-800 py-2 text-center uppercase border-b border-slate-200">Ventas por Semana (Por Sucursal)</h3>
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ventasData?.ventasPorSemana}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="semana"
                        tickFormatter={(fecha) => {
                          const [y, m, d] = fecha.split('-');
                          return `${d}/${m}`;
                        }}
                      />
                      <YAxis tickFormatter={(value) => formatearMonto(value, 'USD', true)} />
                      <Tooltip
                        formatter={(value) => [formatearMonto(value, 'USD'), 'Ventas']}
                        labelStyle={{ color: '#1e293b' }}
                      />
                      <Legend />
                      <Bar dataKey="mitre" name="Mitre" fill={COLORES_SUCURSALES['Mitre']} />
                      <Bar dataKey="la_plata" name="La Plata" fill={COLORES_SUCURSALES['La Plata']} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Ventas por Día de la Semana (Agrupado por Sucursal) */}
              <div className="bg-white border border-slate-200 rounded col-span-1 lg:col-span-2">
                <h3 className="text-sm font-semibold text-slate-800 py-2 text-center uppercase border-b border-slate-200">Ventas por Día de la Semana (Por Sucursal)</h3>
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ventasData?.ventasPorDiaSemana}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="dia" />
                      <YAxis tickFormatter={(value) => formatearMonto(value, 'USD', true)} />
                      <Tooltip
                        formatter={(value) => [formatearMonto(value, 'USD'), 'Ventas']}
                        labelStyle={{ color: '#1e293b' }}
                      />
                      <Legend />
                      <Bar dataKey="mitre" name="Mitre" fill={COLORES_SUCURSALES['Mitre']} />
                      <Bar dataKey="la_plata" name="La Plata" fill={COLORES_SUCURSALES['La Plata']} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Análisis de Margen vs Volumen (Composed Chart) */}
              <div className="bg-white border border-slate-200 rounded col-span-1 lg:col-span-2">
                <h3 className="text-sm font-semibold text-slate-800 py-2 text-center uppercase border-b border-slate-200">Relación Volumen de Ventas vs Margen de Ganancia</h3>
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={ventasData?.ventasPorCategoria}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="categoria" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" tickFormatter={(value) => formatearMonto(value, 'USD', true)} />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" tickFormatter={(value) => `${value.toFixed(1)}%`} />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === 'Ventas Totales') return [formatearMonto(value, 'USD'), name];
                          if (name === 'Margen %') return [`${parseFloat(value).toFixed(1)}%`, name];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="ventas" name="Ventas Totales" fill="#8884d8" barSize={20} />
                      <Line yAxisId="right" type="monotone" dataKey="margen" name="Margen %" stroke="#82ca9d" strokeWidth={3} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>


            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardReportesSection;