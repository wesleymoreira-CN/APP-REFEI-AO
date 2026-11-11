import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { MONTH_NAMES, normalizeSlotItems, getWeekDates } from '../utils/validators';
import { CATEGORY_LABELS } from '../utils/validators';
import { getDishQuantityKey, getDefaultQuantityForDish, calculateDayProductionSummary } from '../utils/productionUtils';
import { Printer, X, Scale, CheckSquare, Clock, Download } from 'lucide-react';
import { MealSlot } from '../types';
import { triggerDirectPrint, printIsolatedContent, downloadPrintableDocument } from '../utils/printHelper';

interface ProductionPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProductionPrintModal: React.FC<ProductionPrintModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentMenu, selectedYear, selectedMonth, selectedWeek, menuType } = useApp();
  const printSheetRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (printSheetRef.current) {
      printIsolatedContent(
        `Ordem_Producao_Semana_${selectedWeek}_Cancao_Nova`,
        printSheetRef.current.innerHTML,
        'portrait'
      );
    } else {
      triggerDirectPrint('portrait');
    }
  };

  const handleDownloadHtml = () => {
    if (printSheetRef.current) {
      downloadPrintableDocument(
        `Ordem_Producao_Semana_${selectedWeek}_Cancao_Nova.html`,
        `Ordem de Produção - Semana ${selectedWeek}`,
        printSheetRef.current.innerHTML,
        'portrait'
      );
    }
  };

  const dayKeys = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const;
  const { daysDates } = getWeekDates(selectedYear, selectedMonth, selectedWeek);

  const categories: { key: keyof MealSlot; label: string }[] = menuType === 'rampa'
    ? [
        { key: 'principal', label: 'Prato Principal' },
        { key: 'guarnicao', label: 'Guarnição' },
        { key: 'acompanhamento', label: 'Acompanhamentos Base' },
        { key: 'salada', label: 'Saladas do Dia' },
        { key: 'sobremesa', label: 'Sobremesas' },
      ]
    : [
        { key: 'principal', label: 'Prato Principal (Grelhado Base)' },
        { key: 'grelhadoNobre', label: 'Grelhados Nobres Especiais' },
        { key: 'massaEspecial', label: 'Massas Especiais / Molhos' },
        { key: 'guarnicao', label: 'Guarnições' },
        { key: 'acompanhamento', label: 'Acompanhamentos Base' },
        { key: 'salada', label: 'Saladas Frescas' },
        { key: 'saladaEspecial', label: 'Pista Fria / Saladas Especiais' },
        { key: 'sobremesa', label: 'Sobremesas Gourmet' },
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print-modal-overlay print:p-0 print:m-0 print:bg-white print:static print:block print:overflow-visible print:w-full print:h-auto">
      <div className="print-container printable-sheet bg-white rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden border border-neutral-300 my-auto print:border-none print:shadow-none print:max-w-none print:rounded-none print:m-0 print:p-0">
        
        {/* Modal Toolbar (hidden on print) */}
        <div className="no-print bg-neutral-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Ordem de Produção da Cozinha · {menuType === 'rampa' ? 'Cardápio Rampa' : 'Cardápio a Quilo'}
              </h2>
              <p className="text-xs text-neutral-400">
                Semana {selectedWeek} · {MONTH_NAMES[selectedMonth - 1]} de {selectedYear} · Ficha de Quantidades & Pesos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadHtml}
              title="Baixar arquivo HTML para imprimir fora do sistema"
              className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-neutral-700"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Salvar Arquivo</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ficha</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet */}
        <div ref={printSheetRef} className="p-6 sm:p-8 space-y-6 text-neutral-900 bg-white">
          {/* Header */}
          <div className="border-b-2 border-neutral-900 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-neutral-900 uppercase">
                  FUNDAÇÃO JOÃO PAULO II · CANÇÃO NOVA
                </span>
              </div>
              <p className="text-sm font-bold text-amber-800 uppercase tracking-wider mt-0.5">
                Setor de Alimentação & Nutrição · Ordem de Produção Diária / Semanal
              </p>
              <p className="text-xs text-neutral-600 mt-1">
                Modalidade: <strong>{menuType === 'rampa' ? 'Cardápio Rampa (Refeitório)' : 'Cardápio a Quilo (Restaurante)'}</strong> · Responsável Técnico / Nutricionista
              </p>
            </div>

            <div className="text-right font-mono text-xs text-neutral-700 space-y-1">
              <div>
                <strong>Semana {selectedWeek}:</strong> {currentMenu.startDate} a {currentMenu.endDate}/{String(selectedMonth).padStart(2, '0')}/{selectedYear}
              </div>
              <div>
                Emissão: <strong>{new Date().toLocaleDateString('pt-BR')}</strong> às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-[11px] text-neutral-500">
                Acesso Restrito: @cancaonova.com
              </div>
            </div>
          </div>

          {/* Days Sections */}
          <div className="space-y-6">
            {dayKeys.map((dKey, idx) => {
              const day = currentMenu.days[dKey];
              const dateObj = daysDates[idx];
              const dayProd = currentMenu.production?.[dKey];
              const summary = calculateDayProductionSummary(day, dayProd);

              return (
                <div key={dKey} className="border border-neutral-300 rounded-lg overflow-hidden break-inside-avoid">
                  {/* Day Header */}
                  <div className="bg-neutral-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm tracking-wide uppercase">
                        {day.dayName}
                      </span>
                      <span className="text-neutral-400 font-mono text-xs">
                        {dateObj?.dateStr}/{selectedYear}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span>
                        Comensais Estimados: <strong className="text-amber-400 font-bold">{summary.pax} pessoas</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Carnes: <strong>{summary.totalMeatKg} kg</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Guarnições: <strong>{summary.totalSidesKg} kg</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Sucos: <strong>{summary.totalJuiceLiters} L</strong>
                      </span>
                    </div>
                  </div>

                  {/* Day Items Table */}
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-neutral-100 border-b border-neutral-300 text-neutral-700 font-bold text-[11px] uppercase tracking-wider">
                        <th className="py-2 px-3 w-40">Categoria</th>
                        <th className="py-2 px-3">Prato / Preparação</th>
                        <th className="py-2 px-3 w-28 text-right font-mono">Qtd a Fazer</th>
                        <th className="py-2 px-3 w-24 text-right font-mono">Per Capita</th>
                        <th className="py-2 px-3 w-48">Observações da Cozinha</th>
                        <th className="py-2 px-3 w-20 text-center">Temp. (°C)</th>
                        <th className="py-2 px-3 w-16 text-center">Visto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {categories.map((cat) => {
                        const rawItems = day.lunch[cat.key];
                        const items = normalizeSlotItems(rawItems);
                        if (items.length === 0) return null;

                        return items.map((dishName, dIdx) => {
                          const qKey = getDishQuantityKey(cat.key as string, dishName);
                          const qtyData = dayProd?.quantities?.[qKey] || getDefaultQuantityForDish(cat.key as string, dishName, summary.pax, items.length);

                          return (
                            <tr key={`${cat.key}_${dIdx}`} className="hover:bg-neutral-50/80">
                              <td className="py-2 px-3 font-semibold text-neutral-700 align-top">
                                {dIdx === 0 ? cat.label : ''}
                              </td>
                              <td className="py-2 px-3 font-bold text-neutral-900 align-top">
                                {dishName}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-extrabold text-neutral-900 align-top whitespace-nowrap">
                                <span className="bg-amber-100/70 border border-amber-300/80 px-2 py-0.5 rounded text-amber-950">
                                  {qtyData.amount} {qtyData.unit}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-neutral-600 align-top whitespace-nowrap">
                                {qtyData.perCapitaGrams ? `${qtyData.perCapitaGrams}g` : '—'}
                              </td>
                              <td className="py-2 px-3 text-[11px] text-neutral-600 align-top italic">
                                {qtyData.notes || '—'}
                              </td>
                              <td className="py-2 px-3 text-center align-top">
                                <div className="w-12 h-5 border border-dashed border-neutral-400 rounded mx-auto"></div>
                              </td>
                              <td className="py-2 px-3 text-center align-top">
                                <div className="w-5 h-5 border border-neutral-400 rounded mx-auto"></div>
                              </td>
                            </tr>
                          );
                        });
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>

          {/* Footer Sign-off */}
          <div className="pt-8 border-t border-neutral-300 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs text-neutral-700">
            <div className="space-y-6">
              <p className="font-semibold">
                Normas de Controle Higiênico-Sanitário e APPCC:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-neutral-600">
                <li>Preparações quentes: manter na rampa acima de 60ºC por no máximo 6 horas.</li>
                <li>Preparações frias / saladas / sobremesas: manter na pista refrigerada abaixo de 10ºC.</li>
                <li>Aferir e registrar a temperatura de todas as cubas antes do início da distribuição.</li>
              </ul>
            </div>

            <div className="flex flex-col justify-end space-y-8 text-center">
              <div className="border-b border-neutral-400 w-3/4 mx-auto"></div>
              <p className="text-[11px] font-semibold text-neutral-800 -mt-6">
                Assinatura do Responsável Técnico / Nutricionista (CRN)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
