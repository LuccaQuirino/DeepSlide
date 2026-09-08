import React, { useState, useRef, useEffect } from 'react';
import { AppNotification } from '../types';
import { 
  Bell, 
  Presentation, 
  BookOpen, 
  HelpCircle, 
  CheckCheck, 
  Trash2, 
  ChevronRight, 
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface NotificationsDropdownProps {
  notifications: AppNotification[];
  onNavigateToComment: (notification: AppNotification) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (notificationId: string) => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  notifications,
  onNavigateToComment,
  onMarkAllAsRead,
  onDeleteNotification
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getSectionBadge = (section: 'slides' | 'explanation' | 'quiz') => {
    switch (section) {
      case 'slides':
        return {
          label: 'Diapositivas',
          icon: <Presentation className="w-3.5 h-3.5 text-blue-600" />,
          bgColor: 'bg-blue-50 text-blue-700 border-blue-200'
        };
      case 'explanation':
        return {
          label: 'Explicación a Detalle',
          icon: <BookOpen className="w-3.5 h-3.5 text-emerald-600" />,
          bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
      case 'quiz':
        return {
          label: 'Preguntas y Dudas',
          icon: <HelpCircle className="w-3.5 h-3.5 text-violet-600" />,
          bgColor: 'bg-violet-50 text-violet-700 border-violet-200'
        };
      default:
        return {
          label: 'Presentación',
          icon: <MessageSquare className="w-3.5 h-3.5 text-slate-600" />,
          bgColor: 'bg-slate-50 text-slate-700 border-slate-200'
        };
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const now = new Date();
      const past = new Date(isoString);
      const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

      if (diffInSeconds < 60) return 'Hace un momento';
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `Hace ${diffInHours} h`;
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `Hace ${diffInDays} d`;

      return past.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        id="notifications-bell-btn"
        onClick={() => setIsOpen(prev => !prev)}
        title={unreadCount > 0 ? `${unreadCount} notificaciones nuevas` : 'Notificaciones'}
        className={`relative p-2 rounded-xl transition-all border cursor-pointer ${
          isOpen
            ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-xs'
            : unreadCount > 0
              ? 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50/70 shadow-2xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 shadow-2xs'
        }`}
      >
        <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white shadow-xs animate-in zoom-in-50 duration-200">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-0 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-800">
                Notificaciones
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                  {unreadCount} nueva{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Marcar leídas</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                  <MessageSquare className="w-6 h-6 stroke-[1.5]" />
                </div>
                <p className="text-xs font-bold text-slate-700">
                  Sin comentarios recientes
                </p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Cuando alguien comente en tus diapositivas, explicaciones o dudas, recibirás el aviso exacto aquí.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const badge = getSectionBadge(notif.section);
                return (
                  <div
                    key={notif.id}
                    className={`p-3.5 transition-colors relative group ${
                      !notif.read ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {/* Unread indicator bar */}
                    {!notif.read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r" />
                    )}

                    <div className="flex items-start gap-3">
                      {/* Author Avatar */}
                      {notif.authorPhotoURL ? (
                        <img
                          src={notif.authorPhotoURL}
                          alt={notif.authorName}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          {notif.authorName ? notif.authorName.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        {/* Who commented */}
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {notif.authorName}
                            <span className="font-normal text-slate-500"> comentó</span>
                          </p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                            {formatRelativeTime(notif.createdAt)}
                          </span>
                        </div>

                        {/* Presentation Title */}
                        <p className="text-[11px] font-semibold text-slate-700 truncate mt-0.5 flex items-center gap-1">
                          <span className="text-slate-400 font-normal">en:</span>
                          <span className="truncate">{notif.presentationTitle}</span>
                        </p>

                        {/* Section / Screen Badge */}
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.bgColor}`}>
                            {badge.icon}
                            <span>{badge.label}</span>
                          </span>
                        </div>

                        {/* Comment excerpt */}
                        <div className="mt-2 text-xs text-slate-700 bg-white/90 border border-slate-200/80 rounded-lg p-2 font-medium italic line-clamp-2 shadow-2xs">
                          "{notif.commentText}"
                        </div>

                        {/* Bottom action: Go to comment and reply */}
                        <div className="mt-2 flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsOpen(false);
                              onNavigateToComment(notif);
                            }}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>Ir al comentario y responder</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteNotification(notif.id);
                            }}
                            title="Eliminar notificación"
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
