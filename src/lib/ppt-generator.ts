import PptxGenJS from 'pptxgenjs';
import type { Slide, ContentItem } from '@/types';

// --- CONFIGURATION --- //
const SLIDE_WIDTH = 10; // inches
const SLIDE_HEIGHT = 5.625; // inches (16:9 aspect ratio)
const MARGIN_TOP = 0.3;
const MARGIN_LEFT = 0.5;
const MARGIN_RIGHT = 0.5;
const MARGIN_BOTTOM = 0.3;
const CONTENT_WIDTH = SLIDE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 9.0 in
const CONTENT_HEIGHT = SLIDE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM; // 5.025 in

const TITLE_OPTIONS = {
  fontSize: 22,
  bold: true,
  color: '003366',
  h: 0.75, // Height for the title box
};

/**
 * Formats text with bold parts into the array structure pptxgenjs requires for rich text.
 * Also supports standard markdown **bold** syntax.
 */
function formatTextForPptx(text: string, boldParts: string[] = []): PptxGenJS.TextProps[] {
  if (!text) return [{ text: '' }];

  // 1. Check if markdown **bold** syntax is present
  if (text.includes('**')) {
    const mdSegments: PptxGenJS.TextProps[] = [];
    const mdRegex = /\*\*(.*?)\*\*/g;
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = mdRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        mdSegments.push({ text: text.slice(lastIdx, match.index), options: { bold: false } });
      }
      mdSegments.push({ text: match[1], options: { bold: true } });
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < text.length) {
      mdSegments.push({ text: text.slice(lastIdx), options: { bold: false } });
    }
    return mdSegments;
  }

  // 2. Handle explicit boldParts array
  if (!boldParts || boldParts.length === 0) {
    return [{ text }];
  }

  // Create a regex to find all bold parts. Escape special characters.
  const escapedBoldParts = boldParts.map((part) =>
    part.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
  );
  const boldRegex = new RegExp(`(${escapedBoldParts.join('|')})`, 'g');
  const parts = text.split(boldRegex);

  return parts
    .filter((part) => part)
    .map((part) => {
      const isBold = boldParts.some((bp) => bp.toLowerCase() === part.toLowerCase());
      return { text: part, options: { bold: isBold } };
    });
}

/**
 * Measures the height of an HTML string by rendering it in a virtual DOM element.
 * @param {string} htmlContent - The HTML content to measure.
 * @param {HTMLElement} virtualSlideElement - The measurement container element.
 * @returns {number} The height in inches.
 */
function measureHeight(htmlContent: string, virtualSlideElement: HTMLElement): number {
  if (!virtualSlideElement) {
    return 0.4;
  }
  virtualSlideElement.innerHTML = htmlContent;
  const pixelHeight = virtualSlideElement.offsetHeight;
  return Math.max(0.2, pixelHeight / 96); // 96 DPI standard
}

/**
 * Accurately measures a table row's height given the number of columns and text content.
 */
function measureTableRowHeight(
  cells: string[],
  numColumns: number,
  isHeader: boolean,
  virtualSlideElement: HTMLElement
): number {
  const colWidthIn = CONTENT_WIDTH / Math.max(1, numColumns);
  const colWidthPx = Math.floor(864 / Math.max(1, numColumns));
  const fontSize = isHeader ? '11pt' : '10pt';
  const fontWeight = isHeader ? 'bold' : 'normal';

  const rowHtml = `
    <table style="width: 864px; table-layout: fixed; border-collapse: collapse; margin: 0; padding: 0; font-family: Inter, system-ui, sans-serif;">
      <tr>
        ${cells
          .map(
            (c) => `
          <td style="width: ${colWidthPx}px; font-size: ${fontSize}; font-weight: ${fontWeight}; line-height: 1.35; padding: 6px 8px; word-wrap: break-word; overflow-wrap: break-word; vertical-align: top; border: 1px solid #ccc;">
            ${c || '&nbsp;'}
          </td>`
          )
          .join('')}
      </tr>
    </table>
  `;

  const domHeight = measureHeight(rowHtml, virtualSlideElement);

  // Analytical fallback based on max characters per cell
  const charsPerLine = Math.max(12, Math.floor(colWidthIn * 13));
  let maxLines = 1;
  cells.forEach((c) => {
    const text = c || '';
    const paragraphs = text.split('\n');
    let totalLines = 0;
    paragraphs.forEach((p) => {
      totalLines += Math.max(1, Math.ceil(p.length / charsPerLine));
    });
    if (totalLines > maxLines) maxLines = totalLines;
  });

  const analyticalHeight = maxLines * 0.22 + (isHeader ? 0.2 : 0.16);
  return Math.max(domHeight + 0.08, analyticalHeight, isHeader ? 0.4 : 0.32);
}

async function renderParagraph(
  pptx: PptxGenJS,
  slide: PptxGenJS.Slide,
  content: any,
  startY: number,
  slideTitle: string,
  virtualSlideElement: HTMLElement
) {
  const richText = formatTextForPptx(content.text, content.bold);
  const htmlToMeasure = `<div style="width: 864px; font-size: 13pt; line-height: 1.4; margin: 0; padding: 0; font-family: Inter, sans-serif;">${content.text}</div>`;
  const height = measureHeight(htmlToMeasure, virtualSlideElement) + 0.1;

  if (startY + height > CONTENT_HEIGHT) {
    slide = pptx.addSlide();
    slide.addText(`${slideTitle} (cont.)`, {
      ...TITLE_OPTIONS,
      x: MARGIN_LEFT,
      y: MARGIN_TOP,
      w: CONTENT_WIDTH,
    });
    startY = MARGIN_TOP + TITLE_OPTIONS.h + 0.15;
  }

  slide.addText(richText, {
    x: MARGIN_LEFT,
    y: startY,
    w: CONTENT_WIDTH,
    h: height,
    fontSize: 13,
    color: '333333',
    valign: 'top',
  });

  return { newY: startY + height + 0.12, slide: slide };
}

async function renderBulletList(
  pptx: PptxGenJS,
  slide: PptxGenJS.Slide,
  content: any,
  startY: number,
  slideTitle: string,
  virtualSlideElement: HTMLElement
) {
  for (const item of content.items || []) {
    const richText = formatTextForPptx(item.text, item.bold);
    const htmlToMeasure = `<div style="width: 830px; font-size: 12.5pt; line-height: 1.35; margin: 0; padding: 0; font-family: Inter, sans-serif;">\u2022 ${item.text}</div>`;
    const height = measureHeight(htmlToMeasure, virtualSlideElement) + 0.08;

    if (startY + height > CONTENT_HEIGHT) {
      slide = pptx.addSlide();
      slide.addText(`${slideTitle} (cont.)`, {
        ...TITLE_OPTIONS,
        x: MARGIN_LEFT,
        y: MARGIN_TOP,
        w: CONTENT_WIDTH,
      });
      startY = MARGIN_TOP + TITLE_OPTIONS.h + 0.15;
    }

    slide.addText(richText, {
      x: MARGIN_LEFT + 0.2,
      y: startY,
      w: CONTENT_WIDTH - 0.2,
      h: height,
      fontSize: 12.5,
      bullet: true,
      color: '333333',
      valign: 'top',
    });
    startY += height + 0.06;
  }
  return { newY: startY + 0.1, slide: slide };
}

async function renderNumberedList(
  pptx: PptxGenJS,
  slide: PptxGenJS.Slide,
  content: any,
  startY: number,
  slideTitle: string,
  virtualSlideElement: HTMLElement
) {
  let itemIndex = 1;
  for (const item of content.items || []) {
    const itemText = `${itemIndex}. ${item.text}`;
    const richText = formatTextForPptx(itemText, item.bold);
    const htmlToMeasure = `<div style="width: 830px; font-size: 12.5pt; line-height: 1.35; margin: 0; padding: 0; font-family: Inter, sans-serif;">${itemText}</div>`;
    const height = measureHeight(htmlToMeasure, virtualSlideElement) + 0.08;

    if (startY + height > CONTENT_HEIGHT) {
      slide = pptx.addSlide();
      slide.addText(`${slideTitle} (cont.)`, {
        ...TITLE_OPTIONS,
        x: MARGIN_LEFT,
        y: MARGIN_TOP,
        w: CONTENT_WIDTH,
      });
      startY = MARGIN_TOP + TITLE_OPTIONS.h + 0.15;
    }

    slide.addText(richText, {
      x: MARGIN_LEFT + 0.2,
      y: startY,
      w: CONTENT_WIDTH - 0.2,
      h: height,
      fontSize: 12.5,
      color: '333333',
      valign: 'top',
    });
    startY += height + 0.06;
    itemIndex++;
  }
  return { newY: startY + 0.1, slide: slide };
}

async function renderTable(
  pptx: PptxGenJS,
  slide: PptxGenJS.Slide,
  content: any,
  startY: number,
  slideTitle: string,
  virtualSlideElement: HTMLElement
) {
  const numColumns = (content.headers || []).length || 1;
  const headerOptions = { fill: '003366', color: 'FFFFFF', bold: true, fontSize: 11, valign: 'middle' as const };
  const rowOptions = { fontSize: 10, color: '333333', valign: 'top' as const };

  const headerHeight = measureTableRowHeight(content.headers || [], numColumns, true, virtualSlideElement);

  let rowsForCurrentSlide: any[] = [];
  rowsForCurrentSlide.push(
    (content.headers || []).map((h: string) => ({ text: h, options: headerOptions }))
  );
  let tableHeightOnSlide = headerHeight;

  // If table cannot fit even the header and one row, move table to fresh continuation slide
  if (startY + headerHeight + 0.6 > CONTENT_HEIGHT) {
    slide = pptx.addSlide();
    slide.addText(`${slideTitle} (cont.)`, {
      ...TITLE_OPTIONS,
      x: MARGIN_LEFT,
      y: MARGIN_TOP,
      w: CONTENT_WIDTH,
    });
    startY = MARGIN_TOP + TITLE_OPTIONS.h + 0.15;
  }

  for (const row of content.rows || []) {
    const rowHeight = measureTableRowHeight(row.cells || [], numColumns, false, virtualSlideElement);

    if (startY + tableHeightOnSlide + rowHeight > CONTENT_HEIGHT) {
      // Flush current rows
      if (rowsForCurrentSlide.length > 1) {
        slide.addTable(rowsForCurrentSlide, {
          x: MARGIN_LEFT,
          y: startY,
          w: CONTENT_WIDTH,
          autoPage: false,
          border: { type: 'solid', color: 'D3D3D3', pt: 1 },
        });
      }

      // Add continuation slide
      slide = pptx.addSlide();
      slide.addText(`${slideTitle} (cont.)`, {
        ...TITLE_OPTIONS,
        x: MARGIN_LEFT,
        y: MARGIN_TOP,
        w: CONTENT_WIDTH,
      });
      startY = MARGIN_TOP + TITLE_OPTIONS.h + 0.15;

      // Start fresh table on continuation slide with headers
      rowsForCurrentSlide = [
        (content.headers || []).map((h: string) => ({ text: h, options: headerOptions })),
      ];
      tableHeightOnSlide = headerHeight;
    }

    rowsForCurrentSlide.push(
      (row.cells || []).map((c: string) => ({ text: c, options: rowOptions }))
    );
    tableHeightOnSlide += rowHeight;
  }

  // Draw remaining table rows
  if (rowsForCurrentSlide.length > 1) {
    slide.addTable(rowsForCurrentSlide, {
      x: MARGIN_LEFT,
      y: startY,
      w: CONTENT_WIDTH,
      autoPage: false,
      border: { type: 'solid', color: 'D3D3D3', pt: 1 },
    });
  }

  // Calculate safe new Y position below the table
  const finalY = startY + tableHeightOnSlide + 0.25;

  return { newY: finalY, slide: slide };
}

