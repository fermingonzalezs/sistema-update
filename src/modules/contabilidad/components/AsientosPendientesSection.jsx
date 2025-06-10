import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  Edit3,
  RefreshCw,
  Filter,
  TrendingUp,
  DollarSign,
  Calendar,
  User,
  FileText
} from 'lucide-react';
import { asientoAutomaticoService } from '../../../services/asientoAutomaticoService';
import { cotizacionService } from '../../../services/cotizacionService';
import { formatearMonedaGeneral } from '../../../shared/utils/formatters';

const AsientosPendientesSection = () => {
  const [asientosPendientes, setAsientosPendientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos'); // 'todos', 'borrador', 'registrado', 'anulado'
  const [asientoSeleccionado, setAsientoSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [cotizacionActual, setCotizacionActual] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const [asientos, cotizacion] = await Promise.all([
        asientoAutomaticoService.obtenerAsientosPendientes(),
        cotizacionService.obtenerCotizacionActual()
      ]);
      
      setAsientosPendientes(asientos);
      setCotizacionActual(cotizacion);
    } catch (err) {
      setError(err.message);
      console.error('❌ Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const asientosFiltrados = asientosPendientes.filter(asiento => {
    if (filtroEstado === 'todos') return true;
    return asiento.estado === filtroEstado;
  });

  const estadisticas = {
    total: asientosPendientes.length,
    borrador: asientosPendientes.filter(a => a.estado === 'borrador').length,
    registrado: asientosPendientes.filter(a => a.estado === 'registrado').length,
    anulado: asientosPendientes.filter(a => a.estado === 'anulado').length,
    totalUSD: asientosPendientes.reduce((sum, a) => sum + (parseFloat(a.total_debe) || 0), 0)
  };

  const aprobarAsiento = async (asientoId) => {
    try {
      setLoading(true);
      await asientoAutomaticoService.aprobarAsiento(asientoId, 'Usuario', 'Aprobado desde interfaz');
      await cargarDatos();
      alert('✅ Asiento aprobado exitosamente');
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const rechazarAsiento = async (asientoId, motivo) => {
    if (!motivo || motivo.trim() === '') {
      alert('Debe especificar un motivo para rechazar el asiento');
      return;
    }

    try {
      setLoading(true);
      await asientoAutomaticoService.rechazarAsiento(asientoId, 'Usuario', motivo);
      await cargarDatos();
      alert('❌ Asiento rechazado exitosamente');
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatearMoneda = (valor) => {
    return formatearMonedaGeneral(valor || 0, 'USD');
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  const obtenerIconoTipo = (origen) => {
    switch (origen) {
      case 'venta': return '💰';
      case 'compra': return '🛒';
      case 'gasto': return '💸';
      case 'conciliacion': return '⚖️';
      default: return '📝';
    }
  };

  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'borrador': return 'bg-yellow-100 text-yellow-800';
      case 'registrado': return 'bg-green-100 text-green-800';
      case 'anulado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Modal de detalles del asiento
  const ModalDetalleAsiento = ({ asiento, onClose }) => {
    const [motivoRechazo, setMotivoRechazo] = useState('');
    const [mostrarRechazo, setMostrarRechazo] = useState(false);

    if (!asiento) return null;

    const handleRechazar = () => {
      rechazarAsiento(asiento.id, motivoRechazo);
      setMostrarRechazo(false);
      setMotivoRechazo('');
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {obtenerIconoTipo(asiento.origen_operacion)}
                  Asiento N° {asiento.numero}
                </h3>
                <p className="text-purple-100">{asiento.descripcion}</p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Información del asiento */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Fecha</span>
                </div>
                <p className="text-lg">{formatearFecha(asiento.fecha)}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Total USD</span>
                </div>
                <p className="text-lg font-bold text-green-600">
                  {formatearMoneda(asiento.total_debe)}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="font-medium">Estado</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${obtenerColorEstado(asiento.estado)}`}>
                  {asiento.estado.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            {/* Movimientos contables */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Movimientos Contables
              </h4>
              
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium">Cuenta</th>
                      <th className="text-right py-3 px-4 font-medium">Debe USD</th>
                      <th className="text-right py-3 px-4 font-medium">Haber USD</th>
                      <th className="text-center py-3 px-4 font-medium">Conversión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asiento.movimientos_contables?.map((mov, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <div>
                            <code className="text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded">
                              {mov.plan_cuentas?.codigo}
                            </code>
                            <div className="font-medium text-gray-900 mt-1">
                              {mov.plan_cuentas?.nombre}
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 font-medium">
                          {mov.debe > 0 ? (
                            <span className="text-green-600">{formatearMoneda(mov.debe)}</span>
                          ) : ''}
                        </td>
                        <td className="text-right py-3 px-4 font-medium">
                          {mov.haber > 0 ? (
                            <span className="text-red-600">{formatearMoneda(mov.haber)}</span>
                          ) : ''}
                        </td>
                        <td className="text-center py-3 px-4 text-sm">
                          {mov.cotizacion_manual ? (
                            <div className="text-blue-600">
                              <div>$1 USD = ${mov.cotizacion_manual} ARS</div>
                              <div className="text-xs text-gray-500">{mov.cotizacion_fuente}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Sin conversión</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Información adicional */}
            {(asiento.cotizacion_promedio || asiento.observaciones_aprobacion) && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h5 className="font-medium text-blue-800 mb-2">Información Adicional</h5>
                {asiento.cotizacion_promedio && (
                  <p className="text-sm text-blue-700 mb-1">
                    Cotización promedio del asiento: ${asiento.cotizacion_promedio}
                  </p>
                )}
                {asiento.observaciones_aprobacion && (
                  <p className="text-sm text-blue-700">
                    Observaciones: {asiento.observaciones_aprobacion}
                  </p>
                )}
              </div>
            )}

            {/* Acciones */}
            {asiento.estado === 'borrador' && (
              <div className="flex justify-end space-x-4">
                {!mostrarRechazo ? (
                  <>
                    <button
                      onClick={() => setMostrarRechazo(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Rechazar
                    </button>
                    <button
                      onClick={() => aprobarAsiento(asiento.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Aprobar
                    </button>
                  </>
                ) : (
                  <div className="w-full bg-red-50 p-4 rounded-lg">
                    <h6 className="font-medium text-red-800 mb-2">Motivo del rechazo:</h6>
                    <textarea
                      value={motivoRechazo}
                      onChange={(e) => setMotivoRechazo(e.target.value)}
                      placeholder="Explique por qué rechaza este asiento..."
                      className="w-full px-3 py-2 border border-red-200 rounded mb-3"
                      rows="3"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setMostrarRechazo(false)}
                        className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleRechazar}
                        disabled={!motivoRechazo.trim()}
                        className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
                      >
                        Confirmar Rechazo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Clock size={28} />
              <div>
                <h2 className="text-4xl font-bold">Asientos Contables</h2>
                <p className="text-purple-100 mt-1">Gestión de asientos automáticos - Borradores a registrar</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {cotizacionActual && (
                <div className="text-right bg-purple-800 bg-opacity-50 p-3 rounded-lg">
                  <div className="text-purple-100 text-sm">Cotización actual</div>
                  <div className="font-bold text-lg">
                    ${cotizacionActual.promedio} ARS
                  </div>
                  <div className="text-xs text-purple-200">{cotizacionActual.fuente}</div>
                </div>
              )}
              <button
                onClick={cargarDatos}
                disabled={loading}
                className="bg-white text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="bg-gray-50 p-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-sm text-gray-600">Total Asientos</div>
                  <div className="text-xl font-bold text-purple-600">{estadisticas.total}</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-yellow-600" />
                <div>
                  <div className="text-sm text-gray-600">Borradores</div>
                  <div className="text-xl font-bold text-yellow-600">{estadisticas.borrador}</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-sm text-gray-600">Registrados</div>
                  <div className="text-xl font-bold text-green-600">{estadisticas.registrado}</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-sm text-gray-600">Total USD</div>
                  <div className="text-xl font-bold text-green-600">
                    {formatearMoneda(estadisticas.totalUSD)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="todos">Todos los estados</option>
              <option value="borrador">Solo borradores</option>
              <option value="registrado">Solo registrados</option>
              <option value="anulado">Solo anulados</option>
            </select>
          </div>
        </div>

        {/* Lista de asientos */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Cargando asientos pendientes...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">Error: {error}</p>
              <button
                onClick={cargarDatos}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Reintentar
              </button>
            </div>
          ) : asientosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500">No hay asientos con el filtro seleccionado</p>
              <p className="text-sm text-gray-400">Cambie el filtro para ver otros asientos</p>
            </div>
          ) : (
            <div className="space-y-4">
              {asientosFiltrados.map((asiento) => (
                <div
                  key={asiento.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">
                          {obtenerIconoTipo(asiento.origen_operacion)}
                        </span>
                        <div>
                          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            Asiento N° {asiento.numero}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${obtenerColorEstado(asiento.estado)}`}>
                              {asiento.estado.replace('_', ' ')}
                            </span>
                          </h4>
                          <p className="text-sm text-gray-600">{asiento.descripcion}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{formatearFecha(asiento.fecha)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <span className="font-medium text-green-600">
                            {formatearMoneda(asiento.total_debe)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>{asiento.usuario}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-4 h-4 text-purple-500" />
                          <span>{asiento.origen_operacion}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => {
                          setAsientoSeleccionado(asiento);
                          setMostrarModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {asiento.estado === 'borrador' && (
                        <>
                          <button
                            onClick={() => aprobarAsiento(asiento.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Aprobar"
                            disabled={loading}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de detalles */}
        {mostrarModal && asientoSeleccionado && (
          <ModalDetalleAsiento
            asiento={asientoSeleccionado}
            onClose={() => {
              setMostrarModal(false);
              setAsientoSeleccionado(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AsientosPendientesSection;