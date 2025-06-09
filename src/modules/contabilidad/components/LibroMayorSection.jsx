import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Calendar, TrendingUp, DollarSign, FileText, Eye, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

// Servicio para Libro Mayor
const libroMayorService = {
  async getCuentasConMovimientos() {
    console.log('📡 Obteniendo cuentas para libro mayor...');

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

    // Remover duplicados y contar movimientos
    const cuentasUnicas = data.reduce((acc, cuenta) => {
      const existing = acc.find(c => c.id === cuenta.id);
      if (!existing) {
        acc.push({
          id: cuenta.id,
          codigo: cuenta.codigo,
          nombre: cuenta.nombre,
          cantidadMovimientos: data.filter(c => c.id === cuenta.id).length
        });
      }
      return acc;
    }, []);

    console.log(`✅ ${cuentasUnicas.length} cuentas con movimientos`);
    return cuentasUnicas;
  },

  async getLibroMayorCuenta(cuentaId, fechaDesde = null, fechaHasta = null) {
    console.log('📖 Obteniendo libro mayor para cuenta:', cuentaId);

    // Primero obtener información de la cuenta
    const { data: cuenta, error: errorCuenta } = await supabase
      .from('plan_cuentas')
      .select('*')
      .eq('id', cuentaId)
      .single();

    if (errorCuenta) throw errorCuenta;

    // Obtener asientos válidos por fecha
    let asientosQuery = supabase
      .from('asientos_contables')
      .select('id, fecha')
      .order('fecha', { ascending: true });

    if (fechaDesde) {
      asientosQuery = asientosQuery.gte('fecha', fechaDesde);
    }
    if (fechaHasta) {
      asientosQuery = asientosQuery.lte('fecha', fechaHasta);
    }

    const { data: asientos, error: errorAsientos } = await asientosQuery;
    if (errorAsientos) throw errorAsientos;

    const asientoIds = asientos.map(a => a.id);

    // Obtener movimientos de la cuenta específica
    let movimientosQuery = supabase
      .from('movimientos_contables')
      .select(`
        *,
        asientos_contables (
          id, numero, fecha, descripcion, usuario
        )
      `)
      .eq('cuenta_id', cuentaId)
      .in('asiento_id', asientoIds)
      .order('asientos_contables(fecha)', { ascending: true });

    const { data: movimientos, error: errorMovimientos } = await movimientosQuery;
    if (errorMovimientos) throw errorMovimientos;

    // Calcular saldo inicial (movimientos antes de fechaDesde)
    let saldoInicial = 0;
    if (fechaDesde) {
      const { data: asientosAnteriores } = await supabase
        .from('asientos_contables')
        .select('id')
        .lt('fecha', fechaDesde);

      if (asientosAnteriores && asientosAnteriores.length > 0) {
        const asientoIdsAnteriores = asientosAnteriores.map(a => a.id);
        
        const { data: movimientosAnteriores } = await supabase
          .from('movimientos_contables')
          .select('debe, haber')
          .eq('cuenta_id', cuentaId)
          .in('asiento_id', asientoIdsAnteriores);

        if (movimientosAnteriores) {
          saldoInicial = movimientosAnteriores.reduce((acc, mov) => {
            return acc + parseFloat(mov.debe || 0) - parseFloat(mov.haber || 0);
          }, 0);
        }
      }
    }

    // Calcular saldos acumulados
    let saldoAcumulado = saldoInicial;
    const movimientosConSaldo = movimientos.map(mov => {
      const debe = parseFloat(mov.debe || 0);
      const haber = parseFloat(mov.haber || 0);
      saldoAcumulado += debe - haber;
      
      return {
        ...mov,
        saldoAnterior: saldoAcumulado - debe + haber,
        saldoActual: saldoAcumulado
      };
    });

    return {
      cuenta,
      saldoInicial,
      movimientos: movimientosConSaldo,
      saldoFinal: saldoAcumulado,
      totalDebe: movimientos.reduce((sum, m) => sum + parseFloat(m.debe || 0), 0),
      totalHaber: movimientos.reduce((sum, m) => sum + parseFloat(m.haber || 0), 0)
    };
  },

  async getEstadisticasCuenta(cuentaId) {
    console.log('📊 Calculando estadísticas para cuenta:', cuentaId);

    const { data: movimientos, error } = await supabase
      .from('movimientos_contables')
      .select(`
        debe, haber,
        asientos_contables (fecha)
      `)
      .eq('cuenta_id', cuentaId);

    if (error) throw error;

    const totalMovimientos = movimientos.length;
    const totalDebe = movimientos.reduce((sum, m) => sum + parseFloat(m.debe || 0), 0);
    const totalHaber = movimientos.reduce((sum, m) => sum + parseFloat(m.haber || 0), 0);
    const saldoActual = totalDebe - totalHaber;

    // Calcular actividad por mes
    const ahora = new Date();
    const hace30Dias = new Date(ahora);
    hace30Dias.setDate(ahora.getDate() - 30);

    const movimientosRecientes = movimientos.filter(m => 
      new Date(m.asientos_contables.fecha) >= hace30Dias
    );

    return {
      totalMovimientos,
      totalDebe,
      totalHaber,
      saldoActual,
      movimientosUltimos30Dias: movimientosRecientes.length,
      promedioMovimientoMensual: Math.round(totalMovimientos / 12) // Estimación
    };
  }
};

