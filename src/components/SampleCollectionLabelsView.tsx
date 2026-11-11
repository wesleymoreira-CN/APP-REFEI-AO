import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { MealSlot, MenuType, SampleCollectionItem } from '../types';
import { CATEGORY_LABELS, normalizeSlotItems, MONTH_NAMES } from '../utils/validators';
import { 
  triggerDirectPrint, 
  printIsolatedContent, 
  openPrintableWindow, 
  downloadPrintableDocument 
} from '../utils/printHelper';
import { 
  exportElementToPdf, 
  printElementViaPdf 
} from '../utils/pdfHelper';
import { 
  Printer, 
  Tag, 
  Calendar, 
  Clock, 
  Thermometer, 
  UserCheck, 
  CheckSquare, 
  Square, 
  Sparkles, 
  FileText, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Info,
  Layers,
  ArrowLeft,
  ChevronRight,
  Flame,
  Snowflake,
  Download,
  ExternalLink,
  X,
  CheckCircle,
  Copy,
  FileDown,
  Loader2
} from 'lucide-react';

interface SampleCollectionLabelsViewProps {
  onBackToMenu?: () => void;
  initialDayKey?: string;
}

export const SampleCollectionLabelsView: React.FC<SampleCollectionLabelsViewProps> = ({
  onBackToMenu,
  initialDayKey,
}) => {
  const {
    currentMenu,
    selectedWeek,
    selectedMonth,
    selectedYear,
    menuType,
    setMenuType,
    currentUser,
  } = useApp();

  const dayKeys = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const;
  const [selectedDayKey, setSelectedDayKey] = useState<string>(initialDayKey || 'seg');
  const [mealType, setMealType] = useState<'almoco' | 'jantar'>('almoco');
  const [collectorName, setCollectorName] = useState<string>(
    currentUser?.name || 'Wesley Moreira - Nutricionista'
  );
  const [collectionTime, setCollectionTime] = useState<string>('11:30');
  const [storageType, setStorageType] = useState<'refrigerado' | 'congelado'>('refrigerado');
  const [labelFormat, setLabelFormat] = useState<'stickers' | 'sheet' | 'log'>('stickers');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [printTipNotice, setPrintTipNotice] = useState<string | null>(null);

  const modalSheetRef = useRef<HTMLDivElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);


  // Selected dishes for sample collection
  const [selectedItemsMap, setSelectedItemsMap] = useState<Record<string, boolean>>({});
  // Customized temperatures per item: itemId -> temperature string
  const [itemTemps, setItemTemps] = useState<Record<string, string>>({});
  // Extra custom samples added manually by the user
  const [customSamples, setCustomSamples] = useState<{ id: string; name: string; category: string; temp: string }[]>([]);
  const [newExtraName, setNewExtraName] = useState('');
  const [newExtraCategory, setNewExtraCategory] = useState('Acompanhamento / Extra');
  const [newExtraTemp, setNewExtraTemp] = useState('65°C');

  const selectedDay = currentMenu.days[selectedDayKey as keyof typeof currentMenu.days];

  // Derive initial list of all dishes for the day
  const dailyDishes = useMemo(() => {
    if (!selectedDay) return [];
    const list: {
      id: string;
      dishName: string;
      categoryKey: string;
      categoryLabel: string;
      isHot: boolean;
      defaultTemp: string;
    }[] = [];

    const lunch = selectedDay.lunch;
    const catKeys = Object.keys(lunch) as (keyof MealSlot)[];

    catKeys.forEach((ck) => {
      if (ck === 'observacao') return;
      const items = normalizeSlotItems(lunch[ck]);
      const isHot =
        ck === 'principal' ||
        ck === 'alternativa' ||
        ck === 'vegetariano' ||
        ck === 'guarnicao' ||
        ck === 'acompanhamento' ||
        ck === 'grelhadoNobre' ||
        ck === 'massaEspecial';

      const defaultTemp = isHot ? '68°C' : ck === 'sobremesa' ? '6°C' : '8°C';
      const catLabel = (CATEGORY_LABELS as any)[ck] || String(ck);

      items.forEach((item, idx) => {
        const id = `${selectedDayKey}-${ck}-${idx}-${item.replace(/\s+/g, '_')}`;
        list.push({
          id,
          dishName: item,
          categoryKey: ck,
          categoryLabel: catLabel,
          isHot,
          defaultTemp,
        });
      });
    });

    return list;
  }, [selectedDay, selectedDayKey]);

  // Combined sample items (daily dishes + custom extras)
  const allSampleItems = useMemo(() => {
    const combined = dailyDishes.map((d, index) => {
      const isSelected = selectedItemsMap[d.id] !== false; // default true
      const temp = itemTemps[d.id] || d.defaultTemp;
      const lotCode = `CN-${selectedDayKey.toUpperCase()}-${String(index + 1).padStart(2, '0')}`;

      return {
        id: d.id,
        dishName: d.dishName,
        category: d.categoryKey,
        categoryLabel: d.categoryLabel,
        isHot: d.isHot,
        temperature: temp,
        lotCode,
        isSelected,
      };
    });

    customSamples.forEach((cs, idx) => {
      const isSelected = selectedItemsMap[cs.id] !== false;
      const lotCode = `CN-${selectedDayKey.toUpperCase()}-EXT-${idx + 1}`;
      combined.push({
        id: cs.id,
        dishName: cs.name,
        category: cs.category,
        categoryLabel: cs.category,
        isHot: cs.temp.includes('6') || cs.temp.includes('7'),
        temperature: itemTemps[cs.id] || cs.temp,
        lotCode,
        isSelected,
      });
    });

    return combined;
  }, [dailyDishes, customSamples, selectedItemsMap, itemTemps, selectedDayKey]);

  const activeSampleItemsToPrint = allSampleItems.filter((it) => it.isSelected);

  const toggleItemSelection = (id: string) => {
    setSelectedItemsMap((prev) => ({
      ...prev,
      [id]: prev[id] === false ? true : false,
    }));
  };

  const selectAll = () => {
    const updated: Record<string, boolean> = {};
    allSampleItems.forEach((it) => {
      updated[it.id] = true;
    });
    setSelectedItemsMap(updated);
  };

  const deselectAll = () => {
    const updated: Record<string, boolean> = {};
    allSampleItems.forEach((it) => {
      updated[it.id] = false;
    });
    setSelectedItemsMap(updated);
  };

  const handleTempChange = (id: string, value: string) => {
    setItemTemps((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleAddCustomSample = () => {
    if (!newExtraName.trim()) return;
    const newId = `custom-${Date.now()}`;
    setCustomSamples((prev) => [
      ...prev,
      {
        id: newId,
        name: newExtraName.trim(),
        category: newExtraCategory,
        temp: newExtraTemp,
      },
    ]);
    setNewExtraName('');
  };

  const handleRemoveCustomSample = (id: string) => {
    setCustomSamples((prev) => prev.filter((s) => s.id !== id));
  };

  const handleDirectPrint = async () => {
    setIsPrintModalOpen(true);
    document.body.classList.remove('print-landscape', 'print-portrait');
    document.body.classList.add(`print-${labelFormat === 'log' ? 'landscape' : 'portrait'}`);
    window.focus();

    // 1. Direct browser print trigger
    setTimeout(async () => {
      try {
        window.print();
      } catch (err) {
        console.warn('Native window.print() was blocked or failed in iframe:', err);
      }

      // 2. High-reliability fallback autoPrint via PDF driver in hidden frame
      const target = modalSheetRef.current || printAreaRef.current;
      if (target) {
        try {
          await printElementViaPdf(target, labelFormat === 'log' ? 'landscape' : 'portrait');
        } catch (e) {
          console.warn('PDF auto-print fallback error:', e);
        }
      }
    }, 150);
  };

  const handleDownloadPdf = async () => {
    const target = modalSheetRef.current || printAreaRef.current;
    if (!target) return;
    setIsGeneratingPdf(true);
    try {
      const dayName = (selectedDay?.dayName || selectedDayKey).split('-')[0].trim();
      const filename = `Etiquetas_Amostras_${dayName}_${selectedDay?.dateStr || ''}_Cancao_Nova.pdf`;
      await exportElementToPdf(target, filename, labelFormat === 'log' ? 'landscape' : 'portrait');
    } catch (err) {
      console.error('Falha ao exportar PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleOpenNewTab = () => {
    const target = modalSheetRef.current || printAreaRef.current;
    if (target) {
      openPrintableWindow(
        `Etiquetas de Amostras - ${selectedDay?.dayName || ''} (${selectedDay?.dateStr || ''})`,
        target.innerHTML,
        labelFormat === 'log' ? 'landscape' : 'portrait'
      );
    }
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Printable Area - Only Visible on Print */}
      <div ref={printAreaRef} className="print-only">

        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body {
              background: #fff !important;
              color: #000 !important;
              font-family: Arial, sans-serif !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .no-print, header, nav, footer, .navbar-container {
              display: none !important;
            }
            .print-only {
              display: block !important;
              padding: 10mm !important;
            }
            .page-break {
              page-break-after: always;
            }
            .sticker-card {
              border: 1.5px solid #000 !important;
              page-break-inside: avoid;
            }
          }
        `}} />

        {labelFormat === 'log' ? (
          /* Termo de Registro e Controle Sanitário RDC 216 */
          <div className="space-y-6">
            <div className="border-b-2 border-black pb-3 text-center">
              <h1 className="text-xl font-bold uppercase tracking-wider">
                Restaurante Canção Nova — Controle de Qualidade
              </h1>
              <h2 className="text-sm font-semibold uppercase mt-1">
                Planilha de Coleta e Guarda de Amostras de Alimentos (RDC 216 / ANVISA)
              </h2>
              <div className="text-xs mt-2 flex justify-between">
                <span><strong>Data da Coleta:</strong> {selectedDay?.dateStr}/{selectedYear} ({selectedDay?.dayName})</span>
                <span><strong>Refeição:</strong> {mealType === 'almoco' ? 'Almoço' : 'Jantar'} ({menuType === 'rampa' ? 'Rampa' : 'Kilo'})</span>
                <span><strong>Responsável RT:</strong> {collectorName}</span>
              </div>
            </div>

            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-neutral-100 border-b border-black text-left">
                  <th className="border border-black p-2">Lote</th>
                  <th className="border border-black p-2">Alimento / Preparação</th>
                  <th className="border border-black p-2">Categoria</th>
                  <th className="border border-black p-2 text-center">Hora Coleta</th>
                  <th className="border border-black p-2 text-center">Temp. (°C)</th>
                  <th className="border border-black p-2 text-center">Armazenamento</th>
                  <th className="border border-black p-2 text-center">Validade (72h)</th>
                  <th className="border border-black p-2">Visto / Assinatura</th>
                </tr>
              </thead>
              <tbody>
                {activeSampleItemsToPrint.map((item) => (
                  <tr key={item.id} className="border-b border-black">
                    <td className="border border-black p-2 font-mono font-bold text-[11px]">{item.lotCode}</td>
                    <td className="border border-black p-2 font-semibold">{item.dishName}</td>
                    <td className="border border-black p-2 text-[11px]">{item.categoryLabel}</td>
                    <td className="border border-black p-2 text-center">{collectionTime}</td>
                    <td className="border border-black p-2 text-center font-bold">{item.temperature}</td>
                    <td className="border border-black p-2 text-center">{storageType === 'refrigerado' ? '< 4°C' : '< -18°C'}</td>
                    <td className="border border-black p-2 text-center font-mono">72 horas</td>
                    <td className="border border-black p-2 text-center italic text-neutral-500">_________________</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-8 pt-4 border-t border-black text-xs flex justify-between items-end">
              <div>
                <p><strong>Observações Sanitárias:</strong></p>
                <p className="text-[11px] text-neutral-600">
                  As amostras foram colhidas assepticamente com utensílios esterilizados no meio do período de distribuição,
                  acondicionadas em sacos plásticos de primeiro uso descartáveis e identificadas, devendo ser mantidas sob refrigeração
                  por 72 horas para contraprova laboratorial.
                </p>
              </div>
              <div className="text-center shrink-0 ml-8">
                <div className="w-56 border-b border-black pb-1 mb-1 font-semibold">{collectorName}</div>
                <div className="text-[10px] text-neutral-600">Nutricionista / Responsável Técnico (CRN)</div>
              </div>
            </div>
          </div>
        ) : (
          /* Grid de Etiquetas Adesivas Térmicas / A4 */
          <div className="grid grid-cols-2 gap-4">
            {activeSampleItemsToPrint.map((item) => (
              <div
                key={item.id}
                className="sticker-card p-3 rounded-lg border-2 border-black bg-white flex flex-col justify-between text-black text-[11px] leading-tight"
                style={{ height: '58mm', boxSizing: 'border-box' }}
              >
                {/* Header */}
                <div className="border-b border-black pb-1.5 flex items-center justify-between">
                  <div>
                    <span className="font-extrabold uppercase text-[10px] tracking-wider block">
                      CANÇÃO NOVA · CONTROLE QUALIDADE
                    </span>
                    <span className="text-[9px] font-bold text-neutral-700 block">
                      AMOSTRA TESTEMUNHA — RDC 216 ANVISA
                    </span>
                  </div>
                  <span className="font-mono font-black text-xs px-1.5 py-0.5 border border-black rounded">
                    {item.lotCode}
                  </span>
                </div>

                {/* Dish Name */}
                <div className="py-1.5">
                  <span className="text-[9px] font-bold uppercase text-neutral-600 block">
                    Alimento:
                  </span>
                  <div className="text-sm font-black uppercase tracking-tight line-clamp-2">
                    {item.dishName}
                  </div>
                  <span className="text-[10px] font-semibold text-neutral-700">
                    {item.categoryLabel} · {menuType === 'rampa' ? 'Rampa' : 'Kilo'}
                  </span>
                </div>

                {/* Technical Details Grid */}
                <div className="grid grid-cols-2 gap-1.5 border-t border-black pt-1.5 text-[10px]">
                  <div>
                    <span className="font-bold">Data Coleta:</span> {selectedDay?.dateStr}/{selectedYear}
                  </div>
                  <div>
                    <span className="font-bold">Hora:</span> {collectionTime} ({mealType === 'almoco' ? 'Almoço' : 'Jantar'})
                  </div>
                  <div>
                    <span className="font-bold">Temp. Aferida:</span> <strong>{item.temperature}</strong>
                  </div>
                  <div>
                    <span className="font-bold">Validade:</span> <strong>72 HORAS</strong> ({storageType === 'refrigerado' ? '<4°C' : '<-18°C'})
                  </div>
                </div>

                {/* Footer Signature */}
                <div className="border-t border-dashed border-black pt-1 flex justify-between items-center text-[9px]">
                  <span className="truncate"><strong>Resp:</strong> {collectorName}</span>
                  <span className="italic shrink-0 ml-2">Visto: __________</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Screen Interface Controls (Hidden on Print) */}
      <div className="no-print space-y-6">
        
        {/* Top Header Card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs transition-colors">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                    Etiquetas de Coleta de Amostras
                  </h1>
                  <span className="text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-300/50">
                    Segurança Alimentar RDC 216
                  </span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed max-w-2xl">
                  Gere e imprima etiquetas adesivas térmicas ou fichas de controle sanitário para as amostras testemunhas 
                  dos pratos preparados no dia. Guarda obrigatória de 72 horas para contraprova microbiológica.
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
                onClick={handleOpenNewTab}
                title="Abrir etiquetas em nova aba sem restrições de iframe com diálogo de impressão"
                className="px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-neutral-300 dark:border-neutral-700"
              >
                <ExternalLink className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">Abrir em Nova Aba</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                title="Baixar arquivo oficial em formato PDF para impressão ou arquivamento"
                className="px-3 py-2 text-xs font-semibold text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-rose-300 dark:border-rose-800 shadow-2xs disabled:opacity-60"
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
                onClick={handleDirectPrint}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer hover:shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Mandar para Impressora ({activeSampleItemsToPrint.length})</span>
              </button>
            </div>

          </div>
        </div>

        {/* Day Selector Ribbon */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Selecione o Dia da Coleta:</span>
            </span>
            <span className="text-xs font-mono text-neutral-400 dark:text-neutral-500">
              Semana {selectedWeek} · {MONTH_NAMES[selectedMonth - 1]} de {selectedYear}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {dayKeys.map((dKey) => {
              const dayObj = currentMenu.days[dKey];
              const isSelected = selectedDayKey === dKey;
              return (
                <button
                  key={dKey}
                  type="button"
                  onClick={() => setSelectedDayKey(dKey)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600 border-amber-600 text-white shadow-xs font-bold'
                      : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div className="text-xs font-bold">{dayObj?.dayName.split('-')[0]}</div>
                  <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-amber-100' : 'text-neutral-500 dark:text-neutral-400'}`}>
                    {dayObj?.dateStr}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Parameters Configuration Toolbar */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs">
            
            {/* Modalidade */}
            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                Modalidade do Cardápio:
              </label>
              <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setMenuType('rampa')}
                  className={`flex-1 py-1.5 px-2 rounded-md font-bold text-xs transition-colors cursor-pointer ${
                    menuType === 'rampa'
                      ? 'bg-white dark:bg-neutral-900 text-amber-700 dark:text-amber-400 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  🍲 Rampa
                </button>
                <button
                  type="button"
                  onClick={() => setMenuType('kilo')}
                  className={`flex-1 py-1.5 px-2 rounded-md font-bold text-xs transition-colors cursor-pointer ${
                    menuType === 'kilo'
                      ? 'bg-white dark:bg-neutral-900 text-amber-700 dark:text-amber-400 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  ⚖️ Kilo
                </button>
              </div>
            </div>

            {/* Refeição */}
            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                Refeição:
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="almoco">Almoço (Distribuição Principal)</option>
                <option value="jantar">Jantar / Ceia</option>
              </select>
            </div>

            {/* Horário da Coleta */}
            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                Horário da Coleta:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={collectionTime}
                  onChange={(e) => setCollectionTime(e.target.value)}
                  placeholder="11:30"
                  className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-xs"
                />
                <Clock className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Responsável */}
            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                Responsável Técnico:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={collectorName}
                  onChange={(e) => setCollectorName(e.target.value)}
                  placeholder="Nome do profissional"
                  className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                />
                <UserCheck className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Formato de Impressão */}
            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                Modo de Visualização:
              </label>
              <select
                value={labelFormat}
                onChange={(e) => setLabelFormat(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
              >
                <option value="stickers">🏷️ Etiquetas Térmicas (Stickers)</option>
                <option value="log">📋 Planilha Oficial RDC 216</option>
              </select>
            </div>

          </div>
        </div>

        {/* Dishes Selection & Temperature Setting Table */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden">
          
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Amostras do Dia: {selectedDay?.dayName} ({selectedDay?.dateStr})
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {activeSampleItemsToPrint.length} de {allSampleItems.length} pratos selecionados para impressão de etiquetas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="px-2.5 py-1 text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 rounded-lg transition-colors cursor-pointer"
              >
                Marcar Todos
              </button>
              <button
                type="button"
                onClick={deselectAll}
                className="px-2.5 py-1 text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 rounded-lg transition-colors cursor-pointer"
              >
                Desmarcar
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 uppercase tracking-wider text-[11px] border-b border-neutral-200 dark:border-neutral-700">
                  <th className="py-2.5 px-3 w-10 text-center">Sel.</th>
                  <th className="py-2.5 px-3 w-28">Código / Lote</th>
                  <th className="py-2.5 px-3 font-semibold">Alimento / Preparação</th>
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3 w-40">Temperatura Aferida</th>
                  <th className="py-2.5 px-3 w-32">Status Térmico</th>
                  <th className="py-2.5 px-3 w-20 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {allSampleItems.length > 0 ? (
                  allSampleItems.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors ${
                        item.isSelected ? '' : 'opacity-50'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleItemSelection(item.id)}
                          className="cursor-pointer text-neutral-600 dark:text-neutral-300 hover:text-amber-600"
                        >
                          {item.isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-600" />
                          ) : (
                            <Square className="w-4 h-4 text-neutral-400" />
                          )}
                        </button>
                      </td>

                      <td className="py-2.5 px-3 font-mono font-bold text-neutral-700 dark:text-neutral-300 text-[11px]">
                        {item.lotCode}
                      </td>

                      <td className="py-2.5 px-3 font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                        {item.dishName}
                      </td>

                      <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-400 font-medium">
                        {item.categoryLabel}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <Thermometer className="w-3.5 h-3.5 text-neutral-400" />
                          <input
                            type="text"
                            value={item.temperature}
                            onChange={(e) => handleTempChange(item.id, e.target.value)}
                            className="w-20 px-2 py-1 text-xs font-bold font-mono bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        {item.isHot ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded">
                            <Flame className="w-3 h-3 text-rose-500" />
                            <span>Quente (&ge;60°C)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded">
                            <Snowflake className="w-3 h-3 text-sky-500" />
                            <span>Frio (&le;10°C)</span>
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        {item.id.startsWith('custom-') ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomSample(item.id)}
                            className="p-1 text-neutral-400 hover:text-rose-600 rounded cursor-pointer"
                            title="Remover amostra extra"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-neutral-400">Cardápio</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-neutral-400 italic">
                      Nenhum prato cadastrado neste dia. Adicione pratos no Cardápio Semanal ou inclua uma amostra avulsa abaixo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Add Extra Custom Sample Row */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300 shrink-0">
              + Amostra Extra / Avulsa:
            </span>
            <input
              type="text"
              value={newExtraName}
              onChange={(e) => setNewExtraName(e.target.value)}
              placeholder="Ex: Molho de Alho, Vinagrete, Farofa Especial..."
              className="flex-1 min-w-[200px] px-3 py-1.5 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs"
            />
            <input
              type="text"
              value={newExtraCategory}
              onChange={(e) => setNewExtraCategory(e.target.value)}
              placeholder="Categoria"
              className="w-36 px-2 py-1.5 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs"
            />
            <input
              type="text"
              value={newExtraTemp}
              onChange={(e) => setNewExtraTemp(e.target.value)}
              placeholder="Temp (ex: 65°C)"
              className="w-24 px-2 py-1.5 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs font-mono font-bold"
            />
            <button
              type="button"
              onClick={handleAddCustomSample}
              className="px-3 py-1.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-bold rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Incluir</span>
            </button>
          </div>
        </div>

        {/* Live Sticker Preview Gallery */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-amber-600" />
                <span>Prévia das Etiquetas Adesivas ({activeSampleItemsToPrint.length})</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Modelo compatível com impressoras térmicas e folhas adesivas padrão A4 (Pimaco / Colacril).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenNewTab}
                title="Abrir etiquetas em nova aba com diálogo de impressão automático (recomendado se a impressora não abrir)"
                className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-neutral-300 dark:border-neutral-700"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Abrir em Nova Aba</span>
              </button>

              <button
                type="button"
                onClick={handleOpenNewTab}
                title="Abrir etiquetas em nova aba com diálogo de impressão automático (recomendado se a impressora não abrir)"
                className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-neutral-300 dark:border-neutral-700"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Abrir em Nova Aba</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                title="Baixar etiquetas em formato oficial PDF para impressão ou arquivamento"
                className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-rose-300 dark:border-rose-800 shadow-2xs disabled:opacity-60"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                ) : (
                  <FileDown className="w-3.5 h-3.5 text-rose-600" />
                )}
                <span>{isGeneratingPdf ? 'Gerando PDF...' : 'Baixar em PDF'}</span>
              </button>

              <button
                type="button"
                onClick={handleDirectPrint}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Mandar para Impressora</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeSampleItemsToPrint.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-700 rounded-xl p-3 shadow-xs space-y-2 text-xs transition-all hover:border-amber-500"
              >
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 pb-1.5">
                  <div>
                    <span className="font-extrabold text-[10px] tracking-wider text-amber-800 dark:text-amber-400 uppercase block">
                      CANÇÃO NOVA · QUALIDADE
                    </span>
                    <span className="text-[9px] text-neutral-500 dark:text-neutral-400 block font-bold">
                      AMOSTRA TESTEMUNHA (RDC 216)
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-600">
                    {item.lotCode}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-400 font-semibold uppercase block">
                    Alimento:
                  </span>
                  <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                    {item.dishName}
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {item.categoryLabel} · {menuType === 'rampa' ? 'Rampa' : 'Kilo'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1 text-[10px] bg-neutral-50 dark:bg-neutral-900/60 p-2 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div>
                    <span className="font-semibold text-neutral-500">Data:</span> {selectedDay?.dateStr}/{selectedYear}
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-500">Hora:</span> {collectionTime}
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-500">Temp:</span> <strong className="text-amber-700 dark:text-amber-400">{item.temperature}</strong>
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-500">Guarda:</span> <strong>72 horas</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-dashed border-neutral-200 dark:border-neutral-700 text-[10px] text-neutral-500">
                  <span className="truncate">Resp: <strong>{collectorName.split(' ')[0]}</strong></span>
                  <span className="font-mono text-[9px] text-neutral-400">RDC 216/04</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Full-Screen Print Modal (Guarantees Perfect Visibility and Printing Across All Devices) */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs overflow-y-auto p-4 sm:p-6 flex flex-col items-center print-modal-overlay print:static print:p-0 print:m-0 print:bg-white print:block print:w-full">
          {/* Floating Control Bar (Hidden on print) */}
          <div className="no-print w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 p-4 mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <span>Central de Impressão de Etiquetas ({activeSampleItemsToPrint.length})</span>
                  <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded">
                    RDC 216
                  </span>
                </h2>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {selectedDay?.dayName} ({selectedDay?.dateStr}/{selectedYear}) · {collectorName}
                </p>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setLabelFormat('stickers')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  labelFormat === 'stickers'
                    ? 'bg-white dark:bg-neutral-900 text-amber-700 dark:text-amber-400 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                🏷️ Etiquetas Adesivas
              </button>
              <button
                type="button"
                onClick={() => setLabelFormat('log')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  labelFormat === 'log'
                    ? 'bg-white dark:bg-neutral-900 text-amber-700 dark:text-amber-400 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                📋 Planilha RDC 216
              </button>
            </div>

            {/* Print Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDirectPrint}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer hover:shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Mandar para Impressora</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                title="Baixar etiquetas em formato oficial PDF para impressão ou arquivamento"
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
                onClick={handleOpenNewTab}
                title="Abre as etiquetas em nova aba isolada com chamada automática de impressão"
                className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-neutral-300 dark:border-neutral-700"
              >
                <ExternalLink className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">Abrir em Nova Aba</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* User Tip Banner (Hidden on print) */}
          <div className="no-print w-full max-w-4xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-3 rounded-xl mb-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <strong>Impressão Direta:</strong> Clique em <strong>Mandar para Impressora</strong> para acionar sua impressora térmica (Zebra, Elgin, Bematech) ou impressora comum imediatamente. Você também pode clicar em <strong>Baixar em PDF</strong> para salvar o documento pronto.
            </div>
          </div>

          {/* High-Contrast Printable Sheet Preview */}
          <div 
            ref={modalSheetRef}
            className="print-container printable-sheet w-full max-w-4xl bg-white text-black p-8 rounded-2xl shadow-2xl border border-neutral-300 print:p-0 print:border-none print:shadow-none print:max-w-none print:m-0"
          >

            {labelFormat === 'log' ? (
              <div className="space-y-6">
                <div className="border-b-2 border-black pb-3 text-center">
                  <h1 className="text-xl font-bold uppercase tracking-wider">
                    Restaurante Canção Nova — Controle de Qualidade
                  </h1>
                  <h2 className="text-sm font-semibold uppercase mt-1">
                    Planilha de Coleta e Guarda de Amostras de Alimentos (RDC 216 / ANVISA)
                  </h2>
                  <div className="text-xs mt-2 flex justify-between">
                    <span><strong>Data da Coleta:</strong> {selectedDay?.dateStr}/{selectedYear} ({selectedDay?.dayName})</span>
                    <span><strong>Refeição:</strong> {mealType === 'almoco' ? 'Almoço' : 'Jantar'} ({menuType === 'rampa' ? 'Rampa' : 'Kilo'})</span>
                    <span><strong>Responsável RT:</strong> {collectorName}</span>
                  </div>
                </div>

                <table className="w-full border-collapse border border-black text-xs">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-black text-left">
                      <th className="border border-black p-2">Lote</th>
                      <th className="border border-black p-2">Alimento / Preparação</th>
                      <th className="border border-black p-2">Categoria</th>
                      <th className="border border-black p-2 text-center">Hora Coleta</th>
                      <th className="border border-black p-2 text-center">Temp. (°C)</th>
                      <th className="border border-black p-2 text-center">Armazenamento</th>
                      <th className="border border-black p-2 text-center">Validade (72h)</th>
                      <th className="border border-black p-2">Visto / Assinatura</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSampleItemsToPrint.map((item) => (
                      <tr key={item.id} className="border-b border-black">
                        <td className="border border-black p-2 font-mono font-bold text-[11px]">{item.lotCode}</td>
                        <td className="border border-black p-2 font-semibold">{item.dishName}</td>
                        <td className="border border-black p-2 text-[11px]">{item.categoryLabel}</td>
                        <td className="border border-black p-2 text-center">{collectionTime}</td>
                        <td className="border border-black p-2 text-center font-bold">{item.temperature}</td>
                        <td className="border border-black p-2 text-center">{storageType === 'refrigerado' ? '< 4°C' : '< -18°C'}</td>
                        <td className="border border-black p-2 text-center font-mono">72 horas</td>
                        <td className="border border-black p-2 text-center italic text-neutral-500">_________________</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-8 pt-4 border-t border-black text-xs flex justify-between items-end">
                  <div>
                    <p><strong>Observações Sanitárias:</strong></p>
                    <p className="text-[11px] text-neutral-600">
                      As amostras foram colhidas assepticamente com utensílios esterilizados no meio do período de distribuição,
                      acondicionadas em sacos plásticos de primeiro uso descartáveis e identificadas, devendo ser mantidas sob refrigeração
                      por 72 horas para contraprova laboratorial.
                    </p>
                  </div>
                  <div className="text-center shrink-0 ml-8">
                    <div className="w-56 border-b border-black pb-1 mb-1 font-semibold">{collectorName}</div>
                    <div className="text-[10px] text-neutral-600">Nutricionista / Responsável Técnico (CRN)</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {activeSampleItemsToPrint.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border-2 border-black bg-white flex flex-col justify-between text-black text-[11px] leading-tight"
                    style={{ minHeight: '56mm', boxSizing: 'border-box' }}
                  >
                    {/* Header */}
                    <div className="border-b border-black pb-1.5 flex items-center justify-between">
                      <div>
                        <span className="font-extrabold uppercase text-[10px] tracking-wider block">
                          CANÇÃO NOVA · CONTROLE QUALIDADE
                        </span>
                        <span className="text-[9px] font-bold text-neutral-700 block">
                          AMOSTRA TESTEMUNHA — RDC 216 ANVISA
                        </span>
                      </div>
                      <span className="font-mono font-black text-xs px-1.5 py-0.5 border border-black rounded">
                        {item.lotCode}
                      </span>
                    </div>

                    {/* Dish Name */}
                    <div className="py-2">
                      <span className="text-[9px] font-bold uppercase text-neutral-600 block">
                        Alimento:
                      </span>
                      <div className="text-sm font-black uppercase tracking-tight">
                        {item.dishName}
                      </div>
                      <span className="text-[10px] font-semibold text-neutral-700">
                        {item.categoryLabel} · {menuType === 'rampa' ? 'Rampa' : 'Kilo'}
                      </span>
                    </div>

                    {/* Technical Details Grid */}
                    <div className="grid grid-cols-2 gap-1.5 border-t border-black pt-1.5 text-[10px]">
                      <div>
                        <span className="font-bold">Data Coleta:</span> {selectedDay?.dateStr}/{selectedYear}
                      </div>
                      <div>
                        <span className="font-bold">Hora:</span> {collectionTime} ({mealType === 'almoco' ? 'Almoço' : 'Jantar'})
                      </div>
                      <div>
                        <span className="font-bold">Temp. Aferida:</span> <strong>{item.temperature}</strong>
                      </div>
                      <div>
                        <span className="font-bold">Validade:</span> <strong>72 HORAS</strong> ({storageType === 'refrigerado' ? '<4°C' : '<-18°C'})
                      </div>
                    </div>

                    {/* Footer Signature */}
                    <div className="border-t border-dashed border-black pt-1 flex justify-between items-center text-[9px]">
                      <span className="truncate"><strong>Resp:</strong> {collectorName}</span>
                      <span className="italic shrink-0 ml-2">Visto: __________</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
