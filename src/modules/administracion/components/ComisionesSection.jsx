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
  const [resumenGeneral, setResumenGeneral] = useState({
    totalComisiones: 0,
    totalGanancias: 0,
    porcentajeRepresentacion: 0,
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

  // Función para obtener la condición de un producto
  const obtenerCondicionProducto = async (tipoProducto, productoId) => {
    if (tipoProducto === 'otro') {
      return 'nuevo'; // Los "otros" no tienen condición, asumimos nuevo
    }
    
    const tabla = tipoProducto === 'computadora' ? 'inventario' : 'celulares';
    const { data, error } = await supabase
      .from(tabla)
      .select('condicion')
      .eq('id', productoId)
      .single();
    
    if (error) {
      console.warn(`Error obteniendo condición para ${tipoProducto} ${productoId}:`, error);
      return 'usado'; // Por defecto asumimos usado si hay error
    }
    
    // Normalizar la condición a minúsculas
    return (data?.condicion || 'usado').toLowerCase();
  };

  // Calcular comisiones por vendedor y categoría
  const calcularComisiones = async () => {
    const ventasFiltradas = filtrarVentas();
    const comisionesPorVendedor = {};
    
    let totalGananciasGeneral = 0;
    let totalVentasGeneral = 0;
    let totalComisionesGeneral = 0;

    // Obtener todas las condiciones de productos primero
    const productosCondiciones = {};
    
    for (const venta of ventasFiltradas) {
      if (venta.venta_items) {
        for (const item of venta.venta_items) {
          const key = `${item.tipo_producto}-${item.producto_id}`;
          if (!productosCondiciones[key]) {
            productosCondiciones[key] = await obtenerCondicionProducto(item.tipo_producto, item.producto_id);
          }
        }
      }
    }

    ventasFiltradas.forEach(venta => {
      const vendedor = venta.vendedor;
      
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
      const ventaTotal = parseFloat(venta.total_venta || 0);
      
      // Calcular unidades totales de la venta
      const unidadesTotales = venta.venta_items ? venta.venta_items.reduce((sum, item) => sum + (item.cantidad || 1), 0) : 1;

      // Distribuir comisión proporcionalmente entre items
      if (venta.venta_items && venta.venta_items.length > 0) {
        venta.venta_items.forEach(item => {
          // Determinar categoría basada en tipo y condición
          const getCategoriaCompleta = (tipoProducto, condicion) => {
            const condicionNormalizada = (condicion || 'usado').toLowerCase();
            if (tipoProducto === 'computadora') {
              return condicionNormalizada === 'nuevo' ? 'computadora_nuevo' : 'computadora_usado';
            } else if (tipoProducto === 'celular') {
              return condicionNormalizada === 'nuevo' ? 'celular_nuevo' : 'celular_usado';
            } else {
              return 'otro';
            }
          };

          // Obtener la condición del cache
          const key = `${item.tipo_producto}-${item.producto_id}`;
          const condicion = productosCondiciones[key] || 'usado';
          const categoria = getCategoriaCompleta(item.tipo_producto, condicion);
          const ventaItem = parseFloat(item.precio_total || 0);
          const unidades = item.cantidad || 1;
          
          // Distribución proporcional de comisión y ganancia basada en valor del item
          const proporcionItem = ventaTotal > 0 ? ventaItem / ventaTotal : 0;
          const comisionItem = comisionVenta * proporcionItem;
          const gananciaItem = margenTotal * proporcionItem;

          // Acumular por categoría
          if (comisionesPorVendedor[vendedor].categorias[categoria]) {
            comisionesPorVendedor[vendedor].categorias[categoria].ventas += ventaItem;
            comisionesPorVendedor[vendedor].categorias[categoria].ganancias += gananciaItem;
            comisionesPorVendedor[vendedor].categorias[categoria].comision += comisionItem;
            comisionesPorVendedor[vendedor].categorias[categoria].unidades += unidades;
          }

          // Acumular totales del vendedor (solo una vez por item para evitar duplicación)
          totalVentasGeneral += ventaItem;
          totalGananciasGeneral += gananciaItem;
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

    setResumenGeneral({
      totalComisiones: totalComisionesGeneral,
      totalGanancias: totalGananciasGeneral,
      totalVentas: totalVentasGeneral,
      porcentajeRepresentacion: totalGananciasGeneral > 0 
        ? (totalComisionesGeneral / totalGananciasGeneral) * 100 
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
      

      {/* Filtros */}
      <div className="bg-white p-6 rounded border border-slate-200 mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Filtros y Configuración</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

          {/* Botón para actualizar */}
          <div className="flex items-end">
            <button
              onClick={() => calcularComisiones()}
              className="w-full bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-700 transition-colors"
            >
              Calcular
            </button>
          </div>
        </div>

        {/* Configuración de Porcentaje Fijo */}
        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-slate-700">
              <Calculator className="w-4 h-4 inline mr-1" />
              Porcentaje de Comisión Fijo (sobre ganancia)
            </h4>
            {!editandoPorcentaje ? (
              <button
                onClick={() => setEditandoPorcentaje(true)}
                className="text-slate-600 hover:text-slate-800 flex items-center space-x-1 text-sm"
              >
                <Edit2 className="w-4 h-4" />
                <span>Editar</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={guardarPorcentaje}
                  className="text-emerald-600 hover:text-emerald-800 flex items-center space-x-1 text-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar</span>
                </button>
                <button
                  onClick={cancelarEdicion}
                  className="text-slate-600 hover:text-slate-800 flex items-center space-x-1 text-sm"
                >
                  <X className="w-4 h-4" />
                  <span>Cancelar</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4 p-4 bg-slate-100 rounded">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-slate-600" />
              <span className="font-medium text-slate-800">Porcentaje de comisión para todas las categorías:</span>
            </div>
            {editandoPorcentaje ? (
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={porcentajeTemp}
                  onChange={(e) => setPorcentajeTemp(parseFloat(e.target.value) || 0)}
                  step="0.1"
                  min="0"
                  max="100"
                  className="w-20 px-3 py-2 border border-slate-300 rounded text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <span className="text-slate-600">%</span>
              </div>
            ) : (
              <span className="font-semibold text-lg text-emerald-600">
                {porcentajeFijo}%
              </span>
            )}
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
          titulo="% Representación"
          valor={`${resumenGeneral.porcentajeRepresentacion.toFixed(1)}%`}
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
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">
              Comisiones por Vendedor ({fechaInicio} - {fechaFin})
            </h3>
          </div>
          
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
    </div>
  );
};

export default ComisionesSection;
