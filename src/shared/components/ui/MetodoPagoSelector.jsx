import React from 'react';
import { METODOS_PAGO } from '../../constants/paymentMethods';

/**
 * Selector unificado de métodos de pago.
 *
 * @param {string}   value       - Valor seleccionado
 * @param {function} onChange     - Callback al seleccionar (recibe el event)
 * @param {boolean}  showEmpty   - Mostrar opción placeholder "Seleccionar método" (default: false)
 * @param {string[]} exclude     - Valores a excluir del listado (ej: ['cliente_abona'])
 * @param {string}   className   - Clases CSS adicionales
 * @param {boolean}  disabled    - Deshabilitar el selector
 * @param {string}   name        - Atributo name del select
 * @param {boolean}  required    - Atributo required del select
 * @param {string}   emptyLabel  - Texto del placeholder cuando showEmpty es true
 */
const MetodoPagoSelector = ({
    value,
    onChange,
    showEmpty = false,
    exclude = [],
    className = 'w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500',
    disabled = false,
    name,
    required,
    emptyLabel = 'Seleccionar método'
}) => {
    const metodosFiltrados = exclude.length > 0
        ? METODOS_PAGO.filter(m => !exclude.includes(m.value))
        : METODOS_PAGO;

    return (
        <select
            value={value}
            onChange={onChange}
            className={className}
            disabled={disabled}
            name={name}
            required={required}
        >
            {showEmpty && <option value="">{emptyLabel}</option>}
            {metodosFiltrados.map(m => (
                <option key={m.value} value={m.value}>
                    {m.label}
                </option>
            ))}
        </select>
    );
};

export default MetodoPagoSelector;
