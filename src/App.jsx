import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Login from './components/auth/Login';
import SetupPassword from './components/auth/SetupPassword';
import AppRoutes from './routes';
import { CarritoWidget } from './shared/components/layout';
import { useAppContext } from './context/AppContext';

// Componente principal protegido con rutas
const AppContent = () => {
  const {
    carrito,
    actualizarCantidad,
    actualizarPrecio,
    removerDelCarrito,
    limpiarCarrito,
    procesarCarrito
  } = useAppContext();

  return (
    <>
      <AppRoutes />
      {/* 🛒 Widget del carrito flotante */}
      <CarritoWidget
        carrito={carrito}
        onUpdateCantidad={actualizarCantidad}
        onUpdatePrecio={actualizarPrecio}
        onRemover={removerDelCarrito}
        onLimpiar={limpiarCarrito}
        onProcesarVenta={procesarCarrito}
      />
    </>
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
      throw err;
    }
  };

  // Manejar cuando se establece la contraseña
  const handlePasswordSet = () => {
    setNeedsPasswordSetup(null);
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

  // Si está autenticado, mostrar la aplicación principal con AppProvider
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
