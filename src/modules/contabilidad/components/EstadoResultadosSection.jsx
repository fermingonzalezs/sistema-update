import React, { useState, useEffect } from 'react';
import { Calendar, FileText, TrendingUp, TrendingDown, DollarSign, RefreshCw, Filter, ChevronDown, ChevronRight, Download, AlertCircle } from 'lucide-react';
import { formatearMonto } from '../../../shared/utils/formatters';
import { useEstadoResultados } from '../hooks/useEstadoResultados';
import { generarEstadoResultadosPDF } from '../../../components/EstadoResultadosPDF';

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

  const handleDescargarPDF = async () => {
    try {
      const resultado = await generarEstadoResultadosPDF(estadoResultados, filtros.fechaDesde, filtros.fechaHasta);
      if (!resultado.success) {
        console.error('Error al generar PDF:', resultado.error);
      }
    } catch (error) {
      console.error('Error al generar PDF:', error);
    }
  };

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
          {formatearMoneda(cuenta.monto)}
        </div>
      </div>
    );
  };

  const ingresosArray = estadoResultados.ingresos || [];
  const gastosArray = estadoResultados.gastos || [];

  return (
    <div className="p-0">
      {/* Header */}
      <div className="bg-white rounded border border-slate-200 mb-4">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-semibold">Estado de Resultados</h2>
                <p className="text-slate-300 mt-1">Período: {new Date(filtros.fechaDesde).toLocaleDateString('es-AR')} - {new Date(filtros.fechaHasta).toLocaleDateString('es-AR')}</p>
              </div>
            </div>
            {!loading && !error && estadoResultados.ingresos?.length > 0 && (
              <button
                onClick={handleDescargarPDF}
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
              Fecha Desde:
            </label>
            <input
              type="date"
              value={filtros.fechaDesde}
              onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-800" />
            <label className="text-sm font-medium text-slate-800">
              Fecha Hasta:
            </label>
            <input
              type="date"
              value={filtros.fechaHasta}
              onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <button
            onClick={aplicarFiltros}
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
            <div className="text-sm text-slate-800">Total Egresos</div>
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
                <div className="space-y-0">
                  {ingresosArray.map((item) => (
                    <CuentaRow key={item.cuenta.id} cuenta={item} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* EGRESOS */}
          <div className="space-y-6">
            <div className="bg-slate-800 text-white p-6">
              <h2 className="text-2xl font-bold flex items-center gap-4">
                <TrendingDown className="w-7 h-7" />
                EGRESOS
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
                <div className="space-y-0">
                  {gastosArray.map((item) => (
                    <CuentaRow key={item.cuenta.id} cuenta={item} />
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