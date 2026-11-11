/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utility for robust, cross-browser printing in AI Studio iframe environments.
 * Provides multiple fallbacks: direct window print, isolated iframe with full CSS,
 * clean popup/new tab window, and instant HTML download.
 */

export interface PrintOptions {
  title?: string;
  orientation?: 'landscape' | 'portrait';
  autoPrint?: boolean;
}

/**
 * Collects all styles currently active in the document to ensure
 * print windows and iframes look identical to the screen design.
 */
function getDocumentStyles(): string {
  let styles = '';
  try {
    document.querySelectorAll('style').forEach((st) => {
      styles += st.outerHTML + '\n';
    });
    document.querySelectorAll('link[rel="stylesheet"]').forEach((lk) => {
      styles += lk.outerHTML + '\n';
    });
  } catch (err) {
    console.warn('Could not collect external stylesheets:', err);
  }
  return styles;
}

/**
 * Standalone CSS guarantees labels and tables print crisp and correctly
 * even if Tailwind stylesheets are not reachable in sandboxed iframes.
 */
function getBasePrintCss(orientation: 'landscape' | 'portrait' = 'portrait'): string {
  return `
    @page {
      size: ${orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'};
      margin: 8mm;
    }
    * {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #000000 !important;
      font-size: 11pt;
    }
    .no-print, header, nav, footer, button {
      display: none !important;
    }
    .print-only {
      display: block !important;
    }
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      margin-bottom: 12px;
    }
    th, td {
      border: 1px solid #111111 !important;
      padding: 5px 8px !important;
      text-align: left;
    }
    th {
      background-color: #f3f4f6 !important;
      font-weight: bold;
    }
    .page-break {
      page-break-after: always !important;
      break-after: page !important;
    }
    .avoid-break, .sticker-card {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .grid {
      display: grid !important;
    }
    .grid-cols-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
    .grid-cols-1 {
      grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
    }
    .gap-4 {
      gap: 12px !important;
    }
    .gap-3 {
      gap: 10px !important;
    }
    .gap-2 {
      gap: 8px !important;
    }
    .gap-1 {
      gap: 4px !important;
    }
    .flex {
      display: flex !important;
    }
    .flex-col {
      flex-direction: column !important;
    }
    .justify-between {
      justify-content: space-between !important;
    }
    .items-center {
      align-items: center !important;
    }
    .border-b {
      border-bottom: 1px solid #111111 !important;
    }
    .border-b-2 {
      border-bottom: 2px solid #111111 !important;
    }
    .border-t {
      border-top: 1px solid #111111 !important;
    }
    .border-2 {
      border: 2px solid #111111 !important;
    }
    .border {
      border: 1px solid #111111 !important;
    }
    .border-dashed {
      border-style: dashed !important;
    }
    .rounded-lg, .rounded-xl {
      border-radius: 6px !important;
    }
    .rounded {
      border-radius: 4px !important;
    }
    .p-3 {
      padding: 10px !important;
    }
    .p-2 {
      padding: 8px !important;
    }
    .pt-1\\.5, .pt-1 {
      padding-top: 5px !important;
    }
    .pb-1\\.5, .pb-1 {
      padding-bottom: 5px !important;
    }
    .py-1\\.5 {
      padding-top: 5px !important;
      padding-bottom: 5px !important;
    }
    .font-bold, .font-black, .font-extrabold {
      font-weight: 700 !important;
    }
    .font-semibold {
      font-weight: 600 !important;
    }
    .font-mono {
      font-family: monospace !important;
    }
    .uppercase {
      text-transform: uppercase !important;
    }
    .text-xs {
      font-size: 9pt !important;
    }
    .text-sm {
      font-size: 11pt !important;
    }
    .text-base {
      font-size: 12pt !important;
    }
    .text-lg {
      font-size: 14pt !important;
    }
    .text-xl {
      font-size: 16pt !important;
    }
    .text-\\[9px\\], .text-\\[10px\\] {
      font-size: 8pt !important;
    }
    .text-\\[11px\\] {
      font-size: 9pt !important;
    }
    .sticker-card {
      border: 1.5px solid #000000 !important;
      border-radius: 6px !important;
      padding: 8px 10px !important;
      min-height: 54mm !important;
      background: #ffffff !important;
      color: #000000 !important;
      margin-bottom: 8px !important;
    }
  `;
}

/**
 * Triggers standard browser print with pre-focus and orientation setup.
 */
export function triggerDirectPrint(orientation: 'landscape' | 'portrait' = 'portrait') {
  try {
    document.body.classList.remove('print-landscape', 'print-portrait');
    document.body.classList.add(`print-${orientation}`);
    window.focus();
    setTimeout(() => {
      window.print();
    }, 150);
  } catch (err) {
    console.warn('Direct window.print() failed:', err);
  }
}

