import React, { useState, useEffect } from 'react';
import { Calendar, Gift, ShoppingBag, DollarSign, Clock, ChevronDown, ChevronUp, Mail, MessageCircle } from 'lucide-react';
import { formatearMonto, formatearFecha, parseFechaLocal } from '../../../shared/utils/formatters';

const CumpleanosProximos = ({ getProximosCumpleanosConHistorial }) => {
  const [cumpleanos, setCumpleanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const formatForWhatsApp = (phone) => {
    if (!phone) return '';
    let cleaned = phone.replace(/[\s-()]/g, '');
    if (cleaned.length === 10) {
      return `549${cleaned}`;
    }
    return cleaned;
  };

  useEffect(() => {
    cargarCumpleanos();
  }, []);

  const cargarCumpleanos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProximosCumpleanosConHistorial();
      setCumpleanos(data);
    } catch (err) {
      setError('Error al cargar cumpleaños próximos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatearDiasParaCumple = (dias) => {
    const diasRedondeado = Math.round(dias);
    if (diasRedondeado === 0) return 'Hoy';
    if (diasRedondeado === 1) return 'Mañana';
    if (diasRedondeado > 1) return `En ${diasRedondeado} días`;
    if (diasRedondeado === -1) return 'Ayer';
    if (diasRedondeado === -2) return 'Hace 2 días';
    if (diasRedondeado < -2) return `Hace ${-diasRedondeado} días`;
    return 'Hoy'; // Fallback
  };

  if (loading) {
    return (
      <div className="bg-white rounded border border-slate-200 p-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <Gift className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-800">Cumpleaños Próximos</h3>
        </div>
        <div className="text-slate-500">Cargando cumpleaños próximos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded border border-slate-200 p-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <Gift className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-800">Cumpleaños Próximos</h3>
        </div>
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!cumpleanos.length) {
    return (
      <div className="bg-white rounded border border-slate-200 p-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <Gift className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-800">Cumpleaños Próximos</h3>
        </div>
        <div className="text-slate-500">No hay cumpleaños en el rango de -2 a +15 días.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded border border-slate-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Gift className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-slate-800">Cumpleaños Próximos</h3>
          <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-sm font-medium">
            {cumpleanos.length} cliente{cumpleanos.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center space-x-1 p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
          title={isCollapsed ? "Mostrar cumpleaños" : "Ocultar cumpleaños"}
        >
          {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-center">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-2 px-3 text-sm font-medium text-slate-600">Cliente</th>
                <th className="py-2 px-3 text-sm font-medium text-slate-600">Cumpleaños</th>
                <th className="py-2 px-3 text-sm font-medium text-slate-600">Proximidad</th>
                <th className="py-2 px-3 text-sm font-medium text-slate-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cumpleanos.map((cliente) => {
                const { diasParaCumple } = cliente;

                const whatsappNumber = formatForWhatsApp(cliente.telefono);
                const nuevoMensaje = `Hola ${cliente.nombre}! Como andas? El equipo de Update Tech te desea un feliz cumpleaños 🥳🥳`;
                const mailtoLink = `mailto:${cliente.email}?subject=Feliz%20Cumpleaños%20${cliente.nombre}!&body=${encodeURIComponent(nuevoMensaje)}`;
                const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(nuevoMensaje)}`;

                return (
                  <tr key={cliente.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800">
                        {cliente.nombre} {cliente.apellido}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-sm text-slate-600">
                        {parseFechaLocal(cliente.cumpleanos)?.toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center space-x-1">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-600">
                          {formatearDiasParaCumple(diasParaCumple)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center space-x-1">
                        {cliente.email && (
                          <a href={mailtoLink} target="_blank" rel="noopener noreferrer" className="p-1.5 group rounded transition-colors hover:bg-gray-100" title="Enviar Email">
                            <Mail className="w-4 h-4 text-gray-500 group-hover:text-gray-900" />
                          </a>
                        )}
                        {cliente.telefono && (
                          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="p-1.5 group rounded transition-colors hover:bg-gray-100" title="Enviar WhatsApp">
                            <MessageCircle className="w-4 h-4 text-gray-500 group-hover:text-gray-900" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CumpleanosProximos;