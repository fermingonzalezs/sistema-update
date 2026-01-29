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

  // Renderizado condicional
  return (
    <AppProvider>
      <div className="relative h-screen w-screen overflow-hidden">
        <div className={`h-full w-full transition-all duration-500 ease-in-out ${!isAuthenticated || loading ? 'filter blur-[8px] scale-[1.01] pointer-events-none select-none brightness-50' : 'filter-none'}`}>
          <AppContent />
        </div>

        {/* Loading Overlay - Spinning Logo */}
        {loading && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div className="w-24 h-24 flex items-center justify-center bg-slate-800/50 rounded-full cursor-default border border-slate-700/50 backdrop-blur-sm shadow-lg animate-pulse">
              <img
                src="/logo.png"
                alt="Cargando..."
                className="w-16 h-16 object-contain drop-shadow-lg animate-[spin_3s_linear_infinite]"
              />
            </div>
          </div>
        )}

        {/* Login Overlay */}
        {!isAuthenticated && !loading && (
          <Login
            onLogin={handleLogin}
            error={error}
            loading={loading}
          />
        )}
      </div>
    </AppProvider>
  );
};

export default App;
