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
          <div className="p-6">
            <div className="space-y-4">
              {cuentas
                .sort((a, b) => a.cuenta.nombre.localeCompare(b.cuenta.nombre)) // Ordenar alfabéticamente
                .map((item, itemIndex) => (
                <div key={itemIndex} className="flex justify-between items-center py-3 px-4 border-b border-slate-200 hover:bg-slate-200 transition-colors">
                  <div className="flex-1 space-y-1.5">
                    <div className="font-medium text-slate-800">{item.cuenta.nombre}</div>
                    <div className="text-sm text-slate-800 flex gap-8">
                      <span>Código: <span className="font-mono text-slate-800">{item.cuenta.codigo}</span></span>
                      <span>Debe: {formatearMoneda(item.debe)}</span>
                      <span>Haber: {formatearMoneda(item.haber)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-800">
                      {formatearMoneda(Math.abs(item.saldo))}
                    </div>
                    <div className="text-xs text-slate-800">
                      {item.saldo >= 0 ? 'Resultado negativo' : 'Resultado positivo'}
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
    <div className="p-0">

      <div className="">
        
        <div className="flex items-center justify-between p-3 mb-3 rounded bg-slate-800">
        {/* Izquierda: selector y botón */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-800" />
            <label className="text-sm text-white font-medium text-slate-800">
              Fecha de Corte:
            </label>
            <input
              type="date"
              value={fechaCorte}
              onChange={(e) => setFechaCorte(e.target.value)}
              className="bg-white px-4 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
          <button
            onClick={aplicarFecha}
            disabled={loading}
            className="bg-emerald-600 text-white py-3 px-6 rounded hover:bg-slate-800/90 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Filter className="w-4 h-4" />
            )}
            {loading ? 'Calculando...' : 'Aplicar'}
          </button>
        </div>
        {/* Derecha: texto de fecha */}
        <div className="text-right rounded-lg p-4 text-white">
          <div className="text-md">Fecha de Corte</div>
          <div className="text-xl font-semibold">
            {new Date(fechaCorte).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      </div>
        {/* Error */}
        {error && (
          <div className="p-6 bg-slate-200 border-l-4 border-slate-800">
            <p className="text-slate-800">Error: {error}</p>
          </div>
        )}

        {/* Balance General */}
        {!loading && (
          <div className="space-y-3">
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
                  <div className="text-3xl font-bold text-slate-800">{formatearMoneda(balance.totalActivos - balance.totalPasivos)}</div>
                  <div className="text-sm text-slate-800">Patrimonio Neto</div>
                  <div className="text-xs text-slate-800">(Activos - Pasivos)</div>
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
    </div>
  );
};

export default EstadoSituacionPatrimonialSection;
