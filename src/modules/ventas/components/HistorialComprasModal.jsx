import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { formatearMonto } from '../../../shared/utils/formatters';

const HistorialComprasModal = ({ isOpen, onClose, cliente, compras = [] }) => {
  if (!isOpen || !cliente) return null;

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    if (compras.length === 0) {
      return {
        totalCompras: 0,
        totalGastado: 0,
        promedioCompra: 0,
        primeraCompra: null,
        ultimaCompra: null
      };
    }

    const totalGastado = compras.reduce((sum, compra) => sum + (parseFloat(compra.total_venta) || 0), 0);
    const primeraCompra = compras[compras.length - 1]?.fecha_venta;
    const ultimaCompra = compras[0]?.fecha_venta;

    return {
      totalCompras: compras.length,
      totalGastado,
      promedioCompra: totalGastado / compras.length,
      primeraCompra,
      ultimaCompra
    };
  }, [compras]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded border border-slate-200 w-full max-w-6xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header Sticky */}
        <div className="sticky top-0 bg-slate-800 text-white p-6 border-b border-slate-200 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">
              {cliente.nombre} {cliente.apellido}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded transition-colors"
              title="Cerrar"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1">
          {/* Tarjetas de Resumen */}
          {compras.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Total de Compras */}
              <div className="bg-slate-800 p-5 rounded border border-slate-700">
                <div className="text-center">
                  <p className="text-xs font-semibold text-slate-300 uppercase mb-2">Compras</p>
                  <p className="text-3xl font-bold text-white">{estadisticas.totalCompras}</p>
                </div>
              </div>

              {/* Monto Total */}
              <div className="bg-slate-800 p-5 rounded border border-slate-700">
                <div className="text-center">
                  <p className="text-xs font-semibold text-slate-300 uppercase mb-2">Total Gastado</p>
                  <p className="text-3xl font-bold text-white">
                    {formatearMonto(estadisticas.totalGastado, 'USD')}
                  </p>
                </div>
              </div>

              {/* Promedio */}
              <div className="bg-slate-800 p-5 rounded border border-slate-700">
                <div className="text-center">
                  <p className="text-xs font-semibold text-slate-300 uppercase mb-2">Promedio</p>
                  <p className="text-3xl font-bold text-white">
                    {formatearMonto(estadisticas.promedioCompra, 'USD')}
                  </p>
                </div>
              </div>

              {/* Última Compra */}
              <div className="bg-slate-800 p-5 rounded border border-slate-700">
                <div className="text-center">
                  <p className="text-xs font-semibold text-slate-300 uppercase mb-2">Última Compra</p>
                  <p className="text-2xl font-bold text-white">
                    {formatDate(estadisticas.ultimaCompra)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabla de Compras */}
          {compras.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                      Productos
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                      Garantía
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                      Total USD
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                      Vendedor
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {compras.map((compra, index) => {
                    const rowClass = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';

                    return (
                      <tr key={compra.id} className={rowClass}>
                        {/* Fecha */}
                        <td className="px-4 py-3 text-center text-sm text-slate-800 whitespace-nowrap">
                          {formatDate(compra.fecha_venta)}
                        </td>

                        {/* Productos */}
                        <td className="px-4 py-3 text-center text-xs text-slate-700">
                          {compra.venta_items && compra.venta_items.length > 0 ? (
                            <div className="space-y-0.5">
                              {compra.venta_items.map((item, idx) => (
                                <div
                                  key={item.id}
                                  className="text-xs text-slate-600"
                                  title={item.copy}
                                >
                                  <div className="font-medium text-slate-800 line-clamp-2">
                                    {item.copy || 'Producto sin descripción'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-xs">Sin detalles</span>
                          )}
                        </td>

                        {/* Garantía */}
                        <td className="px-4 py-3 text-center text-xs text-slate-700">
                          {compra.venta_items && compra.venta_items.length > 0 ? (
                            <div className="space-y-0.5">
                              {compra.venta_items.map((item) => (
                                item.garantia && (
                                  <div key={item.id} className="text-slate-800 text-xs font-medium">
                                    {item.garantia}
                                  </div>
                                )
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-xs">-</span>
                          )}
                        </td>

                        {/* Total USD */}
                        <td className="px-4 py-3 text-center text-sm font-semibold text-slate-800 whitespace-nowrap">
                          {formatearMonto(compra.total_venta, 'USD')}
                        </td>

                        {/* Vendedor */}
                        <td className="px-4 py-3 text-center text-sm text-slate-700 whitespace-nowrap">
                          {compra.vendedor || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-600 font-medium">No hay compras registradas</p>
              <p className="text-slate-500 text-sm mt-1">
                {cliente.nombre} {cliente.apellido} aún no ha realizado ninguna compra
              </p>
            </div>
          )}
        </div>

        {/* Footer Sticky */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistorialComprasModal;
