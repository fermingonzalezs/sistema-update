import React, { useState, useEffect } from 'react';
import { DollarSign, Calculator, AlertTriangle, CheckCircle, Save, RefreshCw, Plus, Minus, Eye, FileText, Calendar, ChevronRight, History, ArrowRightLeft, TrendingUp, X, ArrowLeft } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { formatearMonto, obtenerFechaLocal } from '../../../shared/utils/formatters';
import LoadingSpinner from '../../../shared/components/base/LoadingSpinner';
import Tarjeta from '../../../shared/components/layout/Tarjeta';

// Servicio para Conciliación de Caja
const conciliacionCajaService = {
  async getCuentasCaja() {
    console.log('📡 Obteniendo cuentas de caja y bancos (1.1.01)...');
    const { data, error } = await supabase
      .from('plan_cuentas')
      .select('*, moneda_original')
      .eq('activa', true)
      .eq('tipo', 'activo')
      .eq('imputable', true)
      .ilike('codigo', '1.1.01%')
      .order('codigo');
    if (error) {
      console.error('❌ Error obteniendo cuentas de caja y bancos:', error);
      throw error;
    }
    console.log(`✅ ${data.length} cuentas de caja y bancos encontradas`);
    return data;
  },

  async getSaldoContableCaja(cuentaId, fechaCorte = null) {
    console.log('💰 Calculando saldo contable de caja:', cuentaId);

    // Obtener información de la cuenta para saber la moneda
    const { data: cuenta, error: errorCuenta } = await supabase
      .from('plan_cuentas')
      .select('moneda_original, requiere_cotizacion')
      .eq('id', cuentaId)
      .single();

    if (errorCuenta) throw errorCuenta;

    // Determinar si es cuenta ARS
    const esMonedaARS = cuenta.moneda_original === 'ARS' || cuenta.requiere_cotizacion;

    // Obtener asientos hasta la fecha de corte
    let asientosQuery = supabase
      .from('asientos_contables')
      .select('id');
    if (fechaCorte) {
      asientosQuery = asientosQuery.lte('fecha', fechaCorte);
    }
    const { data: asientos, error: errorAsientos } = await asientosQuery;
    if (errorAsientos) throw errorAsientos;

    const asientoIds = asientos.map(a => a.id);

    // Obtener movimientos de la cuenta de caja
    const { data: movimientos, error: errorMovimientos } = await supabase
      .from('movimientos_contables')
      .select('debe, haber, debe_ars, haber_ars')
      .eq('cuenta_id', cuentaId)
      .in('asiento_id', asientoIds);

    if (errorMovimientos) throw errorMovimientos;

    // Calcular saldo según la moneda de la cuenta
    let saldoContable, totalIngresos, totalEgresos;

    if (esMonedaARS) {
      // Para cuentas ARS: usar debe_ars y haber_ars
      saldoContable = movimientos.reduce((acc, mov) => {
        return acc + parseFloat(mov.debe_ars || 0) - parseFloat(mov.haber_ars || 0);
      }, 0);
      totalIngresos = movimientos.reduce((sum, m) => sum + parseFloat(m.debe_ars || 0), 0);
      totalEgresos = movimientos.reduce((sum, m) => sum + parseFloat(m.haber_ars || 0), 0);
    } else {
      // Para cuentas USD: usar debe y haber
      saldoContable = movimientos.reduce((acc, mov) => {
        return acc + parseFloat(mov.debe || 0) - parseFloat(mov.haber || 0);
      }, 0);
      totalIngresos = movimientos.reduce((sum, m) => sum + parseFloat(m.debe || 0), 0);
      totalEgresos = movimientos.reduce((sum, m) => sum + parseFloat(m.haber || 0), 0);
    }

    return {
      saldoContable,
      totalMovimientos: movimientos.length,
      totalIngresos,
      totalEgresos
    };
  },

  async getUltimosMovimientosCaja(cuentaId, limite = 10) {
    console.log('📋 Obteniendo últimos movimientos de caja...');

    // Primero obtenemos los movimientos con sus asientos
    const { data, error } = await supabase
      .from('movimientos_contables')
      .select(`
        *,
        asientos_contables (
          id,
          numero,
          fecha,
          descripcion
        )
      `)
      .eq('cuenta_id', cuentaId)
      .limit(limite * 3); // Obtenemos más movimientos para luego ordenar y limitar

    if (error) throw error;

    // Ordenar por fecha del asiento (más reciente primero) en JavaScript
    const movimientosOrdenados = data
      .filter(mov => mov.asientos_contables) // Filtrar movimientos sin asiento
      .sort((a, b) => {
        const fechaA = new Date(a.asientos_contables.fecha);
        const fechaB = new Date(b.asientos_contables.fecha);
        return fechaB - fechaA; // Orden descendente (más reciente primero)
      })
      .slice(0, limite); // Tomar solo el límite solicitado

    return movimientosOrdenados;
  },

  // Función mantenida para uso manual futuro, pero no se llama automáticamente
  async crearAsientoAjusteManual(cuentaId, diferencia, descripcion) {
    console.log('📝 Creando asiento de ajuste de caja manualmente...');
    if (diferencia === 0) return null;
    // Obtener siguiente número de asiento
    const { data: ultimoAsiento } = await supabase
      .from('asientos_contables')
      .select('numero')
      .order('numero', { ascending: false })
      .limit(1);
    const numeroAsiento = (ultimoAsiento?.[0]?.numero || 0) + 1;
    // Crear el asiento principal
    const { data: asiento, error: errorAsiento } = await supabase
      .from('asientos_contables')
      .insert([{        numero: numeroAsiento,        fecha: obtenerFechaLocal(),        descripcion: descripcion,        total_debe: Math.abs(diferencia),        total_haber: Math.abs(diferencia),        estado: 'registrado',        usuario: 'admin'      }])      .select()      .single();
    if (errorAsiento) throw errorAsiento;
    // Crear el movimiento de ajuste en la cuenta de caja
    const movimiento = {      asiento_id: asiento.id,      cuenta_id: cuentaId,      debe: diferencia > 0 ? diferencia : 0,      haber: diferencia < 0 ? Math.abs(diferencia) : 0    };
    const { error: errorMovimiento } = await supabase
      .from('movimientos_contables')
      .insert([movimiento]);
    if (errorMovimiento) throw errorMovimiento;
    console.log('✅ Asiento de ajuste creado manualmente:', numeroAsiento);
    return asiento;
  },

  async guardarConciliacion(conciliacionData) {
    console.log('💾 Guardando conciliación de caja...');

    // Obtener fecha y hora actual exacta en hora de Argentina
    const ahora = new Date();
    // Convertir a zona horaria de Argentina
    const ahoraArgentina = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
    // Formatear manualmente a formato ISO pero con hora local Argentina
    const year = ahoraArgentina.getFullYear();
    const month = String(ahoraArgentina.getMonth() + 1).padStart(2, '0');
    const day = String(ahoraArgentina.getDate()).padStart(2, '0');
    const hours = String(ahoraArgentina.getHours()).padStart(2, '0');
    const minutes = String(ahoraArgentina.getMinutes()).padStart(2, '0');
    const seconds = String(ahoraArgentina.getSeconds()).padStart(2, '0');
    const fechaHoraExacta = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    // Preparar datos de inserción
    const datosInsercion = {
      cuenta_caja_id: conciliacionData.cuentaId,
      fecha_conciliacion: fechaHoraExacta, // Fecha y hora exacta
      saldo_contable: conciliacionData.saldoContable,
      saldo_fisico: conciliacionData.saldoFisico,
      diferencia: conciliacionData.diferencia,
      observaciones: conciliacionData.observaciones,
      usuario_concilio: conciliacionData.usuario || 'admin',
      estado: conciliacionData.diferencia === 0 ? 'conciliado' : 'con_diferencia',
      moneda: conciliacionData.moneda || 'USD'
    };

    // Guardar la conciliación
    const { data, error } = await supabase
      .from('conciliaciones_caja')
      .insert([datosInsercion])
      .select();

    if (error) throw error;

    console.log('✅ Conciliación guardada en', conciliacionData.moneda);
    return data[0];
  },

  async getConciliacionesAnteriores(cuentaId, limite = 5) {
    console.log('📊 Obteniendo conciliaciones anteriores...');
    const { data, error } = await supabase
      .from('conciliaciones_caja')
      .select('*, created_at')
      .eq('cuenta_caja_id', cuentaId)
      .order('fecha_conciliacion', { ascending: false })
      .limit(limite);
    if (error) throw error;
    return data;
  }
};

// Hook personalizado
function useConciliacionCaja() {
  const [cuentasCaja, setCuentasCaja] = useState([]);
  const [cuentasCajaConSaldos, setCuentasCajaConSaldos] = useState([]);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
  const [saldoContable, setSaldoContable] = useState(null);
  const [ultimosMovimientos, setUltimosMovimientos] = useState([]);
  const [conciliacionesAnteriores, setConciliacionesAnteriores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSaldos, setLoadingSaldos] = useState(false);
  const [error, setError] = useState(null);

  const fetchCuentasCaja = async () => {
    try {
      setError(null);
      const data = await conciliacionCajaService.getCuentasCaja();
      setCuentasCaja(data);

      // Obtener saldos para cada cuenta
      setLoadingSaldos(true);
      const cuentasConSaldosData = await Promise.all(
        data.map(async (cuenta) => {
          try {
            const saldo = await conciliacionCajaService.getSaldoContableCaja(cuenta.id);
            return {
              ...cuenta,
              saldoActual: saldo.saldoContable
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
      setCuentasCajaConSaldos(cuentasConSaldosData);
      setLoadingSaldos(false);
    } catch (err) {
      setError(err.message);
      setLoadingSaldos(false);
    }
  };

  const fetchDatosCuenta = async (cuentaId, fechaCorte = null) => {
    try {
      setLoading(true);
      setError(null);
            
      const [saldo, movimientos, conciliaciones] = await Promise.all([
        conciliacionCajaService.getSaldoContableCaja(cuentaId, fechaCorte),
        conciliacionCajaService.getUltimosMovimientosCaja(cuentaId),
        conciliacionCajaService.getConciliacionesAnteriores(cuentaId)
      ]);
      setSaldoContable(saldo);
      setUltimosMovimientos(movimientos);
      setConciliacionesAnteriores(conciliaciones);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const guardarConciliacion = async (conciliacionData) => {
    try {
      setError(null);
      const resultado = await conciliacionCajaService.guardarConciliacion(conciliacionData);
      // Refrescar datos
      fetchDatosCuenta(conciliacionData.cuentaId);
      return resultado;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    cuentasCaja,
    cuentasCajaConSaldos,
    cuentaSeleccionada,
    saldoContable,
    ultimosMovimientos,
    conciliacionesAnteriores,
    loading,
    loadingSaldos,
    error,
    fetchCuentasCaja,
    fetchDatosCuenta,
    setCuentaSeleccionada,
    guardarConciliacion
  };
}

// Componente principal
const ConciliacionCajaSection = () => {
  const {
    cuentasCaja,
    cuentasCajaConSaldos,
    cuentaSeleccionada,
    saldoContable,
    ultimosMovimientos,
    conciliacionesAnteriores,
    loading,
    loadingSaldos,
    error,
    fetchCuentasCaja,
    fetchDatosCuenta,
    setCuentaSeleccionada,
    guardarConciliacion
  } = useConciliacionCaja();

  const [fechaConciliacion, setFechaConciliacion] = useState(obtenerFechaLocal());

  // Estado para el monto físico
  const [montoFisico, setMontoFisico] = useState('');
  const [montoFisicoARS, setMontoFisicoARS] = useState(''); // Para cuentas en pesos
  const [observaciones, setObservaciones] = useState('');
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [modalAsiento, setModalAsiento] = useState({ open: false, asiento: null });

  useEffect(() => {
    console.log('🚀 Iniciando conciliación de caja...');
    fetchCuentasCaja();
  }, []);

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

  const seleccionarCuenta = (cuenta) => {
    setCuentaSeleccionada(cuenta);
    fetchDatosCuenta(cuenta.id, fechaConciliacion);
    // Limpiar campos al cambiar cuenta
    setMontoFisico('');
    setMontoFisicoARS('');
  };

  // Determinar si es cuenta en pesos
  const esMonedaARS = cuentaSeleccionada?.moneda_original === 'ARS' ||
                     cuentaSeleccionada?.requiere_cotizacion;

  // Calcular saldo físico en moneda nativa
  const saldoFisico = esMonedaARS
    ? (parseFloat(montoFisicoARS) || 0)
    : (parseFloat(montoFisico) || 0);

  // Calcular diferencia: redondear a entero, y si está en rango +-1 considerarlo como 0
  const diferenciaRaw = saldoFisico - (saldoContable?.saldoContable || 0);
  const diferenciaRedondeada = Math.round(diferenciaRaw);
  const diferencia = Math.abs(diferenciaRedondeada) <= 1 ? 0 : diferenciaRedondeada;

  const realizarConciliacion = async () => {
    if (!cuentaSeleccionada) {
      alert('Debe seleccionar una cuenta de caja y bancos');
      return;
    }

    // Validaciones según el tipo de moneda
    if (esMonedaARS) {
      if (!montoFisicoARS || parseFloat(montoFisicoARS) < 0) {
        alert('Debe ingresar un monto en pesos válido');
        return;
      }
    } else {
      if (!montoFisico || parseFloat(montoFisico) < 0) {
        alert('Debe ingresar un monto físico válido');
        return;
      }
    }
    try {
      const conciliacionData = {
        cuentaId: cuentaSeleccionada.id,
        fecha: fechaConciliacion,
        saldoContable: saldoContable.saldoContable,
        saldoFisico: saldoFisico,
        diferencia: diferencia,
        observaciones: observaciones,
        moneda: cuentaSeleccionada.moneda_original
      };
      await guardarConciliacion(conciliacionData);

      // Limpiar formulario
      setMontoFisico('');
      setMontoFisicoARS('');
      setObservaciones('');
      
      // Refrescar datos para mostrar el nuevo saldo
      fetchDatosCuenta(cuentaSeleccionada.id, fechaConciliacion);
      
      if (diferencia === 0) {
        alert('✅ Cuenta conciliada correctamente');
      } else {
        alert(`✅ Conciliación guardada con diferencia de ${formatearMoneda(diferencia)}\n\n` +
              `📝 IMPORTANTE: Debe crear manualmente un asiento de ajuste en el Libro Diario para registrar ` +
              `el ${diferencia > 0 ? 'sobrante' : 'faltante'} en la cuenta.`);
      }
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  const formatearMoneda = (valor) => {
    const moneda = cuentaSeleccionada?.moneda_original || 'USD';
    return formatearMonto(valor, moneda);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Argentina/Buenos_Aires'
    });
  };

  const formatearFechaHora = (fechaHora) => {
    const fecha = new Date(fechaHora);
    return fecha.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/Argentina/Buenos_Aires'
    });
  };

  const formatearHora = (timestamp) => {
    if (!timestamp) return '-';
    // Asegurar que el timestamp se interprete como UTC
    const timestampUTC = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
    const fecha = new Date(timestampUTC);
    return fecha.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'America/Argentina/Buenos_Aires'
    });
  };

  if (loading && !cuentaSeleccionada) {
    return (
      <div className="p-8 h-96">
        <LoadingSpinner text="Cargando cuentas de caja..." size="medium" />
      </div>
    );
  }
  
  return (
    <div className="p-0">
      {/* Header */}
      <div className="bg-white rounded border border-slate-200">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Calculator className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-semibold">Conciliación de Caja</h2>
                <p className="text-slate-300 mt-1">
                  {cuentaSeleccionada
                    ? `${cuentaSeleccionada.codigo} - ${cuentaSeleccionada.nombre} • Conciliación al ${formatearFecha(fechaConciliacion)}`
                    : 'Seleccione una cuenta de caja y bancos para realizar una conciliación.'
                  }
                </p>
              </div>
            </div>
            {cuentaSeleccionada && (
              <button
                onClick={() => {
                  setCuentaSeleccionada(null);
                  setSaldoContable(null);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition-colors text-sm font-medium"
              >
                <ArrowLeft size={18} />
                Volver
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Tarjetas de totales */}
      {!cuentaSeleccionada && cuentasCajaConSaldos.length > 0 && (
        <div className="bg-slate-50 p-4 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Tarjeta
              icon={DollarSign}
              titulo="Total en Cuentas USD"
              valor={formatearMonto(
                cuentasCajaConSaldos
                  .filter(c =>
                    (c.codigo.startsWith('1.1.01.01') ||
                     c.codigo.startsWith('1.1.01.02') ||
                     c.codigo.startsWith('1.1.01.03') ||
                     c.codigo.startsWith('1.1.01.05')) &&
                    c.moneda_original === 'USD' &&
                    !c.requiere_cotizacion
                  )
                  .reduce((sum, c) => sum + (c.saldoActual || 0), 0),
                'USD'
              )}
              className="text-emerald-600"
            />
            <Tarjeta
              icon={DollarSign}
              titulo="Total en Cuentas ARS"
              valor={formatearMonto(
                cuentasCajaConSaldos
                  .filter(c => c.moneda_original === 'ARS' || c.requiere_cotizacion)
                  .reduce((sum, c) => sum + (c.saldoActual || 0), 0),
                'ARS'
              )}
              className="text-emerald-600"
            />
            <Tarjeta
              icon={DollarSign}
              titulo="Total en Cripto"
              valor={formatearMonto(
                cuentasCajaConSaldos
                  .filter(c => c.codigo.startsWith('1.1.01.04'))
                  .reduce((sum, c) => sum + (c.saldoActual || 0), 0),
                'USD'
              )}
              className="text-emerald-600"
            />
          </div>
        </div>
      )}

      {/* Selector de cuenta de caja y bancos */}
      {!cuentaSeleccionada && (
        <div className="bg-white p-6 rounded border border-slate-200">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cuentasCajaConSaldos
              .filter(cuenta => (cuenta.saldoActual || 0) !== 0)
              .map(cuenta => {
              const esARS = cuenta.moneda_original === 'ARS' || cuenta.requiere_cotizacion;
              return (
                <button
                  key={cuenta.id}
                  onClick={() => seleccionarCuenta(cuenta)}
                  className="p-6 rounded border border-slate-200 hover:border-slate-800 hover:bg-slate-50 transition-colors text-left flex justify-between items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <div className="font-bold text-slate-800 truncate">{cuenta.nombre}</div>
                      {esARS && (
                        <span className="px-2 py-1 bg-slate-600 text-white text-xs rounded flex-shrink-0">ARS</span>
                      )}
                    </div>
                    <code className="text-sm text-slate-600 font-mono">
                      {cuenta.codigo}
                    </code>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0">
                    <div className="text-xs text-slate-500 mb-1 whitespace-nowrap">Saldo</div>
                    <div className={`font-semibold text-base whitespace-nowrap ${(cuenta.saldoActual || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {loadingSaldos ? (
                        <span className="text-slate-400">Cargando...</span>
                      ) : (
                        formatearMonto(Math.abs(cuenta.saldoActual || 0), cuenta.moneda_original || 'USD')
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Vista de conciliación */}
      {cuentaSeleccionada && (
        <div className="mt-6">
          {loading && (
            <LoadingSpinner text="Cargando datos de la cuenta..." size="medium" />
          )}
          {saldoContable && !loading && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Columna Izquierda: Saldos y Movimientos */}
              <div className="lg:col-span-2 space-y-6">
                {/* Panel de Saldos */}
                <div className="bg-white border border-slate-200 rounded">
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded border border-slate-200 text-center">
                      <p className="text-sm text-slate-600">Saldo Contable Actual</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {formatearMoneda(saldoContable.saldoContable)}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded border border-slate-200 text-center">
                      <p className="text-sm text-slate-600">Total Movimientos</p>
                      <p className="text-2xl font-bold text-slate-800">{saldoContable.totalMovimientos}</p>
                    </div>
                  </div>
                </div>
                {/* Últimos movimientos */}
                <div className="bg-white border border-slate-200 rounded">
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <h5 className="font-semibold text-slate-800 flex items-center">
                      <History size={18} className="mr-2" />
                      Últimos Movimientos
                    </h5>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-800 text-white">
                        <tr>
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Fecha</th>
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Asiento</th>
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Descripción</th>
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Debe</th>
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Haber</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {ultimosMovimientos.map((mov, index) => (
                          <tr
                            key={index}
                            onClick={() => abrirModalAsiento(mov.asiento_id)}
                            className={`cursor-pointer hover:bg-slate-100 transition-colors ${
                              index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                            }`}
                          >
                            <td className="px-4 py-3 text-sm text-slate-600 text-center whitespace-nowrap">
                              {formatearFecha(mov.asientos_contables.fecha)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                N° {mov.asientos_contables.numero}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700 max-w-xs">
                              <div className="truncate" title={mov.asientos_contables.descripcion}>
                                {mov.asientos_contables.descripcion}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-medium text-emerald-600">
                              {esMonedaARS
                                ? (mov.debe_ars > 0 ? formatearMoneda(mov.debe_ars) : '-')
                                : (mov.debe > 0 ? formatearMoneda(mov.debe) : '-')
                              }
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-medium text-slate-600">
                              {esMonedaARS
                                ? (mov.haber_ars > 0 ? formatearMoneda(mov.haber_ars) : '-')
                                : (mov.haber > 0 ? formatearMoneda(mov.haber) : '-')
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              {/* Columna Derecha: Conciliación */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white border border-slate-200 rounded">
                  
                  <div className="p-4 space-y-4">
                    {esMonedaARS ? (
                      /* Campos para cuentas en pesos */
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Saldo físico real (ARS)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                          <input
                            type="text"
                            value={montoFisicoARS ? Number(montoFisicoARS).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : ''}
                            onChange={(e) => {
                              const valor = e.target.value.replace(/\./g, '');
                              if (!isNaN(valor) || valor === '') {
                                setMontoFisicoARS(valor);
                              }
                            }}
                            placeholder="0"
                            className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded text-xl font-semibold text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    ) : (
                      /* Campos para cuentas en dólares */
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Saldo físico real (USD)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                          <input
                            type="text"
                            value={montoFisico}
                            onChange={(e) => {
                              const valor = e.target.value;
                              // Permitir solo números y punto decimal
                              if (/^\d*\.?\d*$/.test(valor) || valor === '') {
                                setMontoFisico(valor);
                              }
                            }}
                            placeholder="0.00"
                            className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded text-xl font-semibold text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded">
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <h4 className="font-semibold text-slate-800 flex items-center">
                      <CheckCircle size={18} className="mr-2" />
                      Resultado de Conciliación
                    </h4>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Saldo contable:</span>
                      <span className="font-medium text-slate-800">{formatearMoneda(saldoContable.saldoContable)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Saldo físico:</span>
                      <span className="font-medium text-slate-800">{formatearMoneda(saldoFisico)}</span>
                    </div>
                    <div className="border-t-2 border-slate-200 pt-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-lg text-slate-800">Diferencia:</span>
                        <span className={`font-bold text-2xl ${
                          diferencia === 0 ? 'text-emerald-600' : 
                          diferencia > 0 ? 'text-emerald-600' : 'text-slate-600'
                        }`}>
                          {diferencia > 0 ? '+' : ''}{formatearMoneda(diferencia)}
                        </span>
                      </div>
                      {diferencia !== 0 && (
                        <p className="text-sm mt-2 text-right font-semibold text-slate-600">
                          {diferencia > 0 ? 'SOBRANTE' : 'FALTANTE'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded p-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Comentarios sobre la conciliación (opcional)..."
                    className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    rows="3"
                  />
                </div>
                <button
                  onClick={realizarConciliacion}
                  className="w-full bg-emerald-600 text-white px-4 py-3 rounded hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 font-semibold text-base"
                >
                  <Save size={18} />
                  Guardar Conciliación
                </button>
              </div>
            </div>
          )}
          {/* Historial de conciliaciones */}
          {conciliacionesAnteriores.length > 0 && !loading && (
            <div className="mt-8 bg-white border border-slate-200 rounded">
              <button
                onClick={() => setMostrarHistorial(!mostrarHistorial)}
                className="w-full p-4 bg-slate-800 text-white flex justify-center items-center hover:bg-slate-700 transition-colors"
              >
                <h5 className="font-semibold flex items-center">
                  <History size={18} className="mr-2" />
                  HISTORIAL ({conciliacionesAnteriores.length})
                  <ChevronRight className={`w-5 h-5 transition-transform ml-2 ${mostrarHistorial ? 'rotate-90' : ''}`} />
                </h5>
              </button>
              {mostrarHistorial && (
                <div className="p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm table-fixed">
                      <thead className="bg-slate-800 text-white">
                        <tr>
                          <th className="w-[15%] text-center px-4 py-3 text-xs font-medium uppercase tracking-wider">Fecha</th>
                          <th className="w-[12%] text-center px-4 py-3 text-xs font-medium uppercase tracking-wider">Hora</th>
                          <th className="w-[18%] text-center px-4 py-3 text-xs font-medium uppercase tracking-wider">Saldo Contable</th>
                          <th className="w-[18%] text-center px-4 py-3 text-xs font-medium uppercase tracking-wider">Saldo Físico</th>
                          <th className="w-[18%] text-center px-4 py-3 text-xs font-medium uppercase tracking-wider">Diferencia</th>
                          <th className="w-[19%] text-center px-4 py-3 text-xs font-medium uppercase tracking-wider">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conciliacionesAnteriores.map((conc, index) => (
                          <tr key={index} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                            <td className="py-2 px-3 text-slate-800 text-sm text-center">{formatearFecha(conc.fecha_conciliacion)}</td>
                            <td className="py-2 px-3 text-slate-800 text-sm text-center">{formatearHora(conc.created_at)}</td>
                            <td className="text-center py-2 px-3 font-mono text-slate-800">{formatearMoneda(conc.saldo_contable)}</td>
                            <td className="text-center py-2 px-3 font-mono text-slate-800">{formatearMoneda(conc.saldo_fisico)}</td>
                            <td className={`text-center py-2 px-3 font-bold ${
                              conc.diferencia === 0 ? 'text-emerald-600' :
                              conc.diferencia > 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                              {conc.diferencia > 0 ? '+' : conc.diferencia < 0 ? '-' : ''}{formatearMoneda(Math.abs(conc.diferencia))}
                            </td>
                            <td className="text-center py-2 px-3">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                conc.estado === 'conciliado'
                                   ? 'bg-emerald-100 text-emerald-800'
                                   : 'bg-slate-100 text-slate-800'
                              }`}>
                                {conc.estado === 'conciliado' ? 'Conciliado' : 'Diferencia'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Error */}
      {error && (
        <div className="mt-6 bg-slate-50 border-l-4 border-slate-600 p-4">
          <p className="font-bold text-slate-800">Error</p>
          <span className="text-slate-700">{error}</span>
        </div>
      )}

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

export default ConciliacionCajaSection;