import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Table, 
  Download, 
  Copy, 
  Check, 
  Search, 
  RefreshCw, 
  FileSpreadsheet, 
  Plus,
  Trash2,
  Calendar,
  Utensils,
  Scale,
  Tag,
  Users,
  Clock,
  Database,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Edit2,
  X,
  Package,
  Apple
} from 'lucide-react';
import { MealSlot, MenuType } from '../types';
import { MONTH_NAMES } from '../utils/validators';
import { 
  weeklyMenuToMatrixTsv, 
  downloadWeeklyMatrixCsv, 
  sheetToTsv, 
  sheetToCsv 
} from '../utils/spreadsheetEngine';
import { getNextExpiringOrder } from '../utils/orderRetention';
import { buildDailyOrderProductionSummaries } from '../utils/dailyOrderCalculations';
import { GoogleSheetsDatabaseModal } from './GoogleSheetsDatabaseModal';

export const CentralSpreadsheetView: React.FC = () => {
  const { 
    currentMenu,
    selectedYear,
    selectedMonth,
    selectedWeek,
    setSelectedWeek,
    setSelectedMonth,
    menuType,
    setMenuType,
    addDishToSlot,
    editDishInSlot,
    removeDishFromSlot,
    updateMealSlot,
    updateDishQuantity,
    currentUser,
    spreadsheet,
    exportSpreadsheetCsv,
    copySheetToClipboard,
    logAudit,
    dishes,
    updateDish,
    isAdmin,
    isMaster,
    appsScriptUrl,
    syncAllWithAppsScript,
    isSyncingDatabase,
    clientOrders,
    autoPurge8Days,
    setAutoPurge8Days,
    lastAutoPurgeInfo,
    runOrderRetentionPurge,
  } = useApp();

  // Active view tab in spreadsheet:
  // 'grade_cardapio' = Matrix view matching the app's weekly menu grid exactly
  // 'grade_producao' = Production quantities matrix
  // 'pedidos' = Client orders and quantities requested by user
  // 'amostras' | 'pratos' | 'usuarios' | 'auditoria' | 'relacional'
  const [activeTab, setActiveTab] = useState<
    'grade_cardapio' | 'grade_producao' | 'pedidos' | 'amostras' | 'pratos' | 'usuarios' | 'auditoria' | 'relacional'
  >('grade_cardapio');

  // Cell selection state for Formula Bar (fx)
  const [selectedMatrixCell, setSelectedMatrixCell] = useState<{
    dayKey: 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';
    dayName: string;
    dateStr: string;
    categoryKey: keyof MealSlot;
    categoryLabel: string;
    coordinate: string; // e.g. "B2", "C3"
    dishes: string[];
  } | null>(null);

  // Inline cell dish editing state
  const [editingCellDish, setEditingCellDish] = useState<{
    dayKey: 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';
    catKey: keyof MealSlot;
    dishIndex: number;
    text: string;
  } | null>(null);

  // Catalog dish editing state (Tab 4)
  const [editingCatalogDish, setEditingCatalogDish] = useState<{
    id: string;
    name: string;
    category: string;
    calories?: number | '';
    allergens?: string;
  } | null>(null);

  // Quick inline add or edit
  const [formulaBarInput, setFormulaBarInput] = useState('');
  const [quickDishInput, setQuickDishInput] = useState('');
  const [showAddModalForCell, setShowAddModalForCell] = useState<{
    dayKey: 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';
    categoryKey: keyof MealSlot;
    categoryLabel: string;
    dayName: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedCalcDay, setSelectedCalcDay] = useState<string>('all');
  const [appsScriptModalOpen, setAppsScriptModalOpen] = useState(false);
  const [syncToast, setSyncToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Aggregated orders summary grouped by user to easily view quantities requested by each user
  const userOrderSummaries = React.useMemo(() => {
    const map: Record<string, {
      userName: string;
      email: string;
      department: string;
      orderCount: number;
      totalArroz: number;
      totalFeijao: number;
      totalPrincipal: number;
      totalGuarnicao: number;
      totalSalada: number;
      totalSobremesa: number;
      totalMaxPax: number;
      fruitList: string[];
    }> = {};

    spreadsheet.sheets.pedidos?.rows.forEach((row) => {
      const uEmail = String(row.Email_Usuario || 'cliente@cancaonova.com').toLowerCase();
      if (!map[uEmail]) {
        map[uEmail] = {
          userName: String(row.Usuario_Solicitante || 'Cliente'),
          email: uEmail,
          department: String(row.Setor_Grupo || 'Geral'),
          orderCount: 0,
          totalArroz: 0,
          totalFeijao: 0,
          totalPrincipal: 0,
          totalGuarnicao: 0,
          totalSalada: 0,
          totalSobremesa: 0,
          totalMaxPax: 0,
          fruitList: [],
        };
      }
      map[uEmail].orderCount += 1;
      map[uEmail].totalArroz += Number(row.Arroz_Pessoas) || 0;
      map[uEmail].totalFeijao += Number(row.Feijao_Pessoas) || 0;
      map[uEmail].totalPrincipal += Number(row.Principal_Pessoas) || 0;
      map[uEmail].totalGuarnicao += Number(row.Guarnicao_Pessoas) || 0;
      map[uEmail].totalSalada += Number(row.Salada_Pessoas) || 0;
      map[uEmail].totalSobremesa += Number(row.Sobremesa_Pessoas) || 0;
      map[uEmail].totalMaxPax += Number(row.Total_Comensais_Max) || 0;
      if (row.Fruta_Escalada && String(row.Fruta_Escalada) !== 'Sem frutas adicionais') {
        map[uEmail].fruitList.push(String(row.Fruta_Escalada));
      }
    });

    return Object.values(map);
  }, [spreadsheet.sheets.pedidos?.rows]);

  // Filtered rows for the pedidos spreadsheet view
  const filteredPedidoRows = React.useMemo(() => {
    if (!spreadsheet.sheets.pedidos?.rows) return [];
    if (!filterSearch.trim()) return spreadsheet.sheets.pedidos.rows;
    const term = filterSearch.toLowerCase();
    return spreadsheet.sheets.pedidos.rows.filter((r) =>
      String(r.Usuario_Solicitante || '').toLowerCase().includes(term) ||
      String(r.Email_Usuario || '').toLowerCase().includes(term) ||
      String(r.Setor_Grupo || '').toLowerCase().includes(term) ||
      String(r.Protocolo || '').toLowerCase().includes(term) ||
      String(r.Prato_Principal || '').toLowerCase().includes(term) ||
      String(r.Dia_Semana || '').toLowerCase().includes(term)
    );
  }, [spreadsheet.sheets.pedidos?.rows, filterSearch]);

  const nextExpiringOrder = React.useMemo(
    () => getNextExpiringOrder(clientOrders),
    [clientOrders]
  );

  const dailyProductionSummaries = React.useMemo(
    () => buildDailyOrderProductionSummaries(clientOrders),
    [clientOrders]
  );

  const filteredDailyDishItems = React.useMemo(() => {
    const targetDays =
      selectedCalcDay === 'all'
        ? dailyProductionSummaries
        : dailyProductionSummaries.filter((d) => d.serviceDate === selectedCalcDay);
    return targetDays.flatMap((d) => d.items);
  }, [dailyProductionSummaries, selectedCalcDay]);

  const userSummaryTotals = React.useMemo(() => {
    return userOrderSummaries.reduce(
      (acc, u) => ({
        orderCount: acc.orderCount + u.orderCount,
        totalArroz: acc.totalArroz + u.totalArroz,
        totalFeijao: acc.totalFeijao + u.totalFeijao,
        totalPrincipal: acc.totalPrincipal + u.totalPrincipal,
        totalGuarnicao: acc.totalGuarnicao + u.totalGuarnicao,
        totalSalada: acc.totalSalada + u.totalSalada,
        totalSobremesa: acc.totalSobremesa + u.totalSobremesa,
        totalMaxPax: acc.totalMaxPax + u.totalMaxPax,
      }),
      {
        orderCount: 0,
        totalArroz: 0,
        totalFeijao: 0,
        totalPrincipal: 0,
        totalGuarnicao: 0,
        totalSalada: 0,
        totalSobremesa: 0,
        totalMaxPax: 0,
      }
    );
  }, [userOrderSummaries]);

  const filteredPedidoColumnTotals = React.useMemo(() => {
    const initialTotals = {
      Arroz_Pessoas: 0,
      Feijao_Pessoas: 0,
      Principal_Pessoas: 0,
      Guarnicao_Pessoas: 0,
      Salada_Pessoas: 0,
      Sobremesa_Pessoas: 0,
      Total_Comensais_Max: 0,
    };
    return filteredPedidoRows.reduce<typeof initialTotals>(
      (acc, r) => ({
        Arroz_Pessoas: acc.Arroz_Pessoas + (Number(r.Arroz_Pessoas) || 0),
        Feijao_Pessoas: acc.Feijao_Pessoas + (Number(r.Feijao_Pessoas) || 0),
        Principal_Pessoas: acc.Principal_Pessoas + (Number(r.Principal_Pessoas) || 0),
        Guarnicao_Pessoas: acc.Guarnicao_Pessoas + (Number(r.Guarnicao_Pessoas) || 0),
        Salada_Pessoas: acc.Salada_Pessoas + (Number(r.Salada_Pessoas) || 0),
        Sobremesa_Pessoas: acc.Sobremesa_Pessoas + (Number(r.Sobremesa_Pessoas) || 0),
        Total_Comensais_Max: acc.Total_Comensais_Max + (Number(r.Total_Comensais_Max) || 0),
      }),
      initialTotals
    );
  }, [filteredPedidoRows]);

  const dayKeys = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const;

  const categories: { key: keyof MealSlot; label: string; icon: string; rowNumber: number }[] =
    menuType === 'kilo'
      ? [
          { key: 'principal', label: 'Prato Principal / Grelhado', icon: '🥩', rowNumber: 2 },
          { key: 'grelhadoNobre', label: 'Grelhado Nobre Especial', icon: '🔥', rowNumber: 3 },
          { key: 'alternativa', label: 'Opção de Ave ou Peixe', icon: '🍗', rowNumber: 4 },
          { key: 'massaEspecial', label: 'Massa Artesanal / Especial', icon: '🍝', rowNumber: 5 },
          { key: 'vegetariano', label: 'Opção Vegetariana', icon: '🥗', rowNumber: 6 },
          { key: 'guarnicao', label: 'Guarnição da Pista Quente', icon: '🥔', rowNumber: 7 },
          { key: 'acompanhamento', label: 'Acompanhamentos Base', icon: '🍚', rowNumber: 8 },
          { key: 'salada', label: 'Salada da Pista Fria', icon: '🥬', rowNumber: 9 },
          { key: 'saladaEspecial', label: 'Salada Especial / Carpaccio', icon: '🥑', rowNumber: 10 },
          { key: 'sobremesa', label: 'Sobremesa & Balcão', icon: '🍮', rowNumber: 11 },
        ]
      : [
          { key: 'principal', label: 'Prato Principal', icon: '🥩', rowNumber: 2 },
          { key: 'alternativa', label: 'Opção Alternativa (Ave/Peixe)', icon: '🍗', rowNumber: 3 },
          { key: 'vegetariano', label: 'Opção Vegetariana', icon: '🥗', rowNumber: 4 },
          { key: 'guarnicao', label: 'Guarnição', icon: '🥔', rowNumber: 5 },
          { key: 'acompanhamento', label: 'Acompanhamentos Base', icon: '🍚', rowNumber: 6 },
          { key: 'salada', label: 'Salada do Dia', icon: '🥬', rowNumber: 7 },
          { key: 'sobremesa', label: 'Sobremesa', icon: '🍮', rowNumber: 8 },
        ];

  // Column letters for Google Sheets coordinates:
  // A = Categoria
  // B = Seg, C = Ter, D = Qua, E = Qui, F = Sex, G = Sab, H = Dom
  const DAY_COL_LETTERS: Record<string, string> = {
    seg: 'B',
    ter: 'C',
    qua: 'D',
    qui: 'E',
    sex: 'F',
    sab: 'G',
    dom: 'H',
  };

  // Select cell on click
  const handleSelectCell = (
    dayKey: 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom',
    catKey: keyof MealSlot,
    catLabel: string,
    rowNumber: number
  ) => {
    const day = currentMenu.days[dayKey];
    const items = day?.lunch[catKey];
    const dishList = Array.isArray(items) ? items.filter(Boolean) : [];
    const coord = `${DAY_COL_LETTERS[dayKey]}${rowNumber}`;

    setSelectedMatrixCell({
      dayKey,
      dayName: day.dayName,
      dateStr: day.dateStr,
      categoryKey: catKey,
      categoryLabel: catLabel,
      coordinate: coord,
      dishes: dishList,
    });
    setFormulaBarInput(dishList.join('; '));
  };

  // Formula bar commit: parses semicolons and writes directly to menu
  const handleFormulaBarSave = () => {
    if (!isAdmin || !selectedMatrixCell) return;
    const items = formulaBarInput
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);

    // Replace the slot with the new list
    updateMealSlot(selectedMatrixCell.dayKey, selectedMatrixCell.categoryKey, items);
    logAudit(
      'EDITAR_CELULA_PLANILHA',
      'Cardápio Semanal',
      `Célula ${selectedMatrixCell.coordinate} (${selectedMatrixCell.dayName} · ${selectedMatrixCell.categoryLabel}) atualizada para: ${items.join(', ') || '(Vazio)'}`
    );

    setSelectedMatrixCell((prev) => (prev ? { ...prev, dishes: items } : null));
  };

  // Add dish to currently selected cell
  const handleAddDish = (dishName: string) => {
    if (!isAdmin || !selectedMatrixCell || !dishName.trim()) return;
    addDishToSlot(selectedMatrixCell.dayKey, selectedMatrixCell.categoryKey, dishName.trim());
    setSelectedMatrixCell((prev) => {
      if (!prev) return null;
      const updated = [...prev.dishes, dishName.trim()];
      setFormulaBarInput(updated.join('; '));
      return { ...prev, dishes: updated };
    });
    setQuickDishInput('');
    setShowAddModalForCell(null);
  };

  // Remove dish from currently selected cell
  const handleRemoveDish = (
    dayKey: 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom',
    catKey: keyof MealSlot,
    dishIndex: number
  ) => {
    if (!isAdmin) return;
    removeDishFromSlot(dayKey, catKey, dishIndex);
    if (selectedMatrixCell && selectedMatrixCell.dayKey === dayKey && selectedMatrixCell.categoryKey === catKey) {
      setSelectedMatrixCell((prev) => {
        if (!prev) return null;
        const updated = prev.dishes.filter((_, idx) => idx !== dishIndex);
        setFormulaBarInput(updated.join('; '));
        return { ...prev, dishes: updated };
      });
    }
  };

  // Save inline edit of an existing dish inside a matrix cell
  const handleSaveCellDishEdit = () => {
    if (!editingCellDish || !editingCellDish.text.trim() || !isAdmin) return;
    const res = editDishInSlot(
      editingCellDish.dayKey,
      editingCellDish.catKey,
      editingCellDish.dishIndex,
      editingCellDish.text.trim()
    );
    if (res?.success) {
      if (
        selectedMatrixCell &&
        selectedMatrixCell.dayKey === editingCellDish.dayKey &&
        selectedMatrixCell.categoryKey === editingCellDish.catKey
      ) {
        setSelectedMatrixCell((prev) => {
          if (!prev) return null;
          const updated = [...prev.dishes];
          updated[editingCellDish.dishIndex] = editingCellDish.text.trim();
          setFormulaBarInput(updated.join('; '));
          return { ...prev, dishes: updated };
        });
      }
      setEditingCellDish(null);
    } else if (res?.message) {
      alert(res.message);
    }
  };

  // Save edit of a dish in catalog (Tab 4)
  const handleSaveCatalogDishEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCatalogDish || !editingCatalogDish.name.trim() || !isAdmin) return;

    const allergensList = editingCatalogDish.allergens
      ? editingCatalogDish.allergens.split(',').map((a) => a.trim()).filter(Boolean)
      : [];

    updateDish(editingCatalogDish.id, {
      name: editingCatalogDish.name.trim(),
      category: editingCatalogDish.category as any,
      calories: editingCatalogDish.calories ? Number(editingCatalogDish.calories) : undefined,
      allergens: allergensList,
    });

    setEditingCatalogDish(null);
  };

  // 1-Click Copy formatted for Google Sheets
  const handleCopySheets = async () => {
    if (activeTab === 'grade_cardapio') {
      const tsv = weeklyMenuToMatrixTsv(currentMenu);
      await navigator.clipboard.writeText(tsv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      return;
    }

    if (activeTab === 'relacional') {
      await copySheetToClipboard('cardapios');
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      return;
    }

    const mapTabToKey: Record<string, keyof typeof spreadsheet.sheets> = {
      grade_producao: 'producao',
      pedidos: 'pedidos',
      amostras: 'amostras',
      pratos: 'pratos',
      usuarios: 'usuarios',
      auditoria: 'auditoria',
    };

    const sheetKey = mapTabToKey[activeTab];
    if (sheetKey) {
      const ok = await copySheetToClipboard(sheetKey);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  // Download CSV matching current active view
  const handleDownloadCsv = () => {
    if (activeTab === 'grade_cardapio') {
      downloadWeeklyMatrixCsv(currentMenu);
      return;
    }

    const mapTabToKey: Record<string, keyof typeof spreadsheet.sheets> = {
      grade_producao: 'producao',
      pedidos: 'pedidos',
      amostras: 'amostras',
      pratos: 'pratos',
      usuarios: 'usuarios',
      auditoria: 'auditoria',
      relacional: 'cardapios',
    };

    const sheetKey = mapTabToKey[activeTab];
    if (sheetKey) {
      exportSpreadsheetCsv(sheetKey);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      
      {/* Top Banner: Status & 1-Click Integrations */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
                Tabela & Planilha Central do Sistema (Grade Integrada & Pedidos)
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Sincronizado com o App em Tempo Real
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
              Tabela e planilha interativa estruturada com abas para <strong>Cardápio</strong>, <strong>Quantidades de Produção</strong> e <strong>Pedidos dos Usuários & Quantidades por Pessoa</strong>.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={async () => {
              if (appsScriptUrl) {
                setSyncToast(null);
                const res = await syncAllWithAppsScript();
                setSyncToast({ type: res.success ? 'success' : 'error', text: res.message });
                setTimeout(() => setSyncToast(null), 5000);
              } else {
                setAppsScriptModalOpen(true);
              }
            }}
            disabled={isSyncingDatabase}
            title={appsScriptUrl ? 'Enviar pedidos, cardápios e usuários para o Google Sheets via Apps Script' : 'Configurar e conectar Google Apps Script com seu Google Sheets'}
            className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncingDatabase ? 'animate-spin' : ''}`} />
            <span>{appsScriptUrl ? (isSyncingDatabase ? 'Sincronizando...' : 'Sincronizar Apps Script') : 'Conectar Apps Script'}</span>
          </button>

          {appsScriptUrl && (
            <button
              type="button"
              onClick={() => setAppsScriptModalOpen(true)}
              title="Abrir configurações e código Code.gs do Apps Script"
              className="px-3 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 border border-emerald-300 dark:border-emerald-800 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Configurar Script</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopySheets}
            title="Copiar dados tabulados para colar diretamente no Google Sheets (Ctrl+V)"
            className="px-3.5 py-2 text-xs font-bold text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-2xs hover:shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />}
            <span>{copied ? 'Grade Copiada para o Sheets!' : 'Copiar p/ Google Sheets'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            title="Baixar planilha ativa formatada em CSV/Excel"
            className="px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4" />
            <span>Baixar em Excel (.CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => exportSpreadsheetCsv('all')}
            title="Baixar todas as abas do sistema consolidadas"
            className="px-3 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer hover:shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Todas as Abas</span>
          </button>
        </div>
      </div>

      {syncToast && (
        <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
          syncToast.type === 'success'
            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
            : 'bg-rose-100 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
        }`}>
          <span>{syncToast.text}</span>
          <button type="button" onClick={() => setSyncToast(null)} className="cursor-pointer opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Always-visible 8-Day Order Retention Quick Bar across all spreadsheet tabs */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-2xl px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-200/80 dark:bg-amber-900/70 text-amber-950 dark:text-amber-200">
            <Clock className="w-3.5 h-3.5" />
            <span>Regra 8º Dia (Pedidos): {autoPurge8Days ? 'Ativa' : 'Pausada'}</span>
          </span>
          <span className="text-[11px] text-amber-900 dark:text-amber-200/90">
            Primeiro pedido é apagado automaticamente no 8º dia (ex.: <strong>08/10</strong> → apaga em <strong>15/10</strong>).
            {nextExpiringOrder && (
              <>
                {' '}Próximo: <strong className="font-mono">{nextExpiringOrder.order.orderNumber}</strong> ({nextExpiringOrder.info.statusLabel}).
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {activeTab !== 'pedidos' && (
            <button
              type="button"
              onClick={() => setActiveTab('pedidos')}
              className="px-2.5 py-1 bg-white dark:bg-neutral-900 hover:bg-amber-100 dark:hover:bg-neutral-800 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-bold text-[11px] rounded-lg cursor-pointer transition-colors"
            >
              Ver Pedidos & Retenção (8º dia)
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                const res = runOrderRetentionPurge({ force: true });
                setActiveTab('pedidos');
                setSyncToast({
                  type: 'success',
                  text:
                    res.removedCount > 0
                      ? `${res.removedCount} pedido(s) que atingiram 8 dias apagado(s): ${res.removedOrders.map((o) => o.orderNumber).join(', ')}.`
                      : 'Verificação concluída: nenhum pedido atingiu o 8º dia até hoje.',
                });
                setTimeout(() => setSyncToast(null), 5000);
              }}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <Trash2 className="w-3 h-3" />
              <span>Limpar 8+ Dias Agora</span>
            </button>
          )}
        </div>
      </div>

      {/* Synchronized Week & Month Selector inside the Spreadsheet */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs transition-colors">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-neutral-500 uppercase tracking-wider text-[11px]">Mês:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer"
            >
              {MONTH_NAMES.map((mName, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {mName} de {selectedYear}
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 border-r border-neutral-200 dark:border-neutral-700 hidden sm:block"></div>

          <div className="flex items-center gap-1">
            <span className="font-bold text-neutral-500 uppercase tracking-wider text-[11px] mr-1">Semana:</span>
            {[1, 2, 3, 4, 5].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setSelectedWeek(w)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedWeek === w
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                Sem {w}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-neutral-500 font-mono">
            Período: <strong>{currentMenu.startDate} a {currentMenu.endDate}</strong>
          </div>
        </div>

        {/* Menu Type Toggle (Rampa vs Quilo) */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl border border-neutral-200 dark:border-neutral-700">
          <button
            type="button"
            onClick={() => setMenuType('rampa')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              menuType === 'rampa'
                ? 'bg-white dark:bg-neutral-900 text-amber-700 dark:text-amber-400 shadow-2xs'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            🍲 Cardápio Rampa
          </button>
          <button
            type="button"
            onClick={() => setMenuType('kilo')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              menuType === 'kilo'
                ? 'bg-white dark:bg-neutral-900 text-amber-700 dark:text-amber-400 shadow-2xs'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            ⚖️ Cardápio a Quilo
          </button>
        </div>
      </div>

      {/* Spreadsheet Tabs Selector (Google Sheets style) */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar-x pb-2 border-b border-neutral-200 dark:border-neutral-800">
        {[
          { key: 'grade_cardapio', label: '1. Grade Semanal (Igual ao App)', icon: '📋', badge: 'Matriz Viva' },
          { key: 'grade_producao', label: '2. Fichas de Produção (Cozinha)', icon: '⚖️', badge: 'kg / L / un' },
          { key: 'pedidos', label: '3. Pedidos dos Usuários (Quantidades)', icon: '📦', count: spreadsheet.sheets.pedidos?.totalRows || 0, badge: 'Auto-Exclusão 8d' },
          { key: 'amostras', label: '4. Amostras RDC 216', icon: '🏷️', count: spreadsheet.sheets.amostras.totalRows },
          { key: 'pratos', label: '5. Banco de Pratos', icon: '🍲', count: spreadsheet.sheets.pratos.totalRows },
          { key: 'usuarios', label: '6. Usuários & Permissões', icon: '👥', count: spreadsheet.sheets.usuarios.totalRows },
          { key: 'auditoria', label: '7. Log de Alterações', icon: '⏱️', count: spreadsheet.sheets.auditoria.totalRows },
          { key: 'relacional', label: '8. Base Relacional de Dados', icon: '🗃️', count: spreadsheet.sheets.cardapios.totalRows },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveTab(tab.key as any);
            }}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border-t border-l border-r ${
              activeTab === tab.key
                ? 'bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800/60 border-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.badge && (
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                activeTab === tab.key
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
              }`}>
                {tab.badge}
              </span>
            )}
            {tab.count !== undefined && (
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                activeTab === tab.key
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Formula Bar (Excel / Google Sheets fx style) */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 flex items-center gap-3 text-xs shadow-2xs">
        <div className="w-14 px-2 py-1 bg-neutral-100 dark:bg-neutral-800 font-mono font-bold text-center rounded text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 text-[11px] shrink-0">
          {selectedMatrixCell ? selectedMatrixCell.coordinate : 'B2'}
        </div>
        <div className="font-serif italic font-bold text-neutral-400 select-none shrink-0">
          fx
        </div>
        <div className="h-4 border-r border-neutral-200 dark:border-neutral-700 shrink-0"></div>

        {selectedMatrixCell ? (
          <div className="flex-1 flex items-center gap-2">
            <span className="text-[11px] font-semibold text-neutral-500 whitespace-nowrap">
              {selectedMatrixCell.dayName} · {selectedMatrixCell.categoryLabel}:
            </span>
            <input
              type="text"
              value={formulaBarInput}
              onChange={(e) => setFormulaBarInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFormulaBarSave();
              }}
              placeholder="Digite os pratos separados por ponto e vírgula (;)..."
              disabled={!isAdmin}
              className="flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-neutral-900 dark:text-neutral-100 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {isAdmin && (
              <button
                type="button"
                onClick={handleFormulaBarSave}
                className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                Salvar Célula
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 font-mono text-neutral-500 dark:text-neutral-400 text-[11px]">
            =SELECIONE_UMA_CELULA_PARA_EDITAR_OU_INSPECIONAR(CardapioSemanal; Semana_{selectedWeek})
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: GRADE DO CARDÁPIO SEMANAL (MATRIZ IGUAL AO APP)                   */}
      {/* ========================================================================= */}
      {activeTab === 'grade_cardapio' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
          
          {/* Spreadsheet Header Bar */}
          <div className="bg-emerald-700 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4" />
              <span>Matriz do Cardápio Semanal · {MONTH_NAMES[selectedMonth - 1]} / Semana {selectedWeek} ({currentMenu.startDate} a {currentMenu.endDate})</span>
            </div>
            <span className="text-[11px] font-mono opacity-90">
              {menuType === 'kilo' ? 'Modalidade: A Quilo (10 categorias)' : 'Modalidade: Rampa (7 categorias)'}
            </span>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full border-collapse text-xs text-left min-w-[960px]">
              {/* Row Letters Header (A, B, C, D, E, F, G, H) */}
              <thead>
                <tr className="bg-neutral-100 dark:bg-neutral-800/90 text-neutral-500 dark:text-neutral-400 font-mono text-[11px] border-b border-neutral-300 dark:border-neutral-700 select-none">
                  <th className="w-10 text-center py-1 border-r border-neutral-300 dark:border-neutral-700 bg-neutral-200/60 dark:bg-neutral-800">
                    #
                  </th>
                  <th className="w-48 px-3 py-1 border-r border-neutral-300 dark:border-neutral-700">
                    A (Categoria)
                  </th>
                  <th className="w-36 px-3 py-1 border-r border-neutral-300 dark:border-neutral-700">
                    B (Segunda)
                  </th>
                  <th className="w-36 px-3 py-1 border-r border-neutral-300 dark:border-neutral-700">
                    C (Terça)
                  </th>
                  <th className="w-36 px-3 py-1 border-r border-neutral-300 dark:border-neutral-700">
                    D (Quarta)
                  </th>
                  <th className="w-36 px-3 py-1 border-r border-neutral-300 dark:border-neutral-700">
                    E (Quinta)
                  </th>
                  <th className="w-36 px-3 py-1 border-r border-neutral-300 dark:border-neutral-700">
                    F (Sexta)
                  </th>
                  <th className="w-36 px-3 py-1 border-r border-neutral-300 dark:border-neutral-700">
                    G (Sábado)
                  </th>
                  <th className="w-36 px-3 py-1">
                    H (Domingo)
                  </th>
                </tr>

                {/* Day Labels & Dates Header */}
                <tr className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold">
                  <th className="text-center py-2 border-r border-neutral-300 dark:border-neutral-700 text-neutral-400 font-mono text-[11px]">
                    1
                  </th>
                  <th className="px-3 py-2 border-r border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 uppercase tracking-wider text-[11px]">
                    Categoria Nutricional
                  </th>
                  {dayKeys.map((dKey) => {
                    const day = currentMenu.days[dKey];
                    return (
                      <th
                        key={dKey}
                        className="px-3 py-2 border-r border-neutral-300 dark:border-neutral-700 last:border-r-0"
                      >
                        <div className="flex items-center justify-between">
                          <span className="capitalize">{day.dayName}</span>
                          <span className="font-mono text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                            {day.dateStr}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Category Rows & Cells */}
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {categories.map((cat, rowIdx) => {
                  return (
                    <tr
                      key={cat.key}
                      className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors"
                    >
                      {/* Row coordinate (2, 3, 4...) */}
                      <td className="text-center py-2 border-r border-neutral-300 dark:border-neutral-700 font-mono text-[11px] text-neutral-400 bg-neutral-100/50 dark:bg-neutral-800/50 select-none">
                        {cat.rowNumber}
                      </td>

                      {/* Col A: Category Label */}
                      <td className="px-3 py-2 border-r border-neutral-300 dark:border-neutral-700 font-bold text-neutral-900 dark:text-neutral-100 whitespace-nowrap bg-neutral-50/40 dark:bg-neutral-800/20">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{cat.icon}</span>
                          <span className="truncate">{cat.label}</span>
                        </div>
                      </td>

                      {/* Col B to H: Days */}
                      {dayKeys.map((dKey) => {
                        const day = currentMenu.days[dKey];
                        const items = day?.lunch[cat.key];
                        const dishList = Array.isArray(items) ? items.filter(Boolean) : [];
                        const isSelected =
                          selectedMatrixCell?.dayKey === dKey &&
                          selectedMatrixCell?.categoryKey === cat.key;
                        const cellCoord = `${DAY_COL_LETTERS[dKey]}${cat.rowNumber}`;

                        return (
                          <td
                            key={dKey}
                            onClick={() => handleSelectCell(dKey, cat.key, cat.label, cat.rowNumber)}
                            className={`p-2 border-r border-neutral-300 dark:border-neutral-700 last:border-r-0 align-top transition-all cursor-pointer relative group ${
                              isSelected
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 ring-2 ring-emerald-500 shadow-inner'
                                : 'hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20'
                            }`}
                          >
                            {/* Coordinate tag on hover */}
                            <span className="absolute top-1 right-1 text-[9px] font-mono text-neutral-300 dark:text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                              {cellCoord}
                            </span>

                            {dishList.length === 0 ? (
                              <div className="h-full min-h-[44px] flex items-center justify-center">
                                {isAdmin ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectCell(dKey, cat.key, cat.label, cat.rowNumber);
                                      setShowAddModalForCell({
                                        dayKey: dKey,
                                        categoryKey: cat.key,
                                        categoryLabel: cat.label,
                                        dayName: day.dayName,
                                      });
                                    }}
                                    className="text-[11px] text-neutral-400 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-1 py-1 px-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Adicionar</span>
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-neutral-400 italic">Vazio</span>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {dishList.map((dishName, dIdx) => {
                                  const isCellDishEditing =
                                    editingCellDish &&
                                    editingCellDish.dayKey === dKey &&
                                    editingCellDish.catKey === cat.key &&
                                    editingCellDish.dishIndex === dIdx;

                                  return isCellDishEditing ? (
                                    <div
                                      key={dIdx}
                                      onClick={(e) => e.stopPropagation()}
                                      className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-400 dark:border-emerald-700 rounded p-1 shadow-xs flex items-center gap-1"
                                    >
                                      <input
                                        type="text"
                                        value={editingCellDish.text}
                                        onChange={(e) => setEditingCellDish({ ...editingCellDish, text: e.target.value })}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSaveCellDishEdit();
                                          } else if (e.key === 'Escape') {
                                            setEditingCellDish(null);
                                          }
                                        }}
                                        className="w-full text-[11px] px-1 py-0.5 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded border border-emerald-300 dark:border-emerald-600 focus:outline-none"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSaveCellDishEdit();
                                        }}
                                        className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer shrink-0"
                                        title="Salvar alteração do prato"
                                      >
                                        <Check className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingCellDish(null);
                                        }}
                                        className="p-1 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 text-neutral-700 dark:text-neutral-300 rounded cursor-pointer shrink-0"
                                        title="Cancelar edição"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div
                                      key={dIdx}
                                      className="text-[11px] text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/80 rounded px-2 py-1 shadow-2xs flex items-center justify-between gap-1 group/item"
                                    >
                                      <span className="leading-tight font-medium flex-1">
                                        • {dishName}
                                      </span>
                                      {isAdmin && (
                                        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleSelectCell(dKey, cat.key, cat.label, cat.rowNumber);
                                              setEditingCellDish({
                                                dayKey: dKey,
                                                catKey: cat.key,
                                                dishIndex: dIdx,
                                                text: dishName,
                                              });
                                            }}
                                            title={`Editar "${dishName}"`}
                                            className="text-neutral-400 hover:text-amber-600 p-0.5 rounded cursor-pointer"
                                          >
                                            <Edit2 className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRemoveDish(dKey, cat.key, dIdx);
                                            }}
                                            title={`Remover "${dishName}"`}
                                            className="text-neutral-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}

                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectCell(dKey, cat.key, cat.label, cat.rowNumber);
                                      setShowAddModalForCell({
                                        dayKey: dKey,
                                        categoryKey: cat.key,
                                        categoryLabel: cat.label,
                                        dayName: day.dayName,
                                      });
                                    }}
                                    className="w-full text-center py-0.5 text-[10px] text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded border border-dashed border-emerald-300 dark:border-emerald-800 flex items-center justify-center gap-0.5 transition-colors cursor-pointer"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                    <span>Mais um item</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Spreadsheet Footer Stats */}
          <div className="bg-neutral-50 dark:bg-neutral-800/80 px-4 py-2.5 border-t border-neutral-200 dark:border-neutral-700 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
            <div className="flex items-center gap-3">
              <span>Célula Ativa: <strong className="font-mono text-neutral-800 dark:text-neutral-200">{selectedMatrixCell ? selectedMatrixCell.coordinate : 'Nenhuma'}</strong></span>
              <span>·</span>
              <span>Total de Categorias: <strong>{categories.length}</strong></span>
              <span>·</span>
              <span>Colunas: <strong>7 Dias (Segunda a Domingo)</strong></span>
            </div>
            <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
              ✓ Gravando diretamente na planilha a cada clique
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: GRADE DE PRODUÇÃO & QUANTIDADES DA COZINHA                        */}
      {/* ========================================================================= */}
      {activeTab === 'grade_producao' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-amber-700 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4" />
              <span>Grade de Quantidades a Fazer (Cozinha) · Semana {selectedWeek} ({currentMenu.startDate} a {currentMenu.endDate})</span>
            </div>
            <span className="text-[11px] font-mono opacity-90">
              Cálculo de kg, Litros e PAX
            </span>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full border-collapse text-xs text-left min-w-[960px]">
              <thead>
                <tr className="bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-300 dark:border-neutral-700 font-bold text-neutral-700 dark:text-neutral-300">
                  <th className="px-3 py-2 border-r border-neutral-300 dark:border-neutral-700">Categoria</th>
                  <th className="px-3 py-2 border-r border-neutral-300 dark:border-neutral-700">Segunda ({currentMenu.days.seg.dateStr})</th>
                  <th className="px-3 py-2 border-r border-neutral-300 dark:border-neutral-700">Terça ({currentMenu.days.ter.dateStr})</th>
                  <th className="px-3 py-2 border-r border-neutral-300 dark:border-neutral-700">Quarta ({currentMenu.days.qua.dateStr})</th>
                  <th className="px-3 py-2 border-r border-neutral-300 dark:border-neutral-700">Quinta ({currentMenu.days.qui.dateStr})</th>
                  <th className="px-3 py-2 border-r border-neutral-300 dark:border-neutral-700">Sexta ({currentMenu.days.sex.dateStr})</th>
                  <th className="px-3 py-2 border-r border-neutral-300 dark:border-neutral-700">Sábado ({currentMenu.days.sab.dateStr})</th>
                  <th className="px-3 py-2">Domingo ({currentMenu.days.dom.dateStr})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {categories.map((cat) => (
                  <tr key={cat.key} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    <td className="px-3 py-2.5 font-bold text-neutral-900 dark:text-neutral-100 border-r border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/20 whitespace-nowrap">
                      {cat.icon} {cat.label}
                    </td>
                    {dayKeys.map((dKey) => {
                      const day = currentMenu.days[dKey];
                      const items = day?.lunch[cat.key];
                      const dishList = Array.isArray(items) ? items.filter(Boolean) : [];
                      const prodDay = currentMenu.production?.[dKey];

                      return (
                        <td key={dKey} className="p-2 border-r border-neutral-300 dark:border-neutral-700 last:border-r-0 align-top">
                          {dishList.length === 0 ? (
                            <span className="text-[11px] text-neutral-400 italic">—</span>
                          ) : (
                            <div className="space-y-1">
                              {dishList.map((dName, idx) => {
                                const qKey = `${String(cat.key)}_${dName}`;
                                const qInfo = prodDay?.quantities?.[qKey];
                                const amt = qInfo?.amount ?? 35;
                                const unit = qInfo?.unit ?? 'kg';

                                return (
                                  <div key={idx} className="bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded text-[11px] border border-neutral-200 dark:border-neutral-700">
                                    <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">{dName}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5 text-amber-800 dark:text-amber-300 font-bold font-mono">
                                      <span>{amt} {unit}</span>
                                    </div>
                                  </div>
                                );
                              })}
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
      )}

      {/* ========================================================================= */}
      {/* VIEW: PEDIDOS DOS USUÁRIOS & QUANTIDADES POR PESSOA (NOVA ABA)             */}
      {/* ========================================================================= */}
      {activeTab === 'pedidos' && (
        <div className="space-y-4">
          
          {/* Header Bar */}
          <div className="bg-amber-700 text-white px-4 py-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold shadow-xs">
            <div className="flex items-center gap-2.5">
              <Package className="w-5 h-5 text-amber-200" />
              <div>
                <span className="text-sm font-black block">
                  Aba de Pedidos Enviados pelos Usuários (Controle de Quantidades)
                </span>
                <span className="text-[11px] text-amber-200 font-normal">
                  Sincronizado automaticamente: cada pedido feito no Portal Rampa é inserido instantaneamente nesta planilha.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="bg-white/20 px-3 py-1 rounded-xl text-[11px] font-mono font-bold">
                {spreadsheet.sheets.pedidos?.totalRows || 0} pedidos registrados
              </span>
            </div>
          </div>

          {/* 8-Day Automatic Deletion Rule Banner */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="font-bold text-amber-900 dark:text-amber-200">
                  Regra Automática da Planilha: Auto-Exclusão do Primeiro Pedido no 8º Dia
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  autoPurge8Days
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                    : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                }`}>
                  {autoPurge8Days ? 'Regra Ativa' : 'Pausada'}
                </span>
              </div>
              <p className="text-[11px] text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                Cada pedido permanece por 7 dias completos e é apagado automaticamente ao atingir o <strong>8º dia corrido</strong>{' '}
                (ex.: pedido feito na segunda <strong>08/10/2026</strong> → apagado automaticamente em <strong>15/10/2026</strong>).
                {nextExpiringOrder && (
                  <>
                    {' '}Próximo da fila: <strong className="font-mono">{nextExpiringOrder.order.orderNumber}</strong>{' '}
                    (feito em {nextExpiringOrder.info.referenceDateBr} →{' '}
                    <strong>{nextExpiringOrder.info.expirationDateBr}</strong>).
                  </>
                )}
              </p>
              {lastAutoPurgeInfo && lastAutoPurgeInfo.count > 0 && (
                <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  Última auto-exclusão: {lastAutoPurgeInfo.count} pedido(s) removido(s) ({lastAutoPurgeInfo.protocols.join(', ')}).
                </p>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              {isAdmin && (
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer select-none bg-white dark:bg-neutral-900 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800/70">
                  <input
                    type="checkbox"
                    checked={autoPurge8Days}
                    onChange={(e) => setAutoPurge8Days(e.target.checked)}
                    className="rounded border-neutral-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span>Apagar automaticamente no 8º dia</span>
                </label>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    const res = runOrderRetentionPurge({ force: true });
                    setSyncToast({
                      type: 'success',
                      text:
                        res.removedCount > 0
                          ? `${res.removedCount} pedido(s) que atingiram 8 dias apagado(s): ${res.removedOrders.map((o) => o.orderNumber).join(', ')}.`
                          : 'Verificação concluída: nenhum pedido atingiu o 8º dia até hoje.',
                    });
                    setTimeout(() => setSyncToast(null), 5000);
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Verificar & Limpar 8+ Dias</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs">
              <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                Total de Pedidos
              </span>
              <p className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-100 font-mono mt-1">
                {spreadsheet.sheets.pedidos?.totalRows || 0}
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs">
              <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                Usuários Solicitantes
              </span>
              <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
                {userOrderSummaries.length}
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs">
              <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                Pessoas Atendidas (Pax)
              </span>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {userOrderSummaries.reduce((acc, u) => acc + u.totalMaxPax, 0)} pax
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs">
              <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                Pratos & Frutas Demandadas
              </span>
              <p className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 font-mono mt-1">
                {userOrderSummaries.reduce((acc, u) => acc + u.totalPrincipal, 0)} porções
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PAINEL CONSOLIDADO: QUANTIDADES PEDIDAS POR CADA USUÁRIO                  */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                <span className="text-neutral-800 dark:text-neutral-200">
                  Resumo Consolidado de Quantidades por Usuário / Solicitante
                </span>
              </div>
              <span className="text-[11px] text-neutral-500 font-mono">
                Visão consolidada para conferência da nutrição
              </span>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-850 text-neutral-600 dark:text-neutral-300 font-bold border-b border-neutral-200 dark:border-neutral-700">
                    <th className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700">Usuário Solicitante</th>
                    <th className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700">Setor / Grupo</th>
                    <th className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 text-center">Pedidos</th>
                    <th className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 text-center">🍚 Arroz (pax)</th>
                    <th className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 text-center">🫘 Feijão (pax)</th>
                    <th className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 text-center">🥩 Principal (pax)</th>
                    <th className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 text-center">🥔 Guarnição (pax)</th>
                    <th className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 text-center">🥬 Salada (pax)</th>
                    <th className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 text-center">🍮 Sobremesa (pax)</th>
                    <th className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 text-center font-bold">Total Pessoas</th>
                    <th className="px-3 py-2.5">Frutas Solicitadas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {userOrderSummaries.map((summary, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40">
                      <td className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 font-bold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                        <div>{summary.userName}</div>
                        <div className="text-[10px] text-neutral-400 font-mono font-normal">{summary.email}</div>
                      </td>
                      <td className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                        {summary.department}
                      </td>
                      <td className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 text-center font-mono font-bold text-amber-700 dark:text-amber-400">
                        {summary.orderCount}
                      </td>
                      <td className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 text-center font-mono font-bold">
                        {summary.totalArroz}
                      </td>
                      <td className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 text-center font-mono font-bold">
                        {summary.totalFeijao}
                      </td>
                      <td className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 text-center font-mono font-bold text-rose-700 dark:text-rose-400">
                        {summary.totalPrincipal}
                      </td>
                      <td className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 text-center font-mono font-bold">
                        {summary.totalGuarnicao}
                      </td>
                      <td className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {summary.totalSalada}
                      </td>
                      <td className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 text-center font-mono font-bold text-purple-700 dark:text-purple-400">
                        {summary.totalSobremesa}
                      </td>
                      <td className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 text-center font-mono font-extrabold text-neutral-900 dark:text-neutral-100 bg-amber-50/40 dark:bg-amber-950/20">
                        {summary.totalMaxPax}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-neutral-600 dark:text-neutral-300">
                        {summary.fruitList.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {summary.fruitList.map((fr, fIdx) => (
                              <span key={fIdx} className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] font-mono">
                                {fr}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-neutral-400 italic">Padrão da rampa</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-50 dark:bg-emerald-950/50 border-t-2 border-emerald-400 dark:border-emerald-700 font-black text-neutral-900 dark:text-neutral-100 font-mono">
                    <td colSpan={2} className="px-3 py-2.5 border-r border-emerald-200 dark:border-emerald-800 font-sans uppercase tracking-wider text-[11px] text-emerald-900 dark:text-emerald-200">
                      Somatória Geral (Todos os Usuários)
                    </td>
                    <td className="px-3 py-2.5 border-r border-emerald-200 dark:border-emerald-800 text-center text-amber-700 dark:text-amber-300">
                      {userSummaryTotals.orderCount}
                    </td>
                    <td className="px-3 py-2.5 border-r border-emerald-200 dark:border-emerald-800 text-center">
                      {userSummaryTotals.totalArroz} pax
                    </td>
                    <td className="px-3 py-2.5 border-r border-emerald-200 dark:border-emerald-800 text-center">
                      {userSummaryTotals.totalFeijao} pax
                    </td>
                    <td className="px-3 py-2.5 border-r border-emerald-200 dark:border-emerald-800 text-center text-rose-700 dark:text-rose-300">
                      {userSummaryTotals.totalPrincipal} pax
                    </td>
                    <td className="px-3 py-2.5 border-r border-emerald-200 dark:border-emerald-800 text-center">
                      {userSummaryTotals.totalGuarnicao} pax
                    </td>
                    <td className="px-3 py-2.5 border-r border-emerald-200 dark:border-emerald-800 text-center text-emerald-700 dark:text-emerald-300">
                      {userSummaryTotals.totalSalada} pax
                    </td>
                    <td className="px-3 py-2.5 border-r border-emerald-200 dark:border-emerald-800 text-center text-purple-700 dark:text-purple-300">
                      {userSummaryTotals.totalSobremesa} pax
                    </td>
                    <td className="px-3 py-2.5 border-r border-emerald-200 dark:border-emerald-800 text-center bg-emerald-100 dark:bg-emerald-900/60 text-emerald-950 dark:text-emerald-100">
                      {userSummaryTotals.totalMaxPax} pax
                    </td>
                    <td className="px-3 py-2.5 font-sans text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                      Soma total p/ conferência
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SOMATÓRIA DIÁRIA POR DIA & POR PRATO / ALIMENTO (CÁLCULO DA COZINHA)       */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-neutral-900 border border-emerald-300 dark:border-emerald-800/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-emerald-700 text-white px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-200" />
                <div>
                  <span className="text-sm font-black block">
                    Cálculo Diário para Fazer a Comida — Somatória de Pessoas & Alimentos por Dia
                  </span>
                  <span className="text-[11px] text-emerald-100/90 font-normal">
                    Agrupa automaticamente todos os pedidos por dia e soma pessoas + peso estimado (kg/porções) de cada prato e alimento.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copySheetToClipboard('calculoDiario');
                    if (ok) {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2500);
                    }
                  }}
                  className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Cálculo Diário</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportSpreadsheetCsv('calculoDiario')}
                  className="px-3 py-1.5 bg-emerald-900/60 hover:bg-emerald-900 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV Diário</span>
                </button>
              </div>
            </div>

            {/* Sub-Table 1: Daily Totals by Date (Pax & Category Totals per Day) */}
            <div className="p-4 space-y-4">
              <div>
                <h5 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1. Resumo Total de Pessoas (PAX) e Categorias por Dia</span>
                </h5>
                <div className="overflow-x-auto scrollbar-thin border border-neutral-200 dark:border-neutral-800 rounded-xl">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold border-b border-neutral-200 dark:border-neutral-700">
                        <th className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700">Data Refeição</th>
                        <th className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700">Dia da Semana</th>
                        <th className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 text-center">Pedidos</th>
                        <th className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 text-center">🍚 Arroz</th>
                        <th className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 text-center">🫘 Feijão</th>
                        <th className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 text-center">🥩 Principal</th>
                        <th className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 text-center">🥔 Guarnição</th>
                        <th className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 text-center">🥬 Salada</th>
                        <th className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 text-center">🍮 Sobremesa</th>
                        <th className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 text-center bg-emerald-50 dark:bg-emerald-950/40">Total Pessoas (Dia)</th>
                        <th className="px-3 py-2">🍎 Frutas Somadas no Dia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {dailyProductionSummaries.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-6 text-center text-neutral-400 italic">
                            Nenhum pedido registrado para cálculo diário.
                          </td>
                        </tr>
                      ) : (
                        dailyProductionSummaries.map((day) => (
                          <tr
                            key={day.serviceDate}
                            onClick={() => setSelectedCalcDay(day.serviceDate)}
                            className={`cursor-pointer transition-colors ${
                              selectedCalcDay === day.serviceDate
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                                : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                            }`}
                          >
                            <td className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                              {day.serviceDate}
                            </td>
                            <td className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 font-bold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                              {day.dayName}
                            </td>
                            <td className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 text-center font-mono font-bold text-amber-700 dark:text-amber-400">
                              {day.ordersCount}
                            </td>
                            <td className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 text-center font-mono">
                              <div className="font-bold">{day.totalArrozPax} pax</div>
                              <div className="text-[10px] text-neutral-500">{(Math.round(day.totalArrozPax * 0.09 * 100) / 100)} kg</div>
                            </td>
                            <td className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 text-center font-mono">
                              <div className="font-bold">{day.totalFeijaoPax} pax</div>
                              <div className="text-[10px] text-neutral-500">{(Math.round(day.totalFeijaoPax * 0.07 * 100) / 100)} kg</div>
                            </td>
                            <td className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 text-center font-mono">
                              <div className="font-bold text-rose-700 dark:text-rose-400">{day.totalPrincipalPax} pax</div>
                              <div className="text-[10px] text-neutral-500">{(Math.round(day.totalPrincipalPax * 0.14 * 100) / 100)} kg</div>
                            </td>
                            <td className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 text-center font-mono">
                              <div className="font-bold">{day.totalGuarnicaoPax} pax</div>
                              <div className="text-[10px] text-neutral-500">{(Math.round(day.totalGuarnicaoPax * 0.09 * 100) / 100)} kg</div>
                            </td>
                            <td className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 text-center font-mono">
                              <div className="font-bold text-emerald-700 dark:text-emerald-400">{day.totalSaladaPax} pax</div>
                              <div className="text-[10px] text-neutral-500">{(Math.round(day.totalSaladaPax * 0.06 * 100) / 100)} kg</div>
                            </td>
                            <td className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 text-center font-mono font-bold text-purple-700 dark:text-purple-400">
                              {day.totalSobremesaPax} porç.
                            </td>
                            <td className="px-3 py-2.5 border-r border-neutral-200 dark:border-neutral-700 text-center font-mono font-black text-emerald-900 dark:text-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20">
                              {day.totalMaxPax} pax
                            </td>
                            <td className="px-3 py-2.5">
                              {day.fruitsBreakdown.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {day.fruitsBreakdown.map((fr, fIdx) => (
                                    <span key={fIdx} className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-[10px] font-mono font-bold text-amber-900 dark:text-amber-200">
                                      {fr.name}: {fr.quantity} {fr.unit}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-neutral-400 italic">—</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {dailyProductionSummaries.length > 0 && (
                      <tfoot>
                        <tr className="bg-emerald-50 dark:bg-emerald-950/50 border-t-2 border-emerald-400 dark:border-emerald-700 font-black font-mono text-neutral-900 dark:text-neutral-100">
                          <td colSpan={2} className="px-3 py-2.5 border-r border-emerald-200 dark:border-emerald-800 font-sans uppercase text-[11px] text-emerald-900 dark:text-emerald-200">
                            Somatória Geral (Todos os Dias)
                          </td>
                          <td className="px-3 py-2.5 border-r border-emerald-200 dark:border-emerald-800 text-center text-amber-700 dark:text-amber-300">
                            {dailyProductionSummaries.reduce((s, d) => s + d.ordersCount, 0)}
                          </td>
                          <td className="px-3 py-2.5 border-r border-emerald-200 dark:border-emerald-800 text-center">
                            {dailyProductionSummaries.reduce((s, d) => s + d.totalArrozPax, 0)} pax
                          </td>
                          <td className="px-3 py-2.5 border-r border-emerald-200 dark:border-emerald-800 text-center">
                            {dailyProductionSummaries.reduce((s, d) => s + d.totalFeijaoPax, 0)} pax
                          </td>
                          <td className="px-3 py-2.5 border-r border-emerald-200 dark:border-emerald-800 text-center text-rose-700 dark:text-rose-300">
                            {dailyProductionSummaries.reduce((s, d) => s + d.totalPrincipalPax, 0)} pax
                          </td>
                          <td className="px-3 py-2.5 border-r border-emerald-200 dark:border-emerald-800 text-center">
                            {dailyProductionSummaries.reduce((s, d) => s + d.totalGuarnicaoPax, 0)} pax
                          </td>
                          <td className="px-3 py-2.5 border-r border-emerald-200 dark:border-emerald-800 text-center text-emerald-700 dark:text-emerald-300">
                            {dailyProductionSummaries.reduce((s, d) => s + d.totalSaladaPax, 0)} pax
                          </td>
                          <td className="px-3 py-2.5 border-r border-emerald-200 dark:border-emerald-800 text-center text-purple-700 dark:text-purple-300">
                            {dailyProductionSummaries.reduce((s, d) => s + d.totalSobremesaPax, 0)} porç.
                          </td>
                          <td className="px-3 py-2.5 border-r border-emerald-200 dark:border-emerald-800 text-center bg-emerald-100 dark:bg-emerald-900/60">
                            {dailyProductionSummaries.reduce((s, d) => s + d.totalMaxPax, 0)} pax
                          </td>
                          <td className="px-3 py-2.5 font-sans text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                            Clique em um dia p/ detalhar
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* Sub-Table 2: Each Dish & Food Item Separately Per Day */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <h5 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-amber-600" />
                    <span>2. Cada Prato e Alimento Separadamente por Dia (O que Preparar na Cozinha)</span>
                  </h5>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedCalcDay('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                        selectedCalcDay === 'all'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                      }`}
                    >
                      Todos os Dias ({dailyProductionSummaries.length})
                    </button>
                    {dailyProductionSummaries.map((d) => (
                      <button
                        key={d.serviceDate}
                        type="button"
                        onClick={() => setSelectedCalcDay(d.serviceDate)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono cursor-pointer transition-colors ${
                          selectedCalcDay === d.serviceDate
                            ? 'bg-emerald-600 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                        }`}
                      >
                        {d.serviceDate} ({d.dayName.split('-')[0]})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto scrollbar-thin border border-neutral-200 dark:border-neutral-800 rounded-xl max-h-[420px]">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold border-b border-neutral-200 dark:border-neutral-700">
                      <tr>
                        <th className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700">Data Refeição</th>
                        <th className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700">Dia</th>
                        <th className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700">Categoria</th>
                        <th className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700">Prato / Alimento Separado</th>
                        <th className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 text-center">Pedidos</th>
                        <th className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 text-right">Somatória de Pessoas</th>
                        <th className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 text-center">Base Per Capita</th>
                        <th className="px-3 py-2 text-right bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200">Qtd. Total p/ Fazer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {filteredDailyDishItems.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-6 text-center text-neutral-400 italic">
                            Nenhum prato ou alimento encontrado para o dia selecionado.
                          </td>
                        </tr>
                      ) : (
                        filteredDailyDishItems.map((item, idx) => (
                          <tr key={`${item.serviceDate}-${item.category}-${item.dishName}-${idx}`} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                            <td className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                              {item.serviceDate}
                            </td>
                            <td className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                              {item.dayName}
                            </td>
                            <td className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 font-semibold text-neutral-800 dark:text-neutral-200">
                                <span>{item.icon}</span>
                                <span>{item.categoryLabel}</span>
                              </span>
                            </td>
                            <td className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 font-bold text-neutral-900 dark:text-neutral-100">
                              {item.dishName}
                            </td>
                            <td className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 text-center font-mono font-bold text-amber-700 dark:text-amber-400">
                              {item.ordersCount}
                            </td>
                            <td className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                              {item.totalPeople} pessoas
                            </td>
                            <td className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 text-center text-[11px] text-neutral-500 font-mono whitespace-nowrap">
                              {item.perCapitaLabel}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20 whitespace-nowrap">
                              {item.estimatedAmount} {item.estimatedUnit}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {filteredDailyDishItems.length > 0 && (
                      <tfoot>
                        <tr className="bg-emerald-50 dark:bg-emerald-950/50 border-t-2 border-emerald-400 dark:border-emerald-700 font-black text-neutral-900 dark:text-neutral-100 font-mono">
                          <td colSpan={4} className="px-3 py-2 border-r border-emerald-200 dark:border-emerald-800 font-sans uppercase text-[11px] text-emerald-900 dark:text-emerald-200">
                            Somatória dos Pratos & Alimentos Exibidos ({filteredDailyDishItems.length} itens)
                          </td>
                          <td className="px-3 py-2 border-r border-emerald-200 dark:border-emerald-800 text-center text-amber-700 dark:text-amber-300">
                            {filteredDailyDishItems.reduce((acc, it) => acc + it.ordersCount, 0)}
                          </td>
                          <td className="px-3 py-2 border-r border-emerald-200 dark:border-emerald-800 text-right whitespace-nowrap">
                            {filteredDailyDishItems.reduce((acc, it) => acc + it.totalPeople, 0)} porções/pax
                          </td>
                          <td colSpan={2} className="px-3 py-2 text-right font-sans text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                            {Math.round(filteredDailyDishItems.filter((i) => i.estimatedUnit === 'kg').reduce((acc, it) => acc + it.estimatedAmount, 0) * 100) / 100} kg em pratos +{' '}
                            {filteredDailyDishItems.filter((i) => i.estimatedUnit !== 'kg').reduce((acc, it) => acc + it.estimatedAmount, 0)} un/porções
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TABELA DETALHADA: CADA PEDIDO INDIVIDUAL REGISTRADO NA PLANILHA           */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden space-y-3 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Grade Completa de Pedidos (Linhas da Planilha "Pedidos_Usuarios_Rampa")
                </h4>
              </div>

              {/* Search in Sheet */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder="Filtrar por usuário, setor, prato ou protocolo..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-1 focus:ring-amber-500 w-full sm:w-72"
                />
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-thin max-h-[500px]">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold border-b border-neutral-300 dark:border-neutral-700">
                  <tr>
                    {spreadsheet.sheets.pedidos?.columns.map((col) => (
                      <th key={col.key} className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 last:border-r-0 whitespace-nowrap">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {filteredPedidoRows.length === 0 ? (
                    <tr>
                      <td colSpan={spreadsheet.sheets.pedidos?.columns.length || 10} className="py-8 text-center text-neutral-400 italic">
                        Nenhum pedido encontrado para o filtro aplicado.
                      </td>
                    </tr>
                  ) : (
                    filteredPedidoRows.map((row, rIdx) => {
                      const statusVal = String(row.Status || '').toLowerCase();
                      const statusColor = 
                        statusVal.includes('aprovado') ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        statusVal.includes('preparo') ? 'bg-sky-100 text-sky-800 border-sky-300' :
                        statusVal.includes('entregue') ? 'bg-neutral-100 text-neutral-800 border-neutral-300' :
                        'bg-amber-100 text-amber-800 border-amber-300';

                      return (
                        <tr key={rIdx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                          {spreadsheet.sheets.pedidos?.columns.map((col) => {
                            const val = row[col.key];

                            if (col.key === 'Status') {
                              return (
                                <td key={col.key} className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusColor}`}>
                                    {String(val ?? '—')}
                                  </span>
                                </td>
                              );
                            }

                            if (col.key === 'Protocolo') {
                              return (
                                <td key={col.key} className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 whitespace-nowrap font-mono font-bold text-amber-700 dark:text-amber-400">
                                  {String(val ?? '—')}
                                </td>
                              );
                            }

                            if (col.key === 'Expira_Em') {
                              const expText = String(val ?? '—');
                              const isTomorrowOrExpired = expText.includes('amanhã') || expText.includes('Expirado');
                              return (
                                <td key={col.key} className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                                    isTomorrowOrExpired
                                      ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800'
                                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                                  }`}>
                                    {expText}
                                  </span>
                                </td>
                              );
                            }

                            if (col.key.startsWith('Qtd_') || col.key.endsWith('_Pessoas') || col.key === 'Total_Comensais_Max') {
                              return (
                                <td key={col.key} className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 whitespace-nowrap text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                  {Number(val) > 0 ? `${val} pax` : '0'}
                                </td>
                              );
                            }

                            return (
                              <td key={col.key} className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 last:border-r-0 whitespace-nowrap">
                                {String(val ?? '—')}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredPedidoRows.length > 0 && spreadsheet.sheets.pedidos?.columns && (
                  <tfoot className="sticky bottom-0 z-10">
                    <tr className="bg-amber-50 dark:bg-amber-950/60 border-t-2 border-amber-400 dark:border-amber-700 font-black font-mono text-neutral-900 dark:text-neutral-100">
                      {spreadsheet.sheets.pedidos.columns.map((col, cIdx) => {
                        if (cIdx === 0) {
                          return (
                            <td key={col.key} className="px-3 py-2.5 border-r border-amber-200 dark:border-amber-800 font-sans text-[10px] uppercase text-amber-900 dark:text-amber-200">
                              SOMA
                            </td>
                          );
                        }
                        if (cIdx === 1) {
                          return (
                            <td key={col.key} className="px-3 py-2.5 border-r border-amber-200 dark:border-amber-800 font-sans text-[11px] font-bold text-amber-900 dark:text-amber-200 whitespace-nowrap">
                              {filteredPedidoRows.length} pedidos
                            </td>
                          );
                        }
                        if (col.key in filteredPedidoColumnTotals) {
                          const totalVal = filteredPedidoColumnTotals[col.key as keyof typeof filteredPedidoColumnTotals];
                          return (
                            <td key={col.key} className="px-3 py-2.5 border-r border-amber-200 dark:border-amber-800 whitespace-nowrap text-right text-amber-950 dark:text-amber-100">
                              {totalVal} pax
                            </td>
                          );
                        }
                        return (
                          <td key={col.key} className="px-3 py-2.5 border-r border-amber-200 dark:border-amber-800 last:border-r-0">
                            —
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <div className="pt-2 text-[11px] text-neutral-500 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800">
              <span>Total de linhas exibidas: <strong>{filteredPedidoRows.length}</strong> de <strong>{spreadsheet.sheets.pedidos?.totalRows || 0}</strong></span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold font-mono">
                ✓ Copiável com 1 clique para Google Sheets / Excel
              </span>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: AMOSTRAS RDC 216                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'amostras' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-emerald-700 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              <span>Livro Oficial de Registro de Coleta de Amostras (ANVISA RDC 216)</span>
            </div>
            <span className="text-[11px] font-mono opacity-90">
              Guarda obrigatória: 72 horas
            </span>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold border-b border-neutral-200 dark:border-neutral-700">
                  {spreadsheet.sheets.amostras.columns.map((c) => (
                    <th key={c.key} className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 last:border-r-0 whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {spreadsheet.sheets.amostras.rows.slice(0, 100).map((r, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    {spreadsheet.sheets.amostras.columns.map((c) => (
                      <td key={c.key} className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 last:border-r-0 whitespace-nowrap">
                        {String(r[c.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: BANCO DE PRATOS                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'pratos' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-amber-700 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4" />
              <span>Catálogo Mestre do Banco de Pratos ({spreadsheet.sheets.pratos.totalRows} preparações cadastradas)</span>
            </div>
            <span className="text-[11px] font-mono opacity-90">
              Receituário Restaurante Canção Nova
            </span>
          </div>

          {editingCatalogDish && isAdmin && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-300 dark:border-emerald-800 animate-in fade-in duration-150">
              <form onSubmit={handleSaveCatalogDishEdit} className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-emerald-900 dark:text-emerald-200">Alterar Prato:</span>
                <input
                  type="text"
                  value={editingCatalogDish.name}
                  onChange={(e) => setEditingCatalogDish({ ...editingCatalogDish, name: e.target.value })}
                  className="px-2.5 py-1 text-xs border border-emerald-400 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex-1 min-w-[200px] font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Nome do prato..."
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Alteração</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCatalogDish(null)}
                  className="px-2.5 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg cursor-pointer font-medium"
                >
                  Cancelar
                </button>
              </form>
            </div>
          )}

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold border-b border-neutral-200 dark:border-neutral-700">
                  {spreadsheet.sheets.pratos.columns.map((c) => (
                    <th key={c.key} className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 last:border-r-0 whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                  {isAdmin && <th className="px-3 py-2 whitespace-nowrap text-center">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {spreadsheet.sheets.pratos.rows.slice(0, 100).map((r, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    {spreadsheet.sheets.pratos.columns.map((c) => (
                      <td key={c.key} className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 last:border-r-0 whitespace-nowrap">
                        {String(r[c.key] ?? '—')}
                      </td>
                    ))}
                    {isAdmin && (
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCatalogDish({
                              id: String(r.ID_Prato),
                              name: String(r.Nome_Prato),
                              category: String(r.Categoria),
                              allergens: String(r.Alergenos || ''),
                            });
                          }}
                          className="px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50 rounded flex items-center gap-1 mx-auto cursor-pointer"
                          title="Alterar dados deste prato"
                        >
                          <Edit2 className="w-3 h-3 text-amber-600" />
                          <span>Alterar</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 5: USUÁRIOS & PERMISSÕES                                             */}
      {/* ========================================================================= */}
      {activeTab === 'usuarios' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-neutral-900 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              <span>Controle de Usuários e Permissões Institucionais (@cancaonova.com)</span>
            </div>
            <span className="text-[11px] font-mono opacity-90">
              {spreadsheet.sheets.usuarios.totalRows} usuários ativos
            </span>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold border-b border-neutral-200 dark:border-neutral-700">
                  {spreadsheet.sheets.usuarios.columns.map((c) => (
                    <th key={c.key} className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 last:border-r-0 whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {spreadsheet.sheets.usuarios.rows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    {spreadsheet.sheets.usuarios.columns.map((c) => (
                      <td key={c.key} className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 last:border-r-0 whitespace-nowrap">
                        {String(r[c.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 6: LOG DE AUDITORIA EM TEMPO REAL                                    */}
      {/* ========================================================================= */}
      {activeTab === 'auditoria' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-sky-700 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Trilha de Auditoria & Registro de Transações em Tempo Real</span>
            </div>
            <span className="text-[11px] font-mono opacity-90">
              {spreadsheet.sheets.auditoria.totalRows} eventos auditados
            </span>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold border-b border-neutral-200 dark:border-neutral-700">
                  {spreadsheet.sheets.auditoria.columns.map((c) => (
                    <th key={c.key} className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 last:border-r-0 whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {spreadsheet.sheets.auditoria.rows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 font-mono text-[11px]">
                    {spreadsheet.sheets.auditoria.columns.map((c) => (
                      <td key={c.key} className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 last:border-r-0 whitespace-nowrap">
                        {String(r[c.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 7: BASE RELACIONAL CONSOLIDADA                                       */}
      {/* ========================================================================= */}
      {activeTab === 'relacional' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-neutral-800 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Base Relacional de Registros (Tabela Consolidada para Exportação SQL / BI)</span>
            </div>
            <span className="text-[11px] font-mono opacity-90">
              {spreadsheet.sheets.cardapios.totalRows} registros tabulados
            </span>
          </div>
          <div className="overflow-x-auto scrollbar-thin max-h-[500px]">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-neutral-100 dark:bg-neutral-800">
                <tr className="text-neutral-700 dark:text-neutral-300 font-bold border-b border-neutral-200 dark:border-neutral-700">
                  {spreadsheet.sheets.cardapios.columns.map((c) => (
                    <th key={c.key} className="px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 last:border-r-0 whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono text-[11px]">
                {spreadsheet.sheets.cardapios.rows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    {spreadsheet.sheets.cardapios.columns.map((c) => (
                      <td key={c.key} className="px-3 py-1.5 border-r border-neutral-200 dark:border-neutral-700 last:border-r-0 whitespace-nowrap">
                        {String(r[c.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Add Modal when clicking + Adicionar inside any spreadsheet cell */}
      {showAddModalForCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Adicionar Prato na Planilha
                </h3>
                <p className="text-xs text-neutral-500">
                  {showAddModalForCell.dayName} · {showAddModalForCell.categoryLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModalForCell(null)}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Nome do Prato / Preparação:
                </label>
                <input
                  type="text"
                  value={quickDishInput}
                  onChange={(e) => setQuickDishInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddDish(quickDishInput);
                  }}
                  placeholder="Ex: Frango Grelhado com Ervas"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

              {/* Suggestions from DishBank */}
              <div>
                <span className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Sugestões Rápidas do Banco:
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {dishes
                    .filter((d) => d.category === showAddModalForCell.categoryKey)
                    .slice(0, 6)
                    .map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleAddDish(d.name)}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors flex items-center justify-between"
                      >
                        <span>{d.name}</span>
                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      </button>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setShowAddModalForCell(null)}
                className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleAddDish(quickDishInput)}
                disabled={!quickDishInput.trim()}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg cursor-pointer shadow-xs"
              >
                Adicionar à Planilha
              </button>
            </div>
          </div>
        </div>
      )}

      <GoogleSheetsDatabaseModal
        isOpen={appsScriptModalOpen}
        onClose={() => setAppsScriptModalOpen(false)}
      />

    </div>
  );
};
