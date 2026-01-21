// ListaSerialesEquipos.jsx - Lista de equipos con campos editables en fila
import React, { useState } from 'react';
import { Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

const ListaSerialesEquipos = ({
    seriales,
    onSerialChange,
    onItemChange,
    onAgregarFila,
    onEliminarFila,
    validando,
    datosComunes,
    tipoEquipo
}) => {
    const [cantidadGenerar, setCantidadGenerar] = useState(5);

    const handleGenerarFilas = () => {
        const cantidad = Math.min(Math.max(1, cantidadGenerar), 50);
        for (let i = 0; i < cantidad; i++) {
            onAgregarFila();
        }
    };

    // Obtener nombre del producto según tipo (sin marca)
    const getNombreProducto = () => {
        if (tipoEquipo === 'celular') {
            return `${datosComunes.modelo || ''} ${datosComunes.capacidad ? datosComunes.capacidad + 'GB' : ''}`.trim() || 'Celular';
        }
        if (tipoEquipo === 'notebook') {
            return `${datosComunes.modelo || ''} ${datosComunes.procesador || ''}`.trim() || 'Notebook';
        }
        return datosComunes.nombre_producto || 'Producto';
    };

    const nombreProductoBase = getNombreProducto();

    // Calcular precio total
    const calcularPrecioTotal = (item) => {
        const precioCompra = item.precio_compra_usd ?? item.precio_costo_usd ?? datosComunes.precio_compra_usd ?? datosComunes.precio_costo_usd ?? 0;
        const costosAdicionales = item.costos_adicionales ?? item.envios_repuestos ?? datosComunes.costos_adicionales ?? datosComunes.envios_repuestos ?? 0;
        return (parseFloat(precioCompra) || 0) + (parseFloat(costosAdicionales) || 0);
    };

    return (
        <div className="space-y-4">
            {/* Generador rápido de filas */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded border border-slate-200">
                <label className="text-sm font-medium text-slate-700">
                    Generar filas:
                </label>
                <input
                    type="number"
                    min="1"
                    max="50"
                    value={cantidadGenerar}
                    onChange={(e) => setCantidadGenerar(parseInt(e.target.value) || 1)}
                    className="w-16 border border-slate-200 rounded px-2 py-1.5 text-sm text-center"
                    disabled={validando}
                />
                <button
                    onClick={handleGenerarFilas}
                    disabled={validando}
                    className="px-3 py-1.5 bg-slate-600 text-white rounded hover:bg-slate-700 text-sm font-medium transition-colors disabled:opacity-50"
                >
                    Generar
                </button>
                <span className="text-xs text-slate-500 ml-2">
                    (Máx. 50)
                </span>
            </div>

            {/* Tabla de equipos */}
            <div className="overflow-x-auto border border-slate-200 rounded">
                <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="px-2 py-2 text-center font-medium text-slate-700 w-48">Producto</th>
                            <th className="px-2 py-2 text-center font-medium text-slate-700 w-36">Serial</th>
                            <th className="px-2 py-2 text-center font-medium text-slate-700 w-24">P. Compra</th>
                            <th className="px-2 py-2 text-center font-medium text-slate-700 w-24">Costos Ad.</th>
                            <th className="px-2 py-2 text-center font-medium text-slate-700 w-24">Total</th>
                            <th className="px-2 py-2 text-center font-medium text-slate-700 w-24">P. Venta</th>
                            <th className="px-2 py-2 text-center font-medium text-slate-700 w-24">Color</th>
                            {tipoEquipo === 'celular' && (
                                <th className="px-2 py-2 text-center font-medium text-slate-700 w-20">Batería %</th>
                            )}
                            <th className="px-2 py-2 text-center font-medium text-slate-700 w-8"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {seriales.map((item) => {
                            const precioTotal = calcularPrecioTotal(item);
                            return (
                                <tr
                                    key={item.id}
                                    className={`border-t border-slate-100 ${item.error ? 'bg-red-50' : item.valido ? 'bg-emerald-50' : 'bg-white'
                                        }`}
                                >
                                    {/* Producto (no editable) */}
                                    <td className="px-2 py-1.5">
                                        <div className="w-full px-2 py-1 text-sm text-center text-slate-700">
                                            {nombreProductoBase}
                                        </div>
                                    </td>

                                    {/* Serial */}
                                    <td className="px-2 py-1.5">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={item.serial}
                                                onChange={(e) => onSerialChange(item.id, e.target.value.toUpperCase())}
                                                placeholder="Serial..."
                                                disabled={validando}
                                                className={`w-full border rounded px-2 py-1 text-sm text-center font-mono ${item.error ? 'border-red-400 bg-white' :
                                                    item.valido ? 'border-emerald-400 bg-white' :
                                                        'border-slate-200 bg-white'
                                                    }`}
                                            />
                                            {item.error && (
                                                <div className="absolute -bottom-4 left-0 right-0 text-red-500 text-xs text-center truncate" title={item.error}>
                                                    {item.error}
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* Precio Compra */}
                                    <td className="px-2 py-1.5">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={item.precio_compra_usd ?? item.precio_costo_usd ?? ''}
                                            onChange={(e) => {
                                                const campo = tipoEquipo === 'notebook' ? 'precio_costo_usd' : 'precio_compra_usd';
                                                onItemChange(item.id, campo, parseFloat(e.target.value) || '');
                                            }}
                                            placeholder={String(datosComunes.precio_compra_usd || datosComunes.precio_costo_usd || '')}
                                            disabled={validando}
                                            className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-center bg-white"
                                        />
                                    </td>

                                    {/* Costos Adicionales */}
                                    <td className="px-2 py-1.5">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={item.costos_adicionales ?? item.envios_repuestos ?? ''}
                                            onChange={(e) => {
                                                const campo = tipoEquipo === 'notebook' ? 'envios_repuestos' : 'costos_adicionales';
                                                onItemChange(item.id, campo, parseFloat(e.target.value) || '');
                                            }}
                                            placeholder={String(datosComunes.costos_adicionales || datosComunes.envios_repuestos || 0)}
                                            disabled={validando}
                                            className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-center bg-white"
                                        />
                                    </td>

                                    {/* Precio Total (calculado - no editable) */}
                                    <td className="px-2 py-1.5">
                                        <div className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-center bg-slate-100 text-slate-700 font-medium">
                                            ${precioTotal.toFixed(0)}
                                        </div>
                                    </td>

                                    {/* Precio Venta */}
                                    <td className="px-2 py-1.5">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={item.precio_venta_usd ?? ''}
                                            onChange={(e) => onItemChange(item.id, 'precio_venta_usd', parseFloat(e.target.value) || '')}
                                            placeholder={String(datosComunes.precio_venta_usd || '')}
                                            disabled={validando}
                                            className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-center bg-white"
                                        />
                                    </td>

                                    {/* Color */}
                                    <td className="px-2 py-1.5">
                                        <input
                                            type="text"
                                            value={item.color ?? ''}
                                            onChange={(e) => onItemChange(item.id, 'color', e.target.value)}
                                            placeholder={datosComunes.color || 'Color'}
                                            disabled={validando}
                                            className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-center bg-white"
                                        />
                                    </td>

                                    {/* Batería % (solo celulares) */}
                                    {tipoEquipo === 'celular' && (
                                        <td className="px-2 py-1.5">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={item.bateria ?? 100}
                                                onChange={(e) => onItemChange(item.id, 'bateria', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                                disabled={validando}
                                                className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-center bg-white"
                                            />
                                        </td>
                                    )}

                                    {/* Eliminar */}
                                    <td className="px-1 py-1.5 text-center">
                                        {seriales.length > 1 && (
                                            <button
                                                onClick={() => onEliminarFila(item.id)}
                                                disabled={validando}
                                                className="p-1 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Botón agregar fila */}
            <button
                onClick={onAgregarFila}
                disabled={validando || seriales.length >= 50}
                className="w-full border-2 border-dashed border-slate-300 rounded py-2 text-slate-600 hover:border-emerald-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
                <Plus size={16} />
                Agregar fila
            </button>

            {/* Resumen de estado */}
            <div className="flex items-center justify-between text-sm p-2 bg-slate-100 rounded">
                <div className="flex gap-4">
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle size={14} />
                        {seriales.filter(s => s.valido && !s.error).length} válidos
                    </span>
                    <span className="text-red-600 font-medium flex items-center gap-1">
                        <AlertCircle size={14} />
                        {seriales.filter(s => s.error).length} con error
                    </span>
                </div>
                <span className="text-slate-600">
                    Total: {seriales.length} unidades
                </span>
            </div>
        </div>
    );
};

export default ListaSerialesEquipos;
