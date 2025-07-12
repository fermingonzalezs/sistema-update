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
    <div className="p-0">
      {/* Header principal removido, solo se deja el header de la página si corresponde */}

      {/* Filtros */}
      <div className="flex bg-slate-800 items-center justify-between p-3 mb-3 border rounded border-slate-500 bg-slate-200">
        {/* Izquierda: selector y botón */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-800" />
            <label className="text-sm text-white font-medium text-slate-800">
              Fecha Desde:
            </label>
            <input
              type="date"
              value={filtros.fechaDesde}
              onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
              className="bg-white px-4 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-800" />
            <label className="text-sm text-white font-medium text-slate-800">
              Fecha Hasta:
            </label>
            <input
              type="date"
              value={filtros.fechaHasta}
              onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
              className="bg-white px-4 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
          <button
            onClick={aplicarFiltros}
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
          <div className="text-md">Período Seleccionado</div>
          <div className="text-md font-semibold">
            {new Date(filtros.fechaDesde).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })} - {new Date(filtros.fechaHasta).toLocaleDateString('es-ES', {
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

      {/* Información adicional */}
      <div className="bg-slate-800 p-8">
        <h3 className="font-bold text-white mb-6 text-2xl text-center mx-auto w-fit">RESULTADO</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-slate-200 rounded">
            <div className="text-3xl font-bold text-slate-800">{formatearMoneda(estadoResultados.totalIngresos)}</div>
            <div className="text-sm text-slate-800">Total Ingresos</div>
            <div className="text-xs text-slate-800">{ingresosArray.length} conceptos</div>
          </div>
          <div className="text-center p-6 bg-slate-200 rounded">
            <div className="text-3xl font-bold text-slate-800">{formatearMoneda(estadoResultados.totalGastos)}</div>
            <div className="text-sm text-slate-800">Total Gastos</div>
            <div className="text-xs text-slate-800">{gastosArray.length} conceptos</div>
          </div>
          <div className="text-center p-6 bg-slate-200 rounded">
            <div className="text-3xl font-bold text-slate-800">{formatearMoneda(estadoResultados.utilidadNeta)}</div>
            <div className="text-sm text-slate-800">{estadoResultados.utilidadNeta >= 0 ? 'Utilidad' : 'Pérdida'} Neta</div>
            <div className="text-xs text-slate-800">{estadoResultados.utilidadNeta >= 0 ? 'Positivo' : 'Negativo'}</div>
          </div>
        </div>
        
      </div>      
      
       {/* Estado de Resultados */}
      <div className="mt-3">
        <div className="space-y-6">
          {/* INGRESOS */}
          <div className="space-y-6">
            <div className="bg-slate-800 text-white p-6">
              <h2 className="text-2xl font-bold flex items-center gap-4">
                <TrendingUp className="w-7 h-7" />
                INGRESOS
                <span className="text-lg bg-slate-200 text-slate-800 px-4 py-2 rounded">
                  {formatearMoneda(estadoResultados.totalIngresos)}
                </span>
              </h2>
              <p className="text-sm text-slate-200 mt-2">
                {ingresosArray.length} conceptos de ingresos
              </p>
            </div>
            
            <div className="bg-white border border-slate-200">
              
              <div className="p-4">
                <div className="space-y-3">
                  {ingresosArray.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 px-4 border-b border-slate-200 hover:bg-slate-200 transition-colors">
                     <div className="flex-1 space-y-1.5">
                        <div className="font-medium text-slate-800">{item.cuenta.nombre}</div>
                        <div className="text-sm text-slate-800">
                          Código: <span className="font-mono text-slate-800">{item.cuenta.codigo}</span>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-slate-800">
                        {formatearMoneda(item.monto)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* GASTOS */}
          <div className="space-y-6">
            <div className="bg-slate-800 text-white p-6">
              <h2 className="text-2xl font-bold flex items-center gap-4">
                <TrendingDown className="w-7 h-7" />
                GASTOS
                <span className="text-lg bg-slate-200 text-slate-800 px-4 py-2 rounded">
                  {formatearMoneda(estadoResultados.totalGastos)}
                </span>
              </h2>
              <p className="text-sm text-slate-200 mt-2">
                {gastosArray.length} conceptos de egresos
              </p>
            </div>
            
            <div className="bg-white border border-slate-200">
              
              <div className="p-4">
                <div className="space-y-3">
                  {gastosArray.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-3 px-4 border-b border-slate-200 hover:bg-slate-200 transition-colors">
                      <div>
                        <div className="font-medium text-slate-800">{item.cuenta.nombre}</div>
                        <div className="text-sm text-slate-800">
                          Código: <span className="font-mono text-slate-800">{item.cuenta.codigo}</span>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-slate-800">
                        {formatearMoneda(item.monto)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RESULTADO DEL EJERCICIO */}
          <div className="space-y-6">
            <div className="bg-slate-800 text-white p-6">
              <h2 className="text-2xl font-bold flex items-center gap-4">
                <DollarSign className="w-7 h-7" />
                RESULTADO DEL EJERCICIO
                <span className="text-lg bg-slate-200 text-slate-800 px-4 py-2 rounded">
                  {formatearMoneda(estadoResultados.utilidadNeta)}
                </span>
              </h2>
              <p className="text-sm text-slate-200 mt-2">
                {estadoResultados.utilidadNeta >= 0 ? 'Utilidad generada' : 'Pérdida del período'}
              </p>
            </div>
            
            <div className="bg-white border border-slate-200">
              
              <div className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-slate-200">
                    <span className="font-medium text-slate-800">TOTAL INGRESOS</span>
                    <span className="text-lg font-bold text-slate-800">
                      {formatearMoneda(estadoResultados.totalIngresos)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-slate-200">
                    <span className="font-medium text-slate-800">TOTAL EGRESOS</span>
                    <span className="text-lg font-bold text-slate-800">
                      ({formatearMoneda(estadoResultados.totalGastos)})
                    </span>
                  </div>
                  <div className="pt-4 border-t-2 border-slate-200">
                    <div className="flex justify-between items-center text-xl font-bold text-slate-800">
                      <span>{estadoResultados.utilidadNeta >= 0 ? 'UTILIDAD' : 'PÉRDIDA'} NETA</span>
                      <span className="text-slate-800">
                        {formatearMoneda(estadoResultados.utilidadNeta)}
                      </span>
                    </div>
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