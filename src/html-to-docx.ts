import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
} from 'docx';

type DocChild = Paragraph | Table;

const FONT = 'Calibri';
const MONO = 'Consolas';

function inlineRuns(el: Node, inherit: { bold?: boolean; italic?: boolean; code?: boolean; link?: string } = {}): TextRun[] {
  const runs: TextRun[] = [];
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent ?? '';
      if (!text) continue;
      runs.push(new TextRun({
        text,
        bold: inherit.bold,
        italics: inherit.italic,
        font: inherit.code ? MONO : FONT,
        size: inherit.code ? 20 : 24,
      }));
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const tag = (child as Element).tagName.toLowerCase();
      if (tag === 'strong' || tag === 'b') {
        runs.push(...inlineRuns(child, { ...inherit, bold: true }));
      } else if (tag === 'em' || tag === 'i') {
        runs.push(...inlineRuns(child, { ...inherit, italic: true }));
      } else if (tag === 'code') {
        runs.push(...inlineRuns(child, { ...inherit, code: true }));
      } else if (tag === 'a') {
        const href = (child as HTMLAnchorElement).href;
        const linkRuns = inlineRuns(child, { ...inherit });
        // Style link runs as blue underline
        linkRuns.forEach(r => {
          runs.push(new TextRun({
            text: (r as any).root?.[1]?.root?.[1] ?? child.textContent ?? '',
            bold: inherit.bold,
            italics: inherit.italic,
            font: inherit.code ? MONO : FONT,
            size: inherit.code ? 20 : 24,
            color: '0969DA',
            underline: { type: 'single' as any },
          }));
        });
        void href; // link target not preserved in simple TextRun
      } else if (tag === 'br') {
        runs.push(new TextRun({ break: 1 }));
      } else {
        runs.push(...inlineRuns(child, inherit));
      }
    }
  }
  return runs as TextRun[];
}

function parseElement(el: Element): DocChild[] {
  const tag = el.tagName.toLowerCase();

  if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') {
    const level: Record<string, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
      h1: HeadingLevel.HEADING_1,
      h2: HeadingLevel.HEADING_2,
      h3: HeadingLevel.HEADING_3,
      h4: HeadingLevel.HEADING_4,
      h5: HeadingLevel.HEADING_5,
      h6: HeadingLevel.HEADING_6,
    };
    return [new Paragraph({ heading: level[tag], children: inlineRuns(el) })];
  }

  if (tag === 'p') {
    return [new Paragraph({ children: inlineRuns(el), spacing: { after: 200 } })];
  }

  if (tag === 'blockquote') {
    const children: DocChild[] = [];
    for (const child of Array.from(el.children)) {
      children.push(...parseElement(child));
    }
    return children.map(c => {
      if (c instanceof Paragraph) {
        return new Paragraph({
          ...({} as any),
          children: inlineRuns(el),
          indent: { left: 720 },
          border: { left: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC', space: 10 } },
          spacing: { after: 200 },
        });
      }
      return c;
    });
  }

  if (tag === 'pre') {
    const code = el.querySelector('code');
    const text = (code ?? el).textContent ?? '';
    const lines = text.split('\n');
    return lines.map(line => new Paragraph({
      children: [new TextRun({ text: line || ' ', font: MONO, size: 20 })],
      shading: { type: 'clear' as any, fill: 'F6F8FA' },
      spacing: { after: 0 },
    }));
  }

  if (tag === 'ul' || tag === 'ol') {
    const items: DocChild[] = [];
    const listItems = el.querySelectorAll(':scope > li');
    listItems.forEach((li, idx) => {
      const bullet = tag === 'ul' ? '  \u2022  ' : `  ${idx + 1}.  `;
      const runs = inlineRuns(li);
      items.push(new Paragraph({
        children: [new TextRun({ text: bullet, font: FONT, size: 24 }), ...runs],
        spacing: { after: 80 },
      }));
    });
    return items;
  }

  if (tag === 'table') {
    const rows: TableRow[] = [];
    el.querySelectorAll('tr').forEach(tr => {
      const cells: TableCell[] = [];
      tr.querySelectorAll('th, td').forEach(td => {
        const isHeader = td.tagName.toLowerCase() === 'th';
        cells.push(new TableCell({
          children: [new Paragraph({
            children: inlineRuns(td, { bold: isHeader }),
          })],
          width: { size: 0, type: WidthType.AUTO },
          shading: isHeader ? { type: 'clear' as any, fill: 'F6F8FA' } : undefined,
        }));
      });
      if (cells.length > 0) {
        rows.push(new TableRow({ children: cells }));
      }
    });
    if (rows.length > 0) {
      return [new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } })];
    }
    return [];
  }

  if (tag === 'hr') {
    return [new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D0D7DE' } },
      spacing: { before: 200, after: 200 },
    })];
  }

  // Fallback: try to extract text from unknown elements
  if (el.children.length > 0) {
    const items: DocChild[] = [];
    for (const child of Array.from(el.children)) {
      items.push(...parseElement(child));
    }
    return items;
  }

  const text = el.textContent?.trim();
  if (text) {
    return [new Paragraph({ children: [new TextRun({ text, font: FONT, size: 24 })], spacing: { after: 200 } })];
  }
  return [];
}

export async function generateDocx(previewEl: HTMLElement): Promise<Blob> {
  const children: DocChild[] = [];
  for (const child of Array.from(previewEl.children)) {
    children.push(...parseElement(child as Element));
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children,
    }],
  });

  return Packer.toBlob(doc);
}
