/**
 * Funciones de cálculo para importaciones
 */

export const calculosImportacion = {
  /**
   * Calcula el precio total de un item (cantidad * precio unitario)
   */
  calcularPrecioTotal: (cantidad, precioUnitario) => {
    return cantidad * precioUnitario;
  },

  /**
   * Calcula el peso total estimado (cantidad * peso unitario)
   */
  calcularPesoTotal: (cantidad, pesoUnitario) => {
    return cantidad * pesoUnitario;
  },

  /**
   * Calcula el total de todos los items
   */
  calcularTotalItems: (items) => {
    return items.reduce((sum, item) => sum + (item.precio_total_usd || 0), 0);
  },

  /**
   * Calcula el peso total estimado de todos los items
   */
  calcularPesoTotalEstimado: (items) => {
    return items.reduce((sum, item) => sum + (item.peso_estimado_total_kg || 0), 0);
  },

  /**
   * Calcula el costo total de importación (courier + picking/shipping)
   */
  calcularCostoTotalImportacion: (pagoCourier = 0, costoPickingShipping = 0) => {
    return parseFloat(pagoCourier || 0) + parseFloat(costoPickingShipping || 0);
  },

  /**
   * Distribuye proporcionalmente los costos adicionales entre items
   */
  distribuirCostosAdicionales: (items, costoTotalAdicional) => {
    const totalPreciosItems = calculosImportacion.calcularTotalItems(items);

    if (totalPreciosItems === 0) {
      return items.map(item => ({
        ...item,
        costos_adicionales_usd: 0,
        costo_final_unitario_usd: item.precio_unitario_usd
      }));
    }

    return items.map(item => {
      const proporcion = item.precio_total_usd / totalPreciosItems;
      const costoAdicionalPorItem = proporcion * costoTotalAdicional;
      const costoFinalUnitario = item.precio_unitario_usd + (costoAdicionalPorItem / item.cantidad);

      return {
        ...item,
        costos_adicionales_usd: costoAdicionalPorItem,
        costo_final_unitario_usd: parseFloat(costoFinalUnitario.toFixed(2))
      };
    });
  },

  /**
   * Calcula el peso real unitario basado en peso total sin caja
   */
  calcularPesoRealUnitario: (pesoSinCajaTotal, cantidadProductosTotal) => {
    if (cantidadProductosTotal === 0) return 0;
    return pesoSinCajaTotal / cantidadProductosTotal;
  },

  /**
   * Calcula el costo estimado del courier basado en peso y precio por kg
   */
  calcularCourierEstimado: (pesoConCaja, precioPorKg) => {
    return pesoConCaja * precioPorKg;
  },

  /**
   * Genera un resumen de costos de la importación
   */
  generarResumenCostos: (items, datosRecepcion) => {
    const totalProductos = calculosImportacion.calcularTotalItems(items);
    const totalCourierYShipping = calculosImportacion.calcularCostoTotalImportacion(
      datosRecepcion.pago_courier_usd,
      datosRecepcion.costo_picking_shipping_usd
    );
    const costoTotal = totalProductos + totalCourierYShipping;
    const costoPorKg = datosRecepcion.peso_sin_caja_kg > 0
      ? costoTotal / datosRecepcion.peso_sin_caja_kg
      : 0;

    return {
      totalProductos: parseFloat(totalProductos.toFixed(2)),
      pagoCourier: parseFloat((datosRecepcion.pago_courier_usd || 0).toFixed(2)),
      costoPickingShipping: parseFloat((datosRecepcion.costo_picking_shipping_usd || 0).toFixed(2)),
      totalCostos: parseFloat(totalCourierYShipping.toFixed(2)),
      costoTotal: parseFloat(costoTotal.toFixed(2)),
      costoPorKg: parseFloat(costoPorKg.toFixed(2))
    };
  },

  /**
   * Formatea números para moneda
   */
  formatearUSD: (numero) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numero);
  },

  /**
   * Formatea números para peso
   */
  formatearPeso: (numero) => {
    return parseFloat(numero).toFixed(2) + ' kg';
  }
};

export default calculosImportacion;
