import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export const useMarcas = () => {
    const [marcas, setMarcas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMarcas = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('marcas')
                .select('*')
                .order('nombre', { ascending: true });

            if (error) throw error;
            setMarcas(data || []);
        } catch (err) {
            console.error('Error fetching marcas:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const addMarca = async (nombre) => {
        try {
            const { data, error } = await supabase
                .from('marcas')
                .insert([{ nombre }])
                .select()
                .single();

            if (error) throw error;

            setMarcas(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
            return { success: true, data };
        } catch (err) {
            console.error('Error adding marca:', err);
            return { success: false, error: err.message };
        }
    };

    useEffect(() => {
        fetchMarcas();
    }, []);

    return {
        marcas,
        loading,
        error,
        fetchMarcas,
        addMarca
    };
};
