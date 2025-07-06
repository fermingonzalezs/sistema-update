import React, { useState, useEffect } from 'react';
import { Calendar, FileText, TrendingUp, TrendingDown, DollarSign, RefreshCw, Filter } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { formatearMonedaLibroDiario } from '../../../shared/utils/formatters';

// Servicio para Estado de Resultados
const estadoResultadosService = {
  async getEstadoResultados(fechaDesde, fechaHasta) {
    console.log('📡 Obteniendo estado de resultados...', { fechaDesde, fechaHasta });

    try {
      // Obtener movimientos contables del período
      let query = supabase
        .from('movimientos_contables')
        .select(`
          *,
          plan_cuentas (id, codigo, nombre, tipo),
          asientos_contables (fecha)
        `);

      if (fechaDesde) {
        query = query.gte('asientos_contables.fecha', fechaDesde);
      }
      if (fechaHasta) {
        query = query.lte('asientos_contables.fecha', fechaHasta);
      }

      const { data: movimientos, error } = await query;

      if (error) throw error;

      // Agrupar por tipo de cuenta (Ingresos y Gastos)
      const resultado = {
        ingresos: {},
        gastos: {},
        totalIngresos: 0,
        totalGastos: 0,
        utilidadBruta: 0,
        utilidadNeta: 0
      };

      movimientos.forEach(mov => {
        const cuenta = mov.plan_cuentas;
        if (!cuenta) return;

        const monto = parseFloat(mov.haber || 0) - parseFloat(mov.debe || 0);

        if (cuenta.tipo === 'ingreso') {
          if (!resultado.ingresos[cuenta.id]) {
            resultado.ingresos[cuenta.id] = {
              cuenta: cuenta,
              monto: 0
            };
          }
          resultado.ingresos[cuenta.id].monto += monto;
          resultado.totalIngresos += monto;
        } else if (cuenta.tipo === 'egreso') {
          if (!resultado.gastos[cuenta.id]) {
            resultado.gastos[cuenta.id] = {
              cuenta: cuenta,
              monto: 0
            };
          }
          resultado.gastos[cuenta.id].monto += Math.abs(monto);
          resultado.totalGastos += Math.abs(monto);
        }
      });

      resultado.utilidadBruta = resultado.totalIngresos - resultado.totalGastos;
      resultado.utilidadNeta = resultado.utilidadBruta;

      console.log('✅ Estado de resultados calculado');
      return resultado;

    } catch (error) {
      console.error('❌ Error obteniendo estado de resultados:', error);
      throw error;
    }
  }
};

// Hook personalizado
function useEstadoResultados() {
  const [estadoResultados, setEstadoResultados] = useState({
    ingresos: {},
    gastos: {},
    totalIngresos: 0,
    totalGastos: 0,
    utilidadBruta: 0,
    utilidadNeta: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEstadoResultados = async (fechaDesde, fechaHasta) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await estadoResultadosService.getEstadoResultados(fechaDesde, fechaHasta);
      setEstadoResultados(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    estadoResultados,
    loading,
    error,
    fetchEstadoResultados
  };
}

// Componente principal
const EstadoResultadosSection = () => {
  const {
    estadoResultados,
    loading,
    error,
    fetchEstadoResultados
  } = useEstadoResultados();

  const [filtros, setFiltros] = useState({
    fechaDesde: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Inicio del año
    fechaHasta: new Date().toISOString().split('T')[0] // Hoy
  });

  useEffect(() => {
    console.log('🚀 Iniciando carga de estado de resultados...');
    fetchEstadoResultados(filtros.fechaDesde, filtros.fechaHasta);
  }, []);

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const aplicarFiltros = () => {
    fetchEstadoResultados(filtros.fechaDesde, filtros.fechaHasta);
  };

  const formatearMoneda = (monto) => formatearMonedaLibroDiario(monto);

  const ingresosArray = Object.values(estadoResultados.ingresos || {});
  const gastosArray = Object.values(estadoResultados.gastos || {});

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-black text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                Estado de Resultados
              </h2>
              <p className="text-gray-300 mt-1">Análisis de ingresos, gastos y utilidades del período</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-300">Período Seleccionado</div>
              <div className="text-lg font-semibold">
                {new Date(filtros.fechaDesde).toLocaleDateString('es-ES', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric' 
                })} al {new Date(filtros.fechaHasta).toLocaleDateString('es-ES', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric' 
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
                Fecha Desde:
              </label>
              <input
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
                className="px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-600"
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-800" />
              <label className="text-sm font-medium text-gray-800">
                Fecha Hasta:
              </label>
              <input
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
                className="px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-600"
              />
            </div>
            <button
              onClick={aplicarFiltros}
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

        {/* Estado de Resultados */}
        <div className="p-6">
          <div className="space-y-6">
            {/* INGRESOS */}
            <div className="space-y-4">
              <div className="bg-black text-white p-4 shadow-lg">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <TrendingUp className="w-7 h-7" />
                  INGRESOS
                  <span className="text-lg bg-gray-800 px-3 py-1 rounded">
                    {formatearMoneda(estadoResultados.totalIngresos)}
                  </span>
                </h2>
                <p className="text-sm text-gray-300 mt-1">
                  {ingresosArray.length} conceptos de ingresos
                </p>
              </div>
              
              <div className="bg-white border border-gray-300 shadow-sm">
                <div className="bg-gray-100 p-3 border-b border-gray-300">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                      <span className="w-3 h-3 bg-black rounded-full"></span>
                      Ingresos Operacionales
                    </h3>
                    <div className="text-lg font-bold text-black">
                      {formatearMoneda(estadoResultados.totalIngresos)}
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <div className="space-y-2">
                    {ingresosArray.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 px-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <div>
                          <div className="font-medium text-black">{item.cuenta.nombre}</div>
                          <div className="text-sm text-gray-600">
                            Código: <span className="font-mono text-black">{item.cuenta.codigo}</span>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-black">
                          {formatearMoneda(item.monto)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* GASTOS */}
            <div className="space-y-4">
              <div className="bg-black text-white p-4 shadow-lg">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <TrendingDown className="w-7 h-7" />
                  GASTOS
                  <span className="text-lg bg-gray-800 px-3 py-1 rounded">
                    {formatearMoneda(estadoResultados.totalGastos)}
                  </span>
                </h2>
                <p className="text-sm text-gray-300 mt-1">
                  {gastosArray.length} conceptos de gastos
                </p>
              </div>
              
              <div className="bg-white border border-gray-300 shadow-sm">
                <div className="bg-gray-100 p-3 border-b border-gray-300">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                      <span className="w-3 h-3 bg-black rounded-full"></span>
                      Gastos Operacionales
                    </h3>
                    <div className="text-lg font-bold text-black">
                      {formatearMoneda(estadoResultados.totalGastos)}
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <div className="space-y-2">
                    {gastosArray.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 px-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <div>
                          <div className="font-medium text-black">{item.cuenta.nombre}</div>
                          <div className="text-sm text-gray-600">
                            Código: <span className="font-mono text-black">{item.cuenta.codigo}</span>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-black">
                          {formatearMoneda(item.monto)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RESULTADO DEL EJERCICIO */}
            <div className="space-y-4">
              <div className="bg-black text-white p-4 shadow-lg">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <DollarSign className="w-7 h-7" />
                  RESULTADO DEL EJERCICIO
                  <span className="text-lg bg-gray-800 px-3 py-1 rounded">
                    {formatearMoneda(estadoResultados.utilidadNeta)}
                  </span>
                </h2>
                <p className="text-sm text-gray-300 mt-1">
                  {estadoResultados.utilidadNeta >= 0 ? 'Utilidad generada' : 'Pérdida del período'}
                </p>
              </div>
              
              <div className="bg-white border border-gray-300 shadow-sm">
                <div className="bg-gray-100 p-3 border-b border-gray-300">
                  <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                    <span className="w-3 h-3 bg-black rounded-full"></span>
                    Cálculo del Resultado
                  </h3>
                </div>
                <div className="p-3">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="font-medium text-black">Total Ingresos</span>
                      <span className="text-lg font-bold text-black">
                        {formatearMoneda(estadoResultados.totalIngresos)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="font-medium text-black">Total Gastos</span>
                      <span className="text-lg font-bold text-black">
                        ({formatearMoneda(estadoResultados.totalGastos)})
                      </span>
                    </div>
                    <div className="pt-3 border-t-2 border-gray-400">
                      <div className="flex justify-between items-center text-xl font-bold text-black">
                        <span>{estadoResultados.utilidadNeta >= 0 ? 'UTILIDAD' : 'PÉRDIDA'} NETA</span>
                        <span className="text-black">
                          {formatearMoneda(estadoResultados.utilidadNeta)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-black p-6">
              <h3 className="font-bold text-white mb-4 text-lg">📊 Resumen Ejecutivo</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-800">
                  <div className="text-3xl font-bold text-white">{formatearMoneda(estadoResultados.totalIngresos)}</div>
                  <div className="text-sm text-gray-300">Total Ingresos</div>
                  <div className="text-xs text-gray-400">{ingresosArray.length} conceptos</div>
                </div>
                <div className="text-center p-4 bg-gray-800">
                  <div className="text-3xl font-bold text-white">{formatearMoneda(estadoResultados.totalGastos)}</div>
                  <div className="text-sm text-gray-300">Total Gastos</div>
                  <div className="text-xs text-gray-400">{gastosArray.length} conceptos</div>
                </div>
                <div className="text-center p-4 bg-gray-800">
                  <div className="text-3xl font-bold text-white">{formatearMoneda(estadoResultados.utilidadNeta)}</div>
                  <div className="text-sm text-gray-300">{estadoResultados.utilidadNeta >= 0 ? 'Utilidad' : 'Pérdida'} Neta</div>
                  <div className="text-xs text-gray-400">{estadoResultados.utilidadNeta >= 0 ? '✅ Positivo' : '⚠️ Negativo'}</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-center">
                  <div className="text-sm text-gray-300">
                    <strong>Período:</strong> {new Date(filtros.fechaDesde).toLocaleDateString('es-ES')} al {new Date(filtros.fechaHasta).toLocaleDateString('es-ES')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstadoResultadosSection;