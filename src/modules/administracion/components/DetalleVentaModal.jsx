import React from 'react';
import { X, Monitor, Smartphone, Box, CreditCard, User, Calendar, MapPin, Edit, Trash2 } from 'lucide-react';
import { formatearMonto, formatearFecha } from '../../../shared/utils/formatters';
import { generarYDescargarRecibo as abrirReciboPDF } from '../../ventas/components/pdf/ReciboVentaPDF_NewTab';

const DetalleVentaModal = ({ transaccion, onClose, onEditar, onEliminar }) => {
  if (!transaccion) return null;

  const getIconoProducto = (tipo) => {
    switch (tipo) {
      case 'computadora': return <Monitor className="w-4 h-4 text-slate-600" />;
      case 'celular': return <Smartphone className="w-4 h-4 text-slate-600" />;
      default: return <Box className="w-4 h-4 text-slate-600" />;
    }
  };

  const montoTotal = (parseFloat(transaccion.monto_pago_1 || 0) + parseFloat(transaccion.monto_pago_2 || 0));
  const margenPorcentaje = montoTotal > 0 ? Math.round((parseFloat(transaccion.margen_total || 0) / montoTotal) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-slate-800 p-6 text-white flex items-center justify-between sticky top-0">
          <div className="text-center w-full">
            <h2 className="text-xl font-semibold">TRANSACCIÓN {transaccion.numero_transaccion}</h2>
            <p className="text-slate-300 text-sm mt-1">{formatearFecha(transaccion.fecha_venta)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded transition-colors flex-shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Sección Productos */}
          <div className="border border-slate-200 rounded p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800 text-white border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2 text-center font-semibold uppercase">PRODUCTO</th>
                    <th className="px-4 py-2 text-center font-semibold uppercase">SERIAL</th>
                    <th className="px-4 py-2 text-center font-semibold uppercase">CANT.</th>
                    <th className="px-4 py-2 text-center font-semibold uppercase">COSTO UNIT.</th>
                    <th className="px-4 py-2 text-center font-semibold uppercase">PRECIO UNIT.</th>
                    <th className="px-4 py-2 text-center font-semibold uppercase">SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(transaccion.venta_items || []).map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {getIconoProducto(item.tipo_producto)}
                          <span className="text-slate-800 truncate max-w-md" title={item.copy_documento || item.copy}>{item.copy_documento || item.copy}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-800 font-mono text-xs text-center">{item.serial_producto || '-'}</td>
                      <td className="px-4 py-3 text-center text-slate-800">{item.cantidad}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{formatearMonto(item.precio_costo, 'USD')}</td>
                      <td className="px-4 py-3 text-center text-slate-800">{formatearMonto(item.precio_unitario, 'USD')}</td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-800">{formatearMonto(item.precio_total, 'USD')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tarjetas de Totales y Pagos */}
          <div className="border border-slate-200 rounded p-4">
            <div className="flex flex-wrap justify-center gap-4">
              {/* Tarjetas de totales */}
              <div className="bg-slate-50 p-3 rounded text-center min-w-[160px]">
                <p className="text-xs text-slate-600 font-medium uppercase mb-1">Total Cobrado</p>
                <p className="text-lg font-semibold text-slate-800">{formatearMonto(montoTotal, 'USD')}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded text-center min-w-[160px]">
                <p className="text-xs text-slate-600 font-medium uppercase mb-1">Costo Total</p>
                <p className="text-lg font-semibold text-slate-800">{formatearMonto(transaccion.total_costo || 0, 'USD')}</p>
              </div>
              <div className={`p-3 rounded text-center min-w-[160px] ${transaccion.margen_total >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <p className="text-xs text-slate-600 font-medium uppercase mb-1">Ganancia</p>
                <p className={`text-lg font-semibold ${transaccion.margen_total >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatearMonto(transaccion.margen_total || 0, 'USD')}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded text-center min-w-[160px]">
                <p className="text-xs text-slate-600 font-medium uppercase mb-1">Margen %</p>
                <p className={`text-lg font-semibold ${transaccion.margen_total >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {margenPorcentaje}%
                </p>
              </div>

              {/* Pagos */}
              {transaccion.metodo_pago && (
                <div className="bg-slate-50 p-3 rounded text-center min-w-[160px]">
                  <p className="text-xs text-slate-600 font-medium uppercase mb-1">{transaccion.metodo_pago.replace(/_/g, ' ')}</p>
                  <p className="text-lg font-semibold text-slate-800">{formatearMonto(transaccion.monto_pago_1 || 0, 'USD')}</p>
                </div>
              )}
              {transaccion.metodo_pago_2 && (
                <div className="bg-slate-50 p-3 rounded text-center min-w-[160px]">
                  <p className="text-xs text-slate-600 font-medium uppercase mb-1">{transaccion.metodo_pago_2.replace(/_/g, ' ')}</p>
                  <p className="text-lg font-semibold text-slate-800">{formatearMonto(transaccion.monto_pago_2 || 0, 'USD')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sección Meta */}
          <div className="border border-slate-200 rounded p-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center uppercase">INFORMACIÓN ADICIONAL</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-slate-600 font-medium uppercase mb-1">Cliente</p>
                <p className="text-slate-800 font-semibold">{transaccion.cliente_nombre || '-'}</p>
                <p className="text-xs text-slate-600 mt-1">
                  {transaccion.cliente_email && `${transaccion.cliente_email}`}
                  {transaccion.cliente_email && transaccion.cliente_telefono && ' - '}
                  {transaccion.cliente_telefono && `${transaccion.cliente_telefono}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium uppercase mb-1">Vendedor</p>
                <p className="text-slate-800">{transaccion.vendedor || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium uppercase mb-1">Sucursal</p>
                <p className="text-slate-800 capitalize">{transaccion.sucursal?.replace('_', ' ') || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium uppercase mb-1">Contabilizado</p>
                <p className={`text-slate-800 font-semibold ${transaccion.contabilizado ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {transaccion.contabilizado ? '✓ Sí' : '✗ No'}
                </p>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          {transaccion.observaciones && (
            <div className="border border-slate-200 rounded p-4 bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-800 mb-2 uppercase text-center">OBSERVACIONES</h3>
              <p className="text-slate-700 text-sm whitespace-pre-wrap text-center">{transaccion.observaciones}</p>
            </div>
          )}

          {/* Footer - Botones */}
          <div className="flex justify-center gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
            >
              Cerrar
            </button>
            {!transaccion.contabilizado && onEditar && (
              <button
                onClick={() => onEditar(transaccion)}
                className="px-6 py-2 rounded bg-slate-600 text-white font-semibold hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar Venta
              </button>
            )}
            {onEliminar && (
              <button
                onClick={() => onEliminar(transaccion)}
                className="px-6 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar Venta
              </button>
            )}
            <button
              onClick={() => {
                abrirReciboPDF(transaccion);
              }}
              className="px-6 py-2 rounded bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
            >
              Ver Recibo PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleVentaModal;
