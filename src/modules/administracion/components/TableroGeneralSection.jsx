import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ChevronRight, ChevronDown } from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useEstadoResultados } from '../../contabilidad/hooks/useEstadoResultados';

const TableroGeneralSection = () => {
  const [añoSeleccionado, setAñoSeleccionado] = useState(new Date().getFullYear());
  const [ingresosExpanded, setIngresosExpanded] = useState(false);
  const [costosExpanded, setCostosExpanded] = useState(false);
  const [gastosExpanded, setGastosExpanded] = useState(false);

  // Hook para obtener datos reales
  const { comparativoMensual, loading, error, fetchComparativoMensual } = useEstadoResultados();

  // Cargar datos al montar y cuando cambia el año
  useEffect(() => {
    fetchComparativoMensual(añoSeleccionado);
  }, [añoSeleccionado]);

  // Mapear datos del comparativo mensual a la estructura de la tabla
  const mapearDatosMensuales = () => {
    if (!comparativoMensual || comparativoMensual.length === 0) {
      return [];
    }

    const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    return comparativoMensual.map((datoMes, index) => {
      const resultado = {
        mes: nombresMeses[index] || datoMes.nombreMes?.substring(0, 3),
        totalIngresos: Math.round(datoMes.totalIngresos || 0),
        totalCostos: Math.round(datoMes.totalCostos || 0),
        gananciaBruta: Math.round((datoMes.totalIngresos || 0) - (datoMes.totalCostos || 0)),
        totalGastos: Math.round(datoMes.totalGastos || 0),
        utilidadNeta: Math.round(datoMes.utilidadNeta || 0),
        // Guardar arrays originales para acceso dinámico
        ingresos: datoMes.ingresos || [],
        costos: datoMes.costos || [],
        gastos: datoMes.gastos || []
      };

      // Mapear cuentas de ingresos individuales por código
      if (datoMes.ingresos && Array.isArray(datoMes.ingresos)) {
        datoMes.ingresos.forEach(ingreso => {
          const codigo = ingreso.cuenta?.codigo;
          // Usar código sanitizado como key (reemplazar puntos por guiones bajos)
          const key = `ingreso_${codigo?.replace(/\./g, '_')}`;
          // Redondear a entero sin decimales
          resultado[key] = Math.round(Math.abs(ingreso.monto || 0));
        });
      }

      // Mapear cuentas de costos individuales
      if (datoMes.costos && Array.isArray(datoMes.costos)) {
        datoMes.costos.forEach(costo => {
          const codigo = costo.cuenta?.codigo;
          const key = `costo_${codigo?.replace(/\./g, '_')}`;
          resultado[key] = Math.round(Math.abs(costo.monto || 0));
        });
      }

      // Mapear cuentas de gastos individuales
      if (datoMes.gastos && Array.isArray(datoMes.gastos)) {
        datoMes.gastos.forEach(gasto => {
          const codigo = gasto.cuenta?.codigo;
          const key = `gasto_${codigo?.replace(/\./g, '_')}`;
          resultado[key] = Math.round(Math.abs(gasto.monto || 0));
        });
      }

      return resultado;
    });
  };

  const datosMensuales = mapearDatosMensuales();

  // Generar filas dinámicas basadas en las cuentas reales
  const generarFilasDinamicas = () => {
    if (!comparativoMensual || comparativoMensual.length === 0) {
      return { ingresos: [], costos: [], gastos: [] };
    }

    // Tomar el primer mes que tenga datos para obtener las cuentas
    const primerMesConDatos = comparativoMensual.find(m =>
      (m.ingresos && m.ingresos.length > 0) ||
      (m.costos && m.costos.length > 0) ||
      (m.gastos && m.gastos.length > 0)
    ) || comparativoMensual[0];

    const filasIngresos = (primerMesConDatos.ingresos || []).map(ing => ({
      id: `ingreso_${ing.cuenta.codigo?.replace(/\./g, '_')}`,
      label: ing.cuenta.nombre,
      codigo: ing.cuenta.codigo,
      color: 'text-emerald-600'
    }));

    const filasCostos = (primerMesConDatos.costos || []).map(costo => ({
      id: `costo_${costo.cuenta.codigo?.replace(/\./g, '_')}`,
      label: costo.cuenta.nombre,
      codigo: costo.cuenta.codigo,
      color: 'text-red-600'
    }));

    const filasGastos = (primerMesConDatos.gastos || []).map(gasto => ({
      id: `gasto_${gasto.cuenta.codigo?.replace(/\./g, '_')}`,
      label: gasto.cuenta.nombre,
      codigo: gasto.cuenta.codigo,
      color: 'text-orange-600'
    }));

    return { ingresos: filasIngresos, costos: filasCostos, gastos: filasGastos };
  };

  const filasDinamicas = generarFilasDinamicas();

  // Debug: Ver qué datos tenemos
  console.log('🔍 DEBUG TABLERO - comparativoMensual:', comparativoMensual);
  console.log('🔍 DEBUG TABLERO - datosMensuales mapeados:', datosMensuales);
  console.log('🔍 DEBUG TABLERO - filasDinamicas:', filasDinamicas);

  // Datos mock para 12 meses - SOLO COMO FALLBACK
  const datosMock = [
    {
      mes: 'Ene',
      // INGRESOS (4.x - Resultado Positivo)
      diferenciaCotizacion: 2000,
      ingresosExtraordinarios: 3000,
      ventaNotebooksNuevas: 40000,
      ventaNotebooksUsadas: 25000,
      ventaCelularesNuevos: 35000,
      ventaCelularesUsados: 20000,
      ventaOtros: 15000,
      ventaServiciosCourier: 10000,
      totalIngresos: 150000,

      // COSTOS (5.x - CMV)
      cmvLogisticaImportacion: 5000,
      cmvNotebooksNuevas: 25000,
      cmvNotebooksUsadas: 15000,
      cmvCelularesNuevos: 22000,
      cmvCelularesUsados: 13000,
      cmvOtros: 10000,
      totalCostos: 90000,

      // GANANCIA BRUTA
      gananciaBruta: 60000,

      // GASTOS OPERATIVOS (6.x)
      diferenciaCotizacionGasto: 1000,
      gastosOficina: 2000,
      honorarios: 5000,
      servicios: 3000,
      gastosExtraordinarios: 2000,
      sueldos: 25000,
      alquileres: 6000,
      expensas: 2000,
      impuestoDebitoCredito: 1500,
      comisionesFinancieras: 2000,
      logisticaViaticos: 1500,
      marketing: 1000,
      gastosGarantias: 500,
      totalGastos: 52500,

      // UTILIDAD NETA
      utilidadNeta: 7500
    },
    {
      mes: 'Feb',
      diferenciaCotizacion: 1800, ingresosExtraordinarios: 2800, ventaNotebooksNuevas: 38000, ventaNotebooksUsadas: 24000,
      ventaCelularesNuevos: 33000, ventaCelularesUsados: 19000, ventaOtros: 14000, ventaServiciosCourier: 13400,
      totalIngresos: 145000,
      cmvLogisticaImportacion: 4800, cmvNotebooksNuevas: 24000, cmvNotebooksUsadas: 14500, cmvCelularesNuevos: 21000,
      cmvCelularesUsados: 12500, cmvOtros: 10200, totalCostos: 87000, gananciaBruta: 58000,
      diferenciaCotizacionGasto: 950, gastosOficina: 1900, honorarios: 4800, servicios: 2900, gastosExtraordinarios: 1900,
      sueldos: 25000, alquileres: 6000, expensas: 2000, impuestoDebitoCredito: 1450, comisionesFinancieras: 1900,
      logisticaViaticos: 1450, marketing: 950, gastosGarantias: 500, totalGastos: 50800, utilidadNeta: 7200
    },
    {
      mes: 'Mar',
      ventasProductos: 130000,
      ventasServicios: 35000,
      totalIngresos: 165000,
      costoComputadoras: 55000,
      costoCelulares: 31000,
      costoOtros: 12000,
      totalCostos: 98000,
      gananciaBruta: 67000,
      gastosComerciales: 8500,
      gastosAdministrativos: 14300,
      gastosPersonal: 25000,
      impuestos: 4200,
      totalGastos: 52000,
      utilidadNeta: 15000
    },
    {
      mes: 'Abr',
      ventasProductos: 123000,
      ventasServicios: 35000,
      totalIngresos: 158000,
      costoComputadoras: 52000,
      costoCelulares: 30000,
      costoOtros: 13000,
      totalCostos: 95000,
      gananciaBruta: 63000,
      gastosComerciales: 8200,
      gastosAdministrativos: 13900,
      gastosPersonal: 25000,
      impuestos: 4100,
      totalGastos: 51200,
      utilidadNeta: 11800
    },
    {
      mes: 'May',
      ventasProductos: 135000,
      ventasServicios: 37000,
      totalIngresos: 172000,
      costoComputadoras: 58000,
      costoCelulares: 32000,
      costoOtros: 13000,
      totalCostos: 103000,
      gananciaBruta: 69000,
      gastosComerciales: 8700,
      gastosAdministrativos: 14300,
      gastosPersonal: 25000,
      impuestos: 4400,
      totalGastos: 52400,
      utilidadNeta: 16600
    },
    {
      mes: 'Jun',
      ventasProductos: 131000,
      ventasServicios: 37000,
      totalIngresos: 168000,
      costoComputadoras: 56000,
      costoCelulares: 31000,
      costoOtros: 13000,
      totalCostos: 100000,
      gananciaBruta: 68000,
      gastosComerciales: 8600,
      gastosAdministrativos: 14200,
      gastosPersonal: 25000,
      impuestos: 4300,
      totalGastos: 52100,
      utilidadNeta: 15900
    },
    {
      mes: 'Jul',
      ventasProductos: 118000,
      ventasServicios: 37000,
      totalIngresos: 155000,
      costoComputadoras: 50000,
      costoCelulares: 30000,
      costoOtros: 13000,
      totalCostos: 93000,
      gananciaBruta: 62000,
      gastosComerciales: 8100,
      gastosAdministrativos: 14000,
      gastosPersonal: 25000,
      impuestos: 4000,
      totalGastos: 51100,
      utilidadNeta: 10900
    },
    {
      mes: 'Ago',
      ventasProductos: 124000,
      ventasServicios: 38000,
      totalIngresos: 162000,
      costoComputadoras: 53000,
      costoCelulares: 31000,
      costoOtros: 13000,
      totalCostos: 97000,
      gananciaBruta: 65000,
      gastosComerciales: 8400,
      gastosAdministrativos: 14100,
      gastosPersonal: 25000,
      impuestos: 4200,
      totalGastos: 51700,
      utilidadNeta: 13300
    },
    {
      mes: 'Sep',
      ventasProductos: 137000,
      ventasServicios: 38000,
      totalIngresos: 175000,
      costoComputadoras: 58000,
      costoCelulares: 33000,
      costoOtros: 14000,
      totalCostos: 105000,
      gananciaBruta: 70000,
      gastosComerciales: 8800,
      gastosAdministrativos: 14400,
      gastosPersonal: 25000,
      impuestos: 4500,
      totalGastos: 52700,
      utilidadNeta: 17300
    },
    {
      mes: 'Oct',
      ventasProductos: 142000,
      ventasServicios: 38000,
      totalIngresos: 180000,
      costoComputadoras: 60000,
      costoCelulares: 34000,
      costoOtros: 14000,
      totalCostos: 108000,
      gananciaBruta: 72000,
      gastosComerciales: 9000,
      gastosAdministrativos: 14500,
      gastosPersonal: 25000,
      impuestos: 4600,
      totalGastos: 53100,
      utilidadNeta: 18900
    },
    {
      mes: 'Nov',
      ventasProductos: 145000,
      ventasServicios: 40000,
      totalIngresos: 185000,
      costoComputadoras: 61000,
      costoCelulares: 35000,
      costoOtros: 15000,
      totalCostos: 111000,
      gananciaBruta: 74000,
      gastosComerciales: 9200,
      gastosAdministrativos: 14600,
      gastosPersonal: 25000,
      impuestos: 4700,
      totalGastos: 53500,
      utilidadNeta: 20500
    },
    {
      mes: 'Dic',
      ventasProductos: 152000,
      ventasServicios: 43000,
      totalIngresos: 195000,
      costoComputadoras: 64000,
      costoCelulares: 37000,
      costoOtros: 16000,
      totalCostos: 117000,
      gananciaBruta: 78000,
      gastosComerciales: 9500,
      gastosAdministrativos: 14800,
      gastosPersonal: 25000,
      impuestos: 5000,
      totalGastos: 54300,
      utilidadNeta: 23700
    }
  ];

  // Usar datos reales o mock como fallback
  const datos = datosMensuales.length > 0 ? datosMensuales : datosMock;

  // Calcular totales anuales sin decimales
  const totales = datos.reduce((acc, mes) => {
    const nuevoAcc = { ...acc };

    // Sumar todas las propiedades numéricas del mes
    Object.keys(mes).forEach(key => {
      if (key !== 'mes' && typeof mes[key] === 'number') {
        // Redondear a entero sin decimales
        nuevoAcc[key] = Math.round((nuevoAcc[key] || 0) + (mes[key] || 0));
      }
    });

    return nuevoAcc;
  }, {});

  // Usar filas dinámicas o arrays vacíos si no hay datos
  const filasIngresos = filasDinamicas.ingresos;
  const filasCostos = filasDinamicas.costos;
  const filasGastos = filasDinamicas.gastos;

  const categorias = [
    // VENTAS - INGRESOS
    { id: 'totalIngresos', label: 'TOTAL INGRESOS', codigo: '4.0', color: 'text-emerald-600', bold: true, section: 'VENTAS', expandable: true },

    // VENTAS - COSTOS
    { id: 'totalCostos', label: 'TOTAL COSTOS (CMV)', codigo: '5.0', color: 'text-red-600', bold: true, section: 'VENTAS', expandable: true },

    // GANANCIA BRUTA
    { id: 'gananciaBruta', label: 'GANANCIA BRUTA', codigo: '', color: 'text-slate-800', bold: true, section: 'VENTAS', isSeparator: true },

    // GASTOS OPERATIVOS
    { id: 'totalGastos', label: 'TOTAL GASTOS OPERATIVOS', codigo: '5.1', color: 'text-orange-700', bold: true, section: 'GASTOS', expandable: true },

    // UTILIDAD NETA
    { id: 'utilidadNeta', label: 'UTILIDAD NETA', codigo: '', color: 'text-emerald-700', bold: true, section: 'RESULTADO' }
  ];

  // Generar opciones de años
  const añosDisponibles = [];
  const añoActual = new Date().getFullYear();
  for (let i = añoActual - 5; i <= añoActual + 1; i++) {
    añosDisponibles.push(i);
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatCurrencyCompact = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(value);
  };

  let currentSection = null;

  return (
    <div className="bg-white rounded border border-slate-200">
      {/* Header */}
      <div className="bg-slate-800 p-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <LayoutDashboard size={28} />
            <div>
              <h2 className="text-2xl font-semibold">Tablero General</h2>
              <p className="text-slate-300 mt-1">Estado de Resultados mensual - Estructura contable</p>
            </div>
          </div>
          <div>
            <select
              value={añoSeleccionado}
              onChange={(e) => setAñoSeleccionado(Number(e.target.value))}
              className="bg-white text-slate-800 px-4 py-2 rounded border border-slate-200 font-medium"
            >
              {añosDisponibles.map(año => (
                <option key={año} value={año}>{año}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de datos mensuales */}
      <div className="p-6">
        {/* Loading state */}
        {loading && (
          <div className="text-center py-8">
            <p className="text-slate-600">Cargando datos del año {añoSeleccionado}...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-semibold">Error al cargar datos:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && (
        <>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider sticky left-0 bg-slate-800">Categoría</th>
                {datos.map((dato) => (
                  <th key={dato.mes} className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider whitespace-nowrap">
                    {dato.mes}
                  </th>
                ))}
                <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider bg-slate-700">Total {añoSeleccionado}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {categorias.map((categoria, catIndex) => {
                const showSectionHeader = currentSection !== categoria.section;
                if (showSectionHeader) {
                  currentSection = categoria.section;
                }

                const isIngresosRow = categoria.id === 'totalIngresos';
                const isCostosRow = categoria.id === 'totalCostos';
                const isGastosRow = categoria.id === 'totalGastos';
                const isExpandable = categoria.expandable;
                const isUtilidadNeta = categoria.id === 'utilidadNeta';

                return (
                  <React.Fragment key={categoria.id}>
                    {/* Header de sección - centrado */}
                    {showSectionHeader && (
                      <tr className="bg-slate-700">
                        <td colSpan={14} className="px-4 py-3 text-sm font-bold text-white uppercase tracking-wider text-center">
                          {categoria.section}
                        </td>
                      </tr>
                    )}

                    {/* Fila principal */}
                    <tr
                      onClick={() => {
                        if (isIngresosRow) setIngresosExpanded(!ingresosExpanded);
                        if (isCostosRow) setCostosExpanded(!costosExpanded);
                        if (isGastosRow) setGastosExpanded(!gastosExpanded);
                      }}
                      className={`${catIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'} ${isExpandable ? 'cursor-pointer hover:bg-slate-100' : ''}`}
                    >
                      {/* Columna Categoría */}
                      <td className={`px-4 py-3 sticky left-0 ${catIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'} ${isExpandable ? 'hover:bg-slate-100' : ''}`}>
                        <div className="flex items-center gap-2">
                          {isExpandable && (
                            <>
                              {(isIngresosRow && ingresosExpanded) || (isCostosRow && costosExpanded) || (isGastosRow && gastosExpanded) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </>
                          )}
                          <div className={`text-sm ${categoria.bold ? 'font-semibold' : ''} ${categoria.color}`}>
                            {categoria.label}
                          </div>
                        </div>
                      </td>
                      {datos.map((dato) => (
                        <td
                          key={dato.mes}
                          className={`px-3 py-3 text-sm text-center ${categoria.color} ${categoria.bold ? 'font-semibold' : ''}`}
                        >
                          {formatCurrencyCompact(dato[categoria.id] || 0)}
                        </td>
                      ))}
                      <td className={`px-3 py-3 text-sm text-center ${isUtilidadNeta ? (totales.utilidadNeta >= 0 ? 'text-emerald-700' : 'text-red-600') : categoria.color} font-bold bg-slate-100`}>
                        {formatCurrency(totales[categoria.id] || 0)}
                      </td>
                    </tr>

                    {/* Filas expandidas - Ingresos */}
                    {isIngresosRow && ingresosExpanded && filasIngresos.map((fila, idx) => (
                      <tr key={fila.id} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                        {/* Columna Categoría */}
                        <td className={`px-4 py-2 pl-8 sticky left-0 ${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                          <div className={`text-sm ${fila.color}`}>
                            {fila.label}
                          </div>
                        </td>
                        {datos.map((dato) => (
                          <td key={dato.mes} className={`px-3 py-2 text-sm text-center ${fila.color}`}>
                            {formatCurrencyCompact(dato[fila.id] || 0)}
                          </td>
                        ))}
                        <td className={`px-3 py-2 text-sm text-center ${fila.color} bg-slate-100`}>
                          {formatCurrency(totales[fila.id] || 0)}
                        </td>
                      </tr>
                    ))}

                    {/* Filas expandidas - Costos */}
                    {isCostosRow && costosExpanded && filasCostos.map((fila, idx) => (
                      <tr key={fila.id} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                        {/* Columna Categoría */}
                        <td className={`px-4 py-2 pl-8 sticky left-0 ${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                          <div className={`text-sm ${fila.color}`}>
                            {fila.label}
                          </div>
                        </td>
                        {datos.map((dato) => (
                          <td key={dato.mes} className={`px-3 py-2 text-sm text-center ${fila.color}`}>
                            {formatCurrencyCompact(dato[fila.id] || 0)}
                          </td>
                        ))}
                        <td className={`px-3 py-2 text-sm text-center ${fila.color} bg-slate-100`}>
                          {formatCurrency(totales[fila.id] || 0)}
                        </td>
                      </tr>
                    ))}

                    {/* Filas expandidas - Gastos */}
                    {isGastosRow && gastosExpanded && filasGastos.map((fila, idx) => (
                      <tr key={fila.id} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                        {/* Columna Categoría */}
                        <td className={`px-4 py-2 pl-8 sticky left-0 ${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                          <div className={`text-sm ${fila.color}`}>
                            {fila.label}
                          </div>
                        </td>
                        {datos.map((dato) => (
                          <td key={dato.mes} className={`px-3 py-2 text-sm text-center ${fila.color}`}>
                            {formatCurrencyCompact(dato[fila.id] || 0)}
                          </td>
                        ))}
                        <td className={`px-3 py-2 text-sm text-center ${fila.color} bg-slate-100`}>
                          {formatCurrency(totales[fila.id] || 0)}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Gráfico */}
        <div className="mt-8">
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={datos}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 12 }}
                stroke="#475569"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#475569"
                tickFormatter={(value) => new Intl.NumberFormat('es-AR', {
                  style: 'currency',
                  currency: 'ARS',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(value)}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px'
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="rect"
              />
              <Bar
                dataKey="totalIngresos"
                fill="#10b981"
                name="Total Ingresos"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="totalCostos"
                fill="#ef4444"
                name="Total Costos"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="totalGastos"
                fill="#f97316"
                name="Total Gastos"
                radius={[4, 4, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="utilidadNeta"
                stroke="#1e293b"
                strokeWidth={3}
                name="Utilidad Neta"
                dot={{ fill: '#1e293b', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default TableroGeneralSection;
