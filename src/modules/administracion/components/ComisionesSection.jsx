import React, { useState, useEffect } from 'react';
import { Calculator, User, DollarSign, Calendar, Settings, TrendingUp, Edit2, Save, X, FileText, Monitor, Smartphone, Box } from 'lucide-react';

const ComisionesSection = ({ ventas, loading, error, onLoadStats }) => {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState('todos');
  const [porcentajes, setPorcentajes] = useState({
    computadora_nuevo: 6.0,
    computadora_usado: 4.0,
    celular_nuevo: 8.0,
    celular_usado: 6.0,
    otro: 3.0
  });
  const [editandoPorcentajes, setEditandoPorcentajes] = useState(false);
  const [porcentajesTemp, setPorcentajesTemp] = useState(porcentajes);

  // Estados para resultados
  const [comisionesCalculadas, setComisionesCalculadas] = useState([]);
  const [resumenGeneral, setResumenGeneral] = useState({
    totalComisiones: 0,
    totalGanancias: 0,
    porcentajeRepresentacion: 0,
    totalVentas: 0
  });

  // Establecer fechas por defecto al cargar
  useEffect(() => {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    setFechaFin(hoy.toISOString().split('T')[0]);
    setFechaInicio(inicioMes.toISOString().split('T')[0]);
  }, []);

  // Calcular comisiones cuando cambien los filtros
  useEffect(() => {
    if (fechaInicio && fechaFin) {
      calcularComisiones();
    }
  }, [fechaInicio, fechaFin, vendedorSeleccionado, porcentajes, ventas]);

  // Obtener lista única de vendedores
  const getVendedores = () => {
    const vendedores = [...new Set(ventas
      .filter(venta => venta.vendedor && venta.vendedor.trim() !== '')
      .map(venta => venta.vendedor)
    )];
    return vendedores.sort();
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
    
    let totalGananciasGeneral = 0;
    let totalVentasGeneral = 0;
    let totalComisionesGeneral = 0;

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

      // Procesar cada item de la venta
      venta.venta_items.forEach(item => {
        // Determinar categoría basada en tipo y condición
        const getCategoriaCompleta = (tipoProducto, condicion) => {
          if (tipoProducto === 'computadora') {
            return condicion === 'nuevo' ? 'computadora_nuevo' : 'computadora_usado';
          } else if (tipoProducto === 'celular') {
            return condicion === 'nuevo' ? 'celular_nuevo' : 'celular_usado';
          } else {
            return 'otro';
          }
        };

        const categoria = getCategoriaCompleta(item.tipo_producto, item.condicion);
        const ventaItem = item.precio_total || 0;
        const gananciaItem = item.margen_item || 0;
        const unidades = item.cantidad || 1;
        
        // Calcular comisión basada en la ganancia
        const comisionItem = gananciaItem * (porcentajes[categoria] / 100);

        // Acumular por categoría
        if (comisionesPorVendedor[vendedor].categorias[categoria]) {
          comisionesPorVendedor[vendedor].categorias[categoria].ventas += ventaItem;
          comisionesPorVendedor[vendedor].categorias[categoria].ganancias += gananciaItem;
          comisionesPorVendedor[vendedor].categorias[categoria].comision += comisionItem;
          comisionesPorVendedor[vendedor].categorias[categoria].unidades += unidades;
        }

        // Acumular totales del vendedor
        comisionesPorVendedor[vendedor].totales.ventas += ventaItem;
        comisionesPorVendedor[vendedor].totales.ganancias += gananciaItem;
        comisionesPorVendedor[vendedor].totales.comision += comisionItem;
        comisionesPorVendedor[vendedor].totales.unidades += unidades;

        // Acumular totales generales
        totalVentasGeneral += ventaItem;
        totalGananciasGeneral += gananciaItem;
        totalComisionesGeneral += comisionItem;
      });
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

  // Guardar cambios en porcentajes
  const guardarPorcentajes = () => {
    setPorcentajes(porcentajesTemp);
    setEditandoPorcentajes(false);
    // Aquí podrías guardar en localStorage o base de datos
    localStorage.setItem('comisiones_porcentajes', JSON.stringify(porcentajesTemp));
  };

  // Cancelar edición de porcentajes
  const cancelarEdicion = () => {
    setPorcentajesTemp(porcentajes);
    setEditandoPorcentajes(false);
  };

  // Cargar porcentajes guardados
  useEffect(() => {
    const porcentajesGuardados = localStorage.getItem('comisiones_porcentajes');
    if (porcentajesGuardados) {
      const parsed = JSON.parse(porcentajesGuardados);
      setPorcentajes(parsed);
      setPorcentajesTemp(parsed);
    }
  }, []);

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(valor);
  };

  const getColorCategoria = (categoria) => {
    switch (categoria) {
      case 'computadora_nuevo': return 'text-blue-600';
      case 'computadora_usado': return 'text-blue-400';
      case 'celular_nuevo': return 'text-green-600';
      case 'celular_usado': return 'text-green-400';
      case 'otro': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

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
    <div className="p-8">
      {/* Header con azul degradado como VentasSection */}
      <div className="flex items-center justify-between mb-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl py-10 px-8">
        <div>
          <h2 className="text-4xl font-bold text-white">Comisiones</h2>
          <p className="text-blue-100 mt-2 text-lg">Cálculo y resumen de comisiones por ventas</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Calculator className="w-8 h-8 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-800">Cálculo de Comisiones</h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {comisionesCalculadas.length} vendedores
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Filtros y Configuración</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Fecha Inicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Fecha Fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Vendedor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Vendedor
            </label>
            <select
              value={vendedorSeleccionado}
              onChange={(e) => setVendedorSeleccionado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
              onClick={calcularComisiones}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Calcular
            </button>
          </div>
        </div>

        {/* Configuración de Porcentajes */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-700">
              <Settings className="w-4 h-4 inline mr-1" />
              Porcentajes de Comisión por Categoría
            </h4>
            {!editandoPorcentajes ? (
              <button
                onClick={() => setEditandoPorcentajes(true)}
                className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <Edit2 className="w-4 h-4" />
                <span>Editar</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={guardarPorcentajes}
                  className="text-green-600 hover:text-green-800 flex items-center space-x-1"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar</span>
                </button>
                <button
                  onClick={cancelarEdicion}
                  className="text-red-600 hover:text-red-800 flex items-center space-x-1"
                >
                  <X className="w-4 h-4" />
                  <span>Cancelar</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(editandoPorcentajes ? porcentajesTemp : porcentajes).map(([categoria, porcentaje]) => (
              <div key={categoria} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xl">{getIconoCategoria(categoria)}</span>
                <span className="font-medium flex-1 text-sm">{getNombreCategoria(categoria)}:</span>
                {editandoPorcentajes ? (
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      value={porcentaje}
                      onChange={(e) => setPorcentajesTemp(prev => ({
                        ...prev,
                        [categoria]: parseFloat(e.target.value) || 0
                      }))}
                      step="0.1"
                      min="0"
                      max="100"
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                ) : (
                  <span className={`font-semibold text-sm ${getColorCategoria(categoria)}`}>
                    {porcentaje}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Comisiones</p>
              <p className="text-2xl font-bold">{formatearMoneda(resumenGeneral.totalComisiones)}</p>
            </div>
            <Calculator className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-emerald-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Total Ganancias</p>
              <p className="text-2xl font-bold">{formatearMoneda(resumenGeneral.totalGanancias)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-200" />
          </div>
        </div>
        <div className="bg-orange-500 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">% Representación</p>
              <p className="text-2xl font-bold">{resumenGeneral.porcentajeRepresentacion.toFixed(1)}%</p>
            </div>
            <Settings className="w-8 h-8 text-orange-200" />
          </div>
        </div>
        <div className="bg-violet-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-violet-100 text-sm">Total Ventas</p>
              <p className="text-2xl font-bold">{formatearMoneda(resumenGeneral.totalVentas)}</p>
            </div>
            <FileText className="w-8 h-8 text-violet-200" />
          </div>
        </div>
      </div>

      {/* Tabla de Comisiones por Vendedor */}
      {loading && <p className="text-blue-600">Cargando datos...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      
      {!loading && !error && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Comisiones por Vendedor ({fechaInicio} - {fechaFin})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-green-500 to-blue-500">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Vendedor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">PC Nuevas</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">PC Usadas</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Cel. Nuevos</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Cel. Usados</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Otros</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comisionesCalculadas.map((vendedorData, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{vendedorData.vendedor}</div>
                          <div className="text-xs text-gray-500">{vendedorData.totales.unidades} unidades</div>
                        </div>
                      </div>
                    </td>
                    
                    {/* PC Nuevas */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-blue-600 font-medium">
                          {formatearMoneda(vendedorData.categorias.computadora_nuevo.comision)}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {vendedorData.categorias.computadora_nuevo.unidades} u.
                        </div>
                      </div>
                    </td>

                    {/* PC Usadas */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-blue-400 font-medium">
                          {formatearMoneda(vendedorData.categorias.computadora_usado.comision)}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {vendedorData.categorias.computadora_usado.unidades} u.
                        </div>
                      </div>
                    </td>

                    {/* Celulares Nuevos */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-green-600 font-medium">
                          {formatearMoneda(vendedorData.categorias.celular_nuevo.comision)}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {vendedorData.categorias.celular_nuevo.unidades} u.
                        </div>
                      </div>
                    </td>

                    {/* Celulares Usados */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-green-400 font-medium">
                          {formatearMoneda(vendedorData.categorias.celular_usado.comision)}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {vendedorData.categorias.celular_usado.unidades} u.
                        </div>
                      </div>
                    </td>

                    {/* Otros */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-purple-600 font-medium">
                          {formatearMoneda(vendedorData.categorias.otro.comision)}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {vendedorData.categorias.otro.unidades} u.
                        </div>
                      </div>
                    </td>

                    {/* Total */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-bold text-gray-900">
                          {formatearMoneda(vendedorData.totales.comision)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Ventas: {formatearMoneda(vendedorData.totales.ventas)}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {comisionesCalculadas.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-300" />
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