import React, { useState, useEffect } from 'react';
import { PresentationData, UserProfile, FolderData } from '../types';
import { 
  Plus, 
  Presentation, 
  BookOpen, 
  HelpCircle, 
  Users, 
  Share2, 
  Trash2, 
  Search, 
  Globe, 
  ArrowRight, 
  Sparkles, 
  Info, 
  ShieldCheck,
  UserCheck,
  Lock,
  Edit3,
  Folder,
  Star,
  FolderPlus,
  Copy,
  Check,
  ChevronDown
} from 'lucide-react';
import { PresentationIcon, IconPickerModal } from './PresentationIcon';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { FolderSidebar } from './FolderSidebar';
import { FolderModal } from './FolderModal';

interface DashboardViewProps {
  user: UserProfile;
  presentations: PresentationData[]; // My Presentations (owned)
  sharedPresentations?: PresentationData[]; // Compartidos conmigo (only real editor collaborators)
  publicPresentations?: PresentationData[]; // All Public Presentations
  favoritePresentations?: PresentationData[]; // Favoritos (saved external presentations)
  favoriteFolders?: FolderData[]; // Saved external folders
  folders?: FolderData[]; // User's folders
  activeFolderId?: string | null; // null = all, 'none' = uncategorized, or folderId
  onSelectFolder?: (folderId: string | null) => void;
  onCreateFolder?: (name: string, color?: string) => Promise<FolderData | void> | void;
  onRenameFolder?: (id: string, newName: string, color?: string) => void;
  onDeleteFolder?: (id: string) => void;
  onAssignPresentationFolder?: (presentationId: string, folderId?: string, folderName?: string) => void;
  onToggleFavorite?: (presentationId: string) => void;
  onToggleFavoriteFolder?: (folderId: string) => void;
  onOpenSharedFolder?: (folderId: string) => void;
  onDuplicatePresentation?: (presentation: PresentationData) => void;
  onDuplicateFolder?: (folderId: string) => void;
  onSelectPresentation: (presentation: PresentationData, startInEditMode?: boolean, originFolder?: { id: string; name?: string }) => void;
  onCreatePresentation: (newPres: Partial<PresentationData>) => void;
  onDeletePresentation: (id: string) => void;
  onOpenShareModal: (presentation: PresentationData) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  presentations,
  sharedPresentations = [],
  publicPresentations = [],
  favoritePresentations = [],
  favoriteFolders = [],
  folders = [],
  activeFolderId: propActiveFolderId,
  onSelectFolder: propOnSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onAssignPresentationFolder,
  onToggleFavorite,
  onToggleFavoriteFolder,
  onOpenSharedFolder,
  onDuplicatePresentation,
  onDuplicateFolder,
  onSelectPresentation,
  onCreatePresentation,
  onDeletePresentation,
  onOpenShareModal
}) => {
  const [activeTab, setActiveTab] = useState<'mine' | 'shared' | 'favorites' | 'public'>('mine');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [presentationToDelete, setPresentationToDelete] = useState<PresentationData | null>(null);

  // Sub-view selector for Favoritos tab: 'presentations' (top) or 'folders' (bottom)
  const [favoriteViewType, setFavoriteViewType] = useState<'presentations' | 'folders'>('presentations');

  // Check if current user has edit rights on a presentation (owner or assigned editor)
  const canUserEditPres = (pres: PresentationData) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (pres.ownerId === user.id) return true;
    return (pres.collaborators || []).some(
      c => c.email && user.email && c.email.toLowerCase() === user.email.toLowerCase() && c.role === 'editor'
    );
  };

  // Folder local state (if not controlled externally)
  const [localActiveFolderId, setLocalActiveFolderId] = useState<string | null>(null);
  const activeFolderId = propActiveFolderId !== undefined ? propActiveFolderId : localActiveFolderId;
  const handleSelectFolder = (fId: string | null) => {
    if (propOnSelectFolder) {
      propOnSelectFolder(fId);
    } else {
      setLocalActiveFolderId(fId);
    }
  };

  // Folder modal state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<FolderData | null>(null);

  // Presentation folder change popover
  const [moveMenuPresId, setMoveMenuPresId] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // New presentation form
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newPresenters, setNewPresenters] = useState(user.name);
  const [newSlidesUrl, setNewSlidesUrl] = useState('');
  const [newIcon, setNewIcon] = useState('capsule');
  const [newIsPublic, setNewIsPublic] = useState(false); // DEFAULT: PRIVADO
  const [newFolderId, setNewFolderId] = useState<string>('');
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  useEffect(() => {
    setNewPresenters(user.name);
  }, [user.name]);

  // When create modal opens, pre-select current active folder if valid
  useEffect(() => {
    if (isCreateModalOpen) {
      if (activeFolderId && activeFolderId !== 'none') {
        setNewFolderId(activeFolderId);
      } else {
        setNewFolderId('');
      }
    }
  }, [isCreateModalOpen, activeFolderId]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    let presentersList: string[] = [];
    if (newPresenters.includes(',')) {
      presentersList = newPresenters.split(',').map(p => p.trim()).filter(Boolean);
    } else if (newPresenters.trim()) {
      presentersList = [newPresenters.trim()];
    } else {
      presentersList = [user.name];
    }

    // Clean Google Slides URL if pasted
    let cleanedUrl = newSlidesUrl.trim();
    if (cleanedUrl.includes('docs.google.com/presentation/d/')) {
      const match = cleanedUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1] && !cleanedUrl.includes('/embed') && !cleanedUrl.includes('/pub')) {
        cleanedUrl = `https://docs.google.com/presentation/d/${match[1]}/embed?start=false&loop=false&delayms=3000`;
      }
    }

    const assignedFolder = folders.find(f => f.id === newFolderId);

    onCreatePresentation({
      title: newTitle.trim(),
      subject: newSubject.trim() || 'Ámbito farmacéutico',
      presenters: presentersList,
      icon: newIcon,
      googleSlidesEmbedUrl: cleanedUrl,
      ownerId: user.id,
      ownerName: user.name,
      ownerEmail: user.email,
      isPublic: newIsPublic,
      folderId: newFolderId || undefined,
      folderName: assignedFolder ? assignedFolder.name : undefined
    });

    setNewTitle('');
    setNewSubject('');
    setNewPresenters(user.name);
    setNewSlidesUrl('');
    setNewFolderId('');
    setIsCreateModalOpen(false);
  };

  const handleShareFolder = (folder: FolderData) => {
    const url = `${window.location.origin}${window.location.pathname}?folder=${folder.id}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast(`¡Enlace público de la carpeta "${folder.name}" copiado al portapapeles!`);
    }).catch(() => {
      showToast(`Enlace de carpeta: ${url}`);
    });
  };

  // Filter My Presentations by active folder selection
  const presentationsFilteredByFolder = presentations.filter(p => {
    if (activeFolderId === null) return true; // All
    if (activeFolderId === 'none') return !p.folderId; // Uncategorized
    return p.folderId === activeFolderId; // Belongs to selected folder
  });

  const filteredMyPresentations = presentationsFilteredByFolder.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.presenters || []).some(pres => pres.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredSharedPresentations = sharedPresentations.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.ownerName && p.ownerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredFavoritePresentations = favoritePresentations.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.ownerName && p.ownerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredPublicPresentations = publicPresentations.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.ownerName && p.ownerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeFolderObj = folders.find(f => f.id === activeFolderId);

  return (
    <div id="dashboard-view-root" className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header: Navigation Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-slate-200/80 pb-4">
        {/* Navigation Tabs (4 TABS) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* TAB 1: MIS PRESENTACIONES */}
          <button
            type="button"
            onClick={() => setActiveTab('mine')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'mine'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Mis Presentaciones</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'mine' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {presentations.length}
            </span>
          </button>

          {/* TAB 2: COMPARTIDOS CONMIGO */}
          <button
            type="button"
            onClick={() => setActiveTab('shared')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'shared'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Compartidos conmigo</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'shared' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {sharedPresentations.length}
            </span>
          </button>

          {/* TAB 3: FAVORITOS (NUEVO) */}
          <button
            type="button"
            onClick={() => setActiveTab('favorites')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'favorites'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${activeTab === 'favorites' ? 'fill-white text-white' : 'text-amber-500 fill-amber-500'}`} />
            <span>Favoritos</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'favorites' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {favoritePresentations.length}
            </span>
          </button>

          {/* TAB 4: PUBLICACIONES */}
          <button
            type="button"
            onClick={() => setActiveTab('public')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'public'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Publicaciones</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'public' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {publicPresentations.length}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={
              activeTab === 'mine' 
                ? "Buscar en mis presentaciones..." 
                : activeTab === 'shared'
                  ? "Buscar en compartidos conmigo..."
                  : activeTab === 'favorites'
                    ? "Buscar en favoritos..."
                    : "Buscar en publicaciones..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 shadow-2xs"
          />
        </div>
      </div>

      {/* TAB 1: MIS PRESENTACIONES (CON CARPETAS A LA IZQUIERDA) */}
      {activeTab === 'mine' && (
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Left: Folders Sidebar */}
          <FolderSidebar
            folders={folders}
            presentations={presentations}
            activeFolderId={activeFolderId}
            onSelectFolder={handleSelectFolder}
            onOpenCreateFolder={() => {
              setFolderToEdit(null);
              setIsFolderModalOpen(true);
            }}
            onOpenRenameFolder={(f) => {
              setFolderToEdit(f);
              setIsFolderModalOpen(true);
            }}
            onDeleteFolder={(fId) => {
              if (onDeleteFolder) {
                onDeleteFolder(fId);
                if (activeFolderId === fId) {
                  handleSelectFolder(null);
                }
                showToast('Carpeta eliminada correctamente');
              }
            }}
            onShareFolder={handleShareFolder}
            onDuplicateFolder={onDuplicateFolder}
          />

          {/* Right: Presentations Area */}
          <div className="flex-1 w-full min-w-0 space-y-4">
            {/* Active Folder Banner (if specific folder is selected) */}
            {activeFolderObj && (
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
                    <Folder className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <span>Carpeta: {activeFolderObj.name}</span>
                      <span className="text-[11px] font-semibold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200">
                        {filteredMyPresentations.length} {filteredMyPresentations.length === 1 ? 'presentación' : 'presentaciones'}
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Colección organizada. Puedes compartir un enlace público a toda esta carpeta.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleShareFolder(activeFolderObj)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 transition-all shadow-2xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Compartir Carpeta</span>
                </button>
              </div>
            )}

            {/* Grid of presentation cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {/* CREATE NEW PRESENTATION CARD */}
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                title="Crear nueva presentación"
                className="group min-h-[230px] bg-white border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer relative"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center shadow-xs transition-all duration-200 transform group-hover:scale-110">
                  <Plus className="w-8 h-8 stroke-[2.5]" />
                </div>
                <span className="mt-3 text-xs font-bold text-slate-600 group-hover:text-blue-600 transition-colors">
                  Crear Nueva Presentación
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  {activeFolderObj ? `En "${activeFolderObj.name}"` : 'Con 3 ventanas interactivas'}
                </span>
              </button>

              {/* User's Presentations */}
              {filteredMyPresentations.map((pres) => {
                const folderOfPres = folders.find(f => f.id === pres.folderId);
                const hasFolder = Boolean(pres.folderId);
                const folderDisplayName = pres.folderName || folderOfPres?.name;
                const isMoveOpen = moveMenuPresId === pres.id;

                return (
                  <div
                    key={pres.id}
                    onClick={() => onSelectPresentation(pres, false, activeFolderObj ? { id: activeFolderObj.id, name: activeFolderObj.name } : undefined)}
                    className="group min-h-[230px] bg-white border border-slate-200/90 hover:border-blue-400 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between relative"
                  >
                    {/* Top Row */}
                    <div>
                      {/* FOLDER INDICATOR (Requirement: "muestre arriba al lado del nombre, arriba del nombre de la clase y eso, si tiene carpeta o no, el logo de una carpeta si está en carpetas y el nombre de esa carpeta, si no que no aparezca ninguno, que no aparezca ningún nombre arriba") */}
                      {hasFolder && (
                        <div className="mb-2 flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50/90 px-2 py-0.5 rounded-md border border-blue-200 w-fit">
                          <Folder className="w-3 h-3 text-blue-600" />
                          <span className="truncate max-w-[180px]">{folderDisplayName}</span>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50/90 px-2.5 py-1 rounded-lg border border-blue-100 truncate max-w-[150px]">
                            {pres.subject}
                          </span>
                          {pres.isPublic && (
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                              <Globe className="w-2.5 h-2.5 text-blue-500" />
                              <span>Pública</span>
                            </span>
                          )}
                        </div>

                        {/* Top action buttons */}
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {/* Move to folder button */}
                          {onAssignPresentationFolder && folders.length > 0 && (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setMoveMenuPresId(isMoveOpen ? null : pres.id)}
                                title="Mover a otra carpeta"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              >
                                <Folder className="w-3.5 h-3.5" />
                              </button>

                              {isMoveOpen && (
                                <>
                                  <div className="fixed inset-0 z-30" onClick={() => setMoveMenuPresId(null)} />
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                      Mover a carpeta:
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMoveMenuPresId(null);
                                        onAssignPresentationFolder(pres.id, undefined, undefined);
                                        showToast('Presentación quitada de carpetas (Sin carpeta)');
                                      }}
                                      className={`w-full px-3 py-1.5 text-xs text-left font-medium hover:bg-slate-50 flex items-center justify-between cursor-pointer ${
                                        !pres.folderId ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'
                                      }`}
                                    >
                                      <span>Sin carpeta</span>
                                      {!pres.folderId && <Check className="w-3 h-3 text-blue-600" />}
                                    </button>

                                    {folders.map(f => (
                                      <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => {
                                          setMoveMenuPresId(null);
                                          onAssignPresentationFolder(pres.id, f.id, f.name);
                                          showToast(`Presentación movida a "${f.name}"`);
                                        }}
                                        className={`w-full px-3 py-1.5 text-xs text-left font-medium hover:bg-slate-50 flex items-center justify-between cursor-pointer ${
                                          pres.folderId === f.id ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'
                                        }`}
                                      >
                                        <span className="truncate">{f.name}</span>
                                        {pres.folderId === f.id && <Check className="w-3 h-3 text-blue-600" />}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          )}

                          {/* Duplicate button */}
                          {onDuplicatePresentation && (
                            <button
                              type="button"
                              onClick={() => {
                                onDuplicatePresentation(pres);
                                showToast('Copia creada en tus presentaciones');
                              }}
                              title="Duplicar presentación"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Share button */}
                          <button
                            type="button"
                            onClick={() => onOpenShareModal(pres)}
                            title="Compartir enlace y accesos"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => setPresentationToDelete(pres)}
                            title="Eliminar presentación"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Middle: Custom Logo + Title & Presenters */}
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

                    {/* Bottom metadata */}
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
                        <span>Abrir</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPARTIDOS CONMIGO */}
      {activeTab === 'shared' && (
        <div>
          {filteredSharedPresentations.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center max-w-lg mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                No tienes presentaciones compartidas con rol de edición
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Cuando el autor de una presentación te comparta un enlace de colaboración con <strong>permiso de editor</strong>, la presentación aparecerá aquí de forma permanente para que puedas verla y editarla en cualquier momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredSharedPresentations.map((pres) => (
                <div
                  key={pres.id}
                  onClick={() => onSelectPresentation(pres, false)}
                  className="group min-h-[250px] bg-white border border-slate-200/90 hover:border-blue-400 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between relative cursor-pointer"
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50/90 px-2.5 py-1 rounded-lg border border-blue-100 truncate max-w-[140px]">
                          {pres.subject}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Editor Permanente</span>
                        </span>
                      </div>
                      <PresentationIcon icon={pres.icon} size="md" />
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                      {pres.title}
                    </h3>

                    {/* Creator info */}
                    <div className="flex items-center gap-2 mt-3 p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">
                        Creado por: <strong className="text-slate-800">{pres.ownerName || pres.ownerEmail || 'Autor'}</strong>
                      </span>
                    </div>

                    {/* Counts */}
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium mt-3">
                      <div className="flex items-center gap-1.5">
                        <Presentation className="w-3.5 h-3.5 text-slate-400" />
                        <span>{pres.slides?.length || 0} diapositivas</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>{pres.quiz?.length || 0} preguntas</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions bar */}
                  <div className="pt-3.5 mt-3 border-t border-slate-100 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenShareModal(pres)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Compartir"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      {onDuplicatePresentation && (
                        <button
                          type="button"
                          onClick={() => {
                            onDuplicatePresentation(pres);
                            showToast('Copia creada en tus presentaciones');
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Duplicar en mis presentaciones"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectPresentation(pres, false)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Ver
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectPresentation(pres, true)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FAVORITOS (DOS SECCIONES A LA IZQUIERDA: 1. PRESENTACIONES, 2. CARPETAS) */}
      {activeTab === 'favorites' && (
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Left Sub-Sidebar / Selector */}
          <aside id="favorites-sidebar" className="w-full md:w-64 shrink-0 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Mis Favoritos
              </h3>
            </div>

            {/* Two selectable sections: Top = Presentations, Bottom = Folders */}
            <div className="space-y-1.5">
              {/* 1. Presentaciones (Arriba) */}
              <button
                type="button"
                onClick={() => setFavoriteViewType('presentations')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  favoriteViewType === 'presentations'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Presentation className={`w-4 h-4 shrink-0 ${favoriteViewType === 'presentations' ? 'text-white' : 'text-blue-600'}`} />
                  <span className="truncate">Presentaciones</span>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                  favoriteViewType === 'presentations' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {favoritePresentations.length}
                </span>
              </button>

              {/* 2. Carpetas (Abajo) */}
              <button
                type="button"
                onClick={() => setFavoriteViewType('folders')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  favoriteViewType === 'folders'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Folder className={`w-4 h-4 shrink-0 ${favoriteViewType === 'folders' ? 'text-white' : 'text-amber-500'}`} />
                  <span className="truncate">Carpetas</span>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                  favoriteViewType === 'folders' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {favoriteFolders.length}
                </span>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
              Selecciona arriba para ver las presentaciones guardadas o abajo para explorar las carpetas compartidas.
            </div>
          </aside>

          {/* Right Content Area */}
          <div className="flex-1 w-full min-w-0 space-y-4">
            {/* VIEW 1: PRESENTACIONES FAVORITAS */}
            {favoriteViewType === 'presentations' && (
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <Presentation className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-800">
                      Presentaciones Guardadas ({filteredFavoritePresentations.length})
                    </h3>
                  </div>
                </div>

                {filteredFavoritePresentations.length === 0 ? (
                  <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center max-w-lg mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                      <Presentation className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">
                      No tienes presentaciones en Favoritos
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Cuando explores presentaciones en la galería pública o mediante enlaces compartidos, pulsa el botón de la estrella (⭐) para tenerlas siempre accesibles aquí.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {filteredFavoritePresentations.map((pres) => (
                      <div
                        key={pres.id}
                        onClick={() => onSelectPresentation(pres, false)}
                        className="group min-h-[230px] bg-white border border-slate-200/90 hover:border-amber-400 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between relative"
                      >
                        {/* Top row */}
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="space-y-1">
                              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 truncate block max-w-[170px]">
                                {pres.subject}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                <Users className="w-2.5 h-2.5 text-blue-500" />
                                De: <strong className="text-slate-700">{pres.ownerName || 'Expositor'}</strong>
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              {/* Duplicate button: only if user has edit rights */}
                              {onDuplicatePresentation && canUserEditPres(pres) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDuplicatePresentation(pres);
                                    showToast('Copia creada en tus presentaciones');
                                  }}
                                  title="Duplicar en mis presentaciones"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Remove favorite button */}
                              {onToggleFavorite && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onToggleFavorite(pres.id);
                                    showToast('Presentación quitada de Favoritos');
                                  }}
                                  title="Quitar de Favoritos"
                                  className="p-1.5 rounded-lg text-amber-500 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer"
                                >
                                  <Star className="w-4 h-4 fill-amber-500" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => onOpenShareModal(pres)}
                                title="Compartir presentación"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Middle: Logo & Title */}
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

                        {/* Bottom: Counts & Open */}
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
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: CARPETAS FAVORITAS */}
            {favoriteViewType === 'folders' && (
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-slate-800">
                      Carpetas Guardadas ({favoriteFolders.length})
                    </h3>
                  </div>
                </div>

                {favoriteFolders.length === 0 ? (
                  <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center max-w-lg mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
                      <Folder className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">
                      No tienes carpetas en Favoritos
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Cuando abras el enlace público de una carpeta compartida por un profesor o colega, pulsa en "Guardar carpeta" para tenerla siempre listada aquí.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {favoriteFolders.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => onOpenSharedFolder && onOpenSharedFolder(f.id)}
                        className="group bg-white border border-slate-200/90 hover:border-amber-400 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                              Carpeta Compartida
                            </span>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              {onToggleFavoriteFolder && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onToggleFavoriteFolder(f.id);
                                    showToast('Carpeta quitada de Favoritos');
                                  }}
                                  title="Quitar de Favoritos"
                                  className="p-1.5 rounded-lg text-amber-500 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer"
                                >
                                  <Star className="w-4 h-4 fill-amber-500" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  const folderUrl = `${window.location.origin}${window.location.pathname}?folder=${f.id}`;
                                  navigator.clipboard.writeText(folderUrl);
                                  showToast('Enlace de carpeta copiado');
                                }}
                                title="Copiar enlace de la carpeta"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 my-2">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                              <Folder className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-base font-bold text-slate-800 group-hover:text-amber-600 transition-colors truncate">
                                {f.name}
                              </h4>
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <Users className="w-3 h-3 text-slate-400" />
                                <span>De: <strong>{f.ownerName || 'Profesor / Expositor'}</strong></span>
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-2">
                          <span className="text-[11px] font-medium text-slate-500">Colección compartida</span>
                          <div className="flex items-center gap-1 text-amber-600 font-semibold text-xs group-hover:translate-x-0.5 transition-transform">
                            <span>Abrir Carpeta</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PUBLICACIONES (GALERÍA PÚBLICA DE LA COMUNIDAD) */}
      {activeTab === 'public' && (
        <div>
          {filteredPublicPresentations.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center max-w-lg mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                No se encontraron publicaciones públicas
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Todas las presentaciones marcadas como públicas por profesores y alumnos aparecerán aquí para que toda la comunidad pueda explorar sus diapositivas, explicaciones y cuestionarios.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredPublicPresentations.map((pres) => {
                const isFav = Boolean(user.favoriteIds?.includes(pres.id));

                return (
                  <div
                    key={pres.id}
                    onClick={() => onSelectPresentation(pres)}
                    className="group min-h-[230px] bg-white border border-slate-200/90 hover:border-blue-400 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between relative"
                  >
                    {/* Top row: Subject + Public badge */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 truncate block max-w-[170px]">
                            {pres.subject}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                            <Users className="w-2.5 h-2.5 text-blue-500" />
                            De: <strong className="text-slate-700">{pres.ownerName || 'Expositor'}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {/* Duplicate button: only for owner/collaborators */}
                          {onDuplicatePresentation && canUserEditPres(pres) && (
                            <button
                              type="button"
                              onClick={() => {
                                onDuplicatePresentation(pres);
                                showToast('Copia creada en tus presentaciones');
                              }}
                              title="Duplicar en mis presentaciones"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Favorite button (for external items) */}
                          {onToggleFavorite && user.id !== pres.ownerId && (
                            <button
                              type="button"
                              onClick={() => {
                                onToggleFavorite(pres.id);
                                showToast(isFav ? 'Quitada de Favoritos' : 'Guardada en Favoritos');
                              }}
                              title={isFav ? "Quitar de Favoritos" : "Guardar en Favoritos"}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isFav ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'
                              }`}
                            >
                              <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-500' : ''}`} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onOpenShareModal(pres)}
                            title="Compartir presentación"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Middle: Custom Logo + Title & Presenters */}
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

                    {/* Bottom metadata: Read-only badge & Open */}
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
                        <span>Ver Publicación</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE PRESENTATION MODAL */}
      {isCreateModalOpen && (
        <div 
          onClick={() => setIsCreateModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150 my-8"
          >
            <form onSubmit={handleCreateSubmit}>
              <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Nueva Presentación
                  </h3>
                  <p className="text-xs text-slate-500">
                    Crea tu presentación con las 3 ventanas interactivas
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Title and Icon Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título de la Presentación *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsIconPickerOpen(true)}
                      title="Cambiar logo o ícono de la presentación"
                      className="p-1 rounded-xl border border-slate-200 hover:border-blue-400 transition-colors shrink-0 cursor-pointer"
                    >
                      <PresentationIcon icon={newIcon} size="md" />
                    </button>
                    <input
                      type="text"
                      required
                      placeholder="Rol del auxiliar en farmacia"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Toca el ícono a la izquierda para elegir el logo identificatorio de tu presentación.
                  </p>
                </div>

                {/* Folder Selector */}
                {folders.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5 text-blue-600" />
                      <span>Carpeta de Organización (Opcional)</span>
                    </label>
                    <select
                      value={newFolderId}
                      onChange={(e) => setNewFolderId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="">Sin carpeta (Directo en Mis Presentaciones)</option>
                      {folders.map(f => (
                        <option key={f.id} value={f.id}>
                          📁 {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Materia / Especialidad
                  </label>
                  <input
                    type="text"
                    placeholder="Ámbito farmacéutico"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Expositores / Nombres
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Juan Pérez o Juan Pérez y María López"
                    value={newPresenters}
                    onChange={(e) => setNewPresenters(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Puedes escribir nombres y apellidos libremente con espacios.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enlace de Google Slides (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://docs.google.com/presentation/d/.../edit"
                    value={newSlidesUrl}
                    onChange={(e) => setNewSlidesUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {/* Google Slides Permission Hint */}
                  <div className="mt-2.5 p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-800">
                      <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>¿Cómo permitir que otras personas vean tus diapositivas?</span>
                    </div>
                    <p className="text-amber-800/90 leading-relaxed pl-5">
                      En Google Slides ve a <strong>Compartir</strong> (arriba a la derecha) &gt; en <em>Acceso general</em> cambia a <strong>"Cualquier persona con el enlace" (Lector)</strong> o ve a <em>Archivo &gt; Compartir &gt; Publicar en la web</em>.
                    </p>
                  </div>
                </div>

                {/* Privacy Setting (Default: Private) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    {newIsPublic ? <Globe className="w-3.5 h-3.5 text-blue-600" /> : <Lock className="w-3.5 h-3.5 text-slate-600" />}
                    <span>Visibilidad y Privacidad (Por defecto: Privada)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewIsPublic(false)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2 ${
                        !newIsPublic
                          ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/15'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                      }`}
                    >
                      <div className={`p-1 rounded-md shrink-0 ${!newIsPublic ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        <Lock className="w-3 h-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold ${!newIsPublic ? 'text-blue-900' : 'text-slate-700'}`}>
                          Privada (Recomendado)
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                          Solo tú y las personas con enlace compartido acceden.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewIsPublic(true)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2 ${
                        newIsPublic
                          ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/15'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                      }`}
                    >
                      <div className={`p-1 rounded-md shrink-0 ${newIsPublic ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        <Globe className="w-3 h-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold ${newIsPublic ? 'text-blue-900' : 'text-slate-700'}`}>
                          Pública
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                          Aparece en la galería comunitaria para todos.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Crear Presentación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOLDER MODAL (CREATE OR RENAME) */}
      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => {
          setIsFolderModalOpen(false);
          setFolderToEdit(null);
        }}
        folderToEdit={folderToEdit}
        onSave={(name, color) => {
          if (folderToEdit && onRenameFolder) {
            onRenameFolder(folderToEdit.id, name, color);
            showToast(`Carpeta renombrada a "${name}"`);
          } else if (!folderToEdit && onCreateFolder) {
            onCreateFolder(name, color);
            showToast(`Carpeta "${name}" creada`);
          }
        }}
      />

      {/* ICON PICKER MODAL IN CREATION FORM */}
      <IconPickerModal
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        currentIcon={newIcon}
        onSelectIcon={(icon) => setNewIcon(icon)}
      />

      {/* DEDICATED CONFIRMATION MODAL FOR DELETING PRESENTATION */}
      <DeleteConfirmModal
        isOpen={!!presentationToDelete}
        onClose={() => setPresentationToDelete(null)}
        title={presentationToDelete?.title || ''}
        itemType="la presentación"
        onConfirm={() => {
          if (presentationToDelete) {
            onDeletePresentation(presentationToDelete.id);
            setPresentationToDelete(null);
          }
        }}
      />
    </div>
  );
};
