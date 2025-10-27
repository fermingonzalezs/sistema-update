import React from 'react';
import { TrendingUp, RefreshCw, DollarSign, DropletIcon, Wallet, ShoppingCart } from 'lucide-react';
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
const GaugeCard = ({ titulo, valor, formula, indicador, maxValue, icon: Icon, rangos, activoCorriente, pasivoCorriente, inventario }) => {
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
      </div>

      {/* Gauge visual */}
      <div className="flex flex-col items-center">
        <div style={{ width: '100%', height: 200, position: 'relative' }}>
          {/* Indicador de estado - esquina superior izquierda */}
          <div
            className="absolute top-0 left-0 flex items-center space-x-1 px-2 py-1 rounded"
            style={{ backgroundColor: `${indicador.color}20`, zIndex: 10 }}
          >
            <span className="text-sm">{indicador.emoji}</span>
            <span className="text-xs font-semibold" style={{ color: indicador.color }}>
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
            <div className="text-4xl font-bold text-slate-900">
              {typeof valor === 'number' && !isNaN(valor) ? valor.toFixed(2) : '0.00'}
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
            className="absolute top-0 left-0 flex items-center space-x-1 px-2 py-1 rounded"
            style={{ backgroundColor: `${indicador.color}20`, zIndex: 10 }}
          >
            <span className="text-sm">{indicador.emoji}</span>
            <span className="text-xs font-semibold" style={{ color: indicador.color }}>
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
              {formatearMonto(valor, 'USD')}
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
            className="absolute top-0 left-0 flex items-center space-x-1 px-2 py-1 rounded"
            style={{ backgroundColor: `${indicador.color}20`, zIndex: 10 }}
          >
            <span className="text-sm">{indicador.emoji}</span>
            <span className="text-xs font-semibold" style={{ color: indicador.color }}>
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
// 🟢 Componente principal
// ===============================
const RatiosSection = () => {
  const { ratios, ratioSobrecompra, loading, error, refetch } = useRatiosFinancieros();

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

        {/* Gráficos de Liquidez */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Ratios de Liquidez</h3>
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

        {/* Ratio de Sobrecompra */}
        {ratioSobrecompra && (
          <div className="p-6 pt-0">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Ratio de Sobrecompra (Mes)</h3>

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
      </div>
    </div>
  );
};

export default RatiosSection;
