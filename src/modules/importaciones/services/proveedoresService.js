// Servicio de proveedores migrado desde src/lib/importaciones.js
import { supabase } from '../../../lib/supabase.js';


const proveedoresService = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('proveedores_sugeridos')
        .select('*')
        .order('nombre', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      throw error;
    }
  },
  async create(nombre) {
    try {
      const { data, error } = await supabase
        .from('proveedores_sugeridos')
        .insert([{ nombre: nombre.trim() }])
        .select()
        .single();
      if (error) {
        if (error.code === '23505') {
          return null;
        }
        throw error;
      }
      return data;
    } catch (error) {
      throw error;
    }
  }
};

export default proveedoresService;
