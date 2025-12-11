import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
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
  ShoppingBag,
  Plane,
  LayoutDashboard,
  Mail,
  ChevronLeft,
  Menu
} from 'lucide-react';
import { useAuthContext } from '../../../context/AuthContext';

const Sidebar = ({ activeSection, isCollapsed = false, toggleSidebar }) => {
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
          path: '/registrar-venta',
          label: 'Registrar Venta',
          icon: Plus,
          description: 'Seleccionar productos y carrito'
        },
        {
          id: 'inventario',
          path: '/catalogo',
          label: 'Catálogo',
          icon: List,
          description: 'Listado total de productos'
        },
        {
          id: 'listado-total',
          path: '/stock',
          label: 'Listado Total',
          icon: Package,
          description: 'Vista unificada de inventario'
        },
        {
          id: 'copys',
          path: '/listas',
          label: 'Listas',
          icon: FileText,
          description: 'Generador de listas'
        },
        {
          id: 'clientes',
          path: '/clientes',
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
          id: 'tablero-general',
          path: '/tablero',
          label: 'Tablero General',
          icon: LayoutDashboard,
          description: 'Resumen financiero mensual'
        },
        {
          id: 'ventas',
          path: '/ventas',
          label: 'Historial Ventas',
          icon: BarChart3,
          description: 'Registro de ventas'
        },
        {
          id: 'comisiones',
          path: '/comisiones',
          label: 'Comisiones',
          icon: Calculator,
          description: 'Calc. de comisiones'
        },
        {
          id: 'dashboard-reportes',
          path: '/reportes',
          label: 'Dashboard',
          icon: BarChart3,
          description: 'Reportes visuales'
        },
        {
          id: 'ingreso-equipos',
          path: '/ingreso-equipos',
          label: 'Ingreso de Equipos',
          icon: Plus,
          description: 'Cargar productos'
        },
        {
          id: 'garantias',
          path: '/garantias',
          label: 'Garantías',
          icon: Shield,
          description: 'Gestión de garantías'
        },
        {
          id: 'recibos',
          path: '/recibos',
          label: 'Recibos',
          icon: FileText,
          description: 'Recibos customizables'
        },
        {
          id: 'recuento-stock',
          path: '/recuento-stock',
          label: 'Recuento Stock',
          icon: Package,
          description: 'Contar inventario'
        },
        {
          id: 'cuentas-corrientes',
          path: '/cuentas-corrientes',
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
          path: '/contabilidad/ratios',
          label: 'Ratios Financieros',
          icon: TrendingUp,
          description: 'Indicadores de liquidez'
        },
        {
          id: 'plan-cuentas',
          path: '/contabilidad/plan-cuentas',
          label: 'Plan de Cuentas',
          icon: BookOpen,
          description: 'Estructura contable'
        },
        {
          id: 'libro-diario',
          path: '/contabilidad/libro-diario',
          label: 'Libro Diario',
          icon: FileText,
          description: 'Asientos contables'
        },
        {
          id: 'libro-mayor',
          path: '/contabilidad/libro-mayor',
          label: 'Libro Mayor',
          icon: BookOpen,
          description: 'Mayor por cuenta'
        },
        {
          id: 'conciliacion-caja',
          path: '/contabilidad/conciliacion',
          label: 'Conciliación Caja',
          icon: DollarSign,
          description: 'Verificar efectivo'
        },
        {
          id: 'estado-situacion-patrimonial',
          path: '/contabilidad/situacion-patrimonial',
          label: 'Estado Situación Patrimonial',
          icon: BarChart3,
          description: 'Balance patrimonial'
        },
        {
          id: 'estado-resultados',
          path: '/contabilidad/resultados',
          label: 'Estado de Resultados',
          icon: TrendingUp,
          description: 'Ingresos y gastos'
        },
        {
          id: 'balance-sumas-saldos',
          path: '/contabilidad/balance',
          label: 'Balance de Sumas y Saldos',
          icon: ArrowUpDown,
          description: 'Verificación contable'
        },
        {
          id: 'cuentas-auxiliares',
          path: '/contabilidad/cuentas-auxiliares',
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
          path: '/reparaciones',
          label: 'Reparaciones',
          icon: Wrench,
          description: 'Gestión de reparaciones'
        },
        {
          id: 'testeo-equipos',
          path: '/testeo-equipos',
          label: 'Testeo Equipos',
          icon: Monitor,
          description: 'Testeo de notebooks y celulares'
        },
        {
          id: 'email-preview',
          path: '/email-preview',
          label: 'Preview Email',
          icon: Mail,
          description: 'Previsualización template de email'
        }
      ]
    },
    {
      title: 'COMPRAS',
      color: 'from-cyan-600 to-blue-600',
      level: 'compras',
      items: [
        {
          id: 'compras',
          path: '/compras',
          label: 'Compras Locales',
          icon: ShoppingCart,
          description: 'Registro de compras locales'
        },
        {
          id: 'importaciones',
          path: '/importaciones',
          label: 'Compras Internacionales',
          icon: Plane,
          description: 'Gestión de compras internacionales'
        },
        {
          id: 'proveedores-compras',
          path: '/proveedores',
          label: 'Proveedores',
          icon: Users,
          description: 'Gestión de proveedores'
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
    <div className={`h-screen text-white shadow-2xl flex flex-col relative bg-slate-800 ${isCollapsed ? 'w-16' : 'w-70'
      }`}>
      {/* Header con Logo y Toggle */}
      <div className={`flex flex-col items-center justify-center ${isCollapsed ? "p-2 py-4 gap-4" : "p-4 relative"} border-b border-slate-700 bg-slate-800 z-10`}>
        <div className="flex items-center justify-center">
          <img
            src="/logo.png"
            alt="Logo"
            className={`${isCollapsed ? 'w-8 h-8' : 'w-16 h-16'}`}
          />
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className={`
            text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-700
            ${isCollapsed ? '' : 'absolute right-4 top-1/2 -translate-y-1/2'}
          `}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Contenido scrolleable - solo el menú */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
        <div className={isCollapsed ? "p-2 pt-4" : "p-4 pt-4"}>
          <nav className={isCollapsed ? "space-y-2" : "space-y-6"}>
            {filteredMenuGroups.map((group, groupIndex) => {
              const isGroupDisabled = group.disabled;
              const isExpanded = expandedSections.has(group.title);

              return (
                <div key={groupIndex}>
                  {/* Título del grupo con color específico y botón expandible */}
                  {!isCollapsed ? (
                    <button
                      onClick={() => toggleSection(group.title)}
                      className={`w-full bg-emerald-600 p-3 rounded-lg mb-3 relative focus:outline-none ${isGroupDisabled ? 'opacity-60' : ''
                        } hover:bg-emerald-600/80`}
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
                            <ChevronDown className="w-4 h-4 text-white" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-white" />
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
                  <div className={`overflow-hidden ${isCollapsed ? 'max-h-screen opacity-100' :
                    isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                    <div className="space-y-1 pb-2">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isItemDisabled = item.disabled || isGroupDisabled || !hasAccess(item.id);

                        if (isItemDisabled) {
                          return (
                            <div
                              key={item.id}
                              className={`w-full group relative overflow-hidden rounded-lg opacity-50 cursor-not-allowed ${isCollapsed ? 'p-2' : 'p-3'
                                } border border-transparent`}
                              title={isCollapsed ? item.label : undefined}
                            >
                              {isCollapsed ? (
                                <div className="flex items-center justify-center">
                                  <div className="p-2 rounded-lg bg-slate-200/10 text-slate-200">
                                    <Icon className="w-4 h-4" />
                                  </div>
                                </div>
                              ) : (
                                <div className="relative flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="p-2 rounded-lg bg-slate-200/10 text-slate-200">
                                      <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                      <div className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
                                        <span>{item.label}</span>
                                        <AlertCircle className="w-3 h-3 opacity-50" />
                                      </div>
                                      <div className="text-xs text-slate-200/70">
                                        {item.description}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }

                        return (
                          <NavLink
                            key={item.id}
                            to={item.path}
                            className={({ isActive }) => `w-full group relative overflow-hidden rounded-lg focus:outline-none block ${isCollapsed ? 'p-2' : 'p-3'
                              } ${isActive
                                ? 'bg-white border border-slate-200 shadow-lg'
                                : 'hover:bg-slate-200/20 border border-transparent'
                              }`}
                            title={isCollapsed ? item.label : undefined}
                          >
                            {({ isActive }) => (
                              isCollapsed ? (
                                <div className="flex items-center justify-center">
                                  <div className={`p-2 rounded-lg ${isActive
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-slate-200/10 text-slate-200 group-hover:bg-emerald-600 group-hover:text-white'
                                    }`}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                </div>
                              ) : (
                                <div className="relative flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-lg ${isActive
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : 'bg-slate-200/10 text-slate-200 group-hover:bg-emerald-600 group-hover:text-white'
                                      }`}>
                                      <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                      <div className={`text-sm font-semibold ${isActive
                                        ? 'text-slate-800'
                                        : 'text-slate-200 group-hover:text-white'
                                        }`}>
                                        {item.label}
                                      </div>
                                      <div className={`text-xs ${isActive
                                        ? 'text-slate-800/70'
                                        : 'text-slate-200/70 group-hover:text-slate-200'
                                        }`}>
                                        {item.description}
                                      </div>
                                    </div>
                                  </div>
                                  {isActive && (
                                    <div className="w-2 h-2 bg-emerald-600 rounded-full shadow-sm" />
                                  )}
                                </div>
                              )
                            )}
                          </NavLink>
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

      {/* CSS personalizado para ocultar scrollbars */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        button:focus, a:focus {
          outline: none !important;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;