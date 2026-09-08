import React, { useState } from 'react';
import { KeyRound, X, Check, Shield, RotateCcw } from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onLogin: (password: string) => boolean;
  onLogout: () => void;
  onResetToDefault?: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  isAdmin,
  onLogin,
  onLogout,
  onResetToDefault
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = onLogin(password);
    if (success) {
      setPassword('');
      onClose();
    } else {
      setError('Contraseña incorrecta. (Pista: admin)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Shield className="w-4 h-4" />
            </div>
            <span>{isAdmin ? 'Modo Administrador Activo' : 'Acceso de Administrador'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isAdmin ? (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Permisos de edición compartida activos</span>
              </div>
              <p className="text-emerald-800 leading-relaxed">
                Todos los cambios que hagas se guardan en el servidor central y se sincronizan en tiempo real con las demás computadoras conectadas.
              </p>
            </div>

            {onResetToDefault && (
              <div className="pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    onResetToDefault();
                    onClose();
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar contenido inicial por defecto</span>
                </button>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Cerrar Sesión Admin
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-xs text-slate-600">
              Ingresa la contraseña de administrador para habilitar la edición de contenidos de la clase.
            </p>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Contraseña
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Escribe la clave..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && (
                <p className="text-xs text-rose-600 font-medium pt-1">
                  {error}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
              >
                Ingresar como Admin
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

