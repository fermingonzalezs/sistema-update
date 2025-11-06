import React, { useEffect, useState } from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2, Monitor, Smartphone, Box, CreditCard, DollarSign, Edit2, Check, RotateCcw, Mail, Loader } from 'lucide-react';
import ClienteSelector from '../../../modules/ventas/components/ClienteSelector';
import ConversionMonedas from '../../../components/currency/ConversionMonedas';
import { useVendedores } from '../../../modules/ventas/hooks/useVendedores';
import { cotizacionService } from '../../services/cotizacionService';
import { formatearMonto } from '../../utils/formatters';
import { generarGarantiaPDFBlob, generarNombreArchivoGarantia } from '../../../modules/ventas/utils/garantiaPDFService';
import { enviarGarantiasPorEmail } from '../../../modules/ventas/utils/emailService';

const CarritoWidget = ({ carrito, onUpdateCantidad, onUpdatePrecio, onRemover, onLimpiar, onProcesarVenta, clienteInicial = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [datosCliente, setDatosCliente] = useState({
    metodo_pago_1: 'efectivo_pesos',
    metodo_pago_2: '',
    monto_pago_1: 0,
    monto_pago_2: 0,
    recargo_pago_1: 0,
    recargo_pago_2: 0,
    observaciones: '',
    vendedor: '',
    sucursal: 'la_plata',
    cotizacion_dolar: 1000
  });

  // Estados locales para inputs para evitar problema del cursor
  const [inputMontoBase1, setInputMontoBase1] = useState('');
  const [inputMontoBase2, setInputMontoBase2] = useState('');
  const [inputMontoFinal1, setInputMontoFinal1] = useState('');
  const [inputMontoFinal2, setInputMontoFinal2] = useState('');
  const [inputRecargo1, setInputRecargo1] = useState('0');
  const [inputRecargo2, setInputRecargo2] = useState('0');

  // Usar el hook de vendedores
  const { vendedores, loading: loadingVendedores, fetchVendedores } = useVendedores();
  const [editandoCotizacion, setEditandoCotizacion] = useState(false);

  // Estados para edición de precios
  const [editandoPrecio, setEditandoPrecio] = useState(null); // ID del item siendo editado
  const [precioEditado, setPrecioEditado] = useState(''); // Valor temporal del precio
  const [preciosModificados, setPreciosModificados] = useState({}); // Precios originales guardados
  
  // Estado para prevenir doble procesamiento de ventas
  const [procesandoVenta, setProcesandoVenta] = useState(false);

  // Estados para pantalla de garantías
  const [mostrarPantallaGarantias, setMostrarPantallaGarantias] = useState(false);
  const [enviandoGarantias, setEnviandoGarantias] = useState(false);
  const [garantiasEnviadas, setGarantiasEnviadas] = useState(false);
  const [mensajeGarantias, setMensajeGarantias] = useState('');

  // Establecer cliente inicial cuando se proporciona
  useEffect(() => {
    if (clienteInicial && !clienteSeleccionado) {
      setClienteSeleccionado(clienteInicial);
      console.log('🧑‍💼 Cliente inicial establecido:', clienteInicial);
    }
  }, [clienteInicial, clienteSeleccionado]);

  // Estado para evitar reapertura automática
  const [carritoAnterior, setCarritoAnterior] = useState([]);
  const [aperturaManual, setAperturaManual] = useState(false);

  // Abrir automáticamente el widget cuando se agreguen items desde RegistrarVenta
  // Solo cuando el carrito pasa de vacío a tener elementos
  useEffect(() => {
    if (carrito && carrito.length > 0 && carritoAnterior.length === 0 && !isOpen && !procesandoVenta && !aperturaManual) {
      setIsOpen(true);
      setMostrarFormulario(true);
      console.log('🛒 CarritoWidget abierto automáticamente con', carrito.length, 'items');
    }
    setCarritoAnterior(carrito || []);
  }, [carrito]);

  // Determinar si un método necesita recargo (deshabilitado - solo un campo de monto)
  const necesitaRecargo = (metodoPago) => {
    return false; // Siempre false, solo un campo de monto
  };

  // Obtener recargo por defecto según el método de pago (opcional, usuario puede modificar)
  const obtenerRecargoPorDefecto = (metodoPago) => {
    switch (metodoPago) {
      case 'tarjeta_credito':
        return 0; // Sin recargo automático, el usuario decide
      case 'transferencia':
        return 0; // Sin recargo automático, el usuario decide
      default:
        return 0;
    }
  };

  useEffect(() => {
    fetchVendedores();
    // Cargar cotización inicial
    cargarCotizacionInicial();
  }, [fetchVendedores]);

  // Inicializar formulario cuando se abre (sin autocompletar montos)
  useEffect(() => {
    if (mostrarFormulario && carrito.length > 0) {
      // Solo inicializar campos vacíos, sin autocompletar montos
      setDatosCliente(prev => ({
        ...prev,
        monto_pago_1: 0,
        monto_pago_2: 0,
        recargo_pago_1: 0,
        recargo_pago_2: 0
      }));

      // Limpiar todos los inputs
      setInputMontoBase1('');
      setInputMontoBase2('');
      setInputMontoFinal1('');
      setInputMontoFinal2('');
      setInputRecargo1('0');
      setInputRecargo2('0');

      console.log('🔄 Formulario inicializado - Usuario debe ingresar montos manualmente');
    }
  }, [mostrarFormulario, carrito]);

  const cargarCotizacionInicial = async () => {
    try {
      const cotizacionData = await cotizacionService.obtenerCotizacionActual();
      setDatosCliente(prev => ({
        ...prev,
        cotizacion_dolar: cotizacionData.valor || cotizacionData.promedio || 1000
      }));
    } catch (error) {
      console.error('Error cargando cotización:', error);
    }
  };


  const calcularTotal = () => {
    const total = carrito.reduce((total, item) => {
      const precio = parseFloat(item.precio_unitario) || 0;
      const cantidad = parseInt(item.cantidad) || 0;
      return total + (precio * cantidad);
    }, 0);

    console.log('💵 Total calculado:', total, 'Carrito:', carrito);
    return total;
  };

  const calcularCantidadTotal = () => {
    return carrito.reduce((total, item) => total + item.cantidad, 0);
  };

  const getIconoTipo = (tipo) => {
    switch (tipo) {
      case 'computadora': return <Monitor className="w-4 h-4" />;
      case 'celular': return <Smartphone className="w-4 h-4" />;
      case 'otro': return <Box className="w-4 h-4" />;
      default: return <Box className="w-4 h-4" />;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDatosCliente(prev => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  // Manejar cambio de método de pago específicamente
  const handleMetodoPagoChange = (metodo, nuevoMetodo) => {
    // Actualizar el método de pago
    setDatosCliente(prev => ({
      ...prev,
      [`metodo_pago_${metodo}`]: nuevoMetodo
    }));

    // Limpiar recargos al cambiar método (usuario decide si aplicar recargo)
    setDatosCliente(prev => ({
      ...prev,
      [`recargo_pago_${metodo}`]: 0
    }));

    // Limpiar input local del recargo
    if (metodo === 1) {
      setInputRecargo1('0');
    } else {
      setInputRecargo2('0');
    }

    // Limpiar los campos de monto cuando cambia el método
    if (metodo === 1) {
      setInputMontoBase1('');
      setInputMontoFinal1('');
    } else {
      setInputMontoBase2('');
      setInputMontoFinal2('');
    }

    console.log(`🔄 Método de pago cambiado a ${nuevoMetodo} - Usuario puede aplicar recargos manualmente`);
  };

  const calcularTotalPesos = () => {
    return calcularTotal() * datosCliente.cotizacion_dolar;
  };

  // Determinar si un método de pago debe mostrarse en pesos (ARS)
  const esMetodoEnPesos = (metodoPago) => {
    return metodoPago === 'efectivo_pesos' || metodoPago === 'transferencia' || metodoPago === 'tarjeta_credito';
  };

  // Obtener moneda para un método de pago
  const obtenerMonedaMetodo = (metodoPago) => {
    return esMetodoEnPesos(metodoPago) ? 'ARS' : 'USD';
  };

  // FUNCIONES COMENTADAS - Ya no se usan con el nuevo sistema de inputs separados
  // convertirMontoAUSD y obtenerMontoBaseParaInput fueron reemplazadas por handleMontoBaseChange y handleMontoFinalChange

  // Obtener total a pagar (incluyendo recargos) en la moneda del método de pago
  const obtenerTotalAPagar = (metodoPago, recargo = 0) => {
    const totalBase = calcularTotal();
    const totalConRecargo = totalBase * (1 + recargo / 100);
    
    if (esMetodoEnPesos(metodoPago)) {
      return totalConRecargo * datosCliente.cotizacion_dolar;
    }
    return totalConRecargo;
  };

  // Manejar cambio en monto base (sin recargo)
  const handleMontoBaseChange = (metodo, montoBase) => {
    const metodoPago = metodo === 1 ? datosCliente.metodo_pago_1 : datosCliente.metodo_pago_2;
    const recargo = metodo === 1 ? datosCliente.recargo_pago_1 : datosCliente.recargo_pago_2;
    const montoBaseFloat = parseFloat(montoBase) || 0;
    
    // Actualizar input local del monto base
    if (metodo === 1) {
      setInputMontoBase1(montoBase);
    } else {
      setInputMontoBase2(montoBase);
    }
    
    // Calcular monto final con recargo
    const montoFinalEnMonedaMetodo = necesitaRecargo(metodoPago) && recargo > 0 
      ? montoBaseFloat * (1 + recargo / 100)
      : montoBaseFloat;
    
    // Actualizar input del monto final
    if (metodo === 1) {
      setInputMontoFinal1(montoFinalEnMonedaMetodo.toFixed(2));
    } else {
      setInputMontoFinal2(montoFinalEnMonedaMetodo.toFixed(2));
    }
    
    // Convertir monto base a USD para guardar en estado
    const montoBaseUSD = esMetodoEnPesos(metodoPago)
      ? montoBaseFloat / datosCliente.cotizacion_dolar
      : montoBaseFloat;
    
    setDatosCliente(prev => ({
      ...prev,
      [`monto_pago_${metodo}`]: montoBaseUSD
    }));
  };

  // Manejar cambio en monto final (con recargo incluido)
  const handleMontoFinalChange = (metodo, montoFinal) => {
    const metodoPago = metodo === 1 ? datosCliente.metodo_pago_1 : datosCliente.metodo_pago_2;
    const recargo = metodo === 1 ? datosCliente.recargo_pago_1 : datosCliente.recargo_pago_2;
    const montoFinalFloat = parseFloat(montoFinal) || 0;
    
    // Actualizar input local del monto final
    if (metodo === 1) {
      setInputMontoFinal1(montoFinal);
    } else {
      setInputMontoFinal2(montoFinal);
    }
    
    // Calcular monto base (sin recargo)
    const montoBaseEnMonedaMetodo = necesitaRecargo(metodoPago) && recargo > 0
      ? montoFinalFloat / (1 + recargo / 100)
      : montoFinalFloat;
    
    // Actualizar input del monto base
    if (metodo === 1) {
      setInputMontoBase1(montoBaseEnMonedaMetodo.toFixed(2));
    } else {
      setInputMontoBase2(montoBaseEnMonedaMetodo.toFixed(2));
    }
    
    // Convertir monto base a USD para guardar en estado
    const montoBaseUSD = esMetodoEnPesos(metodoPago)
      ? montoBaseEnMonedaMetodo / datosCliente.cotizacion_dolar
      : montoBaseEnMonedaMetodo;
    
    setDatosCliente(prev => ({
      ...prev,
      [`monto_pago_${metodo}`]: montoBaseUSD
    }));
  };

  const handleRecargoChange = (metodo, recargo) => {
    // Actualizar input local
    if (metodo === 1) {
      setInputRecargo1(recargo);
    } else {
      setInputRecargo2(recargo);
    }

    setDatosCliente(prev => ({
      ...prev,
      [`recargo_pago_${metodo}`]: parseFloat(recargo) || 0
    }));

    // Recalcular monto final si hay monto base ingresado
    const montoBaseInput = metodo === 1 ? inputMontoBase1 : inputMontoBase2;
    if (montoBaseInput && parseFloat(montoBaseInput) > 0) {
      handleMontoBaseChange(metodo, montoBaseInput);
    }
  };

  const distribuyeMontos = () => {
    // Solo distribuir si hay un segundo método seleccionado
    if (!datosCliente.metodo_pago_2) return;
    
    const totalUSD = calcularTotal();
    const monto1USD = datosCliente.monto_pago_1;
    const monto2USD = totalUSD - monto1USD;
    
    setDatosCliente(prev => ({
      ...prev,
      monto_pago_2: Math.max(0, monto2USD)
    }));
  };

  const handleProcesarVenta = async (e) => {
    e.preventDefault();

    console.log('🔄 Iniciando proceso de venta...');
    console.log('Cliente seleccionado:', clienteSeleccionado);
    console.log('Datos del cliente:', datosCliente);
    console.log('Carrito:', carrito);

    // ✅ VALIDACIÓN: Verificar que hay cliente seleccionado
    if (!clienteSeleccionado || !clienteSeleccionado.id) {
      console.error('❌ No hay cliente seleccionado');

      const clienteInput = document.querySelector('input[placeholder*="Buscar cliente"]');
      if (clienteInput) {
        clienteInput.focus();
        clienteInput.style.border = '2px solid red';
        setTimeout(() => {
          clienteInput.style.border = '';
        }, 3000);
      }

      alert('⚠️ Debe seleccionar un cliente antes de procesar la venta');
      return;
    }

    // ✅ VALIDACIÓN: Verificar que hay vendedor seleccionado
    if (!datosCliente.vendedor || datosCliente.vendedor.trim() === '') {
      console.error('❌ No hay vendedor seleccionado');

      const vendedorSelect = document.querySelector('select[name="vendedor"]');
      if (vendedorSelect) {
        vendedorSelect.focus();
        vendedorSelect.style.border = '2px solid red';
        setTimeout(() => {
          vendedorSelect.style.border = '';
        }, 3000);
      }

      alert('⚠️ Debe seleccionar un vendedor antes de procesar la venta');
      return;
    }

    // ✅ VALIDACIÓN: Verificar que hay productos en el carrito
    if (!carrito || carrito.length === 0) {
      console.error('❌ Carrito vacío');
      alert('⚠️ El carrito está vacío. Agregue productos antes de procesar la venta.');
      return;
    }

    // ✅ VALIDACIÓN: Verificar que hay montos ingresados (sin restricciones de coincidencia exacta)
    const totalPagadoUSD = datosCliente.monto_pago_1 + (datosCliente.monto_pago_2 || 0);

    if (totalPagadoUSD <= 0) {
      console.error('❌ No se ha ingresado ningún monto de pago');
      alert('⚠️ Debe ingresar al menos un monto de pago antes de procesar la venta.');
      return;
    }

    // Mostrar confirmación
    setMostrarConfirmacion(true);
  };

  // Funciones para edición de precios
  const iniciarEdicionPrecio = (item) => {
    setEditandoPrecio(item.id);
    setPrecioEditado(item.precio_unitario.toString());
    
    // Guardar precio original si no está guardado ya
    if (!preciosModificados[item.id]) {
      setPreciosModificados(prev => ({
        ...prev,
        [item.id]: {
          precio_original: item.precio_unitario,
          fue_modificado: false
        }
      }));
    }
  };

  const confirmarEdicionPrecio = (itemId) => {
    const nuevoPrecio = parseFloat(precioEditado);
    
    // Validaciones
    if (isNaN(nuevoPrecio) || nuevoPrecio <= 0) {
      alert('⚠️ El precio debe ser un número mayor a 0');
      return;
    }

    // Confirmar si hay una gran diferencia con el precio original
    const precioOriginal = preciosModificados[itemId]?.precio_original || 0;
    const diferenciaPorcentaje = Math.abs((nuevoPrecio - precioOriginal) / precioOriginal) * 100;
    
    if (diferenciaPorcentaje > 50) {
      const confirmar = window.confirm(
        `⚠️ El precio modificado es ${diferenciaPorcentaje.toFixed(1)}% diferente al precio original.\n\n` +
        `Precio original: $${precioOriginal.toFixed(2)}\n` +
        `Precio nuevo: $${nuevoPrecio.toFixed(2)}\n\n` +
        `¿Está seguro de aplicar este cambio?`
      );
      
      if (!confirmar) {
        cancelarEdicionPrecio();
        return;
      }
    }

    // Actualizar precio del item en el carrito
    onUpdatePrecio(itemId, nuevoPrecio);
    
    // Marcar como modificado
    setPreciosModificados(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        fue_modificado: true
      }
    }));

    // Limpiar estado de edición
    setEditandoPrecio(null);
    setPrecioEditado('');
  };

  const cancelarEdicionPrecio = () => {
    setEditandoPrecio(null);
    setPrecioEditado('');
  };

  const restaurarPrecioOriginal = (itemId) => {
    const precioOriginal = preciosModificados[itemId]?.precio_original;
    
    if (precioOriginal) {
      const confirmar = window.confirm(
        `¿Restaurar el precio original de $${precioOriginal.toFixed(2)}?`
      );
      
      if (confirmar) {
        onUpdatePrecio(itemId, precioOriginal);
        
        // Marcar como no modificado
        setPreciosModificados(prev => ({
          ...prev,
          [itemId]: {
            ...prev[itemId],
            fue_modificado: false
          }
        }));
      }
    }
  };

  const handleEnviarGarantias = async () => {
    // Si no hay email, saltar silenciosamente
    if (!clienteSeleccionado?.email) {
      console.log('⚠️ Cliente sin email, saltando envío de garantías');
      // Limpiar directamente
      limpiarTodoPostVenta();
      return;
    }

    setEnviandoGarantias(true);
    setMensajeGarantias('Preparando garantías...');

    try {
      console.log(`📧 Iniciando generación de ${carrito.length} garantía(s)...`);

      // Generar PDFs de garantía para cada producto
      const garantias = [];

      for (let i = 0; i < carrito.length; i++) {
        const item = carrito[i];
        const producto = item.producto || item;

        try {
          // Preparar datos de la garantía
          const datosGarantia = {
            producto: producto.modelo || producto.nombre_producto || 'Producto sin nombre',
            numeroSerie: item.serial || item.numero_serie || producto.serial || 'N/A',
            cliente: `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`,
            fechaCompra: new Date().toLocaleDateString('es-AR'),
            plazoGarantia: producto.garantia || producto.garantia_update || '3 meses'
          };

          console.log(`📄 Generando PDF ${i + 1}/${carrito.length}:`, datosGarantia);

          // Generar blob del PDF
          const pdfBlob = await generarGarantiaPDFBlob(datosGarantia);
          const nombreArchivo = generarNombreArchivoGarantia({
            cliente: clienteSeleccionado.nombre,
            numeroSerie: datosGarantia.numeroSerie
          });

          garantias.push({
            pdf: pdfBlob,
            nombreArchivo,
            producto: datosGarantia.producto,
            numeroSerie: datosGarantia.numeroSerie
          });

          setMensajeGarantias(`Generados ${i + 1}/${carrito.length} PDF(s)...`);
          console.log(`✅ PDF ${i + 1}/${carrito.length} generado correctamente`);
        } catch (error) {
          console.error(`❌ Error generando PDF para producto ${i + 1}:`, error);
          throw new Error(`Error generando garantía para ${producto.modelo || 'producto'}: ${error.message}`);
        }
      }

      console.log(`✅ Todos los PDFs generados, enviando ${garantias.length} garantía(s)...`);
      setMensajeGarantias(`Enviando ${garantias.length} garantía(s) a ${clienteSeleccionado.email}...`);

      // Enviar email con todos los PDFs
      const resultado = await enviarGarantiasPorEmail({
        destinatario: clienteSeleccionado.email,
        nombreCliente: `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`,
        garantias
      });

      if (resultado.success) {
        console.log('✅ Garantías enviadas exitosamente');
        setGarantiasEnviadas(true);
        setMensajeGarantias(
          `✅ ${resultado.archivosEnviados} garantía(s) enviada(s) exitosamente a ${clienteSeleccionado.email}`
        );

        // Esperar 2 segundos antes de limpiar para que el usuario vea el mensaje
        setTimeout(() => {
          limpiarTodoPostVenta();
        }, 2000);
      } else if (resultado.skipped) {
        console.log('⚠️ Envío saltado (sin email válido)');
        limpiarTodoPostVenta();
      } else {
        throw new Error(resultado.error || 'Error desconocido al enviar garantías');
      }
    } catch (error) {
      console.error('❌ Error en handleEnviarGarantias:', error);
      setMensajeGarantias(`❌ Error: ${error.message}`);
      setEnviandoGarantias(false);
    }
  };

  const limpiarTodoPostVenta = () => {
    console.log('🧹 Limpiando estado post-venta...');
    setClienteSeleccionado(null);
    setDatosCliente({
      metodo_pago_1: 'efectivo_pesos',
      metodo_pago_2: '',
      monto_pago_1: 0,
      monto_pago_2: 0,
      recargo_pago_1: 0,
      recargo_pago_2: 0,
      observaciones: '',
      vendedor: '',
      sucursal: 'la_plata',
      cotizacion_dolar: datosCliente.cotizacion_dolar
    });
    setMostrarFormulario(false);
    setIsOpen(false);
    setAperturaManual(false);
    setCarritoAnterior([]);
    setMostrarPantallaGarantias(false);
    setEnviandoGarantias(false);
    setGarantiasEnviadas(false);
    setMensajeGarantias('');

    // Limpiar inputs locales
    setInputMontoBase1('');
    setInputMontoBase2('');
    setInputMontoFinal1('');
    setInputMontoFinal2('');
    setInputRecargo1('0');
    setInputRecargo2('0');

    // Limpiar estados de edición de precios
    setEditandoPrecio(null);
    setPrecioEditado('');
    setPreciosModificados({});

    console.log('🎉 Proceso completado exitosamente');
  };

  const confirmarVenta = async () => {
    // ✅ PROTECCIÓN CONTRA DOBLE CLIC
    if (procesandoVenta) {
      console.log('⚠️ Venta ya está siendo procesada, ignorando clic adicional');
      return;
    }

    setProcesandoVenta(true);
    setMostrarConfirmacion(false);

    try {
      console.log('🚀 Iniciando procesamiento de venta...');
      
      // Generar número de transacción único
      const numeroTransaccion = `VT-${Date.now()}`;
      
      // ✅ DATOS COMPLETOS: Usar información del cliente seleccionado
      const datosVentaCompletos = {
        cliente_id: clienteSeleccionado.id,
        cliente_nombre: `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`,
        cliente_email: clienteSeleccionado.email || null,
        cliente_telefono: clienteSeleccionado.telefono || null,
        metodo_pago_1: datosCliente.metodo_pago_1,
        metodo_pago_2: datosCliente.metodo_pago_2,
        monto_pago_1: datosCliente.monto_pago_1,
        monto_pago_2: datosCliente.monto_pago_2,
        observaciones: datosCliente.observaciones,
        vendedor: datosCliente.vendedor,
        sucursal: datosCliente.sucursal,
        numeroTransaccion,
        fecha_venta: new Date().toISOString(),
        // ✅ NUEVO: Información para cuenta corriente
        esCuentaCorriente: datosCliente.metodo_pago_1 === 'cuenta_corriente' || datosCliente.metodo_pago_2 === 'cuenta_corriente',
        total: calcularTotal()
      };

      console.log('📦 Datos completos de la venta:', datosVentaCompletos);

      // Procesar la venta en la base de datos
      console.log('💾 Enviando venta a la base de datos...');
      await onProcesarVenta(carrito, datosVentaCompletos);
      console.log('✅ Venta procesada exitosamente en la BD');

      // ✅ MOSTRAR MENSAJE DE ÉXITO personalizado
      const mensajeExito = (datosCliente.metodo_pago_1 === 'cuenta_corriente' || datosCliente.metodo_pago_2 === 'cuenta_corriente')
        ? `✅ Venta a CUENTA CORRIENTE procesada exitosamente!\n\nTransacción: ${numeroTransaccion}\nCliente: ${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}\nTotal: $${calcularTotal().toFixed(2)}\n\n📝 El saldo se registró en la cuenta corriente del cliente.`
        : `✅ Venta procesada exitosamente!\n\nTransacción: ${numeroTransaccion}\nCliente: ${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}\nTotal: $${calcularTotal().toFixed(2)}`;

      alert(mensajeExito);

      // ✅ MOSTRAR PANTALLA DE GARANTÍAS en lugar de limpiar inmediatamente
      setMostrarFormulario(false);
      setMostrarConfirmacion(false);
      setMostrarPantallaGarantias(true);
      setGarantiasEnviadas(false);
      setMensajeGarantias('');

      console.log('📧 Abriendo pantalla de garantías...');

    } catch (err) {
      console.error('❌ Error procesando venta:', err);
      
      let errorMessage = 'Error procesando venta';
      
      if (err.message.includes('cliente')) {
        errorMessage = 'Error con los datos del cliente';
      } else if (err.message.includes('stock') || err.message.includes('inventario')) {
        errorMessage = 'Error de inventario - verifique el stock disponible';
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = 'Error de conexión - verifique su internet';
      }
      
      alert(`❌ ${errorMessage}:\n\n${err.message}\n\nIntente nuevamente o contacte al administrador.`);
    } finally {
      // ✅ SIEMPRE liberar el bloqueo de procesamiento
      setProcesandoVenta(false);
      console.log('🔓 Bloqueo de procesamiento liberado');
    }
  };

  return (
    <>
      {/* Botón flotante del carrito */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => {
            setIsOpen(true);
            setAperturaManual(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-lg shadow-lg transition-all duration-300"
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            {calcularCantidadTotal() > 0 && (
              <div className="absolute -top-2 -right-2 bg-slate-800 text-white text-xs rounded-lg w-5 h-5 flex items-center justify-center font-bold">
                {calcularCantidadTotal()}
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Modal del carrito */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {!mostrarFormulario ? (
              <>
                {/* Header compacto */}
                <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="w-5 h-5" />
                    <h2 className="text-lg font-semibold">
                      Carrito de Compras ({calcularCantidadTotal()} items)
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setAperturaManual(false);
                    }}
                    className="text-white hover:text-slate-300 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Contenido del carrito como tabla */}
                {carrito.length === 0 ? (
                  <div className="text-center py-12 text-slate-600">
                    <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-base font-medium">Tu carrito está vacío</p>
                    <p className="text-sm text-slate-500 mt-1">Agrega productos desde el inventario</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-y-auto max-h-96">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Producto</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-slate-600 uppercase tracking-wider">Cantidad</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Precio Unit.</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Subtotal</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-slate-600 uppercase tracking-wider">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {carrito.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                              {/* Producto */}
                              <td className="px-4 py-2">
                                <div className="flex items-center space-x-2">
                                  <div className="p-1 bg-slate-100 rounded">
                                    {getIconoTipo(item.tipo)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-slate-800 truncate">
                                      {item.producto.modelo || item.producto.nombre_producto}
                                    </p>
                                    <p className="text-xs text-slate-500 capitalize">{item.tipo}</p>
                                    {item.producto.serial && (
                                      <p className="text-xs text-slate-400 truncate">S/N: {item.producto.serial}</p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Cantidad */}
                              <td className="px-4 py-2">
                                <div className="flex items-center justify-center space-x-1">
                                  <button
                                    onClick={() => onUpdateCantidad(item.id, item.cantidad - 1)}
                                    className="p-1 text-slate-500 hover:text-emerald-600 transition-colors"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-8 text-center text-sm font-medium text-slate-800">{item.cantidad}</span>
                                  <button
                                    onClick={() => onUpdateCantidad(item.id, item.cantidad + 1)}
                                    className="p-1 text-slate-500 hover:text-emerald-600 transition-colors"
                                    disabled={item.tipo !== 'otro' && item.cantidad >= 1}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>

                              {/* Precio Unitario */}
                              <td className="px-4 py-2">
                                <div className="flex items-center justify-end space-x-1">
                                  {editandoPrecio === item.id ? (
                                    // Modo edición
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={precioEditado}
                                        onChange={(e) => setPrecioEditado(e.target.value)}
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter') {
                                            confirmarEdicionPrecio(item.id);
                                          } else if (e.key === 'Escape') {
                                            cancelarEdicionPrecio();
                                          }
                                        }}
                                        className="w-20 px-2 py-1 text-xs border border-emerald-500 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        step="0.01"
                                        min="0.01"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => confirmarEdicionPrecio(item.id)}
                                        className="p-1 text-emerald-600 hover:text-emerald-700"
                                        title="Confirmar"
                                      >
                                        <Check className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={cancelarEdicionPrecio}
                                        className="p-1 text-slate-500 hover:text-slate-700"
                                        title="Cancelar"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    // Modo visualización
                                    <>
                                      <span className={`text-sm ${
                                        preciosModificados[item.id]?.fue_modificado
                                          ? 'text-emerald-600 font-semibold'
                                          : 'text-slate-700'
                                      }`}>
                                        ${item.precio_unitario.toFixed(2)}
                                      </span>

                                      {preciosModificados[item.id]?.fue_modificado && (
                                        <span className="text-xs text-emerald-600" title="Precio modificado">✓</span>
                                      )}

                                      <button
                                        onClick={() => iniciarEdicionPrecio(item)}
                                        className="p-1 text-slate-400 hover:text-emerald-600"
                                        title="Editar precio"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>

                                      {preciosModificados[item.id]?.fue_modificado && (
                                        <button
                                          onClick={() => restaurarPrecioOriginal(item.id)}
                                          className="p-1 text-slate-400 hover:text-slate-700"
                                          title={`Restaurar: $${preciosModificados[item.id]?.precio_original?.toFixed(2)}`}
                                        >
                                          <RotateCcw className="w-3 h-3" />
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>

                              {/* Subtotal */}
                              <td className="px-4 py-2 text-right">
                                <span className="text-sm font-semibold text-slate-800">
                                  ${(item.precio_unitario * item.cantidad).toFixed(2)}
                                </span>
                              </td>

                              {/* Acciones */}
                              <td className="px-4 py-2 text-center">
                                <button
                                  onClick={() => onRemover(item.id)}
                                  className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Footer compacto */}
                    <div className="border-t border-slate-200 p-4 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-slate-800">
                          Total: ${calcularTotal().toFixed(2)}
                        </span>
                        <button
                          onClick={onLimpiar}
                          className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
                        >
                          Limpiar carrito
                        </button>
                      </div>
                      <button
                        onClick={() => setMostrarFormulario(true)}
                        className="w-full bg-emerald-600 text-white py-2 rounded font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        <span>Procesar Venta</span>
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {/* Formulario de venta */}
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">Datos de la Venta</h3>
                      <p className="text-sm text-slate-600 mt-1">Complete la información para procesar la venta</p>
                    </div>
                    <button
                      onClick={() => {
                        setMostrarFormulario(false);
                        setAperturaManual(false);
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleProcesarVenta} className="p-6 space-y-6">
                    {/* ✅ Selector de cliente */}
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-slate-800 border-b border-slate-200 pb-2">
                        Cliente
                      </h4>
                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2">
                          Cliente *
                        </label>
                      <ClienteSelector
                        selectedCliente={clienteSeleccionado}
                        onSelectCliente={setClienteSeleccionado}
                        required={true}
                      />
                      {clienteSeleccionado && (
                        <div className="mt-2 p-3 bg-slate-200 rounded-lg border border-slate-200">
                          <p className="text-sm text-slate-800">
                            ✅ Cliente seleccionado: <strong>{clienteSeleccionado.nombre} {clienteSeleccionado.apellido}</strong>
                          </p>
                          {clienteSeleccionado.email && (
                            <p className="text-xs text-slate-800">📧 {clienteSeleccionado.email}</p>
                          )}
                          {clienteSeleccionado.telefono && (
                            <p className="text-xs text-slate-800">📞 {clienteSeleccionado.telefono}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Lista de productos del carrito */}
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-slate-800 border-b border-slate-200 pb-2">
                        Productos en el Carrito
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {carrito.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-2 border border-slate-200 rounded bg-white">
                            {/* Nombre del producto */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">
                                {item.producto.modelo || item.producto.nombre_producto}
                              </p>
                            </div>

                            {/* Cantidad */}
                            <div className="flex items-center space-x-1 mx-3">
                              <button
                                onClick={() => onUpdateCantidad(item.id, item.cantidad - 1)}
                                className="p-1 text-slate-500 hover:text-emerald-600"
                                type="button"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center text-sm font-medium text-slate-800">{item.cantidad}</span>
                              <button
                                onClick={() => onUpdateCantidad(item.id, item.cantidad + 1)}
                                className="p-1 text-slate-500 hover:text-emerald-600"
                                disabled={item.tipo !== 'otro' && item.cantidad >= 1}
                                type="button"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Precio editable */}
                            <div className="flex items-center space-x-2">
                              {editandoPrecio === item.id ? (
                                // Modo edición
                                <div className="flex items-center space-x-1">
                                  <input
                                    type="number"
                                    value={precioEditado}
                                    onChange={(e) => setPrecioEditado(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        confirmarEdicionPrecio(item.id);
                                      } else if (e.key === 'Escape') {
                                        cancelarEdicionPrecio();
                                      }
                                    }}
                                    className="w-16 px-1 py-1 text-xs border border-emerald-500 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    step="0.01"
                                    min="0.01"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => confirmarEdicionPrecio(item.id)}
                                    className="p-1 text-emerald-600 hover:text-emerald-700"
                                    title="Confirmar"
                                    type="button"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={cancelarEdicionPrecio}
                                    className="p-1 text-slate-500 hover:text-slate-700"
                                    title="Cancelar"
                                    type="button"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                // Modo visualización
                                <div className="flex items-center space-x-1">
                                  <span className={`text-sm font-medium ${
                                    preciosModificados[item.id]?.fue_modificado 
                                      ? 'text-emerald-600' 
                                      : 'text-slate-800'
                                  }`}>
                                    ${(item.precio_unitario * item.cantidad).toFixed(2)}
                                  </span>
                                  
                                  {preciosModificados[item.id]?.fue_modificado && (
                                    <span className="text-xs text-emerald-600" title="Precio modificado">✓</span>
                                  )}
                                  
                                  <button
                                    onClick={() => iniciarEdicionPrecio(item)}
                                    className="p-1 text-slate-400 hover:text-emerald-600"
                                    title="Editar precio"
                                    type="button"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  
                                  {preciosModificados[item.id]?.fue_modificado && (
                                    <button
                                      onClick={() => restaurarPrecioOriginal(item.id)}
                                      className="p-1 text-slate-400 hover:text-slate-600"
                                      title={`Restaurar precio original: $${preciosModificados[item.id]?.precio_original?.toFixed(2)}`}
                                      type="button"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              )}
                              
                              {/* Eliminar */}
                              <button
                                onClick={() => onRemover(item.id)}
                                className="p-1 text-slate-400 hover:text-red-600"
                                title="Eliminar"
                                type="button"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        {carrito.length === 0 && (
                          <div className="text-center py-4 text-slate-500">
                            <p className="text-sm">No hay productos en el carrito</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Resumen del carrito */}
                      {carrito.length > 0 && (
                        <div className="mt-3 p-2 bg-slate-50 rounded border">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">
                              {calcularCantidadTotal()} productos
                            </span>
                            <span className="text-base font-bold text-slate-800">
                              ${calcularTotal().toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Cotización del Dólar */}
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-slate-800 border-b border-slate-200 pb-2">
                        Cotización del Dólar
                      </h4>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-5 h-5 text-emerald-600" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditandoCotizacion(!editandoCotizacion)}
                          className="text-emerald-600 hover:text-emerald-700"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-emerald-600">Total USD</p>
                          <p className="text-lg font-bold text-slate-800">U$${calcularTotal().toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-emerald-600">Cotización</p>
                          {editandoCotizacion ? (
                            <input
                              type="number"
                              value={datosCliente.cotizacion_dolar}
                              onChange={(e) => setDatosCliente(prev => ({...prev, cotizacion_dolar: parseFloat(e.target.value) || 0}))}
                              className="w-full text-center text-lg font-bold border border-slate-200 rounded-lg px-2 py-1"
                              step="0.01"
                            />
                          ) : (
                            <p className="text-lg font-bold text-slate-800">${datosCliente.cotizacion_dolar}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-emerald-600">Total ARS</p>
                          <p className="text-lg font-bold text-slate-800">${calcularTotalPesos().toLocaleString('es-AR')}</p>
                        </div>
                      </div>
                    </div>
                    </div>

                    {/* Métodos de Pago */}
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-slate-800 border-b border-slate-200 pb-2">
                        Métodos de Pago
                      </h4>
                      
                      {/* Primer método de pago */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-800 mb-2">
                            Método de Pago 1 *
                          </label>
                          <select
                            name="metodo_pago_1"
                            value={datosCliente.metodo_pago_1}
                            onChange={(e) => handleMetodoPagoChange(1, e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                          >
                            <option value="efectivo_pesos">💵 Efectivo en Pesos</option>
                            <option value="dolares_billete">💸 Dólares Billete</option>
                            <option value="transferencia">🏦 Transferencia</option>
                            <option value="criptomonedas">₿ Criptomonedas</option>
                            <option value="tarjeta_credito">💳 Tarjeta de Crédito</option>
                            <option value="cuenta_corriente">🏷️ Cuenta Corriente</option>
                          </select>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-slate-800 mb-2">
                              Monto de Venta ({obtenerMonedaMetodo(datosCliente.metodo_pago_1)})
                            </label>
                            <input
                              type="number"
                              value={inputMontoBase1}
                              onChange={(e) => handleMontoBaseChange(1, e.target.value)}
                              onBlur={distribuyeMontos}
                              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                              placeholder="Ingrese el monto a cobrar"
                              step="1"
                              min="0"
                            />
                          </div>
                        </div>
                      </div>


                      {/* Segundo método de pago (opcional) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-800 mb-2">
                            Método de Pago 2 (Opcional)
                          </label>
                          <select
                            name="metodo_pago_2"
                            value={datosCliente.metodo_pago_2}
                            onChange={(e) => handleMetodoPagoChange(2, e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                          >
                            <option value="">Seleccionar método</option>
                            <option value="efectivo_pesos">💵 Efectivo en Pesos</option>
                            <option value="dolares_billete">💸 Dólares Billete</option>
                            <option value="transferencia">🏦 Transferencia</option>
                            <option value="criptomonedas">₿ Criptomonedas</option>
                            <option value="tarjeta_credito">💳 Tarjeta de Crédito</option>
                            <option value="cuenta_corriente">🏷️ Cuenta Corriente</option>
                          </select>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-slate-800 mb-2">
                              Monto de Venta ({datosCliente.metodo_pago_2 ? obtenerMonedaMetodo(datosCliente.metodo_pago_2) : 'N/A'})
                            </label>
                            <input
                              type="number"
                              value={inputMontoBase2}
                              onChange={(e) => handleMontoBaseChange(2, e.target.value)}
                              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                              placeholder="Ingrese el monto a cobrar"
                              step="1"
                              min="0"
                              disabled={!datosCliente.metodo_pago_2}
                            />
                          </div>
                        </div>
                      </div>


                      {/* Resumen de pagos */}
                      <div className="bg-slate-200 p-3 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span>Total a cobrar:</span>
                          <span className="font-bold">{formatearMonto(
                            // Calcular total que se va a cobrar basado en montos ingresados
                            (esMetodoEnPesos(datosCliente.metodo_pago_1)
                              ? (parseFloat(inputMontoBase1) || 0) / datosCliente.cotizacion_dolar
                              : (parseFloat(inputMontoBase1) || 0)) +
                            (datosCliente.metodo_pago_2 && (esMetodoEnPesos(datosCliente.metodo_pago_2)
                              ? (parseFloat(inputMontoBase2) || 0) / datosCliente.cotizacion_dolar
                              : (parseFloat(inputMontoBase2) || 0))),
                            'USD'
                          )}</span>
                        </div>
                        {/* Desglose por método */}
                        {datosCliente.metodo_pago_1 && (
                          <div className="mt-3 pt-2 border-t border-slate-200">
                            <p className="text-xs text-slate-800 mb-1">Desglose por método:</p>
                            <div className="flex justify-between text-xs">
                              <span>{datosCliente.metodo_pago_1.replace(/_/g, ' ')}:</span>
                              <span>{formatearMonto(
                                parseFloat(inputMontoBase1) || 0,
                                obtenerMonedaMetodo(datosCliente.metodo_pago_1)
                              )}</span>
                            </div>
                            {datosCliente.metodo_pago_2 && parseFloat(inputMontoBase2) > 0 && (
                              <div className="flex justify-between text-xs">
                                <span>{datosCliente.metodo_pago_2.replace(/_/g, ' ')}:</span>
                                <span>{formatearMonto(
                                  parseFloat(inputMontoBase2) || 0,
                                  obtenerMonedaMetodo(datosCliente.metodo_pago_2)
                                )}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Información adicional */}
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-slate-800 border-b border-slate-200 pb-2">
                        Información Adicional
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2">Vendedor</label>
                        <select
                          name="vendedor"
                          value={datosCliente.vendedor}
                          onChange={handleInputChange}
                          disabled={loadingVendedores}
                          className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 disabled:bg-slate-200"
                        >
                          <option value="">
                            {loadingVendedores ? 'Cargando vendedores...' : 'Seleccionar vendedor'}
                          </option>
                          {vendedores.map((vendedor) => (
                            <option key={vendedor.id} value={vendedor.id}>
                              {vendedor.nombre} {vendedor.apellido}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2">Sucursal *</label>
                        <select
                          name="sucursal"
                          value={datosCliente.sucursal}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                        >
                          <option value="la_plata">La Plata </option>
                          <option value="mitre">Mitre </option>
                        </select>
                      </div>
                    </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-800 mb-2">Observaciones</label>
                        <textarea
                          name="observaciones"
                          value={datosCliente.observaciones}
                          onChange={handleInputChange}
                          rows="2"
                          className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                          placeholder="Observaciones adicionales..."
                        />
                      </div>
                      </div>
                    </div>

                    {/* Resumen */}
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-slate-800 border-b border-slate-200 pb-2">
                        Resumen de la Venta
                      </h4>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <div className="text-sm space-y-2">
                        {clienteSeleccionado && (
                          <p>Cliente: <span className="font-medium">{clienteSeleccionado.nombre} {clienteSeleccionado.apellido}</span></p>
                        )}
                        <p>Items: {calcularCantidadTotal()}</p>
                        <p>Sucursal: <span className="font-medium">{datosCliente.sucursal.replace('_', ' ').toUpperCase()}</span></p>
                        <p>Cotización: <span className="font-medium">${datosCliente.cotizacion_dolar}</span></p>
                        
                        <div className="mt-3 space-y-1">
                          <p className="font-medium">Métodos de Pago:</p>
                          <p className="ml-2">• {datosCliente.metodo_pago_1.replace(/_/g, ' ')}: {formatearMonto(
                            parseFloat(inputMontoBase1) || 0,
                            obtenerMonedaMetodo(datosCliente.metodo_pago_1)
                          )}</p>
                          {datosCliente.metodo_pago_2 && parseFloat(inputMontoBase2) > 0 && (
                            <p className="ml-2">• {datosCliente.metodo_pago_2.replace(/_/g, ' ')}: {formatearMonto(
                              parseFloat(inputMontoBase2) || 0,
                              obtenerMonedaMetodo(datosCliente.metodo_pago_2)
                            )}</p>
                          )}
                        </div>
                        
                        
                        {/* ✅ RESUMEN especial para cuenta corriente */}
                        {(datosCliente.metodo_pago_1 === 'cuenta_corriente' || datosCliente.metodo_pago_2 === 'cuenta_corriente') && (
                          <div className="mt-2 p-2 bg-slate-800 text-white rounded-lg text-xs">
                            💡 Parte de esta venta se registrará como deuda en la cuenta corriente del cliente
                          </div>
                        )}
                      </div>
                      </div>
                    </div>

                    {/* Botones */}
                    <div className="border-t border-slate-200 pt-6">
                      <div className="flex space-x-4">
                        <button
                          type="button"
                          onClick={() => {
                        setMostrarFormulario(false);
                        setAperturaManual(false);
                      }}
                          className="flex-1 bg-slate-200 text-slate-800 py-3 rounded font-semibold hover:bg-slate-800 hover:text-white transition-colors"
                        >
                          Volver
                        </button>
                        <button
                          type="submit"
                          disabled={!clienteSeleccionado || !datosCliente.vendedor}
                          className={`flex-1 py-3 rounded font-semibold transition-colors flex items-center justify-center space-x-2 disabled:bg-slate-200 disabled:cursor-not-allowed ${
                            (datosCliente.metodo_pago_1 === 'cuenta_corriente' || datosCliente.metodo_pago_2 === 'cuenta_corriente')
                              ? 'bg-slate-800 text-white hover:bg-slate-600'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {(datosCliente.metodo_pago_1 === 'cuenta_corriente' || datosCliente.metodo_pago_2 === 'cuenta_corriente') ? (
                            <>
                              <CreditCard className="w-5 h-5" />
                              <span>Procesar con Cuenta Corriente</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-5 h-5" />
                              <span>Procesar Venta</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pantalla de Garantías Post-Venta */}
      {mostrarPantallaGarantias && (
        <div className="fixed inset-0 bg-slate-800 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-6">
            {/* Header */}
            <div className="text-center border-b border-slate-200 pb-4">
              <h3 className="text-xl font-semibold text-emerald-600 mb-2">✅ Venta Procesada</h3>
              <p className="text-sm text-slate-600">
                La venta ha sido registrada exitosamente
              </p>
            </div>

            {/* Información del cliente */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600 mb-2">
                <span className="font-semibold text-slate-800">Cliente:</span> {clienteSeleccionado?.nombre} {clienteSeleccionado?.apellido}
              </p>
              {clienteSeleccionado?.email ? (
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-800">Email:</span> {clienteSeleccionado.email}
                </p>
              ) : (
                <p className="text-sm text-amber-600">
                  ⚠️ Este cliente no tiene email registrado
                </p>
              )}
              <p className="text-sm text-slate-600 mt-2">
                <span className="font-semibold text-slate-800">Productos:</span> {carrito.length}
              </p>
            </div>

            {/* Mensaje de estado */}
            {mensajeGarantias && (
              <div className={`p-3 rounded-lg text-sm ${
                garantiasEnviadas
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}>
                {mensajeGarantias}
              </div>
            )}

            {/* Botones */}
            <div className="space-y-3">
              {!garantiasEnviadas ? (
                <>
                  {clienteSeleccionado?.email && (
                    <button
                      onClick={handleEnviarGarantias}
                      disabled={enviandoGarantias}
                      className={`w-full py-3 rounded font-semibold transition-colors flex items-center justify-center space-x-2 ${
                        enviandoGarantias
                          ? 'bg-slate-400 text-slate-200 cursor-not-allowed'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {enviandoGarantias ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-5 h-5" />
                          <span>Enviar Garantías por Email</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={limpiarTodoPostVenta}
                    disabled={enviandoGarantias}
                    className="w-full bg-slate-200 text-slate-800 py-3 rounded font-semibold hover:bg-slate-300 transition-colors disabled:opacity-50"
                  >
                    {clienteSeleccionado?.email ? 'Saltar' : 'Cerrar'}
                  </button>
                </>
              ) : (
                <button
                  onClick={limpiarTodoPostVenta}
                  className="w-full bg-emerald-600 text-white py-3 rounded font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Finalizar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 bg-slate-800 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              {(datosCliente.metodo_pago_1 === 'cuenta_corriente' || datosCliente.metodo_pago_2 === 'cuenta_corriente')
                ? 'Confirmar Venta a Cuenta Corriente'
                : 'Confirmar Venta'
              }
            </h3>
            <p className="text-slate-800 mb-4">
              {(datosCliente.metodo_pago_1 === 'cuenta_corriente' || datosCliente.metodo_pago_2 === 'cuenta_corriente')
                ? `¿Confirmar venta a CUENTA CORRIENTE para ${clienteSeleccionado?.nombre} ${clienteSeleccionado?.apellido}?\n\nEsto quedará registrado como deuda pendiente del cliente.`
                : `¿Confirmar venta para ${clienteSeleccionado?.nombre} ${clienteSeleccionado?.apellido}?`
              }
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setMostrarConfirmacion(false)}
                className="flex-1 bg-slate-200 text-slate-800 py-2 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarVenta}
                disabled={procesandoVenta}
                className={`flex-1 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
                  procesandoVenta 
                    ? 'bg-slate-400 text-slate-200 cursor-not-allowed' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {procesandoVenta ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-200 border-t-transparent rounded-full animate-spin"></div>
                    <span>Procesando...</span>
                  </>
                ) : (
                  <span>Confirmar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CarritoWidget;