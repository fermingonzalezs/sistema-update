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

  procesarVentasParaGraficos(ventas) {
    console.log('🔄 Procesando ventas para gráficos...');
    
    const ventasPorDia = {};
    const ventasPorDiaSemana = {};
    const ventasPorSucursal = {};
    const ventasPorProcedencia = {};
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
      
      const ventaAmount = parseFloat(transaccion.monto_total || 0);
      const descuentoAmount = parseFloat(transaccion.descuento || 0);
      const promocioneAmount = parseFloat(transaccion.promociones || 0);
      const efectivoAmount = parseFloat(transaccion.efectivo || 0);
      const debitoAmount = parseFloat(transaccion.debito || 0);
      const creditoAmount = parseFloat(transaccion.credito || 0);
      const transferenciaAmount = parseFloat(transaccion.transferencia || 0);
      const mercadoPagoAmount = parseFloat(transaccion.mercadopago || 0);
      const usdAmount = parseFloat(transaccion.usd || 0);
      const pesosEfectivoAmount = parseFloat(transaccion.pesos_efectivo || 0);
      const pesosDigitalAmount = parseFloat(transaccion.pesos_digital || 0);
      
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
      const sucursal = transaccion.sucursal || 'No especificado';
      if (!ventasPorSucursal[sucursal]) {
        ventasPorSucursal[sucursal] = { sucursal, ventas: 0, transacciones: 0 };
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
      if (efectivoAmount > 0) {
        metodosDePago['Efectivo'] = (metodosDePago['Efectivo'] || 0) + efectivoAmount;
      }

      // Procesar items de la venta
      if (transaccion.venta_items) {
        transaccion.venta_items.forEach(item => {
          // Productos más vendidos
          const producto = item.modelo_producto || 'Sin especificar';
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
        });
      }
    });

    const procesarObjeto = (obj) => Object.values(obj).sort((a, b) => b.ventas - a.ventas);

    return {
      ventasPorDia: procesarObjeto(ventasPorDia),
      ventasPorDiaSemana: procesarObjeto(ventasPorDiaSemana),
      ventasPorSucursal: procesarObjeto(ventasPorSucursal),
      ventasPorProcedencia: procesarObjeto(ventasPorProcedencia),
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
      setLoading(true);
      setError(null);
      
      const [ventas, inventario] = await Promise.all([
        dashboardService.getVentasEnPeriodo(fechaInicio, fechaFin),
        dashboardService.getInventarioActual()
      ]);
      
      setVentasData(dashboardService.procesarVentasParaGraficos(ventas));
      setInventarioData(dashboardService.procesarInventario(inventario));
      
    } catch (err) {
      console.error('Error cargando datos del dashboard:', err);
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
  
  const formatearMoneda = (value) => {
    if (typeof value !== 'number') return value;
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
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
            {/* Métricas principales */}
            {ventasData && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Total Ventas</p>
                      <p className="text-2xl font-semibold text-slate-800">
                        {formatearMoneda(ventasData.totales.totalVentas)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-emerald-600" />
                  </div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Transacciones</p>
                      <p className="text-2xl font-semibold text-slate-800">
                        {ventasData.totales.totalTransacciones}
                      </p>
                    </div>
                    <ShoppingCart className="w-8 h-8 text-emerald-600" />
                  </div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Promedio Venta</p>
                      <p className="text-2xl font-semibold text-slate-800">
                        {formatearMoneda(ventasData.totales.promedioVenta)}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-emerald-600" />
                  </div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Items Vendidos</p>
                      <p className="text-2xl font-semibold text-slate-800">
                        {ventasData.totales.totalItems}
                      </p>
                    </div>
                    <Package className="w-8 h-8 text-emerald-600" />
                  </div>
                </div>
              </div>
            )}

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

              {/* Productos más vendidos */}
              <div className="bg-white border border-slate-200 rounded p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Productos Más Vendidos</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ventasData?.productosVendidos.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="producto" angle={-45} textAnchor="end" height={100} />
                      <YAxis tickFormatter={(value) => String(value)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="cantidad" fill="#e2e8f0" />
                    </BarChart>
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
                          <Cell key={'cell-' + index} fill={['#10b981', '#1e293b', '#e2e8f0', '#a1a1aa', '#71717a', '#52525b'][index % 6]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatearMoneda(value)} />
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

              {/* Inventario - Información general */}
              <div className="bg-white border border-slate-200 rounded p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Estado del Inventario</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inventarioData?.distribucionCategorias.map((categoria, index) => (
                    <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {categoria.categoria === 'Computadoras' && <Monitor className="w-5 h-5 text-slate-600" />}
                          {categoria.categoria === 'Celulares' && <Smartphone className="w-5 h-5 text-slate-600" />}
                          {categoria.categoria === 'Otros' && <Box className="w-5 h-5 text-slate-600" />}
                          <div>
                            <div className="font-medium text-slate-800">{categoria.categoria}</div>
                            <div className="text-sm text-slate-700">{categoria.cantidad} productos</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-slate-800">{categoria.porcentaje.toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Alertas de stock */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {inventarioData?.stockBajo > 0 && (
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
                            {inventarioData?.totalProductos} unidades
                          </div>
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