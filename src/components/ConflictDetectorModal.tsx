import React from 'react';
import { useApp } from '../context/AppContext';
import { MONTH_NAMES } from '../utils/validators';
import { CheckCircle2, RefreshCw, X, ShieldAlert, Ban } from 'lucide-react';

interface ConflictDetectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConflictDetectorModal: React.FC<ConflictDetectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    conflicts,
    selectedWeek,
    selectedMonth,
    selectedYear,
    dishes,
    currentMenu,
    updateMealSlot,
    currentUser,
    checkDishAvailability,
    isAdmin,
  } = useApp();

  if (!isOpen) return null;

  const handleResolveConflict = (conflict: any) => {
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

    // Filter available dishes for this category that pass the 2-week spacing check
    const validCandidate = dishes.find((d) => {
      if (d.category !== conflict.category) return false;
      if (d.name.toLowerCase() === conflict.dishName.toLowerCase()) return false;
      const validation = checkDishAvailability(d.name, conflict.category, targetDayKey!);
      return validation.allowed;
    });

    if (validCandidate) {
      updateMealSlot(targetDayKey, conflict.category, validCandidate.name);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-neutral-900 dark:bg-black text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Auditoria de Não-Repetição Semanal
              </h2>
              <p className="text-xs text-neutral-400">
                Semana {selectedWeek} · {MONTH_NAMES[selectedMonth - 1]} de {selectedYear}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Rule explainer box */}
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl p-4 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            <strong className="block font-semibold mb-1 text-amber-950 dark:text-amber-300">
              Regra Nutricional: Espaço Mínimo de 2 Semanas entre Repetições:
            </strong>
            Não é permitido acrescentar no cardápio comidas que foram colocadas na semana anterior. Cada prato deve ter no mínimo um espaço de 2 semanas entre uma ocorrência e outra (auditoria em janela W-2, W-1, W+1 e W+2).
          </div>

          {conflicts.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                Cardápio em Conformidade Total!
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                Todos os pratos da Semana {selectedWeek} respeitam o espaço mínimo obrigatório de 2 semanas de intervalo.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Pratos em desacordo com a regra de 2 semanas ({conflicts.length}):
                </h3>
              </div>

              <div className="divide-y divide-neutral-200 dark:divide-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
                {conflicts.map((conflict, idx) => (
                  <div key={idx} className="p-3.5 bg-white dark:bg-neutral-800/40 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-neutral-100">
                        <Ban className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>{conflict.dishName}</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        <strong className="text-neutral-700 dark:text-neutral-300">{conflict.categoryLabel}</strong> na semana atual ({conflict.currentDayName}).
                      </p>
                      <p className="text-[11px] text-rose-700 dark:text-rose-400 font-medium mt-0.5">
                        ⚠️ Servido na <strong>{conflict.conflictDayName}</strong> da <strong>Semana {conflict.conflictWeekNumber}</strong> ({conflict.direction === 'anterior' ? conflict.weeksDistance === 1 ? 'semana anterior' : 'há 2 semanas' : 'semana futura'}).
                      </p>
                    </div>

                    {isAdmin ? (
                      <button
                        onClick={() => handleResolveConflict(conflict)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Substituir</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-neutral-400 italic">
                        Requer Administrador
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-800/80 px-6 py-3 border-t border-neutral-200 dark:border-neutral-700 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-100 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
