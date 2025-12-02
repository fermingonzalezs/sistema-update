import { supabase } from '../lib/supabase';

class CotizacionService {
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
    
    this.fallbackCotizacion = 1000; // Cotización de emergencia
    this.cacheDuration = 15 * 60 * 1000; // 15 minutos en milisegundos
    this.lastUpdate = null;
    this.cachedCotizacion = null;
  }

  /**
   * Obtiene la cotización actual del dólar blue
   * @returns {Promise<Object>} Objeto con cotización actual
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
        if (cotizacion.promedio <= 0 || cotizacion.promedio > 10000) {
          throw new Error(`Cotización fuera de rango: ${cotizacion.promedio}`);
        }

        // Guardar en cache
        this.cachedCotizacion = {
          ...cotizacion,
          valor: cotizacion.venta, // Usar precio de VENTA (más alto)
          fuente: source.name,
          timestamp: new Date().toISOString()
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
      timestamp: new Date().toISOString()
    };

    await this.guardarCotizacionDiaria(cotizacionEmergencia);
    return cotizacionEmergencia;
  }

  /**
   * Obtiene la cotización de una fecha específica
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @returns {Promise<Object>} Cotización de la fecha
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
      console.log('✅ Cotización encontrada para fecha:', data[0]);
      return data[0];
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
      console.log('✅ Usando cotización anterior más cercana:', cotizacionAnterior[0]);
      return cotizacionAnterior[0];
    }

    // Si no hay cotizaciones anteriores, usar actual
    console.log('⚠️ No hay cotizaciones anteriores, usando actual...');
    return await this.obtenerCotizacionActual();
  }

  /**
   * Guarda la cotización diaria en la base de datos
   * @param {Object} cotizacion - Datos de cotización
   */
  async guardarCotizacionDiaria(cotizacion) {
    try {
      const fecha = new Date().toISOString().split('T')[0];
      
      // Verificar si ya existe cotización para hoy
      const { data: existente } = await supabase
        .from('cotizaciones_diarias')
        .select('id')
        .eq('fecha', fecha)
        .eq('fuente', cotizacion.fuente);

      if (existente && existente.length > 0) {
        // Actualizar existente
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
        // Crear nueva
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
          timestamp: ultima.created_at
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Error obteniendo última cotización de BD:', error);
      return null;
    }
  }

  /**
   * Convierte ARS a USD usando cotización específica
   * @param {number} montoARS - Monto en pesos
   * @param {Object} cotizacion - Objeto cotización (opcional, usa actual si no se especifica)
   * @returns {Promise<Object>} Resultado de conversión
   */
  async convertirARSaUSD(montoARS, cotizacion = null) {
    if (!cotizacion) {
      cotizacion = await this.obtenerCotizacionActual();
    }

    const montoUSD = parseFloat((montoARS / cotizacion.promedio).toFixed(4));
    
    console.log(`💱 Conversión: $${montoARS} ARS → $${montoUSD} USD (cotización: ${cotizacion.promedio})`);
    
    return {
      montoOriginalARS: montoARS,
      montoUSD: montoUSD,
      cotizacionUsada: cotizacion.promedio,
      fechaCotizacion: cotizacion.fecha,
      fuenteCotizacion: cotizacion.fuente
    };
  }

  /**
   * Convierte USD a ARS usando cotización específica
   * @param {number} montoUSD - Monto en dólares
   * @param {Object} cotizacion - Objeto cotización (opcional, usa actual si no se especifica)
   * @returns {Promise<Object>} Resultado de conversión
   */
  async convertirUSDaARS(montoUSD, cotizacion = null) {
    if (!cotizacion) {
      cotizacion = await this.obtenerCotizacionActual();
    }

    const montoARS = parseFloat((montoUSD * cotizacion.promedio).toFixed(2));
    
    console.log(`💱 Conversión: $${montoUSD} USD → $${montoARS} ARS (cotización: ${cotizacion.promedio})`);
    
    return {
      montoOriginalUSD: montoUSD,
      montoARS: montoARS,
      cotizacionUsada: cotizacion.promedio,
      fechaCotizacion: cotizacion.fecha,
      fuenteCotizacion: cotizacion.fuente
    };
  }

  /**
   * Obtiene historial de cotizaciones
   * @param {number} dias - Número de días hacia atrás
   * @returns {Promise<Array>} Historial de cotizaciones
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

  /**
   * Valida que una cotización sea razonable
   * @param {number} cotizacion - Valor de cotización
   * @returns {boolean} True si es válida
   */
  validarCotizacion(cotizacion) {
    return typeof cotizacion === 'number' && 
           cotizacion > 0 && 
           cotizacion < 10000 && 
           !isNaN(cotizacion);
  }

  /**
   * Fuerza actualización de cotización (ignora cache)
   */
  async forzarActualizacion() {
    this.cachedCotizacion = null;
    this.lastUpdate = null;
    return await this.obtenerCotizacionActual();
  }
}

export const cotizacionService = new CotizacionService();
export default cotizacionService;