/**
 * Hook para gestionar logs de auditoría
 * Proporciona funciones para cargar, filtrar y exportar logs
 */

import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

// Categorías disponibles
export const CATEGORIAS = [
    { id: 'todas', label: 'Todas', color: 'gray' },
    { id: 'ventas', label: 'Ventas', color: 'green' },
    { id: 'inventario', label: 'Inventario', color: 'blue' },
    { id: 'contabilidad', label: 'Contabilidad', color: 'purple' },
    { id: 'soporte', label: 'Soporte', color: 'orange' },
    { id: 'importaciones', label: 'Importaciones', color: 'cyan' },
    { id: 'administracion', label: 'Administración', color: 'indigo' },
    { id: 'sistema', label: 'Sistema', color: 'slate' }
];

// Operaciones disponibles
export const OPERACIONES = [
    { id: 'todas', label: 'Todas' },
    { id: 'INSERT', label: 'Creación' },
    { id: 'UPDATE', label: 'Modificación' },
    { id: 'DELETE', label: 'Eliminación' },
    { id: 'LOGIN', label: 'Login' },
    { id: 'LOGOUT', label: 'Logout' }
];

const useAuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const [stats, setStats] = useState(null);

    // Cargar logs con filtros
    const cargarLogs = useCallback(async ({
        categoria = 'todas',
        operacion = 'todas',
        fechaDesde = null,
        fechaHasta = null,
        usuario = '',
        busqueda = '',
        pagina = 1,
        porPagina = 50
    } = {}) => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('audit_log')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false });

            // Filtro por categoría
            if (categoria && categoria !== 'todas') {
                query = query.eq('categoria', categoria);
            }

            // Filtro por operación
            if (operacion && operacion !== 'todas') {
                query = query.eq('operation', operacion);
            }

            // Filtro por fecha desde
            if (fechaDesde) {
                query = query.gte('created_at', fechaDesde);
            }

            // Filtro por fecha hasta
            if (fechaHasta) {
                const fechaHastaFin = new Date(fechaHasta);
                fechaHastaFin.setHours(23, 59, 59, 999);
                query = query.lte('created_at', fechaHastaFin.toISOString());
            }

            // Filtro por usuario
            if (usuario) {
                query = query.ilike('user_email', `%${usuario}%`);
            }

            // Búsqueda en old_values (serial, modelo, etc.)
            if (busqueda) {
                // Buscar en old_values como texto
                query = query.or(
                    `old_values.cs.{"serial":"${busqueda}"},old_values.cs.{"modelo":"${busqueda}"},referencia_id.eq.${busqueda},description.ilike.%${busqueda}%`
                );
            }

            // Paginación
            const desde = (pagina - 1) * porPagina;
            const hasta = desde + porPagina - 1;
            query = query.range(desde, hasta);

            const { data, error: queryError, count } = await query;

            if (queryError) {
                throw queryError;
            }

            setLogs(data || []);
            setTotalCount(count || 0);

        } catch (err) {
            console.error('Error cargando logs:', err);
            setError(err.message);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar estadísticas generales
    const cargarEstadisticas = useCallback(async (diasAtras = 7) => {
        try {
            const fechaDesde = new Date();
            fechaDesde.setDate(fechaDesde.getDate() - diasAtras);

            const { data, error } = await supabase
                .from('audit_log')
                .select('categoria, operation')
                .gte('created_at', fechaDesde.toISOString());

            if (error) throw error;

            // Calcular estadísticas
            const statsMap = {};
            data.forEach(log => {
                if (!statsMap[log.categoria]) {
                    statsMap[log.categoria] = { inserts: 0, updates: 0, deletes: 0, otros: 0, total: 0 };
                }
                statsMap[log.categoria].total++;

                switch (log.operation) {
                    case 'INSERT':
                        statsMap[log.categoria].inserts++;
                        break;
                    case 'UPDATE':
                        statsMap[log.categoria].updates++;
                        break;
                    case 'DELETE':
                        statsMap[log.categoria].deletes++;
                        break;
                    default:
                        statsMap[log.categoria].otros++;
                }
            });

            setStats(statsMap);
        } catch (err) {
            console.error('Error cargando estadísticas:', err);
        }
    }, []);

    // Exportar a CSV
    const exportarCSV = useCallback(async (filtros = {}) => {
        try {
            // Cargar todos los logs sin paginación
            let query = supabase
                .from('audit_log')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10000); // Límite máximo

            if (filtros.categoria && filtros.categoria !== 'todas') {
                query = query.eq('categoria', filtros.categoria);
            }
            if (filtros.operacion && filtros.operacion !== 'todas') {
                query = query.eq('operation', filtros.operacion);
            }
            if (filtros.fechaDesde) {
                query = query.gte('created_at', filtros.fechaDesde);
            }
            if (filtros.fechaHasta) {
                query = query.lte('created_at', filtros.fechaHasta);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Construir CSV
            const headers = [
                'Fecha',
                'Usuario',
                'Rol',
                'Sucursal',
                'Categoría',
                'Operación',
                'Tabla',
                'Razón',
                'Descripción',
                'Serial',
                'Modelo'
            ];

            const rows = data.map(log => [
                new Date(log.created_at).toLocaleString('es-AR'),
                log.user_email || '',
                log.user_role || '',
                log.user_branch || '',
                log.categoria || '',
                log.operation || '',
                log.table_name || '',
                log.razon_operacion || '',
                log.description || '',
                log.old_values?.serial || log.new_values?.serial || '',
                log.old_values?.modelo || log.new_values?.modelo || ''
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            ].join('\n');

            // Descargar archivo
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();

            return true;
        } catch (err) {
            console.error('Error exportando CSV:', err);
            setError('Error al exportar CSV');
            return false;
        }
    }, []);

    // Obtener detalle de un log específico
    const obtenerDetalle = useCallback(async (logId) => {
        try {
            const { data, error } = await supabase
                .from('audit_log')
                .select('*')
                .eq('id', logId)
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error obteniendo detalle:', err);
            return null;
        }
    }, []);

    return {
        logs,
        loading,
        error,
        totalCount,
        stats,
        cargarLogs,
        cargarEstadisticas,
        exportarCSV,
        obtenerDetalle,
        CATEGORIAS,
        OPERACIONES
    };
};

export default useAuditLogs;
