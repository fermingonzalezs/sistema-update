import React, { useState } from 'react';
import { Eye, Code, Copy, Check } from 'lucide-react';
import EmailTemplate, { generarHTMLEmail } from '../modules/ventas/components/email/EmailTemplate';

/**
 * Página de previsualización del template de email
 * Permite ver y editar el template sin tener que generar una venta real
 */
const EmailPreview = () => {
  const [vistaActual, setVistaActual] = useState('preview'); // 'preview' o 'code'
  const [copiado, setCopiado] = useState(false);

  // Datos de ejemplo editables
  const [datosEjemplo, setDatosEjemplo] = useState({
    destinatario: 'cliente@example.com',
    destinatarioReal: 'cliente@example.com',
    nombreCliente: 'Juan Pérez',
    numeroTransaccion: 'REC-000123',
    totalVenta: 'US$ 1,250',
    fecha: new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }),
    ubicacion: 'la_plata', // 'la_plata' o 'mitre'
    modoTesting: true,
    items: [
      { description: 'MacBook Air M2', quantity: 1, unitPrice: 1200, amount: 1200 },
      { description: 'Funda Protectora', quantity: 1, unitPrice: 50, amount: 50 }
    ]
  });

  const handleCopiarHTML = async () => {
    const htmlString = generarHTMLEmail(datosEjemplo);
    await navigator.clipboard.writeText(htmlString);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleActualizarDato = (campo, valor) => {
    setDatosEjemplo(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-800 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold mb-2">Previsualización Template Email</h1>
          <p className="text-slate-300 text-sm">Edita y previsualiza el template del email de ventas</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de edición de datos */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Datos de Ejemplo</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nombre Cliente
                  </label>
                  <input
                    type="text"
                    value={datosEjemplo.nombreCliente}
                    onChange={(e) => handleActualizarDato('nombreCliente', e.target.value)}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Número Transacción
                  </label>
                  <input
                    type="text"
                    value={datosEjemplo.numeroTransaccion}
                    onChange={(e) => handleActualizarDato('numeroTransaccion', e.target.value)}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Total Venta
                  </label>
                  <input
                    type="text"
                    value={datosEjemplo.totalVenta}
                    onChange={(e) => handleActualizarDato('totalVenta', e.target.value)}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fecha
                  </label>
                  <input
                    type="text"
                    value={datosEjemplo.fecha}
                    onChange={(e) => handleActualizarDato('fecha', e.target.value)}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email Cliente
                  </label>
                  <input
                    type="email"
                    value={datosEjemplo.destinatarioReal}
                    onChange={(e) => handleActualizarDato('destinatarioReal', e.target.value)}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Sucursal
                  </label>
                  <select
                    value={datosEjemplo.ubicacion}
                    onChange={(e) => handleActualizarDato('ubicacion', e.target.value)}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                  >
                    <option value="la_plata">La Plata</option>
                    <option value="mitre">Mitre (CABA)</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="modoTesting"
                    checked={datosEjemplo.modoTesting}
                    onChange={(e) => handleActualizarDato('modoTesting', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="modoTesting" className="text-sm text-slate-700">
                    Mostrar banner de testing
                  </label>
                </div>
              </div>

              {/* Instrucciones */}
              <div className="mt-6 p-4 bg-slate-50 rounded border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800 mb-2">📝 Instrucciones</h3>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>• Edita los datos para ver cambios en tiempo real</li>
                  <li>• Usa el botón "Vista Código" para ver el HTML</li>
                  <li>• Copia el HTML para actualizar la Edge Function</li>
                  <li>• Los cambios aquí NO afectan el email real</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Panel de previsualización */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded border border-slate-200">
              {/* Toolbar */}
              <div className="border-b border-slate-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setVistaActual('preview')}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${vistaActual === 'preview'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                  >
                    <Eye size={16} />
                    Vista Preview
                  </button>
                  <button
                    onClick={() => setVistaActual('code')}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${vistaActual === 'code'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                  >
                    <Code size={16} />
                    Vista Código
                  </button>
                </div>

                {vistaActual === 'code' && (
                  <button
                    onClick={handleCopiarHTML}
                    className="px-4 py-2 rounded text-sm font-medium bg-slate-700 text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
                  >
                    {copiado ? (
                      <>
                        <Check size={16} />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copiar HTML
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Contenido */}
              <div className="p-6">
                {vistaActual === 'preview' ? (
                  <div className="border border-slate-200 rounded overflow-hidden">
                    <iframe
                      srcDoc={generarHTMLEmail(datosEjemplo)}
                      className="w-full h-[800px]"
                      title="Email Preview"
                    />
                  </div>
                ) : (
                  <div className="bg-slate-900 rounded p-4 overflow-auto max-h-[800px]">
                    <pre className="text-xs text-slate-100 font-mono">
                      <code>{generarHTMLEmail(datosEjemplo)}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instrucciones finales */}
        <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded p-4">
          <h3 className="text-sm font-semibold text-emerald-800 mb-2">🚀 Cómo actualizar el email real:</h3>
          <ol className="text-sm text-emerald-700 space-y-1 ml-4 list-decimal">
            <li>Edita el template en <code className="bg-emerald-100 px-1 rounded">src/modules/ventas/components/email/EmailTemplate.jsx</code></li>
            <li>Previsualiza los cambios aquí mismo</li>
            <li>Copia el HTML generado (botón "Copiar HTML")</li>
            <li>Actualiza la Edge Function <code className="bg-emerald-100 px-1 rounded">send-receipt-email</code> en Supabase</li>
            <li>Prueba enviando un email de venta real</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default EmailPreview;
