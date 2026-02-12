import { FORM_TYPES } from "@/lib/evaluation-forms";
import type { FormTypeDef } from "@/lib/evaluation-forms";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Waves, Zap, HeartPulse, Scissors, Palette, Activity, Hand } from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Waves,
  Zap,
  HeartPulse,
  Scissors,
  Palette,
  Activity,
  Hand,
};

const COLOR_BG: Record<string, string> = {
  pink: "bg-pink-50 hover:bg-pink-100 border-pink-200 dark:bg-pink-950/30 dark:hover:bg-pink-950/50 dark:border-pink-900",
  purple: "bg-purple-50 hover:bg-purple-100 border-purple-200 dark:bg-purple-950/30 dark:hover:bg-purple-950/50 dark:border-purple-900",
  blue: "bg-blue-50 hover:bg-blue-100 border-blue-200 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 dark:border-blue-900",
  red: "bg-red-50 hover:bg-red-100 border-red-200 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:border-red-900",
  orange: "bg-orange-50 hover:bg-orange-100 border-orange-200 dark:bg-orange-950/30 dark:hover:bg-orange-950/50 dark:border-orange-900",
  teal: "bg-teal-50 hover:bg-teal-100 border-teal-200 dark:bg-teal-950/30 dark:hover:bg-teal-950/50 dark:border-teal-900",
  amber: "bg-amber-50 hover:bg-amber-100 border-amber-200 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 dark:border-amber-900",
  green: "bg-green-50 hover:bg-green-100 border-green-200 dark:bg-green-950/30 dark:hover:bg-green-950/50 dark:border-green-900",
};

const ICON_COLOR: Record<string, string> = {
  pink: "text-pink-600 dark:text-pink-400",
  purple: "text-purple-600 dark:text-purple-400",
  blue: "text-blue-600 dark:text-blue-400",
  red: "text-red-600 dark:text-red-400",
  orange: "text-orange-600 dark:text-orange-400",
  teal: "text-teal-600 dark:text-teal-400",
  amber: "text-amber-600 dark:text-amber-400",
  green: "text-green-600 dark:text-green-400",
};

interface EvaluationFormSelectorProps {
  onSelect: (formType: string) => void;
  onBack: () => void;
}

export default function EvaluationFormSelector({ onSelect, onBack }: EvaluationFormSelectorProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Nueva Evaluacion</h2>
          <p className="text-muted-foreground mt-1">Seleccione el tipo de ficha clinica</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FORM_TYPES.map((form: FormTypeDef) => {
          const Icon = ICON_MAP[form.icon] || Sparkles;
          return (
            <button
              key={form.type}
              onClick={() => onSelect(form.type)}
              className={`group text-left rounded-xl border p-5 transition-all duration-200 ${COLOR_BG[form.color] || ""}`}
            >
              <Icon className={`h-8 w-8 mb-3 ${ICON_COLOR[form.color] || ""}`} />
              <h3 className="font-semibold text-foreground mb-1">{form.label}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{form.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
