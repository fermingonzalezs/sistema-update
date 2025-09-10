import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, AlertCircle, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import LoadingSpinner from '../../../shared/components/base/LoadingSpinner';
import {
  buildAccountTree,
  validateAccountCode,
  sortAccountsByCode,
  validateAccountDeletion,
  generateNextCode,
  getSubcuentaConfig
} from '../utils/planCuentasHierarchy';

// Servicio para el Plan de Cuentas conectado a Supabase
const planCuentasService = {
  async getAll() {
    const { data, error } = await supabase
      .from('plan_cuentas')
      .select('id, codigo, nombre, tipo, padre_id, nivel, categoria, imputable, activa, moneda_original, requiere_cotizacion, created_at, updated_at')
      .eq('activa', true)
      .order('codigo');
    
    if (error) {
      console.error('❌ Error obteniendo plan de cuentas:', error);
      throw error;
    }
    
    return data;
  },

  async create(cuenta) {
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
    
    return data[0];
  },

  async update(id, updates) {
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
    
    return data[0];
  },

  async delete(id) {
    // Lista de todas las tablas que pueden referenciar plan_cuentas
    const dependencias = [
      { tabla: 'movimientos_contables', campo: 'cuenta_id', nombre: 'movimientos contables' },
      { tabla: 'conciliaciones_caja', campo: 'cuenta_caja_id', nombre: 'conciliaciones de caja' }
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
    
    const { error } = await supabase
      .from('plan_cuentas')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('❌ Error eliminando cuenta:', error);
      throw error;
    }
    
    return true;
  },

  // Nueva función para desactivar en lugar de eliminar
  async deactivate(id, motivo = 'Desactivada por el usuario') {
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
  },

  async getPossibleParents(nivelMaximo = 4) {
    const { data, error } = await supabase
      .from('plan_cuentas')
      .select('id, codigo, nombre, nivel, categoria')
      .eq('activa', true)
      .lt('nivel', nivelMaximo)
      .neq('categoria', 'CUENTA')
      .order('codigo');
    
    if (error) {
      console.error('❌ Error obteniendo cuentas padre:', error);
      throw error;
    }
    
    return data;
  }
};

// Hook personalizado para el Plan de Cuentas
function usePlanCuentas() {
  const [cuentas, setCuentas] = useState([]);
  const [cuentasArbol, setCuentasArbol] = useState([]);
  const [posiblesPadres, setPosiblesPadres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCuentas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await planCuentasService.getAll();
      const ordenadas = sortAccountsByCode(data);
      setCuentas(ordenadas);
      
      // Construir árbol jerárquico
      const arbol = buildAccountTree(ordenadas);
      setCuentasArbol(arbol);
    } catch (err) {
      console.error('Error en usePlanCuentas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosiblesPadres = async () => {
    try {
      const padres = await planCuentasService.getPossibleParents();
      setPosiblesPadres(padres);
    } catch (err) {
      console.error('Error obteniendo posibles padres:', err);
    }
  };

  const crearCuenta = async (cuenta) => {
    try {
      setError(null);
      const nueva = await planCuentasService.create(cuenta);
      
      // Actualizar lista y reconstruir árbol
      const nuevasCuentas = sortAccountsByCode([...cuentas, nueva]);
      setCuentas(nuevasCuentas);
      setCuentasArbol(buildAccountTree(nuevasCuentas));
      
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
      
      // Actualizar lista y reconstruir árbol
      const nuevasCuentas = cuentas.map(c => c.id === id ? { ...c, ...actualizada } : c);
      const ordenadas = sortAccountsByCode(nuevasCuentas);
      setCuentas(ordenadas);
      setCuentasArbol(buildAccountTree(ordenadas));
      
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
    cuentasArbol,
    posiblesPadres,
    loading,
    error,
    fetchCuentas,
    fetchPosiblesPadres,
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
    cuentasArbol,
    posiblesPadres,
    loading,
    error,
    fetchCuentas,
    fetchPosiblesPadres,
    crearCuenta,
    actualizarCuenta,
    eliminarCuenta,
    desactivarCuenta
  } = usePlanCuentas();

  const [showModal, setShowModal] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState(null);
  const [creatingSubcuenta, setCreatingSubcuenta] = useState(null);
  const [formData, setFormData] = useState({
    padre_id: null,
    codigo: '',
    nombre: '',
    tipo: 'activo',
    nivel: 1,
    categoria: 'PRINCIPAL',
    imputable: false,
    moneda_original: 'USD',
    requiere_cotizacion: false
  });
  const [expandedNodes, setExpandedNodes] = useState({});

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Expandir todas las categorías
  const expandirTodas = () => {
    const allNodes = {};
    const expandRecursively = (cuentas) => {
      cuentas.forEach(cuenta => {
        if (!cuenta.imputable && cuenta.children && cuenta.children.length > 0) {
          allNodes[cuenta.id] = true;
        }
        if (cuenta.children) {
          expandRecursively(cuenta.children);
        }
      });
    };
    expandRecursively(cuentasArbol);
    setExpandedNodes(allNodes);
  };

  // Colapsar todas las categorías
  const colapsarTodas = () => {
    setExpandedNodes({});
  };

  // Determinar automáticamente configuración de la cuenta según código y nombre
  const determinarConfiguracionCuenta = (codigo, nombre) => {
    const cuentasARSEspecificas = [
      'Caja La Plata Pesos', 'Caja CABA Pesos', 'Bancos físicos',
      'Banco Provincia Update Tech SRL', 'Banco Mercury Update Tech WW LLC',
      'Banco Provincia Yael', 'Banco Francés Ramiro', 'Banco Francés Alvaro',
      'Mercado Pago Yae', 'Ualá Yae', 'Mercado Pago Rama', 'Ualá Rama',
      'Caja móvil Yae Pesos', 'Caja móvil Rama Pesos', 'Caja móvil Alvaro Pesos'
    ];

    const esARS = cuentasARSEspecificas.some(cuentaARS => 
      nombre.toLowerCase().includes(cuentaARS.toLowerCase()) ||
      nombre.toLowerCase().includes('pesos')
    );

    return {
      moneda_original: esARS ? 'ARS' : 'USD',
      requiere_cotizacion: esARS
    };
  };

  useEffect(() => {
    fetchCuentas();
    fetchPosiblesPadres();
  }, []);
  
  // Inicializar todos los nodos colapsados para una vista más limpia
  useEffect(() => {
    if (cuentasArbol.length > 0) {
      setExpandedNodes({}); // Todos colapsados por defecto para vista más limpia
    }
  }, [cuentasArbol]);


  // Función recursiva para renderizar el árbol
  const renderAccountNode = (cuenta, nivel = 0) => {
    const tieneHijos = cuenta.children && cuenta.children.length > 0;
    const estaExpandido = expandedNodes[cuenta.id];
    const identacion = nivel * 20;
    const esCategoria = !cuenta.imputable; // Las cuentas no imputables son categorías
    
    

    return (
      <div key={cuenta.id}>
        <div 
          className={`flex items-center justify-between py-3 px-4 border-b border-slate-200 transition-all duration-200 ${
            tieneHijos ? 'cursor-pointer' : 'cursor-default'
          } ${
            esCategoria 
              ? 'hover:bg-slate-100 bg-slate-50' 
              : 'hover:bg-slate-50 bg-white'
          }`}
          onClick={() => {
            if (tieneHijos) {
              toggleNode(cuenta.id);
            }
          }}
        >
          <div className="flex items-center space-x-4 flex-1" style={{ paddingLeft: `${identacion}px` }}>
            {/* Botón de expansión/colapso - Para todas las cuentas con hijos */}
            {tieneHijos ? (
              <div className="w-5 h-5 flex items-center justify-center">
                {estaExpandido ? (
                  <ChevronDown size={16} className="text-slate-600" />
                ) : (
                  <ChevronDown size={16} className="text-slate-600 transform -rotate-90" />
                )}
              </div>
            ) : (
              <div className="w-5 h-5 flex-shrink-0"></div>
            )}

            {/* Código de cuenta */}
            <code className={`text-sm font-mono font-medium min-w-[100px] ${
              esCategoria 
                ? 'text-slate-800 font-semibold' 
                : 'text-slate-700'
            }`}>
              {cuenta.codigo}
            </code>

            {/* Nombre de cuenta */}
            <span className={`text-sm flex-1 ${
              esCategoria 
                ? 'text-slate-800 font-semibold' 
                : 'text-slate-800'
            }`}>
              {cuenta.nombre}
            </span>

            {/* Badge de moneda - solo para cuentas imputables */}
            {!esCategoria && (
              <span className={`px-2 py-1 text-xs font-medium rounded border ${
                cuenta.moneda_original === 'USD' 
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                  : 'bg-blue-100 text-blue-700 border-blue-200'
              }`}>
                {cuenta.moneda_original}
              </span>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex gap-1 ml-4" onClick={(e) => e.stopPropagation()}>
            {/* Botón para crear subcuenta - solo para cuentas no imputables (categorías) */}
            {!cuenta.imputable && cuenta.nivel < 5 && (
              <button
                onClick={() => crearSubcuenta(cuenta)}
                className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded transition-colors"
                title="Crear subcuenta"
              >
                <Plus size={14} />
              </button>
            )}
            <button
              onClick={() => editarCuenta(cuenta)}
              className="p-1.5 text-slate-600 hover:bg-slate-200 rounded transition-colors"
              title="Editar cuenta"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => confirmarEliminar(cuenta)}
              className="p-1.5 text-slate-600 hover:bg-slate-200 rounded transition-colors"
              title="Eliminar cuenta"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Renderizar hijos si están expandidos */}
        {tieneHijos && estaExpandido && (
          <div className="border-l-2 border-slate-300 ml-6">
            {cuenta.children.map(hijo => renderAccountNode(hijo, nivel + 1))}
          </div>
        )}
      </div>
    );
  };

  const nuevaCuenta = () => {
    setSelectedCuenta(null);
    setCreatingSubcuenta(null);
    const configMoneda = determinarConfiguracionCuenta('', '');
    setFormData({
      padre_id: null,
      codigo: '',
      nombre: '',
      tipo: 'activo',
      nivel: 1,
      categoria: 'PRINCIPAL',
      imputable: false,
      moneda_original: configMoneda.moneda_original,
      requiere_cotizacion: configMoneda.requiere_cotizacion
    });
    setShowModal(true);
  };

  const crearSubcuenta = (cuentaPadre) => {
    setSelectedCuenta(null);
    setCreatingSubcuenta(cuentaPadre);
    
    // Usar la función utilitaria para obtener la configuración
    const subcuentaConfig = getSubcuentaConfig(cuentaPadre, cuentas);
    
    setFormData({
      padre_id: subcuentaConfig.padre_id,
      codigo: subcuentaConfig.codigo,
      nombre: '',
      tipo: subcuentaConfig.tipo,
      nivel: subcuentaConfig.nivel,
      categoria: subcuentaConfig.categoria,
      imputable: subcuentaConfig.imputable,
      moneda_original: subcuentaConfig.moneda_original,
      requiere_cotizacion: subcuentaConfig.requiere_cotizacion
    });
    
    // Expandir el nodo padre para mostrar la nueva subcuenta una vez creada
    setExpandedNodes(prev => ({ ...prev, [cuentaPadre.id]: true }));
    
    setShowModal(true);
  };

  const editarCuenta = (cuenta) => {
    setSelectedCuenta(cuenta);
    setCreatingSubcuenta(null);
    setFormData({
      padre_id: cuenta.padre_id,
      codigo: cuenta.codigo,
      nombre: cuenta.nombre,
      tipo: cuenta.tipo,
      nivel: cuenta.nivel,
      categoria: cuenta.categoria,
      imputable: cuenta.imputable,
      moneda_original: cuenta.moneda_original || 'USD',
      requiere_cotizacion: cuenta.requiere_cotizacion || false
    });
    setShowModal(true);
  };

  const confirmarEliminar = async (cuenta) => {
    // Validar si se puede eliminar (usando las funciones de jerarquía)
    const validacion = validateAccountDeletion(cuenta, cuentas);
    
    if (!validacion.canDelete) {
      alert(`❌ No se puede eliminar: ${validacion.reason}`);
      return;
    }

    const mensaje = `¿Está seguro que desea eliminar la cuenta "${cuenta.codigo} - ${cuenta.nombre}"?

Esta acción no se puede deshacer.

• CANCELAR - No hacer nada
• OK - Eliminar definitivamente la cuenta`;
    
    if (confirm(mensaje)) {
      try {
        await eliminarCuenta(cuenta.id);
        alert('✅ Cuenta eliminada exitosamente');
      } catch (error) {
        console.error('Error eliminando cuenta:', error);
        
        // Si falla la eliminación, ofrecer desactivar
        const confirmarDesactivar = confirm(
          `❌ No se pudo eliminar la cuenta: ${error.message}

¿Desea DESACTIVAR la cuenta en su lugar?
(La cuenta no aparecerá en nuevos registros pero mantendrá el historial)`
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
      // Validaciones básicas
      if (!formData.codigo.trim()) {
        alert('El código es obligatorio');
        return;
      }
      if (!formData.nombre.trim()) {
        alert('El nombre es obligatorio');
        return;
      }

      // Validar código según nivel
      const validacionCodigo = validateAccountCode(formData.codigo, formData.nivel);
      if (!validacionCodigo.isValid) {
        alert(`❌ Código inválido: ${validacionCodigo.message}`);
        return;
      }

      let datosParaGuardar;

      if (creatingSubcuenta) {
        // Para subcuentas, usar los datos ya configurados
        datosParaGuardar = {
          codigo: formData.codigo,
          nombre: formData.nombre,
          tipo: formData.tipo,
          padre_id: formData.padre_id,
          nivel: formData.nivel,
          categoria: formData.categoria,
          imputable: formData.imputable,
          moneda_original: formData.moneda_original,
          requiere_cotizacion: formData.requiere_cotizacion
        };
      } else {
        // Para cuentas normales, configurar moneda automáticamente según el nombre
        const configMoneda = determinarConfiguracionCuenta(formData.codigo, formData.nombre);
        
        datosParaGuardar = {
          codigo: formData.codigo,
          nombre: formData.nombre,
          tipo: formData.tipo,
          padre_id: formData.padre_id || null,
          nivel: formData.nivel,
          categoria: formData.categoria,
          imputable: formData.imputable,
          moneda_original: configMoneda.moneda_original,
          requiere_cotizacion: configMoneda.requiere_cotizacion
        };
      }

      if (selectedCuenta) {
        await actualizarCuenta(selectedCuenta.id, datosParaGuardar);
      } else {
        await crearCuenta(datosParaGuardar);
      }
      
      setShowModal(false);
      const mensaje = creatingSubcuenta ? 
        '✅ Subcuenta creada exitosamente' : 
        '✅ Cuenta guardada exitosamente';
      alert(mensaje);
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Cargando plan de cuentas..." size="medium" />;
  }

  return (
    <div className="p-6">
      <div>
        {/* Header */}
        <div className="bg-white rounded border border-slate-200 mb-4">
          <div className="p-6 bg-slate-800 text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <BookOpen className="w-6 h-6" />
                <div>
                  <h2 className="text-2xl font-semibold">Plan de Cuentas</h2>
                  <p className="text-slate-300 mt-1">Estructura jerárquica de cuentas contables</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={expandirTodas}
                  className="bg-slate-600 text-white px-3 py-2 rounded hover:bg-slate-700 flex items-center gap-2 transition-colors text-sm"
                  title="Expandir todas las categorías"
                >
                  <ChevronDown size={14} />
                  Expandir
                </button>
                <button
                  onClick={colapsarTodas}
                  className="bg-slate-600 text-white px-3 py-2 rounded hover:bg-slate-700 flex items-center gap-2 transition-colors text-sm"
                  title="Colapsar todas las categorías"
                >
                  <ChevronUp size={14} />
                  Colapsar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Estado de error */}
        {error && (
          <div className="bg-white rounded border border-slate-200 mb-4">
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex items-center">
                <AlertCircle className="text-red-600 mr-3" size={20} />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          </div>
        )}

        {/* Árbol Jerárquico del Plan de Cuentas */}
        <div className="bg-white rounded border border-slate-200">
          {cuentasArbol.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {cuentasArbol.map(nodoRaiz => renderAccountNode(nodoRaiz))}
            </div>
          ) : (
            <div className="p-16 text-center text-slate-600">
              <BookOpen size={48} className="mx-auto mb-6 text-slate-300" />
              <p className="mb-6 text-slate-800">No hay cuentas configuradas</p>
              <p className="text-sm text-slate-600">
                Necesitas crear cuentas para poder usar el sistema contable
              </p>
            </div>
          )}
          
          {/* Estadísticas en el footer de la tarjeta */}
          {cuentas.length > 0 && (
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 rounded-b">
              <div className="flex justify-center items-center space-x-6 text-sm text-slate-600">
                <div>
                  Total: <span className="font-semibold text-slate-800">{cuentas.length}</span>
                </div>
                <div className="h-4 w-px bg-slate-300"></div>
                <div>
                  Categorías: <span className="font-semibold text-slate-800">{cuentas.filter(c => !c.imputable).length}</span>
                </div>
                <div className="h-4 w-px bg-slate-300"></div>
                <div>
                  Cuentas: <span className="font-semibold text-slate-800">{cuentas.filter(c => c.imputable).length}</span>
                </div>
                <div className="h-4 w-px bg-slate-300"></div>
                <div>
                  <span className="font-semibold text-slate-800">{cuentas.filter(c => c.imputable && c.moneda_original === 'USD').length}</span> USD · 
                  <span className="font-semibold text-slate-800">{cuentas.filter(c => c.imputable && c.moneda_original === 'ARS').length}</span> ARS
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear/editar cuenta */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded p-8 w-full max-w-md my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              {selectedCuenta ? <Edit2 size={20} /> : <Plus size={20} />}
              {selectedCuenta ? 'Editar Cuenta' : 
               creatingSubcuenta ? `Nueva Subcuenta de: ${creatingSubcuenta.codigo}` : 'Nueva Cuenta'}
            </h3>
            
            {/* Información contextual para subcuentas */}
            {creatingSubcuenta && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={16} className="text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-800">Creando subcuenta de:</span>
                </div>
                <div className="text-sm text-emerald-700">
                  <strong>{creatingSubcuenta.codigo}</strong> - {creatingSubcuenta.nombre}
                </div>
                <div className="text-xs text-emerald-600 mt-1">
                  La nueva cuenta heredará el tipo, moneda y configuración del padre
                </div>
              </div>
            )}
            
            <div className="space-y-6">
              {/* Cuenta Padre - solo mostrar si no estamos creando subcuenta */}
              {!creatingSubcuenta && (
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-3">
                    Cuenta Padre
                  </label>
                  <select
                    value={formData.padre_id || ''}
                    onChange={(e) => {
                      const padreId = e.target.value ? parseInt(e.target.value) : null;
                      const padre = posiblesPadres.find(p => p.id === padreId);
                      
                      // Si cambia el padre, regenerar código
                      let nuevoCodigo = '';
                      if (padre) {
                        nuevoCodigo = generateNextCode(cuentas, padre.codigo);
                      } else {
                        nuevoCodigo = generateNextCode(cuentas, null);
                      }
                      
                      setFormData({
                        ...formData, 
                        padre_id: padreId,
                        codigo: nuevoCodigo,
                        tipo: padre ? padre.tipo : 'activo',
                        nivel: padre ? padre.nivel + 1 : 1,
                        categoria: padre && padre.nivel < 4 ? 'SUBCATEGORIA' : 'CUENTA',
                        imputable: padre ? padre.nivel >= 4 : false
                      });
                    }}
                    className="w-full border border-slate-200 rounded px-4 py-3 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                  >
                    <option value="">Raíz (Sin padre)</option>
                    {posiblesPadres.map(padre => (
                      <option key={padre.id} value={padre.id}>
                        {padre.codigo} - {padre.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-3">
                  {creatingSubcuenta ? 'Código de Subcuenta (generado automáticamente)' : 'Código de Cuenta *'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                    className={`flex-1 border border-slate-200 rounded px-4 py-3 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 ${
                      creatingSubcuenta ? 'bg-emerald-50' : ''
                    }`}
                    placeholder="Ej: 1.1.01.01 o 4.1.02"
                    readOnly={creatingSubcuenta}
                  />
                  {!creatingSubcuenta && formData.padre_id && (
                    <button
                      type="button"
                      onClick={() => {
                        const padre = posiblesPadres.find(p => p.id === formData.padre_id);
                        if (padre) {
                          const nuevoCodigo = generateNextCode(cuentas, padre.codigo);
                          setFormData({...formData, codigo: nuevoCodigo});
                        }
                      }}
                      className="px-3 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition-colors text-sm"
                      title="Generar siguiente código disponible"
                    >
                      Auto
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  {creatingSubcuenta ? 
                    'Código generado automáticamente según la jerarquía del padre' :
                    'Ingrese el código jerárquico completo según el nivel deseado'
                  }
                </p>
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
              
              {/* Tipo - solo mostrar si no estamos creando subcuenta */}
              {!creatingSubcuenta && (
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-3">
                    Tipo (automático)
                  </label>
                  <div className="w-full px-4 py-3 rounded border-2 border-dashed border-slate-200 bg-slate-200">
                    <span className="text-sm font-medium text-slate-800">
                      {formData.tipo ? formData.tipo.toUpperCase() : 'ACTIVO'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 mt-2">
                    El tipo se asigna automáticamente según la cuenta padre seleccionada
                  </p>
                </div>
              )}

              {/* Configuración de Moneda */}
              <div className="bg-slate-50 p-4 rounded border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-800 mb-4">
                  Configuración de Moneda
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-800 mb-2">
                      Moneda Original *
                    </label>
                    <select
                      value={formData.moneda_original}
                      onChange={(e) => {
                        const nuevaMoneda = e.target.value;
                        setFormData({
                          ...formData, 
                          moneda_original: nuevaMoneda,
                          // Si es ARS, automáticamente requiere cotización para convertir a USD
                          requiere_cotizacion: nuevaMoneda === 'ARS'
                        });
                      }}
                      className="w-full border border-slate-200 rounded px-3 py-2 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                    >
                      <option value="USD">USD</option>
                      <option value="ARS">ARS</option>
                    </select>
                    {creatingSubcuenta && (
                      <p className="text-xs text-slate-600 mt-2">
                        Valor por defecto heredado del padre: {creatingSubcuenta.moneda_original || 'USD'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.requiere_cotizacion}
                        onChange={(e) => setFormData({...formData, requiere_cotizacion: e.target.checked})}
                        disabled={formData.moneda_original === 'ARS'} // ARS siempre requiere cotización
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                      />
                      <span className="text-sm font-medium text-slate-800">
                        Requiere cotización para conversión
                      </span>
                    </label>
                    <p className="text-xs text-slate-600 mt-2 ml-7">
                      {formData.moneda_original === 'ARS' 
                        ? 'Las cuentas en ARS siempre requieren cotización para convertir a USD (moneda principal del sistema)'
                        : 'Las cuentas en USD no requieren cotización ya que es la moneda principal del sistema'
                      }
                    </p>
                  </div>

                  {/* Vista previa */}
                  <div className="bg-white p-3 rounded border border-slate-200">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-slate-600">Vista previa:</span>
                      <span className={`px-2 py-1 text-xs rounded font-medium border ${
                        formData.moneda_original === 'USD' 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }`}>
                        {formData.moneda_original}
                      </span>
                      {formData.requiere_cotizacion && (
                        <span className="px-2 py-1 text-xs rounded font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                          COT
                        </span>
                      )}
                    </div>
                  </div>
                </div>

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
