import { useState, useEffect } from 'react';

export const useCotizacionCalculator = (formData) => {
  const [totalCalculado, setTotalCalculado] = useState(0);

  useEffect(() => {
    const calcularTotal = () => {
      const precioCompra = parseFloat(formData.precio_compra_usd) || 0;
      const pesoEstimado = parseFloat(formData.peso_estimado_kg) || 0;
      const impuestos = parseFloat(formData.impuestos_usa_porcentaje) || 0;
      const envioUsa = parseFloat(formData.envio_usa_fijo) || 0;
      const envioArg = parseFloat(formData.envio_arg_fijo) || 0;
      const precioPorKg = parseFloat(formData.precio_por_kg) || 0;

      const subtotal = precioCompra + (precioCompra * impuestos / 100);
      const costoEnvioPeso = pesoEstimado * precioPorKg;
      const total = subtotal + envioUsa + envioArg + costoEnvioPeso;

      setTotalCalculado(total);
    };

    calcularTotal();
  }, [
    formData.precio_compra_usd,
    formData.peso_estimado_kg,
    formData.impuestos_usa_porcentaje,
    formData.envio_usa_fijo,
    formData.envio_arg_fijo,
    formData.precio_por_kg
  ]);

  return { totalCalculado };
};