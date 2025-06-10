// Servicio simple para obtener cotización USD/ARS en tiempo real
// No almacena datos, solo obtiene y convierte

class CotizacionSimpleService {
  constructor() {
    this.cotizacionActual = null;
    this.ultimaActualizacion = null;
    this.cacheDuracion = 5 * 60 * 1000; // 5 minutos
    this.cotizacionFallback = 1000; // Cotización de emergencia
  }

  /**
   * Obtiene la cotización actual del dólar desde InfoDolar
   * @returns {Promise<Object>} Objeto con la cotización
   */
  async obtenerCotizacion() {
    // Verificar cache
    if (this.cotizacionActual && this.ultimaActualizacion && 
        (Date.now() - this.ultimaActualizacion) < this.cacheDuracion) {
      console.log('💰 Usando cotización en cache:', this.cotizacionActual);
      return this.cotizacionActual;
    }

    console.log('🌐 Obteniendo cotización desde InfoDolar...');

    try {
      // Intentar obtener desde InfoDolar usando un proxy CORS o una API alternativa
      // Como InfoDolar tiene CORS, usaremos APIs alternativas que funcionen
      const cotizacion = await this.obtenerDesdeDolarApi();
      
      // Guardar en cache
      this.cotizacionActual = cotizacion;
      this.ultimaActualizacion = Date.now();
      
      console.log('✅ Cotización obtenida:', cotizacion);
      return cotizacion;

    } catch (error) {
      console.warn('⚠️ Error obteniendo cotización:', error.message);
      
      // Usar cotización de cache si está disponible
      if (this.cotizacionActual) {
        console.log('📦 Usando última cotización en cache');
        return this.cotizacionActual;
      }

      // Último recurso: cotización de emergencia
      console.warn('🚨 Usando cotización de emergencia:', this.cotizacionFallback);
      const cotizacionEmergencia = {
        valor: this.cotizacionFallback,
        fuente: 'EMERGENCIA',
        timestamp: new Date().toLocaleString('es-AR'),
        error: true
      };
      
      this.cotizacionActual = cotizacionEmergencia;
      this.ultimaActualizacion = Date.now();
      
      return cotizacionEmergencia;
    }
  }

