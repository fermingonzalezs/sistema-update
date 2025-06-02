import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, AlertCircle, FileText, Calculator, Calendar, DollarSign, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
    console.log('📡 Obteniendo cuentas disponibles...');

    const { data, error } = await supabase
      .from('plan_cuentas')
      .select('id, codigo, nombre')
      .eq('activa', true)
      .order('codigo');

    if (error) {
      console.error('❌ Error obteniendo cuentas:', error);
      throw error;
    }

    console.log(`✅ ${data.length} cuentas obtenidas`);
    return data;
  },

  async createAsiento(asientoData) {
    console.log('💾 Creando asiento contable:', asientoData);

    // Validar que esté balanceado
    const totalDebe = asientoData.movimientos.reduce((sum, mov) => sum + parseFloat(mov.debe || 0), 0);
    const totalHaber = asientoData.movimientos.reduce((sum, mov) => sum + parseFloat(mov.haber || 0), 0);

    if (Math.abs(totalDebe - totalHaber) > 0.01) {
      throw new Error('El asiento no está balanceado. Debe = Haber');
    }

    try {
      // Obtener siguiente número
      const numeroAsiento = await this.getNextNumero();

      // Crear el asiento principal
      const { data: asiento, error: errorAsiento } = await supabase
        .from('asientos_contables')
        .insert([{
          numero: numeroAsiento,
          fecha: asientoData.fecha,
          descripcion: asientoData.descripcion,
          total_debe: totalDebe,
          total_haber: totalHaber,
          estado: 'registrado',
          usuario: 'admin'
        }])
        .select()
        .single();

      if (errorAsiento) throw errorAsiento;

      // Crear los movimientos
      const movimientos = asientoData.movimientos.map(mov => ({
        asiento_id: asiento.id,
        cuenta_id: mov.cuenta_id,
        debe: parseFloat(mov.debe || 0),
        haber: parseFloat(mov.haber || 0)
      }));

      const { data: movimientosCreados, error: errorMovimientos } = await supabase
        .from('movimientos_contables')
        .insert(movimientos)
        .select(`*, plan_cuentas(codigo, nombre)`);

      if (errorMovimientos) throw errorMovimientos;

      console.log('✅ Asiento creado exitosamente:', numeroAsiento);

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
  const [filtros, setFiltros] = useState({
    fechaDesde: '',
    fechaHasta: '',
    descripcion: ''
  });

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    movimientos: [
      { cuenta_id: '', cuenta: null, debe: '', haber: '' },
      { cuenta_id: '', cuenta: null, debe: '', haber: '' }
    ]
  });

  useEffect(() => {
    console.log('🚀 Iniciando carga de datos...');
    fetchAsientos();
    fetchCuentasImputables();
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
        { cuenta_id: '', cuenta: null, debe: '', haber: '' },
        { cuenta_id: '', cuenta: null, debe: '', haber: '' }
      ]
    });
    setShowModal(true);
  };

  const agregarMovimiento = () => {
    setFormData(prev => ({
      ...prev,
      movimientos: [...prev.movimientos, { cuenta_id: '', cuenta: null, debe: '', haber: '' }]
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
          if (campo === 'cuenta_id') {
            const cuenta = cuentasImputables.find(c => c.id == valor);
            return { ...mov, cuenta_id: valor, cuenta };
          } else {
            return { ...mov, [campo]: valor };
          }
        }
        return mov;
      })
    }));
  };

  const calcularTotales = () => {
    const totalDebe = formData.movimientos.reduce((sum, mov) => sum + parseFloat(mov.debe || 0), 0);
    const totalHaber = formData.movimientos.reduce((sum, mov) => sum + parseFloat(mov.haber || 0), 0);
    const diferencia = totalDebe - totalHaber;

    return { totalDebe, totalHaber, diferencia, balanceado: Math.abs(diferencia) < 0.01 };
  };

  const guardarAsiento = async () => {
    try {
      // Validaciones
      if (!formData.fecha) {
        alert('La fecha es obligatoria');
        return;
      }
      if (!formData.descripcion.trim()) {
        alert('La descripción es obligatoria');
        return;
      }

      // Validar que todos los movimientos tengan cuenta
      const movimientosSinCuenta = formData.movimientos.filter(mov => !mov.cuenta_id);
      if (movimientosSinCuenta.length > 0) {
        alert('Todos los movimientos deben tener una cuenta seleccionada');
        return;
      }

      // Validar que todos los movimientos tengan debe o haber
      const movimientosSinImporte = formData.movimientos.filter(mov =>
        (!mov.debe || parseFloat(mov.debe) === 0) && (!mov.haber || parseFloat(mov.haber) === 0)
      );
      if (movimientosSinImporte.length > 0) {
        alert('Todos los movimientos deben tener un importe en debe o haber');
        return;
      }

      // Validar que no haya debe y haber en el mismo movimiento
      const movimientosConAmbos = formData.movimientos.filter(mov =>
        mov.debe && parseFloat(mov.debe) > 0 && mov.haber && parseFloat(mov.haber) > 0
      );
      if (movimientosConAmbos.length > 0) {
        alert('Un movimiento no puede tener importe en debe Y haber al mismo tiempo');
        return;
      }

      const totales = calcularTotales();
      if (!totales.balanceado) {
        alert(`El asiento no está balanceado. Diferencia: $${totales.diferencia.toFixed(2)}`);
        return;
      }

      await crearAsiento(formData);
      setShowModal(false);
      alert('✅ Asiento creado exitosamente');
    } catch (err) {
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Cargando libro diario...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <FileText size={28} />
              <div>
                <h1 className="text-2xl font-bold">Libro Diario</h1>
                <p className="text-green-100 mt-1">Registro cronológico de operaciones contables</p>
              </div>
            </div>
            <button
              onClick={nuevoAsiento}
              className="bg-white text-green-600 px-6 py-3 rounded-lg hover:bg-green-50 flex items-center gap-2 font-medium transition-colors"
            >
              <Plus size={18} />
              Nuevo Asiento
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-gray-50 p-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <input
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <input
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <input
                type="text"
                value={filtros.descripcion}
                onChange={(e) => setFiltros({ ...filtros, descripcion: e.target.value })}
                placeholder="Buscar en descripción..."
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFiltros({ fechaDesde: '', fechaHasta: '', descripcion: '' })}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Estado de error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 m-6">
            <div className="flex items-center">
              <AlertCircle className="text-red-600 mr-2" size={20} />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Lista de asientos - VISTA COLAPSADA */}
        <div className="p-6">
          {asientosFiltrados.length > 0 ? (
            <div className="space-y-2">
              {asientosFiltrados.map(asiento => (
                <div key={asiento.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Fila principal del asiento - COLAPSADA */}
                  <div
                    className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => toggleAsiento(asiento.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                        {expandedAsientos[asiento.id] ?
                          <ChevronDown size={16} className="text-gray-600" /> :
                          <ChevronRight size={16} className="text-gray-600" />
                        }
                      </button>

                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        N° {asiento.numero}
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar size={14} />
                        <span>{new Date(asiento.fecha).toLocaleDateString()}</span>
                      </div>

                      <div className="font-medium text-gray-900">
                        {asiento.descripcion}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Total</div>
                        <div className="font-semibold text-green-600">
                          ${asiento.total_debe.toLocaleString()}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmarEliminar(asiento);
                        }}
                        className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
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
                        <table className="w-full">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="text-left py-3 px-6 font-medium text-gray-700">Cuenta</th>
                              <th className="text-right py-3 px-6 font-medium text-gray-700">Debe</th>
                              <th className="text-right py-3 px-6 font-medium text-gray-700">Haber</th>
                            </tr>
                          </thead>
                          <tbody>
                            {asiento.movimientos_contables.map((mov, index) => (
                              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-6">
                                  <div className={mov.haber > 0 ? "ml-50" : ""}>
                                    <code className="text-sm text-blue-600 font-mono">
                                      {mov.plan_cuentas.codigo}
                                    </code>
                                    <div className="text-gray-700">{mov.plan_cuentas.nombre}</div>
                                  </div>
                                </td>
                                <td className="text-right py-3 px-6 font-medium">
                                  {mov.debe > 0 ? `$${mov.debe.toLocaleString()}` : ''}
                                </td>
                                <td className="text-right py-3 px-6 font-medium">
                                  {mov.haber > 0 ? `$${mov.haber.toLocaleString()}` : ''}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50">
                            <tr className="font-semibold">
                              <td className="py-3 px-6 text-gray-700">TOTALES</td>
                              <td className="text-right py-3 px-6 text-green-600">
                                ${asiento.total_debe.toLocaleString()}
                              </td>
                              <td className="text-right py-3 px-6 text-green-600">
                                ${asiento.total_haber.toLocaleString()}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">
                {asientos.length === 0 ? 'No hay asientos registrados' : 'No se encontraron asientos con los filtros aplicados'}
              </p>
              <button
                onClick={nuevoAsiento}
                className="text-green-600 hover:underline"
              >
                Crear primer asiento
              </button>
            </div>
          )}
        </div>

        {/* Estadísticas */}
        {asientos.length > 0 && (
          <div className="bg-gray-50 p-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-800">{asientos.length}</div>
                <div className="text-sm text-gray-600">Asientos Totales</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  ${asientos.reduce((sum, a) => sum + a.total_debe, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Movimiento Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{asientosFiltrados.length}</div>
                <div className="text-sm text-gray-600">Asientos Filtrados</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal para nuevo asiento */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Plus size={20} />
                  Nuevo Asiento Contable
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Datos del asiento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción *
                  </label>
                  <input
                    type="text"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción del asiento contable"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Debug info */}
              {cuentasImputables.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <AlertCircle className="text-yellow-600 mr-2" size={16} />
                    <span className="text-yellow-800 text-sm">
                      ⚠️ No se encontraron cuentas. Verifica que tengas cuentas creadas en el plan de cuentas.
                    </span>
                  </div>
                </div>
              )}

              {/* Movimientos */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-lg">Movimientos Contables</h4>
                  <button
                    onClick={agregarMovimiento}
                    className="text-green-600 hover:text-green-800 font-medium text-sm"
                  >
                    + Agregar movimiento
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Cuenta</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Debe</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Haber</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.movimientos.map((mov, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-3 px-4">
                            <select
                              value={mov.cuenta_id}
                              onChange={(e) => actualizarMovimiento(index, 'cuenta_id', e.target.value)}
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            >
                              <option value="">Seleccionar cuenta...</option>
                              {cuentasImputables.map(cuenta => (
                                <option key={cuenta.id} value={cuenta.id}>
                                  {cuenta.codigo} - {cuenta.nombre}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={mov.debe}
                              onChange={(e) => actualizarMovimiento(index, 'debe', e.target.value)}
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-right focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={mov.haber}
                              onChange={(e) => actualizarMovimiento(index, 'haber', e.target.value)}
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-right focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            {formData.movimientos.length > 2 && (
                              <button
                                onClick={() => eliminarMovimiento(index)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Eliminar movimiento"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr className="font-semibold">
                        <td className="py-3 px-4 text-gray-700">TOTALES</td>
                        <td className="text-right py-3 px-4">
                          <span className={`${totales.totalDebe > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                            ${totales.totalDebe.toFixed(2)}
                          </span>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className={`${totales.totalHaber > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                            ${totales.totalHaber.toFixed(2)}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${totales.balanceado
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                            }`}>
                            {totales.balanceado ? (
                              <>
                                <Calculator size={12} className="mr-1" />
                                Balanceado
                              </>
                            ) : (
                              <>
                                <AlertCircle size={12} className="mr-1" />
                                Dif: ${Math.abs(totales.diferencia).toFixed(2)}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Información de ayuda */}
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle size={16} className="text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Reglas de la partida doble:</p>
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

            <div className="sticky bottom-0 bg-white border-t p-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X size={16} className="inline mr-2" />
                Cancelar
              </button>
              <button
                onClick={guardarAsiento}
                disabled={!totales.balanceado || cuentasImputables.length === 0}
                className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${totales.balanceado && cuentasImputables.length > 0
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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