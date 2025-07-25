import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, AlertCircle, FileText, Calculator, Calendar, DollarSign, ChevronDown, ChevronRight, TrendingUp, Info, RefreshCw, Clock, LayoutGrid, List } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import SelectorCuentaImputableConCotizacion from '../../../components/SelectorCuentaImputableConCotizacion';
import { cotizacionService } from '../../../shared/services/cotizacionService';
import { prepararMovimientoContable, validarBalanceUSD } from '../../../shared/utils/currency';
import { formatearMonto } from '../../../shared/utils/formatters';
import LoadingSpinner from '../../../shared/components/base/LoadingSpinner';

// Servicio para el Libro Diario
const libroDiarioService = {
  async getAsientos() {
    console.log('📡 Obteniendo asientos contables...');

    const { data, error } = await supabase
      .from('asientos_contables')
      .select(`
        *,
        movimientos_contables (
          *,
          plan_cuentas (codigo, nombre)
        )
      `)
      .order('numero', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo asientos:', error);
      throw error;
    }

    console.log(`✅ ${data.length} asientos obtenidos`);
    return data;
  },

  async getCuentasImputables() {
    console.log('📡 Obteniendo cuentas imputables...');

    try {
      const { data, error } = await supabase
        .from('plan_cuentas')
        .select('id, codigo, nombre, moneda_original, requiere_cotizacion')
        .eq('activa', true)
        .eq('imputable', true)  // Solo cuentas imputables
        .order('codigo');

      if (error) {
        console.warn('⚠️ Columnas de moneda no disponibles, usando datos básicos');
        // Fallback a datos básicos
        const { data: dataBasica, error: errorBasico } = await supabase
          .from('plan_cuentas')
          .select('id, codigo, nombre')
          .eq('activa', true)
          .eq('imputable', true)  // Solo cuentas imputables
          .order('codigo');
        
        if (errorBasico) {
          throw errorBasico;
        }
        
        // Agregar valores por defecto
        const cuentasConDefecto = dataBasica.map(cuenta => ({
          ...cuenta,
          moneda_original: 'USD',
          requiere_cotizacion: false
        }));
        
        console.log(`✅ ${cuentasConDefecto.length} cuentas imputables obtenidas (modo básico)`);
        return cuentasConDefecto;
      }

      console.log(`✅ ${data.length} cuentas imputables obtenidas`);
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo cuentas imputables:', error);
      throw error;
    }
  },

  async createAsiento(asientoData) {
    console.log('💾 Creando asiento contable con USD:', asientoData);

    // Si hay movimientos convertidos (del nuevo sistema), usar esos
    const movimientosParaGuardar = asientoData.movimientosConvertidos || asientoData.movimientos;
    
    // Validar que esté balanceado en USD
    const totalDebe = asientoData.totalDebeUSD || movimientosParaGuardar.reduce((sum, mov) => sum + parseFloat(mov.debe || 0), 0);
    const totalHaber = asientoData.totalHaberUSD || movimientosParaGuardar.reduce((sum, mov) => sum + parseFloat(mov.haber || 0), 0);

    if (Math.abs(totalDebe - totalHaber) > 0.01) {
      throw new Error('El asiento no está balanceado en USD. Debe = Haber');
    }

    try {
      // Obtener siguiente número
      const numeroAsiento = await this.getNextNumero();

      // Crear el asiento principal (con o sin cotización promedio)
      const asientoDataToInsert = {
        numero: numeroAsiento,
        fecha: asientoData.fecha,
        descripcion: asientoData.descripcion,
        total_debe: totalDebe,
        total_haber: totalHaber,
        usuario: 'admin'
      };
      
      // Solo agregar cotización_promedio si está disponible
      if (asientoData.cotizacionPromedio) {
        asientoDataToInsert.cotizacion_promedio = asientoData.cotizacionPromedio;
      }

      const { data: asiento, error: errorAsiento } = await supabase
        .from('asientos_contables')
        .insert([asientoDataToInsert])
        .select()
        .single();

      if (errorAsiento) throw errorAsiento;

      // Crear los movimientos (básicos o con información de conversión)
      const movimientos = movimientosParaGuardar.map(mov => {
        const movimientoBasico = {
          asiento_id: asiento.id,
          cuenta_id: mov.cuenta_id,
          debe: parseFloat(mov.debe || 0),
          haber: parseFloat(mov.haber || 0)
        };
        
        // Solo agregar campos de conversión si AMBOS están disponibles (constraint check)
        if (mov.monto_original_ars !== undefined && mov.cotizacion_manual !== undefined) {
          movimientoBasico.monto_original_ars = mov.monto_original_ars;
          movimientoBasico.cotizacion_manual = mov.cotizacion_manual;
          if (mov.observaciones_cambio !== undefined) {
            movimientoBasico.observaciones_cambio = mov.observaciones_cambio;
          }
        }
        // Si alguno está pero no ambos, no agregar ninguno (cumplir constraint)
        
        return movimientoBasico;
      });

      const { data: movimientosCreados, error: errorMovimientos } = await supabase
        .from('movimientos_contables')
        .insert(movimientos)
        .select(`*, plan_cuentas(codigo, nombre)`);

      if (errorMovimientos) throw errorMovimientos;

      // La cotización promedio ya está guardada en el campo cotizacion_promedio del asiento

      console.log('✅ Asiento creado exitosamente en USD:', numeroAsiento);

      // Retornar el asiento completo con sus movimientos
      return {
        ...asiento,
        movimientos_contables: movimientosCreados
      };
    } catch (error) {
      console.error('❌ Error creando asiento:', error);
      throw error;
    }
  },

  async deleteAsiento(id) {
    console.log('🗑️ Eliminando asiento:', id);

    const { error } = await supabase
      .from('asientos_contables')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error eliminando asiento:', error);
      throw error;
    }

    console.log('✅ Asiento eliminado');
    return true;
  },

  async getNextNumero() {
    const { data, error } = await supabase
      .from('asientos_contables')
      .select('numero')
      .order('numero', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Error obteniendo siguiente número:', error);
      return 1;
    }

    return (data?.[0]?.numero || 0) + 1;
  }
};

// Hook personalizado para el Libro Diario
function useLibroDiario() {
  const [asientos, setAsientos] = useState([]);
  const [cuentasImputables, setCuentasImputables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAsientos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await libroDiarioService.getAsientos();
      setAsientos(data);
    } catch (err) {
      console.error('Error en useLibroDiario (asientos):', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCuentasImputables = async () => {
    try {
      setError(null);
      const data = await libroDiarioService.getCuentasImputables();
      setCuentasImputables(data);
      console.log('🔍 Cuentas cargadas en el hook:', data);
    } catch (err) {
      console.error('Error en useLibroDiario (cuentas):', err);
      setError(err.message);
    }
  };

  const crearAsiento = async (asientoData) => {
    try {
      setError(null);
      const nuevo = await libroDiarioService.createAsiento(asientoData);
      setAsientos(prev => [nuevo, ...prev]);
      return nuevo;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const eliminarAsiento = async (id) => {
    try {
      setError(null);
      await libroDiarioService.deleteAsiento(id);
      setAsientos(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    asientos,
    cuentasImputables,
    loading,
    error,
    fetchAsientos,
    fetchCuentasImputables,
    crearAsiento,
    eliminarAsiento
  };
}

// Componente Principal del Libro Diario
const LibroDiarioSection = () => {
  const {
    asientos,
    cuentasImputables,
    loading,
    error,
    fetchAsientos,
    fetchCuentasImputables,
    crearAsiento,
    eliminarAsiento
  } = useLibroDiario();

  const [showModal, setShowModal] = useState(false);
  const [expandedAsientos, setExpandedAsientos] = useState({});
  const [viewMode, setViewMode] = useState('tarjeta'); // 'tarjeta' o 'lista'
  const [filtros, setFiltros] = useState({
    fechaDesde: '',
    fechaHasta: '',
    descripcion: ''
  });

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    movimientos: [
      { 
        cuenta_id: '', 
        cuenta: null, 
        monto: 0,
        cotizacion: 0,
        tipo: 'debe', // 'debe' o 'haber'
        debe: '', 
        haber: '' 
      },
      { 
        cuenta_id: '', 
        cuenta: null, 
        monto: 0,
        cotizacion: 0,
        tipo: 'haber', // 'debe' o 'haber'
        debe: '', 
        haber: '' 
      }
    ]
  });

  useEffect(() => {
    console.log('🚀 Iniciando carga de datos...');
    fetchAsientos();
    fetchCuentasImputables();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debug: ver las cuentas cuando cambien
  useEffect(() => {
    console.log('🔍 Cuentas disponibles:', cuentasImputables);
  }, [cuentasImputables]);

  const toggleAsiento = (id) => {
    setExpandedAsientos(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const nuevoAsiento = () => {
    console.log('➕ Creando nuevo asiento...');
    console.log('🔍 Cuentas disponibles para seleccionar:', cuentasImputables);

    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      descripcion: '',
      movimientos: [
        { 
          cuenta_id: '', 
          cuenta: null, 
          monto: 0,
          cotizacion: 0,
          tipo: 'debe',
          debe: '', 
          haber: '' 
        },
        { 
          cuenta_id: '', 
          cuenta: null, 
          monto: 0,
          cotizacion: 0,
          tipo: 'haber',
          debe: '', 
          haber: '' 
        }
      ]
    });
    setShowModal(true);
  };

  const agregarMovimiento = () => {
    setFormData(prev => ({
      ...prev,
      movimientos: [...prev.movimientos, { 
        cuenta_id: '', 
        cuenta: null, 
        monto: 0,
        cotizacion: 0,
        tipo: 'debe',
        debe: '', 
        haber: '' 
      }]
    }));
  };

  const eliminarMovimiento = (index) => {
    if (formData.movimientos.length <= 2) {
      alert('Un asiento debe tener al menos 2 movimientos');
      return;
    }
    setFormData(prev => ({
      ...prev,
      movimientos: prev.movimientos.filter((_, i) => i !== index)
    }));
  };

  const actualizarMovimiento = (index, campo, valor) => {
    setFormData(prev => ({
      ...prev,
      movimientos: prev.movimientos.map((mov, i) => {
        if (i === index) {
          if (campo === 'cuenta') {
            // Cuando se selecciona una cuenta completa desde SelectorCuentaConCotizacion
            return { 
              ...mov, 
              cuenta_id: valor?.id || '', 
              cuenta: valor,
              // Limpiar cotización si la nueva cuenta no la requiere
              cotizacion: valor?.requiere_cotizacion ? mov.cotizacion : 0
            };
          } else {
            return { ...mov, [campo]: valor };
          }
        }
        return mov;
      })
    }));
  };

  const calcularTotales = () => {
    try {
      // Intentar convertir los movimientos a USD usando el servicio
      const movimientosConvertidos = formData.movimientos
        .filter(mov => mov.cuenta && mov.monto > 0)
        .map(mov => {
          try {
            return prepararMovimientoContable(mov, mov.cuenta, mov.cotizacion);
          } catch (error) {
              console.warn('⚠️ Error al convertir movimiento:', error.message);
            return { debe: 0, haber: 0 };
          }
        });

      const totalDebe = movimientosConvertidos.reduce((sum, mov) => sum + (mov.debe || 0), 0);
      const totalHaber = movimientosConvertidos.reduce((sum, mov) => sum + (mov.haber || 0), 0);
      const diferencia = totalDebe - totalHaber;

      return { 
        totalDebe, 
        totalHaber, 
        diferencia, 
        balanceado: Math.abs(diferencia) < 0.01,
        movimientosConvertidos 
      };
    } catch (error) {
      // En caso de error, retornar totales básicos
      const totalDebe = formData.movimientos.reduce((sum, mov) => {
        return sum + (mov.tipo === 'debe' ? parseFloat(mov.monto || 0) : 0);
      }, 0);
      const totalHaber = formData.movimientos.reduce((sum, mov) => {
        return sum + (mov.tipo === 'haber' ? parseFloat(mov.monto || 0) : 0);
      }, 0);
      const diferencia = totalDebe - totalHaber;

      return { totalDebe, totalHaber, diferencia, balanceado: false, error: error.message };
    }
  };

  const guardarAsiento = async () => {
    try {
      console.log('💾 Iniciando guardado de asiento con conversión USD...');
      
      // Validaciones básicas
      if (!formData.fecha) {
        alert('La fecha es obligatoria');
        return;
      }
      if (!formData.descripcion.trim()) {
        alert('La descripción es obligatoria');
        return;
      }

      // Validar que todos los movimientos tengan cuenta
      const movimientosSinCuenta = formData.movimientos.filter(mov => !mov.cuenta);
      if (movimientosSinCuenta.length > 0) {
        alert('Todos los movimientos deben tener una cuenta seleccionada');
        return;
      }

      // Validar que todos los movimientos tengan monto
      const movimientosSinMonto = formData.movimientos.filter(mov => !mov.monto || mov.monto <= 0);
      if (movimientosSinMonto.length > 0) {
        alert('Todos los movimientos deben tener un monto válido');
        return;
      }

      // Validar cotizaciones para cuentas ARS
      const movimientosSinCotizacion = formData.movimientos.filter(mov => 
        mov.cuenta?.requiere_cotizacion && (!mov.cotizacion || mov.cotizacion <= 0)
      );
      if (movimientosSinCotizacion.length > 0) {
        const cuentasSinCotizacion = movimientosSinCotizacion.map(mov => mov.cuenta.nombre).join(', ');
        alert(`Faltan cotizaciones para cuentas en ARS: ${cuentasSinCotizacion}`);
        return;
      }

      // Usar los totales ya calculados y disponibles en el scope
      if (!totales.balanceado) {
        alert(`El asiento no está balanceado en USD:\nDebe: ${totales.totalDebe.toFixed(2)}\nHaber: ${totales.totalHaber.toFixed(2)}`);
        return;
      }

      // Calcular cotización promedio de los movimientos que la tengan
      const cotizaciones = totales.movimientosConvertidos
        .map(m => m.cotizacion_manual)
        .filter(c => c && c > 0);
      
      const cotizacionPromedio = cotizaciones.length > 0
        ? cotizaciones.reduce((a, b) => a + b, 0) / cotizaciones.length
        : null;

      // Crear el asiento usando el servicio actualizado
      await crearAsiento({
        ...formData,
        movimientosConvertidos: totales.movimientosConvertidos,
        totalDebeUSD: totales.totalDebe,
        totalHaberUSD: totales.totalHaber,
        cotizacionPromedio: cotizacionPromedio
      });
      
      setShowModal(false);
      alert('✅ Asiento creado exitosamente en USD');
      
    } catch (err) {
      console.error('Error guardando asiento:', err);
      alert('❌ Error: ' + err.message);
    }
  };

  const confirmarEliminar = (asiento) => {
    if (confirm(`¿Está seguro de eliminar el asiento N° ${asiento.numero}?`)) {
      eliminarAsiento(asiento.id);
    }
  };

  const asientosFiltrados = asientos.filter(asiento => {
    let cumpleFiltros = true;

    if (filtros.fechaDesde && asiento.fecha < filtros.fechaDesde) {
      cumpleFiltros = false;
    }
    if (filtros.fechaHasta && asiento.fecha > filtros.fechaHasta) {
      cumpleFiltros = false;
    }
    if (filtros.descripcion && !asiento.descripcion.toLowerCase().includes(filtros.descripcion.toLowerCase())) {
      cumpleFiltros = false;
    }

    return cumpleFiltros;
  });

  const totales = calcularTotales();

  if (loading) {
    return <LoadingSpinner text="Cargando libro diario..." size="medium" />;
  }

  const renderAsientos = () => {
    if (viewMode === 'tarjeta') {
      return (
        <div className="space-y-2 font-mono">
          {asientosFiltrados.map(asiento => (
            <div key={asiento.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Fila principal del asiento - COLAPSADA */}
              <div
                className="flex items-center justify-between p-1 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => toggleAsiento(asiento.id)}
              >
                <div className="flex items-center space-x-4">
                  <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                    {expandedAsientos[asiento.id] ?
                      <ChevronDown size={16} className="text-gray-600" /> :
                      <ChevronRight size={16} className="text-gray-600" />
                    }
                  </button>

                  <div className="text-black px-1 text-lg">
                    N°{asiento.numero}
                  </div>

                  <div className="flex items-center space-x-2 text-md text-gray-600">
                    <Calendar size={14} />
                    <span>{new Date(asiento.fecha).toLocaleDateString()}</span>
                  </div>

                  <div className="font-medium text-lg text-gray-900">
                    {asiento.descripcion}
                  </div>
                </div>

                <div className="flex items-center text-lg space-x-4">
                  <div className="text-right">
                    <div className="font-semibold text-gray-800">
                      {formatearMonto(asiento.total_debe, 'USD')}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmarEliminar(asiento);
                    }}
                    className="p-2 text-gray-700 hover:bg-gray-200 rounded transition-colors border border-gray-400"
                    title="Eliminar asiento"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Detalle del asiento - EXPANDIBLE */}
              {expandedAsientos[asiento.id] && (
                <div className="border-t bg-white">
                  <div className="overflow-x-auto">
                    {/* Headers */}
                    <div className="flex">
                      <div className="w-1/2 max-w-md text-lg">
                        <div className="grid grid-cols-2 gap-6 bg-gray-100 p-1">
                          <div className="text-center font-medium text-gray-700">Debe</div>
                          <div className="text-center font-medium text-gray-700">Haber</div>
                        </div>
                      </div>
                      <div className="flex-1"></div>
                      <div className="w-1/3">
                        <div className="grid grid-cols-2 gap-6 bg-gray-100 text-lg p-1">
                          <div className="text-center font-medium text-gray-700">Debe</div>
                          <div className="text-center font-medium text-gray-700">Haber</div>
                        </div>
                      </div>
                    </div>
                    {/* Rows */}
                    <div>
                      {asiento.movimientos_contables.map((mov, index) => (
                        <div key={index} className="flex hover:bg-gray-50 py-3">
                          {/* Cuentas */}
                          <div className="w-1/2 max-w-md text-lg px-2">
                            <div className="grid grid-cols-2 gap-6 h-full items-center">
                              <div className="text-center">
                                {mov.debe > 0 && (
                                  <div>
                                    <code className="text-sm text-black font-mono bg-slate-200 px-2 py-1">
                                      {mov.plan_cuentas.codigo}
                                    </code>
                                    <div className="text-gray-700 text-sm mt-2">{mov.plan_cuentas.nombre}</div>
                                  </div>
                                )}
                              </div>
                              <div className="text-center">
                                {mov.haber > 0 && (
                                  <div>
                                    <code className="text-sm text-black font-mono bg-slate-200 px-2 py-1">
                                      {mov.plan_cuentas.codigo}
                                    </code>
                                    <div className="text-gray-700 text-sm mt-2">{mov.plan_cuentas.nombre}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Separador */}
                          <div className="flex-1"></div>
                          {/* Importes */}
                          <div className="w-1/3 px-4">
                            <div className="grid grid-cols-2 gap-6 h-full items-center">
                              <div className="text-center font-medium">
                                {mov.debe > 0 ? formatearMonto(mov.debe, 'USD') : ''}
                              </div>
                              <div className="text-center font-medium">
                                {mov.haber > 0 ? formatearMonto(mov.haber, 'USD') : ''}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (viewMode === 'lista') {
      return (
        <div className="font-mono">
          {/* Header de la tabla principal */}
          <div className="p-1 grid grid-cols-12 gap-1 items-center bg-gray-800 text-white font-mono font-bold text-md">
            <div className="col-span-1">N°</div>
            <div className="col-span-2">Fecha</div>
            <div className="col-span-5">Descripción</div>
            <div className="col-span-2 text-right pr-4">Total</div>
            <div className="col-span-2 text-right">Acciones</div>
          </div>
          {asientosFiltrados.map(asiento => (
            <div key={asiento.id} className="border-b">

              {/* Fila del asiento */}
              <div className=" bg-gray-400 p-1 grid grid-cols-12 gap-4 items-center">
                <div className="p-1 font-bold">
                  <span className="">
                    {asiento.numero}
                  </span>
                </div>
                <div className="col-span-2 text-sm">{new Date(asiento.fecha).toLocaleDateString()}</div>
                <div className="col-span-5 text-sm">{asiento.descripcion}</div>
                <div className="col-span-2 text-right font-mono pr-4">{formatearMonto(asiento.total_debe, 'USD')}</div>
                <div className="col-span-2 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmarEliminar(asiento);
                    }}
                    className="p-2 text-gray-700 hover:bg-gray-200 rounded transition-colors border border-gray-400"
                    title="Eliminar asiento"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {/* Movimientos del asiento */}
              <div className="font-mono">
                {/* Header de movimientos */}
                <div className="flex text-sm font-semibold py-2 bg-gray-200">
                    <div className="w-16"></div>
                    {/* Sección de Cuentas */}
                    <div className="w-96 grid grid-cols-2 gap-26">
                      <div className="text-left pl-4">Debe</div>
                      <div className="text-left pl-7">Haber</div>
                    </div>
                    {/* Margen central */}
                    <div className="flex-1"></div>
                    {/* Sección de Importes */}
                    <div className="w-64 grid grid-cols-2 gap-6">
                      <div className="text-left pr-3">Debe</div>
                      <div className="text-right pr-4">Haber</div>
                    </div>
                </div>
                {asiento.movimientos_contables.map((mov, index) => (
                  <div key={index} className="flex text-sm border-t py-1">
                    <div className="w-16"></div>
                    {/* Sección de Cuentas */}
                    <div className="w-120 grid grid-cols-2 gap-10">
                      {/* Cuenta Debe */}
                      <div className="pl-4">
                        {mov.debe > 0 ? (
                          <div>
                            <div className="font-medium">{mov.plan_cuentas.nombre}</div>
                            <div className="text-xs font-mono text-gray-500">{mov.plan_cuentas.codigo}</div>
                          </div>
                        ) : ''}
                      </div>
                      {/* Cuenta Haber */}
                      <div className="pl-4">
                        {mov.haber > 0 ? (
                          <div>
                            <div className="font-medium">{mov.plan_cuentas.nombre}</div>
                            <div className="text-xs font-mono text-gray-500">{mov.plan_cuentas.codigo}</div>
                          </div>
                        ) : ''}
                      </div>
                    </div>
                    {/* Margen central */}
                    <div className="flex-1"></div>
                    {/* Sección de Importes */}
                    <div className="w-64 grid grid-cols-2 gap-10">
                      {/* Importe Debe */}
                      <div className="text-right pr-4">
                        {mov.debe > 0 ? (
                          <div className="font-mono font-semibold text-red-600">
                            {formatearMonto(mov.debe, 'USD')}
                          </div>
                        ) : ''}
                      </div>
                      {/* Importe Haber */}
                      <div className="text-right pr-4">
                        {mov.haber > 0 ? (
                          <div className="font-mono font-semibold text-green-600">
                            {formatearMonto(mov.haber, 'USD')}
                          </div>
                        ) : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="p-0">
      <div className="bg-white shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-slate-800 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <FileText size={28} />
              <div>
                <p className="text-gray-300 mt-1">Registro cronológico de operaciones contables</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex border border-gray-500 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('tarjeta')}
                  className={`p-2 transition-colors ${viewMode === 'tarjeta' ? 'bg-emerald-600 text-white' : 'text-white hover:bg-gray-700'}`}
                  title="Vista de Tarjetas"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('lista')}
                  className={`p-2 transition-colors ${viewMode === 'lista' ? 'bg-emerald-600 text-white' : 'text-white hover:bg-gray-700'}`}
                  title="Vista de Lista"
                >
                  <List size={18} />
                </button>
              </div>
              <button
                onClick={nuevoAsiento}
                className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-gray-100 flex items-center gap-2 font-medium transition-colors"
              >
                <Plus size={18} />
                Nuevo Asiento
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-gray-50 p-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <input
                type="text"
                value={filtros.descripcion}
                onChange={(e) => setFiltros({ ...filtros, descripcion: e.target.value })}
                placeholder="Buscar en descripción..."
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFiltros({ fechaDesde: '', fechaHasta: '', descripcion: '' })}
                className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-black text-sm"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Estado de error */}
        {error && (
          <div className="bg-gray-100 border-l-4 border-gray-800 p-4 m-6">
            <div className="flex items-center">
              <AlertCircle className="text-gray-800 mr-2" size={20} />
              <span className="text-gray-900">{error}</span>
            </div>
          </div>
        )}

        {/* Lista de asientos */}
        <div className="p-6">
          {asientosFiltrados.length > 0 ? (
            renderAsientos()
          ) : (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">
                {asientos.length === 0 ? 'No hay asientos registrados' : 'No se encontraron asientos con los filtros aplicados'}
              </p>
              <button
                onClick={nuevoAsiento}
                className="text-gray-800 hover:text-black hover:underline"
              >
                Crear primer asiento
              </button>
            </div>
          )}
        </div>

        {/* Estadísticas */}
        {asientos.length > 0 && (
          <div className="bg-gray-100 p-4 border-t border-gray-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-800">{asientos.length}</div>
                <div className="text-sm text-gray-600">Asientos Totales</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {formatearMonto(asientos.reduce((sum, a) => sum + a.total_debe, 0))}
                </div>
                <div className="text-sm text-gray-600">Movimiento Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{asientosFiltrados.length}</div>
                <div className="text-sm text-gray-600">Asientos Filtrados</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal para nuevo asiento */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-8">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Plus size={20} />
                  Nuevo Asiento Contable
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-200 rounded"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Datos del asiento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-3">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full border border-slate-200 rounded px-4 py-3 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-3">
                    Descripción *
                  </label>
                  <input
                    type="text"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción del asiento contable"
                    className="w-full border border-slate-200 rounded px-4 py-3 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Debug info */}
              {cuentasImputables.length === 0 && (
                <div className="bg-slate-200 border border-slate-200 rounded p-4">
                  <div className="flex items-center">
                    <AlertCircle className="text-slate-800 mr-3" size={16} />
                    <span className="text-slate-800 text-sm">
                      No se encontraron cuentas imputables. Verifica que tengas cuentas marcadas como imputables en el plan de cuentas.
                    </span>
                  </div>
                </div>
              )}

              {/* Movimientos con Sistema de Conversión USD */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="font-medium text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-gray-700" />
                      Movimientos Contables (Sistema USD)
                    </h4>
                    <p className="text-sm text-gray-600">Todas las operaciones se guardan en dólares americanos</p>
                  </div>
                  <button
                    onClick={agregarMovimiento}
                    className="text-slate-800 hover:text-slate-800/80 font-medium text-sm flex items-center gap-1"
                  >
                    <Plus size={16} />
                    Agregar movimiento
                  </button>
                </div>

                {/* Lista de Movimientos con SelectorCuentaConCotizacion */}
                <div className="space-y-6">
                  {formData.movimientos.map((mov, index) => (
                    <div key={index} className="border border-slate-200 rounded p-6 bg-slate-200">
                      <div className="flex justify-between items-start mb-6">
                        <h5 className="font-medium text-slate-800">Movimiento {index + 1}</h5>
                        <div className="flex items-center space-x-3">
                          {/* Toggle Debe/Haber */}
                          <div className="flex border border-slate-200 rounded overflow-hidden">
                            <button
                              type="button"
                              onClick={() => actualizarMovimiento(index, 'tipo', 'debe')}
                              className={`px-4 py-2 text-sm font-medium transition-colors ${
                                mov.tipo === 'debe' 
                                  ? 'bg-slate-800 text-white' 
                                  : 'bg-white text-slate-800 hover:bg-slate-200'
                              }`}
                            >
                              DEBE
                            </button>
                            <button
                              type="button"
                              onClick={() => actualizarMovimiento(index, 'tipo', 'haber')}
                              className={`px-4 py-2 text-sm font-medium transition-colors ${
                                mov.tipo === 'haber' 
                                  ? 'bg-slate-800 text-white' 
                                  : 'bg-white text-slate-800 hover:bg-slate-200'
                              }`}
                            >
                              HABER
                            </button>
                          </div>
                          
                          {/* Botón Eliminar */}
                          {formData.movimientos.length > 2 && (
                            <button
                              onClick={() => eliminarMovimiento(index)}
                              className="text-slate-800 hover:text-slate-800/80 p-2 rounded transition-colors"
                              title="Eliminar movimiento"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Componente SelectorCuentaImputableConCotizacion */}
                      <SelectorCuentaImputableConCotizacion
                        cuentaSeleccionada={mov.cuenta}
                        onCuentaChange={(cuenta) => actualizarMovimiento(index, 'cuenta', cuenta)}
                        monto={mov.monto}
                        onMontoChange={(monto) => actualizarMovimiento(index, 'monto', monto)}
                        cotizacion={mov.cotizacion}
                        onCotizacionChange={(cotizacion) => actualizarMovimiento(index, 'cotizacion', cotizacion)}
                        tipo={mov.tipo}
                        required={true}
                        className="mt-6"
                      />
                    </div>
                  ))}
                </div>

                {/* Resumen de Totales en USD */}
                <div className="mt-8 bg-slate-200 border border-slate-200 rounded p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Calculator className="w-5 h-5 text-slate-800" />
                    <h5 className="font-medium text-slate-800">Resumen del Asiento (en USD)</h5>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div className="flex justify-between">
                      <span>Total Debe USD:</span>
                      <span className={`font-medium ${totales.totalDebe > 0 ? 'text-slate-800' : 'text-slate-800/60'}`}>
                        {formatearMonto(totales.totalDebe)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Haber USD:</span>
                      <span className={`font-medium ${totales.totalHaber > 0 ? 'text-slate-800' : 'text-slate-800/60'}`}>
                        {formatearMonto(totales.totalHaber)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estado:</span>
                      <div className={`inline-flex items-center px-3 py-1 rounded text-xs font-medium border ${
                        totales.balanceado 
                          ? 'bg-emerald-600 text-white border-emerald-600' 
                          : 'bg-slate-800 text-white border-slate-800'
                      }`}>
                        {totales.balanceado ? (
                          <>
                            <Calculator size={12} className="mr-1" />
                            Balanceado ✓
                          </>
                        ) : (
                          <>
                            <AlertCircle size={12} className="mr-1" />
                            Diferencia: {formatearMonto(Math.abs(totales.diferencia))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {totales.error && (
                    <div className="mt-4 p-3 bg-slate-200 border border-slate-200 rounded text-sm text-slate-800">
                      <strong>Error:</strong> {totales.error}
                    </div>
                  )}
                </div>

                {/* Información de ayuda */}
                <div className="mt-6 p-6 bg-slate-200 rounded border border-slate-200">
                  <div className="flex items-start space-x-3">
                    <AlertCircle size={16} className="text-slate-800 mt-0.5" />
                    <div className="text-sm text-slate-800">
                      <p className="font-medium mb-2">Reglas de la partida doble:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• El total del DEBE debe ser igual al total del HABER</li>
                        <li>• Cada movimiento debe tener importe en DEBE o en HABER, pero no en ambos</li>
                        <li>• Un asiento debe tener al menos 2 movimientos</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-8 flex justify-end gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 text-slate-800 border border-slate-200 rounded hover:bg-slate-200 transition-colors"
              >
                <X size={16} className="inline mr-2" />
                Cancelar
              </button>
              <button
                onClick={guardarAsiento}
                disabled={!totales.balanceado || cuentasImputables.length === 0}
                className={`px-6 py-3 rounded transition-colors flex items-center gap-2 ${totales.balanceado && cuentasImputables.length > 0
                    ? 'bg-slate-800 text-white hover:bg-slate-800/90'
                    : 'bg-slate-200 text-slate-800/60 cursor-not-allowed'
                  }`}
              >
                <Save size={16} />
                Guardar Asiento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibroDiarioSection;
