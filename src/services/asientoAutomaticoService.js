import { supabase } from '../lib/supabase';
import { conversionService } from './conversionService';

class AsientoAutomaticoService {
  constructor() {
    // Configuración de cuentas contables basada en tu plan existente
    this.cuentasDefault = {
      // Activos - Cajas y Bancos
      caja_pesos: { codigo: '1.01.001', nombre: 'CAJA FISICA PESOS' },
      caja_usd: { codigo: '1.01.002', nombre: 'CAJA FISICA USD' },
      banco_pesos: { codigo: '1.02.001', nombre: 'BANCO ALVARO PESOS' },
      banco_usd: { codigo: '1.02.001', nombre: 'BANCO ALVARO PESOS' }, // Fallback
      
      // Ingresos
      ventas_notebooks: { codigo: '4.01.001', nombre: 'VENTAS NOTEBOOKS' },
      ventas_celulares: { codigo: '4.04.001', nombre: 'VENTAS CELULARES' },
      servicios_reparacion: { codigo: '4.02.001', nombre: 'SERVICIOS REPARACION' },
      
      // Gastos específicos por categoría (usando tus cuentas existentes)
      gastos_proveedores: { codigo: '5.01.001', nombre: 'CMV PESOS' }, // Para compras a proveedores
      gastos_servicios: { codigo: '5.02.002', nombre: 'SERVICIOS PUBLICOS' },
      gastos_alquiler: { codigo: '5.02.001', nombre: 'ALQUILERES' },
      gastos_sueldos: { codigo: '5.02.003', nombre: 'SUELDOS Y JORNALES' },
      gastos_cargas_sociales: { codigo: '5.02.004', nombre: 'CARGAS SOCIALES' },
      gastos_transporte: { codigo: '5.02.006', nombre: 'GASTOS DE VEHICULO' },
      gastos_bancarios: { codigo: '5.02.007', nombre: 'GASTOS BANCARIOS' },
      gastos_administrativos: { codigo: '5.02.005', nombre: 'GASTOS DE OFICINA' },
      gastos_otros: { codigo: '5.02.005', nombre: 'GASTOS DE OFICINA' } // Fallback
    };

    // Mapeo de categorías a cuentas contables existentes
    this.categoriasACuentas = {
      'proveedor': 'gastos_proveedores',      // → CMV PESOS (5.01.001)
      'servicios': 'gastos_servicios',        // → SERVICIOS PUBLICOS (5.02.002)
      'alquiler': 'gastos_alquiler',          // → ALQUILERES (5.02.001)
      'sueldos': 'gastos_sueldos',            // → SUELDOS Y JORNALES (5.02.003)
      'impuestos': 'gastos_administrativos',  // → GASTOS DE OFICINA (5.02.005)
      'transporte': 'gastos_transporte',      // → GASTOS DE VEHICULO (5.02.006)
      'marketing': 'gastos_administrativos',  // → GASTOS DE OFICINA (5.02.005)
      'mantenimiento': 'gastos_administrativos', // → GASTOS DE OFICINA (5.02.005)
      'administrativos': 'gastos_administrativos', // → GASTOS DE OFICINA (5.02.005)
      'otros': 'gastos_otros'                // → GASTOS DE OFICINA (5.02.005)
    };
  }

  /**
   * Obtiene el siguiente número de asiento
   */
  async obtenerSiguienteNumeroAsiento() {
    try {
      const { data, error } = await supabase
        .from('asientos_contables')
        .select('numero')
        .order('numero', { ascending: false })
        .limit(1);

      if (error) throw error;

      const ultimoNumero = data && data.length > 0 ? data[0].numero : 0;
      return ultimoNumero + 1;
    } catch (error) {
      console.error('❌ Error obteniendo siguiente número de asiento:', error);
      return 1;
    }
  }

  /**
   * Obtiene todas las cuentas disponibles
   */
  async obtenerCuentasDisponibles() {
    try {
      const { data, error } = await supabase
        .from('plan_cuentas')
        .select('*')
        .eq('activa', true)
        .order('codigo');

      if (error) throw error;
      
      console.log(`📋 ${data.length} cuentas disponibles:`, data.map(c => `${c.codigo} - ${c.nombre}`));
      return data || [];
    } catch (error) {
      console.error('❌ Error obteniendo cuentas disponibles:', error);
      return [];
    }
  }

  /**
   * Busca una cuenta por código o nombre
   */
  async buscarCuenta(criterio) {
    try {
      console.log('🔍 Buscando cuenta con criterio:', criterio);
      
      const { data, error } = await supabase
        .from('plan_cuentas')
        .select('*')
        .or(`codigo.eq.${criterio},nombre.ilike.%${criterio}%`)
        .eq('activa', true)
        .order('codigo')
        .limit(1);

      if (error) throw error;
      
      const cuenta = data && data.length > 0 ? data[0] : null;
      console.log('🔍 Cuenta encontrada:', cuenta);
      return cuenta;
    } catch (error) {
      console.error('❌ Error buscando cuenta:', error);
      return null;
    }
  }

  async buscarCuentaFlexible(criterios) {
    for (const criterio of criterios) {
      const cuenta = await this.buscarCuenta(criterio);
      if (cuenta) {
        console.log(`✅ Cuenta encontrada con criterio "${criterio}":`, cuenta);
        return cuenta;
      }
    }
    console.log('❌ No se encontró cuenta con ningún criterio:', criterios);
    return null;
  }

  /**
   * Busca cuenta específica según la categoría del gasto
   */
  async buscarCuentaPorCategoria(categoria, cuentasDisponibles) {
    console.log('🔍 Buscando cuenta para categoría:', categoria);

    // Obtener la clave de cuenta según la categoría
    const claveCuenta = this.categoriasACuentas[categoria];
    if (!claveCuenta) {
      console.log('⚠️ Categoría no mapeada:', categoria);
      return null;
    }

    const cuentaEsperada = this.cuentasDefault[claveCuenta];
    console.log('🎯 Buscando cuenta:', cuentaEsperada);

    // Buscar por código exacto primero
    let cuenta = cuentasDisponibles.find(c => c.codigo === cuentaEsperada.codigo);
    if (cuenta) {
      console.log('✅ Cuenta encontrada por código:', cuenta);
      return cuenta;
    }

    // Buscar por nombre exacto
    cuenta = cuentasDisponibles.find(c => 
      c.nombre.toLowerCase() === cuentaEsperada.nombre.toLowerCase()
    );
    if (cuenta) {
      console.log('✅ Cuenta encontrada por nombre exacto:', cuenta);
      return cuenta;
    }

    // Buscar por palabras clave en el nombre
    const palabrasClave = this.obtenerPalabrasClavePorCategoria(categoria);
    for (const palabra of palabrasClave) {
      cuenta = cuentasDisponibles.find(c => 
        c.nombre.toLowerCase().includes(palabra.toLowerCase())
      );
      if (cuenta) {
        console.log(`✅ Cuenta encontrada por palabra clave "${palabra}":`, cuenta);
        return cuenta;
      }
    }

    console.log('❌ No se encontró cuenta específica para categoría:', categoria);
    return null;
  }

  /**
   * Obtiene palabras clave para buscar cuentas por categoría
   */
  obtenerPalabrasClavePorCategoria(categoria) {
    const palabrasClave = {
      'proveedor': ['cmv', 'compra', 'proveedor', 'mercadería', 'costo'],
      'servicios': ['servicio', 'publico', 'luz', 'agua', 'gas', 'internet', 'telefono'],
      'alquiler': ['alquiler', 'expensa', 'locación', 'arrendamiento'],
      'sueldos': ['sueldo', 'salario', 'jornal', 'personal', 'empleado'],
      'impuestos': ['impuesto', 'tasa', 'contribución', 'municipal', 'provincial', 'fiscal'],
      'transporte': ['transporte', 'combustible', 'vehículo', 'viaje', 'flete', 'vehiculo'],
      'marketing': ['publicidad', 'marketing', 'promoción', 'propaganda'],
      'mantenimiento': ['mantenimiento', 'reparación', 'servicio técnico', 'reparacion'],
      'administrativos': ['administrativo', 'oficina', 'papelería', 'teléfono', 'bancario'],
      'otros': ['otros', 'varios', 'diverso', 'oficina']
    };

    return palabrasClave[categoria] || ['gasto', 'operativo', 'oficina'];
  }

