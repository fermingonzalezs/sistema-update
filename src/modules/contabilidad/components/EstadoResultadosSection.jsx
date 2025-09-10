import React, { useState, useEffect } from 'react';
import { Calendar, FileText, TrendingUp, TrendingDown, DollarSign, RefreshCw, Filter, ChevronDown, ChevronRight, Download, AlertCircle } from 'lucide-react';
import { formatearMonto } from '../../../shared/utils/formatters';
import { useEstadoResultados } from '../hooks/useEstadoResultados';
import { generarEstadoResultadosPDF } from './pdf/EstadoResultadosPDF';

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
  const costosArray = estadoResultados.costos || [];
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
            <label className="text-sm font-medium text-slate-800">Fecha Desde:</label>
            <input
              type="date"
              value={filtros.fechaDesde}
              onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-800" />
            <label className="text-sm font-medium text-slate-800">Fecha Hasta:</label>
            <input
              type="date"
              value={filtros.fechaHasta}
              onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={aplicarFiltros}
            disabled={loading}
            className="bg-emerald-600 text-white py-2 px-4 rounded hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
            {loading ? 'Calculando...' : 'Aplicar'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-6 rounded mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800 font-medium">Error: {error}</span>
          </div>
        </div>
      )}

      {/* Cuerpo del Estado de Resultados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna Izquierda: Ingresos */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg">
            <div className="p-4 bg-slate-800 text-white border-b border-slate-200">
            <h3 className="font-semibold flex items-center"><TrendingUp className="w-5 h-5 mr-2" /> Ingresos</h3>
          </div>
            <div className="p-4">
              {ingresosArray.length > 0 ? 
                ingresosArray.map(item => <CuentaRow key={item.cuenta.id} cuenta={item} />) : 
                <p className="text-slate-500 text-center py-2">No se registraron ingresos.</p>}
            </div>
            <div className="p-4 bg-slate-100 border-t border-slate-200 font-bold flex justify-between">
              <span>Total Ingresos</span>
              <span>{formatearMoneda(estadoResultados.totalIngresos)}</span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Egresos (Costos y Gastos) */}
        <div className="space-y-4">
          {/* Costos */}
          <div className="bg-white border border-slate-200 rounded-lg">
            <div className="p-4 bg-slate-800 text-white border-b border-slate-200">
              <h3 className="font-semibold flex items-center"><TrendingDown className="w-5 h-5 mr-2" /> Costos</h3>
            </div>
            <div className="p-4">
              {costosArray.length > 0 ? 
                costosArray.map(item => <CuentaRow key={item.cuenta.id} cuenta={item} />) : 
                <p className="text-slate-500 text-center py-2">No se registraron costos.</p>}
            </div>
            <div className="p-4 bg-slate-100 border-t border-slate-200 font-bold flex justify-between">
              <span>Total Costos</span>
              <span>{formatearMoneda(estadoResultados.totalCostos)}</span>
            </div>
          </div>

          {/* Gastos */}
          <div className="bg-white border border-slate-200 rounded-lg">
            <div className="p-4 bg-slate-800 text-white border-b border-slate-200">
              <h3 className="font-semibold flex items-center"><TrendingDown className="w-5 h-5 mr-2" /> Gastos</h3>
            </div>
            <div className="p-4">
              {gastosArray.length > 0 ? 
                gastosArray.map(item => <CuentaRow key={item.cuenta.id} cuenta={item} />) : 
                <p className="text-slate-500 text-center py-2">No se registraron gastos.</p>}
            </div>
            <div className="p-4 bg-slate-100 border-t border-slate-200 font-bold flex justify-between">
              <span>Total Gastos</span>
              <span>{formatearMoneda(estadoResultados.totalGastos)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen Final */}
      <div className="mt-6 bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4 text-center">Resumen del Período</h3>
        <div className="space-y-3 max-w-md mx-auto">
          <div className="flex justify-between text-lg">
            <span className="font-medium">Total Ingresos</span>
            <span className="font-semibold text-emerald-600">{formatearMoneda(estadoResultados.totalIngresos)}</span>
          </div>
          <div className="flex justify-between text-lg">
            <span className="font-medium">Total Egresos (Costos + Gastos)</span>
            <span className="font-semibold text-red-600">({formatearMoneda(estadoResultados.totalCostos + estadoResultados.totalGastos)})</span>
          </div>
          <hr className="my-2 border-slate-300"/>
          <div className="flex justify-between text-xl font-bold">
            <span>{estadoResultados.utilidadNeta >= 0 ? 'Utilidad Neta' : 'Pérdida Neta'}</span>
            <span className={estadoResultados.utilidadNeta >= 0 ? 'text-emerald-600' : 'text-red-600'}>
              {formatearMoneda(estadoResultados.utilidadNeta)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstadoResultadosSection;