import React, { useState, useEffect } from 'react';
import { Calendar, BarChart3, RefreshCw, Filter, Building2, TrendingUp, TrendingDown, ChevronDown, ChevronRight } from 'lucide-react';
import { formatearMonto } from '../../../shared/utils/formatters';
import { useEstadoSituacionPatrimonial } from '../hooks/useEstadoSituacionPatrimonial';

  const formatearMoneda = (monto) => formatearMonto(monto, 'USD');

  const CuentaRow = ({ cuenta, nivel = 0 }) => {
  const [expandido, setExpandido] = useState(true);
  const tieneHijos = cuenta.children && cuenta.children.length > 0;

  return (
    <>
      <div className={`flex justify-between items-center py-2 px-4 border-b border-slate-200 hover:bg-slate-100 transition-colors ${
        nivel === 0 ? 'bg-slate-100' : ''
      }`}>
        <div style={{ paddingLeft: `${nivel * 20}px` }} className="flex items-center">
          {tieneHijos && (
            <button onClick={() => setExpandido(!expandido)} className="mr-2 text-slate-500">
              {expandido ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
          <span className={`font-medium ${nivel === 0 ? 'text-slate-800' : 'text-slate-700'}`}>
            {cuenta.cuenta.nombre}
          </span>
        </div>
        <div className={`text-lg font-semibold ${nivel === 0 ? 'text-slate-900' : 'text-slate-800'}`}>
          {formatearMoneda(cuenta.saldo)}
        </div>
      </div>
      {expandido && tieneHijos && (
        <div>
          {cuenta.children.map(hijo => (
            <CuentaRow key={hijo.cuenta.id} cuenta={hijo} nivel={nivel + 1} />
          ))}
        </div>
      )}
    </>
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
      {/* Filtros con estilo idéntico a Estado de Resultados */}
      <div className="flex bg-slate-800 items-center justify-between p-3 mb-3 border rounded border-slate-500 bg-slate-200">
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
          <div className="text-md font-semibold">
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
  );
};

export default EstadoSituacionPatrimonialSection;
