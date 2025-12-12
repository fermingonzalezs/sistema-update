// FormularioDatosComunes.jsx - Formulario de datos compartidos
import React from 'react';
import { CONDICIONES_ARRAY, CONDICIONES_LABELS, ESTADOS_ARRAY, ESTADOS_LABELS, UBICACIONES_ARRAY, UBICACIONES_LABELS } from '../../../shared/constants/productConstants';
import { obtenerFechaLocal } from '../../../shared/utils/formatters';
import MarcaSelector from '../../../shared/components/ui/MarcaSelector';

// Categorías de "otros" productos
const CATEGORIAS_OTROS = [
    'ACCESORIOS', 'ALMACENAMIENTO', 'AUDIO', 'BAGS_CASES', 'CABLES_CARGADORES',
    'CAMARAS', 'COMPONENTES', 'CONSOLAS', 'DESKTOP', 'DRONES', 'FUNDAS_TEMPLADOS',
    'GAMING', 'MEMORIA', 'MONITORES', 'MOUSE_TECLADOS', 'PLACAS_VIDEO',
    'REDES', 'REPUESTOS', 'STREAMING', 'TABLETS', 'WATCHES'
];

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

    // ===== FORMULARIO CELULARES =====
    if (tipoEquipo === 'celular') {
        return (
            <div className="space-y-6">
                {/* Identificación */}
                <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Identificación</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Modelo *</label>
                            <input
                                type="text"
                                value={datos.modelo || ''}
                                onChange={(e) => handleChange('modelo', e.target.value)}
                                placeholder="Ej: iPhone 15 Pro"
                                className={`w-full border rounded px-3 py-2 text-sm ${errores.modelo ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                            />
                            {errores.modelo && <p className="text-red-500 text-xs mt-1">{errores.modelo}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Marca *</label>
                            <MarcaSelector
                                value={datos.marca || ''}
                                onChange={(value) => handleChange('marca', value)}
                                className={`w-full ${errores.marca ? 'border-red-500' : ''}`}
                                placeholder="Seleccionar marca..."
                            />
                            {errores.marca && <p className="text-red-500 text-xs mt-1">{errores.marca}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Categoría *</label>
                            <select
                                value={datos.categoria || ''}
                                onChange={(e) => handleChange('categoria', e.target.value)}
                                className={`w-full border rounded px-3 py-2 text-sm ${errores.categoria ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                            >
                                <option value="">Seleccionar...</option>
                                <option value="iphone">iPhone</option>
                                <option value="android">Android</option>
                            </select>
                            {errores.categoria && <p className="text-red-500 text-xs mt-1">{errores.categoria}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Ingreso</label>
                            <input
                                type="date"
                                value={datos.ingreso || obtenerFechaLocal()}
                                onChange={(e) => handleChange('ingreso', e.target.value)}
                                className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Especificaciones */}
                <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Especificaciones</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Capacidad (GB)</label>
                            <input
                                type="number"
                                min="0"
                                value={datos.capacidad || ''}
                                onChange={(e) => handleIntegerChange('capacidad', e.target.value)}
                                placeholder="Ej: 256"
                                className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                            <input
                                type="text"
                                value={datos.color || ''}
                                onChange={(e) => handleChange('color', e.target.value)}
                                placeholder="Ej: Titanio Natural"
                                className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">RAM (GB)</label>
                            <input
                                type="number"
                                min="0"
                                value={datos.ram || ''}
                                onChange={(e) => handleIntegerChange('ram', e.target.value)}
                                placeholder="Ej: 8"
                                className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">SIM/ESIM</label>
                            <select
                                value={datos.sim_esim || ''}
                                onChange={(e) => handleChange('sim_esim', e.target.value)}
                                className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="SIM">SIM</option>
                                <option value="ESIM">ESIM</option>
                                <option value="Dual">Dual (SIM + ESIM)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Batería */}
                <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Batería</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Batería (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={datos.bateria || ''}
                                onChange={(e) => handleIntegerChange('bateria', e.target.value)}
                                placeholder="Ej: 95"
                                className={`w-full border rounded px-3 py-2 text-sm ${errores.bateria ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                            />
                            {errores.bateria && <p className="text-red-500 text-xs mt-1">{errores.bateria}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ciclos</label>
                            <input
                                type="number"
                                min="0"
                                value={datos.ciclos || ''}
                                onChange={(e) => handleIntegerChange('ciclos', e.target.value)}
                                placeholder="Ej: 150"
                                className={`w-full border rounded px-3 py-2 text-sm ${errores.ciclos ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                            />
                            {errores.ciclos && <p className="text-red-500 text-xs mt-1">{errores.ciclos}</p>}
                        </div>
                    </div>
                </div>

                {/* Precios */}
                <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Precios (USD)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Precio Compra *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={datos.precio_compra_usd || ''}
                                onChange={(e) => handleNumeroChange('precio_compra_usd', e.target.value)}
                                placeholder="Ej: 800"
                                className={`w-full border rounded px-3 py-2 text-sm ${errores.precio_compra_usd ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                            />
                            {errores.precio_compra_usd && <p className="text-red-500 text-xs mt-1">{errores.precio_compra_usd}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Costos Adicionales</label>
                            <input
                                type="number"
                                step="0.01"
                                value={datos.costos_adicionales || ''}
                                onChange={(e) => handleNumeroChange('costos_adicionales', e.target.value)}
                                placeholder="Ej: 50"
                                className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Costo Total</label>
                            <div className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-100 text-slate-700 font-medium">
                                ${((parseFloat(datos.precio_compra_usd) || 0) + (parseFloat(datos.costos_adicionales) || 0)).toFixed(0)}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Precio Venta *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={datos.precio_venta_usd || ''}
                                onChange={(e) => handleNumeroChange('precio_venta_usd', e.target.value)}
                                placeholder="Ej: 1099"
                                className={`w-full border rounded px-3 py-2 text-sm ${errores.precio_venta_usd ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                            />
                            {errores.precio_venta_usd && <p className="text-red-500 text-xs mt-1">{errores.precio_venta_usd}</p>}
                        </div>
                    </div>
                </div>

                {/* Condición y ubicación */}
                <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Condición y Ubicación</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Condición *</label>
                            <select
                                value={datos.condicion || ''}
                                onChange={(e) => handleChange('condicion', e.target.value)}
                                className={`w-full border rounded px-3 py-2 text-sm ${errores.condicion ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                            >
                                <option value="">Seleccionar...</option>
                                {CONDICIONES_ARRAY.map(cond => (
                                    <option key={cond} value={cond}>{CONDICIONES_LABELS[cond]}</option>
                                ))}
                            </select>
                            {errores.condicion && <p className="text-red-500 text-xs mt-1">{errores.condicion}</p>}
                        </div>
                        {!esNuevo && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Estado Estético</label>
                                <select
                                    value={datos.estado || ''}
                                    onChange={(e) => handleChange('estado', e.target.value)}
                                    className={`w-full border rounded px-3 py-2 text-sm ${errores.estado ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                                >
                                    <option value="">Seleccionar...</option>
                                    {ESTADOS_ARRAY.map(est => (
                                        <option key={est} value={est}>{ESTADOS_LABELS[est]}</option>
                                    ))}
                                </select>
                                {errores.estado && <p className="text-red-500 text-xs mt-1">{errores.estado}</p>}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Sucursal</label>
                            <select
                                value={datos.sucursal || ''}
                                onChange={(e) => handleChange('sucursal', e.target.value)}
                                className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                            >
                                <option value="">Seleccionar...</option>
                                {UBICACIONES_ARRAY.map(ub => (
                                    <option key={ub} value={ub}>{UBICACIONES_LABELS[ub]}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Garantía y Observaciones */}
                <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Garantía y Observaciones</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Garantía Update</label>
                            <select
                                value={datos.garantia_update || '3 meses'}
                                onChange={(e) => handleChange('garantia_update', e.target.value)}
                                className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                            >
                                {GARANTIAS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        {datos.garantia_update === 'Garantía oficial con vencimiento' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de vencimiento</label>
                                <input
                                    type="date"
                                    value={datos.garantia_oficial_fecha || ''}
                                    onChange={(e) => handleChange('garantia_oficial_fecha', e.target.value)}
                                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                                />
                            </div>
                        )}
                        <div className={datos.garantia_update === 'Garantía oficial con vencimiento' ? 'md:col-span-2' : ''}>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fallas/Observaciones</label>
                            <input
                                type="text"
                                value={datos.fallas || ''}
                                onChange={(e) => handleChange('fallas', e.target.value)}
                                placeholder="Ej: Ninguna, batería agotada, etc."
                                className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ===== FORMULARIO NOTEBOOKS =====
    if (tipoEquipo === 'notebook') {
        return (
            <div className="space-y-6">
                {/* Identificación */}
                <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Identificación</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Modelo *</label>
                            <input
                                type="text"
                                value={datos.modelo || ''}
                                onChange={(e) => handleChange('modelo', e.target.value)}
                                placeholder="Ej: MacBook Pro 14"
                                className={`w-full border rounded px-3 py-2 text-sm ${errores.modelo ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                            />
                            {errores.modelo && <p className="text-red-500 text-xs mt-1">{errores.modelo}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Marca *</label>
                            <MarcaSelector
                                value={datos.marca || ''}
                                onChange={(value) => handleChange('marca', value)}
                                className={`w-full ${errores.marca ? 'border-red-500' : ''}`}
                                placeholder="Seleccionar marca..."
                            />
                            {errores.marca && <p className="text-red-500 text-xs mt-1">{errores.marca}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                            <select
                                value={datos.categoria || ''}
                                onChange={(e) => handleChange('categoria', e.target.value)}
                                className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="Windows">Windows</option>
                                <option value="MacBook">MacBook</option>
                                <option value="Gaming">Gaming</option>
                                <option value="Workstation">Workstation</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Ingreso</label>
                            <input
                                type="date"
                                value={datos.ingreso || obtenerFechaLocal()}
                                onChange={(e) => handleChange('ingreso', e.target.value)}
                                className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Procesador y RAM */}
                <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Procesador y Memoria</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Procesador</label>
                            <input
                                type="text"
                                value={datos.procesador || ''}
                                onChange={(e) => handleChange('procesador', e.target.value)}
                                placeholder="Ej: Intel i7-12700H"
                                className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">RAM (GB)</label>
                            <input
                                type="number"
                                min="0"
                                value={datos.ram || ''}
                                onChange={(e) => handleIntegerChange('ram', e.target.value)}
                                placeholder="Ej: 16"
                                className={`w-full border rounded px-3 py-2 text-sm ${errores.ram ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                            />
                            {errores.ram && <p className="text-red-500 text-xs mt-1">{errores.ram}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo RAM</label>
                            <select
                                value={datos.tipo_ram || ''}
                                onChange={(e) => handleChange('tipo_ram', e.target.value)}
                                className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="DDR4">DDR4</option>
                                <option value="DDR5">DDR5</option>
                                <option value="LPDDR4">LPDDR4</option>
                                <option value="LPDDR5">LPDDR5</option>
                                <option value="Unified">Unified (Apple)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Slots RAM</label>
                            <input
                                type="number"
                                min="0"
                                value={datos.slots || ''}
                                onChange={(e) => handleIntegerChange('slots', e.target.value)}
                                placeholder="Ej: 2"
                                className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Almacenamiento */}
                <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Almacenamiento</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">SSD (GB)</label>
                            <input
                                type="number"
                                min="0"
                                value={datos.ssd || ''}
                                onChange={(e) => handleIntegerChange('ssd', e.target.value)}
                                placeholder="Ej: 512"
                                className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">HDD (GB)</label>
                            <input
                                type="number"
                                min="0"
                                value={datos.hdd || ''}
                                onChange={(e) => handleIntegerChange('hdd', e.target.value)}
                                placeholder="Ej: 1000"
                                className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Pantalla */}
                <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Pantalla</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tamaño</label>
                            <input
                                type="number"
                                step="0.1"
                                value={datos.pantalla || ''}
                                onChange={(e) => handleNumeroChange('pantalla', e.target.value)}
                                placeholder="Ej: 15.6"
                                className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Resolución</label>
                            <select
                                value={datos.resolucion || ''}
                                onChange={(e) => handleChange('resolucion', e.target.value)}
                                className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="FHD">FHD (1920x1080)</option>
                                <option value="QHD">QHD (2560x1440)</option>
                                <option value="4K">4K (3840x2160)</option>
                                <option value="Retina">Retina</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Refresh Rate</label>
                            <select
                                value={datos.refresh || ''}
                                onChange={(e) => handleChange('refresh', e.target.value)}
                                className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="60">60Hz</option>
                                <option value="90">90Hz</option>
                                <option value="120">120Hz</option>
                                <option value="144">144Hz</option>
                                <option value="165">165Hz</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Touchscreen</label>
                            <select
                                value={datos.touchscreen ? 'si' : 'no'}
                                onChange={(e) => handleChange('touchscreen', e.target.value === 'si')}
                                className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                            >
                                <option value="no">No</option>
                                <option value="si">Sí</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Precios */}
                <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Precios (USD)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Precio Costo *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={datos.precio_costo_usd || ''}
                                onChange={(e) => handleNumeroChange('precio_costo_usd', e.target.value)}
                                placeholder="Ej: 1200"
                                className={`w-full border rounded px-3 py-2 text-sm ${errores.precio_costo_usd ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                            />
                            {errores.precio_costo_usd && <p className="text-red-500 text-xs mt-1">{errores.precio_costo_usd}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Envíos/Repuestos</label>
                            <input
                                type="number"
                                step="0.01"
                                value={datos.envios_repuestos || ''}
                                onChange={(e) => handleNumeroChange('envios_repuestos', e.target.value)}
                                placeholder="Ej: 50"
                                className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Costo Total</label>
                            <div className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-100 text-slate-700 font-medium">
                                ${((parseFloat(datos.precio_costo_usd) || 0) + (parseFloat(datos.envios_repuestos) || 0)).toFixed(0)}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Precio Venta *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={datos.precio_venta_usd || ''}
                                onChange={(e) => handleNumeroChange('precio_venta_usd', e.target.value)}
                                placeholder="Ej: 1599"
                                className={`w-full border rounded px-3 py-2 text-sm ${errores.precio_venta_usd ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                            />
                            {errores.precio_venta_usd && <p className="text-red-500 text-xs mt-1">{errores.precio_venta_usd}</p>}
                        </div>
                    </div>
                </div>

                {/* Condición */}
                <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Condición y Ubicación</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Condición *</label>
                            <select
                                value={datos.condicion || ''}
                                onChange={(e) => handleChange('condicion', e.target.value)}
                                className={`w-full border rounded px-3 py-2 text-sm ${errores.condicion ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                            >
                                <option value="">Seleccionar...</option>
                                {CONDICIONES_ARRAY.map(cond => (
                                    <option key={cond} value={cond}>{CONDICIONES_LABELS[cond]}</option>
                                ))}
                            </select>
                        </div>
                        {!esNuevo && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Estado Estético</label>
                                <select
                                    value={datos.estado || ''}
                                    onChange={(e) => handleChange('estado', e.target.value)}
                                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                                >
                                    <option value="">Seleccionar...</option>
                                    {ESTADOS_ARRAY.map(est => (
                                        <option key={est} value={est}>{ESTADOS_LABELS[est]}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Sucursal</label>
                            <select
                                value={datos.sucursal || ''}
                                onChange={(e) => handleChange('sucursal', e.target.value)}
                                className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                            >
                                <option value="">Seleccionar...</option>
                                {UBICACIONES_ARRAY.map(ub => (
                                    <option key={ub} value={ub}>{UBICACIONES_LABELS[ub]}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                            <input
                                type="text"
                                value={datos.color || ''}
                                onChange={(e) => handleChange('color', e.target.value)}
                                placeholder="Ej: Space Gray"
                                className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ===== FORMULARIO OTROS =====
    return (
        <div className="space-y-6">
            {/* Producto */}
            <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Producto</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Producto *</label>
                        <input
                            type="text"
                            value={datos.nombre_producto || ''}
                            onChange={(e) => handleChange('nombre_producto', e.target.value)}
                            placeholder="Ej: Cable USB-C a Lightning"
                            className={`w-full border rounded px-3 py-2 text-sm ${errores.nombre_producto ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                        />
                        {errores.nombre_producto && <p className="text-red-500 text-xs mt-1">{errores.nombre_producto}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Categoría *</label>
                        <select
                            value={datos.categoria || ''}
                            onChange={(e) => handleChange('categoria', e.target.value)}
                            className={`w-full border rounded px-3 py-2 text-sm ${errores.categoria ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                        >
                            <option value="">Seleccionar...</option>
                            {CATEGORIAS_OTROS.map(cat => (
                                <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                        {errores.categoria && <p className="text-red-500 text-xs mt-1">{errores.categoria}</p>}
                    </div>
                </div>
            </div>

            {/* Precios */}
            <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Precios (USD)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Precio Compra *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={datos.precio_compra_usd || ''}
                            onChange={(e) => handleNumeroChange('precio_compra_usd', e.target.value)}
                            placeholder="Ej: 10"
                            className={`w-full border rounded px-3 py-2 text-sm ${errores.precio_compra_usd ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                        />
                        {errores.precio_compra_usd && <p className="text-red-500 text-xs mt-1">{errores.precio_compra_usd}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Costos Adicionales</label>
                        <input
                            type="number"
                            step="0.01"
                            value={datos.costos_adicionales || ''}
                            onChange={(e) => handleNumeroChange('costos_adicionales', e.target.value)}
                            placeholder="Ej: 2"
                            className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Costo Total</label>
                        <div className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-100 text-slate-700 font-medium">
                            ${((parseFloat(datos.precio_compra_usd) || 0) + (parseFloat(datos.costos_adicionales) || 0)).toFixed(0)}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Precio Venta *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={datos.precio_venta_usd || ''}
                            onChange={(e) => handleNumeroChange('precio_venta_usd', e.target.value)}
                            placeholder="Ej: 25"
                            className={`w-full border rounded px-3 py-2 text-sm ${errores.precio_venta_usd ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                        />
                        {errores.precio_venta_usd && <p className="text-red-500 text-xs mt-1">{errores.precio_venta_usd}</p>}
                    </div>
                </div>
            </div>

            {/* Condición */}
            <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Condición y Ubicación</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Condición</label>
                        <select
                            value={datos.condicion || ''}
                            onChange={(e) => handleChange('condicion', e.target.value)}
                            className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                        >
                            <option value="">Seleccionar...</option>
                            {CONDICIONES_ARRAY.map(cond => (
                                <option key={cond} value={cond}>{CONDICIONES_LABELS[cond]}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sucursal</label>
                        <select
                            value={datos.sucursal || ''}
                            onChange={(e) => handleChange('sucursal', e.target.value)}
                            className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                        >
                            <option value="">Seleccionar...</option>
                            {UBICACIONES_ARRAY.map(ub => (
                                <option key={ub} value={ub}>{UBICACIONES_LABELS[ub]}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Ingreso</label>
                        <input
                            type="date"
                            value={datos.ingreso || obtenerFechaLocal()}
                            onChange={(e) => handleChange('ingreso', e.target.value)}
                            className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Observaciones */}
            <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Observaciones</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Garantía</label>
                        <input
                            type="text"
                            value={datos.garantia || ''}
                            onChange={(e) => handleChange('garantia', e.target.value)}
                            placeholder="Ej: 6 meses"
                            className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
                        <input
                            type="text"
                            value={datos.observaciones || ''}
                            onChange={(e) => handleChange('observaciones', e.target.value)}
                            placeholder="Notas adicionales..."
                            className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FormularioDatosComunes;
