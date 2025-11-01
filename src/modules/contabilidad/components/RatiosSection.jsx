import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, DollarSign, DropletIcon, Wallet, ShoppingCart, PercentIcon, Activity, PieChart, BarChart3, TrendingDown } from 'lucide-react';
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ReferenceLine
} from 'recharts';
import { useRatiosFinancieros } from '../hooks/useRatiosFinancieros';
import { formatearMonto } from '../../../shared/utils/formatters';

// ===============================
// 🟢 Componente Gauge radial con marcas de rangos
// ===============================
const GaugeCard = ({ titulo, valor, formula, indicador, maxValue, icon: Icon, rangos, activoCorriente, pasivoCorriente, inventario, valoresFormula, decimales = 2, tamanoValor = 'text-4xl' }) => {
  // Calcular porcentaje para el valor actual
  const valorLimitado = Math.max(0, Math.min(valor, maxValue));
  const porcentaje = (valorLimitado / maxValue) * 100;

  // Datos para el gauge: fondo gris + valor actual con color
  const gaugeData = [
    {
      name: 'Valor',
      value: porcentaje,
      fill: indicador.color
    }
  ];

  // Calcular posiciones angulares para las marcas de rangos
  const calcularAngulo = (valor) => {
    const porcentaje = (valor / maxValue) * 100;
    return 90 - (porcentaje * 3.6); // 90° inicio, -3.6° por cada 1%
  };

  // Determinar qué fórmula mostrar basado en el título
  const esLiquidezCorriente = titulo.toLowerCase().includes('liquidez corriente');
  const esPruebaAcida = titulo.toLowerCase().includes('prueba');
  const tieneValoresFormula = valoresFormula && Object.keys(valoresFormula).length > 0;

  return (
    <div className="bg-white border border-slate-200 rounded p-4">
      {/* Título */}
      <div className="border-b border-slate-200 pb-3 mb-4">
        <div className="flex items-center justify-center space-x-2 mb-2">
          {Icon && <Icon className="w-5 h-5 text-slate-700" />}
          <h3 className="text-sm font-semibold text-slate-800 uppercase text-center">
            {titulo}
          </h3>
        </div>

        {/* Fórmula y valores */}
        {(activoCorriente !== undefined && pasivoCorriente !== undefined) && (
          <div className="text-center space-y-1">
            {esLiquidezCorriente && (
              <>
                <div className="text-xs text-slate-600 font-medium">
                  Activo Corriente / Pasivo Corriente
                </div>
                <div className="text-xs text-slate-700">
                  {Math.round(activoCorriente).toLocaleString('es-AR')} / {Math.round(pasivoCorriente).toLocaleString('es-AR')}
                </div>
              </>
            )}
            {esPruebaAcida && inventario !== undefined && (
              <>
                <div className="text-xs text-slate-600 font-medium">
                  (Activo Corriente - Inventario) / Pasivo Corriente
                </div>
                <div className="text-xs text-slate-700">
                  ({Math.round(activoCorriente).toLocaleString('es-AR')} - {Math.round(inventario).toLocaleString('es-AR')}) / {Math.round(pasivoCorriente).toLocaleString('es-AR')}
                </div>
              </>
            )}
          </div>
        )}
        {/* Fórmula personalizada con valores */}
        {tieneValoresFormula && (
          <div className="text-center space-y-1">
            <div className="text-xs text-slate-600 font-medium">
              {valoresFormula.formulaTexto}
            </div>
            <div className="text-xs text-slate-700">
              {valoresFormula.valoresTexto}
            </div>
          </div>
        )}
      </div>

      {/* Gauge visual */}
      <div className="flex flex-col items-center">
        <div style={{ width: '100%', height: 200, position: 'relative' }}>
          {/* Indicador de estado - esquina superior izquierda */}
          <div
            className="absolute top-0 left-0 flex items-center space-x-1 px-2 py-1 rounded mb-2"
            style={{ backgroundColor: `${indicador.color}20`, zIndex: 10 }}
          >
            <span className="text-xs">{indicador.emoji}</span>
            <span className="text-[11px] font-semibold" style={{ color: indicador.color }}>
              {indicador.texto}
            </span>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="100%"
              barSize={25}
              data={gaugeData}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                dataKey="value"
                cornerRadius={10}
                background={{ fill: '#e2e8f0' }}
              />
            </RadialBarChart>
          </ResponsiveContainer>

          {/* Marcas de separación de rangos */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
          >
            {rangos.slice(0, -1).map((rango, idx) => {
              const angulo = calcularAngulo(rango.max);
              const rad = (angulo * Math.PI) / 180;
              const cx = 50; // porcentaje
              const cy = 50;
              const innerR = 70; // porcentaje del innerRadius
              const outerR = 100; // porcentaje del outerRadius

              return (
                <line
                  key={idx}
                  x1={`${cx + Math.cos(rad) * innerR}%`}
                  y1={`${cy - Math.sin(rad) * innerR}%`}
                  x2={`${cx + Math.cos(rad) * outerR}%`}
                  y2={`${cy - Math.sin(rad) * outerR}%`}
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
              );
            })}
          </svg>

          {/* Valor en el centro */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}
          >
            <div className={`${tamanoValor} font-bold text-slate-900`}>
              {typeof valor === 'number' && !isNaN(valor) ? valor.toFixed(decimales) : '0.00'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              de {maxValue.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Interpretación resumida */}
        <div className="w-full px-2 py-2 bg-slate-50 rounded border border-slate-200">
          <div className="text-xs text-slate-700 flex items-center justify-center gap-2 flex-wrap">
            {rangos.map((rango, idx) => (
              <span key={idx} className="flex items-center gap-1 whitespace-nowrap">
                <span>{rango.emoji}</span>
                <span className="font-medium text-[10px]">{rango.label}</span>
                <span className="text-slate-500 text-[10px]">({rango.min.toFixed(1)}-{rango.max.toFixed(1)})</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===============================
// 🟢 Gauge para Capital de Trabajo (radial circular)
// ===============================
const GaugeCardCapitalTrabajo = ({ titulo, valor, formula, indicador, icon: Icon, rangos, activoCorriente, pasivoCorriente }) => {
  // Función para formatear valor en formato abreviado (K para miles)
  const formatearValorAbreviado = (valor) => {
    const valorAbs = Math.abs(valor);
    const signo = valor < 0 ? '-' : '';

    if (valorAbs >= 1000) {
      const valorK = (valorAbs / 1000).toFixed(1);
      return `${signo}$${valorK}K`;
    }
    return `${signo}$${valorAbs.toFixed(0)}`;
  };

  // Normalizar valor a rango 0-100% para el gauge
  // Rango: -10000 a 20000 (total 30000)
  const minValor = -10000;
  const maxValor = 20000;
  const rangoTotal = maxValor - minValor;

  // Convertir valor real a porcentaje (0-100)
  const valorNormalizado = Math.max(minValor, Math.min(valor, maxValor));
  const porcentaje = ((valorNormalizado - minValor) / rangoTotal) * 100;

  // Datos para el gauge
  const gaugeData = [
    {
      name: 'Capital',
      value: porcentaje,
      fill: indicador.color
    }
  ];

  // Calcular posiciones angulares para las marcas (-10K=0%, 0K=33.33%, 5K=50%, 20K=100%)
  const calcularAngulo = (valorReal) => {
    const porc = ((valorReal - minValor) / rangoTotal) * 100;
    return 90 - (porc * 3.6);
  };

  return (
    <div className="bg-white border border-slate-200 rounded p-4">
      {/* Título */}
      <div className="border-b border-slate-200 pb-3 mb-4">
        <div className="flex items-center justify-center space-x-2 mb-2">
          {Icon && <Icon className="w-5 h-5 text-slate-700" />}
          <h3 className="text-sm font-semibold text-slate-800 uppercase text-center">
            {titulo}
          </h3>
        </div>

        {/* Fórmula y valores */}
        {activoCorriente !== undefined && pasivoCorriente !== undefined && (
          <div className="text-center space-y-1">
            <div className="text-xs text-slate-600 font-medium">
              Activo Corriente - Pasivo Corriente
            </div>
            <div className="text-xs text-slate-700">
              {Math.round(activoCorriente).toLocaleString('es-AR')} - {Math.round(pasivoCorriente).toLocaleString('es-AR')}
            </div>
          </div>
        )}
      </div>

      {/* Gauge visual */}
      <div className="flex flex-col items-center">
        <div style={{ width: '100%', height: 200, position: 'relative' }}>
          {/* Indicador de estado - esquina superior izquierda */}
          <div
            className="absolute top-0 left-0 flex items-center space-x-1 px-2 py-1 rounded mb-2"
            style={{ backgroundColor: `${indicador.color}20`, zIndex: 10 }}
          >
            <span className="text-xs">{indicador.emoji}</span>
            <span className="text-[11px] font-semibold" style={{ color: indicador.color }}>
              {indicador.texto}
            </span>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="100%"
              barSize={25}
              data={gaugeData}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                dataKey="value"
                cornerRadius={10}
                background={{ fill: '#e2e8f0' }}
              />
            </RadialBarChart>
          </ResponsiveContainer>

          {/* Marcas de separación de rangos */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
          >
            {/* Marca en 0 y en 5000 */}
            {[0, 5000].map((valorMarca, idx) => {
              const angulo = calcularAngulo(valorMarca);
              const rad = (angulo * Math.PI) / 180;
              const cx = 50;
              const cy = 50;
              const innerR = 70;
              const outerR = 100;

              return (
                <line
                  key={idx}
                  x1={`${cx + Math.cos(rad) * innerR}%`}
                  y1={`${cy - Math.sin(rad) * innerR}%`}
                  x2={`${cx + Math.cos(rad) * outerR}%`}
                  y2={`${cy - Math.sin(rad) * outerR}%`}
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
              );
            })}
          </svg>

          {/* Valor en el centro - TEXTO REDUCIDO */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}
          >
            <div className="text-2xl font-bold text-slate-900">
              {formatearValorAbreviado(valor)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              -$10K a $20K
            </div>
          </div>
        </div>

        {/* Interpretación resumida */}
        <div className="w-full px-2 py-2 bg-slate-50 rounded border border-slate-200">
          <div className="text-xs text-slate-700 flex items-center justify-center gap-2 flex-wrap">
            {rangos.map((rango, idx) => (
              <span key={idx} className="flex items-center gap-1 whitespace-nowrap">
                <span>{rango.emoji}</span>
                <span className="font-medium text-[10px]">{rango.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===============================
// 🟢 Gauge para Ratio de Sobrecompra
// ===============================
const GaugeCardSobrecompra = ({ titulo, cmv, compras, ratio, indicador, icon: Icon }) => {
  // Calcular porcentaje para el gauge (0 a 2.0 como 100%)
  const maxValue = 2.0;
  const valorLimitado = Math.max(0, Math.min(ratio, maxValue));
  const porcentaje = (valorLimitado / maxValue) * 100;

  const gaugeData = [
    {
      name: 'Ratio',
      value: porcentaje,
      fill: indicador.color
    }
  ];

  // Calcular posiciones angulares para las marcas (1.0 y 1.1)
  const calcularAngulo = (valor) => {
    const porc = (valor / maxValue) * 100;
    return 90 - (porc * 3.6);
  };

  return (
    <div className="bg-white border border-slate-200 rounded p-4">
      {/* Título */}
      <div className="border-b border-slate-200 pb-3 mb-4">
        <div className="flex items-center justify-center space-x-2 mb-2">
          {Icon && <Icon className="w-5 h-5 text-slate-700" />}
          <h3 className="text-sm font-semibold text-slate-800 uppercase text-center">
            {titulo}
          </h3>
        </div>

        {/* Fórmula y valores */}
        <div className="text-center space-y-1">
          <div className="text-xs text-slate-600 font-medium">
            Compras / CMV
          </div>
          <div className="text-xs text-slate-700">
            {Math.round(compras).toLocaleString('es-AR')} / {Math.round(cmv).toLocaleString('es-AR')}
          </div>
        </div>
      </div>

      {/* Gauge visual */}
      <div className="flex flex-col items-center">
        <div style={{ width: '100%', height: 200, position: 'relative' }}>
          {/* Indicador de estado - esquina superior izquierda */}
          <div
            className="absolute top-0 left-0 flex items-center space-x-1 px-2 py-1 rounded mb-2"
            style={{ backgroundColor: `${indicador.color}20`, zIndex: 10 }}
          >
            <span className="text-xs">{indicador.emoji}</span>
            <span className="text-[11px] font-semibold" style={{ color: indicador.color }}>
              {indicador.texto}
            </span>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="100%"
              barSize={25}
              data={gaugeData}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                dataKey="value"
                cornerRadius={10}
                background={{ fill: '#e2e8f0' }}
              />
            </RadialBarChart>
          </ResponsiveContainer>

          {/* Marcas de separación de rangos */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
          >
            {[0.9, 1.0].map((valorMarca, idx) => {
              const angulo = calcularAngulo(valorMarca);
              const rad = (angulo * Math.PI) / 180;
              const cx = 50;
              const cy = 50;
              const innerR = 70;
              const outerR = 100;

              return (
                <line
                  key={idx}
                  x1={`${cx + Math.cos(rad) * innerR}%`}
                  y1={`${cy - Math.sin(rad) * innerR}%`}
                  x2={`${cx + Math.cos(rad) * outerR}%`}
                  y2={`${cy - Math.sin(rad) * outerR}%`}
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
              );
            })}
          </svg>

          {/* Valor en el centro */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}
          >
            <div className="text-4xl font-bold text-slate-900">
              {typeof ratio === 'number' && !isNaN(ratio) ? ratio.toFixed(2) : '0.00'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              de {maxValue.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Interpretación resumida */}
        <div className="w-full px-2 py-2 bg-slate-50 rounded border border-slate-200">
          <div className="text-xs text-slate-700 flex items-center justify-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 whitespace-nowrap">
              <span>🟢</span>
              <span className="font-medium text-[10px]">Saludable</span>
              <span className="text-slate-500 text-[10px]">(&lt;0.9)</span>
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <span>🟡</span>
              <span className="font-medium text-[10px]">Alineado</span>
              <span className="text-slate-500 text-[10px]">(0.9-1.0)</span>
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <span>🔴</span>
              <span className="font-medium text-[10px]">Sobrecompra</span>
              <span className="text-slate-500 text-[10px]">(&gt;1.0)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===============================
// 🟢 Gauge para Ratios de Rentabilidad (ROA/ROE) con doble valor
// ===============================
const GaugeCardRentabilidad = ({
  titulo,
  valorPeriodo,
  valorAnualizado,
  mesesPeriodo,
  indicador,
  maxValue,
  icon: Icon,
  rangos,
  formula,
  valoresFormula
}) => {
  // Calcular porcentaje para el gauge (usamos el valor anualizado)
  const valorLimitado = Math.max(0, Math.min(valorAnualizado, maxValue));
  const porcentaje = (valorLimitado / maxValue) * 100;

  const gaugeData = [
    {
      name: 'Valor',
      value: porcentaje,
      fill: indicador.color
    }
  ];

  // Calcular posiciones angulares para las marcas de rangos
  const calcularAngulo = (valor) => {
    const porcentaje = (valor / maxValue) * 100;
    return 90 - (porcentaje * 3.6);
  };

  return (
    <div className="bg-white border border-slate-200 rounded p-4">
      {/* Título */}
      <div className="border-b border-slate-200 pb-3 mb-4">
        <div className="flex items-center justify-center space-x-2 mb-2">
          {Icon && <Icon className="w-5 h-5 text-slate-700" />}
          <h3 className="text-sm font-semibold text-slate-800 uppercase text-center">
            {titulo}
          </h3>
        </div>

        {/* Fórmula */}
        {formula && (
          <div className="text-center space-y-1">
            <div className="text-xs text-slate-600 font-medium">
              {formula}
            </div>
            {valoresFormula && (
              <div className="text-xs text-slate-700">
                {valoresFormula}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Gauge visual */}
      <div className="flex flex-col items-center">
        <div style={{ width: '100%', height: 200, position: 'relative' }}>
          {/* Indicador de estado - esquina superior izquierda */}
          <div
            className="absolute top-0 left-0 flex items-center space-x-1 px-2 py-1 rounded mb-2"
            style={{ backgroundColor: `${indicador.color}20`, zIndex: 10 }}
          >
            <span className="text-xs">{indicador.emoji}</span>
            <span className="text-[11px] font-semibold" style={{ color: indicador.color }}>
              {indicador.texto}
            </span>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="100%"
              barSize={25}
              data={gaugeData}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                dataKey="value"
                cornerRadius={10}
                background={{ fill: '#e2e8f0' }}
              />
            </RadialBarChart>
          </ResponsiveContainer>

          {/* Marcas de separación de rangos */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
          >
            {rangos.slice(0, -1).map((rango, idx) => {
              const angulo = calcularAngulo(rango.max);
              const rad = (angulo * Math.PI) / 180;
              const cx = 50;
              const cy = 50;
              const innerR = 70;
              const outerR = 100;

              return (
                <line
                  key={idx}
                  x1={`${cx + Math.cos(rad) * innerR}%`}
                  y1={`${cy - Math.sin(rad) * innerR}%`}
                  x2={`${cx + Math.cos(rad) * outerR}%`}
                  y2={`${cy - Math.sin(rad) * outerR}%`}
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
              );
            })}
          </svg>

          {/* Valor anualizado en el centro */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}
          >
            <div className="text-2xl font-bold text-slate-900">
              {typeof valorAnualizado === 'number' && !isNaN(valorAnualizado) ? valorAnualizado.toFixed(2) : '0.00'}%
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Anualizado
            </div>
          </div>
        </div>

        {/* Desglose de valores: Período + Anualizado */}
        <div className="w-full mt-3 p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600 font-medium">Período ({mesesPeriodo.toFixed(1)} meses):</span>
            <span className="text-slate-900 font-semibold">{typeof valorPeriodo === 'number' && !isNaN(valorPeriodo) ? valorPeriodo.toFixed(2) : '0.00'}%</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600 font-medium">Anualizado (12 meses):</span>
            <span className="text-emerald-700 font-bold">{typeof valorAnualizado === 'number' && !isNaN(valorAnualizado) ? valorAnualizado.toFixed(2) : '0.00'}%</span>
          </div>
        </div>

        {/* Interpretación resumida */}
        <div className="w-full mt-2 px-2 py-2 bg-slate-50 rounded border border-slate-200">
          <div className="text-xs text-slate-700 flex items-center justify-center gap-2 flex-wrap">
            {rangos.map((rango, idx) => (
              <span key={idx} className="flex items-center gap-1 whitespace-nowrap">
                <span>{rango.emoji}</span>
                <span className="font-medium text-[10px]">{rango.label}</span>
                <span className="text-slate-500 text-[10px]">({rango.min.toFixed(0)}-{rango.max.toFixed(0)}%)</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===============================
// 🟢 Componente principal
// ===============================
const RatiosSection = () => {
  const { ratios, ratioSobrecompra, ratiosRentabilidad, ratiosEficiencia, loading, loadingPeriodo, error, refetch, calcularRatiosPeriodo, datosDebug, generarDatosDebug } = useRatiosFinancieros();

  // Estado para período global
  const [periodoGlobal, setPeriodoGlobal] = useState(1); // Meses (1, 3, 6, 12)
  const [inicializado, setInicializado] = useState(false);

  // Estado para tabla de debugging
  const [categoriaDebug, setCategoriaDebug] = useState('ventas');

  // Calcular fechas basadas en el período seleccionado (meses calendario completos)
  const calcularFechas = (meses) => {
    const hoy = new Date();

    // Formatear fecha hasta (hoy) en formato YYYY-MM-DD local
    const fechaHasta = hoy.getFullYear() + '-' +
                       String(hoy.getMonth() + 1).padStart(2, '0') + '-' +
                       String(hoy.getDate()).padStart(2, '0');

    // Calcular fecha desde: primer día del mes hace X meses
    // Por ejemplo, si estamos en octubre (mes 9, índice 9) y meses=1:
    // - Restamos 1 mes -> septiembre (mes 8, índice 8)
    // - Pero queremos DESDE octubre, así que restamos (meses - 1)
    const fechaDesdeDate = new Date(hoy.getFullYear(), hoy.getMonth() - (meses - 1), 1);

    const fechaDesde = fechaDesdeDate.getFullYear() + '-' +
                       String(fechaDesdeDate.getMonth() + 1).padStart(2, '0') + '-' +
                       String(fechaDesdeDate.getDate()).padStart(2, '0');

    console.log(`📅 Período de ${meses} mes(es): ${fechaDesde} al ${fechaHasta}`);

    return { fechaDesde, fechaHasta };
  };

  // Efecto para cargar datos iniciales - ahora se maneja en el hook
  useEffect(() => {
    if (!inicializado) {
      setInicializado(true);
    }
  }, [inicializado]);

  // Manejador de cambio de período - ahora con loading unificado
  const handleCambioPeriodo = async (nuevosMeses) => {
    console.log('🔄 CAMBIO DE PERÍODO - Nuevo período:', nuevosMeses);
    setPeriodoGlobal(nuevosMeses);
    const { fechaDesde, fechaHasta } = calcularFechas(nuevosMeses);
    console.log('🔄 CAMBIO DE PERÍODO - Fechas calculadas:', { fechaDesde, fechaHasta });

    // Calcular todos los ratios y debug en paralelo con un solo loading
    await Promise.all([
      calcularRatiosPeriodo(fechaDesde, fechaHasta),
      generarDatosDebug(fechaDesde, fechaHasta)
    ]);
  };

  // Manejador de refrescar - recalcula TODO con el período actual
  const handleRefrescar = async () => {
    const { fechaDesde, fechaHasta } = calcularFechas(periodoGlobal);

    // Refrescar liquidez y ratios de período en paralelo
    await Promise.all([
      refetch(),
      calcularRatiosPeriodo(fechaDesde, fechaHasta),
      generarDatosDebug(fechaDesde, fechaHasta)
    ]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <span className="ml-3 text-slate-600">Calculando ratios financieros...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm flex items-center gap-2 mx-auto"
        >
          <RefreshCw size={16} />
          Reintentar
        </button>
      </div>
    );
  }

  if (!ratios) {
    return <div className="p-8 text-center text-slate-600">No hay datos disponibles para calcular ratios</div>;
  }

  return (
    <div className="p-0 bg-slate-50">
      <div className="bg-white rounded border border-slate-200 mb-4">
        {/* Header con título y botones */}
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-semibold">Ratios Financieros</h2>
                <p className="text-slate-300 mt-1">Análisis financiero integral de la empresa</p>
              </div>
            </div>
            <button
              onClick={handleRefrescar}
              className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm flex items-center gap-2 transition-colors"
            >
              <RefreshCw size={16} />
              Refrescar
            </button>
          </div>
        </div>

        {/* Selector de Período Global */}
        <div className="p-4 bg-gray-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Período de Análisis:
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleCambioPeriodo(1)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  periodoGlobal === 1
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                1 Mes
              </button>
              <button
                onClick={() => handleCambioPeriodo(3)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  periodoGlobal === 3
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                3 Meses
              </button>
              <button
                onClick={() => handleCambioPeriodo(6)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  periodoGlobal === 6
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                6 Meses
              </button>
              <button
                onClick={() => handleCambioPeriodo(12)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  periodoGlobal === 12
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                12 Meses
              </button>
            </div>
          </div>
        </div>

        {/* Información financiera global */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-sm">
            {/* Datos de Balance (actuales) */}
            <div className="text-center">
              <span className="text-slate-600 block text-xs mb-1 font-medium">Activo Corriente</span>
              <span className="font-semibold text-slate-900">
                {formatearMonto(ratios.activoCorriente, 'USD')}
              </span>
            </div>
            <div className="text-center">
              <span className="text-slate-600 block text-xs mb-1 font-medium">Pasivo Corriente</span>
              <span className="font-semibold text-slate-900">
                {formatearMonto(ratios.pasivoCorriente, 'USD')}
              </span>
            </div>
            <div className="text-center">
              <span className="text-slate-600 block text-xs mb-1 font-medium">Inventario</span>
              <span className="font-semibold text-slate-900">
                {formatearMonto(ratios.inventario, 'USD')}
              </span>
            </div>

            {/* Datos del Período (si están disponibles) */}
            {ratiosRentabilidad && (
              <>
                <div className="text-center">
                  <span className="text-slate-600 block text-xs mb-1 font-medium">Ventas</span>
                  <span className="font-semibold text-slate-900">
                    {formatearMonto(ratiosRentabilidad.ventas, 'USD')}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-slate-600 block text-xs mb-1 font-medium">CMV</span>
                  <span className="font-semibold text-slate-900">
                    {formatearMonto(ratiosRentabilidad.cmv, 'USD')}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-slate-600 block text-xs mb-1 font-medium">Gastos Operativos</span>
                  <span className="font-semibold text-slate-900">
                    {formatearMonto(ratiosRentabilidad.gastosOperativos, 'USD')}
                  </span>
                </div>
              </>
            )}

            {/* Datos de Sobrecompra (si están disponibles) */}
            {ratioSobrecompra && (
              <div className="text-center">
                <span className="text-slate-600 block text-xs mb-1 font-medium">Compras</span>
                <span className="font-semibold text-slate-900">
                  {formatearMonto(ratioSobrecompra.compras, 'USD')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Gráficos de Liquidez */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center uppercase bg-slate-50 py-3 rounded">Ratios de Liquidez</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GaugeCard
              titulo="Liquidez Corriente"
              valor={ratios.liquidezCorriente}
              formula="Activo Corriente / Pasivo Corriente"
              indicador={ratios.indicadores.liquidezCorriente}
              maxValue={3.0}
              icon={DropletIcon}
              activoCorriente={ratios.activoCorriente}
              pasivoCorriente={ratios.pasivoCorriente}
              rangos={[
                { min: 0, max: 1.0, label: 'Riesgo', color: '#ef4444', emoji: '🔴', descripcion: 'Dificultad para cubrir deudas' },
                { min: 1.0, max: 1.5, label: 'Aceptable', color: '#f59e0b', emoji: '🟡', descripcion: 'Capacidad ajustada' },
                { min: 1.5, max: 3.0, label: 'Saludable', color: '#10b981', emoji: '🟢', descripcion: 'Buena capacidad de pago' }
              ]}
            />

            <GaugeCard
              titulo="Prueba Ácida"
              valor={ratios.pruebaAcida}
              formula="(Activo Corriente - Inventario) / Pasivo Corriente"
              indicador={ratios.indicadores.pruebaAcida}
              maxValue={2.0}
              icon={DollarSign}
              activoCorriente={ratios.activoCorriente}
              pasivoCorriente={ratios.pasivoCorriente}
              inventario={ratios.inventario}
              rangos={[
                { min: 0, max: 0.8, label: 'Débil', color: '#ef4444', emoji: '🔴', descripcion: 'Depende del inventario' },
                { min: 0.8, max: 1.0, label: 'Justo', color: '#f59e0b', emoji: '🟡', descripcion: 'Capacidad limitada' },
                { min: 1.0, max: 2.0, label: 'Sólido', color: '#10b981', emoji: '🟢', descripcion: 'Pago sin vender stock' }
              ]}
            />

            <GaugeCardCapitalTrabajo
              titulo="Capital de Trabajo Neto"
              valor={ratios.capitalTrabajoNeto}
              formula="Activo Corriente - Pasivo Corriente"
              indicador={ratios.indicadores.capitalTrabajoNeto}
              icon={Wallet}
              activoCorriente={ratios.activoCorriente}
              pasivoCorriente={ratios.pasivoCorriente}
              rangos={[
                { emoji: '🔴', label: 'Negativo', descripcion: 'Pasivos > Activos' },
                { emoji: '🟡', label: '$0-5K', descripcion: 'Margen reducido' },
                { emoji: '🟢', label: '>$5K', descripcion: 'Buen respaldo' }
              ]}
            />
          </div>
        </div>

        {/* Gráficos de Endeudamiento */}
        <div className="p-6 pt-0">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center uppercase bg-slate-50 py-3 rounded">Ratios de Endeudamiento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GaugeCard
              titulo="Endeudamiento Total"
              valor={ratios.endeudamientoTotal}
              indicador={ratios.indicadoresEndeudamiento.endeudamientoTotal}
              maxValue={1.0}
              icon={PieChart}
              valoresFormula={{
                formulaTexto: 'Pasivo Total / Activo Total',
                valoresTexto: `${formatearMonto(ratios.pasivoTotal, 'USD')} / ${formatearMonto(ratios.activoTotal, 'USD')}`
              }}
              rangos={[
                { min: 0, max: 0.5, label: 'Sólido', color: '#10b981', emoji: '🟢' },
                { min: 0.5, max: 0.7, label: 'Controlable', color: '#f59e0b', emoji: '🟡' },
                { min: 0.7, max: 1.0, label: 'Riesgo', color: '#ef4444', emoji: '🔴' }
              ]}
            />

            <GaugeCard
              titulo="Apalancamiento Financiero"
              valor={ratios.apalancamientoFinanciero}
              indicador={ratios.indicadoresEndeudamiento.apalancamientoFinanciero}
              maxValue={5.0}
              icon={BarChart3}
              valoresFormula={{
                formulaTexto: 'Activo Total / Patrimonio Neto',
                valoresTexto: `${formatearMonto(ratios.activoTotal, 'USD')} / ${formatearMonto(ratios.patrimonioNeto, 'USD')}`
              }}
              rangos={[
                { min: 0, max: 2.0, label: 'Sano', color: '#10b981', emoji: '🟢' },
                { min: 2.0, max: 3.0, label: 'Moderado', color: '#f59e0b', emoji: '🟡' },
                { min: 3.0, max: 5.0, label: 'Excesivo', color: '#ef4444', emoji: '🔴' }
              ]}
            />
          </div>
        </div>

        {/* Ratio de Sobrecompra */}
        {ratioSobrecompra && (
          <div className="p-6 pt-0">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center uppercase bg-slate-50 py-3 rounded">Ratio de Sobrecompra</h3>

            {/* Layout: Gauge a la izquierda, Tabla a la derecha */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gauge General */}
              <div className="lg:col-span-1">
                <GaugeCardSobrecompra
                  titulo="Ratio General"
                  cmv={ratioSobrecompra.cmv}
                  compras={ratioSobrecompra.compras}
                  ratio={ratioSobrecompra.ratio}
                  indicador={ratioSobrecompra.indicador}
                  icon={ShoppingCart}
                />
              </div>

              {/* Tabla de Desglose por Categoría */}
              {ratioSobrecompra.categorias && ratioSobrecompra.categorias.length > 0 && (
                <div className="lg:col-span-2 flex items-stretch">
                  <div className="bg-white border border-slate-200 rounded w-full flex flex-col">
                    <table className="w-full table-fixed">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-700 w-1/5">Categoría</th>
                          <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-700 w-1/5">Compras</th>
                          <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-700 w-1/5">CMV</th>
                          <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-700 w-1/5">Ratio</th>
                          <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-700 w-1/5">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {ratioSobrecompra.categorias.map((cat) => (
                          <tr key={cat.nombre} className="bg-white">
                            <td className="px-3 py-4 text-sm font-medium text-slate-800 text-center">
                              {cat.nombre}
                            </td>
                            <td className="px-3 py-4 text-sm text-slate-800 text-center">
                              {formatearMonto(cat.compras, 'USD')}
                            </td>
                            <td className="px-3 py-4 text-sm text-slate-800 text-center">
                              {formatearMonto(cat.cmv, 'USD')}
                            </td>
                            <td className="px-3 py-4 text-sm text-center font-bold text-slate-900">
                              {cat.ratio.toFixed(2)}
                            </td>
                            <td className="px-3 py-4 text-sm text-center">
                              <span className="inline-flex items-center">
                                <span className="mr-1">{cat.indicador.emoji}</span>
                                <span style={{color: cat.indicador.color}} className="font-medium">
                                  {cat.indicador.texto}
                                </span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                        <tr>
                          <td className="px-3 py-3 text-sm font-bold text-center text-slate-800">TOTAL GENERAL</td>
                          <td className="px-3 py-3 text-sm font-bold text-center text-slate-800">
                            {formatearMonto(ratioSobrecompra.compras, 'USD')}
                          </td>
                          <td className="px-3 py-3 text-sm font-bold text-center text-slate-800">
                            {formatearMonto(ratioSobrecompra.cmv, 'USD')}
                          </td>
                          <td className="px-3 py-3 text-sm text-center font-bold text-slate-800">
                            {ratioSobrecompra.ratio.toFixed(2)}
                          </td>
                          <td className="px-3 py-3 text-sm text-center">
                            <span className="inline-flex items-center">
                              <span className="mr-1">{ratioSobrecompra.indicador.emoji}</span>
                              <span style={{color: ratioSobrecompra.indicador.color}} className="font-bold">
                                {ratioSobrecompra.indicador.texto}
                              </span>
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===============================
            🟢 Ratios de Rentabilidad
            =============================== */}
        <RatiosRentabilidadSection
          ratiosRentabilidad={ratiosRentabilidad}
          loadingPeriodo={loadingPeriodo}
        />

        {/* ===============================
            🟢 Ratios de Eficiencia Operacional
            =============================== */}
        <RatiosEficienciaSection
          ratiosEficiencia={ratiosEficiencia}
          loadingPeriodo={loadingPeriodo}
        />

        {/* ===============================
            🟢 TABLA DE DEBUGGING - Verificación de Filtros
            =============================== */}
        {console.log('🔍 datosDebug en componente:', datosDebug)}
        {datosDebug && (
          <div className="p-6 pt-0">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center uppercase bg-red-50 py-3 rounded border border-red-200">
              🔍 Tabla de Debugging - Verificación de Filtros
            </h3>

            {/* Selector de categoría */}
            <div className="mb-4 p-4 bg-gray-50 rounded border border-slate-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Categoría para Analizar:
              </label>
              <select
                value={categoriaDebug}
                onChange={(e) => setCategoriaDebug(e.target.value)}
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
              >
                <option value="activo_corriente">Activo Corriente</option>
                <option value="pasivo_corriente">Pasivo Corriente</option>
                <option value="inventario">Inventario</option>
                <option value="ventas">Ventas (4.1.xx)</option>
                <option value="cmv">CMV (5.0.xx)</option>
                <option value="gastos_operativos">Gastos Operativos (5.1.xx)</option>
                <option value="compras">Compras - Mercaderías (1.1.04.01.xx)</option>
              </select>
            </div>

            {/* Tabla de desglose */}
            {datosDebug[categoriaDebug] && (
              <div className="bg-white border border-slate-200 rounded overflow-hidden">
                {/* Resumen */}
                <div className="p-4 bg-emerald-50 border-b border-emerald-200">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <span className="block text-xs text-slate-600 font-medium mb-1">Total Débitos</span>
                      <span className="text-lg font-bold text-slate-900">
                        {formatearMonto(datosDebug[categoriaDebug].totalDebitos, 'USD')}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-600 font-medium mb-1">Total Créditos</span>
                      <span className="text-lg font-bold text-slate-900">
                        {formatearMonto(datosDebug[categoriaDebug].totalCreditos, 'USD')}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-600 font-medium mb-1">Saldo (Debe - Haber)</span>
                      <span className="text-lg font-bold text-emerald-700">
                        {formatearMonto(datosDebug[categoriaDebug].saldo, 'USD')}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-600 font-medium mb-1">Cuentas Incluidas</span>
                      <span className="text-lg font-bold text-slate-900">
                        {datosDebug[categoriaDebug].cuentas.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tabla de cuentas */}
                <table className="w-full">
                  <thead className="bg-slate-800 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Nombre Cuenta</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Tipo</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Débitos</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Créditos</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {datosDebug[categoriaDebug].cuentas.map((cuenta, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{cuenta.codigo}</td>
                        <td className="px-4 py-3 text-sm text-slate-800">{cuenta.nombre}</td>
                        <td className="px-4 py-3 text-sm text-center text-slate-600">{cuenta.tipo}</td>
                        <td className="px-4 py-3 text-sm text-right text-slate-900">
                          {formatearMonto(cuenta.debe, 'USD')}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-slate-900">
                          {formatearMonto(cuenta.haber, 'USD')}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-emerald-700">
                          {formatearMonto(cuenta.saldo, 'USD')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-800 text-white">
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-sm font-bold">TOTALES</td>
                      <td className="px-4 py-3 text-sm text-right font-bold">
                        {formatearMonto(datosDebug[categoriaDebug].totalDebitos, 'USD')}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold">
                        {formatearMonto(datosDebug[categoriaDebug].totalCreditos, 'USD')}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-emerald-400">
                        {formatearMonto(datosDebug[categoriaDebug].saldo, 'USD')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ===============================
// 🟢 Sección de Ratios de Rentabilidad
// ===============================
const RatiosRentabilidadSection = ({ ratiosRentabilidad, loadingPeriodo }) => {
  if (loadingPeriodo) {
    return (
      <div className="p-6 pt-0">
        <div className="bg-white border border-slate-200 rounded p-12 flex items-center justify-center">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <span className="text-slate-600 text-lg">Calculando ratios...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!ratiosRentabilidad) return null;

  return (
    <div className="p-6 pt-0">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center uppercase bg-slate-50 py-3 rounded">Ratios de Rentabilidad</h3>

      <h4 className="text-base font-semibold text-slate-700 mb-3 mt-6 text-center uppercase bg-slate-50 py-2 rounded">Márgenes de Rentabilidad</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Margen Bruto */}
                <GaugeCard
                  titulo="Margen Bruto"
                  valor={ratiosRentabilidad.margenBruto.valor}
                  formula="(Ventas - CMV) / Ventas × 100"
                  indicador={ratiosRentabilidad.margenBruto.indicador}
                  maxValue={40}
                  icon={PercentIcon}
                  valoresFormula={{
                    formulaTexto: '(Ventas - CMV) / Ventas',
                    valoresTexto: `(${formatearMonto(ratiosRentabilidad.ventas, 'USD')} - ${formatearMonto(ratiosRentabilidad.cmv, 'USD')}) / ${formatearMonto(ratiosRentabilidad.ventas, 'USD')}`
                  }}
                  rangos={[
                    { min: 0, max: 10, label: 'Bajo', color: '#ef4444', emoji: '🔴' },
                    { min: 10, max: 20, label: 'Normal', color: '#f59e0b', emoji: '🟡' },
                    { min: 20, max: 40, label: 'Fuerte', color: '#10b981', emoji: '🟢' }
                  ]}
                />

                {/* Margen Operativo */}
                <GaugeCard
                  titulo="Margen Operativo (EBIT)"
                  valor={ratiosRentabilidad.margenOperativo.valor}
                  formula="EBIT / Ventas × 100"
                  indicador={ratiosRentabilidad.margenOperativo.indicador}
                  maxValue={20}
                  icon={Activity}
                  valoresFormula={{
                    formulaTexto: '(Ventas - CMV - Gastos) / Ventas',
                    valoresTexto: `(${formatearMonto(ratiosRentabilidad.ventas, 'USD')} - ${formatearMonto(ratiosRentabilidad.cmv, 'USD')} - ${formatearMonto(ratiosRentabilidad.gastosOperativos, 'USD')}) / ${formatearMonto(ratiosRentabilidad.ventas, 'USD')}`
                  }}
                  rangos={[
                    { min: 0, max: 5, label: 'Bajo', color: '#ef4444', emoji: '🔴' },
                    { min: 5, max: 10, label: 'Medio', color: '#f59e0b', emoji: '🟡' },
                    { min: 10, max: 20, label: 'Alto', color: '#10b981', emoji: '🟢' }
                  ]}
                />

                {/* Margen Neto */}
                <GaugeCard
                  titulo="Margen Neto"
                  valor={ratiosRentabilidad.margenNeto.valor}
                  formula="Resultado Neto / Ventas × 100"
                  indicador={ratiosRentabilidad.margenNeto.indicador}
                  maxValue={15}
                  icon={TrendingDown}
                  valoresFormula={{
                    formulaTexto: 'Resultado Neto / Ventas',
                    valoresTexto: `${formatearMonto(ratiosRentabilidad.resultadoNeto, 'USD')} / ${formatearMonto(ratiosRentabilidad.ventas, 'USD')}`
                  }}
                  rangos={[
                    { min: 0, max: 3, label: 'Bajo', color: '#ef4444', emoji: '🔴' },
                    { min: 3, max: 8, label: 'Bueno', color: '#f59e0b', emoji: '🟡' },
                    { min: 8, max: 15, label: 'Excelente', color: '#10b981', emoji: '🟢' }
                  ]}
                />
              </div>

              <h4 className="text-base font-semibold text-slate-700 mb-3 mt-6 text-center uppercase bg-slate-50 py-2 rounded">Retorno sobre Activos y Patrimonio</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ROA */}
                <GaugeCardRentabilidad
                  titulo="ROA (Return on Assets)"
                  valorPeriodo={ratiosRentabilidad.roa.valorPeriodo}
                  valorAnualizado={ratiosRentabilidad.roa.valorAnualizado}
                  mesesPeriodo={ratiosRentabilidad.roa.mesesPeriodo}
                  indicador={ratiosRentabilidad.roa.indicador}
                  maxValue={15}
                  icon={BarChart3}
                  formula="Resultado Neto / Activo Total × 100"
                  valoresFormula={`${formatearMonto(ratiosRentabilidad.resultadoNeto, 'USD')} / ${formatearMonto(ratiosRentabilidad.activoTotal, 'USD')}`}
                  rangos={[
                    { min: 0, max: 3, label: 'Ineficiente', color: '#ef4444', emoji: '🔴' },
                    { min: 3, max: 6, label: 'Normal', color: '#f59e0b', emoji: '🟡' },
                    { min: 6, max: 15, label: 'Sano', color: '#10b981', emoji: '🟢' }
                  ]}
                />

                {/* ROE */}
                <GaugeCardRentabilidad
                  titulo="ROE (Return on Equity)"
                  valorPeriodo={ratiosRentabilidad.roe.valorPeriodo}
                  valorAnualizado={ratiosRentabilidad.roe.valorAnualizado}
                  mesesPeriodo={ratiosRentabilidad.roe.mesesPeriodo}
                  indicador={ratiosRentabilidad.roe.indicador}
                  maxValue={40}
                  icon={TrendingUp}
                  formula="Resultado Neto / Patrimonio Neto × 100"
                  valoresFormula={`${formatearMonto(ratiosRentabilidad.resultadoNeto, 'USD')} / ${formatearMonto(ratiosRentabilidad.patrimonioNeto, 'USD')}`}
                  rangos={[
                    { min: 0, max: 10, label: 'Bajo', color: '#ef4444', emoji: '🔴' },
                    { min: 10, max: 20, label: 'Adecuado', color: '#f59e0b', emoji: '🟡' },
                    { min: 20, max: 40, label: 'Excelente', color: '#10b981', emoji: '🟢' }
                  ]}
                />
              </div>
    </div>
  );
};

// ===============================
// 🟢 Sección de Ratios de Eficiencia Operacional
// ===============================
const RatiosEficienciaSection = ({ ratiosEficiencia, loadingPeriodo }) => {
  if (loadingPeriodo) {
    return (
      <div className="p-6 pt-0">
        <div className="bg-white border border-slate-200 rounded p-12 flex items-center justify-center">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <span className="text-slate-600 text-lg">Calculando ratios...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!ratiosEficiencia) return null;

  return (
    <div className="p-6 pt-0">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center uppercase bg-slate-50 py-3 rounded">Ratios de Eficiencia Operacional</h3>

      <h4 className="text-base font-semibold text-slate-700 mb-3 mt-6 text-center uppercase bg-slate-50 py-2 rounded">Gestión de Inventario</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <GaugeCard
          titulo="Rotación de Inventario"
          valor={ratiosEficiencia.rotacionInventario.valor}
          indicador={ratiosEficiencia.rotacionInventario.indicador}
          maxValue={12}
          icon={Activity}
          rangos={[
            { min: 0, max: 4, label: 'Exceso Stock', color: '#ef4444', emoji: '🔴' },
            { min: 4, max: 8, label: 'Normal', color: '#f59e0b', emoji: '🟡' },
            { min: 8, max: 12, label: 'Excelente', color: '#10b981', emoji: '🟢' }
          ]}
          valoresFormula={{
            formulaTexto: 'CMV / Inventario Promedio',
            valoresTexto: `${formatearMonto(ratiosEficiencia.cmv, 'USD')} / ${formatearMonto(ratiosEficiencia.inventarioPromedio, 'USD')}`
          }}
        />
        <GaugeCard
          titulo="Días Promedio de Inventario"
          valor={ratiosEficiencia.diasInventario.valor}
          indicador={ratiosEficiencia.diasInventario.indicador}
          maxValue={100}
          icon={Activity}
          rangos={[
            { min: 0, max: 45, label: 'Eficiente', color: '#10b981', emoji: '🟢' },
            { min: 45, max: 75, label: 'Moderado', color: '#f59e0b', emoji: '🟡' },
            { min: 75, max: 100, label: 'Lento', color: '#ef4444', emoji: '🔴' }
          ]}
          valoresFormula={{
            formulaTexto: '365 / Rotación de Inventario',
            valoresTexto: `365 / ${ratiosEficiencia.rotacionInventario.valor.toFixed(2)} = ${ratiosEficiencia.diasInventario.valor.toFixed(1)} días`
          }}
          decimales={1}
          tamanoValor="text-3xl"
        />
      </div>

      <h4 className="text-base font-semibold text-slate-700 mb-3 mt-6 text-center uppercase bg-slate-50 py-2 rounded">Gestión de Cobros y Pagos</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <GaugeCard
          titulo="Rotación CxC"
          valor={ratiosEficiencia.rotacionCxC.valor}
          indicador={ratiosEficiencia.rotacionCxC.indicador}
          maxValue={12}
          icon={TrendingUp}
          rangos={[
            { min: 0, max: 4, label: 'Lento', color: '#ef4444', emoji: '🔴' },
            { min: 4, max: 8, label: 'Regular', color: '#f59e0b', emoji: '🟡' },
            { min: 8, max: 12, label: 'Rápido', color: '#10b981', emoji: '🟢' }
          ]}
          valoresFormula={{
            formulaTexto: 'Ventas / CxC Promedio',
            valoresTexto: `${formatearMonto(ratiosEficiencia.ventas, 'USD')} / ${formatearMonto(ratiosEficiencia.cxcPromedio, 'USD')}`
          }}
          decimales={1}
          tamanoValor="text-2xl"
        />
        <GaugeCard
          titulo="Días de Cobro"
          valor={ratiosEficiencia.diasCobro.valor}
          indicador={ratiosEficiencia.diasCobro.indicador}
          maxValue={90}
          icon={TrendingDown}
          rangos={[
            { min: 0, max: 45, label: 'Eficiente', color: '#10b981', emoji: '🟢' },
            { min: 45, max: 60, label: 'Normal', color: '#f59e0b', emoji: '🟡' },
            { min: 60, max: 90, label: 'Riesgo', color: '#ef4444', emoji: '🔴' }
          ]}
          valoresFormula={{
            formulaTexto: '365 / Rotación CxC',
            valoresTexto: `365 / ${ratiosEficiencia.rotacionCxC.valor.toFixed(1)} = ${ratiosEficiencia.diasCobro.valor.toFixed(0)} días`
          }}
          decimales={1}
          tamanoValor="text-2xl"
        />
        <GaugeCard
          titulo="Rotación CxP"
          valor={ratiosEficiencia.rotacionCxP.valor}
          indicador={ratiosEficiencia.rotacionCxP.indicador}
          maxValue={15}
          icon={DollarSign}
          rangos={[
            { min: 0, max: 6, label: 'Aprovecha Crédito', color: '#10b981', emoji: '🟢' },
            { min: 6, max: 12, label: 'Equilibrado', color: '#f59e0b', emoji: '🟡' },
            { min: 12, max: 15, label: 'Muy Rápido', color: '#ef4444', emoji: '🔴' }
          ]}
          valoresFormula={{
            formulaTexto: 'Compras / CxP Promedio',
            valoresTexto: `${formatearMonto(ratiosEficiencia.compras, 'USD')} / ${formatearMonto(ratiosEficiencia.cxpPromedio, 'USD')}`
          }}
          decimales={1}
          tamanoValor="text-2xl"
        />
        <GaugeCard
          titulo="Días de Pago"
          valor={ratiosEficiencia.diasPago.valor}
          indicador={ratiosEficiencia.diasPago.indicador}
          maxValue={60}
          icon={Wallet}
          rangos={[
            { min: 0, max: 15, label: 'Estrés', color: '#ef4444', emoji: '🔴' },
            { min: 15, max: 30, label: 'Normal', color: '#f59e0b', emoji: '🟡' },
            { min: 30, max: 60, label: 'Óptimo', color: '#10b981', emoji: '🟢' }
          ]}
          valoresFormula={{
            formulaTexto: '365 / Rotación CxP',
            valoresTexto: `365 / ${ratiosEficiencia.rotacionCxP.valor.toFixed(1)} = ${ratiosEficiencia.diasPago.valor.toFixed(0)} días`
          }}
          decimales={1}
          tamanoValor="text-2xl"
        />
      </div>

      <h4 className="text-base font-semibold text-slate-700 mb-3 mt-6 text-center uppercase bg-slate-50 py-2 rounded">Ciclo de Conversión de Efectivo y Rotación de Capital</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ciclo de Conversión de Efectivo */}
        <div className="bg-white border border-slate-200 rounded p-6">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Activity className="w-6 h-6 text-slate-700" />
            <h3 className="text-lg font-semibold text-slate-800 uppercase text-center">
              Ciclo de Caja
            </h3>
          </div>

          <div className="text-center mb-6">
            <div className="text-xs text-slate-600 font-medium mb-1">
              Días Inventario + Días Cobro - Días Pago
            </div>
            <div className="text-xs text-slate-700">
              {ratiosEficiencia.diasInventario.valor.toFixed(0)} + {ratiosEficiencia.diasCobro.valor.toFixed(0)} - {ratiosEficiencia.diasPago.valor.toFixed(0)} = <span className="font-bold">{ratiosEficiencia.cicloCaja.valor.toFixed(0)} días</span>
            </div>
          </div>

          <div className="flex items-center justify-center mb-4">
            <div
              className="px-6 py-3 rounded-lg inline-flex items-baseline space-x-2"
              style={{ backgroundColor: `${ratiosEficiencia.cicloCaja.indicador.color}20` }}
            >
              <span className="text-3xl">{ratiosEficiencia.cicloCaja.indicador.emoji}</span>
              <span className="text-4xl font-bold" style={{ color: ratiosEficiencia.cicloCaja.indicador.color }}>
                {ratiosEficiencia.cicloCaja.valor.toFixed(0)}
              </span>
              <span className="text-2xl text-slate-600">días</span>
              <span className="text-2xl font-semibold" style={{ color: ratiosEficiencia.cicloCaja.indicador.color }}>
                - {ratiosEficiencia.cicloCaja.indicador.texto}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span>🟢</span>
              <span className="font-medium">Eficiente (0-45)</span>
            </span>
            <span className="flex items-center gap-1">
              <span>🟡</span>
              <span className="font-medium">Controlable (45-60)</span>
            </span>
            <span className="flex items-center gap-1">
              <span>🔴</span>
              <span className="font-medium">Tenso (+60)</span>
            </span>
          </div>
        </div>

        {/* Rotación de Capital */}
        <GaugeCard
          titulo="Rotación de Capital"
          valor={ratiosEficiencia.rotacionCapital.valor}
          formula="Ventas / Activo Total Promedio"
          indicador={ratiosEficiencia.rotacionCapital.indicador}
          maxValue={4}
          icon={TrendingUp}
          rangos={[
            { min: 0, max: 1, emoji: '🔴', label: 'Ineficiente' },
            { min: 1, max: 2, emoji: '🟡', label: 'Normal' },
            { min: 2, max: 4, emoji: '🟢', label: 'Eficiente' }
          ]}
          valoresFormula={{
            formulaTexto: 'Ventas / Activo Total Promedio',
            valoresTexto: `${Math.round(ratiosEficiencia.ventas).toLocaleString('es-AR')} / ${Math.round(ratiosEficiencia.activoTotalPromedio).toLocaleString('es-AR')} = ${ratiosEficiencia.rotacionCapital.valor.toFixed(2)} veces`
          }}
          decimales={2}
          tamanoValor="text-3xl"
        />
      </div>
    </div>
  );
};

export default RatiosSection;
