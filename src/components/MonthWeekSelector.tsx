import React from 'react';
import { useApp } from '../context/AppContext';
import { MONTH_NAMES } from '../utils/validators';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle2, Clock, FileCheck } from 'lucide-react';

export const MonthWeekSelector: React.FC = () => {
  const {
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    selectedWeek,
    setSelectedWeek,
    currentMenu,
    setWeeklyStatus,
    currentUser,
    conflicts,
    isAdmin,
  } = useApp();

  // Calculate week dates
  const weeks = [
    { num: 1, label: 'Semana 1', dates: '01 a 07' },
    { num: 2, label: 'Semana 2', dates: '08 a 14' },
    { num: 3, label: 'Semana 3', dates: '15 a 21' },
    { num: 4, label: 'Semana 4', dates: '22 a 28' },
    { num: 5, label: 'Semana 5', dates: '29 a 31' },
  ];

  return (
    <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Row 1: Year and Month Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          
          {/* Year selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5 border border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => setSelectedYear(selectedYear - 1)}
                className="p-1 hover:bg-white dark:hover:bg-neutral-700 rounded text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Ano Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2.5 py-0.5 text-xs font-bold font-mono text-neutral-800 dark:text-neutral-100">
                {selectedYear}
              </span>
              <button
                onClick={() => setSelectedYear(selectedYear + 1)}
                className="p-1 hover:bg-white dark:hover:bg-neutral-700 rounded text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Próximo Ano"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 ml-2">
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              <span>Planejamento Anual Completo</span>
            </div>
          </div>

          {/* Month selector tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {MONTH_NAMES.map((monthName, idx) => {
              const mNum = idx + 1;
              const isSelected = selectedMonth === mNum;
              return (
                <button
                  key={mNum}
                  onClick={() => setSelectedMonth(mNum)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-amber-600 text-white font-bold shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {monthName.substring(0, 3)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Week selector & status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
          {/* Weeks list */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {weeks.map((w) => {
              const isSelected = selectedWeek === w.num;
              return (
                <button
                  key={w.num}
                  onClick={() => setSelectedWeek(w.num)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer border ${
                    isSelected
                      ? 'bg-neutral-900 dark:bg-amber-600 text-white border-neutral-900 dark:border-amber-600 shadow-xs'
                      : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700/60'
                  }`}
                >
                  <span className="font-semibold">{w.label}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    isSelected ? 'bg-neutral-800 dark:bg-amber-700 text-neutral-300 dark:text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                  }`}>
                    {w.dates}/{String(selectedMonth).padStart(2, '0')}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Week status & Action */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-neutral-500 dark:text-neutral-400 font-medium">Status do Cardápio:</span>
              {isAdmin ? (
                <select
                  value={currentMenu.status}
                  onChange={(e) => setWeeklyStatus(e.target.value as any)}
                  className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 font-semibold text-xs rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer"
                >
                  <option value="planejamento">Em Planejamento</option>
                  <option value="aprovado">Aprovado pela Nutrição</option>
                  <option value="publicado">Publicado no Mural</option>
                </select>
              ) : (
                <span className={`inline-flex items-center gap-1 font-semibold text-xs px-2.5 py-0.5 rounded-full ${
                  currentMenu.status === 'publicado'
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                    : currentMenu.status === 'aprovado'
                    ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300'
                    : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                }`}>
                  {currentMenu.status === 'publicado' && <CheckCircle2 className="w-3 h-3" />}
                  {currentMenu.status === 'aprovado' && <FileCheck className="w-3 h-3" />}
                  {currentMenu.status === 'planejamento' && <Clock className="w-3 h-3" />}
                  {currentMenu.status === 'publicado' ? 'Publicado' : currentMenu.status === 'aprovado' ? 'Aprovado' : 'Em Edição'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
