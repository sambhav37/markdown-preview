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

async function exportDocx() {
  const preview = document.getElementById('preview')!;
  const { generateDocx } = await import('./html-to-docx');
  const blob = await generateDocx(preview);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'markdown-export.docx';
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
