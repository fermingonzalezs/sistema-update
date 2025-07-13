import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, AlertCircle, BookOpen } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import LoadingSpinner from '../../../shared/components/base/LoadingSpinner';

// Servicio para el Plan de Cuentas conectado a Supabase
const planCuentasService = {
  async getAll() {
    console.log('📡 Obteniendo plan de cuentas...');
    
    const { data, error } = await supabase
      .from('plan_cuentas')
      .select('*')
      .eq('activa', true)
      .order('codigo');
    
    if (error) {
      console.error('❌ Error obteniendo plan de cuentas:', error);
      throw error;
    }
    
    console.log(`✅ ${data.length} cuentas obtenidas`);
    return data;
  },

  async create(cuenta) {
    console.log('💾 Creando cuenta:', cuenta);
    
    // Validar que no exista el código
    const existing = await this.findByCode(cuenta.codigo);
    if (existing) {
      throw new Error(`Ya existe una cuenta con código: ${cuenta.codigo}`);
    }
    
    const { data, error } = await supabase
      .from('plan_cuentas')
      .insert([{
        ...cuenta,
        activa: true
      }])
      .select();
    
    if (error) {
      console.error('❌ Error creando cuenta:', error);
      throw error;
    }
    
    console.log('✅ Cuenta creada exitosamente');
    return data[0];
  },

  async update(id, updates) {
    console.log('🔄 Actualizando cuenta:', id);
    
    const { data, error } = await supabase
      .from('plan_cuentas')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('❌ Error actualizando cuenta:', error);
      throw error;
    }
    
    console.log('✅ Cuenta actualizada');
    return data[0];
  },

  async delete(id) {
    console.log('🗑️ Verificando dependencias antes de eliminar cuenta:', id);
    
    // Lista de todas las tablas que pueden referenciar plan_cuentas
    const dependencias = [
      { tabla: 'movimientos_contables', campo: 'cuenta_id', nombre: 'movimientos contables' },
      { tabla: 'conciliaciones_caja', campo: 'cuenta_caja_id', nombre: 'conciliaciones de caja' },
      { tabla: 'gastos_operativos', campo: 'cuenta_pago_id', nombre: 'gastos operativos' }
    ];
    
    // Verificar cada dependencia
    for (const dep of dependencias) {
      const { data, error } = await supabase
        .from(dep.tabla)
        .select('id')
        .eq(dep.campo, id);
      
      if (error) {
        console.error(`❌ Error verificando ${dep.nombre}:`, error);
        throw error;
      }
      
      if (data && data.length > 0) {
        throw new Error(`No se puede eliminar la cuenta porque tiene ${data.length} ${dep.nombre} asociados. Primero debe eliminar o reasignar estos registros.`);
      }
    }
    
    console.log('✅ No hay dependencias, procediendo a eliminar...');
    
    const { error } = await supabase
      .from('plan_cuentas')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('❌ Error eliminando cuenta:', error);
      throw error;
    }
    
    console.log('✅ Cuenta eliminada exitosamente');
    return true;
  },

  // Nueva función para desactivar en lugar de eliminar
  async deactivate(id, motivo = 'Desactivada por el usuario') {
    console.log('🔒 Desactivando cuenta:', id);
    
    const { error } = await supabase
      .from('plan_cuentas')
      .update({ 
        activa: false, 
        observaciones: motivo,
        fecha_desactivacion: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      console.error('❌ Error desactivando cuenta:', error);
      throw error;
    }
    
    console.log('✅ Cuenta desactivada');
    return true;
  },

  async findByCode(codigo) {
    const { data, error } = await supabase
      .from('plan_cuentas')
      .select('*')
      .eq('codigo', codigo)
      .maybeSingle();
    
    if (error) {
      console.error('❌ Error buscando por código:', error);
      throw error;
    }
    
    return data;
  }
};