  /**
   * Obtiene cotización desde DolarAPI (alternativa funcional)
   */
  async obtenerDesdeDolarApi() {
    try {
      const response = await fetch('https://dolarapi.com/v1/dolares/blue', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validar datos
      if (!data.venta || data.venta <= 0) {
        throw new Error('Cotización inválida recibida');
      }

      return {
        valor: parseFloat(data.venta),
        compra: parseFloat(data.compra),
        venta: parseFloat(data.venta),
        fuente: 'DolarAPI',
        timestamp: new Date().toLocaleString('es-AR'),
        error: false
      };

    } catch (error) {
      console.error('❌ Error con DolarAPI:', error);
      throw error;
    }
  }

  /**
   * Intenta obtener desde InfoDolar usando fetch (probablemente fallará por CORS)
   */
  async obtenerDesdeInfoDolar() {
    try {
      // Nota: Esto probablemente fallará por CORS, pero lo intentamos
      const response = await fetch('https://www.infodolar.com/', {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (compatible; Sistema Contable)'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      
      // Buscar el valor en el HTML usando regex (simulando el xpath)
      // xpath: //*[@id="DolarPromedio"]/tbody/tr[1]/td[3]
      const regex = /<table[^>]*id=["\']DolarPromedio["\'][^>]*>.*?<tbody>.*?<tr[^>]*>.*?<td[^>]*>.*?<\/td>.*?<td[^>]*>.*?<\/td>.*?<td[^>]*>(.*?)<\/td>/s;
      const match = html.match(regex);
      
      if (!match || !match[1]) {
        throw new Error('No se pudo extraer la cotización del HTML');
      }

      const valorTexto = match[1].trim().replace(/[^\d.,]/g, '');
      const valor = parseFloat(valorTexto.replace(',', '.'));
      
      if (isNaN(valor) || valor <= 0) {
        throw new Error('Valor de cotización inválido');
      }

      return {
        valor: valor,
        fuente: 'InfoDolar',
        timestamp: new Date().toLocaleString('es-AR'),
        error: false
      };

    } catch (error) {
      console.error('❌ Error con InfoDolar:', error);
      throw error;
    }
  }

  /**
   * Convierte ARS a USD
   * @param {number} montoARS - Monto en pesos argentinos
   * @param {Object} cotizacion - Cotización (opcional, usa actual si no se especifica)
   * @returns {Promise<Object>} Resultado de conversión
   */
  async convertirARSaUSD(montoARS, cotizacion = null) {
    if (!cotizacion) {
      cotizacion = await this.obtenerCotizacion();
    }

    const montoUSD = parseFloat((montoARS / cotizacion.valor).toFixed(4));
    
    return {
      montoOriginalARS: montoARS,
      montoUSD: montoUSD,
      cotizacionUsada: cotizacion.valor,
      fuenteCotizacion: cotizacion.fuente,
      timestamp: cotizacion.timestamp
    };
  }

  /**
   * Convierte USD a ARS
   * @param {number} montoUSD - Monto en dólares
   * @param {Object} cotizacion - Cotización (opcional, usa actual si no se especifica)
   * @returns {Promise<Object>} Resultado de conversión
   */
  async convertirUSDaARS(montoUSD, cotizacion = null) {
    if (!cotizacion) {
      cotizacion = await this.obtenerCotizacion();
    }

    const montoARS = parseFloat((montoUSD * cotizacion.valor).toFixed(2));
    
    return {
      montoOriginalUSD: montoUSD,
      montoARS: montoARS,
      cotizacionUsada: cotizacion.valor,
      fuenteCotizacion: cotizacion.fuente,
      timestamp: cotizacion.timestamp
    };
  }

  /**
   * Valida que un asiento esté balanceado en USD
   * @param {Array} movimientos - Array de movimientos del asiento
   * @returns {Object} Resultado de validación
   */
  validarBalanceUSD(movimientos) {
    const totalDebe = movimientos.reduce((sum, mov) => sum + (parseFloat(mov.debe) || 0), 0);
    const totalHaber = movimientos.reduce((sum, mov) => sum + (parseFloat(mov.haber) || 0), 0);
    const diferencia = Math.abs(totalDebe - totalHaber);
    const balanceado = diferencia <= 0.01;

    return {
      totalDebe: parseFloat(totalDebe.toFixed(4)),
      totalHaber: parseFloat(totalHaber.toFixed(4)),
      diferencia: parseFloat(diferencia.toFixed(4)),
      balanceado: balanceado,
      mensaje: balanceado ? 
        'Asiento balanceado correctamente' : 
        `Asiento desbalanceado: diferencia de $${diferencia.toFixed(4)} USD`
    };
  }

  /**
   * Prepara un movimiento contable con conversión automática
   * @param {Object} movimientoData - Datos del movimiento
   * @param {Object} cuenta - Información de la cuenta
   * @returns {Promise<Object>} Movimiento preparado
   */
  async prepararMovimiento(movimientoData, cuenta) {
    const { monto, tipo, cotizacionManual } = movimientoData; // tipo: 'debe' o 'haber'
    
    if (cuenta.moneda_original === 'ARS' || cuenta.requiere_cotizacion) {
      // Cuenta en pesos - convertir a USD
      let conversion;
      
      if (cotizacionManual && cotizacionManual > 0) {
        // Usar cotización manual
        conversion = {
          montoOriginalARS: monto,
          montoUSD: monto / cotizacionManual,
          cotizacionUsada: cotizacionManual,
          fuenteCotizacion: 'MANUAL',
          timestamp: new Date().toLocaleString('es-AR')
        };
      } else {
        // Usar cotización automática
        conversion = await this.convertirARSaUSD(monto);
      }
      
      return {
        cuenta_id: cuenta.id,
        debe: tipo === 'debe' ? conversion.montoUSD : 0,
        haber: tipo === 'haber' ? conversion.montoUSD : 0,
        monto_original_ars: conversion.montoOriginalARS,
        cotizacion_usada: conversion.cotizacionUsada,
        fuente_cotizacion: conversion.fuenteCotizacion,
        observaciones: `Convertido: $${monto} ARS → $${conversion.montoUSD.toFixed(4)} USD (cotización: $${conversion.cotizacionUsada})`
      };
    } else {
      // Cuenta en USD - usar directo
      return {
        cuenta_id: cuenta.id,
        debe: tipo === 'debe' ? monto : 0,
        haber: tipo === 'haber' ? monto : 0,
        monto_original_ars: null,
        cotizacion_usada: null,
        fuente_cotizacion: null,
        observaciones: null
      };
    }
  }

  /**
   * Fuerza actualización de cotización (ignora cache)
   */
  async forzarActualizacion() {
    this.cotizacionActual = null;
    this.ultimaActualizacion = null;
    return await this.obtenerCotizacion();
  }

  /**
   * Obtiene estado de la cotización para mostrar en UI
   */
  obtenerEstadoCotizacion() {
    if (!this.cotizacionActual) {
      return {
        disponible: false,
        mensaje: 'Cotización no disponible'
      };
    }

    const minutosDesdeActualizacion = this.ultimaActualizacion ? 
      Math.floor((Date.now() - this.ultimaActualizacion) / 60000) : 0;

    return {
      disponible: true,
      valor: this.cotizacionActual.valor,
      fuente: this.cotizacionActual.fuente,
      timestamp: this.cotizacionActual.timestamp,
      minutosDesdeActualizacion,
      esEmergencia: this.cotizacionActual.error || false,
      mensaje: this.cotizacionActual.error ? 
        'Cotización de emergencia (sin conexión)' : 
        `Actualizada hace ${minutosDesdeActualizacion} min`
    };
  }
}

// Exportar instancia única
export const cotizacionSimple = new CotizacionSimpleService();
export default cotizacionSimple;