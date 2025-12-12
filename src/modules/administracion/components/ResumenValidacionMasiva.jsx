// ResumenValidacionMasiva.jsx - Resumen antes de guardar
import React from 'react';
import { CheckCircle, AlertTriangle, Save, ArrowLeft } from 'lucide-react';

const ResumenValidacionMasiva = ({
    datosComunes,
    seriales,
    tipoEquipo,
    onConfirmar,
    onVolver,
    guardando
}) => {
    const serialesValidos = seriales.filter(s => s.valido && !s.error);
    const serialesInvalidos = seriales.filter(s => s.error);
    const serialesVacios = seriales.filter(s => !s.serial.trim());

    // Campos a mostrar según tipo
    const getCamposResumen = () => {
        if (tipoEquipo === 'celular') {
            return [
                { label: 'Modelo', value: datosComunes.modelo },
                { label: 'Marca', value: datosComunes.marca },
                { label: 'Categoría', value: datosComunes.categoria === 'iphone' ? 'iPhone' : 'Android' },
                { label: 'Capacidad', value: datosComunes.capacidad },
                { label: 'Color', value: datosComunes.color },
                { label: 'Condición', value: datosComunes.condicion },
                { label: 'Precio Compra', value: datosComunes.precio_compra_usd ? `$${datosComunes.precio_compra_usd} USD` : '-' },
                { label: 'Precio Venta', value: datosComunes.precio_venta_usd ? `$${datosComunes.precio_venta_usd} USD` : '-' },
                { label: 'Sucursal', value: datosComunes.sucursal || '-' }
            ];
        }

        if (tipoEquipo === 'notebook') {
            return [
                { label: 'Modelo', value: datosComunes.modelo },
                { label: 'Marca', value: datosComunes.marca },
                { label: 'Procesador', value: datosComunes.procesador },
                { label: 'RAM', value: datosComunes.ram ? `${datosComunes.ram}GB ${datosComunes.tipo_ram || ''}` : '-' },
                { label: 'SSD', value: datosComunes.ssd || '-' },
                { label: 'Pantalla', value: datosComunes.pantalla || '-' },
                { label: 'Condición', value: datosComunes.condicion },
                { label: 'Precio Costo', value: datosComunes.precio_costo_usd ? `$${datosComunes.precio_costo_usd} USD` : '-' },
                { label: 'Precio Venta', value: datosComunes.precio_venta_usd ? `$${datosComunes.precio_venta_usd} USD` : '-' }
            ];
        }

        // Otros
        return [
            { label: 'Nombre', value: datosComunes.nombre_producto },
            { label: 'Categoría', value: datosComunes.categoria },
            { label: 'Condición', value: datosComunes.condicion },
            { label: 'Precio Compra', value: datosComunes.precio_compra_usd ? `$${datosComunes.precio_compra_usd} USD` : '-' },
            { label: 'Precio Venta', value: datosComunes.precio_venta_usd ? `$${datosComunes.precio_venta_usd} USD` : '-' }
        ];
    };

    const tipoLabels = {
        celular: 'Celulares',
        notebook: 'Notebooks',
        otro: 'Otros'
    };

    return (
        <div className="space-y-6">
            {/* Resumen de datos comunes */}
            <div className="bg-slate-50 rounded border border-slate-200 p-6">
                <h3 className="font-semibold text-lg text-slate-800 mb-4">
                    Datos Comunes - {tipoLabels[tipoEquipo]}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {getCamposResumen().map((campo, idx) => (
                        <div key={idx} className="text-sm">
                            <span className="text-slate-500">{campo.label}:</span>
                            <span className="font-medium text-slate-800 ml-2">{campo.value || '-'}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lista de seriales válidos */}
            <div className="bg-white rounded border border-slate-200 p-6">
                <h3 className="font-semibold text-lg text-slate-800 mb-4 flex items-center gap-2">
                    <CheckCircle size={20} className="text-emerald-600" />
                    Seriales a Registrar ({serialesValidos.length})
                </h3>

                {serialesValidos.length > 0 ? (
                    <div className="bg-emerald-50 rounded p-4 max-h-60 overflow-y-auto">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {serialesValidos.map((s, idx) => (
                                <div key={s.id} className="flex items-center gap-2 py-1">
                                    <CheckCircle size={14} className="text-emerald-600 flex-shrink-0" />
                                    <span className="text-sm font-mono text-emerald-800">{s.serial}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-slate-500 text-sm italic">No hay seriales válidos para registrar</p>
                )}
            </div>

            {/* Advertencias si hay seriales inválidos */}
            {(serialesInvalidos.length > 0 || serialesVacios.length > 0) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-6">
                    <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                        <AlertTriangle size={20} />
                        {serialesInvalidos.length + serialesVacios.length} seriales no serán registrados
                    </h3>

                    {serialesInvalidos.map(s => (
                        <p key={s.id} className="text-sm text-yellow-700 flex items-center gap-2 py-1">
                            <span className="font-mono">{s.serial}</span>:
                            <span className="text-yellow-600">{s.error}</span>
                        </p>
                    ))}

                    {serialesVacios.length > 0 && (
                        <p className="text-sm text-yellow-700 py-1">
                            {serialesVacios.length} campos vacíos serán ignorados
                        </p>
                    )}
                </div>
            )}

            {/* Botones de acción */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <button
                    onClick={onVolver}
                    disabled={guardando}
                    className="px-6 py-3 border border-slate-300 rounded hover:bg-slate-50 flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                    <ArrowLeft size={18} />
                    Volver a Editar
                </button>

                <button
                    onClick={onConfirmar}
                    disabled={serialesValidos.length === 0 || guardando}
                    className="px-6 py-3 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
                >
                    <Save size={18} />
                    {guardando ? 'Guardando...' : `Guardar ${serialesValidos.length} Equipos`}
                </button>
            </div>
        </div>
    );
};

export default ResumenValidacionMasiva;
