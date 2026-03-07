import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Capture the full report container as PDF using html2canvas + jsPDF.
 * Converts chart.js canvases to images first for reliable capture.
 */
export async function printPdf(container: HTMLElement, filename: string) {
  // Step 1: Convert all chart.js canvases to static images
  const canvases = container.querySelectorAll('canvas');
  const originals: { canvas: HTMLCanvasElement; img: HTMLImageElement }[] = [];

  canvases.forEach(canvas => {
    try {
      const img = document.createElement('img');
      img.src = canvas.toDataURL('image/png');
      img.style.width = canvas.offsetWidth + 'px';
      img.style.height = canvas.offsetHeight + 'px';
      img.style.display = 'block';
      canvas.parentNode?.insertBefore(img, canvas);
      canvas.style.display = 'none';
      originals.push({ canvas, img });
    } catch {
      // tainted canvas — skip
    }
  });

  try {
    // Step 2: Capture the entire container
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: container.scrollWidth,
    });

    // Step 3: Build PDF with pages
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();   // 210mm
    const pdfH = pdf.internal.pageSize.getHeight();  // 297mm
    const margin = 8;
    const contentW = pdfW - margin * 2;

    const imgW = canvas.width;
    const imgH = canvas.height;
    const ratio = contentW / imgW;
    const totalMmH = imgH * ratio;
    const pageContentH = pdfH - margin * 2;

    let srcY = 0;
    let page = 0;

    while (srcY < imgH) {
      if (page > 0) pdf.addPage();

      const sliceH = Math.min(Math.floor(pageContentH / ratio), imgH - srcY);

      // Create a slice canvas
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = imgW;
      sliceCanvas.height = sliceH;
      const ctx = sliceCanvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, imgW, sliceH);
      ctx.drawImage(canvas, 0, srcY, imgW, sliceH, 0, 0, imgW, sliceH);

      const sliceDataUrl = sliceCanvas.toDataURL('image/png');
      const sliceMmH = sliceH * ratio;

      pdf.addImage(sliceDataUrl, 'PNG', margin, margin, contentW, sliceMmH);

      srcY += sliceH;
      page++;
    }

    pdf.save(filename + '.pdf');
  } finally {
    // Step 4: Restore canvases
    originals.forEach(({ canvas, img }) => {
      canvas.style.display = '';
      img.remove();
    });
  }
}
