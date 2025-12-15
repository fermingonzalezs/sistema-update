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
    defaultSelect: '*',
    // Configuración específica para celulares
    defaultFilters: {},
    defaultOrderBy: 'created_at',
    defaultOrder: 'desc',

    // Transformaciones específicas para celulares
    transformOnCreate: (data) => ({
      ...data,
      // Asegurar tipos correctos para precios
      precio_compra_usd: parseFloat(data.precio_compra_usd) || 0,
      costos_adicionales: parseFloat(data.costos_adicionales) || 0,
      precio_venta_usd: parseFloat(data.precio_venta_usd) || 0,
      // Convertir especificaciones numéricas
      capacidad: parseInt(data.capacidad) || 0,
      ram: parseInt(data.ram) || 0,
      ciclos: parseInt(data.ciclos) || 0,
      // Proveedor (nullable)
      proveedor_id: data.proveedor_id || null,
      // Mapear servicio_tecnico a rsn_idm_fixcenter (valor esperado por la DB)
      sucursal: data.sucursal === 'servicio_tecnico' ? 'rsn_idm_fixcenter' : data.sucursal
      // costo_total_usd se calcula automáticamente en la DB, no incluirlo
    }),

    transformOnUpdate: (data) => ({
      ...data,
      // Validaciones específicas en updates para precios
      precio_compra_usd: data.precio_compra_usd ? parseFloat(data.precio_compra_usd) : undefined,
      costos_adicionales: data.costos_adicionales !== undefined ? parseFloat(data.costos_adicionales) || 0 : undefined,
      precio_venta_usd: data.precio_venta_usd ? parseFloat(data.precio_venta_usd) : undefined,
      // Convertir especificaciones numéricas si vienen en updates
      capacidad: data.capacidad !== undefined ? parseInt(data.capacidad) || 0 : undefined,
      ram: data.ram !== undefined ? parseInt(data.ram) || 0 : undefined,
      ciclos: data.ciclos !== undefined ? parseInt(data.ciclos) || 0 : undefined,
      // Mapear servicio_tecnico a rsn_idm_fixcenter (valor esperado por la DB)
      sucursal: data.sucursal === 'servicio_tecnico' ? 'rsn_idm_fixcenter' : data.sucursal
      // costo_total_usd se calcula automáticamente en la DB, no incluirlo
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

      // Validar rangos de valores numéricos
      if (data.capacidad && (data.capacidad < 0 || data.capacidad > 5000)) {
        throw new Error('Capacidad debe estar entre 0 y 5000 GB');
      }
      if (data.ram && (data.ram < 0 || data.ram > 64)) {
        throw new Error('RAM debe estar entre 0 y 64 GB');
      }
      if (data.ciclos && (data.ciclos < 0 || data.ciclos > 10000)) {
        throw new Error('Ciclos de batería debe estar entre 0 y 10000');
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