import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export const useEmpresasLogistica = () => {
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchEmpresas = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('empresas_logistica')
                .select('*')
                .order('nombre', { ascending: true });

            if (error) throw error;
            setEmpresas(data || []);
        } catch (err) {
            console.error('Error fetching empresas logistica:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const addEmpresa = async (nombre) => {
        try {
            const { data, error } = await supabase
                .from('empresas_logistica')
                .insert([{ nombre }])
                .select()
                .single();

            if (error) throw error;

            setEmpresas(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
            return { success: true, data };
        } catch (err) {
            console.error('Error adding empresa logistica:', err);
            return { success: false, error: err.message };
        }
    };

    useEffect(() => {
        fetchEmpresas();
    }, []);

    return { empresas, loading, error, fetchEmpresas, addEmpresa };
};
