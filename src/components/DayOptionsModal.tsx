import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MealSlot } from '../types';
import { CATEGORY_LABELS, normalizeSlotItems } from '../utils/validators';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Search, 
  Info,
  Lock,
  Ban,
  ShieldAlert,
  Tag,
  LogIn
} from 'lucide-react';

interface DayOptionsModalProps {
  onOpenSampleLabels?: (dayKey: string) => void;
  onOpenLogin?: () => void;
}

export const DayOptionsModal: React.FC<DayOptionsModalProps> = ({ onOpenSampleLabels, onOpenLogin }) => {
  const {
    selectedDayForOptions,
    setSelectedDayForOptions,
    currentMenu,
    menuType,
    currentUser,
    dishes,
    addDishToSlot,
    removeDishFromSlot,
    conflicts,
    checkDishAvailability,
    isAdmin,
    isMaster,
  } = useApp();

  const [addingCategory, setAddingCategory] = useState<keyof MealSlot | null>(null);
  const [dishSearch, setDishSearch] = useState('');
  const [manualName, setManualName] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  if (!selectedDayForOptions) return null;

  const dayKeys = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const;
  const currentDayIndex = dayKeys.indexOf(selectedDayForOptions as any);
  const day = currentMenu.days[selectedDayForOptions as keyof typeof currentMenu.days];

  if (!day) return null;

  // Navigate to previous day
  const handlePrevDay = () => {
    const prevIdx = (currentDayIndex - 1 + 7) % 7;
    setSelectedDayForOptions(dayKeys[prevIdx]);
    setAddingCategory(null);
    setInputError(null);
  };

  // Navigate to next day
  const handleNextDay = () => {
    const nextIdx = (currentDayIndex + 1) % 7;
    setSelectedDayForOptions(dayKeys[nextIdx]);
    setAddingCategory(null);
    setInputError(null);
  };

  // Define rows based on menuType (Rampa vs Kilo)
  const rows: { key: keyof MealSlot; label: string; icon: string; highlight?: boolean }[] =
    menuType === 'kilo'
      ? [
          { key: 'principal', label: 'Prato Principal / Grelhado da Casa', icon: '🥩', highlight: true },
          { key: 'grelhadoNobre', label: 'Grelhado Nobre Especial', icon: '🔥', highlight: true },
          { key: 'alternativa', label: 'Opção de Ave ou Peixe', icon: '🍗' },
          { key: 'massaEspecial', label: 'Massa Artesanal / Especialidade', icon: '🍝' },
          { key: 'vegetariano', label: 'Opção Vegetariana', icon: '🥗' },
          { key: 'guarnicao', label: 'Guarnição da Pista Quente', icon: '🥔' },
          { key: 'acompanhamento', label: 'Acompanhamentos Base (Arroz & Feijão)', icon: '🍚' },
          { key: 'salada', label: 'Salada Principal / Pista Fria', icon: '🥬' },
          { key: 'saladaEspecial', label: 'Salada Especial / Carpaccio / Frios', icon: '🥑' },
          { key: 'sobremesa', label: 'Sobremesa do Balcão & Frutas', icon: '🍮' },
        ]
      : [
          { key: 'principal', label: 'Prato Principal (Carne)', icon: '🥩', highlight: true },
          { key: 'alternativa', label: 'Opção Alternativa (Ave/Peixe)', icon: '🍗' },
          { key: 'vegetariano', label: 'Opção Vegetariana', icon: '🥗' },
          { key: 'guarnicao', label: 'Guarnição', icon: '🥔' },
          { key: 'acompanhamento', label: 'Acompanhamentos Base', icon: '🍚' },
          { key: 'salada', label: 'Salada do Dia', icon: '🥬' },
          { key: 'sobremesa', label: 'Sobremesa', icon: '🍮' },
        ];

  // Check if a specific single dish has a conflict
  const getConflictForDish = (category: keyof MealSlot, dishName: string) => {
    if (!dishName) return null;
    return conflicts.find(
      (c) =>
        c.currentDayName === day.dayName &&
        c.category === category &&
        c.dishName.trim().toLowerCase() === dishName.trim().toLowerCase()
    );
  };

  const handleStartAdd = (catKey: keyof MealSlot) => {
    if (!isAdmin) return;
    setAddingCategory(catKey);
    setManualName('');
    setDishSearch('');
    setInputError(null);
  };

  const handleConfirmAdd = (dishName: string) => {
    if (!addingCategory || !dishName.trim()) return;

    // Check availability
    const validation = checkDishAvailability(dishName.trim(), addingCategory, selectedDayForOptions);
    if (!validation.allowed) {
      setInputError(validation.reason || 'Prato não permitido devido à regra de 2 semanas de intervalo.');
      // addDishToSlot will also trigger global BlockedDishModal
      addDishToSlot(selectedDayForOptions, addingCategory, dishName.trim());
      return;
    }

    const res = addDishToSlot(selectedDayForOptions, addingCategory, dishName.trim());
    if (res.success) {
      setManualName('');
      setAddingCategory(null);
      setInputError(null);
    } else if (res.message) {
      setInputError(res.message);
    }
  };

  const handleRemoveSingleItem = (catKey: keyof MealSlot, index: number) => {
    if (!isAdmin) return;
    removeDishFromSlot(selectedDayForOptions, catKey, index);
  };

  // Filter candidate dishes from bank
  const catalogDishes = addingCategory
    ? dishes
        .filter((d) => {
          if (addingCategory === 'grelhadoNobre') {
            return d.category === 'grelhado_nobre' || d.category === 'principal';
          }
          if (addingCategory === 'massaEspecial') {
            return d.category === 'massa_especial' || d.category === 'vegetariano';
          }
          if (addingCategory === 'saladaEspecial') {
            return d.category === 'salada_fria' || d.category === 'salada';
          }
          return d.category === addingCategory;
        })
        .filter((d) =>
          dishSearch ? d.name.toLowerCase().includes(dishSearch.toLowerCase()) : true
        )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-neutral-200 dark:border-neutral-800 transition-colors">
        
        {/* Modal Header */}
        <div className="bg-neutral-900 dark:bg-neutral-950 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  Opções do Dia: {day.dayName}
                </h2>
                <span className="text-xs font-mono font-bold bg-neutral-800 text-amber-300 px-2 py-0.5 rounded">
                  {day.dateStr}
                </span>
              </div>
              <p className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
                <span>Modalidade:</span>
                <span className="font-semibold text-white">
                  {menuType === 'rampa' ? '🍲 Cardápio Rampa (Refeitório)' : '⚖️ Cardápio a Quilo (Restaurante)'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Day switcher arrows */}
            <div className="flex items-center bg-neutral-800 rounded-lg p-0.5 mr-2">
              <button
                onClick={handlePrevDay}
                className="p-1.5 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded transition-colors cursor-pointer"
                title="Dia Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-medium text-neutral-300">
                {day.dayShort}
              </span>
              <button
                onClick={handleNextDay}
                className="p-1.5 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded transition-colors cursor-pointer"
                title="Próximo Dia"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setSelectedDayForOptions(null)}
              className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1 bg-neutral-50/50 dark:bg-neutral-950/40">
          
          {/* Strict 2-Week Spacing Banner */}
          <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Regra de Não-Repetição Ativa (Espaço Mínimo de 2 Semanas):</span>{' '}
              Não é permitido adicionar pratos servidos na semana anterior ou com menos de 2 semanas de intervalo.
              O sistema bloqueia automaticamente opções já utilizadas recentemente.
            </div>
          </div>

          {/* Quick instructions / status bar */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-neutral-600 dark:text-neutral-300">
                {isAdmin
                  ? 'Você pode cadastrar múltiplos pratos para a mesma categoria. Pratos bloqueados pela regra das 2 semanas são desabilitados.'
                  : currentUser
                  ? `Modo Apenas Leitura (${currentUser.name}): visualização das opções alimentares deste dia.`
                  : 'Modo Visitante (Desconectado): visualização das opções deste dia.'}
              </span>
              {!currentUser && onOpenLogin && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDayForOptions(null);
                    onOpenLogin();
                  }}
                  className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <LogIn className="w-3 h-3" />
                  <span>Fazer Login para Editar</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0 font-medium">
              <span className="text-neutral-500 dark:text-neutral-400">Semana {currentMenu.weekNumber}</span>
              <span className="text-neutral-300 dark:text-neutral-600">·</span>
              <span className="text-amber-700 dark:text-amber-400 font-semibold">{currentMenu.startDate} a {currentMenu.endDate}</span>
            </div>
          </div>

          {/* Options List */}
          <div className="space-y-3">
            {rows.map((row) => {
              const items = normalizeSlotItems(day.lunch[row.key]);
              const isAddingToThis = addingCategory === row.key;

              return (
                <div
                  key={row.key}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    
                    {/* Category Label and Icon */}
                    <div className="flex items-center gap-2">
                      <span className="text-lg leading-none">{row.icon}</span>
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                        {row.label}
                      </span>
                      {row.highlight && (
                        <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.2 rounded">
                          Destaque
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">
                        ({items.length} {items.length === 1 ? 'item' : 'itens'})
                      </span>
                    </div>

                    {/* Add Item Button */}
                    {isAdmin && !isAddingToThis && (
                      <button
                        type="button"
                        onClick={() => handleStartAdd(row.key)}
                        className="px-2.5 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-lg border border-amber-200 dark:border-amber-800 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Item</span>
                      </button>
                    )}
                  </div>

                  {/* List of dishes in this category */}
                  {items.length > 0 ? (
                    <div className="space-y-1.5">
                      {items.map((dishStr, idx) => {
                        const conflict = getConflictForDish(row.key, dishStr);
                        return (
                          <div
                            key={idx}
                            className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                              conflict
                                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200'
                                : 'bg-neutral-50 dark:bg-neutral-800/70 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {idx + 1}
                              </span>
                              <span className="font-semibold text-sm truncate">{dishStr}</span>

                              {conflict && (
                                <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 px-2 py-0.5 rounded">
                                  <Ban className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                  <span>
                                    {conflict.direction === 'anterior'
                                      ? conflict.weeksDistance === 1
                                        ? `Repetido da Sem. Anterior (${conflict.conflictDayName})`
                                        : `Repetido há 2 semanas (Sem. ${conflict.conflictWeekNumber})`
                                      : `Conflito Sem. ${conflict.conflictWeekNumber}`}
                                  </span>
                                </span>
                              )}
                            </div>

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSingleItem(row.key, idx)}
                                className="p-1 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors cursor-pointer shrink-0"
                                title="Remover item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 italic py-1">
                      Nenhum item cadastrado para esta categoria.
                    </p>
                  )}

                  {/* Inline Form to add an item to this category */}
                  {isAddingToThis && (
                    <div className="mt-3 p-3 bg-neutral-50 dark:bg-neutral-800/80 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-3 animate-in fade-in duration-100">
                      
                      {inputError && (
                        <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 p-2.5 rounded-lg text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                          <Ban className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                          <span>{inputError}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-200 mb-1">
                          Digitar nome do prato:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={manualName}
                            onChange={(e) => {
                              setManualName(e.target.value);
                              setInputError(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleConfirmAdd(manualName);
                              }
                            }}
                            placeholder="Ex: Alcatra ao Molho Madeira..."
                            className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleConfirmAdd(manualName)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>

                      {/* Pick from catalog with active 2-week blocking indicators */}
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-200 mb-1">
                          Ou escolha uma opção do Banco de Pratos:
                        </label>
                        <div className="relative mb-1.5">
                          <input
                            type="text"
                            value={dishSearch}
                            onChange={(e) => setDishSearch(e.target.value)}
                            placeholder="Filtrar pratos do banco..."
                            className="w-full pl-8 pr-3 py-1 text-xs bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                          <Search className="w-3 h-3 text-neutral-400 absolute left-2.5 top-2" />
                        </div>

                        <div className="max-h-44 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900">
                          {catalogDishes.map((cd) => {
                            const validation = checkDishAvailability(cd.name, addingCategory, selectedDayForOptions);
                            const isBlocked = !validation.allowed;
                            const alreadyInSlot = items.some((it) => it.toLowerCase() === cd.name.toLowerCase());

                            return (
                              <button
                                key={cd.id}
                                type="button"
                                onClick={() => handleConfirmAdd(cd.name)}
                                disabled={isBlocked || alreadyInSlot}
                                className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition-colors ${
                                  alreadyInSlot
                                    ? 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                                    : isBlocked
                                    ? 'bg-rose-50/40 dark:bg-rose-950/20 text-neutral-400 dark:text-neutral-500 cursor-not-allowed border-l-2 border-l-rose-500'
                                    : 'hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer'
                                }`}
                              >
                                <div className="truncate pr-2">
                                  <span className={`font-medium ${isBlocked ? 'text-neutral-400 dark:text-neutral-500 line-through' : 'text-neutral-800 dark:text-neutral-200'}`}>
                                    {cd.name}
                                  </span>
                                  {isBlocked && validation.conflict && (
                                    <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 mt-0.5">
                                      <Ban className="w-3 h-3 shrink-0" />
                                      <span>
                                        Bloqueado: Servido na {validation.conflict.conflictDayName} (Sem. {validation.conflict.conflictWeekNumber})
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="shrink-0 text-right">
                                  {alreadyInSlot ? (
                                    <span className="text-[10px] font-semibold text-neutral-400">
                                      Já incluso
                                    </span>
                                  ) : isBlocked ? (
                                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/80 px-1.5 py-0.5 rounded">
                                      ⛔ Bloqueado (&lt;2 sem.)
                                    </span>
                                  ) : (
                                    <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                                      + Incluir
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setAddingCategory(null);
                            setInputError(null);
                          }}
                          className="px-3 py-1 text-xs text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-neutral-50 dark:bg-neutral-800/80 px-5 py-3 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-neutral-400" />
            <span>
              Múltiplos itens por categoria. Respeite o intervalo mínimo de 2 semanas.
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onOpenSampleLabels && (
              <button
                type="button"
                onClick={() => {
                  onOpenSampleLabels(selectedDayForOptions);
                  setSelectedDayForOptions(null);
                }}
                className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
                title="Imprimir etiquetas de amostras de alimentos deste dia (RDC 216)"
              >
                <Tag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Etiquetas de Amostras ({day.dayShort})</span>
              </button>
            )}

            <button
              onClick={() => setSelectedDayForOptions(null)}
              className="px-4 py-1.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
            >
              Concluir & Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
