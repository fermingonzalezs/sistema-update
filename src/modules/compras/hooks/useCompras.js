// src/modules/compras/hooks/useCompras.js
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export const comprasService = {
  async getCompras() {
    console.log('📡 Obteniendo compras...');

    const { data, error } = await supabase
      .from('compras')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo compras:', error);
      throw error;
    }

    console.log(`✅ ${data.length} compras obtenidas`);
    return data;
  },

  async createCompra(compraData) {
    console.log('📤 Creando nueva compra:', compraData);

    const { data, error } = await supabase
      .from('compras')
      .insert([compraData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando compra:', error);
      throw error;
    }

    console.log('✅ Compra creada exitosamente:', data);
    return data;
  },

  async updateCompra(id, compraData) {
    console.log('📝 Actualizando compra:', id, compraData);

    const { data, error } = await supabase
      .from('compras')
      .update({ ...compraData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error actualizando compra:', error);
      throw error;
    }

    console.log('✅ Compra actualizada exitosamente:', data);
    return data;
  },

  async deleteCompra(id) {
    console.log('🗑️ Eliminando compra:', id);

    const { error } = await supabase
      .from('compras')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error eliminando compra:', error);
      throw error;
    }

    console.log('✅ Compra eliminada exitosamente');
  }
};

export const useCompras = () => {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCompras = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await comprasService.getCompras();
      setCompras(data);
    } catch (err) {
      setError(err.message);
      console.error('Error en fetchCompras:', err);
    } finally {
      setLoading(false);
    }
  };

  const createCompra = async (compraData) => {
    try {
      setError(null);
      const nuevaCompra = await comprasService.createCompra(compraData);
      setCompras(prev => [nuevaCompra, ...prev]);
      return nuevaCompra;
    } catch (err) {
      setError(err.message);
      console.error('Error en createCompra:', err);
      throw err;
    }
  };

  const updateCompra = async (id, compraData) => {
    try {
      setError(null);
      const compraActualizada = await comprasService.updateCompra(id, compraData);
      setCompras(prev => prev.map(compra =>
        compra.id === id ? compraActualizada : compra
      ));
      return compraActualizada;
    } catch (err) {
      setError(err.message);
      console.error('Error en updateCompra:', err);
      throw err;
    }
  };

  const deleteCompra = async (id) => {
    try {
      setError(null);
      await comprasService.deleteCompra(id);
      setCompras(prev => prev.filter(compra => compra.id !== id));
    } catch (err) {
      setError(err.message);
      console.error('Error en deleteCompra:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchCompras();
  }, []);

  return {
    compras,
    loading,
    error,
    createCompra,
    updateCompra,
    deleteCompra,
    refetch: fetchCompras
  };
};