import React from 'react';

/**
 * LoadingSpinner - Componente unificado para estados de carga
 * Reemplaza los 31+ componentes de loading dispersos en la aplicación
 * 
 * Cumple con el sistema de diseño CLAUDE.md:
 * - Colores: emerald-600 para el spinner
 * - Tipografía: text-slate-600 para el texto
 * - Espaciado: sistema de 8px
 */
const LoadingSpinner = ({ 
  size = 'medium',
  text = 'Cargando...',
  showText = true,
  className = '',
  fullScreen = false
}) => {
  // Tamaños definidos según el sistema de diseño
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8', 
    large: 'w-12 h-12'
  };

  // Contenedor base
  const containerClasses = fullScreen 
    ? 'fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50'
    : 'flex items-center justify-center';

  // Altura por defecto si no es fullScreen
  const defaultHeight = fullScreen ? '' : 'h-64';

  return (
    <div className={`${containerClasses} ${defaultHeight} ${className}`}>
      <div className="flex flex-col items-center space-y-3">
        {/* Spinner animado */}
        <div 
          className={`
            animate-spin rounded-full 
            border-2 border-slate-200 border-t-emerald-600
            ${sizeClasses[size]}
          `}
        />
        
        {/* Texto opcional */}
        {showText && (
          <span className="text-slate-600 text-sm font-medium">
            {text}
          </span>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;