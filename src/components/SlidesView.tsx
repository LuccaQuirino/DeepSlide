import React, { useState, useEffect } from 'react';
import { PresentationData, UserProfile } from '../types';
import { 
  Maximize2, 
  Minimize2, 
  ExternalLink, 
  Users, 
  Link2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Presentation
} from 'lucide-react';
import { AutoResizeTextarea } from './AutoResizeTextarea';
import { CommentsSection } from './CommentsSection';
import { PresentationIcon, IconPickerModal } from './PresentationIcon';

interface SlidesViewProps {
  data: PresentationData;
  currentUser: UserProfile;
  targetCommentId?: string;
  onUpdateSlidesUrl: (url: string) => void;
  onUpdateHeader?: (title: string, subject: string, presenters: string[]) => void;
  onUpdateIcon?: (icon: string) => void;
  onAddComment: (section: 'slides' | 'explanation' | 'quiz', text: string) => void;
  onReplyComment: (commentId: string, replyText: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onNavigateToExplanation?: (slideNumber?: number) => void;
  isAdmin?: boolean;
}

export const SlidesView: React.FC<SlidesViewProps> = ({
  data,
  currentUser,
  targetCommentId,
  onUpdateSlidesUrl,
  onUpdateHeader,
  onUpdateIcon,
  onAddComment,
  onReplyComment,
  onDeleteComment,
  isAdmin = false
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [urlInput, setUrlInput] = useState(data.googleSlidesEmbedUrl || '');
  const [showPermissionsHelp, setShowPermissionsHelp] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  // Keep local inputs in sync with presentation data ONLY when presentation ID changes
  const [titleInput, setTitleInput] = useState(data.title);
  const [subjectInput, setSubjectInput] = useState(data.subject);
  const [presentersInput, setPresentersInput] = useState((data.presenters || []).join(', '));

  useEffect(() => {
    setTitleInput(data.title);
    setSubjectInput(data.subject);
    setPresentersInput((data.presenters || []).join(', '));
    setUrlInput(data.googleSlidesEmbedUrl || '');
  }, [data.id, data.googleSlidesEmbedUrl]);

  const saveHeaderChanges = (newTitle = titleInput, newSubject = subjectInput, newPres = presentersInput) => {
    if (!onUpdateHeader) return;
    let presentersList: string[] = [];
    if (newPres.includes(',')) {
      presentersList = newPres.split(',').map(p => p.trim()).filter(Boolean);
    } else if (newPres.trim()) {
      presentersList = [newPres.trim()];
    } else {
      presentersList = data.presenters;
    }
    onUpdateHeader(newTitle, newSubject, presentersList);
  };

  const handleTitleBlur = () => {
    saveHeaderChanges(titleInput, subjectInput, presentersInput);
  };

  const handleSubjectBlur = () => {
    saveHeaderChanges(titleInput, subjectInput, presentersInput);
  };

  const handlePresentersBlur = () => {
    saveHeaderChanges(titleInput, subjectInput, presentersInput);
  };

  const handleUrlChange = (val: string) => {
    setUrlInput(val);
    let cleaned = val.trim();
    if (cleaned.includes('docs.google.com/presentation/d/')) {
      const match = cleaned.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        const presentationId = match[1];
        if (!cleaned.includes('/embed') && !cleaned.includes('/pub')) {
          cleaned = `https://docs.google.com/presentation/d/${presentationId}/embed?start=false&loop=false&delayms=3000`;
        }
      }
    }
    onUpdateSlidesUrl(cleaned || val);
  };

  const toggleFullscreen = () => {
    const elem = document.getElementById('slides-presentation-container');
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch((err) => {
        console.error("Error attempting to exit fullscreen:", err);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div id="slides-view-root" className="space-y-4">
      {/* Top Header Card: Title, Presenters, Subject */}
      <div id="slides-header-card" className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        {isAdmin ? (
          /* DIRECT INLINE EDITING FOR SLIDES HEADER WHEN EDIT MODE IS ACTIVE */
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                ✏️ Editando Encabezado de la Presentación
              </span>
              <span className="text-xs text-slate-400">Los cambios se guardan al salir del campo</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Logo / Icon picker button */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Logo / Ícono
                </label>
                <button
                  type="button"
                  onClick={() => setIsIconPickerOpen(true)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <PresentationIcon icon={data.icon} size="sm" />
                    <span>Cambiar Logo</span>
                  </div>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Materia / Especialidad</label>
                <input
                  type="text"
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  onBlur={handleSubjectBlur}
                  placeholder="Ej: Ámbito farmacéutico"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Expositores / Nombres</label>
                <input
                  type="text"
                  value={presentersInput}
                  onChange={(e) => setPresentersInput(e.target.value)}
                  onBlur={handlePresentersBlur}
                  placeholder="Ej: Juan Pérez o Juan Pérez y María López"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Título de la Presentación</label>
              <AutoResizeTextarea
                rows={1}
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleBlur}
                placeholder="Rol del auxiliar..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-base font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:bg-white"
              />
            </div>

            {/* Google Slides embed URL direct input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Enlace de Google Slides (Embed o enlace compartido)</span>
              </label>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://docs.google.com/presentation/d/.../edit"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        ) : (
          /* CLEAN VIEWING MODE */
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <PresentationIcon icon={data.icon} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                    Diapositivas de Exposición
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-semibold text-slate-500">
                    {data.subject}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight mt-0.5">
                  {data.title}
                </h2>
              </div>
            </div>

            {/* Presenters badge */}
            <div className="flex items-center gap-2 self-start md:self-auto bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <div className="flex items-center gap-1 text-slate-700">
                <span className="font-semibold text-slate-900">
                  {(data.presenters || []).join(' & ') || 'Sin expositor especificado'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Google Slides Permission Assistance Accordion */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setShowPermissionsHelp(prev => !prev)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-50/70 text-xs text-slate-600 font-semibold transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>¿Cómo asegurar que cualquier persona pueda ver las diapositivas sin problemas de permisos?</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span className="text-[11px] font-normal">{showPermissionsHelp ? 'Ocultar' : 'Ver solución'}</span>
            {showPermissionsHelp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {showPermissionsHelp && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/60 text-xs text-slate-700 space-y-2.5 animate-in fade-in duration-150">
            <p className="font-semibold text-slate-800">
              Para que otra cuenta (como Cuenta 2) o cualquier espectador vea el Google Slides dentro de la página:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-600">
              <li>
                <strong>Opción recomendada (Cualquier persona):</strong> En Google Slides, haz clic en el botón azul <strong>"Compartir"</strong> (arriba a la derecha) &gt; en <em>"Acceso general"</em> cambia de "Restringido" a <strong>"Cualquier persona con el enlace"</strong> (con rol <em>Lector</em>).
              </li>
              <li>
                <strong>Opción alternativa (Publicar):</strong> En Google Slides ve a <em>Archivo &gt; Compartir &gt; Publicar en la web</em>, haz clic en <strong>Publicar</strong> y copia el enlace generado.
              </li>
            </ol>
            <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
              💡 Nota: Como Google Slides pertenece a la cuenta de Google que lo creó, configurar el acceso como "Cualquier persona con el enlace" permite que cualquier usuario lo reproduzca en el visor sin tener que pedirte acceso individual.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* GOOGLE SLIDES PRESENTATION CONTAINER */}
      {/* ========================================================================= */}
      <div 
        id="slides-presentation-container" 
        className={`bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/90 shadow-xl relative flex flex-col transition-all duration-300 ${
          isFullscreen 
            ? 'fixed inset-0 z-50 rounded-none w-screen h-screen' 
            : 'h-[520px] sm:h-[620px] lg:h-[680px]'
        }`}
      >
        {/* Top Control Bar */}
        <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-white/10 z-20 text-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></div>
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Presentation className="w-3.5 h-3.5 text-amber-400" />
              <span>Google Slides</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {data.googleSlidesEmbedUrl && (
              <a
                href={
                  data.googleSlidesEmbedUrl.includes('/d/e/2PACX-')
                    ? data.googleSlidesEmbedUrl.replace('/embed', '/pub')
                    : data.googleSlidesEmbedUrl.replace('/embed', '/edit')
                }
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium px-2.5 border border-slate-700"
                title="Abrir en pestaña nueva"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Abrir Original</span>
              </a>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold px-2.5 shadow-xs cursor-pointer"
              title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa para exponer"}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Salir</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pantalla Completa</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Presentation Display: Google Slides iframe */}
        <div className="flex-1 w-full h-full relative bg-slate-950 overflow-hidden flex items-center justify-center">
          {data.googleSlidesEmbedUrl ? (
            <iframe
              src={data.googleSlidesEmbedUrl}
              frameBorder="0"
              width="100%"
              height="100%"
              allowFullScreen={true}
              title="Google Slides Presentation"
              className="w-full h-full border-0 absolute inset-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            ></iframe>
          ) : (
            /* Empty state when no Google Slides URL has been set */
            <div className="text-center p-8 text-slate-300 space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 text-amber-400 flex items-center justify-center mx-auto border border-slate-700 shadow-md">
                <Presentation className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Google Slides no configurado</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ingresa el enlace de tu presentación de Google Slides para visualizarla aquí.
                </p>
              </div>

              {isAdmin && (
                <div className="pt-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="Pega el enlace de Google Slides aquí..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Discrete Comments Section for Slides View */}
      <CommentsSection
        section="slides"
        sectionTitle="las Diapositivas"
        comments={data.comments || []}
        currentUserId={currentUser.id}
        currentUserName={currentUser.name}
        currentUserPhoto={currentUser.photoURL}
        currentUserEmail={currentUser.email}
        ownerId={data.ownerId}
        ownerName={data.ownerName}
        targetCommentId={targetCommentId}
        onAddComment={onAddComment}
        onReplyComment={onReplyComment}
        onDeleteComment={onDeleteComment}
      />

      {/* Icon Picker Modal */}
      <IconPickerModal
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        currentIcon={data.icon}
        onSelectIcon={(newIcon) => {
          if (onUpdateIcon) {
            onUpdateIcon(newIcon);
          }
        }}
      />
    </div>
  );
};
