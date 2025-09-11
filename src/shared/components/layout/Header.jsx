import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, ShoppingCart, DollarSign, RefreshCw, AlertCircle, LogOut,
  List, Plus, Users, FileText, Camera, BookOpen, Calculator, BarChart3,
  Wrench, Package, Monitor, Shield, CreditCard, Truck, Globe, Menu
} from 'lucide-react';
import { useAuthContext } from '../../../context/AuthContext';
import { cotizacionService } from '../../services/cotizacionService';

const Header = ({ activeSection, isSidebarCollapsed }) => {
  const { user, logout } = useAuthContext();
  const currentDate = new Date();

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro que deseas cerrar sesión?')) {
      logout();
    }
  };
  
  // Estado para cotización USD/ARS
  const [cotizacion, setCotizacion] = useState(null);
  const [loadingCotizacion, setLoadingCotizacion] = useState(false);

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
      const cotizacionData = await cotizacionService.obtenerCotizacionActual();
      setCotizacion(cotizacionData);
    } catch (error) {
      console.error('❌ Error cargando cotización:', error);
    } finally {
      setLoadingCotizacion(false);
    }
  };

 
  const getSectionInfo = (section) => {
    const sections = {
      'inventario': { title: 'Catálogo', icon: List, description: 'Inventario de equipos disponibles para la venta.' },
      'catalogo-unificado': { title: 'Catálogo', icon: List, description: 'Inventario unificado con filtros inteligentes' },
      'carga-equipos': { title: 'Carga de Equipos', icon: Plus, description: 'Sistema unificado de carga de productos' },
      'clientes': { title: 'Clientes', icon: Users, description: 'Base de datos de clientes.' },
      'ventas': { title: 'Ventas', icon: ShoppingCart, description: 'Gestión de ventas y transacciones' },
      'copys': { title: 'Listas', icon: FileText, description: 'Generador de listas de copys para copiar y pegar.' },
      'gestion-fotos': { title: 'Gestión de Fotos', icon: Camera, description: 'Sistema de gestión de fotos para productos' },
      'plan-cuentas': { title: 'Plan de Cuentas', icon: BookOpen, description: 'Estructura contable de la empresa' },
      'libro-diario': { title: 'Libro Diario', icon: FileText, description: 'Registro de asientos contables' },
      'libro-mayor': { title: 'Libro Mayor', icon: BookOpen, description: 'Mayor general por cuentas' },
      'conciliacion-caja': { title: 'Conciliación de Caja', icon: DollarSign, description: 'Control de movimientos de caja' },
      'estado-situacion-patrimonial': { title: 'Estado de Situación Patrimonial', icon: BarChart3, description: 'Balance general de la empresa' },
      'estado-resultados': { title: 'Estado de Resultados', icon: TrendingUp, description: 'Estado de ganancias y pérdidas' },
      'cuentas-corrientes': { title: 'Cuentas Corrientes', icon: CreditCard, description: 'Gestión de deudas y saldos de clientes' },
      'reparaciones': { title: 'Reparaciones', icon: Wrench, description: 'Gestión de reparaciones y servicios técnicos' },
      'repuestos': { title: 'Repuestos', icon: Wrench, description: 'Inventario de repuestos y componentes' },
      'movimientos-repuestos': { title: 'Movimientos de Repuestos', icon: Package, description: 'Registro de movimientos de stock de repuestos' },
      'testeo-equipos': { title: 'Testeo de Equipos', icon: Monitor, description: 'Registro de pruebas y testeos técnicos' },
      'recuento-stock': { title: 'Recuento de Stock', icon: Package, description: 'Control y auditoría de inventario' },
      'dashboard-reportes': { title: 'Dashboard de Reportes', icon: BarChart3, description: 'Reportes visuales y estadísticas' },
      'garantias': { title: 'Garantías', icon: Shield, description: 'Gestión de garantías y servicios postventa' },
      'comisiones': { title: 'Comisiones', icon: Calculator, description: 'Cálculo y gestión de comisiones de ventas' },
      'importaciones': { title: 'Importaciones', icon: Globe, description: 'Gestión de importaciones y proveedores' },
      'cotizaciones': { title: 'Cotizaciones', icon: FileText, description: 'Cotizaciones de prodcuto por importación.' },
      'pendientes-compra': { title: 'Pendientes de Compra', icon: List, description: 'Órdenes de compra pendientes' },
      'en-transito': { title: 'En Tránsito', icon: Truck, description: 'Productos en tránsito desde proveedores' },
      'historial-importaciones': { title: 'Historial de Importaciones', icon: BarChart3, description: 'Historial completo de importaciones' }
    };
    return sections[section] || { title: section, description: '', icon: null };
  };
  
  const sectionInfo = getSectionInfo(activeSection);
  
  return (
    <header className="border-b border-slate-200 bg-slate-800">
      <div className="px-8 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <div>
              {/* Titles and subtitles removed */}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-6">
            {/* Tarjetas de información */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Info del usuario */}
              <div className="bg-slate-700 rounded-lg p-2 md:p-4 border border-slate-600 w-auto md:w-45 h-auto md:h-15">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <div className="w-5 h-5 md:w-6 md:h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {user?.user_metadata?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-xs font-medium text-white">{user?.user_metadata?.nombre || 'Usuario'}</div>
                      <div className="text-xs text-slate-300 capitalize">{user?.user_metadata?.nivel || 'Sin nivel'}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-1 hover:bg-slate-600 rounded transition-colors text-slate-300 hover:text-white"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Estado del sistema - Oculto en móviles */}
              <div className="hidden md:block bg-slate-700 rounded-lg p-4 border border-slate-600 w-40 h-15">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                  <span className="text-xs font-medium text-white">Sistema Activo</span>
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  BD: <span className="text-emerald-600 font-medium">Conectada</span>
                </div>
              </div>

              {/* Cotización USD/ARS */}
              <div className="bg-slate-700 rounded-lg p-2 md:p-4 border border-slate-600 w-auto md:w-40 h-auto md:h-15">
                {cotizacion ? (
                  <div>
                    <div className="text-xs md:text-sm font-bold text-emerald-600 truncate">
                      ${cotizacion.valor?.toFixed(2) || 'N/A'}
                    </div>
                    <div className="text-xs text-slate-400 truncate hidden md:block">
                      {cotizacion.fuente}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-300 truncate">
                    {loadingCotizacion ? 'Cargando...' : 'N/A'}
                  </div>
                )}
              </div>
            </div>

            {/* Fecha y hora */}
            <div className="text-right bg-white rounded-lg p-2 md:p-4 border border-slate-200 font-semibold">
              <div className="text-xs md:text-sm text-slate-800">
                <span className="hidden md:inline">
                  {currentDate.toLocaleDateString('es-AR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    timeZone: 'America/Argentina/Buenos_Aires'
                  })}
                </span>
                <span className="md:hidden">
                  {currentDate.toLocaleDateString('es-AR', { 
                    day: '2-digit',
                    month: '2-digit',
                    timeZone: 'America/Argentina/Buenos_Aires'
                  })}
                </span>
              </div>
              <div className="text-xs md:text-sm text-slate-800 mt-1">
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