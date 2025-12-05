import React, { createContext, useContext, useState, useEffect } from 'react';
import { useInventario } from '../modules/ventas/hooks/useInventario';
import { useCelulares } from '../modules/ventas/hooks/useCelulares';
import { useOtros } from '../modules/ventas/hooks/useOtros';
import { useVentas } from '../modules/ventas/hooks/useVentas';
import { useCarrito } from '../lib/supabase';
import { useClientes } from '../modules/ventas/hooks/useClientes';
import { useAuthContext } from './AuthContext';

const AppContext = createContext(null);

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within AppProvider');
    }
    return context;
};

export const AppProvider = ({ children }) => {
    const { isAuthenticated } = useAuthContext();

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

    // ⚡ Inicialización al cargar la aplicación
    useEffect(() => {
        if (isAuthenticated) {
            console.log('🚀 Usuario autenticado - Conectando con Supabase');
            fetchComputers();
            fetchCelulares();
            fetchOtros();
            fetchVentas();
            fetchClientes();
            console.log('✅ Hooks de datos inicializados');
        }
    }, [isAuthenticated]);

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

    // 💰 Handler para procesar venta individual
    const handleProcesarVenta = async (ventaData, tipoProducto, productoId) => {
        try {
            await registrarVenta(ventaData, tipoProducto, productoId);
            if (tipoProducto === 'computadora') {
                fetchComputers();
            } else if (tipoProducto === 'celular') {
                fetchCelulares();
            } else {
                fetchOtros();
            }
            fetchVentas();
        } catch (err) {
            throw err;
        }
    };

    // 🛒 Handler para procesar carrito completo
    const handleProcesarCarrito = async (carritoItems, datosCliente) => {
        try {
            console.log('🛒 Procesando carrito con datos:', { carritoItems, datosCliente });
            const ventaResult = await procesarCarrito(carritoItems, datosCliente);
            console.log('✅ Venta procesada en BD:', ventaResult);

            fetchComputers();
            fetchCelulares();
            fetchOtros();
            fetchVentas();
            limpiarCarrito();

            console.log('✅ Carrito procesado exitosamente');
        } catch (err) {
            console.error('❌ Error procesando carrito:', err);
            throw err;
        }
    };

    // ➕ Handler para agregar al carrito
    const handleAddToCart = (producto, tipo, cantidad = 1, categoria = null) => {
        console.log('🛒 handleAddToCart llamado:', { producto: producto.nombre_producto || producto.modelo, tipo, cantidad, categoria });

        if (tipo === 'computadora' || tipo === 'celular') {
            if (cantidad > 1) {
                alert('Solo puedes agregar 1 unidad de computadoras y celulares');
                return;
            }
            const yaEnCarrito = carrito.find(item =>
                item.producto.id === producto.id && item.tipo === tipo
            );
            if (yaEnCarrito) {
                alert('Este producto ya está en el carrito');
                return;
            }
        } else if (tipo === 'otro') {
            const cantidadEnCarrito = carrito
                .filter(item => item.producto.id === producto.id && item.tipo === tipo)
                .reduce((total, item) => total + item.cantidad, 0);

            const stockLaPlata = producto.cantidad_la_plata || 0;
            const stockMitre = producto.cantidad_mitre || 0;
            const stockTotal = stockLaPlata + stockMitre;

            if (cantidadEnCarrito + cantidad > stockTotal) {
                alert(`Stock insuficiente. Disponible: ${stockTotal - cantidadEnCarrito} unidades\n\n` +
                    `📍 La Plata: ${stockLaPlata} unidades\n` +
                    `📍 Mitre: ${stockMitre} unidades`);
                return;
            }

            if (stockLaPlata < (cantidadEnCarrito + cantidad) && stockTotal >= (cantidadEnCarrito + cantidad)) {
                const stockNecesarioDeOtraSucursal = (cantidadEnCarrito + cantidad) - stockLaPlata;
                alert(`⚠️ Advertencia: Solo hay ${stockLaPlata} unidades en La Plata.\n\n` +
                    `Se necesitarán ${stockNecesarioDeOtraSucursal} unidades de la sucursal Mitre.`);
            }
        }

        agregarAlCarrito(producto, tipo, cantidad, categoria);
        alert('✅ Producto agregado al carrito');
    };

    const value = {
        // Productos
        computers,
        computersLoading,
        computersError,
        fetchComputers,
        addComputer,
        deleteComputer: handleDeleteComputer,
        updateComputer,

        celulares,
        celularesLoading,
        celularesError,
        fetchCelulares,
        addCelular,
        deleteCelular: handleDeleteCelular,
        updateCelular,

        otros,
        otrosLoading,
        otrosError,
        fetchOtros,
        addOtro,
        deleteOtro: handleDeleteOtro,
        updateOtro,

        // Ventas
        ventas,
        ventasLoading,
        ventasError,
        fetchVentas,
        registrarVenta,
        procesarCarrito: handleProcesarCarrito,
        obtenerEstadisticas,

        // Carrito
        carrito,
        agregarAlCarrito,
        removerDelCarrito,
        actualizarCantidad,
        actualizarPrecio,
        limpiarCarrito,
        calcularTotal,
        calcularCantidadTotal,
        handleAddToCart,

        // Clientes
        clientes,
        clientesLoading,
        clientesError,
        fetchClientes,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export default AppContext;
