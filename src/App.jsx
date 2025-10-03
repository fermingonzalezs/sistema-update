import React, { useState, useEffect } from 'react';
import { Layout, CarritoWidget } from './shared/components/layout';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import Login from './components/auth/Login';
import SetupPassword from './components/auth/SetupPassword';
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
  Catalogo,
  RegistrarVentaSection
} from './modules/ventas/components';
import {
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
  GarantiasSection,
  IngresoEquiposSection
} from './modules/administracion/components';
import {
  PlanCuentasSection,
  LibroDiarioSection,
  LibroMayorSection,
  ConciliacionCajaSection,
  EstadoSituacionPatrimonialSection,
  EstadoResultadosSection,
  CuentasCorrientesSection,
  BalanceSumasYSaldosSection,
  CuentasAuxiliaresSection
} from './modules/contabilidad/components';
import ComprasSection from './modules/compras/components/ComprasSection';

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
   actualizarPrecio,
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

 // Verificar acceso a la sección activa - simplificado
 useEffect(() => {
   if (isAuthenticated && activeSection === '') {
     // Si está autenticado y no hay sección activa, ir a inventario por defecto
     setActiveSection('inventario');
   }
 }, [activeSection, isAuthenticated]);

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
     // Para otros productos, verificar stock disponible por sucursal
     const cantidadEnCarrito = carrito
       .filter(item => item.producto.id === producto.id && item.tipo === tipo)
       .reduce((total, item) => total + item.cantidad, 0);

     // ✅ CALCULAR STOCK TOTAL CONSIDERANDO AMBAS SUCURSALES
     const stockLaPlata = producto.cantidad_la_plata || 0;
     const stockMitre = producto.cantidad_mitre || 0;
     const stockTotal = stockLaPlata + stockMitre;
     
     console.log(`📊 Validando stock para producto "${producto.nombre_producto}":`, {
       stockLaPlata,
       stockMitre,
       stockTotal,
       cantidadEnCarrito,
       cantidadSolicitada: cantidad
     });

     if (cantidadEnCarrito + cantidad > stockTotal) {
       alert(`Stock insuficiente. Disponible: ${stockTotal - cantidadEnCarrito} unidades\n\n` +
             `📍 La Plata: ${stockLaPlata} unidades\n` +
             `📍 Mitre: ${stockMitre} unidades\n\n` +
             `💡 Puedes mover stock entre sucursales si es necesario.`);
       return;
     }

     // ✅ ADVERTENCIA si no hay stock suficiente en La Plata (sucursal por defecto)
     if (stockLaPlata < (cantidadEnCarrito + cantidad) && stockTotal >= (cantidadEnCarrito + cantidad)) {
       const stockNecesarioDeOtraSucursal = (cantidadEnCarrito + cantidad) - stockLaPlata;
       alert(`⚠️ Advertencia: Solo hay ${stockLaPlata} unidades en La Plata.\n\n` +
             `Se necesitarán ${stockNecesarioDeOtraSucursal} unidades de la sucursal Mitre.\n\n` +
             `💡 Asegúrate de tener el stock disponible en la sucursal de venta.`);
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
     case 'cuentas-auxiliares':
       return {
         loading: false,
         error: null,
         count: 3, // Número de cuentas con auxiliares
         type: 'cuentas auxiliares'
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
     case 'cuentas-auxiliares':
       // fetchCuentasAuxiliares();
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

 // Cambio de sección simplificado
 const handleSectionChange = (newSection) => {
   setActiveSection(newSection);
 };

 return (
   <Layout
     activeSection={activeSection}
     setActiveSection={handleSectionChange}
   >
     {/* 📋 Renderizado de secciones */}
     {activeSection === 'importaciones' && (
       <ImportacionesSection />
     )}
     {activeSection === 'cotizaciones' && (
       <CotizacionesSection />
     )}
     {activeSection === 'pendientes-compra' && (
       <PendientesCompraSection />
     )}
     {activeSection === 'en-transito' && (
       <EnTransitoSection />
     )}
     {activeSection === 'historial-importaciones' && (
       <HistorialImportacionesSection />
     )}
     {/* 📋 CATÁLOGO UNIFICADO */}
     {(activeSection === 'catalogo-unificado' || activeSection === 'inventario') && (
       <Catalogo onAddToCart={handleAddToCart} onNavigate={handleSectionChange} />
     )}



     {activeSection === 'reparaciones' && (
       <ReparacionesMain />
     )}




     {activeSection === 'ventas' && (
       <VentasSection
         ventas={ventas}
         loading={ventasLoading}
         error={ventasError}
         onLoadStats={obtenerEstadisticas}
       />
     )}

     {/* 👥 SECCIÓN DE CLIENTES */}
     {activeSection === 'clientes' && (
       <Clientes />
     )}

     {/* 🛒 NUEVA SECCIÓN REGISTRAR VENTA */}
     {activeSection === 'registrar-venta' && (
       <RegistrarVentaSection />
     )}

     {/* 🏦 NUEVA SECCIÓN DE CUENTAS CORRIENTES */}
     {activeSection === 'cuentas-corrientes' && (
       <CuentasCorrientesSection />
     )}
     {/* 📊 NUEVA SECCIÓN DE CUENTAS AUXILIARES */}
     {activeSection === 'cuentas-auxiliares' && (
       <CuentasAuxiliaresSection />
     )}
     {/* 🛒 NUEVA SECCIÓN DE COMPRAS */}
     {activeSection === 'compras' && (
       <ComprasSection />
     )}

     {/* 📊 SECCIONES DE CONTABILIDAD */}
     {activeSection === 'plan-cuentas' && (
       <PlanCuentasSection />
     )}

     {activeSection === 'libro-diario' && (
       <LibroDiarioSection />
     )}

     {/* ELIMINADO: reporte-movimientos ya no existe */}

     {activeSection === 'libro-mayor' && (
       <LibroMayorSection />
     )}

     {activeSection === 'conciliacion-caja' && (
       <ConciliacionCajaSection />
     )}

     {activeSection === 'estado-situacion-patrimonial' && (
       <EstadoSituacionPatrimonialSection />
     )}

     {activeSection === 'estado-resultados' && (
       <EstadoResultadosSection />
     )}

     {activeSection === 'balance-sumas-saldos' && (
       <BalanceSumasYSaldosSection />
     )}

     {activeSection === 'recuento-stock' && (
       <RecuentoStockSection />
     )}

     {activeSection === 'repuestos' && (
       <RepuestosSection />
     )}

     {activeSection === 'movimientos-repuestos' && (
       <MovimientosRepuestosSection />
     )}


     {activeSection === 'testeo-equipos' && (
       <TesteoEquiposSection />
     )}

     {activeSection === 'dashboard-reportes' && (
       <DashboardReportesSection />
     )}

     {activeSection === 'garantias' && (
       <GarantiasSection />
     )}

     {activeSection === 'ingreso-equipos' && (
       <IngresoEquiposSection />
     )}

     {activeSection === 'comisiones' && (
       <ComisionesSection
         ventas={ventas}
         loading={ventasLoading}
         error={ventasError}
         onLoadStats={obtenerEstadisticas}
       />
     )}

     {activeSection === 'copys' && (
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
       onUpdatePrecio={actualizarPrecio}
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
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(null);

  // Manejar resultado del login
  const handleLogin = async (username, password) => {
    try {
      const result = await login(username, password);
      
      if (result && result.needsPasswordSetup) {
        setNeedsPasswordSetup({
          emailOrUsername: result.email || result.username,
          displayName: result.nombre
        });
      }
    } catch (err) {
      // Error manejado por el hook useAuth
      throw err;
    }
  };

  // Manejar cuando se establece la contraseña
  const handlePasswordSet = () => {
    setNeedsPasswordSetup(null);
    // Recargar la página para reiniciar el flujo de login
    window.location.reload();
  };

  // Volver al login desde configuración de contraseña
  const handleBackToLogin = () => {
    setNeedsPasswordSetup(null);
  };


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


  // Si necesita configurar contraseña
  if (needsPasswordSetup) {
    return (
      <SetupPassword
        emailOrUsername={needsPasswordSetup.emailOrUsername}
        displayName={needsPasswordSetup.displayName}
        onPasswordSet={handlePasswordSet}
        onBack={handleBackToLogin}
      />
    );
  }

  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    return (
      <Login 
        onLogin={handleLogin} 
        error={error} 
        loading={loading}
      />
    );
  }

  // Si está autenticado, mostrar la aplicación principal
  return <AppContent />;
};

export default App;
