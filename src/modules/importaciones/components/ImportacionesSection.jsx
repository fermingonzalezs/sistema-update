import React, { useEffect, useState, useMemo } from 'react';
import { Plane, Plus, Eye, Truck, X, AlertCircle, TrendingUp, Package, DollarSign, Trash2, ChevronDown, ChevronRight, ShoppingCart } from 'lucide-react';
import Tarjeta from '../../../shared/components/layout/Tarjeta';
import { useImportaciones } from '../hooks/useImportaciones';
import { useProveedores } from '../hooks/useProveedores';
import NuevaImportacionModal from './NuevaImportacionModal';
import RecepcionModal from './RecepcionModal';
import DetalleRecibo from './DetalleRecibo';
import FechaDepositoUSAModal from './FechaDepositoUSAModal';
import PasarAComprasModal from './PasarAComprasModal';
import { calculosImportacion } from '../utils/calculosImportacion';

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
    deleteRecibo,
    pasarACompras
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
  const [showPasarComprasModal, setShowPasarComprasModal] = useState(false);
  const [reciboToPasarCompras, setReciboToPasarCompras] = useState(null);
  const [isPasandoCompras, setIsPasandoCompras] = useState(false);

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
    const enTransito = recibos.filter(r => r.estado === 'en_transito').length;
    const enDepositoUSA = recibos.filter(r => r.estado === 'en_deposito_usa').length;
    const recepcionadas = recibos.filter(r => r.estado === 'recepcionado').length;
    const totalInvertido = recibos.reduce((sum, recibo) => {
      return sum + (recibo.importaciones_items || []).reduce((itemSum, item) => itemSum + (item.precio_total_usd || 0), 0);
    }, 0);

    return { enTransito, enDepositoUSA, recepcionadas, totalInvertido };
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

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'en_transito':
        return 'bg-yellow-100 text-yellow-800';
      case 'en_deposito_usa':
        return 'bg-blue-100 text-blue-800';
      case 'recepcionado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      'en_transito': 'EN TRÁNSITO',
      'en_deposito_usa': 'EN DEPÓSITO USA',
      'recepcionado': 'RECEPCIONADO'
    };
    return labels[estado] || estado;
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Tarjeta
          icon={TrendingUp}
          titulo="En Tránsito"
          valor={stats.enTransito}
        />
        <Tarjeta
          icon={Package}
          titulo="En Depósito USA"
          valor={stats.enDepositoUSA}
        />
        <Tarjeta
          icon={Truck}
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
              <option value="en_transito">En Tránsito</option>
              <option value="en_deposito_usa">En Depósito USA</option>
              <option value="recepcionado">Recepcionadas</option>
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
            <table className="w-full">
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
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{recibo.numero_recibo}</td>
                    <td className="px-4 py-3 text-sm text-center text-slate-600">
                      {new Date(recibo.fecha_compra).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-600">
                      {recibo.proveedores?.nombre || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-600">
                      {recibo.importaciones_items?.length || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-semibold text-slate-800">
                      USD ${formatNumber(
                        (recibo.importaciones_items || []).reduce((sum, i) => sum + (i.precio_total_usd || 0), 0)
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-semibold text-slate-800">
                      {recibo.estado === 'recepcionado' ? (
                        `USD $${formatNumber(
                          (recibo.importaciones_items || []).reduce((sum, i) => sum + ((i.costos_adicionales_usd || 0) * i.cantidad), 0)
                        )}`
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded text-xs font-semibold ${getEstadoColor(recibo.estado)}`}>
                        {getEstadoLabel(recibo.estado)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-600">
                      {recibo.observaciones || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => setExpandedRecibo(recibo)}
                          className="text-emerald-600 hover:text-emerald-700 transition-colors"
                          title="Ver detalles"
                        >
                          <Eye size={18} />
                        </button>
                        {recibo.estado === 'en_transito' && (
                          <button
                            onClick={() => {
                              setReciboToMarkDeposito(recibo);
                              setShowFechaDepositoModal(true);
                            }}
                            className="text-emerald-600 hover:text-emerald-700 transition-colors"
                            title="Marcar en depósito USA"
                          >
                            <Package size={18} />
                          </button>
                        )}
                        {recibo.estado === 'en_deposito_usa' && (
                          <button
                            onClick={() => {
                              setReciboToReceive(recibo);
                              setShowReceiveModal(true);
                            }}
                            className="text-emerald-600 hover:text-emerald-700 transition-colors"
                            title="Recepcionar"
                          >
                            <Truck size={18} />
                          </button>
                        )}
                        {recibo.estado === 'recepcionado' && (
                          <button
                            onClick={() => {
                              setReciboToPasarCompras(recibo);
                              setShowPasarComprasModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                            title="Pasar a Compras"
                          >
                            <ShoppingCart size={18} />
                          </button>
                        )}
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

      {showPasarComprasModal && reciboToPasarCompras && (
        <PasarAComprasModal
          recibo={reciboToPasarCompras}
          isSubmitting={isPasandoCompras}
          onClose={() => {
            setShowPasarComprasModal(false);
            setReciboToPasarCompras(null);
          }}
          onConfirm={async (reciboEditado, itemsEditados) => {
            setIsPasandoCompras(true);
            try {
              await pasarACompras(reciboEditado, itemsEditados, reciboToPasarCompras);
              alert('✅ Importación pasada a compras exitosamente');
              setShowPasarComprasModal(false);
              setReciboToPasarCompras(null);
              fetchRecibos();
            } catch (err) {
              alert('❌ Error: ' + err.message);
            } finally {
              setIsPasandoCompras(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default ImportacionesSection;
