import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Calendar, TrendingUp, DollarSign, FileText, Eye, RefreshCw, ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { formatearMonto, formatearMontoCompleto } from '../../../shared/utils/formatters';
import Tarjeta from '../../../shared/components/layout/Tarjeta';
import LoadingSpinner from '../../../shared/components/base/LoadingSpinner';
import { descargarLibroMayorPDF } from './pdf/LibroMayorPDF';
import { calcularSaldoCuenta } from '../utils/saldosUtils';

// Servicio para Libro Mayor
const libroMayorService = {
  async getCuentasConMovimientos() {
    console.log('📡 Obteniendo cuentas para libro mayor...');

    // Primero obtenemos las cuentas que tienen movimientos
    const { data: cuentasConMovimientos, error: errorCuentas } = await supabase
      .from('plan_cuentas')
      .select(`
        id, codigo, nombre, moneda_original, tipo
      `)
      .eq('activa', true)
      .order('codigo');

    if (errorCuentas) {
      console.error('❌ Error obteniendo cuentas:', errorCuentas);
      throw errorCuentas;
    }

    // Luego obtenemos el conteo real de movimientos para cada cuenta
    const cuentasConConteo = await Promise.all(
      cuentasConMovimientos.map(async (cuenta) => {
        const { count, error: errorConteo } = await supabase
          .from('movimientos_contables')
          .select('*', { count: 'exact', head: true })
          .eq('cuenta_id', cuenta.id);

        if (errorConteo) {
          console.error(`❌ Error contando movimientos para cuenta ${cuenta.codigo}:`, errorConteo);
          return {
            ...cuenta,
            cantidadMovimientos: 0
          };
        }

        return {
          ...cuenta,
          cantidadMovimientos: count || 0
        };
      })
    );

    // Filtrar solo las cuentas que tienen movimientos
    const cuentasConMovimientosReales = cuentasConConteo.filter(cuenta => cuenta.cantidadMovimientos > 0);

    console.log(`✅ ${cuentasConMovimientosReales.length} cuentas con movimientos`);
    return cuentasConMovimientosReales;
  },

  async getLibroMayorCuenta(cuentaId, fechaDesde = null, fechaHasta = null) {
    console.log('📖 Obteniendo libro mayor para cuenta:', cuentaId);

    // Primero obtener información de la cuenta (incluir tipo para cálculo de saldos)
    const { data: cuenta, error: errorCuenta } = await supabase
      .from('plan_cuentas')
      .select('*, moneda_original, tipo')
      .eq('id', cuentaId)
      .single();

    if (errorCuenta) throw errorCuenta;

    // Obtener movimientos directamente con filtros de fecha en el join
    // Esto evita el problema del .in() con arrays grandes
    let movimientosQuery = supabase
      .from('movimientos_contables')
      .select(`
        *,
        asientos_contables!inner (
          id, numero, fecha, descripcion, usuario
        )
      `)
      .eq('cuenta_id', cuentaId)
      .order('asientos_contables(fecha)', { ascending: false })
      .limit(10000); // Límite alto para evitar restricción por defecto de 1000

    // Aplicar filtros de fecha directamente en el join
    if (fechaDesde) {
      movimientosQuery = movimientosQuery.gte('asientos_contables.fecha', fechaDesde);
    }
    if (fechaHasta) {
      movimientosQuery = movimientosQuery.lte('asientos_contables.fecha', fechaHasta);
    }

    const { data: movimientos, error: errorMovimientos } = await movimientosQuery;
    if (errorMovimientos) throw errorMovimientos;

    // Calcular saldo inicial (movimientos antes de fechaDesde)
    let saldoInicial = 0;
    if (fechaDesde) {
      // Obtener movimientos anteriores directamente con join
      const { data: movimientosAnteriores } = await supabase
        .from('movimientos_contables')
        .select(`
          debe,
          haber,
          asientos_contables!inner (fecha)
        `)
        .eq('cuenta_id', cuentaId)
        .lt('asientos_contables.fecha', fechaDesde)
        .limit(10000); // Límite alto para evitar restricción por defecto de 1000

      if (movimientosAnteriores && movimientosAnteriores.length > 0) {
        // Calcular totales de debe y haber
        const totalDebeAnterior = movimientosAnteriores.reduce((acc, mov) => acc + parseFloat(mov.debe || 0), 0);
        const totalHaberAnterior = movimientosAnteriores.reduce((acc, mov) => acc + parseFloat(mov.haber || 0), 0);

        // Usar función utilitaria para calcular saldo inicial
        saldoInicial = calcularSaldoCuenta(totalDebeAnterior, totalHaberAnterior, cuenta.tipo);
      }
    }

    // Calcular saldos acumulados (como vienen en orden descendente, calculamos desde el final)
    // Primero calcular el saldo final usando función utilitaria
    const totalDebe = movimientos.reduce((acc, mov) => acc + parseFloat(mov.debe || 0), 0);
    const totalHaber = movimientos.reduce((acc, mov) => acc + parseFloat(mov.haber || 0), 0);

    // Calcular saldo de los movimientos del período
    const saldoMovimientos = calcularSaldoCuenta(totalDebe, totalHaber, cuenta.tipo);
    const saldoFinalCalculado = saldoInicial + saldoMovimientos;

    // Ahora calculamos hacia atrás desde el saldo final
    let saldoAcumulado = saldoFinalCalculado;
    const movimientosConSaldo = movimientos.map(mov => {
      const debe = parseFloat(mov.debe || 0);
      const haber = parseFloat(mov.haber || 0);

      const saldoActual = saldoAcumulado;

      // Para el siguiente (que es anterior en el tiempo), restamos/sumamos según naturaleza
      // Calculamos el delta del movimiento según la naturaleza de la cuenta
      const deltaMovimiento = calcularSaldoCuenta(debe, haber, cuenta.tipo);
      saldoAcumulado = saldoAcumulado - deltaMovimiento;

      return {
        ...mov,
        saldoAnterior: saldoAcumulado,
        saldoActual: saldoActual
      };
    });

    return {
      cuenta,
      saldoInicial,
      movimientos: movimientosConSaldo,
      saldoFinal: saldoFinalCalculado,
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
      .eq('cuenta_id', cuentaId)
      .limit(10000); // Límite alto para evitar restricción por defecto de 1000

    if (error) throw error;

    // Obtener tipo de cuenta para cálculo correcto
    const { data: cuentaInfo } = await supabase
      .from('plan_cuentas')
      .select('tipo')
      .eq('id', cuentaId)
      .single();

    const totalMovimientos = movimientos.length;
    const totalDebe = movimientos.reduce((sum, m) => sum + parseFloat(m.debe || 0), 0);
    const totalHaber = movimientos.reduce((sum, m) => sum + parseFloat(m.haber || 0), 0);

    // Usar función utilitaria para calcular saldo actual
    const saldoActual = calcularSaldoCuenta(totalDebe, totalHaber, cuentaInfo?.tipo || 'activo');

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
  const [modalAsiento, setModalAsiento] = useState({ open: false, asiento: null });

  const abrirModalAsiento = async (asientoId) => {
    if (!asientoId) {
      alert('Este movimiento no tiene un asiento asociado o el ID es inválido.');
      console.error('Intento de abrir modal con ID de asiento inválido:', asientoId);
      return;
    }
    try {
      console.log('🔍 Cargando asiento ID:', asientoId);

      // Obtener el asiento completo con todos sus movimientos
      const { data: asiento, error: errorAsiento } = await supabase
        .from('asientos_contables')
        .select('*')
        .eq('id', asientoId)
        .single();

      if (errorAsiento) {
        console.error('❌ Error obteniendo asiento:', errorAsiento);
        throw errorAsiento;
      }

      console.log('✅ Asiento obtenido:', asiento);

      // Obtener todos los movimientos del asiento con información de las cuentas
      const { data: movimientos, error: errorMovimientos } = await supabase
        .from('movimientos_contables')
        .select(`
          *,
          plan_cuentas (codigo, nombre)
        `)
        .eq('asiento_id', asientoId)
        .order('id');

      if (errorMovimientos) {
        console.error('❌ Error obteniendo movimientos:', errorMovimientos);
        throw errorMovimientos;
      }

      console.log('✅ Movimientos obtenidos:', movimientos);

      setModalAsiento({
        open: true,
        asiento: {
          ...asiento,
          movimientos
        }
      });
    } catch (error) {
      console.error('❌ Error completo:', error);
      alert(`Error al cargar el detalle del asiento: ${error.message || 'Error desconocido'}`);
    }
  };


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

  const handleDescargarPDF = async () => {
    try {
      if (!libroMayor || !libroMayor.movimientos || libroMayor.movimientos.length === 0) {
        alert('No hay movimientos para descargar');
        return;
      }

      await descargarLibroMayorPDF(libroMayor, filtros.fechaDesde, filtros.fechaHasta);
      alert('✅ PDF del Libro Mayor descargado exitosamente');
    } catch (error) {
      console.error('Error descargando PDF:', error);
      alert('❌ Error al generar el PDF: ' + error.message);
    }
  };

  const formatearMoneda = (valor, moneda = 'USD') => {
    // Formatear con 2 decimales siempre
    const numero = parseFloat(valor || 0);
    const formatter = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    const simbolo = moneda === 'USD' ? 'U$' : '$';
    return `${simbolo}${formatter.format(numero)}`;
  };

  const formatearMonedaSinDecimales = (valor, moneda = 'USD') => {
    // Formatear sin decimales para las tarjetas
    const numero = Math.round(parseFloat(valor || 0));
    const formatter = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

    const simbolo = moneda === 'USD' ? 'U$' : '$';
    return `${simbolo}${formatter.format(numero)}`;
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', { 
      timeZone: 'America/Argentina/Buenos_Aires' 
    });
  };

  // Color de etiquetas (siempre gris)
  const getTipoColor = () => {
    return 'text-white bg-slate-600 border-slate-300';
  };

  // Color de saldos según tipo de cuenta
  const getSaldoColor = (tipo) => {
    switch (tipo) {
      case 'activo':
      case 'resultado positivo':
        return 'text-emerald-600';
      case 'pasivo':
      case 'resultado negativo':
        return 'text-red-600';
      case 'patrimonio':
        return 'text-blue-600';
      default:
        return 'text-slate-800';
    }
  };

  const getTipoTexto = (tipo) => {
    switch (tipo) {
      case 'activo':
        return 'ACTIVO';
      case 'pasivo':
        return 'PASIVO';
      case 'patrimonio':
        return 'PATRIMONIO';
      case 'resultado positivo':
        return 'RESULTADO POSITIVO';
      case 'resultado negativo':
        return 'RESULTADO NEGATIVO';
      default:
        return 'OTRO';
    }
  };

  // Filtrar cuentas por búsqueda (mostrar todas las cuentas con movimientos, incluyendo saldo 0)
  const cuentasFiltradas = cuentasConSaldos.filter(cuenta => {
    // Filtrar por búsqueda
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
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getTipoColor()}`}>
                            {getTipoTexto(cuenta.tipo)}
                          </span>
                        </div>
                        <div className="font-medium text-slate-800">{cuenta.nombre}</div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-slate-500">
                            {cuenta.cantidadMovimientos} movimientos
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-slate-500 mb-1">Saldo actual</div>
                            <div className={`font-semibold text-sm ${getSaldoColor(cuenta.tipo)}`}>
                              {loadingSaldos ? (
                                <span className="text-slate-400">Cargando...</span>
                              ) : (
                                <>
                                  {formatearMoneda(Math.abs(cuenta.saldoActual || 0))}
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
                    <button
                      onClick={handleDescargarPDF}
                      disabled={!libroMayor || !libroMayor.movimientos || libroMayor.movimientos.length === 0}
                      className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-sm flex items-center gap-2 transition-colors"
                      title="Descargar PDF"
                    >
                      <Download size={16} />
                      PDF
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
                    valor={formatearMonedaSinDecimales(estadisticas.totalDebe)}
                  />

                  <Tarjeta
                    icon={FileText}
                    titulo={'Total acreditado'}
                    valor={formatearMonedaSinDecimales(estadisticas.totalHaber)}
                  />

                  <Tarjeta
                    icon={TrendingUp}
                    titulo={`Saldo actual ${estadisticas.saldoActual >= 0 ? '(Deudor)' : '(Acreedor)'}`}
                    valor={formatearMonedaSinDecimales(Math.abs(estadisticas.saldoActual))}
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
                <div className="mb-4 flex justify-end items-center">
                  <div className="text-sm text-slate-600">
                    {libroMayor.movimientos.length} movimientos
                    {filtros.fechaDesde && (
                      <span className="ml-4">
                        | Saldo inicial:
                        <span className={`font-medium ml-1 ${libroMayor.saldoInicial >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatearMoneda(Math.abs(libroMayor.saldoInicial))}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800 text-white">
                      <tr>
                        <th className="text-center py-3 px-4 text-xs font-medium uppercase tracking-wider">Fecha</th>
                        <th className="text-center py-3 px-4 text-xs font-medium uppercase tracking-wider">Asiento</th>
                        <th className="text-center py-3 px-4 text-xs font-medium uppercase tracking-wider">Descripción</th>
                        <th className="text-center py-3 px-4 text-xs font-medium uppercase tracking-wider">Debe</th>
                        <th className="text-center py-3 px-4 text-xs font-medium uppercase tracking-wider">Haber</th>
                        <th className="text-center py-3 px-4 text-xs font-medium uppercase tracking-wider">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {/* Fila de saldo inicial si hay filtro de fecha */}
                      {filtros.fechaDesde && (
                        <tr className="bg-slate-100">
                          <td className="py-3 px-4 text-sm text-slate-600 text-center">-</td>
                          <td className="py-3 px-4 text-sm text-slate-600 text-center">-</td>
                          <td className="py-3 px-4 text-sm font-medium text-slate-700">SALDO INICIAL</td>
                          <td className="py-3 px-4 text-center"></td>
                          <td className="py-3 px-4 text-center"></td>
                          <td className="text-center py-3 px-4 font-bold">
                            <span className={libroMayor.saldoInicial >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                              {formatearMoneda(Math.abs(libroMayor.saldoInicial))}
                            </span>
                          </td>
                        </tr>
                      )}

                                            {movimientosPaginados.map((mov, index) => (

                                              <tr key={index} onClick={() => abrirModalAsiento(mov.asiento_id)} className={`hover:bg-slate-100 transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>

                                                <td className="py-3 px-4 text-sm text-slate-600 text-center">

                                                  {formatearFecha(mov.asientos_contables.fecha)}

                                                </td>

                                                <td className="py-3 px-4 text-center">

                                                  <span className="text-sm font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded">

                                                    N° {mov.asientos_contables.numero}

                                                  </span>

                                                </td>

                                                <td className="py-3 px-4 text-sm text-slate-700 max-w-xs">

                                                  <div className="truncate" title={mov.asientos_contables.descripcion}>

                                                    {mov.asientos_contables.descripcion}

                                                  </div>

                                                </td>

                                                <td className="text-center py-3 px-4 font-medium">

                                                  {mov.debe > 0 ? (

                                                    <div className="flex flex-col items-center">

                                                      <span className="text-slate-800">{formatearMoneda(mov.debe, 'USD')}</span>

                                                      {mov.debe_ars && (

                                                        <span className="text-xs text-gray-500 mt-1">

                                                          ({formatearMoneda(mov.debe_ars, 'ARS')})

                                                        </span>

                                                      )}

                                                    </div>

                                                  ) : '-'}

                                                </td>

                                                <td className="text-center py-3 px-4 font-medium">

                                                  {mov.haber > 0 ? (

                                                    <div className="flex flex-col items-center">

                                                      <span className="text-slate-600">{formatearMoneda(mov.haber, 'USD')}</span>

                                                      {mov.haber_ars && (

                                                        <span className="text-xs text-gray-500 mt-1">

                                                          ({formatearMoneda(mov.haber_ars, 'ARS')})

                                                        </span>

                                                      )}

                                                    </div>

                                                  ) : '-'}

                                                </td>

                                                <td className="text-center py-3 px-4 font-bold">

                                                  <span className={getSaldoColor(libroMayor.cuenta.tipo)}>

                                                    {formatearMoneda(Math.abs(mov.saldoActual))}

                                                  </span>

                                                </td>

                                              </tr>

                                            ))}

                                          </tbody>

                                          <tfoot className="bg-slate-800 text-white">

                                            <tr className="font-bold">

                                              <td colSpan="3" className="py-3 px-4 text-sm font-semibold">TOTALES DEL PERÍODO</td>

                                              <td className="text-center py-3 px-4 text-sm font-semibold">

                                                {formatearMoneda(libroMayor.totalDebe)}

                                              </td>

                                              <td className="text-center py-3 px-4 text-sm font-semibold">

                                                {formatearMoneda(libroMayor.totalHaber)}

                                              </td>

                                              <td className="text-center py-3 px-4 text-sm font-semibold">

                                                {formatearMoneda(Math.abs(libroMayor.saldoFinal))}

                                              </td>

                                            </tr>

                                          </tfoot>

                                        </table>

                                      </div>

                      

                                      {/* Paginación */}

                                      {totalPaginas > 1 && (

                                        <div className="mt-6 flex items-center justify-between">

                                          <div className="text-sm text-slate-600">

                                            Mostrando {((paginaActual - 1) * movimientosPorPagina) + 1} a{

                                              ' '}

                                            {Math.min(paginaActual * movimientosPorPagina, libroMayor.movimientos.length)} de{

                                              ' '}

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

                            {/* Modal de detalle del asiento */}

                            {modalAsiento.open && modalAsiento.asiento && (

                              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">

                                <div className="bg-white rounded border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto">

                                  {/* Header */}

                                  <div className="sticky top-0 bg-slate-800 text-white p-6 border-b border-slate-200">

                                    <div className="flex justify-between items-center">

                                      <div>

                                        <h2 className="text-xl font-semibold">Detalle del Asiento Contable</h2>

                                        <p className="text-slate-300 text-sm mt-1">

                                          Asiento N° {modalAsiento.asiento.numero} - {formatearFecha(modalAsiento.asiento.fecha)}

                                        </p>

                                      </div>

                                      <button

                                        onClick={() => setModalAsiento({ open: false, asiento: null })}

                                        className="p-2 hover:bg-slate-700 rounded transition-colors"

                                      >

                                        <X size={20} />

                                      </button>

                                    </div>

                                  </div>

                      

                                  {/* Contenido */}

                                  <div className="p-6">

                                    {/* Información del asiento */}

                                    <div className="bg-slate-50 p-4 rounded border border-slate-200 mb-6">

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                        <div>

                                          <p className="text-sm text-slate-600 mb-1">Descripción</p>

                                          <p className="text-slate-800 font-medium">{modalAsiento.asiento.descripcion}</p>

                                        </div>

                                        <div>

                                          <p className="text-sm text-slate-600 mb-1">Usuario</p>

                                          <p className="text-slate-800 font-medium">{modalAsiento.asiento.usuario || 'N/A'}</p>

                                        </div>

                                        <div>

                                          <p className="text-sm text-slate-600 mb-1">Estado</p>

                                          <span className={`px-2 py-1 rounded text-xs font-semibold ${

                                            modalAsiento.asiento.estado === 'registrado'

                                              ? 'bg-emerald-100 text-emerald-800'

                                              : 'bg-slate-100 text-slate-800'

                                          }`}>

                                            {modalAsiento.asiento.estado?.toUpperCase()}

                                          </span>

                                        </div>

                                        <div>

                                          <p className="text-sm text-slate-600 mb-1">Fecha</p>

                                          <p className="text-slate-800 font-medium">{formatearFecha(modalAsiento.asiento.fecha)}</p>

                                        </div>

                                      </div>

                                    </div>

                      

                                    {/* Tabla de movimientos */}

                                    <div className="overflow-x-auto">

                                      <table className="w-full">

                                        <thead className="bg-slate-800 text-white">

                                          <tr>

                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Código</th>

                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Cuenta</th>

                                            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Debe</th>

                                            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Haber</th>

                                          </tr>

                                        </thead>

                                        <tbody className="divide-y divide-slate-200">

                                          {modalAsiento.asiento.movimientos?.map((mov, index) => (

                                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>

                                              <td className="px-4 py-3 text-sm font-mono text-slate-600">

                                                {mov.plan_cuentas?.codigo}

                                              </td>

                                              <td className="px-4 py-3 text-sm text-slate-800">

                                                {mov.plan_cuentas?.nombre}

                                              </td>

                                              <td className="px-4 py-3 text-right text-sm font-medium text-emerald-600">

                                                {mov.debe > 0 ? formatearMonto(mov.debe, 'USD') : '-'}

                                              </td>

                                              <td className="px-4 py-3 text-right text-sm font-medium text-slate-600">

                                                {mov.haber > 0 ? formatearMonto(mov.haber, 'USD') : '-'}

                                              </td>

                                            </tr>

                                          ))}

                                        </tbody>

                                        <tfoot className="bg-slate-800 text-white">

                                          <tr>

                                            <td colSpan="2" className="px-4 py-3 text-sm font-semibold">TOTALES</td>

                                            <td className="px-4 py-3 text-right text-sm font-semibold">

                                              {formatearMonto(modalAsiento.asiento.total_debe || 0, 'USD')}

                                            </td>

                                            <td className="px-4 py-3 text-right text-sm font-semibold">

                                              {formatearMonto(modalAsiento.asiento.total_haber || 0, 'USD')}

                                            </td>

                                          </tr>

                                        </tfoot>

                                      </table>

                                    </div>

                      

                                    {/* Observaciones si existen */}

                                    {modalAsiento.asiento.observaciones && (

                                      <div className="mt-6 bg-slate-50 p-4 rounded border border-slate-200">

                                        <p className="text-sm text-slate-600 mb-2">Observaciones</p>

                                        <p className="text-slate-800">{modalAsiento.asiento.observaciones}</p>

                                      </div>

                                    )}

                                  </div>

                      

                                  {/* Footer */}

                                  <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex justify-end">

                                    <button

                                      onClick={() => setModalAsiento({ open: false, asiento: null })}

                                      className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition-colors"

                                    >

                                      Cerrar

                                    </button>

                                  </div>

                                </div>

                              </div>

                            )}

                          </div>
  );
};

export default LibroMayorSection;