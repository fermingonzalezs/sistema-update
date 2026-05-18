import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle, KeyRound } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const ResetPassword = ({ onSuccess }) => {
  const [phase, setPhase] = useState('validating'); // 'validating' | 'form' | 'success' | 'error'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [validacion, setValidacion] = useState({
    longitud: false,
    mayuscula: false,
    minuscula: false,
    numero: false,
    especial: false
  });

  // Validar password en tiempo real
  useEffect(() => {
    setValidacion({
      longitud: password.length >= 8,
      mayuscula: /[A-Z]/.test(password),
      minuscula: /[a-z]/.test(password),
      numero: /\d/.test(password),
      especial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  }, [password]);

  const isPasswordValid = Object.values(validacion).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword !== '';

  // Al montar, detectar code en URL y validarlo
  useEffect(() => {
    const validateCode = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const errorDescription = params.get('error_description');

      if (errorDescription) {
        setError(decodeURIComponent(errorDescription));
        setPhase('error');
        return;
      }

      if (!code) {
        setError('Link de recuperación inválido o expirado. Solicitá uno nuevo.');
        setPhase('error');
        return;
      }

      try {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
        setPhase('form');
      } catch (err) {
        console.error('Error validando código:', err);
        setError(err.message || 'El link de recuperación es inválido o expiró.');
        setPhase('error');
      }
    };

    validateCode();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('La contraseña no cumple con los requisitos de seguridad');
      return;
    }

    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      // Limpiar sesión temporal y URL
      await supabase.auth.signOut();
      window.history.replaceState({}, document.title, window.location.pathname);

      setPhase('success');
    } catch (err) {
      console.error('Error actualizando contraseña:', err);
      setError(err.message || 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Limpiar URL
    window.history.replaceState({}, document.title, window.location.pathname);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="backdrop-blur-xl bg-slate-900/70 border border-slate-700/50 rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in duration-300 ring-1 ring-emerald-500/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-slate-800/50 rounded-full cursor-default border border-slate-700/50 backdrop-blur-sm shadow-lg">
              <KeyRound className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-wide drop-shadow-md">
              {phase === 'validating' ? 'VALIDANDO LINK...' : phase === 'success' ? 'CONTRASEÑA ACTUALIZADA' : 'NUEVA CONTRASEÑA'}
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              {phase === 'validating'
                ? 'Estamos verificando tu link de recuperación...'
                : phase === 'success'
                ? 'Tu contraseña fue actualizada exitosamente.'
                : 'Establecé una nueva contraseña segura para tu cuenta.'}
            </p>
          </div>

          {phase === 'validating' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
              <span className="text-sm text-slate-300">Verificando...</span>
            </div>
          )}

          {phase === 'error' && (
            <div className="space-y-6">
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-100 font-medium">Error</p>
                    <p className="text-xs text-red-200/70 mt-1">{error}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleBack}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-xl font-bold hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all flex items-center justify-center space-x-2 shadow-lg"
              >
                <ArrowLeft className="w-4 h-4 mr-2 opacity-80" />
                <span>VOLVER AL LOGIN</span>
              </button>
            </div>
          )}

          {phase === 'success' && (
            <div className="space-y-6">
              <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-emerald-100 font-medium">¡Listo!</p>
                    <p className="text-xs text-emerald-200/70 mt-1">
                      Ahora podés iniciar sesión con tu nueva contraseña.
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleBack}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-xl font-bold hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all flex items-center justify-center space-x-2 shadow-lg"
              >
                <ArrowLeft className="w-4 h-4 mr-2 opacity-80" />
                <span>IR AL LOGIN</span>
              </button>
            </div>
          )}

          {phase === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                    <span className="text-sm text-red-100 font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Nueva Contraseña */}
              <div>
                <label className="block text-xs font-bold mb-2 text-slate-300 uppercase tracking-wider ml-1">
                  Nueva Contraseña
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:bg-slate-800/80 focus:border-emerald-500 transition-all text-white placeholder-slate-500 backdrop-blur-sm shadow-inner group-hover:border-slate-600 pr-12"
                    placeholder="••••••••"
                    disabled={loading}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-slate-400 hover:text-emerald-400 transition-colors rounded-full hover:bg-slate-700/50"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Validaciones */}
              {password && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Requisitos:</p>
                  {[
                    { key: 'longitud', label: 'Al menos 8 caracteres' },
                    { key: 'mayuscula', label: 'Una letra mayúscula' },
                    { key: 'minuscula', label: 'Una letra minúscula' },
                    { key: 'numero', label: 'Un número' },
                    { key: 'especial', label: 'Un carácter especial (!@#$%^&*)' }
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${validacion[key] ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                      <span className={`text-xs ${validacion[key] ? 'text-emerald-300' : 'text-slate-400'}`}>{label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Confirmar Contraseña */}
              <div>
                <label className="block text-xs font-bold mb-2 text-slate-300 uppercase tracking-wider ml-1">
                  Confirmar Contraseña
                </label>
                <div className="relative group">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-3.5 bg-slate-800/50 border rounded-xl focus:outline-none focus:bg-slate-800/80 focus:border-emerald-500 transition-all text-white placeholder-slate-500 backdrop-blur-sm shadow-inner group-hover:border-slate-600 pr-12 ${
                      confirmPassword && !passwordsMatch ? 'border-red-500/50' : 'border-slate-700'
                    }`}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-slate-400 hover:text-emerald-400 transition-colors rounded-full hover:bg-slate-700/50"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="mt-2 text-xs text-red-400">Las contraseñas no coinciden</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !isPasswordValid || !passwordsMatch}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 px-4 rounded-xl font-bold hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Actualizando...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2 opacity-80" />
                    <span>ESTABLECER NUEVA CONTRASEÑA</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="w-full text-slate-400 hover:text-white text-sm font-medium transition-colors flex items-center justify-center space-x-2 py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al login</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
