import React from 'react';
import { RepetitionConflict } from '../types';
import { ShieldAlert, X, AlertOctagon, Calendar, Sparkles } from 'lucide-react';

interface BlockedDishModalProps {
  conflict: RepetitionConflict | null;
  dishName: string;
  reason?: string;
  onClose: () => void;
}

export const BlockedDishModal: React.FC<BlockedDishModalProps> = ({
  conflict,
  dishName,
  reason,
  onClose,
}) => {
  if (!conflict && !dishName) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-rose-200 dark:border-rose-900/60 flex flex-col">
        {/* Modal Header with Warning Accent */}
        <div className="bg-rose-600 dark:bg-rose-700 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                Não é Permitido Adicionar este Prato!
              </h3>
              <p className="text-[11px] text-rose-100">
                Regra de Espaço Mínimo de 2 Semanas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3.5 space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-800 dark:text-rose-300">
              Prato Bloqueado:
            </div>
            <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {dishName}
            </div>
            {conflict?.categoryLabel && (
              <span className="inline-block text-[10px] font-semibold bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 px-2 py-0.5 rounded">
                Categoria: {conflict.categoryLabel}
              </span>
            )}
          </div>

          {/* Conflict Details */}
          {conflict && (
            <div className="space-y-2 bg-neutral-50 dark:bg-neutral-800/60 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-semibold">
                <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Ocorrência Detectada:</span>
              </div>
              <ul className="space-y-1 text-neutral-600 dark:text-neutral-300 pl-6 list-disc">
                <li>
                  Servido na: <strong>{conflict.conflictDayName}</strong>
                </li>
                <li>
                  Semana: <strong>Semana {conflict.conflictWeekNumber}</strong>
                  {conflict.conflictMonth ? ` (Mês ${conflict.conflictMonth})` : ''}
                </li>
                <li>
                  Relação de tempo:{' '}
                  <strong className="text-rose-600 dark:text-rose-400">
                    {conflict.direction === 'anterior'
                      ? conflict.weeksDistance === 1
                        ? 'Semana anterior imediata'
                        : 'Há 2 semanas atrás'
                      : conflict.direction === 'seguinte'
                      ? conflict.weeksDistance === 1
                        ? 'Semana seguinte imediata'
                        : 'Daqui a 2 semanas'
                      : 'Mesma semana em outro dia'}
                  </strong>
                </li>
              </ul>
            </div>
          )}

          {/* Explanation Notice */}
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-[11px]">
            {reason ||
              'A diretriz de cardápio do Restaurante Canção Nova proíbe pratos que foram servidos na semana anterior e exige um espaçamento mínimo de 2 semanas de intervalo entre repetições.'}
          </p>

          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 p-2.5 rounded-lg text-[11px] text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Por favor, selecione outro prato ou utilize as opções do Banco de Pratos.</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-neutral-50 dark:bg-neutral-800/80 px-5 py-3 border-t border-neutral-200 dark:border-neutral-700 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 text-white dark:text-neutral-900 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
          >
            Entendido, escolher outro prato
          </button>
        </div>
      </div>
    </div>
  );
};
