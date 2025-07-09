
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';

const Layout = ({ activeSection, setActiveSection, cantidadCarrito, children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 text-white shadow-2xl transform transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-0' : 'w-72'
        } ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0 overflow-hidden`}
      >
        <div className={`${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
          <Sidebar
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            cantidadCarrito={cantidadCarrito}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>
      </div>


      {/* Content */}
      <div className="flex-1 flex flex-col">
        <Header activeSection={activeSection}>
          <button
            className="lg:hidden text-slate-200"
            onClick={() => setSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </Header>
        <main className="flex-1 p-3 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
