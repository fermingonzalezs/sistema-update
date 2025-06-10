// services/conversionService.js
// Sistema de Conversión a Dólares - UPDATE WW SRL
// Todas las operaciones se guardan en USD como moneda base

import { supabase } from '../lib/supabase';
import { cotizacionSimple } from './cotizacionSimpleService';

export const conversionService = {
  // 🔄 Convertir ARS a USD (método original - mantener por compatibilidad)
  convertirArsAUsd(montoArs, cotizacion) {
    if (!cotizacion || cotizacion <= 0) {
      throw new Error('Cotización inválida. Debe ser mayor a 0');
    }
    
    if (cotizacion < 500 || cotizacion > 10000) {
      throw new Error('Cotización fuera del rango válido (500-10000)');
    }
    
    if (!montoArs || montoArs < 0) {
      throw new Error('Monto en ARS inválido');
    }
    
    return montoArs / cotizacion;
  },

  // 🆕 Convertir ARS a USD usando cotización automática simple
  async convertirArsAUsdAutomatico(montoArs) {
    console.log('💱 Conversión automática ARS → USD:', { montoArs });
    
    if (!montoArs || montoArs < 0) {
      throw new Error('Monto en ARS inválido');
    }
    
    try {
      const resultado = await cotizacionSimple.convertirARSaUSD(montoArs);
      console.log('✅ Conversión automática exitosa:', resultado);
      return resultado;
      
    } catch (error) {
      console.error('❌ Error en conversión automática:', error);
      throw new Error(`Error obteniendo cotización automática: ${error.message}`);
    }
  },

  // 🆕 Convertir USD a ARS usando cotización automática simple
  async convertirUsdAArsAutomatico(montoUsd) {
    console.log('💱 Conversión automática USD → ARS:', { montoUsd });
    
    if (!montoUsd || montoUsd < 0) {
      throw new Error('Monto en USD inválido');
    }
    
    try {
      const resultado = await cotizacionSimple.convertirUSDaARS(montoUsd);
      console.log('✅ Conversión automática exitosa:', resultado);
      return resultado;
      
    } catch (error) {
      console.error('❌ Error en conversión automática:', error);
      throw new Error(`Error obteniendo cotización automática: ${error.message}`);
    }
  },

  // 📝 Preparar movimiento para guardar (siempre en USD) - Versión simplificada
  async prepararMovimientoConCotizacionAutomatica(movimientoData, cuenta) {
    const { monto, tipo, cotizacionManual } = movimientoData; // tipo: 'debe' o 'haber'
    
    if (cuenta.requiere_cotizacion || cuenta.moneda_original === 'ARS') {
      // 🇦🇷 Cuenta en ARS - convertir a USD
      let resultadoConversion;
      
      if (cotizacionManual && cotizacionManual > 0) {
        // Usar cotización manual si se especifica
        console.log('💰 Usando cotización manual:', cotizacionManual);
        const montoUSD = this.convertirArsAUsd(monto, cotizacionManual);
        resultadoConversion = {
          montoOriginalARS: monto,
          montoUSD: montoUSD,
          cotizacionUsada: cotizacionManual,
          fuenteCotizacion: 'MANUAL'
        };
      } else {
        // Usar cotización automática
        console.log('🤖 Usando cotización automática...');
        resultadoConversion = await this.convertirArsAUsdAutomatico(monto);
      }
      
      return {
        cuenta_id: cuenta.id,
        debe: tipo === 'debe' ? resultadoConversion.montoUSD : 0,
        haber: tipo === 'haber' ? resultadoConversion.montoUSD : 0,
        monto_original_ars: resultadoConversion.montoOriginalARS,
        cotizacion_manual: resultadoConversion.cotizacionUsada,
        observaciones_cambio: `Convertido: $${monto} ARS → $${resultadoConversion.montoUSD.toFixed(4)} USD (${resultadoConversion.fuenteCotizacion}: $${resultadoConversion.cotizacionUsada})`
      };
    } else {
      // 🇺🇸 Cuenta en USD - guardar directo
      return {
        cuenta_id: cuenta.id,
        debe: tipo === 'debe' ? monto : 0,
        haber: tipo === 'haber' ? monto : 0,
        monto_original_ars: null,
        cotizacion_manual: null,
        observaciones_cambio: null
      };
    }
  },

  // 📝 Preparar movimiento para guardar (versión original - mantener compatibilidad)
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

  // ✅ Validar balance en USD - Versión simplificada
  validarBalanceUSD(movimientosConvertidos, tolerancia = 0.01) {
    const totalDebe = movimientosConvertidos.reduce((sum, mov) => sum + (parseFloat(mov.debe) || 0), 0);
    const totalHaber = movimientosConvertidos.reduce((sum, mov) => sum + (parseFloat(mov.haber) || 0), 0);
    const diferencia = Math.abs(totalDebe - totalHaber);
    const esBalanceado = diferencia <= tolerancia;
    
    const resultado = {
      totalDebe: parseFloat(totalDebe.toFixed(4)),
      totalHaber: parseFloat(totalHaber.toFixed(4)),
      diferencia: parseFloat(diferencia.toFixed(4)),
      balanceado: esBalanceado
    };
    
    console.log('🔍 Validación de balance USD:', resultado);
    
    if (!esBalanceado) {
      throw new Error(
        `Asiento no balanceado en USD:\n` +
        `Debe: $${resultado.totalDebe.toFixed(4)} USD\n` +
        `Haber: $${resultado.totalHaber.toFixed(4)} USD\n` +
        `Diferencia: $${resultado.diferencia.toFixed(4)} USD`
      );
    }
    
    return resultado;
  },


  // 🆕 Obtener cotización actual
  async obtenerCotizacionActual() {
    try {
      const cotizacion = await cotizacionSimple.obtenerCotizacion();
      return {
        valor: cotizacion.valor,
        fuente: cotizacion.fuente,
        timestamp: cotizacion.timestamp
      };
    } catch (error) {
      console.error('❌ Error obteniendo cotización:', error);
      throw error;
    }
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

  // 🎨 Formatear monto para mostrar - DEPRECADO: usar formatters.js
  formatearMonto(monto, moneda = 'USD', mostrarMoneda = true) {
    if (!monto && monto !== 0) return '';
    
    const numero = parseFloat(monto).toFixed(2);
    const formateado = parseFloat(numero).toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    if (mostrarMoneda && moneda === 'USD') {
      return `U$${formateado}`;
    } else if (mostrarMoneda && moneda === 'ARS') {
      return `$${formateado}`;
    }
    
    return mostrarMoneda ? `U$${formateado}` : formateado;
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