async function renderNote(
  pptx: PptxGenJS,
  slide: PptxGenJS.Slide,
  content: any,
  startY: number,
  slideTitle: string,
  virtualSlideElement: HTMLElement
) {
  const cleanNote = (content.text || '').replace(/^Note:\s*/i, '');
  const htmlToMeasure = `<div style="width: 864px; font-size: 11pt; font-style: italic; margin: 0; padding: 4px; font-family: Inter, sans-serif;">Note: ${cleanNote}</div>`;
  const height = measureHeight(htmlToMeasure, virtualSlideElement) + 0.12;

  if (startY + height > CONTENT_HEIGHT) {
    slide = pptx.addSlide();
    slide.addText(`${slideTitle} (cont.)`, {
      ...TITLE_OPTIONS,
      x: MARGIN_LEFT,
      y: MARGIN_TOP,
      w: CONTENT_WIDTH,
    });
    startY = MARGIN_TOP + TITLE_OPTIONS.h + 0.15;
  }

  slide.addText(`Note: ${cleanNote}`, {
    x: MARGIN_LEFT,
    y: startY,
    w: CONTENT_WIDTH,
    h: height,
    fontSize: 11,
    italic: true,
    color: 'B45309',
    valign: 'top',
  });

  return { newY: startY + height + 0.12, slide: slide };
}

/**
 * Generates a PowerPoint presentation from structured slide data.
 * @param {Slide[]} slidesData - An array of slide objects.
 * @param {string} fileName - The desired file name for the presentation.
 * @param {HTMLElement} virtualSlideElement - The measurement container element.
 */
export async function generatePptx(
  slidesData: Slide[],
  fileName: string = 'Generated-Presentation.pptx',
  virtualSlideElement?: HTMLElement | null
) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  // Get or create virtual slide element if not supplied
  let elementToUse = virtualSlideElement;
  if (!elementToUse && typeof document !== 'undefined') {
    elementToUse = document.getElementById('virtual-slide') || undefined;
  }

  if (!elementToUse && typeof document !== 'undefined') {
    const tempDiv = document.createElement('div');
    tempDiv.id = 'virtual-slide-temp';
    tempDiv.style.position = 'absolute';
    tempDiv.style.top = '-9999px';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '864px';
    tempDiv.style.fontFamily = 'Inter, system-ui, sans-serif';
    document.body.appendChild(tempDiv);
    elementToUse = tempDiv;
  }

  for (const slideData of slidesData) {
    let currentSlide = pptx.addSlide();
    let currentY = MARGIN_TOP;

    currentSlide.addText(slideData.title, {
      ...TITLE_OPTIONS,
      x: MARGIN_LEFT,
      y: currentY,
      w: CONTENT_WIDTH,
    });
    currentY += TITLE_OPTIONS.h;
    currentY += 0.15; // Extra margin after title

    for (const content of slideData.content || []) {
      // If there's barely any space left before rendering the next element, break to new slide
      if (currentY >= CONTENT_HEIGHT - 0.4) {
        currentSlide = pptx.addSlide();
        currentSlide.addText(`${slideData.title} (cont.)`, {
          ...TITLE_OPTIONS,
          x: MARGIN_LEFT,
          y: MARGIN_TOP,
          w: CONTENT_WIDTH,
        });
        currentY = MARGIN_TOP + TITLE_OPTIONS.h + 0.15;
      }

      switch (content.type) {
        case 'paragraph': {
          const { newY, slide } = await renderParagraph(
            pptx,
            currentSlide,
            content,
            currentY,
            slideData.title,
            elementToUse!
          );
          currentY = newY;
          currentSlide = slide;
          break;
        }
        case 'bullet_list': {
          const { newY, slide } = await renderBulletList(
            pptx,
            currentSlide,
            content,
            currentY,
            slideData.title,
            elementToUse!
          );
          currentY = newY;
          currentSlide = slide;
          break;
        }
        case 'numbered_list': {
          const { newY, slide } = await renderNumberedList(
            pptx,
            currentSlide,
            content,
            currentY,
            slideData.title,
            elementToUse!
          );
          currentY = newY;
          currentSlide = slide;
          break;
        }
        case 'table': {
          const { newY, slide } = await renderTable(
            pptx,
            currentSlide,
            content,
            currentY,
            slideData.title,
            elementToUse!
          );
          currentY = newY;
          currentSlide = slide;
          break;
        }
        case 'note': {
          const { newY, slide } = await renderNote(
            pptx,
            currentSlide,
            content,
            currentY,
            slideData.title,
            elementToUse!
          );
          currentY = newY;
          currentSlide = slide;
          break;
        }
      }
    }
  }

  return pptx.writeFile({ fileName });
}
