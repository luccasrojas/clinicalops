import jsPDF from 'jspdf';
import HTMLDocx from 'html-docx-js/dist/html-docx';
import type { JsonValue } from '../types/editor';

const formatSection = (value: JsonValue, level = 0): string => {
  if (value === null || value === undefined) return '';

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return `${'&nbsp;'.repeat(level * 4)}${value}<br/>`;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => `${'&nbsp;'.repeat(level * 4)}• ${formatSection(item, level + 1)}`)
      .join('');
  }

  return Object.entries(value)
    .map(
      ([key, val]) =>
        `<strong>${key.replace(/_/g, ' ').toUpperCase()}</strong><br/>${formatSection(val, level + 1)}`
    )
    .join('<br/>');
};

export const downloadAsPdf = (data: JsonValue, fileName: string) => {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const text = formatPlainText(data);
  const lineHeight = 18;
  const maxWidth = 500;
  const lines = doc.splitTextToSize(text, maxWidth);

  lines.forEach((line, index) => {
    doc.text(line, 40, 60 + index * lineHeight);
  });

  doc.save(`${fileName}.pdf`);
};

export const downloadAsDocx = (data: JsonValue, fileName: string) => {
  const html = `<div>${formatSection(data)}</div>`;
  const blob = HTMLDocx.asBlob(html);
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const formatPlainText = (value: JsonValue, level = 0): string => {
  if (value === null || value === undefined) return '';

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return `${' '.repeat(level * 2)}${value}`;
  }

  if (Array.isArray(value)) {
    return value.map((item) => `${' '.repeat(level * 2)}- ${formatPlainText(item, level + 1)}`).join('\n');
  }

  return Object.entries(value)
    .map(
      ([key, val]) =>
        `${' '.repeat(level * 2)}${key.replace(/_/g, ' ').toUpperCase()}:\n${formatPlainText(val, level + 1)}`
    )
    .join('\n');
};