  /**
   * Crea un asiento contable automático para una venta
   */
  async crearAsientoVenta(ventaData) {
    console.log('💰 Creando asiento automático para venta:', ventaData);

    try {
      const numeroAsiento = await this.obtenerSiguienteNumeroAsiento();
      const fechaAsiento = ventaData.fecha || new Date().toISOString().split('T')[0];

      // Determinar cuentas según método de pago
      let cuentaDebe, cuentaHaber;
      
      // Cuenta de ingreso (siempre es Ventas)
      cuentaHaber = await this.buscarCuenta(this.cuentasDefault.ventas.codigo) ||
                   await this.buscarCuenta(this.cuentasDefault.ventas.nombre);

      // Cuenta de activo (según método de pago)
      if (ventaData.metodo_pago === 'efectivo') {
        cuentaDebe = await this.buscarCuenta(this.cuentasDefault.caja.codigo) ||
                    await this.buscarCuenta(this.cuentasDefault.caja.nombre);
      } else if (ventaData.metodo_pago === 'credito') {
        cuentaDebe = await this.buscarCuenta(this.cuentasDefault.clientes.codigo) ||
                    await this.buscarCuenta(this.cuentasDefault.clientes.nombre);
      } else {
        cuentaDebe = await this.buscarCuenta(this.cuentasDefault.banco.codigo) ||
                    await this.buscarCuenta(this.cuentasDefault.banco.nombre);
      }

      if (!cuentaDebe || !cuentaHaber) {
        throw new Error('No se encontraron las cuentas contables necesarias');
      }

      // Crear el asiento principal
      const asientoData = {
        numero: numeroAsiento,
        fecha: fechaAsiento,
        descripcion: `Venta ${ventaData.metodo_pago} - ${ventaData.descripcion || 'Venta de equipos'}`,
        estado: 'borrador',
        es_automatico: true,
        origen_operacion: 'venta',
        operacion_id: ventaData.id,
        usuario: ventaData.usuario || 'Sistema'
      };

      // Preparar movimientos
      const movimientos = [];

      // Movimiento DEBE (entrada de dinero/crédito)
      const movimientoDebe = conversionService.prepararMovimiento(
        {
          monto: ventaData.total,
          cotizacion: ventaData.cotizacion_manual,
          tipo: 'debe'
        },
        cuentaDebe
      );

      // Movimiento HABER (reconocimiento de ingreso)
      const movimientoHaber = conversionService.prepararMovimiento(
        {
          monto: ventaData.total,
          cotizacion: ventaData.cotizacion_manual,
          tipo: 'haber'
        },
        cuentaHaber
      );

      movimientos.push(movimientoDebe, movimientoHaber);

      // Validar balance
      const validacion = conversionService.validarBalanceUSD(movimientos);
      
      // Calcular totales en USD para el asiento
      asientoData.total_debe = validacion.totalDebe;
      asientoData.total_haber = validacion.totalHaber;

      // Cotización promedio
      if (ventaData.cotizacion_manual) {
        asientoData.cotizacion_promedio = ventaData.cotizacion_manual;
      }

      // Crear el asiento en la base de datos
      const { data: asientoCreado, error: errorAsiento } = await supabase
        .from('asientos_contables')
        .insert([asientoData])
        .select()
        .single();

      if (errorAsiento) throw errorAsiento;

      // Agregar asiento_id a los movimientos
      const movimientosConAsiento = movimientos.map(mov => ({
        ...mov,
        asiento_id: asientoCreado.id
      }));

      // Crear los movimientos
      const { error: errorMovimientos } = await supabase
        .from('movimientos_contables')
        .insert(movimientosConAsiento);

      if (errorMovimientos) throw errorMovimientos;

      console.log('✅ Asiento de venta creado exitosamente:', {
        numero: numeroAsiento,
        id: asientoCreado.id,
        total_usd: validacion.totalDebe
      });

      return {
        asiento: asientoCreado,
        movimientos: movimientosConAsiento,
        validacion
      };

    } catch (error) {
      console.error('❌ Error creando asiento de venta:', error);
      throw error;
    }
  }

