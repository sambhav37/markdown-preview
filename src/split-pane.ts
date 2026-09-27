export function initSplitPane(
  container: HTMLElement,
  divider: HTMLElement,
  editorPane: HTMLElement,
  previewPane: HTMLElement,
) {
  let dragging = false;

  divider.addEventListener('mousedown', (e) => {
    e.preventDefault();
    dragging = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const rect = container.getBoundingClientRect();
    const offset = e.clientX - rect.left;
    const pct = (offset / rect.width) * 100;
    const clamped = Math.max(20, Math.min(80, pct));
    editorPane.style.width = `${clamped}%`;
    previewPane.style.width = `${100 - clamped}%`;
  });

  document.addEventListener('mouseup', () => {
    if (dragging) {
      dragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });
}
