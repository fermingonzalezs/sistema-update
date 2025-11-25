import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react';
import { useMarcas } from '../../../modules/administracion/hooks/useMarcas';

const MarcaSelector = ({ value, onChange, className = '', placeholder = 'Seleccionar marca...' }) => {
    const { marcas, loading, addMarca } = useMarcas();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [newMarca, setNewMarca] = useState('');
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const wrapperRef = useRef(null);
    const searchInputRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                // Check if click is inside the portal dropdown
                const dropdown = document.getElementById('marca-selector-dropdown');
                if (dropdown && dropdown.contains(event.target)) {
                    return;
                }
                setIsOpen(false);
                setIsAdding(false);
                setSearchTerm('');
            }
        };

        const handleScroll = (event) => {
            if (isOpen) {
                // Solo cerrar si el scroll es fuera del dropdown
                const dropdown = document.getElementById('marca-selector-dropdown');
                if (dropdown && dropdown.contains(event.target)) {
                    return; // No cerrar si scrolleas dentro del dropdown
                }
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', () => setIsOpen(false));

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', () => setIsOpen(false));
        };
    }, [isOpen]);

    // Auto-focus en el input de búsqueda cuando se abre el dropdown
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    }, [isOpen]);

    const filteredMarcas = marcas.filter(marca =>
        marca.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (marcaNombre) => {
        onChange(marcaNombre);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleAddMarca = async (e) => {
        e.preventDefault();
        if (!newMarca.trim()) return;

        const result = await addMarca(newMarca.trim());
        if (result.success) {
            onChange(result.data.nombre);
            setIsOpen(false);
            setIsAdding(false);
            setNewMarca('');
            setSearchTerm('');
        } else {
            alert('Error al agregar marca: ' + result.error);
        }
    };

    const dropdownContent = (
        <div
            id="marca-selector-dropdown"
            className="fixed z-[9999] bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto"
            style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width
            }}
        >
            {!isAdding ? (
                <>
                    <div className="p-2 sticky top-0 bg-white border-b border-slate-100">
                        <input
                            ref={searchInputRef}
                            type="text"
                            className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:border-emerald-500"
                            placeholder="Buscar o escribir nueva marca..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    <div className="py-1">
                        {loading ? (
                            <div className="px-4 py-2 text-sm text-slate-500">Cargando...</div>
                        ) : filteredMarcas.length === 0 ? (
                            <div className="px-4 py-2 text-sm text-slate-500">No se encontraron marcas</div>
                        ) : (
                            filteredMarcas.map((marca) => (
                                <div
                                    key={marca.id}
                                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-slate-100 flex items-center justify-between ${value === marca.nombre ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
                                        }`}
                                    onClick={() => handleSelect(marca.nombre)}
                                >
                                    <span>{marca.nombre}</span>
                                    {value === marca.nombre && <Check className="w-4 h-4" />}
                                </div>
                            ))
                        )}
                    </div>

                    <div
                        className="p-2 border-t border-slate-100 sticky bottom-0 bg-slate-50 cursor-pointer hover:bg-slate-100 text-emerald-600 text-sm font-medium flex items-center justify-center"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsAdding(true);
                            setNewMarca(searchTerm);
                        }}
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Agregar "{searchTerm || 'Nueva'}"
                    </div>
                </>
            ) : (
                <div className="p-3">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Nueva Marca</h4>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-emerald-500"
                            placeholder="Nombre de la marca"
                            value={newMarca}
                            onChange={(e) => setNewMarca(e.target.value)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddMarca(e);
                            }}
                        />
                        <button
                            className="px-2 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700"
                            onClick={handleAddMarca}
                        >
                            <Check className="w-4 h-4" />
                        </button>
                        <button
                            className="px-2 py-1 bg-slate-200 text-slate-600 rounded text-sm hover:bg-slate-300"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsAdding(false);
                            }}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div
                className="w-full px-3 py-2 border border-slate-300 rounded bg-white flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 select-none"
                onClick={(e) => {
                    e.preventDefault();
                    setIsOpen(!isOpen);
                }}
            >
                <span className={`block truncate ${!value ? 'text-slate-500' : 'text-slate-900'}`}>
                    {value || placeholder}
                </span>
                <ChevronsUpDown className="w-4 h-4 text-slate-400" />
            </div>

            {isOpen && createPortal(dropdownContent, document.body)}
        </div>
    );
};

export default MarcaSelector;
