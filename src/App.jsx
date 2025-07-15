import React, { useState, useEffect } from 'react';
import { Layout, CarritoWidget } from './shared/components/layout';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import Login from './components/Login';
import {
  ImportacionesSection,
  CotizacionesSection,
  PendientesCompraSection,
  EnTransitoSection,
  HistorialImportacionesSection
} from './modules/importaciones/components';
import { 
  Clientes,
  Listas,
  GestionFotos,
  Catalogo
} from './modules/ventas/components';
import {
  CargaEquiposUnificada,
  ReparacionesMain,
  RepuestosSection,
  MovimientosRepuestosSection,
  TesteoEquiposSection
} from './modules/soporte/components';
import {
  VentasSection,
  ComisionesSection,
  DashboardReportesSection,
  RecuentoStockSection,
  GarantiasSection
} from './modules/administracion/components';
import {
  PlanCuentasSection,
  LibroDiarioSection,
  LibroMayorSection,
  ConciliacionCajaSection,
  EstadoSituacionPatrimonialSection,
  EstadoResultadosSection,
  CuentasCorrientesSection,
  BalanceSumasYSaldosSection
} from './modules/contabilidad/components';

// 🔄 IMPORTS ACTUALIZADOS - Desde archivos modulares
import { useInventario } from './modules/ventas/hooks/useInventario';
import { useCelulares } from './modules/ventas/hooks/useCelulares';
import { useOtros } from './modules/ventas/hooks/useOtros';
import { useVentas } from './modules/ventas/hooks/useVentas';
import { useCarrito } from './lib/supabase'; // Este se queda en supabase.js
import { useClientes } from './modules/ventas/hooks/useClientes';
// import { useCuentasCorrientes } from './modules/administracion/hooks/useCuentasCorrientes';
import { useReparaciones } from './modules/soporte/hooks/useReparaciones';

// Componente principal protegido
const AppContent = () => {
  const { isAuthenticated, hasAccess } = useAuthContext();
  const [activeSection, setActiveSection] = useState('inventario');

 // 🖥️ Hooks para computadoras
 const {
   computers,
   loading: computersLoading,
   error: computersError,
   fetchComputers,
   addComputer,
   deleteComputer,
   updateComputer,
 } = useInventario();

 // 📱 Hooks para celulares
 const {
   celulares,
   loading: celularesLoading,
   error: celularesError,
   fetchCelulares,
   addCelular,
   deleteCelular,
   updateCelular
 } = useCelulares();

 // 📦 Hooks para otros productos
 const {
   otros,
   loading: otrosLoading,
   error: otrosError,
   fetchOtros,
   addOtro,
   deleteOtro,
   updateOtro
 } = useOtros();

 // 💰 Hooks para ventas
 const {
   ventas,
   loading: ventasLoading,
   error: ventasError,
   fetchVentas,
   registrarVenta,
   procesarCarrito,
   obtenerEstadisticas
 } = useVentas();

 // 🛒 Hook para carrito
 const {
   carrito,
   agregarAlCarrito,
   removerDelCarrito,
   actualizarCantidad,
   limpiarCarrito,
   calcularTotal,
   calcularCantidadTotal
 } = useCarrito();


 // 👥 Hook para clientes
 const {
   clientes,
   loading: clientesLoading,
   error: clientesError,
   fetchClientes
 } = useClientes();

 // 🏦 Hook para cuentas corrientes (NUEVO) - TEMPORALMENTE COMENTADO
 // const {
 //   registrarVentaFiado,
 //   fetchSaldos: fetchSaldosCuentasCorrientes,
 //   loading: cuentasCorrientesLoading,
 //   error: cuentasCorrientesError
 // } = useCuentasCorrientes();

 // ⚡ Inicialización al cargar la aplicación
 useEffect(() => {
   if (isAuthenticated) {
     console.log('🚀 Usuario autenticado - Conectando con Supabase');

     // 📊 Cargar datos iniciales solo si está autenticado
     fetchComputers();
     fetchCelulares();
     fetchOtros();
     fetchVentas();
     // fetchGastos(); // ELIMINADO
     fetchClientes();
     // fetchSaldosCuentasCorrientes(); // ✅ NUEVO - COMENTADO TEMPORALMENTE

     console.log('✅ Hooks de datos inicializados');
   }
 }, [isAuthenticated]); // Ejecutar cuando cambie el estado de autenticación

 // Verificar acceso a la sección activa
 useEffect(() => {
   if (isAuthenticated && !hasAccess(activeSection)) {
     // Si no tiene acceso a la sección activa, redirigir a la primera permitida
     const firstAllowedSection = ['inventario', 'carga-equipos', 'ventas', 'plan-cuentas']
       .find(section => hasAccess(section));
     if (firstAllowedSection) {
       setActiveSection(firstAllowedSection);
     }
   }
 }, [activeSection, isAuthenticated, hasAccess]);

 // 🗑️ Handlers para eliminar
 const handleDeleteComputer = async (id) => {
   if (window.confirm('¿Estás seguro de que quieres eliminar esta computadora?')) {
     try {
       await deleteComputer(id);
       alert('✅ Computadora eliminada exitosamente!');
     } catch (err) {
       alert('❌ Error al eliminar: ' + err.message);
     }
   }
 };

 const handleDeleteCelular = async (id) => {
   if (window.confirm('¿Estás seguro de que quieres eliminar este celular?')) {
     try {
       await deleteCelular(id);
       alert('✅ Celular eliminado exitosamente!');
     } catch (err) {
       alert('❌ Error al eliminar: ' + err.message);
     }
   }
 };

 const handleDeleteOtro = async (id) => {
   if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
     try {
       await deleteOtro(id);
       alert('✅ Producto eliminado exitosamente!');
     } catch (err) {
       alert('❌ Error al eliminar: ' + err.message);
     }
   }
 };

 // 💰 Handler para procesar venta individual (desde ProcesarVentaSection)
 const handleProcesarVenta = async (ventaData, tipoProducto, productoId) => {
   try {
     await registrarVenta(ventaData, tipoProducto, productoId);
     // Actualizar inventarios después de la venta
     if (tipoProducto === 'computadora') {
       fetchComputers();
     } else if (tipoProducto === 'celular') {
       fetchCelulares();
     } else {
       fetchOtros();
     }
     fetchVentas(); // Actualizar lista de ventas
   } catch (err) {
     throw err; // Re-lanzar para que el componente maneje el error
   }
 };

 // 🛒 Handler para procesar carrito completo (MODIFICADO)
 const handleProcesarCarrito = async (carritoItems, datosCliente) => {
   try {
     console.log('🛒 Procesando carrito con datos:', { carritoItems, datosCliente });

     // Procesar la venta en la base de datos (como siempre)
     const ventaResult = await procesarCarrito(carritoItems, datosCliente);
     console.log('✅ Venta procesada en BD:', ventaResult);

     // ✅ NUEVO: Si es cuenta corriente, registrar en cuentas corrientes
     if (datosCliente.esCuentaCorriente && datosCliente.metodo_pago === 'cuenta_corriente') {
       console.log('🏷️ Registrando venta en cuenta corriente...');
       
       await registrarVentaFiado({
         cliente_id: datosCliente.cliente_id,
         total: datosCliente.total,
         numeroTransaccion: datosCliente.numeroTransaccion,
         venta_id: ventaResult.id || ventaResult[0]?.id, // ID de la venta recién creada
         observaciones: datosCliente.observaciones,
         vendedor: datosCliente.vendedor
       });
       
       console.log('✅ Movimiento registrado en cuenta corriente');
       
       // Actualizar saldos de cuentas corrientes
       // await fetchSaldosCuentasCorrientes();
     }

     // Actualizar todos los inventarios (como siempre)
     fetchComputers();
     fetchCelulares();
     fetchOtros();
     fetchVentas();

     // Limpiar carrito
     limpiarCarrito();

     console.log('✅ Carrito procesado exitosamente');
     
   } catch (err) {
     console.error('❌ Error procesando carrito:', err);
     throw err;
   }
 };

 // ➕ Handler para agregar al carrito
 const handleAddToCart = (producto, tipo, cantidad = 1) => {
   // Validaciones específicas por tipo
   if (tipo === 'computadora' || tipo === 'celular') {
     // Para computadoras y celulares, solo se puede agregar 1
     if (cantidad > 1) {
       alert('Solo puedes agregar 1 unidad de computadoras y celulares');
       return;
     }
     // Verificar si ya está en el carrito
     const yaEnCarrito = carrito.find(item =>
       item.producto.id === producto.id && item.tipo === tipo
     );
     if (yaEnCarrito) {
       alert('Este producto ya está en el carrito');
       return;
     }
   } else if (tipo === 'otro') {
     // Para otros productos, verificar stock disponible
     const cantidadEnCarrito = carrito
       .filter(item => item.producto.id === producto.id && item.tipo === tipo)
       .reduce((total, item) => total + item.cantidad, 0);

     if (cantidadEnCarrito + cantidad > producto.cantidad) {
       alert(`Stock insuficiente. Disponible: ${producto.cantidad - cantidadEnCarrito}`);
       return;
     }
   }

   agregarAlCarrito(producto, tipo, cantidad);
   alert('✅ Producto agregado al carrito');
 };

 // 📊 Determinar estado general basado en la sección activa (MODIFICADO)
 const getCurrentStatus = () => {
   switch (activeSection) {
     case 'celulares':
       return {
         loading: celularesLoading,
         error: celularesError,
         count: celulares.length,
         type: 'celulares'
       };
     case 'otros':
       return {
         loading: otrosLoading,
         error: otrosError,
         count: otros.length,
         type: 'otros productos'
       };
     case 'procesar-venta':
     case 'ventas':
       return {
         loading: ventasLoading,
         error: ventasError,
         count: ventas.length,
         type: 'ventas'
       };
     case 'clientes':
       return {
         loading: clientesLoading,
         error: clientesError,
         count: clientes.length,
         type: 'clientes'
       };
     case 'cuentas-corrientes': // ✅ NUEVO
       return {
         loading: false, // cuentasCorrientesLoading,
         error: null, // cuentasCorrientesError,
         count: 0, // Se calculará dinámicamente
         type: 'cuentas corrientes'
       };
     case 'estado-situacion-patrimonial':
       return {
         loading: false,
         error: null,
         count: 0,
         type: 'estado situación patrimonial'
       };
     case 'estado-resultados':
       return {
         loading: false,
         error: null,
         count: 0,
         type: 'estado de resultados'
       };
     case 'balance-sumas-saldos':
       return {
         loading: false,
         error: null,
         count: 0,
         type: 'balance de sumas y saldos'
       };
     case 'carga-equipos':
       // Para carga de equipos, mostrar un estado combinado
       return {
         loading: computersLoading || celularesLoading || otrosLoading,
         error: computersError || celularesError || otrosError,
         count: computers.length + celulares.length + otros.length,
         type: 'productos totales'
       };
     case 'plan-cuentas':
     case 'libro-diario':
       return {
         loading: false,
         error: null,
         count: 0,
         type: 'contabilidad'
       };
     default:
       return {
         loading: computersLoading,
         error: computersError,
         count: computers.length,
         type: 'computadoras'
       };
   }
 };

 const status = getCurrentStatus();

 const getStatusColor = () => {
   if (status.error) return 'text-red-600 bg-red-50 border-red-200';
   if (status.loading) return 'text-blue-600 bg-blue-50 border-blue-200';
   return 'text-green-600 bg-green-50 border-green-200';
 };

 const getStatusIcon = () => {
   if (status.error) return '❌';
   if (status.loading) return '🔄';
   return '✅';
 };

 const getStatusText = () => {
   if (status.error) return `Error: ${status.error}`;
   if (status.loading) return 'Conectando con Supabase...';
   if (status.type === 'contabilidad') return 'Módulo contable activo';
   if (status.type === 'cuentas corrientes') return 'Sistema de cuentas corrientes activo';
   return `${status.count} ${status.type} en Supabase`;
 };

 const handleRetry = () => {
   switch (activeSection) {
     case 'celulares':
       fetchCelulares();
       break;
     case 'otros':
       fetchOtros();
       break;
     case 'procesar-venta':
     case 'ventas':
       fetchVentas();
       break;
     case 'clientes':
       fetchClientes();
       break;
     case 'cuentas-corrientes': // ✅ NUEVO
       // fetchSaldosCuentasCorrientes();
       break;
     case 'estado-situacion-patrimonial':
       // No requiere fetch específico
       break;
     case 'estado-resultados':
       // No requiere fetch específico
       break;
     case 'carga-equipos':
       fetchComputers();
       fetchCelulares();
       fetchOtros();
       break;
     default:
       fetchComputers();
   }
 };

 // Protección de acceso a secciones
 const handleSectionChange = (newSection) => {
   if (hasAccess(newSection)) {
     setActiveSection(newSection);
   } else {
     console.warn('Acceso denegado a la sección:', newSection);
   }
 };

 return (
   <Layout
     activeSection={activeSection}
     setActiveSection={handleSectionChange}
   >
     {/* 📋 Renderizado de secciones protegidas */}
     {activeSection === 'importaciones' && hasAccess('importaciones') && (
       <ImportacionesSection />
     )}
     {activeSection === 'cotizaciones' && hasAccess('importaciones') && (
       <CotizacionesSection />
     )}
     {activeSection === 'pendientes-compra' && hasAccess('importaciones') && (
       <PendientesCompraSection />
     )}
     {activeSection === 'en-transito' && hasAccess('importaciones') && (
       <EnTransitoSection />
     )}
     {activeSection === 'historial-importaciones' && hasAccess('importaciones') && (
       <HistorialImportacionesSection />
     )}
     {/* 📋 CATÁLOGO UNIFICADO */}
     {(activeSection === 'catalogo-unificado' || activeSection === 'inventario') && hasAccess('inventario') && (
       <Catalogo onAddToCart={handleAddToCart} />
     )}


     {activeSection === 'carga-equipos' && hasAccess('carga-equipos') && (
       <CargaEquiposUnificada
         onAddComputer={addComputer}
         onAddCelular={addCelular}
         onAddOtro={addOtro}
         loading={computersLoading || celularesLoading || otrosLoading}
       />
     )}

     {activeSection === 'reparaciones' && hasAccess('reparaciones') && (
       <ReparacionesMain />
     )}




     {activeSection === 'ventas' && hasAccess('ventas') && (
       <VentasSection
         ventas={ventas}
         loading={ventasLoading}
         error={ventasError}
         onLoadStats={obtenerEstadisticas}
       />
     )}

     {/* 👥 SECCIÓN DE CLIENTES */}
     {activeSection === 'clientes' && hasAccess('clientes') && (
       <Clientes />
     )}

     {/* 🏦 NUEVA SECCIÓN DE CUENTAS CORRIENTES */}
     {activeSection === 'cuentas-corrientes' && hasAccess('cuentas-corrientes') && (
       <CuentasCorrientesSection />
     )}

     {activeSection === 'gestion-fotos' && hasAccess('gestion-fotos') && (
       <GestionFotos
         computers={computers}
         celulares={celulares}
         otros={otros}
         loading={computersLoading || celularesLoading || otrosLoading}
         error={computersError || celularesError || otrosError}
       />
     )}


     {/* 📊 SECCIONES DE CONTABILIDAD */}
     {activeSection === 'plan-cuentas' && hasAccess('plan-cuentas') && (
       <PlanCuentasSection />
     )}

     {activeSection === 'libro-diario' && hasAccess('libro-diario') && (
       <LibroDiarioSection />
     )}

     {/* ELIMINADO: reporte-movimientos ya no existe */}

     {activeSection === 'libro-mayor' && hasAccess('libro-mayor') && (
       <LibroMayorSection />
     )}

     {activeSection === 'conciliacion-caja' && hasAccess('conciliacion-caja') && (
       <ConciliacionCajaSection />
     )}

     {activeSection === 'estado-situacion-patrimonial' && hasAccess('estado-situacion-patrimonial') && (
       <EstadoSituacionPatrimonialSection />
     )}

     {activeSection === 'estado-resultados' && hasAccess('estado-resultados') && (
       <EstadoResultadosSection />
     )}

     {activeSection === 'balance-sumas-saldos' && hasAccess('balance-sumas-saldos') && (
       <BalanceSumasYSaldosSection />
     )}

     {activeSection === 'recuento-stock' && hasAccess('recuento-stock') && (
       <RecuentoStockSection />
     )}

     {activeSection === 'repuestos' && hasAccess('repuestos') && (
       <RepuestosSection />
     )}

     {activeSection === 'movimientos-repuestos' && hasAccess('movimientos-repuestos') && (
       <MovimientosRepuestosSection />
     )}


     {activeSection === 'testeo-equipos' && hasAccess('testeo-equipos') && (
       <TesteoEquiposSection />
     )}

     {activeSection === 'dashboard-reportes' && hasAccess('dashboard-reportes') && (
       <DashboardReportesSection />
     )}

     {activeSection === 'garantias' && hasAccess('garantias') && (
       <GarantiasSection />
     )}

     {activeSection === 'comisiones' && hasAccess('comisiones') && (
       <ComisionesSection
         ventas={ventas}
         loading={ventasLoading}
         error={ventasError}
         onLoadStats={obtenerEstadisticas}
       />
     )}

     {activeSection === 'copys' && hasAccess('copys') && (
       <Listas
         computers={computers}
         celulares={celulares}
         otros={otros}
         loading={computersLoading || celularesLoading || otrosLoading}
         error={computersError || celularesError || otrosError}
       />
     )}

     {/* 🛒 Widget del carrito flotante */}
     <CarritoWidget
       carrito={carrito}
       onUpdateCantidad={actualizarCantidad}
       onRemover={removerDelCarrito}
       onLimpiar={limpiarCarrito}
       onProcesarVenta={handleProcesarCarrito}
     />
   </Layout>
 );
};

// Componente principal de la aplicación con autenticación
const App = () => {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
};

// Componente que maneja login vs contenido principal
const AppWithAuth = () => {
  const { isAuthenticated, loading, error, login } = useAuthContext();
  // Mostrar loading mientras se verifica autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-900">
            Verificando autenticación...
          </p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    return <Login onLogin={login} error={error} loading={loading} />;
  }

  // Si está autenticado, mostrar la aplicación principal
  return <AppContent />;
};

export default App;
