import React, { useState } from 'react';
import { 
  Folder, 
  FolderPlus, 
  Layers, 
  FileText, 
  MoreVertical, 
  Share2, 
  Edit2, 
  Trash2, 
  Check, 
  Copy 
} from 'lucide-react';
import { FolderData, PresentationData } from '../types';

interface FolderSidebarProps {
  folders: FolderData[];
  presentations: PresentationData[];
  activeFolderId: string | null; // null = all, 'none' = uncategorized, or specific folderId
  onSelectFolder: (folderId: string | null) => void;
  onOpenCreateFolder: () => void;
  onOpenRenameFolder: (folder: FolderData) => void;
  onDeleteFolder: (folderId: string) => void;
  onShareFolder: (folder: FolderData) => void;
  onDuplicateFolder?: (folderId: string) => void;
}

export const FolderSidebar: React.FC<FolderSidebarProps> = ({
  folders,
  presentations,
  activeFolderId,
  onSelectFolder,
  onOpenCreateFolder,
  onOpenRenameFolder,
  onDeleteFolder,
  onShareFolder,
  onDuplicateFolder
}) => {
  const [menuOpenFolderId, setMenuOpenFolderId] = useState<string | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<FolderData | null>(null);

  // Counts
  const totalCount = presentations.length;
  const uncategorizedCount = presentations.filter(p => !p.folderId).length;

  const getFolderCount = (folderId: string) => {
    return presentations.filter(p => p.folderId === folderId).length;
  };

  return (
    <aside id="folder-sidebar" className="w-full md:w-64 shrink-0 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-4 relative">
      {/* Header & New Folder Button */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Carpetas
          </h3>
        </div>
        <button
          type="button"
          onClick={onOpenCreateFolder}
          title="Crear nueva carpeta"
          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors flex items-center gap-1 border border-blue-200/80 cursor-pointer"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>Nueva</span>
        </button>
      </div>

      {/* Primary navigation: All & Uncategorized */}
      <div className="space-y-1">
        {/* Todas */}
        <button
          type="button"
          onClick={() => onSelectFolder(null)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeFolderId === null
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-slate-700 hover:bg-slate-100/80'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Layers className={`w-4 h-4 shrink-0 ${activeFolderId === null ? 'text-white' : 'text-slate-400'}`} />
            <span className="truncate">Todas las presentaciones</span>
          </div>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
            activeFolderId === null ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {totalCount}
          </span>
        </button>

        {/* Sin carpeta */}
        <button
          type="button"
          onClick={() => onSelectFolder('none')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeFolderId === 'none'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-slate-700 hover:bg-slate-100/80'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <FileText className={`w-4 h-4 shrink-0 ${activeFolderId === 'none' ? 'text-white' : 'text-slate-400'}`} />
            <span className="truncate">Sin carpeta</span>
          </div>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
            activeFolderId === 'none' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {uncategorizedCount}
          </span>
        </button>
      </div>

      {/* Folders List */}
      <div className="pt-2 border-t border-slate-100 space-y-1">
        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Mis Colecciones ({folders.length})
        </div>

        {folders.length === 0 ? (
          <div className="p-3 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
            <p className="text-[11px] text-slate-500">
              No has creado carpetas aún.
            </p>
            <button
              type="button"
              onClick={onOpenCreateFolder}
              className="mt-1.5 text-xs text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Crear ej: Clase 1</span>
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {folders.map((folder) => {
              const isSelected = activeFolderId === folder.id;
              const count = getFolderCount(folder.id);
              const isMenuOpen = menuOpenFolderId === folder.id;

              return (
                <div key={folder.id} className="relative">
                  <div
                    onClick={() => onSelectFolder(folder.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : isMenuOpen
                          ? 'bg-blue-50 text-blue-900 ring-2 ring-blue-500 shadow-xs font-bold'
                          : 'text-slate-700 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                      <Folder className={`w-4 h-4 shrink-0 ${
                        isSelected 
                          ? 'text-white' 
                          : folder.color === 'emerald' ? 'text-emerald-500' :
                            folder.color === 'violet' ? 'text-violet-500' :
                            folder.color === 'amber' ? 'text-amber-500' :
                            folder.color === 'rose' ? 'text-rose-500' : 'text-blue-500'
                      }`} />
                      <span className="truncate">{folder.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                        isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {count}
                      </span>

                      {/* Folder menu button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenFolderId(isMenuOpen ? null : folder.id);
                        }}
                        className={`p-1 rounded-md transition-colors ${
                          isSelected 
                            ? 'text-white/80 hover:text-white hover:bg-blue-700' 
                            : isMenuOpen
                              ? 'text-blue-700 bg-blue-100'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/70'
                        }`}
                        title="Opciones de carpeta"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* High-visibility pop-up context menu on the right of the folder without any scrollbar */}
                  {isMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[0.5px]" 
                        onClick={() => setMenuOpenFolderId(null)} 
                      />
                      <div className="absolute md:left-full md:top-0 md:ml-3 right-0 top-full mt-1 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                            Carpeta: {folder.name}
                          </span>
                        </div>

                        {/* 1. Share public link */}
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpenFolderId(null);
                            onShareFolder(folder);
                          }}
                          className="w-full px-3.5 py-2 text-xs text-left font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Share2 className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>Compartir enlace público</span>
                        </button>

                        {/* 2. Rename folder */}
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpenFolderId(null);
                            onOpenRenameFolder(folder);
                          }}
                          className="w-full px-3.5 py-2 text-xs text-left font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4 text-slate-500 shrink-0" />
                          <span>Renombrar carpeta</span>
                        </button>

                        {/* 3. Duplicate folder with all its content */}
                        {onDuplicateFolder && (
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpenFolderId(null);
                              onDuplicateFolder(folder.id);
                            }}
                            className="w-full px-3.5 py-2 text-xs text-left font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Copy className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span>Duplicar con contenido</span>
                          </button>
                        )}

                        {/* 4. Delete folder */}
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpenFolderId(null);
                            setFolderToDelete(folder);
                          }}
                          className="w-full px-3.5 py-2 text-xs text-left font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors border-t border-slate-100 mt-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" />
                          <span>Eliminar carpeta</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* In-app Confirmation Modal for deleting folder (avoids iframe window.confirm block) */}
      {folderToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200/90 space-y-4">
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-sm font-bold text-slate-800">
                ¿Eliminar la carpeta "{folderToDelete.name}"?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Las presentaciones asociadas no se perderán; quedarán automáticamente organizadas en <strong>Sin carpeta</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setFolderToDelete(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = folderToDelete.id;
                  setFolderToDelete(null);
                  onDeleteFolder(id);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Eliminar carpeta
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