  /**
   * Crea un asiento contable automático para una compra
   */
  async crearAsientoCompra(compraData) {
    console.log('🛒 Creando asiento automático para compra:', compraData);

    try {
      const numeroAsiento = await this.obtenerSiguienteNumeroAsiento();
      const fechaAsiento = compraData.fecha || new Date().toISOString().split('T')[0];

      // Determinar cuentas
      const cuentaMercaderias = await this.buscarCuenta(this.cuentasDefault.mercaderias.codigo) ||
                               await this.buscarCuenta(this.cuentasDefault.mercaderias.nombre);

      let cuentaCredito;
      if (compraData.metodo_pago === 'efectivo') {
        cuentaCredito = await this.buscarCuenta(this.cuentasDefault.caja.codigo) ||
                       await this.buscarCuenta(this.cuentasDefault.caja.nombre);
      } else if (compraData.metodo_pago === 'credito') {
        cuentaCredito = await this.buscarCuenta(this.cuentasDefault.proveedores.codigo) ||
                       await this.buscarCuenta(this.cuentasDefault.proveedores.nombre);
      } else {
        cuentaCredito = await this.buscarCuenta(this.cuentasDefault.banco.codigo) ||
                       await this.buscarCuenta(this.cuentasDefault.banco.nombre);
      }

      if (!cuentaMercaderias || !cuentaCredito) {
        throw new Error('No se encontraron las cuentas contables necesarias');
      }

      // Crear el asiento principal
      const asientoData = {
        numero: numeroAsiento,
        fecha: fechaAsiento,
        descripcion: `Compra ${compraData.metodo_pago} - ${compraData.descripcion || 'Compra de mercaderías'}`,
        estado: 'borrador',
        es_automatico: true,
        origen_operacion: 'compra',
        operacion_id: compraData.id,
        usuario: compraData.usuario || 'Sistema'
      };

      // Preparar movimientos
      const movimientos = [];

      // DEBE: Aumento de mercaderías
      const movimientoDebe = conversionService.prepararMovimiento(
        {
          monto: compraData.total,
          cotizacion: compraData.cotizacion_manual,
          tipo: 'debe'
        },
        cuentaMercaderias
      );

      // HABER: Disminución de efectivo o aumento de deuda
      const movimientoHaber = conversionService.prepararMovimiento(
        {
          monto: compraData.total,
          cotizacion: compraData.cotizacion_manual,
          tipo: 'haber'
        },
        cuentaCredito
      );

      movimientos.push(movimientoDebe, movimientoHaber);

      // Validar y completar asiento
      const validacion = conversionService.validarBalanceUSD(movimientos);
      asientoData.total_debe = validacion.totalDebe;
      asientoData.total_haber = validacion.totalHaber;

      // Cotización promedio
      if (compraData.cotizacion_manual) {
        asientoData.cotizacion_promedio = compraData.cotizacion_manual;
      }

      // Guardar en base de datos
      const { data: asientoCreado, error: errorAsiento } = await supabase
        .from('asientos_contables')
        .insert([asientoData])
        .select()
        .single();

      if (errorAsiento) throw errorAsiento;

      const movimientosConAsiento = movimientos.map(mov => ({
        ...mov,
        asiento_id: asientoCreado.id
      }));

      const { error: errorMovimientos } = await supabase
        .from('movimientos_contables')
        .insert(movimientosConAsiento);

      if (errorMovimientos) throw errorMovimientos;

      console.log('✅ Asiento de compra creado exitosamente:', {
        numero: numeroAsiento,
        id: asientoCreado.id,
        total_usd: validacion.totalDebe
      });

      return {
        asiento: asientoCreado,
        movimientos: movimientosConAsiento,
        validacion
      };

    } catch (error) {
      console.error('❌ Error creando asiento de compra:', error);
      throw error;
    }
  }

