let enabled = true;
let syncing = false;

export function setSyncEnabled(value: boolean) {
  enabled = value;
}

export function initSyncScroll(editorScroller: HTMLElement, previewPane: HTMLElement) {
  const handler = (source: HTMLElement, target: HTMLElement) => {
    if (!enabled || syncing) return;
    syncing = true;
    const ratio = source.scrollTop / (source.scrollHeight - source.clientHeight || 1);
    target.scrollTop = ratio * (target.scrollHeight - target.clientHeight);
    requestAnimationFrame(() => { syncing = false; });
  };

  editorScroller.addEventListener('scroll', () => handler(editorScroller, previewPane), { passive: true });
  previewPane.addEventListener('scroll', () => handler(previewPane, editorScroller), { passive: true });
}
