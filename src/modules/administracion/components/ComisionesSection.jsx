import React, { useState, useEffect } from 'react';
import { Calculator, User, DollarSign, Calendar, Settings, TrendingUp, Edit2, Save, X, FileText, Monitor, Smartphone, Box } from 'lucide-react';
import Tarjeta from '../../../shared/components/layout/Tarjeta';
import { formatearMonto } from '../../../shared/utils/formatters';
import { useVendedores } from '../../ventas/hooks/useVendedores';
import { supabase } from '../../../lib/supabase';

const ComisionesSection = ({ ventas, loading, error, onLoadStats }) => {
  const { vendedores, loading: loadingVendedores, fetchVendedores } = useVendedores();
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState('todos');
  const [porcentajeFijo, setPorcentajeFijo] = useState(10.0);
  const [editandoPorcentaje, setEditandoPorcentaje] = useState(false);
  const [porcentajeTemp, setPorcentajeTemp] = useState(porcentajeFijo);

  // Estados para resultados
  const [comisionesCalculadas, setComisionesCalculadas] = useState([]);
  const [detalleEquipos, setDetalleEquipos] = useState([]);
  const [resumenGeneral, setResumenGeneral] = useState({
    totalComisiones: 0,
    totalGanancias: 0,
    comisionPromedio: 0,
    totalVentas: 0
  });

  // Establecer fechas por defecto al cargar y cargar vendedores
  useEffect(() => {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    setFechaFin(hoy.toISOString().split('T')[0]);
    setFechaInicio(inicioMes.toISOString().split('T')[0]);
    
    // Cargar vendedores de la base de datos
    fetchVendedores();
  }, [fetchVendedores]);

  // Calcular comisiones cuando cambien los filtros
  useEffect(() => {
    if (fechaInicio && fechaFin) {
      calcularComisiones();
    }
  }, [fechaInicio, fechaFin, vendedorSeleccionado, porcentajeFijo, ventas]);

  // Obtener lista de vendedores de la base de datos
  const getVendedores = () => {
    return vendedores.map(v => `${v.nombre} ${v.apellido}`).sort();
  };

  // Filtrar ventas según criterios
  const filtrarVentas = () => {
    return ventas.filter(venta => {
      // Filtro por fecha
      const fechaVenta = new Date(venta.fecha_venta);
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      
      const cumpleFecha = fechaVenta >= inicio && fechaVenta <= fin;
      
      // Filtro por vendedor
      const cumpleVendedor = vendedorSeleccionado === 'todos' || 
        venta.vendedor === vendedorSeleccionado;
      
      // Solo ventas con items y vendedor
      const tieneItems = venta.venta_items && venta.venta_items.length > 0;
      const tieneVendedor = venta.vendedor && venta.vendedor.trim() !== '';
      
      return cumpleFecha && cumpleVendedor && tieneItems && tieneVendedor;
    });
  };


  // Calcular comisiones por vendedor y categoría
  const calcularComisiones = () => {
    const ventasFiltradas = filtrarVentas();
    const comisionesPorVendedor = {};
    const equiposDetalle = [];
    
    let totalGananciasGeneral = 0;
    let totalVentasGeneral = 0;
    let totalComisionesGeneral = 0;
    let totalTransacciones = 0;

    ventasFiltradas.forEach(venta => {
      const vendedor = venta.vendedor;
      totalTransacciones += 1;
      
      if (!comisionesPorVendedor[vendedor]) {
        comisionesPorVendedor[vendedor] = {
          vendedor,
          categorias: {
            computadora_nuevo: { ventas: 0, ganancias: 0, comision: 0, unidades: 0 },
            computadora_usado: { ventas: 0, ganancias: 0, comision: 0, unidades: 0 },
            celular_nuevo: { ventas: 0, ganancias: 0, comision: 0, unidades: 0 },
            celular_usado: { ventas: 0, ganancias: 0, comision: 0, unidades: 0 },
            otro: { ventas: 0, ganancias: 0, comision: 0, unidades: 0 }
          },
          totales: { ventas: 0, ganancias: 0, comision: 0, unidades: 0 }
        };
      }

      // Usar margen_total de la transacción para calcular comisión
      const margenTotal = parseFloat(venta.margen_total || 0);
      const comisionVenta = margenTotal * (porcentajeFijo / 100);
      const ventaTotal = parseFloat(venta.monto_pago_1 || 0) + parseFloat(venta.monto_pago_2 || 0);
      
      // Calcular unidades totales de la venta
      const unidadesTotales = venta.venta_items ? venta.venta_items.reduce((sum, item) => sum + (item.cantidad || 1), 0) : 1;

      // Distribuir comisión proporcionalmente entre items
      if (venta.venta_items && venta.venta_items.length > 0) {
        venta.venta_items.forEach(item => {
          // Determinar categoría basada en tipo (para "otros" usar condición de copy si está disponible)
          const getCategoriaCompleta = (tipoProducto, copy) => {
            if (tipoProducto === 'computadora') {
              // Determinar si es nuevo o usado basado en el copy
              const esNuevo = copy && (copy.toLowerCase().includes('nuevo') || copy.toLowerCase().includes('refurbished'));
              return esNuevo ? 'computadora_nuevo' : 'computadora_usado';
            } else if (tipoProducto === 'celular') {
              // Determinar si es nuevo o usado basado en el copy
              const esNuevo = copy && (copy.toLowerCase().includes('nuevo') || copy.toLowerCase().includes('refurbished'));
              return esNuevo ? 'celular_nuevo' : 'celular_usado';
            } else {
              return 'otro';
            }
          };

          // Usar datos directamente de venta_items
          const categoria = getCategoriaCompleta(item.tipo_producto, item.copy);
          const ventaItem = parseFloat(item.precio_total || 0);
          const unidades = item.cantidad || 1;
          const precioCosto = parseFloat(item.precio_costo || 0);
          const margenItem = parseFloat(item.margen_item || 0);
          
          // Distribución proporcional de comisión basada en valor del item
          const proporcionItem = ventaTotal > 0 ? ventaItem / ventaTotal : 0;
          const comisionItem = comisionVenta * proporcionItem;
          
          // Extraer condición del copy si es posible
          const extraerCondicion = (copy) => {
            const copyLower = (copy || '').toLowerCase();
            if (copyLower.includes('nuevo')) return 'nuevo';
            if (copyLower.includes('refurbished')) return 'refurbished';
            if (copyLower.includes('usado')) return 'usado';
            if (copyLower.includes('excelente')) return 'excelente';
            if (copyLower.includes('muy bueno')) return 'muy bueno';
            if (copyLower.includes('bueno')) return 'bueno';
            return 'usado'; // default
          };
          
          // Agregar detalle del equipo usando datos de venta_items
          equiposDetalle.push({
            fecha_venta: venta.fecha_venta,
            vendedor: venta.vendedor,
            nombre_equipo: item.copy || 'Equipo sin descripción',
            serial: item.serial_producto || 'N/A',
            tipo_producto: item.tipo_producto,
            condicion: extraerCondicion(item.copy),
            cantidad: unidades,
            precio_costo: precioCosto,
            precio_venta: parseFloat(item.precio_unitario || 0),
            precio_total: ventaItem,
            ganancia: margenItem, // Usar margen ya calculado del item
            comision: comisionItem,
            categoria: categoria
          });

          // Acumular por categoría
          if (comisionesPorVendedor[vendedor].categorias[categoria]) {
            comisionesPorVendedor[vendedor].categorias[categoria].ventas += ventaItem;
            comisionesPorVendedor[vendedor].categorias[categoria].ganancias += margenItem;
            comisionesPorVendedor[vendedor].categorias[categoria].comision += comisionItem;
            comisionesPorVendedor[vendedor].categorias[categoria].unidades += unidades;
          }

          // Acumular totales del vendedor (solo una vez por item para evitar duplicación)
          totalVentasGeneral += ventaItem;
          totalGananciasGeneral += margenItem;
          totalComisionesGeneral += comisionItem;
        });

        // Acumular totales del vendedor
        comisionesPorVendedor[vendedor].totales.ventas += ventaTotal;
        comisionesPorVendedor[vendedor].totales.ganancias += margenTotal;
        comisionesPorVendedor[vendedor].totales.comision += comisionVenta;
        comisionesPorVendedor[vendedor].totales.unidades += unidadesTotales;
      }
    });

    const comisionesArray = Object.values(comisionesPorVendedor);
    setComisionesCalculadas(comisionesArray);
    setDetalleEquipos(equiposDetalle);

    setResumenGeneral({
      totalComisiones: totalComisionesGeneral,
      totalGanancias: totalGananciasGeneral,
      totalVentas: totalVentasGeneral,
      comisionPromedio: totalTransacciones > 0
        ? totalComisionesGeneral / totalTransacciones
        : 0
    });
  };

  // Guardar cambios en porcentaje
  const guardarPorcentaje = () => {
    setPorcentajeFijo(porcentajeTemp);
    setEditandoPorcentaje(false);
    // Guardar en localStorage
    localStorage.setItem('comisiones_porcentaje_fijo', JSON.stringify(porcentajeTemp));
  };

  // Cancelar edición de porcentaje
  const cancelarEdicion = () => {
    setPorcentajeTemp(porcentajeFijo);
    setEditandoPorcentaje(false);
  };

  // Cargar porcentaje guardado
  useEffect(() => {
    const porcentajeGuardado = localStorage.getItem('comisiones_porcentaje_fijo');
    if (porcentajeGuardado) {
      const parsed = JSON.parse(porcentajeGuardado);
      setPorcentajeFijo(parsed);
      setPorcentajeTemp(parsed);
    }
  }, []);


  const getIconoCategoria = (categoria) => {
    switch (categoria) {
      case 'computadora_nuevo': return '💻';
      case 'computadora_usado': return '🖥️';
      case 'celular_nuevo': return '📱';
      case 'celular_usado': return '📞';
      case 'otro': return '📦';
      default: return '❓';
    }
  };

  const getNombreCategoria = (categoria) => {
    switch (categoria) {
      case 'computadora_nuevo': return 'PC Nuevas';
      case 'computadora_usado': return 'PC Usadas';
      case 'celular_nuevo': return 'Celulares Nuevos';
      case 'celular_usado': return 'Celulares Usados';
      case 'otro': return 'Otros';
      default: return categoria;
    }
  };

  return (
    <div className="p-0 bg-slate-50">


      {/* Header con fondo slate */}
      <div className="bg-white rounded border border-slate-200 mb-6">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Calculator className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-semibold">Comisiones</h2>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros y configuración en una línea */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-end">
            {/* Fecha Inicio */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha Inicio
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Fecha Fin */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha Fin
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Vendedor */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Vendedor
              </label>
              <select
                value={vendedorSeleccionado}
                onChange={(e) => setVendedorSeleccionado(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="todos">Todos los vendedores</option>
                {getVendedores().map(vendedor => (
                  <option key={vendedor} value={vendedor}>{vendedor}</option>
                ))}
              </select>
            </div>

            {/* Porcentaje de comisión */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <TrendingUp className="w-4 h-4 inline mr-1" />
                Comisión %
              </label>
              {editandoPorcentaje ? (
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={porcentajeTemp}
                    onChange={(e) => setPorcentajeTemp(parseFloat(e.target.value) || 0)}
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-16 px-2 py-2 border border-slate-200 rounded text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <span className="text-slate-600 text-sm">%</span>
                </div>
              ) : (
                <div className="px-3 py-2 bg-slate-100 rounded font-semibold text-emerald-600">
                  {porcentajeFijo}%
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div>
              <div className="flex space-x-2">
                {editandoPorcentaje ? (
                  <>
                    <button
                      onClick={guardarPorcentaje}
                      className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                      title="Guardar porcentaje"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelarEdicion}
                      className="px-3 py-2 bg-slate-500 text-white rounded hover:bg-slate-600 transition-colors"
                      title="Cancelar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditandoPorcentaje(true)}
                    className="px-3 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition-colors"
                    title="Editar porcentaje"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Botón Calcular */}
            <div>
              <button
                onClick={() => calcularComisiones()}
                className="w-full bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-700 transition-colors"
              >
                Calcular
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen General usando Tarjeta */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Tarjeta 
          icon={Calculator}
          titulo="Total Comisiones"
          valor={formatearMonto(resumenGeneral.totalComisiones, 'USD')}
        />
        <Tarjeta 
          icon={TrendingUp}
          titulo="Total Ganancias"
          valor={formatearMonto(resumenGeneral.totalGanancias, 'USD')}
        />
        <Tarjeta
          icon={Settings}
          titulo="Comisión Promedio"
          valor={formatearMonto(resumenGeneral.comisionPromedio, 'USD')}
        />
        <Tarjeta 
          icon={FileText}
          titulo="Total Ventas"
          valor={formatearMonto(resumenGeneral.totalVentas, 'USD')}
        />
      </div>

      {/* Tabla de Comisiones por Vendedor */}
      {loading && <p className="text-slate-600">Cargando datos...</p>}
      {error && <p className="text-slate-600">Error: {error}</p>}
      
      {!loading && !error && (
        <div className="bg-white rounded border border-slate-200 overflow-hidden">
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Vendedor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Notebooks</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Celulares</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Otros</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Total Comisión</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Total Ganancia</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {comisionesCalculadas.map((vendedorData, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-slate-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-slate-900">{vendedorData.vendedor}</div>
                          <div className="text-xs text-slate-500">{vendedorData.totales.unidades} unidades</div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Notebooks (PC Nuevas + PC Usadas) */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-slate-900 font-medium">
                          {formatearMonto(vendedorData.categorias.computadora_nuevo.comision + vendedorData.categorias.computadora_usado.comision, 'USD')}
                        </div>
                        <div className="text-slate-500 text-xs">
                          {vendedorData.categorias.computadora_nuevo.unidades + vendedorData.categorias.computadora_usado.unidades} u.
                        </div>
                        <div className="text-slate-400 text-xs">
                          Ganancia: {formatearMonto(vendedorData.categorias.computadora_nuevo.ganancias + vendedorData.categorias.computadora_usado.ganancias, 'USD')}
                        </div>
                      </div>
                    </td>

                    {/* Celulares (Nuevos + Usados) */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-slate-900 font-medium">
                          {formatearMonto(vendedorData.categorias.celular_nuevo.comision + vendedorData.categorias.celular_usado.comision, 'USD')}
                        </div>
                        <div className="text-slate-500 text-xs">
                          {vendedorData.categorias.celular_nuevo.unidades + vendedorData.categorias.celular_usado.unidades} u.
                        </div>
                        <div className="text-slate-400 text-xs">
                          Ganancia: {formatearMonto(vendedorData.categorias.celular_nuevo.ganancias + vendedorData.categorias.celular_usado.ganancias, 'USD')}
                        </div>
                      </div>
                    </td>

                    {/* Otros */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-slate-600 font-medium">
                          {formatearMonto(vendedorData.categorias.otro.comision, 'USD')}
                        </div>
                        <div className="text-slate-500 text-xs">
                          {vendedorData.categorias.otro.unidades} u.
                        </div>
                        <div className="text-slate-400 text-xs">
                          Ganancia: {formatearMonto(vendedorData.categorias.otro.ganancias, 'USD')}
                        </div>
                      </div>
                    </td>

                    {/* Total Comisión */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-bold text-emerald-600">
                          {formatearMonto(vendedorData.totales.comision, 'USD')}
                        </div>
                        <div className="text-xs text-slate-500">
                          {vendedorData.totales.unidades} unidades
                        </div>
                      </div>
                    </td>

                    {/* Total Ganancia */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-bold text-slate-900">
                          {formatearMonto(vendedorData.totales.ganancias, 'USD')}
                        </div>
                        <div className="text-xs text-slate-500">
                          Ventas: {formatearMonto(vendedorData.totales.ventas, 'USD')}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {comisionesCalculadas.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <Calculator className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No se encontraron ventas en el período seleccionado</p>
              <p className="text-sm">Ajusta las fechas o verifica que haya ventas registradas</p>
            </div>
          )}
        </div>
      )}

      {/* Tabla de Detalle por Equipo */}
      {!loading && !error && detalleEquipos.length > 0 && (
        <div className="bg-white rounded border border-slate-200 overflow-hidden mt-8">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">
              Detalle por Equipo ({detalleEquipos.length} equipos vendidos)
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Información detallada de cada equipo vendido con su respectiva comisión
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase">Fecha</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase">Vendedor</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase">Equipo</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase">Serial/IMEI</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase">Tipo</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase">Condición</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase">Cant.</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase">P. Costo</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase">P. Venta</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase">Ganancia</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase">Comisión</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {detalleEquipos.map((equipo, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-700">
                      {new Date(equipo.fecha_venta).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-3 h-3 text-slate-400 mr-1" />
                        <span className="text-sm font-medium text-slate-900 truncate max-w-[100px]">
                          {equipo.vendedor}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm font-medium text-slate-900 max-w-[200px] truncate">
                        {equipo.nombre_equipo}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-600 font-mono">
                      {equipo.serial || 'N/A'}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        {equipo.tipo_producto === 'computadora' && <Monitor className="w-4 h-4 text-blue-500 mr-1" />}
                        {equipo.tipo_producto === 'celular' && <Smartphone className="w-4 h-4 text-green-500 mr-1" />}
                        {equipo.tipo_producto === 'otro' && <Box className="w-4 h-4 text-purple-500 mr-1" />}
                        <span className="text-xs font-medium text-slate-600 capitalize">
                          {equipo.tipo_producto === 'computadora' ? 'PC' : 
                           equipo.tipo_producto === 'celular' ? 'Celular' : 'Otro'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        equipo.condicion === 'nuevo' ? 'bg-emerald-100 text-emerald-800' :
                        equipo.condicion === 'usado' ? 'bg-yellow-100 text-yellow-800' :
                        equipo.condicion === 'refurbished' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {equipo.condicion.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-center text-slate-700 font-medium">
                      {equipo.cantidad}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-700">
                      {formatearMonto(equipo.precio_costo * equipo.cantidad, 'USD')}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                      {formatearMonto(equipo.precio_total, 'USD')}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-emerald-600">
                      {formatearMonto(equipo.ganancia, 'USD')}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-bold text-emerald-700">
                      {formatearMonto(equipo.comision, 'USD')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComisionesSection;
