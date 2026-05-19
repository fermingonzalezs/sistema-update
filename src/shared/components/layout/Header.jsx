import React, { useState, useEffect } from 'react';
import {
  TrendingUp, ShoppingCart, DollarSign, RefreshCw, AlertCircle, LogOut,
  List, Plus, Users, FileText, Camera, BookOpen, Calculator, BarChart3,
  Wrench, Package, Monitor, Shield, CreditCard, Truck, Globe, Menu,
  X, Check, Lock, Eye, EyeOff, KeyRound
} from 'lucide-react';
import { useAuthContext } from '../../../context/AuthContext';
import { cotizacionService } from '../../services/cotizacionService';

const Header = ({ activeSection, isSidebarCollapsed, onToggleMobileSidebar }) => {
  const { user, logout, updateNombre, cambiarPassword } = useAuthContext();

  const [modalPerfil, setModalPerfil] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [guardandoNombre, setGuardandoNombre] = useState(false);
  const [errorNombre, setErrorNombre] = useState('');

  // Cambio de contraseña
  const [mostrarCambioPass, setMostrarCambioPass] = useState(false);
  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [passConfirmar, setPassConfirmar] = useState('');
  const [showPassActual, setShowPassActual] = useState(false);
  const [showPassNueva, setShowPassNueva] = useState(false);
  const [showPassConfirmar, setShowPassConfirmar] = useState(false);
  const [guardandoPass, setGuardandoPass] = useState(false);
  const [errorPass, setErrorPass] = useState('');
  const [successPass, setSuccessPass] = useState('');
  const [validacionPass, setValidacionPass] = useState({
    longitud: false,
    mayuscula: false,
    minuscula: false,
    numero: false,
    especial: false
  });

  const abrirModalPerfil = () => {
    setNuevoNombre(user?.user_metadata?.nombre || '');
    setErrorNombre('');
    setModalPerfil(true);
  };

  const guardarNombre = async () => {
    if (!nuevoNombre.trim()) {
      setErrorNombre('El nombre no puede estar vacío.');
      return;
    }
    setGuardandoNombre(true);
    setErrorNombre('');
    try {
      await updateNombre(nuevoNombre.trim());
      setModalPerfil(false);
    } catch (e) {
      setErrorNombre('Error al guardar. Intentá de nuevo.');
    } finally {
      setGuardandoNombre(false);
    }
  };

  // Validar contraseña nueva en tiempo real
  useEffect(() => {
    setValidacionPass({
      longitud: passNueva.length >= 8,
      mayuscula: /[A-Z]/.test(passNueva),
      minuscula: /[a-z]/.test(passNueva),
      numero: /\d/.test(passNueva),
      especial: /[!@#$%^&*(),.?":{}|<>]/.test(passNueva)
    });
  }, [passNueva]);

  const isPassValid = Object.values(validacionPass).every(Boolean);
  const passMatch = passNueva === passConfirmar && passConfirmar !== '';

  const handleCambiarPassword = async () => {
    setErrorPass('');
    setSuccessPass('');

    if (!passActual.trim()) {
      setErrorPass('Debes ingresar tu contraseña actual.');
      return;
    }
    if (!isPassValid) {
      setErrorPass('La nueva contraseña no cumple con los requisitos.');
      return;
    }
    if (!passMatch) {
      setErrorPass('Las contraseñas nuevas no coinciden.');
      return;
    }

    setGuardandoPass(true);
    try {
      await cambiarPassword(passActual, passNueva);
      setSuccessPass('Contraseña actualizada correctamente.');
      setPassActual('');
      setPassNueva('');
      setPassConfirmar('');
      setTimeout(() => {
        setMostrarCambioPass(false);
        setSuccessPass('');
      }, 2000);
    } catch (e) {
      setErrorPass(e.message || 'Error al cambiar la contraseña.');
    } finally {
      setGuardandoPass(false);
    }
  };

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
      'plan-cuentas': { title: 'Plan de Cuentas', icon: BookOpen, description: 'Estructura contable de la empresa' },
      'libro-diario': { title: 'Libro Diario', icon: FileText, description: 'Registro de asientos contables' },
      'libro-mayor': { title: 'Libro Mayor', icon: BookOpen, description: 'Mayor general por cuentas' },
      'conciliacion-caja': { title: 'Conciliación de Caja', icon: DollarSign, description: 'Control de movimientos de caja' },
      'estado-situacion-patrimonial': { title: 'Estado de Situación Patrimonial', icon: BarChart3, description: 'Balance general de la empresa' },
      'estado-resultados': { title: 'Estado de Resultados', icon: TrendingUp, description: 'Estado de ganancias y pérdidas' },
      'cuentas-corrientes': { title: 'Cuentas Corrientes', icon: CreditCard, description: 'Gestión de deudas y saldos de clientes' },
      'reparaciones': { title: 'Reparaciones', icon: Wrench, description: 'Gestión de reparaciones y servicios técnicos' },
      'testeo-equipos': { title: 'Testeo de Equipos', icon: Monitor, description: 'Registro de pruebas y testeos técnicos' },
      'recuento-stock': { title: 'Recuento de Stock', icon: Package, description: 'Control y auditoría de inventario' },
      'dashboard-reportes': { title: 'Dashboard de Reportes', icon: BarChart3, description: 'Reportes visuales y estadísticas' },
      'garantias': { title: 'Garantías', icon: Shield, description: 'Gestión de garantías y servicios postventa' },
      'comisiones': { title: 'Comisiones', icon: Calculator, description: 'Cálculo y gestión de comisiones de ventas' },
      'importaciones': { title: 'Importaciones', icon: Globe, description: 'Sistema completo de importaciones (crear, recibir, recepcionar)' }
    };
    return sections[section] || { title: section, description: '', icon: null };
  };

  const sectionInfo = getSectionInfo(activeSection);

  return (
    <>
    <header className="border-b border-slate-200 bg-slate-800">
      <div className="px-3 py-2 md:px-8 md:py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2 md:space-x-8">
            {/* Hamburger - mobile only */}
            <button
              onClick={onToggleMobileSidebar}
              className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-2 md:space-x-6">
            {/* Tarjetas de información */}
            <div className="flex items-stretch space-x-2 md:space-x-4">
              {/* Info del usuario */}
              <div className="bg-slate-700 rounded-lg px-3 py-2 border border-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={abrirModalPerfil}
                    className="flex items-center space-x-2 md:space-x-3 hover:opacity-80 transition-opacity"
                    title="Editar perfil"
                  >
                    <div className="w-5 h-5 md:w-6 md:h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {user?.user_metadata?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-medium text-white">
                        {user?.user_metadata?.nombre || 'Usuario'}
                      </div>
                      <div className="text-[10px] text-slate-300 capitalize leading-none hidden sm:block">{user?.user_metadata?.nivel || 'Sin nivel'}</div>
                    </div>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-1 hover:bg-slate-600 rounded transition-colors text-slate-300 hover:text-white"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
              </div>


              {/* Cotización USD/ARS */}
              <div className="bg-slate-700 rounded-lg px-3 py-2 border border-slate-600">
                {cotizacion ? (
                  <div className="flex flex-col items-center justify-center w-full">
                    <div className="text-sm md:text-base font-bold text-emerald-500 leading-none text-center">
                      ${cotizacion.valor || 'N/A'}
                    </div>
                    <div className="text-[9px] font-medium text-slate-400 uppercase tracking-wide text-center">
                      Dolar Blue
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
            <div className="text-right bg-white rounded-lg px-3 py-2 border border-slate-200 font-semibold hidden sm:block">
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

    {/* Modal editar perfil */}
    {modalPerfil && (
      <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50">
        <div className="bg-white rounded border border-slate-200 w-full max-w-sm mx-4">
          <div className="bg-slate-800 text-white px-5 py-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Mi perfil</h3>
            <button onClick={() => setModalPerfil(false)} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            {/* Info usuario */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-base font-bold">
                  {(user?.user_metadata?.nombre || 'U')?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500">{user?.email}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.user_metadata?.nivel || 'Sin nivel'}</p>
              </div>
            </div>

            {/* Editar nombre */}
            {!mostrarCambioPass && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={nuevoNombre}
                    onChange={e => setNuevoNombre(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && guardarNombre()}
                    autoFocus
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Tu nombre"
                  />
                  {errorNombre && <p className="text-xs text-red-600 mt-1">{errorNombre}</p>}
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setModalPerfil(false)}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-medium transition-colors"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={guardarNombre}
                    disabled={guardandoNombre}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    {guardandoNombre ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setMostrarCambioPass(true);
                      setErrorPass('');
                      setSuccessPass('');
                    }}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-2 transition-colors"
                  >
                    <KeyRound className="w-4 h-4" />
                    Cambiar contraseña
                  </button>
                </div>
              </div>
            )}

            {/* Cambiar contraseña */}
            {mostrarCambioPass && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña actual</label>
                  <div className="relative">
                    <input
                      type={showPassActual ? 'text' : 'password'}
                      value={passActual}
                      onChange={e => setPassActual(e.target.value)}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-10"
                      placeholder="••••••••"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassActual(!showPassActual)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassActual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nueva contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassNueva ? 'text' : 'password'}
                      value={passNueva}
                      onChange={e => setPassNueva(e.target.value)}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassNueva(!showPassNueva)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassNueva ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Requisitos */}
                {passNueva && (
                  <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1.5">
                    {[
                      { key: 'longitud', label: 'Al menos 8 caracteres' },
                      { key: 'mayuscula', label: 'Una mayúscula' },
                      { key: 'minuscula', label: 'Una minúscula' },
                      { key: 'numero', label: 'Un número' },
                      { key: 'especial', label: 'Un carácter especial' }
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${validacionPass[key] ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className={`text-xs ${validacionPass[key] ? 'text-emerald-700' : 'text-slate-500'}`}>{label}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar nueva contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassConfirmar ? 'text' : 'password'}
                      value={passConfirmar}
                      onChange={e => setPassConfirmar(e.target.value)}
                      className={`w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-10 ${
                        passConfirmar && !passMatch ? 'border-red-300' : 'border-slate-200'
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassConfirmar(!showPassConfirmar)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassConfirmar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passConfirmar && !passMatch && (
                    <p className="text-xs text-red-600 mt-1">Las contraseñas no coinciden</p>
                  )}
                </div>

                {errorPass && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-xs text-red-600">{errorPass}</p>
                  </div>
                )}
                {successPass && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded p-2 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <p className="text-xs text-emerald-600">{successPass}</p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      setMostrarCambioPass(false);
                      setErrorPass('');
                      setPassActual('');
                      setPassNueva('');
                      setPassConfirmar('');
                    }}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCambiarPassword}
                    disabled={guardandoPass || !passActual || !isPassValid || !passMatch}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    {guardandoPass ? 'Guardando...' : 'Cambiar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </>
  );
};

export default Header;