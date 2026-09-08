import React, { useState } from 'react';
import { SectionComment } from '../types';
import { 
  MessageSquare, 
  Send, 
  CornerDownRight, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck,
  User,
  Clock
} from 'lucide-react';

interface CommentsSectionProps {
  section: 'slides' | 'explanation' | 'quiz';
  sectionTitle: string;
  comments: SectionComment[];
  currentUserId: string;
  currentUserName: string;
  currentUserPhoto?: string;
  currentUserEmail?: string;
  ownerId: string;
  ownerName?: string;
  targetCommentId?: string;
  onAddComment: (section: 'slides' | 'explanation' | 'quiz', text: string) => void;
  onReplyComment: (commentId: string, replyText: string) => void;
  onDeleteComment?: (commentId: string) => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  section,
  sectionTitle,
  comments,
  currentUserId,
  currentUserName,
  currentUserPhoto,
  ownerId,
  ownerName,
  targetCommentId,
  onAddComment,
  onReplyComment,
  onDeleteComment
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const isOwner = currentUserId === ownerId;
  const sectionComments = (comments || []).filter(c => c.section === section);

  // Auto-expand if target comment is in this section
  React.useEffect(() => {
    if (targetCommentId) {
      const hasTarget = sectionComments.some(c => c.id === targetCommentId);
      if (hasTarget) {
        setIsExpanded(true);
      }
    }
  }, [targetCommentId, sectionComments]);

  // Scroll to targeted comment smoothly
  React.useEffect(() => {
    if (targetCommentId && isExpanded) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`comment-${targetCommentId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [targetCommentId, isExpanded]);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    onAddComment(section, newCommentText.trim());
    setNewCommentText('');
  };

  const handlePostReply = (commentId: string) => {
    if (!replyText.trim()) return;
    onReplyComment(commentId, replyText.trim());
    setReplyText('');
    setReplyingToId(null);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="mt-8 border border-slate-200/90 bg-white rounded-2xl overflow-hidden shadow-2xs transition-all duration-200">
      {/* Collapsible Header Bar: Discrete & Clean */}
      <button
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>Comentarios y Aportes sobre {sectionTitle}</span>
              <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                {sectionComments.length}
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Espacio para resolver dudas y retroalimentación académica.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-xs font-medium hidden sm:inline text-slate-500">
            {isExpanded ? 'Ocultar' : 'Ver comentarios'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Expanded Comments Content */}
      {isExpanded && (
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/40 space-y-4 animate-in fade-in duration-150">
          {/* Add New Comment Box */}
          <form onSubmit={handlePostComment} className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5">
              {currentUserPhoto ? (
                <img
                  src={currentUserPhoto}
                  alt={currentUserName}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  {currentUserName ? currentUserName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <span className="text-xs font-bold text-slate-700">
                {currentUserName}
              </span>
              {isOwner && (
                <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">
                  Autor
                </span>
              )}
            </div>

            <textarea
              rows={2}
              required
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder={`Deja un comentario o pregunta sobre ${sectionTitle.toLowerCase()}...`}
              className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publicar comentario</span>
              </button>
            </div>
          </form>

          {/* List of Comments */}
          <div className="space-y-3 pt-1">
            {sectionComments.length === 0 ? (
              <div className="text-center py-6 bg-white/70 border border-dashed border-slate-200 rounded-xl">
                <MessageSquare className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs font-medium text-slate-500">
                  No hay comentarios aún en esta sección.
                </p>
                <p className="text-[11px] text-slate-400">
                  Cualquier participante puede dejar preguntas o aportes aquí.
                </p>
              </div>
            ) : (
              sectionComments.map((comment) => {
                const canDelete = currentUserId === comment.authorId || isOwner;
                const isTargeted = comment.id === targetCommentId;
                return (
                  <div 
                    key={comment.id}
                    id={`comment-${comment.id}`}
                    className={`rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-2.5 transition-all duration-300 ${
                      isTargeted
                        ? 'bg-blue-50/60 border-2 border-blue-500 ring-2 ring-blue-200'
                        : 'bg-white border border-slate-200/90'
                    }`}
                  >
                    {/* Comment Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {comment.authorPhotoURL ? (
                          <img
                            src={comment.authorPhotoURL}
                            alt={comment.authorName}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {comment.authorName ? comment.authorName.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">
                              {comment.authorName}
                            </span>
                            {comment.authorId === ownerId && (
                              <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                                Dueño
                              </span>
                            )}
                            {isTargeted && (
                              <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                                Comentario notificado
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Delete comment */}
                      {canDelete && onDeleteComment && (
                        <button
                          type="button"
                          onClick={() => onDeleteComment(comment.id)}
                          title="Eliminar comentario"
                          className="text-slate-300 hover:text-rose-600 p-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Comment Body */}
                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed pl-9">
                      {comment.text}
                    </p>

                    {/* Owner Reply if exists */}
                    {comment.reply && (
                      <div className="ml-8 mt-2 pl-3.5 border-l-2 border-blue-500 bg-blue-50/50 rounded-r-xl p-2.5 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {comment.reply.authorPhotoURL ? (
                              <img
                                src={comment.reply.authorPhotoURL}
                                alt={comment.reply.authorName}
                                referrerPolicy="no-referrer"
                                className="w-5 h-5 rounded-full object-cover border border-blue-200 shrink-0"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                {comment.reply.authorName ? comment.reply.authorName.charAt(0).toUpperCase() : 'A'}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-blue-950">
                                {comment.reply.authorName}
                              </span>
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                                Autor
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {formatDate(comment.reply.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed pl-7">
                          {comment.reply.text}
                        </p>
                      </div>
                    )}

                    {/* Reply button: ONLY visible to presentation owner */}
                    {isOwner && !comment.reply && replyingToId !== comment.id && (
                      <div className="pl-9 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingToId(comment.id);
                            setReplyText('');
                          }}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                        >
                          <CornerDownRight className="w-3.5 h-3.5" />
                          <span>Responder como autor</span>
                        </button>
                      </div>
                    )}

                    {/* Reply form: ONLY visible to owner when replying */}
                    {isOwner && replyingToId === comment.id && (
                      <div className="ml-8 mt-2 p-3 bg-blue-50/40 border border-blue-200 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800">
                          <CornerDownRight className="w-3.5 h-3.5" />
                          <span>Respuesta del Autor:</span>
                        </div>
                        <textarea
                          rows={2}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Escribe tu respuesta a este comentario..."
                          className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setReplyingToId(null)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-xs font-medium"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePostReply(comment.id)}
                            disabled={!replyText.trim()}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold disabled:opacity-50"
                          >
                            Publicar respuesta
                          </button>
                        </div>
                      </div>
                    )}
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
