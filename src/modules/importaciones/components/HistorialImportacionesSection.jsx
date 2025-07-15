// src/components/HistorialImportacionesSection.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Globe,
  Search,
  CheckCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  User,
  Package,
  BarChart3,
  Weight,
  ExternalLink,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Filter,
  Calendar
} from 'lucide-react';
import { useImportaciones } from '../lib/importaciones.js';
import { formatearMonto } from '../../../shared/utils/formatters.js';

const HistorialImportacionesSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredHistorial, setFilteredHistorial] = useState([]);
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('fecha_creacion');
  const [sortOrder, setSortOrder] = useState('desc');
  const [estadisticas, setEstadisticas] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  const {
    importaciones,
    loading,
    error,
    fetchByEstado,
    getEstadisticas
  } = useImportaciones();

  useEffect(() => {
    loadHistorial();
    loadEstadisticas();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, dateFilter, sortBy, sortOrder, importaciones]);

  const loadHistorial = useCallback(async () => {
    await fetchByEstado('finalizada');
  }, [fetchByEstado]);

  const loadEstadisticas = useCallback(async () => {
    const stats = await getEstadisticas();
    setEstadisticas(stats);
  }, [getEstadisticas]);

  const applyFilters = useCallback(() => {
    let filtered = [...importaciones];

    // Filtro por texto
    if (searchTerm.length >= 2) {
      filtered = filtered.filter(item =>
        item.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.proveedor_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.numero_seguimiento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.clientes?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.clientes?.apellido?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por fecha
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'last30':
          filterDate.setDate(now.getDate() - 30);
          break;
        case 'last90':
          filterDate.setDate(now.getDate() - 90);
          break;
        case 'last6months':
          filterDate.setMonth(now.getMonth() - 6);
          break;
        case 'lastyear':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(item => new Date(item.fecha_creacion) >= filterDate);
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'fecha_creacion':
          aValue = new Date(a.fecha_creacion);
          bValue = new Date(b.fecha_creacion);
          break;
        case 'total_cotizado':
          aValue = a.total_cotizado || 0;
          bValue = b.total_cotizado || 0;
          break;
        case 'diferencia':
          aValue = a.diferencia_estimado_real || 0;
          bValue = b.diferencia_estimado_real || 0;
          break;
        case 'cliente':
          aValue = `${a.clientes?.nombre} ${a.clientes?.apellido}`.toLowerCase();
          bValue = `${b.clientes?.nombre} ${b.clientes?.apellido}`.toLowerCase();
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredHistorial(filtered);
  }, [importaciones, searchTerm, dateFilter, sortBy, sortOrder]);

  const formatCurrency = useCallback((amount) => formatearMonto(amount, 'USD'), []);

  const formatFecha = useCallback((fecha) => {
    if (!fecha) return 'No especificado';
    return new Date(fecha).toLocaleDateString('es-AR');
  }, []);

  const getDiferenciaPorcentaje = useCallback((estimado, real) => {
    if (!estimado || estimado === 0) return 0;
    return ((real - estimado) / estimado * 100);
  }, []);

  const getDiferenciaColor = useCallback((diferencia) => {
    if (diferencia > 0) return 'text-slate-600';
    if (diferencia < 0) return 'text-emerald-600';
    return 'text-slate-600';
  }, []);

  const getAccuracyColor = useCallback((porcentaje) => {
    const abs = Math.abs(porcentaje);
    if (abs <= 5) return 'text-emerald-600 bg-emerald-50';
    if (abs <= 15) return 'text-slate-600 bg-slate-100';
    return 'text-slate-600 bg-slate-200';
  }, []);

  const stats = useMemo(() => {
    if (filteredHistorial.length === 0) return null;

    const totalImportaciones = filteredHistorial.length;
    const montoTotalReal = filteredHistorial.reduce((sum, item) => sum + (item.costos_finales || 0), 0);
    const montoTotalEstimado = filteredHistorial.reduce((sum, item) => sum + (item.total_cotizado || 0), 0);
    const diferenciaTotalPorcentaje = getDiferenciaPorcentaje(montoTotalEstimado, montoTotalReal);
    
    const importacionesConDiferencia = filteredHistorial.filter(item => item.diferencia_estimado_real !== null);
    const promedioAccuracy = importacionesConDiferencia.length > 0 
      ? importacionesConDiferencia.reduce((sum, item) => {
          const porcentaje = Math.abs(getDiferenciaPorcentaje(item.total_cotizado, item.costos_finales));
          return sum + porcentaje;
        }, 0) / importacionesConDiferencia.length
      : 0;

    return {
      totalImportaciones,
      montoTotalReal,
      montoTotalEstimado,
      diferenciaTotalPorcentaje,
      promedioAccuracy
    };
  }, [filteredHistorial, getDiferenciaPorcentaje]);

  return (
    <div className="">
      {/* Header Estandarizado */}
      <div className="bg-white rounded border border-slate-200 mb-4">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Globe className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-semibold">Historial de Importaciones</h2>
                <p className="text-slate-300 mt-1">Importaciones finalizadas y estadísticas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded border border-slate-200 mb-6">
        <div className="bg-slate-50 p-4 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600"
            >
              <option value="all">Todas las fechas</option>
              <option value="last30">Últimos 30 días</option>
              <option value="last90">Últimos 90 días</option>
              <option value="last6months">Últimos 6 meses</option>
              <option value="lastyear">Último año</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600"
            >
              <option value="fecha_creacion">Fecha</option>
              <option value="total_cotizado">Monto</option>
              <option value="diferencia">Diferencia</option>
              <option value="cliente">Cliente</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600"
            >
              <option value="desc">Descendente</option>
              <option value="asc">Ascendente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de importaciones históricas */}
      <div className="bg-white rounded border border-slate-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Descripción</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Cliente</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Proveedor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Monto Estimado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Monto Real</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Diferencia</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Precisión</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Fecha</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                  Cargando historial...
                </td>
              </tr>
            ) : filteredHistorial.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  <Globe className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  No se encontraron importaciones finalizadas
                  <div className="text-sm text-slate-400">
                    {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Las importaciones aparecerán aquí cuando se finalicen'}
                  </div>
                </td>
              </tr>
            ) : (
              filteredHistorial.map((item) => {
                const diferenciaPorcentaje = getDiferenciaPorcentaje(item.total_cotizado, item.costos_finales);
                const accuracyClass = getAccuracyColor(Math.abs(diferenciaPorcentaje));
                const isExpanded = expandedRow === item.id;
                return (
                  <React.Fragment key={item.id}>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-2 py-2 text-center align-middle">
                        <button
                          onClick={() => setExpandedRow(isExpanded ? null : item.id)}
                          className="focus:outline-none"
                          title={isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
                        >
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-emerald-600" /> : <ChevronDown className="w-5 h-5 text-emerald-600" />}
                        </button>
                      </td>
                      <td className="px-4 py-2 font-semibold text-slate-900">{item.descripcion}</td>
                      <td className="px-4 py-2 text-slate-800">{item.clientes?.nombre} {item.clientes?.apellido}</td>
                      <td className="px-4 py-2 text-slate-800">{item.proveedor_nombre || '-'}</td>
                      <td className="px-4 py-2 text-slate-800">{formatCurrency(item.total_cotizado)}</td>
                      <td className="px-4 py-2 text-slate-800">{formatCurrency(item.costos_finales)}</td>
                      <td className={`px-4 py-2 font-bold ${getDiferenciaColor(item.diferencia_estimado_real)}`}>{item.diferencia_estimado_real > 0 ? '+' : ''}{formatCurrency(item.diferencia_estimado_real)}</td>
                      <td className={`px-4 py-2 text-xs font-medium rounded ${accuracyClass}`}>{Math.abs(diferenciaPorcentaje) <= 5 ? '🎯 Preciso' : Math.abs(diferenciaPorcentaje) <= 15 ? '📊 Aceptable' : '⚠️ Desviado'} (±{Math.abs(diferenciaPorcentaje).toFixed(1)}%)</td>
                      <td className="px-4 py-2 text-slate-800">{formatFecha(item.fecha_creacion)}</td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50">
                        <td colSpan={9} className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <h5 className="font-medium text-slate-800 mb-2">💰 Comparación de Costos</h5>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-slate-600">Estimado:</span>
                                  <span className="font-medium text-slate-800">{formatCurrency(item.total_cotizado)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-600">Real:</span>
                                  <span className="font-medium text-slate-800">{formatCurrency(item.costos_finales)}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-200 pt-1">
                                  <span className="text-slate-600">Diferencia:</span>
                                  <span className={`font-bold ${getDiferenciaColor(item.diferencia_estimado_real)}`}>
                                    {item.diferencia_estimado_real > 0 ? '+' : ''}{formatCurrency(item.diferencia_estimado_real)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h5 className="font-medium text-slate-800 mb-2">⚖️ Comparación de Peso</h5>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-slate-600">Estimado:</span>
                                  <span className="font-medium text-slate-800">{item.peso_estimado_kg} kg</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-600">Real:</span>
                                  <span className="font-medium text-slate-800">{item.peso_real_kg || 'N/A'} kg</span>
                                </div>
                                {item.peso_real_kg && (
                                  <div className="flex justify-between border-t border-slate-200 pt-1">
                                    <span className="text-slate-600">Diferencia:</span>
                                    <span className={`font-bold ${(item.peso_real_kg - item.peso_estimado_kg) > 0 ? 'text-slate-600' : 'text-emerald-600'}`}>
                                      {(item.peso_real_kg - item.peso_estimado_kg) > 0 ? '+' : ''}{(item.peso_real_kg - item.peso_estimado_kg).toFixed(2)} kg
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <h5 className="font-medium text-slate-800 mb-2">📅 Cronología</h5>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-slate-600">Creado:</span>
                                  <span className="font-medium text-slate-800">{formatFecha(item.fecha_creacion)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-600">Aprobado:</span>
                                  <span className="font-medium text-slate-800">{formatFecha(item.fecha_aprobacion)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-600">Finalizado:</span>
                                  <span className="font-medium text-slate-800">{formatFecha(item.fecha_actualizacion)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2 text-sm">
                                <DollarSign className="w-4 h-4 text-emerald-600" />
                                <span className="text-slate-600">Precio compra:</span>
                                <span className="font-medium text-slate-800">{formatCurrency(item.precio_compra_usd)}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm">
                                <Weight className="w-4 h-4 text-slate-600" />
                                <span className="text-slate-600">Precio/kg:</span>
                                <span className="font-medium text-slate-800">{formatCurrency(item.precio_por_kg)}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2 text-sm">
                                <TrendingUp className="w-4 h-4 text-slate-600" />
                                <span className="text-slate-600">Impuestos USA:</span>
                                <span className="font-medium text-slate-800">{item.impuestos_usa_porcentaje}%</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm">
                                <Package className="w-4 h-4 text-slate-600" />
                                <span className="text-slate-600">Envíos:</span>
                                <span className="font-medium text-slate-800">
                                  {formatCurrency((item.envio_usa_fijo || 0) + (item.envio_arg_fijo || 0))}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {item.link_producto && (
                                <a
                                  href={item.link_producto}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-1 text-emerald-600 hover:text-emerald-700 text-sm transition-colors"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  <span>Ver producto original</span>
                                </a>
                              )}
                            </div>
                          </div>
                          {/* Alertas de análisis */}
                          {Math.abs(diferenciaPorcentaje) > 15 && (
                            <div className="mt-4 bg-slate-50 border border-slate-200 rounded p-3">
                              <div className="flex items-start space-x-2">
                                <AlertTriangle className="w-5 h-5 text-slate-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-slate-800">
                                    Gran desviación detectada
                                  </p>
                                  <p className="text-xs text-slate-600">
                                    {diferenciaPorcentaje > 0 
                                      ? `Los costos reales fueron ${Math.abs(diferenciaPorcentaje).toFixed(1)}% más altos que lo estimado. Considere ajustar los parámetros de cotización.`
                                      : `Los costos reales fueron ${Math.abs(diferenciaPorcentaje).toFixed(1)}% más bajos que lo estimado. Excelente optimización de costos.`
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          {Math.abs(diferenciaPorcentaje) <= 5 && (
                            <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded p-3">
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                                <p className="text-sm font-medium text-emerald-800">
                                  🎯 Cotización muy precisa - Desviación menor al 5%
                                </p>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistorialImportacionesSection;