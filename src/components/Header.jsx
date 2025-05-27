import React from 'react';

const Header = () => {
  const currentDate = new Date();
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-2 rounded-lg">
              <span className="text-lg font-bold">💻</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
              EL FOKING SISTEMITA
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-700">
                {currentDate.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div className="text-xs text-gray-500">
                {currentDate.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;