// components/SelectorCuentaImputableConCotizacion.jsx
// Selector de Cuenta Imputable con Cotización - UPDATE WW SRL
// Combina buscador de cuentas imputables + manejo de cotización automática

import React, { useState, useEffect } from 'react';
import { AlertCircle, DollarSign, TrendingUp, Info, Calculator, RefreshCw } from 'lucide-react';
import { cotizacionService } from '../../shared/services/cotizacionService';
import { requiereConversion, convertirARSaUSD } from '../../shared/utils/currency';
import { formatearMonto } from '../../shared/utils/formatters';
import BuscadorCuentasImputables from './BuscadorCuentasImputables';

const SelectorCuentaImputableConCotizacion = ({
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
  const [ultimaCotizacion, setUltimaCotizacion] = useState(null);
  const [error, setError] = useState('');
  const [loadingCotizacion, setLoadingCotizacion] = useState(false);

  // Cargar cotización inicial (igual que CarritoWidget)
  useEffect(() => {
    cargarCotizacionInicial();
  }, []);

  const cargarCotizacionInicial = async () => {
    try {
      const cotizacionData = await cotizacionService.obtenerCotizacionActual();
      const cotizacionValor = cotizacionData.valor || cotizacionData.promedio || 1000;
      setUltimaCotizacion({
        cotizacion: cotizacionValor,
        fuente: cotizacionData.fuente,
        timestamp: cotizacionData.timestamp
      });
      console.log('💰 Cotización cargada para libro diario:', cotizacionValor, 'de', cotizacionData.fuente);
    } catch (error) {
      console.error('Error cargando cotización:', error);
      // Cotización de emergencia (igual que CarritoWidget)
      setUltimaCotizacion({
        cotizacion: 1000,
        fuente: 'EMERGENCIA',
        timestamp: new Date().toISOString()
      });
    }
  };

  // Auto-proponer cotización cuando se selecciona cuenta ARS (igual que CarritoWidget)
  useEffect(() => {
    if (cuentaSeleccionada?.requiere_cotizacion && ultimaCotizacion && !cotizacion) {
      onCotizacionChange(ultimaCotizacion.cotizacion);
      console.log('💱 Auto-completando cotización:', ultimaCotizacion.cotizacion);
    }
  }, [cuentaSeleccionada, ultimaCotizacion, cotizacion, onCotizacionChange]);

  const usarCotizacionAutomatica = async () => {
    try {
      setLoadingCotizacion(true);
      setError('');
      const cotizacionData = await cotizacionService.obtenerCotizacionActual();
      const cotizacionValor = cotizacionData.valor || cotizacionData.promedio || 1000;
      
      onCotizacionChange(cotizacionValor);
      setUltimaCotizacion({
        cotizacion: cotizacionValor,
        fuente: cotizacionData.fuente,
        timestamp: cotizacionData.timestamp
      });
      
      console.log('🔄 Cotización actualizada:', cotizacionValor, 'de', cotizacionData.fuente);
    } catch (err) {
      setError('Error obteniendo cotización: ' + err.message);
      console.error('❌ Error actualizando cotización:', err);
    } finally {
      setLoadingCotizacion(false);
    }
  };

  const calcularConversion = () => {
    if (!cuentaSeleccionada || !monto || monto <= 0) {
      return null;
    }

    try {
      if (requiereConversion(cuentaSeleccionada, cotizacion)) {
        const montoUSD = convertirARSaUSD(monto, cotizacion);
        return {
          montoOriginal: monto,
          monedaOriginal: 'ARS',
          montoConvertido: montoUSD,
          monedaConvertida: 'USD',
          cotizacionUsada: cotizacion
        };
      } else {
        return {
          montoOriginal: monto,
          monedaOriginal: 'USD',
          montoConvertido: monto,
          monedaConvertida: 'USD',
          cotizacionUsada: null
        };
      }
    } catch (err) {
      return { error: err.message };
    }
  };

  const conversion = calcularConversion();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Buscador de Cuentas Imputables */}
      <BuscadorCuentasImputables
        cuentaSeleccionada={cuentaSeleccionada}
        onCuentaChange={onCuentaChange}
        required={required}
      />

      {/* Grid de Monto y Cotización */}
      {cuentaSeleccionada && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">
              Monto {cuentaSeleccionada?.requiere_cotizacion ? 'en ARS' : 'en USD'} *
            </label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={monto || ''}
                onChange={(e) => onMontoChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full h-9 border border-slate-200 rounded pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
              />
            </div>
          </div>

          {/* Cotización (solo para cuentas ARS) */}
          {cuentaSeleccionada?.requiere_cotizacion && (
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Cotización USD/ARS *
              </label>
              <div className="relative">
                <TrendingUp size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cotizacion || ''}
                  onChange={(e) => onCotizacionChange(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full h-9 border border-slate-200 rounded pl-10 pr-12 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                />
                
                {/* Botón de cotización automática */}
                {ultimaCotizacion && (
                  <button
                    type="button"
                    onClick={usarCotizacionAutomatica}
                    disabled={loadingCotizacion}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                    title={`Usar cotización automática: ${ultimaCotizacion.cotizacion}`}
                  >
                    {loadingCotizacion ? (
                      <div className="animate-spin">
                        <RefreshCw size={14} />
                      </div>
                    ) : (
                      <RefreshCw size={14} />
                    )}
                  </button>
                )}
              </div>
              
              {/* Información de cotización automática */}
              {ultimaCotizacion && (
                <div className="mt-2 text-xs text-slate-600 flex items-center">
                  <Info size={12} className="mr-1" />
                  Última cotización: {ultimaCotizacion.cotizacion} ({ultimaCotizacion.fuente})
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Panel de Conversión */}
      {conversion && !conversion.error && monto > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Calculator size={16} className="text-slate-600" />
            <h5 className="font-medium text-slate-800">Conversión a USD</h5>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-600">Monto ingresado:</span>
              <div className="font-medium text-slate-800">
                {formatearMonto(conversion.montoOriginal, conversion.monedaOriginal)}
              </div>
            </div>
            
            <div>
              <span className="text-slate-600">Equivalente en USD:</span>
              <div className="font-medium text-emerald-600">
                {formatearMonto(conversion.montoConvertido, 'USD')}
              </div>
            </div>
            
            {conversion.cotizacionUsada && (
              <div className="md:col-span-2">
                <span className="text-slate-600">Cotización aplicada:</span>
                <div className="font-medium text-slate-800">
                  1 USD = {conversion.cotizacionUsada} ARS
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Errores */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <div className="flex items-center">
            <AlertCircle size={16} className="text-red-600 mr-2" />
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        </div>
      )}

      {conversion?.error && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <div className="flex items-center">
            <AlertCircle size={16} className="text-red-600 mr-2" />
            <span className="text-red-800 text-sm">Error de conversión: {conversion.error}</span>
          </div>
        </div>
      )}

      {/* Información de ayuda */}
      {cuentaSeleccionada?.requiere_cotizacion && (!cotizacion || cotizacion <= 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <div className="flex items-start">
            <Info size={16} className="text-blue-600 mr-2 mt-0.5" />
            <div className="text-blue-800 text-sm">
              <p className="font-medium">Cuenta en pesos argentinos</p>
              <p>Es necesario ingresar la cotización USD/ARS para la conversión automática.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectorCuentaImputableConCotizacion;