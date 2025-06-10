// components/SelectorCuentaConCotizacion.jsx
// Selector de Cuenta con Cotización Automática - UPDATE WW SRL
// Maneja cuentas en ARS (con cotización) y USD (directo)

import React, { useState, useEffect } from 'react';
import { AlertCircle, DollarSign, TrendingUp, Info, Calculator } from 'lucide-react';
import { conversionService } from '../services/conversionService';

const SelectorCuentaConCotizacion = ({
  cuentaSeleccionada,
  onCuentaChange,
  monto,
  onMontoChange,
  cotizacion,
  onCotizacionChange,
  tipo, // 'debe' o 'haber'
  required = false,
  className = ""
}) => {
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ultimaCotizacion, setUltimaCotizacion] = useState(null);
  const [error, setError] = useState('');

  // Cargar cuentas con información de moneda
  useEffect(() => {
    const cargarCuentas = async () => {
      try {
        setLoading(true);
        const data = await conversionService.obtenerCuentasConMoneda();
        setCuentas(data);
        
        // Obtener última cotización para ayudar al usuario (solo si la tabla existe)
        try {
          const ultima = await conversionService.obtenerUltimaCotizacion();
          setUltimaCotizacion(ultima);
        } catch (err) {
          console.warn('No se pudo obtener última cotización:', err);
          setUltimaCotizacion(null);
        }
      } catch (err) {
        console.error('Error cargando cuentas:', err);
        setError('Error cargando cuentas: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarCuentas();
  }, []);

  // Detectar si la cuenta requiere cotización
  const requiereCotizacion = cuentaSeleccionada?.requiere_cotizacion;
  const monedaCuenta = cuentaSeleccionada?.moneda_original || 'USD';

  // Calcular monto en USD si es necesario (solo si los valores son válidos)
  const montoUSD = (() => {
    if (!requiereCotizacion) return monto;
    if (!monto || !cotizacion) return 0;
    
    try {
      // Solo convertir si la cotización está en rango válido
      if (cotizacion >= 500 && cotizacion <= 5000) {
        return conversionService.convertirArsAUsd(monto, cotizacion);
      }
      return 0;
    } catch (error) {
      return 0;
    }
  })();

  // Manejar cambio de cuenta
  const handleCuentaChange = (e) => {
    const cuentaId = e.target.value;
    const cuenta = cuentas.find(c => c.id == cuentaId);
    onCuentaChange(cuenta);
    
    // Limpiar error al cambiar cuenta
    setError('');
    
    // Si la nueva cuenta no requiere cotización, limpiar cotización
    if (!cuenta?.requiere_cotizacion) {
      onCotizacionChange(0);
    }
  };

  // Manejar cambio de monto
  const handleMontoChange = (e) => {
    const valor = parseFloat(e.target.value) || 0;
    onMontoChange(valor);
    setError('');
  };

  // Manejar cambio de cotización
  const handleCotizacionChange = (e) => {
    const valor = parseFloat(e.target.value) || 0;
    onCotizacionChange(valor);
    setError('');
  };

  // Usar última cotización conocida
  const usarUltimaCotizacion = () => {
    if (ultimaCotizacion?.cotizacion) {
      onCotizacionChange(ultimaCotizacion.cotizacion);
    }
  };

  // Validar datos ingresados
  const validarDatos = () => {
    if (requiereCotizacion && cotizacion && (cotizacion < 500 || cotizacion > 5000)) {
      return 'La cotización debe estar entre $500 y $5000';
    }
    if (monto && monto < 0) {
      return 'El monto no puede ser negativo';
    }
    return '';
  };

  const errorValidacion = validarDatos();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Selector de Cuenta */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cuenta {required && '*'}
        </label>
        <select
          value={cuentaSeleccionada?.id || ''}
          onChange={handleCuentaChange}
          className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            required && !cuentaSeleccionada ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          required={required}
          disabled={loading}
        >
          <option value="">
            {loading ? 'Cargando cuentas...' : 'Seleccionar cuenta...'}
          </option>
          {cuentas.map(cuenta => (
            <option key={cuenta.id} value={cuenta.id}>
              {cuenta.codigo} - {cuenta.nombre} ({cuenta.moneda_original})
            </option>
          ))}
        </select>
        {required && !cuentaSeleccionada && (
          <p className="text-red-500 text-sm mt-1">Debe seleccionar una cuenta</p>
        )}
      </div>


      {/* Inputs de Monto y Cotización */}
      {cuentaSeleccionada && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Input de Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto en {requiereCotizacion ? 'Pesos (ARS)' : 'Dólares (USD)'} *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                step="0.01"
                value={monto || ''}
                onChange={handleMontoChange}
                placeholder={`0.00 ${requiereCotizacion ? 'ARS' : 'USD'}`}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Input de Cotización (solo para cuentas ARS) */}
          {requiereCotizacion && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cotización USD *
                {ultimaCotizacion && (
                  <button
                    type="button"
                    onClick={usarUltimaCotizacion}
                    className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    (usar última: ${ultimaCotizacion.cotizacion})
                  </button>
                )}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={cotizacion || ''}
                  onChange={handleCotizacionChange}
                  placeholder="Ej: 1200.00"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Ingrese la cotización actual del dólar
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mostrar Conversión Automática */}
      {requiereCotizacion && cotizacion && monto && cotizacion >= 500 && cotizacion <= 5000 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Calculator className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-800">Conversión Automática</span>
          </div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Monto en ARS:</span>
              <span className="font-medium">{conversionService.formatearMonto(monto, 'ARS')}</span>
            </div>
            <div className="flex justify-between">
              <span>Cotización:</span>
              <span className="font-medium">${cotizacion.toLocaleString()}</span>
            </div>
            <div className="border-t pt-1 flex justify-between">
              <span className="font-medium">Resultado en USD:</span>
              <span className="font-bold text-blue-600">
                {conversionService.formatearMonto(montoUSD, 'USD')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Mostrar errores de validación */}
      {(error || errorValidacion) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-800">{error || errorValidacion}</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default SelectorCuentaConCotizacion;