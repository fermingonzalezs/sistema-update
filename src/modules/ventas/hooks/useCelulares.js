// useCelulares.js - MIGRADO A useSupabaseEntity genérico
import { useSupabaseEntity } from '../../../shared/hooks/useSupabaseEntity';
import { supabase } from '../../../lib/supabase';

// 📊 SERVICE: Operaciones de inventario de celulares
export const celularesService = {
  // Mantener funciones especializadas que no están en el hook genérico
  async findBySerial(serial) {
    // Esta función se mantiene porque es específica de celulares
    const query = supabase
      .from('celulares')
      .select('*')
      .eq('serial', serial)
      .maybeSingle();
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error buscando celular por serial:', error);
      throw error;
    }
    
    return data;
  }
};

// 🎣 HOOK: Lógica de React para celulares - REFACTORIZADO
export function useCelulares() {
  // Usar el hook genérico con configuración específica para celulares
  const {
    data: celulares,
    loading,
    error,
    fetchAll: fetchCelulares,
    create: addCelular,
    update: updateCelular,
    remove: deleteCelular,
    setData: setCelulares,
    setError,
    clearError
  } = useSupabaseEntity('celulares', {
    // Configuración específica para celulares
    defaultFilters: { 
      disponible: true 
    },
    defaultOrderBy: 'created_at',
    defaultOrder: 'desc',
    
    // Transformaciones específicas para celulares
    transformOnCreate: (data) => ({
      ...data,
      // Asegurar tipos correctos
      precio_compra_usd: parseFloat(data.precio_compra_usd) || 0,
      precio_venta_usd: parseFloat(data.precio_venta_usd) || 0,
      ciclos: parseInt(data.ciclos) || 0,
      disponible: data.disponible !== false
    }),
    
    transformOnUpdate: (data) => ({
      ...data,
      // Validaciones específicas en updates
      precio_compra_usd: data.precio_compra_usd ? parseFloat(data.precio_compra_usd) : undefined,
      precio_venta_usd: data.precio_venta_usd ? parseFloat(data.precio_venta_usd) : undefined,
      ciclos: data.ciclos ? parseInt(data.ciclos) : undefined
    }),
    
    // Callbacks específicos
    onBeforeCreate: async (data) => {
      // Validar que no exista el serial
      if (data.serial) {
        const existing = await celularesService.findBySerial(data.serial);
        if (existing) {
          throw new Error(`Ya existe un celular con serial: ${data.serial}`);
        }
      }
      return data;
    },
    
    onAfterCreate: (createdItem) => {
      console.log('✅ Celular creado exitosamente:', createdItem.serial);
    },
    
    onAfterUpdate: (updatedItem) => {
      console.log('✅ Celular actualizado:', updatedItem.serial);
    },
    
    onAfterDelete: (id) => {
      console.log('✅ Celular eliminado ID:', id);
    }
  });

  // Funciones específicas adicionales que no están en el hook genérico
  const findBySerial = async (serial) => {
    try {
      clearError();
      return await celularesService.findBySerial(serial);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Mantener la misma API que el hook original para compatibilidad
  return {
    // Estados (nombres mapeados para compatibilidad)
    celulares,
    loading,
    error,
    
    // Operaciones básicas (nombres mapeados)
    fetchCelulares,
    addCelular,
    updateCelular,
    deleteCelular,
    
    // Funciones específicas
    findBySerial,
    
    // Utilidades adicionales del hook genérico
    setCelulares,
    setError,
    clearError
  };
}