  /**
   * Crea un asiento contable automático para un gasto operativo
   */
  async crearAsientoGasto(gastoData) {
    console.log('💸 Creando asiento automático para gasto:', gastoData);
    console.log('💸 Datos detallados:', {
      id: gastoData.id,
      monto: gastoData.monto,
      moneda: gastoData.moneda,
      cotizacion: gastoData.cotizacion_manual,
      cuenta_pago_id: gastoData.cuenta_pago_id
    });

    try {
      const numeroAsiento = await this.obtenerSiguienteNumeroAsiento();
      const fechaAsiento = gastoData.fecha || new Date().toISOString().split('T')[0];

      // Obtener todas las cuentas disponibles
      const cuentasDisponibles = await this.obtenerCuentasDisponibles();
      
      if (cuentasDisponibles.length === 0) {
        throw new Error('No hay cuentas disponibles en el plan de cuentas');
      }

      // Buscar cuenta de gasto según categoría
      let cuentaGasto = await this.buscarCuentaPorCategoria(gastoData.categoria, cuentasDisponibles);

      // Si no encuentra cuenta específica, buscar cuenta genérica de gastos
      if (!cuentaGasto) {
        cuentaGasto = cuentasDisponibles.find(cuenta => 
          cuenta.nombre.toLowerCase().includes('gasto') ||
          cuenta.nombre.toLowerCase().includes('operativo') ||
          cuenta.nombre.toLowerCase().includes('administrativo') ||
          (cuenta.tipo_cuenta && cuenta.tipo_cuenta.toLowerCase().includes('gasto'))
        );
      }

      // Si aún no encuentra, usar la primera cuenta disponible
      if (!cuentaGasto) {
        cuentaGasto = cuentasDisponibles[0];
        console.log('⚠️ No se encontró cuenta de gasto específica, usando:', cuentaGasto.nombre);
      }

      // Obtener cuenta de pago desde cuenta_pago_id
      let cuentaCredito = null;
      if (gastoData.cuenta_pago_id) {
        cuentaCredito = cuentasDisponibles.find(cuenta => cuenta.id === gastoData.cuenta_pago_id);
      }

      if (!cuentaCredito) {
        // Buscar cuenta de pago según tipo
        if (gastoData.metodo_pago === 'efectivo') {
          cuentaCredito = cuentasDisponibles.find(cuenta => 
            cuenta.nombre.toLowerCase().includes('caja') ||
            cuenta.nombre.toLowerCase().includes('efectivo') ||
            cuenta.codigo.includes('1.1.01')
          );
        } else {
          cuentaCredito = cuentasDisponibles.find(cuenta => 
            cuenta.nombre.toLowerCase().includes('banco') ||
            cuenta.nombre.toLowerCase().includes('cuenta') ||
            cuenta.codigo.includes('1.1.02')
          );
        }
        
        // Si no encuentra cuenta específica, usar cualquier cuenta de activo o la segunda disponible
        if (!cuentaCredito) {
          cuentaCredito = cuentasDisponibles.find(cuenta => 
            cuenta.tipo_cuenta && cuenta.tipo_cuenta.toLowerCase().includes('activo')
          ) || cuentasDisponibles[1] || cuentasDisponibles[0];
          
          console.log('⚠️ No se encontró cuenta de pago específica, usando:', cuentaCredito.nombre);
        }
      }

      if (!cuentaGasto || !cuentaCredito) {
        console.error('❌ Error encontrando cuentas:', {
          cuentaGasto,
          cuentaCredito,
          cuenta_pago_id: gastoData.cuenta_pago_id,
          categoria: gastoData.categoria
        });
        throw new Error('No se encontraron las cuentas contables necesarias');
      }

      console.log('✅ Cuentas encontradas:', {
        gasto: { id: cuentaGasto.id, codigo: cuentaGasto.codigo, nombre: cuentaGasto.nombre },
        credito: { id: cuentaCredito.id, codigo: cuentaCredito.codigo, nombre: cuentaCredito.nombre }
      });

      const asientoData = {
        numero: numeroAsiento,
        fecha: fechaAsiento,
        descripcion: `Gasto ${gastoData.categoria || 'operativo'} - ${gastoData.descripcion}`,
        estado: 'borrador',
        es_automatico: true,
        origen_operacion: 'gasto',
        operacion_id: gastoData.id,
        usuario: gastoData.usuario || 'Sistema'
      };

      const movimientos = [];

      // DEBE: Reconocimiento del gasto
      const movimientoDebe = conversionService.prepararMovimiento(
        {
          monto: gastoData.monto,
          cotizacion: gastoData.moneda === 'ARS' ? gastoData.cotizacion_manual : null,
          tipo: 'debe'
        },
        { ...cuentaGasto, requiere_cotizacion: gastoData.moneda === 'ARS' }
      );

      // HABER: Salida de efectivo 
      const movimientoHaber = conversionService.prepararMovimiento(
        {
          monto: gastoData.monto,
          cotizacion: gastoData.moneda === 'ARS' ? gastoData.cotizacion_manual : null,
          tipo: 'haber'
        },
        { ...cuentaCredito, requiere_cotizacion: gastoData.moneda === 'ARS' }
      );

      movimientos.push(movimientoDebe, movimientoHaber);

      // Validar y completar
      const validacion = conversionService.validarBalanceUSD(movimientos);
      asientoData.total_debe = validacion.totalDebe;
      asientoData.total_haber = validacion.totalHaber;

      // Cotización promedio
      if (gastoData.cotizacion_manual) {
        asientoData.cotizacion_promedio = gastoData.cotizacion_manual;
      }

      // Guardar
      const { data: asientoCreado, error: errorAsiento } = await supabase
        .from('asientos_contables')
        .insert([asientoData])
        .select()
        .single();

      if (errorAsiento) throw errorAsiento;

      const movimientosConAsiento = movimientos.map(mov => ({
        ...mov,
        asiento_id: asientoCreado.id
      }));

      const { error: errorMovimientos } = await supabase
        .from('movimientos_contables')
        .insert(movimientosConAsiento);

      if (errorMovimientos) throw errorMovimientos;

      console.log('✅ Asiento de gasto creado exitosamente:', {
        numero: numeroAsiento,
        id: asientoCreado.id,
        total_usd: validacion.totalDebe
      });

      return {
        asiento: asientoCreado,
        movimientos: movimientosConAsiento,
        validacion
      };

    } catch (error) {
      console.error('❌ Error creando asiento de gasto:', error);
      throw error;
    }
  }

