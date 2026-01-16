// ResumenValidacionMasiva.jsx - Resumen minimalista antes de guardar
import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ResumenValidacionMasiva = ({
    datosComunes,
    seriales,
    tipoEquipo
}) => {
    const serialesValidos = seriales.filter(s => s.valido && !s.error);
    const serialesInvalidos = seriales.filter(s => s.error);

    const getModelo = () => {
        if (tipoEquipo === 'celular' || tipoEquipo === 'notebook') {
            return `${datosComunes.marca || ''} ${datosComunes.modelo || ''}`.trim();
        }
        return datosComunes.nombre_producto || '';
    };

    const getPrecioCompra = () => {
        if (tipoEquipo === 'notebook') {
            return datosComunes.precio_costo_usd || '-';
        }
        return datosComunes.precio_compra_usd || '-';
    };

    const getPrecioVenta = () => {
        return datosComunes.precio_venta_usd || '-';
    };

    const getColor = () => {
        return datosComunes.color || '-';
    };

    return (
        <div className="max-w-3xl mx-auto">
            {/* Tabla de equipos */}
            {serialesValidos.length > 0 && (
                <div className="bg-white rounded border border-slate-200 overflow-hidden mb-4">
                    <table className="w-full">
                        <thead className="bg-slate-800 text-white">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Serial</th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Modelo</th>
                                <th className="px-4 py-2 text-right text-xs font-medium uppercase">Compra</th>
                                <th className="px-4 py-2 text-right text-xs font-medium uppercase">Venta</th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Color</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {serialesValidos.map((s, idx) => (
                                <tr key={s.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                    <td className="px-4 py-2 text-sm font-mono text-slate-800">{s.serial}</td>
                                    <td className="px-4 py-2 text-sm text-slate-800">{getModelo()}</td>
                                    <td className="px-4 py-2 text-sm text-slate-600 text-right">${getPrecioCompra()}</td>
                                    <td className="px-4 py-2 text-sm text-slate-800 text-right font-medium">${getPrecioVenta()}</td>
                                    <td className="px-4 py-2 text-sm text-slate-600">{s.color || getColor()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Errores si hay */}
            {serialesInvalidos.length > 0 && (
                <div className="bg-yellow-50 rounded border border-yellow-200 p-3">
                    <p className="text-yellow-800 text-sm font-medium mb-2 flex items-center gap-2">
                        <AlertTriangle size={16} />
                        {serialesInvalidos.length} no se registrarán
                    </p>
                    {serialesInvalidos.map(s => (
                        <p key={s.id} className="text-xs text-yellow-700">
                            <span className="font-mono">{s.serial}</span>: {s.error}
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ResumenValidacionMasiva;
