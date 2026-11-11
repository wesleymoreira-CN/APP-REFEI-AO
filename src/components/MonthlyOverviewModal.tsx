import React from 'react';
import { useApp } from '../context/AppContext';
import { MONTH_NAMES, scanWeeklyRepetitions, normalizeSlotItems, getMenuForOffset } from '../utils/validators';
import { Calendar, CheckCircle2, AlertTriangle, ArrowRight, X } from 'lucide-react';

interface MonthlyOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWeek: (w: number) => void;
}

export const MonthlyOverviewModal: React.FC<MonthlyOverviewModalProps> = ({
  isOpen,
  onClose,
  onSelectWeek,
}) => {
  const { selectedYear, selectedMonth, menus, selectedWeek, menuType } = useApp();

  if (!isOpen) return null;

  const weeks = [1, 2, 3, 4, 5];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-neutral-900 dark:bg-black text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Visão Geral do Mês de {MONTH_NAMES[selectedMonth - 1]} ({selectedYear}) · {menuType === 'rampa' ? 'Cardápio Rampa' : 'Cardápio a Quilo'}
              </h2>
              <p className="text-xs text-neutral-400">
                Auditoria de repetições e status de planejamento das 5 semanas da modalidade {menuType === 'rampa' ? 'Rampa' : 'Kilo'}
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
        <div className="p-6 overflow-y-auto space-y-4">
          <p className="text-xs text-neutral-600 dark:text-neutral-300">
            Abaixo estão resumidas todas as semanas deste mês para o <strong>{menuType === 'rampa' ? 'Cardápio Rampa (Refeitório)' : 'Cardápio a Quilo (Restaurante)'}</strong>. Você pode verificar rapidamente se há repetições entre semanas adjacentes e clicar para abrir e editar qualquer semana.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {weeks.map((wNum) => {
              const currentKey = `menu-${selectedYear}-${selectedMonth}-w${wNum}-${menuType}`;
              const menu = menus[currentKey] || (menuType === 'rampa' ? menus[`menu-${selectedYear}-${selectedMonth}-w${wNum}`] : undefined);

              const windowWeeks = {
                prevWeek2: getMenuForOffset(menus, selectedYear, selectedMonth, wNum, -2, menuType),
                prevWeek1: getMenuForOffset(menus, selectedYear, selectedMonth, wNum, -1, menuType),
                nextWeek1: getMenuForOffset(menus, selectedYear, selectedMonth, wNum, 1, menuType),
                nextWeek2: getMenuForOffset(menus, selectedYear, selectedMonth, wNum, 2, menuType),
              };

              // Count total dishes
              let totalDishes = 0;
              let conflictsCount = 0;

              if (menu) {
                const dayKeys = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const;
                dayKeys.forEach((k) => {
                  const d = menu.days[k];
                  if (d) {
                    Object.values(d.lunch).forEach((val) => {
                      totalDishes += normalizeSlotItems(val).length;
                    });
                  }
                });

                const confs = scanWeeklyRepetitions(menu, windowWeeks);
                conflictsCount = confs.length;
              }

              const isCurrentSelection = selectedWeek === wNum;

              return (
                <div
                  key={wNum}
                  onClick={() => {
                    onSelectWeek(wNum);
                    onClose();
                  }}
                  className={`border rounded-xl p-3 flex flex-col justify-between transition-all cursor-pointer ${
                    isCurrentSelection
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/40 hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        Semana {wNum}
                      </span>
                      {isCurrentSelection && (
                        <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-900/60 px-1 py-0.2 rounded">
                          Ativa
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono mb-3">
                      {menu ? `${menu.startDate} a ${menu.endDate}` : 'Não iniciada'}
                    </p>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 text-[11px]">
                        <span>Pratos definidos:</span>
                        <strong className="font-mono text-neutral-900 dark:text-neutral-200">{totalDishes}/56</strong>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-neutral-600 dark:text-neutral-400">Status:</span>
                        <span className="capitalize font-semibold text-neutral-700 dark:text-neutral-300">
                          {menu?.status || 'Vazio'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-neutral-100 dark:border-neutral-700">
                    {conflictsCount > 0 ? (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/60 p-1 rounded">
                        <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>{conflictsCount} repetições</span>
                      </div>
                    ) : totalDishes > 0 ? (
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 p-1 rounded">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Sem repetições</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-neutral-400 dark:text-neutral-500 text-center py-1">
                        Pendente
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
