import React, { useState } from 'react';
import { 
  Folder, 
  Share2, 
  Check, 
  ArrowLeft, 
  Presentation, 
  HelpCircle, 
  Users, 
  Star, 
  ArrowRight,
  Copy
} from 'lucide-react';
import { FolderData, PresentationData, UserProfile } from '../types';
import { PresentationIcon } from './PresentationIcon';

interface PublicFolderViewProps {
  folder: FolderData;
  presentations: PresentationData[];
  currentUser?: UserProfile | null;
  isFavoriteFolder?: boolean;
  onToggleFavoriteFolder?: (folderId: string) => void;
  onSelectPresentation: (presentation: PresentationData, startInEditMode?: boolean) => void;
  onBackToDashboard: () => void;
  onToggleFavorite?: (presentationId: string) => void;
  onDuplicatePresentation?: (presentation: PresentationData) => void;
}

export const PublicFolderView: React.FC<PublicFolderViewProps> = ({
  folder,
  presentations,
  currentUser,
  isFavoriteFolder = false,
  onToggleFavoriteFolder,
  onSelectPresentation,
  onBackToDashboard,
  onToggleFavorite,
  onDuplicatePresentation
}) => {
  const [copied, setCopied] = useState(false);

  const folderUrl = `${window.location.origin}${window.location.pathname}?folder=${folder.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(folderUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div id="public-folder-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Inicio</span>
        </button>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* FAVORITE FOLDER BUTTON FOR VISITORS */}
          {currentUser && onToggleFavoriteFolder && (
            <button
              type="button"
              onClick={() => onToggleFavoriteFolder(folder.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border ${
                isFavoriteFolder
                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title={isFavoriteFolder ? "Quitar de mis carpetas favoritas" : "Guardar esta carpeta en mis favoritos"}
            >
              <Star className={`w-3.5 h-3.5 ${isFavoriteFolder ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
              <span>{isFavoriteFolder ? 'Carpeta en Favoritos' : 'Guardar en Favoritos'}</span>
            </button>
          )}

          {/* COPY FOLDER SHARE LINK */}
          <button
            type="button"
            onClick={handleCopyLink}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
          </button>
        </div>
      </div>

      {/* Folder Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs shrink-0">
            <Folder className="w-7 h-7 stroke-[2]" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                Carpeta Compartida
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {presentations.length} {presentations.length === 1 ? 'presentación' : 'presentaciones'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              {folder.name}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Creada por: <strong>{folder.ownerName || 'Profesor / Expositor'}</strong></span>
            </p>
          </div>
        </div>
      </div>

      {/* Presentations Grid */}
      {presentations.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Folder className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Esta carpeta está vacía
          </h3>
          <p className="text-xs text-slate-500">
            El autor aún no ha agregado presentaciones a esta carpeta.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {presentations.map((pres) => {
            const isFav = Boolean(currentUser?.favoriteIds?.includes(pres.id));
            const canUserEditPres = Boolean(
              currentUser && (
                currentUser.id === pres.ownerId ||
                currentUser.role === 'admin' ||
                (pres.collaborators || []).some(c => c.email && currentUser.email && c.email.toLowerCase() === currentUser.email.toLowerCase() && c.role === 'editor')
              )
            );

            return (
              <div
                key={pres.id}
                onClick={() => onSelectPresentation(pres)}
                className="group min-h-[230px] bg-white border border-slate-200/90 hover:border-blue-400 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between relative"
              >
                {/* Top Row: Subject + Action Buttons */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 truncate max-w-[170px]">
                      {pres.subject}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Duplicate presentation (Only for users with edit rights) */}
                      {onDuplicatePresentation && canUserEditPres && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicatePresentation(pres);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Duplicar en mis presentaciones"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Quick Favorite toggle button */}
                      {onToggleFavorite && currentUser && currentUser.id !== pres.ownerId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(pres.id);
                          }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isFav 
                              ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' 
                              : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'
                          }`}
                          title={isFav ? "Quitar de Favoritos" : "Guardar en Favoritos"}
                        >
                          <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Middle: Icon & Title */}
                  <div className="flex items-start gap-3 my-2">
                    <PresentationIcon icon={pres.icon} size="md" className="mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                        {pres.title}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                        <span className="truncate">{(pres.presenters || []).join(' & ') || 'Sin expositor'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Counts & Open */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-2">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="flex items-center gap-1 font-medium text-slate-600">
                      <Presentation className="w-3 h-3 text-blue-500" />
                      {pres.slides?.length || 0}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 font-medium text-slate-600">
                      <HelpCircle className="w-3 h-3 text-indigo-500" />
                      {pres.quiz?.length || 0}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-blue-600 font-semibold text-xs group-hover:translate-x-0.5 transition-transform">
                    <span>Ver Presentación</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
