import React, { useState, useEffect } from 'react';
import { Calendar, BarChart3, RefreshCw, Filter, Building2, TrendingUp, TrendingDown, ChevronDown, ChevronRight, Download, AlertCircle } from 'lucide-react';
import { obtenerFechaLocal, formatearFechaReporte } from '../../../shared/utils/formatters';
import { useEstadoSituacionPatrimonial } from '../hooks/useEstadoSituacionPatrimonial';
import { generarYAbrirEstadoSituacionPatrimonial } from './pdf/EstadoSituacionPatrimonialPDF';

// Función para formatear montos con 2 decimales
const formatearMonto = (valor, moneda = 'USD') => {
  const numero = parseFloat(valor || 0);
  const formatter = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const simbolo = moneda === 'USD' ? 'U$' : '$';
  return `${simbolo}${formatter.format(numero)}`;
};

const formatearMoneda = (monto) => formatearMonto(monto, 'USD');

// Componente para cuentas individuales (patrimonio)
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

// Componente para grupos de nivel 3 (activos y pasivos)
const GrupoNivel3Row = ({ grupo }) => {
  const [expandido, setExpandido] = useState(false);
  
  return (
    <div className="border border-slate-200 rounded mb-2">
      {/* Header del grupo - clickeable */}
      <button
        onClick={() => setExpandido(!expandido)}
        className="w-full flex justify-between items-center py-3 px-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center">
          <div className="mr-3">
            {expandido ? (
              <ChevronDown className="w-4 h-4 text-slate-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-600" />
            )}
          </div>
          <div className="mr-4">
            <code className="text-sm text-slate-700 font-mono bg-slate-200 px-2 py-1 rounded font-bold">
              {grupo.codigoNivel3}
            </code>
          </div>
          <div>
            <span className="font-semibold text-slate-800 text-base">
              {grupo.nombre}
            </span>
            <div className="text-xs text-slate-500 mt-1">
              {grupo.cuentas.length} cuenta{grupo.cuentas.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <div className="text-lg font-bold text-slate-900">
          {formatearMoneda(grupo.saldoTotal)}
        </div>
      </button>
      
      {/* Detalle expandible de cuentas */}
      {expandido && (
        <div className="border-t border-slate-200">
          {grupo.cuentas.map((cuenta) => (
            <div 
              key={cuenta.cuenta.id}
              className="flex justify-between items-center py-2 px-6 border-b border-slate-100 last:border-b-0 bg-white hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center">
                <div className="mr-3 pl-6"> {/* Indent para mostrar jerarquía */}
                  <code className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded">
                    {cuenta.cuenta.codigo}
                  </code>
                </div>
                <span className="font-medium text-slate-700 text-sm">
                  {cuenta.cuenta.nombre}
                </span>
              </div>
              <div className="text-base font-semibold text-slate-800">
                {formatearMoneda(cuenta.saldo)}
              </div>
            </div>
          ))}
        </div>
      )}
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

  const [fechaCorte, setFechaCorte] = useState(obtenerFechaLocal());

  useEffect(() => {
    console.log('🚀 Cargando Balance General con fecha:', fechaCorte);
    fetchBalance(fechaCorte);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaCorte]);

  const aplicarFecha = () => {
    console.log('🔄 Recargando balance con fecha:', fechaCorte);
    fetchBalance(fechaCorte);
  };

  const refrescarConFechaActual = () => {
    const fechaActual = obtenerFechaLocal();
    console.log('🔄 Refrescando balance con fecha actual:', fechaActual);
    setFechaCorte(fechaActual);
    fetchBalance(fechaActual);
  };

  const handleGenerarPDF = async () => {
    try {
      // Preparar datos para el PDF - solo categorías nivel 3 para activos/pasivos
      const datosPDF = {
        ...balance,
        // Mantener patrimonio individual como está
        patrimonio: balance.patrimonio,
        // Para activos y pasivos ya están como grupos nivel 3
        activos: balance.activos,
        pasivos: balance.pasivos,
        // Mantener totales
        totalActivos: balance.totalActivos,
        totalPasivos: balance.totalPasivos,
        totalPatrimonio: balance.totalPatrimonio,
        fechaCorte: balance.fechaCorte
      };

      const resultado = await generarYAbrirEstadoSituacionPatrimonial(datosPDF, fechaCorte);
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
                <p className="text-slate-300 mt-1">Balance general al {formatearFechaReporte(fechaCorte)}</p>
              </div>
            </div>
            {!loading && !error && balance.activos && (
              <button
                onClick={handleGenerarPDF}
                className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded hover:bg-emerald-700 transition-colors"
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
        <div className="flex items-center justify-between">
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
              className="bg-emerald-600 text-white px-6 py-3 rounded hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 font-medium transition-colors"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Filter className="w-4 h-4" />
              )}
              {loading ? 'Calculando...' : 'Aplicar'}
            </button>
          </div>

          {/* Botón de Refresh */}
          <button
            onClick={refrescarConFechaActual}
            disabled={loading}
            className="px-3 py-2 bg-slate-700 text-white rounded hover:bg-black disabled:opacity-50 flex items-center gap-2 text-sm transition-colors"
            title="Recargar con fecha actual"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar Hoy
          </button>
        </div>

        {/* Info de última actualización */}
        {balance.fechaCorte && (
          <div className="mt-3 text-xs text-slate-600">
            Datos al: <span className="font-semibold">{formatearFechaReporte(balance.fechaCorte)}</span>
          </div>
        )}
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
              <h3 className="font-bold text-white mb-6 text-2xl text-center mx-auto">ECUACIÓN PATRIMONIAL</h3>

              {/* Ecuación */}
              <div className="bg-white p-6 rounded mb-6">
                <div className="flex items-center justify-center gap-4 text-lg font-semibold text-slate-800">
                  <span>{formatearMoneda(balance.totalActivos)}</span>
                  <span>=</span>
                  <span>{formatearMoneda(balance.totalPasivos)}</span>
                  <span>+</span>
                  <span>{formatearMoneda(balance.totalPatrimonio)}</span>
                  <span>=</span>
                  <span className="text-2xl">{formatearMoneda(balance.totalPasivos + balance.totalPatrimonio)}</span>
                </div>
                <div className="text-center mt-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${ecuacionBalanceada ? 'bg-emerald-600' : 'bg-red-600'}`}></div>
                    <span className={`font-bold ${ecuacionBalanceada ? 'text-emerald-600' : 'text-red-600'}`}>
                      {ecuacionBalanceada ? 'Balance Equilibrado' : 'Balance Desequilibrado'}
                    </span>
                  </div>
                  {!ecuacionBalanceada && (
                    <div className="text-sm text-red-600 font-medium mt-1">
                      Diferencia: {formatearMoneda(Math.abs(diferencia))}
                    </div>
                  )}
                </div>
              </div>

              {/* Totales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center p-6 bg-slate-200 rounded">
                  <div className="text-3xl font-bold text-slate-800">{formatearMoneda(balance.totalActivos)}</div>
                  <div className="text-sm text-slate-800">Total Activos</div>
                  <div className="text-xs text-slate-800">
                    {balance.activos.length} grupo{balance.activos.length !== 1 ? 's' : ''} • {balance.activosDetalle?.length || 0} cuentas
                  </div>
                </div>
                <div className="text-center p-6 bg-slate-200 rounded">
                  <div className="text-3xl font-bold text-slate-800">{formatearMoneda(balance.totalPasivos)}</div>
                  <div className="text-sm text-slate-800">Total Pasivos</div>
                  <div className="text-xs text-slate-800">
                    {balance.pasivos.length} grupo{balance.pasivos.length !== 1 ? 's' : ''} • {balance.pasivosDetalle?.length || 0} cuentas
                  </div>
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
                    {balance.activos.length} grupo{balance.activos.length !== 1 ? 's' : ''} con movimiento
                  </p>
                </div>

                <div className="bg-white border border-slate-200">
                  <div className="p-4">
                    <div className="space-y-2">
                      {balance.activos.map((grupo) => (
                        <GrupoNivel3Row key={grupo.codigoNivel3} grupo={grupo} />
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
                      {balance.pasivos.length} grupo{balance.pasivos.length !== 1 ? 's' : ''} con movimiento
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200">
                    <div className="p-4">
                      <div className="space-y-2">
                        {balance.pasivos.map((grupo) => (
                          <GrupoNivel3Row key={grupo.codigoNivel3} grupo={grupo} />
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
          </div>
        )}
    </div>
  );
};

export default EstadoSituacionPatrimonialSection;
