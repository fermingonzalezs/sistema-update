import React from 'react';

/**
 * Template HTML del email de venta
 * Este componente renderiza el HTML que se envía por email
 * Usa estilos inline para compatibilidad con clientes de email
 */
const EmailTemplate = ({
  destinatario,
  destinatarioReal,
  nombreCliente,
  numeroTransaccion,
  totalVenta,
  fecha,
  ubicacion = 'la_plata', // 'la_plata' o 'mitre'
  modoTesting = true,
  items = [],
  clienteTelefono = '',
  clienteEmail = '',
  moneda = 'USD'
}) => {
  // Determinar texto de ubicación
  const textoUbicacion = ubicacion === 'mitre' ? 'CABA, Buenos Aires, Argentina' : 'La Plata, Buenos Aires, Argentina';

  // Datos de ejemplo si items está vacío (para preview)
  const itemsMostrar = items.length > 0 ? items : [
    { description: 'Producto de Ejemplo 1', quantity: 1, unitPrice: 1000, amount: 1000 },
    { description: 'Producto de Ejemplo 2', quantity: 2, unitPrice: 125, amount: 250 }
  ];

  return (
    <html lang="es">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Recibo de Compra - {numeroTransaccion}</title>
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'Arial, sans-serif', backgroundColor: '#ffffff' }}>
        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#ffffff', padding: '0' }}>
          <tbody>
            <tr>
              <td align="center">
                {/* TESTING MODE BANNER */}
                {modoTesting && (
                  <div style={{ width: '100%', backgroundColor: '#FEF3C7', border: '2px solid #F59E0B', padding: '15px', marginBottom: '0', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#92400E' }}>
                      ⚠️ MODO PRUEBA - Este email debería haber sido enviado a: {destinatarioReal}
                    </p>
                  </div>
                )}

                {/* Main Container */}
                <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{ width: '100%', backgroundColor: '#ffffff', overflow: 'hidden' }}>

                  {/* Header con logos - igual que el recibo */}
                  <tbody>
                    <tr>
                      <td style={{ backgroundColor: '#000000', padding: '20px 25px' }}>
                        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0">
                          <tbody>
                            <tr>
                              {/* Logos a la izquierda */}
                              <td style={{ verticalAlign: 'middle', textAlign: 'left', width: '50%' }}>
                                <img src="https://xixvlncckcfyjpqsxofq.supabase.co/storage/v1/object/public/logos/logo.png" alt="Logo Update" style={{ width: '35px', height: '35px', display: 'inline-block', verticalAlign: 'middle', marginRight: '12px' }} />
                                <img src="https://xixvlncckcfyjpqsxofq.supabase.co/storage/v1/object/public/logos/texto.png" alt="Update Tech" style={{ width: '85px', height: 'auto', display: 'inline-block', verticalAlign: 'middle' }} />
                              </td>
                              {/* Info empresa a la derecha */}
                              <td style={{ verticalAlign: 'middle', textAlign: 'right', width: '50%' }}>
                                <p style={{ margin: '0 0 10px 0', color: '#FFFFFF', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.3px', textTransform: 'uppercase' }}>UPDATE TECH WW S.R.L</p>
                                <p style={{ margin: 0, color: '#FFFFFF', fontSize: '10px', lineHeight: '1.4' }}>{textoUbicacion}</p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* Contenido */}
                    <tr>
                      <td style={{ padding: '40px 40px 20px', textAlign: 'center' }}>
                        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0">
                          <tbody>
                            <tr>
                              {/* Message Section */}
                              <td style={{ verticalAlign: 'top', width: '100%', textAlign: 'center' }}>
                                <p style={{ margin: '0 0 10px', fontSize: '16px', fontWeight: 'bold', color: '#1F2937' }}>Hola {nombreCliente}!</p>
                                <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
                                  Esperamos que hayas tenido una excelente experiencia con nosotros. Adjunto encontrarás el detalle de tu compra y la documentación correspondiente.
                                </p>
                                <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>
                                  Fecha: <span style={{ color: '#000', fontWeight: 'bold' }}>{fecha}</span>
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* Items Table */}
                    <tr>
                      <td style={{ padding: '20px 40px' }}>
                        <div style={{ maxWidth: '60%', margin: '0 auto' }}>
                        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0">
                          {/* Table Header */}
                          <thead>
                            <tr style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                              <td style={{ padding: '10px 15px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center' }}>ITEM</td>
                              <td style={{ padding: '10px 15px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center' }}>CANTIDAD</td>
                              <td style={{ padding: '10px 15px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center' }}>PRECIO</td>
                              <td style={{ padding: '10px 15px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center' }}>TOTAL</td>
                            </tr>
                          </thead>

                          {/* Item Rows */}
                          <tbody>
                            {itemsMostrar.map((item, index) => (
                              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f3f4f6' : '#ffffff' }}>
                                <td style={{ padding: '12px 15px', fontSize: '12px', color: '#333', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>{item.description}</td>
                                <td style={{ padding: '12px 15px', fontSize: '12px', color: '#333', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>{item.quantity}</td>
                                <td style={{ padding: '12px 15px', fontSize: '12px', color: '#333', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>{moneda === 'USD' ? 'US$' : '$'} {item.unitPrice}</td>
                                <td style={{ padding: '12px 15px', fontSize: '12px', color: '#333', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>{moneda === 'USD' ? 'US$' : '$'} {item.amount}</td>
                              </tr>
                            ))}
                            {/* Total Row */}
                            <tr style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                              <td colSpan={2} style={{ padding: '12px 15px', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center' }}>TOTAL</td>
                              <td colSpan={2} style={{ padding: '12px 15px', fontSize: '20px', fontWeight: 'normal', textTransform: 'uppercase', textAlign: 'center' }}>{totalVenta}</td>
                            </tr>
                          </tbody>
                        </table>
                        </div>
                      </td>
                    </tr>

                    {/* Footer Message */}
                    <tr>
                      <td style={{ padding: '20px 40px 40px', textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#333', textTransform: 'uppercase', letterSpacing: '1px' }}>¡GRACIAS POR TU COMPRA!</p>
                      </td>
                    </tr>

                    {/* Attachments Info */}
                    <tr>
                      <td style={{ padding: '20px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Se adjuntan recibo y garantías en formato PDF.</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
};

export default EmailTemplate;

/**
 * Función helper para generar el HTML string desde el componente
 * Útil para la Edge Function
 */
export const generarHTMLEmail = (datos) => {
  const {
    destinatario,
    destinatarioReal,
    nombreCliente,
    numeroTransaccion,
    totalVenta,
    fecha,
    ubicacion = 'la_plata', // 'la_plata' o 'mitre'
    modoTesting = true,
    items = [],
    clienteTelefono = '',
    clienteEmail = '',
    moneda = 'USD'
  } = datos;

  // Determinar texto de ubicación
  const textoUbicacion = ubicacion === 'mitre' ? 'CABA, Buenos Aires, Argentina' : 'La Plata, Buenos Aires, Argentina';

  // Datos de ejemplo si items está vacío (para preview)
  const itemsMostrar = items.length > 0 ? items : [
    { description: 'Producto de Ejemplo 1', quantity: 1, unitPrice: 1000, amount: 1000 },
    { description: 'Producto de Ejemplo 2', quantity: 2, unitPrice: 125, amount: 250 }
  ];

  // Generar ID único para prevenir clipping
  const uniqueId = new Date().getTime().toString();

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recibo de Compra - ${numeroTransaccion}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
      <!-- Preheader text para prevenir clipping de Gmail -->
      <div style="display: none; max-height: 0px; overflow: hidden; opacity: 0;">
        Recibo de tu compra ${numeroTransaccion} - Update Tech - ${fecha} - ID: ${uniqueId}
      </div>

      <!-- Anti-clipping spacer -->
      <div style="display: none; max-height: 0px; overflow: hidden;">
        &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 0;">
        <tr>
          <td align="center">
            ${modoTesting ? `
            <!-- TESTING MODE BANNER -->
            <div style="width: 100%; background-color: #FEF3C7; border: 2px solid #F59E0B; padding: 15px; margin-bottom: 0; text-align: center;">
              <p style="margin: 0; font-size: 14px; font-weight: bold; color: #92400E;">⚠️ MODO PRUEBA - Este email debería haber sido enviado a: ${destinatarioReal}</p>
            </div>
            ` : ''}

            <!-- Main Container -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #ffffff; overflow: hidden;">
              
              <!-- Header con logos - igual que el recibo -->
              <tr>
                <td style="background-color: #000000; padding: 20px 25px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <!-- Logos a la izquierda -->
                      <td style="vertical-align: middle; text-align: left; width: 50%;">
                        <img src="https://xixvlncckcfyjpqsxofq.supabase.co/storage/v1/object/public/logos/logo.png" alt="Logo Update" style="width: 35px; height: 35px; display: inline-block; vertical-align: middle; margin-right: 12px;" />
                        <img src="https://xixvlncckcfyjpqsxofq.supabase.co/storage/v1/object/public/logos/texto.png" alt="Update Tech" style="width: 85px; height: auto; display: inline-block; vertical-align: middle;" />
                      </td>
                      <!-- Info empresa a la derecha -->
                      <td style="vertical-align: middle; text-align: right; width: 50%;">
                        <p style="margin: 0 0 10px 0; color: #FFFFFF; font-size: 12px; font-weight: bold; letter-spacing: 0.3px; text-transform: uppercase;">UPDATE TECH WW S.R.L</p>
                        <p style="margin: 0; color: #FFFFFF; font-size: 10px; line-height: 1.4;">${textoUbicacion}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Contenido -->
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <!-- Message Section -->
                      <td style="vertical-align: top; width: 100%; text-align: center;">
                        <p style="margin: 0 0 10px; font-size: 16px; font-weight: bold; color: #1F2937;">Hola ${nombreCliente}!</p>
                        <p style="margin: 0 0 20px 0; font-size: 14px; color: #374151; line-height: 1.6;">
                          Esperamos que hayas tenido una excelente experiencia con nosotros. Adjunto encontrarás el detalle de tu compra y la documentación correspondiente.
                        </p>
                        <p style="margin: 0; font-size: 14px; color: #6B7280;">Fecha: <span style="color: #000; font-weight: bold;">${fecha}</span></p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Items Table -->
              <tr>
                <td style="padding: 20px 40px;">
                  <div style="max-width: 60%; margin: 0 auto;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <!-- Table Header -->
                    <tr style="background-color: #000000; color: #ffffff;">
                      <td style="padding: 10px 15px; font-size: 12px; font-weight: bold; text-transform: uppercase; text-align: center;">ITEM</td>
                      <td style="padding: 10px 15px; font-size: 12px; font-weight: bold; text-transform: uppercase; text-align: center;">CANTIDAD</td>
                      <td style="padding: 10px 15px; font-size: 12px; font-weight: bold; text-transform: uppercase; text-align: center;">PRECIO</td>
                      <td style="padding: 10px 15px; font-size: 12px; font-weight: bold; text-transform: uppercase; text-align: center;">TOTAL</td>
                    </tr>
                    
                    <!-- Item Rows -->
                    ${itemsMostrar.map((item, index) => `
                    <tr style="background-color: ${index % 2 === 0 ? '#f3f4f6' : '#ffffff'};">
                      <td style="padding: 12px 15px; font-size: 12px; color: #333; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.description}</td>
                      <td style="padding: 12px 15px; font-size: 12px; color: #333; text-align: center; border-bottom: 1px solid #e5e7eb;">${item.quantity}</td>
                      <td style="padding: 12px 15px; font-size: 12px; color: #333; text-align: center; border-bottom: 1px solid #e5e7eb;">${moneda === 'USD' ? 'US$' : '$'} ${item.unitPrice}</td>
                      <td style="padding: 12px 15px; font-size: 12px; color: #333; text-align: center; border-bottom: 1px solid #e5e7eb;">${moneda === 'USD' ? 'US$' : '$'} ${item.amount}</td>
                    </tr>
                    `).join('')}
                    
                    <!-- Total Row -->
                    <tr style="background-color: #000000; color: #ffffff;">
                      <td colspan="2" style="padding: 12px 15px; font-size: 14px; font-weight: bold; text-transform: uppercase; text-align: center;">TOTAL</td>
                      <td colspan="2" style="padding: 12px 15px; font-size: 20px; font-weight: normal; text-transform: uppercase; text-align: center;">${totalVenta}</td>
                    </tr>
                  </table>
                  </div>
                </td>
              </tr>

              <!-- Footer Message -->
              <tr>
                <td style="padding: 20px 40px 40px; text-align: center;">
                  <p style="margin: 0; font-size: 16px; font-weight: bold; color: #333; text-transform: uppercase; letter-spacing: 1px;">¡GRACIAS POR TU COMPRA!</p>
                </td>
              </tr>

              <!-- Attachments Info -->
               <tr>
                 <td style="padding: 20px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #6b7280;">Se adjuntan recibo y garantías en formato PDF.</p>
                 </td>
               </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};
