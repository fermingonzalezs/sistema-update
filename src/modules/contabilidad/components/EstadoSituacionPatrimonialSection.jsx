import React, { useState, useEffect } from 'react';
import { Calendar, BarChart3, RefreshCw, Filter, Building2, TrendingUp, TrendingDown } from 'lucide-react';
import { formatearMonedaLibroDiario } from '../../../shared/utils/formatters';
import { useEstadoSituacionPatrimonial } from '../hooks/useEstadoSituacionPatrimonial';

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

  const formatearMoneda = (monto) => formatearMonedaLibroDiario(monto);

  // Verificar ecuación contable: Activos = Pasivos + Patrimonio
  const diferencia = balance.totalActivos - (balance.totalPasivos + balance.totalPatrimonio);
  const ecuacionBalanceada = Math.abs(diferencia) < 0.01;

  // Función para renderizar una sección del balance
  const renderizarSeccion = (titulo, cuentas, total, icono) => {
    return (
      <div className="space-y-4">
        {/* Título de la sección */}
        <div className="bg-black text-white p-4 shadow-lg">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            {icono}
            {titulo}
            <span className="text-lg bg-gray-800 px-3 py-1 rounded">
              {formatearMoneda(total)}
            </span>
          </h2>
          <p className="text-sm text-gray-300 mt-1">
            {cuentas.length} cuentas con movimiento
          </p>
        </div>

        {/* Cuentas de la sección */}
        <div className="bg-white border border-gray-300 shadow-sm">
          <div className="p-3">
            <div className="space-y-2">
              {cuentas
                .sort((a, b) => a.cuenta.nombre.localeCompare(b.cuenta.nombre)) // Ordenar alfabéticamente
                .map((item, itemIndex) => (
                <div key={itemIndex} className="flex justify-between items-center py-2 px-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="font-medium text-black">{item.cuenta.nombre}</div>
                    <div className="text-sm text-gray-600 flex gap-6">
                      <span>Código: <span className="font-mono text-black">{item.cuenta.codigo}</span></span>
                      <span>Debe: {formatearMoneda(item.debe)}</span>
                      <span>Haber: {formatearMoneda(item.haber)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-black">
                      {formatearMoneda(Math.abs(item.saldo))}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.saldo >= 0 ? 'Saldo Deudor' : 'Saldo Acreedor'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-black text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 className="w-8 h-8" />
                Estado de Situación Patrimonial
              </h2>
              <p className="text-gray-300 mt-2">Balance General - Situación financiera de la empresa</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-300">Fecha de Corte</div>
              <div className="text-xl font-semibold">
                {new Date(fechaCorte).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="p-6 border-b bg-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-800" />
              <label className="text-sm font-medium text-gray-800">
                Fecha de Corte:
              </label>
              <input
                type="date"
                value={fechaCorte}
                onChange={(e) => setFechaCorte(e.target.value)}
                className="px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-600"
              />
            </div>
            <button
              onClick={aplicarFecha}
              disabled={loading}
              className="bg-gray-800 text-white py-2 px-4 rounded-md hover:bg-black disabled:opacity-50 flex items-center gap-2"
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
          <div className="p-4 bg-red-50 border-l-4 border-red-500">
            <p className="text-red-700">Error: {error}</p>
          </div>
        )}

        {/* Balance General */}
        {!loading && (
          <div className="p-6 space-y-8">
            {/* Resumen Ejecutivo */}
            <div className="bg-black p-6 rounded-lg">
              <h3 className="font-bold text-white mb-4 text-lg">📊 Resumen Ejecutivo</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                  <div className="text-3xl font-bold text-white">{formatearMoneda(balance.totalActivos)}</div>
                  <div className="text-sm text-gray-300">Total Activos</div>
                  <div className="text-xs text-gray-400">{balance.activos.length} cuentas</div>
                </div>
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                  <div className="text-3xl font-bold text-white">{formatearMoneda(balance.totalPasivos)}</div>
                  <div className="text-sm text-gray-300">Total Pasivos</div>
                  <div className="text-xs text-gray-400">{balance.pasivos.length} cuentas</div>
                </div>
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                  <div className="text-3xl font-bold text-white">{formatearMoneda(balance.totalActivos - balance.totalPasivos)}</div>
                  <div className="text-sm text-gray-300">Patrimonio Neto</div>
                  <div className="text-xs text-gray-400">(Activos - Pasivos)</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-center">
                  <div className="text-sm text-gray-300">
                    <strong>Fecha de Corte:</strong> {balance.fechaCorte ? new Date(balance.fechaCorte).toLocaleDateString('es-ES') : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* ACTIVOS */}
            {renderizarSeccion(
              "ACTIVOS",
              balance.activos,
              balance.totalActivos,
              <TrendingUp className="w-7 h-7" />
            )}

            {/* PASIVOS */}
            {renderizarSeccion(
              "PASIVOS",
              balance.pasivos,
              balance.totalPasivos,
              <TrendingDown className="w-7 h-7" />
            )}

            {/* PATRIMONIO */}
            {renderizarSeccion(
              "PATRIMONIO NETO",
              balance.patrimonio,
              balance.totalPatrimonio,
              <Building2 className="w-7 h-7" />
            )}

            {/* Verificación de Ecuación Contable */}
            <div className="mt-8 p-6 border-2 border-gray-400" style={{
              backgroundColor: ecuacionBalanceada ? '#f9fafb' : '#fef2f2'
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${ecuacionBalanceada ? 'bg-gray-800' : 'bg-black'}`}></div>
                  <span className="text-lg font-bold text-black">
                    Ecuación Contable
                  </span>
                  <span className="text-sm text-gray-700">
                    ACTIVOS = PASIVOS + PATRIMONIO
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-black">
                    {formatearMoneda(balance.totalActivos)} = {formatearMoneda(balance.totalPasivos)} + {formatearMoneda(balance.totalPatrimonio)}
                  </div>
                  {!ecuacionBalanceada && (
                    <div className="text-sm text-black font-medium">
                      Diferencia: {formatearMoneda(Math.abs(diferencia))}
                    </div>
                  )}
                  <div className={`text-xs ${ecuacionBalanceada ? 'text-gray-600' : 'text-gray-800'} mt-1`}>
                    {ecuacionBalanceada ? '✅ Balance Equilibrado' : '⚠️ Balance Desequilibrado'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EstadoSituacionPatrimonialSection;
