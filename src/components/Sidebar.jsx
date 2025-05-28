import React from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Package, 
  Smartphone, 
  BarChart3, 
  Box,
  Wrench,
  FileText,
  ClipboardList,
  Camera,
  DollarSign,
  Calculator,
  TrendingUp,
  ArrowUpDown,
  Settings,
  AlertCircle
} from 'lucide-react';

const Sidebar = ({ activeSection, setActiveSection, cantidadCarrito = 0 }) => {
  const menuGroups = [
    {
      title: 'VENTAS',
      color: 'from-green-500 to-blue-600',
      items: [
        { 
          id: 'inventario', 
          label: 'Notebooks', 
          icon: Package,
          description: 'Stock de notebooks'
        },
        { 
          id: 'celulares', 
          label: 'Celulares', 
          icon: Smartphone,
          description: 'Stock de celulares'
        },
        { 
          id: 'otros', 
          label: 'Otros Productos', 
          icon: Box,
          description: 'Stock de otros'
        },
        { 
          id: 'procesar-venta', 
          label: 'Venta', 
          icon: ShoppingCart,
          description: 'Carrito de ventas',
          badge: cantidadCarrito > 0 ? cantidadCarrito : null
        },
      ]
    },
    {
      title: 'SOPORTE',
      color: 'from-orange-500 to-red-600',
      items: [
        { 
          id: 'carga-equipos', 
          label: 'Carga de Equipos', 
          icon: Plus,
          description: 'Agregar productos'
        },
        { 
          id: 'reparaciones', 
          label: 'Reparaciones', 
          icon: Wrench,
          description: 'Gestión de reparaciones',
          disabled: false
        },
        { 
          id: 'presupuestos', 
          label: 'Presupuestos', 
          icon: FileText,
          description: 'Generar presupuestos',
          disabled: true
        },
        { 
          id: 'egresos', 
          label: 'Egresos', 
          icon: ClipboardList,
          description: 'Comprobantes de egreso',
          disabled: true
        }
      ]
    },
    {
      title: 'ADMINISTRACIÓN',
      color: 'from-purple-500 to-indigo-600',
      items: [
        { 
          id: 'ventas', 
          label: 'Historial Ventas', 
          icon: BarChart3,
          description: 'Registro de ventas'
        },
        { 
          id: 'movimientos', 
          label: 'Movimientos', 
          icon: ArrowUpDown,
          description: 'Movimientos de caja',
          disabled: true
        },
        { 
          id: 'comisiones', 
          label: 'Comisiones', 
          icon: Calculator,
          description: 'Calc. de comisiones',
          disabled: true
        },
        { 
          id: 'graficos', 
          label: 'Gráficos', 
          icon: TrendingUp,
          description: 'Analytics y reportes',
          disabled: true
        }
      ]
    }
  ];

  const getGroupColorClasses = (color) => {
    return {
      gradient: `bg-gradient-to-r ${color}`,
      light: color.includes('orange') ? 'bg-orange-50 text-orange-700 border-orange-200' :
             color.includes('green') ? 'bg-green-50 text-green-700 border-green-200' :
             'bg-purple-50 text-purple-700 border-purple-200'
    };
  };

  return (
    <div className="w-72 h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl flex flex-col">
      {/* Contenido con scroll invisible */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
        <div className="p-6">
          {/* Header */}
          <div className="mb-8 pb-6 border-b border-white/20">
            <div className="w-full text-center">
              <h1 className="text-xl font-bold leading-tight mb-2">
                UPDATE TECH
              </h1>
              <div className="text-xs text-slate-300 uppercase tracking-wider">
                Sistema de Gestión
              </div>
            </div>
          </div>
          
          <nav className="space-y-8">
            {menuGroups.map((group, groupIndex) => {
              const colorClasses = getGroupColorClasses(group.color);
              const isGroupDisabled = group.disabled;
              
              return (
                <div key={groupIndex}>
                  {/* Título del grupo con color específico */}
                  <div className={`${colorClasses.gradient} p-2 rounded-lg mb-4 relative ${
                    isGroupDisabled ? 'opacity-60' : ''
                  }`}>
                    <h3 className="text-sm font-bold text-white text-center tracking-wider flex items-center justify-center space-x-2">
                      <span>{group.title}</span>
                      {isGroupDisabled && (
                        <div className="relative group">
                          <Settings className="w-4 h-4 opacity-50" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black bg-opacity-75 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            En desarrollo
                          </div>
                        </div>
                      )}
                    </h3>
                  </div>
                  
                  {/* Items del grupo */}
                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeSection === item.id;
                      const isItemDisabled = item.disabled || isGroupDisabled;
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => !isItemDisabled && setActiveSection(item.id)}
                          disabled={isItemDisabled}
                          className={`w-full group relative overflow-hidden rounded-xl p-3 transition-all duration-300 ${
                            isItemDisabled 
                              ? 'opacity-50 cursor-not-allowed' 
                              : isActive
                                ? 'bg-white/20 shadow-lg transform scale-105 backdrop-blur-sm border border-white/30'
                                : 'hover:bg-white/10 hover:transform hover:scale-102 border border-transparent'
                          }`}
                        >
                          {isActive && !isItemDisabled && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
                          )}
                          
                          <div className="relative flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg transition-colors ${
                                isItemDisabled
                                  ? 'bg-white/5 text-slate-500'
                                  : isActive 
                                    ? 'bg-white/20 text-white shadow-sm' 
                                    : 'bg-white/5 text-slate-300 group-hover:bg-white/10 group-hover:text-white'
                              }`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              
                              <div className="text-left">
                                <div className={`text-sm font-semibold transition-colors flex items-center space-x-2 ${
                                  isItemDisabled
                                    ? 'text-slate-500'
                                    : isActive 
                                      ? 'text-white' 
                                      : 'text-slate-200 group-hover:text-white'
                                }`}>
                                  <span>{item.label}</span>
                                  {isItemDisabled && (
                                    <AlertCircle className="w-3 h-3 opacity-50" />
                                  )}
                                </div>
                                <div className={`text-xs transition-colors ${
                                  isItemDisabled
                                    ? 'text-slate-600'
                                    : isActive 
                                      ? 'text-slate-200' 
                                      : 'text-slate-400 group-hover:text-slate-300'
                                }`}>
                                  {item.description}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {/* Badge para carrito */}
                              {item.badge && !isItemDisabled && (
                                <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                                  {item.badge}
                                </div>
                              )}
                              
                              {/* Indicador activo */}
                              {isActive && !isItemDisabled && (
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-sm" />
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer fijo en la parte inferior */}
      <div className="p-6 border-t border-white/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-white">Sistema Activo</span>
          </div>
          <div className="text-xs text-slate-300">
            Base de Datos: <span className="text-emerald-400 font-medium">Conectada</span>
          </div>
          {cantidadCarrito > 0 && (
            <div className="text-xs text-orange-300 mt-1 flex items-center space-x-1">
              <ShoppingCart className="w-3 h-3" />
              <span><span className="text-orange-400 font-medium">{cantidadCarrito}</span> items pendientes</span>
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