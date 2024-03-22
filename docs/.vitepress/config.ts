import { DefaultTheme, defineConfig } from 'vitepress';

function sidebarFr(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'Introduction',
      collapsed: false,
      items: [
        { text: 'Passer à Magrit v2', link: 'what-is-vitepress' },
        { text: 'Philosophie de l\'application', link: 'getting-started' },
      ]
    },
    {
      text: 'Guide utilisateur',
      collapsed: false,
      items: [
        { text: 'Description de l\'interface', link: 'markdown' },
        { text: 'Import des données', link: 'data-import' },
        { text: 'Gestionnaire de couches', link: 'layer-manager' },
      ]
    },
    {
      text: 'Description des fonctionnalités de représentation et d\'analyse',
      collapsed: false,
      items: [
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
        { text: 'Upgrade to Magrit v2', link: 'what-is-vitepress' },
        { text: 'Application philosophy', link: 'getting-started' },
      ]
    },
    {
      text: 'User manual',
      collapsed: false,
      items: [
        { text: 'User interface description', link: 'markdown' },
        { text: 'Data import', link: 'en/data-import' },
        { text: 'Layer manager', link: 'en/layer-manager' },
      ]
    },
    {
      text: 'Description of representation and analysis features',
      collapsed: false,
      items: [
      ]
    },
  ];
}


// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Magrit Documentation",
  description: "Magrit Documentation",
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
