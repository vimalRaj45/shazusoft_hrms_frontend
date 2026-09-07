/**
 * SHAZUSOFT HRMS — CENTRALIZED DOCUMENT WATERMARK UTILITY
 * 
 * Applies an executive, subtle background watermark across all pages
 * of any jsPDF document (Payslips, Timesheets, Performance Appraisals).
 */

export function applyShazuWatermark(doc) {
  if (!doc || typeof doc.internal?.getNumberOfPages !== 'function') return;

  const totalPages = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    try {
      if (typeof doc.saveGraphicsState === 'function') {
        doc.saveGraphicsState();
      }
      if (typeof doc.GState === 'function') {
        // Subtle transparency so it passes through light tables without obscuring text
        doc.setGState(new doc.GState({ opacity: 0.08 }));
      }
    } catch (e) {
      // Fallback gracefully if graphics state is not supported
    }

    // Watermark typography & soft slate corporate tint
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(50);
    doc.setTextColor(205, 214, 226);

    // Primary diagonal watermark centered on page
    doc.text('SHAZU SOFT', pageWidth / 2, pageHeight / 2 - 6, {
      align: 'center',
      baseline: 'middle',
      angle: 45
    });

    // Secondary sub-line
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(215, 222, 232);
    doc.text('OFFICIAL HRMS RECORD', pageWidth / 2, pageHeight / 2 + 14, {
      align: 'center',
      baseline: 'middle',
      angle: 45
    });

    try {
      if (typeof doc.restoreGraphicsState === 'function') {
        doc.restoreGraphicsState();
      }
    } catch (e) {
      // Fallback
    }
  }
}
