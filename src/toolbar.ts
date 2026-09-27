import type { EditorView } from '@codemirror/view';
import { defaultMarkdown } from './default-markdown';

export function initToolbar(getView: () => EditorView, getMarkdown: () => string) {
  const openBtn = document.getElementById('open-btn')!;
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  const copyBtn = document.getElementById('copy-btn')!;
  const exportBtn = document.getElementById('export-btn')!;
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

  exportBtn.addEventListener('click', async () => {
    const preview = document.getElementById('preview')!;
    const { default: html2pdf } = await import('html2pdf.js');
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

  resetBtn.addEventListener('click', () => {
    const view = getView();
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: defaultMarkdown },
    });
  });
}
