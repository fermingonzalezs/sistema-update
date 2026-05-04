import React, { useEffect, useState, useMemo } from 'react';
import { Trash2, ChevronRight, ChevronDown, AlertCircle, Eye } from 'lucide-react';
import { useCajas } from '../hooks/useCajas';
import { useImportaciones } from '../hooks/useImportaciones';
import NuevoIngresoModal from './NuevoIngresoModal';
import DetalleIngresoModal from './DetalleIngresoModal';
import { formatearFechaDisplay } from '../../../shared/config/timezone';

const IngresosSection = ({ showNuevoIngreso, setShowNuevoIngreso }) => {
  const { cajas, loading, error, fetchCajas, eliminarIngreso } = useCajas();
  const { recibos, fetchRecibos } = useImportaciones();

  const [expandedIngresos, setExpandedIngresos] = useState({});
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
        <div className="bg-white">
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
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-28">N° Ingreso</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-28">F. Ingreso</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-16">Items</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Pedidos</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-28">Peso s/ caja</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-28">FOB Total</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-28">Costo Courier</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-20">Acciones</th>
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
                          <td className="px-4 py-3 text-center">
                            <span className="font-mono text-xs text-slate-800">{ingreso.numero_caja}</span>
                            {ingreso.descripcion && (
                              <span className="text-xs text-slate-400 ml-1">· {ingreso.descripcion}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-center text-slate-500">
                            {ingreso.fecha_recepcion ? formatearFechaDisplay(ingreso.fecha_recepcion) : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-center text-slate-800">{totalItems}</td>
                          <td className="px-4 py-3 text-xs text-slate-600 max-w-0 overflow-hidden">
                            <div className="flex flex-col gap-0.5 text-left w-full overflow-hidden">
                              {grupos.map((grupo, gi) => {
                                const fullText = [
                                  grupo.recibo?.proveedores?.nombre ? `(${grupo.recibo.proveedores.nombre})` : null,
                                  grupo.recibo?.observaciones
                                ].filter(Boolean).join(' ');
                                return (
                                  <span key={gi} className="block truncate" title={fullText || undefined}>
                                    {grupo.recibo?.proveedores?.nombre && (
                                      <span className="text-slate-400">({grupo.recibo.proveedores.nombre}) </span>
                                    )}
                                    {grupo.recibo?.observaciones || '—'}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-center text-slate-600">
                            {ingreso.peso_sin_caja_kg
                              ? `${parseFloat(ingreso.peso_sin_caja_kg).toFixed(2)} kg`
                              : '—'
                            }
                          </td>
                          <td className="px-4 py-3 text-xs text-center text-slate-800">
                            {fobTotal > 0 ? `U$ ${Math.round(fobTotal).toLocaleString('es-AR')}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-center text-emerald-700">
                            {ingreso.costo_total_usd
                              ? `U$ ${Math.round(parseFloat(ingreso.costo_total_usd)).toLocaleString('es-AR')}`
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
                                <div className="px-8 py-4 text-xs text-slate-400 italic">Sin items</div>
                              ) : (
                                <div className="divide-y divide-slate-200">
                                  {grupos.map((grupo, gi) => (
                                    <div key={gi}>
                                      <div className="flex items-center justify-center gap-8 px-6 py-2 bg-slate-800 text-white text-xs">
                                        <span className="whitespace-nowrap">
                                          <span className="text-slate-400 uppercase tracking-wider text-[10px] mr-1.5">Pedido</span>
                                          {grupo.recibo?.numero_recibo || '—'}
                                        </span>
                                        <span className="whitespace-nowrap">
                                          <span className="text-slate-400 uppercase tracking-wider text-[10px] mr-1.5">Proveedor</span>
                                          {grupo.recibo?.proveedores?.nombre || '—'}
                                        </span>
                                        <span className="truncate max-w-xs">
                                          <span className="text-slate-400 uppercase tracking-wider text-[10px] mr-1.5">Descripción</span>
                                          {grupo.recibo?.observaciones || '—'}
                                        </span>
                                      </div>
                                      <table className="w-full">
                                        <thead className="bg-slate-700 text-white">
                                          <tr>
                                            <th className="w-6 py-1"></th>
                                            <th className="px-2 py-1 text-left text-[10px] font-medium uppercase tracking-wider">PRODUCTO</th>
                                            <th className="px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wider whitespace-nowrap">CANT.</th>
                                            <th className="px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wider whitespace-nowrap">COLOR</th>
                                            <th className="px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wider whitespace-nowrap">ALMAC.</th>
                                            <th className="px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wider whitespace-nowrap">PESO</th>
                                            <th className="px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wider whitespace-nowrap">FOB</th>
                                            <th className="px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wider whitespace-nowrap">ENVÍO</th>
                                            <th className="px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wider whitespace-nowrap">C. FINANCIERO</th>
                                            <th className="px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wider whitespace-nowrap">P. FINAL UNIT</th>
                                            <th className="px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wider whitespace-nowrap">P. FINAL TOTAL</th>
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
                                                <td className="w-6 py-1 text-slate-300 text-xs text-center">↳</td>
                                                <td className="px-2 py-1 text-xs text-slate-600 max-w-0 overflow-hidden">
                                                  <span className="block truncate" title={item.item}>{item.item}</span>
                                                </td>
                                                <td className="px-2 py-1 text-xs text-center text-slate-600 whitespace-nowrap">{item.cantidad}</td>
                                                <td className="px-2 py-1 text-xs text-center text-slate-600 whitespace-nowrap">{item.color || '—'}</td>
                                                <td className="px-2 py-1 text-xs text-center text-slate-600 whitespace-nowrap">{item.almacenamiento || '—'}</td>
                                                <td className="px-2 py-1 text-xs text-center text-slate-600 whitespace-nowrap">
                                                  {parseFloat(item.peso_real_unitario_kg || 0).toFixed(3)} kg
                                                </td>
                                                <td className="px-2 py-1 text-xs text-center text-slate-600 whitespace-nowrap">
                                                  U$ {parseFloat(item.precio_unitario_usd || 0).toFixed(1)}
                                                </td>
                                                <td className="px-2 py-1 text-xs text-center text-slate-600 whitespace-nowrap">
                                                  {item.costo_envio_usd ? `U$ ${parseFloat(item.costo_envio_usd).toFixed(1)}` : '—'}
                                                </td>
                                                <td className="px-2 py-1 text-xs text-center text-slate-600 whitespace-nowrap">
                                                  {item.costo_financiero_usd ? `U$ ${parseFloat(item.costo_financiero_usd).toFixed(1)}` : '—'}
                                                </td>
                                                <td className="px-2 py-1 text-xs text-center text-slate-600 whitespace-nowrap">
                                                  {precioFinalUnit > 0 ? `U$ ${precioFinalUnit.toFixed(1)}` : '—'}
                                                </td>
                                                <td className="px-2 py-1 text-xs text-center text-slate-600 whitespace-nowrap">
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
