import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, x-application-name, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

async function fetchImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    console.log('🚀 Edge Function iniciada');

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY no está configurada');
      throw new Error('RESEND_API_KEY not configured');
    }
    console.log('✅ RESEND_API_KEY encontrada');

    console.log('📦 Parseando request body...');
    const requestBody = await req.json();

    const {
      destinatario,
      nombreCliente,
      numeroTransaccion,
      totalVenta,
      fecha,
      ubicacion = 'la_plata',
      reciboPDF,
      garantiasPDF,
      items = [],
      moneda = 'USD'
    } = requestBody;

    const destinatarioReal = destinatario;
    const destinatarioTesting = 'soporte.updatenotebooks@gmail.com';

    console.log('📦 Request body parseado');
    console.log('⚠️ MODO PRUEBA: Email a', destinatarioTesting);

    const textoUbicacion = ubicacion === 'mitre' ? 'CABA, Buenos Aires, Argentina' : 'La Plata, Buenos Aires, Argentina';

    // URLs públicas de los logos (más ligero que base64 para evitar clipping de Gmail)
    const logoUrl = 'https://xixvlncckcfyjpqsxofq.supabase.co/storage/v1/object/public/logos/logo.png';
    const textoUrl = 'https://xixvlncckcfyjpqsxofq.supabase.co/storage/v1/object/public/logos/texto.png';

    console.log('🎨 Generando template HTML...');

    // Generar ID único para prevenir clipping de Gmail
    const uniqueId = new Date().getTime().toString();

    // Función para formatear moneda
    const formatearPrecio = (valor: number) => {
      return new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(valor);
    };

    // Datos de ejemplo si items está vacío
    const itemsMostrar = items.length > 0 ? items : [
      { description: 'Producto de Ejemplo 1', quantity: 1, unitPrice: 1000, amount: 1000 },
      { description: 'Producto de Ejemplo 2', quantity: 2, unitPrice: 125, amount: 250 }
    ];

    const htmlEmail = `
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
              <!-- TESTING MODE BANNER -->
              <div style="width: 100%; background-color: #FEF3C7; border: 2px solid #F59E0B; padding: 15px; margin-bottom: 0; text-align: center;">
                <p style="margin: 0; font-size: 14px; font-weight: bold; color: #92400E;">⚠️ MODO PRUEBA - Este email debería haber sido enviado a: ${destinatarioReal}</p>
              </div>

              <!-- Main Container -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #ffffff; overflow: hidden;">

                <!-- Header con logos - igual que el recibo -->
                <tr>
                  <td style="background-color: #000000; padding: 20px 25px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <!-- Logos a la izquierda -->
                        <td style="vertical-align: middle; text-align: left; width: 50%;">
                          <img src="${logoUrl}" alt="Logo Update" style="width: 35px; height: 35px; display: inline-block; vertical-align: middle; margin-right: 12px;" />
                          <img src="${textoUrl}" alt="Update Tech" style="width: 85px; height: auto; display: inline-block; vertical-align: middle;" />
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
                        <td style="padding: 12px 15px; font-size: 12px; color: #333; text-align: center; border-bottom: 1px solid #e5e7eb;">${moneda === 'USD' ? 'US$' : '$'} ${formatearPrecio(item.unitPrice)}</td>
                        <td style="padding: 12px 15px; font-size: 12px; color: #333; text-align: center; border-bottom: 1px solid #e5e7eb;">${moneda === 'USD' ? 'US$' : '$'} ${formatearPrecio(item.amount)}</td>
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
    console.log('✅ Template HTML generado');

    console.log('📎 Preparando adjuntos...');
    const attachments = [];

    if (reciboPDF) {
      attachments.push({
        filename: `Recibo-${numeroTransaccion}.pdf`,
        content: reciboPDF
      });
      console.log(`✅ Recibo PDF adjuntado`);
    }

    if (garantiasPDF && garantiasPDF.length > 0) {
      garantiasPDF.forEach((garantiaBase64: string, index: number) => {
        attachments.push({
          filename: `Garantia-${numeroTransaccion}-${index + 1}.pdf`,
          content: garantiaBase64
        });
        console.log(`✅ Garantía ${index + 1} PDF adjuntada`);
      });
    }

    console.log(`📧 Enviando email vía Resend API...`);
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Update Tech <onboarding@resend.dev>',
        to: [destinatarioTesting],
        subject: `[PRUEBA] Recibo de Compra - ${numeroTransaccion} - ${nombreCliente}`,
        html: htmlEmail,
        attachments
      })
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('❌ Error de Resend API:', resendData);
      throw new Error(`Resend API error: ${JSON.stringify(resendData)}`);
    }

    console.log('✅ Email enviado exitosamente! ID:', resendData.id);
    return new Response(
      JSON.stringify({
        success: true,
        messageId: resendData.id,
        testingMode: true,
        sentTo: destinatarioTesting,
        originalRecipient: destinatarioReal
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('❌ Error general:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
