// src/lib/clientes.js - Service + Hook completo
import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { parseFechaLocal } from '../../../shared/utils/formatters';

// 📊 SERVICE: Operaciones de base de datos
export const clientesService = {
  // 📋 Obtener todos los clientes activos
  async getAll() {
    try {
      console.log('📡 Obteniendo todos los clientes...');
      
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('activo', true)
        .order('apellido', { ascending: true });

      if (error) throw error;
      
      console.log(`✅ ${data.length} clientes obtenidos`);
      return data || [];
    } catch (error) {
      console.error('❌ Error obteniendo clientes:', error);
      throw error;
    }
  },

  // 🔍 Buscar clientes por texto (nombre, apellido, email, teléfono, profesión)
  async search(searchTerm) {
    try {
      console.log('🔍 Buscando clientes:', searchTerm);
      
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('activo', true)
        .or(`nombre.ilike.%${searchTerm}%,apellido.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,telefono.ilike.%${searchTerm}%,profesion.ilike.%${searchTerm}%`)
        .order('apellido', { ascending: true });

      if (error) throw error;
      
      console.log(`✅ ${data.length} clientes encontrados`);
      return data || [];
    } catch (error) {
      console.error('❌ Error buscando clientes:', error);
      throw error;
    }
  },

  // 👤 Obtener cliente por ID
  async getById(id) {
    try {
      console.log('👤 Obteniendo cliente ID:', id);
      
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      console.log('✅ Cliente obtenido:', data.nombre);
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo cliente:', error);
      throw error;
    }
  },

  // 🆕 Crear nuevo cliente
  async create(clienteData) {
    try {
      console.log('💾 Creando cliente:', clienteData.nombre, clienteData.apellido);
      
      // Validaciones básicas
      if (!clienteData.nombre || !clienteData.apellido) {
        throw new Error('Nombre y apellido son obligatorios');
      }

      const { data, error } = await supabase
        .from('clientes')
        .insert([{
          nombre: clienteData.nombre.trim(),
          apellido: clienteData.apellido.trim(),
          email: clienteData.email?.trim() || null,
          telefono: clienteData.telefono?.trim() || null,
          cumpleanos: clienteData.cumpleanos || null,
          procedencia: clienteData.procedencia || null,
          profesion: clienteData.profesion?.trim() || null,
          notas: clienteData.notas?.trim() || null
        }])
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Cliente creado exitosamente:', data.nombre);
      return data;
    } catch (error) {
      console.error('❌ Error creando cliente:', error);
      
      // Manejar errores específicos
      if (error.code === '23505') {
        if (error.message.includes('email')) {
          throw new Error('Ya existe un cliente con este email');
        }
      }
      
      throw error;
    }
  },

  // ✏️ Actualizar cliente existente
  async update(id, clienteData) {
    try {
      console.log(`🔄 Actualizando cliente ID: ${id}`);
      
      const { data, error } = await supabase
        .from('clientes')
        .update({
          nombre: clienteData.nombre?.trim(),
          apellido: clienteData.apellido?.trim(),
          email: clienteData.email?.trim() || null,
          telefono: clienteData.telefono?.trim() || null,
          cumpleanos: clienteData.cumpleanos || null,
          procedencia: clienteData.procedencia || null,
          profesion: clienteData.profesion?.trim() || null,
          notas: clienteData.notas?.trim() || null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Cliente actualizado:', data.nombre);
      return data;
    } catch (error) {
      console.error('❌ Error actualizando cliente:', error);
      throw error;
    }
  },

  // 🗑️ Eliminar cliente (soft delete - solo lo marca como inactivo)
  async delete(id) {
    try {
      console.log(`🗑️ Eliminando cliente ID: ${id}`);
      
      const { data, error } = await supabase
        .from('clientes')
        .update({ activo: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Cliente eliminado (marcado como inactivo)');
      return data;
    } catch (error) {
      console.error('❌ Error eliminando cliente:', error);
      throw error;
    }
  },

  // 📊 Obtener estadísticas básicas de clientes
  async getStats() {
    try {
      console.log('📊 Calculando estadísticas de clientes...');
      
      const { data, error } = await supabase
        .from('clientes')
        .select('id, fecha_creacion, procedencia, cumpleanos')
        .eq('activo', true);

      if (error) throw error;

      const totalClientes = data.length;
      
      // Clientes nuevos este mes
      const ahora = new Date();
      const clientesEsteMs = data.filter(cliente => {
        const fecha = new Date(cliente.fecha_creacion);
        return fecha.getMonth() === ahora.getMonth() && 
               fecha.getFullYear() === ahora.getFullYear();
      }).length;

      // Cumpleaños ESTE MES específicamente
      const cumpleanosEsteMes = data.filter(cliente => {
        if (!cliente.cumpleanos) return false;
        // Usar parseFechaLocal para evitar problemas de zona horaria
        const cumple = parseFechaLocal(cliente.cumpleanos);
        return cumple && cumple.getMonth() === ahora.getMonth();
      }).length;

      return {
        total: totalClientes,
        nuevosEsteMs: clientesEsteMs,
        cumpleanosEsteMes: cumpleanosEsteMes
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw error;
    }
  },

  // 📈 Obtener clientes agrupados por procedencia
  async getByProcedencia() {
    try {
      console.log('📈 Obteniendo estadísticas por procedencia...');
      
      const { data, error } = await supabase
        .from('clientes')
        .select('procedencia')
        .eq('activo', true);

      if (error) throw error;

      // Agrupar por procedencia
      const stats = data.reduce((acc, cliente) => {
        const proc = cliente.procedencia || 'otro';
        acc[proc] = (acc[proc] || 0) + 1;
        return acc;
      }, {});

      return stats;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas por procedencia:', error);
      throw error;
    }
  },

  // 🎂 Obtener próximos cumpleaños con orden de proximidad
  async getProximosCumpleanos() {
    try {
      console.log('🎂 Obteniendo próximos cumpleaños (con nueva lógica)...');
      
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('activo', true)
        .not('cumpleanos', 'is', null);

      if (error) throw error;

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const clientesConCumpleanos = data.map(cliente => {
        // Usar parseFechaLocal para evitar problemas de zona horaria
        const cumple = parseFechaLocal(cliente.cumpleanos);
        if (!cumple || isNaN(cumple.getTime())) return null;

        let cumpleEsteAno = new Date(hoy.getFullYear(), cumple.getMonth(), cumple.getDate());
        cumpleEsteAno.setHours(0, 0, 0, 0);

        // Calcula la diferencia en días. Si el cumpleaños ya pasó, la diferencia será negativa.
        let diff = (cumpleEsteAno.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);

        // Si la diferencia es muy negativa (más de 2 días atrás), calcula para el próximo año
        if (diff < -2) {
          let cumpleProximoAno = new Date(hoy.getFullYear() + 1, cumple.getMonth(), cumple.getDate());
          cumpleProximoAno.setHours(0, 0, 0, 0);
          diff = (cumpleProximoAno.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
        }
        
        return {
          ...cliente,
          diasParaCumple: diff
        };
      }).filter(Boolean); // Eliminar nulos si la fecha de cumpleaños es inválida

      // Ordenar por proximidad (los que ya pasaron hace poco primero, luego los que vienen)
      const cumpleañosOrdenados = clientesConCumpleanos.sort((a, b) => a.diasParaCumple - b.diasParaCumple);
      
      // Filtrar para incluir solo los que pasaron hace 2 días o menos, y los próximos 15 días.
      const cumpleañosFiltrados = cumpleañosOrdenados.filter(c => c.diasParaCumple >= -2 && c.diasParaCumple <= 15);

      console.log(`✅ ${cumpleañosFiltrados.length} cumpleaños próximos encontrados y ordenados`);
      return cumpleañosFiltrados;
    } catch (error) {
      console.error('❌ Error obteniendo próximos cumpleaños:', error);
      throw error;
    }
  },

  // 🛒 Obtener historial de compras de un cliente específico
  async getHistorialCompras(clienteId) {
    try {
      console.log('🛒 Obteniendo historial de compras para cliente ID:', clienteId);

      const { data, error } = await supabase
        .from('transacciones')
        .select(`
          id,
          numero_transaccion,
          fecha_venta,
          total_venta,
          total_costo,
          margen_total,
          metodo_pago,
          metodo_pago_2,
          monto_pago_1,
          monto_pago_2,
          vendedor,
          sucursal,
          venta_items (
            id,
            tipo_producto,
            serial_producto,
            copy,
            cantidad,
            precio_unitario,
            precio_total,
            precio_costo,
            margen_item,
            garantia
          )
        `)
        .eq('cliente_id', clienteId)
        .order('fecha_venta', { ascending: false });

      if (error) {
        console.warn(`⚠️ Error obteniendo historial para cliente ${clienteId}:`, error);
        return []; // Retornar array vacío en lugar de lanzar error
      }

      console.log(`✅ ${data?.length || 0} compras encontradas para el cliente`);
      return data || [];
    } catch (error) {
      console.warn('⚠️ Error obteniendo historial de compras:', error);
      return []; // Retornar array vacío para que no falle el componente
    }
  },

  // 🎂 Obtener próximos cumpleaños con historial de compras
  async getProximosCumpleanosConHistorial() {
    try {
      console.log('🎂 Obteniendo próximos cumpleaños con historial...');
      
      const proximosCumpleanos = await this.getProximosCumpleanos();
      
      // Para cada cliente con cumpleaños próximo, obtener su historial
      const clientesConHistorial = await Promise.all(
        proximosCumpleanos.map(async (cliente) => {
          const historial = await this.getHistorialCompras(cliente.id);
          return {
            ...cliente,
            historialCompras: historial
          };
        })
      );

      console.log(`✅ ${clientesConHistorial.length} clientes con cumpleaños e historial obtenidos`);
      return clientesConHistorial;
    } catch (error) {
      console.error('❌ Error obteniendo cumpleaños con historial:', error);
      throw error;
    }
  }
};

// 🎣 HOOK: Lógica de React para usar en componentes
export const useClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar todos los clientes
  const fetchClientes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clientesService.getAll();
      setClientes(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching clientes:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar clientes (actualizar estado con los resultados)
  const searchClientes = useCallback(async (searchTerm) => {
    setLoading(true);
    setError(null);
    try {
      const data = await clientesService.search(searchTerm);
      setClientes(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error searching clientes:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear cliente
  const createCliente = useCallback(async (clienteData) => {
    setLoading(true);
    setError(null);
    try {
      const nuevoCliente = await clientesService.create(clienteData);
      setClientes(prev => [nuevoCliente, ...prev]);
      return nuevoCliente;
    } catch (err) {
      setError(err.message);
      console.error('Error creating cliente:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar cliente
  const updateCliente = useCallback(async (id, clienteData) => {
    setLoading(true);
    setError(null);
    try {
      const clienteActualizado = await clientesService.update(id, clienteData);
      setClientes(prev => prev.map(cliente => 
        cliente.id === id ? clienteActualizado : cliente
      ));
      return clienteActualizado;
    } catch (err) {
      setError(err.message);
      console.error('Error updating cliente:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Eliminar cliente
  const deleteCliente = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await clientesService.delete(id);
      setClientes(prev => prev.filter(cliente => cliente.id !== id));
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error deleting cliente:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener estadísticas
  const getEstadisticas = useCallback(async () => {
    try {
      const stats = await clientesService.getStats();
      const procedencia = await clientesService.getByProcedencia();
      const proximosCumpleanos = await clientesService.getProximosCumpleanos();
      
      return {
        ...stats,
        procedencia,
        proximosCumpleanos
      };
    } catch (err) {
      console.error('Error getting estadísticas:', err);
      return null;
    }
  }, []);

  // Obtener próximos cumpleaños con historial de compras
  const getProximosCumpleanosConHistorial = useCallback(async () => {
    try {
      return await clientesService.getProximosCumpleanosConHistorial();
    } catch (err) {
      console.error('Error getting cumpleaños con historial:', err);
      return [];
    }
  }, []);

  // Obtener cliente por ID
  const getClienteById = useCallback(async (id) => {
    try {
      return await clientesService.getById(id);
    } catch (err) {
      console.error('Error getting cliente by ID:', err);
      return null;
    }
  }, []);

  // Obtener historial de compras de un cliente
  const getHistorialCompras = useCallback(async (clienteId) => {
    try {
      return await clientesService.getHistorialCompras(clienteId);
    } catch (err) {
      console.error('Error getting historial de compras:', err);
      return [];
    }
  }, []);

  return {
    clientes,
    loading,
    error,
    fetchClientes,
    searchClientes,
    createCliente,
    updateCliente,
    deleteCliente,
    getEstadisticas,
    getClienteById,
    getProximosCumpleanosConHistorial,
    getHistorialCompras
  };
};