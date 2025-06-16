import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Shield, Eye, Loader2 } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import GarantiaDocument, { convertirVentaAGarantia } from './GarantiaPDF';
import ReciboVentaDocument, { convertirVentaARecibo } from './ReciboVentaPDF';

const ModalVistaPreviaPDF = ({ 
  open, 
  onClose, 
  transaccion, 
  tipo = 'recibo' // 'recibo' o 'garantia'
}) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && transaccion) {
      generarVistaPrevia();
    }
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [open, transaccion, tipo]);

  const generarVistaPrevia = async () => {
    try {
      setLoading(true);
      setError(null);

      let documento;
      
      if (tipo === 'garantia') {
        const garantiaData = convertirVentaAGarantia(transaccion, transaccion.venta_items);
        documento = <GarantiaDocument data={garantiaData} />;
      } else {
        const reciboData = convertirVentaARecibo(transaccion);
        documento = <ReciboVentaDocument data={reciboData} />;
      }

      const blob = await pdf(documento).toBlob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      
    } catch (err) {
      console.error('Error generando vista previa:', err);
      setError('Error al generar la vista previa del PDF');
    } finally {
      setLoading(false);
    }
  };

  const descargarPDF = async () => {
    try {
      setLoading(true);
      
      let documento, filename;
      
      if (tipo === 'garantia') {
        const garantiaData = convertirVentaAGarantia(transaccion, transaccion.venta_items);
        documento = <GarantiaDocument data={garantiaData} />;
        filename = `garantia-${garantiaData.numeroGarantia}-${transaccion.cliente_nombre || 'cliente'}-${new Date().toISOString().split('T')[0]}.pdf`;
      } else {
        const reciboData = convertirVentaARecibo(transaccion);
        documento = <ReciboVentaDocument data={reciboData} />;
        filename = `recibo-${reciboData.numeroRecibo}-${transaccion.cliente_nombre || 'cliente'}-${new Date().toISOString().split('T')[0]}.pdf`;
      }

      const blob = await pdf(documento).toBlob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Error descargando PDF:', err);
      setError('Error al descargar el PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setError(null);
    onClose();
  };

  if (!open) return null;

  const getTitulo = () => {
    return tipo === 'garantia' ? 'Vista Previa - Certificado de Garantía' : 'Vista Previa - Recibo de Venta';
  };

  const getIcono = () => {
    return tipo === 'garantia' ? <Shield className="w-6 h-6" /> : <FileText className="w-6 h-6" />;
  };

  const getColor = () => {
    return tipo === 'garantia' ? 'from-blue-600 to-indigo-700' : 'from-emerald-600 to-green-700';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b bg-gradient-to-r ${getColor()} text-white`}>
          <div className="flex items-center space-x-3">
            {getIcono()}
            <div>
              <h2 className="text-2xl font-bold">{getTitulo()}</h2>
              <p className="text-gray-100 text-sm">
                {transaccion?.cliente_nombre || 'Cliente'} - {transaccion?.numero_transaccion || 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={descargarPDF}
              disabled={loading || error}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Descargar</span>
            </button>
            <button 
              onClick={handleClose} 
              className="text-white hover:text-gray-200 p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Información de la transacción */}
        {transaccion && (
          <div className="p-4 bg-gray-50 border-b">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Cliente:</span>
                <p className="text-gray-900">{transaccion.cliente_nombre || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Fecha:</span>
                <p className="text-gray-900">
                  {transaccion.fecha_venta ? new Date(transaccion.fecha_venta).toLocaleDateString('es-AR') : 'N/A'}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Total:</span>
                <p className="text-gray-900 font-semibold">
                  ${parseFloat(transaccion.total_venta || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Método de pago:</span>
                <p className="text-gray-900">{transaccion.metodo_pago || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Contenido del PDF */}
        <div className="flex-1 p-6 overflow-auto" style={{ maxHeight: 'calc(95vh - 200px)' }}>
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Generando vista previa...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                    <X className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-red-800 mb-2">Error de Vista Previa</h3>
                  <p className="text-red-600 text-sm">{error}</p>
                  <button
                    onClick={generarVistaPrevia}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Intentar nuevamente
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && pdfUrl && (
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <iframe
                  src={pdfUrl}
                  className="w-full h-[600px] border-0"
                  title={`Vista previa ${tipo}`}
                />
              </div>
              
              {/* Información adicional */}
              <div className="mt-4 text-center text-sm text-gray-600">
                <div className="flex items-center justify-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>Vista previa del {tipo === 'garantia' ? 'certificado de garantía' : 'recibo de venta'}</span>
                </div>
                <p className="mt-1">
                  Use el botón "Descargar" para guardar el PDF en su dispositivo
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer con acciones adicionales */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {tipo === 'garantia' && (
                <span>💡 El certificado de garantía incluye todas las condiciones y términos aplicables</span>
              )}
              {tipo === 'recibo' && (
                <span>💡 El recibo incluye el detalle completo de la transacción</span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={descargarPDF}
                disabled={loading || error}
                className={`px-6 py-2 bg-gradient-to-r ${getColor()} text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center space-x-2`}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Descargar PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalVistaPreviaPDF;