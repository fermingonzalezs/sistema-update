import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import InventarioSection from './components/InventarioSection';
import AgregarSection from './components/AgregarSection';
import CelularesSection from './components/CelularesSection';
import AgregarCelularSection from './components/AgregarCelularSection';
import OtrosSection from './components/OtrosSection';
import AgregarOtroSection from './components/AgregarOtroSection';
import ProcesarVentaSection from './components/ProcesarVentaSection';
import VentasSection from './components/VentasSection';
import CarritoWidget from './components/CarritoWidget';
import { useInventario, useCelulares, useOtros, useVentas, useCarrito } from './lib/supabase';

const App = () => {
  const [activeSection, setActiveSection] = useState('inventario');
  
  // Hooks para computadoras
  const {
    computers,
    loading: computersLoading,
    error: computersError,
    fetchComputers,
    addComputer,
    deleteComputer
  } = useInventario();

  // Hooks para celulares
  const {
    celulares,
    loading: celularesLoading,
    error: celularesError,
    fetchCelulares,
    addCelular,
    deleteCelular
  } = useCelulares();

  // Hooks para otros productos
  const {
    otros,
    loading: otrosLoading,
    error: otrosError,
    fetchOtros,
    addOtro,
    deleteOtro
  } = useOtros();

  // Hooks para ventas
  const {
    ventas,
    loading: ventasLoading,
    error: ventasError,
    fetchVentas,
    registrarVenta,
    procesarCarrito,
    obtenerEstadisticas
  } = useVentas();

  // Hook para carrito
  const {
    carrito,
    agregarAlCarrito,
    removerDelCarrito,
    actualizarCantidad,
    limpiarCarrito,
    calcularTotal,
    calcularCantidadTotal
  } = useCarrito();

  useEffect(() => {
    console.log('🚀 Aplicación iniciada - Conectando con Supabase');
    fetchComputers();
    fetchCelulares();
    fetchOtros();
    fetchVentas();
  }, []);

  // Handlers para eliminar
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

  // Handler para procesar venta individual (desde ProcesarVentaSection)
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

  // Handler para procesar carrito completo
  const handleProcesarCarrito = async (carritoItems, datosCliente) => {
    try {
      await procesarCarrito(carritoItems, datosCliente);
      
      // Actualizar todos los inventarios
      fetchComputers();
      fetchCelulares();
      fetchOtros();
      fetchVentas();
      
      // Limpiar carrito
      limpiarCarrito();
    } catch (err) {
      throw err;
    }
  };

  // Handler para agregar al carrito
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

  // Determinar estado general basado en la sección activa
  const getCurrentStatus = () => {
    switch (activeSection) {
      case 'celulares':
      case 'agregar-celular':
        return {
          loading: celularesLoading,
          error: celularesError,
          count: celulares.length,
          type: 'celulares'
        };
      case 'otros':
      case 'agregar-otro':
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
    return `${status.count} ${status.type} en Supabase`;
  };

  const handleRetry = () => {
    switch (activeSection) {
      case 'celulares':
      case 'agregar-celular':
        fetchCelulares();
        break;
      case 'otros':
      case 'agregar-otro':
        fetchOtros();
        break;
      case 'procesar-venta':
      case 'ventas':
        fetchVentas();
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
              </div>
            )}
          </div>

          {/* Renderizado de secciones */}
          {activeSection === 'inventario' && (
            <InventarioSection 
              computers={computers} 
              loading={computersLoading} 
              error={computersError}
              onDelete={handleDeleteComputer}
              onAddToCart={handleAddToCart}
            />
          )}
          
          {activeSection === 'agregar' && (
            <AgregarSection 
              onAdd={addComputer}
              loading={computersLoading}
            />
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
          
          {activeSection === 'agregar-celular' && (
            <AgregarCelularSection 
              onAdd={addCelular}
              loading={celularesLoading}
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
          
          {activeSection === 'agregar-otro' && (
            <AgregarOtroSection 
              onAdd={addOtro}
              loading={otrosLoading}
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
        </main>
      </div>

      {/* Widget del carrito flotante */}
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