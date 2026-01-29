// CargaMasivaCompras.jsx - Modal simplificado para carga masiva dentro de compras
import React, { useState, useEffect } from 'react';
import { X, Smartphone, Monitor, Package, ChevronRight, ChevronLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import FormularioDatosComunes from '../../administracion/components/FormularioDatosComunes';
import ListaSerialesEquipos from '../../administracion/components/ListaSerialesEquipos';
import { validarDatosComunes, validarFormatoSerial, validarUnicidadLocal } from '../../administracion/utils/validacionesMasivas';

const CargaMasivaCompras = ({
  isOpen,
  onClose,
  onConfirmar,           // callback que retorna array de items
  itemsYaAgregados = [], // para validar límite y seriales duplicados
  tipoDefault = null
}) => {
  // Estados del wizard
  const [paso, setPaso] = useState(1);
  const [tipoEquipo, setTipoEquipo] = useState(tipoDefault);
  const [datosComunes, setDatosComunes] = useState({});
  const [seriales, setSeriales] = useState([{ id: uuidv4(), serial: '', valido: false }]);
  const [errores, setErrores] = useState({});
  const [validando, setValidando] = useState(false);

  // Reset al abrir/cerrar modal
  useEffect(() => {
    if (isOpen) {
      setPaso(1);
      setTipoEquipo(tipoDefault);
      setDatosComunes({});
      setSeriales([{ id: uuidv4(), serial: '', valido: false }]);
      setErrores({});
    }
  }, [isOpen, tipoDefault]);

  // ==================== FUNCIONES AUXILIARES ====================

  // Generar descripción del producto
  const generarDescripcion = (tipo, datos) => {
    switch (tipo) {
      case 'notebook':
        return `${datos.marca || ''} ${datos.modelo || ''} - ${datos.procesador || ''} - ${datos.ram || ''} RAM - ${datos.ssd || ''} SSD`.trim();
      case 'celular':
        return `${datos.marca || ''} ${datos.modelo || ''} - ${datos.capacidad || ''}GB - ${datos.color || ''}`.trim();
      case 'otro':
        return `${datos.nombre_producto || ''} ${datos.descripcion ? '- ' + datos.descripcion : ''}`.trim();
      default:
        return 'Producto sin descripción';
    }
  };

  // Calcular precio unitario según tipo
  const calcularPrecioUnitario = (tipo, datosBase, serialOverride = {}) => {
    if (tipo === 'notebook') {
      const precioBase = parseFloat(serialOverride.precio_costo_usd || datosBase.precio_costo_usd || 0);
      const envios = parseFloat(serialOverride.envios_repuestos || datosBase.envios_repuestos || 0);
      return precioBase + envios;
    } else {
      // celular u otro
      return parseFloat(serialOverride.precio_compra_usd || datosBase.precio_compra_usd || 0);
    }
  };

  // Validar serial (formato + local + contra items ya agregados)
  const validarSerial = (serial, serialesLocales) => {
    // 1. Validar formato
    const formatoResult = validarFormatoSerial(serial);
    if (!formatoResult.valido) return formatoResult;

    // 2. Validar unicidad local (en este lote)
    if (!validarUnicidadLocal(serial, serialesLocales)) {
      return { valido: false, error: 'Serial repetido en esta lista' };
    }

    // 3. Validar contra items ya agregados en la compra
    const yaExiste = itemsYaAgregados.some(item =>
      item.datos_completos?.serial?.toUpperCase() === serial.toUpperCase()
    );
    if (yaExiste) {
      return { valido: false, error: 'Serial ya agregado en esta compra' };
    }

    return { valido: true, error: null };
  };

  // ==================== MANEJADORES DE EVENTOS ====================

  // Cambio de tipo de equipo
  const handleTipoChange = (tipo) => {
    setTipoEquipo(tipo);
  };

  // Cambio de datos comunes
  const handleDatosChange = (nuevosDatos) => {
    setDatosComunes(nuevosDatos);
  };

  // Cambio de serial
  const handleSerialChange = (id, nuevoSerial) => {
    const nuevosSeriales = seriales.map(s => {
      if (s.id === id) {
        // Validar el serial
        const resultado = validarSerial(nuevoSerial, seriales);
        return {
          ...s,
          serial: nuevoSerial,
          valido: resultado.valido,
          error: resultado.error
        };
      }
      return s;
    });

    setSeriales(nuevosSeriales);
  };

  // Cambio de item individual (precios, color, etc.)
  const handleItemChange = (id, campo, valor) => {
    const nuevosSeriales = seriales.map(s =>
      s.id === id ? { ...s, [campo]: valor } : s
    );
    setSeriales(nuevosSeriales);
  };

  // Agregar fila de serial
  const handleAgregarFila = () => {
    if (seriales.length >= 50) {
      alert('Máximo 50 productos por lote');
      return;
    }
    setSeriales([...seriales, { id: uuidv4(), serial: '', valido: false }]);
  };

  // Eliminar fila de serial
  const handleEliminarFila = (id) => {
    if (seriales.length === 1) {
      alert('Debe haber al menos una fila');
      return;
    }
    setSeriales(seriales.filter(s => s.id !== id));
  };

  // ==================== NAVEGACIÓN DEL WIZARD ====================

  // Avanzar al siguiente paso
  const handleSiguiente = () => {
    if (paso === 1) {
      // Validar que se haya seleccionado un tipo
      if (!tipoEquipo) {
        alert('Selecciona un tipo de equipo');
        return;
      }
      setPaso(2);
    } else if (paso === 2) {
      // Validar datos comunes
      const resultado = validarDatosComunes(datosComunes, tipoEquipo);
      if (!resultado.valido) {
        setErrores(resultado.errores);
        alert('Por favor, completa todos los campos requeridos correctamente');
        return;
      }
      setErrores({});
      setPaso(3);
    }
  };

  // Retroceder al paso anterior
  const handleAtras = () => {
    if (paso > 1) {
      setPaso(paso - 1);
    }
  };

  // Confirmar y agregar lote
  const handleConfirmar = () => {
    // Validar que haya al menos un serial válido
    const serialesValidos = seriales.filter(s => s.valido && s.serial.trim() !== '' && !s.error);

    if (serialesValidos.length === 0) {
      alert('Debes ingresar al menos un serial válido');
      return;
    }

    // Validar límite total
    const totalFinal = itemsYaAgregados.length + serialesValidos.length;
    if (totalFinal > 50) {
      const permitidos = 50 - itemsYaAgregados.length;
      alert(`Solo puedes agregar ${permitidos} items más (límite: 50 items por compra)`);
      return;
    }

    // Generar lote_id único para este lote
    const loteId = uuidv4();

    // Convertir seriales válidos a estructura de items de compra
    const itemsNuevos = serialesValidos.map(s => {
      // Merge datos comunes con overrides individuales del serial
      const datosCompletos = {
        ...datosComunes,
        serial: s.serial,
        // Precios individuales si existen
        precio_compra_usd: s.precio_compra_usd !== undefined ? s.precio_compra_usd : datosComunes.precio_compra_usd,
        precio_costo_usd: s.precio_costo_usd !== undefined ? s.precio_costo_usd : datosComunes.precio_costo_usd,
        costos_adicionales: s.costos_adicionales !== undefined ? s.costos_adicionales : datosComunes.costos_adicionales,
        envios_repuestos: s.envios_repuestos !== undefined ? s.envios_repuestos : datosComunes.envios_repuestos,
        precio_venta_usd: s.precio_venta_usd !== undefined ? s.precio_venta_usd : datosComunes.precio_venta_usd,
        color: s.color || datosComunes.color
      };

      const precioUnitario = calcularPrecioUnitario(tipoEquipo, datosComunes, s);

      return {
        id: Date.now() + Math.random(), // ID único temporal
        tipo_producto: tipoEquipo,
        datos_completos: datosCompletos,
        cantidad: 1,
        precio_unitario: precioUnitario,
        precio_total: precioUnitario * 1,
        descripcion: generarDescripcion(tipoEquipo, datosCompletos),
        origen: 'masivo',
        lote_id: loteId
      };
    });

    // Llamar callback con items nuevos
    onConfirmar(itemsNuevos);
    onClose();
  };

  // ==================== RENDERIZADO ====================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded border border-slate-200 max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        {/* HEADER */}
        <div className="p-6 bg-slate-800 text-white flex justify-between items-center sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-semibold">Carga Masiva de Productos</h3>
            <p className="text-slate-300 text-sm mt-1">
              Paso {paso} de 3
              {paso === 1 && ' - Selección de Tipo'}
              {paso === 2 && ' - Datos Comunes'}
              {paso === 3 && ' - Ingreso de Seriales'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* PASO 1: SELECCIÓN DE TIPO */}
          {paso === 1 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-slate-800 mb-4">
                  Selecciona el tipo de producto
                </h4>
                <p className="text-sm text-slate-600 mb-6">
                  Todos los productos del lote compartirán las mismas especificaciones base
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Celulares */}
                <button
                  onClick={() => handleTipoChange('celular')}
                  className={`p-8 rounded border-2 transition-all text-center ${tipoEquipo === 'celular'
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300'
                    }`}
                >
                  <Smartphone size={48} className="mx-auto mb-4 text-slate-700" />
                  <h5 className="text-lg font-semibold text-slate-800 mb-2">Celulares</h5>
                  <p className="text-sm text-slate-600">
                    Smartphones, iPhones y dispositivos móviles
                  </p>
                </button>

                {/* Notebooks */}
                <button
                  onClick={() => handleTipoChange('notebook')}
                  className={`p-8 rounded border-2 transition-all text-center ${tipoEquipo === 'notebook'
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300'
                    }`}
                >
                  <Monitor size={48} className="mx-auto mb-4 text-slate-700" />
                  <h5 className="text-lg font-semibold text-slate-800 mb-2">Notebooks</h5>
                  <p className="text-sm text-slate-600">
                    Laptops, MacBooks y computadoras portátiles
                  </p>
                </button>

                {/* Otros */}
                <button
                  onClick={() => handleTipoChange('otro')}
                  className={`p-8 rounded border-2 transition-all text-center ${tipoEquipo === 'otro'
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300'
                    }`}
                >
                  <Package size={48} className="mx-auto mb-4 text-slate-700" />
                  <h5 className="text-lg font-semibold text-slate-800 mb-2">Otros Productos</h5>
                  <p className="text-sm text-slate-600">
                    Accesorios, cables, componentes y más
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* PASO 2: DATOS COMUNES */}
          {paso === 2 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-slate-800 mb-2">
                  Datos Comunes del Lote
                </h4>
                <p className="text-sm text-slate-600">
                  Completa las especificaciones que compartirán todos los productos de este lote
                </p>
              </div>

              <FormularioDatosComunes
                tipoEquipo={tipoEquipo}
                datos={datosComunes}
                onChange={handleDatosChange}
                errores={errores}
              />
            </div>
          )}

          {/* PASO 3: SERIALES */}
          {paso === 3 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-slate-800 mb-2">
                  Ingreso de Seriales
                </h4>
                <p className="text-sm text-slate-600">
                  Ingresa los números de serie de cada producto. Puedes personalizar precios y color por unidad.
                </p>
              </div>

              {/* Resumen de datos comunes */}
              <div className="bg-slate-50 border border-slate-200 rounded p-4">
                <h5 className="text-sm font-semibold text-slate-700 mb-2">Resumen del Lote</h5>
                <p className="text-sm text-slate-600">
                  <strong>Producto:</strong> {generarDescripcion(tipoEquipo, datosComunes)}
                </p>
                <p className="text-sm text-slate-600">
                  <strong>Precio base:</strong> ${calcularPrecioUnitario(tipoEquipo, datosComunes).toFixed(2)} USD por unidad
                </p>
              </div>

              <ListaSerialesEquipos
                seriales={seriales}
                onSerialChange={handleSerialChange}
                onItemChange={handleItemChange}
                onAgregarFila={handleAgregarFila}
                onEliminarFila={handleEliminarFila}
                validando={validando}
                datosComunes={datosComunes}
                tipoEquipo={tipoEquipo}
              />
            </div>
          )}
        </div>

        {/* FOOTER CON BOTONES */}
        <div className="bg-slate-50 p-6 flex justify-between items-center border-t border-slate-200 sticky bottom-0">
          <button
            onClick={handleAtras}
            disabled={paso === 1}
            className="px-6 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft size={18} />
            Atrás
          </button>

          <div className="text-sm text-slate-600">
            Paso {paso} de 3
          </div>

          {paso < 3 ? (
            <button
              onClick={handleSiguiente}
              className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
            >
              Siguiente
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleConfirmar}
              disabled={seriales.filter(s => s.valido && !s.error).length === 0}
              className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar y Agregar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CargaMasivaCompras;
