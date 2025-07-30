import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SetupPassword = ({ emailOrUsername, displayName, onPasswordSet, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const [validacionPassword, setValidacionPassword] = useState({
    longitud: false,
    mayuscula: false,
    minuscula: false,
    numero: false,
    especial: false
  });

  // Validar password en tiempo real
  useEffect(() => {
    const { password } = formData;
    setValidacionPassword({
      longitud: password.length >= 8,
      mayuscula: /[A-Z]/.test(password),
      minuscula: /[a-z]/.test(password),
      numero: /\d/.test(password),
      especial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  }, [formData.password]);

  const isPasswordValid = Object.values(validacionPassword).every(Boolean);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      setError('La contraseña no cumple con los requisitos de seguridad');
      return;
    }

    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Actualizar contraseña en la tabla usuarios usando RPC
      const { error: updateError } = await supabase
        .rpc('configurar_primera_contrasena', {
          p_email_or_username: emailOrUsername,
          p_password: formData.password
        });

      if (updateError) throw updateError;

      // Notificar que la contraseña fue establecida
      onPasswordSet();

    } catch (err) {
      console.error('Error configurando contraseña:', err);
      setError(err.message || 'Error al configurar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-200">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-emerald-600 w-16 h-16 rounded mx-auto mb-4 flex items-center justify-center">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-slate-800">Configurar Contraseña</h1>
          <p className="text-slate-600">Bienvenido <span className="font-semibold">{displayName || emailOrUsername}</span></p>
          <p className="text-sm text-slate-500 mt-2">Establece una contraseña segura para tu cuenta</p>
        </div>

        {/* Form */}
        <div className="border rounded p-8 bg-white border-slate-200">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Ingresa tu nueva contraseña"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Validaciones de contraseña */}
            {formData.password && (
              <div className="bg-slate-50 border border-slate-200 rounded p-4">
                <p className="text-xs font-medium text-slate-700 mb-3">Requisitos de contraseña:</p>
                <div className="space-y-2">
                  {[
                    { key: 'longitud', label: 'Al menos 8 caracteres' },
                    { key: 'mayuscula', label: 'Una letra mayúscula' },
                    { key: 'minuscula', label: 'Una letra minúscula' },
                    { key: 'numero', label: 'Un número' },
                    { key: 'especial', label: 'Un carácter especial (!@#$%^&*)' }
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        validacionPassword[key] ? 'bg-emerald-500' : 'bg-slate-300'
                      }`} />
                      <span className={`text-xs ${
                        validacionPassword[key] ? 'text-emerald-700' : 'text-slate-500'
                      }`}>
                        {label}
                      </span>
                      {validacionPassword[key] && (
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Campo confirmar contraseña */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`w-full pl-10 pr-12 py-3 border placeholder-slate-500 text-slate-900 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    formData.confirmPassword && !passwordsMatch 
                      ? 'border-red-300' 
                      : 'border-slate-300'
                  }`}
                  placeholder="Confirma tu nueva contraseña"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formData.confirmPassword && !passwordsMatch && (
                <p className="mt-2 text-xs text-red-600">Las contraseñas no coinciden</p>
              )}
            </div>

            {/* Botones */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading || !isPasswordValid || !passwordsMatch}
                className="w-full bg-emerald-600 text-white py-3 px-4 rounded font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Configurando...</span>
                  </>
                ) : (
                  <span>Establecer Contraseña</span>
                )}
              </button>

              <button
                type="button"
                onClick={onBack}
                disabled={loading}
                className="w-full bg-slate-600 text-white py-2 px-4 rounded font-medium hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al Login</span>
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Una vez establecida tu contraseña, podrás acceder al sistema normalmente
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupPassword;