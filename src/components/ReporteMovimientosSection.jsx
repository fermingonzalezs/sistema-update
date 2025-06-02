import React, { useState, useEffect } from 'react';
import { ArrowUpDown, Filter, Eye, Calendar, FileText, TrendingUp, DollarSign, Search, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Servicio para Reportes de Movimientos
const reporteMovimientosService = {
  async getMovimientos(filtros = {}) {
    console.log('📡 Obteniendo movimientos con filtros:', filtros);

    // Primero obtener IDs de asientos que cumplen filtros de fecha
    let asientosQuery = supabase
      .from('asientos_contables')
      .select('id');

    if (filtros.fechaDesde) {
      asientosQuery = asientosQuery.gte('fecha', filtros.fechaDesde);
    }
    if (filtros.fechaHasta) {
      asientosQuery = asientosQuery.lte('fecha', filtros.fechaHasta);
    }

    const { data: asientos, error: errorAsientos } = await asientosQuery;
    
    if (errorAsientos) {
      console.error('❌ Error obteniendo asientos:', errorAsientos);
      throw errorAsientos;
    }

    // Si hay filtros de fecha pero no se encontraron asientos, retornar vacío
    if ((filtros.fechaDesde || filtros.fechaHasta) && asientos.length === 0) {
      console.log('✅ No hay asientos en el rango de fechas');
      return [];
    }

    // Construir query de movimientos
    let query = supabase
      .from('movimientos_contables')
      .select(`
        *,
        plan_cuentas (id, codigo, nombre),
        asientos_contables (
          id, numero, fecha, descripcion, usuario
        )
      `)
      .order('id', { ascending: false });

    // Filtrar por asientos encontrados (si hay filtros de fecha)
    if (filtros.fechaDesde || filtros.fechaHasta) {
      const asientoIds = asientos.map(a => a.id);
      query = query.in('asiento_id', asientoIds);
    }

    // Aplicar otros filtros
    if (filtros.cuentaId) {
      query = query.eq('cuenta_id', filtros.cuentaId);
    }
    if (filtros.tipoMovimiento && filtros.tipoMovimiento !== 'todos') {
      if (filtros.tipoMovimiento === 'debe') {
        query = query.gt('debe', 0);
      } else if (filtros.tipoMovimiento === 'haber') {
        query = query.gt('haber', 0);
      }
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error obteniendo movimientos:', error);
      throw error;
    }

    console.log(`✅ ${data.length} movimientos obtenidos`);
    return data;
  },

  async getCuentasConMovimientos() {
    console.log('📡 Obteniendo cuentas con movimientos...');

    const { data, error } = await supabase
      .from('plan_cuentas')
      .select(`
        id, codigo, nombre,
        movimientos_contables!inner (id)
      `)
      .eq('activa', true)
      .order('codigo');

    if (error) {
      console.error('❌ Error obteniendo cuentas:', error);
      throw error;
    }

    // Remover duplicados
    const cuentasUnicas = data.reduce((acc, cuenta) => {
      const existing = acc.find(c => c.id === cuenta.id);
      if (!existing) {
        acc.push({
          id: cuenta.id,
          codigo: cuenta.codigo,
          nombre: cuenta.nombre
        });
      }
      return acc;
    }, []);

    console.log(`✅ ${cuentasUnicas.length} cuentas con movimientos`);
    return cuentasUnicas;
  },

  async getSaldosPorCuenta(fechaCorte = null) {
    console.log('📊 Calculando saldos por cuenta...');

    // Si hay fecha de corte, primero obtener asientos válidos
    let asientoIds = null;
    if (fechaCorte) {
      const { data: asientos, error: errorAsientos } = await supabase
        .from('asientos_contables')
        .select('id')
        .lte('fecha', fechaCorte);
      
      if (errorAsientos) throw errorAsientos;
      asientoIds = asientos.map(a => a.id);
    }

    let query = supabase
      .from('movimientos_contables')
      .select(`
        cuenta_id,
        debe,
        haber,
        plan_cuentas (codigo, nombre),
        asiento_id
      `);

    // Filtrar por fecha si es necesario
    if (asientoIds) {
      query = query.in('asiento_id', asientoIds);
    }

    const { data, error } = await query;
    
    if (error) throw error;

    // Agrupar por cuenta y calcular saldos
    const saldos = data.reduce((acc, mov) => {
      const cuentaId = mov.cuenta_id;
      if (!acc[cuentaId]) {
        acc[cuentaId] = {
          cuenta: mov.plan_cuentas,
          totalDebe: 0,
          totalHaber: 0,
          saldo: 0
        };
      }
      acc[cuentaId].totalDebe += parseFloat(mov.debe || 0);
      acc[cuentaId].totalHaber += parseFloat(mov.haber || 0);
      
      // Calcular saldo simple (debe - haber)
      acc[cuentaId].saldo = acc[cuentaId].totalDebe - acc[cuentaId].totalHaber;
      
      return acc;
    }, {});

    return Object.values(saldos);
  }
};

// Hook personalizado
function useReporteMovimientos() {
  const [movimientos, setMovimientos] = useState([]);
  const [cuentasDisponibles, setCuentasDisponibles] = useState([]);
  const [saldos, setSaldos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMovimientos = async (filtros = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await reporteMovimientosService.getMovimientos(filtros);
      setMovimientos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCuentasDisponibles = async () => {
    try {
      const data = await reporteMovimientosService.getCuentasConMovimientos();
      setCuentasDisponibles(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchSaldos = async (fechaCorte = null) => {
    try {
      const data = await reporteMovimientosService.getSaldosPorCuenta(fechaCorte);
      setSaldos(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return {
    movimientos,
    cuentasDisponibles,
    saldos,
    loading,
    error,
    fetchMovimientos,
    fetchCuentasDisponibles,
    fetchSaldos
  };
}

// Componente principal
const ReporteMovimientosSection = () => {
  const {
    movimientos,
    cuentasDisponibles,
    saldos,
    loading,
    error,
    fetchMovimientos,
    fetchCuentasDisponibles,
    fetchSaldos
  } = useReporteMovimientos();

  const [filtros, setFiltros] = useState({
    fechaDesde: '',
    fechaHasta: '',
    cuentaId: '',
    tipoMovimiento: 'todos'
  });

  const [vistaActual, setVistaActual] = useState('movimientos'); // 'movimientos' | 'saldos'
  const [asientosExpandidos, setAsientosExpandidos] = useState(new Set());

  useEffect(() => {
    console.log('🚀 Iniciando carga de reporte de movimientos...');
    fetchCuentasDisponibles();
    fetchMovimientos();
    fetchSaldos();
  }, []);

  const aplicarFiltros = () => {
    fetchMovimientos(filtros);
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaDesde: '',
      fechaHasta: '',
      cuentaId: '',
      tipoMovimiento: 'todos'
    });
    fetchMovimientos();
  };

  const toggleAsiento = (asientoId) => {
    const nuevosExpandidos = new Set(asientosExpandidos);
    if (nuevosExpandidos.has(asientoId)) {
      nuevosExpandidos.delete(asientoId);
    } else {
      nuevosExpandidos.add(asientoId);
    }
    setAsientosExpandidos(nuevosExpandidos);
  };

  // Agrupar movimientos por asiento
  const movimientosPorAsiento = movimientos.reduce((acc, mov) => {
    const asientoId = mov.asientos_contables.id;
    if (!acc[asientoId]) {
      acc[asientoId] = {
        asiento: mov.asientos_contables,
        movimientos: []
      };
    }
    acc[asientoId].movimientos.push(mov);
    return acc;
  }, {});

  const asientosAgrupados = Object.values(movimientosPorAsiento);

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD'
    }).format(valor);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  const getTipoColor = (codigo) => {
    // Determinar tipo por código de cuenta
    const primerDigito = codigo.charAt(0);
    switch (primerDigito) {
      case '1': return 'text-blue-600 bg-blue-50'; // Activo
      case '2': return 'text-red-600 bg-red-50';   // Pasivo
      case '3': return 'text-purple-600 bg-purple-50'; // Patrimonio
      case '4': return 'text-green-600 bg-green-50';   // Ingresos
      case '5': return 'text-orange-600 bg-orange-50'; // Gastos
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTipoTexto = (codigo) => {
    const primerDigito = codigo.charAt(0);
    switch (primerDigito) {
      case '1': return 'ACTIVO';
      case '2': return 'PASIVO';
      case '3': return 'PATRIMONIO';
      case '4': return 'INGRESO';
      case '5': return 'GASTO';
      default: return 'OTRO';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando reporte de movimientos...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <ArrowUpDown size={28} />
              <div>
                <h1 className="text-2xl font-bold">Reporte de Movimientos</h1>
                <p className="text-blue-100 mt-1">Análisis detallado de movimientos contables</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Selector de vista */}
              <div className="flex bg-white/20 rounded-lg p-1">
                <button
                  onClick={() => setVistaActual('movimientos')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    vistaActual === 'movimientos' 
                      ? 'bg-white text-blue-600' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <FileText size={16} className="inline mr-2" />
                  Movimientos
                </button>
                <button
                  onClick={() => setVistaActual('saldos')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    vistaActual === 'saldos' 
                      ? 'bg-white text-blue-600' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <TrendingUp size={16} className="inline mr-2" />
                  Saldos
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-gray-50 p-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <input
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <input
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta</label>
              <select
                value={filtros.cuentaId}
                onChange={(e) => setFiltros({ ...filtros, cuentaId: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">Todas las cuentas</option>
                {cuentasDisponibles.map(cuenta => (
                  <option key={cuenta.id} value={cuenta.id}>
                    {cuenta.codigo} - {cuenta.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={filtros.tipoMovimiento}
                onChange={(e) => setFiltros({ ...filtros, tipoMovimiento: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="todos">Todos</option>
                <option value="debe">Solo Debe</option>
                <option value="haber">Solo Haber</option>
              </select>
            </div>
            <div className="flex items-end space-x-2">
              <button
                onClick={aplicarFiltros}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-2"
              >
                <Filter size={16} />
                Filtrar
              </button>
              <button
                onClick={limpiarFiltros}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 m-6">
            <div className="flex items-center">
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Vista de Movimientos */}
        {vistaActual === 'movimientos' && (
          <div className="p-6">
            {asientosAgrupados.length > 0 ? (
              <div className="space-y-3">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {asientosAgrupados.length} asientos encontrados
                  </h3>
                </div>

                {asientosAgrupados.map((grupo, index) => (
                  <div key={grupo.asiento.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Header del asiento */}
                    <div 
                      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => toggleAsiento(grupo.asiento.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                          {asientosExpandidos.has(grupo.asiento.id) ? 
                            <ChevronDown size={16} className="text-gray-600" /> : 
                            <ChevronRight size={16} className="text-gray-600" />
                          }
                        </button>
                        
                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          N° {grupo.asiento.numero}
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar size={14} />
                          <span>{formatearFecha(grupo.asiento.fecha)}</span>
                        </div>
                        
                        <div className="font-medium text-gray-900">
                          {grupo.asiento.descripcion}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-500">{grupo.movimientos.length} movimientos</div>
                        <div className="font-semibold text-blue-600">
                          {formatearMoneda(grupo.movimientos.reduce((sum, mov) => sum + parseFloat(mov.debe || 0), 0))}
                        </div>
                      </div>
                    </div>

                    {/* Detalle de movimientos */}
                    {asientosExpandidos.has(grupo.asiento.id) && (
                      <div className="border-t bg-white">
                        <table className="w-full">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="text-left py-3 px-6 font-medium text-gray-700">Cuenta</th>
                              <th className="text-right py-3 px-6 font-medium text-gray-700">Debe</th>
                              <th className="text-right py-3 px-6 font-medium text-gray-700">Haber</th>
                            </tr>
                          </thead>
                          <tbody>
                            {grupo.movimientos.map((mov, movIndex) => (
                              <tr key={movIndex} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-6">
                                  <div className={mov.haber > 0 ? "ml-8" : ""}>
                                    <div className="flex items-center space-x-2">
                                      <code className="text-sm text-blue-600 font-mono">
                                        {mov.plan_cuentas.codigo}
                                      </code>
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTipoColor(mov.plan_cuentas.codigo)}`}>
                                        {getTipoTexto(mov.plan_cuentas.codigo)}
                                      </span>
                                    </div>
                                    <div className="text-gray-700 mt-1">{mov.plan_cuentas.nombre}</div>
                                  </div>
                                </td>
                                <td className="text-right py-3 px-6 font-medium">
                                  {mov.debe > 0 ? formatearMoneda(mov.debe) : ''}
                                </td>
                                <td className="text-right py-3 px-6 font-medium">
                                  {mov.haber > 0 ? formatearMoneda(mov.haber) : ''}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ArrowUpDown size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No se encontraron movimientos con los filtros aplicados</p>
              </div>
            )}
          </div>
        )}

        {/* Vista de Saldos */}
        {vistaActual === 'saldos' && (
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Balance de Saldos - {saldos.length} cuentas
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Código</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Cuenta</th>
                    <th className="text-center py-3 px-6 font-medium text-gray-700">Tipo</th>
                    <th className="text-right py-3 px-6 font-medium text-gray-700">Total Debe</th>
                    <th className="text-right py-3 px-6 font-medium text-gray-700">Total Haber</th>
                    <th className="text-right py-3 px-6 font-medium text-gray-700">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {saldos.map((saldo, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-6">
                        <code className="text-sm text-blue-600 font-mono">
                          {saldo.cuenta.codigo}
                        </code>
                      </td>
                      <td className="py-3 px-6 text-gray-900">{saldo.cuenta.nombre}</td>
                      <td className="py-3 px-6 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTipoColor(saldo.cuenta.codigo)}`}>
                          {getTipoTexto(saldo.cuenta.codigo)}
                        </span>
                      </td>
                      <td className="text-right py-3 px-6 font-medium text-green-600">
                        {formatearMoneda(saldo.totalDebe)}
                      </td>
                      <td className="text-right py-3 px-6 font-medium text-red-600">
                        {formatearMoneda(saldo.totalHaber)}
                      </td>
                      <td className="text-right py-3 px-6 font-bold">
                        <span className={saldo.saldo >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatearMoneda(Math.abs(saldo.saldo))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr className="font-semibold">
                    <td colSpan="3" className="py-3 px-6 text-gray-700">TOTALES</td>
                    <td className="text-right py-3 px-6 text-green-600">
                      {formatearMoneda(saldos.reduce((sum, s) => sum + s.totalDebe, 0))}
                    </td>
                    <td className="text-right py-3 px-6 text-red-600">
                      {formatearMoneda(saldos.reduce((sum, s) => sum + s.totalHaber, 0))}
                    </td>
                    <td className="text-right py-3 px-6 text-blue-600">
                      {formatearMoneda(saldos.reduce((sum, s) => sum + Math.abs(s.saldo), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Estadísticas */}
        {movimientos.length > 0 && vistaActual === 'movimientos' && (
          <div className="bg-gray-50 p-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-800">{movimientos.length}</div>
                <div className="text-sm text-gray-600">Movimientos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {formatearMoneda(movimientos.reduce((sum, m) => sum + parseFloat(m.debe || 0), 0))}
                </div>
                <div className="text-sm text-gray-600">Total Debe</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {formatearMoneda(movimientos.reduce((sum, m) => sum + parseFloat(m.haber || 0), 0))}
                </div>
                <div className="text-sm text-gray-600">Total Haber</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{asientosAgrupados.length}</div>
                <div className="text-sm text-gray-600">Asientos</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReporteMovimientosSection;