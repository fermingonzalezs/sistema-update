import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import InventarioSection from './components/InventarioSection';
import CargaEquiposUnificada from './components/CargaEquiposUnificada';
import CelularesSection from './components/CelularesSection';
import OtrosSection from './components/OtrosSection';
import ProcesarVentaSection from './components/ProcesarVentaSection';
import VentasSection from './components/VentasSection';
import CarritoWidget from './components/CarritoWidget';
import ReparacionesSection from './components/ReparacionesSection';
import PlanCuentasSection from './components/PlanCuentasSection';
import LibroDiarioSection from './components/LibroDiarioSection';
import ReporteMovimientosSection from './components/ReporteMovimientosSection';
import LibroMayorSection from './components/LibroMayorSection';
import ConciliacionCajaSection from './components/ConciliacionCajaSection';
import RecuentoStockSection from './components/RecuentoStockSection';
import RepuestosSection from './components/RepuestosSection';
import RecuentoRepuestosSection from './components/RecuentoRepuestosSection';
import PresupuestosReparacionSection from './components/PresupuestosReparacionSection';
import DashboardReportesSection from './components/DashboardReportesSection';
import ComisionesSection from './components/ComisionesSection';
import GestionFotosSection from './components/GestionFotosSection';
import CopysSection from './components/CopysSection';
import GastosOperativosSection from './components/GastosOperativosSection';
import ClientesSection from './components/ClientesSection';
import CuentasCorrientesSection from './components/CuentasCorrientesSection'; // ✅ NUEVO

// 🔄 IMPORTS ACTUALIZADOS - Desde archivos modulares
import { useInventario } from './lib/inventario.js';
import { useCelulares } from './lib/celulares.js';
import { useOtros } from './lib/otros.js';
import { useVentas } from './lib/ventas.js';
import { useCarrito } from './lib/supabase.js'; // Este se queda en supabase.js
import { useGastosOperativos } from './lib/gastosOperativos.js';
import { useClientes } from './lib/clientes.js';
import { useCuentasCorrientes } from './lib/cuentasCorrientes.js'; // ✅ NUEVO

