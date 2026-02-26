// FormularioDatosComunes.jsx - Formulario de datos compartidos
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { CONDICIONES, CONDICIONES_ARRAY, CONDICIONES_LABELS, ESTADOS_ARRAY, ESTADOS_LABELS, UBICACIONES_ARRAY, UBICACIONES_LABELS } from '../../../shared/constants/productConstants';
import { CATEGORIAS_OTROS, CATEGORIAS_OTROS_ARRAY, CATEGORIAS_OTROS_LABELS } from '../../../shared/constants/categoryConstants';
import { RESOLUCIONES_ARRAY, RESOLUCIONES_LABELS } from '../../../shared/constants/resolutionConstants';
import { obtenerFechaLocal } from '../../../shared/utils/formatters';
import MarcaSelector from '../../../shared/components/ui/MarcaSelector';
import { useProveedores } from '../../importaciones/hooks/useProveedores';
import NuevoProveedorModal from '../../importaciones/components/NuevoProveedorModal';

// Select de resolución con opción "Otro" para valor libre
const ResolucionSelect = ({ value, onChange, className }) => {
    const esPersonalizado = value && !RESOLUCIONES_ARRAY.includes(value);
    const [modo, setModo] = useState(esPersonalizado ? 'otro' : 'lista');

    const handleSelectChange = (e) => {
        if (e.target.value === '__otro__') {
            setModo('otro');
            onChange('');
        } else {
            setModo('lista');
            onChange(e.target.value);
        }
    };

    return (
        <div className="space-y-2">
            <select
                value={modo === 'otro' ? '__otro__' : (value || '')}
                onChange={handleSelectChange}
                className={className}
            >
                <option value="">Seleccionar...</option>
                {RESOLUCIONES_ARRAY.map(res => (
                    <option key={res} value={res}>{RESOLUCIONES_LABELS[res]}</option>
                ))}
                <option value="__otro__">Otro...</option>
            </select>
            {modo === 'otro' && (
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Ej: 2560x1600"
                    className={className}
                    autoFocus
                />
            )}
        </div>
    );
};

// Opciones de garantía (igual que en CargaEquiposUnificada)
const GARANTIAS_OPTIONS = [
    { value: '1 mes', label: '1 mes' },
    { value: '3 meses', label: '3 meses' },
    { value: '6 meses', label: '6 meses' },
    { value: '12 meses', label: '12 meses' },
    { value: 'Garantía oficial Apple (12 meses)', label: 'Garantía oficial Apple (12 meses)' },
    { value: 'Garantía oficial con vencimiento', label: 'Garantía oficial con vencimiento' },
    { value: 'Sin garantía', label: 'Sin garantía' }
];

const FormularioDatosComunes = ({ tipoEquipo, datos, onChange, errores }) => {
    // Hook de proveedores
    const { proveedores, loading: proveedoresLoading } = useProveedores();
    const [showNuevoProveedorModal, setShowNuevoProveedorModal] = useState(false);

    const handleChange = (campo, valor) => {
        onChange({ ...datos, [campo]: valor });
    };

    const handleNumeroChange = (campo, valor) => {
        const numero = valor === '' ? '' : parseFloat(valor);
        handleChange(campo, numero);
    };

    const handleIntegerChange = (campo, valor) => {
        const numero = valor === '' ? '' : parseInt(valor, 10);
        handleChange(campo, numero);
    };

    // Determinar si es nuevo para mostrar/ocultar estado estético
    const esNuevo = datos.condicion === 'nuevo' || datos.condicion === 'nueva';

    // Clases comunes para inputs y headers de sección
    const ic = "w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm transition-colors";
    const sh = "bg-slate-700 text-white text-sm font-semibold px-4 py-2.5 uppercase tracking-wider text-center";

    // ===== FORMULARIO CELULARES =====
    if (tipoEquipo === 'celular') {
        return (
            <div className="space-y-4">
                {/* Información Básica */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <h3 className={sh}>Información Básica</h3>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Modelo *</label>
                            <input type="text" value={datos.modelo || ''} onChange={(e) => handleChange('modelo', e.target.value)} placeholder="Ej: iPhone 15 Pro" className={`${ic} ${errores.modelo ? 'border-red-500 bg-red-50' : ''}`} />
                            {errores.modelo && <p className="text-red-500 text-xs mt-1">{errores.modelo}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Marca *</label>
                            <MarcaSelector value={datos.marca || ''} onChange={(value) => handleChange('marca', value)} className={`w-full ${errores.marca ? 'border-red-500' : ''}`} placeholder="Seleccionar marca..." />
                            {errores.marca && <p className="text-red-500 text-xs mt-1">{errores.marca}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Categoría *</label>
                            <select value={datos.categoria || ''} onChange={(e) => handleChange('categoria', e.target.value)} className={`${ic} ${errores.categoria ? 'border-red-500 bg-red-50' : ''}`}>
                                <option value="">Seleccionar...</option>
                                <option value="iphone">iPhone</option>
                                <option value="android">Android</option>
                            </select>
                            {errores.categoria && <p className="text-red-500 text-xs mt-1">{errores.categoria}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                            <input type="text" value={datos.color || ''} onChange={(e) => handleChange('color', e.target.value)} placeholder="Ej: Titanio Natural" className={ic} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Condición *</label>
                            <select value={datos.condicion || ''} onChange={(e) => handleChange('condicion', e.target.value)} className={`${ic} ${errores.condicion ? 'border-red-500 bg-red-50' : ''}`}>
                                <option value="">Seleccionar...</option>
                                {CONDICIONES_ARRAY.map(cond => (
                                    <option key={cond} value={cond}>{CONDICIONES_LABELS[cond]}</option>
                                ))}
                            </select>
                            {errores.condicion && <p className="text-red-500 text-xs mt-1">{errores.condicion}</p>}
                        </div>
                        {!esNuevo && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Estado Estético</label>
                                <select value={datos.estado || ''} onChange={(e) => handleChange('estado', e.target.value)} className={`${ic} ${errores.estado ? 'border-red-500 bg-red-50' : ''}`}>
                                    <option value="">Seleccionar...</option>
                                    {ESTADOS_ARRAY.map(est => (
                                        <option key={est} value={est}>{ESTADOS_LABELS[est]}</option>
                                    ))}
                                </select>
                                {errores.estado && <p className="text-red-500 text-xs mt-1">{errores.estado}</p>}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Sucursal</label>
                            <select value={datos.sucursal || ''} onChange={(e) => handleChange('sucursal', e.target.value)} className={ic}>
                                <option value="">Seleccionar...</option>
                                {UBICACIONES_ARRAY.map(ub => (
                                    <option key={ub} value={ub}>{UBICACIONES_LABELS[ub]}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Proveedor</label>
                            <div className="flex gap-2">
                                <select value={datos.proveedor_id || ''} onChange={(e) => handleChange('proveedor_id', e.target.value)} disabled={proveedoresLoading} className={`flex-1 ${ic}`}>
                                    <option value="">Sin especificar</option>
                                    {proveedores.map(prov => (
                                        <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                                    ))}
                                </select>
                                <button type="button" onClick={() => setShowNuevoProveedorModal(true)} className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors" title="Nuevo Proveedor" disabled={proveedoresLoading}>
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Fecha Ingreso</label>
                            <input type="date" value={datos.ingreso || obtenerFechaLocal()} onChange={(e) => handleChange('ingreso', e.target.value)} className={ic} />
                        </div>
                    </div>
                </div>

                {/* Precios y Costos */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <h3 className={sh}>Precios y Costos</h3>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Precio Compra USD *</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-500 font-medium">U$</span>
                                <input type="number" step="0.01" value={datos.precio_compra_usd || ''} onChange={(e) => handleNumeroChange('precio_compra_usd', e.target.value)} placeholder="0.00" className={`pl-10 ${ic} ${errores.precio_compra_usd ? 'border-red-500 bg-red-50' : ''}`} />
                            </div>
                            {errores.precio_compra_usd && <p className="text-red-500 text-xs mt-1">{errores.precio_compra_usd}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Costos Adicionales USD</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-500 font-medium">U$</span>
                                <input type="number" step="0.01" value={datos.costos_adicionales || ''} onChange={(e) => handleNumeroChange('costos_adicionales', e.target.value)} placeholder="0.00" className={`pl-10 ${ic}`} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Costo Total USD <span className="text-xs text-slate-500">(calculado)</span></label>
                            <input type="text" value={`U$${((parseFloat(datos.precio_compra_usd) || 0) + (parseFloat(datos.costos_adicionales) || 0)).toFixed(2)}`} readOnly className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed text-sm font-medium" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Precio Venta USD *</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-500 font-medium">U$</span>
                                <input type="number" step="0.01" value={datos.precio_venta_usd || ''} onChange={(e) => handleNumeroChange('precio_venta_usd', e.target.value)} placeholder="0.00" className={`pl-10 ${ic} ${errores.precio_venta_usd ? 'border-red-500 bg-red-50' : ''}`} />
                            </div>
                            {errores.precio_venta_usd && <p className="text-red-500 text-xs mt-1">{errores.precio_venta_usd}</p>}
                        </div>
                    </div>
                </div>

                {/* Especificaciones Técnicas */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <h3 className={sh}>Especificaciones Técnicas</h3>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Capacidad (GB)</label>
                            <input type="number" min="0" value={datos.capacidad || ''} onChange={(e) => handleIntegerChange('capacidad', e.target.value)} placeholder="Ej: 256" className={ic} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">RAM (GB)</label>
                            <input type="number" min="0" value={datos.ram || ''} onChange={(e) => handleIntegerChange('ram', e.target.value)} placeholder="Ej: 8" className={ic} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">SIM/ESIM</label>
                            <select value={datos.sim_esim || ''} onChange={(e) => handleChange('sim_esim', e.target.value)} className={ic}>
                                <option value="">Seleccionar...</option>
                                <option value="SIM">SIM</option>
                                <option value="ESIM">ESIM</option>
                                <option value="Dual">Dual (SIM + ESIM)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Batería (%)</label>
                            <input type="number" min="0" max="100" value={datos.bateria || ''} onChange={(e) => handleIntegerChange('bateria', e.target.value)} placeholder="Ej: 95" className={`${ic} ${errores.bateria ? 'border-red-500 bg-red-50' : ''}`} />
                            {errores.bateria && <p className="text-red-500 text-xs mt-1">{errores.bateria}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Ciclos</label>
                            <input type="number" min="0" value={datos.ciclos || ''} onChange={(e) => handleIntegerChange('ciclos', e.target.value)} placeholder="Ej: 150" className={`${ic} ${errores.ciclos ? 'border-red-500 bg-red-50' : ''}`} />
                            {errores.ciclos && <p className="text-red-500 text-xs mt-1">{errores.ciclos}</p>}
                        </div>
                    </div>
                </div>

                {/* Garantía y Observaciones */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <h3 className={sh}>Garantía y Observaciones</h3>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Garantía</label>
                            <select value={datos.garantia || '3 meses'} onChange={(e) => handleChange('garantia', e.target.value)} className={ic}>
                                {GARANTIAS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        {datos.garantia === 'Garantía oficial con vencimiento' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de vencimiento</label>
                                <input type="date" value={datos.garantia_oficial_fecha || ''} onChange={(e) => handleChange('garantia_oficial_fecha', e.target.value)} className={ic} />
                            </div>
                        )}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Fallas/Observaciones</label>
                            <textarea value={datos.fallas || ''} onChange={(e) => handleChange('fallas', e.target.value)} placeholder="Ej: Ninguna, detalles estéticos, etc." rows={3} className={`${ic} resize-none`} />
                        </div>
                    </div>
                </div>

                {/* Modal para crear nuevo proveedor */}
                {showNuevoProveedorModal && (
                    <NuevoProveedorModal
                        onClose={() => setShowNuevoProveedorModal(false)}
                        onSuccess={(nuevoProveedor) => {
                            setShowNuevoProveedorModal(false);
                            handleChange('proveedor_id', nuevoProveedor.id);
                        }}
                    />
                )}
            </div>
        );
    }

    // ===== FORMULARIO NOTEBOOKS =====
    if (tipoEquipo === 'notebook') {
        return (
            <div className="space-y-4">

                {/* Información Básica */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <h3 className={sh}>Información Básica</h3>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Modelo *</label>
                            <input type="text" value={datos.modelo || ''} onChange={(e) => handleChange('modelo', e.target.value)} placeholder="Ej: MacBook Pro 14" className={`${ic} ${errores.modelo ? 'border-red-500 bg-red-50' : ''}`} />
                            {errores.modelo && <p className="text-red-500 text-xs mt-1">{errores.modelo}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Marca *</label>
                            <MarcaSelector value={datos.marca || ''} onChange={(value) => handleChange('marca', value)} className={`w-full ${errores.marca ? 'border-red-500' : ''}`} placeholder="Seleccionar marca..." />
                            {errores.marca && <p className="text-red-500 text-xs mt-1">{errores.marca}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Categoría</label>
                            <select value={datos.categoria || ''} onChange={(e) => handleChange('categoria', e.target.value)} className={ic}>
                                <option value="">Seleccionar...</option>
                                <option value="windows">Windows</option>
                                <option value="macbook">MacBook</option>
                                <option value="gaming">Gaming</option>
                                <option value="2-en-1">2-en-1</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                            <input type="text" value={datos.color || ''} onChange={(e) => handleChange('color', e.target.value)} placeholder="Ej: Space Gray" className={ic} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Condición *</label>
                            <select value={datos.condicion || ''} onChange={(e) => handleChange('condicion', e.target.value)} className={`${ic} ${errores.condicion ? 'border-red-500 bg-red-50' : ''}`}>
                                <option value="">Seleccionar...</option>
                                {CONDICIONES_ARRAY.map(cond => (
                                    <option key={cond} value={cond}>{CONDICIONES_LABELS[cond]}</option>
                                ))}
                            </select>
                            {errores.condicion && <p className="text-red-500 text-xs mt-1">{errores.condicion}</p>}
                        </div>
                        {!esNuevo && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Estado Estético</label>
                                <select value={datos.estado || ''} onChange={(e) => handleChange('estado', e.target.value)} className={ic}>
                                    <option value="">Seleccionar...</option>
                                    {ESTADOS_ARRAY.map(est => (
                                        <option key={est} value={est}>{ESTADOS_LABELS[est]}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Sucursal</label>
                            <select value={datos.sucursal || ''} onChange={(e) => handleChange('sucursal', e.target.value)} className={ic}>
                                <option value="">Seleccionar...</option>
                                {UBICACIONES_ARRAY.map(ub => (
                                    <option key={ub} value={ub}>{UBICACIONES_LABELS[ub]}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Proveedor</label>
                            <div className="flex gap-2">
                                <select value={datos.proveedor_id || ''} onChange={(e) => handleChange('proveedor_id', e.target.value)} disabled={proveedoresLoading} className={`flex-1 px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm`}>
                                    <option value="">Sin especificar</option>
                                    {proveedores.map(prov => (
                                        <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                                    ))}
                                </select>
                                <button type="button" onClick={() => setShowNuevoProveedorModal(true)} className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700" title="Nuevo Proveedor" disabled={proveedoresLoading}>
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Fecha Ingreso</label>
                            <input type="date" value={datos.ingreso || obtenerFechaLocal()} onChange={(e) => handleChange('ingreso', e.target.value)} className={ic} />
                        </div>
                    </div>
                </div>

                {/* Precios y Costos */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <h3 className={sh}>Precios y Costos</h3>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Precio Costo *</label>
                            <input type="number" step="0.01" value={datos.precio_costo_usd || ''} onChange={(e) => handleNumeroChange('precio_costo_usd', e.target.value)} placeholder="0.00" className={`${ic} ${errores.precio_costo_usd ? 'border-red-500 bg-red-50' : ''}`} />
                            {errores.precio_costo_usd && <p className="text-red-500 text-xs mt-1">{errores.precio_costo_usd}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Costo Total <span className="text-xs text-slate-500">(calculado)</span></label>
                            <input type="text" value={`$${((parseFloat(datos.precio_costo_usd) || 0) + (parseFloat(datos.envios_repuestos) || 0)).toFixed(0)}`} readOnly className="w-full px-3 py-2 border border-slate-200 rounded bg-slate-50 text-slate-600 cursor-not-allowed text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Precio Venta *</label>
                            <input type="number" step="0.01" value={datos.precio_venta_usd || ''} onChange={(e) => handleNumeroChange('precio_venta_usd', e.target.value)} placeholder="0.00" className={`${ic} ${errores.precio_venta_usd ? 'border-red-500 bg-red-50' : ''}`} />
                            {errores.precio_venta_usd && <p className="text-red-500 text-xs mt-1">{errores.precio_venta_usd}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Envíos/Repuestos</label>
                            <input type="number" step="0.01" value={datos.envios_repuestos || ''} onChange={(e) => handleNumeroChange('envios_repuestos', e.target.value)} placeholder="0.00" className={ic} />
                        </div>
                    </div>
                </div>

                {/* Especificaciones Técnicas */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <h3 className={sh}>Especificaciones Técnicas</h3>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Procesador</label>
                            <input type="text" value={datos.procesador || ''} onChange={(e) => handleChange('procesador', e.target.value)} placeholder="Ej: Intel i7-12700H" className={ic} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">RAM (GB)</label>
                            <input type="number" min="0" value={datos.ram || ''} onChange={(e) => handleIntegerChange('ram', e.target.value)} placeholder="Ej: 16" className={`${ic} ${errores.ram ? 'border-red-500 bg-red-50' : ''}`} />
                            {errores.ram && <p className="text-red-500 text-xs mt-1">{errores.ram}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Tipo RAM</label>
                            <select value={datos.tipo_ram || ''} onChange={(e) => handleChange('tipo_ram', e.target.value)} className={ic}>
                                <option value="">Seleccionar...</option>
                                <option value="DDR4">DDR4</option>
                                <option value="DDR5">DDR5</option>
                                <option value="LPDDR4">LPDDR4</option>
                                <option value="LPDDR5">LPDDR5</option>
                                <option value="Unified">Unified (Apple)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Slots RAM</label>
                            <input type="number" min="0" value={datos.slots || ''} onChange={(e) => handleIntegerChange('slots', e.target.value)} placeholder="Ej: 2" className={ic} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">SSD (GB)</label>
                            <input type="number" min="0" value={datos.ssd || ''} onChange={(e) => handleIntegerChange('ssd', e.target.value)} placeholder="Ej: 512" className={ic} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">HDD (GB)</label>
                            <input type="number" min="0" value={datos.hdd || ''} onChange={(e) => handleIntegerChange('hdd', e.target.value)} placeholder="Ej: 1000" className={ic} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Sistema Operativo</label>
                            <select value={datos.so || ''} onChange={(e) => handleChange('so', e.target.value)} className={ic}>
                                <option value="">Seleccionar...</option>
                                <option value="WIN11">Windows 11</option>
                                <option value="WIN10">Windows 10</option>
                                <option value="Linux">Linux</option>
                                <option value="macOS">macOS</option>
                                <option value="Sin SO">Sin SO</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Placa de Video</label>
                            <input type="text" value={datos.placa_video || ''} onChange={(e) => handleChange('placa_video', e.target.value)} placeholder="Ej: RTX 4060, Integrada" className={ic} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">VRAM</label>
                            <input type="text" value={datos.vram || ''} onChange={(e) => handleChange('vram', e.target.value)} placeholder="Ej: 4GB, 8GB, 16GB" className={ic} />
                        </div>
                    </div>
                </div>

                {/* Pantalla y Display */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <h3 className={sh}>Pantalla y Display</h3>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Tamaño (pulgadas)</label>
                            <input type="number" step="0.1" value={datos.pantalla || ''} onChange={(e) => handleNumeroChange('pantalla', e.target.value)} placeholder="Ej: 15.6" className={ic} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Resolución</label>
                            <ResolucionSelect value={datos.resolucion || ''} onChange={(val) => handleChange('resolucion', val)} className={ic} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Refresh Rate</label>
                            <select value={datos.refresh || ''} onChange={(e) => handleChange('refresh', e.target.value)} className={ic}>
                                <option value="">Seleccionar...</option>
                                <option value="60">60Hz</option>
                                <option value="90">90Hz</option>
                                <option value="120">120Hz</option>
                                <option value="144">144Hz</option>
                                <option value="165">165Hz</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Touchscreen</label>
                            <select value={datos.touchscreen ? 'si' : 'no'} onChange={(e) => handleChange('touchscreen', e.target.value === 'si')} className={ic}>
                                <option value="no">No</option>
                                <option value="si">Sí</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Características Adicionales */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <h3 className={sh}>Características Adicionales</h3>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Teclado Retroiluminado</label>
                            <select value={datos.teclado_retro || 'SI'} onChange={(e) => handleChange('teclado_retro', e.target.value)} className={ic}>
                                <option value="SI">Sí</option>
                                <option value="NO">No</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Idioma Teclado</label>
                            <select value={datos.idioma_teclado || ''} onChange={(e) => handleChange('idioma_teclado', e.target.value)} className={ic}>
                                <option value="">Seleccionar...</option>
                                <option value="Español">Español</option>
                                <option value="Inglés">Inglés</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Batería (%)</label>
                            <input type="number" min="0" max="100" value={datos.bateria || ''} onChange={(e) => handleIntegerChange('bateria', e.target.value)} placeholder="Ej: 85" className={ic} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Duración</label>
                            <input type="text" value={datos.duracion || ''} onChange={(e) => handleChange('duracion', e.target.value)} placeholder="Ej: 6-8 horas" className={ic} />
                        </div>
                    </div>
                </div>

                {/* Garantía y Observaciones */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <h3 className={sh}>Garantía y Observaciones</h3>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Garantía</label>
                            <select value={datos.garantia || '3 meses'} onChange={(e) => handleChange('garantia', e.target.value)} className={ic}>
                                {GARANTIAS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        {datos.garantia === 'Garantía oficial con vencimiento' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de vencimiento</label>
                                <input type="date" value={datos.garantia_oficial_fecha || ''} onChange={(e) => handleChange('garantia_oficial_fecha', e.target.value)} className={ic} />
                            </div>
                        )}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Fallas/Observaciones</label>
                            <textarea value={datos.fallas || ''} onChange={(e) => handleChange('fallas', e.target.value)} placeholder="Ej: Ninguna, batería agotada, etc." rows={3} className={`${ic} resize-none`} />
                        </div>
                    </div>
                </div>

            </div>
        );
    }

    // ===== FORMULARIO OTROS =====
    // Detectar si es Desktop o Tablet para mostrar formulario específico
    const isDesktop = datos.categoria === CATEGORIAS_OTROS.DESKTOP;
    const isTablet = datos.categoria === CATEGORIAS_OTROS.TABLETS;

    // Ordenar categorías alfabéticamente
    const opcionesCategorias = CATEGORIAS_OTROS_ARRAY
        .map(cat => ({
            value: cat,
            label: CATEGORIAS_OTROS_LABELS[cat]
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

    // ===== FORMULARIO DESKTOP =====
    if (isDesktop) {
        return (
            <div className="space-y-4">
                {/* Información Básica */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <h3 className={sh}>Información Básica</h3>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Modelo *</label>
                            <input type="text" value={datos.modelo || ''} onChange={(e) => handleChange('modelo', e.target.value)} placeholder="Ej: Gaming PC, Workstation" className={`${ic} ${errores.modelo ? 'border-red-500 bg-red-50' : ''}`} />
                            {errores.modelo && <p className="text-red-500 text-xs mt-1">{errores.modelo}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Marca</label>
                            <MarcaSelector value={datos.marca || ''} onChange={(value) => handleChange('marca', value)} placeholder="Seleccionar marca..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Categoría *</label>
                            <select value={datos.categoria || ''} onChange={(e) => handleChange('categoria', e.target.value)} className={`${ic} ${errores.categoria ? 'border-red-500 bg-red-50' : ''}`}>
                                <option value="">Seleccionar...</option>
                                {opcionesCategorias.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                            {errores.categoria && <p className="text-red-500 text-xs mt-1">{errores.categoria}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Condición *</label>
                            <select value={datos.condicion || ''} onChange={(e) => handleChange('condicion', e.target.value)} className={`${ic} ${errores.condicion ? 'border-red-500 bg-red-50' : ''}`}>
                                <option value="">Seleccionar...</option>
                                {CONDICIONES_ARRAY.map(cond => (
                                    <option key={cond} value={cond}>{CONDICIONES_LABELS[cond]}</option>
                                ))}
                            </select>
                            {errores.condicion && <p className="text-red-500 text-xs mt-1">{errores.condicion}</p>}
                        </div>
                        {!esNuevo && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Estado Estético</label>
                                <select value={datos.estado || ''} onChange={(e) => handleChange('estado', e.target.value)} className={`${ic} ${errores.estado ? 'border-red-500 bg-red-50' : ''}`}>
                                    <option value="">Seleccionar...</option>
                                    {ESTADOS_ARRAY.map(est => (
                                        <option key={est} value={est}>{ESTADOS_LABELS[est]}</option>
                                    ))}
                                </select>
                                {errores.estado && <p className="text-red-500 text-xs mt-1">{errores.estado}</p>}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Sucursal</label>
                            <select value={datos.sucursal || ''} onChange={(e) => handleChange('sucursal', e.target.value)} className={ic}>
                                <option value="">Seleccionar...</option>
                                {UBICACIONES_ARRAY.map(ub => (
                                    <option key={ub} value={ub}>{UBICACIONES_LABELS[ub]}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Proveedor</label>
                            <div className="flex gap-2">
                                <select value={datos.proveedor_id || ''} onChange={(e) => handleChange('proveedor_id', e.target.value)} disabled={proveedoresLoading} className={`flex-1 ${ic}`}>
                                    <option value="">Sin especificar</option>
                                    {proveedores.map(prov => (
                                        <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                                    ))}
                                </select>
                                <button type="button" onClick={() => setShowNuevoProveedorModal(true)} className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors" title="Nuevo Proveedor" disabled={proveedoresLoading}>
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Fecha Ingreso</label>
                            <input type="date" value={datos.ingreso || obtenerFechaLocal()} onChange={(e) => handleChange('ingreso', e.target.value)} className={ic} />
                        </div>
                    </div>
                </div>

                {/* Precios y Costos */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <h3 className={sh}>Precios y Costos</h3>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Precio Compra USD *</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-500 font-medium">U$</span>
                                <input type="number" step="0.01" value={datos.precio_compra_usd || ''} onChange={(e) => handleNumeroChange('precio_compra_usd', e.target.value)} placeholder="0.00" className={`pl-10 ${ic} ${errores.precio_compra_usd ? 'border-red-500 bg-red-50' : ''}`} />
                            </div>
                            {errores.precio_compra_usd && <p className="text-red-500 text-xs mt-1">{errores.precio_compra_usd}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Costos Adicionales USD</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-500 font-medium">U$</span>
                                <input type="number" step="0.01" value={datos.costos_adicionales || ''} onChange={(e) => handleNumeroChange('costos_adicionales', e.target.value)} placeholder="0.00" className={`pl-10 ${ic}`} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Costo Total USD <span className="text-xs text-slate-500">(calculado)</span></label>
                            <input type="text" value={`U$${((parseFloat(datos.precio_compra_usd) || 0) + (parseFloat(datos.costos_adicionales) || 0)).toFixed(2)}`} readOnly className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed text-sm font-medium" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Precio Venta USD *</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-500 font-medium">U$</span>
                                <input type="number" step="0.01" value={datos.precio_venta_usd || ''} onChange={(e) => handleNumeroChange('precio_venta_usd', e.target.value)} placeholder="0.00" className={`pl-10 ${ic} ${errores.precio_venta_usd ? 'border-red-500 bg-red-50' : ''}`} />
                            </div>
                            {errores.precio_venta_usd && <p className="text-red-500 text-xs mt-1">{errores.precio_venta_usd}</p>}
                        </div>
                    </div>
                </div>

                {/* Especificaciones Técnicas */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <h3 className={sh}>Especificaciones Técnicas</h3>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Procesador</label>
                            <input type="text" value={datos.procesador || ''} onChange={(e) => handleChange('procesador', e.target.value)} placeholder="Ej: Intel i5-12400" className={ic} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Motherboard</label>
                            <input type="text" value={datos.motherboard || ''} onChange={(e) => handleChange('motherboard', e.target.value)} placeholder="Ej: ASUS ROG STRIX B550" className={ic} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Memoria RAM</label>
                            <input type="text" value={datos.memoria || ''} onChange={(e) => handleChange('memoria', e.target.value)} placeholder="Ej: 16GB DDR4" className={ic} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Placa de video</label>
                            <input type="text" value={datos.gpu || ''} onChange={(e) => handleChange('gpu', e.target.value)} placeholder="Ej: RTX 3060 Ti" className={ic} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">SSD</label>
                            <input type="text" value={datos.ssd || ''} onChange={(e) => handleChange('ssd', e.target.value)} placeholder="Ej: 500GB NVMe" className={ic} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">HDD</label>
                            <input type="text" value={datos.hdd || ''} onChange={(e) => handleChange('hdd', e.target.value)} placeholder="Ej: 1TB" className={ic} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Gabinete</label>
                            <input type="text" value={datos.gabinete || ''} onChange={(e) => handleChange('gabinete', e.target.value)} placeholder="Ej: NZXT H510" className={ic} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Fuente</label>
                            <input type="text" value={datos.fuente || ''} onChange={(e) => handleChange('fuente', e.target.value)} placeholder="Ej: 650W Modular" className={ic} />
                        </div>
                    </div>
                </div>

                {/* Garantía y Observaciones */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <h3 className={sh}>Garantía y Observaciones</h3>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Garantía</label>
                            <select value={datos.garantia || '3 meses'} onChange={(e) => handleChange('garantia', e.target.value)} className={ic}>
                                {GARANTIAS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        {datos.garantia === 'Garantía oficial con vencimiento' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de vencimiento</label>
                                <input type="date" value={datos.garantia_oficial_fecha || ''} onChange={(e) => handleChange('garantia_oficial_fecha', e.target.value)} className={ic} />
                            </div>
                        )}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Observaciones</label>
                            <textarea value={datos.observaciones || ''} onChange={(e) => handleChange('observaciones', e.target.value)} placeholder="Notas adicionales sobre el equipo, accesorios incluidos, estado específico, etc." rows={3} className={`${ic} resize-none`} />
                        </div>
                    </div>
                </div>

                {/* Modal para crear nuevo proveedor */}
                {showNuevoProveedorModal && (
                    <NuevoProveedorModal
                        onClose={() => setShowNuevoProveedorModal(false)}
                        onSuccess={(nuevoProveedor) => {
                            setShowNuevoProveedorModal(false);
                            handleChange('proveedor_id', nuevoProveedor.id);
                        }}
                    />
                )}
            </div>
        );
    }

    // ===== FORMULARIO TABLETS =====
    if (isTablet) {
        return (
            <div className="space-y-4">
                {/* Información Básica */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <h3 className={sh}>Información Básica</h3>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Modelo *</label>
                            <input type="text" value={datos.modelo || ''} onChange={(e) => handleChange('modelo', e.target.value)} placeholder="Ej: iPad Pro 11, Galaxy Tab S9" className={`${ic} ${errores.modelo ? 'border-red-500 bg-red-50' : ''}`} />
                            {errores.modelo && <p className="text-red-500 text-xs mt-1">{errores.modelo}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Marca</label>
                            <MarcaSelector value={datos.marca || ''} onChange={(value) => handleChange('marca', value)} placeholder="Seleccionar marca..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Categoría *</label>
                            <select value={datos.categoria || ''} onChange={(e) => handleChange('categoria', e.target.value)} className={`${ic} ${errores.categoria ? 'border-red-500 bg-red-50' : ''}`}>
                                <option value="">Seleccionar...</option>
                                {opcionesCategorias.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                            {errores.categoria && <p className="text-red-500 text-xs mt-1">{errores.categoria}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Condición *</label>
                            <select value={datos.condicion || ''} onChange={(e) => handleChange('condicion', e.target.value)} className={`${ic} ${errores.condicion ? 'border-red-500 bg-red-50' : ''}`}>
                                <option value="">Seleccionar...</option>
                                {CONDICIONES_ARRAY.map(cond => (
                                    <option key={cond} value={cond}>{CONDICIONES_LABELS[cond]}</option>
                                ))}
                            </select>
                            {errores.condicion && <p className="text-red-500 text-xs mt-1">{errores.condicion}</p>}
                        </div>
                        {!esNuevo && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Estado Estético</label>
                                <select value={datos.estado || ''} onChange={(e) => handleChange('estado', e.target.value)} className={`${ic} ${errores.estado ? 'border-red-500 bg-red-50' : ''}`}>
                                    <option value="">Seleccionar...</option>
                                    {ESTADOS_ARRAY.map(est => (
                                        <option key={est} value={est}>{ESTADOS_LABELS[est]}</option>
                                    ))}
                                </select>
                                {errores.estado && <p className="text-red-500 text-xs mt-1">{errores.estado}</p>}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Sucursal</label>
                            <select value={datos.sucursal || ''} onChange={(e) => handleChange('sucursal', e.target.value)} className={ic}>
                                <option value="">Seleccionar...</option>
                                {UBICACIONES_ARRAY.map(ub => (
                                    <option key={ub} value={ub}>{UBICACIONES_LABELS[ub]}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Proveedor</label>
                            <div className="flex gap-2">
                                <select value={datos.proveedor_id || ''} onChange={(e) => handleChange('proveedor_id', e.target.value)} disabled={proveedoresLoading} className={`flex-1 ${ic}`}>
                                    <option value="">Sin especificar</option>
                                    {proveedores.map(prov => (
                                        <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                                    ))}
                                </select>
                                <button type="button" onClick={() => setShowNuevoProveedorModal(true)} className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors" title="Nuevo Proveedor" disabled={proveedoresLoading}>
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Fecha Ingreso</label>
                            <input type="date" value={datos.ingreso || obtenerFechaLocal()} onChange={(e) => handleChange('ingreso', e.target.value)} className={ic} />
                        </div>
                    </div>
                </div>

                {/* Precios y Costos */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <h3 className={sh}>Precios y Costos</h3>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Precio Compra USD *</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-500 font-medium">U$</span>
                                <input type="number" step="0.01" value={datos.precio_compra_usd || ''} onChange={(e) => handleNumeroChange('precio_compra_usd', e.target.value)} placeholder="0.00" className={`pl-10 ${ic} ${errores.precio_compra_usd ? 'border-red-500 bg-red-50' : ''}`} />
                            </div>
                            {errores.precio_compra_usd && <p className="text-red-500 text-xs mt-1">{errores.precio_compra_usd}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Costos Adicionales USD</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-500 font-medium">U$</span>
                                <input type="number" step="0.01" value={datos.costos_adicionales || ''} onChange={(e) => handleNumeroChange('costos_adicionales', e.target.value)} placeholder="0.00" className={`pl-10 ${ic}`} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Costo Total USD <span className="text-xs text-slate-500">(calculado)</span></label>
                            <input type="text" value={`U$${((parseFloat(datos.precio_compra_usd) || 0) + (parseFloat(datos.costos_adicionales) || 0)).toFixed(2)}`} readOnly className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed text-sm font-medium" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Precio Venta USD *</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-500 font-medium">U$</span>
                                <input type="number" step="0.01" value={datos.precio_venta_usd || ''} onChange={(e) => handleNumeroChange('precio_venta_usd', e.target.value)} placeholder="0.00" className={`pl-10 ${ic} ${errores.precio_venta_usd ? 'border-red-500 bg-red-50' : ''}`} />
                            </div>
                            {errores.precio_venta_usd && <p className="text-red-500 text-xs mt-1">{errores.precio_venta_usd}</p>}
                        </div>
                    </div>
                </div>

                {/* Especificaciones Técnicas */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <h3 className={sh}>Especificaciones Técnicas</h3>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                            <input type="text" value={datos.color || ''} onChange={(e) => handleChange('color', e.target.value)} placeholder="Ej: Space Gray, Silver, Black" className={ic} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Almacenamiento</label>
                            <select value={datos.capacidad_almacenamiento || ''} onChange={(e) => handleChange('capacidad_almacenamiento', e.target.value)} className={ic}>
                                <option value="">Seleccionar...</option>
                                <option value="64GB">64GB</option>
                                <option value="128GB">128GB</option>
                                <option value="256GB">256GB</option>
                                <option value="512GB">512GB</option>
                                <option value="1TB">1TB</option>
                                <option value="2TB">2TB</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Tamaño de Pantalla</label>
                            <input type="text" value={datos.tamano_pantalla || ''} onChange={(e) => handleChange('tamano_pantalla', e.target.value)} placeholder='Ej: 10.2", 11", 12.9"' className={ic} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Conectividad</label>
                            <select value={datos.conectividad || 'WiFi'} onChange={(e) => handleChange('conectividad', e.target.value)} className={ic}>
                                <option value="WiFi">WiFi</option>
                                <option value="WiFi + Datos">WiFi + Datos</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Garantía y Observaciones */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <h3 className={sh}>Garantía y Observaciones</h3>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Garantía</label>
                            <select value={datos.garantia || '3 meses'} onChange={(e) => handleChange('garantia', e.target.value)} className={ic}>
                                {GARANTIAS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        {datos.garantia === 'Garantía oficial con vencimiento' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de vencimiento</label>
                                <input type="date" value={datos.garantia_oficial_fecha || ''} onChange={(e) => handleChange('garantia_oficial_fecha', e.target.value)} className={ic} />
                            </div>
                        )}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Observaciones</label>
                            <textarea value={datos.observaciones || ''} onChange={(e) => handleChange('observaciones', e.target.value)} placeholder="Notas adicionales sobre la tablet, accesorios incluidos, estado específico, etc." rows={3} className={`${ic} resize-none`} />
                        </div>
                    </div>
                </div>

                {/* Modal para crear nuevo proveedor */}
                {showNuevoProveedorModal && (
                    <NuevoProveedorModal
                        onClose={() => setShowNuevoProveedorModal(false)}
                        onSuccess={(nuevoProveedor) => {
                            setShowNuevoProveedorModal(false);
                            handleChange('proveedor_id', nuevoProveedor.id);
                        }}
                    />
                )}
            </div>
        );
    }

    // ===== FORMULARIO OTROS GENÉRICO =====
    return (
        <div className="space-y-4">
            {/* Producto */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <h3 className={sh}>Producto</h3>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Categoría *</label>
                        <select value={datos.categoria || ''} onChange={(e) => handleChange('categoria', e.target.value)} className={`${ic} ${errores.categoria ? 'border-red-500 bg-red-50' : ''}`}>
                            <option value="">Seleccionar...</option>
                            {opcionesCategorias.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                        {errores.categoria && <p className="text-red-500 text-xs mt-1">{errores.categoria}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Nombre del Producto *</label>
                        <input type="text" value={datos.nombre_producto || ''} onChange={(e) => handleChange('nombre_producto', e.target.value)} placeholder="Ej: Cable USB-C a Lightning" className={`${ic} ${errores.nombre_producto ? 'border-red-500 bg-red-50' : ''}`} />
                        {errores.nombre_producto && <p className="text-red-500 text-xs mt-1">{errores.nombre_producto}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Marca</label>
                        <MarcaSelector value={datos.marca || ''} onChange={(value) => handleChange('marca', value)} placeholder="Seleccionar marca..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                        <input type="text" value={datos.color || ''} onChange={(e) => handleChange('color', e.target.value)} placeholder="Ej: Negro, Blanco" className={ic} />
                    </div>
                </div>
            </div>

            {/* Precios y Costos */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <h3 className={sh}>Precios y Costos</h3>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Precio Compra USD *</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-500 font-medium">U$</span>
                            <input type="number" step="0.01" value={datos.precio_compra_usd || ''} onChange={(e) => handleNumeroChange('precio_compra_usd', e.target.value)} placeholder="0.00" className={`pl-10 ${ic} ${errores.precio_compra_usd ? 'border-red-500 bg-red-50' : ''}`} />
                        </div>
                        {errores.precio_compra_usd && <p className="text-red-500 text-xs mt-1">{errores.precio_compra_usd}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Costos Adicionales USD</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-500 font-medium">U$</span>
                            <input type="number" step="0.01" value={datos.costos_adicionales || ''} onChange={(e) => handleNumeroChange('costos_adicionales', e.target.value)} placeholder="0.00" className={`pl-10 ${ic}`} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Costo Total USD <span className="text-xs text-slate-500">(calculado)</span></label>
                        <input type="text" value={`U$${((parseFloat(datos.precio_compra_usd) || 0) + (parseFloat(datos.costos_adicionales) || 0)).toFixed(2)}`} readOnly className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed text-sm font-medium" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Precio Venta USD *</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-500 font-medium">U$</span>
                            <input type="number" step="0.01" value={datos.precio_venta_usd || ''} onChange={(e) => handleNumeroChange('precio_venta_usd', e.target.value)} placeholder="0.00" className={`pl-10 ${ic} ${errores.precio_venta_usd ? 'border-red-500 bg-red-50' : ''}`} />
                        </div>
                        {errores.precio_venta_usd && <p className="text-red-500 text-xs mt-1">{errores.precio_venta_usd}</p>}
                    </div>
                </div>
            </div>

            {/* Condición y Ubicación */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <h3 className={sh}>Condición y Ubicación</h3>
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Condición</label>
                        <select value={datos.condicion || ''} onChange={(e) => handleChange('condicion', e.target.value)} className={ic}>
                            <option value="">Seleccionar...</option>
                            {CONDICIONES_ARRAY.map(cond => (
                                <option key={cond} value={cond}>{CONDICIONES_LABELS[cond]}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Sucursal</label>
                        <select value={datos.sucursal || ''} onChange={(e) => handleChange('sucursal', e.target.value)} className={ic}>
                            <option value="">Seleccionar...</option>
                            {UBICACIONES_ARRAY.map(ub => (
                                <option key={ub} value={ub}>{UBICACIONES_LABELS[ub]}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Fecha Ingreso</label>
                        <input type="date" value={datos.ingreso || obtenerFechaLocal()} onChange={(e) => handleChange('ingreso', e.target.value)} className={ic} />
                    </div>
                </div>
            </div>

            {/* Garantía y Observaciones */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <h3 className={sh}>Garantía y Observaciones</h3>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Garantía</label>
                        <select value={datos.garantia || '3 meses'} onChange={(e) => handleChange('garantia', e.target.value)} className={ic}>
                            {GARANTIAS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    {datos.garantia === 'Garantía oficial con vencimiento' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de vencimiento</label>
                            <input type="date" value={datos.garantia_oficial_fecha || ''} onChange={(e) => handleChange('garantia_oficial_fecha', e.target.value)} className={ic} />
                        </div>
                    )}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Observaciones</label>
                        <textarea value={datos.observaciones || ''} onChange={(e) => handleChange('observaciones', e.target.value)} placeholder="Notas adicionales..." rows={3} className={`${ic} resize-none`} />
                    </div>
                </div>
            </div>

            {/* Modal para crear nuevo proveedor */}
            {showNuevoProveedorModal && (
                <NuevoProveedorModal
                    onClose={() => setShowNuevoProveedorModal(false)}
                    onSuccess={(nuevoProveedor) => {
                        setShowNuevoProveedorModal(false);
                        handleChange('proveedor_id', nuevoProveedor.id);
                    }}
                />
            )}
        </div>
    );
};

export default FormularioDatosComunes;
