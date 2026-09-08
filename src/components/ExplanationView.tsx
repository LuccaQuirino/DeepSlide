import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { PresentationData, SlideContent, UserProfile, CardSection, SectionContentType } from '../types';
import { 
  BookOpen, 
  Search, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  X, 
  ArrowUpRight,
  ListPlus,
  ListOrdered,
  ChevronDown,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown,
  Sparkles,
  Type,
  List,
  Layers,
  ArrowDown,
  ArrowUp,
  Bold,
  Italic,
  Quote,
  PlusCircle
} from 'lucide-react';
import { AutoResizeTextarea } from './AutoResizeTextarea';
import { CommentsSection } from './CommentsSection';

interface ExplanationViewProps {
  data: PresentationData;
  currentUser: UserProfile;
  targetCommentId?: string;
  onNavigateToSlide: (slideNumber: number) => void;
  onNavigateToQuiz: () => void;
  onUpdateSlide?: (updatedSlide: SlideContent) => void;
  onAddSlide?: (newSlide: SlideContent) => void;
  onDeleteSlide?: (slideId: string) => void;
  onAddComment: (section: 'slides' | 'explanation' | 'quiz', text: string) => void;
  onReplyComment: (commentId: string, replyText: string) => void;
  onDeleteComment?: (commentId: string) => void;
  isAdmin?: boolean;
}

// Helper to get or synthesize customizable sections for a slide
export function getSlideSections(slide: SlideContent): CardSection[] {
  if (slide.sections && slide.sections.length > 0) {
    return slide.sections;
  }

  // Synthesize backwards-compatible initial sections
  const initial: CardSection[] = [];
  
  if (slide.fullExplanation) {
    initial.push({
      id: `sec-expl-${slide.id}`,
      title: 'Desarrollo del Tema',
      type: 'paragraph',
      content: slide.fullExplanation
    });
  }

  if (slide.keyPoints && slide.keyPoints.length > 0) {
    initial.push({
      id: `sec-kp-${slide.id}`,
      title: 'Puntos Clave',
      type: 'bullets',
      content: slide.keyPoints.join('\n')
    });
  }

  if (slide.practicalExamples && slide.practicalExamples.length > 0) {
    initial.push({
      id: `sec-ex-${slide.id}`,
      title: 'Ejemplos y Casos Prácticos',
      type: 'callout',
      content: slide.practicalExamples.join('\n')
    });
  }

  if (slide.keyTerms && slide.keyTerms.length > 0) {
    initial.push({
      id: `sec-terms-${slide.id}`,
      title: 'Conceptos Relevantes',
      type: 'terms',
      content: slide.keyTerms.map(t => `${t.term}: ${t.definition}`).join('\n')
    });
  }

  if (initial.length === 0) {
    initial.push({
      id: `sec-default-${Date.now()}`,
      title: 'Explicación del Tema',
      type: 'paragraph',
      content: 'Escribe la explicación a detalle usando markdown...'
    });
  }

  return initial;
}

