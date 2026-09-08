import React, { useState } from 'react';
import { PresentationData, QuizQuestion } from '../types';
import { 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Award, 
  BookOpen, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  Lightbulb, 
  ChevronDown, 
  ChevronUp, 
  ChevronsDownUp, 
  ChevronsUpDown, 
  Shuffle 
} from 'lucide-react';
import { AutoResizeTextarea } from './AutoResizeTextarea';
import { CommentsSection } from './CommentsSection';
import { UserProfile } from '../types';

interface QuizViewProps {
  data: PresentationData;
  currentUser: UserProfile;
  targetCommentId?: string;
  onNavigateToExplanation: (slideNumber?: number) => void;
  onUpdateQuiz: (updatedQuiz: QuizQuestion[]) => void;
  onAddComment: (section: 'slides' | 'explanation' | 'quiz', text: string) => void;
  onReplyComment: (commentId: string, replyText: string) => void;
  onDeleteComment?: (commentId: string) => void;
  isAdmin?: boolean;
}

// Fisher-Yates shuffle generator
function createShuffledIndices(length: number): number[] {
  const array = Array.from({ length }, (_, i) => i);
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export const QuizView: React.FC<QuizViewProps> = ({
  data,
  currentUser,
  targetCommentId,
  onNavigateToExplanation,
  onUpdateQuiz,
  onAddComment,
  onReplyComment,
  onDeleteComment,
  isAdmin = false
}) => {
  const [userAnswers, setUserAnswers] = useState<{ [questionId: string]: number }>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [collapsedQuestions, setCollapsedQuestions] = useState<Set<string>>(new Set());

  // Default: Static original order [0, 1, 2, 3] by default.
  // ONLY changes order if the user explicitly presses the "Barajar" button.
  const [shuffledOrderMap, setShuffledOrderMap] = useState<{ [questionId: string]: number[] }>({});
  const [isShuffledActive, setIsShuffledActive] = useState<boolean>(false);

  const questions = data.quiz;

  const toggleCollapseQuestion = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCollapsedQuestions(prev => {
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
    if (collapsedQuestions.size === questions.length) {
      setCollapsedQuestions(new Set());
    } else {
      setCollapsedQuestions(new Set(questions.map(q => q.id)));
    }
  };

  const handleSelectOption = (questionId: string, originalOptionIndex: number) => {
    if (isSubmitted || isAdmin) return;
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: originalOptionIndex
    }));
  };

  // Explicit Shuffle Button action
  const handleShuffleOptions = () => {
    const newOrder: { [questionId: string]: number[] } = {};
    questions.forEach((q) => {
      newOrder[q.id] = createShuffledIndices(q.options.length);
    });
    setShuffledOrderMap(newOrder);
    setIsShuffledActive(true);
    // Clear answers when re-shuffling to keep consistency
    setUserAnswers({});
    setIsSubmitted(false);
  };

  // Reset without re-shuffling (keeps current order or static)
  const handleResetQuiz = () => {
    setUserAnswers({});
    setIsSubmitted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddNewQuestion = () => {
    const newIndex = questions.length + 1;
    const newId = `q-${Date.now()}`;
    const newQ: QuizQuestion = {
      id: newId,
      topic: data.subject || 'Farmacología',
      question: `Pregunta ${newIndex}: ¿Cuál es el concepto principal a evaluar?`,
      options: [
        'Opción A (Correcta por defecto)',
        'Opción B',
        'Opción C',
        'Opción D'
      ],
      correctAnswerIndex: 0,
      explanation: 'Explicación y justificación técnica de la respuesta correcta.',
      reinforcementTip: 'Revisa la sección de mecanismos y aplicaciones clínicas correspondientes.'
    };
    onUpdateQuiz([...questions, newQ]);
  };

  const handleQuestionTextChange = (questionId: string, text: string) => {
    onUpdateQuiz(questions.map(q => q.id === questionId ? { ...q, question: text } : q));
  };

  const handleOptionTextChange = (questionId: string, optionIdx: number, text: string) => {
    onUpdateQuiz(questions.map(q => {
      if (q.id !== questionId) return q;
      const updatedOpts = [...q.options] as [string, string, string, string];
      updatedOpts[optionIdx] = text;
      return { ...q, options: updatedOpts };
    }));
  };

  const handleSetCorrectOption = (questionId: string, optionIdx: number) => {
    onUpdateQuiz(questions.map(q => q.id === questionId ? { ...q, correctAnswerIndex: optionIdx } : q));
  };

  const handleExplanationChange = (questionId: string, text: string) => {
    onUpdateQuiz(questions.map(q => q.id === questionId ? { ...q, explanation: text } : q));
  };

  const handleTipChange = (questionId: string, text: string) => {
    onUpdateQuiz(questions.map(q => q.id === questionId ? { ...q, reinforcementTip: text } : q));
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (confirm('¿Eliminar esta pregunta del cuestionario?')) {
      onUpdateQuiz(questions.filter(q => q.id !== questionId));
      setUserAnswers(prev => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  // Calculate score
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(userAnswers).length;
  const correctCount = questions.reduce((acc, q) => {
    return acc + (userAnswers[q.id] === q.correctAnswerIndex ? 1 : 0);
  }, 0);
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const areAllCollapsed = questions.length > 0 && collapsedQuestions.size === questions.length;

  return (
    <div id="quiz-view-root" className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-lg text-white shadow-xs shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                Ventana 3 • Cuestionario
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">{data.subject}</span>
              {!isAdmin && isShuffledActive && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  <Shuffle className="w-3 h-3" />
                  Respuestas barajadas
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 leading-tight">
              Preguntas &amp; Respuestas
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              {isAdmin 
                ? 'Modo Edición: Escribe enunciados, opciones y consejos con cajas autoajustables. Puedes colapsar preguntas para despejar la vista.'
                : 'Selecciona la respuesta correcta. Puedes usar el botón "Mezclar respuestas" para cambiar el orden.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {isAdmin ? (
            <>
              <button
                type="button"
                onClick={toggleCollapseAll}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                title={areAllCollapsed ? "Desplegar todas las preguntas" : "Ocultar contenido de todas"}
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
                onClick={handleAddNewQuestion}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Pregunta</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleShuffleOptions}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
              title="Mezclar y cambiar de lugar las opciones de respuesta"
            >
              <Shuffle className="w-3.5 h-3.5 text-indigo-600" />
              <span>Mezclar respuestas</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigateToExplanation()}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>Consultar Tarjetas</span>
          </button>
        </div>
      </div>

      {/* Score Summary Card (When submitted in Student/Spectator mode) */}
      {isSubmitted && !isAdmin && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 ${
              scorePercent >= 80 ? 'bg-emerald-600' : scorePercent >= 50 ? 'bg-amber-500' : 'bg-rose-500'
            }`}>
              <Award className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Resultado de la Evaluación
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  scorePercent >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'
                }`}>
                  {scorePercent}% de Acierto
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-800">
                Has acertado {correctCount} de {totalQuestions} preguntas
              </h3>
              {correctCount < totalQuestions && (
                <p className="text-xs text-amber-700 font-medium">
                  Revisa los <strong className="text-amber-800">Consejos de Refuerzo</strong> en las preguntas que marcaste incorrectamente.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => {
                handleShuffleOptions();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full md:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Volver a intentar (Mezclar respuestas)</span>
            </button>
          </div>
        </div>
      )}

      {/* Question List */}
      <div className="space-y-5">
        {questions.map((q, qIndex) => {
          const selectedOptionIndex = userAnswers[q.id];
          const isAnswered = selectedOptionIndex !== undefined;
          const isCorrect = isAnswered && selectedOptionIndex === q.correctAnswerIndex;
          const isCollapsed = collapsedQuestions.has(q.id);

          // If shuffled, use shuffled order; otherwise use default static indices [0, 1, 2, 3]
          const existingOrder = shuffledOrderMap[q.id];
          const displayIndices = (existingOrder && existingOrder.length === q.options.length) 
            ? existingOrder 
            : Array.from({ length: q.options.length }, (_, i) => i);

          return (
            <div
              key={q.id}
              className={`bg-white border rounded-xl p-5 sm:p-6 shadow-xs transition-all ${
                isAdmin 
                  ? 'border-emerald-200 ring-1 ring-emerald-500/10' 
                  : isSubmitted 
                    ? isCorrect 
                      ? 'border-emerald-300 bg-emerald-50/10' 
                      : 'border-rose-300 bg-rose-50/10 ring-1 ring-rose-500/10'
                    : 'border-slate-200'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200">
                    Pregunta {qIndex + 1} de {totalQuestions}
                  </span>
                  
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => toggleCollapseQuestion(q.id, e)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] font-medium transition-colors flex items-center gap-1"
                      title={isCollapsed ? "Mostrar campos de edición" : "Ocultar contenido"}
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
                  )}

                  {!isAdmin && isSubmitted && (
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      isCorrect 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Correcta
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          Incorrecta
                        </>
                      )}
                    </span>
                  )}
                </div>

                {isAdmin && questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs transition-colors flex items-center gap-1"
                    title="Eliminar pregunta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Eliminar</span>
                  </button>
                )}
              </div>

              {/* DIRECT INLINE EDITING FOR QUESTION */}
              {isAdmin ? (
                <div className="space-y-4">
                  {/* Question Title input */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Enunciado de la Pregunta
                    </label>
                    <AutoResizeTextarea
                      rows={1}
                      value={q.question}
                      onChange={(e) => handleQuestionTextChange(q.id, e.target.value)}
                      placeholder="Escribe la pregunta..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white"
                    />
                  </div>

                  {/* Collapsible section */}
                  {isCollapsed ? (
                    <div 
                      onClick={(e) => toggleCollapseQuestion(q.id, e)}
                      className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center cursor-pointer hover:bg-slate-100/70 transition-colors"
                    >
                      <p className="text-xs text-slate-500 font-medium">
                        Opciones y explicaciones plegadas • Clic para desplegar
                      </p>
                      <p className="text-[11px] text-emerald-700 mt-0.5 font-medium">
                        Respuesta correcta actual: Opción {String.fromCharCode(65 + q.correctAnswerIndex)} ({q.options[q.correctAnswerIndex]})
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-100">
                      {/* 4 Options Grid with Radio selector for correct answer */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Opciones de Respuesta (Marca con el círculo verde la opción correcta)
                        </label>

                        {q.options.map((option, optIdx) => {
                          const isCorrectChoice = q.correctAnswerIndex === optIdx;
                          return (
                            <div
                              key={optIdx}
                              className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                                isCorrectChoice 
                                  ? 'bg-emerald-50/70 border-emerald-400' 
                                  : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              {/* Radio Button to mark correct */}
                              <button
                                type="button"
                                onClick={() => handleSetCorrectOption(q.id, optIdx)}
                                title={isCorrectChoice ? "Opción marcada como correcta" : "Marcar como respuesta correcta"}
                                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                                  isCorrectChoice 
                                    ? 'bg-emerald-600 text-white shadow-xs' 
                                    : 'bg-white border border-slate-300 text-slate-400 hover:border-emerald-500'
                                }`}
                              >
                                {isCorrectChoice ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : String.fromCharCode(65 + optIdx)}
                              </button>

                              {/* Auto-resizing Option Text Input */}
                              <AutoResizeTextarea
                                rows={1}
                                value={option}
                                onChange={(e) => handleOptionTextChange(q.id, optIdx, e.target.value)}
                                placeholder={`Opción ${String.fromCharCode(65 + optIdx)}...`}
                                className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                              />

                              {isCorrectChoice && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded shrink-0">
                                  Correcta ✓
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation and tip inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                            Explicación / Justificación Técnica
                          </label>
                          <AutoResizeTextarea
                            rows={2}
                            value={q.explanation || ''}
                            onChange={(e) => handleExplanationChange(q.id, e.target.value)}
                            placeholder="Por qué esta es la respuesta correcta..."
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                            Consejo de Refuerzo (Se muestra si el alumno falla)
                          </label>
                          <AutoResizeTextarea
                            rows={2}
                            value={q.reinforcementTip || ''}
                            onChange={(e) => handleTipChange(q.id, e.target.value)}
                            placeholder="Ej: Repasar la sección de mecanismos de acción..."
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* SPECTATOR / STUDENT INTERACTIVE QUIZ VIEW (Static by default, only moves on "Barajar" click) */
                <>
                  <h3 className="text-base font-bold text-slate-800 leading-snug mb-4">
                    {q.question}
                  </h3>

                  {/* Render options in static or explicitly shuffled order */}
                  <div className="space-y-2.5">
                    {displayIndices.map((originalOptIdx, displayIdx) => {
                      const optionText = q.options[originalOptIdx];
                      const isThisSelected = selectedOptionIndex === originalOptIdx;
                      const isThisCorrect = q.correctAnswerIndex === originalOptIdx;

                      let optionStyle = "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700";

                      if (isSubmitted) {
                        if (isThisCorrect) {
                          optionStyle = "bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold shadow-xs";
                        } else if (isThisSelected && !isThisCorrect) {
                          optionStyle = "bg-rose-50 border-rose-400 text-rose-950 font-semibold";
                        } else {
                          optionStyle = "bg-slate-50/50 border-slate-200 text-slate-400 opacity-60";
                        }
                      } else if (isThisSelected) {
                        optionStyle = "bg-blue-50 border-blue-500 text-blue-900 font-semibold ring-1 ring-blue-500 shadow-xs";
                      }

                      return (
                        <button
                          key={originalOptIdx}
                          type="button"
                          disabled={isSubmitted}
                          onClick={() => handleSelectOption(q.id, originalOptIdx)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between text-xs sm:text-sm ${optionStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              isSubmitted
                                ? isThisCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : isThisSelected
                                    ? 'bg-rose-500 text-white'
                                    : 'bg-slate-200 text-slate-500'
                                : isThisSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-200 text-slate-600'
                            }`}>
                              {String.fromCharCode(65 + displayIdx)}
                            </span>
                            <span>{optionText}</span>
                          </div>

                          {isSubmitted && (
                            <div>
                              {isThisCorrect && (
                                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-100/80 px-2 py-0.5 rounded">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  Correcta
                                </span>
                              )}
                              {isThisSelected && !isThisCorrect && (
                                <span className="text-xs font-bold text-rose-700 flex items-center gap-1 bg-rose-100/80 px-2 py-0.5 rounded">
                                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                  Tu respuesta
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* SUBMISSION FEEDBACK: SPECIAL REINFORCEMENT TIP IF INCORRECT */}
                  {isSubmitted && (
                    <div className="mt-4 space-y-2.5 animate-in fade-in duration-200">
                      {/* PROMINENT REINFORCEMENT TIP FOR INCORRECT ANSWERS */}
                      {!isCorrect && (
                        <div className="p-4 bg-amber-50/90 border border-amber-300/80 rounded-xl text-xs space-y-1.5 shadow-xs">
                          <div className="font-bold text-amber-900 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Consejo de Refuerzo:</span>
                          </div>
                          <p className="text-amber-900/90 leading-relaxed font-medium pl-6">
                            {q.reinforcementTip || 'Revisa la fundamentación conceptual de este tema en la sección de Explicación a Detalle.'}
                          </p>
                        </div>
                      )}

                      {/* TECHNICAL JUSTIFICATION */}
                      {q.explanation && (
                        <div className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                          isCorrect ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="font-bold text-slate-700 flex items-center gap-1.5">
                            <Sparkles className={`w-3.5 h-3.5 ${isCorrect ? 'text-emerald-600' : 'text-blue-600'}`} />
                            <span>Justificación Técnica:</span>
                          </div>
                          <p className="text-slate-600 leading-relaxed pl-5">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Quiz button for Spectators */}
      {!isAdmin && !isSubmitted && questions.length > 0 && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={answeredCount < totalQuestions}
            onClick={() => {
              setIsSubmitted(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span>Enviar y Calificar Cuestionario</span>
            <span className="text-xs font-mono bg-blue-700 px-2 py-0.5 rounded">
              {answeredCount}/{totalQuestions}
            </span>
          </button>
        </div>
      )}

      {/* Discrete Comments Section for Quiz View */}
      <CommentsSection
        section="quiz"
        sectionTitle="el Cuestionario"
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
