
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ activeSection, setActiveSection, children }) => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar - Siempre fija y visible */}
      <div className="flex-shrink-0">
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        <Header 
          activeSection={activeSection}
          isSidebarCollapsed={isSidebarCollapsed}
        />
        <main className="flex-1 p-8 overflow-y-auto bg-slate-200">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
