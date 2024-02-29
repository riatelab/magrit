export const isDarkMode = () => document
  .querySelector('html')
  ?.classList.contains('theme-dark') ?? false;

export const enableDarkMode = () => {
  const body = document.querySelector('html');
  if (body) {
    body.classList.add('theme-dark');
  }
};

export const enableLightMode = () => {
  const body = document.querySelector('html');
  if (body) {
    body.classList.remove('theme-dark');
  }
};

export const toggleDarkMode = () => {
  const body = document.querySelector('html');
  if (body) {
    body.classList.toggle('theme-dark');
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
  // Todo: we should store somewhere (localStorage or cookie?) the user preference
  //    and use it to initialize the mode if it exists
  listenToPrefersDarkMode();
  if (userPrefersDarkMode()) {
    enableDarkMode();
  } else {
    enableLightMode();
  }
};
