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
      .select(`
        *,
        venta_items (
          tipo_producto,
          modelo_producto,
          cantidad,
          precio_total
        )
      `)
      .gte('fecha_venta', fechaInicio)
      .lte('fecha_venta', fechaFin)
      .order('fecha_venta', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo ventas:', error);
      throw error;
    }

    console.log(`✅ ${data.length} transacciones obtenidas`);
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
      const fecha = new Date(transaccion.fecha_venta).toLocaleDateString('es-AR');
      
      // Ventas por día
      if (!ventasPorDia[fecha]) {
        ventasPorDia[fecha] = {
          fecha: fecha,
          ingresos: 0,
          transacciones: 0,
          margen: 0
        };
      }
      
      ventasPorDia[fecha].ingresos += parseFloat(transaccion.total_venta || 0);
      ventasPorDia[fecha].transacciones += 1;
      ventasPorDia[fecha].margen += parseFloat(transaccion.margen_total || 0);

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
      metodosPago: Object.entries(metodosPago).map(([metodo, valor]) => ({
        metodo,
        valor,
        porcentaje: ((valor / totalIngresos) * 100).toFixed(1)
      })),
      productosMasVendidos: Object.values(productosMasVendidos)
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 10),
      ventasPorTipo: [
        { tipo: 'Notebooks', cantidad: ventasPorTipo.computadora, color: '#3B82F6' },
        { tipo: 'Celulares', cantidad: ventasPorTipo.celular, color: '#10B981' },
        { tipo: 'Otros', cantidad: ventasPorTipo.otro, color: '#8B5CF6' }
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

  procesarDatosInventario(inventario) {
    const valorPorCategoria = [
      {
        categoria: 'Notebooks',
        cantidad: inventario.computadoras.length,
        valor: inventario.computadoras.reduce((sum, item) => sum + (parseFloat(item.precio_venta_usd || 0)), 0),
        color: '#3B82F6'
      },
      {
        categoria: 'Celulares',
        cantidad: inventario.celulares.length,
        valor: inventario.celulares.reduce((sum, item) => sum + (parseFloat(item.precio_venta_usd || 0)), 0),
        color: '#10B981'
      },
      {
        categoria: 'Otros',
        cantidad: inventario.otros.reduce((sum, item) => sum + (item.cantidad || 0), 0),
        valor: inventario.otros.reduce((sum, item) => sum + ((item.cantidad || 0) * (parseFloat(item.precio_venta_usd || 0))), 0),
        color: '#8B5CF6'
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
      const inventarioProcesado = dashboardService.procesarDatosInventario(inventario);

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
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Generando reportes...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-700 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <BarChart3 size={28} />
              <div>
                <h2 className="text-4xl font-bold">Dashboard de Reportes</h2>
                <p className="text-purple-100 mt-1">Análisis visual de ventas e inventario</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros de fecha */}
        <div className="bg-gray-50 p-4 border-b">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Período:</span>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Fecha inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Fecha fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              />
            </div>
            <button
              onClick={aplicarFiltros}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
            >
              Actualizar
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 m-6">
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Dashboard */}
        {ventasData && inventarioData && (
          <div className="p-6 space-y-6">
            {/* KPIs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-green-500 p-4 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Ingresos Totales</p>
                    <p className="text-2xl font-bold">{formatearMoneda(ventasData.resumenGeneral.totalIngresos)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-200" />
                </div>
              </div>

              <div className="bg-green-500 p-4 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Margen Total</p>
                    <p className="text-2xl font-bold">{formatearMoneda(ventasData.resumenGeneral.totalMargen)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-200" />
                </div>
              </div>

              <div className="bg-green-500 p-4 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Transacciones</p>
                    <p className="text-2xl font-bold">{ventasData.resumenGeneral.totalTransacciones}</p>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-green-200" />
                </div>
              </div>

              <div className="bg-green-500 p-4 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Ticket Promedio</p>
                    <p className="text-2xl font-bold">{formatearMoneda(ventasData.resumenGeneral.ticketPromedio)}</p>
                  </div>
                  <Package className="w-8 h-8 text-green-200" />
                </div>
              </div>

              <div className="bg-green-500 p-4 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Valor Inventario</p>
                    <p className="text-2xl font-bold">{formatearMoneda(inventarioData.valorTotalInventario)}</p>
                  </div>
                  <Package className="w-8 h-8 text-green-200" />
                </div>
              </div>
            </div>

            {/* Gráficos principales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ventas por día */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Ingresos por Día</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={ventasData.ventasPorDia}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="ingresos" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Productos más vendidos */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Productos Más Vendidos</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ventasData.productosMasVendidos.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="cantidad" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Métodos de pago */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Métodos de Pago</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={ventasData.metodosPago}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ metodo, porcentaje }) => `${metodo} (${porcentaje}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="valor"
                    >
                      {ventasData.metodosPago.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatearMoneda(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Ventas por tipo de producto */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Ventas por Categoría</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ventasData.ventasPorTipo}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tipo" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="cantidad" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Inventario */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Valor del inventario por categoría */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Valor de Inventario por Categoría</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={inventarioData.valorPorCategoria}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="categoria" />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="valor" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Estadísticas del inventario */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Estado del Inventario</h3>
                <div className="space-y-4">
                  {inventarioData.valorPorCategoria.map((categoria, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        {categoria.categoria === 'Notebooks' && <Monitor className="w-5 h-5 text-blue-600" />}
                        {categoria.categoria === 'Celulares' && <Smartphone className="w-5 h-5 text-green-600" />}
                        {categoria.categoria === 'Otros' && <Box className="w-5 h-5 text-purple-600" />}
                        <div>
                          <div className="font-medium">{categoria.categoria}</div>
                          <div className="text-sm text-gray-600">{categoria.cantidad} productos</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatearMoneda(categoria.valor)}</div>
                      </div>
                    </div>
                  ))}
                  
                  {inventarioData.stockBajo > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-center space-x-2">
                        <Package className="w-5 h-5 text-yellow-600" />
                        <span className="text-yellow-800 font-medium">
                          {inventarioData.stockBajo} productos con stock bajo (≤5 unidades)
                        </span>
                      </div>
                    </div>
                  )}
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