// Hook personalizado para el Plan de Cuentas
function usePlanCuentas() {
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCuentas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await planCuentasService.getAll();
      setCuentas(data);
    } catch (err) {
      console.error('Error en usePlanCuentas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const crearCuenta = async (cuenta) => {
    try {
      setError(null);
      const nueva = await planCuentasService.create(cuenta);
      setCuentas(prev => [...prev, nueva].sort((a, b) => a.codigo.localeCompare(b.codigo)));
      return nueva;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const actualizarCuenta = async (id, updates) => {
    try {
      setError(null);
      const actualizada = await planCuentasService.update(id, updates);
      setCuentas(prev => prev.map(c => c.id === id ? { ...c, ...actualizada } : c));
      return actualizada;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const eliminarCuenta = async (id) => {
    try {
      setError(null);
      await planCuentasService.delete(id);
      setCuentas(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const desactivarCuenta = async (id, motivo) => {
    try {
      setError(null);
      await planCuentasService.deactivate(id, motivo);
      // Refrescar la lista para que no aparezca la cuenta desactivada
      await fetchCuentas();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    cuentas,
    loading,
    error,
    fetchCuentas,
    crearCuenta,
    actualizarCuenta,
    eliminarCuenta,
    desactivarCuenta
  };
}

// Componente Principal del Plan de Cuentas
const PlanCuentasSection = () => {
  const {
    cuentas,
    loading,
    error,
    fetchCuentas,
    crearCuenta,
    actualizarCuenta,
    eliminarCuenta,
    desactivarCuenta
  } = usePlanCuentas();

  const [showModal, setShowModal] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState(null);
  const [formData, setFormData] = useState({
    grupo: '',
    subcodigo: '',
    nombre: '',
    tipo: 'activo'
  });

  // Definir los grupos principales
  const grupos = [
    { codigo: '1', nombre: 'ACTIVO', tipo: 'activo' },
    { codigo: '2', nombre: 'PASIVO', tipo: 'pasivo' },
    { codigo: '3', nombre: 'PATRIMONIO NETO', tipo: 'patrimonio' },
    { codigo: '4', nombre: 'INGRESOS', tipo: 'ingreso' },
    { codigo: '5', nombre: 'EGRESOS', tipo: 'egreso' }
  ];

  // Obtener el grupo seleccionado
  const grupoSeleccionado = grupos.find(g => g.codigo === formData.grupo);

  // Generar el código completo
  const codigoCompleto = formData.grupo && formData.subcodigo 
    ? `${formData.grupo}.${formData.subcodigo}` 
    : '';

  useEffect(() => {
    fetchCuentas();
  }, []);

  // Debug: mostrar las cuentas que se cargan
  useEffect(() => {
    console.log('📋 Plan de cuentas cargado:', cuentas);
  }, [cuentas]);

  const nuevaCuenta = () => {
    setSelectedCuenta(null);
    setFormData({
      grupo: '',
      subcodigo: '',
      nombre: '',
      tipo: 'activo'
    });
    setShowModal(true);
  };

  const editarCuenta = (cuenta) => {
    setSelectedCuenta(cuenta);
    const partes = cuenta.codigo.split('.');
    setFormData({
      grupo: partes[0] || '',
      subcodigo: partes.slice(1).join('.') || '',
      nombre: cuenta.nombre,
      tipo: cuenta.tipo
    });
    setShowModal(true);
  };

  const confirmarEliminar = async (cuenta) => {
    const mensaje = `La cuenta "${cuenta.codigo} - ${cuenta.nombre}" puede tener registros asociados.\n\n` +
                   `Opciones:\n` +
                   `• CANCELAR - No hacer nada\n` +
                   `• OK - Intentar eliminar (puede fallar si tiene dependencias)\n` +
                   `• Si falla, puede desactivar la cuenta en su lugar`;
    
    if (confirm(mensaje)) {
      try {
        await eliminarCuenta(cuenta.id);
        alert('✅ Cuenta eliminada exitosamente');
      } catch (error) {
        console.error('Error eliminando cuenta:', error);
        
        // Si falla la eliminación, ofrecer desactivar
        const confirmarDesactivar = confirm(
          `❌ No se pudo eliminar la cuenta porque tiene registros asociados.\n\n` +
          `Error: ${error.message}\n\n` +
          `¿Desea DESACTIVAR la cuenta en su lugar?\n` +
          `(La cuenta no aparecerá en nuevos registros pero mantendrá el historial)`
        );
        
        if (confirmarDesactivar) {
          try {
            const motivo = prompt(
              'Ingrese el motivo para desactivar la cuenta:',
              'Cuenta desactivada por tener registros asociados'
            );
            
            if (motivo) {
              await desactivarCuenta(cuenta.id, motivo);
              alert('✅ Cuenta desactivada exitosamente');
            }
          } catch (desactivarError) {
            alert('❌ Error desactivando cuenta: ' + desactivarError.message);
          }
        }
      }
    }
  };

  const guardarCuenta = async () => {
    try {
      // Validaciones
      if (!formData.grupo) {
        alert('Debe seleccionar un grupo');
        return;
      }
      if (!formData.subcodigo.trim()) {
        alert('El subcódigo es obligatorio');
        return;
      }
      if (!formData.nombre.trim()) {
        alert('El nombre es obligatorio');
        return;
      }

      const datosParaGuardar = {
        codigo: codigoCompleto,
        nombre: formData.nombre,
        tipo: formData.tipo
      };

      if (selectedCuenta) {
        await actualizarCuenta(selectedCuenta.id, datosParaGuardar);
      } else {
        await crearCuenta(datosParaGuardar);
      }
      
      setShowModal(false);
      alert('✅ Cuenta guardada exitosamente');
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Cargando plan de cuentas..." size="medium" />;
  }

  return (
    <div className="p-0">
      <div className="bg-white overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-800 text-white p-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
                            <BookOpen size={28} className='mt-2'/>

              <div>
                
                <p className="text-slate-200 mt-2">Agregar o editar cuentas activas.</p>
              </div>
            </div>
            <button
              onClick={nuevaCuenta}
              className="bg-emerald-600 text-white px-6 py-3 rounded hover:bg-white/90 flex items-center gap-2 font-medium transition-colors"
            >
              <Plus size={18} />
              Nueva Cuenta
            </button>
          </div>
        </div>

        {/* Estado de error */}
        {error && (
          <div className="bg-slate-200 border-l-4 border-slate-800 p-6 m-8">
            <div className="flex items-center">
              <AlertCircle className="text-slate-800 mr-3" size={20} />
              <span className="text-slate-800">{error}</span>
            </div>
          </div>
        )}

        {/* Lista de cuentas - SIMPLE SIN JERARQUÍA */}
        <div className="divide-y divide-slate-200">
          {cuentas.length > 0 ? (
            cuentas.map(cuenta => (
              <div key={cuenta.id} className="flex items-center justify-between p-6 hover:bg-slate-200 border-b border-slate-200">
                <div className="flex items-center space-x-6">
                  <code className="text-sm font-mono text-slate-800 bg-slate-200 px-4 py-2 rounded min-w-[100px] border border-slate-200">
                    {cuenta.codigo}
                  </code>
                  <span className="font-medium text-slate-800">{cuenta.nombre}</span>
                  <span className="px-3 py-1 text-xs rounded font-medium border bg-slate-200 text-slate-800 border-slate-200">
                    {cuenta.tipo.toUpperCase()}
                  </span>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => editarCuenta(cuenta)}
                    className="p-3 text-slate-800 hover:bg-slate-200 rounded transition-colors border border-slate-200"
                    title="Editar cuenta"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => confirmarEliminar(cuenta)}
                    className="p-3 text-slate-800 hover:bg-slate-200 rounded transition-colors border border-slate-200"
                    title="Eliminar cuenta"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-16 text-center text-slate-800">
              <BookOpen size={48} className="mx-auto mb-6 text-slate-200" />
              <p className="mb-6">No hay cuentas configuradas</p>
              <p className="text-sm text-slate-800 mb-6">
                Necesitas crear cuentas para poder usar el libro diario
              </p>
              <button
                onClick={nuevaCuenta}
                className="bg-slate-800 text-white px-6 py-3 rounded hover:bg-slate-800/90"
              >
                Crear primera cuenta
              </button>
            </div>
          )}
        </div>

        {/* Estadísticas */}
        {cuentas.length > 0 && (
          <div className="bg-slate-200 p-6 border-t border-slate-200">
            <div className="text-sm text-slate-800 text-center">
              Total de cuentas: <span className="font-semibold">{cuentas.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Modal para crear/editar cuenta */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-8 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              {selectedCuenta ? <Edit2 size={20} /> : <Plus size={20} />}
              {selectedCuenta ? 'Editar Cuenta' : 'Nueva Cuenta'}
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-3">
                  Grupo Principal *
                </label>
                <select
                  value={formData.grupo}
                  onChange={(e) => {
                    const grupo = grupos.find(g => g.codigo === e.target.value);
                    setFormData({
                      ...formData, 
                      grupo: e.target.value,
                      tipo: grupo ? grupo.tipo : 'activo'
                    });
                  }}
                  className="w-full border border-slate-200 rounded px-4 py-3 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                >
                  <option value="">Seleccionar grupo...</option>
                  {grupos.map(grupo => (
                    <option key={grupo.codigo} value={grupo.codigo}>
                      {grupo.codigo} - {grupo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {formData.grupo && (
                <div className="bg-slate-200 p-4 rounded border border-slate-200">
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 text-xs rounded font-medium border bg-slate-200 text-slate-800 border-slate-200">
                      {grupoSeleccionado?.tipo.toUpperCase()}
                    </span>
                    <span className="text-sm text-slate-800">
                      Seleccionaste: <strong>{grupoSeleccionado?.nombre}</strong>
                    </span>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-3">
                  Subcódigo *
                </label>
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-mono text-slate-800 bg-slate-200 px-4 py-3 rounded border border-slate-200">
                    {formData.grupo || '?'}.
                  </span>
                  <input
                    type="text"
                    value={formData.subcodigo}
                    onChange={(e) => setFormData({...formData, subcodigo: e.target.value})}
                    className="flex-1 border border-slate-200 rounded px-4 py-3 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                    placeholder="01, 02, 03..."
                    disabled={!formData.grupo}
                  />
                </div>
                {codigoCompleto && (
                  <p className="text-xs text-emerald-600 mt-2">
                    ✓ Código completo: <strong>{codigoCompleto}</strong>
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-3">
                  Nombre de la Cuenta *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full border border-slate-200 rounded px-4 py-3 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                  placeholder="Ej: Caja, Banco, Proveedores..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-3">
                  Tipo (automático)
                </label>
                <div className="w-full px-4 py-3 rounded border-2 border-dashed border-slate-200 bg-slate-200">
                  <span className="text-sm font-medium text-slate-800">
                    {grupoSeleccionado ? grupoSeleccionado.tipo.toUpperCase() : 'Selecciona un grupo primero'}
                  </span>
                </div>
                <p className="text-xs text-slate-800 mt-2">
                  El tipo se asigna automáticamente según el grupo seleccionado
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 text-slate-800 border border-slate-200 rounded hover:bg-slate-200 transition-colors"
              >
                <X size={16} className="inline mr-2" />
                Cancelar
              </button>
              <button
                onClick={guardarCuenta}
                className="px-6 py-3 bg-slate-800 text-white rounded hover:bg-slate-800/90 transition-colors"
              >
                <Save size={16} className="inline mr-2" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanCuentasSection;