
import React, { useState, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const location = useLocation();
  const closeTimeoutRef = useRef(null);
  const openTimeoutRef = useRef(null);

  // Derive active section from pathname
  const getActiveSection = () => {
    const path = location.pathname.replace('/', '').replace(/\//g, '-');
    return path || 'catalogo';
  };

  const handleMouseEnter = () => {
    // Cancel any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    // Delay opening by 1 second
    openTimeoutRef.current = setTimeout(() => {
      setIsSidebarHovered(true);
    }, 1000);
  };

  const handleMouseLeave = () => {
    // Cancel any pending open timeout
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    // Delay closing by 1 second
    closeTimeoutRef.current = setTimeout(() => {
      setIsSidebarHovered(false);
    }, 1000);
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar - Collapsed by default, expands on hover with 1s delay on close */}
      <div
        className="flex-shrink-0"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Sidebar
          activeSection={getActiveSection()}
          isCollapsed={!isSidebarHovered}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        <Header
          activeSection={getActiveSection()}
          isSidebarCollapsed={!isSidebarHovered}
        />
        <main className="flex-1 p-8 overflow-y-auto bg-slate-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
