/**
 * Client-side PDF export using html-to-image + jsPDF.
 * Captures the full report DOM (KPIs + charts + tables) as a high-res image,
 * then paginates across A4 pages.
 */

interface ExportPdfOptions {
  element: HTMLElement;
  filename: string;
  onProgress?: (status: string) => void;
}

export async function exportPdfFromDOM({ element, filename, onProgress }: ExportPdfOptions): Promise<void> {
  onProgress?.('Kép készítése...');

  const [{ toPng }, { default: jsPDF }] = await Promise.all([
    import('html-to-image'),
    import('jspdf'),
  ]);

  // Detect theme
  const computedBg = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim();
  const bgColor = computedBg || (document.documentElement.classList.contains('dark') ? '#0f1117' : '#ffffff');

  // Temporarily set a fixed width on the element for consistent A4 rendering
  const originalWidth = element.style.width;
  const originalMaxWidth = element.style.maxWidth;
  element.style.width = '1120px';
  element.style.maxWidth = '1120px';

  let dataUrl: string;
  try {
    await new Promise(r => setTimeout(r, 100));
    dataUrl = await toPng(element, {
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: bgColor,
      skipFonts: false,
      cacheBust: true,
      filter: (node: Node) => {
        if (node instanceof HTMLElement && node.dataset?.pdfSkip === 'true') return false;
        return true;
      },
    });
  } finally {
    element.style.width = originalWidth;
    element.style.maxWidth = originalMaxWidth;
  }

  onProgress?.('PDF generálás...');

  // A4: 210 x 297 mm
  const A4_W = 210;
  const A4_H = 297;
  const MARGIN = 10;
  const CW = A4_W - 2 * MARGIN;
  const CH = A4_H - 2 * MARGIN;

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load captured image'));
    img.src = dataUrl;
  });

  const scale = CW / img.width;
  const scaledH = img.height * scale;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

  if (scaledH <= CH) {
    pdf.addImage(dataUrl, 'PNG', MARGIN, MARGIN, CW, scaledH);
  } else {
    const totalPages = Math.ceil(scaledH / CH);
    for (let p = 0; p < totalPages; p++) {
      if (p > 0) pdf.addPage();
      const srcY = (p * CH) / scale;
      const srcH = Math.min(CH / scale, img.height - srcY);
      const destH = srcH * scale;

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = Math.ceil(srcH);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Cannot create canvas context');
      ctx.drawImage(img, 0, srcY, img.width, srcH, 0, 0, img.width, srcH);

      const pageUrl = canvas.toDataURL('image/png', 0.95);
      pdf.addImage(pageUrl, 'PNG', MARGIN, MARGIN, CW, destH);
    }
  }

  onProgress?.('Letöltés...');
  pdf.save(`${filename}.pdf`);
}
