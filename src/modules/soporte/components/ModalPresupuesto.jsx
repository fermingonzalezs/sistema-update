import React, { useState, useEffect } from 'react';
import { Wrench, FileText, Plus, X, Check, ChevronRight, ChevronLeft, Package, Store, DollarSign, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useReparaciones } from '../hooks/useReparaciones';
import { supabase } from '../../../lib/supabase';

function ModalPresupuesto({ open, onClose, reparacion }) {
  // Estados principales
  const [servicios, setServicios] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [repuestosSeleccionados, setRepuestosSeleccionados] = useState([]);
  
  // Estados para items personalizados
  const [servicioPersonalizado, setServicioPersonalizado] = useState({ nombre: '', precio: '' });
  const [repuestoPersonalizado, setRepuestoPersonalizado] = useState({ nombre: '', precio: '' });
  
  // Estados para pestañas
  const [tabRepuestos, setTabRepuestos] = useState('stock');
  
  // Estados para el presupuesto
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);

  // Hook para manejar reparaciones
  const { guardarPresupuesto, obtenerPresupuesto } = useReparaciones();

  // Datos de ejemplo - en producción estos vendrían de Supabase
  const serviciosCatalogo = [
    { id: 1, nombre: 'Diagnóstico', categoria: 'Básico', precio: 25, descripcion: 'Evaluación inicial del equipo' },
    { id: 2, nombre: 'Limpieza interna', categoria: 'Mantenimiento', precio: 35, descripcion: 'Limpieza completa de componentes' },
    { id: 3, nombre: 'Cambio de placa madre', categoria: 'Reparación', precio: 150, descripcion: 'Reemplazo de placa madre defectuosa' },
    { id: 4, nombre: 'Instalación de SO', categoria: 'Software', precio: 40, descripcion: 'Instalación y configuración de sistema operativo' },
    { id: 5, nombre: 'Recuperación de datos', categoria: 'Datos', precio: 80, descripcion: 'Recuperación de archivos perdidos' },
    { id: 6, nombre: 'Reparación de pantalla', categoria: 'Reparación', precio: 120, descripcion: 'Cambio de pantalla LCD/LED' },
  ];

  // Función para cargar repuestos desde la base de datos
  const cargarRepuestos = async () => {
    try {
      const { data, error } = await supabase
        .from('repuestos')
        .select('*')
        .eq('disponible', true)
        .gt('cantidad', 0)
        .order('categoria');
      
      if (error) {
        console.error('Error cargando repuestos:', error);
        return;
      }
      
      // Mapear datos a la estructura esperada
      const repuestosMapeados = data.map(repuesto => ({
        id: repuesto.id,
        nombre: repuesto.item,
        categoria: repuesto.categoria || 'Sin categoría',
        precio: repuesto.precio_venta || 0,
        stock: repuesto.cantidad || 0,
        precio_compra: repuesto.precio_compra || 0
      }));
      
      setRepuestos(repuestosMapeados);
    } catch (error) {
      console.error('Error cargando repuestos:', error);
    }
  };

  useEffect(() => {
    if (open) {
      // Cargar catálogos
      setServicios(serviciosCatalogo);
      cargarRepuestos(); // Cargar desde la base de datos
      
      // Si hay una reparación seleccionada, cargar presupuesto existente o crear uno nuevo
      if (reparacion) {
        if (reparacion.presupuesto_json) {
          // Cargar presupuesto existente
          const presupuestoExistente = reparacion.presupuesto_json;
          setServiciosSeleccionados(presupuestoExistente.servicios || []);
          setRepuestosSeleccionados(presupuestoExistente.repuestos || []);
          setObservaciones(presupuestoExistente.observaciones || '');
        } else {
          // Nuevo presupuesto - limpiar selecciones
          setServiciosSeleccionados([]);
          setRepuestosSeleccionados([]);
          setObservaciones(`Presupuesto para ${reparacion.equipo_tipo} - ${reparacion.problema_reportado}`);
        }
      }
    }
  }, [open, reparacion]);

  if (!open) return null;

  // Funciones para manejar servicios
  const agregarServicio = (servicio) => {
    const servicioExistente = serviciosSeleccionados.find(s => s.id === servicio.id);
    if (servicioExistente) {
      setServiciosSeleccionados(prev => 
        prev.map(s => s.id === servicio.id ? { ...s, cantidad: s.cantidad + 1 } : s)
      );
    } else {
      setServiciosSeleccionados(prev => [...prev, { ...servicio, cantidad: 1 }]);
    }
  };

  const eliminarServicio = (servicioId) => {
    setServiciosSeleccionados(prev => prev.filter(s => s.id !== servicioId));
  };

  const actualizarCantidadServicio = (servicioId, cantidad) => {
    if (cantidad <= 0) {
      eliminarServicio(servicioId);
      return;
    }
    setServiciosSeleccionados(prev => 
      prev.map(s => s.id === servicioId ? { ...s, cantidad: parseInt(cantidad) } : s)
    );
  };

  const agregarServicioPersonalizado = () => {
    if (!servicioPersonalizado.nombre.trim() || !servicioPersonalizado.precio) {
      alert('Complete el nombre y precio del servicio');
      return;
    }

    const nuevoServicio = {
      id: `custom-${Date.now()}`,
      nombre: servicioPersonalizado.nombre,
      categoria: 'Personalizado',
      precio: parseFloat(servicioPersonalizado.precio),
      cantidad: 1,
      esPersonalizado: true
    };

    setServiciosSeleccionados(prev => [...prev, nuevoServicio]);
    setServicioPersonalizado({ nombre: '', precio: '' });
  };

  // Funciones para manejar repuestos
  const agregarRepuesto = (repuesto) => {
    // Verificar stock disponible
    if (repuesto.stock <= 0) {
      alert('Este repuesto no tiene stock disponible');
      return;
    }

    const repuestoExistente = repuestosSeleccionados.find(r => r.id === repuesto.id);
    
    if (repuestoExistente) {
      // Verificar que no exceda el stock disponible
      if (repuestoExistente.cantidad >= repuesto.stock) {
        alert(`Stock insuficiente. Solo hay ${repuesto.stock} unidades disponibles`);
        return;
      }
      
      setRepuestosSeleccionados(prev => 
        prev.map(r => r.id === repuesto.id ? { ...r, cantidad: r.cantidad + 1 } : r)
      );
    } else {
      // Crear repuesto para presupuesto con estructura completa
      const repuestoPresupuesto = {
        id: repuesto.id,
        nombre: repuesto.nombre,
        categoria: repuesto.categoria,
        precio: repuesto.precio, // precio_venta al momento del presupuesto
        cantidad: 1,
        stock_disponible: repuesto.stock // para verificación futura
      };
      
      setRepuestosSeleccionados(prev => [...prev, repuestoPresupuesto]);
    }
  };

  const eliminarRepuesto = (repuestoId) => {
    setRepuestosSeleccionados(prev => prev.filter(r => r.id !== repuestoId));
  };

  const actualizarCantidadRepuesto = (repuestoId, cantidad) => {
    if (cantidad <= 0) {
      eliminarRepuesto(repuestoId);
      return;
    }

    const cantidadNum = parseInt(cantidad);
    const repuestoSeleccionado = repuestosSeleccionados.find(r => r.id === repuestoId);
    
    if (repuestoSeleccionado && cantidadNum > repuestoSeleccionado.stock_disponible) {
      alert(`Stock insuficiente. Solo hay ${repuestoSeleccionado.stock_disponible} unidades disponibles`);
      return;
    }
    
    setRepuestosSeleccionados(prev => 
      prev.map(r => r.id === repuestoId ? { ...r, cantidad: cantidadNum } : r)
    );
  };

  const agregarRepuestoPersonalizado = () => {
    if (!repuestoPersonalizado.nombre.trim() || !repuestoPersonalizado.precio) {
      alert('Complete el nombre y precio del repuesto');
      return;
    }

    const nuevoRepuesto = {
      id: `custom-${Date.now()}`,
      nombre: repuestoPersonalizado.nombre,
      categoria: 'Terceros',
      precio: parseFloat(repuestoPersonalizado.precio),
      cantidad: 1,
      stock_disponible: 999, // Los repuestos de terceros no tienen límite de stock
      esTercero: true
    };

    setRepuestosSeleccionados(prev => [...prev, nuevoRepuesto]);
    setRepuestoPersonalizado({ nombre: '', precio: '' });
  };

  // Cálculos
  const subtotalServicios = serviciosSeleccionados.reduce((acc, s) => acc + (s.precio * s.cantidad), 0);
  const subtotalRepuestos = repuestosSeleccionados.reduce((acc, r) => acc + (r.precio * r.cantidad), 0);
  const subtotal = subtotalServicios + subtotalRepuestos;
  const total = subtotal;

  const handleGuardarPresupuesto = async () => {
    if (serviciosSeleccionados.length === 0 && repuestosSeleccionados.length === 0) {
      alert('Debe agregar al menos un servicio o repuesto');
      return;
    }

    const presupuestoData = {
      servicios: serviciosSeleccionados,
      repuestos: repuestosSeleccionados,
      subtotalServicios,
      subtotalRepuestos,
      subtotal,
      total,
      observaciones,
      fechaCreacion: new Date().toISOString()
    };

    try {
      setLoading(true);
      await guardarPresupuesto(reparacion.id, presupuestoData);
      alert('✅ Presupuesto guardado exitosamente');
      onClose();
    } catch (error) {
      console.error('Error guardando presupuesto:', error);
      alert('❌ Error al guardar el presupuesto: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-orange-600 text-white">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" /> 
            {reparacion?.presupuesto_json ? 'Editar Presupuesto' : 'Crear Presupuesto'}
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Información de la reparación */}
        {reparacion && (
          <div className="p-4 bg-gray-50 border-b">
            <h3 className="font-semibold text-gray-800 mb-2">Reparación: {reparacion.numero}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Cliente:</span> {reparacion.cliente_nombre}
              </div>
              <div>
                <span className="font-medium">Equipo:</span> {reparacion.equipo_tipo}
              </div>
              <div>
                <span className="font-medium">Modelo:</span> {reparacion.equipo_modelo}
              </div>
              <div>
                <span className="font-medium">Problema:</span> {reparacion.problema_reportado?.substring(0, 30)}...
              </div>
            </div>
          </div>
        )}

        <div className="flex h-[calc(95vh-200px)]">
          {/* Panel izquierdo: Servicios y Repuestos */}
          <div className="w-1/2 p-6 overflow-y-auto border-r">
            {/* Servicios */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-600" /> 
                Servicios Disponibles
              </h3>
              
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {servicios.map(servicio => (
                  <div
                    key={servicio.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-orange-50 cursor-pointer transition-colors"
                    onClick={() => agregarServicio(servicio)}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{servicio.nombre}</div>
                      <div className="text-xs text-gray-500">{servicio.categoria}</div>
                    </div>
                    <div className="text-sm font-semibold text-green-600">
                      ${servicio.precio}
                    </div>
                  </div>
                ))}
              </div>

              {/* Servicio personalizado */}
              <div className="bg-orange-50 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-3">Agregar Servicio Personalizado</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nombre del servicio"
                    value={servicioPersonalizado.nombre}
                    onChange={e => setServicioPersonalizado(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Precio"
                      value={servicioPersonalizado.precio}
                      onChange={e => setServicioPersonalizado(prev => ({ ...prev, precio: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <button
                      onClick={agregarServicioPersonalizado}
                      className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Repuestos */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" /> 
                Repuestos
              </h3>

              {/* Tabs para repuestos */}
              <div className="flex gap-2 mb-4">
                <button
                  className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                    tabRepuestos === 'stock' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setTabRepuestos('stock')}
                >
                  Del Stock
                </button>
                <button
                  className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                    tabRepuestos === 'terceros' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setTabRepuestos('terceros')}
                >
                  De Terceros
                </button>
              </div>

              {tabRepuestos === 'stock' && (
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {repuestos.map(repuesto => (
                    <div
                      key={repuesto.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-orange-50 cursor-pointer transition-colors"
                      onClick={() => agregarRepuesto(repuesto)}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{repuesto.nombre}</div>
                        <div className="text-xs text-gray-500">
                          {repuesto.categoria} - Stock: {repuesto.stock}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-green-600">
                        ${repuesto.precio}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tabRepuestos === 'terceros' && (
                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="font-medium text-sm mb-3">Agregar Repuesto de Terceros</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Nombre del repuesto"
                      value={repuestoPersonalizado.nombre}
                      onChange={e => setRepuestoPersonalizado(prev => ({ ...prev, nombre: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Precio"
                        value={repuestoPersonalizado.precio}
                        onChange={e => setRepuestoPersonalizado(prev => ({ ...prev, precio: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                      <button
                        onClick={agregarRepuestoPersonalizado}
                        className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Panel derecho: Items seleccionados y cálculos */}
          <div className="w-1/2 p-6 overflow-y-auto">
            {/* Items seleccionados */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-orange-600" /> 
                Items del Presupuesto
              </h3>

              {/* Servicios seleccionados */}
              {serviciosSeleccionados.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-sm text-gray-600 mb-2">Servicios</h4>
                  <div className="space-y-2">
                    {serviciosSeleccionados.map(servicio => (
                      <div key={servicio.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{servicio.nombre}</div>
                          <div className="text-xs text-gray-500">{servicio.categoria}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={servicio.cantidad}
                            onChange={e => actualizarCantidadServicio(servicio.id, e.target.value)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-center"
                          />
                          <span className="text-sm font-semibold w-16 text-right">
                            ${(servicio.precio * servicio.cantidad).toFixed(2)}
                          </span>
                          <button
                            onClick={() => eliminarServicio(servicio.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Repuestos seleccionados */}
              {repuestosSeleccionados.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-sm text-gray-600 mb-2">Repuestos</h4>
                  <div className="space-y-2">
                    {repuestosSeleccionados.map(repuesto => (
                      <div key={repuesto.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{repuesto.nombre}</div>
                          <div className="text-xs text-gray-500">
                            {repuesto.categoria} {repuesto.esTercero && '(Tercero)'}
                            {!repuesto.esTercero && ` - Stock: ${repuesto.stock_disponible}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={repuesto.cantidad}
                            onChange={e => actualizarCantidadRepuesto(repuesto.id, e.target.value)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-center"
                          />
                          <span className="text-sm font-semibold w-16 text-right">
                            ${(repuesto.precio * repuesto.cantidad).toFixed(2)}
                          </span>
                          <button
                            onClick={() => eliminarRepuesto(repuesto.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {serviciosSeleccionados.length === 0 && repuestosSeleccionados.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay items agregados al presupuesto</p>
                  <p className="text-sm">Selecciona servicios y repuestos del panel izquierdo</p>
                </div>
              )}
            </div>

            {/* Cálculos */}
            <div className="bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-800 mb-3">Cálculo del Presupuesto</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal servicios:</span>
                  <span className="font-semibold">${subtotalServicios.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal repuestos:</span>
                  <span className="font-semibold">${subtotalRepuestos.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                  </div>
                </div>
                
                
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold text-orange-700">
                    <span>TOTAL:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones del presupuesto
              </label>
              <textarea
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows="3"
                placeholder="Notas adicionales, condiciones, garantías..."
              />
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleGuardarPresupuesto}
                disabled={loading || (serviciosSeleccionados.length === 0 && repuestosSeleccionados.length === 0)}
                className="w-full bg-gradient-to-r from-purple-600 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                {loading ? 'Guardando...' : 'Guardar Presupuesto'}
              </button>
              <button
                onClick={onClose}
                disabled={loading}
                className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalPresupuesto;