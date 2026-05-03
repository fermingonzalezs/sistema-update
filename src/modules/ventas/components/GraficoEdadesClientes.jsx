import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { parseFechaLocal } from '../../../shared/utils/formatters';

const RANGOS = [
  { key: 'menor_18', label: '< 18',  min: 0,  max: 17   },
  { key: 'r18_24',   label: '18-24', min: 18, max: 24   },
  { key: 'r25_34',   label: '25-34', min: 25, max: 34   },
  { key: 'r35_44',   label: '35-44', min: 35, max: 44   },
  { key: 'r45_54',   label: '45-54', min: 45, max: 54   },
  { key: 'mayor_55', label: '55+',   min: 55, max: null },
];

const calcularEdad = (cumpleanos) => {
  if (!cumpleanos) return null;
  const nac = parseFechaLocal(cumpleanos);
  if (!nac) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const diffMes = hoy.getMonth() - nac.getMonth();
  if (diffMes < 0 || (diffMes === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
};

const GraficoEdadesClientes = ({ clientes }) => {
  const datos = useMemo(() => {
    const conteos = Object.fromEntries(RANGOS.map(r => [r.key, 0]));
    clientes.forEach(c => {
      const edad = calcularEdad(c.cumpleanos);
      if (edad === null) return;
      const rango = RANGOS.find(r => edad >= r.min && (r.max === null || edad <= r.max));
      if (rango) conteos[rango.key]++;
    });
    return RANGOS.map(r => ({ label: r.label, cantidad: conteos[r.key] }));
  }, [clientes]);

  if (clientes.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded h-full flex flex-col">
      <h3 className="text-sm font-semibold text-slate-800 py-2 text-center uppercase border-b border-slate-200">
        Distribución por Edad
      </h3>
      <div className="p-4 flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              formatter={(value) => [value, 'Clientes']}
              labelStyle={{ color: '#1e293b', fontWeight: 600 }}
              contentStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="cantidad" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GraficoEdadesClientes;
