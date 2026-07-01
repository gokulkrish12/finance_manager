import { Parser } from 'json2csv';
import PdfPrinter from 'pdfmake';

/**
 * Convert an array of flat objects to a CSV string.
 * `fields` optionally pins column order/labels.
 */
export const toCSV = (rows, fields) => {
  const parser = new Parser(fields ? { fields } : {});
  return parser.parse(rows);
};

// PDFKit ships the 14 standard PDF fonts (Helvetica, etc.) built in,
// so we can generate PDFs on the server with NO external .ttf files.
const printer = new PdfPrinter({
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
});

/**
 * Render a pdfmake docDefinition to a Buffer.
 */
export const renderPDF = (docDefinition) =>
  new Promise((resolve, reject) => {
    const doc = printer.createPdfKitDocument({
      defaultStyle: { font: 'Helvetica', fontSize: 10 },
      ...docDefinition,
    });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });

/**
 * Build a reusable report docDefinition: title, meta line, summary rows, and a table.
 */
export const buildReportDoc = ({ title, subtitle, summary = [], table, currency = 'USD' }) => {
  const content = [
    { text: title, style: 'title' },
    subtitle ? { text: subtitle, style: 'subtitle', margin: [0, 0, 0, 10] } : null,
  ].filter(Boolean);

  if (summary.length) {
    content.push({
      table: {
        widths: ['*', 'auto'],
        body: summary.map(([k, v]) => [
          { text: k, bold: true },
          { text: v, alignment: 'right' },
        ]),
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 16],
    });
  }

  if (table) {
    content.push({
      table: {
        headerRows: 1,
        widths: table.widths,
        body: [
          table.headers.map((h) => ({ text: h, style: 'th' })),
          ...table.rows,
        ],
      },
      layout: {
        fillColor: (rowIndex) => (rowIndex === 0 ? '#4f46e5' : rowIndex % 2 === 0 ? '#f4f4f5' : null),
      },
    });
  }

  return {
    pageMargins: [40, 50, 40, 50],
    content,
    styles: {
      title: { fontSize: 20, bold: true, color: '#4f46e5' },
      subtitle: { fontSize: 10, color: '#64748b' },
      th: { bold: true, color: '#ffffff', fontSize: 10 },
    },
    footer: (current, total) => ({
      text: `Page ${current} of ${total}`,
      alignment: 'center',
      fontSize: 8,
      color: '#94a3b8',
      margin: [0, 10, 0, 0],
    }),
  };
};

export const money = (n, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n || 0);
  } catch {
    return `${currency} ${(n || 0).toFixed(2)}`;
  }
};
