import React, { useState } from 'react';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const RecuperarPassword = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email.trim()) {
      setError('El email es requerido');
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (resetError) throw resetError;

      setSuccess(true);
    } catch (err) {
      console.error('Error enviando recuperación:', err);
      setError(err.message || 'Error al enviar el email de recuperación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="backdrop-blur-xl bg-slate-900/70 border border-slate-700/50 rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in duration-300 ring-1 ring-emerald-500/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-slate-800/50 rounded-full cursor-default border border-slate-700/50 backdrop-blur-sm shadow-lg">
              <Mail className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-wide drop-shadow-md">RECUPERAR CONTRASEÑA</h1>
            <p className="text-slate-400 mt-2 text-sm">
              Ingresá tu email y te enviaremos un link para restablecer tu contraseña.
            </p>
          </div>

          {success ? (
            <div className="space-y-6">
              <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-emerald-100 font-medium">Email enviado correctamente</p>
                    <p className="text-xs text-emerald-200/70 mt-1">
                      Revisá tu bandeja de entrada (y spam) para continuar con la recuperación.
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={onBack}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-xl font-bold hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all flex items-center justify-center space-x-2 shadow-lg"
              >
                <ArrowLeft className="w-4 h-4 mr-2 opacity-80" />
                <span>VOLVER AL LOGIN</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                    <span className="text-sm text-red-100 font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-xs font-bold mb-2 text-slate-300 uppercase tracking-wider ml-1">
                  Email
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:bg-slate-800/80 focus:border-emerald-500 transition-all text-white placeholder-slate-500 backdrop-blur-sm shadow-inner group-hover:border-slate-600"
                    placeholder="usuario@updatetech.com.ar"
                    disabled={loading}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 px-4 rounded-xl font-bold hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2 opacity-80" />
                    <span>ENVIAR LINK DE RECUPERACIÓN</span>
                  </>
                )}
              </button>

              {/* Back to Login */}
              <button
                type="button"
                onClick={onBack}
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

export default RecuperarPassword;
