import './style.css';
import 'highlight.js/styles/github.css';
import { createEditor, recreateEditor } from './editor';
import { renderMarkdown } from './preview';
import { defaultMarkdown } from './default-markdown';
import { initToolbar } from './toolbar';
import { initSplitPane } from './split-pane';
import { initSyncScroll, setSyncEnabled } from './sync-scroll';
import { initTheme, getStoredTheme } from './theme';

const editorPane = document.getElementById('editor-pane')!;
const previewPane = document.getElementById('preview-pane')!;
const preview = document.getElementById('preview')!;
const container = document.getElementById('container')!;
const divider = document.getElementById('divider')!;
const syncCb = document.getElementById('sync-scroll-cb') as HTMLInputElement;

let editorView = createEditor(editorPane, defaultMarkdown, onDocChange, getStoredTheme());

function onDocChange(doc: string) {
  renderMarkdown(doc, preview);
}

renderMarkdown(defaultMarkdown, preview);

initToolbar(() => editorView, () => editorView.state.doc.toString());
initSplitPane(container, divider, editorPane, previewPane);

const cmScroller = editorPane.querySelector('.cm-scroller') as HTMLElement;
if (cmScroller) {
  initSyncScroll(cmScroller, previewPane);
}

syncCb.addEventListener('change', () => setSyncEnabled(syncCb.checked));

initTheme((theme) => {
  editorView = recreateEditor(editorView, editorPane, onDocChange, theme);
  const newScroller = editorPane.querySelector('.cm-scroller') as HTMLElement;
  if (newScroller) {
    initSyncScroll(newScroller, previewPane);
  }
});
