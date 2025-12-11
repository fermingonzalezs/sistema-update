
import React, { useState, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  // Derive active section from pathname
  const getActiveSection = () => {
    const path = location.pathname.replace('/', '').replace(/\//g, '-');
    return path || 'catalogo';
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar - Manual toggle */}
      <div className="flex-shrink-0">
        <Sidebar
          activeSection={getActiveSection()}
          isCollapsed={isCollapsed}
          toggleSidebar={toggleSidebar}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        <Header
          activeSection={getActiveSection()}
          isSidebarCollapsed={isCollapsed}
        />
        <main className="flex-1 p-8 overflow-y-auto bg-slate-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
