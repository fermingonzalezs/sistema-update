import React, { useState, useEffect } from 'react';
import { DollarSign, Calculator, AlertTriangle, CheckCircle, Save, RefreshCw, Plus, Minus, Eye, FileText, Calendar } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

// Servicio para Conciliación de Caja
const conciliacionCajaService = {
  async getCuentasCaja() {
    console.log('📡 Obteniendo cuentas de caja...');

    const { data, error } = await supabase
      .from('plan_cuentas')
      .select('*')
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
      .select(`
        *,
        asientos_contables (
          numero, fecha, descripcion
        )
      `)
      .eq('cuenta_id', cuentaId)
      .order('id', { ascending: false })
      .limit(limite);

    if (error) throw error;
    return data;
  },

  async crearAsientoAjuste(cuentaId, diferencia, descripcion) {
    console.log('📝 Creando asiento de ajuste de caja...');

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
      .insert([{
        numero: numeroAsiento,
        fecha: new Date().toISOString().split('T')[0],
        descripcion: descripcion,
        total_debe: Math.abs(diferencia),
        total_haber: Math.abs(diferencia),
        estado: 'registrado',
        usuario: 'admin'
      }])
      .select()
      .single();

    if (errorAsiento) throw errorAsiento;

    // Crear el movimiento de ajuste en la cuenta de caja
    const movimiento = {
      asiento_id: asiento.id,
      cuenta_id: cuentaId,
      debe: diferencia > 0 ? diferencia : 0,
      haber: diferencia < 0 ? Math.abs(diferencia) : 0
    };

    const { error: errorMovimiento } = await supabase
      .from('movimientos_contables')
      .insert([movimiento]);

    if (errorMovimiento) throw errorMovimiento;

    console.log('✅ Asiento de ajuste creado:', numeroAsiento);
    return asiento;
  },

  async guardarConciliacion(conciliacionData) {
    console.log('💾 Guardando conciliación de caja...');

    // Guardar la conciliación
    const { data, error } = await supabase
      .from('conciliaciones_caja')
      .insert([{
        cuenta_caja_id: conciliacionData.cuentaId,
        fecha_conciliacion: conciliacionData.fecha,
        saldo_contable: conciliacionData.saldoContable,
        saldo_fisico: conciliacionData.saldoFisico,
        diferencia: conciliacionData.diferencia,
        observaciones: conciliacionData.observaciones,
        usuario_concilio: conciliacionData.usuario || 'admin',
        estado: conciliacionData.diferencia === 0 ? 'conciliado' : 'con_diferencia'
      }])
      .select();

    if (error) throw error;

    // Si hay diferencia, crear asiento de ajuste
    if (conciliacionData.diferencia !== 0) {
      const descripcionAjuste = conciliacionData.diferencia > 0 
        ? `Sobrante de caja - Conciliación ${conciliacionData.fecha}`
        : `Faltante de caja - Conciliación ${conciliacionData.fecha}`;
      
      await this.crearAsientoAjuste(
        conciliacionData.cuentaId, 
        conciliacionData.diferencia, 
        descripcionAjuste
      );
    }

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
  const [observaciones, setObservaciones] = useState('');
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  useEffect(() => {
    console.log('🚀 Iniciando conciliación de caja...');
    fetchCuentasCaja();
  }, []);

  const seleccionarCuenta = (cuenta) => {
    setCuentaSeleccionada(cuenta);
    fetchDatosCuenta(cuenta.id, fechaConciliacion);
  };

  const saldoFisico = parseFloat(montoFisico) || 0;
  const diferencia = saldoFisico - (saldoContable?.saldoContable || 0);

  const realizarConciliacion = async () => {
    if (!cuentaSeleccionada) {
      alert('Debe seleccionar una cuenta de caja');
      return;
    }

    if (!montoFisico || parseFloat(montoFisico) < 0) {
      alert('Debe ingresar un monto físico válido');
      return;
    }

    try {
      const conciliacionData = {
        cuentaId: cuentaSeleccionada.id,
        fecha: fechaConciliacion,
        saldoContable: saldoContable.saldoContable,
        saldoFisico: saldoFisico,
        diferencia: diferencia,
        observaciones: observaciones
      };

      await guardarConciliacion(conciliacionData);
      
      // Limpiar formulario
      setMontoFisico('');
      setObservaciones('');
      
      // Refrescar datos para mostrar el nuevo saldo
      fetchDatosCuenta(cuentaSeleccionada.id, fechaConciliacion);
      
      if (diferencia === 0) {
        alert('✅ Caja conciliada correctamente');
      } else {
        alert(`✅ Conciliación guardada con diferencia de ${formatearMoneda(diferencia)}\n\n` +
              '📝 Se ha creado un asiento contable automáticamente para ajustar el saldo.');
      }
    } catch (err) {
      alert('❌ Error: ' + err.message);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Cargando conciliación de caja...</span>
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
              <DollarSign size={28} />
              <div>
                <h2 className="text-4xl font-bold">Conciliación de Caja</h2>
                <p className="text-green-100 mt-1">Verificación del efectivo físico vs. registros contables</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div>
                <label className="block text-green-100 text-sm mb-1">Fecha de conciliación</label>
                <input
                  type="date"
                  value={fechaConciliacion}
                  onChange={(e) => setFechaConciliacion(e.target.value)}
                  className="px-3 py-2 rounded text-gray-800 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Selector de cuenta de caja */}
        {!cuentaSeleccionada && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Seleccionar Cuenta de Caja a Conciliar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cuentasCaja.map(cuenta => (
                <button
                  key={cuenta.id}
                  onClick={() => seleccionarCuenta(cuenta)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <code className="text-sm text-green-600 font-mono bg-green-100 px-2 py-1 rounded mb-2 block">
                        {cuenta.codigo}
                      </code>
                      <div className="font-medium text-gray-900">{cuenta.nombre}</div>
                    </div>
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Vista de conciliación */}
        {cuentaSeleccionada && saldoContable && (
          <div className="p-6">
            {/* Información de la cuenta */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {cuentaSeleccionada.codigo} - {cuentaSeleccionada.nombre}
                  </h3>
                  <p className="text-sm text-gray-600">Conciliación del {formatearFecha(fechaConciliacion)}</p>
                </div>
                <button
                  onClick={() => {
                    setCuentaSeleccionada(null);
                    setSaldoContable(null);
                  }}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <RefreshCw size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Panel izquierdo: Saldo contable */}
              <div className="lg:col-span-1">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                    <FileText size={20} className="mr-2" />
                    Saldo Contable
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Saldo actual:</span>
                      <span className="font-bold text-blue-800">
                        {formatearMoneda(saldoContable.saldoContable)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-600">Total ingresos:</span>
                      <span className="text-green-600">{formatearMoneda(saldoContable.totalIngresos)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-600">Total egresos:</span>
                      <span className="text-red-600">{formatearMoneda(saldoContable.totalEgresos)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-600">Movimientos:</span>
                      <span>{saldoContable.totalMovimientos}</span>
                    </div>
                  </div>
                </div>

                {/* Últimos movimientos */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Calendar size={16} className="mr-2" />
                    Últimos Movimientos
                  </h5>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {ultimosMovimientos.map((mov, index) => (
                      <div key={index} className="text-xs bg-white p-2 rounded border">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-blue-600">N° {mov.asientos_contables.numero}</span>
                          <span className="text-gray-500">{formatearFecha(mov.asientos_contables.fecha)}</span>
                        </div>
                        <div className="text-gray-700 truncate">{mov.asientos_contables.descripcion}</div>
                        <div className="flex justify-between mt-1">
                          {mov.debe > 0 && <span className="text-green-600">+{formatearMoneda(mov.debe)}</span>}
                          {mov.haber > 0 && <span className="text-red-600">-{formatearMoneda(mov.haber)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Panel central: Monto físico */}
              <div className="lg:col-span-1">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                    <Calculator size={20} className="mr-2" />
                    Monto Físico en Caja
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-yellow-700 mb-2">
                        ¿Cuánto dinero hay físicamente en la caja?
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-yellow-600">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={montoFisico}
                          onChange={(e) => setMontoFisico(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-8 pr-3 py-3 border border-yellow-300 rounded-lg text-lg font-medium text-center focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      </div>
                    </div>
                
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-yellow-300">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-yellow-800">Total Físico:</span>
                      <span className="font-bold text-xl text-yellow-800">
                        {formatearMoneda(saldoFisico)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel derecho: Resultado */}
              <div className="lg:col-span-1">
                <div className={`border rounded-lg p-4 ${
                  diferencia === 0 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <h4 className={`text-lg font-semibold mb-4 flex items-center ${
                    diferencia === 0 ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {diferencia === 0 ? <CheckCircle size={20} className="mr-2" /> : <AlertTriangle size={20} className="mr-2" />}
                    Resultado
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Saldo contable:</span>
                      <span className="font-medium">{formatearMoneda(saldoContable.saldoContable)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Saldo físico:</span>
                      <span className="font-medium">{formatearMoneda(saldoFisico)}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Diferencia:</span>
                        <span className={`font-bold text-lg ${
                          diferencia === 0 ? 'text-green-600' : 
                          diferencia > 0 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {diferencia > 0 ? '+' : ''}{formatearMoneda(diferencia)}
                        </span>
                      </div>
                      {diferencia !== 0 && (
                        <p className="text-xs mt-2 text-gray-600">
                          {diferencia > 0 ? 'Sobrante en caja' : 'Faltante en caja'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Observaciones */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Comentarios sobre la conciliación..."
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    rows="3"
                  />
                </div>

                {/* Botón guardar */}
                <button
                  onClick={realizarConciliacion}
                  className="w-full mt-4 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Save size={18} />
                  Guardar Conciliación
                </button>
              </div>
            </div>

            {/* Historial de conciliaciones */}
            {conciliacionesAnteriores.length > 0 && (
              <div className="mt-8">
                <button
                  onClick={() => setMostrarHistorial(!mostrarHistorial)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4"
                >
                  <Eye size={16} />
                  <span>Ver historial de conciliaciones ({conciliacionesAnteriores.length})</span>
                </button>

                {mostrarHistorial && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="text-left py-2 px-3">Fecha</th>
                            <th className="text-right py-2 px-3">Saldo Contable</th>
                            <th className="text-right py-2 px-3">Saldo Físico</th>
                            <th className="text-right py-2 px-3">Diferencia</th>
                            <th className="text-center py-2 px-3">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {conciliacionesAnteriores.map((conc, index) => (
                            <tr key={index} className="border-b border-gray-200">
                              <td className="py-2 px-3">{formatearFecha(conc.fecha_conciliacion)}</td>
                              <td className="text-right py-2 px-3">{formatearMoneda(conc.saldo_contable)}</td>
                              <td className="text-right py-2 px-3">{formatearMoneda(conc.saldo_fisico)}</td>
                              <td className={`text-right py-2 px-3 font-medium ${
                                conc.diferencia === 0 ? 'text-green-600' : 
                                conc.diferencia > 0 ? 'text-blue-600' : 'text-red-600'
                              }`}>
                                {conc.diferencia > 0 ? '+' : ''}{formatearMoneda(conc.diferencia)}
                              </td>
                              <td className="text-center py-2 px-3">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  conc.estado === 'conciliado' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {conc.estado === 'conciliado' ? 'OK' : 'Diferencia'}
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
          <div className="bg-red-50 border-l-4 border-red-400 p-4 m-6">
            <span className="text-red-800">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConciliacionCajaSection;