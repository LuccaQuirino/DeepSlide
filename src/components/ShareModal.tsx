import React, { useState } from 'react';
import { PresentationData, CollaboratorInfo } from '../types';
import { 
  Share2, 
  Copy, 
  Check, 
  Globe, 
  Lock,
  ExternalLink, 
  X, 
  ShieldCheck,
  UserCheck,
  Users,
  UserX,
  Sparkles,
  Link2
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  presentation: PresentationData | null;
  onTogglePublic?: (isPublic: boolean) => void;
  onRemoveCollaborator?: (collaboratorId: string) => void;
  isOwner?: boolean;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  presentation,
  onTogglePublic,
  onRemoveCollaborator,
  isOwner = true
}) => {
  const [copiedViewer, setCopiedViewer] = useState(false);
  const [copiedEditor, setCopiedEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<'access' | 'collaborators'>('access');

  if (!isOpen || !presentation) return null;

  const origin = window.location.origin;
  const viewerUrl = `${origin}/?p=${presentation.id}`;
  const editorUrl = `${origin}/?p=${presentation.id}&role=editor`;

  const isPublic = presentation.isPublic !== false;

  const handleCopyViewer = () => {
    navigator.clipboard.writeText(viewerUrl).then(() => {
      setCopiedViewer(true);
      setTimeout(() => setCopiedViewer(false), 2500);
    });
  };

  const handleCopyEditor = () => {
    navigator.clipboard.writeText(editorUrl).then(() => {
      setCopiedEditor(true);
      setTimeout(() => setCopiedEditor(false), 2500);
    });
  };

  const collaborators = presentation.collaborators || [];

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150 my-6"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 leading-snug">
                Compartir &amp; Privacidad
              </h3>
              <p className="text-xs text-slate-500">
                Gestiona la publicación y accesos de colaboración
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Subtabs */}
        <div className="flex border-b border-slate-100 px-5 pt-2 bg-slate-50/40 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('access')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'access'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Enlaces &amp; Publicación</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('collaborators')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'collaborators'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Editores Colaboradores ({collaborators.length})</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {activeTab === 'access' ? (
            <>
              {/* SECTION 1: PUBLIC GALLERY FEED TOGGLE */}
              {isOwner && onTogglePublic && (
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">
                    Visibilidad en la Galería
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onTogglePublic(true)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                        isPublic
                          ? 'border-blue-500 bg-white ring-2 ring-blue-500/10 shadow-xs'
                          : 'border-slate-200 bg-white/60 hover:bg-white text-slate-500'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${isPublic ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <Globe className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold leading-tight ${isPublic ? 'text-blue-700' : 'text-slate-700'}`}>
                          Publicación Abierta
                        </p>
                        <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
                          Aparece en el feed "Publicaciones" para toda la comunidad.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onTogglePublic(false)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                        !isPublic
                          ? 'border-amber-500 bg-white ring-2 ring-amber-500/10 shadow-xs'
                          : 'border-slate-200 bg-white/60 hover:bg-white text-slate-500'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${!isPublic ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold leading-tight ${!isPublic ? 'text-amber-700' : 'text-slate-700'}`}>
                          Solo con Enlace
                        </p>
                        <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
                          Oculta de Publicaciones. Solo accesible para quien tenga el enlace.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION 2: VIEWER LINK */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Enlace para Alumnos y Lectores (Solo Visualización)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Modo Seguro</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={viewerUrl}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 select-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleCopyViewer}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs ${
                      copiedViewer 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {copiedViewer ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Podrán ver las diapositivas, tarjetas interactivas y resolver el cuestionario sin modificar el contenido.
                </p>
              </div>

              {/* SECTION 3: COLLABORATIVE EDITOR LINK */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Enlace de Colaboración (Permiso de Edición)</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Control Co-Autor
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={editorUrl}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 select-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={handleCopyEditor}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs ${
                      copiedEditor 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {copiedEditor ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Cualquier usuario que abra este enlace obtendrá derechos de edición, podrá modificar diapositivas y preguntas, y la presentación aparecerá en su sección <strong>"Mis Presentaciones"</strong> indicando que tú eres el creador.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                <span className="truncate max-w-[260px] font-medium text-slate-700">
                  {presentation.title}
                </span>
                <a
                  href={viewerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                >
                  <span>Probar vista</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </>
          ) : (
            /* COLLABORATORS LIST TAB */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700">
                  Usuarios con Acceso de Edición ({collaborators.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  Creado por: <strong>{presentation.ownerName || 'Ti'}</strong>
                </span>
              </div>

              {collaborators.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Users className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">
                    Aún no hay co-autores con acceso de edición
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Ve a la pestaña anterior "Enlaces &amp; Publicación" y comparte el <strong>Enlace de Colaboración</strong> con tus compañeros o colegas para que editen contigo.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {collaborators.map((collab) => (
                    <div 
                      key={collab.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {collab.photoURL ? (
                          <img 
                            src={collab.photoURL} 
                            alt={collab.name}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full border border-slate-200 shrink-0" 
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {collab.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {collab.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {collab.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Editor
                        </span>
                        {isOwner && onRemoveCollaborator && (
                          <button
                            type="button"
                            onClick={() => onRemoveCollaborator(collab.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Revocar acceso de edición"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};

