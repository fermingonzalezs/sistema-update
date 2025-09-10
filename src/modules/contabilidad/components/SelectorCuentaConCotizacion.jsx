// components/SelectorCuentaConCotizacion.jsx
// Selector de Cuenta con Cotización Automática - UPDATE WW SRL
// Maneja cuentas en ARS (con cotización) y USD (directo)

import React, { useState, useEffect } from 'react';
import { AlertCircle, DollarSign, TrendingUp, Info, Calculator, RefreshCw } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { cotizacionService } from '../shared/services/cotizacionService';
import { requiereConversion, convertirARSaUSD } from '../shared/utils/currency';
import { formatearMonto } from '../shared/utils/formatters';

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
        // Obtener cuentas desde base de datos (función directa)
        const { data: cuentas, error } = await supabase
          .from('plan_cuentas')
          .select('id, codigo, nombre, moneda_original, requiere_cotizacion')
          .eq('activa', true)
          .order('codigo');
        const data = error ? [] : cuentas;
        setCuentas(data);
        
        // Obtener cotización actual para ayudar al usuario
        try {
          const cotizacionActual = await cotizacionService.obtenerCotizacionActual();
          setUltimaCotizacion({
            cotizacion: cotizacionActual.valor,
            fuente: cotizacionActual.fuente,
            timestamp: cotizacionActual.timestamp
          });
        } catch (err) {
          console.warn('No se pudo obtener cotización actual:', err);
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
        return convertirARSaUSD(monto, cotizacion);
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

  // Obtener cotización automática actualizada
  const obtenerCotizacionAutomatica = async () => {
    try {
      setLoading(true);
      const cotizacionActual = await cotizacionService.forzarActualizacion();
      const nuevaCotizacion = {
        cotizacion: cotizacionActual.valor,
        fuente: cotizacionActual.fuente,
        timestamp: cotizacionActual.timestamp
      };
      setUltimaCotizacion(nuevaCotizacion);
      onCotizacionChange(cotizacionActual.valor);
    } catch (err) {
      console.error('Error obteniendo cotización automática:', err);
      setError('Error obteniendo cotización: ' + err.message);
    } finally {
      setLoading(false);
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
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Cotización USD *
                </label>
                <div className="flex items-center space-x-2">
                  {ultimaCotizacion && (
                    <button
                      type="button"
                      onClick={usarUltimaCotizacion}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                      title={`Última cotización: ${ultimaCotizacion.fuente}`}
                    >
                      Usar ${ultimaCotizacion.cotizacion}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={obtenerCotizacionAutomatica}
                    disabled={loading}
                    className="flex items-center space-x-1 text-xs text-green-600 hover:text-green-800 underline disabled:opacity-50"
                    title="Obtener cotización actualizada automáticamente"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    <span>Auto</span>
                  </button>
                </div>
              </div>
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
              <span className="font-medium">{formatearMonto(monto, 'ARS')}</span>
            </div>
            <div className="flex justify-between">
              <span>Cotización:</span>
              <span className="font-medium">${cotizacion.toLocaleString()}</span>
            </div>
            <div className="border-t pt-1 flex justify-between">
              <span className="font-medium">Resultado en USD:</span>
              <span className="font-bold text-blue-600">
                {formatearMonto(montoUSD, 'USD')}
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