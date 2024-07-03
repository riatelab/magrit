import { DefaultTheme, defineConfig } from 'vitepress';

function sidebarFr(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'Introduction',
      collapsed: false,
      items: [
        { text: 'Présentation de l\'application', link: '/documentation' },
        { text: 'Exemples de cartes', link: '/map-examples' },
        { text: 'Passer à Magrit v2', link: '/upgrade-to-v2' },
        { text: 'Accéder à l\'application / Installation', link: '/access-the-app' },
      ]
    },
    {
      text: 'Guide de l\'interface',
      collapsed: true,
      items: [
        { text: 'Description de l\'interface', link: 'ui-description' },
        { text: 'Import des données', link: '/data-import' },
        { text: 'Jeux de données d\'exemples', link: '/example-datasets' },
        { text: 'Paramètres de la carte', link: '/map-configuration' },
        { text: 'Choix d\'une projection cartographique', link: '/projection' },
        { text: 'Gestionnaire de couches', link: '/layer-manager' },
        { text: 'Typage des variables', link: '/typing' },
        { text: 'Tableau de données', link: '/data-table' },
        { text: 'Propriétés de la couche', link: '/layer-properties' },
        { text: 'Propriété de la légende', link: '/legend-properties' },
        { text: 'Mise en page et habillage de la carte', link: '/layout-features' },
        { text: 'Création d\'une représentation', link: '/layer-creation' }
      ]
    },
    {
      text: 'Fonctionnalités de représentation et d\'analyse',
      collapsed: true,
      items: [
        { text: 'Choroplèthe', link: '/functionalities/choropleth' },
        { text: 'Discrétisation', link: '/functionalities/classification' },
        { text: 'Symboles proportionnels', link: '/functionalities/proportional-symbols' },
        { text: 'Choroplèthe catégorielle', link: '/functionalities/categorical-choropleth' },
        { text: 'Agrégation d\'un semis de points', link: '/functionalities/point-aggregation' },
        { text: 'Étiquettes', link: '/functionalities/labels' },
        { text: 'Carroyage', link: '/functionalities/gridding' },
        { text: 'Cartogramme', link: '/functionalities/cartogram' },
        { text: 'Discontinuité', link: '/functionalities/discontinuity' },
        { text: 'Carte lissée', link: '/functionalities/smoothed-map' },
        { text: 'Champignon (deux stocks)', link: '/functionalities/mushroom-two-stocks' },
        { text: 'Liens / Flux', link: '/functionalities/links-flows' },
        { text: 'Pictogrammes (catégoriels)', link: '/functionalities/categorical-pictograms' },
        { text: 'Régression linéaire simple', link: '/functionalities/simple-linear-regression' },
        { text: 'Agrégation', link: '/functionalities/aggregation' },
        { text: 'Généralisation', link: '/functionalities/simplification' },
        { text: 'Sélection attributaire', link: '/functionalities/selection-by-attribute' },
      ]
    },
    { text: 'Questions fréquemment posées', link: '/faq' },
    { text: 'Historique des changements', link: '/changelog' },
    { text: 'Licences', link: '/licenses' },
    { text: 'L\'équipe de Magrit', link: '/team' },
  ];
}

function sidebarEn(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'Introduction',
      collapsed: false,
      items: [
        { text: 'Application overview', link: '/en/documentation' },
        { text: 'Map examples', link: '/en/map-examples' },
        { text: 'Upgrading to Magrit v2', link: '/en/upgrade-to-v2' },
        { text: 'Accessing the application / Installation', link: '/en/access-the-app' },
      ]
    },
    {
      text: 'Interface guide',
      collapsed: true,
      items: [
        { text: 'User interface description', link: '/en/ui-description' },
        { text: 'Data import', link: '/en/data-import' },
        { text: 'Example datasets', link: '/en/example-datasets' },
        { text: 'Map settings', link: '/en/map-configuration' },
        { text: 'Choosing a map projection', link: '/en/projection' },
        { text: 'Layer manager', link: '/en/layer-manager' },
        { text: 'Variable typing', link: '/en/typing' },
        { text: 'Data table', link: '/en/data-table' },
        { text: 'Layer properties', link: '/en/layer-properties' },
        { text: 'Legend properties', link: '/en/legend-properties' },
        { text: 'Map layout features', link: '/en/layout-features' },
        { text: 'Creating a portrayal', link: '/en/layer-creation' },
      ]
    },
    {
      text: 'Representation and analysis features',
      collapsed: true,
      items: [
        { text: 'Choropleth', link: '/en/functionalities/choropleth' },
        { text: 'Classification', link: '/en/functionalities/classification' },
        { text: 'Proportional symbols', link: '/en/functionalities/proportional-symbols' },
        { text: 'Categorical choropleth', link: '/en/functionalities/categorical-choropleth' },
        { text: 'Point aggregation', link: '/en/functionalities/point-aggregation' },
        { text: 'Labels', link: '/en/functionalities/labels' },
        { text: 'Gridding', link: '/en/functionalities/gridding' },
        { text: 'Cartogram', link: '/en/functionalities/cartogram' },
        { text: 'Discontinuity', link: '/en/functionalities/discontinuity' },
        { text: 'Smoothed map', link: '/en/functionalities/smoothed-map' },
        { text: 'Mushroom (two stocks)', link: '/en/functionalities/mushroom-two-stocks' },
        { text: 'Links / Flows', link: '/en/functionalities/links-flows' },
        { text: 'Pictograms (categorical)', link: '/en/functionalities/categorical-pictograms' },
        { text: 'Simple linear regression', link: '/en/functionalities/simple-linear-regression' },
        { text: 'Aggregation', link: '/en/functionalities/aggregation' },
        { text: 'Simplification', link: '/en/functionalities/simplification' },
        { text: 'Selection by attribute', link: '/en/functionalities/selection-by-attribute' },
      ]
    },
    { text: 'Frequently asked questions', link: '/en/faq' },
    { text: 'Changelog', link: '/en/changelog' },
    { text: 'Licenses', link: '/en/licenses' },
    { text: 'Team', link: '/en/team' },
  ];
}


// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Magrit",
  description: "Magrit",
  // base: './',
  vite: {
    publicDir: 'public',
  },
  locales: {
    root: {
      label: 'French',
      title: 'Magrit - Cartographie thématique',
      description: 'Magrit est une application Web de cartographie thématique',
      lang: 'fr',
      themeConfig: {
        sidebar: {
          '/': sidebarFr(),
        },
        footer: {
          message: 'Publié selon les termes de la GNU General Public License v3.0 ou ultérieure.',
          copyright: 'Copyright © 2024-present CNRS (UAR 2414 RIATE)'
        },
        nav: [
          { text: 'Accéder à l\'application', link: '/app/', target: '_self' },
        ]
      },
    },
    en: {
      label: 'English',
      title: 'Magrit - Thematic cartography',
      description: 'Magrit is a thematic cartography Web application',
      lang: 'en',
      link: '/en/',
      themeConfig: {
        sidebar: {
          '/en/': sidebarEn(),
        },
        footer: {
          message: 'Released under the GNU General Public License v3.0 or later.',
          copyright: 'Copyright © 2024-present CNRS (UAR 2414 RIATE)'
        },
        nav: [
          { text: 'Access the application', link: '/app/', target: '_self' },
        ]
      },
    }
  },
  themeConfig: {
    logo: '/logo_typo_picto_green.svg',
    siteTitle: false, // 'Magrit',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/riatelab/magrit' }
    ],
    search: {
      provider: 'local'
    },
    docFooter: {
      prev: false,
      next: false,
    },
  },
})
