import React, { useState, useEffect } from 'react';
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
  LogOut,
  Globe,
  Truck,
  RefreshCw,
  Monitor,
  Shield,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useAuthContext } from '../../../context/AuthContext';
import { cotizacionSimple } from '../../../services/cotizacionSimpleService';

const Sidebar = ({ activeSection, setActiveSection, cantidadCarrito = 0 }) => {
  const { user, logout, hasAccess, getAllowedSections } = useAuthContext();
  
  // Estado para cotización USD/ARS
  const [cotizacion, setCotizacion] = useState(null);
  const [loadingCotizacion, setLoadingCotizacion] = useState(false);
  
  // Estado para controlar qué secciones están expandidas
  const [expandedSections, setExpandedSections] = useState(new Set(['VENTAS']));

  // Cargar cotización al montar el componente
  useEffect(() => {
    cargarCotizacion();
    // Actualizar cada 5 minutos
    const interval = setInterval(cargarCotizacion, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const cargarCotizacion = async () => {
    try {
      setLoadingCotizacion(true);
      const cotizacionData = await cotizacionSimple.obtenerCotizacion();
      setCotizacion(cotizacionData);
    } catch (error) {
      console.error('❌ Error cargando cotización:', error);
    } finally {
      setLoadingCotizacion(false);
    }
  };

  const actualizarCotizacion = async () => {
    try {
      setLoadingCotizacion(true);
      const cotizacionData = await cotizacionSimple.forzarActualizacion();
      setCotizacion(cotizacionData);
    } catch (error) {
      console.error('❌ Error actualizando cotización:', error);
    } finally {
      setLoadingCotizacion(false);
    }
  };

  const menuGroups = [
    {
      title: 'VENTAS',
      color: 'from-green-500 to-green-600',
      level: 'ventas',
      items: [
        {
          id: 'inventario',
          label: 'Catálogo',
          icon: List,
          description: 'Listado total de productos'
        },
        {
          id: 'gestion-fotos',
          label: 'Gestión de Fotos',
          icon: Camera,
          description: 'Fotos de productos'
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
    },
    {
      title: 'SOPORTE',
      color: 'from-orange-500 to-red-600',
      level: 'soporte',
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
          id: 'recuento-repuestos',
          label: 'Recuento Repuestos',
          icon: Calculator,
          description: 'Contar repuestos físicos'
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
    }, {
      title: 'CONTABILIDAD',
      color: 'from-indigo-500 to-purple-600',
      level: 'contabilidad',
      items: [
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
        }
      ]
    }
  ];

  // Filtrar grupos según el nivel de usuario
  const allowedSections = getAllowedSections();
  const filteredMenuGroups = menuGroups.filter(group => 
    user?.nivel === 'admin' || allowedSections.includes(group.level)
  );

  const getGroupColorClasses = (color) => {
    return {
      gradient: `bg-gradient-to-r ${color}`,
    };
  };

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro que deseas cerrar sesión?')) {
      logout();
    }
  };

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
    <div className="w-72 h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl flex flex-col">
      {/* Contenido con scroll invisible */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
        <div className="p-6">
          {/* Header */}
          <div className="mb-8 pb-6 border-b border-white/20">
            <div className="w-full text-center">
              <h2 className="text-3xl font-bold leading-tight mb-2 text-white">
                UPDATE TECH
              </h2>
            </div>
          </div>

          <nav className="space-y-6">
            {filteredMenuGroups.map((group, groupIndex) => {
              const colorClasses = getGroupColorClasses(group.color);
              const isGroupDisabled = group.disabled;
              const isExpanded = expandedSections.has(group.title);

              return (
                <div key={groupIndex}>
                  {/* Título del grupo con color específico y botón expandible */}
                  <button
                    onClick={() => toggleSection(group.title)}
                    className={`w-full ${colorClasses.gradient} p-3 rounded-lg mb-3 relative ${isGroupDisabled ? 'opacity-60' : ''
                      } hover:brightness-110 transition-all duration-200`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white tracking-wider flex items-center space-x-2">
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
                      <div className="flex items-center">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-white transition-transform duration-200" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-white transition-transform duration-200" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Items del grupo - con animación de colapso */}
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
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
                            className={`w-full group relative overflow-hidden rounded-xl p-3 transition-all duration-300 ${isItemDisabled
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
                                <div className={`p-2 rounded-lg transition-colors ${isItemDisabled
                                  ? 'bg-white/5 text-slate-500'
                                  : isActive
                                    ? 'bg-white/20 text-white shadow-sm'
                                    : 'bg-white/5 text-slate-300 group-hover:bg-white/10 group-hover:text-white'
                                  }`}>
                                  <Icon className="w-4 h-4" />
                                </div>

                                <div className="text-left">
                                  <div className={`text-sm font-semibold transition-colors flex items-center space-x-2 ${isItemDisabled
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
                                  <div className={`text-xs transition-colors ${isItemDisabled
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
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer fijo en la parte inferior */}
      <div className="p-6 border-t border-white/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Info del usuario */}
        <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <div className="text-sm font-medium text-white">{user?.nombre || 'Usuario'}</div>
                <div className="text-xs text-slate-400 capitalize">{user?.nivel || 'Sin nivel'}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Estado del sistema */}
        <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10 mb-4">
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

        {/* Cotización USD/ARS */}
        <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-white">USD/ARS</span>
            </div>
            <button
              onClick={actualizarCotizacion}
              disabled={loadingCotizacion}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Actualizar cotización"
            >
              <RefreshCw className={`w-3 h-3 text-slate-300 ${loadingCotizacion ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          {cotizacion ? (
            <div>
              <div className="text-lg font-bold text-green-400">
                ${cotizacion.valor?.toFixed(2) || 'N/A'}
              </div>
              <div className="text-xs text-slate-300">
                {cotizacion.fuente} • {cotizacion.timestamp}
              </div>
              {cotizacion.error && (
                <div className="text-xs text-orange-300 mt-1 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Sin conexión</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-400">
              {loadingCotizacion ? 'Cargando...' : 'No disponible'}
            </div>
          )}
        </div>
      </div>

      {/* CSS personalizado para ocultar scrollbars */}
      <style>{`
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