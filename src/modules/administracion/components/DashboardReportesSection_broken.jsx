import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, DollarSign, Package, TrendingUp, ShoppingCart, Monitor, Smartphone, Box } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../../../lib/supabase';

// Servicio para Dashboard de Reportes
const dashboardService = {
  async getVentasEnPeriodo(fechaInicio, fechaFin) {
    console.log('📊 Obteniendo ventas del período:', fechaInicio, 'al', fechaFin);

    const { data, error } = await supabase
      .from('transacciones')
      .select('*, venta_items (tipo_producto, modelo_producto, cantidad, precio_total)')
      .gte('fecha_venta', fechaInicio)
      .lte('fecha_venta', fechaFin)
      .order('fecha_venta', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo ventas:', error);
      throw error;
    }

    console.log('✅ ' + data.length + ' transacciones obtenidas');
    return data;
  },

  async getInventarioActual() {
    console.log('📦 Obteniendo estado del inventario...');

    const [computadoras, celulares, otros] = await Promise.all([
      supabase.from('inventario').select('*').eq('disponible', true),
      supabase.from('celulares').select('*').eq('disponible', true),
      supabase.from('otros').select('*').eq('disponible', true)
    ]);

    if (computadoras.error) throw computadoras.error;
    if (celulares.error) throw celulares.error;
    if (otros.error) throw otros.error;

    return {
      computadoras: computadoras.data,
      celulares: celulares.data,
      otros: otros.data
    };
  },

  procesarDatosVentas(transacciones) {
    // Ventas por día
    const ventasPorDia = {};
    const ventasPorDiaSemana = {
      'Domingo': { dia: 'Domingo', ventas: 0, ganancias: 0 },
      'Lunes': { dia: 'Lunes', ventas: 0, ganancias: 0 },
      'Martes': { dia: 'Martes', ventas: 0, ganancias: 0 },
      'Miércoles': { dia: 'Miércoles', ventas: 0, ganancias: 0 },
      'Jueves': { dia: 'Jueves', ventas: 0, ganancias: 0 },
      'Viernes': { dia: 'Viernes', ventas: 0, ganancias: 0 },
      'Sábado': { dia: 'Sábado', ventas: 0, ganancias: 0 }
    };
    const ventasPorSucursal = {};
    const ventasPorProcedencia = {};
    const metodosPago = {};
    const productosMasVendidos = {};
    const ventasPorTipo = {
      computadora: 0,
      celular: 0,
      otro: 0
    };

    let totalIngresos = 0;
    let totalCostos = 0;

    transacciones.forEach(transaccion => {
      const fechaObj = new Date(transaccion.fecha_venta);
      const fecha = fechaObj.toLocaleDateString('es-AR');
      const diaSemana = fechaObj.toLocaleDateString('es-AR', { weekday: 'long' });
      const diaCapitalizado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
      
      // Ventas por día
      if (!ventasPorDia[fecha]) {
        ventasPorDia[fecha] = {
          fecha: fecha,
          ventas: 0,
          ganancias: 0,
          transacciones: 0
        };
      }
      
      const ventaAmount = parseFloat(transaccion.total_venta || 0);
      const costoAmount = parseFloat(transaccion.total_costo || 0);
      const ganancia = ventaAmount - costoAmount;
      
      ventasPorDia[fecha].ventas += ventaAmount;
      ventasPorDia[fecha].ganancias += ganancia;
      ventasPorDia[fecha].transacciones += 1;
      
      // Ventas por día de semana
      if (ventasPorDiaSemana[diaCapitalizado]) {
        ventasPorDiaSemana[diaCapitalizado].ventas += ventaAmount;
        ventasPorDiaSemana[diaCapitalizado].ganancias += ganancia;
      }
      
      // Ventas por sucursal
      const sucursal = transaccion.sucursal || transaccion.ubicacion || 'Principal';
      if (!ventasPorSucursal[sucursal]) {
        ventasPorSucursal[sucursal] = { sucursal, ventas: 0 };
      }
      ventasPorSucursal[sucursal].ventas += ventaAmount;
      
      // Ventas por procedencia del cliente
      const procedencia = transaccion.cliente_procedencia || transaccion.como_nos_conocio || 'No especificado';
      if (!ventasPorProcedencia[procedencia]) {
        ventasPorProcedencia[procedencia] = { procedencia, ventas: 0, cantidad: 0 };
      }
      ventasPorProcedencia[procedencia].ventas += ventaAmount;
      ventasPorProcedencia[procedencia].cantidad += 1;

      // Métodos de pago
      const metodoPago = transaccion.metodo_pago || 'No especificado';
      if (!metodosPago[metodoPago]) {
        metodosPago[metodoPago] = 0;
      }
      metodosPago[metodoPago] += parseFloat(transaccion.total_venta || 0);

      // Totales generales
      totalIngresos += parseFloat(transaccion.total_venta || 0);
      totalCostos += parseFloat(transaccion.total_costo || 0);

      // Procesar items de la venta
      if (transaccion.venta_items) {
        transaccion.venta_items.forEach(item => {
          // Productos más vendidos
          const nombreProducto = item.modelo_producto || 'Producto sin nombre';
          if (!productosMasVendidos[nombreProducto]) {
            productosMasVendidos[nombreProducto] = {
              nombre: nombreProducto,
              cantidad: 0,
              ingresos: 0
            };
          }
          productosMasVendidos[nombreProducto].cantidad += item.cantidad;
          productosMasVendidos[nombreProducto].ingresos += parseFloat(item.precio_total || 0);

          // Ventas por tipo
          if (ventasPorTipo[item.tipo_producto] !== undefined) {
            ventasPorTipo[item.tipo_producto] += item.cantidad;
          }
        });
      }
    });

    return {
      ventasPorDia: Object.values(ventasPorDia).sort((a, b) => new Date(a.fecha) - new Date(b.fecha)),
      ventasPorDiaSemana: Object.values(ventasPorDiaSemana),
      ventasPorSucursal: Object.values(ventasPorSucursal),
      ventasPorProcedencia: Object.values(ventasPorProcedencia).sort((a, b) => b.ventas - a.ventas),
      metodosPago: Object.entries(metodosPago).map(([metodo, valor]) => ({
        metodo,
        valor,
        porcentaje: ((valor / totalIngresos) * 100).toFixed(1)
      })),
      productosMasVendidos: Object.values(productosMasVendidos)
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 10),
      ventasPorTipo: [
        { tipo: 'Notebooks', cantidad: ventasPorTipo.computadora, ventas: 0, color: '#10b981' },
        { tipo: 'Celulares', cantidad: ventasPorTipo.celular, ventas: 0, color: '#1e293b' },
        { tipo: 'Otros', cantidad: ventasPorTipo.otro, ventas: 0, color: '#e2e8f0' }
      ],
      resumenGeneral: {
        totalIngresos,
        totalCostos,
        totalMargen: totalIngresos - totalCostos,
        totalTransacciones: transacciones.length,
        ticketPromedio: transacciones.length > 0 ? totalIngresos / transacciones.length : 0
      }
    };
  },

  procesarDatosInventario(inventario, ventasData = null) {
    const valorPorCategoria = [
      {
        categoria: 'Notebooks',
        cantidad: inventario.computadoras.length,
        valor: inventario.computadoras.reduce((sum, item) => sum + (parseFloat(item.precio_venta_usd || 0)), 0),
        ventasCategoria: ventasData ? ventasData.ventasPorTipo.find(v => v.tipo === 'Notebooks')?.cantidad * 500 || 0 : 0,
        color: '#10b981'
      },
      {
        categoria: 'Celulares',
        cantidad: inventario.celulares.length,
        valor: inventario.celulares.reduce((sum, item) => sum + (parseFloat(item.precio_venta_usd || 0)), 0),
        ventasCategoria: ventasData ? ventasData.ventasPorTipo.find(v => v.tipo === 'Celulares')?.cantidad * 300 || 0 : 0,
        color: '#1e293b'
      },
      {
        categoria: 'Otros',
        cantidad: inventario.otros.reduce((sum, item) => sum + (item.cantidad || 0), 0),
        valor: inventario.otros.reduce((sum, item) => sum + ((item.cantidad || 0) * (parseFloat(item.precio_venta_usd || 0))), 0),
        ventasCategoria: ventasData ? ventasData.ventasPorTipo.find(v => v.tipo === 'Otros')?.cantidad * 100 || 0 : 0,
        color: '#e2e8f0'
      }
    ];

    const stockBajo = inventario.otros.filter(item => (item.cantidad || 0) <= 5);

    return {
      valorPorCategoria,
      stockBajo: stockBajo.length,
      totalProductos: valorPorCategoria.reduce((sum, cat) => sum + cat.cantidad, 0),
      valorTotalInventario: valorPorCategoria.reduce((sum, cat) => sum + cat.valor, 0)
    };
  }
};

// Hook personalizado
function useDashboardReportes() {
  const [ventasData, setVentasData] = useState(null);
  const [inventarioData, setInventarioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDatos = async (fechaInicio, fechaFin) => {
    try {
      setLoading(true);
      setError(null);

      const [ventas, inventario] = await Promise.all([
        dashboardService.getVentasEnPeriodo(fechaInicio, fechaFin),
        dashboardService.getInventarioActual()
      ]);

      const ventasProcesadas = dashboardService.procesarDatosVentas(ventas);
      const inventarioProcesado = dashboardService.procesarDatosInventario(inventario, ventasProcesadas);

      setVentasData(ventasProcesadas);
      setInventarioData(inventarioProcesado);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    ventasData,
    inventarioData,
    loading,
    error,
    fetchDatos
  };
}

// Componente principal
const DashboardReportesSection = () => {
  const {
    ventasData,
    inventarioData,
    loading,
    error,
    fetchDatos
  } = useDashboardReportes();

  // Filtros de fecha (últimos 30 días por defecto)
  const [fechaInicio, setFechaInicio] = useState(() => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 30);
    return fecha.toISOString().split('T')[0];
  });

  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    console.log('🚀 Cargando dashboard de reportes...');
    fetchDatos(fechaInicio, fechaFin);
  }, []);

  const aplicarFiltros = () => {
    fetchDatos(fechaInicio, fechaFin);
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD'
    }).format(valor);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Format label if it looks like a location (contains underscore)
      const formattedLabel = label && label.includes('_') 
        ? label.replace('_', ' ').toUpperCase() 
        : label;
      
      return (
        <div className="bg-white p-3 border border-slate-200 rounded shadow-sm">
          <p className="font-medium text-slate-800">{formattedLabel}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {typeof entry.value === 'number' && entry.name.includes('$') 
                ? formatearMoneda(entry.value) 
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
    <div className="p-6 bg-slate-50">
      <div className="bg-white rounded border border-slate-200 mb-6">
        {/* Header */}
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Dashboard de Reportes
              </h2>
              <p className="text-slate-300 mt-1">Análisis visual de ventas e inventario</p>
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
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-slate-100 border-l-4 border-slate-400 p-4 m-6 rounded">
          <span className="text-slate-800">{error}</span>
        </div>
      )}

      {/* Dashboard */}
      {ventasData && inventarioData && (
        <div className="space-y-6">
          {/* KPIs Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white p-4 rounded border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm">Ingresos Totales</p>
                  <p className="text-2xl font-semibold text-slate-800">{formatearMoneda(ventasData.resumenGeneral.totalIngresos)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm">Margen Total</p>
                  <p className="text-2xl font-semibold text-slate-800">{formatearMoneda(ventasData.resumenGeneral.totalMargen)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm">Transacciones</p>
                  <p className="text-2xl font-semibold text-slate-800">{ventasData.resumenGeneral.totalTransacciones}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-emerald-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm">Ticket Promedio</p>
                  <p className="text-2xl font-semibold text-slate-800">{formatearMoneda(ventasData.resumenGeneral.ticketPromedio)}</p>
                </div>
                <Package className="w-8 h-8 text-emerald-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm">Valor Inventario</p>
                  <p className="text-2xl font-semibold text-slate-800">{formatearMoneda(inventarioData.valorTotalInventario)}</p>
                </div>
                <Package className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Gráficos principales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ventas y Ganancias por día */}
            <div className="bg-white border border-slate-200 rounded p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Ventas y Ganancias por Día</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ventasData.ventasPorDia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis tickFormatter={(value) => String(value)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="ventas" stroke="#1e293b" strokeWidth={2} name="Ventas" />
                  <Line type="monotone" dataKey="ganancias" stroke="#10b981" strokeWidth={2} name="Ganancias" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Ventas por día de semana */}
            <div className="bg-white border border-slate-200 rounded p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Ventas por Día de Semana</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ventasData.ventasPorDiaSemana}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis tickFormatter={(value) => String(value)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="ventas" fill="#1e293b" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Ventas por sucursal */}
            <div className="bg-white border border-slate-200 rounded p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Ventas por Sucursal</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ventasData.ventasPorSucursal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="sucursal" 
                    tickFormatter={(value) => (value || '').replace('_', ' ').toUpperCase()}
                  />
                  <YAxis tickFormatter={(value) => String(value)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="ventas" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Ventas por procedencia del cliente */}
            <div className="bg-white border border-slate-200 rounded p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Ventas por Procedencia del Cliente</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ventasData.ventasPorProcedencia.slice(0, 6)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ procedencia, ventas }) => procedencia + ': ' + ventas.toFixed(0)}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="ventas"
                  >
                    {ventasData.ventasPorProcedencia.slice(0, 6).map((entry, index) => (
                      <Cell key={'cell-' + index} fill={['#10b981', '#1e293b', '#e2e8f0', '#a1a1aa', '#71717a', '#52525b'][index % 6]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatearMoneda(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Productos más vendidos */}
            <div className="bg-white border border-slate-200 rounded p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Productos Más Vendidos</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ventasData.productosMasVendidos.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cantidad" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>


            {/* Ventas por categoría */}
            <div className="bg-white border border-slate-200 rounded p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Ventas por Categoría</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ventasData.ventasPorTipo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tipo" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cantidad" fill="#1e293b" name="Cantidad" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Inventario */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Valor actual de inventario por categoría con ventas */}
            <div className="bg-white border border-slate-200 rounded p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Inventario vs Ventas por Categoría</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={inventarioData.valorPorCategoria}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoria" />
                  <YAxis tickFormatter={(value) => String(value)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="valor" fill="#1e293b" name="Valor Inventario" />
                  <Bar dataKey="ventasCategoria" fill="#10b981" name="Ventas" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Estado de inventario con contador y precio */}
            <div className="bg-white border border-slate-200 rounded p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Estado de Inventario por Categoría</h3>
              <div className="space-y-4">
                {inventarioData.valorPorCategoria.map((categoria, index) => (
                  <div key={index} className="p-4 border border-slate-200 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {categoria.categoria === 'Notebooks' && <Monitor className="w-6 h-6 text-slate-600" />}
                        {categoria.categoria === 'Celulares' && <Smartphone className="w-6 h-6 text-slate-600" />}
                        {categoria.categoria === 'Otros' && <Box className="w-6 h-6 text-slate-600" />}
                        <div>
                          <div className="font-semibold text-lg text-slate-800">{categoria.categoria}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold" style={{ color: categoria.color }}>
                          {categoria.cantidad}
                        </div>
                        <div className="text-xs text-slate-500">productos</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div className="bg-slate-50 p-2 rounded">
                        <div className="text-xs text-slate-600">Valor Total</div>
                        <div className="font-semibold text-slate-800">{formatearMoneda(categoria.valor)}</div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded">
                        <div className="text-xs text-slate-600">Precio Promedio</div>
                        <div className="font-semibold text-slate-800">
                          {formatearMoneda(categoria.cantidad > 0 ? categoria.valor / categoria.cantidad : 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Alertas de stock */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {inventarioData.stockBajo > 0 && (
                    <div className="p-3 bg-slate-100 border border-slate-200 rounded">
                      <div className="flex items-center space-x-2">
                        <Package className="w-5 h-5 text-slate-600" />
                        <div>
                          <div className="font-medium text-slate-800">Stock Bajo</div>
                          <div className="text-sm text-slate-700">
                            {inventarioData.stockBajo} productos con 5 o menos unidades
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                    <div className="flex items-center space-x-2">
                      <Package className="w-5 h-5 text-slate-600" />
                      <div>
                        <div className="font-medium text-slate-800">Total Productos</div>
                        <div className="text-sm text-slate-700">
                          {inventarioData.totalProductos} unidades
                        </div>
                      </div>
                    </div>
                  </div>
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
