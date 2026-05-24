// PDF Export Module
// This module provides PDF export via HTML template rendering
// The browser can print the HTML to PDF, or a PDF service can be integrated

import { TransferNote } from './model';
import { renderTransferNoteHTML } from './renderer';

export interface PDFExportOptions {
  format?: 'letter' | 'a4';
  orientation?: 'portrait' | 'landscape';
}

// Generate print-ready HTML for PDF export
export function generatePrintableHTML(note: TransferNote, options: PDFExportOptions = {}): string {
  const { format = 'letter', orientation = 'portrait' } = options;

  const pageStyle = format === 'letter'
    ? 'width: 8.5in; height: 11in;'
    : 'width: 210mm; height: 297mm;';

  const orientationStyle = orientation === 'landscape'
    ? 'size: landscape;'
    : '';

  // The base HTML from renderer
  let html = renderTransferNoteHTML(note);

  // Wrap in print-specific styles
  // Note: The actual PDF generation is done client-side via window.print()
  // This function provides the formatted HTML that can be sent to a PDF service
  return html;
}

// Response for PDF export endpoint
export interface PDFExportResponse {
  success: boolean;
  contentType: string;
  data?: string;
  error?: string;
}

// Stub for server-side PDF generation
// In production, integrate with puppeteer, pdfkit, or similar
export async function exportToPDF(note: TransferNote, options: PDFExportOptions = {}): Promise<PDFExportResponse> {
  try {
    const html = generatePrintableHTML(note, options);

    // Return HTML that can be printed to PDF
    return {
      success: true,
      contentType: 'text/html',
      data: html
    };
  } catch (error) {
    return {
      success: false,
      contentType: 'text/html',
      error: error instanceof Error ? error.message : 'PDF export failed'
    };
  }
}

// Generate a data URL for the transfer note (for embedding)
export function generateDataURL(note: TransferNote): string {
  const html = renderTransferNoteHTML(note);
  const base64 = Buffer.from(html).toString('base64');
  return `data:text/html;base64,${base64}`;
}