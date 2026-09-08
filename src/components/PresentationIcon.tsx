import React, { useState } from 'react';
import { 
  Pill, 
  Microscope, 
  Stethoscope, 
  Dna, 
  FlaskConical, 
  Brain, 
  BookOpen, 
  GraduationCap, 
  Leaf, 
  Syringe, 
  Bandage, 
  Shield, 
  Star, 
  BarChart3, 
  Sparkles,
  Presentation,
  Smile,
  X
} from 'lucide-react';

export interface IconPreset {
  id: string;
  name: string;
  category: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
  emojiFallback: string;
}

export const ICON_PRESETS: IconPreset[] = [
  {
    id: 'capsule',
    name: 'Cápsula / Píldora',
    category: 'Farmacia',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    icon: Pill,
    emojiFallback: '💊'
  },
  {
    id: 'microscope',
    name: 'Microscopio',
    category: 'Investigación',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: Microscope,
    emojiFallback: '🔬'
  },
  {
    id: 'stethoscope',
    name: 'Estetoscopio',
    category: 'Clínica',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: Stethoscope,
    emojiFallback: '🩺'
  },
  {
    id: 'dna',
    name: 'ADN / Genética',
    category: 'Biología',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: Dna,
    emojiFallback: '🧬'
  },
  {
    id: 'flask',
    name: 'Laboratorio',
    category: 'Farmacia',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    icon: FlaskConical,
    emojiFallback: '🧪'
  },
  {
    id: 'brain',
    name: 'Neurología / Mente',
    category: 'Clínica',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: Brain,
    emojiFallback: '🧠'
  },
  {
    id: 'book',
    name: 'Farmacopea / Libro',
    category: 'Docencia',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    icon: BookOpen,
    emojiFallback: '📚'
  },
  {
    id: 'graduation-cap',
    name: 'Grado / Universidad',
    category: 'Docencia',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: GraduationCap,
    emojiFallback: '🎓'
  },
  {
    id: 'leaf',
    name: 'Botánica / Fitoterapia',
    category: 'Farmacia',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: Leaf,
    emojiFallback: '🌿'
  },
  {
    id: 'syringe',
    name: 'Inyectables / Vacunas',
    category: 'Clínica',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    icon: Syringe,
    emojiFallback: '💉'
  },
  {
    id: 'bandage',
    name: 'Cuidados / Botiquín',
    category: 'Clínica',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: Bandage,
    emojiFallback: '🩹'
  },
  {
    id: 'shield',
    name: 'Farmacovigilancia',
    category: 'Seguridad',
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    icon: Shield,
    emojiFallback: '🛡️'
  },
  {
    id: 'chart',
    name: 'Análisis / Gráficos',
    category: 'Gestión',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    icon: BarChart3,
    emojiFallback: '📊'
  },
  {
    id: 'star',
    name: 'Destacado / Especial',
    category: 'General',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: Star,
    emojiFallback: '⭐'
  }
];

interface PresentationIconProps {
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PresentationIcon: React.FC<PresentationIconProps> = ({
  icon,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs rounded-lg',
    md: 'w-9 h-9 text-sm rounded-xl',
    lg: 'w-12 h-12 text-lg rounded-2xl'
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };

  // If it's a preset key
  const preset = ICON_PRESETS.find(p => p.id === icon);
  if (preset) {
    const IconComp = preset.icon;
    return (
      <div 
        className={`flex items-center justify-center border shadow-2xs shrink-0 ${sizeClasses[size]} ${preset.bgColor} ${preset.borderColor} ${preset.color} ${className}`}
      >
        <IconComp className={iconSizes[size]} />
      </div>
    );
  }

  // If it's an emoji or custom text
  if (icon && icon.trim()) {
    return (
      <div 
        className={`flex items-center justify-center bg-slate-100 border border-slate-200 shadow-2xs shrink-0 select-none ${sizeClasses[size]} ${className}`}
      >
        <span>{icon}</span>
      </div>
    );
  }

  // Default fallback icon
  return (
    <div 
      className={`flex items-center justify-center bg-blue-50 border border-blue-200 text-blue-600 shadow-2xs shrink-0 ${sizeClasses[size]} ${className}`}
    >
      <Presentation className={iconSizes[size]} />
    </div>
  );
};

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentIcon?: string;
  onSelectIcon: (iconIdOrEmoji: string) => void;
}

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  isOpen,
  onClose,
  currentIcon,
  onSelectIcon
}) => {
  const [customEmoji, setCustomEmoji] = useState('');

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customEmoji.trim()) {
      onSelectIcon(customEmoji.trim());
      onClose();
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150 my-6"
      >
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                Elegir Logo / Ícono
              </h3>
              <p className="text-xs text-slate-500">
                Identifica tu presentación en el lobby y barra superior
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Preset Icons Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Íconos Farmacéuticos y Académicos
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {ICON_PRESETS.map((preset) => {
                const isSelected = currentIcon === preset.id;
                const IconComp = preset.icon;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      onSelectIcon(preset.id);
                      onClose();
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-xs' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${preset.bgColor} ${preset.borderColor} ${preset.color}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {preset.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {preset.category}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Emoji / Text Option */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-amber-500" />
              <span>O escribe un Emoji personalizado</span>
            </label>
            <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
              <input
                type="text"
                maxLength={4}
                placeholder="Ej: 💊, 🧬, 🩺, ⭐, 🌿"
                value={customEmoji}
                onChange={(e) => setCustomEmoji(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              />
              <button
                type="submit"
                disabled={!customEmoji.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Aplicar
              </button>
            </form>
          </div>
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
