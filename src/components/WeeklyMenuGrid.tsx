import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MealSlot, MenuType } from '../types';
import { CATEGORY_LABELS, normalizeSlotItems } from '../utils/validators';
import { 
  Sparkles, 
  Trash2, 
  AlertTriangle, 
  Plus, 
  Check, 
  Search, 
  X, 
  Lock,
  Eye,
  UtensilsCrossed,
  Scale,
  Soup,
  LogIn,
  Edit2,
  FileSpreadsheet
} from 'lucide-react';

interface WeeklyMenuGridProps {
  onOpenDishBank: () => void;
  onOpenSamplesTab?: (dayKey?: string) => void;
  onOpenRecipesTab?: () => void;
  onOpenSpreadsheet?: () => void;
  onOpenLogin?: () => void;
}

export const WeeklyMenuGrid: React.FC<WeeklyMenuGridProps> = ({ 
  onOpenDishBank, 
  onOpenSamplesTab, 
  onOpenRecipesTab,
  onOpenSpreadsheet,
  onOpenLogin 
}) => {
  const {
    currentMenu,
    previousMenu,
    previousMenu2,
    nextMenu,
    nextMenu2,
    updateMealSlot,
    addDishToSlot,
    editDishInSlot,
    removeDishFromSlot,
    currentUser,
    dishes,
    clearWeekDishes,
    conflicts,
    menuType,
    setMenuType,
    setSelectedDayForOptions,
    checkDishAvailability,
    isAdmin,
    isMaster,
  } = useApp();

  // Active cell editor modal state
  const [activeCell, setActiveCell] = useState<{
    dayKey: string;
    dayName: string;
    category: keyof MealSlot;
  } | null>(null);

  const [dishSearch, setDishSearch] = useState('');
  const [newItemName, setNewItemName] = useState('');

  // Inline editing state for existing dish items
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingItemText, setEditingItemText] = useState('');

  const dayKeys = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const;

  // The meal rows to display dynamically based on menuType (Rampa vs Kilo)
  const rows: { key: keyof MealSlot; label: string; icon: string; bgTint: string }[] =
    menuType === 'kilo'
      ? [
          { key: 'principal', label: 'Prato Principal / Grelhado', icon: '🥩', bgTint: 'bg-rose-50/50 dark:bg-rose-950/20' },
          { key: 'grelhadoNobre', label: 'Grelhado Nobre Especial', icon: '🔥', bgTint: 'bg-amber-50/50 dark:bg-amber-950/20' },
          { key: 'massaEspecial', label: 'Massa Artesanal / Especial', icon: '🍝', bgTint: 'bg-yellow-50/40 dark:bg-yellow-950/20' },
          { key: 'guarnicao', label: 'Guarnição da Pista Quente', icon: '🥔', bgTint: 'bg-orange-50/30 dark:bg-orange-950/15' },
          { key: 'acompanhamento', label: 'Acompanhamentos Base', icon: '🍚', bgTint: 'bg-neutral-50/60 dark:bg-neutral-800/40' },
          { key: 'salada', label: 'Salada da Pista Fria', icon: '🥬', bgTint: 'bg-green-50/30 dark:bg-green-950/20' },
          { key: 'saladaEspecial', label: 'Salada Especial / Carpaccio', icon: '🥑', bgTint: 'bg-teal-50/30 dark:bg-teal-950/20' },
          { key: 'sobremesa', label: 'Sobremesa & Balcão', icon: '🍮', bgTint: 'bg-purple-50/30 dark:bg-purple-950/20' },
        ]
      : [
          { key: 'principal', label: 'Prato Principal', icon: '🥩', bgTint: 'bg-rose-50/50 dark:bg-rose-950/20' },
          { key: 'guarnicao', label: 'Guarnição', icon: '🥔', bgTint: 'bg-orange-50/30 dark:bg-orange-950/15' },
          { key: 'acompanhamento', label: 'Acompanhamentos Base', icon: '🍚', bgTint: 'bg-neutral-50/60 dark:bg-neutral-800/40' },
          { key: 'salada', label: 'Salada do Dia', icon: '🥬', bgTint: 'bg-green-50/30 dark:bg-green-950/20' },
          { key: 'sobremesa', label: 'Sobremesa', icon: '🍮', bgTint: 'bg-purple-50/30 dark:bg-purple-950/20' },
        ];

  // Helper to check if a specific single dish has a repetition conflict
  const isDishConflicted = (dayKey: string, category: keyof MealSlot, dishName: string) => {
    if (!dishName || conflicts.length === 0) return null;
    const day = currentMenu.days[dayKey as keyof typeof currentMenu.days];
    if (!day) return null;

    return conflicts.find(
      (c) =>
        c.currentDayName === day.dayName &&
        c.category === category &&
        c.dishName.trim().toLowerCase() === dishName.trim().toLowerCase()
    ) || null;
  };

  // Smart Fill: Fills empty slots with dishes from DishBank that do NOT repeat within the 2-week window (W-2, W-1, W+1, W+2, and current week)
  const handleSmartAutofill = () => {
    if (!isAdmin) return;
    if (!confirm('Deseja preencher automaticamente os espaços vazios com pratos do banco respeitando o espaço mínimo de 2 semanas entre repetições?')) {
      return;
    }

    const forbiddenDishes = new Set<string>();

    const collectFromWeek = (w?: typeof currentMenu) => {
      if (!w) return;
      dayKeys.forEach((dK) => {
        const d = w.days[dK];
        if (d) {
          Object.values(d.lunch).forEach((val) => {
            normalizeSlotItems(val).forEach((dishStr) => {
              forbiddenDishes.add(dishStr.trim().toLowerCase());
            });
          });
        }
      });
    };

    // Forbid dishes from previous 2 weeks and next 2 weeks
    collectFromWeek(previousMenu);
    collectFromWeek(previousMenu2);
    collectFromWeek(nextMenu);
    collectFromWeek(nextMenu2);

    const usedInCurrentWeek = new Set<string>();
    dayKeys.forEach((dK) => {
      const d = currentMenu.days[dK];
      if (d) {
        Object.values(d.lunch).forEach((val) => {
          normalizeSlotItems(val).forEach((dishStr) => {
            usedInCurrentWeek.add(dishStr.trim().toLowerCase());
          });
        });
      }
    });

    dayKeys.forEach((dK) => {
      const day = currentMenu.days[dK];
      if (!day) return;

      rows.forEach((row) => {
        const currentItems = normalizeSlotItems(day.lunch[row.key]);
        if (currentItems.length === 0) {
          const candidates = dishes.filter(
            (dish) =>
              (dish.category === row.key || (row.key === 'grelhadoNobre' && dish.category === 'grelhado_nobre')) &&
              !forbiddenDishes.has(dish.name.trim().toLowerCase()) &&
              !usedInCurrentWeek.has(dish.name.trim().toLowerCase())
          );

          if (candidates.length > 0) {
            const picked = candidates[Math.floor(Math.random() * candidates.length)].name;
            updateMealSlot(dK, row.key, [picked]);
            usedInCurrentWeek.add(picked.trim().toLowerCase());
          }
        }
      });
    });
  };

  const handleCellClick = (dayKey: string, dayName: string, category: keyof MealSlot) => {
    if (!isAdmin) {
      setSelectedDayForOptions(dayKey);
      return;
    }
    setActiveCell({ dayKey, dayName, category });
    setDishSearch('');
    setNewItemName('');
    setEditingItemIndex(null);
    setEditingItemText('');
  };

  const handleAddNewItem = (dishName: string) => {
    if (!activeCell || !dishName.trim()) return;
    addDishToSlot(activeCell.dayKey, activeCell.category, dishName.trim());
    setNewItemName('');
  };

  const handleSaveEditItem = (index: number) => {
    if (!activeCell || !editingItemText.trim() || !isAdmin) return;
    const res = editDishInSlot(activeCell.dayKey, activeCell.category, index, editingItemText.trim());
    if (res?.success) {
      setEditingItemIndex(null);
      setEditingItemText('');
    } else if (res?.message) {
      alert(res.message);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (!activeCell) return;
    removeDishFromSlot(activeCell.dayKey, activeCell.category, index);
    if (editingItemIndex === index) {
      setEditingItemIndex(null);
      setEditingItemText('');
    }
  };

  // Filter candidates for active category
  const filteredCatalogDishes = activeCell
    ? dishes
        .filter((d) => {
          if (activeCell.category === 'grelhadoNobre') {
            return d.category === 'grelhado_nobre' || d.category === 'principal';
          }
          if (activeCell.category === 'massaEspecial') {
            return d.category === 'massa_especial' || d.category === 'vegetariano';
          }
          if (activeCell.category === 'saladaEspecial') {
            return d.category === 'salada_fria' || d.category === 'salada';
          }
          if (activeCell.category === 'principal') {
            return d.category === 'principal' || d.category === 'alternativa' || d.category === 'vegetariano';
          }
          if (activeCell.category === 'guarnicao') {
            return d.category === 'guarnicao' || d.category === 'vegetariano';
          }
          return d.category === activeCell.category;
        })
        .filter((d) =>
          dishSearch ? d.name.toLowerCase().includes(dishSearch.toLowerCase()) : true
        )
    : [];

  const activeDay = activeCell ? currentMenu.days[activeCell.dayKey as keyof typeof currentMenu.days] : null;
  const activeSlotItems = (activeCell && activeDay) ? normalizeSlotItems(activeDay.lunch[activeCell.category]) : [];

  return (
    <div className="space-y-4">
      
      {/* Modalidade Selector (Cardápio Rampa vs Cardápio Kilo) */}
      <div className="bg-white dark:bg-neutral-900 p-3 sm:p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">
            Modalidade de Restaurante
          </span>
          <div className="flex items-center gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl max-w-fit">
            <button
              onClick={() => setMenuType('rampa')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                menuType === 'rampa'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Soup className="w-4 h-4" />
              <span>Cardápio Rampa (Refeitório)</span>
            </button>

            <button
              onClick={() => setMenuType('kilo')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                menuType === 'kilo'
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Cardápio a Quilo (Restaurante Kilo)</span>
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          {onOpenSamplesTab && (
            <button
              onClick={() => onOpenSamplesTab()}
              title="Gerar e imprimir etiquetas de coleta de amostras de alimentos (RDC 216)"
              className="px-3 py-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-emerald-300 dark:border-emerald-800"
            >
              <span>🏷️ Etiquetas de Amostras</span>
            </button>
          )}

          {onOpenRecipesTab && (
            <button
              onClick={() => onOpenRecipesTab()}
              title="Ver Fichas Técnicas e calcular ingredientes por número de comensais (Pax)"
              className="px-3 py-2 text-xs font-semibold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900/60 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-amber-300 dark:border-amber-800"
            >
              <span>👨‍🍳 Receitas & Fichas (FTP)</span>
            </button>
          )}

          {onOpenSpreadsheet && (
            <button
              type="button"
              onClick={() => onOpenSpreadsheet()}
              title="Acessar a Tabela e Planilha Central (com Pedidos dos Usuários)"
              className="px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>📊 Tabela & Planilha</span>
            </button>
          )}

          {isAdmin ? (
            <>
              {isMaster ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 rounded-lg text-amber-950 dark:text-amber-200 text-xs font-bold shadow-2xs">
                  <span className="text-sm">👑</span>
                  <span>Master: Acesso Total ({currentUser?.name?.split(' ')[0] || 'Wesley'})</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 rounded-lg text-emerald-950 dark:text-emerald-200 text-xs font-bold shadow-2xs">
                  <span className="text-sm">🛡️</span>
                  <span>Admin Secundário ({currentUser?.name?.split(' ')[0] || 'Admin'})</span>
                </div>
              )}

              <button
                onClick={handleSmartAutofill}
                title="Preencher vagas vazias com sugestões variadas que não repetem a semana anterior"
                className="px-3 py-2 text-xs font-semibold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>Preenchimento Inteligente</span>
              </button>

              <button
                onClick={() => {
                  if (confirm(`Tem certeza de que deseja limpar todos os pratos desta semana (${menuType === 'rampa' ? 'Rampa' : 'Kilo'})?`)) {
                    clearWeekDishes();
                  }
                }}
                className="px-2.5 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="Limpar cardápio da semana"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpar</span>
              </button>
            </>
          ) : !currentUser ? (
            <button
              onClick={() => onOpenLogin?.()}
              title="Faça login com seu e-mail @cancaonova.com para editar o cardápio"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>Fazer Login para Editar</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-300 text-xs font-medium">
              <Eye className="w-3.5 h-3.5 text-neutral-400" />
              <span>Apenas Leitura ({currentUser.name.split(' ')[0]})</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Table Grid with Clickable Day Columns */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs overflow-hidden transition-colors">
        
        {/* Instruction subheader */}
        <div className="bg-neutral-50 dark:bg-neutral-800/60 px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Dica:</strong> Você pode adicionar <strong>mais de um prato por categoria</strong> (ex: 2 opções de carne ou guarnição). Clique no dia ou na célula para gerenciar.
            </span>
          </span>
          <span className="font-mono text-[11px] text-neutral-400 dark:text-neutral-500 hidden sm:inline">
            {menuType === 'rampa' ? 'Buffet Rampa' : 'Buffet Self-Service Kilo'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] border-collapse text-left">
            <thead>
              <tr className="bg-neutral-900 dark:bg-neutral-950 text-white text-xs">
                <th className="py-3 px-3 w-48 font-semibold uppercase tracking-wider text-[11px] border-r border-neutral-700 dark:border-neutral-800">
                  Item do Cardápio
                </th>
                {dayKeys.map((dKey) => {
                  const day = currentMenu.days[dKey];
                  return (
                    <th
                      key={dKey}
                      onClick={() => setSelectedDayForOptions(dKey)}
                      className="py-3 px-2 text-center border-r border-neutral-700 dark:border-neutral-800 last:border-r-0 min-w-[140px] cursor-pointer hover:bg-neutral-800 dark:hover:bg-neutral-900 transition-colors group select-none"
                      title={`Clique para ver todas as opções de ${day.dayName}`}
                    >
                      <div className="font-bold text-xs group-hover:text-amber-400 transition-colors">
                        {day.dayName}
                      </div>
                      <div className="text-[10px] text-neutral-300 dark:text-neutral-400 font-mono font-normal">
                        {day.dateStr}
                      </div>
                      
                      {/* Prominent Day Click Affordance */}
                      <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold bg-white/10 group-hover:bg-amber-600 text-neutral-200 group-hover:text-white px-2 py-0.5 rounded transition-all shadow-2xs">
                        <Eye className="w-3 h-3" />
                        <span>Ver Opções</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-xs">
              {rows.map((row) => (
                <tr key={row.key} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors">
                  {/* Category Header Cell */}
                  <td className={`py-3 px-3 font-semibold text-neutral-900 dark:text-neutral-100 border-r border-neutral-200 dark:border-neutral-800 ${row.bgTint}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{row.icon}</span>
                      <span className="leading-tight">{row.label}</span>
                    </div>
                  </td>

                  {/* Day Cells */}
                  {dayKeys.map((dKey) => {
                    const day = currentMenu.days[dKey];
                    const items = normalizeSlotItems(day?.lunch[row.key]);

                    return (
                      <td
                        key={dKey}
                        onClick={() => handleCellClick(dKey, day.dayName, row.key)}
                        className="py-2 px-2.5 border-r border-neutral-200 dark:border-neutral-800 last:border-r-0 align-top transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer hover:shadow-inner"
                      >
                        {items.length > 0 ? (
                          <div className="space-y-1.5">
                            {items.map((dishName, i) => {
                              const conflict = isDishConflicted(dKey, row.key, dishName);
                              return (
                                <div
                                  key={i}
                                  className={`p-1.5 rounded-lg border text-xs leading-snug transition-all ${
                                    conflict
                                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 text-amber-950 dark:text-amber-200'
                                      : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-1 group/card">
                                    <span className="font-medium break-words flex-1">
                                      {dishName}
                                    </span>
                                    {isAdmin && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCellClick(dKey, day.dayName, row.key);
                                          setEditingItemIndex(i);
                                          setEditingItemText(dishName);
                                        }}
                                        title={`Editar "${dishName}"`}
                                        className="text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 p-0.5 rounded opacity-0 group-hover/card:opacity-100 transition-opacity cursor-pointer shrink-0"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>

                                  {/* Warning if repeated */}
                                  {conflict && (
                                    <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                                      <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                      <span>Repetido Sem. {conflict.conflictWeekNumber}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {isAdmin && (
                              <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 pt-0.5">
                                <span>{items.length} {items.length === 1 ? 'item' : 'itens'}</span>
                                <span className="hover:text-amber-600 dark:hover:text-amber-400 font-semibold">+ Adicionar item</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-full min-h-[42px] flex items-center justify-center text-neutral-400 dark:text-neutral-500">
                            {isAdmin ? (
                              <span className="text-[11px] hover:text-amber-700 dark:hover:text-amber-400 flex items-center gap-1 transition-colors">
                                <Plus className="w-3 h-3" /> Adicionar item
                              </span>
                            ) : (
                              <span className="text-[11px] text-neutral-300 dark:text-neutral-600 italic">—</span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dish Selection / Multiple Items Edit Modal for Active Cell */}
      {activeCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-neutral-900 dark:bg-neutral-950 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold tracking-tight">
                  Gerenciar Itens: {CATEGORY_LABELS[activeCell.category]}
                </h3>
                <p className="text-xs text-neutral-300 dark:text-neutral-400 font-medium">
                  {activeCell.dayName} · Modalidade {menuType === 'rampa' ? 'Rampa' : 'Kilo'}
                </p>
              </div>
              <button
                onClick={() => setActiveCell(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              
              {/* Current Items List in this Category */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-200 mb-1.5 uppercase tracking-wider">
                  Itens cadastrados nesta categoria ({activeSlotItems.length}):
                </label>

                {activeSlotItems.length > 0 ? (
                  <div className="space-y-1.5 mb-3">
                    {activeSlotItems.map((dishStr, idx) => {
                      const conflict = isDishConflicted(activeCell.dayKey, activeCell.category, dishStr);
                      const isEditing = editingItemIndex === idx;

                      return (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                            conflict
                              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                              : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100'
                          }`}
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 w-full">
                              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                {idx + 1}
                              </span>
                              <input
                                type="text"
                                value={editingItemText}
                                onChange={(e) => setEditingItemText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveEditItem(idx);
                                  } else if (e.key === 'Escape') {
                                    setEditingItemIndex(null);
                                    setEditingItemText('');
                                  }
                                }}
                                placeholder="Novo nome da preparação..."
                                className="flex-1 px-2.5 py-1 text-xs border border-amber-500 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveEditItem(idx)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                                title="Salvar alteração do prato"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Salvar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingItemIndex(null);
                                  setEditingItemText('');
                                }}
                                className="px-2 py-1 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 text-neutral-700 dark:text-neutral-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
                                title="Cancelar edição"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 truncate flex-1">
                                <span className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="font-semibold truncate">{dishStr}</span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingItemIndex(idx);
                                      setEditingItemText(dishStr);
                                    }}
                                    className="p-1 text-neutral-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-medium"
                                    title={`Editar "${dishStr}"`}
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Editar</span>
                                  </button>
                                )}

                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(idx)}
                                    className="p-1 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors cursor-pointer shrink-0"
                                    title="Remover este item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 italic mb-3">
                    Nenhum prato adicionado ainda nesta categoria.
                  </p>
                )}
              </div>

              {/* Add New Item by Typing */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-2">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                  + Adicionar outro prato manualmente:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewItem(newItemName);
                      }
                    }}
                    placeholder="Ex: Purê de Batata com Noz-Moscada..."
                    className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleAddNewItem(newItemName)}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </div>

              {/* Or Select from Banco de Pratos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Ou clique para adicionar do Banco de Pratos:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCell(null);
                      onOpenDishBank();
                    }}
                    className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline font-semibold cursor-pointer"
                  >
                    Gerenciar Banco ↗
                  </button>
                </div>

                {/* Filter search */}
                <div className="relative mb-2">
                  <input
                    type="text"
                    value={dishSearch}
                    onChange={(e) => setDishSearch(e.target.value)}
                    placeholder="Filtrar pratos do banco..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2" />
                </div>

                {/* Dishes list */}
                <div className="max-h-48 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900">
                  {filteredCatalogDishes.length > 0 ? (
                    filteredCatalogDishes.map((dish) => {
                      const alreadyIn = activeSlotItems.some((it) => it.toLowerCase() === dish.name.toLowerCase());
                      const validation = activeCell ? checkDishAvailability(dish.name, activeCell.category, activeCell.dayKey) : { allowed: true };
                      const isBlocked = !validation.allowed;

                      return (
                        <button
                          key={dish.id}
                          type="button"
                          onClick={() => handleAddNewItem(dish.name)}
                          disabled={alreadyIn || isBlocked}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition-colors ${
                            alreadyIn
                              ? 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                              : isBlocked
                              ? 'bg-rose-50/40 dark:bg-rose-950/20 text-neutral-400 dark:text-neutral-500 cursor-not-allowed border-l-2 border-l-rose-500'
                              : 'hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <span className={`font-medium ${isBlocked ? 'text-neutral-400 dark:text-neutral-500 line-through' : 'text-neutral-900 dark:text-neutral-100'}`}>
                              {dish.name}
                            </span>
                            {isBlocked && validation.conflict && (
                              <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                                Servido na {validation.conflict.conflictDayName} (Sem. {validation.conflict.conflictWeekNumber})
                              </div>
                            )}
                            {!isBlocked && dish.calories && (
                              <span className="text-[10px] text-neutral-400 font-mono ml-2">
                                {dish.calories} kcal
                              </span>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            {alreadyIn ? (
                              <span className="text-[10px] font-semibold text-neutral-400">✓ Já incluso</span>
                            ) : isBlocked ? (
                              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/80 px-1.5 py-0.5 rounded">
                                ⛔ Bloqueado (&lt;2 sem.)
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">+ Adicionar</span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-neutral-400 dark:text-neutral-500">
                      Nenhum prato correspondente encontrado no catálogo.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="bg-neutral-50 dark:bg-neutral-800/60 px-5 py-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (activeCell && confirm('Remover todos os itens desta categoria neste dia?')) {
                    updateMealSlot(activeCell.dayKey, activeCell.category, []);
                    setActiveCell(null);
                  }
                }}
                className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-medium cursor-pointer"
              >
                Limpar Todos os Itens
              </button>

              <button
                type="button"
                onClick={() => setActiveCell(null)}
                className="px-4 py-1.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Concluir
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
