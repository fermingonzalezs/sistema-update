// Servicio unificado de cotizaciones USD/ARS
// src/shared/services/cotizacionService.js

import { supabase } from '../../lib/supabase';
import { 
  convertirARSaUSD, 
  convertirUSDaARS,
  crearResultadoConversionARS,
  crearResultadoConversionUSD,
  validarCotizacion,
  prepararMovimientoContable
} from '../utils/currency';

class CotizacionServiceUnificado {
  constructor() {
    this.apiSources = [
      {
        name: 'DolarAPI',
        url: 'https://dolarapi.com/v1/dolares/blue',
        parseResponse: (data) => ({
          compra: data.compra,
          venta: data.venta,
          promedio: (data.compra + data.venta) / 2,
          fecha: data.fechaActualizacion
        })
      },
      {
        name: 'DolarSi',
        url: 'https://www.dolarsi.com/api/api.php?type=valoresprincipales',
        parseResponse: (data) => {
          const dolarBlue = data.find(item => item.casa.nombre === 'Dolar Blue');
          if (!dolarBlue) throw new Error('Dólar Blue no encontrado');
          return {
            compra: parseFloat(dolarBlue.casa.compra.replace(',', '.')),
            venta: parseFloat(dolarBlue.casa.venta.replace(',', '.')),
            promedio: (parseFloat(dolarBlue.casa.compra.replace(',', '.')) + parseFloat(dolarBlue.casa.venta.replace(',', '.'))) / 2,
            fecha: new Date().toISOString()
          };
        }
      }
    ];
    
    this.fallbackCotizacion = 1000;
    this.cacheDuration = 15 * 60 * 1000; // 15 minutos
    this.lastUpdate = null;
    this.cachedCotizacion = null;
  }

  /**
   * Obtiene la cotización actual del dólar blue
   */
  async obtenerCotizacionActual() {
    console.log('📈 Obteniendo cotización USD/ARS...');

    // Verificar cache
    if (this.cachedCotizacion && this.lastUpdate && 
        (Date.now() - this.lastUpdate) < this.cacheDuration) {
      console.log('✅ Usando cotización en cache:', this.cachedCotizacion);
      return this.cachedCotizacion;
    }

    // Intentar obtener de APIs externas
    for (const source of this.apiSources) {
      try {
        console.log(`🌐 Consultando ${source.name}...`);
        const response = await fetch(source.url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'SistemaContable/1.0'
          },
          timeout: 10000
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const cotizacion = source.parseResponse(data);

        // Validar cotización razonable
        if (!validarCotizacion(cotizacion.promedio)) {
          throw new Error(`Cotización fuera de rango: ${cotizacion.promedio}`);
        }

        // Guardar en cache
        this.cachedCotizacion = {
          ...cotizacion,
          valor: cotizacion.venta, // Usar precio de VENTA (más alto)
          fuente: source.name,
          timestamp: new Date().toISOString(),
          error: false
        };
        this.lastUpdate = Date.now();

        console.log(`✅ Cotización obtenida de ${source.name}:`, cotizacion);
        
        // Guardar en base de datos
        await this.guardarCotizacionDiaria(this.cachedCotizacion);
        
        return this.cachedCotizacion;

      } catch (error) {
        console.warn(`⚠️ Error con ${source.name}:`, error.message);
        continue;
      }
    }

    // Si todas las APIs fallan, usar última cotización de la base de datos
    console.log('🔄 Todas las APIs fallaron, buscando última cotización en BD...');
    const ultimaCotizacion = await this.obtenerUltimaCotizacionBD();
    
    if (ultimaCotizacion) {
      console.log('✅ Usando última cotización de BD:', ultimaCotizacion);
      return ultimaCotizacion;
    }

    // Último recurso: cotización de emergencia
    console.warn('⚠️ Usando cotización de emergencia:', this.fallbackCotizacion);
    const ventaEmergencia = this.fallbackCotizacion * 1.02; // Usar precio de venta
    const cotizacionEmergencia = {
      compra: this.fallbackCotizacion * 0.98,
      venta: ventaEmergencia,
      promedio: this.fallbackCotizacion,
      valor: ventaEmergencia, // Usar precio de VENTA
      fecha: new Date().toISOString(),
      fuente: 'EMERGENCIA',
      timestamp: new Date().toISOString(),
      error: true
    };

    await this.guardarCotizacionDiaria(cotizacionEmergencia);
    return cotizacionEmergencia;
  }

