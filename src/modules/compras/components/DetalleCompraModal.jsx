import React from 'react';
import { X, Calendar, Building2, CreditCard, Package, DollarSign } from 'lucide-react';

const DetalleCompraModal = ({ isOpen, onClose, recibo = null }) => {
  if (!isOpen || !recibo) return null;

  const total = (recibo.compras_items || []).reduce((sum, item) => {
    return sum + ((parseInt(item.cantidad) || 0) * (parseFloat(item.precio_unitario) || 0));
  }, 0);

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'borrador':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">📝 Borrador</span>;
      case 'procesado':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">✅ Procesado</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-sm font-medium">{estado}</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-slate-800 text-white p-6 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-semibold">Detalle de Compra</h2>
            <p className="text-slate-300 mt-1">Recibo #{recibo.numero_recibo}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Estado */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-2">Estado</h3>
              {getEstadoBadge(recibo.estado)}
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Creado</p>
              <p className="text-sm font-medium text-slate-800">
                {new Date(recibo.created_at).toLocaleDateString('es-AR')}
              </p>
            </div>
          </div>

          {/* Grid de información */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg">
            {/* Proveedor */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Building2 size={18} className="text-slate-600" />
                <label className="text-sm font-medium text-slate-700">Proveedor</label>
              </div>
              <p className="text-slate-800 font-semibold">{recibo.proveedor}</p>
            </div>

            {/* Fecha */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={18} className="text-slate-600" />
                <label className="text-sm font-medium text-slate-700">Fecha de Compra</label>
              </div>
              <p className="text-slate-800 font-semibold">
                {new Date(recibo.fecha_compra).toLocaleDateString('es-AR')}
              </p>
            </div>

            {/* Método de Pago */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CreditCard size={18} className="text-slate-600" />
                <label className="text-sm font-medium text-slate-700">Método de Pago</label>
              </div>
              <p className="text-slate-800 font-semibold capitalize">
                {recibo.metodo_pago?.replace(/_/g, ' ')}
              </p>
            </div>

            {/* Total */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={18} className="text-emerald-600" />
                <label className="text-sm font-medium text-slate-700">Total</label>
              </div>
              <p className="text-slate-800 font-bold text-lg">${total.toFixed(2)}</p>
            </div>
          </div>

          {/* Observaciones */}
          {recibo.observaciones && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Observaciones</label>
              <div className="bg-slate-50 p-4 rounded border border-slate-200">
                <p className="text-slate-800 whitespace-pre-wrap">{recibo.observaciones}</p>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="border border-slate-200 rounded">
            <div className="bg-slate-800 text-white p-4">
              <div className="flex items-center gap-3">
                <Package size={20} />
                <h3 className="font-semibold">Productos ({(recibo.compras_items || []).length})</h3>
              </div>
            </div>

            {(!recibo.compras_items || recibo.compras_items.length === 0) ? (
              <div className="p-8 text-center text-slate-500">
                <Package size={32} className="mx-auto mb-2 text-slate-300" />
                <p>No hay items en esta compra</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-700">Producto</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-slate-700">Cantidad</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-700">Serial</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-700">Precio Unit.</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-700">Subtotal</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-700">Descripción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {recibo.compras_items.map((item, idx) => {
                      const subtotal = (parseInt(item.cantidad) || 0) * (parseFloat(item.precio_unitario) || 0);
                      return (
                        <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="px-4 py-3 text-sm text-slate-800">{item.producto}</td>
                          <td className="px-4 py-3 text-center text-sm text-slate-800">{item.cantidad}</td>
                          <td className="px-4 py-3 text-sm text-slate-800">{item.serial || '-'}</td>
                          <td className="px-4 py-3 text-right text-sm text-slate-800">${parseFloat(item.precio_unitario).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-slate-800">${subtotal.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.descripcion || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100 border-t border-slate-200 font-semibold">
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-right">TOTAL:</td>
                      <td colSpan="2" className="px-4 py-3 text-right flex items-center gap-2 justify-end">
                        <DollarSign size={16} />
                        {total.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-6 flex justify-end border-t border-slate-200">
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
