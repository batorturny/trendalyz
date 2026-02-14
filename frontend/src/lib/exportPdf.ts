import { toCanvas } from 'html-to-image';
import jsPDF from 'jspdf';

const PAGE_BG = '#020617';

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
        const blob = await resp.blob();
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        img.src = dataUrl;
      } catch {
        // leave original src if fetch fails
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
async function renderSection(el: HTMLElement, width: number): Promise<HTMLCanvasElement> {
  const originals = await inlineExternalImages(el);
  try {
    return await toCanvas(el, {
      backgroundColor: PAGE_BG,
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
): HTMLCanvasElement[] {
  const slices: HTMLCanvasElement[] = [];
  const ctx = canvas.getContext('2d')!;
  let srcY = 0;

  while (srcY < canvas.height) {
    let sliceH = Math.min(maxSliceH, canvas.height - srcY);

    // If there's more content after this slice, try to find a natural break
    // Look for a dark horizontal band (section gap) near the bottom of the slice
    if (srcY + sliceH < canvas.height && sliceH > 100) {
      const searchStart = Math.floor(sliceH * 0.75);
      let bestBreak = sliceH;
      let bestScore = 0;

      for (let y = sliceH - 1; y >= searchStart; y--) {
        const row = ctx.getImageData(0, srcY + y, canvas.width, 1).data;
        let darkPixels = 0;
        for (let x = 0; x < canvas.width * 4; x += 4) {
          // Check if pixel is close to PAGE_BG (#020617)
          if (row[x] < 15 && row[x + 1] < 20 && row[x + 2] < 40) {
            darkPixels++;
          }
        }
        const score = darkPixels / canvas.width;
        if (score > 0.95) {
          // Found a row that's almost entirely background — good break point
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
    sliceCtx.fillStyle = PAGE_BG;
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
  pdf.setFillColor(2, 6, 23);
  pdf.rect(0, 0, pdfW, pdfH, 'F');

  for (const sectionEl of sectionEls) {
    // Render this section to a canvas
    const canvas = await renderSection(sectionEl, containerWidth);

    const ratio = canvas.height / canvas.width;
    const sectionMmH = contentW * ratio;

    if (sectionMmH <= pageContentH) {
      // Section fits on a single page

      // Check if it fits on the current page
      if (curY + sectionMmH > pdfH - margin) {
        // Start a new page
        pdf.addPage();
        pageNum++;
        pdf.setFillColor(2, 6, 23);
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
      // (e.g. a long video table)
      const pixelsPerMm = canvas.width / contentW;
      const maxSlicePixelH = Math.floor(pageContentH * pixelsPerMm);

      // If we're not at the top of a page, start a new one for the big section
      if (curY > margin + 1) {
        pdf.addPage();
        pageNum++;
        pdf.setFillColor(2, 6, 23);
        pdf.rect(0, 0, pdfW, pdfH, 'F');
        curY = margin;
      }

      const slices = sliceCanvas(canvas, maxSlicePixelH);

      for (let i = 0; i < slices.length; i++) {
        if (i > 0) {
          pdf.addPage();
          pageNum++;
          pdf.setFillColor(2, 6, 23);
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
