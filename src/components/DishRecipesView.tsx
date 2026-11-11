/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { MealSlot, MenuType } from '../types';
import { normalizeSlotItems, CATEGORY_LABELS } from '../utils/validators';
import { 
  DishRecipe, 
  RecipeIngredient, 
  CalculatedIngredient 
} from '../types/recipeTypes';
import { 
  CANONICAL_RECIPES, 
  getOrGenerateRecipe, 
  calculateRecipeForPax, 
  formatIngredientQuantity 
} from '../data/recipeDatabase';
import { triggerDirectPrint, openPrintableWindow } from '../utils/printHelper';
import { exportElementToPdf, printElementViaPdf } from '../utils/pdfHelper';
import { 
  ChefHat, 
  Users, 
  Search, 
  Printer, 
  FileDown, 
  ExternalLink, 
  ArrowLeft, 
  Clock, 
  Thermometer, 
  Sparkles, 
  BookOpen, 
  Utensils, 
  Layers, 
  Filter, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight, 
  Scale, 
  Flame, 
  Plus, 
  X, 
  Loader2,
  Calendar,
  Eye
} from 'lucide-react';

interface DishRecipesViewProps {
  onBackToMenu?: () => void;
}

export const DishRecipesView: React.FC<DishRecipesViewProps> = ({ onBackToMenu }) => {
  const { currentMenu, menuType, selectedWeek, selectedMonth, selectedYear, currentUser, isAdmin, isMaster } = useApp();

  // Number of people (Comensais / Pax) state
  const [numberOfPeople, setNumberOfPeople] = useState<number>(450);
  // Filter by week day: 'all' or dayKey ('seg', 'ter', 'qua', etc.)
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  // Category filter
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  // Search query
  const [searchQuery, setSearchQuery] = useState<string>('');
  // Active modal recipe for full technical sheet
  const [activeModalRecipe, setActiveModalRecipe] = useState<DishRecipe | null>(null);
  // PDF loading state
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);
  const modalSheetRef = useRef<HTMLDivElement>(null);

  const dayKeys = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const;

  // Extract all dishes present in the current weekly menu
  const weeklyMenuDishes = useMemo(() => {
    const list: { dayKey: string; dayName: string; category: string; dishName: string }[] = [];
    const seen = new Set<string>();

    dayKeys.forEach((dKey) => {
      const day = currentMenu.days[dKey];
      if (!day || !day.lunch) return;

      const catKeys = Object.keys(day.lunch) as (keyof MealSlot)[];
      catKeys.forEach((ck) => {
        if (ck === 'observacao' || ck === 'alternativa' || ck === 'vegetariano') return;
        const items = normalizeSlotItems(day.lunch[ck]);
        items.forEach((item) => {
          const combo = `${ck}__${item.toLowerCase()}`;
          list.push({
            dayKey: dKey,
            dayName: day.dayName.split('-')[0].trim(),
            category: ck,
            dishName: item,
          });
          seen.add(combo);
        });
      });
    });

    return list;
  }, [currentMenu]);

  // Combine unique dishes from the week + canonical database
  const allAvailableRecipes = useMemo(() => {
    const recipesMap = new Map<string, { recipe: DishRecipe; fromWeeklyMenu: boolean; daysScheduled: string[] }>();

    // 1. First add dishes from weekly menu
    weeklyMenuDishes.forEach(({ dayKey, dayName, category, dishName }) => {
      const key = dishName.trim().toLowerCase();
      const existing = recipesMap.get(key);
      if (existing) {
        if (!existing.daysScheduled.includes(dayName)) {
          existing.daysScheduled.push(dayName);
        }
      } else {
        const recipe = getOrGenerateRecipe(dishName, category);
        recipesMap.set(key, {
          recipe,
          fromWeeklyMenu: true,
          daysScheduled: [dayName],
        });
      }
    });

    // 2. Also register canonical dishes not in the current week
    Object.values(CANONICAL_RECIPES).forEach((recipe) => {
      const key = recipe.dishName.trim().toLowerCase();
      if (!recipesMap.has(key)) {
        recipesMap.set(key, {
          recipe,
          fromWeeklyMenu: false,
          daysScheduled: [],
        });
      }
    });

    return Array.from(recipesMap.values());
  }, [weeklyMenuDishes]);

  // Filtered recipes
  const filteredRecipes = useMemo(() => {
    return allAvailableRecipes.filter(({ recipe, fromWeeklyMenu, daysScheduled }) => {
      // Day filter
      if (selectedDayFilter !== 'all') {
        const targetDay = currentMenu.days[selectedDayFilter as keyof typeof currentMenu.days]?.dayName.split('-')[0].trim();
        if (!targetDay || !daysScheduled.includes(targetDay)) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all') {
        const cat = recipe.category.toLowerCase();
        if (selectedCategory === 'principal' && !cat.includes('principal') && !cat.includes('grelhado')) return false;
        if (selectedCategory === 'alternativa' && !cat.includes('alternativa')) return false;
        if (selectedCategory === 'vegetariano' && !cat.includes('vegetariano')) return false;
        if (selectedCategory === 'guarnicao' && !cat.includes('guarnicao')) return false;
        if (selectedCategory === 'acompanhamento' && !cat.includes('acompanhamento')) return false;
        if (selectedCategory === 'salada' && !cat.includes('salada')) return false;
        if (selectedCategory === 'sobremesa' && !cat.includes('sobremesa')) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = recipe.dishName.toLowerCase().includes(q);
        const matchesIng = recipe.ingredients.some((i) => i.name.toLowerCase().includes(q));
        const matchesStation = recipe.kitchenStation.toLowerCase().includes(q);
        if (!matchesName && !matchesIng && !matchesStation) return false;
      }

      return true;
    });
  }, [allAvailableRecipes, selectedDayFilter, selectedCategory, searchQuery, currentMenu]);

  // Direct print of current view or single recipe
  const handleDirectPrintModal = async () => {
    document.body.classList.remove('print-landscape', 'print-portrait');
    document.body.classList.add('print-portrait');
    window.focus();

    setTimeout(async () => {
      try {
        window.print();
      } catch (e) {
        console.warn('Native window.print failed:', e);
      }
      if (modalSheetRef.current) {
        try {
          await printElementViaPdf(modalSheetRef.current, 'portrait');
        } catch (err) {
          console.warn('PDF fallback print failed:', err);
        }
      }
    }, 150);
  };

  // Download PDF of single recipe
  const handleDownloadModalPdf = async (recipe: DishRecipe) => {
    if (!modalSheetRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const cleanName = recipe.dishName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Ficha_Tecnica_${cleanName}_${numberOfPeople}_Pessoas_Cancao_Nova.pdf`;
      await exportElementToPdf(modalSheetRef.current, filename, 'portrait');
    } catch (err) {
      console.error('Erro ao gerar PDF da receita:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Open recipe in external window with print dialog
  const handleOpenModalNewTab = (recipe: DishRecipe) => {
    if (modalSheetRef.current) {
      openPrintableWindow(
        `Ficha Técnica: ${recipe.dishName} (${numberOfPeople} Pessoas)`,
        modalSheetRef.current.innerHTML,
        'portrait'
      );
    }
  };

  const paxPresets = [50, 100, 200, 350, 450, 600, 1000, 1500];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header Card */}
      <div className="no-print bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                  Fichas Técnicas & Receituário dos Pratos
                </h1>
                <span className="text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-300/50">
                  Cálculo Per Capita por Comensais
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed max-w-2xl">
                Consulte as receitas completas de cada preparação do cardápio com unidades iniciais (per capita)
                e cálculo automático das quantidades totais brutas e líquidas com base no número de pessoas.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            {onBackToMenu && (
              <button
                type="button"
                onClick={onBackToMenu}
                className="px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao Cardápio</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (filteredRecipes.length > 0) {
                  setActiveModalRecipe(filteredRecipes[0].recipe);
                }
              }}
              className="px-3.5 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer border border-neutral-300 dark:border-neutral-700"
            >
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>Ver Ficha Técnica</span>
            </button>
          </div>

        </div>
      </div>

      {/* Pax (Número de Pessoas) Global Calculation Toolbar */}
      <div className="no-print bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Pax Control */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-neutral-100">
              <Users className="w-4 h-4 text-amber-600" />
              <span>Número de Pessoas (Comensais):</span>
            </div>

            <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 border border-neutral-300 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => setNumberOfPeople((prev) => Math.max(1, prev - 25))}
                className="px-2.5 py-1 text-xs font-black text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 rounded-lg cursor-pointer transition-colors"
                title="Diminuir 25 pessoas"
              >
                -
              </button>
              
              <input
                type="number"
                min="1"
                max="5000"
                value={numberOfPeople}
                onChange={(e) => setNumberOfPeople(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 px-2 py-1 text-center font-mono font-black text-sm bg-white dark:bg-neutral-900 text-amber-700 dark:text-amber-400 rounded-md border-0 focus:outline-none shadow-2xs"
              />

              <button
                type="button"
                onClick={() => setNumberOfPeople((prev) => prev + 25)}
                className="px-2.5 py-1 text-xs font-black text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 rounded-lg cursor-pointer transition-colors"
                title="Aumentar 25 pessoas"
              >
                +
              </button>
            </div>

            {/* Quick Pax Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-neutral-400 mr-1 hidden sm:inline">
                Atalhos:
              </span>
              {paxPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setNumberOfPeople(preset)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                    numberOfPeople === preset
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Todas as quantidades abaixo recalculadas em tempo real para <strong>{numberOfPeople} refeições</strong>.</span>
          </div>

        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="no-print bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs space-y-3">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Day Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>Dia da Semana:</span>
            </span>

            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedDayFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedDayFilter === 'all'
                    ? 'bg-white dark:bg-neutral-900 text-amber-700 dark:text-amber-400 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Todos os Pratos ({allAvailableRecipes.length})
              </button>

              {dayKeys.map((dKey) => {
                const day = currentMenu.days[dKey];
                const isSelected = selectedDayFilter === dKey;
                return (
                  <button
                    key={dKey}
                    type="button"
                    onClick={() => setSelectedDayFilter(dKey)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    {day?.dayName.split('-')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar receita ou ingrediente..."
              className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-2.5 top-2.5" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
          <span className="text-[11px] font-bold text-neutral-400 mr-1 uppercase tracking-wider">
            Categoria:
          </span>
          {[
            { id: 'all', label: 'Todas as Categorias' },
            { id: 'principal', label: '🥩 Carnes & Principais' },
            { id: 'alternativa', label: '🍗 Aves & Peixes' },
            { id: 'vegetariano', label: '🥗 Vegetarianos' },
            { id: 'guarnicao', label: '🥔 Guarnições' },
            { id: 'acompanhamento', label: '🍚 Arroz & Feijão' },
            { id: 'salada', label: '🥬 Saladas' },
            { id: 'sobremesa', label: '🍮 Sobremesas' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

      </div>

      {/* Recipe Cards Grid */}
      <div className="no-print grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map(({ recipe, fromWeeklyMenu, daysScheduled }) => {
            const calculation = calculateRecipeForPax(recipe, numberOfPeople);

            return (
              <div
                key={recipe.id}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-amber-500/60 transition-all group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/60">
                      {recipe.categoryLabel}
                    </span>
                    <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                      {recipe.kitchenStation}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 leading-snug group-hover:text-amber-600 transition-colors">
                    {recipe.dishName}
                  </h3>

                  {/* Schedule tags */}
                  {daysScheduled.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-1 mb-3">
                      <span className="text-[10px] font-mono text-neutral-400">Cardápio:</span>
                      {daysScheduled.map((d, i) => (
                        <span key={i} className="text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-1.5 py-0.2 rounded">
                          {d}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Technical Portion & Pax Yield Badge */}
                  <div className="grid grid-cols-2 gap-2 my-3 p-2 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 text-[11px]">
                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase font-bold">Unidade Inicial</span>
                      <strong className="text-neutral-800 dark:text-neutral-200">
                        {recipe.servingPortionGrams}g / pessoa
                      </strong>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase font-bold">Total p/ {numberOfPeople} pax</span>
                      <strong className="text-amber-700 dark:text-amber-400 font-mono font-bold">
                        ~{calculation.totalNetWeightKg} kg
                      </strong>
                    </div>
                  </div>

                  {/* Ingredients Preview Table */}
                  <div className="space-y-1.5 border-t border-neutral-100 dark:border-neutral-800 pt-2.5">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-neutral-400 tracking-wider">
                      <span>Ingrediente</span>
                      <div className="flex items-center gap-3">
                        <span>Per Capita</span>
                        <span className="text-amber-700 dark:text-amber-400 font-mono">P/ {numberOfPeople} pess.</span>
                      </div>
                    </div>

                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
                      {calculation.ingredients.slice(0, 4).map((ing) => (
                        <div key={ing.id} className="py-1 flex items-center justify-between gap-2">
                          <span className="text-neutral-700 dark:text-neutral-300 font-medium truncate max-w-[150px]">
                            {ing.name}
                          </span>
                          <div className="flex items-center gap-3 shrink-0 text-right">
                            <span className="text-[11px] text-neutral-400 font-mono">
                              {ing.perCapitaAmount}{ing.initialUnit}
                            </span>
                            <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 w-16 text-right">
                              {ing.formattedGross}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {calculation.ingredients.length > 4 && (
                      <div className="text-[10px] text-neutral-400 text-center pt-1 font-medium italic">
                        + {calculation.ingredients.length - 4} outros ingredientes calculados
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Button */}
                <button
                  type="button"
                  onClick={() => setActiveModalRecipe(recipe)}
                  className="mt-4 w-full py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-600 text-neutral-800 dark:text-neutral-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs group-hover:bg-amber-600 group-hover:text-white"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Ficha Técnica Completa</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
            <BookOpen className="w-10 h-10 text-neutral-400 mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Nenhuma receita encontrada</h3>
            <p className="text-xs text-neutral-400 mt-1">Tente ajustar os filtros de dia, categoria ou termo de busca.</p>
          </div>
        )}
      </div>

      {/* Detailed Recipe Modal (Ficha Técnica Operacional / Receituário Canção Nova) */}
      {activeModalRecipe && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs overflow-y-auto p-4 sm:p-6 flex flex-col items-center print-modal-overlay print:static print:p-0 print:m-0 print:bg-white print:block print:w-full">
          
          {/* Modal Header Control Bar (Hidden on print) */}
          <div className="no-print w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 p-4 mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-xs">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <span>Ficha Técnica de Preparo (FTP)</span>
                  <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded">
                    {activeModalRecipe.categoryLabel}
                  </span>
                </h2>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {activeModalRecipe.dishName} · Calculado para <strong>{numberOfPeople} pessoas</strong>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDirectPrintModal}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer hover:shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Mandar para Impressora</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadModalPdf(activeModalRecipe)}
                disabled={isGeneratingPdf}
                className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-rose-300 dark:border-rose-800 shadow-2xs disabled:opacity-60"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                ) : (
                  <FileDown className="w-4 h-4 text-rose-600" />
                )}
                <span>{isGeneratingPdf ? 'Gerando PDF...' : 'Baixar em PDF'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenModalNewTab(activeModalRecipe)}
                title="Abre a ficha técnica em nova aba com disparo automático da impressora"
                className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-neutral-300 dark:border-neutral-700"
              >
                <ExternalLink className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">Nova Aba</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalRecipe(null)}
                className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Sheet (Standard A4 Culinary FTP Document) */}
          <div
            ref={modalSheetRef}
            className="print-container printable-sheet w-full max-w-4xl bg-white text-black p-8 rounded-2xl shadow-2xl border border-neutral-300 print:p-0 print:border-none print:shadow-none print:max-w-none print:m-0"
          >
            {/* Sheet Header */}
            <div className="border-b-2 border-black pb-4 mb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600 block">
                  RESTAURANTE CANÇÃO NOVA · SETOR DE NUTRIÇÃO & GASTRONOMIA
                </span>
                <h1 className="text-2xl font-black uppercase tracking-tight text-black mt-0.5">
                  {activeModalRecipe.dishName}
                </h1>
                <span className="text-xs font-bold text-neutral-700">
                  Ficha Técnica de Preparação (FTP) · {activeModalRecipe.categoryLabel}
                </span>
              </div>

              <div className="text-right">
                <div className="text-xs font-mono font-bold bg-neutral-100 px-3 py-1 rounded border border-black inline-block">
                  CÁLCULO: {numberOfPeople} REFEIÇÕES
                </div>
                <div className="text-[10px] text-neutral-600 mt-1">
                  Estação: <strong>{activeModalRecipe.kitchenStation}</strong>
                </div>
              </div>
            </div>

            {/* Technical Metadata Ribbon */}
            <div className="grid grid-cols-4 gap-2 p-3 bg-neutral-100 rounded-lg border border-black text-xs mb-5">
              <div>
                <span className="font-bold text-[10px] uppercase text-neutral-600 block">Porção Servida:</span>
                <strong className="text-sm">{activeModalRecipe.servingPortionGrams}g</strong>
              </div>
              <div>
                <span className="font-bold text-[10px] uppercase text-neutral-600 block">Temp. Serviço:</span>
                <strong className="text-xs">{activeModalRecipe.servingTemperature}</strong>
              </div>
              <div>
                <span className="font-bold text-[10px] uppercase text-neutral-600 block">Tempo Cocção:</span>
                <strong className="text-xs">{activeModalRecipe.prepTimeMinutes} minutos</strong>
              </div>
              <div>
                <span className="font-bold text-[10px] uppercase text-neutral-600 block">Complexidade:</span>
                <strong className="text-xs">{activeModalRecipe.difficulty}</strong>
              </div>
            </div>

            {/* Ingredients Table with Pax Calculation */}
            {(() => {
              const calc = calculateRecipeForPax(activeModalRecipe, numberOfPeople);

              return (
                <div className="space-y-4 mb-6">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-1 mb-2 flex items-center justify-between">
                      <span>1. Composição de Ingredientes & Quantidades Calculadas</span>
                      <span className="text-[11px] font-mono font-normal">
                        Peso Bruto Total Requisitado: <strong>{calc.totalGrossWeightKg} kg</strong>
                      </span>
                    </h3>

                    <table className="w-full border-collapse border border-black text-xs">
                      <thead>
                        <tr className="bg-neutral-200 border-b border-black text-left font-bold text-[11px]">
                          <th className="border border-black p-2">Item</th>
                          <th className="border border-black p-2">Ingrediente / Insumo</th>
                          <th className="border border-black p-2 text-center">Unidade Inicial (Per Capita)</th>
                          <th className="border border-black p-2 text-center">Fator Correção (FC)</th>
                          <th className="border border-black p-2 text-right">Qtd. Líquida Total</th>
                          <th className="border border-black p-2 text-right font-black">Qtd. Bruta (Estoque)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calc.ingredients.map((ing, idx) => (
                          <tr key={ing.id} className="border-b border-black hover:bg-neutral-50">
                            <td className="border border-black p-2 font-mono text-[11px] text-center">{idx + 1}</td>
                            <td className="border border-black p-2 font-semibold">
                              <div>{ing.name}</div>
                              {ing.specification && (
                                <div className="text-[10px] text-neutral-600 italic font-normal">{ing.specification}</div>
                              )}
                            </td>
                            <td className="border border-black p-2 text-center font-mono font-bold">
                              {ing.perCapitaAmount} {ing.initialUnit}
                            </td>
                            <td className="border border-black p-2 text-center font-mono">
                              {ing.correctionFactor ? ing.correctionFactor.toFixed(2) : '1.00'}
                            </td>
                            <td className="border border-black p-2 text-right font-mono text-neutral-800">
                              {ing.formattedNet}
                            </td>
                            <td className="border border-black p-2 text-right font-mono font-black text-black">
                              {ing.formattedGross}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-neutral-100 font-bold border-t-2 border-black text-[11px]">
                          <td colSpan={4} className="border border-black p-2 text-right uppercase">
                            Total Geral da Ordem de Produção ({numberOfPeople} comensais):
                          </td>
                          <td className="border border-black p-2 text-right font-mono">
                            {calc.totalNetWeightKg} kg
                          </td>
                          <td className="border border-black p-2 text-right font-mono font-black text-black">
                            {calc.totalGrossWeightKg} kg
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Step-by-Step Preparation Method */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-1 mb-2">
                      2. Modo de Preparo Operacional (Instruções da Cozinha)
                    </h3>
                    <ol className="list-decimal pl-5 space-y-1.5 text-xs text-neutral-900 leading-relaxed">
                      {activeModalRecipe.preparationSteps.map((step, idx) => (
                        <li key={idx} className="pl-1">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Equipment & Utensils */}
                  <div className="grid grid-cols-2 gap-4 border-t border-black pt-3 text-xs">
                    <div>
                      <h4 className="font-bold uppercase text-[10px] text-neutral-600 mb-1">
                        Equipamentos & Utensílios:
                      </h4>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                        {activeModalRecipe.equipment.map((eq, i) => (
                          <li key={i}>{eq}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold uppercase text-[10px] text-neutral-600 mb-1">
                        Ponto Crítico Sanitário (RDC 216 / ANVISA):
                      </h4>
                      <p className="text-[11px] text-neutral-700 leading-snug">
                        Coleta de amostra testemunha obrigatória por 72h. Temperatura de distribuição acima de 65°C
                        ou abaixo de 10°C para frios. Higiene rigorosa dos manipuladores.
                      </p>
                    </div>
                  </div>

                  {/* Chef Notes & Footer */}
                  {activeModalRecipe.chefNotes && (
                    <div className="p-2.5 bg-neutral-100 rounded border border-black text-[11px] italic text-neutral-800">
                      <strong>Dica da Chef:</strong> {activeModalRecipe.chefNotes}
                    </div>
                  )}

                  <div className="pt-4 border-t border-black flex items-center justify-between text-[10px] text-neutral-600">
                    <div>Ficha Técnica Operacional · Sistema de Alimentação Coletiva Canção Nova</div>
                    <div>Aprovado por: <strong>Coordenação de Nutrição & Gastronomia</strong></div>
                  </div>
                </div>
              );
            })()}

          </div>

        </div>
      )}

    </div>
  );
};
