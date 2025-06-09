import React from 'react';

const Header = () => {
  const currentDate = new Date();
  
  return (
    <header className="shadow-sm border-b bg-slate-800 border-slate-700">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            
            
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-200">
                {currentDate.toLocaleDateString('es-AR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  timeZone: 'America/Argentina/Buenos_Aires'
                })}
              </div>
              <div className="text-xs text-slate-400">
                {currentDate.toLocaleTimeString('es-AR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'America/Argentina/Buenos_Aires'
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