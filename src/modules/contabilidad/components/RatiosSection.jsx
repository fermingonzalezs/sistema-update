import React from 'react';
import { TrendingUp, RefreshCw, DollarSign, DropletIcon, Wallet } from 'lucide-react';
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
// 🟢 Componente Gauge con aguja fija y alineada
// ===============================
const GaugeCard = ({ titulo, valor, formula, indicador, maxValue, icon: Icon, interpretacion }) => {
  // Zonas de color (según el rango)
  const zonaRoja = Math.min(1.0 / maxValue * 100, 100);
  const zonaAmarilla = Math.min((1.5 - 1.0) / maxValue * 100, 100);
  const zonaVerde = 100 - zonaRoja - zonaAmarilla;

  // Calcular ángulo de la aguja (180° → 0°)
  const valorLimitado = Math.max(0, Math.min(valor, maxValue));
  const anguloAguja = 180 - (valorLimitado / maxValue * 180);

  // Datos para las zonas de color
  const zonasData = [
    { name: 'Riesgo', value: zonaRoja, fill: '#ef4444' },
    { name: 'Aceptable', value: zonaAmarilla, fill: '#f59e0b' },
    { name: 'Saludable', value: zonaVerde, fill: '#10b981' }
  ];

  // Definir centro común (coincide entre el gráfico y la aguja)
  const centroX = '50%';
  const centroY = '65%';

  return (
    <div className="bg-white border border-slate-200 rounded p-2">
      {/* Título */}
      <div className="border-b border-slate-200 py-2 mb-1">
        <div className="flex items-center justify-center space-x-2">
          {Icon && <Icon className="w-4 h-4 text-slate-700" />}
          <h3 className="text-xs font-semibold text-slate-800 uppercase text-center">
            {titulo}
          </h3>
        </div>
      </div>

      {/* Gauge visual */}
      <div className="flex flex-col items-center relative">
        <div style={{ width: '100%', height: 140, position: 'relative' }}>
          {/* Fondo del gauge */}
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx={centroX}
              cy={centroY}
              innerRadius="60%"
              outerRadius="90%"
              barSize={15}
              data={zonasData}
              startAngle={180}
              endAngle={0}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar dataKey="value" cornerRadius={0} />
            </RadialBarChart>
          </ResponsiveContainer>

          {/* Aguja SVG superpuesta */}
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
            <circle cx={centroX} cy={centroY} r="6" fill="#1e293b" />
            <line
              x1={centroX}
              y1={centroY}
              x2="50%"
              y2="20%"
              stroke="#1e293b"
              strokeWidth="3"
              strokeLinecap="round"
              transform={`rotate(${anguloAguja}, 50%, 65%)`}
              style={{
                transformOrigin: '50% 65%',
                transition: 'transform 0.5s ease-out'
              }}
            />
          </svg>
        </div>

        {/* Valor */}
        <div className="text-3xl font-bold text-slate-900 text-center -mt-4 mb-1">
          {typeof valor === 'number' && !isNaN(valor) ? valor.toFixed(2) : '0.00'}
        </div>

        {/* Fórmula */}
        <div className="text-xs text-slate-500 text-center mb-1">{formula}</div>

        {/* Escala */}
        <div className="flex justify-between w-full text-xs text-slate-500 px-2 mb-1">
          <span>0</span>
          <span>1.0</span>
          <span>1.5</span>
          <span>{maxValue.toFixed(1)}</span>
        </div>

        {/* Indicador */}
        <div
          className="flex items-center justify-center space-x-2 px-3 py-1.5 rounded mb-2"
          style={{ backgroundColor: `${indicador.color}20` }}
        >
          <span className="text-base">{indicador.emoji}</span>
          <span className="text-sm font-semibold" style={{ color: indicador.color }}>
            {indicador.texto}
          </span>
        </div>

        {/* Interpretación */}
        {interpretacion && (
          <div className="w-full px-2 py-2 bg-slate-50 border-t border-slate-200">
            <div className="space-y-1 text-xs text-slate-600">
              {interpretacion.map((item, index) => (
                <div key={index}>{item}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ===============================
// 🟢 Barra horizontal (Capital de trabajo)
// ===============================
const GaugeCardCapitalTrabajo = ({ titulo, valor, formula, indicador, icon: Icon }) => {
  const maxValue = Math.max(20000, Math.abs(valor) * 1.5);
  const minValue = -10000;

  const barData = [
    {
      name: 'Capital',
      value: valor,
      fill: indicador.color
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded p-2">
      <div className="border-b border-slate-200 py-2 mb-1">
        <div className="flex items-center justify-center space-x-2">
          {Icon && <Icon className="w-4 h-4 text-slate-700" />}
          <h3 className="text-xs font-semibold text-slate-800 uppercase text-center">
            {titulo}
          </h3>
        </div>
      </div>

      <div className="text-xs text-slate-500 text-center mt-2">{formula}</div>

      <div className="text-3xl font-bold text-slate-900 text-center my-3">
        {formatearMonto(valor, 'USD')}
      </div>

      <div className="px-2">
        <ResponsiveContainer width="100%" height={60}>
          <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <XAxis type="number" domain={[minValue, maxValue]} hide />
            <YAxis type="category" dataKey="name" hide />
            <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={2} strokeDasharray="3 3" />
            <ReferenceLine x={5000} stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" />
            <Bar dataKey="value" radius={[4, 4, 4, 4]}>
              {barData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={indicador.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>🔴 Negativo</span>
          <span>🟡 0-5K</span>
          <span>🟢 &gt;5K</span>
        </div>
      </div>

      <div
        className="flex items-center justify-center space-x-2 px-3 py-1.5 rounded mt-2"
        style={{ backgroundColor: `${indicador.color}20` }}
      >
        <span className="text-base">{indicador.emoji}</span>
        <span className="text-sm font-semibold" style={{ color: indicador.color }}>
          {indicador.texto}
        </span>
      </div>
    </div>
  );
};

// ===============================
// 🟢 Componente principal
// ===============================
const RatiosSection = () => {
  const { ratios, loading, error, refetch } = useRatiosFinancieros();

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
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-semibold">Ratios Financieros</h2>
                <p className="text-slate-300 mt-1">Estado actual de liquidez de la empresa</p>
              </div>
            </div>
            <button
              onClick={refetch}
              className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm flex items-center gap-2 transition-colors"
            >
              <RefreshCw size={16} />
              Refrescar
            </button>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-600">Activo Corriente:</span>
              <span className="ml-2 font-semibold text-slate-900">
                {formatearMonto(ratios.activoCorriente, 'USD')}
              </span>
            </div>
            <div>
              <span className="text-slate-600">Pasivo Corriente:</span>
              <span className="ml-2 font-semibold text-slate-900">
                {formatearMonto(ratios.pasivoCorriente, 'USD')}
              </span>
            </div>
            <div>
              <span className="text-slate-600">Inventario:</span>
              <span className="ml-2 font-semibold text-slate-900">
                {formatearMonto(ratios.inventario, 'USD')}
              </span>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GaugeCard
              titulo="Liquidez Corriente"
              valor={ratios.liquidezCorriente}
              formula="Activo Corriente / Pasivo Corriente"
              indicador={ratios.indicadores.liquidezCorriente}
              maxValue={3.0}
              icon={DropletIcon}
            />

            <GaugeCard
              titulo="Prueba Ácida"
              valor={ratios.pruebaAcida}
              formula="(Activo Corriente - Inventario) / Pasivo Corriente"
              indicador={ratios.indicadores.pruebaAcida}
              maxValue={2.0}
              icon={DollarSign}
            />

            <GaugeCardCapitalTrabajo
              titulo="Capital de Trabajo Neto"
              valor={ratios.capitalTrabajoNeto}
              formula="Activo Corriente - Pasivo Corriente"
              indicador={ratios.indicadores.capitalTrabajoNeto}
              icon={Wallet}
            />
          </div>

          {/* Leyenda */}
          <div className="mt-6 p-4 bg-white border border-slate-200 rounded">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">Interpretación de Ratios</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
              <div>
                <div className="font-medium text-slate-800 mb-1">Liquidez Corriente</div>
                <div className="space-y-1">
                  <div>🔴 &lt;1.0: Riesgo - Dificultad para cubrir deudas</div>
                  <div>🟡 1.0-1.5: Aceptable - Capacidad ajustada</div>
                  <div>🟢 &gt;1.5: Saludable - Buena capacidad de pago</div>
                </div>
              </div>
              <div>
                <div className="font-medium text-slate-800 mb-1">Prueba Ácida</div>
                <div className="space-y-1">
                  <div>🔴 &lt;0.8: Débil - Depende del inventario</div>
                  <div>🟡 0.8-1.0: Justo - Capacidad limitada</div>
                  <div>🟢 &gt;1.0: Sólido - Pago sin vender stock</div>
                </div>
              </div>
              <div>
                <div className="font-medium text-slate-800 mb-1">Capital de Trabajo</div>
                <div className="space-y-1">
                  <div>🔴 Negativo: Riesgo - Pasivos &gt; Activos</div>
                  <div>🟡 $0-5000: Frágil - Margen reducido</div>
                  <div>🟢 &gt;$5000: Positivo - Buen respaldo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatiosSection;
