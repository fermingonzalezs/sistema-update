import React, { useEffect, useState, useMemo } from 'react';
import { Plane, Plus, Eye, Truck, X, AlertCircle, TrendingUp, Package, DollarSign, Trash2, ChevronDown, ChevronRight, Home, Check, ArrowRight } from 'lucide-react';
import Tarjeta from '../../../shared/components/layout/Tarjeta';
import { useImportaciones } from '../hooks/useImportaciones';
import { useProveedores } from '../hooks/useProveedores';
import NuevaImportacionModal from './NuevaImportacionModal';
import RecepcionModal from './RecepcionModal';
import DetalleRecibo from './DetalleRecibo';
import FechaDepositoUSAModal from './FechaDepositoUSAModal';
import { calculosImportacion } from '../utils/calculosImportacion';
import {
  ESTADOS_IMPORTACION,
  LABELS_ESTADOS,
  COLORES_ESTADOS,
  obtenerSiguienteEstado,
  obtenerIconoSiguienteEstado,
  obtenerLabelSiguienteEstado
} from '../constants/estadosImportacion';

const METODOS_PAGO = [
  { value: 'efectivo_pesos', label: '💵 Efectivo en Pesos' },
  { value: 'dolares_billete', label: '💸 Dólares Billete' },
  { value: 'transferencia', label: '🏦 Transferencia' },
  { value: 'criptomonedas', label: '₿ Criptomonedas' },
  { value: 'tarjeta_credito', label: '💳 Tarjeta de Crédito' },
  { value: 'cuenta_corriente', label: '🏷️ Cuenta Corriente' }
];

const ImportacionesSection = () => {
  const {
    recibos,
    loading,
    error,
    fetchRecibos,
    marcarEnDepositoUSA,
    avanzarEstado,
    deleteRecibo
  } = useImportaciones();

  const { proveedores } = useProveedores();

  // Estados para modales
  const [showNewModal, setShowNewModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [expandedRecibo, setExpandedRecibo] = useState(null);
  const [reciboToReceive, setReciboToReceive] = useState(null);
  const [showFechaDepositoModal, setShowFechaDepositoModal] = useState(false);
  const [reciboToMarkDeposito, setReciboToMarkDeposito] = useState(null);
  const [isMarkingDeposito, setIsMarkingDeposito] = useState(false);

  // Estados para filtros
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroProveedor, setFiltroProveedor] = useState('todos');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');

  useEffect(() => {
    fetchRecibos();
  }, [fetchRecibos]);

  // Filtrar recibos
  const recibosFiltrados = useMemo(() => {
    return recibos.filter(recibo => {
      if (filtroEstado !== 'todos' && recibo.estado !== filtroEstado) return false;
      if (filtroProveedor !== 'todos' && recibo.proveedor_id !== filtroProveedor) return false;
      if (filtroFechaDesde && recibo.fecha_compra < filtroFechaDesde) return false;
      if (filtroFechaHasta && recibo.fecha_compra > filtroFechaHasta) return false;
      return true;
    });
  }, [recibos, filtroEstado, filtroProveedor, filtroFechaDesde, filtroFechaHasta]);

  // Stats
  const stats = useMemo(() => {
    const enTransitoUSA = recibos.filter(r => r.estado === ESTADOS_IMPORTACION.EN_TRANSITO_USA).length;
    const enDepositoUSA = recibos.filter(r => r.estado === ESTADOS_IMPORTACION.EN_DEPOSITO_USA).length;
    const enVueloInternacional = recibos.filter(r => r.estado === ESTADOS_IMPORTACION.EN_VUELO_INTERNACIONAL).length;
    const enDepositoARG = recibos.filter(r => r.estado === ESTADOS_IMPORTACION.EN_DEPOSITO_ARG).length;
    const recepcionadas = recibos.filter(r => r.estado === ESTADOS_IMPORTACION.RECEPCIONADO).length;
    const totalInvertido = recibos.reduce((sum, recibo) => {
      return sum + (recibo.importaciones_items || []).reduce((itemSum, item) => itemSum + (item.precio_total_usd || 0), 0);
    }, 0);

    return { enTransitoUSA, enDepositoUSA, enVueloInternacional, enDepositoARG, recepcionadas, totalInvertido };
  }, [recibos]);

  // Proveedores únicos
  const proveedoresEnUso = useMemo(() => {
    return ['todos', ...new Set(recibos.map(r => r.proveedor_id))];
  }, [recibos]);

  const formatNumber = (num) => {
    return Math.round(num).toLocaleString('es-AR');
  };

  const formatMetodoPago = (metodo) => {
    const metodoPago = METODOS_PAGO.find(m => m.value === metodo);
    return metodoPago ? metodoPago.label : metodo;
  };

  const limpiarFiltros = () => {
    setFiltroEstado('todos');
    setFiltroProveedor('todos');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
  };

  // Avanzar al siguiente estado
  const handleAvanzarEstado = async (recibo) => {
    const siguienteEstado = obtenerSiguienteEstado(recibo.estado);

    if (!siguienteEstado) {
      return; // Ya está en el último estado
    }

    // Si el siguiente estado requiere modal con datos adicionales
    if (siguienteEstado === ESTADOS_IMPORTACION.EN_DEPOSITO_USA) {
      setReciboToMarkDeposito(recibo);
      setShowFechaDepositoModal(true);
    } else if (siguienteEstado === ESTADOS_IMPORTACION.RECEPCIONADO) {
      setReciboToReceive(recibo);
      setShowReceiveModal(true);
    } else {
      // Estados intermedios (EN_VUELO_INTERNACIONAL, EN_DEPOSITO_ARG): actualizar directamente
      try {
        await avanzarEstado(recibo.id, siguienteEstado);
        await fetchRecibos();
      } catch (err) {
        alert(`Error al avanzar estado: ${err.message}`);
      }
    }
  };

  const getEstadoColor = (estado) => {
    return COLORES_ESTADOS[estado] || 'bg-slate-100 text-slate-800';
  };

  const getEstadoLabel = (estado) => {
    return LABELS_ESTADOS[estado] || estado;
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded border border-slate-200">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Plane className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-semibold">Importaciones</h2>
                <p className="text-slate-300 mt-1">Gestión de importaciones de productos</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewModal(true)}
              className="bg-emerald-600 text-white px-6 py-3 rounded hover:bg-emerald-700 flex items-center gap-2 font-medium transition-colors"
            >
              <Plus size={18} />
              Nueva Importación
            </button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Tarjeta
          icon={TrendingUp}
          titulo="En Tránsito USA"
          valor={stats.enTransitoUSA}
        />
        <Tarjeta
          icon={Package}
          titulo="En Depósito USA"
          valor={stats.enDepositoUSA}
        />
        <Tarjeta
          icon={Plane}
          titulo="En Vuelo INT"
          valor={stats.enVueloInternacional}
        />
        <Tarjeta
          icon={Home}
          titulo="En Depósito ARG"
          valor={stats.enDepositoARG}
        />
        <Tarjeta
          icon={Check}
          titulo="Recepcionadas"
          valor={stats.recepcionadas}
        />
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="todos">Todos</option>
              <option value={ESTADOS_IMPORTACION.EN_TRANSITO_USA}>En Tránsito USA</option>
              <option value={ESTADOS_IMPORTACION.EN_DEPOSITO_USA}>En Depósito USA</option>
              <option value={ESTADOS_IMPORTACION.EN_VUELO_INTERNACIONAL}>En Vuelo Internacional</option>
              <option value={ESTADOS_IMPORTACION.EN_DEPOSITO_ARG}>En Depósito ARG</option>
              <option value={ESTADOS_IMPORTACION.RECEPCIONADO}>Recepcionadas</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Proveedor</label>
            <select
              value={filtroProveedor}
              onChange={(e) => setFiltroProveedor(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="todos">Todos</option>
              {proveedoresEnUso
                .filter(id => id !== 'todos')
                .map(proveedorId => {
                  const proveedor = proveedores.find(p => p.id === proveedorId);
                  return proveedor ? (
                    <option key={proveedorId} value={proveedorId}>
                      {proveedor.nombre}
                    </option>
                  ) : null;
                })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Desde</label>
            <input
              type="date"
              value={filtroFechaDesde}
              onChange={(e) => setFiltroFechaDesde(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Hasta</label>
            <input
              type="date"
              value={filtroFechaHasta}
              onChange={(e) => setFiltroFechaHasta(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={limpiarFiltros}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded hover:bg-black text-sm font-medium transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* ESTADOS DE CARGA Y ERROR */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-slate-600">Cargando importaciones...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="text-red-700">Error: {error}</div>
        </div>
      )}

      {/* TABLA DE RECIBOS */}
      {!loading && !error && (
        <div className="bg-white rounded border border-slate-200 overflow-hidden">
          {recibosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-slate-600">
              <AlertCircle size={32} className="mx-auto mb-3 text-slate-400" />
              <p>No hay importaciones registradas</p>
              <p className="text-sm text-slate-500 mt-1">Haz clic en "Nueva Importación" para agregar una</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Recibo</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Proveedor</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Items</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Total USD</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Costos Adic. USD</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Descripción</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recibosFiltrados.map((recibo, idx) => (
                  <tr key={recibo.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis" title={recibo.numero_recibo}>
                      {recibo.numero_recibo}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-600 whitespace-nowrap">
                      {new Date(recibo.fecha_compra).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis" title={recibo.proveedores?.nombre || '-'}>
                      {recibo.proveedores?.nombre || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-600 whitespace-nowrap">
                      {recibo.importaciones_items?.length || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-semibold text-slate-800 whitespace-nowrap">
                      USD ${formatNumber(
                        (recibo.importaciones_items || []).reduce((sum, i) => sum + (i.precio_total_usd || 0), 0)
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-semibold text-slate-800 whitespace-nowrap">
                      {recibo.estado === ESTADOS_IMPORTACION.RECEPCIONADO ? (
                        `USD $${formatNumber(
                          (recibo.importaciones_items || []).reduce((sum, i) => sum + ((i.costos_adicionales_usd || 0) * i.cantidad), 0)
                        )}`
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ${getEstadoColor(recibo.estado)}`}>
                        {getEstadoLabel(recibo.estado)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis" title={recibo.observaciones || '-'}>
                      {recibo.observaciones || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-end gap-3">
                        {/* Botón único para avanzar al siguiente estado */}
                        {recibo.estado !== ESTADOS_IMPORTACION.RECEPCIONADO && (() => {
                          const siguienteEstado = obtenerSiguienteEstado(recibo.estado);
                          if (!siguienteEstado) return null;

                          const IconoSiguiente = {
                            'Package': Package,
                            'Plane': Plane,
                            'Home': Home,
                            'Check': Check,
                            'ArrowRight': ArrowRight
                          }[obtenerIconoSiguienteEstado(recibo.estado)] || ArrowRight;

                          const labelSiguiente = obtenerLabelSiguienteEstado(recibo.estado);

                          return (
                            <button
                              onClick={() => handleAvanzarEstado(recibo)}
                              className="text-emerald-600 hover:text-emerald-700 transition-colors"
                              title={`Avanzar a: ${labelSiguiente}`}
                            >
                              <IconoSiguiente size={18} />
                            </button>
                          );
                        })()}

                        <button
                          onClick={() => setExpandedRecibo(recibo)}
                          className="text-emerald-600 hover:text-emerald-700 transition-colors"
                          title="Ver detalles"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          onClick={async () => {
                            if (window.confirm('¿Eliminar esta importación?')) {
                              try {
                                await deleteRecibo(recibo.id);
                                alert('✅ Importación eliminada');
                              } catch (err) {
                                alert('Error: ' + err.message);
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-700 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {/* MODALES */}
      {showNewModal && (
        <NuevaImportacionModal
          onClose={() => setShowNewModal(false)}
          onSuccess={() => {
            setShowNewModal(false);
            fetchRecibos();
          }}
        />
      )}

      {showReceiveModal && reciboToReceive && (
        <RecepcionModal
          recibo={reciboToReceive}
          onClose={() => {
            setShowReceiveModal(false);
            setReciboToReceive(null);
          }}
          onSuccess={() => {
            setShowReceiveModal(false);
            setReciboToReceive(null);
            fetchRecibos();
          }}
        />
      )}

      {expandedRecibo && (
        <DetalleRecibo
          recibo={expandedRecibo}
          onClose={() => setExpandedRecibo(null)}
        />
      )}

      {showFechaDepositoModal && reciboToMarkDeposito && (
        <FechaDepositoUSAModal
          recibo={reciboToMarkDeposito}
          isSubmitting={isMarkingDeposito}
          onClose={() => {
            setShowFechaDepositoModal(false);
            setReciboToMarkDeposito(null);
          }}
          onConfirm={async (fecha) => {
            setIsMarkingDeposito(true);
            try {
              await marcarEnDepositoUSA(reciboToMarkDeposito.id, fecha);
              alert('✅ Recibo actualizado');
              setShowFechaDepositoModal(false);
              setReciboToMarkDeposito(null);
              fetchRecibos();
            } catch (err) {
              alert('Error: ' + err.message);
            } finally {
              setIsMarkingDeposito(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default ImportacionesSection;
