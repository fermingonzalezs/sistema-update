import React, { useState, useEffect } from 'react';
import { DollarSign, Calculator, AlertTriangle, CheckCircle, Save, RefreshCw, Plus, Minus, Eye, FileText, Calendar, ChevronRight, History, ArrowRightLeft } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { formatearMonto } from '../../../shared/utils/formatters';
import { convertirARSaUSD, validarRangoCotizacion } from '../../../shared/utils/currency';
import { cotizacionService } from '../../../shared/services/cotizacionService';
import LoadingSpinner from '../../../shared/components/base/LoadingSpinner';

// Servicio para Conciliación de Caja
const conciliacionCajaService = {
  async getCuentasCaja() {
    console.log('📡 Obteniendo cuentas de caja...');
    const { data, error } = await supabase
      .from('plan_cuentas')
      .select('*, moneda_original')
      .eq('activa', true)
      .ilike('nombre', '%caja%')
      .order('codigo');
    if (error) {
      console.error('❌ Error obteniendo cuentas de caja:', error);
      throw error;
    }
    console.log(`✅ ${data.length} cuentas de caja encontradas`);
    return data;
  },

  async getSaldoContableCaja(cuentaId, fechaCorte = null) {
    console.log('💰 Calculando saldo contable de caja:', cuentaId);
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
      .select('debe, haber')
      .eq('cuenta_id', cuentaId)
      .in('asiento_id', asientoIds);

    if (errorMovimientos) throw errorMovimientos;

    const saldoContable = movimientos.reduce((acc, mov) => {
      return acc + parseFloat(mov.debe || 0) - parseFloat(mov.haber || 0);
    }, 0);

    return {
      saldoContable,
      totalMovimientos: movimientos.length,
      totalIngresos: movimientos.reduce((sum, m) => sum + parseFloat(m.debe || 0), 0),
      totalEgresos: movimientos.reduce((sum, m) => sum + parseFloat(m.haber || 0), 0)
    };
  },

  async getUltimosMovimientosCaja(cuentaId, limite = 10) {
    console.log('📋 Obteniendo últimos movimientos de caja...');
    const { data, error } = await supabase
      .from('movimientos_contables')
      .select(`        *,        asientos_contables (          numero, fecha, descripcion        )      `)
      .eq('cuenta_id', cuentaId)
      .order('id', { ascending: false })
      .limit(limite);
    if (error) throw error;
    return data;
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
      .insert([{        numero: numeroAsiento,        fecha: new Date().toISOString().split('T')[0],        descripcion: descripcion,        total_debe: Math.abs(diferencia),        total_haber: Math.abs(diferencia),        estado: 'registrado',        usuario: 'admin'      }])      .select()      .single();
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
    // Guardar solo la conciliación
    const { data, error } = await supabase
      .from('conciliaciones_caja')
      .insert([{        cuenta_caja_id: conciliacionData.cuentaId,        fecha_conciliacion: conciliacionData.fecha,        saldo_contable: conciliacionData.saldoContable,        saldo_fisico: conciliacionData.saldoFisico,        diferencia: conciliacionData.diferencia,        observaciones: conciliacionData.observaciones,        usuario_concilio: conciliacionData.usuario || 'admin',        estado: conciliacionData.diferencia === 0 ? 'conciliado' : 'con_diferencia'      }])      .select();
    if (error) throw error;
    
    console.log('✅ Conciliación guardada. Asiento de ajuste debe crearse manualmente si es necesario.');
    return data[0];
  },

  async getConciliacionesAnteriores(cuentaId, limite = 5) {
    console.log('📊 Obteniendo conciliaciones anteriores...');
    const { data, error } = await supabase
      .from('conciliaciones_caja')
      .select('*')
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
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
  const [saldoContable, setSaldoContable] = useState(null);
  const [ultimosMovimientos, setUltimosMovimientos] = useState([]);
  const [conciliacionesAnteriores, setConciliacionesAnteriores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCuentasCaja = async () => {
    try {
      setError(null);
      const data = await conciliacionCajaService.getCuentasCaja();
      setCuentasCaja(data);
    } catch (err) {
      setError(err.message);
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
    cuentaSeleccionada,
    saldoContable,
    ultimosMovimientos,
    conciliacionesAnteriores,
    loading,
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
    cuentaSeleccionada,
    saldoContable,
    ultimosMovimientos,
    conciliacionesAnteriores,
    loading,
    error,
    fetchCuentasCaja,
    fetchDatosCuenta,
    setCuentaSeleccionada,
    guardarConciliacion
  } = useConciliacionCaja();

  const [fechaConciliacion, setFechaConciliacion] = useState(
    new Date().toISOString().split('T')[0]
  );
  
  // Estado para el monto físico
  const [montoFisico, setMontoFisico] = useState('');
  const [montoFisicoARS, setMontoFisicoARS] = useState(''); // Para cuentas en pesos
  const [cotizacionManual, setCotizacionManual] = useState('');
  const [cotizacionActual, setCotizacionActual] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  useEffect(() => {
    console.log('🚀 Iniciando conciliación de caja...');
    fetchCuentasCaja();
    obtenerCotizacionActual();
  }, []);

  const obtenerCotizacionActual = async () => {
    try {
      const cotizacion = await cotizacionService.obtenerCotizacionActual();
      setCotizacionActual(cotizacion);
      if (!cotizacionManual) {
        setCotizacionManual(cotizacion.valor || cotizacion.promedio);
      }
    } catch (error) {
      console.error('Error obteniendo cotización:', error);
    }
  };

  const seleccionarCuenta = (cuenta) => {
    setCuentaSeleccionada(cuenta);
    fetchDatosCuenta(cuenta.id, fechaConciliacion);
    // Limpiar campos al cambiar cuenta
    setMontoFisico('');
    setMontoFisicoARS('');
    setCotizacionManual(cotizacionActual?.valor || cotizacionActual?.promedio || '');
  };

  // Determinar si es cuenta en pesos
  const esMonedaARS = cuentaSeleccionada?.moneda_original === 'ARS' || 
                     cuentaSeleccionada?.requiere_cotizacion;

  // Calcular saldo físico en USD
  const calcularSaldoFisicoUSD = () => {
    if (!esMonedaARS) {
      return parseFloat(montoFisico) || 0;
    } else {
      const montoARS = parseFloat(montoFisicoARS) || 0;
      const cotizacion = parseFloat(cotizacionManual) || 0;
      
      if (montoARS > 0 && cotizacion > 0) {
        try {
          return convertirARSaUSD(montoARS, cotizacion);
        } catch (error) {
          console.error('Error en conversión:', error);
          return 0;
        }
      }
      return 0;
    }
  };

  const saldoFisico = calcularSaldoFisicoUSD();
  const diferencia = saldoFisico - (saldoContable?.saldoContable || 0);

  const realizarConciliacion = async () => {
    if (!cuentaSeleccionada) {
      alert('Debe seleccionar una cuenta de caja');
      return;
    }

    // Validaciones según el tipo de moneda
    if (esMonedaARS) {
      if (!montoFisicoARS || parseFloat(montoFisicoARS) < 0) {
        alert('Debe ingresar un monto en pesos válido');
        return;
      }
      if (!cotizacionManual || parseFloat(cotizacionManual) <= 0) {
        alert('Debe ingresar una cotización válida');
        return;
      }
      try {
        validarRangoCotizacion(parseFloat(cotizacionManual));
      } catch (error) {
        alert('Error en cotización: ' + error.message);
        return;
      }
    } else {
      if (!montoFisico || parseFloat(montoFisico) < 0) {
        alert('Debe ingresar un monto físico válido');
        return;
      }
    }
    try {
      let observacionesCompletas = observaciones;
      
      // Agregar información de conversión si es cuenta ARS
      if (esMonedaARS) {
        const infoConversion = `\nConversión: $${montoFisicoARS} ARS → $${saldoFisico.toFixed(4)} USD (cotización: $${cotizacionManual})`;
        observacionesCompletas = observaciones + infoConversion;
      }

      const conciliacionData = {
        cuentaId: cuentaSeleccionada.id,
        fecha: fechaConciliacion,
        saldoContable: saldoContable.saldoContable,
        saldoFisico: saldoFisico,
        diferencia: diferencia,
        observaciones: observacionesCompletas
      };
      await guardarConciliacion(conciliacionData);
      
      // Limpiar formulario
      setMontoFisico('');
      setMontoFisicoARS('');
      setCotizacionManual(cotizacionActual?.valor || cotizacionActual?.promedio || '');
      setObservaciones('');
      
      // Refrescar datos para mostrar el nuevo saldo
      fetchDatosCuenta(cuentaSeleccionada.id, fechaConciliacion);
      
      if (diferencia === 0) {
        alert('✅ Caja conciliada correctamente');
      } else {
        alert(`✅ Conciliación guardada con diferencia de ${formatearMoneda(diferencia)}\n\n` +
              `📝 IMPORTANTE: Debe crear manualmente un asiento de ajuste en el Libro Diario para registrar ` +
              `el ${diferencia > 0 ? 'sobrante' : 'faltante'} de caja.`);
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
    return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
        <div className="p-5 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Calculator className="w-6 h-6" />
              <div>
                <p className="text-slate-300 mt-1">Seleccione una caja para realizar una conciliación.</p>
              </div>
            </div>
            
          </div>
        </div>
      </div>
      
      {/* Selector de cuenta de caja */}
      {!cuentaSeleccionada && (
        <div className="bg-white p-6 rounded border border-slate-200">
         
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cuentasCaja.map(cuenta => {
              const esARS = cuenta.moneda_original === 'ARS' || cuenta.requiere_cotizacion;
              return (
                <button
                  key={cuenta.id}
                  onClick={() => seleccionarCuenta(cuenta)}
                  className="p-6 rounded border border-slate-200 hover:border-slate-800 hover:bg-slate-50 transition-colors text-left flex justify-between items-center"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <div className="font-bold text-slate-800">{cuenta.nombre}</div>
                      {esARS && (
                        <span className="px-2 py-1 bg-slate-600 text-white text-xs rounded">ARS</span>
                      )}
                    </div>
                    <code className="text-sm text-slate-600 font-mono">
                      {cuenta.codigo}
                    </code>
                  </div>
                  <ChevronRight className="w-6 h-6 text-slate-400" />
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Vista de conciliación */}
      {cuentaSeleccionada && (
        <div>
          {/* Información de la cuenta */}
          <div className="bg-white p-4 rounded border border-slate-200 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-slate-800">
                  {cuentaSeleccionada.codigo} - {cuentaSeleccionada.nombre}
                </h3>
                <p className="text-sm text-slate-600">Conciliación al {formatearFecha(fechaConciliacion)}</p>
              </div>
              <button
                onClick={() => {
                  setCuentaSeleccionada(null);
                  setSaldoContable(null);
                }}
                className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 p-2 rounded transition-colors"
              >
                <RefreshCw size={20} />
              </button>
            </div>
          </div>
          
          {loading && (
            <LoadingSpinner text="Cargando datos de la cuenta..." size="medium" />
          )}
          {saldoContable && !loading && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Columna Izquierda: Saldos y Movimientos */}
              <div className="lg:col-span-2 space-y-6">
                {/* Panel de Saldos */}
                <div className="bg-white border border-slate-200 rounded">
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <h4 className="font-semibold text-slate-800 flex items-center">
                      <FileText size={18} className="mr-2" />
                      Saldos Contables
                    </h4>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded border border-slate-200">
                      <p className="text-sm text-slate-600">Saldo Contable Actual</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {formatearMoneda(saldoContable.saldoContable)}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded border border-slate-200">
                      <p className="text-sm text-slate-600">Total Movimientos</p>
                      <p className="text-2xl font-bold text-slate-800">{saldoContable.totalMovimientos}</p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-800 p-4 rounded border border-emerald-200">
                      <p className="text-sm">Total Ingresos</p>
                      <p className="text-lg font-bold">{formatearMoneda(saldoContable.totalIngresos)}</p>
                    </div>
                    <div className="bg-slate-100 text-slate-800 p-4 rounded border border-slate-200">
                      <p className="text-sm">Total Egresos</p>
                      <p className="text-lg font-bold">{formatearMoneda(saldoContable.totalEgresos)}</p>
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
                  <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                    {ultimosMovimientos.map((mov, index) => (
                      <div key={index} className="text-sm bg-white p-3 rounded border border-slate-200">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded">N° {mov.asientos_contables.numero}</span>
                          <span className="text-slate-500">{formatearFecha(mov.asientos_contables.fecha)}</span>
                        </div>
                        <p className="text-slate-700 truncate my-2">{mov.asientos_contables.descripcion}</p>
                        <div className="flex justify-end items-center mt-1">
                          {mov.debe > 0 && <span className="font-semibold text-emerald-600 text-base">+{formatearMoneda(mov.debe)}</span>}
                          {mov.haber > 0 && <span className="font-semibold text-slate-600 text-base">-{formatearMoneda(mov.haber)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Columna Derecha: Conciliación */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white border border-slate-200 rounded">
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <h4 className="font-semibold text-slate-800 flex items-center">
                      <Calculator size={18} className="mr-2" />
                      Monto Físico en Caja
                      {esMonedaARS && (
                        <span className="ml-2 px-2 py-1 bg-slate-600 text-white text-xs rounded">ARS</span>
                      )}
                    </h4>
                  </div>
                  <div className="p-4 space-y-4">
                    {esMonedaARS ? (
                      <>
                        {/* Campos para cuentas en pesos */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Monto físico en pesos (ARS)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={montoFisicoARS}
                              onChange={(e) => setMontoFisicoARS(e.target.value)}
                              placeholder="0.00"
                              className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded text-xl font-semibold text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Cotización USD/ARS
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={cotizacionManual}
                              onChange={(e) => setCotizacionManual(e.target.value)}
                              placeholder="1000.00"
                              className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded text-lg font-medium text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>
                          {cotizacionActual && (
                            <div className="mt-2 text-xs text-slate-600 text-center">
                              Cotización actual: ${cotizacionActual.valor || cotizacionActual.promedio}
                              <button
                                onClick={() => setCotizacionManual(cotizacionActual.valor || cotizacionActual.promedio)}
                                className="ml-2 text-emerald-600 hover:text-emerald-700 underline"
                              >
                                usar actual
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Mostrar conversión en tiempo real */}
                        {montoFisicoARS && cotizacionManual && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded p-3">
                            <div className="flex items-center justify-center space-x-2 text-sm">
                              <span className="font-medium text-slate-700">${montoFisicoARS} ARS</span>
                              <ArrowRightLeft size={16} className="text-emerald-600" />
                              <span className="font-bold text-emerald-800">${saldoFisico.toFixed(4)} USD</span>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      /* Campos para cuentas en dólares */
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Monto físico contado (USD)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={montoFisico}
                            onChange={(e) => setMontoFisico(e.target.value)}
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
                className="w-full p-4 bg-slate-50 border-b border-slate-200 text-left flex justify-between items-center hover:bg-slate-100 transition-colors"
              >
                <h5 className="font-semibold text-slate-800 flex items-center">
                  <History size={18} className="mr-2" />
                  Historial de Conciliaciones ({conciliacionesAnteriores.length})
                </h5>
                <ChevronRight className={`w-5 h-5 text-slate-600 transition-transform ${mostrarHistorial ? 'rotate-90' : ''}`} />
              </button>
              {mostrarHistorial && (
                <div className="p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left py-2 px-3 font-semibold text-slate-600">Fecha</th>
                          <th className="text-right py-2 px-3 font-semibold text-slate-600">S. Contable</th>
                          <th className="text-right py-2 px-3 font-semibold text-slate-600">S. Físico</th>
                          <th className="text-right py-2 px-3 font-semibold text-slate-600">Diferencia</th>
                          <th className="text-center py-2 px-3 font-semibold text-slate-600">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conciliacionesAnteriores.map((conc, index) => (
                          <tr key={index} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                            <td className="py-2 px-3 text-slate-800">{formatearFecha(conc.fecha_conciliacion)}</td>
                            <td className="text-right py-2 px-3 font-mono text-slate-800">{formatearMoneda(conc.saldo_contable)}</td>
                            <td className="text-right py-2 px-3 font-mono text-slate-800">{formatearMoneda(conc.saldo_fisico)}</td>
                            <td className={`text-right py-2 px-3 font-bold ${
                              conc.diferencia === 0 ? 'text-emerald-600' : 
                              conc.diferencia > 0 ? 'text-emerald-600' : 'text-slate-600'
                            }`}>
                              {conc.diferencia > 0 ? '+' : ''}{formatearMoneda(conc.diferencia)}
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
    </div>
  );
};

export default ConciliacionCajaSection;