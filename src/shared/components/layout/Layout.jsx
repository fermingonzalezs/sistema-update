
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const getActiveSection = () => {
    const path = location.pathname.replace('/', '').replace(/\//g, '-');
    return path || 'catalogo';
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar
        activeSection={getActiveSection()}
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeSection={getActiveSection()}
          isSidebarCollapsed={isCollapsed}
          onToggleMobileSidebar={() => setIsMobileOpen(true)}
        />
        <main className="flex-1 p-3 md:p-8 overflow-auto bg-slate-200">
          <Outlet context={{ isSidebarCollapsed: isCollapsed }} />
        </main>
      </div>
    </div>
  );
};

export default Layout;
