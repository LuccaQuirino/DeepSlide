import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemType?: string;
  isDeleting?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemType = 'la presentación',
  isDeleting = false
}) => {
  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                ¿Eliminar {itemType}?
              </h3>
              <p className="text-xs text-rose-600 font-medium">
                Esta acción es irreversible
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3 text-slate-700 text-xs sm:text-sm leading-relaxed">
          <p>
            Estás a punto de eliminar definitivamente:
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 line-clamp-2">
            "{title}"
          </div>
          <p className="text-xs text-slate-500">
            Se borrarán de forma permanente todas sus diapositivas, explicaciones en detalle, cuestionarios interactivos y comentarios asociados.
          </p>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Eliminando...' : 'Sí, eliminar definitivamente'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
