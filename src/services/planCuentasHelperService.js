// Servicio auxiliar para gestionar dependencias del plan de cuentas
// UPDATE WW SRL - Gestión de foreign keys

import { supabase } from '../lib/supabase';

export const planCuentasHelperService = {
  
  /**
   * Obtiene todas las dependencias de una cuenta específica
   */
  async verificarDependencias(cuentaId) {
    console.log('🔍 Verificando dependencias para cuenta:', cuentaId);
    
    const dependencias = [
      { tabla: 'movimientos_contables', campo: 'cuenta_id', nombre: 'movimientos contables' },
      { tabla: 'conciliaciones_caja', campo: 'cuenta_caja_id', nombre: 'conciliaciones de caja' },
      { tabla: 'gastos_operativos', campo: 'cuenta_pago_id', nombre: 'gastos operativos' }
    ];
    
    const resultado = {
      tieneDependencias: false,
      detalles: [],
      total: 0
    };
    
    for (const dep of dependencias) {
      try {
        const { data, error } = await supabase
          .from(dep.tabla)
          .select('id')
          .eq(dep.campo, cuentaId);
        
        if (error) {
          console.error(`❌ Error verificando ${dep.nombre}:`, error);
          // Continuar con las otras verificaciones
          continue;
        }
        
        const cantidad = data ? data.length : 0;
        
        if (cantidad > 0) {
          resultado.tieneDependencias = true;
          resultado.detalles.push({
            tabla: dep.tabla,
            nombre: dep.nombre,
            cantidad
          });
          resultado.total += cantidad;
        }
        
      } catch (err) {
        console.error(`❌ Error en tabla ${dep.tabla}:`, err);
      }
    }
    
    console.log('📊 Resultado de verificación:', resultado);
    return resultado;
  },

  /**
   * Reasigna todos los registros de una cuenta a otra cuenta
   */
  async reasignarRegistros(cuentaOrigenId, cuentaDestinoId, motivoReasignacion = 'Reasignación automática') {
    console.log('🔄 Reasignando registros de', cuentaOrigenId, 'a', cuentaDestinoId);
    
    const dependencias = [
      { tabla: 'movimientos_contables', campo: 'cuenta_id' },
      { tabla: 'conciliaciones_caja', campo: 'cuenta_caja_id' },
      { tabla: 'gastos_operativos', campo: 'cuenta_pago_id' }
    ];
    
    const resultados = [];
    
    for (const dep of dependencias) {
      try {
        // Primero verificar cuántos registros hay
        const { data: registros, error: errorConsulta } = await supabase
          .from(dep.tabla)
          .select('id')
          .eq(dep.campo, cuentaOrigenId);
        
        if (errorConsulta) {
          console.error(`❌ Error consultando ${dep.tabla}:`, errorConsulta);
          continue;
        }
        
        const cantidad = registros ? registros.length : 0;
        
        if (cantidad > 0) {
          // Realizar la reasignación
          const { error: errorUpdate } = await supabase
            .from(dep.tabla)
            .update({ [dep.campo]: cuentaDestinoId })
            .eq(dep.campo, cuentaOrigenId);
          
          if (errorUpdate) {
            console.error(`❌ Error reasignando en ${dep.tabla}:`, errorUpdate);
            resultados.push({
              tabla: dep.tabla,
              cantidad,
              exitoso: false,
              error: errorUpdate.message
            });
          } else {
            console.log(`✅ Reasignados ${cantidad} registros en ${dep.tabla}`);
            resultados.push({
              tabla: dep.tabla,
              cantidad,
              exitoso: true
            });
          }
        }
        
      } catch (err) {
        console.error(`❌ Error general en ${dep.tabla}:`, err);
        resultados.push({
          tabla: dep.tabla,
          cantidad: 0,
          exitoso: false,
          error: err.message
        });
      }
    }
    
    return resultados;
  },

  /**
   * Elimina todos los registros asociados a una cuenta (PELIGROSO)
   */
  async eliminarRegistrosAsociados(cuentaId, confirmacion = false) {
    if (!confirmacion) {
      throw new Error('Esta operación requiere confirmación explícita');
    }
    
    console.log('🗑️ ELIMINANDO todos los registros asociados a cuenta:', cuentaId);
    
    const dependencias = [
      { tabla: 'movimientos_contables', campo: 'cuenta_id' },
      { tabla: 'conciliaciones_caja', campo: 'cuenta_caja_id' },
      { tabla: 'gastos_operativos', campo: 'cuenta_pago_id' }
    ];
    
    const resultados = [];
    
    for (const dep of dependencias) {
      try {
        const { data: eliminados, error } = await supabase
          .from(dep.tabla)
          .delete()
          .eq(dep.campo, cuentaId)
          .select('id');
        
        if (error) {
          console.error(`❌ Error eliminando de ${dep.tabla}:`, error);
          resultados.push({
            tabla: dep.tabla,
            cantidad: 0,
            exitoso: false,
            error: error.message
          });
        } else {
          const cantidad = eliminados ? eliminados.length : 0;
          console.log(`✅ Eliminados ${cantidad} registros de ${dep.tabla}`);
          resultados.push({
            tabla: dep.tabla,
            cantidad,
            exitoso: true
          });
        }
        
      } catch (err) {
        console.error(`❌ Error general eliminando de ${dep.tabla}:`, err);
        resultados.push({
          tabla: dep.tabla,
          cantidad: 0,
          exitoso: false,
          error: err.message
        });
      }
    }
    
    return resultados;
  },

  /**
   * Obtiene cuentas sugeridas para reasignación
   */
  async obtenerCuentasSugeridas(cuentaAEliminar) {
    console.log('💡 Buscando cuentas sugeridas para reasignar desde:', cuentaAEliminar.codigo);
    
    // Obtener cuentas del mismo tipo/grupo
    const primerDigito = cuentaAEliminar.codigo.charAt(0);
    
    const { data, error } = await supabase
      .from('plan_cuentas')
      .select('id, codigo, nombre, tipo')
      .eq('activa', true)
      .neq('id', cuentaAEliminar.id)
      .like('codigo', `${primerDigito}%`)
      .order('codigo');
    
    if (error) {
      console.error('❌ Error obteniendo cuentas sugeridas:', error);
      return [];
    }
    
    return data || [];
  }
};

export default planCuentasHelperService;