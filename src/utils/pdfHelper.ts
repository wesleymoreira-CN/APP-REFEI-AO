/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  orientation?: 'portrait' | 'landscape';
  filename?: string;
  quality?: number;
}

/**
 * Converts any DOM element into a crisp, multi-page or single-page A4 PDF file.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  filename: string,
  orientation: 'portrait' | 'landscape' = 'portrait'
): Promise<void> {
  try {
    // Render the element to a high-res canvas (scale 2 gives 150-200 DPI equivalent for clean print)
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: orientation === 'landscape' ? 1200 : 900,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Standard A4 dimensions in mm
    const pdfWidth = orientation === 'landscape' ? 297 : 210;
    const pdfHeight = orientation === 'landscape' ? 210 : 297;

    const imgWidth = pdfWidth - 16; // 8mm margins on left and right
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    let heightLeft = imgHeight;
    let position = 8; // 8mm top margin

    // First page
    pdf.addImage(imgData, 'JPEG', 8, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= (pdfHeight - 16);

    // Multi-page handling if content overflows
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 8;
      pdf.addPage('a4', orientation);
      pdf.addImage(imgData, 'JPEG', 8, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= (pdfHeight - 16);
    }

    const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(finalFilename);
  } catch (err) {
    console.error('Error exporting element to PDF:', err);
    throw err;
  }
}

/**
 * Triggers direct printer dialog via an AutoPrint PDF loaded into a clean iframe.
 * This is the ultimate fallback for sandboxed environments that block window.print().
 */
export async function printElementViaPdf(
  element: HTMLElement,
  orientation: 'portrait' | 'landscape' = 'portrait'
): Promise<boolean> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: orientation === 'landscape' ? 1200 : 900,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdfWidth = orientation === 'landscape' ? 297 : 210;
    const pdfHeight = orientation === 'landscape' ? 210 : 297;
    const imgWidth = pdfWidth - 16;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    });

    let heightLeft = imgHeight;
    let position = 8;

    pdf.addImage(imgData, 'JPEG', 8, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= (pdfHeight - 16);

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 8;
      pdf.addPage('a4', orientation);
      pdf.addImage(imgData, 'JPEG', 8, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= (pdfHeight - 16);
    }

    // Set autoPrint action in PDF metadata
    pdf.autoPrint({ variant: 'non-conform' });

    // Output blob URL
    const blobUrl = pdf.output('bloburl');

    // Create an invisible iframe to load and trigger the print
    const existingIframe = document.getElementById('autoprint-pdf-frame');
    if (existingIframe) existingIframe.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'autoprint-pdf-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = 'none';
    iframe.src = String(blobUrl);

    document.body.appendChild(iframe);

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.warn('Iframe print call error:', e);
      }
    }, 500);

    return true;
  } catch (err) {
    console.error('Failed to print via PDF:', err);
    return false;
  }
}
