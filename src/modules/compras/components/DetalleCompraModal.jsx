import React from 'react';
import { X, Edit2, Trash2 } from 'lucide-react';

const DetalleCompraModal = ({ isOpen, onClose, recibo = null, onEdit, onDelete, isLoading = false }) => {
  if (!isOpen || !recibo) return null;

  const formatNumber = (num) => {
    return parseFloat(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-AR');
  };

  const METODOS_PAGO_LABELS = {
    'efectivo_pesos': '💵 Efectivo en Pesos',
    'dolares_billete': '💸 Dólares Billete',
    'transferencia': '🏦 Transferencia',
    'criptomonedas': '₿ Criptomonedas',
    'tarjeta_credito': '💳 Tarjeta de Crédito',
    'cuenta_corriente': '🏷️ Cuenta Corriente',
    'cliente_abona': '👤 Cliente Abona'
  };

  const getMetodoPagoLabel = (metodo) => {
    return METODOS_PAGO_LABELS[metodo] || metodo;
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'en_camino':
        return 'text-yellow-800 bg-yellow-100';
      case 'ingresado':
        return 'text-green-800 bg-green-100';
      default:
        return 'text-slate-800 bg-slate-100';
    }
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      'en_camino': 'EN CAMINO',
      'ingresado': 'INGRESADO'
    };
    return labels[estado] || estado;
  };

  const total = (recibo.compras_items || []).reduce((sum, item) => {
    const precioUnitarioConCostos = parseFloat(item.precio_unitario) + parseFloat(item.costos_adicionales || 0);
    return sum + (precioUnitarioConCostos * parseInt(item.cantidad));
  }, 0);

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="p-6 bg-slate-800 text-white flex justify-between items-center sticky top-0">
          <div>
            <h3 className="text-xl font-semibold">Detalle de Compra Local</h3>
            <p className="text-slate-300 text-sm mt-1">{recibo.numero_recibo}</p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* INFORMACIÓN GENERAL */}
          <div className="space-y-3">
            <div className="bg-slate-200 p-4 rounded-t border border-slate-300">
              <h4 className="font-semibold text-slate-800 uppercase">Información General</h4>
            </div>
            <div className="border border-slate-300 border-t-0 rounded-b p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Recibo</label>
                  <p className="font-medium text-slate-800 mt-1">{recibo.numero_recibo}</p>
                </div>

                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Proveedor</label>
                  <p className="font-medium text-slate-800 mt-1">{recibo.proveedor || '-'}</p>
                </div>

                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Estado</label>
                  <span className={`px-3 py-1 rounded text-xs font-semibold ${getEstadoColor(recibo.estado)} inline-block mt-1`}>
                    {getEstadoLabel(recibo.estado)}
                  </span>
                </div>

                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Fecha Compra</label>
                  <p className="font-medium text-slate-800 mt-1">{formatDate(recibo.fecha)}</p>
                </div>

                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Método Pago</label>
                  <p className="font-medium text-slate-800 mt-1 text-xs">{getMetodoPagoLabel(recibo.metodo_pago)}</p>
                </div>

                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Costos Adic.</label>
                  <p className="font-medium text-slate-800 mt-1">U$ {formatNumber(recibo.costos_adicionales)}</p>
                </div>
              </div>

              {recibo.observaciones && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <label className="text-xs font-semibold text-slate-500 uppercase block mb-2">Observaciones</label>
                  <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded p-3">
                    {recibo.observaciones}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* PRODUCTOS */}
          <div className="space-y-3">
            <div className="bg-slate-200 p-4 rounded-t border border-slate-300">
              <h4 className="font-semibold text-slate-800 uppercase">Productos ({(recibo.compras_items || []).length})</h4>
            </div>
            <div className="border border-slate-300 border-t-0 rounded-b overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Producto</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Cant.</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Serial</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">P. Unit. USD</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Costos Adic. USD</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Precio Total USD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(recibo.compras_items || []).map((item, idx) => {
                    const precioUnitarioConCostos = parseFloat(item.precio_unitario) + parseFloat(item.costos_adicionales || 0);
                    return (
                      <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="px-4 py-3 text-slate-800">{item.producto}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{item.cantidad}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{item.serial || '-'}</td>
                        <td className="px-4 py-3 text-center text-slate-600">U$ {formatNumber(item.precio_unitario)}</td>
                        <td className="px-4 py-3 text-center text-slate-600">U$ {formatNumber(item.costos_adicionales || 0)}</td>
                        <td className="px-4 py-3 text-center font-semibold text-slate-800">U$ {formatNumber(precioUnitarioConCostos * item.cantidad)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-800 text-white">
                  <tr>
                    <td colSpan="4" className="px-4 py-3 text-sm font-semibold text-right">TOTAL:</td>
                    <td colSpan="2" className="px-4 py-3 text-sm font-semibold text-center">U$ {formatNumber(total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* FOOTER CON ACCIONES */}
        <div className="bg-slate-50 p-6 flex justify-end gap-3 border-t border-slate-200">
          <button
            onClick={() => {
              if (window.confirm('¿Eliminar esta compra?')) {
                onDelete(recibo.id);
              }
            }}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
          >
            <Trash2 size={18} />
            Eliminar
          </button>
          <button
            onClick={() => onEdit(recibo)}
            disabled={isLoading}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
          >
            <Edit2 size={18} />
            Editar
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetalleCompraModal;
