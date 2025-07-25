import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Calendar, TrendingUp, DollarSign, FileText, Eye, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { formatearMonto } from '../../../shared/utils/formatters';
import Tarjeta from '../../../shared/components/layout/Tarjeta.jsx';
import LoadingSpinner from '../../../shared/components/base/LoadingSpinner';

// Servicio para Libro Mayor
const libroMayorService = {
  async getCuentasConMovimientos() {
    console.log('📡 Obteniendo cuentas para libro mayor...');

    const { data, error } = await supabase
      .from('plan_cuentas')
      .select(`
        id, codigo, nombre, moneda_original,
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
          moneda_original: cuenta.moneda_original,
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
      .select('*, moneda_original')
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
            // CORRECCIÓN: Debe aumenta saldo, Haber lo disminuye
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
      
      // CORRECCIÓN: En contabilidad, Debe aumenta saldo y Haber lo disminuye
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
    // CORRECCIÓN: Debe aumenta saldo, Haber lo disminuye
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
  const [cuentasConSaldos, setCuentasConSaldos] = useState([]);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
  const [libroMayor, setLibroMayor] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSaldos, setLoadingSaldos] = useState(false);
  const [error, setError] = useState(null);

  const fetchCuentas = async () => {
    try {
      setError(null);
      const data = await libroMayorService.getCuentasConMovimientos();
      setCuentas(data);
      
      // Obtener saldos para cada cuenta
      setLoadingSaldos(true);
      const cuentasConSaldosData = await Promise.all(
        data.map(async (cuenta) => {
          try {
            const estadisticas = await libroMayorService.getEstadisticasCuenta(cuenta.id);
            return {
              ...cuenta,
              saldoActual: estadisticas.saldoActual
            };
          } catch (err) {
            console.error(`Error obteniendo saldo para cuenta ${cuenta.codigo}:`, err);
            return {
              ...cuenta,
              saldoActual: 0
            };
          }
        })
      );
      setCuentasConSaldos(cuentasConSaldosData);
      setLoadingSaldos(false);
    } catch (err) {
      setError(err.message);
      setLoadingSaldos(false);
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
    cuentasConSaldos,
    cuentaSeleccionada,
    libroMayor,
    estadisticas,
    loading,
    loadingSaldos,
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
    cuentasConSaldos,
    cuentaSeleccionada,
    libroMayor,
    estadisticas,
    loading,
    loadingSaldos,
    error,
    fetchCuentas,
    fetchLibroMayor,
    setCuentaSeleccionada
  } = useLibroMayor();

  const [filtros, setFiltros] = useState({
    fechaDesde: '',
    fechaHasta: ''
  });

  const [busquedaCuenta, setBusquedaCuenta] = useState('');

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
    // En el libro mayor todos los valores se muestran como USD con U$
    return formatearMonto(valor, 'USD');
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  const getTipoColor = (codigo) => {
    const primerDigito = codigo.charAt(0);
    switch (primerDigito) {
      case '1': return 'text-white bg-slate-600 border-slate-300';
      case '2': return 'text-white bg-slate-600 border-slate-300';
      case '3': return 'text-white bg-slate-600 border-slate-300';
      case '4': return 'text-white bg-slate-600 border-slate-300';
      case '5': return 'text-white bg-slate-600 border-slate-300';
      default: return 'text-slate-600 bg-slate-600 border-slate-300';
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

  // Filtrar cuentas por búsqueda
  const cuentasFiltradas = cuentasConSaldos.filter(cuenta => {
    if (!busquedaCuenta) return true;
    const termino = busquedaCuenta.toLowerCase();
    return (
      cuenta.codigo.toLowerCase().includes(termino) ||
      cuenta.nombre.toLowerCase().includes(termino)
    );
  });

  // Paginación
  const movimientosPaginados = libroMayor?.movimientos?.slice(
    (paginaActual - 1) * movimientosPorPagina,
    paginaActual * movimientosPorPagina
  ) || [];

  const totalPaginas = Math.ceil((libroMayor?.movimientos?.length || 0) / movimientosPorPagina);

  if (loading) {
    return <LoadingSpinner text="Cargando libro mayor..." size="medium" />;
  }

  return (
    <div className="p-0">
      <div className="bg-white rounded border border-slate-200 mb-4">
        {/* Header */}
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div>
                <div className="flex items-center space-x-4">
                                            <BookOpen size={28} className='mt-2'/>
                
                              <div>
                                
                                <p className="text-slate-200 mt-2">Seleccionar una cuenta para ver su libro mayor.</p>
                              </div>
                            </div>
              </div>
            </div>
            {cuentaSeleccionada && (
              <div className="text-right">
                <div className="text-slate-300 text-sm">Cuenta seleccionada</div>
                <div className="font-semibold text-lg">
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
              {/* Buscador de cuentas */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar cuenta por código o nombre..."
                    value={busquedaCuenta}
                    onChange={(e) => setBusquedaCuenta(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-700"
                  />
                </div>
                {busquedaCuenta && (
                  <div className="mt-2 text-sm text-slate-600">
                    {cuentasFiltradas.length} cuenta(s) encontrada(s)
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cuentasFiltradas.map(cuenta => (
                  <button
                    key={cuenta.id}
                    onClick={() => seleccionarCuenta(cuenta)}
                    className="p-4 border border-slate-200 rounded hover:border-slate-800 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <code className="text-sm text-slate-800 font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200">
                            {cuenta.codigo}
                          </code>
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getTipoColor(cuenta.codigo)}`}>
                            {getTipoTexto(cuenta.codigo)}
                          </span>
                        </div>
                        <div className="font-medium text-slate-800">{cuenta.nombre}</div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-slate-500">
                            {cuenta.cantidadMovimientos} movimientos
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-slate-500 mb-1">Saldo actual</div>
                            <div className={`font-semibold text-sm ${(cuenta.saldoActual || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {loadingSaldos ? (
                                <span className="text-slate-400">Cargando...</span>
                              ) : (
                                <>
                                  {formatearMoneda(Math.abs(cuenta.saldoActual || 0))}
                                  <span className="text-xs ml-1">
                                    {(cuenta.saldoActual || 0) >= 0 ? 'Deudor' : 'Acreedor'}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 ml-3" />
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
            <div className="bg-slate-50 p-4 border-b border-slate-200 ">
              <div className="flex flex-col md:flex-row flex-wrap items-center justify-center md:justify-between gap-4">
                <button
                  onClick={() => {
                    setCuentaSeleccionada(null);
                  }}
                  className="flex items-center space-x-2 text-slate-800 hover:text-slate-600 transition-colors"
                >
                  <ChevronLeft size={16} />
                  <span>Volver a lista de cuentas</span>
                </button>

                <div className="flex items-center space-x-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Desde</label>
                    <input
                      type="date"
                      value={filtros.fechaDesde}
                      onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
                      className="w-60 border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Hasta</label>
                    <input
                      type="date"
                      value={filtros.fechaHasta}
                      onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
                      className="w-60 border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex items-end space-x-2">
                    <button
                      onClick={aplicarFiltros}
                      className="px-4 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm flex items-center gap-2 transition-colors"
                    >
                      <Search size={16} />
                      Filtrar
                    </button>
                    <button
                      onClick={limpiarFiltros}
                      className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 text-sm transition-colors"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas de la cuenta */}
            {estadisticas && (
              <div className="bg-slate-50 p-4 border-b border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                  

                  <Tarjeta
                    icon={FileText}
                    titulo={'Total debitado'}
                    valor={formatearMoneda(estadisticas.totalDebe)}
                  />

                  <Tarjeta
                    icon={FileText}
                    titulo={'Total acreditado'}
                    valor={formatearMoneda(estadisticas.totalHaber)}
                  />

                  <Tarjeta  
                    icon={TrendingUp}
                    titulo={`Saldo actual ${estadisticas.saldoActual >= 0 ? '(Deudor)' : '(Acreedor)'}`}
                    valor={formatearMoneda(Math.abs(estadisticas.saldoActual))}
                    className={estadisticas.saldoActual >= 0 ? 'text-emerald-600' : 'text-red-600'}
                  />

                  
                  <Tarjeta
                    icon={Calendar}
                    titulo={'Movimientos últimos 30 días'}
                    valor={estadisticas.movimientosUltimos30Dias}
                  />

                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-slate-50 border-l-4 border-slate-600 p-4 m-6">
                <span className="text-slate-800">{error}</span>
              </div>
            )}

            {/* Tabla del libro mayor */}
            {libroMayor && (
              <div className="p-6">
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-slate-800">
                    Libro Mayor - {libroMayor.movimientos.length} movimientos
                  </h3>
                  {filtros.fechaDesde && (
                    <div className="text-sm text-slate-600">
                      Saldo inicial: 
                      <span className={`font-medium ${libroMayor.saldoInicial >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatearMoneda(Math.abs(libroMayor.saldoInicial))} 
                        {libroMayor.saldoInicial >= 0 ? ' (Deudor)' : ' (Acreedor)'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border border-slate-200 rounded">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Fecha</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Asiento</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Descripción</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-700">Debe</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-700">Haber</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-700">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Fila de saldo inicial si hay filtro de fecha */}
                      {filtros.fechaDesde && (
                        <tr className="bg-slate-100 border-b border-slate-200">
                          <td className="py-3 px-4 text-sm text-slate-600">-</td>
                          <td className="py-3 px-4 text-sm text-slate-600">-</td>
                          <td className="py-3 px-4 text-sm font-medium text-slate-700">SALDO INICIAL</td>
                          <td className="py-3 px-4"></td>
                          <td className="py-3 px-4"></td>
                          <td className="text-right py-3 px-4 font-bold">
                            <span className={libroMayor.saldoInicial >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                              {formatearMoneda(Math.abs(libroMayor.saldoInicial))} 
                              <span className="text-xs ml-1 font-normal">
                                {libroMayor.saldoInicial >= 0 ? 'D' : 'A'}
                              </span>
                            </span>
                          </td>
                        </tr>
                      )}
                      
                      {movimientosPaginados.map((mov, index) => (
                        <tr key={index} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {formatearFecha(mov.asientos_contables.fecha)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm font-mono text-slate-800 bg-emerald-100 px-2 py-1 rounded">
                              N° {mov.asientos_contables.numero}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-700 max-w-xs">
                            <div className="truncate" title={mov.asientos_contables.descripcion}>
                              {mov.asientos_contables.descripcion}
                            </div>
                          </td>
                          <td className="text-right py-3 px-4 font-medium">
                            {mov.debe > 0 ? (
                              <span className="text-slate-800">{formatearMoneda(mov.debe)}</span>
                            ) : ''}
                          </td>
                          <td className="text-right py-3 px-4 font-medium">
                            {mov.haber > 0 ? (
                              <span className="text-slate-600">{formatearMoneda(mov.haber)}</span>
                            ) : ''}
                          </td>
                          <td className="text-right py-3 px-4 font-bold">
                            <span className={mov.saldoActual >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                              {formatearMoneda(Math.abs(mov.saldoActual))} 
                              <span className="text-xs ml-1 font-normal">
                                {mov.saldoActual >= 0 ? 'D' : 'A'}
                              </span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50">
                      <tr className="font-bold">
                        <td colSpan="3" className="py-3 px-4 text-slate-700">TOTALES DEL PERÍODO</td>
                        <td className="text-right py-3 px-4 text-slate-800">
                          {formatearMoneda(libroMayor.totalDebe)}
                        </td>
                        <td className="text-right py-3 px-4 text-slate-600">
                          {formatearMoneda(libroMayor.totalHaber)}
                        </td>
                        <td className="text-right py-3 px-4 font-bold">
                          <span className={libroMayor.saldoFinal >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                            {formatearMoneda(Math.abs(libroMayor.saldoFinal))} 
                            <span className="text-xs ml-1 font-normal">
                              {libroMayor.saldoFinal >= 0 ? 'D' : 'A'}
                            </span>
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Paginación */}
                {totalPaginas > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Mostrando {((paginaActual - 1) * movimientosPorPagina) + 1} a{' '}
                      {Math.min(paginaActual * movimientosPorPagina, libroMayor.movimientos.length)} de{' '}
                      {libroMayor.movimientos.length} movimientos
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                        disabled={paginaActual === 1}
                        className="px-3 py-2 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="px-4 py-2 text-sm font-medium text-slate-600">
                        Página {paginaActual} de {totalPaginas}
                      </span>
                      <button
                        onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                        disabled={paginaActual === totalPaginas}
                        className="px-3 py-2 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
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