  /**
   * Aprueba un asiento pendiente
   */
  async aprobarAsiento(asientoId, usuarioAprobador, observaciones = null) {
    console.log('✅ Aprobando asiento:', asientoId);

    try {
      // Obtener movimientos del asiento para validar
      const { data: movimientos, error: errorMovimientos } = await supabase
        .from('movimientos_contables')
        .select('*')
        .eq('asiento_id', asientoId);

      if (errorMovimientos) throw errorMovimientos;

      // Validar balance antes de aprobar
      if (movimientos && movimientos.length > 0) {
        const validacion = conversionService.validarBalanceUSD(movimientos);
        
        if (!validacion.balanceado) {
          throw new Error(
            `No se puede aprobar asiento desbalanceado. ` +
            `Diferencia: $${validacion.diferencia} USD`
          );
        }
      }

      const { data, error } = await supabase
        .from('asientos_contables')
        .update({
          estado: 'registrado',
          usuario: usuarioAprobador,
          updated_at: new Date().toISOString()
        })
        .eq('id', asientoId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Asiento aprobado exitosamente');
      return data;

    } catch (error) {
      console.error('❌ Error aprobando asiento:', error);
      throw error;
    }
  }

  /**
   * Rechaza un asiento pendiente
   */
  async rechazarAsiento(asientoId, usuarioAprobador, motivo) {
    console.log('❌ Rechazando asiento:', asientoId);

    try {
      const { data, error } = await supabase
        .from('asientos_contables')
        .update({
          estado: 'anulado',
          usuario: usuarioAprobador,
          updated_at: new Date().toISOString(),
          descripcion: `ANULADO: ${motivo}`
        })
        .eq('id', asientoId)
        .select()
        .single();

      if (error) throw error;

      console.log('❌ Asiento rechazado exitosamente');
      return data;

    } catch (error) {
      console.error('❌ Error rechazando asiento:', error);
      throw error;
    }
  }

  /**
   * Obtiene asientos pendientes de revisión
   */
  async obtenerAsientosPendientes(limite = 50) {
    try {
      const { data, error } = await supabase
        .from('asientos_pendientes_revision')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limite);

      if (error) {
        // Si la vista no existe, hacer consulta directa
        const { data: dataDirect, error: errorDirect } = await supabase
          .from('asientos_contables')
          .select(`
            *,
            movimientos_contables (
              id, debe, haber, cuenta_id,
              plan_cuentas (codigo, nombre)
            )
          `)
          .eq('estado', 'borrador')
          .order('created_at', { ascending: false })
          .limit(limite);

        if (errorDirect) throw errorDirect;
        return dataDirect || [];
      }

      return data || [];

    } catch (error) {
      console.error('❌ Error obteniendo asientos pendientes:', error);
      return [];
    }
  }

  /**
   * Configurar cuentas por defecto del sistema
   */
  async configurarCuentasDefault(configuracion) {
    this.cuentasDefault = { ...this.cuentasDefault, ...configuracion };
    console.log('⚙️ Configuración de cuentas actualizada:', this.cuentasDefault);
  }
}

export const asientoAutomaticoService = new AsientoAutomaticoService();
export default asientoAutomaticoService;