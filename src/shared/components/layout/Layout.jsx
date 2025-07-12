
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';

const Layout = ({ activeSection, setActiveSection, cantidadCarrito, children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Función para forzar que la sidebar se mantenga abierta
  const forceSidebarOpen = () => {
    console.log('🚨 LAYOUT - Forzando sidebar a permanecer abierta');
    setSidebarOpen(true);
  };

  // Asegurar que la sidebar esté visible en desktop al cargar
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        console.log('🖼️ LAYOUT - Screen size >= 1024, opening sidebar');
        setSidebarOpen(true);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Efecto adicional para mantener la sidebar siempre abierta en desktop
  useEffect(() => {
    const keepSidebarOpen = () => {
      if (window.innerWidth >= 1024 && !isSidebarOpen) {
        console.log('🚨 LAYOUT - Detectado que sidebar se cerró en desktop, reabriendo...');
        setSidebarOpen(true);
      }
    };

    // Verificar cada 1 segundo si la sidebar sigue abierta (menos agresivo)
    const interval = setInterval(keepSidebarOpen, 1000);
    
    return () => clearInterval(interval);
  }, [isSidebarOpen]);

  // Debug: Log estados para detectar cuando se oculta la sidebar
  useEffect(() => {
    console.log('🖼️ LAYOUT - Sidebar states changed:', { 
      isSidebarOpen, 
      isSidebarCollapsed,
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack
    });
  }, [isSidebarOpen, isSidebarCollapsed]);

  // Debug: Log cuando el componente se monta/desmonta
  useEffect(() => {
    console.log('🖼️ LAYOUT - Component mounted');
    return () => {
      console.log('🖼️ LAYOUT - Component will unmount');
    };
  }, []);

  // Debug: Detectar cambios en activeSection que podrían afectar sidebar
  useEffect(() => {
    console.log('🖼️ LAYOUT - activeSection changed to:', activeSection);
  }, [activeSection]);

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 text-white rounded-r-lg transform transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-16' : 'w-80'
        } ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0 overflow-hidden`}
      >
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          cantidadCarrito={cantidadCarrito}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        <Header 
          activeSection={activeSection}
          cantidadCarrito={cantidadCarrito}
          isSidebarCollapsed={isSidebarCollapsed}
          onShowSidebar={forceSidebarOpen}
        />
        <main className="flex-1 p-8 overflow-y-auto bg-slate-200">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