/**
 * Prints HTML content in an isolated iframe or falls back to direct print.
 */
export function printIsolatedContent(
  title: string,
  contentHtml: string,
  orientation: 'landscape' | 'portrait' = 'portrait'
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      document.body.classList.remove('print-landscape', 'print-portrait');
      document.body.classList.add(`print-${orientation}`);

      const existingFrame = document.getElementById('print-isolation-frame');
      if (existingFrame) {
        existingFrame.remove();
      }

      const iframe = document.createElement('iframe');
      iframe.id = 'print-isolation-frame';
      iframe.setAttribute('style', 'position:fixed;right:0;bottom:0;width:10px;height:10px;border:none;opacity:0.01;z-index:-1;');
      document.body.appendChild(iframe);

      const capturedStyles = getDocumentStyles();
      const baseCss = getBasePrintCss(orientation);

      const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  ${capturedStyles}
  <style>
    ${baseCss}
  </style>
</head>
<body>
  ${contentHtml}
</body>
</html>`;

      const iframeDoc = iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(fullHtml);
        iframeDoc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            resolve(true);
          } catch (e) {
            console.warn('Iframe print blocked, falling back to direct print:', e);
            window.focus();
            window.print();
            resolve(true);
          } finally {
            setTimeout(() => {
              iframe.remove();
            }, 3000);
          }
        }, 250);
        return;
      }

      window.focus();
      window.print();
      resolve(true);
    } catch (err) {
      console.warn('Print isolated content error, falling back to direct print:', err);
      try {
        window.focus();
        window.print();
      } catch (e) {
        console.error('All printing attempts failed:', e);
      }
      resolve(false);
    }
  });
}

/**
 * Opens a dedicated printable window with auto-print.
 * Ideal for iframes that block child iframe printing.
 */
export function openPrintableWindow(
  title: string,
  contentHtml: string,
  orientation: 'landscape' | 'portrait' = 'portrait'
) {
  try {
    const baseCss = getBasePrintCss(orientation);
    const capturedStyles = getDocumentStyles();

    const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  ${capturedStyles}
  <style>
    ${baseCss}
    .print-bar {
      position: sticky;
      top: 0;
      background: #f8fafc;
      border-bottom: 2px solid #e2e8f0;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      font-family: sans-serif;
    }
    @media print {
      .print-bar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="print-bar no-print">
    <div>
      <strong style="font-size: 15px; color: #0f172a;">${title}</strong>
      <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
        Clique em "Imprimir Agora" ou use Ctrl+P no seu teclado.
      </div>
    </div>
    <div style="display: flex; gap: 8px;">
      <button onclick="window.print()" style="background: #d97706; color: #ffffff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer;">
        🖨️ Imprimir Agora
      </button>
      <button onclick="window.close()" style="background: #e2e8f0; color: #334155; border: none; padding: 8px 14px; border-radius: 8px; font-size: 13px; cursor: pointer;">
        Fechar
      </button>
    </div>
  </div>
  ${contentHtml}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      downloadPrintableDocument(`${title.replace(/\s+/g, '_')}.html`, title, contentHtml, orientation);
    }
  } catch (err) {
    console.error('Failed to open printable window:', err);
    downloadPrintableDocument(`${title.replace(/\s+/g, '_')}.html`, title, contentHtml, orientation);
  }
}

/**
 * Downloads a ready-to-print HTML file as a fallback or for external printing / archival.
 */
export function downloadPrintableDocument(
  filename: string,
  title: string,
  contentHtml: string,
  orientation: 'landscape' | 'portrait' = 'portrait'
) {
  const baseCss = getBasePrintCss(orientation);
  const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    ${baseCss}
    .print-bar {
      position: sticky;
      top: 0;
      background: #f8fafc;
      border-bottom: 2px solid #e2e8f0;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      font-family: sans-serif;
    }
    @media print {
      .print-bar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="print-bar no-print">
    <div>
      <strong style="font-size: 15px; color: #0f172a;">${title}</strong>
      <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
        Documento gerado pelo Sistema Restaurante Canção Nova.
      </div>
    </div>
    <div style="display: flex; gap: 8px;">
      <button onclick="window.print()" style="background: #d97706; color: #ffffff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer;">
        🖨️ Mandar para a Impressora
      </button>
      <button onclick="window.close()" style="background: #e2e8f0; color: #334155; border: none; padding: 8px 14px; border-radius: 8px; font-size: 13px; cursor: pointer;">
        Fechar
      </button>
    </div>
  </div>
  ${contentHtml}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 400);
    };
  </script>
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.html') ? filename : `${filename}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
