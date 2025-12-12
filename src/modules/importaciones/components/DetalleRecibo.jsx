import React from 'react';
import { X } from 'lucide-react';
import { ESTADOS_IMPORTACION, LABELS_ESTADOS, COLORES_ESTADOS } from '../constants/estadosImportacion';

const DetalleRecibo = ({ recibo, onClose }) => {
  const formatNumber = (num) => {
    return Math.round(num).toLocaleString('es-AR');
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
    'cuenta_corriente': '🏷️ Cuenta Corriente'
  };

  const getMetodoPagoLabel = (metodo) => {
    return METODOS_PAGO_LABELS[metodo] || metodo;
  };

  const getEstadoColor = (estado) => {
    return COLORES_ESTADOS[estado] || 'text-slate-800 bg-slate-100';
  };

  const getEstadoLabel = (estado) => {
    return LABELS_ESTADOS[estado] || estado;
  };

  const totalProductos = (recibo.importaciones_items || []).reduce((sum, item) => sum + (item.precio_total_usd || 0), 0);
  const totalCostos = (recibo.costo_total_importacion_usd || 0);
  const totalGeneral = totalProductos + totalCostos;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="p-6 bg-slate-800 text-white flex justify-between items-center sticky top-0">
          <div>
            <h3 className="text-xl font-semibold">Detalle de Importación</h3>
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
                  <p className="font-medium text-slate-800 mt-1">{recibo.proveedores?.nombre || '-'}</p>
                </div>

                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Estado</label>
                  <span className={`px-3 py-1 rounded text-xs font-semibold ${getEstadoColor(recibo.estado)} inline-block mt-1`}>
                    {getEstadoLabel(recibo.estado)}
                  </span>
                </div>

                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Fecha Compra</label>
                  <p className="font-medium text-slate-800 mt-1">{formatDate(recibo.fecha_compra)}</p>
                </div>

                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Método Pago</label>
                  <p className="font-medium text-slate-800 mt-1 text-xs">{getMetodoPagoLabel(recibo.metodo_pago)}</p>
                </div>

                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">Empresa Logística</label>
                  <p className="font-medium text-slate-800 mt-1">{recibo.empresa_logistica || '-'}</p>
                </div>

                {recibo.tracking_number && (
                  <div className="text-center md:col-span-3">
                    <label className="text-xs font-semibold text-slate-500 uppercase block">Tracking Number</label>
                    <p className="font-medium text-slate-800 mt-1">{recibo.tracking_number}</p>
                  </div>
                )}

                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">F. Est. Ingreso</label>
                  <p className="font-medium text-slate-800 mt-1">{formatDate(recibo.fecha_estimada_ingreso)}</p>
                </div>

                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">F. Ingreso Depósito USA</label>
                  <p className="font-medium text-slate-800 mt-1">{formatDate(recibo.fecha_ingreso_deposito_usa)}</p>
                </div>

                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase block">F. Recepción Argentina</label>
                  <p className="font-medium text-slate-800 mt-1">{formatDate(recibo.fecha_recepcion_argentina)}</p>
                </div>

                {recibo.cliente_id && (
                  <div className="text-center md:col-span-3">
                    <label className="text-xs font-semibold text-slate-500 uppercase block">Cliente</label>
                    <p className="font-medium text-slate-800 mt-1">
                      {recibo.clientes ? `${recibo.clientes.nombre} ${recibo.clientes.apellido}` : '-'}
                    </p>
                  </div>
                )}
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
              <h4 className="font-semibold text-slate-800 uppercase">Productos ({(recibo.importaciones_items || []).length})</h4>
            </div>
            <div className="border border-slate-300 border-t-0 rounded-b overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Producto</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Cant.</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">P. Unit. USD</th>
                    {recibo.estado === ESTADOS_IMPORTACION.EN_TRANSITO_USA && (
                      <>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Peso Total (kg)</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Precio Total USD</th>
                      </>
                    )}
                    {recibo.estado === ESTADOS_IMPORTACION.EN_DEPOSITO_USA && (
                      <>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Peso Total (kg)</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Precio Total USD</th>
                      </>
                    )}
                    {recibo.estado === ESTADOS_IMPORTACION.RECEPCIONADO && (
                      <>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Peso Est. (kg)</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Peso Real (kg)</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Costo Adic. USD</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">P. Unit. Total USD</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Precio Total USD</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(recibo.importaciones_items || []).map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-4 py-3 text-slate-800">
                        <div>{item.item}</div>
                        {item.link_producto && (
                          <a
                            href={item.link_producto}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-600 hover:text-emerald-700"
                          >
                            Ver link
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">{item.cantidad}</td>
                      <td className="px-4 py-3 text-center text-slate-600">${formatNumber(item.precio_unitario_usd)}</td>
                      {recibo.estado === ESTADOS_IMPORTACION.EN_TRANSITO_USA && (
                        <>
                          <td className="px-4 py-3 text-center text-slate-600">
                            {item.peso_estimado_total_kg ? item.peso_estimado_total_kg.toFixed(2) : '-'}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-slate-800">
                            ${formatNumber(item.precio_total_usd || 0)}
                          </td>
                        </>
                      )}
                      {recibo.estado === ESTADOS_IMPORTACION.EN_DEPOSITO_USA && (
                        <>
                          <td className="px-4 py-3 text-center text-slate-600">
                            {item.peso_estimado_total_kg ? item.peso_estimado_total_kg.toFixed(2) : '-'}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-slate-800">
                            ${formatNumber(item.precio_total_usd || 0)}
                          </td>
                        </>
                      )}
                      {recibo.estado === ESTADOS_IMPORTACION.RECEPCIONADO && (
                        <>
                          <td className="px-4 py-3 text-center text-slate-600">
                            {item.peso_estimado_unitario_kg ? item.peso_estimado_unitario_kg.toFixed(2) : '-'}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600">
                            {item.peso_real_unitario_kg ? item.peso_real_unitario_kg.toFixed(2) : '-'}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-slate-800">
                            {item.costos_adicionales_usd ? `$${formatNumber(item.costos_adicionales_usd)}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-slate-800">
                            ${formatNumber(item.precio_unitario_usd + (item.costos_adicionales_usd || 0))}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-slate-800">
                            ${formatNumber((item.precio_unitario_usd + (item.costos_adicionales_usd || 0)) * item.cantidad)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* INFORMACIÓN DE RECEPCIÓN (si está recepcionada) */}
          {recibo.estado === ESTADOS_IMPORTACION.RECEPCIONADO && (
            <div className="space-y-3">
              <div className="bg-slate-200 p-4 rounded-t border border-slate-300">
                <h4 className="font-semibold text-slate-800 uppercase">Información de Recepción</h4>
              </div>
              <div className="border border-slate-300 border-t-0 rounded-b p-4">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                    <div className="text-center">
                      <label className="text-xs font-semibold text-slate-500 uppercase block">Peso con Caja</label>
                      <p className="font-medium text-slate-800 mt-1">{formatNumber(recibo.peso_total_con_caja_kg)} kg</p>
                    </div>

                    <div className="text-center">
                      <label className="text-xs font-semibold text-slate-500 uppercase block">Peso sin Caja</label>
                      <p className="font-medium text-slate-800 mt-1">{formatNumber(recibo.peso_sin_caja_kg)} kg</p>
                    </div>

                    <div className="text-center">
                      <label className="text-xs font-semibold text-slate-500 uppercase block">Precio por KG</label>
                      <p className="font-medium text-slate-800 mt-1">USD ${formatNumber(recibo.precio_por_kg_usd)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                    <div className="text-center">
                      <label className="text-xs font-semibold text-slate-500 uppercase block">Pago Courier</label>
                      <p className="font-medium text-slate-800 mt-1">USD ${formatNumber(recibo.pago_courier_usd)}</p>
                    </div>

                    <div className="text-center">
                      <label className="text-xs font-semibold text-slate-500 uppercase block">Picking/Shipping</label>
                      <p className="font-medium text-slate-800 mt-1">USD ${formatNumber(recibo.costo_picking_shipping_usd)}</p>
                    </div>

                    <div className="text-center">
                      <label className="text-xs font-semibold text-slate-500 uppercase block">Costo Total Adicional</label>
                      <p className="font-medium text-slate-800 mt-1">USD ${formatNumber(totalCostos)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                    <div className="text-center">
                      <label className="text-xs font-semibold text-slate-500 uppercase block">Costo Productos</label>
                      <p className="font-medium text-slate-800 mt-1">USD ${formatNumber(totalProductos)}</p>
                    </div>

                    <div className="text-center">
                      <label className="text-xs font-semibold text-slate-500 uppercase block">Costo Total Final</label>
                      <p className="font-medium text-slate-800 mt-1">USD ${formatNumber(totalGeneral)}</p>
                    </div>

                    <div className="text-center">
                      <label className="text-xs font-semibold text-slate-500 uppercase block">Cantidad de Productos</label>
                      <p className="font-medium text-slate-800 mt-1">{(recibo.importaciones_items || []).reduce((sum, item) => sum + (item.cantidad || 0), 0)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BOTÓN CERRAR */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-700 text-white rounded hover:bg-black transition-colors font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleRecibo;
