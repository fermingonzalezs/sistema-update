// Resoluciones estándar para notebooks

// Mapa de migración: nombres de modelo MacBook → resolución numérica real
export const MACBOOK_LEGACY_MAP = {
  'MacBook Air 13"': '2560x1664',
  'MacBook Air 15"': '2880x1864',
  'MacBook Pro 14"': '3024x1964',
  'MacBook Pro 16"': '3456x2234',
  'MacBook Neo 13"': '2408x1506',
};

export const RESOLUCIONES = {
  HD: 'HD',
  FHD: 'FHD',
  FHD_PLUS: 'FHD+',
  QHD: 'QHD',
  QHD_PLUS: 'QHD+',
  '4K': '4K',
  '3K': '3K',
  MBA_13: '2560x1664',
  MBA_15: '2880x1864',
  MBP_14: '3024x1964',
  MBP_16: '3456x2234',
  MBA_13_NEO: '2408x1506',
};

export const RESOLUCIONES_ARRAY = [
  'HD',
  'FHD',
  'FHD+',
  'QHD',
  'QHD+',
  '4K',
  '3K',
  '2560x1664',
  '2880x1864',
  '3024x1964',
  '3456x2234',
  '2408x1506',
];

export const RESOLUCIONES_LABELS = {
  'HD': 'HD (1366x768)',
  'FHD': 'FHD (1920x1080)',
  'FHD+': 'FHD+ (1920x1200)',
  'QHD': 'QHD (2560x1440)',
  'QHD+': 'QHD+ (3200x1800)',
  '4K': '4K UHD (3840x2160)',
  '3K': '3K (3000x2000)',
  '2560x1664': 'MacBook Air 13" (2560x1664)',
  '2880x1864': 'MacBook Air 15" (2880x1864)',
  '3024x1964': 'MacBook Pro 14" (3024x1964)',
  '3456x2234': 'MacBook Pro 16" (3456x2234)',
  '2408x1506': 'MacBook Neo 13" (2408x1506)',
  // Compatibilidad con datos ya guardados con el nombre del modelo
  'MacBook Air 13"': 'MacBook Air 13" (2560x1664)',
  'MacBook Air 15"': 'MacBook Air 15" (2880x1864)',
  'MacBook Pro 14"': 'MacBook Pro 14" (3024x1964)',
  'MacBook Pro 16"': 'MacBook Pro 16" (3456x2234)',
  'MacBook Neo 13"': 'MacBook Neo 13" (2408x1506)',
};

export const getResolucionLabel = (resolucion) => {
  return RESOLUCIONES_LABELS[resolucion] || resolucion;
};

// Normaliza nombres de modelo MacBook a su resolución numérica real
export const normalizarResolucion = (resolucion) => {
  return MACBOOK_LEGACY_MAP[resolucion] || resolucion;
};

// Extrae solo los números de resolución (ej: "2560x1664")
export const getResolucionNumeros = (resolucion) => {
  if (!resolucion) return '';

  // Si ya es resolución numérica directa (ej: "2560x1664")
  if (/^\d+x\d+$/.test(resolucion)) return resolucion;

  const label = RESOLUCIONES_LABELS[resolucion];
  if (!label) return resolucion;

  const match = label.match(/\(([0-9x]+)\)/);
  if (match && match[1]) {
    return match[1];
  }

  return resolucion;
};

export const isValidResolucion = (resolucion) => {
  return RESOLUCIONES_ARRAY.includes(resolucion) || resolucion in MACBOOK_LEGACY_MAP;
};
