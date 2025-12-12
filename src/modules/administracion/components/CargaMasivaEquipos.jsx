// CargaMasivaEquipos.jsx - Modal principal para carga masiva
import React, { useState, useCallback, useMemo } from 'react';
import { X, Package, Smartphone, Monitor, Box, ArrowRight, ArrowLeft, Loader2, CheckCircle, AlertTriangle, FileDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import FormularioDatosComunes from './FormularioDatosComunes';
import ListaSerialesEquipos from './ListaSerialesEquipos';
import ResumenValidacionMasiva from './ResumenValidacionMasiva';
import { useCargaMasiva } from '../hooks/useCargaMasiva';
import { validarDatosComunes } from '../utils/validacionesMasivas';
import { obtenerFechaLocal } from '../../../shared/utils/formatters';
import { useAuth } from '../../../hooks/useAuth';

const CargaMasivaEquipos = ({ isOpen, onClose, onSuccess, tipoDefault = null }) => {
    // Obtener usuario actual
    const { user } = useAuth();
    // Estado del wizard (3 pasos)
    const [paso, setPaso] = useState(1);
    const [tipoEquipo, setTipoEquipo] = useState(tipoDefault || 'celular');
    const [datosComunes, setDatosComunes] = useState({
        ingreso: obtenerFechaLocal()
    });
    const [erroresDatos, setErroresDatos] = useState({});
    const [seriales, setSeriales] = useState([
        { id: uuidv4(), serial: '', valido: false, error: null }
    ]);

    // Hook de carga masiva
    const {
        validando,
        guardando,
        progreso,
        resultado,
        validarTodosSeriales,
        guardarEquiposMasivos,
        resetear
    } = useCargaMasiva(tipoEquipo);

    // Reiniciar al cambiar tipo
    const handleTipoChange = (nuevoTipo) => {
        setTipoEquipo(nuevoTipo);
        setDatosComunes({ ingreso: obtenerFechaLocal() });
        setErroresDatos({});
        setSeriales([{ id: uuidv4(), serial: '', valido: false, error: null }]);
        resetear();
    };

    // Manejar cambios en seriales
    const handleSerialChange = useCallback((id, nuevoSerial) => {
        setSeriales(prev => prev.map(s =>
            s.id === id
                ? { ...s, serial: nuevoSerial, valido: false, error: null }
                : s
        ));
    }, []);

    const handleAgregarFila = useCallback(() => {
        if (seriales.length < 50) {
            setSeriales(prev => [...prev, { id: uuidv4(), serial: '', valido: false, error: null }]);
        }
    }, [seriales.length]);

    const handleEliminarFila = useCallback((id) => {
        setSeriales(prev => prev.filter(s => s.id !== id));
    }, []);

    // Manejar cambios en campos individuales de cada item
    const handleItemChange = useCallback((id, campo, valor) => {
        setSeriales(prev => prev.map(s =>
            s.id === id ? { ...s, [campo]: valor } : s
        ));
    }, []);

    // Validar datos comunes antes de avanzar
    const validarPaso2 = () => {
        const { valido, errores } = validarDatosComunes(datosComunes, tipoEquipo);
        setErroresDatos(errores);
        return valido;
    };

    // Avanzar al paso 3 (validar seriales)
    const avanzarAPaso3 = async () => {
        // Filtrar seriales vacíos para validación
        const serialesNoVacios = seriales.filter(s => s.serial.trim());

        if (serialesNoVacios.length === 0) {
            alert('Ingresa al menos un número de serie');
            return;
        }

        // Validar todos los seriales
        const serialesValidados = await validarTodosSeriales(seriales);
        setSeriales(serialesValidados);

        // Verificar que hay al menos uno válido
        const validos = serialesValidados.filter(s => s.valido && !s.error);
        if (validos.length === 0) {
            alert('No hay seriales válidos para continuar. Corrige los errores indicados.');
            return;
        }

        setPaso(3);
    };

    // Confirmar y guardar
    const handleConfirmarGuardado = async () => {
        try {
            // Obtener email del usuario para el registro
            const usuarioEmail = user?.email || user?.user_metadata?.email || 'Sistema';

            // Guardar equipos y registrar en ingreso_equipos
            const resultado = await guardarEquiposMasivos(datosComunes, seriales, usuarioEmail);

            if (resultado.exitosos > 0) {
                // Mostrar resultado exitoso
                setPaso(4); // Paso de resultado
            }
        } catch (error) {
            console.error('Error en guardado masivo:', error);
            alert('Error crítico al guardar: ' + error.message);
        }
    };

    // Cerrar y resetear
    const handleCerrar = () => {
        setPaso(1);
        setTipoEquipo(tipoDefault || 'celular');
        setDatosComunes({ ingreso: obtenerFechaLocal() });
        setErroresDatos({});
        setSeriales([{ id: uuidv4(), serial: '', valido: false, error: null }]);
        resetear();
        onClose();
    };

    // Nueva carga
    const handleNuevaCarga = () => {
        setPaso(1);
        setDatosComunes({ ingreso: obtenerFechaLocal() });
        setErroresDatos({});
        setSeriales([{ id: uuidv4(), serial: '', valido: false, error: null }]);
        resetear();
        if (onSuccess) onSuccess();
    };

    // Exportar reporte de errores
    const exportarReporte = () => {
        if (!resultado) return;

        const lineas = [
            'REPORTE DE CARGA MASIVA',
            `Fecha: ${new Date().toLocaleString('es-AR')}`,
            `Tipo: ${tipoEquipo}`,
            '',
            `EXITOSOS: ${resultado.exitosos}`,
            ...resultado.detalleExitosos.map(e => `  ✓ ${e.serial} (ID: ${e.id})`),
            '',
            `FALLIDOS: ${resultado.fallidos}`,
            ...resultado.detalleFallidos.map(e => `  ✗ ${e.serial}: ${e.error}`)
        ];

        const blob = new Blob([lineas.join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `carga-masiva-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Seriales válidos para el resumen
    const serialesValidos = useMemo(() =>
        seriales.filter(s => s.valido && !s.error),
        [seriales]
    );

    if (!isOpen) return null;

    const tipoConfig = {
        celular: { label: 'Celulares', icon: Smartphone, color: 'bg-purple-500' },
        notebook: { label: 'Notebooks', icon: Monitor, color: 'bg-blue-500' },
        otro: { label: 'Otros', icon: Box, color: 'bg-emerald-500' }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="bg-slate-800 p-6 text-white flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <Package size={28} />
                            <div>
                                <h2 className="text-2xl font-semibold">Carga Masiva de Equipos</h2>
                                <p className="text-slate-300 mt-1">
                                    {paso === 1 && 'Selecciona el tipo de equipo'}
                                    {paso === 2 && `Datos comunes para ${tipoConfig[tipoEquipo].label}`}
                                    {paso === 3 && 'Confirma los equipos a registrar'}
                                    {paso === 4 && 'Resultado del proceso'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleCerrar}
                            className="text-slate-300 hover:text-white transition-colors"
                            disabled={guardando}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Progress bar */}
                    {paso < 4 && (
                        <div className="mt-4 flex items-center gap-2">
                            {[1, 2, 3].map(p => (
                                <div
                                    key={p}
                                    className={`flex-1 h-1 rounded ${p <= paso ? 'bg-emerald-500' : 'bg-slate-600'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Contenido con scroll */}
                <div className="p-6 overflow-y-auto flex-1" style={{ maxHeight: 'calc(90vh - 200px)' }}>

                    {/* PASO 1: Selección de tipo */}
                    {paso === 1 && (
                        <div>
                            <p className="text-slate-600 mb-6">
                                Selecciona el tipo de equipo que vas a cargar:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {Object.entries(tipoConfig).map(([tipo, config]) => {
                                    const Icon = config.icon;
                                    return (
                                        <button
                                            key={tipo}
                                            onClick={() => handleTipoChange(tipo)}
                                            className={`p-6 rounded border-2 transition-all ${tipoEquipo === tipo
                                                ? 'border-emerald-600 bg-emerald-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 ${config.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                                                <Icon size={24} className="text-white" />
                                            </div>
                                            <div className="text-lg font-semibold text-slate-800">{config.label}</div>
                                            <p className="text-sm text-slate-500 mt-1">
                                                {tipo === 'celular' && 'iPhone, Android'}
                                                {tipo === 'notebook' && 'MacBook, Windows, Gaming'}
                                                {tipo === 'otro' && 'Accesorios, componentes, etc.'}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* PASO 2: Formulario de datos comunes */}
                    {paso === 2 && (
                        <FormularioDatosComunes
                            tipoEquipo={tipoEquipo}
                            datos={datosComunes}
                            onChange={setDatosComunes}
                            errores={erroresDatos}
                        />
                    )}

                    {/* PASO 3: Seriales y confirmación */}
                    {paso === 3 && (
                        <div className="space-y-6">
                            <div className="bg-slate-50 rounded border border-slate-200 p-4 mb-4">
                                <h4 className="font-semibold text-slate-800 mb-2">Resumen de datos comunes:</h4>
                                <div className="text-sm text-slate-600">
                                    {tipoEquipo === 'celular' && (
                                        <span>{datosComunes.marca} {datosComunes.modelo} - {datosComunes.capacidad}GB {datosComunes.color}</span>
                                    )}
                                    {tipoEquipo === 'notebook' && (
                                        <span>{datosComunes.marca} {datosComunes.modelo} - {datosComunes.procesador} {datosComunes.ram}GB</span>
                                    )}
                                    {tipoEquipo === 'otro' && (
                                        <span>{datosComunes.nombre_producto} - {datosComunes.categoria}</span>
                                    )}
                                </div>
                            </div>

                            <ResumenValidacionMasiva
                                datosComunes={datosComunes}
                                seriales={seriales}
                                tipoEquipo={tipoEquipo}
                                onConfirmar={handleConfirmarGuardado}
                                onVolver={() => setPaso(2)}
                                guardando={guardando}
                            />
                        </div>
                    )}

                    {/* PASO 4: Resultado */}
                    {paso === 4 && resultado && (
                        <div className="space-y-6">
                            {/* Resumen principal */}
                            <div className={`p-6 rounded border-2 ${resultado.fallidos === 0
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-yellow-50 border-yellow-200'
                                }`}>
                                <div className="flex items-center gap-3 mb-4">
                                    {resultado.fallidos === 0 ? (
                                        <CheckCircle size={32} className="text-emerald-600" />
                                    ) : (
                                        <AlertTriangle size={32} className="text-yellow-600" />
                                    )}
                                    <div>
                                        <h3 className="text-xl font-semibold text-slate-800">
                                            {resultado.exitosos} equipos registrados exitosamente
                                        </h3>
                                        {resultado.fallidos > 0 && (
                                            <p className="text-yellow-700">{resultado.fallidos} equipos con errores</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Detalle de exitosos */}
                            {resultado.detalleExitosos.length > 0 && (
                                <div className="bg-white rounded border border-slate-200 p-4">
                                    <h4 className="font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                                        <CheckCircle size={18} />
                                        Exitosos ({resultado.exitosos})
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                                        {resultado.detalleExitosos.map((e, idx) => (
                                            <div key={idx} className="text-sm text-slate-700 font-mono bg-emerald-50 px-2 py-1 rounded">
                                                {e.serial}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Detalle de fallidos */}
                            {resultado.detalleFallidos.length > 0 && (
                                <div className="bg-red-50 rounded border border-red-200 p-4">
                                    <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                                        <AlertTriangle size={18} />
                                        Fallidos ({resultado.fallidos})
                                    </h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {resultado.detalleFallidos.map((e, idx) => (
                                            <div key={idx} className="text-sm flex gap-2">
                                                <span className="font-mono text-red-800">{e.serial}</span>
                                                <span className="text-red-600">: {e.error}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer con botones */}
                <div className="border-t border-slate-200 p-6 bg-slate-50 flex-shrink-0">
                    <div className="flex justify-between items-center">
                        {/* Info adicional */}
                        <div className="text-sm text-slate-600">
                            {paso === 1 && `Tipo seleccionado: ${tipoConfig[tipoEquipo].label}`}
                            {paso === 2 && '* Campos requeridos'}
                            {paso === 3 && `${serialesValidos.length} equipos listos para guardar`}
                            {paso === 4 && ''}
                        </div>

                        {/* Botones */}
                        <div className="flex gap-3">
                            {paso === 1 && (
                                <>
                                    <button
                                        onClick={handleCerrar}
                                        className="px-6 py-3 border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => setPaso(2)}
                                        className="px-6 py-3 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium transition-colors flex items-center gap-2"
                                    >
                                        Siguiente
                                        <ArrowRight size={18} />
                                    </button>
                                </>
                            )}

                            {paso === 2 && (
                                <>
                                    <button
                                        onClick={() => setPaso(1)}
                                        className="px-6 py-3 border border-slate-300 rounded hover:bg-slate-50 transition-colors flex items-center gap-2"
                                    >
                                        <ArrowLeft size={18} />
                                        Volver
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (validarPaso2()) {
                                                // Ir a paso intermedio de seriales
                                                setPaso(2.5);
                                            }
                                        }}
                                        className="px-6 py-3 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium transition-colors flex items-center gap-2"
                                    >
                                        Siguiente: Seriales
                                        <ArrowRight size={18} />
                                    </button>
                                </>
                            )}

                            {/* Paso intermedio: Ingreso de seriales */}
                            {paso === 2.5 && (
                                <>
                                    <button
                                        onClick={() => setPaso(2)}
                                        disabled={validando}
                                        className="px-6 py-3 border border-slate-300 rounded hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <ArrowLeft size={18} />
                                        Volver
                                    </button>
                                    <button
                                        onClick={avanzarAPaso3}
                                        disabled={validando}
                                        className="px-6 py-3 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {validando ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Validando...
                                            </>
                                        ) : (
                                            <>
                                                Validar y Continuar
                                                <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>
                                </>
                            )}

                            {paso === 4 && (
                                <>
                                    <button
                                        onClick={exportarReporte}
                                        className="px-6 py-3 border border-slate-300 rounded hover:bg-slate-50 transition-colors flex items-center gap-2"
                                    >
                                        <FileDown size={18} />
                                        Descargar Reporte
                                    </button>
                                    <button
                                        onClick={handleCerrar}
                                        className="px-6 py-3 border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                                    >
                                        Cerrar
                                    </button>
                                    <button
                                        onClick={handleNuevaCarga}
                                        className="px-6 py-3 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium transition-colors"
                                    >
                                        Nueva Carga
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Overlay de guardando */}
                {guardando && (
                    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-8 text-center max-w-sm">
                            <Loader2 className="animate-spin w-12 h-12 text-emerald-600 mx-auto mb-4" />
                            <p className="text-lg font-semibold text-slate-800">
                                Guardando equipos...
                            </p>
                            <p className="text-sm text-slate-600 mt-2">
                                {progreso.actual} de {progreso.total} completados
                            </p>
                            <div className="mt-4 bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full bg-emerald-600 transition-all"
                                    style={{ width: `${progreso.total > 0 ? (progreso.actual / progreso.total) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Paso 2.5: Lista de seriales (renderizado fuera del switch para simplificar) */}
            {paso === 2.5 && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded border border-slate-200 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
                        <div className="bg-slate-800 p-4 text-white">
                            <h3 className="text-lg font-semibold">Ingreso de Números de Serie</h3>
                            <p className="text-slate-300 text-sm">
                                Ingresa los seriales de cada unidad
                            </p>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <ListaSerialesEquipos
                                seriales={seriales}
                                onSerialChange={handleSerialChange}
                                onItemChange={handleItemChange}
                                onAgregarFila={handleAgregarFila}
                                onEliminarFila={handleEliminarFila}
                                validando={validando}
                                datosComunes={datosComunes}
                                tipoEquipo={tipoEquipo}
                            />
                        </div>
                        <div className="border-t border-slate-200 p-4 bg-slate-50 flex justify-between">
                            <button
                                onClick={() => setPaso(2)}
                                disabled={validando}
                                className="px-6 py-2 border border-slate-300 rounded hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50"
                            >
                                <ArrowLeft size={18} />
                                Volver
                            </button>
                            <button
                                onClick={avanzarAPaso3}
                                disabled={validando || seriales.filter(s => s.serial.trim()).length === 0}
                                className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium flex items-center gap-2 disabled:opacity-50"
                            >
                                {validando ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Validando...
                                    </>
                                ) : (
                                    <>
                                        Validar y Continuar
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CargaMasivaEquipos;
