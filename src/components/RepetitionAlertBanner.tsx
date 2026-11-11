import React from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, CheckCircle2, RefreshCw, ArrowRight, ShieldAlert } from 'lucide-react';
import { MONTH_NAMES } from '../utils/validators';

interface RepetitionAlertBannerProps {
  onOpenConflictModal?: () => void;
  onSelectConflictDish?: (dishName: string, category: string) => void;
}

export const RepetitionAlertBanner: React.FC<RepetitionAlertBannerProps> = ({
  onOpenConflictModal,
}) => {
  const { conflicts, selectedWeek, selectedMonth, currentUser, dishes, updateMealSlot, currentMenu, checkDishAvailability, isAdmin } = useApp();

  if (conflicts.length === 0) {
    return (
      <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 rounded-xl px-4 py-3 flex items-center justify-between gap-4 text-emerald-900 dark:text-emerald-200 shadow-xs">
        <div className="flex items-center gap-2.5 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            <strong className="font-semibold">Regra Anti-Repetição Cumprida:</strong> Todos os pratos desta semana respeitam o espaço mínimo obrigatório de 2 semanas de intervalo.
          </span>
        </div>
        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono shrink-0 hidden sm:inline">
          Semana {selectedWeek} · {MONTH_NAMES[selectedMonth - 1]}
        </span>
      </div>
    );
  }

  // Quick substitution helper finding a replacement that respects the 2-week gap
  const handleQuickSwap = (conflict: any) => {
    if (!isAdmin) return;
    
    const dayKeys = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const;
    let targetDayKey: string | null = null;
    for (const dKey of dayKeys) {
      const day = currentMenu.days[dKey];
      if (day && day.dayName === conflict.currentDayName) {
        targetDayKey = dKey;
        break;
      }
    }

    if (!targetDayKey) return;

    // Find candidate dishes from the same category that are allowed by the 2-week rule
    const validCandidate = dishes.find((d) => {
      if (d.category !== conflict.category) return false;
      if (d.name.toLowerCase() === conflict.dishName.toLowerCase()) return false;
      const val = checkDishAvailability(d.name, conflict.category, targetDayKey!);
      return val.allowed;
    });

    if (validCandidate) {
      updateMealSlot(targetDayKey, conflict.category, validCandidate.name);
    }
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <h4 className="text-sm font-bold tracking-tight">
            Alerta: {conflicts.length} {conflicts.length === 1 ? 'conflito de repetição detectado' : 'conflitos de repetição detectados'} (&lt; 2 semanas de espaço)
          </h4>
        </div>

        <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 border border-rose-300/60 dark:border-rose-800/60 px-2 py-0.5 rounded-md self-start sm:self-auto">
          Regra: Mínimo 2 semanas de intervalo
        </span>
      </div>

      <p className="text-xs text-amber-800 dark:text-amber-300 mb-3 leading-relaxed">
        Diretriz nutricional Canção Nova: Comidas colocadas na semana anterior ou com menos de 2 semanas de espaço não devem ser acrescentadas ao cardápio.
      </p>

      {/* List of conflicts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {conflicts.map((conflict, index) => {
          const timingLabel =
            conflict.direction === 'anterior'
              ? conflict.weeksDistance === 1
                ? 'Semana Anterior Imediata'
                : 'Há 2 semanas'
              : conflict.direction === 'seguinte'
              ? conflict.weeksDistance === 1
                ? 'Próxima Semana'
                : 'Daqui a 2 semanas'
              : 'Mesma semana';

          return (
            <div
              key={index}
              className="bg-white dark:bg-neutral-800 border border-amber-200 dark:border-amber-900/50 rounded-lg p-2.5 flex items-center justify-between text-xs"
            >
              <div>
                <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-neutral-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span>{conflict.dishName}</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {conflict.categoryLabel} · Presente na <strong>{conflict.conflictDayName}</strong> da <strong>Semana {conflict.conflictWeekNumber}</strong>
                </p>
                <p className="text-[10px] text-rose-700 dark:text-rose-400 font-semibold mt-0.5">
                  ⛔ {timingLabel} (espaço insuficiente)
                </p>
              </div>

              {isAdmin && (
                <button
                  onClick={() => handleQuickSwap(conflict)}
                  title="Substituir por prato alternativo respeitando o intervalo de 2 semanas"
                  className="px-2 py-1 text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/60 rounded flex items-center gap-1 font-semibold text-[11px] transition-colors shrink-0 ml-2 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Substituir</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {onOpenConflictModal && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={onOpenConflictModal}
            className="text-xs font-semibold text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-100 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Ver auditoria detalhada de repetições</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
