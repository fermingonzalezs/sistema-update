import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, DollarSign, Package, TrendingUp, ShoppingCart, Monitor, Smartphone, Box } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
    
    // Ventas por día
    ventas.forEach(transaccion => {
      if (!transaccion.fecha_venta) return;
      
      const fecha = new Date(transaccion.fecha_venta).toISOString().split('T')[0];
      const diaSemana = new Date(transaccion.fecha_venta).toLocaleDateString('es-ES', { weekday: 'long' });
      
      const ventaAmount = parseFloat(transaccion.monto_pago_1 || 0) + parseFloat(transaccion.monto_pago_2 || 0);
      const descuentoAmount = 0; // Campo no disponible en estructura actual
      const promocioneAmount = 0; // Campo no disponible en estructura actual
      const efectivoAmount = 0; // Simplificado por ahora
      const debitoAmount = 0;
      const creditoAmount = 0;
      const transferenciaAmount = 0;
      const mercadoPagoAmount = 0;
      const usdAmount = ventaAmount; // Asumiendo USD por defecto
      const pesosEfectivoAmount = 0;
      const pesosDigitalAmount = 0;
      
      totalVentas += ventaAmount;
      totalTransacciones += 1;
      totalDescuentos += descuentoAmount;
      totalPromociones += promocioneAmount;
      totalEfectivo += efectivoAmount;
      totalDebito += debitoAmount;
      totalCredito += creditoAmount;
      totalTransferencia += transferenciaAmount;
      totalMercadoPago += mercadoPagoAmount;
      totalUSD += usdAmount;
      totalPesosEfectivo += pesosEfectivoAmount;
      totalPesosDigital += pesosDigitalAmount;
      
      // Ventas por día
      if (!ventasPorDia[fecha]) {
        ventasPorDia[fecha] = { fecha, ventas: 0, transacciones: 0 };
      }
      ventasPorDia[fecha].ventas += ventaAmount;
      ventasPorDia[fecha].transacciones += 1;
      
      // Ventas por día de semana
      if (!ventasPorDiaSemana[diaSemana]) {
        ventasPorDiaSemana[diaSemana] = { dia: diaSemana, ventas: 0, transacciones: 0 };
      }
      ventasPorDiaSemana[diaSemana].ventas += ventaAmount;
      ventasPorDiaSemana[diaSemana].transacciones += 1;
      
      // Ventas por sucursal
      const sucursalRaw = transaccion.sucursal || 'No especificado';
      const sucursal = sucursalRaw.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      if (!ventasPorSucursal[sucursal]) {
        ventasPorSucursal[sucursal] = { sucursal, ventas: 0, transacciones: 0 };
      }
      ventasPorSucursal[sucursal].ventas += ventaAmount;
      
      // Ventas por procedencia del cliente
      const procedencia = transaccion.clientes?.procedencia || 'No especificado';
      if (!ventasPorProcedencia[procedencia]) {
        ventasPorProcedencia[procedencia] = { procedencia, ventas: 0, cantidad: 0 };
      }
      ventasPorProcedencia[procedencia].ventas += ventaAmount;
      ventasPorProcedencia[procedencia].cantidad += 1;

      // Ventas por vendedor
      const vendedor = transaccion.vendedor_nombre || 'Sin asignar';
      if (!ventasPorVendedor[vendedor]) {
        ventasPorVendedor[vendedor] = { vendedor, ventas: 0, transacciones: 0 };
      }
      ventasPorVendedor[vendedor].ventas += ventaAmount;
      ventasPorVendedor[vendedor].transacciones += 1;

      // Métodos de pago
      if (efectivoAmount > 0) {
        metodosDePago['Efectivo'] = (metodosDePago['Efectivo'] || 0) + efectivoAmount;
      }

      // Procesar items de la venta
      if (transaccion.venta_items) {
        transaccion.venta_items.forEach(item => {
          // Productos más vendidos
          const producto = item.copy || 'Sin especificar';
          if (!productosVendidos[producto]) {
            productosVendidos[producto] = { producto, cantidad: 0, ingresos: 0 };
          }
          productosVendidos[producto].cantidad += item.cantidad || 0;
          productosVendidos[producto].ingresos += parseFloat(item.precio_total || 0);
          
          totalItems += item.cantidad || 0;
          
          // Ventas por tipo
          const tipo = item.tipo_producto || 'Otros';
          if (!tiposProductos[tipo]) {
            tiposProductos[tipo] = { tipo, ventas: 0, cantidad: 0 };
          }
          tiposProductos[tipo].ventas += parseFloat(item.precio_total || 0);
          tiposProductos[tipo].cantidad += item.cantidad || 0;

          // Ventas por categoría específica (notebooks, iphones, otros)
          let categoria = 'Otros';
          if (item.tipo_producto === 'computadora') {
            categoria = 'Notebooks';
          } else if (item.tipo_producto === 'celular') {
            // Determinar si es iPhone basado en el modelo
            const modelo = (item.copy || '').toLowerCase();
            if (modelo.includes('iphone') || modelo.includes('apple')) {
              categoria = 'iPhones';
            } else {
              categoria = 'Celulares';
            }
          }

          const precioVenta = parseFloat(item.precio_total || 0);
          const precioCosto = parseFloat(item.precio_costo || 0);
          const cantidad = parseInt(item.cantidad || 1);
          const ganancia = precioVenta - (precioCosto * cantidad);

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
          ventasPorCategoria[categoria].costo += (precioCosto * cantidad);
          ventasPorCategoria[categoria].ganancia += ganancia;
          ventasPorCategoria[categoria].cantidad += cantidad;
        });
      }
    });

    const procesarObjeto = (obj) => Object.values(obj).sort((a, b) => b.ventas - a.ventas);
    
    // Calcular margen final para cada categoría
    Object.values(ventasPorCategoria).forEach(categoria => {
      // Margen = (Ganancia / Costo) * 100
      categoria.margen = categoria.costo > 0 ? ((categoria.ganancia / categoria.costo) * 100) : 0;
      
      // También calculamos el margen sobre ventas para referencia
      categoria.margenSobreVentas = categoria.ventas > 0 ? ((categoria.ganancia / categoria.ventas) * 100) : 0;
    });

    return {
      ventasPorDia: procesarObjeto(ventasPorDia),
      ventasPorDiaSemana: procesarObjeto(ventasPorDiaSemana),
      ventasPorSucursal: procesarObjeto(ventasPorSucursal),
      ventasPorProcedencia: procesarObjeto(ventasPorProcedencia),
      ventasPorVendedor: procesarObjeto(ventasPorVendedor),
      ventasPorCategoria: procesarObjeto(ventasPorCategoria),
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
              <div className="bg-white border border-slate-200 rounded p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Valor de Venta Bruta por Categoría</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ventasData?.ventasPorCategoria}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="categoria" />
                      <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
                      <Tooltip 
                        formatter={(value) => [formatearMonto(value, 'USD'), 'Ventas Brutas']}
                        labelStyle={{ color: '#1e293b' }}
                      />
                      <Bar dataKey="ventas" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Valor de Venta Bruta por Sucursal */}
              <div className="bg-white border border-slate-200 rounded p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Valor de Venta Bruta por Sucursal</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ventasData?.ventasPorSucursal}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sucursal" />
                      <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
                      <Tooltip 
                        formatter={(value) => [formatearMonto(value, 'USD'), 'Ventas Brutas']}
                        labelStyle={{ color: '#1e293b' }}
                      />
                      <Bar dataKey="ventas" fill="#1e293b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Ventas por categoría (notebooks, iphones, otros) */}
              <div className="bg-white border border-slate-200 rounded p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Ventas por Categoría</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ventasData?.ventasPorCategoria}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ categoria, ventas }) => categoria + ': ' + formatearMonto(ventas, 'USD')}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="ventas"
                      >
                        {ventasData?.ventasPorCategoria.map((entry, index) => (
                          <Cell key={'cell-' + index} fill={['#10b981', '#1e293b', '#64748b', '#94a3b8'][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatearMonto(value, 'USD')} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Ventas por procedencia del cliente */}
              <div className="bg-white border border-slate-200 rounded p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Ventas por Procedencia del Cliente</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ventasData?.ventasPorProcedencia.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ procedencia, ventas }) => procedencia + ': ' + ventas.toFixed(0)}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="ventas"
                      >
                        {ventasData?.ventasPorProcedencia.slice(0, 6).map((entry, index) => (
                          <Cell key={'cell-' + index} fill={['#10b981', '#1e293b', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'][index % 6]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatearMonto(value, 'USD')} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Ventas por sucursal */}
              <div className="bg-white border border-slate-200 rounded p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Ventas por Sucursal</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ventasData?.ventasPorSucursal}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sucursal" />
                      <YAxis tickFormatter={(value) => String(value)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="ventas" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Ventas por vendedor */}
              <div className="bg-white border border-slate-200 rounded p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Ventas por Vendedor</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ventasData?.ventasPorVendedor}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="vendedor" angle={-45} textAnchor="end" height={80} />
                      <YAxis tickFormatter={(value) => String(value)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="ventas" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Ganancia por categoría */}
              <div className="bg-white border border-slate-200 rounded p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Ganancia por Categoría</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ventasData?.ventasPorCategoria}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="categoria" />
                      <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
                      <Tooltip 
                        formatter={(value) => [formatearMonto(value, 'USD'), 'Ganancia']}
                        labelStyle={{ color: '#1e293b' }}
                      />
                      <Bar dataKey="ganancia" fill="#1e293b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Margen por categoría */}
              <div className="bg-white border border-slate-200 rounded p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Margen por Categoría</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ventasData?.ventasPorCategoria}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="categoria" />
                      <YAxis tickFormatter={(value) => `${value.toFixed(0)}%`} />
                      <Tooltip 
                        formatter={(value) => [`${value.toFixed(1)}%`, 'Margen']}
                        labelStyle={{ color: '#1e293b' }}
                      />
                      <Bar dataKey="margen" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Ventas por día */}
              <div className="bg-white border border-slate-200 rounded p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Ventas por Día</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ventasData?.ventasPorDia}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis tickFormatter={(value) => String(value)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Ventas por día de la semana */}
              <div className="bg-white border border-slate-200 rounded p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Ventas por Día de la Semana</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ventasData?.ventasPorDiaSemana}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="dia" />
                      <YAxis tickFormatter={(value) => String(value)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="ventas" fill="#1e293b" />
                    </BarChart>
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