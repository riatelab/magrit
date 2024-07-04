export const isDarkMode = () => document
  .querySelector('html')
  ?.classList.contains('theme-dark') ?? false;

export const enableDarkMode = () => {
  const body = document.querySelector('html');
  if (body) {
    body.classList.remove('theme-light');
    body.classList.add('theme-dark');
  }
  localStorage.setItem('selected-theme', 'dark');
};

export const enableLightMode = () => {
  const body = document.querySelector('html');
  if (body) {
    body.classList.remove('theme-dark');
    body.classList.add('theme-light');
  }
  localStorage.setItem('selected-theme', 'light');
};

export const toggleDarkMode = () => {
  if (isDarkMode()) {
    enableLightMode();
  } else {
    enableDarkMode();
  }
};

export const userPrefersDarkMode = () => {
  const stored = localStorage.getItem('selected-theme');
  if (stored) {
    return stored === 'dark';
  }
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const listenToPrefersDarkMode = () => {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (e.matches) {
      enableDarkMode();
    } else {
      enableLightMode();
    }
  });
};

export const initializeLightDarkMode = () => {
  listenToPrefersDarkMode();
  if (userPrefersDarkMode()) {
    enableDarkMode();
  } else {
    enableLightMode();
  }
};
