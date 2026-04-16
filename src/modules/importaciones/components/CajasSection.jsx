import React, { useEffect, useState, useMemo } from 'react';
import { Package, Plus, Trash2, ChevronRight, ChevronDown, PackageCheck, AlertCircle } from 'lucide-react';
import { useCajas } from '../hooks/useCajas';
import { useImportaciones } from '../hooks/useImportaciones';
import NuevaCajaModal from './NuevaCajaModal';
import AsignarCajaModal from './AsignarCajaModal';
import RecepcionCajaModal from './RecepcionCajaModal';
import Tarjeta from '../../../shared/components/layout/Tarjeta';
import { formatearFechaDisplay } from '../../../shared/config/timezone';
import { COLORES_ESTADOS, LABELS_ESTADOS } from '../constants/estadosImportacion';

const CajasSection = () => {
  const { cajas, loading, error, fetchCajas, crearCaja, deleteCaja, desasignarItems } = useCajas();
  const { recibos, fetchRecibos } = useImportaciones();

  const [expandedCajas, setExpandedCajas] = useState({});
  const [showNuevaCaja, setShowNuevaCaja] = useState(false);
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [cajaParaAsignar, setCajaParaAsignar] = useState(null);
  const [cajaParaRecepcionar, setCajaParaRecepcionar] = useState(null);
  const [filtroCajas, setFiltroCajas] = useState('abierta');

  useEffect(() => {
    fetchCajas();
    fetchRecibos();
  }, [fetchCajas, fetchRecibos]);

  const toggleCaja = (id) => {
    setExpandedCajas(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const cajasFiltradas = useMemo(() => {
    if (filtroCajas === 'todas') return cajas;
    return cajas.filter(c => c.estado === filtroCajas);
  }, [cajas, filtroCajas]);

  const stats = useMemo(() => ({
    total: cajas.length,
    abiertas: cajas.filter(c => c.estado === 'abierta').length,
    recepcionadas: cajas.filter(c => c.estado === 'recepcionada').length
  }), [cajas]);

  const handleCrearCaja = async (formData) => {
    try {
      await crearCaja(formData);
      setShowNuevaCaja(false);
    } catch (err) {
      throw err;
    }
  };

  const handleEliminarCaja = async (caja) => {
    const totalItems = (caja.importaciones_items || []).length;
    if (totalItems > 0) {
      alert(`La caja tiene ${totalItems} item(s) asignados. Desasignálos antes de eliminarla.`);
      return;
    }
    if (!window.confirm(`¿Eliminar la caja ${caja.numero_caja}?`)) return;
    try {
      await deleteCaja(caja.id);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDesasignarItem = async (item) => {
    if (!window.confirm(`¿Quitar "${item.item}" de la caja?`)) return;
    try {
      await desasignarItems([item.id]);
      await fetchRecibos();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Agrupar items de una caja por recibo padre
  const agruparItemsPorRecibo = (caja) => {
    const grupos = {};
    (caja.importaciones_items || []).forEach(item => {
      const rid = item.recibo_id;
      if (!grupos[rid]) grupos[rid] = { recibo: item.importaciones_recibos, items: [] };
      grupos[rid].items.push(item);
    });
    return Object.values(grupos);
  };

  const calcularTotalFOBCaja = (caja) => {
    return (caja.importaciones_items || []).reduce((sum, i) => {
      return sum + parseFloat(i.precio_unitario_usd || 0) * (i.cantidad || 1);
    }, 0);
  };

  const calcularPesoEstimadoCaja = (caja) => {
    return (caja.importaciones_items || []).reduce((sum, i) => {
      const peso = parseFloat(i.peso_real_unitario_kg || i.peso_estimado_unitario_kg || 0);
      return sum + peso * (i.cantidad || 1);
    }, 0);
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-slate-800 p-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Package size={28} />
            <div>
              <h2 className="text-2xl font-semibold">Cajas de Envío</h2>
              <p className="text-gray-300 mt-1">Agrupación de items para distribución de costos de courier</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setCajaParaAsignar(null); setShowAsignarModal(true); }}
              className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-500 flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <Package size={16} />
              Asignar Items
            </button>
            <button
              onClick={() => setShowNuevaCaja(true)}
              className="bg-emerald-600 text-white px-6 py-3 rounded hover:bg-emerald-700 flex items-center gap-2 font-medium transition-colors"
            >
              <Plus size={18} />
              Nueva Caja
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 p-4">
        <Tarjeta icon={Package} titulo="Total Cajas" valor={stats.total} />
        <Tarjeta icon={Package} titulo="Abiertas" valor={stats.abiertas} />
        <Tarjeta icon={PackageCheck} titulo="Recepcionadas" valor={stats.recepcionadas} />
      </div>

      {/* Filtro */}
      <div className="px-4 pb-3 flex gap-2">
        {[
          { value: 'abierta', label: 'Abiertas' },
          { value: 'recepcionada', label: 'Recepcionadas' },
          { value: 'todas', label: 'Todas' }
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setFiltroCajas(opt.value)}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              filtroCajas === opt.value
                ? 'bg-slate-800 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-slate-600">Cargando cajas...</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mb-4">
          <div className="text-red-700">Error: {error}</div>
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && (
        <div className="mx-4 mb-4 bg-white rounded border border-slate-200">
          {cajasFiltradas.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <AlertCircle size={32} className="mx-auto mb-3 text-slate-300" />
              <p>No hay cajas en este estado</p>
              <p className="text-sm text-slate-400 mt-1">
                {filtroCajas === 'abierta' ? 'Hacé clic en "Nueva Caja" para crear una' : ''}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: '700px' }}>
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="w-8 py-3"></th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">N° Caja</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Items</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Pedidos</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Peso Est.</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">FOB Total</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Costo Courier</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">F. Recepción</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {cajasFiltradas.map((caja, idx) => {
                    const grupos = agruparItemsPorRecibo(caja);
                    const totalItems = (caja.importaciones_items || []).length;
                    const pesoEst = calcularPesoEstimadoCaja(caja);
                    const fobTotal = calcularTotalFOBCaja(caja);
                    const isExpanded = expandedCajas[caja.id];
                    const estaRecepcionada = caja.estado === 'recepcionada';

                    return (
                      <React.Fragment key={caja.id}>
                        <tr className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => toggleCaja(caja.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                            >
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm font-semibold text-slate-800">{caja.numero_caja}</span>
                            {caja.descripcion && (
                              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{caja.descripcion}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-medium text-slate-800">{totalItems}</td>
                          <td className="px-4 py-3 text-sm text-center text-slate-600">{grupos.length}</td>
                          <td className="px-4 py-3 text-sm text-center text-slate-600">
                            {estaRecepcionada && caja.peso_sin_caja_kg
                              ? <span className="font-medium">{parseFloat(caja.peso_sin_caja_kg).toFixed(2)} kg</span>
                              : pesoEst > 0 ? <span className="text-slate-400">~{pesoEst.toFixed(2)} kg</span> : '—'
                            }
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-medium text-slate-800">
                            {fobTotal > 0 ? `$${Math.round(fobTotal).toLocaleString('es-AR')}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-semibold text-emerald-700">
                            {caja.costo_total_usd
                              ? `$${parseFloat(caja.costo_total_usd).toFixed(2)}`
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-slate-500">
                            {caja.fecha_recepcion ? formatearFechaDisplay(caja.fecha_recepcion) : '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs px-2 py-1 rounded font-medium ${
                              estaRecepcionada
                                ? 'bg-green-100 text-green-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {estaRecepcionada ? 'RECEPCIONADA' : 'ABIERTA'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {!estaRecepcionada && (
                                <>
                                  <button
                                    onClick={() => { setCajaParaAsignar(caja); setShowAsignarModal(true); }}
                                    className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
                                    title="Asignar items"
                                  >
                                    + Items
                                  </button>
                                  {totalItems > 0 && (
                                    <button
                                      onClick={() => setCajaParaRecepcionar(caja)}
                                      className="text-xs px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium"
                                      title="Recepcionar caja"
                                    >
                                      Recepcionar
                                    </button>
                                  )}
                                </>
                              )}
                              <button
                                onClick={() => handleEliminarCaja(caja)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                                title="Eliminar caja"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Fila expandida */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={10} className="bg-slate-50 px-0 py-0">
                              {grupos.length === 0 ? (
                                <div className="px-8 py-4 text-sm text-slate-400 italic">Sin items asignados</div>
                              ) : (
                                <div className="divide-y divide-slate-200">
                                  {grupos.map((grupo, gi) => (
                                    <div key={gi}>
                                      <div className="flex items-center gap-3 px-8 py-2 bg-slate-100 border-t border-slate-200">
                                        <span className="font-mono text-xs font-semibold text-slate-700">
                                          {grupo.recibo?.numero_recibo || 'Pedido'}
                                        </span>
                                        <span className="text-xs text-slate-500">{grupo.recibo?.proveedores?.nombre || ''}</span>
                                        {grupo.recibo?.estado && (
                                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${COLORES_ESTADOS[grupo.recibo.estado] || ''}`}>
                                            {LABELS_ESTADOS[grupo.recibo.estado] || grupo.recibo.estado}
                                          </span>
                                        )}
                                      </div>
                                      <table className="w-full">
                                        <thead className="bg-slate-700 text-white text-xs">
                                          <tr>
                                            <th className="w-10 pl-12 py-1.5 text-left"></th>
                                            <th className="px-3 py-1.5 text-left">Producto</th>
                                            <th className="px-3 py-1.5 text-center">Cant.</th>
                                            <th className="px-3 py-1.5 text-center">Color</th>
                                            <th className="px-3 py-1.5 text-center">Almacenamiento</th>
                                            <th className="px-3 py-1.5 text-center">Peso u.</th>
                                            <th className="px-3 py-1.5 text-center">FOB u.</th>
                                            {estaRecepcionada && <th className="px-3 py-1.5 text-center">Precio Final u.</th>}
                                            <th className="px-3 py-1.5 text-center"></th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {grupo.items.map(item => (
                                            <tr key={item.id} className="hover:bg-white transition-colors">
                                              <td className="w-10 pl-12 py-2 text-slate-300 text-sm">↳</td>
                                              <td className="px-3 py-2 text-sm text-slate-800">{item.item}</td>
                                              <td className="px-3 py-2 text-sm text-center text-slate-600">x{item.cantidad}</td>
                                              <td className="px-3 py-2 text-sm text-center text-slate-500">{item.color || '—'}</td>
                                              <td className="px-3 py-2 text-sm text-center text-slate-500">{item.almacenamiento || '—'}</td>
                                              <td className="px-3 py-2 text-sm text-center text-slate-500">
                                                {parseFloat(item.peso_real_unitario_kg || item.peso_estimado_unitario_kg || 0).toFixed(3)} kg
                                                {item.peso_real_unitario_kg && <span className="ml-1 text-emerald-600 text-xs">✓</span>}
                                              </td>
                                              <td className="px-3 py-2 text-sm text-center text-slate-700">
                                                ${parseFloat(item.precio_unitario_usd || 0).toFixed(2)}
                                              </td>
                                              {estaRecepcionada && (
                                                <td className="px-3 py-2 text-sm text-center font-semibold text-emerald-700">
                                                  ${parseFloat(item.costo_final_unitario_usd || 0).toFixed(2)}
                                                </td>
                                              )}
                                              <td className="px-3 py-2 text-center">
                                                {!estaRecepcionada && (
                                                  <button
                                                    onClick={() => handleDesasignarItem(item)}
                                                    className="text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-0.5"
                                                  >
                                                    Quitar
                                                  </button>
                                                )}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modales */}
      {showNuevaCaja && (
        <NuevaCajaModal
          onClose={() => setShowNuevaCaja(false)}
          onSuccess={handleCrearCaja}
        />
      )}

      {showAsignarModal && (
        <AsignarCajaModal
          recibos={recibos}
          cajaPreseleccionada={cajaParaAsignar}
          onClose={() => { setShowAsignarModal(false); setCajaParaAsignar(null); }}
          onSuccess={async () => {
            setShowAsignarModal(false);
            setCajaParaAsignar(null);
            await fetchCajas();
            await fetchRecibos();
          }}
        />
      )}

      {cajaParaRecepcionar && (
        <RecepcionCajaModal
          caja={cajaParaRecepcionar}
          onClose={() => setCajaParaRecepcionar(null)}
          onSuccess={async () => {
            setCajaParaRecepcionar(null);
            await fetchCajas();
            await fetchRecibos();
          }}
        />
      )}
    </div>
  );
};

export default CajasSection;
