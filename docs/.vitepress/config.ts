import { DefaultTheme, defineConfig } from 'vitepress';

function sidebarFr(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'Introduction',
      collapsed: false,
      items: [
        { text: 'Philosophie de l\'application', link: 'getting-started' },
        { text: 'Exemples de cartes', link: 'examples' },
        { text: 'Passer à Magrit v2', link: 'what-is-vitepress' },
        { text: 'Accéder à l\'application / Installation', link: 'access' },
      ]
    },
    {
      text: 'Guide de l\'interface',
      collapsed: false,
      items: [
        { text: 'Description de l\'interface', link: 'markdown' },
        { text: 'Import des données', link: 'data-import' },
        { text: 'Paramètres de la carte', link: 'layer-manager' },
        { text: 'Gestionnaire de couches', link: 'layer-manager' },
        { text: 'Typage des variables', link: 'layer-manager' },
        { text: 'Tableau de données', link: 'layer-manager' },
        { text: 'Propriétés de la couche', link: 'layer-manager' },
      ]
    },
    {
      text: 'Fonctionnalités de représentation et d\'analyse',
      collapsed: false,
      items: [
        { text: 'Choroplèthe', link: 'functionalities/choropleth' },
        { text: 'Symboles proportionnels', link: 'functionalities/proportional-symbols' },
        { text: 'Choroplèthe catégorielle', link: 'functionalities/categorical-choropleth' },
        { text: 'Aggrégation d\'un semis de points', link: 'functionalities/point-aggregation' },
      ]
    },
  ];
}

function sidebarEn(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'Introduction',
      collapsed: false,
      items: [
        { text: 'Application philosophy', link: 'getting-started' },
        { text: 'Map examples', link: 'examples' },
        { text: 'Upgrade to Magrit v2', link: 'what-is-vitepress' },
        { text: 'Access the application / Installation', link: 'access' },
      ]
    },
    {
      text: 'Interface guide',
      collapsed: false,
      items: [
        { text: 'User interface description', link: 'markdown' },
        { text: 'Data import', link: 'en/data-import' },
        { text: 'Map settings', link: 'en/layer-manager' },
        { text: 'Layer manager', link: 'en/layer-manager' },
        { text: 'Variable typing', link: 'en/layer-manager' },
        { text: 'Data table', link: 'en/layer-manager' },
        { text: 'Layer properties', link: 'en/layer-manager' },
      ]
    },
    {
      text: 'Representation and analysis features',
      collapsed: false,
      items: [
        { text: 'Choropleth', link: 'en/functionalities/choropleth' },
        { text: 'Proportional symbols', link: 'en/functionalities/proportional-symbols' },
        { text: 'Categorical choropleth', link: 'en/functionalities/categorical-choropleth' },
        { text: 'Point aggregation', link: 'en/functionalities/point-aggregation' },
      ]
    },
  ];
}


// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Magrit Documentation",
  description: "Magrit Documentation",
  base: '/docs/',
  locales: {
    root: {
      label: 'French',
      lang: 'fr',
      themeConfig: {
        sidebar: {
          '/': sidebarFr(),
        },
      },
    },
    en: {
      label: 'English',
      lang: 'en',
      link: '/en/',
      themeConfig: {
        sidebar: {
          '/en/': sidebarEn(),
        },
      }
    }
  },
  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/riatelab/magrit' }
    ],
  },
})
