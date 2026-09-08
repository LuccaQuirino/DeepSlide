import React, { useState, useEffect } from 'react';
import { Folder, FolderPlus, X, Check } from 'lucide-react';
import { FolderData } from '../types';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color?: string) => void;
  folderToEdit?: FolderData | null;
}

const COLOR_OPTIONS = [
  { id: 'blue', name: 'Azul', bg: 'bg-blue-100 text-blue-700 border-blue-300' },
  { id: 'emerald', name: 'Esmeralda', bg: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { id: 'violet', name: 'Violeta', bg: 'bg-violet-100 text-violet-700 border-violet-300' },
  { id: 'amber', name: 'Ámbar', bg: 'bg-amber-100 text-amber-700 border-amber-300' },
  { id: 'rose', name: 'Rosa', bg: 'bg-rose-100 text-rose-700 border-rose-300' },
  { id: 'slate', name: 'Gris', bg: 'bg-slate-100 text-slate-700 border-slate-300' }
];

export const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  folderToEdit
}) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');

  useEffect(() => {
    if (folderToEdit) {
      setName(folderToEdit.name);
      setSelectedColor(folderToEdit.color || 'blue');
    } else {
      setName('');
      setSelectedColor('blue');
    }
  }, [folderToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), selectedColor);
    onClose();
  };

  return (
    <div 
      id="folder-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div 
        id="folder-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                {folderToEdit ? <Folder className="w-5 h-5" /> : <FolderPlus className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800">
                  {folderToEdit ? 'Renombrar Carpeta' : 'Nueva Carpeta'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {folderToEdit ? 'Modifica el nombre de tu colección' : 'Organiza tus presentaciones por clase o tema'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nombre de la Carpeta *
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Ej: Clase 1, Clase 2, Farmacología Clínica..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Color de Identificación
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedColor(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${c.bg} ${
                      selectedColor === c.id ? 'ring-2 ring-blue-600 font-bold shadow-xs' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    {selectedColor === c.id && <Check className="w-3 h-3" />}
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              {folderToEdit ? 'Guardar Cambios' : 'Crear Carpeta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
