// Resoluciones estándar para notebooks

export const RESOLUCIONES = {
  HD: 'HD',
  FHD: 'FHD',
  FHD_PLUS: 'FHD+',
  QHD: 'QHD',
  QHD_PLUS: 'QHD+',
  '4K': '4K',
  RETINA_13: 'Retina 13"',
  RETINA_14: 'Retina 14" Pro',
  RETINA_16: 'Retina 16" Pro',
  MBA_CLASSIC: 'MacBook Air Classic',
  '3K': '3K'
};

export const RESOLUCIONES_ARRAY = [
  'HD',
  'FHD',
  'FHD+',
  'QHD',
  'QHD+',
  '4K',
  'Retina 13"',
  'Retina 14" Pro',
  'Retina 16" Pro',
  'MacBook Air Classic',
  '3K'
];

export const RESOLUCIONES_LABELS = {
  'HD': 'HD (1366x768)',
  'FHD': 'FHD (1920x1080)',
  'FHD+': 'FHD+ (1920x1200)',
  'QHD': 'QHD (2560x1440)',
  'QHD+': 'QHD+ (3200x1800)',
  '4K': '4K UHD (3840x2160)',
  'Retina 13"': 'Retina 13" (2560x1600)',
  'Retina 14" Pro': 'Retina 14" Pro (3024x1964)',
  'Retina 16" Pro': 'Retina 16" Pro (3456x2234)',
  'MacBook Air Classic': 'MacBook Air Classic (1440x900)',
  '3K': '3K (3000x2000)'
};

export const getResolucionLabel = (resolucion) => {
  return RESOLUCIONES_LABELS[resolucion] || resolucion;
};

export const isValidResolucion = (resolucion) => {
  return RESOLUCIONES_ARRAY.includes(resolucion);
};
