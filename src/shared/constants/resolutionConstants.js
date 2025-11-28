// Resoluciones estándar para notebooks

export const RESOLUCIONES = {
  HD: 'HD',
  FHD: 'FHD',
  FHD_PLUS: 'FHD+',
  QHD: 'QHD',
  QHD_PLUS: 'QHD+',
  '4K': '4K',
  MBA_13: 'MacBook Air 13"',
  MBA_15: 'MacBook Air 15"',
  MBP_14: 'MacBook Pro 14"',
  MBP_16: 'MacBook Pro 16"',
  '3K': '3K'
};

export const RESOLUCIONES_ARRAY = [
  'HD',
  'FHD',
  'FHD+',
  'QHD',
  'QHD+',
  '4K',
  'MacBook Air 13"',
  'MacBook Air 15"',
  'MacBook Pro 14"',
  'MacBook Pro 16"',
  '3K'
];

export const RESOLUCIONES_LABELS = {
  'HD': 'HD (1366x768)',
  'FHD': 'FHD (1920x1080)',
  'FHD+': 'FHD+ (1920x1200)',
  'QHD': 'QHD (2560x1440)',
  'QHD+': 'QHD+ (3200x1800)',
  '4K': '4K UHD (3840x2160)',
  'MacBook Air 13"': 'MacBook Air 13" (2560x1664)',
  'MacBook Air 15"': 'MacBook Air 15" (2880x1864)',
  'MacBook Pro 14"': 'MacBook Pro 14" (3024x1964)',
  'MacBook Pro 16"': 'MacBook Pro 16" (3456x2234)',
  '3K': '3K (3000x2000)'
};

export const getResolucionLabel = (resolucion) => {
  return RESOLUCIONES_LABELS[resolucion] || resolucion;
};

// Extrae solo los números de resolución (ej: "2560x1600" de "HD (1366x768)")
export const getResolucionNumeros = (resolucion) => {
  if (!resolucion) return '';

  const label = RESOLUCIONES_LABELS[resolucion];
  if (!label) return resolucion;

  // Extraer los números entre paréntesis usando regex
  const match = label.match(/\(([0-9x]+)\)/);
  if (match && match[1]) {
    return match[1]; // Retorna "1366x768", "2560x1600", etc.
  }

  return resolucion;
};

export const isValidResolucion = (resolucion) => {
  return RESOLUCIONES_ARRAY.includes(resolucion);
};
