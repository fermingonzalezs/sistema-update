import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

/**
 * useSupabaseEntity - Hook genérico para operaciones CRUD con Supabase
 * 
 * Unifica la lógica repetitiva de:
 * - useInventario, useCelulares, useReparaciones, useEstadoResultados, etc.
 * 
 * Características:
 * - Estados estándar: data, loading, error
 * - Operaciones CRUD genéricas
 * - Manejo de errores unificado
 * - Callbacks personalizables
 * - Soporte para queries complejas
 * 
 * @param {string} tableName - Nombre de la tabla en Supabase
 * @param {object} options - Configuraciones opcionales
 */
export const useSupabaseEntity = (tableName, options = {}) => {
  const {
    // Ordenamiento por defecto
    defaultOrderBy = 'created_at',
    defaultOrder = 'desc',
    // Selectores por defecto
    defaultSelect = '*',
    // Filtros por defecto (ej: { disponible: true })
    defaultFilters = {},
    // Callbacks personalizados
    onBeforeCreate = null,
    onAfterCreate = null,
    onBeforeUpdate = null,
    onAfterUpdate = null,
    onBeforeDelete = null,
    onAfterDelete = null,
    // Transformaciones de datos
    transformOnFetch = null,
    transformOnCreate = null,
    transformOnUpdate = null
  } = options;

  // Estados estándar
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función auxiliar para manejo de errores
  const handleError = useCallback((error, operation) => {
    console.error(`❌ Error en ${operation} para ${tableName}:`, error);
    setError(error.message || error);
    throw error;
  }, [tableName]);

  // Función auxiliar para aplicar filtros
  const applyFilters = useCallback((query, filters = {}) => {
    const allFilters = { ...defaultFilters, ...filters };
    
    Object.entries(allFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (typeof value === 'object' && value.operator) {
          // Filtros complejos: { operator: 'gte', value: '2024-01-01' }
          query = query[value.operator](key, value.value);
        } else {
          query = query.eq(key, value);
        }
      }
    });
    
    return query;
  }, [defaultFilters]);

  // OBTENER TODOS (getAll)
  const fetchAll = useCallback(async (customFilters = {}, customSelect = null) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from(tableName)
        .select(customSelect || defaultSelect);

      // Aplicar filtros
      query = applyFilters(query, customFilters);

      // Aplicar ordenamiento
      query = query.order(defaultOrderBy, { ascending: defaultOrder === 'asc' });

      const { data: result, error } = await query;

      if (error) throw error;

      // Transformar datos si se especifica
      const finalData = transformOnFetch ? transformOnFetch(result) : result;
      
      setData(finalData);
      return finalData;

    } catch (err) {
      handleError(err, 'fetchAll');
    } finally {
      setLoading(false);
    }
  }, [tableName, defaultSelect, defaultOrderBy, defaultOrder, applyFilters, transformOnFetch, handleError]);

  // OBTENER POR ID (getById)
  const fetchById = useCallback(async (id, customSelect = null) => {
    try {
      setError(null);

      const { data: result, error } = await supabase
        .from(tableName)
        .select(customSelect || defaultSelect)
        .eq('id', id)
        .single();

      if (error) throw error;

      return transformOnFetch ? transformOnFetch([result])[0] : result;

    } catch (err) {
      handleError(err, 'fetchById');
    }
  }, [tableName, defaultSelect, transformOnFetch, handleError]);

  // CREAR (create)
  const create = useCallback(async (newData) => {
    console.log(`📝 [useSupabaseEntity] create() llamado para tabla: ${tableName}`);
    console.log(`📝 [useSupabaseEntity] Datos de entrada:`, newData);

    try {
      setError(null);

      // Callback antes de crear
      let dataToInsert = newData;
      if (onBeforeCreate) {
        console.log(`📝 [useSupabaseEntity] Ejecutando onBeforeCreate...`);
        dataToInsert = await onBeforeCreate(dataToInsert);
        console.log(`📝 [useSupabaseEntity] Datos después de onBeforeCreate:`, dataToInsert);
      }

      // Transformar datos si se especifica
      if (transformOnCreate) {
        console.log(`📝 [useSupabaseEntity] Ejecutando transformOnCreate...`);
        dataToInsert = transformOnCreate(dataToInsert);
        console.log(`📝 [useSupabaseEntity] Datos después de transformOnCreate:`, dataToInsert);
      }

      console.log(`📝 [useSupabaseEntity] Insertando en Supabase...`, dataToInsert);
      const { data: result, error } = await supabase
        .from(tableName)
        .insert([dataToInsert])
        .select();

      console.log(`📝 [useSupabaseEntity] Resultado Supabase:`, { result, error });

      if (error) throw error;

      const createdItem = result[0];
      console.log(`✅ [useSupabaseEntity] Item creado:`, createdItem);

      // Actualizar estado local
      setData(prev => [createdItem, ...prev]);

      // Callback después de crear
      if (onAfterCreate) {
        await onAfterCreate(createdItem);
      }

      return createdItem;

    } catch (err) {
      console.error(`❌ [useSupabaseEntity] Error en create():`, err);
      handleError(err, 'create');
    }
  }, [tableName, onBeforeCreate, onAfterCreate, transformOnCreate, handleError]);

  // ACTUALIZAR (update)
  const update = useCallback(async (id, updates) => {
    try {
      setError(null);

      // Callback antes de actualizar
      let dataToUpdate = updates;
      if (onBeforeUpdate) {
        dataToUpdate = await onBeforeUpdate(id, dataToUpdate);
      }

      // Transformar datos si se especifica
      if (transformOnUpdate) {
        dataToUpdate = transformOnUpdate(dataToUpdate);
      }

      // Agregar timestamp de actualización
      dataToUpdate.updated_at = new Date().toISOString();

      const { data: result, error } = await supabase
        .from(tableName)
        .update(dataToUpdate)
        .eq('id', id)
        .select();

      if (error) throw error;

      const updatedItem = result[0];

      // Actualizar estado local
      setData(prev => prev.map(item => 
        item.id === id ? updatedItem : item
      ));

      // Callback después de actualizar
      if (onAfterUpdate) {
        await onAfterUpdate(updatedItem);
      }

      return updatedItem;

    } catch (err) {
      handleError(err, 'update');
    }
  }, [tableName, onBeforeUpdate, onAfterUpdate, transformOnUpdate, handleError]);

  // ELIMINAR (delete)
  const remove = useCallback(async (id) => {
    try {
      setError(null);

      // Callback antes de eliminar
      if (onBeforeDelete) {
        await onBeforeDelete(id);
      }

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Actualizar estado local
      setData(prev => prev.filter(item => item.id !== id));

      // Callback después de eliminar
      if (onAfterDelete) {
        await onAfterDelete(id);
      }

      return true;

    } catch (err) {
      handleError(err, 'remove');
    }
  }, [tableName, onBeforeDelete, onAfterDelete, handleError]);

  // BUSCAR (search)
  const search = useCallback(async (searchParams) => {
    try {
      setError(null);

      let query = supabase
        .from(tableName)
        .select(defaultSelect);

      // Aplicar filtros de búsqueda
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          query = query.ilike(key, `%${value}%`);
        } else if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      // Aplicar filtros por defecto
      query = applyFilters(query);

      // Aplicar ordenamiento
      query = query.order(defaultOrderBy, { ascending: defaultOrder === 'asc' });

      const { data: result, error } = await query;

      if (error) throw error;

      const finalData = transformOnFetch ? transformOnFetch(result) : result;
      setData(finalData);
      return finalData;

    } catch (err) {
      handleError(err, 'search');
    }
  }, [tableName, defaultSelect, defaultOrderBy, defaultOrder, applyFilters, transformOnFetch, handleError]);

  // QUERY PERSONALIZADA
  const customQuery = useCallback(async (queryBuilder) => {
    try {
      setError(null);
      
      let query = supabase.from(tableName);
      query = queryBuilder(query);
      
      const { data: result, error } = await query;
      
      if (error) throw error;
      
      return transformOnFetch ? transformOnFetch(result) : result;
      
    } catch (err) {
      handleError(err, 'customQuery');
    }
  }, [tableName, transformOnFetch, handleError]);

  return {
    // Estados
    data,
    loading,
    error,
    
    // Operaciones básicas
    fetchAll,
    fetchById,
    create,
    update,
    remove,
    search,
    
    // Operaciones avanzadas
    customQuery,
    
    // Utilidades
    setData,
    setError,
    clearError: () => setError(null)
  };
};