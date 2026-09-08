import React, { useState, useRef, useEffect } from 'react';
import { ActiveTab, AppView, UserProfile, AppNotification } from '../types';
import { 
  Presentation, 
  BookOpen, 
  HelpCircle, 
  GraduationCap, 
  ArrowLeft,
  Edit3, 
  Eye, 
  Share2,
  Check,
  LogOut,
  User,
  Mail,
  Star,
  Copy,
  Folder
} from 'lucide-react';
import { PresentationIcon } from './PresentationIcon';
import { NotificationsDropdown } from './NotificationsDropdown';

interface NavbarProps {
  view: AppView;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onBackToDashboard: () => void;
  backButtonLabel?: string;
  title: string;
  presentationIcon?: string;
  totalSlides: number;
  totalQuestions: number;
  currentUser?: UserProfile | null;
  isOwner: boolean;
  canEdit?: boolean;
  isEditMode: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onDuplicatePresentation?: () => void;
  onToggleEditMode: () => void;
  onOpenShareModal: () => void;
  onOpenAuthModal?: () => void;
  onCreateNewClick?: () => void;
  onUpdateUserName?: (newName: string) => void;
  onLogout?: () => void;
  notifications?: AppNotification[];
  onNavigateToComment?: (notification: AppNotification) => void;
  onMarkAllAsRead?: () => void;
  onDeleteNotification?: (notificationId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  view,
  activeTab,
  onSelectTab,
  onBackToDashboard,
  backButtonLabel,
  title,
  presentationIcon,
  totalSlides,
  totalQuestions,
  currentUser,
  isOwner,
  canEdit = isOwner,
  isEditMode,
  isFavorite,
  onToggleFavorite,
  onDuplicatePresentation,
  onToggleEditMode,
  onOpenShareModal,
  onOpenAuthModal,
  onCreateNewClick,
  onUpdateUserName,
  onLogout,
  notifications = [],
  onNavigateToComment,
  onMarkAllAsRead,
  onDeleteNotification
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInputValue, setNameInputValue] = useState(currentUser?.name || '');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNameInputValue(currentUser?.name || '');
  }, [currentUser?.name]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setIsEditingName(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInputValue.trim() && onUpdateUserName) {
      onUpdateUserName(nameInputValue.trim());
      setIsEditingName(false);
    }
  };
  return (
    <header id="main-navigation-bar" className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Left section: Brand or Back Button */}
          <div className="flex items-center gap-2.5 min-w-0">
            {view === 'presentation' ? (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200 shadow-2xs shrink-0 cursor-pointer"
                title={backButtonLabel ? `Volver: ${backButtonLabel}` : "Volver a la lista de presentaciones"}
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline font-medium">
                  {backButtonLabel || 'Mis Presentaciones'}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="bg-blue-600 p-2 rounded-lg text-white shadow-xs shrink-0 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-base font-bold text-slate-800 leading-tight truncate">
                    Presentaciones Farmacéuticas
                  </h1>
                </div>
              </div>
            )}

            {/* Presentation Title & Icon (When inside a presentation) */}
            {view === 'presentation' && (
              <div className="min-w-0 pl-1 border-l border-slate-200 hidden md:flex items-center gap-2">
                <PresentationIcon icon={presentationIcon} size="sm" />
                <h2 className="text-sm font-bold text-slate-800 leading-tight truncate max-w-[180px] lg:max-w-[260px]">
                  {title}
                </h2>
              </div>
            )}
          </div>

          {/* Center/Right section: 3 Tabs (When in presentation mode) */}
          {view === 'presentation' && (
            <nav className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
              {/* Window 1: Slides */}
              <button
                id="tab-btn-slides"
                type="button"
                onClick={() => onSelectTab('slides')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'slides'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Presentation className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="hidden md:inline">1. Diapositivas</span>
                <span className="md:hidden">Slides</span>
              </button>

              {/* Window 2: Detailed Explanation */}
              <button
                id="tab-btn-explanation"
                type="button"
                onClick={() => onSelectTab('explanation')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'explanation'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="hidden md:inline">2. Explicación a Detalle</span>
                <span className="md:hidden">Guía</span>
              </button>

              {/* Window 3: Q&A / Quiz */}
              <button
                id="tab-btn-quiz"
                type="button"
                onClick={() => onSelectTab('quiz')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'quiz'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="hidden md:inline">3. Preguntas y Respuestas</span>
                <span className="md:hidden">Quiz</span>
              </button>
            </nav>
          )}

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {view === 'presentation' ? (
              <>
                {/* Small Share Button */}
                <button
                  type="button"
                  onClick={onOpenShareModal}
                  title="Compartir enlace de visualización"
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Compartir</span>
                </button>

                {/* DUPLICATE BUTTON (Only for users with edit rights: owners or assigned editors) */}
                {currentUser && canEdit && onDuplicatePresentation && (
                  <button
                    type="button"
                    onClick={onDuplicatePresentation}
                    title="Duplicar presentación y guardarla en mis presentaciones"
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden xl:inline">Duplicar</span>
                  </button>
                )}

                {/* FAVORITE BUTTON (When logged in and not the owner) */}
                {currentUser && !isOwner && onToggleFavorite && (
                  <button
                    type="button"
                    onClick={onToggleFavorite}
                    title={isFavorite ? "Quitar de Favoritos" : "Guardar en Favoritos"}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shadow-2xs border cursor-pointer ${
                      isFavorite
                        ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${isFavorite ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                    <span className="hidden sm:inline">{isFavorite ? 'En Favoritos' : 'Favorito'}</span>
                  </button>
                )}

                {/* SMALL EDIT BUTTON (Owner or Collaborator with edit rights) */}
                {canEdit && (
                  <button
                    type="button"
                    onClick={onToggleEditMode}
                    title={isEditMode ? "Salir de modo edición" : "Editar contenido de la presentación"}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shadow-2xs border ${
                      isEditMode
                        ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {isEditMode ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Viendo Edición</span>
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Editar</span>
                      </>
                    )}
                  </button>
                )}
              </>
            ) : null}

            {/* Notifications Bell Dropdown */}
            {currentUser && onNavigateToComment && (
              <NotificationsDropdown
                notifications={notifications}
                onNavigateToComment={onNavigateToComment}
                onMarkAllAsRead={onMarkAllAsRead || (() => {})}
                onDeleteNotification={onDeleteNotification || (() => {})}
              />
            )}

            {/* User Profile Avatar & Dropdown Menu */}
            {currentUser && (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  title={currentUser.email || currentUser.name}
                  className="rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all cursor-pointer block"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.name || 'Perfil'}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center shadow-2xs transition-colors">
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-3 px-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                    {/* User Info Header */}
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt={currentUser.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                          {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {currentUser.name || 'Usuario'}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5" title={currentUser.email}>
                          {currentUser.email}
                        </p>
                      </div>
                    </div>

                    {/* Adjust Name Section */}
                    <div className="py-3 border-b border-slate-100">
                      {!isEditingName ? (
                        <button
                          type="button"
                          onClick={() => setIsEditingName(true)}
                          className="w-full py-1.5 px-2 text-left text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-between"
                        >
                          <span>Ajustar nombre</span>
                          <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Cambiar</span>
                        </button>
                      ) : (
                        <form onSubmit={handleSaveName} className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                            Nuevo nombre
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={nameInputValue}
                              onChange={(e) => setNameInputValue(e.target.value)}
                              placeholder="Tu nombre..."
                              className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              autoFocus
                            />
                            <button
                              type="submit"
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shrink-0"
                            >
                              Guardar
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsEditingName(false)}
                            className="text-[11px] text-slate-400 hover:text-slate-600"
                          >
                            Cancelar
                          </button>
                        </form>
                      )}
                    </div>

                    {/* Logout Option */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          if (onLogout) onLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
