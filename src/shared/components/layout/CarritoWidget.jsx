import React, { useEffect, useState } from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2, Monitor, Smartphone, Box, CreditCard, DollarSign, Edit2, Check, RotateCcw, Mail, Loader, Wallet } from 'lucide-react';
import ClienteSelector from '../../../modules/ventas/components/ClienteSelector';
import ConversionMonedas from '../../../components/currency/ConversionMonedas';
import { useVendedores } from '../../../modules/ventas/hooks/useVendedores';
import { cotizacionService } from '../../services/cotizacionService';
import { formatearMonto } from '../../utils/formatters';
import { formatearFechaDisplay } from '../../config/timezone';
import { supabase } from '../../../lib/supabase';
import MetodoPagoSelector from '../ui/MetodoPagoSelector';

const CarritoWidget = ({ carrito, onUpdateCantidad, onUpdatePrecio, onRemover, onLimpiar, onProcesarVenta, clienteInicial = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  // Función para obtener fecha local en formato YYYY-MM-DD sin problemas de zona horaria
  const obtenerFechaLocal = () => {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const día = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${día}`;
  };

  // Función para obtener fecha y hora local en formato ISO con zona horaria de Buenos Aires (UTC-3)
  const obtenerFechaHoraLocal = () => {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const día = String(fecha.getDate()).padStart(2, '0');
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    const segundos = String(fecha.getSeconds()).padStart(2, '0');
    return `${año}-${mes}-${día}T${horas}:${minutos}:${segundos}-03:00`;
  };

  const [fechaVenta, setFechaVenta] = useState(obtenerFechaLocal());
  const [datosCliente, setDatosCliente] = useState({
    metodo_pago_1: 'efectivo_pesos',
    metodo_pago_2: '',
    metodo_pago_3: '',
    monto_pago_1: 0,
    monto_pago_2: 0,
    monto_pago_3: 0,
    recargo_pago_1: 0,
    recargo_pago_2: 0,
    recargo_pago_3: 0,
    destino_pago_1: '',
    destino_pago_2: '',
    destino_pago_3: '',
    observaciones: '',
    vendedor: '',
    sucursal: 'la_plata',
    cotizacion_dolar: 1000,
    sena_monto: 0,
    sena_monto_ars: null,
    sena_metodo: '',
    sena_caja: '',
    vuelto_monto: 0,
    vuelto_monto_ars: null,
    vuelto_metodo: '',
    vuelto_caja: ''
  });

  // Estado para lista de cajas del plan de cuentas
  const [cajas, setCajas] = useState([]);

  // Estados locales para inputs de seña y vuelto
  const [inputSena, setInputSena] = useState('');
  const [inputVuelto, setInputVuelto] = useState('');

  // Estados locales para inputs para evitar problema del cursor
  const [inputMontoBase1, setInputMontoBase1] = useState('');
  const [inputMontoBase2, setInputMontoBase2] = useState('');
  const [inputMontoBase3, setInputMontoBase3] = useState('');
  const [inputMontoFinal1, setInputMontoFinal1] = useState('');
  const [inputMontoFinal2, setInputMontoFinal2] = useState('');
  const [inputMontoFinal3, setInputMontoFinal3] = useState('');
  const [inputRecargo1, setInputRecargo1] = useState('0');
  const [inputRecargo2, setInputRecargo2] = useState('0');
  const [inputRecargo3, setInputRecargo3] = useState('0');

  // Usar el hook de vendedores
  const { vendedores, loading: loadingVendedores, fetchVendedores } = useVendedores();
  const [editandoCotizacion, setEditandoCotizacion] = useState(false);

  // Debug: mostrar estado de vendedores y cajas
  console.log('🔍 Estado actual - vendedores:', vendedores?.length || 0, 'cajas:', cajas?.length || 0, 'loadingVendedores:', loadingVendedores);

  // Estados para edición de precios
  const [editandoPrecio, setEditandoPrecio] = useState(null); // ID del item siendo editado
  const [precioEditado, setPrecioEditado] = useState(''); // Valor temporal del precio
  const [preciosModificados, setPreciosModificados] = useState({}); // Precios originales guardados

  // Estado para prevenir doble procesamiento de ventas
  const [procesandoVenta, setProcesandoVenta] = useState(false);

  // Estado para controlar envío de email (PRUEBA)
  const [enviarEmail, setEnviarEmail] = useState(false);

  // Estados para garantías eliminados - las garantías se generan desde GarantiasSection


  // Establecer cliente inicial cuando se proporciona
  useEffect(() => {
    if (clienteInicial) {
      setClienteSeleccionado(clienteInicial);
      console.log('🧑‍💼 Cliente inicial establecido:', clienteInicial);
    }
  }, [clienteInicial]);

  // Estado para evitar reapertura automática
  const [carritoAnterior, setCarritoAnterior] = useState([]);
  const [aperturaManual, setAperturaManual] = useState(false);

  // Abrir automáticamente el widget cuando llegan items desde RegistrarVenta
  useEffect(() => {
    if (carrito && carrito.length > 0 && carritoAnterior.length === 0 && !isOpen && !procesandoVenta) {
      setIsOpen(true);
      setMostrarFormulario(true);
      if (clienteInicial) {
        setClienteSeleccionado(clienteInicial);
      }
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

  // Cargar cajas del plan de cuentas
  const cargarCajas = async () => {
    console.log('🔄 Iniciando carga de cajas...');
    try {
      const { data, error } = await supabase
        .from('plan_cuentas')
        .select('id, codigo, nombre')
        .like('codigo', '1.1.01%')
        .eq('imputable', true)
        .order('codigo');

      if (error) {
        console.error('❌ Error cargando cajas:', error);
        return;
      }

      console.log('✅ Cajas cargadas:', data?.length || 0, data);
      setCajas(data || []);
    } catch (error) {
      console.error('❌ Error cargando cajas:', error);
    }
  };

  // Determinar si un método necesita selector de caja (dropdown) o input de alias/wallet
  const necesitaSelectorCaja = (metodoPago) => {
    return ['efectivo_pesos', 'dolares_billete', 'tarjeta_credito'].includes(metodoPago);
  };

  // Determinar si un método necesita input de alias/wallet
  const necesitaInputAlias = (metodoPago) => {
    return ['transferencia', 'transferencia_wire', 'criptomonedas'].includes(metodoPago);
  };

  // Determinar si un método requiere destino (todos excepto cuenta_corriente, mercaderia y vacío)
  const requiereDestino = (metodoPago) => {
    return metodoPago && metodoPago !== 'cuenta_corriente' && metodoPago !== 'mercaderia';
  };

  useEffect(() => {
    console.log('🚀 useEffect CarritoWidget - Cargando datos iniciales...');
    fetchVendedores().then(v => console.log('📋 Vendedores obtenidos:', v?.length || 0, v));
    // Cargar cotización inicial
    cargarCotizacionInicial();
    // Cargar cajas del plan de cuentas
    cargarCajas();
  }, [fetchVendedores]);

  // Inicializar formulario cuando se abre (sin autocompletar montos)
  useEffect(() => {
    if (mostrarFormulario && carrito.length > 0) {
      // Solo inicializar campos vacíos, sin autocompletar montos
      setDatosCliente(prev => ({
        ...prev,
        monto_pago_1: 0,
        monto_pago_2: 0,
        monto_pago_3: 0,
        recargo_pago_1: 0,
        recargo_pago_2: 0,
        recargo_pago_3: 0,
        destino_pago_1: '',
        destino_pago_2: '',
        destino_pago_3: ''
      }));

      // Limpiar todos los inputs
      setInputMontoBase1('');
      setInputMontoBase2('');
      setInputMontoBase3('');
      setInputMontoFinal1('');
      setInputMontoFinal2('');
      setInputMontoFinal3('');
      setInputRecargo1('0');
      setInputRecargo2('0');
      setInputRecargo3('0');

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

  // Calcular el monto total cobrado (suma de pagos + seña - vuelto, en USD)
  const calcularMontoCobrado = () => {
    const monto1 = datosCliente.monto_pago_1 || 0;
    const monto2 = datosCliente.monto_pago_2 || 0;
    const monto3 = datosCliente.monto_pago_3 || 0;
    const sena = datosCliente.sena_monto || 0;
    const vuelto = datosCliente.vuelto_monto || 0;
    return monto1 + monto2 + monto3 + sena - vuelto;
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
    // Actualizar el método de pago y limpiar el destino
    setDatosCliente(prev => ({
      ...prev,
      [`metodo_pago_${metodo}`]: nuevoMetodo,
      [`recargo_pago_${metodo}`]: 0,
      [`destino_pago_${metodo}`]: '' // Limpiar destino al cambiar método
    }));

    // Limpiar input local del recargo y monto
    if (metodo === 1) {
      setInputRecargo1('0');
      setInputMontoBase1('');
      setInputMontoFinal1('');
    } else if (metodo === 2) {
      setInputRecargo2('0');
      setInputMontoBase2('');
      setInputMontoFinal2('');
    } else if (metodo === 3) {
      setInputRecargo3('0');
      setInputMontoBase3('');
      setInputMontoFinal3('');
    }

    console.log(`🔄 Método de pago ${metodo} cambiado a ${nuevoMetodo}`);
  };

  // Manejar cambio de destino de pago (caja o alias)
  const handleDestinoPagoChange = (metodo, destino) => {
    setDatosCliente(prev => ({
      ...prev,
      [`destino_pago_${metodo}`]: destino
    }));
  };

  const handleSenaMetodoChange = (metodo) => {
    const montoFloat = parsearInputMiles(inputSena);
    const enPesos = esMetodoEnPesos(metodo);
    const montoUSD = enPesos ? montoFloat / datosCliente.cotizacion_dolar : montoFloat;
    const montoARS = enPesos ? montoFloat : null;
    setDatosCliente(prev => ({ ...prev, sena_metodo: metodo, sena_caja: '', sena_monto: montoUSD, sena_monto_ars: montoARS }));
  };

  const handleSenaMontoChange = (valor) => {
    const formateado = formatearInputMiles(valor);
    const montoFloat = parsearInputMiles(formateado);
    setInputSena(formateado);
    const enPesos = esMetodoEnPesos(datosCliente.sena_metodo);
    const montoUSD = enPesos ? montoFloat / datosCliente.cotizacion_dolar : montoFloat;
    const montoARS = enPesos ? montoFloat : null;
    setDatosCliente(prev => ({ ...prev, sena_monto: montoUSD, sena_monto_ars: montoARS }));
  };

  const handleVueltoMetodoChange = (metodo) => {
    const montoFloat = parsearInputMiles(inputVuelto);
    const enPesos = esMetodoEnPesos(metodo);
    const montoUSD = enPesos ? montoFloat / datosCliente.cotizacion_dolar : montoFloat;
    const montoARS = enPesos ? montoFloat : null;
    setDatosCliente(prev => ({ ...prev, vuelto_metodo: metodo, vuelto_caja: '', vuelto_monto: montoUSD, vuelto_monto_ars: montoARS }));
  };

  const handleVueltoMontoChange = (valor) => {
    const formateado = formatearInputMiles(valor);
    const montoFloat = parsearInputMiles(formateado);
    setInputVuelto(formateado);
    const enPesos = esMetodoEnPesos(datosCliente.vuelto_metodo);
    const montoUSD = enPesos ? montoFloat / datosCliente.cotizacion_dolar : montoFloat;
    const montoARS = enPesos ? montoFloat : null;
    setDatosCliente(prev => ({ ...prev, vuelto_monto: montoUSD, vuelto_monto_ars: montoARS }));
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

  // Formatear string de input con puntos de miles (es-AR) mientras se escribe
  const formatearInputMiles = (raw) => {
    const stripped = raw.replace(/\./g, '');
    const parts = stripped.split(',');
    const intStr = parts[0].replace(/\D/g, '');
    const intNum = parseInt(intStr, 10);
    const intFormatted = intStr && !isNaN(intNum) ? intNum.toLocaleString('es-AR') : '';
    if (parts.length > 1) {
      const dec = parts[1].replace(/\D/g, '').slice(0, 2);
      return `${intFormatted},${dec}`;
    } else if (raw.endsWith(',')) {
      return `${intFormatted},`;
    }
    return intFormatted;
  };

  // Parsear string formateado con puntos de miles a número
  const parsearInputMiles = (valor) => {
    if (!valor) return 0;
    return parseFloat(String(valor).replace(/\./g, '').replace(',', '.')) || 0;
  };

  // Formatear número calculado para mostrar en input
  const formatearNumeroParaInput = (num) => {
    if (!num) return '';
    return Math.round(num).toLocaleString('es-AR');
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
    const metodoPago = metodo === 1 ? datosCliente.metodo_pago_1 : metodo === 2 ? datosCliente.metodo_pago_2 : datosCliente.metodo_pago_3;
    const recargo = metodo === 1 ? datosCliente.recargo_pago_1 : metodo === 2 ? datosCliente.recargo_pago_2 : datosCliente.recargo_pago_3;

    // Formatear con puntos de miles mientras se escribe
    const formateado = formatearInputMiles(montoBase);
    const montoBaseFloat = parsearInputMiles(formateado);

    // Actualizar input local del monto base (formateado)
    if (metodo === 1) {
      setInputMontoBase1(formateado);
    } else if (metodo === 2) {
      setInputMontoBase2(formateado);
    } else {
      setInputMontoBase3(formateado);
    }

    // Calcular monto final con recargo
    const montoFinalEnMonedaMetodo = necesitaRecargo(metodoPago) && recargo > 0
      ? montoBaseFloat * (1 + recargo / 100)
      : montoBaseFloat;

    // Actualizar input del monto final (formateado)
    if (metodo === 1) {
      setInputMontoFinal1(formatearNumeroParaInput(montoFinalEnMonedaMetodo));
    } else if (metodo === 2) {
      setInputMontoFinal2(formatearNumeroParaInput(montoFinalEnMonedaMetodo));
    } else {
      setInputMontoFinal3(formatearNumeroParaInput(montoFinalEnMonedaMetodo));
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
    const metodoPago = metodo === 1 ? datosCliente.metodo_pago_1 : metodo === 2 ? datosCliente.metodo_pago_2 : datosCliente.metodo_pago_3;
    const recargo = metodo === 1 ? datosCliente.recargo_pago_1 : metodo === 2 ? datosCliente.recargo_pago_2 : datosCliente.recargo_pago_3;

    // Formatear con puntos de miles mientras se escribe
    const formateado = formatearInputMiles(montoFinal);
    const montoFinalFloat = parsearInputMiles(formateado);

    // Actualizar input local del monto final (formateado)
    if (metodo === 1) {
      setInputMontoFinal1(formateado);
    } else if (metodo === 2) {
      setInputMontoFinal2(formateado);
    } else {
      setInputMontoFinal3(formateado);
    }

    // Calcular monto base (sin recargo)
    const montoBaseEnMonedaMetodo = necesitaRecargo(metodoPago) && recargo > 0
      ? montoFinalFloat / (1 + recargo / 100)
      : montoFinalFloat;

    // Actualizar input del monto base (formateado)
    if (metodo === 1) {
      setInputMontoBase1(formatearNumeroParaInput(montoBaseEnMonedaMetodo));
    } else if (metodo === 2) {
      setInputMontoBase2(formatearNumeroParaInput(montoBaseEnMonedaMetodo));
    } else {
      setInputMontoBase3(formatearNumeroParaInput(montoBaseEnMonedaMetodo));
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
    } else if (metodo === 2) {
      setInputRecargo2(recargo);
    } else {
      setInputRecargo3(recargo);
    }

    setDatosCliente(prev => ({
      ...prev,
      [`recargo_pago_${metodo}`]: parseFloat(recargo) || 0
    }));

    // Recalcular monto final si hay monto base ingresado
    const montoBaseInput = metodo === 1 ? inputMontoBase1 : metodo === 2 ? inputMontoBase2 : inputMontoBase3;
    if (montoBaseInput && parsearInputMiles(montoBaseInput) > 0) {
      handleMontoBaseChange(metodo, montoBaseInput);
    }
  };

  const distribuyeMontos = () => {
    // No hacer distribución automática - el usuario ingresa los montos manualmente
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

    // ✅ VALIDACIÓN: Verificar que hay montos ingresados (incluyendo seña, restando vuelto)
    const totalPagadoUSD = (datosCliente.monto_pago_1 || 0) + (datosCliente.monto_pago_2 || 0) + (datosCliente.monto_pago_3 || 0) + (datosCliente.sena_monto || 0) - (datosCliente.vuelto_monto || 0);

    if (totalPagadoUSD <= 0) {
      console.error('❌ No se ha ingresado ningún monto de pago');
      alert('⚠️ Debe ingresar al menos un monto de pago antes de procesar la venta.');
      return;
    }

    // ✅ VALIDACIÓN: Verificar que los destinos están completos para métodos que lo requieren
    const validarDestino = (metodo, metodoPago, monto, destino) => {
      if (!metodoPago || monto <= 0) return true; // No aplica si no hay método o monto
      if (!requiereDestino(metodoPago)) return true; // cuenta_corriente no requiere destino
      if (!destino || destino.trim() === '') {
        const tipoDestino = necesitaSelectorCaja(metodoPago) ? 'caja' : 'alias/wallet';
        alert(`⚠️ Debe seleccionar ${tipoDestino} para el método de pago ${metodo}`);
        return false;
      }
      return true;
    };

    if (!validarDestino(1, datosCliente.metodo_pago_1, datosCliente.monto_pago_1, datosCliente.destino_pago_1)) return;
    if (!validarDestino(2, datosCliente.metodo_pago_2, datosCliente.monto_pago_2, datosCliente.destino_pago_2)) return;
    if (!validarDestino(3, datosCliente.metodo_pago_3, datosCliente.monto_pago_3, datosCliente.destino_pago_3)) return;

    // Confirmar con alert nativo
    const mensaje = (datosCliente.metodo_pago_1 === 'cuenta_corriente' || datosCliente.metodo_pago_2 === 'cuenta_corriente')
      ? `¿Confirmar venta a CUENTA CORRIENTE para ${clienteSeleccionado?.nombre} ${clienteSeleccionado?.apellido}?\n\nEsto quedará registrado como deuda pendiente del cliente.`
      : `¿Confirmar venta para ${clienteSeleccionado?.nombre} ${clienteSeleccionado?.apellido}?`;

    if (window.confirm(mensaje)) {
      confirmarVenta();
    }
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

  // Función de envío de garantías eliminada - las garantías se generan desde GarantiasSection

  const limpiarTodoPostVenta = () => {
    console.log('🧹 Limpiando estado post-venta...');
    setClienteSeleccionado(null);
    setFechaVenta(obtenerFechaLocal());
    setDatosCliente({
      metodo_pago_1: 'efectivo_pesos',
      metodo_pago_2: '',
      metodo_pago_3: '',
      monto_pago_1: 0,
      monto_pago_2: 0,
      monto_pago_3: 0,
      recargo_pago_1: 0,
      recargo_pago_2: 0,
      recargo_pago_3: 0,
      destino_pago_1: '',
      destino_pago_2: '',
      destino_pago_3: '',
      observaciones: '',
      vendedor: '',
      sucursal: 'la_plata',
      cotizacion_dolar: datosCliente.cotizacion_dolar,
      sena_monto: 0,
      sena_monto_ars: null,
      sena_metodo: '',
      sena_caja: '',
      vuelto_monto: 0,
      vuelto_monto_ars: null,
      vuelto_metodo: '',
      vuelto_caja: ''
    });
    setMostrarFormulario(false);
    setIsOpen(false);
    setAperturaManual(false);
    setCarritoAnterior([]);

    // Limpiar inputs de seña y vuelto
    setInputSena('');
    setInputVuelto('');

    // Limpiar inputs locales
    setInputMontoBase1('');
    setInputMontoBase2('');
    setInputMontoBase3('');
    setInputMontoFinal1('');
    setInputMontoFinal2('');
    setInputMontoFinal3('');
    setInputRecargo1('0');
    setInputRecargo2('0');
    setInputRecargo3('0');

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

    try {
      console.log('🚀 Iniciando procesamiento de venta...');

      // Generar número de transacción único
      const numeroTransaccion = `VT-${Date.now()}`;

      // ✅ DATOS COMPLETOS: Usar información del cliente seleccionado
      // Obtener nombre del vendedor seleccionado
      const vendedorSeleccionado = vendedores.find(v => v.id === datosCliente.vendedor);
      const nombreVendedor = vendedorSeleccionado
        ? `${vendedorSeleccionado.nombre} ${vendedorSeleccionado.apellido}`
        : '';

      // Usar la fecha seleccionada por el usuario + hora actual con zona horaria de Buenos Aires (UTC-3)
      const fechaVentaCompleta = `${fechaVenta}T${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}:${new Date().getSeconds().toString().padStart(2, '0')}-03:00`;

      const datosVentaCompletos = {
        cliente_id: clienteSeleccionado.id,
        cliente_nombre: `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`,
        cliente_email: clienteSeleccionado.email || null,
        cliente_telefono: clienteSeleccionado.telefono || null,
        metodo_pago_1: datosCliente.metodo_pago_1,
        metodo_pago_2: datosCliente.metodo_pago_2,
        metodo_pago_3: datosCliente.metodo_pago_3,
        monto_pago_1: datosCliente.monto_pago_1,
        monto_pago_2: datosCliente.monto_pago_2,
        monto_pago_3: datosCliente.monto_pago_3,
        monto_pago_1_usd: !esMetodoEnPesos(datosCliente.metodo_pago_1) ? datosCliente.monto_pago_1 : null,
        monto_pago_1_ars: esMetodoEnPesos(datosCliente.metodo_pago_1) ? datosCliente.monto_pago_1 * datosCliente.cotizacion_dolar : null,
        monto_pago_2_usd: datosCliente.metodo_pago_2 && !esMetodoEnPesos(datosCliente.metodo_pago_2) ? (datosCliente.monto_pago_2 || 0) : null,
        monto_pago_2_ars: datosCliente.metodo_pago_2 && esMetodoEnPesos(datosCliente.metodo_pago_2) ? (datosCliente.monto_pago_2 || 0) * datosCliente.cotizacion_dolar : null,
        monto_pago_3_usd: datosCliente.metodo_pago_3 && !esMetodoEnPesos(datosCliente.metodo_pago_3) ? (datosCliente.monto_pago_3 || 0) : null,
        monto_pago_3_ars: datosCliente.metodo_pago_3 && esMetodoEnPesos(datosCliente.metodo_pago_3) ? (datosCliente.monto_pago_3 || 0) * datosCliente.cotizacion_dolar : null,
        cotizacion_dolar: datosCliente.cotizacion_dolar,
        destino_pago_1: datosCliente.destino_pago_1,
        destino_pago_2: datosCliente.destino_pago_2,
        destino_pago_3: datosCliente.destino_pago_3,
        observaciones: datosCliente.observaciones,
        vendedor: datosCliente.vendedor,
        vendedor_nombre: nombreVendedor,
        sucursal: datosCliente.sucursal,
        numeroTransaccion,
        fecha_venta: fechaVentaCompleta,
        sena_monto: datosCliente.sena_monto || 0,
        sena_monto_ars: datosCliente.sena_monto_ars || null,
        sena_metodo: datosCliente.sena_metodo || null,
        sena_caja: datosCliente.sena_caja || null,
        vuelto_monto: datosCliente.vuelto_monto || 0,
        vuelto_monto_ars: datosCliente.vuelto_monto_ars || null,
        vuelto_metodo: datosCliente.vuelto_metodo || null,
        vuelto_caja: datosCliente.vuelto_caja || null,
        // ✅ NUEVO: Información para cuenta corriente
        esCuentaCorriente: datosCliente.metodo_pago_1 === 'cuenta_corriente' || datosCliente.metodo_pago_2 === 'cuenta_corriente' || datosCliente.metodo_pago_3 === 'cuenta_corriente',
        total: calcularTotal(),
        // ✅ Flag para controlar envío de email (PRUEBA)
        enviarEmail: enviarEmail
      };

      console.log('📦 Datos completos de la venta:', datosVentaCompletos);

      // Procesar la venta en la base de datos
      console.log('💾 Enviando venta a la base de datos...');
      const transaccionResultado = await onProcesarVenta(carrito, datosVentaCompletos);
      console.log('✅ Venta procesada exitosamente en la BD');

      // ✅ MOSTRAR MENSAJE DE ÉXITO personalizado
      const montoCobradoTotal = calcularMontoCobrado();
      let mensajeExito = (datosCliente.metodo_pago_1 === 'cuenta_corriente' || datosCliente.metodo_pago_2 === 'cuenta_corriente')
        ? `✅ Venta a CUENTA CORRIENTE procesada exitosamente!\n\nTransacción: ${numeroTransaccion}\nCliente: ${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}\nMonto cobrado: U$${Math.round(montoCobradoTotal)}\n\n📝 El saldo se registró en la cuenta corriente del cliente.`
        : `✅ Venta procesada exitosamente!\n\nTransacción: ${numeroTransaccion}\nCliente: ${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}\nMonto cobrado: U$${Math.round(montoCobradoTotal)}`;

      // ⚠️ AGREGAR ADVERTENCIA SI HAY PRODUCTOS DE OTRA SUCURSAL
      if (transaccionResultado && transaccionResultado.productosConAdvertencia && transaccionResultado.productosConAdvertencia.length > 0) {
        console.log('⚠️ Productos descargados de otra sucursal:', transaccionResultado.productosConAdvertencia);

        let advertenciaTexto = '\n\n⚠️ NOTA: Los siguientes productos se descontaron de otra sucursal por falta de stock:\n';
        transaccionResultado.productosConAdvertencia.forEach((prod) => {
          advertenciaTexto += `\n• ${prod.producto}`;
        });

        mensajeExito += advertenciaTexto;
      }

      alert(mensajeExito);

      // ✅ Limpiar después de la venta exitosa
      setMostrarFormulario(false);
      setMostrarConfirmacion(false);

      // Limpiar directamente - las garantías se generan desde GarantiasSection
      console.log('🧹 Venta completada, limpiando...');
      limpiarTodoPostVenta();

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
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded shadow-lg transition-all duration-300"
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            {calcularCantidadTotal() > 0 && (
              <div className="absolute -top-2 -right-2 bg-slate-800 text-white text-xs rounded w-5 h-5 flex items-center justify-center font-bold">
                {calcularCantidadTotal()}
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Modal del carrito */}
      {isOpen && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-black/30 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setIsOpen(false);
            setAperturaManual(false);
          }}
        >
          <div
            className="bg-white rounded max-w-7xl w-full max-h-[95vh] overflow-y-auto border border-slate-300 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {!mostrarFormulario ? (
              <>
                {/* Header compacto */}
                <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <ShoppingCart className="w-6 h-6" />
                    <div className="flex items-baseline space-x-3">
                      <h2 className="text-xl font-semibold">CARRITO</h2>
                      <span className="text-slate-300 text-sm">({calcularCantidadTotal()} items)</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setAperturaManual(false);
                    }}
                    className="p-2 hover:bg-slate-700 rounded transition-colors"
                  >
                    <X className="w-6 h-6" />
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
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-800 text-white">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold uppercase w-1/3">Modelo</th>
                            <th className="px-4 py-2 text-center font-semibold uppercase">Categoría</th>
                            <th className="px-4 py-2 text-center font-semibold uppercase">Serial</th>
                            <th className="px-4 py-2 text-center font-semibold uppercase">Color</th>
                            <th className="px-4 py-2 text-center font-semibold uppercase">Cant.</th>
                            <th className="px-4 py-2 text-center font-semibold uppercase">Precio</th>
                            <th className="px-4 py-2 text-center font-semibold uppercase">Subtotal</th>
                            <th className="px-2 py-2 text-center font-semibold uppercase"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {carrito.map((item, index) => {
                            const obtenerCategoria = () => {
                              if (item.tipo === 'otro') {
                                return item.producto.subcategoria || item.categoria || item.producto.categoria || '-';
                              }
                              return item.tipo === 'computadora' ? 'Notebook' : item.tipo === 'celular' ? 'Celular' : item.tipo;
                            };

                            return (
                              <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                <td className="px-4 py-3 text-left">
                                  <div className="flex items-center justify-start space-x-2">
                                    {getIconoTipo(item.tipo)}
                                    <span className="text-slate-800 font-medium" title={item.producto.modelo || item.producto.nombre_producto}>
                                      {item.producto.modelo || item.producto.nombre_producto || '-'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center text-slate-700 capitalize">{obtenerCategoria()}</td>
                                <td className="px-4 py-3 text-center text-slate-600 font-mono text-xs">
                                  {item.producto.serial && item.producto.serial.trim() !== '' ? item.producto.serial : '-'}
                                </td>
                                <td className="px-4 py-3 text-center text-slate-600 capitalize">{item.producto.color || '-'}</td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center space-x-1">
                                    <button
                                      onClick={() => onUpdateCantidad(item.id, item.cantidad - 1)}
                                      className="p-1 text-slate-500 hover:text-emerald-600"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="w-6 text-center font-semibold text-slate-800">{item.cantidad}</span>
                                    <button
                                      onClick={() => onUpdateCantidad(item.id, item.cantidad + 1)}
                                      className="p-1 text-slate-500 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                      disabled={(item.tipo !== 'otro' || (item.producto.serial && item.producto.serial.trim() !== '')) && item.cantidad >= 1}
                                      title={((item.tipo !== 'otro' || (item.producto.serial && item.producto.serial.trim() !== '')) && item.cantidad >= 1) ? 'Producto con serial: cantidad fija en 1' : ''}
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center space-x-1">
                                    <span className="text-slate-800">
                                      U${Math.round(item.precio_unitario)}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center font-semibold text-slate-800">
                                  U${Math.round(item.precio_unitario * item.cantidad)}
                                </td>
                                <td className="px-2 py-3 text-center">
                                  <button
                                    onClick={() => onRemover(item.id)}
                                    className="text-slate-400 hover:text-red-600"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {/* Fila de Total alineada con subtotales */}
                          <tr className="bg-slate-100 border-t-2 border-slate-300">
                            <td colSpan="5" className="px-4 py-3 text-right font-bold text-slate-600 uppercase">
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-slate-800 uppercase">
                              Total
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-lg text-emerald-700">
                              U${Math.round(calcularTotal())}
                            </td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Footer compacto */}
                    <div className="bg-slate-50 p-4 border-t border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={onLimpiar}
                          className="text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded transition-colors font-medium flex items-center space-x-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Limpiar carrito</span>
                        </button>

                        <button
                          onClick={() => setMostrarFormulario(true)}
                          className="bg-emerald-600 text-white px-8 py-3 rounded font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2 shadow-sm"
                        >
                          <ShoppingCart className="w-5 h-5" />
                          <span>Procesar Venta</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {/* Formulario de venta */}
                <div className="bg-slate-800 p-6 text-white flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-6 h-6" />
                    <div>
                      <h2 className="text-xl font-semibold">PROCESAR VENTA</h2>
                      <p className="text-slate-300 text-sm mt-1">Complete la información para procesar</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMostrarFormulario(false);
                      setAperturaManual(false);
                    }}
                    className="p-2 hover:bg-slate-700 rounded transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleProcesarVenta} className="p-6 space-y-6">
                  {/* ✅ Selector de cliente */}
                  <div className="space-y-4">
                    <div className="bg-slate-800 rounded p-3 mb-4">
                      <h4 className="text-white text-sm font-semibold uppercase text-center">
                        Cliente
                      </h4>
                    </div>
                    <ClienteSelector
                      selectedCliente={clienteSeleccionado}
                      onSelectCliente={setClienteSeleccionado}
                      required={true}
                    />
                  </div>

                  {/* Productos Unificados */}
                  <div className="space-y-4">
                    <div className="bg-slate-800 rounded p-3 mb-4">
                      <h4 className="text-white text-sm font-semibold uppercase text-center">
                        Productos
                      </h4>
                    </div>

                    {carrito.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <p className="text-sm">No hay productos en el carrito</p>
                      </div>
                    ) : (
                      <>
                        <div className="border border-slate-200 rounded overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-slate-600 text-white">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Producto</th>
                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Serial</th>
                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Color</th>
                                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider w-16">Cant.</th>
                                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider w-24">Precio Unit.</th>
                                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider w-24">Subtotal</th>
                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-16">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {carrito.map((item, index) => (
                                <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                  {/* Producto */}
                                  <td className="px-4 py-3">
                                    <p className="text-sm font-medium text-slate-800 truncate">
                                      {item.producto.modelo || item.producto.nombre_producto}
                                    </p>
                                  </td>

                                  {/* Serial */}
                                  <td className="px-4 py-3 text-center text-slate-600 font-mono text-xs">
                                    {item.producto.serial && item.producto.serial.trim() !== '' ? item.producto.serial : '-'}
                                  </td>

                                  {/* Color */}
                                  <td className="px-4 py-3 text-center text-slate-600 capitalize text-sm">
                                    {item.producto.color || '-'}
                                  </td>

                                  {/* Cantidad */}
                                  <td className="px-4 py-3">
                                    <div className="flex items-center justify-center space-x-1">
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
                                        className="p-1 text-slate-500 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                        disabled={(item.tipo !== 'otro' || (item.producto.serial && item.producto.serial.trim() !== '')) && item.cantidad >= 1}
                                        title={((item.tipo !== 'otro' || (item.producto.serial && item.producto.serial.trim() !== '')) && item.cantidad >= 1) ? 'Producto con serial: cantidad fija en 1' : ''}
                                        type="button"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </td>

                                  {/* Precio Unitario */}
                                  <td className="px-4 py-3">
                                    <div className="flex items-center justify-center space-x-1">
                                      {editandoPrecio === item.id ? (
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
                                        <>
                                          <button
                                            onClick={() => iniciarEdicionPrecio(item)}
                                            className={`text-sm font-medium cursor-pointer hover:opacity-70 transition-opacity ${preciosModificados[item.id]?.fue_modificado
                                              ? 'text-emerald-600'
                                              : 'text-slate-800'
                                              }`}
                                            title="Click para editar"
                                            type="button"
                                          >
                                            U${Math.round(item.precio_unitario)}
                                          </button>

                                          {preciosModificados[item.id]?.fue_modificado && (
                                            <button
                                              onClick={() => restaurarPrecioOriginal(item.id)}
                                              className="p-1 text-slate-400 hover:text-slate-600"
                                              title={`Restaurar: U$${preciosModificados[item.id]?.precio_original ? Math.round(preciosModificados[item.id].precio_original) : 0}`}
                                              type="button"
                                            >
                                              <RotateCcw className="w-3 h-3" />
                                            </button>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </td>

                                  {/* Subtotal */}
                                  <td className="px-4 py-3 text-center">
                                    <span className="text-sm font-semibold text-slate-800">
                                      U${Math.round(item.precio_unitario * item.cantidad)}
                                    </span>
                                  </td>

                                  {/* Acciones */}
                                  <td className="px-4 py-3 text-center">
                                    <button
                                      onClick={() => onRemover(item.id)}
                                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                      title="Eliminar"
                                      type="button"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                      </>
                    )}
                  </div>

                  {/* Cotización y Pago */}
                  <div className="space-y-4">
                    <div className="bg-slate-800 rounded p-3 mb-4">
                      <h4 className="text-white text-sm font-semibold uppercase text-center">
                        Pago
                      </h4>
                    </div>

                    {/* Resumen de Cotización */}
                    <div className="bg-slate-100 border border-slate-200 rounded p-3 grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-xs text-slate-600 font-medium uppercase mb-1">Total USD</p>
                        <p className="text-lg font-bold text-slate-800">U${Math.round(calcularTotal())}</p>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-slate-600 font-medium uppercase mb-1">Cotización</p>
                        {editandoCotizacion ? (
                          <input
                            type="number"
                            value={datosCliente.cotizacion_dolar}
                            onChange={(e) => setDatosCliente(prev => ({ ...prev, cotizacion_dolar: parseFloat(e.target.value) || 0 }))}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                setEditandoCotizacion(false);
                              } else if (e.key === 'Escape') {
                                setEditandoCotizacion(false);
                              }
                            }}
                            className="w-full text-center text-lg font-bold border border-emerald-500 rounded px-2 text-slate-800 focus:outline-none"
                            step="0.01"
                            autoFocus
                          />
                        ) : (
                          <p
                            onClick={() => setEditandoCotizacion(!editandoCotizacion)}
                            className="text-lg font-bold text-slate-800 cursor-pointer hover:opacity-70 transition-opacity"
                            title="Click para editar"
                          >
                            ${datosCliente.cotizacion_dolar}
                          </p>
                        )}
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-slate-600 font-medium uppercase mb-1">Total ARS</p>
                        <p className="text-lg font-bold text-slate-800">${calcularTotalPesos().toLocaleString('es-AR')}</p>
                      </div>
                    </div>

                    {/* Primer método de pago */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2 text-center">
                          Pago 1 *
                        </label>
                        <MetodoPagoSelector
                          name="metodo_pago_1"
                          value={datosCliente.metodo_pago_1}
                          onChange={(e) => handleMetodoPagoChange(1, e.target.value)}
                          exclude={['cliente_abona']}
                          className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2 text-center">
                          Monto ({obtenerMonedaMetodo(datosCliente.metodo_pago_1)})
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={inputMontoBase1}
                          onChange={(e) => handleMontoBaseChange(1, e.target.value)}
                          className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none"
                          placeholder="Monto a cobrar"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2 text-center">
                          {necesitaSelectorCaja(datosCliente.metodo_pago_1) ? 'Caja *' : necesitaInputAlias(datosCliente.metodo_pago_1) ? 'Alias/Wallet *' : 'Destino'}
                        </label>
                        {necesitaSelectorCaja(datosCliente.metodo_pago_1) ? (
                          <select
                            value={datosCliente.destino_pago_1}
                            onChange={(e) => handleDestinoPagoChange(1, e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none"
                          >
                            <option value="">Seleccionar caja</option>
                            {cajas.map((caja) => (
                              <option key={caja.id} value={caja.nombre}>
                                {caja.nombre}
                              </option>
                            ))}
                          </select>
                        ) : necesitaInputAlias(datosCliente.metodo_pago_1) ? (
                          <input
                            type="text"
                            value={datosCliente.destino_pago_1}
                            onChange={(e) => handleDestinoPagoChange(1, e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none"
                            placeholder={datosCliente.metodo_pago_1 === 'transferencia' ? 'Alias CBU/CVU' : 'Wallet address'}
                          />
                        ) : (
                          <input
                            type="text"
                            value={datosCliente.metodo_pago_1 === 'cuenta_corriente' ? 'Cuenta Corriente' : datosCliente.metodo_pago_1 === 'mercaderia' ? 'Mercadería' : '-'}
                            disabled
                            className="w-full p-3 border border-slate-200 rounded-lg bg-slate-100 text-slate-500"
                          />
                        )}
                      </div>
                    </div>


                    {/* Segundo método de pago (opcional) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2 text-center">
                          Pago 2
                        </label>
                        <MetodoPagoSelector
                          name="metodo_pago_2"
                          value={datosCliente.metodo_pago_2}
                          onChange={(e) => handleMetodoPagoChange(2, e.target.value)}
                          exclude={['cliente_abona']}
                          showEmpty={true}
                          emptyLabel="Seleccionar método"
                          className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2 text-center">
                          Monto {datosCliente.metodo_pago_2 ? `(${obtenerMonedaMetodo(datosCliente.metodo_pago_2)})` : ''}
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={inputMontoBase2}
                          onChange={(e) => handleMontoBaseChange(2, e.target.value)}
                          className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none"
                          placeholder="Monto a cobrar"
                          disabled={!datosCliente.metodo_pago_2}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2 text-center">
                          {datosCliente.metodo_pago_2 && necesitaSelectorCaja(datosCliente.metodo_pago_2) ? 'Caja *' : datosCliente.metodo_pago_2 && necesitaInputAlias(datosCliente.metodo_pago_2) ? 'Alias/Wallet *' : 'Destino'}
                        </label>
                        {datosCliente.metodo_pago_2 && necesitaSelectorCaja(datosCliente.metodo_pago_2) ? (
                          <select
                            value={datosCliente.destino_pago_2}
                            onChange={(e) => handleDestinoPagoChange(2, e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none"
                          >
                            <option value="">Seleccionar caja</option>
                            {cajas.map((caja) => (
                              <option key={caja.id} value={caja.nombre}>
                                {caja.nombre}
                              </option>
                            ))}
                          </select>
                        ) : datosCliente.metodo_pago_2 && necesitaInputAlias(datosCliente.metodo_pago_2) ? (
                          <input
                            type="text"
                            value={datosCliente.destino_pago_2}
                            onChange={(e) => handleDestinoPagoChange(2, e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none"
                            placeholder={datosCliente.metodo_pago_2 === 'transferencia' ? 'Alias CBU/CVU' : 'Wallet address'}
                          />
                        ) : (
                          <input
                            type="text"
                            value={datosCliente.metodo_pago_2 === 'cuenta_corriente' ? 'Cuenta Corriente' : datosCliente.metodo_pago_2 === 'mercaderia' ? 'Mercadería' : '-'}
                            disabled
                            className="w-full p-3 border border-slate-200 rounded-lg bg-slate-100 text-slate-500"
                          />
                        )}
                      </div>
                    </div>

                    {/* Tercer método de pago (opcional) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2 text-center">
                          Pago 3
                        </label>
                        <MetodoPagoSelector
                          name="metodo_pago_3"
                          value={datosCliente.metodo_pago_3}
                          onChange={(e) => handleMetodoPagoChange(3, e.target.value)}
                          exclude={['cliente_abona']}
                          showEmpty={true}
                          emptyLabel="Seleccionar método"
                          className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2 text-center">
                          Monto {datosCliente.metodo_pago_3 ? `(${obtenerMonedaMetodo(datosCliente.metodo_pago_3)})` : ''}
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={inputMontoBase3}
                          onChange={(e) => handleMontoBaseChange(3, e.target.value)}
                          className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none"
                          placeholder="Monto a cobrar"
                          disabled={!datosCliente.metodo_pago_3}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2 text-center">
                          {datosCliente.metodo_pago_3 && necesitaSelectorCaja(datosCliente.metodo_pago_3) ? 'Caja *' : datosCliente.metodo_pago_3 && necesitaInputAlias(datosCliente.metodo_pago_3) ? 'Alias/Wallet *' : 'Destino'}
                        </label>
                        {datosCliente.metodo_pago_3 && necesitaSelectorCaja(datosCliente.metodo_pago_3) ? (
                          <select
                            value={datosCliente.destino_pago_3}
                            onChange={(e) => handleDestinoPagoChange(3, e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none"
                          >
                            <option value="">Seleccionar caja</option>
                            {cajas.map((caja) => (
                              <option key={caja.id} value={caja.nombre}>
                                {caja.nombre}
                              </option>
                            ))}
                          </select>
                        ) : datosCliente.metodo_pago_3 && necesitaInputAlias(datosCliente.metodo_pago_3) ? (
                          <input
                            type="text"
                            value={datosCliente.destino_pago_3}
                            onChange={(e) => handleDestinoPagoChange(3, e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none"
                            placeholder={datosCliente.metodo_pago_3 === 'transferencia' ? 'Alias CBU/CVU' : 'Wallet address'}
                          />
                        ) : (
                          <input
                            type="text"
                            value={datosCliente.metodo_pago_3 === 'cuenta_corriente' ? 'Cuenta Corriente' : datosCliente.metodo_pago_3 === 'mercaderia' ? 'Mercadería' : '-'}
                            disabled
                            className="w-full p-3 border border-slate-200 rounded-lg bg-slate-100 text-slate-500"
                          />
                        )}
                      </div>
                    </div>

                    {/* ── Seña ── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2 text-center">Método seña</label>
                        <MetodoPagoSelector
                          value={datosCliente.sena_metodo}
                          onChange={(e) => handleSenaMetodoChange(e.target.value)}
                          exclude={['cliente_abona']}
                          showEmpty={true}
                          emptyLabel="Sin seña"
                          className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2 text-center">
                          Monto {datosCliente.sena_metodo ? `(${obtenerMonedaMetodo(datosCliente.sena_metodo)})` : ''}
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={inputSena}
                          onChange={(e) => handleSenaMontoChange(e.target.value)}
                          disabled={!datosCliente.sena_metodo}
                          className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none disabled:bg-slate-100"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2 text-center">
                          {datosCliente.sena_metodo && necesitaSelectorCaja(datosCliente.sena_metodo) ? 'Caja *' : datosCliente.sena_metodo && necesitaInputAlias(datosCliente.sena_metodo) ? 'Alias/Wallet *' : 'Destino'}
                        </label>
                        {datosCliente.sena_metodo && necesitaSelectorCaja(datosCliente.sena_metodo) ? (
                          <select
                            value={datosCliente.sena_caja}
                            onChange={(e) => setDatosCliente(prev => ({ ...prev, sena_caja: e.target.value }))}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none"
                          >
                            <option value="">Seleccionar caja</option>
                            {cajas.map((caja) => (
                              <option key={caja.id} value={caja.nombre}>{caja.nombre}</option>
                            ))}
                          </select>
                        ) : datosCliente.sena_metodo && necesitaInputAlias(datosCliente.sena_metodo) ? (
                          <input
                            type="text"
                            value={datosCliente.sena_caja}
                            onChange={(e) => setDatosCliente(prev => ({ ...prev, sena_caja: e.target.value }))}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none"
                            placeholder={datosCliente.sena_metodo === 'transferencia' ? 'Alias CBU/CVU' : 'Wallet address'}
                          />
                        ) : (
                          <input type="text" disabled value="-" className="w-full p-3 border border-slate-200 rounded-lg bg-slate-100 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* ── Vuelto ── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2 text-center">Método vuelto</label>
                        <MetodoPagoSelector
                          value={datosCliente.vuelto_metodo}
                          onChange={(e) => handleVueltoMetodoChange(e.target.value)}
                          exclude={['cliente_abona']}
                          showEmpty={true}
                          emptyLabel="Sin vuelto"
                          className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2 text-center">
                          Monto {datosCliente.vuelto_metodo ? `(${obtenerMonedaMetodo(datosCliente.vuelto_metodo)})` : ''}
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={inputVuelto}
                          onChange={(e) => handleVueltoMontoChange(e.target.value)}
                          disabled={!datosCliente.vuelto_metodo}
                          className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none disabled:bg-slate-100"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2 text-center">
                          {datosCliente.vuelto_metodo && necesitaSelectorCaja(datosCliente.vuelto_metodo) ? 'Caja *' : datosCliente.vuelto_metodo && necesitaInputAlias(datosCliente.vuelto_metodo) ? 'Alias/Wallet *' : 'Destino'}
                        </label>
                        {datosCliente.vuelto_metodo && necesitaSelectorCaja(datosCliente.vuelto_metodo) ? (
                          <select
                            value={datosCliente.vuelto_caja}
                            onChange={(e) => setDatosCliente(prev => ({ ...prev, vuelto_caja: e.target.value }))}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none"
                          >
                            <option value="">Seleccionar caja</option>
                            {cajas.map((caja) => (
                              <option key={caja.id} value={caja.nombre}>{caja.nombre}</option>
                            ))}
                          </select>
                        ) : datosCliente.vuelto_metodo && necesitaInputAlias(datosCliente.vuelto_metodo) ? (
                          <input
                            type="text"
                            value={datosCliente.vuelto_caja}
                            onChange={(e) => setDatosCliente(prev => ({ ...prev, vuelto_caja: e.target.value }))}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none"
                            placeholder={datosCliente.vuelto_metodo === 'transferencia' ? 'Alias CBU/CVU' : 'Wallet address'}
                          />
                        ) : (
                          <input type="text" disabled value="-" className="w-full p-3 border border-slate-200 rounded-lg bg-slate-100 text-slate-400" />
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Información adicional */}
                  <div className="space-y-4">
                    <div className="bg-slate-800 rounded p-3 mb-4">
                      <h4 className="text-white text-sm font-semibold uppercase text-center">
                        Información adicional
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2 text-center">Vendedor *</label>
                        <select
                          name="vendedor"
                          value={datosCliente.vendedor}
                          onChange={handleInputChange}
                          disabled={loadingVendedores}
                          className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none disabled:bg-slate-200"
                          required
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
                        <label className="block text-sm font-medium text-slate-800 mb-2 text-center">Sucursal *</label>
                        <select
                          name="sucursal"
                          value={datosCliente.sucursal}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none"
                        >
                          <option value="la_plata">La Plata </option>
                          <option value="mitre">Mitre </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-800 mb-2 text-center">Fecha de Venta *</label>
                        <input
                          type="date"
                          value={fechaVenta}
                          onChange={(e) => setFechaVenta(e.target.value)}
                          className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-slate-800 mb-2 text-center">Observaciones</label>
                        <textarea
                          name="observaciones"
                          value={datosCliente.observaciones}
                          onChange={handleInputChange}
                          rows="2"
                          className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none"
                          placeholder="Observaciones adicionales..."
                        />
                      </div>
                    </div>
                  </div>


                  {/* Resumen */}
                  <div className="space-y-4">
                    <div className="bg-slate-800 rounded p-3 mb-4">
                      <h4 className="text-white text-sm font-semibold uppercase text-center">
                        Resumen de la venta
                      </h4>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      {/* Primera fila: Cliente, Productos, Vendedor */}
                      <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-slate-200">
                        <div className="text-center">
                          <p className="text-xs text-slate-600 font-medium uppercase mb-1">Cliente</p>
                          {clienteSeleccionado && (
                            <p className="text-sm font-medium text-slate-800">{clienteSeleccionado.nombre} {clienteSeleccionado.apellido}</p>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-600 font-medium uppercase mb-1">Productos</p>
                          <p className="text-sm font-medium text-slate-800">{calcularCantidadTotal()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-600 font-medium uppercase mb-1">Vendedor</p>
                          <p className="text-sm font-medium text-slate-800">{vendedores.find(v => v.id === datosCliente.vendedor)?.nombre} {vendedores.find(v => v.id === datosCliente.vendedor)?.apellido}</p>
                        </div>
                      </div>

                      {/* Segunda fila: Sucursal, Fecha, Total USD */}
                      <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-slate-200">
                        <div className="text-center">
                          <p className="text-xs text-slate-600 font-medium uppercase mb-1">Sucursal</p>
                          <p className="text-sm font-medium text-slate-800">{datosCliente.sucursal.replace('_', ' ').toUpperCase()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-600 font-medium uppercase mb-1">Fecha</p>
                          <p className="text-sm font-medium text-slate-800">{formatearFechaDisplay(fechaVenta)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-600 font-medium uppercase mb-1">Monto Cobrado</p>
                          <p className="text-sm font-medium text-emerald-700 font-bold">U${Math.round(calcularMontoCobrado())}</p>
                        </div>
                      </div>

                      {/* Métodos de Pago */}
                      <div className="text-center">
                        <p className="text-xs text-slate-600 font-medium uppercase mb-2">Métodos de pago</p>
                        <div className="space-y-1">
                          <p className="text-sm text-slate-800">
                            {datosCliente.metodo_pago_1.replace(/_/g, ' ').toUpperCase()}: {formatearMonto(
                              parsearInputMiles(inputMontoBase1),
                              obtenerMonedaMetodo(datosCliente.metodo_pago_1)
                            )}
                            {datosCliente.destino_pago_1 && (
                              <span className="text-slate-500 text-xs ml-1">
                                ({datosCliente.destino_pago_1})
                              </span>
                            )}
                          </p>
                          {datosCliente.metodo_pago_2 && parsearInputMiles(inputMontoBase2) > 0 && (
                            <p className="text-sm text-slate-800">
                              {datosCliente.metodo_pago_2.replace(/_/g, ' ').toUpperCase()}: {formatearMonto(
                                parsearInputMiles(inputMontoBase2),
                                obtenerMonedaMetodo(datosCliente.metodo_pago_2)
                              )}
                              {datosCliente.destino_pago_2 && (
                                <span className="text-slate-500 text-xs ml-1">
                                  ({datosCliente.destino_pago_2})
                                </span>
                              )}
                            </p>
                          )}
                          {datosCliente.metodo_pago_3 && parsearInputMiles(inputMontoBase3) > 0 && (
                            <p className="text-sm text-slate-800">
                              {datosCliente.metodo_pago_3.replace(/_/g, ' ').toUpperCase()}: {formatearMonto(
                                parsearInputMiles(inputMontoBase3),
                                obtenerMonedaMetodo(datosCliente.metodo_pago_3)
                              )}
                              {datosCliente.destino_pago_3 && (
                                <span className="text-slate-500 text-xs ml-1">
                                  ({datosCliente.destino_pago_3})
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Seña y Vuelto en resumen */}
                      {(datosCliente.sena_monto > 0 || datosCliente.vuelto_monto > 0) && (
                        <div className="text-center mt-2 space-y-1">
                          {datosCliente.sena_monto > 0 && (
                            <p className="text-sm text-emerald-700 font-medium">
                              + SEÑA ({datosCliente.sena_metodo?.replace(/_/g, ' ').toUpperCase()}): {formatearMonto(parsearInputMiles(inputSena), obtenerMonedaMetodo(datosCliente.sena_metodo))}
                              {datosCliente.sena_caja && (
                                <span className="text-slate-500 text-xs ml-1">({datosCliente.sena_caja})</span>
                              )}
                            </p>
                          )}
                          {datosCliente.vuelto_monto > 0 && (
                            <p className="text-sm text-slate-600 font-medium">
                              - VUELTO ({datosCliente.vuelto_metodo?.replace(/_/g, ' ').toUpperCase()}): {formatearMonto(parsearInputMiles(inputVuelto), obtenerMonedaMetodo(datosCliente.vuelto_metodo))}
                              {datosCliente.vuelto_caja && (
                                <span className="text-slate-500 text-xs ml-1">({datosCliente.vuelto_caja})</span>
                              )}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Aviso de cuenta corriente */}
                      {(datosCliente.metodo_pago_1 === 'cuenta_corriente' || datosCliente.metodo_pago_2 === 'cuenta_corriente' || datosCliente.metodo_pago_3 === 'cuenta_corriente') && (
                        <div className="p-2 bg-slate-800 text-white rounded-lg text-xs">
                          💡 Parte de esta venta se registrará como deuda en la cuenta corriente del cliente
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Checkbox para envío de email */}
                  <div className="px-4 mb-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enviarEmail}
                        onChange={(e) => setEnviarEmail(e.target.checked)}
                        className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <div className="flex items-center space-x-2">
                        <Mail className="w-5 h-5 text-slate-800" />
                        <span className="text-sm text-slate-800">
                          Enviar email al cliente (puede aparecer como spam)
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Botones */}
                  <div className="bg-slate-50 p-4 flex justify-end gap-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setMostrarFormulario(false);
                        setAperturaManual(false);
                      }}
                      className="px-6 py-2 rounded bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!clienteSeleccionado || !datosCliente.vendedor}
                      className={`px-6 py-2 rounded font-semibold transition-colors flex items-center justify-center space-x-2 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:text-slate-500 ${(datosCliente.metodo_pago_1 === 'cuenta_corriente' || datosCliente.metodo_pago_2 === 'cuenta_corriente')
                        ? 'bg-slate-800 text-white hover:bg-slate-700'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                    >
                      {(datosCliente.metodo_pago_1 === 'cuenta_corriente' || datosCliente.metodo_pago_2 === 'cuenta_corriente') ? (
                        <>
                          <CreditCard className="w-5 h-5" />
                          <span>Procesar</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5" />
                          <span>Procesar</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CarritoWidget;