const App = () => {
 const [activeSection, setActiveSection] = useState('inventario');

 // 🖥️ Hooks para computadoras
 const {
   computers,
   loading: computersLoading,
   error: computersError,
   fetchComputers,
   addComputer,
   deleteComputer
 } = useInventario();

 // 📱 Hooks para celulares
 const {
   celulares,
   loading: celularesLoading,
   error: celularesError,
   fetchCelulares,
   addCelular,
   deleteCelular
 } = useCelulares();

 // 📦 Hooks para otros productos
 const {
   otros,
   loading: otrosLoading,
   error: otrosError,
   fetchOtros,
   addOtro,
   deleteOtro
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

 // 💸 Hook para gastos operativos
 const {
   gastos,
   loading: gastosLoading,
   error: gastosError,
   fetchGastos,
   crearGasto,
   actualizarGasto,
   eliminarGasto
 } = useGastosOperativos();

 // 👥 Hook para clientes
 const {
   clientes,
   loading: clientesLoading,
   error: clientesError,
   fetchClientes
 } = useClientes();

 // 🏦 Hook para cuentas corrientes (NUEVO)
 const {
   registrarVentaFiado,
   fetchSaldos: fetchSaldosCuentasCorrientes,
   loading: cuentasCorrientesLoading,
   error: cuentasCorrientesError
 } = useCuentasCorrientes();

 // ⚡ Inicialización al cargar la aplicación
 useEffect(() => {
   console.log('🚀 Aplicación iniciada - Conectando con Supabase');

   // 📊 Cargar datos iniciales
   fetchComputers();
   fetchCelulares();
   fetchOtros();
   fetchVentas();
   fetchGastos();
   fetchClientes();
   fetchSaldosCuentasCorrientes(); // ✅ NUEVO

   console.log('✅ Hooks de datos inicializados');
 }, []); // ✅ Sin dependencias para evitar loops infinitos

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
       await fetchSaldosCuentasCorrientes();
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
     case 'gastos-operativos':
       return {
         loading: gastosLoading,
         error: gastosError,
         count: gastos.length,
         type: 'gastos operativos'
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
         loading: cuentasCorrientesLoading,
         error: cuentasCorrientesError,
         count: 0, // Se calculará dinámicamente
         type: 'cuentas corrientes'
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
   if (status.error) return 'bg-red-100 text-red-800 border-red-200';
   if (status.loading) return 'bg-blue-100 text-blue-800 border-blue-200';
   return 'bg-green-100 text-green-800 border-green-200';
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
     case 'gastos-operativos':
       fetchGastos();
       break;
     case 'clientes':
       fetchClientes();
       break;
     case 'cuentas-corrientes': // ✅ NUEVO
       fetchSaldosCuentasCorrientes();
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

 return (
   <div className="flex h-screen bg-gray-100">
     <Sidebar
       activeSection={activeSection}
       setActiveSection={setActiveSection}
       cantidadCarrito={calcularCantidadTotal()}
     />
     <div className="flex-1 flex flex-col overflow-hidden">
       <Header />
       <main className="flex-1 overflow-auto">
         {/* Panel de estado */}
         <div className={`m-6 p-4 rounded-lg border-l-4 ${getStatusColor()}`}>
           <div className="flex items-center space-x-2">
             <span className="text-lg">{getStatusIcon()}</span>
             <span className="font-medium">{getStatusText()}</span>
           </div>
           {status.error && (
             <div className="mt-2 text-sm">
               <button
                 onClick={handleRetry}
                 className="text-red-600 hover:underline"
               >
                 Reintentar conexión
               </button>
             </div>
           )}
           {!status.error && !status.loading && (
             <div className="mt-2 text-sm opacity-75">
               🚀 Conectado exitosamente a PostgreSQL via Supabase
               <br />
               👥 Sistema de clientes: Activo y funcionando
               <br />
               🏦 Sistema de cuentas corrientes: Activo y funcionando
               {status.type === 'contabilidad' && (
                 <>
                   <br />
                   📊 Sistema contable: Plan de cuentas y libro diario disponibles
                 </>
               )}
             </div>
           )}
         </div>

         {/* 📋 Renderizado de secciones */}
         {activeSection === 'inventario' && (
           <InventarioSection
             computers={computers}
             loading={computersLoading}
             error={computersError}
             onDelete={handleDeleteComputer}
             onAddToCart={handleAddToCart}
           />
         )}

         {activeSection === 'carga-equipos' && (
           <CargaEquiposUnificada
             onAddComputer={addComputer}
             onAddCelular={addCelular}
             onAddOtro={addOtro}
             loading={computersLoading || celularesLoading || otrosLoading}
           />
         )}

         {activeSection === 'reparaciones' && (
           <ReparacionesSection />
         )}

         {activeSection === 'celulares' && (
           <CelularesSection
             celulares={celulares}
             loading={celularesLoading}
             error={celularesError}
             onDelete={handleDeleteCelular}
             onAddToCart={handleAddToCart}
           />
         )}

         {activeSection === 'otros' && (
           <OtrosSection
             otros={otros}
             loading={otrosLoading}
             error={otrosError}
             onDelete={handleDeleteOtro}
             onAddToCart={handleAddToCart}
           />
         )}

         {activeSection === 'procesar-venta' && (
           <ProcesarVentaSection
             onVenta={handleProcesarVenta}
             loading={ventasLoading}
             carrito={carrito}
             onAddToCart={handleAddToCart}
           />
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
           <ClientesSection />
         )}

         {/* 🏦 NUEVA SECCIÓN DE CUENTAS CORRIENTES */}
         {activeSection === 'cuentas-corrientes' && (
           <CuentasCorrientesSection />
         )}

         {activeSection === 'gestion-fotos' && (
           <GestionFotosSection
             computers={computers}
             celulares={celulares}
             otros={otros}
             loading={computersLoading || celularesLoading || otrosLoading}
             error={computersError || celularesError || otrosError}
           />
         )}

         {activeSection === 'presupuestos-reparacion' && (
           <PresupuestosReparacionSection />
         )}

         {/* 📊 SECCIONES DE CONTABILIDAD */}
         {activeSection === 'plan-cuentas' && (
           <PlanCuentasSection />
         )}

         {activeSection === 'libro-diario' && (
           <LibroDiarioSection />
         )}

         {activeSection === 'reporte-movimientos' && (
           <ReporteMovimientosSection />
         )}

         {activeSection === 'libro-mayor' && (
           <LibroMayorSection />
         )}

         {activeSection === 'conciliacion-caja' && (
           <ConciliacionCajaSection />
         )}

         {/* 💰 SECCIÓN DE GASTOS OPERATIVOS */}
         {activeSection === 'gastos-operativos' && (
           <GastosOperativosSection />
         )}

         {activeSection === 'recuento-stock' && (
           <RecuentoStockSection />
         )}

         {activeSection === 'repuestos' && (
           <RepuestosSection />
         )}

         {activeSection === 'recuento-repuestos' && (
           <RecuentoRepuestosSection />
         )}

         {activeSection === 'dashboard-reportes' && (
           <DashboardReportesSection />
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
           <CopysSection
             computers={computers}
             celulares={celulares}
             otros={otros}
             loading={computersLoading || celularesLoading || otrosLoading}
             error={computersError || celularesError || otrosError}
           />
         )}

       </main>
     </div>

     {/* 🛒 Widget del carrito flotante */}
     <CarritoWidget
       carrito={carrito}
       onUpdateCantidad={actualizarCantidad}
       onRemover={removerDelCarrito}
       onLimpiar={limpiarCarrito}
       onProcesarVenta={handleProcesarCarrito}
     />
   </div>
 );
};

export default App;