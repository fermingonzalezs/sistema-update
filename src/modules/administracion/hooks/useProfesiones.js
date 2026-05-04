import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export const useProfesiones = () => {
    const [profesiones, setProfesiones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProfesiones = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profesiones')
                .select('*')
                .order('nombre', { ascending: true });

            if (error) throw error;
            setProfesiones(data || []);
        } catch (err) {
            console.error('Error fetching profesiones:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const addProfesion = async (nombre) => {
        try {
            const { data, error } = await supabase
                .from('profesiones')
                .insert([{ nombre }])
                .select()
                .single();

            if (error) throw error;

            setProfesiones(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
            return { success: true, data };
        } catch (err) {
            console.error('Error adding profesion:', err);
            return { success: false, error: err.message };
        }
    };

    useEffect(() => {
        fetchProfesiones();
    }, []);

    return {
        profesiones,
        loading,
        error,
        fetchProfesiones,
        addProfesion
    };
};
