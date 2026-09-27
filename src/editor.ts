import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState, type Extension } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';
import type { Theme } from './theme';

const lightTheme = EditorView.theme({
  '&': { height: '100%', fontSize: '14px' },
  '.cm-scroller': { overflow: 'auto', fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace" },
  '.cm-content': { padding: '12px 0' },
  '.cm-gutters': { background: '#f6f8fa', borderRight: '1px solid #d0d7de' },
});

const darkThemeExt = EditorView.theme({
  '&': { height: '100%', fontSize: '14px' },
  '.cm-scroller': { overflow: 'auto', fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace" },
  '.cm-content': { padding: '12px 0' },
});

function buildExtensions(onChange: (doc: string) => void, theme: Theme): Extension[] {
  const base: Extension[] = [
    lineNumbers(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    history(),
    bracketMatching(),
    markdown({ codeLanguages: languages }),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange(update.state.doc.toString());
      }
    }),
  ];
  if (theme === 'dark') {
    base.push(oneDark, darkThemeExt);
  } else {
    base.push(lightTheme);
  }
  return base;
}

export function createEditor(
  parent: HTMLElement,
  initialDoc: string,
  onChange: (doc: string) => void,
  theme: Theme,
): EditorView {
  const state = EditorState.create({
    doc: initialDoc,
    extensions: buildExtensions(onChange, theme),
  });
  return new EditorView({ state, parent });
}

export function recreateEditor(
  view: EditorView,
  parent: HTMLElement,
  onChange: (doc: string) => void,
  theme: Theme,
): EditorView {
  const doc = view.state.doc.toString();
  view.destroy();
  return createEditor(parent, doc, onChange, theme);
}
