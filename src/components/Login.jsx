import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';

const Login = ({ onLogin, error, loading }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username.trim()) {
      setLocalError('El nombre de usuario es requerido');
      return;
    }
    
    if (!formData.password.trim()) {
      setLocalError('La contraseña es requerida');
      return;
    }

    try {
      await onLogin(formData.username, formData.password);
    } catch (err) {
      // Error handled by parent component
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-200">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="bg-slate-800 w-16 h-16 rounded mx-auto mb-4 flex items-center justify-center">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-slate-800">UPDATE TECH</h1>
          <p className="text-slate-800">Sistema de Gestión</p>
        </div>

        {/* Login Form */}
        <div className="border rounded p-8 bg-white border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-800">
                Usuario
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-800" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all bg-white border-slate-200 text-slate-800 placeholder-slate-800"
                  placeholder="Ingresa tu usuario"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-800">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-800" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all bg-white border-slate-200 text-slate-800 placeholder-slate-800"
                  placeholder="Ingresa tu contraseña"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-800 hover:text-emerald-600"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {displayError && (
              <div className="bg-slate-200 border border-slate-200 rounded p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-slate-800" />
                  <span className="text-sm text-slate-800">{displayError}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded font-medium hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-800">
              Sistema de gestión empresarial - UPDATE TECH
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;