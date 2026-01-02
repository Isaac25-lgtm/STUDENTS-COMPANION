// Markdown to Word Document Converter
// Converts markdown text to a properly formatted .docx file

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Packer,
  PageBreak,
  Header,
  Footer,
} from 'docx';
import { saveAs } from 'file-saver';

interface ParsedElement {
  type: 'heading1' | 'heading2' | 'heading3' | 'heading4' | 'paragraph' | 'table' | 'list' | 'pagebreak';
  content: string;
  rows?: string[][];
  items?: string[];
}

// Parse markdown into structured elements
function parseMarkdown(markdown: string): ParsedElement[] {
  const lines = markdown.split('\n');
  const elements: ParsedElement[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }

    // Page break markers
    if (line.match(/^={10,}$/) || line.match(/^-{10,}$/)) {
      elements.push({ type: 'pagebreak', content: '' });
      i++;
      continue;
    }

    // Headings
    if (line.startsWith('#### ')) {
      elements.push({ type: 'heading4', content: line.substring(5) });
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push({ type: 'heading3', content: line.substring(4) });
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push({ type: 'heading2', content: line.substring(3) });
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push({ type: 'heading1', content: line.substring(2) });
      i++;
      continue;
    }

    // Tables (detect by | at start and end)
    if (line.startsWith('|') && line.endsWith('|')) {
      const tableRows: string[][] = [];
      
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const row = lines[i].trim();
        // Skip separator rows (|---|---|)
        if (!row.match(/^\|[\s-:|]+\|$/)) {
          const cells = row
            .split('|')
            .filter((cell, idx, arr) => idx > 0 && idx < arr.length - 1)
            .map(cell => cell.trim());
          tableRows.push(cells);
        }
        i++;
      }
      
      if (tableRows.length > 0) {
        elements.push({ type: 'table', content: '', rows: tableRows });
      }
      continue;
    }

    // Lists (bullet points)
    if (line.startsWith('- ') || line.startsWith('* ') || line.match(/^\d+\.\s/)) {
      const items: string[] = [];
      
      while (i < lines.length) {
        const listLine = lines[i].trim();
        if (listLine.startsWith('- ') || listLine.startsWith('* ')) {
          items.push(listLine.substring(2));
          i++;
        } else if (listLine.match(/^\d+\.\s/)) {
          items.push(listLine.replace(/^\d+\.\s/, ''));
          i++;
        } else if (listLine === '') {
          i++;
          break;
        } else {
          break;
        }
      }
      
      if (items.length > 0) {
        elements.push({ type: 'list', content: '', items });
      }
      continue;
    }

    // Regular paragraph - collect until empty line or special element
    let paragraphText = line;
    i++;
    
    while (i < lines.length) {
      const nextLine = lines[i].trim();
      if (!nextLine || 
          nextLine.startsWith('#') || 
          nextLine.startsWith('|') || 
          nextLine.startsWith('-') && nextLine.length < 5 ||
          nextLine.match(/^={10,}$/)) {
        break;
      }
      paragraphText += ' ' + nextLine;
      i++;
    }

    elements.push({ type: 'paragraph', content: paragraphText });
  }

  return elements;
}

// Convert inline markdown formatting to TextRun objects
function parseInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)/s);
    if (boldMatch) {
      if (boldMatch[1]) {
        runs.push(...parseInlineFormatting(boldMatch[1]));
      }
      runs.push(new TextRun({ text: boldMatch[2], bold: true }));
      remaining = boldMatch[3];
      continue;
    }

    // Italic: *text*
    const italicMatch = remaining.match(/^(.*?)\*(.+?)\*(.*)/s);
    if (italicMatch) {
      if (italicMatch[1]) {
        runs.push(new TextRun({ text: italicMatch[1] }));
      }
      runs.push(new TextRun({ text: italicMatch[2], italics: true }));
      remaining = italicMatch[3];
      continue;
    }

    // Subscript for hypothesis notation: H₁, H₂, etc.
    const subscriptMatch = remaining.match(/^(.*?)(H[₀₁₂₃₄₅₆₇₈₉]+)(.*)/s);
    if (subscriptMatch) {
      if (subscriptMatch[1]) {
        runs.push(new TextRun({ text: subscriptMatch[1] }));
      }
      runs.push(new TextRun({ text: subscriptMatch[2], bold: true }));
      remaining = subscriptMatch[3];
      continue;
    }

    // No more formatting found, add remaining text
    runs.push(new TextRun({ text: remaining }));
    break;
  }

  return runs;
}

// Create a Word table from parsed rows
function createTable(rows: string[][]): Table {
  const tableRows = rows.map((cells, rowIndex) => {
    return new TableRow({
      children: cells.map(cell => {
        return new TableCell({
          children: [
            new Paragraph({
              children: parseInlineFormatting(cell),
              alignment: AlignmentType.LEFT,
            }),
          ],
          width: {
            size: Math.floor(9000 / cells.length),
            type: WidthType.DXA,
          },
          shading: rowIndex === 0 ? { fill: 'E8E8E8' } : undefined,
        });
      }),
    });
  });

  return new Table({
    rows: tableRows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
  });
}

// Main conversion function
export async function convertMarkdownToDocx(
  markdown: string,
  title: string,
  studentName?: string
): Promise<void> {
  const elements = parseMarkdown(markdown);
  const children: (Paragraph | Table)[] = [];

  for (const element of elements) {
    switch (element.type) {
      case 'heading1':
        children.push(
          new Paragraph({
            text: element.content.toUpperCase(),
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 },
          })
        );
        break;

      case 'heading2':
        children.push(
          new Paragraph({
            text: element.content,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
          })
        );
        break;

      case 'heading3':
        children.push(
          new Paragraph({
            text: element.content,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
          })
        );
        break;

      case 'heading4':
        children.push(
          new Paragraph({
            text: element.content,
            heading: HeadingLevel.HEADING_4,
            spacing: { before: 150, after: 75 },
          })
        );
        break;

      case 'paragraph':
        children.push(
          new Paragraph({
            children: parseInlineFormatting(element.content),
            spacing: { after: 200, line: 360 },
            alignment: AlignmentType.JUSTIFIED,
          })
        );
        break;

      case 'table':
        if (element.rows && element.rows.length > 0) {
          children.push(createTable(element.rows));
          children.push(new Paragraph({ text: '', spacing: { after: 200 } }));
        }
        break;

      case 'list':
        if (element.items) {
          for (const item of element.items) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: '• ' }),
                  ...parseInlineFormatting(item),
                ],
                spacing: { after: 100, line: 360 },
                indent: { left: 720 },
              })
            );
          }
          children.push(new Paragraph({ text: '', spacing: { after: 100 } }));
        }
        break;

      case 'pagebreak':
        children.push(
          new Paragraph({
            children: [new PageBreak()],
          })
        );
        break;
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Times New Roman',
            size: 24, // 12pt in half-points
          },
          paragraph: {
            spacing: { line: 360, after: 200 },
          },
        },
        heading1: {
          run: {
            font: 'Arial',
            size: 32, // 16pt
            bold: true,
          },
          paragraph: {
            spacing: { before: 400, after: 200 },
            alignment: AlignmentType.CENTER,
          },
        },
        heading2: {
          run: {
            font: 'Arial',
            size: 28, // 14pt
            bold: true,
          },
          paragraph: {
            spacing: { before: 300, after: 150 },
          },
        },
        heading3: {
          run: {
            font: 'Arial',
            size: 24, // 12pt
            bold: true,
          },
          paragraph: {
            spacing: { before: 200, after: 100 },
          },
        },
        heading4: {
          run: {
            font: 'Arial',
            size: 24, // 12pt
            bold: true,
            italics: true,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch in twips
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: title, size: 20, italics: true }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Page ', size: 20 }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: children,
      },
    ],
  });

  // Generate and save the file
  const blob = await Packer.toBlob(doc);
  const fileName = `Research_Proposal_${studentName?.replace(/\s+/g, '_') || 'Draft'}.docx`;
  saveAs(blob, fileName);
}

