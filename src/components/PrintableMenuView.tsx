import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MONTH_NAMES, normalizeSlotItems } from '../utils/validators';
import { Printer, X, ArrowLeft, Utensils, CheckCircle, FileDown, Loader2 } from 'lucide-react';
import { triggerDirectPrint, printIsolatedContent, openPrintableWindow } from '../utils/printHelper';
import { exportElementToPdf, printElementViaPdf } from '../utils/pdfHelper';

interface PrintableMenuViewProps {
  onClose: () => void;
}

export const PrintableMenuView: React.FC<PrintableMenuViewProps> = ({ onClose }) => {
  const { currentMenu, selectedYear, selectedMonth, selectedWeek, currentUser, menuType } = useApp();
  const printSheetRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const dayKeys = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const;

  const rows =
    menuType === 'kilo'
      ? [
          { key: 'principal', label: 'Prato Principal / Grelhado' },
          { key: 'grelhadoNobre', label: 'Grelhado Nobre Especial' },
          { key: 'massaEspecial', label: 'Massa Artesanal / Especial' },
          { key: 'guarnicao', label: 'Guarnição da Pista Quente' },
          { key: 'acompanhamento', label: 'Acompanhamentos Base' },
          { key: 'salada', label: 'Salada da Pista Fria' },
          { key: 'saladaEspecial', label: 'Salada Especial / Carpaccio' },
          { key: 'sobremesa', label: 'Sobremesa & Balcão' },
        ]
      : [
          { key: 'principal', label: 'Prato Principal (Carne)' },
          { key: 'guarnicao', label: 'Guarnição' },
          { key: 'acompanhamento', label: 'Acompanhamentos Base' },
          { key: 'salada', label: 'Salada do Dia' },
          { key: 'sobremesa', label: 'Sobremesa' },
        ];

  const handlePrint = async () => {
    document.body.classList.remove('print-landscape', 'print-portrait');
    document.body.classList.add('print-landscape');
    window.focus();

    setTimeout(async () => {
      try {
        window.print();
      } catch (e) {
        console.warn('Direct window.print failed:', e);
      }
      if (printSheetRef.current) {
        try {
          await printElementViaPdf(printSheetRef.current, 'landscape');
        } catch (err) {
          console.warn('PDF fallback print failed:', err);
        }
      }
    }, 150);
  };

  const handleDownloadPdf = async () => {
    if (!printSheetRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const filename = `Cardapio_Semanal_Semana_${selectedWeek}_${MONTH_NAMES[selectedMonth - 1]}_Cancao_Nova.pdf`;
      await exportElementToPdf(printSheetRef.current, filename, 'landscape');
    } catch (err) {
      console.error('Falha ao gerar PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/80 backdrop-blur-xs overflow-y-auto p-4 sm:p-6 flex flex-col items-center print-modal-overlay print:static print:p-0 print:m-0 print:bg-white print:block print:overflow-visible print:w-full print:h-auto">
      {/* Floating Control Bar (Hidden on print) */}
      <div className="no-print w-full max-w-5xl bg-white rounded-xl shadow-lg border border-neutral-200 p-3 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Editor</span>
          </button>
          <span className="text-xs text-neutral-500 hidden sm:inline">
            Modo de Impressão e Mural A4 Paisagem
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            title="Baixar cardápio em formato oficial PDF para impressão ou envio por e-mail"
            className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-rose-300 shadow-2xs disabled:opacity-60"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-rose-600" />
            )}
            <span>{isGeneratingPdf ? 'Gerando PDF...' : 'Baixar em PDF'}</span>
          </button>


          <button
            onClick={handlePrint}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Cardápio (PDF / Papel)</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Printable Sheet (Standard A4 Landscape Appearance) */}
      <div 
        ref={printSheetRef}
        className="print-container printable-sheet w-full max-w-5xl bg-white rounded-xl shadow-2xl p-8 border border-neutral-300 text-neutral-900 print:max-w-none print:p-4 print:border-none print:shadow-none print:rounded-none"
      >
        
        {/* Header Sheet */}
        <div className="flex items-center justify-between border-b-2 border-neutral-900 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-neutral-950 uppercase">
                Restaurante Canção Nova
              </h1>
              <p className="text-xs font-semibold text-amber-800 tracking-wider uppercase">
                {menuType === 'rampa'
                  ? 'Cardápio Semanal Rampa · Refeitório & Linha de Servir'
                  : 'Cardápio Semanal a Quilo · Restaurante Self-Service'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-extrabold text-neutral-900">
              Semana {selectedWeek} · {MONTH_NAMES[selectedMonth - 1]} de {selectedYear}
            </div>
            <div className="text-xs font-mono font-medium text-neutral-600">
              Período: {currentMenu.startDate} a {currentMenu.endDate}
            </div>
            <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider mt-0.5">
              ✓ Cardápio Balanceado sem Repetições
            </div>
          </div>
        </div>

        {/* Weekly Matrix Table */}
        <div className="border border-neutral-900 rounded-lg overflow-hidden mb-6">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-neutral-900 text-white text-[11px]">
                <th className="py-2 px-2.5 w-36 font-bold uppercase border-r border-neutral-700">
                  Refeição
                </th>
                {dayKeys.map((dKey) => {
                  const day = currentMenu.days[dKey];
                  return (
                    <th
                      key={dKey}
                      className="py-2 px-2 text-center border-r border-neutral-700 last:border-r-0"
                    >
                      <div className="font-extrabold uppercase">{day.dayName.split('-')[0]}</div>
                      <div className="text-[10px] text-neutral-300 font-mono font-normal">
                        {day.dateStr}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-300">
              {rows.map((r, idx) => (
                <tr
                  key={r.key}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50/70'}
                >
                  <td className="py-2 px-2.5 font-bold text-neutral-950 border-r border-neutral-300 bg-neutral-100/60 text-[11px]">
                    {r.label}
                  </td>
                  {dayKeys.map((dKey) => {
                    const day = currentMenu.days[dKey];
                    const items = normalizeSlotItems(day.lunch[r.key as keyof typeof day.lunch]);
                    return (
                      <td
                        key={dKey}
                        className="py-2 px-2 border-r border-neutral-300 last:border-r-0 align-top text-[11px] leading-snug"
                      >
                        {items.length > 0 ? (
                          <div className="space-y-0.5">
                            {items.map((it, idx) => (
                              <div key={idx} className="font-medium text-neutral-900">
                                {items.length > 1 ? `• ${it}` : it}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-neutral-300 italic">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Nutritional & Allergen Footnote */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-neutral-200 pt-4 text-[11px] text-neutral-600">
          <div>
            <p className="font-bold text-neutral-800 mb-0.5">Orientações Nutricionais & Alérgenos:</p>
            <p className="leading-relaxed">
              Cardápio planejado por nutricionistas conforme o Guia Alimentar para a População Brasileira. 
              Em caso de restrições ou intolerâncias alimentares (glúten, lactose, frutos do mar ou oleaginosas), 
              por favor dirija-se à equipe do refeitório.
            </p>
          </div>

          <div className="flex flex-col justify-end items-end text-right">
            <div className="w-56 border-b border-neutral-400 mb-1"></div>
            <p className="font-bold text-neutral-900 text-xs">
              {currentUser?.name || 'Coordenação de Nutrição'}
            </p>
            <p className="text-[10px] text-neutral-500 font-mono">
              Responsável Técnico · Canção Nova
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
