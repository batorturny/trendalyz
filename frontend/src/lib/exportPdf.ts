import { toCanvas } from 'html-to-image';
import jsPDF from 'jspdf';

/**
 * Read the current theme's --surface color from the document.
 * Returns { hex, rgb } where rgb is [r,g,b] for jsPDF.setFillColor.
 */
function getPageBg(): { hex: string; rgb: [number, number, number] } {
  const style = getComputedStyle(document.documentElement);
  const raw = style.getPropertyValue('--surface').trim();

  // Parse hex color
  const match = raw.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (match) {
    return {
      hex: raw,
      rgb: [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)],
    };
  }

  // Fallback based on dark class
  const isDark = document.documentElement.classList.contains('dark');
  return isDark
    ? { hex: '#1a1a1e', rgb: [26, 26, 30] }
    : { hex: '#f4f4f6', rgb: [244, 244, 246] };
}

/**
 * Check if a pixel [r,g,b] is close to the target background color.
 */
function isNearBg(r: number, g: number, b: number, bg: [number, number, number], tolerance = 20): boolean {
  return (
    Math.abs(r - bg[0]) < tolerance &&
    Math.abs(g - bg[1]) < tolerance &&
    Math.abs(b - bg[2]) < tolerance
  );
}

/**
 * Convert external images (quickchart.io) to inline data URLs
 * so the SVG foreignObject renderer can embed them.
 */
async function inlineExternalImages(el: HTMLElement): Promise<Map<HTMLImageElement, string>> {
  const originals = new Map<HTMLImageElement, string>();
  const imgs = el.querySelectorAll<HTMLImageElement>('img[src^="http"]');

  await Promise.all(
    Array.from(imgs).map(async (img) => {
      try {
        originals.set(img, img.src);
        const resp = await fetch(img.src);
        if (!resp.ok) throw new Error('Fetch failed');
        const blob = await resp.blob();
        if (blob.size === 0 || !blob.type.startsWith('image/')) throw new Error('Invalid image');

        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        img.src = dataUrl;
      } catch (err) {
        // If fetch fails, replace with transparent placeholder to prevent PDF error
        console.warn('Failed to load image for PDF:', img.src);
        img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      }
    })
  );

  return originals;
}

function restoreImages(originals: Map<HTMLImageElement, string>) {
  originals.forEach((src, img) => {
    img.src = src;
  });
}

/**
 * Render a single HTML element to a canvas with the given width.
 * Sets a temporary fixed width to match the container layout.
 */
async function renderSection(el: HTMLElement, width: number, bgHex: string): Promise<HTMLCanvasElement> {
  const originals = await inlineExternalImages(el);
  try {
    return await toCanvas(el, {
      backgroundColor: bgHex,
      pixelRatio: 2,
      width,
      cacheBust: true,
      style: {
        margin: '0',
        padding: el.tagName === 'SECTION' ? '0' : undefined,
      },
    });
  } finally {
    restoreImages(originals);
  }
}

/**
 * Slice a tall canvas into page-height chunks, breaking at natural
 * "gap" rows (horizontal lines of solid background color).
 */
function sliceCanvas(
  canvas: HTMLCanvasElement,
  maxSliceH: number,
  bgRgb: [number, number, number],
  bgHex: string,
): HTMLCanvasElement[] {
  const slices: HTMLCanvasElement[] = [];
  const ctx = canvas.getContext('2d')!;
  let srcY = 0;

  while (srcY < canvas.height) {
    let sliceH = Math.min(maxSliceH, canvas.height - srcY);

    // If there's more content after this slice, try to find a natural break
    // Look for a background-colored horizontal band near the bottom of the slice
    if (srcY + sliceH < canvas.height && sliceH > 100) {
      const searchStart = Math.floor(sliceH * 0.75);
      let bestBreak = sliceH;
      let bestScore = 0;

      for (let y = sliceH - 1; y >= searchStart; y--) {
        const row = ctx.getImageData(0, srcY + y, canvas.width, 1).data;
        let bgPixels = 0;
        for (let x = 0; x < canvas.width * 4; x += 4) {
          if (isNearBg(row[x], row[x + 1], row[x + 2], bgRgb)) {
            bgPixels++;
          }
        }
        const score = bgPixels / canvas.width;
        if (score > 0.95) {
          bestBreak = y;
          bestScore = score;
          break;
        }
        if (score > bestScore) {
          bestScore = score;
          bestBreak = y;
        }
      }

      if (bestScore > 0.8) {
        sliceH = bestBreak;
      }
    }

    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceH;
    const sliceCtx = sliceCanvas.getContext('2d')!;
    sliceCtx.fillStyle = bgHex;
    sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    sliceCtx.drawImage(
      canvas,
      0, srcY, canvas.width, sliceH,
      0, 0, canvas.width, sliceH
    );

    slices.push(sliceCanvas);
    srcY += sliceH;
  }

  return slices;
}

export async function exportPdf(container: HTMLElement, filename: string) {
  const { hex: bgHex, rgb: bgRgb } = getPageBg();

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pdfW = pdf.internal.pageSize.getWidth();   // 210
  const pdfH = pdf.internal.pageSize.getHeight();  // 297
  const margin = 6;
  const contentW = pdfW - margin * 2;
  const pageContentH = pdfH - margin * 2;
  const sectionGap = 2; // mm gap between sections

  // Get the container's rendered width for consistent rendering
  const containerWidth = container.offsetWidth;

  // Find top-level sections: the wrapper div.space-y-8 children
  const wrapper = container.firstElementChild as HTMLElement | null;
  const sectionEls = wrapper
    ? Array.from(wrapper.children).filter((c): c is HTMLElement => c instanceof HTMLElement)
    : [container];

  let curY = margin;
  let pageNum = 0;

  // Draw background on first page
  pdf.setFillColor(bgRgb[0], bgRgb[1], bgRgb[2]);
  pdf.rect(0, 0, pdfW, pdfH, 'F');

  for (const sectionEl of sectionEls) {
    // Render this section to a canvas
    const canvas = await renderSection(sectionEl, containerWidth, bgHex);

    const ratio = canvas.height / canvas.width;
    const sectionMmH = contentW * ratio;

    if (sectionMmH <= pageContentH) {
      // Section fits on a single page

      // Check if it fits on the current page
      if (curY + sectionMmH > pdfH - margin) {
        // Start a new page
        pdf.addPage();
        pageNum++;
        pdf.setFillColor(bgRgb[0], bgRgb[1], bgRgb[2]);
        pdf.rect(0, 0, pdfW, pdfH, 'F');
        curY = margin;
      }

      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        margin, curY, contentW, sectionMmH
      );
      curY += sectionMmH + sectionGap;
    } else {
      // Section is taller than one page — needs slicing
      const pixelsPerMm = canvas.width / contentW;
      const maxSlicePixelH = Math.floor(pageContentH * pixelsPerMm);

      // If we're not at the top of a page, start a new one for the big section
      if (curY > margin + 1) {
        pdf.addPage();
        pageNum++;
        pdf.setFillColor(bgRgb[0], bgRgb[1], bgRgb[2]);
        pdf.rect(0, 0, pdfW, pdfH, 'F');
        curY = margin;
      }

      const slices = sliceCanvas(canvas, maxSlicePixelH, bgRgb, bgHex);

      for (let i = 0; i < slices.length; i++) {
        if (i > 0) {
          pdf.addPage();
          pageNum++;
          pdf.setFillColor(bgRgb[0], bgRgb[1], bgRgb[2]);
          pdf.rect(0, 0, pdfW, pdfH, 'F');
          curY = margin;
        }

        const sliceMmH = (slices[i].height / canvas.width) * contentW;
        pdf.addImage(
          slices[i].toDataURL('image/png'),
          'PNG',
          margin, curY, contentW, sliceMmH
        );
        curY += sliceMmH + sectionGap;
      }
    }
  }

  pdf.save(`${filename}.pdf`);
}