// Hook personalizado
function useLibroMayor() {
  const [cuentas, setCuentas] = useState([]);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
  const [libroMayor, setLibroMayor] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCuentas = async () => {
    try {
      setError(null);
      const data = await libroMayorService.getCuentasConMovimientos();
      setCuentas(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchLibroMayor = async (cuentaId, fechaDesde = null, fechaHasta = null) => {
    try {
      setLoading(true);
      setError(null);
      const data = await libroMayorService.getLibroMayorCuenta(cuentaId, fechaDesde, fechaHasta);
      setLibroMayor(data);
      
      // También obtener estadísticas
      const stats = await libroMayorService.getEstadisticasCuenta(cuentaId);
      setEstadisticas(stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    cuentas,
    cuentaSeleccionada,
    libroMayor,
    estadisticas,
    loading,
    error,
    fetchCuentas,
    fetchLibroMayor,
    setCuentaSeleccionada
  };
}

// Componente principal
const LibroMayorSection = () => {
  const {
    cuentas,
    cuentaSeleccionada,
    libroMayor,
    estadisticas,
    loading,
    error,
    fetchCuentas,
    fetchLibroMayor,
    setCuentaSeleccionada
  } = useLibroMayor();

  const [filtros, setFiltros] = useState({
    fechaDesde: '',
    fechaHasta: ''
  });

  const [paginaActual, setPaginaActual] = useState(1);
  const movimientosPorPagina = 20;

  useEffect(() => {
    console.log('🚀 Iniciando carga de libro mayor...');
    fetchCuentas();
  }, []);

  const seleccionarCuenta = (cuenta) => {
    setCuentaSeleccionada(cuenta);
    fetchLibroMayor(cuenta.id, filtros.fechaDesde, filtros.fechaHasta);
    setPaginaActual(1);
  };

  const aplicarFiltros = () => {
    if (cuentaSeleccionada) {
      fetchLibroMayor(cuentaSeleccionada.id, filtros.fechaDesde, filtros.fechaHasta);
      setPaginaActual(1);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({ fechaDesde: '', fechaHasta: '' });
    if (cuentaSeleccionada) {
      fetchLibroMayor(cuentaSeleccionada.id);
      setPaginaActual(1);
    }
  };

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
    const primerDigito = codigo.charAt(0);
    switch (primerDigito) {
      case '1': return 'text-blue-600 bg-blue-50';
      case '2': return 'text-red-600 bg-red-50';
      case '3': return 'text-purple-600 bg-purple-50';
      case '4': return 'text-green-600 bg-green-50';
      case '5': return 'text-orange-600 bg-orange-50';
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

  // Paginación
  const movimientosPaginados = libroMayor?.movimientos?.slice(
    (paginaActual - 1) * movimientosPorPagina,
    paginaActual * movimientosPorPagina
  ) || [];

  const totalPaginas = Math.ceil((libroMayor?.movimientos?.length || 0) / movimientosPorPagina);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">Cargando libro mayor...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <BookOpen size={28} />
              <div>
                <h2 className="text-4xl font-bold">Libro Mayor</h2>
                <p className="text-purple-100 mt-1">Análisis detallado por cuenta contable</p>
              </div>
            </div>
            {cuentaSeleccionada && (
              <div className="text-right">
                <div className="text-purple-100 text-sm">Cuenta seleccionada</div>
                <div className="font-bold text-lg">
                  {cuentaSeleccionada.codigo} - {cuentaSeleccionada.nombre}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selector de cuenta */}
        {!cuentaSeleccionada && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Seleccionar Cuenta para Libro Mayor
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cuentas.map(cuenta => (
                  <button
                    key={cuenta.id}
                    onClick={() => seleccionarCuenta(cuenta)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <code className="text-sm text-purple-600 font-mono bg-purple-100 px-2 py-1 rounded">
                            {cuenta.codigo}
                          </code>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getTipoColor(cuenta.codigo)}`}>
                            {getTipoTexto(cuenta.codigo)}
                          </span>
                        </div>
                        <div className="font-medium text-gray-900">{cuenta.nombre}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {cuenta.cantidadMovimientos} movimientos
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Vista del libro mayor */}
        {cuentaSeleccionada && (
          <>
            {/* Filtros y botón volver */}
            <div className="bg-gray-50 p-4 border-b">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <button
                  onClick={() => {
                    setCuentaSeleccionada(null);
                    setLibroMayor(null);
                    setEstadisticas(null);
                  }}
                  className="flex items-center space-x-2 text-purple-600 hover:text-purple-800"
                >
                  <ChevronLeft size={16} />
                  <span>Volver a lista de cuentas</span>
                </button>

                <div className="flex items-center space-x-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                    <input
                      type="date"
                      value={filtros.fechaDesde}
                      onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                    <input
                      type="date"
                      value={filtros.fechaHasta}
                      onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex items-end space-x-2">
                    <button
                      onClick={aplicarFiltros}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm flex items-center gap-2"
                    >
                      <Search size={16} />
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
            </div>

            {/* Estadísticas de la cuenta */}
            {estadisticas && (
              <div className="bg-gray-50 p-4 border-b">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="text-sm text-gray-600">Total Movimientos</div>
                        <div className="text-xl font-bold text-gray-800">{estadisticas.totalMovimientos}</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="text-sm text-gray-600">Saldo Actual</div>
                        <div className={`text-xl font-bold ${estadisticas.saldoActual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatearMoneda(Math.abs(estadisticas.saldoActual))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="text-sm text-gray-600">Último mes</div>
                        <div className="text-xl font-bold text-gray-800">{estadisticas.movimientosUltimos30Dias}</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-orange-600" />
                      <div>
                        <div className="text-sm text-gray-600">Actividad total</div>
                        <div className="text-xl font-bold text-gray-800">
                          {formatearMoneda(estadisticas.totalDebe + estadisticas.totalHaber)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 m-6">
                <span className="text-red-800">{error}</span>
              </div>
            )}

            {/* Tabla del libro mayor */}
            {libroMayor && (
              <div className="p-6">
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Libro Mayor - {libroMayor.movimientos.length} movimientos
                  </h3>
                  {filtros.fechaDesde && (
                    <div className="text-sm text-gray-600">
                      Saldo inicial: <span className="font-medium">{formatearMoneda(libroMayor.saldoInicial)}</span>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-purple-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-purple-700">Fecha</th>
                        <th className="text-left py-3 px-4 font-medium text-purple-700">Asiento</th>
                        <th className="text-left py-3 px-4 font-medium text-purple-700">Descripción</th>
                        <th className="text-right py-3 px-4 font-medium text-purple-700">Debe</th>
                        <th className="text-right py-3 px-4 font-medium text-purple-700">Haber</th>
                        <th className="text-right py-3 px-4 font-medium text-purple-700">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Fila de saldo inicial si hay filtro de fecha */}
                      {filtros.fechaDesde && (
                        <tr className="bg-gray-100 border-b">
                          <td className="py-3 px-4 text-sm text-gray-600">-</td>
                          <td className="py-3 px-4 text-sm text-gray-600">-</td>
                          <td className="py-3 px-4 text-sm font-medium text-gray-700">SALDO INICIAL</td>
                          <td className="py-3 px-4"></td>
                          <td className="py-3 px-4"></td>
                          <td className="text-right py-3 px-4 font-bold text-gray-700">
                            {formatearMoneda(libroMayor.saldoInicial)}
                          </td>
                        </tr>
                      )}
                      
                      {movimientosPaginados.map((mov, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {formatearFecha(mov.asientos_contables.fecha)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm font-mono text-purple-600 bg-purple-100 px-2 py-1 rounded">
                              N° {mov.asientos_contables.numero}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700 max-w-xs">
                            <div className="truncate" title={mov.asientos_contables.descripcion}>
                              {mov.asientos_contables.descripcion}
                            </div>
                          </td>
                          <td className="text-right py-3 px-4 font-medium">
                            {mov.debe > 0 ? (
                              <span className="text-green-600">{formatearMoneda(mov.debe)}</span>
                            ) : ''}
                          </td>
                          <td className="text-right py-3 px-4 font-medium">
                            {mov.haber > 0 ? (
                              <span className="text-red-600">{formatearMoneda(mov.haber)}</span>
                            ) : ''}
                          </td>
                          <td className="text-right py-3 px-4 font-bold">
                            <span className={mov.saldoActual >= 0 ? 'text-blue-600' : 'text-red-600'}>
                              {formatearMoneda(Math.abs(mov.saldoActual))}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-purple-50">
                      <tr className="font-bold">
                        <td colSpan="3" className="py-3 px-4 text-purple-700">TOTALES DEL PERÍODO</td>
                        <td className="text-right py-3 px-4 text-green-600">
                          {formatearMoneda(libroMayor.totalDebe)}
                        </td>
                        <td className="text-right py-3 px-4 text-red-600">
                          {formatearMoneda(libroMayor.totalHaber)}
                        </td>
                        <td className="text-right py-3 px-4 text-purple-600">
                          {formatearMoneda(libroMayor.saldoFinal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Paginación */}
                {totalPaginas > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Mostrando {((paginaActual - 1) * movimientosPorPagina) + 1} a{' '}
                      {Math.min(paginaActual * movimientosPorPagina, libroMayor.movimientos.length)} de{' '}
                      {libroMayor.movimientos.length} movimientos
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                        disabled={paginaActual === 1}
                        className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="px-4 py-2 text-sm font-medium">
                        Página {paginaActual} de {totalPaginas}
                      </span>
                      <button
                        onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                        disabled={paginaActual === totalPaginas}
                        className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LibroMayorSection;