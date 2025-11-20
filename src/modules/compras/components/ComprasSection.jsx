import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Eye, CheckCircle, ShoppingBag, DollarSign, Package } from 'lucide-react';
import LoadingSpinner from '../../../shared/components/base/LoadingSpinner';
import Tarjeta from '../../../shared/components/layout/Tarjeta';
import { useComprasLocales } from '../hooks/useComprasLocales';
import NuevaCompraModal from './NuevaCompraModal';
import DetalleCompraModal from './DetalleCompraModal';

const ComprasSection = () => {
  const { recibos, loading, error, crearRecibo, actualizarRecibo, procesarRecibo, deleteRecibo } = useComprasLocales();

  // Estados modales
  const [showNuevaCompra, setShowNuevaCompra] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [reciboEnDetalle, setReciboEnDetalle] = useState(null);
  const [reciboEnEdicion, setReciboEnEdicion] = useState(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');

  // Calcular stats
  const stats = useMemo(() => {
    const totalItems = recibos.reduce((sum, recibo) => {
      return sum + (recibo.compras_items?.length || 0);
    }, 0);

    const totalMonto = recibos.reduce((sum, recibo) => {
      const subtotal = (recibo.compras_items || []).reduce((s, item) => {
        return s + ((parseInt(item.cantidad) || 0) * (parseFloat(item.precio_unitario) || 0));
      }, 0);
      const costos = parseFloat(recibo.costos_adicionales) || 0;
      return sum + subtotal + costos;
    }, 0);

    return {
      totalCompras: recibos.length,
      totalItems: totalItems,
      totalMonto: totalMonto
    };
  }, [recibos]);

  // Filtrar recibos
  const recibosFiltrados = useMemo(() => {
    return recibos.filter(recibo => {
      // Filtro por estado
      if (filtroEstado !== 'todos' && recibo.estado !== filtroEstado) return false;

      // Filtro por búsqueda (proveedor)
      if (filtroBusqueda && !recibo.proveedor.toLowerCase().includes(filtroBusqueda.toLowerCase())) return false;

      // Filtro por fecha desde
      if (filtroFechaDesde && recibo.fecha < filtroFechaDesde) return false;

      // Filtro por fecha hasta
      if (filtroFechaHasta && recibo.fecha > filtroFechaHasta) return false;

      return true;
    });
  }, [recibos, filtroEstado, filtroBusqueda, filtroFechaDesde, filtroFechaHasta]);

  // Obtener proveedores únicos
  const proveedoresUnicos = useMemo(() => {
    return [...new Set(recibos.map(r => r.proveedor))].sort();
  }, [recibos]);

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltroEstado('todos');
    setFiltroBusqueda('');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
  };

  // Manejar nueva compra
  const handleNuevaCompra = async (reciboData, items) => {
    setIsLoadingAction(true);
    try {
      const resultado = await crearRecibo(reciboData, items);
      if (resultado.success) {
        setShowNuevaCompra(false);
        alert(resultado.message);
      } else {
        alert('Error: ' + resultado.error);
      }
    } catch (err) {
      alert('Error creando compra: ' + err.message);
    } finally {
      setIsLoadingAction(false);
    }
  };

  // Manejar edición
  const handleEditarCompra = async (reciboData, items) => {
    setIsLoadingAction(true);
    try {
      const resultado = await actualizarRecibo(reciboEnEdicion.id, reciboData, items);
      if (resultado.success) {
        setShowNuevaCompra(false);
        setReciboEnEdicion(null);
        alert(resultado.message);
      } else {
        alert('Error: ' + resultado.error);
      }
    } catch (err) {
      alert('Error actualizando compra: ' + err.message);
    } finally {
      setIsLoadingAction(false);
    }
  };

  // Manejar procesamiento
  const handleProcesarCompra = async (id) => {
    setIsLoadingAction(true);
    try {
      const resultado = await procesarRecibo(id);
      if (resultado.success) {
        alert(resultado.message);
      } else {
        alert('Error: ' + resultado.error);
      }
    } catch (err) {
      alert('Error procesando compra: ' + err.message);
    } finally {
      setIsLoadingAction(false);
    }
  };

  // Manejar eliminación
  const handleEliminarCompra = async (id) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta compra?')) {
      setIsLoadingAction(true);
      try {
        const resultado = await deleteRecibo(id);
        if (resultado.success) {
          alert(resultado.message);
        } else {
          alert('Error: ' + resultado.error);
        }
      } catch (err) {
        alert('Error eliminando compra: ' + err.message);
      } finally {
        setIsLoadingAction(false);
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded border border-slate-200">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <ShoppingBag size={28} />
              <div>
                <h2 className="text-2xl font-semibold">Compras Locales</h2>
                <p className="text-gray-300 mt-1">Gestión de compras locales a proveedores</p>
              </div>
            </div>
            <button
              onClick={() => {
                setReciboEnEdicion(null);
                setShowNuevaCompra(true);
              }}
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 flex items-center gap-2 font-medium transition-colors"
            >
              <Plus size={18} />
              Nueva Compra
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Tarjeta
          icon={ShoppingBag}
          titulo="Compras"
          valor={stats.totalCompras}
        />
        <Tarjeta
          icon={Package}
          titulo="Items"
          valor={stats.totalItems}
          color="yellow"
        />
        <Tarjeta
          icon={DollarSign}
          titulo="Monto Total"
          valor={`U$ ${Math.round(stats.totalMonto)}`}
          color="green"
        />
      </div>

      {/* Filtros */}
      <div className="bg-gray-50 p-4 border-b rounded border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
            >
              <option value="todos">Todos</option>
              <option value="en_camino">En Camino</option>
              <option value="ingresado">Ingresado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
            <input
              type="text"
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
              placeholder="Buscar proveedor..."
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              value={filtroFechaDesde}
              onChange={(e) => setFiltroFechaDesde(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              value={filtroFechaHasta}
              onChange={(e) => setFiltroFechaHasta(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={limpiarFiltros}
              className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-black text-sm w-full"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden">
        {recibosFiltrados.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Package size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-lg">No hay compras que coincidan con los filtros</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <colgroup>
                <col style={{ width: '12%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '18%' }} />
              </colgroup>
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Recibo</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Proveedor</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Items</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Total USD</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recibosFiltrados.map((recibo, idx) => {
                  const subtotal = (recibo.compras_items || []).reduce((sum, item) => {
                    return sum + ((parseInt(item.cantidad) || 0) * (parseFloat(item.precio_unitario) || 0));
                  }, 0);
                  const total = subtotal + (parseFloat(recibo.costos_adicionales) || 0);

                  const estadoBadge = recibo.estado === 'en_camino'
                    ? <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">EN CAMINO</span>
                    : <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">INGRESADO</span>;

                  return (
                    <tr key={recibo.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{recibo.numero_recibo}</td>
                      <td className="px-4 py-3 text-sm text-center text-slate-600">{new Date(recibo.fecha).toLocaleDateString('es-AR')}</td>
                      <td className="px-4 py-3 text-sm text-center text-slate-600">{recibo.proveedores?.nombre || '-'}</td>
                      <td className="px-4 py-3 text-sm text-center text-slate-600">{recibo.compras_items?.length || 0}</td>
                      <td className="px-4 py-3 text-sm text-center font-semibold text-slate-800">U$ {Math.round(total).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</td>
                      <td className="px-4 py-3 text-center">{estadoBadge}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => {
                              setReciboEnDetalle(recibo);
                              setShowDetalle(true);
                            }}
                            title="Ver detalle"
                            className="text-emerald-600 hover:text-emerald-700 transition-colors"
                          >
                            <Eye size={18} />
                          </button>

                          {recibo.estado === 'en_camino' && (
                            <>
                              <button
                                onClick={() => {
                                  setReciboEnEdicion(recibo);
                                  setShowNuevaCompra(true);
                                }}
                                title="Editar"
                                className="text-emerald-600 hover:text-emerald-700 transition-colors"
                              >
                                <Edit2 size={18} />
                              </button>

                              <button
                                onClick={() => handleProcesarCompra(recibo.id)}
                                disabled={isLoadingAction}
                                title="Marcar como INGRESADO"
                                className="text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50"
                              >
                                <CheckCircle size={18} />
                              </button>

                              <button
                                onClick={() => handleEliminarCompra(recibo.id)}
                                disabled={isLoadingAction}
                                title="Eliminar"
                                className="text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}

                          {recibo.estado === 'ingresado' && (
                            <>
                              <button
                                onClick={() => {
                                  setReciboEnEdicion(recibo);
                                  setShowNuevaCompra(true);
                                }}
                                title="Editar"
                                className="text-emerald-600 hover:text-emerald-700 transition-colors"
                              >
                                <Edit2 size={18} />
                              </button>

                              <button
                                onClick={() => handleEliminarCompra(recibo.id)}
                                disabled={isLoadingAction}
                                title="Eliminar"
                                className="text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modales */}
      <NuevaCompraModal
        isOpen={showNuevaCompra}
        onClose={() => {
          setShowNuevaCompra(false);
          setReciboEnEdicion(null);
        }}
        onSave={reciboEnEdicion ? handleEditarCompra : handleNuevaCompra}
        isLoading={isLoadingAction}
        isEditing={!!reciboEnEdicion}
        reciboInicial={reciboEnEdicion}
      />

      <DetalleCompraModal
        isOpen={showDetalle}
        onClose={() => {
          setShowDetalle(false);
          setReciboEnDetalle(null);
        }}
        recibo={reciboEnDetalle}
        onEdit={(recibo) => {
          setReciboEnEdicion(recibo);
          setShowDetalle(false);
          setShowNuevaCompra(true);
        }}
        onDelete={(id) => {
          handleEliminarCompra(id);
          setShowDetalle(false);
          setReciboEnDetalle(null);
        }}
        isLoading={isLoadingAction}
      />
    </div>
  );
};

export default ComprasSection;
