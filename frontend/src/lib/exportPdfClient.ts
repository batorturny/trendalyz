/**
 * Client-side PDF export using html-to-image + jsPDF.
 * Used as a fallback when the backend Puppeteer-based PDF generation fails,
 * or as a standalone export method.
 */

interface ExportPdfOptions {
  /** CSS selector or element to capture */
  element: HTMLElement;
  /** Output filename (without .pdf extension) */
  filename: string;
  /** Callback for progress updates */
  onProgress?: (status: string) => void;
}

/**
 * Captures a DOM element as a high-resolution image and generates a PDF.
 * Uses A4 page format with proper margins and pagination.
 */
export async function exportPdfFromDOM({ element, filename, onProgress }: ExportPdfOptions): Promise<void> {
  onProgress?.('Kép készítése...');

  // Dynamically import to keep bundle size small
  const [{ toPng }, { default: jsPDF }] = await Promise.all([
    import('html-to-image'),
    import('jspdf'),
  ]);

  // Detect current theme background color
  const computedBg = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim();
  const bgColor = computedBg || (document.documentElement.classList.contains('dark') ? '#0f1117' : '#ffffff');

  // Capture the element as a high-res PNG
  const pixelRatio = 2; // 2x for crisp rendering
  const dataUrl = await toPng(element, {
    quality: 0.95,
    pixelRatio,
    backgroundColor: bgColor,
    skipFonts: false,
    cacheBust: true,
    filter: (node: Node) => {
      // Skip any elements with data-pdf-skip attribute
      if (node instanceof HTMLElement && node.dataset?.pdfSkip === 'true') return false;
      return true;
    },
  });

  onProgress?.('PDF generálás...');

  // A4 dimensions in mm
  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;
  const MARGIN_MM = 12;
  const CONTENT_WIDTH_MM = A4_WIDTH_MM - 2 * MARGIN_MM;
  const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - 2 * MARGIN_MM;

  // Load image to get dimensions
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load captured image'));
    img.src = dataUrl;
  });

  const imgWidth = img.width;
  const imgHeight = img.height;

  // Calculate scaling: fit image width to content width
  const scale = CONTENT_WIDTH_MM / imgWidth;
  const scaledHeight = imgHeight * scale;

  // Create PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // If the content fits on one page
  if (scaledHeight <= CONTENT_HEIGHT_MM) {
    pdf.addImage(dataUrl, 'PNG', MARGIN_MM, MARGIN_MM, CONTENT_WIDTH_MM, scaledHeight);
  } else {
    // Multi-page: slice the image across pages
    const totalPages = Math.ceil(scaledHeight / CONTENT_HEIGHT_MM);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage();
      }

      // Calculate the y-offset in image coordinates for this page
      const srcY = (page * CONTENT_HEIGHT_MM) / scale;
      const srcHeight = Math.min(CONTENT_HEIGHT_MM / scale, imgHeight - srcY);
      const destHeight = srcHeight * scale;

      // Create a canvas for this page's slice
      const canvas = document.createElement('canvas');
      canvas.width = imgWidth;
      canvas.height = Math.ceil(srcHeight);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Cannot create canvas context');

      ctx.drawImage(img, 0, srcY, imgWidth, srcHeight, 0, 0, imgWidth, srcHeight);

      const pageDataUrl = canvas.toDataURL('image/png', 0.95);
      pdf.addImage(pageDataUrl, 'PNG', MARGIN_MM, MARGIN_MM, CONTENT_WIDTH_MM, destHeight);
    }
  }

  onProgress?.('Letöltés...');

  // Download
  pdf.save(`${filename}.pdf`);
}
