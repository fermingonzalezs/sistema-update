import React from 'react';

const Header = ({ activeSection, children }) => {
  const currentDate = new Date();
  
  const getSectionInfo = (section) => {
    const sections = {
      'inventario': { title: 'Catálogo', description: 'Inventario unificado con filtros inteligentes' },
      'catalogo-unificado': { title: 'Catálogo', description: 'Inventario unificado con filtros inteligentes' },
      'carga-equipos': { title: 'Carga de Equipos', description: 'Sistema unificado de carga de productos' },
      'clientes': { title: 'Clientes', description: 'Administra y consulta la base de clientes' },
      'ventas': { title: 'Ventas', description: 'Gestión de ventas y transacciones' },
      'copys': { title: 'Listas', description: 'Genera textos para publicar productos en redes' },
      'gestion-fotos': { title: 'Gestión de Fotos', description: 'Sistema de gestión de fotos para productos' },
      'plan-cuentas': { title: 'Plan de Cuentas', description: 'Estructura contable de la empresa' },
      'libro-diario': { title: 'Libro Diario', description: 'Registro de asientos contables' },
      'libro-mayor': { title: 'Libro Mayor', description: 'Mayor general por cuentas' },
      'conciliacion-caja': { title: 'Conciliación de Caja', description: 'Control de movimientos de caja' },
      'estado-situacion-patrimonial': { title: 'Estado de Situación Patrimonial', description: 'Balance general de la empresa' },
      'estado-resultados': { title: 'Estado de Resultados', description: 'Estado de ganancias y pérdidas' },
      'cuentas-corrientes': { title: 'Cuentas Corrientes', description: 'Gestión de deudas y saldos de clientes' },
      'reparaciones': { title: 'Reparaciones', description: 'Gestión de reparaciones y servicios técnicos' },
      'repuestos': { title: 'Repuestos', description: 'Inventario de repuestos y componentes' },
      'movimientos-repuestos': { title: 'Movimientos de Repuestos', description: 'Registro de movimientos de stock de repuestos' },
      'recuento-repuestos': { title: 'Recuento de Repuestos', description: 'Control de inventario de repuestos' },
      'testeo-equipos': { title: 'Testeo de Equipos', description: 'Registro de pruebas y testeos técnicos' },
      'recuento-stock': { title: 'Recuento de Stock', description: 'Control y auditoría de inventario' },
      'dashboard-reportes': { title: 'Dashboard de Reportes', description: 'Reportes visuales y estadísticas' },
      'garantias': { title: 'Garantías', description: 'Gestión de garantías y servicios postventa' },
      'comisiones': { title: 'Comisiones', description: 'Cálculo y gestión de comisiones de ventas' },
      'importaciones': { title: 'Importaciones', description: 'Gestión de importaciones y proveedores' },
      'cotizaciones': { title: 'Cotizaciones', description: 'Cotizaciones de proveedores internacionales' },
      'pendientes-compra': { title: 'Pendientes de Compra', description: 'Órdenes de compra pendientes' },
      'en-transito': { title: 'En Tránsito', description: 'Productos en tránsito desde proveedores' },
      'historial-importaciones': { title: 'Historial de Importaciones', description: 'Historial completo de importaciones' }
    };
    return sections[section] || { title: section, description: '' };
  };
  
  const sectionInfo = getSectionInfo(activeSection);
  
  return (
    <header className="shadow-sm border-b border-gray-400" style={{backgroundColor: '#262626'}}>
      <div className="px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {children}
            <div className="ml-6">
              <h1 className="text-2xl font-bold text-white">
                {sectionInfo.title}
              </h1>
              {sectionInfo.description && (
                <p className="text-gray-300 text-sm mt-1">
                  {sectionInfo.description}
                </p>
              )}
            </div>
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