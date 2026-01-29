import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

const Login = ({ onLogin, error, loading }) => {
  const [formData, setFormData] = useState({
    email: '',
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

    if (!formData.email.trim()) {
      setLocalError('El email es requerido');
      return;
    }

    if (!formData.password.trim()) {
      setLocalError('La contraseña es requerida');
      return;
    }

    try {
      await onLogin(formData.email, formData.password);
    } catch (err) {
      // Error handled by parent component
    }
  };

  const displayError = localError || error;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Glass Container */}
        <div className="backdrop-blur-xl bg-slate-900/70 border border-slate-700/50 rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in duration-300 ring-1 ring-emerald-500/20">

          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center bg-slate-800/50 rounded-full cursor-default border border-slate-700/50 backdrop-blur-sm shadow-lg group hover:scale-105 transition-transform duration-300">
              <img
                src="/logo.png"
                alt="Update Tech"
                className="w-16 h-16 object-contain drop-shadow-lg"
              />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-wide drop-shadow-md">UPDATE TECH</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-300 uppercase tracking-wider ml-1">
                Email
              </label>
              <div className="relative group">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:bg-slate-800/80 focus:border-emerald-500 transition-all text-white placeholder-slate-500 backdrop-blur-sm shadow-inner group-hover:border-slate-600"
                  placeholder="usuario@updatetech.com.ar"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-300 uppercase tracking-wider ml-1">
                Contraseña
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:bg-slate-800/80 focus:border-emerald-500 transition-all text-white placeholder-slate-500 backdrop-blur-sm shadow-inner group-hover:border-slate-600"
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-slate-400 hover:text-emerald-400 transition-colors rounded-full hover:bg-slate-700/50"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {displayError && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <span className="text-sm text-red-100 font-medium">{displayError}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 px-4 rounded-xl font-bold hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Accediendo...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2 opacity-80" />
                  <span>INICIAR SESIÓN</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;