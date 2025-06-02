import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Save, Download, Search, User, Laptop, Settings, Calculator, Eye, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Servicio para Presupuestos de Reparación
const presupuestosReparacionService = {
  async getServicios() {
    console.log('🔧 Obteniendo servicios...');

    const { data, error } = await supabase
      .from('servicios_reparacion')
      .select('*')
      .eq('activo', true)
      .order('categoria', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo servicios:', error);
      throw error;
    }

    console.log(`✅ ${data.length} servicios obtenidos`);
    return data;
  },

  async getRepuestos() {
    console.log('🔧 Obteniendo repuestos...');

    const { data, error } = await supabase
      .from('repuestos')
      .select('*')
      .eq('disponible', true)
      .gt('cantidad', 0)
      .order('categoria', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo repuestos:', error);
      throw error;
    }

    console.log(`✅ ${data.length} repuestos obtenidos`);
    return data;
  },

  async crearServicio(servicio) {
    const { data, error } = await supabase
      .from('servicios_reparacion')
      .insert([{
        nombre: servicio.nombre,
        descripcion: servicio.descripcion,
        categoria: servicio.categoria,
        precio: parseFloat(servicio.precio),
        activo: true
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  async guardarPresupuesto(presupuestoData) {
    console.log('💾 Guardando presupuesto...');

    const { data, error } = await supabase
      .from('presupuestos_reparacion')
      .insert([{
        numero_presupuesto: presupuestoData.numero,
        cliente_nombre: presupuestoData.cliente.nombre,
        cliente_telefono: presupuestoData.cliente.telefono,
        cliente_dni: presupuestoData.cliente.dni,
        cliente_direccion: presupuestoData.cliente.direccion,
        equipo_tipo: presupuestoData.equipo.tipo,
        equipo_serial: presupuestoData.equipo.serial,
        equipo_backup: presupuestoData.equipo.backup,
        equipo_accesorios: presupuestoData.equipo.accesorios,
        falla_reportada: presupuestoData.falla,
        diagnostico: presupuestoData.diagnostico,
        accion_requerida: presupuestoData.accion,
        items_presupuesto: JSON.stringify(presupuestoData.items),
        subtotal: presupuestoData.subtotal,
        descuentos: presupuestoData.descuentos,
        total: presupuestoData.total,
        garantia_dias: presupuestoData.garantia || 30,
        observaciones: presupuestoData.observaciones,
        estado: 'pendiente'
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  async getPresupuestos() {
    const { data, error } = await supabase
      .from('presupuestos_reparacion')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getNextNumeroPresupuesto() {
    const año = new Date().getFullYear();
    
    const { data, error } = await supabase
      .from('presupuestos_reparacion')
      .select('numero_presupuesto')
      .ilike('numero_presupuesto', `PRES-${año}-%`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error obteniendo número:', error);
      return `PRES-${año}-001`;
    }

    const siguienteNumero = (data?.length || 0) + 1;
    const numeroFormateado = String(siguienteNumero).padStart(3, '0');
    
    return `PRES-${año}-${numeroFormateado}`;
  }
};

// Hook personalizado
function usePresupuestosReparacion() {
  const [servicios, setServicios] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [serviciosData, repuestosData, presupuestosData] = await Promise.all([
        presupuestosReparacionService.getServicios(),
        presupuestosReparacionService.getRepuestos(),
        presupuestosReparacionService.getPresupuestos()
      ]);

      setServicios(serviciosData);
      setRepuestos(repuestosData);
      setPresupuestos(presupuestosData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const crearServicio = async (servicio) => {
    try {
      setError(null);
      const nuevo = await presupuestosReparacionService.crearServicio(servicio);
      setServicios(prev => [nuevo, ...prev]);
      return nuevo;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const guardarPresupuesto = async (presupuestoData) => {
    try {
      setError(null);
      const numero = await presupuestosReparacionService.getNextNumeroPresupuesto();
      const nuevo = await presupuestosReparacionService.guardarPresupuesto({
        ...presupuestoData,
        numero
      });
      setPresupuestos(prev => [nuevo, ...prev]);
      return nuevo;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    servicios,
    repuestos,
    presupuestos,
    loading,
    error,
    fetchDatos,
    crearServicio,
    guardarPresupuesto
  };
}

// Componente principal
const PresupuestosReparacionSection = () => {
  const {
    servicios,
    repuestos,
    presupuestos,
    loading,
    error,
    fetchDatos,
    crearServicio,
    guardarPresupuesto
  } = usePresupuestosReparacion();

  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);
  const [presupuestoActual, setPresupuestoActual] = useState(null);
  const [filtroServicios, setFiltroServicios] = useState('');
  const [filtroRepuestos, setFiltroRepuestos] = useState('');

  // Estado del formulario de presupuesto
  const [formData, setFormData] = useState({
    cliente: {
      nombre: '',
      telefono: '',
      dni: '',
      direccion: ''
    },
    equipo: {
      tipo: '',
      serial: '',
      backup: '',
      accesorios: ''
    },
    falla: '',
    diagnostico: '',
    accion: '',
    items: [],
    garantia: 30,
    observaciones: ''
  });

  // Items personalizados
  const [itemPersonalizado, setItemPersonalizado] = useState({
    descripcion: '',
    precio: ''
  });

  useEffect(() => {
    console.log('🚀 Cargando datos de presupuestos...');
    fetchDatos();
  }, []);

  const nuevoPresupuesto = () => {
    setFormData({
      cliente: { nombre: '', telefono: '', dni: '', direccion: '' },
      equipo: { tipo: '', serial: '', backup: '', accesorios: '' },
      falla: '',
      diagnostico: '',
      accion: '',
      items: [],
      garantia: 30,
      observaciones: ''
    });
    setMostrarModal(true);
  };

  const agregarServicio = (servicio) => {
    const item = {
      id: `servicio-${servicio.id}`,
      tipo: 'servicio',
      descripcion: servicio.nombre,
      categoria: servicio.categoria,
      precio: servicio.precio,
      cantidad: 1
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));
  };

  const agregarRepuesto = (repuesto) => {
    const item = {
      id: `repuesto-${repuesto.id}`,
      tipo: 'repuesto',
      descripcion: repuesto.item,
      categoria: repuesto.categoria,
      precio: repuesto.precio_venta,
      cantidad: 1
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));
  };

  const agregarItemPersonalizado = () => {
    if (!itemPersonalizado.descripcion || !itemPersonalizado.precio) {
      alert('Complete la descripción y precio del item');
      return;
    }

    const item = {
      id: `personalizado-${Date.now()}`,
      tipo: 'personalizado',
      descripcion: itemPersonalizado.descripcion,
      categoria: 'Personalizado',
      precio: parseFloat(itemPersonalizado.precio),
      cantidad: 1
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));

    setItemPersonalizado({ descripcion: '', precio: '' });
  };

  const eliminarItem = (itemId) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const actualizarCantidadItem = (itemId, cantidad) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, cantidad: parseInt(cantidad) || 1 } : item
      )
    }));
  };

  const actualizarPrecioItem = (itemId, precio) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, precio: parseFloat(precio) || 0 } : item
      )
    }));
  };

  const calcularTotales = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const descuentos = 0; // Por ahora sin descuentos
    const total = subtotal - descuentos;

    return { subtotal, descuentos, total };
  };

  const guardarYGenerarPDF = async () => {
    // Validaciones básicas
    if (!formData.cliente.nombre) {
      alert('El nombre del cliente es obligatorio');
      return;
    }
    if (formData.items.length === 0) {
      alert('Debe agregar al menos un item al presupuesto');
      return;
    }

    try {
      const { subtotal, descuentos, total } = calcularTotales();
      
      const presupuestoData = {
        ...formData,
        subtotal,
        descuentos,
        total
      };

      const presupuesto = await guardarPresupuesto(presupuestoData);
      setPresupuestoActual(presupuesto);
      setMostrarModal(false);
      setMostrarVistaPrevia(true);
      
      alert('✅ Presupuesto creado exitosamente');
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  const generarPDF = () => {
    // Aquí implementarías la generación del PDF
    // Por ahora, mostraremos la vista previa
    window.print();
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD'
    }).format(valor);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  const serviciosFiltrados = servicios.filter(servicio =>
    filtroServicios === '' || 
    servicio.nombre.toLowerCase().includes(filtroServicios.toLowerCase()) ||
    servicio.categoria.toLowerCase().includes(filtroServicios.toLowerCase())
  );

  const repuestosFiltrados = repuestos.filter(repuesto =>
    filtroRepuestos === '' ||
    repuesto.item.toLowerCase().includes(filtroRepuestos.toLowerCase()) ||
    repuesto.categoria.toLowerCase().includes(filtroRepuestos.toLowerCase())
  );

  const { subtotal, descuentos, total } = calcularTotales();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando datos...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <FileText size={28} />
              <div>
                <h1 className="text-2xl font-bold">Presupuestos de Reparación</h1>
                <p className="text-blue-100 mt-1">Genera presupuestos profesionales para clientes</p>
              </div>
            </div>
            <button
              onClick={nuevoPresupuesto}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 flex items-center gap-2 font-medium transition-colors"
            >
              <Plus size={18} />
              Nuevo Presupuesto
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 m-6">
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Lista de presupuestos */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Presupuestos Recientes ({presupuestos.length})
          </h3>
          
          {presupuestos.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {presupuestos.slice(0, 6).map(presupuesto => (
                <div key={presupuesto.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-mono text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded mb-2 inline-block">
                        {presupuesto.numero_presupuesto}
                      </div>
                      <h4 className="font-semibold text-gray-800">{presupuesto.cliente_nombre}</h4>
                      <p className="text-sm text-gray-600">{presupuesto.equipo_tipo}</p>
                      <p className="text-xs text-gray-500">{formatearFecha(presupuesto.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        {formatearMoneda(presupuesto.total)}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        presupuesto.estado === 'aprobado' ? 'bg-green-100 text-green-800' :
                        presupuesto.estado === 'rechazado' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {presupuesto.estado}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={() => {
                        setPresupuestoActual(presupuesto);
                        setMostrarVistaPrevia(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                    >
                      <Eye size={14} />
                      Ver
                    </button>
                    <button
                      onClick={() => {
                        setPresupuestoActual(presupuesto);
                        generarPDF();
                      }}
                      className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1"
                    >
                      <Download size={14} />
                      PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">No hay presupuestos creados</p>
              <button
                onClick={nuevoPresupuesto}
                className="text-blue-600 hover:underline"
              >
                Crear primer presupuesto
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nuevo Presupuesto */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-7xl max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Nuevo Presupuesto de Reparación</h3>
                <button
                  onClick={() => setMostrarModal(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Panel izquierdo: Formulario */}
                <div className="space-y-6">
                  {/* Información del cliente */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <User size={20} className="mr-2" />
                      Información del Cliente
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                        <input
                          type="text"
                          value={formData.cliente.nombre}
                          onChange={(e) => setFormData({
                            ...formData,
                            cliente: { ...formData.cliente, nombre: e.target.value }
                          })}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          placeholder="Nombre completo del cliente"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input
                          type="text"
                          value={formData.cliente.telefono}
                          onChange={(e) => setFormData({
                            ...formData,
                            cliente: { ...formData.cliente, telefono: e.target.value }
                          })}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          placeholder="Número de teléfono"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                        <input
                          type="text"
                          value={formData.cliente.dni}
                          onChange={(e) => setFormData({
                            ...formData,
                            cliente: { ...formData.cliente, dni: e.target.value }
                          })}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          placeholder="DNI del cliente"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                        <input
                          type="text"
                          value={formData.cliente.direccion}
                          onChange={(e) => setFormData({
                            ...formData,
                            cliente: { ...formData.cliente, direccion: e.target.value }
                          })}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          placeholder="Dirección del cliente"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Información del equipo */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Laptop size={20} className="mr-2" />
                      Información del Equipo
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Equipo</label>
                        <input
                          type="text"
                          value={formData.equipo.tipo}
                          onChange={(e) => setFormData({
                            ...formData,
                            equipo: { ...formData.equipo, tipo: e.target.value }
                          })}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          placeholder="ej: Laptop ThinkPad L15"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Serial</label>
                        <input
                          type="text"
                          value={formData.equipo.serial}
                          onChange={(e) => setFormData({
                            ...formData,
                            equipo: { ...formData.equipo, serial: e.target.value }
                          })}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          placeholder="Número de serie"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Backup</label>
                        <select
                          value={formData.equipo.backup}
                          onChange={(e) => setFormData({
                            ...formData,
                            equipo: { ...formData.equipo, backup: e.target.value }
                          })}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        >
                          <option value="">Seleccionar...</option>
                          <option value="ENTREGADA">ENTREGADA</option>
                          <option value="NO ENTREGADA">NO ENTREGADA</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Accesorios</label>
                        <input
                          type="text"
                          value={formData.equipo.accesorios}
                          onChange={(e) => setFormData({
                            ...formData,
                            equipo: { ...formData.equipo, accesorios: e.target.value }
                          })}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          placeholder="ej: Cargador, mouse"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Diagnóstico */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Settings size={20} className="mr-2" />
                      Diagnóstico
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Falla Reportada</label>
                        <textarea
                          value={formData.falla}
                          onChange={(e) => setFormData({ ...formData, falla: e.target.value })}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          rows="2"
                          placeholder="Descripción de la falla reportada por el cliente"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico</label>
                        <textarea
                          value={formData.diagnostico}
                          onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          rows="3"
                          placeholder="Diagnóstico técnico detallado"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Acción Requerida</label>
                        <textarea
                          value={formData.accion}
                          onChange={(e) => setFormData({ ...formData, accion: e.target.value })}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          rows="2"
                          placeholder="Acciones necesarias para la reparación"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panel derecho: Items y totales */}
                <div className="space-y-6">
                  {/* Agregar servicios */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Agregar Servicios</h4>
                    <div className="mb-3">
                      <input
                        type="text"
                        value={filtroServicios}
                        onChange={(e) => setFiltroServicios(e.target.value)}
                        placeholder="Buscar servicios..."
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="max-h-32 overflow-y-auto border border-gray-200 rounded">
                      {serviciosFiltrados.map(servicio => (
                        <div
                          key={servicio.id}
                          className="p-2 border-b hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                          onClick={() => agregarServicio(servicio)}
                        >
                          <div>
                            <div className="text-sm font-medium">{servicio.nombre}</div>
                            <div className="text-xs text-gray-500">{servicio.categoria}</div>
                          </div>
                          <div className="text-sm font-semibold text-green-600">
                            {formatearMoneda(servicio.precio)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Agregar repuestos */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Agregar Repuestos</h4>
                    <div className="mb-3">
                      <input
                        type="text"
                        value={filtroRepuestos}
                        onChange={(e) => setFiltroRepuestos(e.target.value)}
                        placeholder="Buscar repuestos..."
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="max-h-32 overflow-y-auto border border-gray-200 rounded">
                      {repuestosFiltrados.map(repuesto => (
                        <div
                          key={repuesto.id}
                          className="p-2 border-b hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                          onClick={() => agregarRepuesto(repuesto)}
                        >
                          <div>
                            <div className="text-sm font-medium">{repuesto.item}</div>
                            <div className="text-xs text-gray-500">{repuesto.categoria} - Stock: {repuesto.cantidad}</div>
                          </div>
                          <div className="text-sm font-semibold text-green-600">
                            {formatearMoneda(repuesto.precio_venta)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Agregar item personalizado */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Agregar Item Personalizado</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={itemPersonalizado.descripcion}
                        onChange={(e) => setItemPersonalizado({
                          ...itemPersonalizado,
                          descripcion: e.target.value
                        })}
                        placeholder="ej: Monitor 24' Samsung"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          step="0.01"
                          value={itemPersonalizado.precio}
                          onChange={(e) => setItemPersonalizado({
                            ...itemPersonalizado,
                            precio: e.target.value
                          })}
                          placeholder="Precio"
                          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                        <button
                          onClick={agregarItemPersonalizado}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Lista de items agregados */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Items del Presupuesto</h4>
                    <div className="border border-gray-200 rounded">
                      {formData.items.length > 0 ? (
                        <div className="divide-y">
                          {formData.items.map(item => (
                            <div key={item.id} className="p-3">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{item.descripcion}</div>
                                  <div className="text-xs text-gray-500">{item.categoria}</div>
                                  <div className="flex items-center space-x-2 mt-2">
                                    <label className="text-xs text-gray-600">Cant:</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={item.cantidad}
                                      onChange={(e) => actualizarCantidadItem(item.id, e.target.value)}
                                      className="w-16 px-2 py-1 border border-gray-300 rounded text-xs"
                                    />
                                    <label className="text-xs text-gray-600">Precio:</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={item.precio}
                                      onChange={(e) => actualizarPrecioItem(item.id, e.target.value)}
                                      className="w-20 px-2 py-1 border border-gray-300 rounded text-xs"
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="text-sm font-semibold">
                                    {formatearMoneda(item.precio * item.cantidad)}
                                  </div>
                                  <button
                                    onClick={() => eliminarItem(item.id)}
                                    className="text-red-600 hover:text-red-800 p-1"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-gray-500">
                          No hay items agregados al presupuesto
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Totales */}
                  <div className="border border-gray-200 rounded p-4 bg-gray-50">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>{formatearMoneda(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Descuentos:</span>
                        <span>-{formatearMoneda(descuentos)}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-bold text-lg">
                          <span>TOTAL:</span>
                          <span className="text-green-600">{formatearMoneda(total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Garantía y observaciones */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Garantía (días)</label>
                      <input
                        type="number"
                        value={formData.garantia}
                        onChange={(e) => setFormData({ ...formData, garantia: parseInt(e.target.value) || 30 })}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                      <textarea
                        value={formData.observaciones}
                        onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        rows="3"
                        placeholder="Observaciones adicionales del presupuesto"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setMostrarModal(false)}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={guardarYGenerarPDF}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Save size={16} />
                Guardar y Generar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Vista Previa del Presupuesto */}
      {mostrarVistaPrevia && presupuestoActual && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">Vista Previa del Presupuesto</h3>
              <div className="flex space-x-2">
                <button
                  onClick={generarPDF}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                >
                  <Download size={16} />
                  Descargar PDF
                </button>
                <button
                  onClick={() => setMostrarVistaPrevia(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Contenido del PDF */}
            <div className="p-8 bg-white" id="presupuesto-pdf">
              {/* Header empresarial */}
              <div className="border-b-2 border-blue-600 pb-6 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold text-blue-600">UPDATE TECH</h1>
                    <p className="text-gray-600">Reparación de Equipos</p>
                    <p className="text-sm text-gray-500">CUIT: 30-71826065-2</p>
                    <p className="text-sm text-gray-500">Calle 13 N° 718 Oficina 10</p>
                    <p className="text-sm text-gray-500">La Plata, Buenos Aires, Argentina</p>
                    <p className="text-sm text-gray-500">221 641 9101</p>
                  </div>
                  <div className="text-right">
                    <div className="bg-blue-600 text-white px-4 py-2 rounded mb-2">
                      <h2 className="text-xl font-bold">Presupuesto de reparación</h2>
                    </div>
                    <p className="text-sm text-gray-600">Ingreso: {formatearFecha(presupuestoActual.created_at)}</p>
                    <p className="text-sm text-gray-600">N° de orden: {presupuestoActual.numero_presupuesto}</p>
                  </div>
                </div>
              </div>

              {/* Información del cliente y equipo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-blue-600 mb-3">Información del cliente</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Nombre:</span> {presupuestoActual.cliente_nombre}</p>
                    <p><span className="font-medium">Teléfono:</span> {presupuestoActual.cliente_telefono}</p>
                    <p><span className="font-medium">DNI:</span> {presupuestoActual.cliente_dni}</p>
                    <p><span className="font-medium">Dirección:</span> {presupuestoActual.cliente_direccion}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-600 mb-3">Información del equipo</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Equipo:</span> {presupuestoActual.equipo_tipo}</p>
                    <p><span className="font-medium">Serial:</span> {presupuestoActual.equipo_serial}</p>
                    <p><span className="font-medium">Backup:</span> {presupuestoActual.equipo_backup}</p>
                    <p><span className="font-medium">Accesorios:</span> {presupuestoActual.equipo_accesorios}</p>
                  </div>
                </div>
              </div>

              {/* Diagnóstico */}
              <div className="mb-6">
                <div className="bg-gray-50 p-4 rounded">
                  <div className="mb-3">
                    <h4 className="font-semibold text-gray-800">Falla:</h4>
                    <p className="text-sm text-gray-700">{presupuestoActual.falla_reportada}</p>
                  </div>
                  <div className="mb-3">
                    <h4 className="font-semibold text-gray-800">Diagnóstico:</h4>
                    <p className="text-sm text-gray-700">{presupuestoActual.diagnostico}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Acción requerida:</h4>
                    <p className="text-sm text-gray-700">{presupuestoActual.accion_requerida}</p>
                  </div>
                </div>
              </div>

              {/* Tabla de items */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-blue-600 mb-3">Descripción</h3>
                <table className="w-full border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2 text-left">Descripción</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Cantidad</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Precio Unitario</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Precio Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {JSON.parse(presupuestoActual.items_presupuesto || '[]').map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-4 py-2">{item.descripcion}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{item.cantidad}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">{formatearMoneda(item.precio)}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">{formatearMoneda(item.precio * item.cantidad)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totales */}
              <div className="flex justify-end mb-6">
                <div className="w-64">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatearMoneda(presupuestoActual.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Descuentos:</span>
                      <span>-{formatearMoneda(presupuestoActual.descuentos)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>TOTAL:</span>
                        <span className="text-blue-600">{formatearMoneda(presupuestoActual.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Garantía y términos */}
              <div className="text-sm text-gray-700 space-y-2">
                <p><span className="font-medium">Garantía:</span> {presupuestoActual.garantia_dias} días</p>
                <p><span className="font-medium">Tiempo de entrega:</span> 30 días hábiles desde la aprobación del presupuesto</p>
                <p className="text-xs text-gray-600 mt-4">
                  Si el equipo no fuera retirado dentro de los 90 días, a partir de la fecha de ingreso al taller, será 
                  considerado abandonado, perdiendo todo tipo de derecho de propiedad sobre el mismo y/o sobre los materiales 
                  que contiene. De ello se dispondrá en el concepto de gastos por depósito y estadía.
                </p>
              </div>

              {/* Firma */}
              <div className="mt-8 text-center">
                <div className="border-t border-gray-400 w-64 mx-auto pt-2">
                  <p className="text-sm font-medium">Firma y aclaración: UPDATE TECH S.R.L</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresupuestosReparacionSection;