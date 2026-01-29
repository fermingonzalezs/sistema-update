/**
 * Panel de Auditoría
 * Visualización de logs con filtros por categoría, fecha, usuario y operación
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Search,
    Download,
    User,
    ChevronLeft,
    ChevronRight,
    Eye,
    X,
    RefreshCw,
    Edit,
    Trash2,
    Plus,
    LogIn,
    LogOut,
    AlertCircle,
    ClipboardList
} from 'lucide-react';
import Tarjeta from '../../../shared/components/layout/Tarjeta';
import useAuditLogs, { CATEGORIAS, OPERACIONES } from '../hooks/useAuditLogs';

// Iconos por operación
const OPERATION_ICONS = {
    INSERT: { icon: Plus, color: 'text-green-600', bg: 'bg-green-100' },
    UPDATE: { icon: Edit, color: 'text-blue-600', bg: 'bg-blue-100' },
    DELETE: { icon: Trash2, color: 'text-red-600', bg: 'bg-red-100' },
    LOGIN: { icon: LogIn, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    LOGOUT: { icon: LogOut, color: 'text-orange-600', bg: 'bg-orange-100' }
};

// Colores por categoría
const CATEGORIA_COLORS = {
    ventas: 'bg-green-100 text-green-800',
    inventario: 'bg-blue-100 text-blue-800',
    contabilidad: 'bg-purple-100 text-purple-800',
    soporte: 'bg-orange-100 text-orange-800',
    importaciones: 'bg-cyan-100 text-cyan-800',
    administracion: 'bg-indigo-100 text-indigo-800',
    sistema: 'bg-slate-100 text-slate-800'
};

const AuditPanel = () => {
    const {
        logs,
        loading,
        error,
        totalCount,
        stats,
        cargarLogs,
        cargarEstadisticas,
        exportarCSV
    } = useAuditLogs();

    // Estado de filtros
    const [filtros, setFiltros] = useState({
        categoria: 'todas',
        operacion: 'todas',
        fechaDesde: '',
        fechaHasta: '',
        usuario: '',
        busqueda: ''
    });

    const [pagina, setPagina] = useState(1);
    const [porPagina] = useState(50);
    const [modalDetalle, setModalDetalle] = useState(null);
    const [exportando, setExportando] = useState(false);

    // Cargar logs al montar y cuando cambien filtros
    useEffect(() => {
        cargarLogs({ ...filtros, pagina, porPagina });
    }, [filtros, pagina, porPagina, cargarLogs]);

    // Cargar estadísticas al montar
    useEffect(() => {
        cargarEstadisticas(7);
    }, [cargarEstadisticas]);

    // Manejar cambio de filtros
    const handleFiltroChange = useCallback((campo, valor) => {
        setFiltros(prev => ({ ...prev, [campo]: valor }));
        setPagina(1);
    }, []);

    // Limpiar filtros
    const limpiarFiltros = useCallback(() => {
        setFiltros({
            categoria: 'todas',
            operacion: 'todas',
            fechaDesde: '',
            fechaHasta: '',
            usuario: '',
            busqueda: ''
        });
        setPagina(1);
    }, []);

    // Exportar a CSV
    const handleExportar = async () => {
        setExportando(true);
        await exportarCSV(filtros);
        setExportando(false);
    };

    // Formatear fecha
    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Obtener icono de operación
    const getOperationIcon = (operation) => {
        const config = OPERATION_ICONS[operation] || { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-100' };
        const Icon = config.icon;
        return (
            <div className={`p-1.5 rounded-lg ${config.bg}`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
            </div>
        );
    };

    // Stats calculados
    const statsCalculados = useMemo(() => {
        if (!stats) return { total: 0, inserts: 0, updates: 0, deletes: 0 };

        let total = 0, inserts = 0, updates = 0, deletes = 0;
        Object.values(stats).forEach(cat => {
            total += cat.total || 0;
            inserts += cat.inserts || 0;
            updates += cat.updates || 0;
            deletes += cat.deletes || 0;
        });

        return { total, inserts, updates, deletes };
    }, [stats]);

    // Calcular páginas
    const totalPaginas = Math.ceil(totalCount / porPagina);

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="bg-white rounded border border-slate-200">
                <div className="p-6 bg-slate-800 text-white">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <ClipboardList className="w-8 h-8" />
                            <div>
                                <h2 className="text-2xl font-semibold">Auditoría</h2>
                                <p className="text-slate-300 mt-1">Registro de operaciones del sistema</p>
                            </div>
                        </div>
                        <button
                            onClick={handleExportar}
                            disabled={exportando}
                            className="bg-emerald-600 text-white px-6 py-3 rounded hover:bg-emerald-700 flex items-center gap-2 font-medium transition-colors disabled:opacity-50"
                        >
                            <Download size={18} />
                            {exportando ? 'Exportando...' : 'Exportar CSV'}
                        </button>
                    </div>
                </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Tarjeta
                    icon={ClipboardList}
                    titulo="Total (7 días)"
                    valor={statsCalculados.total}
                />
                <Tarjeta
                    icon={Plus}
                    titulo="Creaciones"
                    valor={statsCalculados.inserts}
                />
                <Tarjeta
                    icon={Edit}
                    titulo="Modificaciones"
                    valor={statsCalculados.updates}
                />
                <Tarjeta
                    icon={Trash2}
                    titulo="Eliminaciones"
                    valor={statsCalculados.deletes}
                />
            </div>

            {/* FILTROS */}
            <div className="bg-white rounded border border-slate-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Categoría</label>
                        <select
                            value={filtros.categoria}
                            onChange={(e) => handleFiltroChange('categoria', e.target.value)}
                            className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            {CATEGORIAS.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Operación</label>
                        <select
                            value={filtros.operacion}
                            onChange={(e) => handleFiltroChange('operacion', e.target.value)}
                            className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            {OPERACIONES.map(op => (
                                <option key={op.id} value={op.id}>{op.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Usuario</label>
                        <input
                            type="text"
                            value={filtros.usuario}
                            onChange={(e) => handleFiltroChange('usuario', e.target.value)}
                            placeholder="Email..."
                            className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Desde</label>
                        <input
                            type="date"
                            value={filtros.fechaDesde}
                            onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
                            className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Hasta</label>
                        <input
                            type="date"
                            value={filtros.fechaHasta}
                            onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
                            className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={limpiarFiltros}
                            className="w-full px-4 py-2 bg-slate-700 text-white rounded hover:bg-black text-sm font-medium transition-colors"
                        >
                            Limpiar Filtros
                        </button>
                    </div>
                </div>

                {/* Búsqueda */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Buscar</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={filtros.busqueda}
                                    onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                                    placeholder="Serial, modelo, transacción..."
                                    className="w-full pl-10 pr-4 border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => cargarLogs({ ...filtros, pagina, porPagina })}
                                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Actualizar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ESTADOS DE CARGA Y ERROR */}
            {loading && (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                    <span className="ml-3 text-slate-600">Cargando registros...</span>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                    <div className="text-red-700">Error: {error}</div>
                </div>
            )}

            {/* TABLA DE LOGS */}
            {!loading && !error && (
                <div className="bg-white rounded border border-slate-200 overflow-hidden">
                    {logs.length === 0 ? (
                        <div className="p-8 text-center text-slate-600">
                            <AlertCircle size={32} className="mx-auto mb-3 text-slate-400" />
                            <p>No hay registros de auditoría</p>
                            <p className="text-sm text-slate-500 mt-1">Ajusta los filtros para ver más resultados</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px]">
                                <thead className="bg-slate-800 text-white">
                                    <tr>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Fecha</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Operación</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Categoría</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Usuario</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Tabla</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Detalle</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {logs.map((log, idx) => (
                                        <tr key={log.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                            <td className="px-4 py-3 text-sm text-center text-slate-600 whitespace-nowrap">
                                                {formatearFecha(log.created_at)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {getOperationIcon(log.operation)}
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {log.operation}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-block px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ${CATEGORIA_COLORS[log.categoria] || 'bg-slate-100 text-slate-700'}`}>
                                                    {log.categoria}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-center text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis" title={log.user_email || '-'}>
                                                {log.user_email || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-center text-slate-600 font-mono whitespace-nowrap">
                                                {log.table_name}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-center text-slate-500 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap" title={log.old_values?.serial || log.description || '-'}>
                                                {log.old_values?.serial && (
                                                    <span className="text-slate-700 font-medium">
                                                        S/N: {log.old_values.serial}
                                                    </span>
                                                )}
                                                {log.old_values?.modelo && (
                                                    <span className="ml-2 text-slate-500">
                                                        {log.old_values.modelo}
                                                    </span>
                                                )}
                                                {log.description && !log.old_values?.serial && (
                                                    <span>{log.description}</span>
                                                )}
                                                {log.razon_operacion && (
                                                    <span className="ml-2 text-xs text-slate-400">
                                                        ({log.razon_operacion})
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex justify-center gap-3">
                                                    <button
                                                        onClick={() => setModalDetalle(log)}
                                                        className="text-emerald-600 hover:text-emerald-700 transition-colors"
                                                        title="Ver detalle"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Paginación */}
                    {logs.length > 0 && (
                        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50">
                            <div className="text-sm text-slate-600">
                                Mostrando {((pagina - 1) * porPagina) + 1} - {Math.min(pagina * porPagina, totalCount)} de {totalCount}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPagina(p => Math.max(1, p - 1))}
                                    disabled={pagina === 1}
                                    className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm text-slate-600 px-2">
                                    Página {pagina} de {totalPaginas || 1}
                                </span>
                                <button
                                    onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                                    disabled={pagina >= totalPaginas}
                                    className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal de detalle */}
            {modalDetalle && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Detalle del Registro</h3>
                            <button
                                onClick={() => setModalDetalle(null)}
                                className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="text-xs font-medium text-slate-500 uppercase">Fecha</label>
                                    <p className="text-sm text-slate-800">{formatearFecha(modalDetalle.created_at)}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500 uppercase">Operación</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        {getOperationIcon(modalDetalle.operation)}
                                        <span className="text-sm font-medium">{modalDetalle.operation}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500 uppercase">Usuario</label>
                                    <p className="text-sm text-slate-800">{modalDetalle.user_email || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500 uppercase">Rol</label>
                                    <p className="text-sm text-slate-800">{modalDetalle.user_role || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500 uppercase">Sucursal</label>
                                    <p className="text-sm text-slate-800">{modalDetalle.user_branch || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500 uppercase">Tabla</label>
                                    <p className="text-sm text-slate-800 font-mono">{modalDetalle.table_name}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500 uppercase">Categoría</label>
                                    <p className="text-sm text-slate-800">{modalDetalle.categoria}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500 uppercase">Razón</label>
                                    <p className="text-sm text-slate-800">{modalDetalle.razon_operacion || '-'}</p>
                                </div>
                            </div>

                            {modalDetalle.old_values && Object.keys(modalDetalle.old_values).length > 0 && (
                                <div className="mb-4">
                                    <label className="text-xs font-medium text-slate-500 uppercase block mb-2">
                                        Valores Anteriores
                                    </label>
                                    <pre className="bg-red-50 border border-red-200 rounded p-3 text-xs text-slate-700 overflow-x-auto">
                                        {JSON.stringify(modalDetalle.old_values, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {modalDetalle.new_values && Object.keys(modalDetalle.new_values).length > 0 && (
                                <div className="mb-4">
                                    <label className="text-xs font-medium text-slate-500 uppercase block mb-2">
                                        Valores Nuevos
                                    </label>
                                    <pre className="bg-green-50 border border-green-200 rounded p-3 text-xs text-slate-700 overflow-x-auto">
                                        {JSON.stringify(modalDetalle.new_values, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {modalDetalle.changed_fields && modalDetalle.changed_fields.length > 0 && (
                                <div>
                                    <label className="text-xs font-medium text-slate-500 uppercase block mb-2">
                                        Campos Modificados
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {modalDetalle.changed_fields.map((field, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                                {field}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditPanel;
