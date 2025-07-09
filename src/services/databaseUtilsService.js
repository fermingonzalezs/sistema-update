// Servicio de utilidades para operaciones de base de datos
import { supabase } from '../lib/supabase';

/**
 * Servicio para realizar operaciones masivas en la base de datos
 */
export const databaseUtilsService = {
  /**
   * Actualiza el campo sucursal de todos los registros en la tabla "otros"
   * @param {string} nuevaSucursal - El valor de sucursal a asignar ('la_plata', 'capital', etc.)
   * @param {string} sucursalActual - Opcional: filtrar por sucursal actual (si no se especifica, actualiza todos)
   * @returns {Promise<{success: boolean, count: number, error?: string}>}
   */
  async actualizarSucursalOtros(nuevaSucursal, sucursalActual = null) {
    try {
      console.log(`🔄 Iniciando actualización masiva de sucursal en tabla "otros"`);
      console.log(`📝 Nueva sucursal: ${nuevaSucursal}`);
      if (sucursalActual) {
        console.log(`🔍 Filtrando por sucursal actual: ${sucursalActual}`);
      }

      // Construir la consulta base
      let query = supabase
        .from('otros')
        .update({ 
          sucursal: nuevaSucursal,
          updated_at: new Date().toISOString()
        });

      // Si se especifica una sucursal actual, filtrar por ella
      if (sucursalActual) {
        query = query.eq('sucursal', sucursalActual);
      }

      // Ejecutar la actualización
      const { data, error } = await query.select('id');

      if (error) {
        console.error('❌ Error ejecutando UPDATE:', error);
        return { 
          success: false, 
          count: 0, 
          error: error.message 
        };
      }

      console.log(`✅ Actualización completada exitosamente`);
      console.log(`📊 Registros actualizados: ${data ? data.length : 0}`);
      
      return { 
        success: true, 
        count: data ? data.length : 0 
      };

    } catch (error) {
      console.error('❌ Error en actualizarSucursalOtros:', error);
      return { 
        success: false, 
        count: 0, 
        error: error.message 
      };
    }
  },

  /**
   * Obtiene estadísticas de la tabla "otros" agrupadas por sucursal
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  async obtenerEstadisticasSucursalOtros() {
    try {
      console.log('📊 Obteniendo estadísticas de sucursales en tabla "otros"');

      const { data, error } = await supabase
        .from('otros')
        .select('sucursal, disponible')
        .order('sucursal');

      if (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        return { 
          success: false, 
          error: error.message 
        };
      }

      // Agrupar por sucursal
      const estadisticas = data.reduce((acc, item) => {
        const sucursal = item.sucursal || 'sin_sucursal';
        
        if (!acc[sucursal]) {
          acc[sucursal] = {
            sucursal: sucursal,
            total: 0,
            disponibles: 0,
            no_disponibles: 0
          };
        }

        acc[sucursal].total++;
        if (item.disponible) {
          acc[sucursal].disponibles++;
        } else {
          acc[sucursal].no_disponibles++;
        }

        return acc;
      }, {});

      const resultado = Object.values(estadisticas);
      
      console.log('✅ Estadísticas obtenidas:', resultado);
      return { 
        success: true, 
        data: resultado 
      };

    } catch (error) {
      console.error('❌ Error en obtenerEstadisticasSucursalOtros:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  /**
   * Actualiza múltiples campos en la tabla "otros" para registros específicos
   * @param {Array<{id: string, updates: object}>} registros - Array de objetos con id y campos a actualizar
   * @returns {Promise<{success: boolean, count: number, errors: Array}>}
   */
  async actualizarMultiplesOtros(registros) {
    try {
      console.log(`🔄 Iniciando actualización múltiple de ${registros.length} registros`);
      
      const errores = [];
      let actualizados = 0;

      for (const registro of registros) {
        try {
          const { error } = await supabase
            .from('otros')
            .update({
              ...registro.updates,
              updated_at: new Date().toISOString()
            })
            .eq('id', registro.id);

          if (error) {
            errores.push({
              id: registro.id,
              error: error.message
            });
            console.error(`❌ Error actualizando registro ${registro.id}:`, error);
          } else {
            actualizados++;
            console.log(`✅ Registro ${registro.id} actualizado`);
          }
        } catch (error) {
          errores.push({
            id: registro.id,
            error: error.message
          });
          console.error(`❌ Error en registro ${registro.id}:`, error);
        }
      }

      console.log(`📊 Resumen: ${actualizados} actualizados, ${errores.length} errores`);
      
      return {
        success: errores.length === 0,
        count: actualizados,
        errors: errores
      };

    } catch (error) {
      console.error('❌ Error en actualizarMultiplesOtros:', error);
      return {
        success: false,
        count: 0,
        errors: [{ error: error.message }]
      };
    }
  },

  /**
   * Utilidades para debugging y análisis
   */
  debug: {
    /**
     * Muestra la estructura de un registro de la tabla "otros"
     * @param {string} id - ID del registro a examinar
     */
    async examinarRegistro(id) {
      try {
        const { data, error } = await supabase
          .from('otros')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('❌ Error obteniendo registro:', error);
          return;
        }

        console.log('🔍 Estructura del registro:', data);
        console.log('📋 Campos disponibles:', Object.keys(data));
        console.log('📝 Sucursal actual:', data.sucursal);
        
        return data;
      } catch (error) {
        console.error('❌ Error en examinarRegistro:', error);
      }
    },

    /**
     * Lista todos los valores únicos de sucursal en la tabla "otros"
     */
    async listarSucursales() {
      try {
        const { data, error } = await supabase
          .from('otros')
          .select('sucursal')
          .not('sucursal', 'is', null);

        if (error) {
          console.error('❌ Error obteniendo sucursales:', error);
          return;
        }

        const sucursalesUnicas = [...new Set(data.map(item => item.sucursal))];
        console.log('🏢 Sucursales encontradas:', sucursalesUnicas);
        
        return sucursalesUnicas;
      } catch (error) {
        console.error('❌ Error en listarSucursales:', error);
      }
    }
  }
};

// Exportar el servicio
export default databaseUtilsService;