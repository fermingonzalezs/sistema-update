import React from 'react';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { useCotizacion } from '../hooks/useCotizacion';

const ConversionMonedas = ({ montoUSD = 0, mostrarActualizacion = true }) => {
  const { 
    cotizacion,
    loading,
    error,
    lastUpdate,
    obtenerCotizacion,
    convertirUSDaARS,
    formatearMonto
  } = useCotizacion();

  const montoARS = convertirUSDaARS(montoUSD);

  const handleActualizar = async () => {
    await obtenerCotizacion();
  };

  if (loading && !cotizacion) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span className="text-blue-800 text-sm">Obteniendo cotización...</span>
        </div>
      </div>
    );
  }

  if (error && !cotizacion) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-red-800 text-sm">Error obteniendo cotización</span>
          <button
            onClick={handleActualizar}
            className="text-red-600 hover:text-red-800 text-sm underline"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-gray-700">Conversión de Monedas</span>
        </div>
        {mostrarActualizacion && (
          <button
            onClick={handleActualizar}
            disabled={loading}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1 disabled:cursor-not-allowed"
            title="Actualizar cotización"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        )}
      </div>

      <div className="space-y-2">
        {/* Monto en USD */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">En Dólares:</span>
          <span className="font-bold text-green-700 text-lg">
            {formatearMonto(montoUSD, 'USD')}
          </span>
        </div>

        {/* Monto en ARS */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">En Pesos:</span>
          <span className="font-bold text-blue-700 text-lg">
            {formatearMonto(montoARS, 'ARS')}
          </span>
        </div>

        {/* Cotización */}
        {cotizacion && (
          <div className="border-t border-gray-200 pt-2 mt-3">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Cotización USD:</span>
              <span>{formatearMonto(cotizacion.promedio, 'ARS')}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Fuente:</span>
              <span>{cotizacion.fuente}</span>
            </div>
            {lastUpdate && (
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Actualizado:</span>
                <span>{lastUpdate.toLocaleTimeString('es-AR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversionMonedas;