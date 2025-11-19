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
    return {
      totalCompras: recibos.length,
      borradores: recibos.filter(r => r.estado === 'borrador').length,
      procesadas: recibos.filter(r => r.estado === 'procesado').length,
      totalMonto: recibos.reduce((sum, recibo) => {
        const monto = (recibo.compras_items || []).reduce((s, item) => {
          return s + ((parseInt(item.cantidad) || 0) * (parseFloat(item.precio_unitario) || 0));
        }, 0);
        return sum + monto;
      }, 0)
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
      if (filtroFechaDesde && recibo.fecha_compra < filtroFechaDesde) return false;

      // Filtro por fecha hasta
      if (filtroFechaHasta && recibo.fecha_compra > filtroFechaHasta) return false;

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
    if (confirm('¿Estás seguro de que deseas procesar esta compra?')) {
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tarjeta
          icon={ShoppingBag}
          titulo="Total Compras"
          valor={stats.totalCompras}
        />
        <Tarjeta
          icon={Package}
          titulo="Borradores"
          valor={stats.borradores}
          color="yellow"
        />
        <Tarjeta
          icon={CheckCircle}
          titulo="Procesadas"
          valor={stats.procesadas}
          color="green"
        />
        <Tarjeta
          icon={DollarSign}
          titulo="Total Monto"
          valor={`$${stats.totalMonto.toFixed(2)}`}
          color="blue"
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
              <option value="borrador">Borrador</option>
              <option value="procesado">Procesado</option>
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
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Recibo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Proveedor</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Items</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recibosFiltrados.map((recibo, idx) => {
                  const total = (recibo.compras_items || []).reduce((sum, item) => {
                    return sum + ((parseInt(item.cantidad) || 0) * (parseFloat(item.precio_unitario) || 0));
                  }, 0);

                  const estadoBadge = recibo.estado === 'borrador'
                    ? <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">📝 Borrador</span>
                    : <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">✅ Procesado</span>;

                  return (
                    <tr key={recibo.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-4 py-3 text-sm font-mono text-slate-800">#{recibo.numero_recibo}</td>
                      <td className="px-4 py-3 text-sm text-slate-800">{new Date(recibo.fecha_compra).toLocaleDateString('es-AR')}</td>
                      <td className="px-4 py-3 text-sm text-slate-800">{recibo.proveedor}</td>
                      <td className="px-4 py-3 text-center text-sm text-slate-800">{recibo.compras_items?.length || 0}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-800">${total.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">{estadoBadge}</td>
                      <td className="px-4 py-3 text-center space-x-2 flex items-center justify-center">
                        <button
                          onClick={() => {
                            setReciboEnDetalle(recibo);
                            setShowDetalle(true);
                          }}
                          title="Ver detalle"
                          className="p-2 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                        >
                          <Eye size={18} />
                        </button>

                        {recibo.estado === 'borrador' && (
                          <>
                            <button
                              onClick={() => {
                                setReciboEnEdicion(recibo);
                                setShowNuevaCompra(true);
                              }}
                              title="Editar"
                              className="p-2 hover:bg-orange-100 text-orange-600 rounded transition-colors"
                            >
                              <Edit2 size={18} />
                            </button>

                            <button
                              onClick={() => handleProcesarCompra(recibo.id)}
                              disabled={isLoadingAction}
                              title="Procesar"
                              className="p-2 hover:bg-green-100 text-green-600 rounded transition-colors disabled:opacity-50"
                            >
                              <CheckCircle size={18} />
                            </button>

                            <button
                              onClick={() => handleEliminarCompra(recibo.id)}
                              disabled={isLoadingAction}
                              title="Eliminar"
                              className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors disabled:opacity-50"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
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
      />
    </div>
  );
};

export default ComprasSection;
