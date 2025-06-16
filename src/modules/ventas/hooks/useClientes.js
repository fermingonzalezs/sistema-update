// src/lib/clientes.js - Service + Hook completo
import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

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
        .select('id, fecha_creacion, procedencia')
        .eq('activo', true);

      if (error) throw error;

      const totalClientes = data.length;
      
      // Clientes nuevos este mes
      const clientesEsteMs = data.filter(cliente => {
        const fecha = new Date(cliente.fecha_creacion);
        const ahora = new Date();
        return fecha.getMonth() === ahora.getMonth() && 
               fecha.getFullYear() === ahora.getFullYear();
      }).length;

      return {
        total: totalClientes,
        nuevosEsteMs: clientesEsteMs
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

  // 🎂 Obtener próximos cumpleaños (próximos 30 días)
  async getProximosCumpleanos() {
    try {
      console.log('🎂 Obteniendo próximos cumpleaños...');
      
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('activo', true)
        .not('cumpleanos', 'is', null)
        .order('cumpleanos', { ascending: true });

      if (error) throw error;

      // Filtrar cumpleaños próximos (próximos 30 días)
      const hoy = new Date();
      const en30Dias = new Date();
      en30Dias.setDate(hoy.getDate() + 30);

      const proximosCumpleanos = data.filter(cliente => {
        if (!cliente.cumpleanos) return false;
        
        const cumple = new Date(cliente.cumpleanos);
        // Ajustar al año actual
        const cumpleEsteAno = new Date(hoy.getFullYear(), cumple.getMonth(), cumple.getDate());
        
        // Si ya pasó este año, considerar el próximo año
        if (cumpleEsteAno < hoy) {
          cumpleEsteAno.setFullYear(hoy.getFullYear() + 1);
        }
        
        return cumpleEsteAno <= en30Dias;
      });

      console.log(`✅ ${proximosCumpleanos.length} cumpleaños próximos encontrados`);
      return proximosCumpleanos;
    } catch (error) {
      console.error('❌ Error obteniendo próximos cumpleaños:', error);
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

  // Buscar clientes (sin actualizar el estado principal)
  const searchClientes = useCallback(async (searchTerm) => {
    try {
      const data = await clientesService.search(searchTerm);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error searching clientes:', err);
      return [];
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

  // Obtener cliente por ID
  const getClienteById = useCallback(async (id) => {
    try {
      return await clientesService.getById(id);
    } catch (err) {
      console.error('Error getting cliente by ID:', err);
      return null;
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
    getClienteById
  };
};