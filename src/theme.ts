const THEME_KEY = 'markdown-preview-theme';

export type Theme = 'light' | 'dark';

export function getStoredTheme(): Theme {
  return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

export function initTheme(cb: (theme: Theme) => void) {
  const checkbox = document.getElementById('dark-mode-cb') as HTMLInputElement;
  const stored = getStoredTheme();
  applyTheme(stored);
  checkbox.checked = stored === 'dark';

  checkbox.addEventListener('change', () => {
    const theme: Theme = checkbox.checked ? 'dark' : 'light';
    applyTheme(theme);
    cb(theme);
  });
}
