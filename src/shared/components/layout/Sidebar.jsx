import React, { useState } from 'react';
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
  CreditCard,
  DollarSign,
  Calculator,
  TrendingUp,
  ArrowUpDown,
  Settings,
  Users,
  List,
  BookOpen,
  AlertCircle,
  Globe,
  Truck,
  RefreshCw,
  Monitor,
  Shield,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ShoppingBag
} from 'lucide-react';
import { useAuthContext } from '../../../context/AuthContext';

const Sidebar = ({ activeSection, setActiveSection, isCollapsed = false, onToggleCollapse }) => {
  const { user, hasAccess, getAllowedSections } = useAuthContext();
  
  // Estado para controlar qué secciones están expandidas
  const [expandedSections, setExpandedSections] = useState(new Set(['VENTAS']));

  const menuGroups = [
    {
      title: 'VENTAS',
      color: 'from-green-500 to-green-600',
      level: 'ventas',
      items: [

        {
          id: 'registrar-venta',
          label: 'Registrar Venta',
          icon: Plus,
          description: 'Seleccionar productos y carrito'
        },
         {
          id: 'inventario',
          label: 'Catálogo',
          icon: List,
          description: 'Listado total de productos'
        },
        {
          id: 'listado-total',
          label: 'Listado Total',
          icon: Package,
          description: 'Vista unificada de inventario'
        },
        {
          id: 'copys',
          label: 'Listas',
          icon: FileText,
          description: 'Generador de listas'
        },
        {
          id: 'clientes',
          label: 'Clientes',
          icon: Users,
          description: 'Gestión de clientes'
        }
      ]
    },
    {
      title: 'ADMINISTRACIÓN',
      color: 'from-blue-600 to-indigo-700',
      level: 'administracion',
      items: [
        {
          id: 'ventas',
          label: 'Historial Ventas',
          icon: BarChart3,
          description: 'Registro de ventas'
        },
        {
          id: 'comisiones',
          label: 'Comisiones',
          icon: Calculator,
          description: 'Calc. de comisiones',
          disabled: false  // Cambiar de true a false
        },
        {
          id: 'dashboard-reportes',
          label: 'Dashboard',
          icon: BarChart3,
          description: 'Reportes visuales'
        },
        {
          id: 'ingreso-equipos',
          label: 'Ingreso de Equipos',
          icon: Plus,
          description: 'Cargar productos'
        },
        {
          id: 'garantias',
          label: 'Garantías',
          icon: Shield,
          description: 'Gestión de garantías'
        },
        {
          id: 'recuento-stock',
          label: 'Recuento Stock',
          icon: Package,
          description: 'Contar inventario'
        },
        {
          id: 'cuentas-corrientes',
          label: 'Cuentas Corrientes',
          icon: CreditCard,
          description: 'Deudas y saldos'
        }
      ]
    },
    {
      title: 'CONTABILIDAD',
      color: 'from-indigo-500 to-purple-600',
      level: 'contabilidad',
      items: [
        {
          id: 'ratios',
          label: 'Ratios Financieros',
          icon: TrendingUp,
          description: 'Indicadores de liquidez'
        },
        {
          id: 'plan-cuentas',
          label: 'Plan de Cuentas',
          icon: BookOpen,
          description: 'Estructura contable'
        },
        {
          id: 'libro-diario',
          label: 'Libro Diario',
          icon: FileText,
          description: 'Asientos contables'
        },
        {
          id: 'libro-mayor',
          label: 'Libro Mayor',
          icon: BookOpen,
          description: 'Mayor por cuenta'
        },
        {
          id: 'conciliacion-caja',
          label: 'Conciliación Caja',
          icon: DollarSign,
          description: 'Verificar efectivo'
        },
        {
          id: 'estado-situacion-patrimonial',
          label: 'Estado Situación Patrimonial',
          icon: BarChart3,
          description: 'Balance patrimonial'
        },
        {
          id: 'estado-resultados',
          label: 'Estado de Resultados',
          icon: TrendingUp,
          description: 'Ingresos y gastos'
        },
        {
          id: 'balance-sumas-saldos',
          label: 'Balance de Sumas y Saldos',
          icon: ArrowUpDown,
          description: 'Verificación contable'
        },
        {
          id: 'cuentas-auxiliares',
          label: 'Cuentas Auxiliares',
          icon: Calculator,
          description: 'Control detallado de inventarios'
        },
      ]
    },
    {
      title: 'SOPORTE',
      color: 'from-orange-500 to-red-600',
      level: 'soporte',
      items: [
        {
          id: 'reparaciones',
          label: 'Reparaciones',
          icon: Wrench,
          description: 'Gestión de reparaciones',
          disabled: false
        },
        {
          id: 'repuestos',
          label: 'Repuestos',
          icon: Wrench,
          description: 'Inventario de repuestos'
        },
        {
          id: 'movimientos-repuestos',
          label: 'Movimientos Repuestos',
          icon: Package,
          description: 'Entradas y salidas de repuestos'
        },
        {
          id: 'testeo-equipos',
          label: 'Testeo Equipos',
          icon: Monitor,
          description: 'Testeo de notebooks y celulares'
        }
      ]
    },
    {
      title: 'COMPRAS',
      color: 'from-purple-500 to-purple-600',
      level: 'compras',
      items: [
        {
          id: 'compras',
          label: 'Registro de Compras',
          icon: ShoppingBag,
          description: 'Compras de la empresa'
        }
      ]
    },
    {
      title: 'IMPORTACIONES',
      color: 'from-cyan-600 to-blue-600',
      level: 'importaciones',
      items: [
        {
          id: 'cotizaciones',
          label: 'Cotizaciones',
          icon: FileText,
          description: 'Cotizaciones de importaciones'
        },
        {
          id: 'pendientes-compra',
          label: 'Pendientes de Compra',
          icon: ClipboardList,
          description: 'Importaciones pendientes de compra'
        },
        {
          id: 'en-transito',
          label: 'En Tránsito',
          icon: Truck,
          description: 'Importaciones en tránsito'
        },
        {
          id: 'historial-importaciones',
          label: 'Historial',
          icon: BarChart3,
          description: 'Historial de importaciones finalizadas'
        }
      ]
    }
  ];

  // Filtrar grupos según el nivel de usuario
  const allowedSections = getAllowedSections();
  const filteredMenuGroups = menuGroups.filter(group => 
    user?.nivel === 'admin' || allowedSections.includes(group.level)
  );



  // Función para alternar el estado expandido de una sección
  const toggleSection = (sectionTitle) => {
    setExpandedSections(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(sectionTitle)) {
        newExpanded.delete(sectionTitle);
      } else {
        newExpanded.add(sectionTitle);
      }
      return newExpanded;
    });
  };

  return (
    <div className={`h-screen text-white shadow-2xl flex flex-col relative bg-slate-800 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-70'
    }`}>
      {/* Header fijo - NO scrolleable */}
      <div className={`${isCollapsed ? "p-2" : "p-8"} ${isCollapsed ? "pb-2" : "pb-4"} border-b border-slate-200 bg-slate-800 relative z-10`}>
        <div className="w-full">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-end'}`}>
            {/* Botón de colapso integrado */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors focus:outline-none"
                title={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
              >
                {isCollapsed ? (
                  <ChevronRight size={20} className="text-white" strokeWidth={2.5} />
                ) : (
                  <ChevronLeft size={20} className="text-white" strokeWidth={2.5} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido scrolleable - solo el menú */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
        <div className={isCollapsed ? "p-2 pt-4" : "p-8 pt-8"}>
          <nav className={isCollapsed ? "space-y-2" : "space-y-8"}>
            {filteredMenuGroups.map((group, groupIndex) => {
              const isGroupDisabled = group.disabled;
              const isExpanded = expandedSections.has(group.title);

              return (
                <div key={groupIndex}>
                  {/* Título del grupo con color específico y botón expandible */}
                  {!isCollapsed ? (
                    <button
                      onClick={() => toggleSection(group.title)}
                      className={`w-full bg-emerald-600 p-4 rounded-lg mb-4 relative focus:outline-none ${isGroupDisabled ? 'opacity-60' : ''
                        } hover:bg-emerald-600/80 transition-all duration-200`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white tracking-wider flex items-center space-x-2">
                          <span>{group.title}</span>
                          {isGroupDisabled && (
                            <div className="relative group">
                              <Settings className="w-4 h-4 opacity-50" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 border border-slate-200 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                En desarrollo
                              </div>
                            </div>
                          )}
                        </h3>
                        <div className="flex items-center">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-white transition-transform duration-200" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-white transition-transform duration-200" />
                          )}
                        </div>
                      </div>
                    </button>
                  ) : (
                    /* Icono de separación cuando está colapsado */
                    <div className="flex justify-center mb-3">
                      <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center" title={group.title}>
                        <span className="text-white text-xs font-bold">
                          {group.title.charAt(0)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Items del grupo - con animación de colapso */}
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isCollapsed ? 'max-h-screen opacity-100' : 
                    isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="space-y-2 pb-2">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        const isItemDisabled = item.disabled || isGroupDisabled || !hasAccess(item.id);

                        return (
                          <button
                            key={item.id}
                            onClick={() => !isItemDisabled && setActiveSection(item.id)}
                            disabled={isItemDisabled}
                            className={`w-full group relative overflow-hidden rounded-lg transition-all duration-300 focus:outline-none ${
                              isCollapsed ? 'p-2' : 'p-4'
                            } ${isItemDisabled
                              ? 'opacity-50 cursor-not-allowed'
                              : isActive
                                ? 'bg-white border border-slate-200 shadow-lg'
                                : 'hover:bg-slate-200/20 border border-transparent'
                              }`}
                            title={isCollapsed ? item.label : undefined}
                          >
                            {isCollapsed ? (
                              /* Vista colapsada - solo iconos */
                              <div className="flex items-center justify-center">
                                <div className={`p-2 rounded-lg transition-colors ${isItemDisabled
                                  ? 'bg-slate-200/10 text-slate-200'
                                  : isActive
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-slate-200/10 text-slate-200 group-hover:bg-emerald-600 group-hover:text-white'
                                  }`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                              </div>
                            ) : (
                              /* Vista expandida - iconos y texto */
                              <div className="relative flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className={`p-2 rounded-lg transition-colors ${isItemDisabled
                                    ? 'bg-slate-200/10 text-slate-200'
                                    : isActive
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : 'bg-slate-200/10 text-slate-200 group-hover:bg-emerald-600 group-hover:text-white'
                                    }`}>
                                    <Icon className="w-4 h-4" />
                                  </div>

                                  <div className="text-left">
                                    <div className={`text-sm font-semibold transition-colors flex items-center space-x-2 ${isItemDisabled
                                      ? 'text-slate-200'
                                      : isActive
                                        ? 'text-slate-800'
                                        : 'text-slate-200 group-hover:text-white'
                                      }`}>
                                      <span>{item.label}</span>
                                      {isItemDisabled && (
                                        <AlertCircle className="w-3 h-3 opacity-50" />
                                      )}
                                    </div>
                                    <div className={`text-xs transition-colors ${isItemDisabled
                                      ? 'text-slate-200/70'
                                      : isActive
                                        ? 'text-slate-800/70'
                                        : 'text-slate-200/70 group-hover:text-slate-200'
                                      }`}>
                                      {item.description}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  {/* Badge para carrito */}
                                  {item.badge && !isItemDisabled && (
                                    <div className="bg-emerald-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                      {item.badge}
                                    </div>
                                  )}

                                  {/* Indicador activo */}
                                  {isActive && !isItemDisabled && (
                                    <div className="w-2 h-2 bg-emerald-600 rounded-full shadow-sm" />
                                  )}
                                </div>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* CSS personalizado para ocultar scrollbars y eliminar outlines */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;  /* Internet Explorer 10+ */
          scrollbar-width: none;  /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;  /* Safari and Chrome */
        }
        
        /* Eliminar todos los outlines de botones */
        button:focus {
          outline: none !important;
          box-shadow: none !important;
        }
        
        button:focus-visible {
          outline: none !important;
          box-shadow: none !important;
        }
        
        button:active {
          outline: none !important;
          box-shadow: none !important;
        }
        
        *:focus {
          outline: none !important;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;