  /**
   * Convierte ARS a USD usando cotización actual o especificada
   */
  async convertirARSaUSD(montoARS, cotizacionEspecifica = null) {
    const cotizacion = cotizacionEspecifica || await this.obtenerCotizacionActual();
    const valorCotizacion = cotizacion.valor || cotizacion.promedio;
    
    return crearResultadoConversionARS(montoARS, valorCotizacion, cotizacion.fuente);
  }

  /**
   * Convierte USD a ARS usando cotización actual o especificada
   */
  async convertirUSDaARS(montoUSD, cotizacionEspecifica = null) {
    const cotizacion = cotizacionEspecifica || await this.obtenerCotizacionActual();
    const valorCotizacion = cotizacion.valor || cotizacion.promedio;
    
    return crearResultadoConversionUSD(montoUSD, valorCotizacion, cotizacion.fuente);
  }

  /**
   * Prepara movimiento contable con conversión automática
   */
  async prepararMovimientoAutomatico(movimientoData, cuenta) {
    const { monto, tipo, cotizacionManual } = movimientoData;
    
    if (cuenta.requiere_cotizacion || cuenta.moneda_original === 'ARS') {
      let cotizacion;
      
      if (cotizacionManual && cotizacionManual > 0) {
        cotizacion = cotizacionManual;
      } else {
        const cotizacionData = await this.obtenerCotizacionActual();
        cotizacion = cotizacionData.valor || cotizacionData.promedio;
      }
      
      return prepararMovimientoContable(movimientoData, cuenta, cotizacion);
    }
    
    return prepararMovimientoContable(movimientoData, cuenta);
  }

  /**
   * Obtiene cotización de una fecha específica
   */
  async obtenerCotizacionPorFecha(fecha) {
    console.log('📅 Obteniendo cotización para fecha:', fecha);

    const { data, error } = await supabase
      .from('cotizaciones_diarias')
      .select('*')
      .eq('fecha', fecha)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Error obteniendo cotización por fecha:', error);
      throw error;
    }

    if (data && data.length > 0) {
      const cotizacion = data[0];
      return {
        compra: cotizacion.cotizacion_compra,
        venta: cotizacion.cotizacion_venta,
        promedio: cotizacion.cotizacion_promedio,
        valor: cotizacion.cotizacion_venta, // Usar precio de VENTA
        fecha: cotizacion.fecha,
        fuente: cotizacion.fuente + ' (BD)',
        timestamp: cotizacion.created_at
      };
    }

    // Si no hay cotización para esa fecha, usar la más cercana anterior
    const { data: cotizacionAnterior, error: errorAnterior } = await supabase
      .from('cotizaciones_diarias')
      .select('*')
      .lte('fecha', fecha)
      .order('fecha', { ascending: false })
      .limit(1);

    if (errorAnterior) throw errorAnterior;

    if (cotizacionAnterior && cotizacionAnterior.length > 0) {
      const cotizacion = cotizacionAnterior[0];
      return {
        compra: cotizacion.cotizacion_compra,
        venta: cotizacion.cotizacion_venta,
        promedio: cotizacion.cotizacion_promedio,
        valor: cotizacion.cotizacion_venta, // Usar precio de VENTA
        fecha: cotizacion.fecha,
        fuente: cotizacion.fuente + ' (BD-Anterior)',
        timestamp: cotizacion.created_at
      };
    }

