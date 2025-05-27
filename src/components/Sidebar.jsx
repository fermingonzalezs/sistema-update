import React from 'react';
import { ShoppingCart, Plus, Package, Smartphone, PlusCircle, BarChart3, ShoppingBag, Box } from 'lucide-react';

const Sidebar = ({ activeSection, setActiveSection, cantidadCarrito = 0 }) => {
  const menuGroups = [
    {
      title: 'COMPUTADORAS',
      items: [
        { 
          id: 'inventario', 
          label: 'Stock', 
          icon: Package,
          description: 'Ver inventario'
        },
        { 
          id: 'agregar', 
          label: 'Agregar', 
          icon: Plus,
          description: 'Nueva computadora'
        }
      ]
    },
    {
      title: 'CELULARES',
      items: [
        { 
          id: 'celulares', 
          label: 'Stock', 
          icon: Smartphone,
          description: 'Ver celulares'
        },
        { 
          id: 'agregar-celular', 
          label: 'Agregar', 
          icon: PlusCircle,
          description: 'Nuevo celular'
        }
      ]
    },
    {
      title: 'OTROS',
      items: [
        { 
          id: 'otros', 
          label: 'Stock', 
          icon: Box,
          description: 'Ver productos'
        },
        { 
          id: 'agregar-otro', 
          label: 'Agregar', 
          icon: Plus,
          description: 'Nuevo producto'
        }
      ]
    },
    {
      title: 'VENTAS',
      items: [
        { 
          id: 'procesar-venta', 
          label: 'Vender', 
          icon: ShoppingCart,
          description: 'Procesar venta',
          badge: cantidadCarrito > 0 ? cantidadCarrito : null
        },
        { 
          id: 'ventas', 
          label: 'Historial', 
          icon: BarChart3,
          description: 'Ver ventas'
        }
      ]
    }
  ];

  return (
    <div className="w-72 h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-green-900 text-white shadow-2xl flex flex-col">
      {/* Contenido con scroll invisible */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
        <div className="p-6">
          <div className="mb-8 pb-6 border-b border-white/20">
            <div className="w-full">
              <h1 className="text-xl font-bold leading-tight text-center break-words">
                UPDATE TECH
              </h1>
            </div>
          </div>
          
          <nav className="space-y-6">
            {menuGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                {/* Título del grupo */}
                <h3 className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-3 px-2">
                  {group.title}
                </h3>
                
                {/* Items del grupo */}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full group relative overflow-hidden rounded-xl p-3 transition-all duration-300 ${
                          isActive
                            ? 'bg-white/20 shadow-lg transform scale-105 backdrop-blur-sm'
                            : 'hover:bg-white/10 hover:transform hover:scale-102'
                        }`}
                      >
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
                        )}
                        
                        <div className="relative flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg transition-colors ${
                              isActive 
                                ? 'bg-white/20 text-white' 
                                : 'bg-white/5 text-blue-200 group-hover:bg-white/10 group-hover:text-white'
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            
                            <div className="text-left">
                              <div className={`text-sm font-semibold transition-colors ${
                                isActive ? 'text-white' : 'text-blue-100 group-hover:text-white'
                              }`}>
                                {item.label}
                              </div>
                              <div className={`text-xs transition-colors ${
                                isActive ? 'text-blue-100' : 'text-blue-300 group-hover:text-blue-200'
                              }`}>
                                {item.description}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {/* Badge para carrito */}
                            {item.badge && (
                              <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                {item.badge}
                              </div>
                            )}
                            
                            {/* Indicador activo */}
                            {isActive && (
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Footer fijo en la parte inferior */}
      <div className="p-6 border-t border-white/20 bg-gradient-to-br from-blue-900 via-blue-800 to-green-900">
        <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-white">Base de Datos</span>
          </div>
          <div className="text-xs text-blue-200">
            Estado: <span className="text-green-400 font-medium">Conectado</span>
          </div>
          {cantidadCarrito > 0 && (
            <div className="text-xs text-orange-200 mt-1">
              🛒 <span className="text-orange-400 font-medium">{cantidadCarrito} items en carrito</span>
            </div>
          )}
        </div>
      </div>

      {/* CSS personalizado para ocultar scrollbars */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;  /* Internet Explorer 10+ */
          scrollbar-width: none;  /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;  /* Safari and Chrome */
        }
      `}</style>
    </div>
  );
};

export default Sidebar;