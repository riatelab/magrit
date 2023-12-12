import '../styles/Welcome.css';
import { A } from '@solidjs/router';
import { useI18nContext } from '../i18n/i18n-solid';

export default function WelcomeContent() {
  const { LL } = useI18nContext();
  return <main class="landing-page container is-widescreen">
    <h2 class="has-text-centered m-2">Magrit - Cartographie thématique</h2>
    <div class="has-text-centered mt-4 mb-6">
      <A href="/app" class="button is-primary has-text-centered">{ LL().StartApplication() }</A>
    </div>
    <div class="intro-section-wrapper columns is-desktop">
      <div class="intro-section column">
        <h3>Une solution de cartographie thématique</h3>
        <p>Les fonctionnalités classiques de cartographie thématique couplées à
          des méthodes innovantes (symboles proportionnels, cartes choroplèthes,
          cartes des discontinuités, cartes lissées, carroyages, anamorphose,
          etc.).</p>
      </div>
      <div class="intro-section column">
        <h3>Une solution de cartographie thématique</h3>
        <p>Les fonctionnalités classiques de cartographie thématique couplées à
          des méthodes innovantes (symboles proportionnels, cartes choroplèthes,
          cartes des discontinuités, cartes lissées, carroyages, anamorphose,
          etc.).</p>
      </div>
      <div class="intro-section column">
        <h3>Une solution de cartographie thématique</h3>
        <p>Les fonctionnalités classiques de cartographie thématique couplées à
          des méthodes innovantes (symboles proportionnels, cartes choroplèthes,
          cartes des discontinuités, cartes lissées, carroyages, anamorphose,
          etc.).</p>
      </div>
    </div>
    <div class="intro-section-wrapper columns is-desktop">
      <div class="intro-section column">
        <h3>Une solution de cartographie thématique</h3>
        <p>Les fonctionnalités classiques de cartographie thématique couplées à
          des méthodes innovantes (symboles proportionnels, cartes choroplèthes,
          cartes des discontinuités, cartes lissées, carroyages, anamorphose,
          etc.).</p>
      </div>
      <div class="intro-section column">
        <h3>Une solution de cartographie thématique</h3>
        <p>Les fonctionnalités classiques de cartographie thématique couplées à
          des méthodes innovantes (symboles proportionnels, cartes choroplèthes,
          cartes des discontinuités, cartes lissées, carroyages, anamorphose,
          etc.).</p>
      </div>
      <div class="intro-section column">
        <h3>Une solution de cartographie thématique</h3>
        <p>Les fonctionnalités classiques de cartographie thématique couplées à
          des méthodes innovantes (symboles proportionnels, cartes choroplèthes,
          cartes des discontinuités, cartes lissées, carroyages, anamorphose,
          etc.).</p>
      </div>
      <div class="intro-section"></div>
      <div class="intro-section"></div>
      <div class="intro-section"></div>
    </div>
  </main>;
}
