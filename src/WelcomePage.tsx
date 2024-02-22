import { JSX, onMount } from 'solid-js';
import { HeaderBarWelcome } from './components/Headers.tsx';
import WelcomeContent from './views/WelcomeContent.tsx';
import { useI18nContext } from './i18n/i18n-solid';
import { toggleDarkMode } from './helpers/darkmode';

const WelcomePage: () => JSX.Element = () => {
  const { setLocale } = useI18nContext();
  setLocale('en');

  onMount(() => {
    // Add event listener to handle the light / dark mode
    document.getElementById('button-night-day')
      ?.addEventListener('click', toggleDarkMode);
  });

  return <>
      <HeaderBarWelcome/>
      <WelcomeContent/>
  </>;
};

export default WelcomePage;
