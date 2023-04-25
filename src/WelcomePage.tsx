import { JSX } from 'solid-js';
import { HeaderBarWelcome } from './Headers.tsx';
import WelcomeContent from './WelcomeContent.tsx';
import { useI18nContext } from './i18n/i18n-solid';

const WelcomePage: () => JSX.Element = () => {
  const { setLocale } = useI18nContext();
  setLocale('en');

  return <>
      <HeaderBarWelcome/>
      <WelcomeContent/>
  </>;
};

export default WelcomePage;
