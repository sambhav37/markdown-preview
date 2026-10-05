import type { EditorView } from '@codemirror/view';
import { defaultMarkdown } from './default-markdown';

function exportPdf() {
  const preview = document.getElementById('preview')!;
  import('html2pdf.js').then(({ default: html2pdf }) => {
    html2pdf()
      .set({
        margin: 10,
        filename: 'markdown-export.pdf',
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(preview)
      .save();
  });
}

function exportDocx() {
  const preview = document.getElementById('preview')!;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#0d1117' : '#ffffff';
  const fg = isDark ? '#c9d1d9' : '#1f2328';

  const content = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8">
    <style>
      body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; color: ${fg}; background: ${bg}; line-height: 1.6; padding: 20px; }
      h1 { font-size: 2em; border-bottom: 1px solid #d0d7de; padding-bottom: .3em; }
      h2 { font-size: 1.5em; border-bottom: 1px solid #d0d7de; padding-bottom: .3em; }
      h3 { font-size: 1.25em; }
      pre { background: #f6f8fa; padding: 16px; border-radius: 6px; font-size: 85%; }
      code { font-family: Consolas, monospace; font-size: 85%; }
      blockquote { border-left: 4px solid #d0d7de; padding-left: 16px; color: #656d76; }
      table { border-collapse: collapse; width: 100%; }
      th, td { padding: 6px 13px; border: 1px solid #d0d7de; }
      th { font-weight: 600; background: #f6f8fa; }
      img { max-width: 100%; }
    </style></head>
    <body>${preview.innerHTML}</body>
    </html>`;

  const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'markdown-export.doc';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function initToolbar(getView: () => EditorView, getMarkdown: () => string) {
  const openBtn = document.getElementById('open-btn')!;
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  const copyBtn = document.getElementById('copy-btn')!;
  const exportBtn = document.getElementById('export-btn')!;
  const exportToggle = document.getElementById('export-toggle')!;
  const exportMenu = document.getElementById('export-menu')!;
  const resetBtn = document.getElementById('reset-btn')!;

  openBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const view = getView();
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: text },
      });
    };
    reader.readAsText(file);
    fileInput.value = '';
  });

  copyBtn.addEventListener('click', async () => {
    await navigator.clipboard.writeText(getMarkdown());
    const orig = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => { copyBtn.textContent = orig; }, 1500);
  });

  // Default export button triggers PDF
  exportBtn.addEventListener('click', () => exportPdf());

  // Dropdown toggle
  exportToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    exportMenu.classList.toggle('open');
  });

  // Menu items
  exportMenu.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('button[data-format]') as HTMLElement | null;
    if (!target) return;
    exportMenu.classList.remove('open');
    const format = target.dataset.format;
    if (format === 'pdf') exportPdf();
    else if (format === 'docx') exportDocx();
  });

  // Close dropdown on outside click
  document.addEventListener('click', () => exportMenu.classList.remove('open'));

  resetBtn.addEventListener('click', () => {
    const view = getView();
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: defaultMarkdown },
    });
  });
}