export const ExplanationView: React.FC<ExplanationViewProps> = ({
  data,
  currentUser,
  targetCommentId,
  onNavigateToQuiz,
  onUpdateSlide,
  onAddSlide,
  onDeleteSlide,
  onAddComment,
  onReplyComment,
  onDeleteComment,
  isAdmin = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeModalCard, setActiveModalCard] = useState<SlideContent | null>(null);
  const [collapsedCards, setCollapsedCards] = useState<Set<string>>(new Set());

  const toggleCollapseCard = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCollapsedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleCollapseAll = () => {
    if (collapsedCards.size === data.slides.length) {
      setCollapsedCards(new Set());
    } else {
      setCollapsedCards(new Set(data.slides.map(s => s.id)));
    }
  };

  const handleAddNewCard = () => {
    if (!onAddSlide) return;
    const newNumber = data.slides.length + 1;
    const newSlide: SlideContent = {
      id: `slide-${Date.now()}`,
      slideNumber: newNumber,
      title: `${newNumber}. Nuevo Tema o Sección`,
      shortDescription: 'Resumen conciso de este punto para la tarjeta.',
      fullExplanation: 'Desarrollo conceptual completo y detallado del tema.',
      keyPoints: ['Punto clave 1: Definición', 'Punto clave 2: Mecanismo o aplicación'],
      practicalExamples: ['Ejemplo o caso clínico aplicable'],
      keyTerms: [],
      sections: [
        {
          id: `sec-${Date.now()}-1`,
          title: 'Desarrollo del Tema',
          type: 'paragraph',
          content: 'Desarrollo conceptual detallado. Puedes usar **negrita**, *cursiva* y citas.'
        },
        {
          id: `sec-${Date.now()}-2`,
          title: 'Puntos Clave',
          type: 'bullets',
          content: 'Punto clave 1: Fundamento esencial\nPunto clave 2: Aplicación en la práctica'
        },
        {
          id: `sec-${Date.now()}-3`,
          title: 'Ejemplo Práctico',
          type: 'callout',
          content: 'Caso clínico o recomendación clave para recordar.'
        }
      ]
    };
    onAddSlide(newSlide);
  };

  const handleFieldChange = (slide: SlideContent, field: keyof SlideContent, value: any) => {
    if (!onUpdateSlide) return;
    const updated = {
      ...slide,
      [field]: value
    };
    onUpdateSlide(updated);
  };

  // Sections management for a slide
  const handleUpdateSection = (slide: SlideContent, sectionId: string, updates: Partial<CardSection>) => {
    if (!onUpdateSlide) return;
    const currentSections = getSlideSections(slide);
    const updatedSections = currentSections.map(sec => 
      sec.id === sectionId ? { ...sec, ...updates } : sec
    );

    // Keep top-level legacy fields synchronized
    const fullExplSec = updatedSections.find(s => s.type === 'paragraph');
    const kpSec = updatedSections.find(s => s.type === 'bullets');
    const exSec = updatedSections.find(s => s.type === 'callout');

    const updatedSlide: SlideContent = {
      ...slide,
      sections: updatedSections,
      fullExplanation: fullExplSec ? fullExplSec.content : slide.fullExplanation,
      keyPoints: kpSec ? kpSec.content.split('\n').filter(Boolean) : slide.keyPoints,
      practicalExamples: exSec ? exSec.content.split('\n').filter(Boolean) : slide.practicalExamples
    };
    onUpdateSlide(updatedSlide);
  };

  const handleAddSectionToSlide = (slide: SlideContent, type: SectionContentType = 'paragraph') => {
    if (!onUpdateSlide) return;
    const currentSections = getSlideSections(slide);
    const defaultTitles: Record<SectionContentType, string> = {
      paragraph: 'Nueva Explicación',
      bullets: 'Lista de Puntos',
      numbered: 'Índice de Pasos',
      callout: 'Nota Destacada / Alerta',
      terms: 'Conceptos y Términos'
    };

    const newSec: CardSection = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: defaultTitles[type] || 'Nueva Sección',
      type,
      content: ''
    };

    const updatedSections = [...currentSections, newSec];
    onUpdateSlide({
      ...slide,
      sections: updatedSections
    });
  };

  const handleDeleteSection = (slide: SlideContent, sectionId: string) => {
    if (!onUpdateSlide) return;
    const currentSections = getSlideSections(slide);
    if (currentSections.length <= 1) return;
    const updatedSections = currentSections.filter(s => s.id !== sectionId);
    onUpdateSlide({
      ...slide,
      sections: updatedSections
    });
  };

  const handleMoveSection = (slide: SlideContent, index: number, direction: 'up' | 'down') => {
    if (!onUpdateSlide) return;
    const currentSections = [...getSlideSections(slide)];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentSections.length) return;

    const temp = currentSections[index];
    currentSections[index] = currentSections[targetIndex];
    currentSections[targetIndex] = temp;

    onUpdateSlide({
      ...slide,
      sections: currentSections
    });
  };

  const handleDelete = (slideId: string) => {
    if (confirm('¿Eliminar esta tarjeta de explicación?')) {
      if (onDeleteSlide) {
        onDeleteSlide(slideId);
        if (activeModalCard && activeModalCard.id === slideId) {
          setActiveModalCard(null);
        }
      }
    }
  };

  const filteredSlides = data.slides.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.shortDescription && s.shortDescription.toLowerCase().includes(searchTerm.toLowerCase())) ||
    s.fullExplanation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.sections && s.sections.some(sec => 
      sec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sec.content.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  const areAllCollapsed = data.slides.length > 0 && collapsedCards.size === data.slides.length;

  return (
    <div id="explanation-view-root" className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white shadow-xs shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
              Explicación en Detalle
            </h2>
            <p className="text-xs text-slate-500">
              {isAdmin 
                ? 'Modo Edición: Personaliza títulos de sección, tipos de contenido (párrafo, viñetas, índice, notas) y formato markdown.'
                : 'Toca cualquier tarjeta para abrir su contenido completo y secciones organizadas.'}
            </p>
          </div>
        </div>

        {/* Action buttons in header */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-36 sm:w-48"
            />
          </div>

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={toggleCollapseAll}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                title={areAllCollapsed ? "Desplegar todas las tarjetas" : "Ocultar contenido de todas"}
              >
                {areAllCollapsed ? (
                  <>
                    <ChevronsUpDown className="w-3.5 h-3.5 text-blue-600" />
                    <span>Expandir Todas</span>
                  </>
                ) : (
                  <>
                    <ChevronsDownUp className="w-3.5 h-3.5 text-slate-600" />
                    <span>Colapsar Todas</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleAddNewCard}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Tarjeta</span>
              </button>
            </>
          )}

          <button
            onClick={onNavigateToQuiz}
            className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Ir a Preguntas</span>
          </button>
        </div>
      </div>

      {/* CARDS LIST / GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {filteredSlides.map((slide) => {
          const isCollapsed = collapsedCards.has(slide.id);
          const sections = getSlideSections(slide);

          return (
            <div
              key={slide.id}
              className={`bg-white border rounded-xl p-4 sm:p-5 shadow-2xs transition-all duration-150 flex flex-col justify-between relative ${
                isAdmin 
                  ? 'border-emerald-200 ring-1 ring-emerald-500/10' 
                  : 'border-slate-200/90 hover:border-blue-400 hover:shadow-sm cursor-pointer'
              }`}
              onClick={() => {
                if (!isAdmin) setActiveModalCard(slide);
              }}
            >
              {isAdmin ? (
                /* ================= DIRECT INLINE EDITING FOR CARD ================= */
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Tarjeta #{slide.slideNumber}
                      </span>

                      {/* Accordion / Collapse Dropdown toggle button */}
                      <button
                        type="button"
                        onClick={(e) => toggleCollapseCard(slide.id, e)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] font-medium transition-colors flex items-center gap-1"
                        title={isCollapsed ? "Mostrar campos de edición" : "Ocultar contenido para ordenar la vista"}
                      >
                        {isCollapsed ? (
                          <>
                            <ChevronDown className="w-3 h-3 text-emerald-600" />
                            <span>Mostrar detalle</span>
                          </>
                        ) : (
                          <>
                            <ChevronUp className="w-3 h-3 text-slate-500" />
                            <span>Ocultar</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    {data.slides.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDelete(slide.id)}
                        title="Eliminar tarjeta"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Title input (Always visible) */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                      Título del Tema
                    </label>
                    <AutoResizeTextarea
                      rows={1}
                      value={slide.title}
                      onChange={(e) => handleFieldChange(slide, 'title', e.target.value)}
                      placeholder="Ej: 1. Introducción y Fundamentos"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white"
                    />
                  </div>

                  {/* Collapsible content container */}
                  {isCollapsed ? (
                    <div 
                      onClick={(e) => toggleCollapseCard(slide.id, e)}
                      className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center cursor-pointer hover:bg-slate-100/70 transition-colors"
                    >
                      <p className="text-xs text-slate-500 font-medium">
                        Contenido plegado ({sections.length} secciones) • Clic para desplegar campos
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {slide.shortDescription || slide.fullExplanation.slice(0, 80) + '...'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-100">
                      {/* Short Subtitle / Description input */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                          Descripción Breve (Subtítulo)
                        </label>
                        <AutoResizeTextarea
                          rows={1}
                          value={slide.shortDescription || ''}
                          onChange={(e) => handleFieldChange(slide, 'shortDescription', e.target.value)}
                          placeholder="Resumen para vista rápida..."
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white"
                        />
                      </div>

                      {/* SECTIONS LIST FOR THIS CARD */}
                      <div className="space-y-3 pt-1 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                            <Layers className="w-3 h-3 text-blue-600" />
                            <span>Secciones de la Tarjeta ({sections.length})</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Soporta Markdown (**negrita**, *cursiva*)
                          </span>
                        </div>

                        {sections.map((sec, secIdx) => (
                          <div 
                            key={sec.id}
                            className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2"
                          >
                            {/* Section top toolbar */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                                <input
                                  type="text"
                                  value={sec.title}
                                  onChange={(e) => handleUpdateSection(slide, sec.id, { title: e.target.value })}
                                  placeholder="Título de la sección"
                                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full"
                                />
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {/* Type selector dropdown */}
                                <select
                                  value={sec.type}
                                  onChange={(e) => handleUpdateSection(slide, sec.id, { type: e.target.value as SectionContentType })}
                                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                >
                                  <option value="paragraph">📝 Párrafo (Markdown)</option>
                                  <option value="bullets">📋 Lista con viñetas</option>
                                  <option value="numbered">🔢 Índice / Numerado</option>
                                  <option value="callout">💡 Nota Destacada</option>
                                  <option value="terms">📖 Glosario / Términos</option>
                                </select>

                                {/* Move Up/Down */}
                                <button
                                  type="button"
                                  disabled={secIdx === 0}
                                  onClick={() => handleMoveSection(slide, secIdx, 'up')}
                                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-200/60"
                                  title="Subir sección"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={secIdx === sections.length - 1}
                                  onClick={() => handleMoveSection(slide, secIdx, 'down')}
                                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-200/60"
                                  title="Bajar sección"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>

                                {sections.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSection(slide, sec.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                                    title="Eliminar sección"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Markdown helper buttons */}
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <span>Formato:</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateSection(slide, sec.id, { content: sec.content + ' **texto negrita**' })}
                                className="px-1.5 py-0.5 bg-white border border-slate-200 rounded hover:bg-slate-100 font-bold text-slate-600"
                              >
                                B
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateSection(slide, sec.id, { content: sec.content + ' *texto cursiva*' })}
                                className="px-1.5 py-0.5 bg-white border border-slate-200 rounded hover:bg-slate-100 italic text-slate-600"
                              >
                                I
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateSection(slide, sec.id, { content: sec.content + '\n> Cita o nota importante' })}
                                className="px-1.5 py-0.5 bg-white border border-slate-200 rounded hover:bg-slate-100 text-slate-600"
                              >
                                &gt; Cita
                              </button>
                            </div>

                            {/* Section content textarea */}
                            <AutoResizeTextarea
                              rows={sec.type === 'paragraph' ? 3 : 2}
                              value={sec.content}
                              onChange={(e) => handleUpdateSection(slide, sec.id, { content: e.target.value })}
                              placeholder={
                                sec.type === 'bullets' 
                                  ? "Escribe un punto clave por línea..." 
                                  : sec.type === 'numbered' 
                                    ? "1. Paso o tema inicial\n2. Siguiente paso del índice..." 
                                    : sec.type === 'terms'
                                      ? "Término: Definición del concepto..."
                                      : "Escribe la explicación a detalle usando markdown..."
                              }
                              className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
                            />
                          </div>
                        ))}

                        {/* Enhanced Add Section Block */}
                        <div className="pt-3 border-t border-slate-200/90 mt-3">
                          <div className="bg-gradient-to-b from-blue-50/70 to-slate-50/90 border border-blue-200/80 rounded-xl p-3 sm:p-3.5 space-y-2.5 shadow-2xs">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-2xs">
                                  <PlusCircle className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-bold text-slate-800">
                                  Agregar nueva sección a esta tarjeta
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 hidden sm:inline">
                                Elige el formato:
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleAddSectionToSlide(slide, 'paragraph')}
                                className="px-3 py-2 bg-white hover:bg-blue-50/80 hover:border-blue-300 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:text-blue-700 transition-all flex items-center gap-2 shadow-2xs cursor-pointer group"
                              >
                                <div className="p-1 bg-blue-50 group-hover:bg-blue-100 rounded text-blue-600">
                                  <Type className="w-3.5 h-3.5" />
                                </div>
                                <span className="truncate">Párrafo (Texto)</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAddSectionToSlide(slide, 'bullets')}
                                className="px-3 py-2 bg-white hover:bg-emerald-50/80 hover:border-emerald-300 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:text-emerald-700 transition-all flex items-center gap-2 shadow-2xs cursor-pointer group"
                              >
                                <div className="p-1 bg-emerald-50 group-hover:bg-emerald-100 rounded text-emerald-600">
                                  <List className="w-3.5 h-3.5" />
                                </div>
                                <span className="truncate">Puntos Clave</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAddSectionToSlide(slide, 'numbered')}
                                className="px-3 py-2 bg-white hover:bg-indigo-50/80 hover:border-indigo-300 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:text-indigo-700 transition-all flex items-center gap-2 shadow-2xs cursor-pointer group"
                              >
                                <div className="p-1 bg-indigo-50 group-hover:bg-indigo-100 rounded text-indigo-600">
                                  <ListOrdered className="w-3.5 h-3.5" />
                                </div>
                                <span className="truncate">Índice / Pasos</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAddSectionToSlide(slide, 'callout')}
                                className="px-3 py-2 bg-white hover:bg-amber-50/80 hover:border-amber-300 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:text-amber-700 transition-all flex items-center gap-2 shadow-2xs cursor-pointer group"
                              >
                                <div className="p-1 bg-amber-50 group-hover:bg-amber-100 rounded text-amber-600">
                                  <Sparkles className="w-3.5 h-3.5" />
                                </div>
                                <span className="truncate">Nota Destacada</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAddSectionToSlide(slide, 'terms')}
                                className="px-3 py-2 bg-white hover:bg-purple-50/80 hover:border-purple-300 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:text-purple-700 transition-all flex items-center gap-2 shadow-2xs cursor-pointer group col-span-2 sm:col-span-1"
                              >
                                <div className="p-1 bg-purple-50 group-hover:bg-purple-100 rounded text-purple-600">
                                  <Layers className="w-3.5 h-3.5" />
                                </div>
                                <span className="truncate">Glosario / Términos</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ================= CLEAN SPECTATOR / READING VIEW ================= */
                <>
                  <div className="space-y-1.5 pr-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-snug">
                        {slide.title}
                      </h3>
                      <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {slide.shortDescription || slide.fullExplanation.slice(0, 120) + '...'}
                    </p>

                    {/* Preview of section tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {sections.slice(0, 3).map((s, i) => (
                        <span 
                          key={i}
                          className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md truncate max-w-[140px]"
                        >
                          {s.title}
                        </span>
                      ))}
                      {sections.length > 3 && (
                        <span className="text-[10px] text-slate-400 font-medium self-center">
                          +{sections.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-blue-600 font-medium">
                    <span>Ver explicación completa ({sections.length} secciones)</span>
                    <span className="text-slate-400 text-[10px]">Toca para abrir</span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {filteredSlides.length === 0 && (
        <div className="text-center p-10 bg-white rounded-xl border border-slate-200 space-y-1">
          <p className="text-sm font-semibold text-slate-700">No se encontraron tarjetas</p>
          <p className="text-xs text-slate-500">Prueba con otro término de búsqueda.</p>
        </div>
      )}

      {/* POP-UP MODAL WHEN VIEWING A CARD (Reading / Spectator Mode) */}
      {activeModalCard && !isAdmin && (
        <div 
          id="card-modal-backdrop"
          onClick={() => setActiveModalCard(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 my-6"
          >
            {/* Pop-up Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 shrink-0">
              <div className="min-w-0 pr-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  Tarjeta #{activeModalCard.slideNumber} • Explicación en Detalle
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug truncate">
                  {activeModalCard.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalCard(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pop-up Scrollable Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
              {activeModalCard.shortDescription && (
                <div className="p-3 bg-blue-50/60 border border-blue-100/80 rounded-xl text-xs text-blue-900 leading-relaxed font-medium">
                  {activeModalCard.shortDescription}
                </div>
              )}

              {/* RENDER DYNAMIC CUSTOMIZABLE SECTIONS */}
              {getSlideSections(activeModalCard).map((section) => {
                const lines = section.content.split('\n').filter(l => l.trim().length > 0);

                return (
                  <div key={section.id} className="space-y-2">
                    {/* Section Header */}
                    <h4 className="text-xs uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1.5">
                      {section.type === 'paragraph' && <BookOpen className="w-3.5 h-3.5 text-blue-600" />}
                      {section.type === 'bullets' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      {section.type === 'numbered' && <ListOrdered className="w-3.5 h-3.5 text-indigo-600" />}
                      {section.type === 'callout' && <Sparkles className="w-3.5 h-3.5 text-amber-600" />}
                      {section.type === 'terms' && <Layers className="w-3.5 h-3.5 text-purple-600" />}
                      <span>{section.title}</span>
                    </h4>

                    {/* Section Body based on type */}
                    {section.type === 'paragraph' && (
                      <div className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/60 p-4 rounded-xl border border-slate-100 prose prose-slate max-w-none">
                        <ReactMarkdown>{section.content}</ReactMarkdown>
                      </div>
                    )}

                    {section.type === 'bullets' && (
                      <ul className="space-y-1.5 bg-emerald-50/30 p-4 rounded-xl border border-emerald-100/60">
                        {lines.map((line, idx) => (
                          <li key={idx} className="text-xs sm:text-sm text-slate-700 flex items-start gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                            <div className="flex-1 prose prose-slate max-w-none text-xs sm:text-sm">
                              <ReactMarkdown>{line.replace(/^[-*•]\s*/, '')}</ReactMarkdown>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                    {section.type === 'numbered' && (
                      <div className="space-y-2 bg-indigo-50/30 p-4 rounded-xl border border-indigo-100/60">
                        {lines.map((line, idx) => (
                          <div key={idx} className="text-xs sm:text-sm text-slate-700 flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                              {idx + 1}
                            </span>
                            <div className="flex-1 prose prose-slate max-w-none text-xs sm:text-sm">
                              <ReactMarkdown>{line.replace(/^\d+[\.\)]\s*/, '')}</ReactMarkdown>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {section.type === 'callout' && (
                      <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1">
                        <div className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium prose prose-amber max-w-none">
                          <ReactMarkdown>{section.content}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {section.type === 'terms' && (
                      <div className="space-y-2 bg-purple-50/30 p-4 rounded-xl border border-purple-100/60">
                        {lines.map((line, idx) => {
                          const parts = line.split(':');
                          const term = parts[0];
                          const def = parts.slice(1).join(':');

                          return (
                            <div key={idx} className="p-2.5 bg-white rounded-lg border border-purple-100 text-xs text-slate-700 space-y-0.5">
                              <span className="font-bold text-purple-900 block">
                                {term.trim()}
                              </span>
                              {def && (
                                <p className="text-slate-600 pl-1 leading-relaxed">
                                  {def.trim()}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Discrete Comments Section for Explanation View */}
      <CommentsSection
        section="explanation"
        sectionTitle="la Explicación a Detalle"
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
    </div>
  );
};