    // Si no hay cotizaciones anteriores, usar actual
    return await this.obtenerCotizacionActual();
  }

  /**
   * Guarda cotización diaria en la base de datos
   */
  async guardarCotizacionDiaria(cotizacion) {
    try {
      const fecha = new Date().toISOString().split('T')[0];
      
      const { data: existente } = await supabase
        .from('cotizaciones_diarias')
        .select('id')
        .eq('fecha', fecha)
        .eq('fuente', cotizacion.fuente);

      if (existente && existente.length > 0) {
        const { error } = await supabase
          .from('cotizaciones_diarias')
          .update({
            cotizacion_compra: cotizacion.compra,
            cotizacion_venta: cotizacion.venta,
            cotizacion_promedio: cotizacion.promedio,
            updated_at: new Date().toISOString()
          })
          .eq('id', existente[0].id);

        if (error) throw error;
        console.log('✅ Cotización actualizada en BD');
      } else {
        const { error } = await supabase
          .from('cotizaciones_diarias')
          .insert([{
            fecha: fecha,
            cotizacion_compra: cotizacion.compra,
            cotizacion_venta: cotizacion.venta,
            cotizacion_promedio: cotizacion.promedio,
            fuente: cotizacion.fuente,
            datos_raw: JSON.stringify(cotizacion)
          }]);

        if (error) throw error;
        console.log('✅ Cotización guardada en BD');
      }
    } catch (error) {
      console.error('❌ Error guardando cotización en BD:', error);
    }
  }

  /**
   * Obtiene la última cotización de la base de datos
   */
  async obtenerUltimaCotizacionBD() {
    try {
      const { data, error } = await supabase
        .from('cotizaciones_diarias')
        .select('*')
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const ultima = data[0];
        return {
          compra: ultima.cotizacion_compra,
          venta: ultima.cotizacion_venta,
          promedio: ultima.cotizacion_promedio,
          valor: ultima.cotizacion_venta, // Usar precio de VENTA
          fecha: ultima.fecha,
          fuente: ultima.fuente + ' (BD)',
          timestamp: ultima.created_at,
          error: false
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Error obteniendo última cotización de BD:', error);
      return null;
    }
  }

  /**
   * Fuerza actualización de cotización (ignora cache)
   */
  async forzarActualizacion() {
    this.cachedCotizacion = null;
    this.lastUpdate = null;
    return await this.obtenerCotizacionActual();
  }

  /**
   * Obtiene estado de la cotización para mostrar en UI
   */
  obtenerEstadoCotizacion() {
    if (!this.cachedCotizacion) {
      return {
        disponible: false,
        mensaje: 'Cotización no disponible'
      };
    }

    const minutosDesdeActualizacion = this.lastUpdate ? 
      Math.floor((Date.now() - this.lastUpdate) / 60000) : 0;

    return {
      disponible: true,
      valor: this.cachedCotizacion.valor || this.cachedCotizacion.promedio,
      fuente: this.cachedCotizacion.fuente,
      timestamp: this.cachedCotizacion.timestamp,
      minutosDesdeActualizacion,
      esEmergencia: this.cachedCotizacion.error || false,
      mensaje: this.cachedCotizacion.error ? 
        'Cotización de emergencia (sin conexión)' : 
        `Actualizada hace ${minutosDesdeActualizacion} min`
    };
  }

  /**
   * Obtiene historial de cotizaciones
   */
  async obtenerHistorialCotizaciones(dias = 30) {
    try {
      const fechaDesde = new Date();
      fechaDesde.setDate(fechaDesde.getDate() - dias);

      const { data, error } = await supabase
        .from('cotizaciones_diarias')
        .select('*')
        .gte('fecha', fechaDesde.toISOString().split('T')[0])
        .order('fecha', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error obteniendo historial:', error);
      return [];
    }
  }
}

// Exportar instancia única
export const cotizacionService = new CotizacionServiceUnificado();
export default cotizacionService;