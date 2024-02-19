export const isDarkMode = () => document
  .querySelector('html')
  ?.classList.contains('is-dark-mode') ?? false;

export const enableDarkMode = () => {
  const body = document.querySelector('html');
  if (body) {
    body.classList.add('is-dark-mode');
  }
};

export const enableLightMode = () => {
  const body = document.querySelector('html');
  if (body) {
    body.classList.remove('is-dark-mode');
  }
};

export const toggleDarkMode = () => {
  const body = document.querySelector('html');
  if (body) {
    body.classList.toggle('is-dark-mode');
  }
};

export const userPrefersDarkMode = () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

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
