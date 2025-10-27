import { useState, useEffect } from 'react';
import { estadoSituacionPatrimonialService } from './useEstadoSituacionPatrimonial';
import { obtenerFechaLocal } from '../../../shared/utils/formatters';

// Función para identificar si una cuenta es inventario/mercadería
const esInventario = (cuenta) => {
  const codigo = cuenta.codigo || '';
  const nombre = cuenta.nombre.toLowerCase();

  // Buscar específicamente por el código de Mercadería (1.1.04.xx)
  // o por términos relacionados al inventario
  const esCodigoMercaderia = codigo.startsWith('1.1.04');

  const terminosInventario = [
    'mercaderia', 'mercadería', 'inventario', 'stock', 'existencias',
    'bienes de cambio'
  ];

  const esPorNombre = terminosInventario.some(term => nombre.includes(term));

  return esCodigoMercaderia || esPorNombre;
};

// Función para determinar el indicador de liquidez corriente
const determinarIndicadorLiquidez = (ratio) => {
  if (ratio < 1.0) {
    return {
      estado: 'riesgo',
      color: '#ef4444',
      emoji: '🔴',
      texto: 'Riesgo'
    };
  } else if (ratio >= 1.0 && ratio <= 1.5) {
    return {
      estado: 'aceptable',
      color: '#f59e0b',
      emoji: '🟡',
      texto: 'Aceptable'
    };
  } else {
    return {
      estado: 'saludable',
      color: '#10b981',
      emoji: '🟢',
      texto: 'Saludable'
    };
  }
};

// Función para determinar el indicador de prueba ácida
const determinarIndicadorPruebaAcida = (ratio) => {
  if (ratio < 0.8) {
    return {
      estado: 'debil',
      color: '#ef4444',
      emoji: '🔴',
      texto: 'Débil'
    };
  } else if (ratio >= 0.8 && ratio <= 1.0) {
    return {
      estado: 'justo',
      color: '#f59e0b',
      emoji: '🟡',
      texto: 'Justo'
    };
  } else {
    return {
      estado: 'solido',
      color: '#10b981',
      emoji: '🟢',
      texto: 'Sólido'
    };
  }
};

// Función para determinar el indicador de capital de trabajo
const determinarIndicadorCapitalTrabajo = (valor) => {
  if (valor < 0) {
    return {
      estado: 'riesgo',
      color: '#ef4444',
      emoji: '🔴',
      texto: 'Riesgo'
    };
  } else if (valor >= 0 && valor <= 5000) {
    return {
      estado: 'fragil',
      color: '#f59e0b',
      emoji: '🟡',
      texto: 'Frágil'
    };
  } else {
    return {
      estado: 'positivo',
      color: '#10b981',
      emoji: '🟢',
      texto: 'Positivo'
    };
  }
};

// Servicio para calcular ratios financieros
export const ratiosFinancierosService = {
  async calcularRatiosLiquidez(fechaCorte = null) {
    console.log('📊 Calculando ratios de liquidez...', { fechaCorte });

    try {
      const fecha = fechaCorte || obtenerFechaLocal();

      // Obtener balance general (UNA sola consulta)
      const balance = await estadoSituacionPatrimonialService.getBalanceGeneral(fecha);

      // Si no hay datos, retornar valores en cero
      if (!balance.activosDetalle || balance.activosDetalle.length === 0) {
        console.log('ℹ️ No hay datos de balance para calcular ratios');
        return {
          activoCorriente: 0,
          pasivoCorriente: 0,
          inventario: 0,
          liquidezCorriente: 0,
          pruebaAcida: 0,
          capitalTrabajoNeto: 0,
          indicadores: {
            liquidezCorriente: determinarIndicadorLiquidez(0),
            pruebaAcida: determinarIndicadorPruebaAcida(0),
            capitalTrabajoNeto: determinarIndicadorCapitalTrabajo(0)
          },
          fechaCalculo: fecha
        };
      }

      // Calcular activo corriente
      const activoCorriente = balance.activosDetalle
        .filter(item => estadoSituacionPatrimonialService.esActivoCorriente(item.cuenta))
        .reduce((sum, item) => sum + Math.abs(item.saldo), 0);

      console.log('💰 Activo Corriente:', activoCorriente);

      // Calcular pasivo corriente
      const pasivoCorriente = balance.pasivosDetalle
        .filter(item => estadoSituacionPatrimonialService.esPasivoCorriente(item.cuenta))
        .reduce((sum, item) => sum + Math.abs(item.saldo), 0);

      console.log('💳 Pasivo Corriente:', pasivoCorriente);

      // Calcular inventario (dentro de activos corrientes)
      const inventario = balance.activosDetalle
        .filter(item => estadoSituacionPatrimonialService.esActivoCorriente(item.cuenta) && esInventario(item.cuenta))
        .reduce((sum, item) => sum + Math.abs(item.saldo), 0);

      console.log('📦 Inventario:', inventario);

      // Calcular ratios
      const liquidezCorriente = pasivoCorriente > 0
        ? activoCorriente / pasivoCorriente
        : 0;

      const pruebaAcida = pasivoCorriente > 0
        ? (activoCorriente - inventario) / pasivoCorriente
        : 0;

      const capitalTrabajoNeto = activoCorriente - pasivoCorriente;

      console.log('📈 Ratios calculados:', {
        liquidezCorriente: liquidezCorriente.toFixed(2),
        pruebaAcida: pruebaAcida.toFixed(2),
        capitalTrabajoNeto: capitalTrabajoNeto.toFixed(2)
      });

      // Determinar indicadores de salud
      const indicadores = {
        liquidezCorriente: determinarIndicadorLiquidez(liquidezCorriente),
        pruebaAcida: determinarIndicadorPruebaAcida(pruebaAcida),
        capitalTrabajoNeto: determinarIndicadorCapitalTrabajo(capitalTrabajoNeto)
      };

      return {
        // Valores base
        activoCorriente,
        pasivoCorriente,
        inventario,
        // Ratios calculados
        liquidezCorriente,
        pruebaAcida,
        capitalTrabajoNeto,
        // Indicadores de salud
        indicadores,
        // Metadata
        fechaCalculo: fecha
      };

    } catch (error) {
      console.error('❌ Error calculando ratios de liquidez:', error);
      throw error;
    }
  }
};

// Hook personalizado para Ratios Financieros
export function useRatiosFinancieros() {
  const [ratios, setRatios] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const calcularRatios = async (fechaCorte = null) => {
    setLoading(true);
    setError(null);

    try {
      const data = await ratiosFinancierosService.calcularRatiosLiquidez(fechaCorte);
      setRatios(data);
      console.log('✅ Ratios financieros calculados exitosamente');
    } catch (err) {
      console.error('Error en useRatiosFinancieros:', err);
      setError(err.message || 'Error calculando ratios financieros');
    } finally {
      setLoading(false);
    }
  };

  // Calcular automáticamente al montar (fecha actual)
  useEffect(() => {
    console.log('🚀 Iniciando cálculo de ratios financieros...');
    calcularRatios();
  }, []);

  return {
    ratios,
    loading,
    error,
    refetch: calcularRatios
  };
}
