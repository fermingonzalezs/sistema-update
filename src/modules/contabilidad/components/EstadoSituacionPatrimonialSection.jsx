import React, { useState, useEffect } from 'react';
import { Calendar, FileText, BarChart3, DollarSign, RefreshCw, Filter, Building2, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { formatearMonedaLibroDiario } from '../../../shared/utils/formatters';

// Servicio para Estado de Situación Patrimonial (Balance General)
const estadoSituacionPatrimonialService = {
  async getBalanceGeneral(fechaCorte = null) {
    console.log('📡 Obteniendo Balance General...', { fechaCorte });

    try {
      const fecha = fechaCorte || new Date().toISOString().split('T')[0];

      // Obtener movimientos contables hasta la fecha de corte
      let query = supabase
        .from('movimientos_contables')
        .select(`
          *,
          plan_cuentas (id, codigo, nombre, tipo, nivel, padre_id, activa, imputable, categoria),
          asientos_contables (fecha)
        `);

      query = query.lte('asientos_contables.fecha', fecha);

      const { data: movimientos, error } = await query;

      if (error) throw error;

      // Agrupar por cuenta y calcular saldos
      const saldosPorCuenta = {};

      movimientos.forEach(mov => {
        const cuenta = mov.plan_cuentas;
        if (!cuenta) return;

        if (!saldosPorCuenta[cuenta.id]) {
          saldosPorCuenta[cuenta.id] = {
            cuenta: cuenta,
            debe: 0,
            haber: 0,
            saldo: 0,
            categoria: cuenta.categoria || 'Sin Categorizar'
          };
        }

        saldosPorCuenta[cuenta.id].debe += parseFloat(mov.debe || 0);
        saldosPorCuenta[cuenta.id].haber += parseFloat(mov.haber || 0);
      });

      // Calcular saldos finales y clasificar por tipo
      const balance = {
        activos: {
          cuentas: {},
          categorias: {},
          total: 0
        },
        pasivos: {
          cuentas: {},
          categorias: {},
          total: 0
        },
        patrimonio: {
          cuentas: {},
          categorias: {},
          total: 0
        },
        fechaCorte: fecha
      };

      Object.values(saldosPorCuenta).forEach(item => {
        const { cuenta } = item;
        
        // Calcular saldo según naturaleza de la cuenta
        let saldo = 0;
        if (cuenta.tipo === 'activo') {
          saldo = item.debe - item.haber; // Naturaleza deudora
        } else if (cuenta.tipo === 'pasivo' || cuenta.tipo === 'patrimonio') {
          saldo = item.haber - item.debe; // Naturaleza acreedora
        }

        item.saldo = saldo;

        // Solo incluir cuentas con saldo diferente de cero
        if (Math.abs(saldo) > 0.01) {
          const categoria = item.categoria;
          
          if (cuenta.tipo === 'activo') {
            balance.activos.cuentas[cuenta.id] = item;
            balance.activos.total += Math.abs(saldo);
            
            // Agrupar por categoría
            if (!balance.activos.categorias[categoria]) {
              balance.activos.categorias[categoria] = { cuentas: {}, total: 0 };
            }
            balance.activos.categorias[categoria].cuentas[cuenta.id] = item;
            balance.activos.categorias[categoria].total += Math.abs(saldo);
            
          } else if (cuenta.tipo === 'pasivo') {
            balance.pasivos.cuentas[cuenta.id] = item;
            balance.pasivos.total += Math.abs(saldo);
            
            // Agrupar por categoría
            if (!balance.pasivos.categorias[categoria]) {
              balance.pasivos.categorias[categoria] = { cuentas: {}, total: 0 };
            }
            balance.pasivos.categorias[categoria].cuentas[cuenta.id] = item;
            balance.pasivos.categorias[categoria].total += Math.abs(saldo);
            
          } else if (cuenta.tipo === 'patrimonio') {
            balance.patrimonio.cuentas[cuenta.id] = item;
            balance.patrimonio.total += Math.abs(saldo);
            
            // Agrupar por categoría
            if (!balance.patrimonio.categorias[categoria]) {
              balance.patrimonio.categorias[categoria] = { cuentas: {}, total: 0 };
            }
            balance.patrimonio.categorias[categoria].cuentas[cuenta.id] = item;
            balance.patrimonio.categorias[categoria].total += Math.abs(saldo);
          }
        }
      });

      console.log('✅ Balance General calculado', {
        activos: balance.activos.total,
        pasivos: balance.pasivos.total,
        patrimonio: balance.patrimonio.total
      });

      return balance;

    } catch (error) {
      console.error('❌ Error obteniendo Balance General:', error);
      throw error;
    }
  }
};

// Hook personalizado
function useEstadoSituacionPatrimonial() {
  const [balance, setBalance] = useState({
    activos: { cuentas: {}, categorias: {}, total: 0 },
    pasivos: { cuentas: {}, categorias: {}, total: 0 },
    patrimonio: { cuentas: {}, categorias: {}, total: 0 },
    fechaCorte: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBalance = async (fechaCorte = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await estadoSituacionPatrimonialService.getBalanceGeneral(fechaCorte);
      setBalance(data);
    } catch (err) {
      console.error('Error en useEstadoSituacionPatrimonial:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    balance,
    loading,
    error,
    fetchBalance
  };
}

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
  }, []);

  const aplicarFecha = () => {
    fetchBalance(fechaCorte);
  };

  const formatearMoneda = (monto) => formatearMonedaLibroDiario(monto);

  // Verificar ecuación contable: Activos = Pasivos + Patrimonio
  const diferencia = balance.activos.total - (balance.pasivos.total + balance.patrimonio.total);
  const ecuacionBalanceada = Math.abs(diferencia) < 0.01;

  // Función para renderizar una sección del balance
  const renderizarSeccion = (titulo, datos, icono) => {
    return (
      <div className="space-y-4">
        {/* Título de la sección */}
        <div className="bg-black text-white p-4 shadow-lg">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            {icono}
            {titulo}
            <span className="text-lg bg-gray-800 px-3 py-1 rounded">
              {formatearMoneda(datos.total)}
            </span>
          </h2>
          <p className="text-sm text-gray-300 mt-1">
            {Object.keys(datos.categorias).length} categorías | {Object.keys(datos.cuentas).length} cuentas
          </p>
        </div>

        {/* Categorías dentro de la sección */}
        <div className="space-y-3">
          {Object.entries(datos.categorias)
            .sort(([,a], [,b]) => b.total - a.total) // Ordenar por monto descendente
            .map(([categoria, datosCategoria], index) => (
            <div key={index} className="bg-white border border-gray-300 shadow-sm">
              {/* Header de categoría */}
              <div className="bg-gray-100 p-3 border-b border-gray-300">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                    <span className="w-3 h-3 bg-black rounded-full"></span>
                    {categoria}
                  </h3>
                  <div className="text-right">
                    <div className="text-lg font-bold text-black">
                      {formatearMoneda(datosCategoria.total)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {((datosCategoria.total / datos.total) * 100).toFixed(1)}% del total
                    </div>
                  </div>
                </div>
              </div>

              {/* Cuentas de la categoría */}
              <div className="p-3">
                <div className="space-y-2">
                  {Object.values(datosCategoria.cuentas)
                    .sort((a, b) => Math.abs(b.saldo) - Math.abs(a.saldo)) // Ordenar por saldo descendente
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
          ))}
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
            {/* ACTIVOS */}
            {renderizarSeccion(
              "ACTIVOS",
              balance.activos,
              <TrendingUp className="w-7 h-7" />
            )}

            {/* PASIVOS */}
            {renderizarSeccion(
              "PASIVOS",
              balance.pasivos,
              <TrendingDown className="w-7 h-7" />
            )}

            {/* PATRIMONIO */}
            {renderizarSeccion(
              "PATRIMONIO NETO",
              balance.patrimonio,
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
                    {formatearMoneda(balance.activos.total)} = {formatearMoneda(balance.pasivos.total)} + {formatearMoneda(balance.patrimonio.total)}
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

            {/* Información adicional */}
            <div className="bg-black p-6">
              <h3 className="font-bold text-white mb-4 text-lg">📊 Resumen Ejecutivo</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-800">
                  <div className="text-3xl font-bold text-white">{formatearMoneda(balance.activos.total)}</div>
                  <div className="text-sm text-gray-300">Total Activos</div>
                  <div className="text-xs text-gray-400">{Object.keys(balance.activos.cuentas).length} cuentas</div>
                </div>
                <div className="text-center p-4 bg-gray-800">
                  <div className="text-3xl font-bold text-white">{formatearMoneda(balance.pasivos.total)}</div>
                  <div className="text-sm text-gray-300">Total Pasivos</div>
                  <div className="text-xs text-gray-400">{Object.keys(balance.pasivos.cuentas).length} cuentas</div>
                </div>
                <div className="text-center p-4 bg-gray-800">
                  <div className="text-3xl font-bold text-white">{formatearMoneda(balance.patrimonio.total)}</div>
                  <div className="text-sm text-gray-300">Patrimonio Neto</div>
                  <div className="text-xs text-gray-400">{Object.keys(balance.patrimonio.cuentas).length} cuentas</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-center">
                  <div className="text-sm text-gray-300">
                    <strong>Fecha de Corte:</strong> {new Date(balance.fechaCorte).toLocaleDateString('es-ES')}
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