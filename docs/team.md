<script setup>
import { VPTeamMembers } from 'vitepress/theme'

const members = [
  {
    avatar: 'https://avatars.githubusercontent.com/u/12172162?v=4',
    name: 'Matthieu Viry',
    title: 'Co-creator & Developer',
    links: [
      { icon: 'github', link: 'https://github.com/mthh' },
      { icon: 'mastodon', link: 'https://fosstodon.org/@mthv' },
      // { icon: 'orcid', link: 'https://orcid.org/0000-0002-0693-8556' }
    ]
  },
  {
    avatar: 'https://avatars.githubusercontent.com/u/3041254?v=4',
    name: 'Timothée Giraud',
    title: 'Co-creator',
    links: [
      { icon: 'github', link: 'https://github.com/rcarto' },
      { icon: 'mastodon', link: 'https://fosstodon.org/@rcarto' },
      // { icon: 'orcid', link: 'https://orcid.org/0000-0002-1932-3323' }
    ]
  },
]
</script>

# L'équipe de Magrit

Magrit est conçu et développé au sein de l'UAR RIATE (CNRS / Université Paris Cité) par :

<VPTeamMembers size="small" :members="members" />

Des contributions ponctuelles ont également été réalisées par d'autres membres de la communauté.