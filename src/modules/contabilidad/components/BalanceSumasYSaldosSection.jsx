import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  RefreshCw, 
  Scale, 
  TrendingUp, 
  TrendingDown,
  Download,
  AlertCircle
} from 'lucide-react';
import { formatearMonto } from '../../../shared/utils/formatters';
import { cotizacionService } from '../../../shared/services/cotizacionService';
import Tarjeta from '../../../shared/components/layout/Tarjeta';
import { useBalanceSumasYSaldos } from '../hooks/useBalanceSumasYSaldos';
import { generarBalancePDF } from './pdf/BalanceSumasYSaldosPDF';

const BalanceSumasYSaldosSection = () => {
  const {
    balance,
    resumen,
    loading,
    error,
    fetchBalance
  } = useBalanceSumasYSaldos();

  // Estados locales
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [cotizacionDolar, setCotizacionDolar] = useState(1000);
  const [filtroTipo, setFiltroTipo] = useState('todos');

  // Establecer fechas por defecto (mes actual)
  useEffect(() => {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    setFechaDesde(primerDia.toISOString().split('T')[0]);
    setFechaHasta(ultimoDia.toISOString().split('T')[0]);
  }, []);

  // Cargar cotización del dólar
  useEffect(() => {
    const cargarCotizacion = async () => {
      try {
        const cotizacionData = await cotizacionService.obtenerCotizacionActual();
        setCotizacionDolar(cotizacionData.valor);
      } catch (error) {
        console.error('Error cargando cotización:', error);
      }
    };
    cargarCotizacion();
  }, []);

  // Cargar balance inicial
  useEffect(() => {
    if (fechaDesde && fechaHasta) {
      handleBuscar();
    }
  }, [fechaDesde, fechaHasta]);

  const handleBuscar = () => {
    fetchBalance(fechaDesde, fechaHasta);
  };

  const handleDescargarPDF = async () => {
    try {
      const resultado = await generarBalancePDF(balanceFiltrado, resumen, fechaDesde, fechaHasta, filtroTipo);
      if (!resultado.success) {
        console.error('Error al generar PDF:', resultado.error);
        // Aquí podrías mostrar un mensaje de error al usuario
      }
    } catch (error) {
      console.error('Error al generar PDF:', error);
      // Aquí podrías mostrar un mensaje de error al usuario
    }
  };


  const establecerPeriodo = (tipo) => {
    const hoy = new Date();
    let desde, hasta;

    switch (tipo) {
      case 'mes_actual':
        desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        break;
      case 'mes_anterior':
        desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        hasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
        break;
      case 'trimestre':
        const trimestreActual = Math.floor(hoy.getMonth() / 3);
        desde = new Date(hoy.getFullYear(), trimestreActual * 3, 1);
        hasta = new Date(hoy.getFullYear(), (trimestreActual + 1) * 3, 0);
        break;
      case 'año':
        desde = new Date(hoy.getFullYear(), 0, 1);
        hasta = new Date(hoy.getFullYear(), 11, 31);
        break;
      default:
        return;
    }

    setFechaDesde(desde.toISOString().split('T')[0]);
    setFechaHasta(hasta.toISOString().split('T')[0]);
  };

  const formatearMoneda = (monto) => formatearMonto(monto, 'USD');

  // Filtrar balance por tipo
  const balanceFiltrado = balance.filter(item => {
    if (filtroTipo === 'todos') return true;
    return item.cuenta.tipo === filtroTipo;
  });


  return (
    <div className="p-0">
      {/* Header */}
      <div className="bg-white rounded border border-slate-200 mb-4">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Scale className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-semibold">Balance de Sumas y Saldos</h2>
                <p className="text-slate-300 mt-1">Verificación contable por período</p>
              </div>
            </div>
            {!loading && !error && balanceFiltrado.length > 0 && (
              <button
                onClick={handleDescargarPDF}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Descargar PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="bg-white p-6 rounded border border-slate-200 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Fechas lado a lado */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Cuenta</label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="todos">Todos los tipos</option>
                <option value="activo">Activos</option>
                <option value="pasivo">Pasivos</option>
                <option value="patrimonio">Patrimonio</option>
                <option value="ingreso">Ingresos</option>
                <option value="gasto">Gastos</option>
              </select>
            </div>
          </div>

          {/* Períodos rápidos a la derecha */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => establecerPeriodo('mes_actual')}
              className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
            >
              Mes Actual
            </button>
            <button
              onClick={() => establecerPeriodo('mes_anterior')}
              className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
            >
              Mes Anterior
            </button>
            <button
              onClick={() => establecerPeriodo('trimestre')}
              className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
            >
              Trimestre
            </button>
            <button
              onClick={() => establecerPeriodo('año')}
              className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
            >
              Año
            </button>
          </div>
        </div>
      </div>

      {/* Resumen */}
      {resumen && (
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Tarjeta
              icon={BarChart3}
              titulo="Total Debe"
              valor={formatearMoneda(resumen.totalDebe)}
            />
            <Tarjeta
              icon={BarChart3}
              titulo="Total Haber"
              valor={formatearMoneda(resumen.totalHaber)}
            />
            <Tarjeta
              icon={TrendingUp}
              titulo="Saldos Deudores"
              valor={formatearMoneda(resumen.totalSaldosDeudores)}
            />
            <Tarjeta
              icon={TrendingDown}
              titulo="Saldos Acreedores"
              valor={formatearMoneda(resumen.totalSaldosAcreedores)}
            />
          </div>
        </div>
      )}


      {/* Loading */}
      {loading && (
        <div className="bg-white p-8 rounded border border-slate-200 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-600" />
          <p className="text-slate-600">Calculando balance...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-6 rounded mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800 font-medium">Error:</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Tabla de balance */}
      {!loading && !error && balanceFiltrado.length > 0 && (
        <div className="bg-white rounded border border-slate-200">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">
              Balance de Sumas y Saldos ({balanceFiltrado.length} cuentas)
            </h3>
            {resumen && (
              <p className="text-sm text-slate-600 mt-1">
                Período: {resumen.fechaDesde} al {resumen.fechaHasta} • {resumen.cantidadMovimientos} movimientos
              </p>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Cuenta</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Saldo Inicial</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Debe</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Haber</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Saldo Deudor</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Saldo Acreedor</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Movs.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {balanceFiltrado.map((item, index) => (
                  <tr key={item.cuenta.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-4 py-3 text-sm font-mono text-slate-600">
                      {item.cuenta.codigo}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-800">
                      <div>
                        <div className="font-medium">{item.cuenta.nombre}</div>
                        <div className="text-xs text-slate-500 capitalize">{item.cuenta.tipo}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-700">
                      {item.saldoInicial !== 0 ? formatearMoneda(Math.abs(item.saldoInicial)) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-700">
                      {item.debeMovimientos > 0 ? formatearMoneda(item.debeMovimientos) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-700">
                      {item.haberMovimientos > 0 ? formatearMoneda(item.haberMovimientos) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-medium">
                      {item.esDeudor ? (
                        <span className="text-emerald-700">{formatearMoneda(Math.abs(item.saldoFinal))}</span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-medium">
                      {item.esAcreedor ? (
                        <span className="text-blue-700">{formatearMoneda(Math.abs(item.saldoFinal))}</span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-600">
                      {item.cantidadMovimientos}
                    </td>
                  </tr>
                ))}
              </tbody>
              
              {/* Totales */}
              {resumen && (
                <tfoot className="bg-slate-800 text-white">
                  <tr>
                    <td colSpan="2" className="px-4 py-3 text-sm font-semibold">TOTALES</td>
                    <td className="px-4 py-3 text-sm text-center font-semibold">
                      {formatearMoneda(resumen.totalDebeInicial)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-semibold">
                      {formatearMoneda(resumen.totalDebe)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-semibold">
                      {formatearMoneda(resumen.totalHaber)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-semibold">
                      {formatearMoneda(resumen.totalSaldosDeudores)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-semibold">
                      {formatearMoneda(resumen.totalSaldosAcreedores)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-semibold">
                      {resumen.cantidadMovimientos}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Resumen por tipo de cuenta */}
      {resumen && balance.length > 0 && (
        <div className="bg-white p-6 rounded border border-slate-200 mb-6">
          <h4 className="text-lg font-semibold text-slate-800 mb-4">Resumen por Tipo de Cuenta</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {['activo', 'pasivo', 'patrimonio', 'resultado positivo', 'resultado negativo'].map((tipo) => {
              const cuentasTipo = balance.filter(item => item.cuenta.tipo === tipo);
              const totalDebe = cuentasTipo.reduce((sum, item) => sum + item.debeMovimientos, 0);
              const totalHaber = cuentasTipo.reduce((sum, item) => sum + item.haberMovimientos, 0);
              const diferencia = totalDebe - totalHaber;
              
              return (
                <div key={tipo} className="p-3 bg-slate-50 rounded">
                  <h5 className="font-semibold text-sm text-slate-800 capitalize mb-2">{tipo}</h5>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Cuentas:</span>
                      <span className="font-medium">{cuentasTipo.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Debe:</span>
                      <span className="font-medium">{formatearMoneda(totalDebe)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Haber:</span>
                      <span className="font-medium">{formatearMoneda(totalHaber)}</span>
                    </div>
                    <div className={`flex justify-between pt-1 border-t border-slate-300 ${
                      Math.abs(diferencia) < 0.01 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      <span>Diferencia:</span>
                      <span className="font-semibold">{formatearMoneda(Math.abs(diferencia))}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay datos */}
      {!loading && !error && balanceFiltrado.length === 0 && (
        <div className="bg-white p-8 rounded border border-slate-200 text-center">
          <Scale className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">No hay movimientos contables en el período seleccionado</p>
          <p className="text-sm text-slate-400 mt-1">Selecciona un período diferente o verifica que existan asientos contables</p>
        </div>
      )}
    </div>
  );
};

export default BalanceSumasYSaldosSection;