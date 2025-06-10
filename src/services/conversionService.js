// services/conversionService.js
// Sistema de Conversión a Dólares - UPDATE WW SRL
// Todas las operaciones se guardan en USD como moneda base

import { supabase } from '../lib/supabase';

export const conversionService = {
  // 🔄 Convertir ARS a USD
  convertirArsAUsd(montoArs, cotizacion) {
    if (!cotizacion || cotizacion <= 0) {
      throw new Error('Cotización inválida. Debe ser mayor a 0');
    }
    
    if (cotizacion < 500 || cotizacion > 5000) {
      throw new Error('Cotización fuera del rango válido (500-5000)');
    }
    
    if (!montoArs || montoArs < 0) {
      throw new Error('Monto en ARS inválido');
    }
    
    return montoArs / cotizacion;
  },

  // 📝 Preparar movimiento para guardar (siempre en USD)
  prepararMovimiento(movimientoData, cuenta) {
    const { monto, cotizacion, tipo } = movimientoData; // tipo: 'debe' o 'haber'
    
    if (cuenta.requiere_cotizacion) {
      // 🇦🇷 Cuenta en ARS - convertir a USD
      if (!cotizacion) {
        throw new Error(`Cuenta "${cuenta.nombre}" requiere cotización para convertir ARS a USD`);
      }
      
      const montoUSD = this.convertirArsAUsd(monto, cotizacion);
      
      return {
        cuenta_id: cuenta.id,
        debe: tipo === 'debe' ? montoUSD : 0,
        haber: tipo === 'haber' ? montoUSD : 0,
        cotizacion_manual: cotizacion,
        monto_original_ars: monto,
        observaciones_cambio: `Convertido de $${monto.toLocaleString()} ARS a USD $${montoUSD.toFixed(2)} (cotización: $${cotizacion})`
      };
    } else {
      // 🇺🇸 Cuenta en USD - guardar directo
      return {
        cuenta_id: cuenta.id,
        debe: tipo === 'debe' ? monto : 0,
        haber: tipo === 'haber' ? monto : 0,
        cotizacion_manual: null,
        monto_original_ars: null,
        observaciones_cambio: null
      };
    }
  },

  // 💾 Guardar cotización manual para trazabilidad
  async guardarCotizacionManual(cotizacionData) {
    const { data, error } = await supabase
      .from('cotizaciones_manuales')
      .insert({
        fecha: cotizacionData.fecha,
        cotizacion: cotizacionData.cotizacion,
        usuario: cotizacionData.usuario || 'admin',
        observaciones: cotizacionData.observaciones,
        operacion_tipo: cotizacionData.tipo,
        operacion_id: cotizacionData.operacionId
      });

    if (error) {
      console.error('Error guardando cotización manual:', error);
      throw error;
    }

    return data;
  },

  // 📊 Calcular cotización promedio del asiento
  calcularCotizacionPromedio(movimientos) {
    const movimientosConCotizacion = movimientos.filter(mov => 
      mov.cuenta?.requiere_cotizacion && mov.cotizacion
    );
    
    if (movimientosConCotizacion.length === 0) {
      return null; // No hay movimientos en ARS
    }
    
    // Promedio ponderado por monto
    let sumaPonderada = 0;
    let sumaMontos = 0;
    
    movimientosConCotizacion.forEach(mov => {
      const peso = mov.monto || 0;
      sumaPonderada += (mov.cotizacion * peso);
      sumaMontos += peso;
    });
    
    return sumaMontos > 0 ? sumaPonderada / sumaMontos : null;
  },

  // ✅ Validar balance en USD
  validarBalanceUSD(movimientosConvertidos) {
    const totalDebe = movimientosConvertidos.reduce((sum, mov) => sum + (mov.debe || 0), 0);
    const totalHaber = movimientosConvertidos.reduce((sum, mov) => sum + (mov.haber || 0), 0);
    const diferencia = Math.abs(totalDebe - totalHaber);
    
    if (diferencia > 0.01) {
      throw new Error(
        `Asiento no balanceado en USD:\n` +
        `Debe: $${totalDebe.toFixed(2)} USD\n` +
        `Haber: $${totalHaber.toFixed(2)} USD\n` +
        `Diferencia: $${diferencia.toFixed(2)} USD`
      );
    }
    
    return { totalDebe, totalHaber, balanceado: true };
  },

  // 🔍 Obtener cuentas con información de moneda
  async obtenerCuentasConMoneda() {
    try {
      const { data, error } = await supabase
        .from('plan_cuentas')
        .select('id, codigo, nombre, moneda_original, requiere_cotizacion')
        .eq('activa', true)
        .order('codigo');

      if (error) {
        console.error('Error obteniendo cuentas:', error);
        // Si las nuevas columnas no existen, usar las básicas
        const { data: dataBasica, error: errorBasico } = await supabase
          .from('plan_cuentas')
          .select('id, codigo, nombre')
          .eq('activa', true)
          .order('codigo');
        
        if (errorBasico) {
          throw errorBasico;
        }
        
        // Agregar valores por defecto
        return dataBasica.map(cuenta => ({
          ...cuenta,
          moneda_original: 'USD',
          requiere_cotizacion: false
        }));
      }

      return data;
    } catch (err) {
      console.error('Error en obtenerCuentasConMoneda:', err);
      throw err;
    }
  },

  // 📈 Obtener última cotización usada
  async obtenerUltimaCotizacion() {
    try {
      const { data, error } = await supabase
        .from('cotizaciones_manuales')
        .select('cotizacion, fecha')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('Error obteniendo última cotización:', error);
        // Si la tabla no existe, retornar null sin error
        return null;
      }

      return data;
    } catch (err) {
      console.warn('Tabla cotizaciones_manuales no existe aún:', err);
      return null;
    }
  },

  // 🔄 Convertir asiento completo a USD
  async convertirAsientoAUSD(asientoData) {
    console.log('🔄 Iniciando conversión de asiento a USD...');
    
    // 1. Validar que todas las cuentas ARS tengan cotización
    const movimientosSinCotizacion = asientoData.movimientos.filter(
      mov => mov.cuenta?.requiere_cotizacion && (!mov.cotizacion || mov.cotizacion <= 0)
    );
    
    if (movimientosSinCotizacion.length > 0) {
      const cuentasSinCotizacion = movimientosSinCotizacion.map(mov => mov.cuenta.nombre).join(', ');
      throw new Error(`Faltan cotizaciones para cuentas en ARS: ${cuentasSinCotizacion}`);
    }

    // 2. Convertir todos los movimientos a USD
    const movimientosConvertidos = asientoData.movimientos.map(mov => {
      return this.prepararMovimiento(mov, mov.cuenta);
    });

    // 3. Validar balance en USD
    const balance = this.validarBalanceUSD(movimientosConvertidos);

    // 4. Calcular cotización promedio
    const cotizacionPromedio = this.calcularCotizacionPromedio(asientoData.movimientos);

    console.log('✅ Asiento convertido exitosamente:', {
      totalDebeUSD: balance.totalDebe,
      totalHaberUSD: balance.totalHaber,
      cotizacionPromedio,
      movimientos: movimientosConvertidos.length
    });

    return {
      movimientosConvertidos,
      totalDebeUSD: balance.totalDebe,
      totalHaberUSD: balance.totalHaber,
      cotizacionPromedio,
      balanceado: balance.balanceado
    };
  },

  // 🎨 Formatear monto para mostrar
  formatearMonto(monto, moneda = 'USD', mostrarMoneda = true) {
    if (!monto && monto !== 0) return '';
    
    const montoFormateado = new Intl.NumberFormat('es-AR', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(monto);
    
    return mostrarMoneda ? `$${montoFormateado} ${moneda}` : `$${montoFormateado}`;
  },

  // 📋 Crear resumen de conversión para mostrar al usuario
  crearResumenConversion(movimientos) {
    const resumen = {
      totalMovimientos: movimientos.length,
      movimientosARS: 0,
      movimientosUSD: 0,
      totalConvertidoARS: 0,
      totalResultanteUSD: 0,
      cotizaciones: []
    };

    movimientos.forEach(mov => {
      if (mov.cuenta?.requiere_cotizacion) {
        resumen.movimientosARS++;
        resumen.totalConvertidoARS += mov.monto || 0;
        if (mov.cotizacion && !resumen.cotizaciones.includes(mov.cotizacion)) {
          resumen.cotizaciones.push(mov.cotizacion);
        }
      } else {
        resumen.movimientosUSD++;
      }
      
      resumen.totalResultanteUSD += (mov.tipo === 'debe' ? mov.monto : mov.monto) || 0;
    });

    return resumen;
  }
};

export default conversionService;