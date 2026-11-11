/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { MealSlot, FruitOrderItem, ClientRampaOrder, ClientMealItemRequest } from '../types';
import { normalizeSlotItems, getWeekDates } from '../utils/validators';
import { CANONICAL_FRUITS, AvailableFruit } from '../data/clientOrdersData';
import { triggerDirectPrint } from '../utils/printHelper';
import { exportElementToPdf } from '../utils/pdfHelper';
import { 
  Soup, 
  Calendar, 
  CheckCircle2, 
  Printer, 
  FileDown, 
  Send, 
  Building2, 
  Phone, 
  User as UserIcon, 
  Sparkles, 
  Utensils, 
  Apple, 
  FileText, 
  Check, 
  Layers, 
  X, 
  Trash2,
  ShieldCheck,
  Crown,
  ReceiptText,
  Info,
  FileSpreadsheet
} from 'lucide-react';

interface ClientRampaPortalViewProps {
  onBackToMain?: () => void;
  onGoToSpreadsheet?: () => void;
}

interface MealItemPaxState {
  arroz: number;
  feijao: number;
  principal: number;
  guarnicao: number;
  salada: number;
  sobremesa: number;
}

// Fallback fruit schedule by day of week for Canção Nova rampa
const DAY_DEFAULT_FRUIT_ID: Record<string, string> = {
  seg: 'f-banana',        // Banana Prata da Região
  ter: 'f-melancia',      // Melancia Fatiada Gelada
  qua: 'f-abacaxi',       // Abacaxi Pérola Fatiado
  qui: 'f-maca',          // Maçã Gala / Fuji
  sex: 'f-laranja',       // Laranja Pera Rio Descascada
  sab: 'f-banana',        // Banana Prata da Região
  dom: 'f-salada-frutas', // Salada de Frutas Mista
};

export const ClientRampaPortalView: React.FC<ClientRampaPortalViewProps> = ({ 
  onBackToMain,
  onGoToSpreadsheet
}) => {
  const { 
    currentUser, 
    currentMenu, 
    selectedYear, 
    selectedMonth, 
    selectedWeek,
    clientOrders,
    addClientOrder,
    updateClientOrderStatus,
    deleteClientOrder 
  } = useApp();

  const isClient = currentUser?.role === 'cliente';
  const isMasterOrAdmin = currentUser?.role === 'master' || currentUser?.role === 'admin';

  const dayKeys = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const;
  const { daysDates } = getWeekDates(selectedYear, selectedMonth, selectedWeek);

  // Selected day for viewing Rampa menu
  const [selectedDayKey, setSelectedDayKey] = useState<string>('seg');

  // Per-day item pax map (defaults matching user's specific request: Arroz: 5, Feijão: 5, Principal: 8, Guarnição: 8, Salada: 5, Sobremesa/Frutas: 10)
  const [dayPaxMap, setDayPaxMap] = useState<Record<string, MealItemPaxState>>({
    seg: { arroz: 5, feijao: 5, principal: 8, guarnicao: 8, salada: 5, sobremesa: 10 },
    ter: { arroz: 5, feijao: 5, principal: 8, guarnicao: 8, salada: 5, sobremesa: 10 },
    qua: { arroz: 5, feijao: 5, principal: 8, guarnicao: 8, salada: 5, sobremesa: 10 },
    qui: { arroz: 5, feijao: 5, principal: 8, guarnicao: 8, salada: 5, sobremesa: 10 },
    sex: { arroz: 5, feijao: 5, principal: 8, guarnicao: 8, salada: 5, sobremesa: 10 },
    sab: { arroz: 5, feijao: 5, principal: 8, guarnicao: 8, salada: 5, sobremesa: 10 },
    dom: { arroz: 5, feijao: 5, principal: 8, guarnicao: 8, salada: 5, sobremesa: 10 },
  });

  // Client Identification fields
  const [selectedMealShift, setSelectedMealShift] = useState<'Almoço' | 'Jantar'>('Almoço');
  const [departmentOrGroup, setDepartmentOrGroup] = useState<string>(() => {
    return currentUser?.department || 'Coordenação de Nutrição & Peregrinos Canção Nova';
  });
  const [responsibleName, setResponsibleName] = useState<string>(() => {
    return currentUser?.name || 'Wesley Moreira';
  });
  const [contactPhone, setContactPhone] = useState<string>('(12) 3186-2000');
  const [specialDietNotes, setSpecialDietNotes] = useState<string>('');

  // Fruit selections: map of fruitId -> { quantity, unit, notes }
  const [selectedFruits, setSelectedFruits] = useState<Record<string, { quantity: number; unit: AvailableFruit['defaultUnit']; notes?: string }>>({
    'f-banana': { quantity: 10, unit: 'un', notes: '' },
    'f-melancia': { quantity: 2, unit: 'kg', notes: 'Fatiada gelada' },
    'f-abacaxi': { quantity: 2, unit: 'kg', notes: 'Fatiado' },
    'f-maca': { quantity: 10, unit: 'un', notes: '' },
    'f-laranja': { quantity: 10, unit: 'un', notes: '' },
    'f-salada-frutas': { quantity: 10, unit: 'porções', notes: '' },
  });

  const [activeTab, setActiveTab] = useState<'daily' | 'weekTable' | 'myOrders'>('daily');
  const [successOrder, setSuccessOrder] = useState<ClientRampaOrder | null>(null);
  const [showOrderModal, setShowOrderModal] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Print voucher ref
  const orderVoucherRef = useRef<HTMLDivElement>(null);

  // Active day data for Rampa
  const activeDay = currentMenu.days[selectedDayKey as keyof typeof currentMenu.days];
  const activeDayDateObj = daysDates.find((d) => d.dayKey === selectedDayKey);
  const currentServiceDateFormatted = activeDayDateObj?.dateStr 
    ? `${activeDayDateObj.dateStr}/${selectedYear}` 
    : new Date().toLocaleDateString('pt-BR');

  // Extract day dishes
  const rawAcomp = normalizeSlotItems(activeDay?.lunch.acompanhamento);
  const arrozDishName = rawAcomp.find((d) => /arroz/i.test(d)) || rawAcomp[0] || 'Arroz Branco Agulhinha Soltinho';
  const feijaoDishName = rawAcomp.find((d) => /feij[aã]o/i.test(d)) || rawAcomp[1] || 'Feijão Carioca Especial';
  
  const principalDishes = normalizeSlotItems(activeDay?.lunch.principal);
  const principalDishName = principalDishes.join(' / ') || 'Picadinho Bife à Role Recheado';

  const guarnicaoDishes = normalizeSlotItems(activeDay?.lunch.guarnicao);
  const guarnicaoDishName = guarnicaoDishes.join(' / ') || 'Purê de Mandioquinha Perfumado';

  const saladaDishes = normalizeSlotItems(activeDay?.lunch.salada);
  const saladaDishName = saladaDishes.join(' / ') || 'Salada Tropical Refrescante com Manga';

  const sobremesaDishes = normalizeSlotItems(activeDay?.lunch.sobremesa);
  const sobremesaDishName = sobremesaDishes.join(' / ') || 'Fruta Fresca da Estação';

  // DETERMINE THE ONLY AVAILABLE FRUIT FOR THIS DAY:
  // If activeDay.lunch.sobremesa mentions a fruit, use it; otherwise use the canonical weekday fruit
  const availableFruitForDay = useMemo<AvailableFruit>(() => {
    const text = sobremesaDishes.join(' ').toLowerCase();

    if (text.includes('melancia')) {
      return CANONICAL_FRUITS.find((f) => f.id === 'f-melancia') || CANONICAL_FRUITS[0];
    }
    if (text.includes('abacaxi')) {
      return CANONICAL_FRUITS.find((f) => f.id === 'f-abacaxi') || CANONICAL_FRUITS[0];
    }
    if (text.includes('banana')) {
      return CANONICAL_FRUITS.find((f) => f.id === 'f-banana') || CANONICAL_FRUITS[0];
    }
    if (text.includes('maçã') || text.includes('maca')) {
      return CANONICAL_FRUITS.find((f) => f.id === 'f-maca') || CANONICAL_FRUITS[0];
    }
    if (text.includes('laranja')) {
      return CANONICAL_FRUITS.find((f) => f.id === 'f-laranja') || CANONICAL_FRUITS[0];
    }
    if (text.includes('mamão') || text.includes('mamao')) {
      return CANONICAL_FRUITS.find((f) => f.id === 'f-mamao') || CANONICAL_FRUITS[0];
    }
    if (text.includes('manga')) {
      return CANONICAL_FRUITS.find((f) => f.id === 'f-manga') || CANONICAL_FRUITS[0];
    }
    if (text.includes('uva')) {
      return CANONICAL_FRUITS.find((f) => f.id === 'f-uva') || CANONICAL_FRUITS[0];
    }
    if (text.includes('salada de fruta')) {
      return CANONICAL_FRUITS.find((f) => f.id === 'f-salada-frutas') || CANONICAL_FRUITS[0];
    }

    // Default by day of week
    const targetId = DAY_DEFAULT_FRUIT_ID[selectedDayKey] || 'f-banana';
    return CANONICAL_FRUITS.find((f) => f.id === targetId) || CANONICAL_FRUITS[0];
  }, [sobremesaDishes, selectedDayKey]);

  // Current Pax for active day
  const currentPax = dayPaxMap[selectedDayKey] || {
    arroz: 5,
    feijao: 5,
    principal: 8,
    guarnicao: 8,
    salada: 5,
    sobremesa: 10,
  };

  const updateItemPax = (field: keyof MealItemPaxState, value: number) => {
    const safeVal = Math.max(0, value);
    setDayPaxMap((prev) => ({
      ...prev,
      [selectedDayKey]: {
        ...(prev[selectedDayKey] || currentPax),
        [field]: safeVal,
      },
    }));
  };

  // Quick preset helper
  const paxShortcuts = [0, 5, 8, 10, 15, 20, 30, 50];

  // Active day's fruit selection state
  const activeFruitSelection = selectedFruits[availableFruitForDay.id] || {
    quantity: currentPax.sobremesa || 10,
    unit: availableFruitForDay.defaultUnit,
    notes: '',
  };

  const handleDayFruitQtyChange = (delta: number) => {
    setSelectedFruits((prev) => {
      const current = prev[availableFruitForDay.id] || {
        quantity: currentPax.sobremesa || 10,
        unit: availableFruitForDay.defaultUnit,
      };
      const newQty = Math.max(0, current.quantity + delta);
      return {
        ...prev,
        [availableFruitForDay.id]: {
          ...current,
          quantity: newQty,
        },
      };
    });
  };

  const handleDayFruitSetQty = (qty: number) => {
    const safeQty = Math.max(0, qty);
    setSelectedFruits((prev) => {
      const current = prev[availableFruitForDay.id] || {
        quantity: currentPax.sobremesa || 10,
        unit: availableFruitForDay.defaultUnit,
      };
      return {
        ...prev,
        [availableFruitForDay.id]: {
          ...current,
          quantity: safeQty,
        },
      };
    });
  };

  const handleDayFruitUnitChange = (unit: AvailableFruit['defaultUnit']) => {
    setSelectedFruits((prev) => {
      const current = prev[availableFruitForDay.id] || {
        quantity: currentPax.sobremesa || 10,
        unit: availableFruitForDay.defaultUnit,
      };
      return {
        ...prev,
        [availableFruitForDay.id]: {
          ...current,
          unit,
        },
      };
    });
  };

  // Prepare and submit order from the daily menu
  const handleConfirmDailyOrder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!departmentOrGroup.trim()) {
      alert('Por favor, informe o Setor, Evento ou Grupo solicitante.');
      return;
    }
    if (!responsibleName.trim()) {
      alert('Por favor, informe o nome do responsável.');
      return;
    }

    const maxRequested = Math.max(
      currentPax.arroz,
      currentPax.feijao,
      currentPax.principal,
      currentPax.guarnicao,
      currentPax.salada,
      currentPax.sobremesa,
      1
    );

    const mealItems: ClientMealItemRequest[] = [
      {
        id: 'arroz',
        category: 'arroz',
        categoryLabel: 'Arroz',
        dishName: arrozDishName,
        peopleCount: currentPax.arroz,
        icon: '🍚',
      },
      {
        id: 'feijao',
        category: 'feijao',
        categoryLabel: 'Feijão',
        dishName: feijaoDishName,
        peopleCount: currentPax.feijao,
        icon: '🫘',
      },
      {
        id: 'principal',
        category: 'principal',
        categoryLabel: 'Prato Principal',
        dishName: principalDishName,
        peopleCount: currentPax.principal,
        icon: '🥩',
      },
      {
        id: 'guarnicao',
        category: 'guarnicao',
        categoryLabel: 'Guarnição do Buffet',
        dishName: guarnicaoDishName,
        peopleCount: currentPax.guarnicao,
        icon: '🥔',
      },
      {
        id: 'salada',
        category: 'salada',
        categoryLabel: 'Salada Fresca',
        dishName: saladaDishName,
        peopleCount: currentPax.salada,
        icon: '🥬',
      },
      {
        id: 'sobremesa',
        category: 'sobremesa',
        categoryLabel: 'Frutas ou Sobremesa',
        dishName: `${sobremesaDishName} (${availableFruitForDay.name})`,
        peopleCount: currentPax.sobremesa,
        icon: '🍮',
      },
    ];

    // ONLY the single fruit available for this day is included
    const fruitList: FruitOrderItem[] = activeFruitSelection.quantity > 0
      ? [
          {
            id: availableFruitForDay.id,
            name: availableFruitForDay.name,
            icon: availableFruitForDay.icon,
            quantity: activeFruitSelection.quantity,
            unit: activeFruitSelection.unit,
            notes: activeFruitSelection.notes,
          },
        ]
      : [];

    const newOrder = addClientOrder({
      clientName: responsibleName.trim(),
      clientEmail: currentUser?.email || 'cliente@cancaonova.com',
      clientPhone: contactPhone.trim(),
      departmentOrGroup: departmentOrGroup.trim(),
      orderDate: new Date().toISOString().split('T')[0],
      serviceDate: currentServiceDateFormatted,
      dayName: activeDay?.dayName || 'Segunda-feira',
      mealShift: selectedMealShift,
      numberOfPeople: maxRequested,
      mealItems,
      fruits: fruitList,
      specialDietNotes: specialDietNotes.trim() || undefined,
    });

    setSuccessOrder(newOrder);
    setShowOrderModal(true);
  };

  // Filter orders: If client, show only their orders. If admin/master, show all
  const visibleOrders = useMemo(() => {
    if (isMasterOrAdmin) return clientOrders;
    return clientOrders.filter(
      (o) => o.clientEmail.toLowerCase() === (currentUser?.email || '').toLowerCase()
    );
  }, [clientOrders, currentUser, isMasterOrAdmin]);

  // Direct print without download
  const handlePrintVoucher = (order: ClientRampaOrder) => {
    setSuccessOrder(order);
    setTimeout(() => {
      triggerDirectPrint('portrait');
    }, 100);
  };

  // Download PDF voucher
  const handleDownloadPdfVoucher = async (order: ClientRampaOrder) => {
    setSuccessOrder(order);
    setIsGeneratingPdf(true);
    setTimeout(async () => {
      if (orderVoucherRef.current) {
        try {
          await exportElementToPdf(
            orderVoucherRef.current,
            `Comprovante_Pedido_${order.orderNumber}_Cancao_Nova.pdf`,
            'portrait'
          );
        } catch (err) {
          console.error('PDF error:', err);
        } finally {
          setIsGeneratingPdf(false);
        }
      } else {
        setIsGeneratingPdf(false);
      }
    }, 150);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-neutral-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-amber-200 flex items-center gap-1.5 shadow-xs">
                <Soup className="w-3.5 h-3.5" />
                Portal Exclusivo do Cardápio Rampa
              </span>
              {currentUser?.role === 'master' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-neutral-950 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-neutral-950" /> Admin MASTER
                </span>
              ) : currentUser?.role === 'admin' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400 text-neutral-950 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Admin Secundário
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-400 text-neutral-950 flex items-center gap-1">
                  <UserIcon className="w-3 h-3" /> Acesso Cliente
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Cardápio Rampa & Pedido por Número de Pessoas
            </h1>
            <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
              Consulte os pratos oficiais do dia no refeitório da Canção Nova e informe a quantidade por número de pessoas para Arroz, Feijão, Prato Principal, Guarnição, Salada e a Fruta disponível no dia.
            </p>
          </div>

          {/* Client / User Profile Box & Quick Table Action */}
          <div className="flex flex-col gap-2 shrink-0 sm:min-w-[240px]">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {currentUser?.name?.charAt(0) || 'W'}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold leading-tight truncate">{currentUser?.name || 'Wesley Moreira'}</p>
                  <p className="text-[10px] text-amber-200 font-mono truncate">{currentUser?.email || 'wesley.moreira@comunidadecancaonova.com'}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-white/15 text-[11px] flex justify-between items-center text-amber-100">
                <span>Setor:</span>
                <strong className="text-white truncate max-w-[140px]">{currentUser?.department || 'Coordenação de Nutrição'}</strong>
              </div>
            </div>

            {/* Direct button to spreadsheet table for Admin / Master */}
            {!isClient && onGoToSpreadsheet && (
              <button
                type="button"
                onClick={onGoToSpreadsheet}
                className="w-full px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all border border-emerald-400/40"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                <span>📊 Acessar Tabela / Planilha</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-tab Navigation: ONLY shown for Admins/Master. For clients, ONLY the order-making tab is active! */}
        {!isClient ? (
          <div className="relative z-10 flex items-center gap-2 pt-6 mt-6 border-t border-white/15 overflow-x-auto">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'daily'
                  ? 'bg-white text-neutral-900 shadow-md font-extrabold'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Utensils className="w-4 h-4 text-amber-600" />
              <span>1. Fazer Pedido (Pessoas & Frutas)</span>
            </button>

            <button
              onClick={() => setActiveTab('weekTable')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'weekTable'
                  ? 'bg-white text-neutral-900 shadow-md font-extrabold'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Layers className="w-4 h-4 text-sky-600" />
              <span>2. Visão Geral da Semana Rampa</span>
            </button>

            <button
              onClick={() => setActiveTab('myOrders')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'myOrders'
                  ? 'bg-white text-neutral-900 shadow-md font-extrabold'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>3. Pedidos & Comprovantes ({visibleOrders.length})</span>
            </button>

            {onGoToSpreadsheet && (
              <button
                type="button"
                onClick={onGoToSpreadsheet}
                className="ml-auto px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap bg-white/15 hover:bg-white/25 text-white border border-white/20"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                <span>Ver Planilha Completa</span>
              </button>
            )}
          </div>
        ) : (
          /* Client Header Strip: Clean single-purpose order area */
          <div className="relative z-10 pt-4 mt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-100 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Área de Pedido Aberta · Selecione o dia abaixo e monte seu pedido</span>
            </div>

            {visibleOrders.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSuccessOrder(visibleOrders[0]);
                  setShowOrderModal(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <ReceiptText className="w-3.5 h-3.5 text-amber-300" />
                <span>Ver Comprovante do Pedido ({visibleOrders.length} enviado{visibleOrders.length > 1 ? 's' : ''})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CARDÁPIO DO DIA COM CONTADORES INDIVIDUAIS POR PESSOA              */}
      {/* ========================================================================= */}
      {activeTab === 'daily' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Day Selector Bar */}
          <div className="bg-white dark:bg-neutral-900 p-3 sm:p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex items-center justify-between gap-3 overflow-x-auto">
            <div className="flex items-center gap-2 shrink-0">
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Selecione o Dia:
              </span>
            </div>

            <div className="flex items-center gap-2">
              {dayKeys.map((dKey) => {
                const dayObj = currentMenu.days[dKey];
                const dateObj = daysDates.find((d) => d.dayKey === dKey);
                const isSelected = selectedDayKey === dKey;

                return (
                  <button
                    key={dKey}
                    onClick={() => setSelectedDayKey(dKey)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center min-w-[76px] cursor-pointer ${
                      isSelected
                        ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-500/40'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <span>{dayObj?.dayShort || dKey.toUpperCase()}</span>
                    <span className={`text-[10px] font-mono ${isSelected ? 'text-amber-100 font-bold' : 'text-neutral-400'}`}>
                      {dateObj?.dateStr ? dateObj.dateStr.slice(0, 5) : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Cardápio Header & Live Summary Bar */}
          <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80 dark:border-amber-900/50">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-400 block mb-0.5">
                  Cardápio Oficial de Rampa (Refeitório Canção Nova)
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-100">
                  {activeDay?.dayName || 'Segunda-feira'} · {currentServiceDateFormatted}
                </h2>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300">Turno:</span>
                <button
                  type="button"
                  onClick={() => setSelectedMealShift('Almoço')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    selectedMealShift === 'Almoço'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-amber-200 dark:border-amber-900'
                  }`}
                >
                  ☀️ Almoço
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMealShift('Jantar')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    selectedMealShift === 'Jantar'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-amber-200 dark:border-amber-900'
                  }`}
                >
                  🌙 Jantar
                </button>
              </div>
            </div>

            {/* Live Ticker of Request by People */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Resumo das Quantidades Solicitadas ({activeDay?.dayName}):
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-amber-200 dark:border-amber-800/80 text-xs text-neutral-800 dark:text-neutral-200 font-semibold shadow-2xs">
                  🍚 Arroz: <strong className="text-amber-700 dark:text-amber-400 font-black">{currentPax.arroz} pessoas</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-amber-200 dark:border-amber-800/80 text-xs text-neutral-800 dark:text-neutral-200 font-semibold shadow-2xs">
                  🫘 Feijão: <strong className="text-amber-700 dark:text-amber-400 font-black">{currentPax.feijao} pessoas</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-rose-200 dark:border-rose-800/80 text-xs text-neutral-800 dark:text-neutral-200 font-semibold shadow-2xs">
                  🥩 Prato Principal: <strong className="text-rose-700 dark:text-rose-400 font-black">{currentPax.principal} pessoas</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-amber-200 dark:border-amber-800/80 text-xs text-neutral-800 dark:text-neutral-200 font-semibold shadow-2xs">
                  🥔 Guarnição: <strong className="text-amber-700 dark:text-amber-400 font-black">{currentPax.guarnicao} pessoas</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-emerald-200 dark:border-emerald-800/80 text-xs text-neutral-800 dark:text-neutral-200 font-semibold shadow-2xs">
                  🥬 Salada: <strong className="text-emerald-700 dark:text-emerald-400 font-black">{currentPax.salada} pessoas</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-purple-200 dark:border-purple-800/80 text-xs text-neutral-800 dark:text-neutral-200 font-semibold shadow-2xs">
                  🍮 Sobremesa / Fruta: <strong className="text-purple-700 dark:text-purple-400 font-black">{currentPax.sobremesa} pessoas</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 text-xs text-amber-900 dark:text-amber-200 font-bold shadow-2xs">
                  {availableFruitForDay.icon} Fruta do Dia: <strong className="font-mono">{activeFruitSelection.quantity} {activeFruitSelection.unit}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* THE 5 MAIN PREPARATION CARDS + SOBREMESA                              */}
          {/* ===================================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* 1. ARROZ */}
            <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 bg-white dark:bg-neutral-900 shadow-xs ${
              currentPax.arroz > 0 ? 'border-amber-500/80 ring-1 ring-amber-500/20' : 'border-neutral-200 dark:border-neutral-800'
            }`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🍚</span>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 uppercase tracking-wider">
                    Arroz (Base Quente)
                  </span>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-neutral-100 leading-snug">
                    {arrozDishName}
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                    Arroz agulhinha soltinho preparado diariamente na cozinha central Canção Nova.
                  </p>
                </div>
              </div>

              {/* Counter by People */}
              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Quantidade de Pessoas:
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateItemPax('arroz', currentPax.arroz - 1)}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 font-black text-xs flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={currentPax.arroz}
                      onChange={(e) => updateItemPax('arroz', parseInt(e.target.value, 10) || 0)}
                      className="w-14 text-center font-mono font-black text-sm bg-neutral-50 dark:bg-neutral-800 border border-amber-300 dark:border-amber-700 rounded-lg py-1 text-neutral-900 dark:text-neutral-100"
                    />
                    <button
                      type="button"
                      onClick={() => updateItemPax('arroz', currentPax.arroz + 1)}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 font-black text-xs flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Shortcuts */}
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[10px] text-neutral-400 mr-1">Atalhos:</span>
                  {paxShortcuts.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => updateItemPax('arroz', num)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                        currentPax.arroz === num
                          ? 'bg-amber-600 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. FEIJÃO */}
            <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 bg-white dark:bg-neutral-900 shadow-xs ${
              currentPax.feijao > 0 ? 'border-amber-500/80 ring-1 ring-amber-500/20' : 'border-neutral-200 dark:border-neutral-800'
            }`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🫘</span>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 uppercase tracking-wider">
                    Feijão (Base Quente)
                  </span>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-neutral-100 leading-snug">
                    {feijaoDishName}
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                    Feijão carioca com caldo artesanal temperado no alho frito e louro fresco.
                  </p>
                </div>
              </div>

              {/* Counter by People */}
              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Quantidade de Pessoas:
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateItemPax('feijao', currentPax.feijao - 1)}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 font-black text-xs flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={currentPax.feijao}
                      onChange={(e) => updateItemPax('feijao', parseInt(e.target.value, 10) || 0)}
                      className="w-14 text-center font-mono font-black text-sm bg-neutral-50 dark:bg-neutral-800 border border-amber-300 dark:border-amber-700 rounded-lg py-1 text-neutral-900 dark:text-neutral-100"
                    />
                    <button
                      type="button"
                      onClick={() => updateItemPax('feijao', currentPax.feijao + 1)}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 font-black text-xs flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Shortcuts */}
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[10px] text-neutral-400 mr-1">Atalhos:</span>
                  {paxShortcuts.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => updateItemPax('feijao', num)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                        currentPax.feijao === num
                          ? 'bg-amber-600 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. PRATO PRINCIPAL */}
            <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 bg-white dark:bg-neutral-900 shadow-xs ${
              currentPax.principal > 0 ? 'border-rose-500/80 ring-1 ring-rose-500/20' : 'border-neutral-200 dark:border-neutral-800'
            }`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🥩</span>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800 uppercase tracking-wider">
                    Prato Principal
                  </span>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-neutral-100 leading-snug">
                    {principalDishName}
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                    Proteína principal servida na pista quente da rampa do refeitório.
                  </p>
                </div>
              </div>

              {/* Counter by People */}
              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Quantidade de Pessoas:
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateItemPax('principal', currentPax.principal - 1)}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 font-black text-xs flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={currentPax.principal}
                      onChange={(e) => updateItemPax('principal', parseInt(e.target.value, 10) || 0)}
                      className="w-14 text-center font-mono font-black text-sm bg-neutral-50 dark:bg-neutral-800 border border-rose-300 dark:border-rose-700 rounded-lg py-1 text-neutral-900 dark:text-neutral-100"
                    />
                    <button
                      type="button"
                      onClick={() => updateItemPax('principal', currentPax.principal + 1)}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 font-black text-xs flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Shortcuts */}
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[10px] text-neutral-400 mr-1">Atalhos:</span>
                  {paxShortcuts.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => updateItemPax('principal', num)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                        currentPax.principal === num
                          ? 'bg-rose-600 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. GUARNIÇÃO DO BUFFET */}
            <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 bg-white dark:bg-neutral-900 shadow-xs ${
              currentPax.guarnicao > 0 ? 'border-amber-500/80 ring-1 ring-amber-500/20' : 'border-neutral-200 dark:border-neutral-800'
            }`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🥔</span>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 uppercase tracking-wider">
                    Guarnição do Buffet
                  </span>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-neutral-100 leading-snug">
                    {guarnicaoDishName}
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                    Acompanhamento quente especial (purês, batatas, legumes grelhados ou farofas).
                  </p>
                </div>
              </div>

              {/* Counter by People */}
              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Quantidade de Pessoas:
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateItemPax('guarnicao', currentPax.guarnicao - 1)}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 font-black text-xs flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={currentPax.guarnicao}
                      onChange={(e) => updateItemPax('guarnicao', parseInt(e.target.value, 10) || 0)}
                      className="w-14 text-center font-mono font-black text-sm bg-neutral-50 dark:bg-neutral-800 border border-amber-300 dark:border-amber-700 rounded-lg py-1 text-neutral-900 dark:text-neutral-100"
                    />
                    <button
                      type="button"
                      onClick={() => updateItemPax('guarnicao', currentPax.guarnicao + 1)}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 font-black text-xs flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Shortcuts */}
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[10px] text-neutral-400 mr-1">Atalhos:</span>
                  {paxShortcuts.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => updateItemPax('guarnicao', num)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                        currentPax.guarnicao === num
                          ? 'bg-amber-600 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. SALADA DO DIA */}
            <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 bg-white dark:bg-neutral-900 shadow-xs ${
              currentPax.salada > 0 ? 'border-emerald-500/80 ring-1 ring-emerald-500/20' : 'border-neutral-200 dark:border-neutral-800'
            }`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🥬</span>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 uppercase tracking-wider">
                    Salada Fresca do Dia
                  </span>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-neutral-100 leading-snug">
                    {saladaDishName}
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                    Mix de folhas verdes higienizadas e guarnições frescas de horta com molho à parte.
                  </p>
                </div>
              </div>

              {/* Counter by People */}
              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Quantidade de Pessoas:
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateItemPax('salada', currentPax.salada - 1)}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 font-black text-xs flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={currentPax.salada}
                      onChange={(e) => updateItemPax('salada', parseInt(e.target.value, 10) || 0)}
                      className="w-14 text-center font-mono font-black text-sm bg-neutral-50 dark:bg-neutral-800 border border-emerald-300 dark:border-emerald-700 rounded-lg py-1 text-neutral-900 dark:text-neutral-100"
                    />
                    <button
                      type="button"
                      onClick={() => updateItemPax('salada', currentPax.salada + 1)}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 font-black text-xs flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Shortcuts */}
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[10px] text-neutral-400 mr-1">Atalhos:</span>
                  {paxShortcuts.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => updateItemPax('salada', num)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                        currentPax.salada === num
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 6. SOBREMESA / FRUTAS */}
            <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 bg-white dark:bg-neutral-900 shadow-xs ${
              currentPax.sobremesa > 0 ? 'border-purple-500/80 ring-1 ring-purple-500/20' : 'border-neutral-200 dark:border-neutral-800'
            }`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🍮</span>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-800 uppercase tracking-wider">
                    Sobremesa / Frutas
                  </span>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-neutral-100 leading-snug">
                    {sobremesaDishName}
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                    Sobremesa da rampa ou porções da fruta oficial escalada para este dia ({availableFruitForDay.name}).
                  </p>
                </div>
              </div>

              {/* Counter by People */}
              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Quantidade de Pessoas:
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateItemPax('sobremesa', currentPax.sobremesa - 1)}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 font-black text-xs flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={currentPax.sobremesa}
                      onChange={(e) => updateItemPax('sobremesa', parseInt(e.target.value, 10) || 0)}
                      className="w-14 text-center font-mono font-black text-sm bg-neutral-50 dark:bg-neutral-800 border border-purple-300 dark:border-purple-700 rounded-lg py-1 text-neutral-900 dark:text-neutral-100"
                    />
                    <button
                      type="button"
                      onClick={() => updateItemPax('sobremesa', currentPax.sobremesa + 1)}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 font-black text-xs flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Shortcuts */}
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[10px] text-neutral-400 mr-1">Atalhos:</span>
                  {paxShortcuts.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => updateItemPax('sobremesa', num)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                        currentPax.sobremesa === num
                          ? 'bg-purple-600 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* ===================================================================== */}
          {/* SEÇÃO: APENAS A FRUTA DISPONÍVEL NO DIA (SEM OUTRAS OPÇÕES)           */}
          {/* ===================================================================== */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border-2 border-amber-500/70 dark:border-amber-500/60 p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-2xl shadow-2xs">
                  {availableFruitForDay.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-neutral-900 dark:text-neutral-100">
                      Fruta do Dia: {availableFruitForDay.name}
                    </h3>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 uppercase tracking-wider">
                      ✓ Disponível no Dia
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Escalada exclusivamente para o atendimento de {activeDay?.dayName}. Não há outras frutas disponíveis nesta data.
                  </p>
                </div>
              </div>

              <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-xl self-start sm:self-center">
                Sugerido: <strong>{availableFruitForDay.perPersonEstimate}</strong>
              </div>
            </div>

            {/* The Single Available Fruit Card */}
            <div className="p-5 rounded-2xl border-2 border-amber-500/80 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-start gap-3.5 max-w-xl">
                <span className="text-4xl shrink-0 mt-0.5">{availableFruitForDay.icon}</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm sm:text-base font-black text-neutral-900 dark:text-neutral-100">
                      {availableFruitForDay.name}
                    </h4>
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">
                      Padrão Refeitório Rampa
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    {availableFruitForDay.description}
                  </p>
                </div>
              </div>

              {/* Exact Quantity Stepper & Unit */}
              <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-amber-300 dark:border-amber-800 shadow-2xs space-y-2 shrink-0 md:min-w-[280px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Quantidade de Fruta:
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDayFruitQtyChange(-5)}
                      className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 font-bold text-sm flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>

                    <input
                      type="number"
                      min={0}
                      value={activeFruitSelection.quantity}
                      onChange={(e) => handleDayFruitSetQty(parseInt(e.target.value, 10) || 0)}
                      className="w-16 text-center text-sm font-mono font-black bg-white dark:bg-neutral-800 border-2 border-amber-500 rounded-lg py-1 text-neutral-900 dark:text-neutral-100"
                    />

                    <button
                      type="button"
                      onClick={() => handleDayFruitQtyChange(5)}
                      className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 font-bold text-sm flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>

                    {/* Unit */}
                    <select
                      value={activeFruitSelection.unit}
                      onChange={(e) => handleDayFruitUnitChange(e.target.value as any)}
                      className="text-xs font-bold bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg py-1 px-2 focus:outline-none cursor-pointer"
                    >
                      <option value="un">un</option>
                      <option value="kg">kg</option>
                      <option value="fatias">fatias</option>
                      <option value="porções">porções</option>
                    </select>
                  </div>
                </div>

                {/* Quick Pax-Matching Shortcut Buttons */}
                <div className="flex items-center gap-1.5 pt-1.5 border-t border-neutral-100 dark:border-neutral-800 flex-wrap">
                  <span className="text-[10px] text-neutral-400 mr-1">Ajustar:</span>
                  {[0, 5, 8, 10, 15, 20, 30, 50, 80].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleDayFruitSetQty(num)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                        activeFruitSelection.quantity === num
                          ? 'bg-amber-600 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Regra de Abastecimento:</strong> Por normas operacionais da cozinha Canção Nova, cada dia possui apenas a sua fruta oficial programada, garantindo frescor e padronização.
              </span>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* SECTION: IDENTIFICAÇÃO DO GRUPO & CONFIRMAÇÃO DO PEDIDO               */}
          {/* ===================================================================== */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-xs">
                <ReceiptText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-neutral-900 dark:text-neutral-100">
                  Dados do Solicitante & Envio do Pedido
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Confirme os dados da sua equipe para registro formal na cozinha central Canção Nova.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Setor, Evento ou Grupo
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={departmentOrGroup}
                    onChange={(e) => setDepartmentOrGroup(e.target.value)}
                    placeholder="Ex: Peregrinos de Fátima / Coordenação de Nutrição"
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl font-medium focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Responsável pelo Pedido
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={responsibleName}
                    onChange={(e) => setResponsibleName(e.target.value)}
                    placeholder="Ex: Wesley Moreira"
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl font-medium focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Telefone de Contato (WhatsApp / Ramal)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="(12) 3186-2000"
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl font-medium focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Observações Especiais, Restrições ou Horário de Atendimento
              </label>
              <textarea
                rows={2}
                value={specialDietNotes}
                onChange={(e) => setSpecialDietNotes(e.target.value)}
                placeholder="Ex: Servir pontualmente às 12h15; há 2 celíacos no grupo que necessitam de separação de prato."
                className="w-full p-3 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Big Action Submit Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Ao confirmar, o comprovante oficial será gerado com opção de <strong>impressão imediata</strong> e <strong>download em PDF</strong>.
              </div>

              <button
                type="button"
                onClick={() => handleConfirmDailyOrder()}
                className="px-6 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>Confirmar Pedido deste Cardápio ({activeDay?.dayShort || 'HOJE'})</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TABELA SEMANAL COMPLETA DA RAMPA                                   */}
      {/* ========================================================================= */}
      {activeTab === 'weekTable' && (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h3 className="text-base font-extrabold text-neutral-900 dark:text-neutral-100">
                Cardápio Rampa Completo da Semana (Refeitório Canção Nova)
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Visualização integrada de Segunda a Domingo para planejamento de caravanas e setores.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('daily')}
              className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Utensils className="w-4 h-4" />
              <span>Fazer Pedido por Dia</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300">
                  <th className="py-3 px-3 font-bold">Dia / Categoria</th>
                  <th className="py-3 px-3 font-bold">🍚 Arroz & Feijão</th>
                  <th className="py-3 px-3 font-bold">🥩 Prato Principal</th>
                  <th className="py-3 px-3 font-bold">🥔 Guarnição</th>
                  <th className="py-3 px-3 font-bold">🥬 Salada</th>
                  <th className="py-3 px-3 font-bold">🍮 Sobremesa / Fruta</th>
                  <th className="py-3 px-3 font-bold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {dayKeys.map((dKey) => {
                  const dayObj = currentMenu.days[dKey];
                  const dateObj = daysDates.find((d) => d.dayKey === dKey);
                  const acomp = normalizeSlotItems(dayObj?.lunch.acompanhamento).join(' + ') || 'Arroz Branco + Feijão Carioca';
                  const princ = normalizeSlotItems(dayObj?.lunch.principal).join(' / ') || 'Prato Principal do Dia';
                  const guar = normalizeSlotItems(dayObj?.lunch.guarnicao).join(' / ') || 'Guarnição do Buffet';
                  const salad = normalizeSlotItems(dayObj?.lunch.salada).join(' / ') || 'Salada Fresca';
                  const sobrem = normalizeSlotItems(dayObj?.lunch.sobremesa).join(' / ') || 'Frutas / Sobremesa';

                  return (
                    <tr key={dKey} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3 px-3 font-bold">
                        <span className="block text-neutral-900 dark:text-neutral-100">{dayObj?.dayName}</span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono">{dateObj?.dateStr}</span>
                      </td>
                      <td className="py-3 px-3 text-neutral-700 dark:text-neutral-300 font-medium">{acomp}</td>
                      <td className="py-3 px-3 font-bold text-neutral-900 dark:text-neutral-100">{princ}</td>
                      <td className="py-3 px-3 text-neutral-700 dark:text-neutral-300">{guar}</td>
                      <td className="py-3 px-3 text-emerald-800 dark:text-emerald-300">{salad}</td>
                      <td className="py-3 px-3 text-purple-800 dark:text-purple-300">{sobrem}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedDayKey(dKey);
                            setActiveTab('daily');
                          }}
                          className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 text-amber-800 dark:text-amber-300 rounded-lg font-bold text-[11px] cursor-pointer"
                        >
                          Pedir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PEDIDOS ENVIADOS & COMPROVANTES (IMPRESSÃO / PDF)                  */}
      {/* ========================================================================= */}
      {activeTab === 'myOrders' && (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h3 className="text-base font-extrabold text-neutral-900 dark:text-neutral-100">
                {isMasterOrAdmin ? 'Todos os Pedidos Recebidos na Cozinha' : 'Meus Pedidos de Refeição'}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Imprima diretamente sem necessidade de baixar ou exporte em arquivo PDF oficial.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('daily')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-all"
            >
              <Utensils className="w-4 h-4" />
              <span>Novo Pedido do Cardápio</span>
            </button>
          </div>

          {visibleOrders.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <FileText className="w-10 h-10 text-neutral-400 mx-auto" />
              <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                Nenhum pedido registrado no momento
              </p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Utilize a aba "1. Cardápio do Dia & Fazer Pedido" para escolher o dia e definir o número de pessoas por item.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleOrders.map((order) => {
                const statusColors = {
                  solicitado: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800',
                  aprovado: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
                  em_preparo: 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border-sky-300 dark:border-sky-800',
                  entregue: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700',
                };

                return (
                  <div
                    key={order.id}
                    className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/50 space-y-4 hover:border-amber-400/50 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono font-black text-xs text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                            {order.orderNumber}
                          </span>
                          <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                            {order.departmentOrGroup}
                          </h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${statusColors[order.status]}`}>
                            {order.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 pt-1">
                          <span>Resp: <strong>{order.clientName}</strong></span>
                          <span>·</span>
                          <span>Data da Refeição: <strong>{order.serviceDate} ({order.mealShift})</strong></span>
                          <span>·</span>
                          <span>Dia: <strong>{order.dayName || 'Cardápio Rampa'}</strong></span>
                        </div>
                      </div>

                      {/* Print and PDF Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handlePrintVoucher(order)}
                          className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Imprimir comprovante diretamente na impressora"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-600" />
                          <span>Mandar para Impressora</span>
                        </button>

                        <button
                          onClick={() => handleDownloadPdfVoucher(order)}
                          disabled={isGeneratingPdf}
                          className="px-3 py-1.5 bg-neutral-900 hover:bg-black dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Baixar comprovante oficial em formato PDF"
                        >
                          <FileDown className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
                          <span>Baixar em PDF</span>
                        </button>

                        {isMasterOrAdmin && (
                          <select
                            value={order.status}
                            onChange={(e) => updateClientOrderStatus(order.id, e.target.value as any)}
                            className="text-xs font-bold bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-2 py-1.5 cursor-pointer"
                          >
                            <option value="solicitado">Solicitado</option>
                            <option value="aprovado">Aprovado</option>
                            <option value="em_preparo">Em Preparo</option>
                            <option value="entregue">Entregue</option>
                          </select>
                        )}

                        {isMasterOrAdmin && (
                          <button
                            onClick={() => {
                              if (confirm(`Deseja remover o pedido ${order.orderNumber}?`)) {
                                deleteClientOrder(order.id);
                              }
                            }}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                            title="Excluir pedido"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Breakdown of Meal Items by Person */}
                    {order.mealItems && order.mealItems.length > 0 && (
                      <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/80 dark:border-neutral-800 text-xs space-y-2">
                        <span className="font-bold text-neutral-700 dark:text-neutral-300 block">
                          🍽️ Quantidades Solicitadas por Número de Pessoas:
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          {order.mealItems.map((item, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-semibold text-neutral-800 dark:text-neutral-200 text-xs flex items-center gap-1.5"
                            >
                              <span>{item.icon || '🍲'}</span>
                              <span className="text-neutral-600 dark:text-neutral-400">{item.categoryLabel}:</span>
                              <strong className="text-neutral-900 dark:text-neutral-100 font-bold font-mono">
                                {item.peopleCount} pessoas
                              </strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fruits summary strip */}
                    {order.fruits && order.fruits.length > 0 && (
                      <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/70 dark:border-amber-900/50 text-xs">
                        <span className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                          🍎 Fruta Escalada para o Pedido:
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          {order.fruits.map((fr, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-amber-200 dark:border-amber-900/60 font-semibold text-neutral-800 dark:text-neutral-200 text-xs flex items-center gap-1"
                            >
                              <span>{fr.icon || '🍏'}</span>
                              <span>{fr.name}:</span>
                              <strong className="font-mono text-amber-700 dark:text-amber-400 font-bold">
                                {fr.quantity} {fr.unit}
                              </strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {order.specialDietNotes && (
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 italic">
                        <strong>Obs / Restrições:</strong> {order.specialDietNotes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CONFIRMAÇÃO DO PEDIDO (COM IMPRESSÃO DIRETA & PDF)               */}
      {/* ========================================================================= */}
      {showOrderModal && successOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95">
            
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 block">
                    Pedido Registrado com Sucesso
                  </span>
                  <h3 className="text-xl font-black text-neutral-900 dark:text-neutral-100">
                    Comprovante Oficial #{successOrder.orderNumber}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setShowOrderModal(false)}
                className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Summary of the requested items */}
            <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span><strong>Grupo:</strong> {successOrder.departmentOrGroup}</span>
                <span><strong>Data:</strong> {successOrder.serviceDate} ({successOrder.mealShift})</span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-amber-200/80 dark:border-amber-900/60">
                <strong className="text-xs text-amber-950 dark:text-amber-200 block">
                  Quantidades Confirmadas por Pessoa:
                </strong>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {successOrder.mealItems?.map((it, idx) => (
                    <div key={idx} className="bg-white dark:bg-neutral-800 p-2 rounded-lg border border-amber-200/70 dark:border-amber-800/60 flex items-center justify-between">
                      <span className="text-neutral-700 dark:text-neutral-300 font-medium truncate mr-1">
                        {it.icon} {it.categoryLabel}:
                      </span>
                      <strong className="font-mono text-amber-700 dark:text-amber-400 font-black">
                        {it.peopleCount} pax
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

              {successOrder.fruits && successOrder.fruits.length > 0 && (
                <div className="pt-2 border-t border-amber-200/80 dark:border-amber-900/60 text-xs flex items-center justify-between">
                  <span><strong>Fruta Disponível do Dia:</strong> {successOrder.fruits[0].icon} {successOrder.fruits[0].name}</span>
                  <strong className="text-amber-700 dark:text-amber-400 font-mono font-black">
                    {successOrder.fruits[0].quantity} {successOrder.fruits[0].unit}
                  </strong>
                </div>
              )}
            </div>

            {/* Two Main Actions: Mandar para Impressora & Baixar em PDF */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handlePrintVoucher(successOrder)}
                  className="py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Mandar para Impressora</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadPdfVoucher(successOrder)}
                  disabled={isGeneratingPdf}
                  className="py-3 px-4 bg-neutral-900 hover:bg-black dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-amber-400 dark:text-amber-600" />
                  <span>Baixar em PDF</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowOrderModal(false);
                  setActiveTab('myOrders');
                }}
                className="w-full py-2.5 text-center text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
              >
                Concluir e Ver Todos os Meus Pedidos
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HIDDEN / VOUCHER PRINT TEMPLATE (PREPARO PARA IMPRESSÃO DIRETA & PDF)     */}
      {/* ========================================================================= */}
      {successOrder && (
        <div style={{ display: 'none' }}>
          <div
            ref={orderVoucherRef}
            className="p-8 bg-white text-neutral-900 font-sans max-w-2xl mx-auto"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            {/* Header */}
            <div style={{ borderBottom: '2px solid #b45309', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ fontSize: '20px', fontWeight: '900', margin: '0', textTransform: 'uppercase', color: '#b45309' }}>
                    Canção Nova · Restaurante & Refeitório Central
                  </h1>
                  <p style={{ fontSize: '12px', margin: '2px 0 0', color: '#525252' }}>
                    Comprovante Oficial de Solicitação do Cardápio Rampa
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '15px', fontWeight: 'bold', fontFamily: 'monospace', color: '#171717' }}>
                    {successOrder.orderNumber}
                  </span>
                  <p style={{ fontSize: '10px', color: '#737373', margin: '2px 0 0' }}>
                    Emissão: {successOrder.orderDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Info Details */}
            <div style={{ backgroundColor: '#f5f5f5', borderRadius: '8px', padding: '14px', marginBottom: '18px', fontSize: '12px', lineHeight: '1.6' }}>
              <p style={{ margin: '0 0 4px' }}><strong>Setor / Evento:</strong> {successOrder.departmentOrGroup}</p>
              <p style={{ margin: '0 0 4px' }}><strong>Responsável:</strong> {successOrder.clientName} ({successOrder.clientEmail})</p>
              <p style={{ margin: '0 0 4px' }}><strong>Telefone de Contato:</strong> {successOrder.clientPhone || 'Não informado'}</p>
              <p style={{ margin: '0 0 4px' }}><strong>Data da Refeição:</strong> {successOrder.serviceDate} ({successOrder.mealShift})</p>
              <p style={{ margin: '0', fontSize: '13px', color: '#b45309' }}>
                <strong>Dia do Cardápio:</strong> {successOrder.dayName || 'Cardápio Rampa'}
              </p>
            </div>

            {/* Itemized Meal Quantities Breakdown Table */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 8px', textTransform: 'uppercase', borderBottom: '1px solid #e5e5e5', paddingBottom: '4px' }}>
                Itens do Cardápio e Quantidades por Número de Pessoas
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#fef3c7', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px', border: '1px solid #e5e5e5' }}>Categoria</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #e5e5e5' }}>Prato Oficial da Rampa</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #e5e5e5', textAlign: 'right' }}>Qtd (Pessoas)</th>
                  </tr>
                </thead>
                <tbody>
                  {successOrder.mealItems && successOrder.mealItems.length > 0 ? (
                    successOrder.mealItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e5e5e5' }}>
                        <td style={{ padding: '6px 8px', border: '1px solid #e5e5e5', fontWeight: 'bold' }}>
                          {item.icon} {item.categoryLabel}
                        </td>
                        <td style={{ padding: '6px 8px', border: '1px solid #e5e5e5' }}>
                          {item.dishName}
                        </td>
                        <td style={{ padding: '6px 8px', border: '1px solid #e5e5e5', textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace' }}>
                          {item.peopleCount} pessoas
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} style={{ padding: '8px', textAlign: 'center' }}>
                        Total de comensais solicitados: {successOrder.numberOfPeople} pessoas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Single Available Fruit Breakdown Table */}
            {successOrder.fruits && successOrder.fruits.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 8px', textTransform: 'uppercase', borderBottom: '1px solid #e5e5e5', paddingBottom: '4px' }}>
                  Fruta Oficial Disponível no Dia ({successOrder.dayName})
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#fef3c7', textAlign: 'left' }}>
                      <th style={{ padding: '6px 8px', border: '1px solid #e5e5e5' }}>Fruta Escalada</th>
                      <th style={{ padding: '6px 8px', border: '1px solid #e5e5e5', textAlign: 'right' }}>Quantidade</th>
                      <th style={{ padding: '6px 8px', border: '1px solid #e5e5e5' }}>Unidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {successOrder.fruits.map((fr, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e5e5e5' }}>
                        <td style={{ padding: '6px 8px', border: '1px solid #e5e5e5', fontWeight: 'bold' }}>{fr.icon} {fr.name}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #e5e5e5', textAlign: 'right', fontWeight: 'bold' }}>{fr.quantity}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #e5e5e5' }}>{fr.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Special Diet Notes */}
            {successOrder.specialDietNotes && (
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px', fontSize: '11px', marginBottom: '24px' }}>
                <strong>Observações Nutricionais / Restrições:</strong> {successOrder.specialDietNotes}
              </div>
            )}

            {/* Signatures */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '10px', fontSize: '11px', textAlign: 'center' }}>
              <div style={{ width: '45%', borderTop: '1px solid #a3a3a3', paddingTop: '6px' }}>
                Assinatura do Solicitante ({successOrder.clientName})
              </div>
              <div style={{ width: '45%', borderTop: '1px solid #a3a3a3', paddingTop: '6px' }}>
                Nutrição / Cozinha Central Canção Nova
              </div>
            </div>

            <p style={{ textAlign: 'center', fontSize: '10px', color: '#a3a3a3', marginTop: '24px' }}>
              CardápioPro Canção Nova · Sistema Integrado de Gestão Nutricional
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
