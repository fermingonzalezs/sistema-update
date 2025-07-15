import React from 'react';
import { formatearMonto } from '../../../shared/utils/formatters.js';

const CotizacionCalculator = ({ formData, totalCalculado }) => {
  const formatCurrency = (amount) => formatearMonto(amount, 'USD');

  return (
    <div className="bg-slate-50 p-4 rounded">
      <h4 className="font-medium text-slate-700 mb-2">Desglose del cálculo:</h4>
      <div className="text-sm text-slate-600 space-y-1">
        <div className="flex justify-between">
          <span>Precio del producto:</span>
          <span>{formatCurrency(parseFloat(formData.precio_compra_usd) || 0)}</span>
        </div>
        <div className="flex justify-between">
          <span>Impuestos USA ({formData.impuestos_usa_porcentaje}%):</span>
          <span>{formatCurrency((parseFloat(formData.precio_compra_usd) || 0) * (parseFloat(formData.impuestos_usa_porcentaje) || 0) / 100)}</span>
        </div>
        <div className="flex justify-between">
          <span>Envío USA:</span>
          <span>{formatCurrency(parseFloat(formData.envio_usa_fijo) || 0)}</span>
        </div>
        <div className="flex justify-between">
          <span>Envío ARG:</span>
          <span>{formatCurrency(parseFloat(formData.envio_arg_fijo) || 0)}</span>
        </div>
        <div className="flex justify-between">
          <span>Costo por peso ({formData.peso_estimado_kg} kg × {formatCurrency(parseFloat(formData.precio_por_kg) || 0)}):</span>
          <span>{formatCurrency((parseFloat(formData.peso_estimado_kg) || 0) * (parseFloat(formData.precio_por_kg) || 0))}</span>
        </div>
        <div className="border-t pt-2 flex justify-between font-bold text-emerald-600">
          <span>Total:</span>
          <span>{formatCurrency(totalCalculado)}</span>
        </div>
      </div>
    </div>
  );
};

export default CotizacionCalculator;