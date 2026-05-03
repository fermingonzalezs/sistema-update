import React, { useEffect, useState, useMemo } from 'react';
import { PackageCheck, Plus, Trash2, ChevronRight, ChevronDown, AlertCircle, Eye } from 'lucide-react';
import { useCajas } from '../hooks/useCajas';
import { useImportaciones } from '../hooks/useImportaciones';
import NuevoIngresoModal from './NuevoIngresoModal';
import DetalleIngresoModal from './DetalleIngresoModal';
import { formatearFechaDisplay } from '../../../shared/config/timezone';

const IngresosSection = () => {
  const { cajas, loading, error, fetchCajas, eliminarIngreso } = useCajas();
  const { recibos, fetchRecibos } = useImportaciones();

  const [expandedIngresos, setExpandedIngresos] = useState({});
  const [showNuevoIngreso, setShowNuevoIngreso] = useState(false);
  const [ingresoDetalle, setIngresoDetalle] = useState(null);

  useEffect(() => {
    fetchCajas();
    fetchRecibos();
  }, [fetchCajas, fetchRecibos]);

  const toggleIngreso = (id) => {
    setExpandedIngresos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Solo mostrar los ingresos recepcionados (ingresados)
  const ingresos = useMemo(() => {
    return cajas.filter(c => c.estado === 'recepcionada');
  }, [cajas]);

  const handleEliminar = async (ingreso) => {
    const totalItems = (ingreso.importaciones_items || []).length;
    const msg = totalItems > 0
      ? `¿Eliminar el ingreso ${ingreso.numero_caja}?\n\nSus ${totalItems} item(s) volverán al estado "no ingresado" y los recibos afectados podrían revertir su estado.`
      : `¿Eliminar el ingreso ${ingreso.numero_caja}?`;
    if (!window.confirm(msg)) return;
    try {
      await eliminarIngreso(ingreso.id);
      await fetchRecibos();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Agrupar items por recibo para la vista expandida
  const agruparPorRecibo = (ingreso) => {
    const grupos = {};
    (ingreso.importaciones_items || []).forEach(item => {
      const rid = item.recibo_id;
      if (!grupos[rid]) grupos[rid] = { recibo: item.importaciones_recibos, items: [] };
      grupos[rid].items.push(item);
    });
    return Object.values(grupos);
  };

  const calcularFOBTotal = (ingreso) => {
    return (ingreso.importaciones_items || []).reduce((sum, i) => {
      return sum + parseFloat(i.precio_unitario_usd || 0) * (i.cantidad || 1);
    }, 0);
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-slate-800 p-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <PackageCheck size={28} />
            <div>
              <h2 className="text-2xl font-semibold">Ingresos</h2>
              <p className="text-gray-300 mt-1">Mercadería recibida con distribución de costos de courier</p>
            </div>
          </div>
          <button
            onClick={() => setShowNuevoIngreso(true)}
            className="bg-emerald-600 text-white px-6 py-3 rounded hover:bg-emerald-700 flex items-center gap-2 font-medium transition-colors"
          >
            <Plus size={18} />
            Nuevo Ingreso
          </button>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-slate-600">Cargando ingresos...</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mb-4">
          <div className="text-red-700">Error: {error}</div>
        </div>
      )}

      {/* Tabla de ingresos */}
      {!loading && !error && (
        <div className="mx-4 mb-4 bg-white rounded border border-slate-200">
          {ingresos.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <AlertCircle size={32} className="mx-auto mb-3 text-slate-300" />
              <p>No hay ingresos registrados</p>
              <p className="text-sm text-slate-400 mt-1">Hacé clic en "Nuevo Ingreso" para registrar la llegada de mercadería</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: '700px' }}>
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="w-8 py-3"></th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">N° Ingreso</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">F. Ingreso</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Items</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Pedidos</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Peso s/ caja</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">FOB Total</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Costo Courier</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {ingresos.map((ingreso, idx) => {
                    const grupos = agruparPorRecibo(ingreso);
                    const totalItems = (ingreso.importaciones_items || []).length;
                    const fobTotal = calcularFOBTotal(ingreso);
                    const isExpanded = expandedIngresos[ingreso.id];

                    return (
                      <React.Fragment key={ingreso.id}>
                        <tr className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => toggleIngreso(ingreso.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                            >
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm font-semibold text-slate-800">{ingreso.numero_caja}</span>
                            {ingreso.descripcion && (
                              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{ingreso.descripcion}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-slate-500">
                            {ingreso.fecha_recepcion ? formatearFechaDisplay(ingreso.fecha_recepcion) : '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-medium text-slate-800">{totalItems}</td>
                          <td className="px-4 py-3 text-sm text-center text-slate-600">{grupos.length}</td>
                          <td className="px-4 py-3 text-sm text-center text-slate-600">
                            {ingreso.peso_sin_caja_kg
                              ? <span className="font-medium">{parseFloat(ingreso.peso_sin_caja_kg).toFixed(2)} kg</span>
                              : '—'
                            }
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-medium text-slate-800">
                            {fobTotal > 0 ? `$${Math.round(fobTotal).toLocaleString('es-AR')}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-semibold text-emerald-700">
                            {ingreso.costo_total_usd
                              ? `$${parseFloat(ingreso.costo_total_usd).toFixed(2)}`
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-3">
                              <button
                                onClick={() => setIngresoDetalle(ingreso)}
                                className="text-emerald-600 hover:text-emerald-700 transition-colors"
                                title="Ver detalles"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleEliminar(ingreso)}
                                className="text-red-400 hover:text-red-600 transition-colors"
                                title="Eliminar ingreso"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Fila expandida con items */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={9} className="bg-slate-50 px-0 py-0">
                              {grupos.length === 0 ? (
                                <div className="px-8 py-4 text-sm text-slate-400 italic">Sin items</div>
                              ) : (
                                <div className="divide-y divide-slate-200">
                                  {grupos.map((grupo, gi) => (
                                    <div key={gi}>
                                      <div className="flex items-center gap-3 px-8 py-2 bg-slate-100 border-t border-slate-200">
                                        <span className="font-mono text-xs font-semibold text-slate-700">
                                          {grupo.recibo?.numero_recibo || 'Pedido'}
                                        </span>
                                        <span className="text-xs text-slate-500">{grupo.recibo?.proveedores?.nombre || ''}</span>
                                      </div>
                                      <table className="w-full">
                                        <thead className="bg-slate-700 text-white text-xs">
                                          <tr>
                                            <th className="w-10 pl-12 py-1.5"></th>
                                            <th className="px-3 py-2 text-left font-medium uppercase tracking-wider">PRODUCTO</th>
                                            <th className="px-3 py-2 text-center font-medium uppercase tracking-wider">CANTIDAD</th>
                                            <th className="px-3 py-2 text-center font-medium uppercase tracking-wider">COLOR</th>
                                            <th className="px-3 py-2 text-center font-medium uppercase tracking-wider">ALMACENAMIENTO</th>
                                            <th className="px-3 py-2 text-center font-medium uppercase tracking-wider">PESO REAL</th>
                                            <th className="px-3 py-2 text-center font-medium uppercase tracking-wider">FOB</th>
                                            <th className="px-3 py-2 text-center font-medium uppercase tracking-wider">ENVÍO</th>
                                            <th className="px-3 py-2 text-center font-medium uppercase tracking-wider">COSTO FINANCIERO</th>
                                            <th className="px-3 py-2 text-center font-medium uppercase tracking-wider">PRECIO FINAL UNIT</th>
                                            <th className="px-3 py-2 text-center font-medium uppercase tracking-wider">PRECIO FINAL TOTAL</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {grupo.items.map(item => {
                                            const precioFinalUnit =
                                              parseFloat(item.precio_unitario_usd || 0) +
                                              parseFloat(item.costo_envio_usd || 0) +
                                              parseFloat(item.costo_financiero_usd || 0);
                                            const precioFinalTotal = precioFinalUnit * (item.cantidad || 1);
                                            return (
                                              <tr key={item.id} className="hover:bg-white transition-colors">
                                                <td className="w-10 pl-12 py-2 text-slate-300 text-sm">↳</td>
                                                <td className="px-3 py-2 text-sm text-slate-800">{item.item}</td>
                                                <td className="px-3 py-2 text-sm text-center text-slate-600">{item.cantidad}</td>
                                                <td className="px-3 py-2 text-sm text-center text-slate-500">{item.color || '—'}</td>
                                                <td className="px-3 py-2 text-sm text-center text-slate-500">{item.almacenamiento || '—'}</td>
                                                <td className="px-3 py-2 text-sm text-center text-slate-500">
                                                  {parseFloat(item.peso_real_unitario_kg || 0).toFixed(3)} kg
                                                </td>
                                                <td className="px-3 py-2 text-sm text-center text-slate-700">
                                                  U$ {parseFloat(item.precio_unitario_usd || 0).toFixed(1)}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-center text-blue-700 font-medium">
                                                  {item.costo_envio_usd ? `U$ ${parseFloat(item.costo_envio_usd).toFixed(1)}` : '—'}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-center text-purple-700 font-medium">
                                                  {item.costo_financiero_usd ? `U$ ${parseFloat(item.costo_financiero_usd).toFixed(1)}` : '—'}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-center font-semibold text-emerald-700">
                                                  {precioFinalUnit > 0 ? `U$ ${precioFinalUnit.toFixed(1)}` : '—'}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-center font-semibold text-emerald-700">
                                                  {precioFinalTotal > 0 ? `U$ ${precioFinalTotal.toFixed(1)}` : '—'}
                                                </td>
                                              </tr>
                                            );
                                          })}
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

      {/* Modal */}
      {showNuevoIngreso && (
        <NuevoIngresoModal
          recibos={recibos}
          onClose={() => setShowNuevoIngreso(false)}
          onSuccess={async () => {
            setShowNuevoIngreso(false);
            await fetchCajas();
            await fetchRecibos();
          }}
        />
      )}

      {ingresoDetalle && (
        <DetalleIngresoModal
          ingreso={ingresoDetalle}
          onClose={() => setIngresoDetalle(null)}
        />
      )}
    </div>
  );
};

export default IngresosSection;
