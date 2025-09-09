import React, { useState, useEffect } from 'react';
import { Calendar, BarChart3, RefreshCw, Filter, Building2, TrendingUp, TrendingDown, ChevronDown, ChevronRight, Download, AlertCircle } from 'lucide-react';
import { formatearMonto } from '../../../shared/utils/formatters';
import { useEstadoSituacionPatrimonial } from '../hooks/useEstadoSituacionPatrimonial';
import { generarYAbrirEstadoSituacionPatrimonial } from '../../../components/pdf/contabilidad/EstadoSituacionPatrimonialPDF';

  const formatearMoneda = (monto) => formatearMonto(monto, 'USD');

  const CuentaRow = ({ cuenta }) => {
  return (
    <div className="flex justify-between items-center py-2 px-4 border-b border-slate-200 hover:bg-slate-100 transition-colors">
      <div className="flex items-center">
        <div className="mr-3">
          <code className="text-sm text-slate-600 font-mono bg-slate-100 px-2 py-1 rounded">
            {cuenta.cuenta.codigo}
          </code>
        </div>
        <span className="font-medium text-slate-800">
          {cuenta.cuenta.nombre}
        </span>
      </div>
      <div className="text-lg font-semibold text-slate-900">
        {formatearMoneda(cuenta.saldo)}
      </div>
    </div>
  );
};

// Componente principal
const EstadoSituacionPatrimonialSection = () => {
  const {
    balance,
    loading,
    error,
    fetchBalance
  } = useEstadoSituacionPatrimonial();

  const [fechaCorte, setFechaCorte] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    console.log('🚀 Iniciando carga de Balance General...');
    fetchBalance(fechaCorte);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aplicarFecha = () => {
    fetchBalance(fechaCorte);
  };

  const handleGenerarPDF = async () => {
    try {
      const resultado = await generarYAbrirEstadoSituacionPatrimonial(balance, fechaCorte);
      if (!resultado.success) {
        alert('Error al generar PDF: ' + resultado.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al generar PDF');
    }
  };

  const formatearMoneda = (monto) => formatearMonto(monto, 'USD');

  // Verificar ecuación contable: Activos = Pasivos + Patrimonio
  const diferencia = balance.totalActivos - (balance.totalPasivos + balance.totalPatrimonio);
  const ecuacionBalanceada = Math.abs(diferencia) < 0.01;

  // Función para renderizar una sección del balance
  const renderizarSeccion = (titulo, cuentas, total, icono) => {
    return (
      <div className="space-y-6">
        {/* Título de la sección */}
        <div className="bg-slate-800 text-white p-6">
          <h2 className="text-2xl font-bold flex items-center gap-4">
            {icono}
            {titulo}
            <span className="text-lg bg-slate-200 text-slate-800 px-4 py-2 rounded">
              {formatearMoneda(total)}
            </span>
          </h2>
          <p className="text-sm text-slate-200 mt-2">
            {cuentas.length} cuentas con movimiento
          </p>
        </div>

        {/* Cuentas de la sección */}
        <div className="bg-white border border-slate-200">
          <div className="p-4">
            <div className="space-y-0">
              {cuentas.map((item) => (
                <CuentaRow key={item.cuenta.id} cuenta={item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-0">
      {/* Header */}
      <div className="bg-white rounded border border-slate-200 mb-4">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Building2 className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-semibold">Estado de Situación Patrimonial</h2>
                <p className="text-slate-300 mt-1">Balance general al {new Date(fechaCorte).toLocaleDateString('es-AR')}</p>
              </div>
            </div>
            {!loading && !error && balance.activos && (
              <button
                onClick={handleGenerarPDF}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Descargar PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="bg-white p-6 rounded border border-slate-200 mb-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-800" />
            <label className="text-sm font-medium text-slate-800">
              Fecha de Corte:
            </label>
            <input
              type="date"
              value={fechaCorte}
              onChange={(e) => setFechaCorte(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <button
            onClick={aplicarFecha}
            disabled={loading}
            className="bg-emerald-600 text-white py-2 px-4 rounded hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Filter className="w-4 h-4" />
            )}
            {loading ? 'Calculando...' : 'Aplicar'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-6 rounded mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800 font-medium">Error:</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

        {/* Balance General */}
        {!loading && (
          <div className="space-y-6">
            {/* Resumen Ejecutivo */}
            <div className="bg-slate-800 p-8 rounded">
              <h3 className="font-bold text-white mb-6 text-2xl text-center mx-auto">RESULTADO</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center p-6 bg-slate-200 rounded">
                  <div className="text-3xl font-bold text-slate-800">{formatearMoneda(balance.totalActivos)}</div>
                  <div className="text-sm text-slate-800">Total Activos</div>
                  <div className="text-xs text-slate-800">{balance.activos.length} cuentas</div>
                </div>
                <div className="text-center p-6 bg-slate-200 rounded">
                  <div className="text-3xl font-bold text-slate-800">{formatearMoneda(balance.totalPasivos)}</div>
                  <div className="text-sm text-slate-800">Total Pasivos</div>
                  <div className="text-xs text-slate-800">{balance.pasivos.length} cuentas</div>
                </div>
                <div className="text-center p-6 bg-slate-200 rounded">
                  <div className="text-3xl font-bold text-slate-800">{formatearMoneda(balance.totalPatrimonio)}</div>
                  <div className="text-sm text-slate-800">Patrimonio Neto</div>
                  <div className="text-xs text-slate-800">{balance.patrimonio.length} cuentas</div>
                </div>
              </div>
            </div>

            {/* Layout de dos columnas para Balance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* COLUMNA IZQUIERDA - ACTIVOS */}
              <div className="space-y-6">
                <div className="bg-slate-800 text-white p-6">
                  <h2 className="text-2xl font-bold flex items-center gap-4">
                    <TrendingUp className="w-7 h-7" />
                    ACTIVOS
                    <span className="text-lg bg-slate-200 text-slate-800 px-4 py-2 rounded">
                      {formatearMoneda(balance.totalActivos)}
                    </span>
                  </h2>
                  <p className="text-sm text-slate-200 mt-2">
                    {balance.activos.length} cuentas con movimiento
                  </p>
                </div>

                <div className="bg-white border border-slate-200">
                  <div className="p-4">
                    <div className="space-y-0">
                      {balance.activos.map((item) => (
                        <CuentaRow key={item.cuenta.id} cuenta={item} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA - PASIVOS Y PATRIMONIO */}
              <div className="space-y-6">
                {/* PASIVOS */}
                <div className="space-y-6">
                  <div className="bg-slate-800 text-white p-6">
                    <h2 className="text-2xl font-bold flex items-center gap-4">
                      <TrendingDown className="w-7 h-7" />
                      PASIVOS
                      <span className="text-lg bg-slate-200 text-slate-800 px-4 py-2 rounded">
                        {formatearMoneda(balance.totalPasivos)}
                      </span>
                    </h2>
                    <p className="text-sm text-slate-200 mt-2">
                      {balance.pasivos.length} cuentas con movimiento
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200">
                    <div className="p-4">
                      <div className="space-y-0">
                        {balance.pasivos.map((item) => (
                          <CuentaRow key={item.cuenta.id} cuenta={item} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* PATRIMONIO NETO */}
                <div className="space-y-6">
                  <div className="bg-slate-800 text-white p-6">
                    <h2 className="text-2xl font-bold flex items-center gap-4">
                      <Building2 className="w-7 h-7" />
                      PATRIMONIO NETO
                      <span className="text-lg bg-slate-200 text-slate-800 px-4 py-2 rounded">
                        {formatearMoneda(balance.totalPatrimonio)}
                      </span>
                    </h2>
                    <p className="text-sm text-slate-200 mt-2">
                      {balance.patrimonio.length} cuentas con movimiento
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200">
                    <div className="p-4">
                      <div className="space-y-0">
                        {balance.patrimonio.map((item) => (
                          <CuentaRow key={item.cuenta.id} cuenta={item} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Verificación de Ecuación Contable */}
            <div className="mt-8 p-8 border-2 border-slate-200" style={{
              backgroundColor: ecuacionBalanceada ? '#f8fafc' : '#fef2f2'
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-4 h-4 rounded-full ${ecuacionBalanceada ? 'bg-emerald-600' : 'bg-slate-800'}`}></div>
                  <span className="text-lg font-bold text-slate-800">
                    Ecuación Contable
                  </span>
                  <span className="text-sm text-slate-800">
                    ACTIVOS = PASIVOS + PATRIMONIO
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-800">
                    {formatearMoneda(balance.totalActivos)} = {formatearMoneda(balance.totalPasivos)} + {formatearMoneda(balance.totalPatrimonio)}
                  </div>
                  {!ecuacionBalanceada && (
                    <div className="text-sm text-slate-800 font-medium">
                      Diferencia: {formatearMoneda(Math.abs(diferencia))}
                    </div>
                  )}
                  <div className={`text-xs ${ecuacionBalanceada ? 'text-slate-800' : 'text-slate-800'} mt-1`}>
                    {ecuacionBalanceada ? 'Balance Equilibrado' : 'Balance Desequilibrado'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default EstadoSituacionPatrimonialSection;
