<script setup>
import { VPTeamMembers } from 'vitepress/theme';

const linkSvg = '<svg fill="currentColor" stroke-width="0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" height="1em" width="1em" style="overflow: visible; color: currentcolor;"><path d="M574 665.4a8.03 8.03 0 0 0-11.3 0L446.5 781.6c-53.8 53.8-144.6 59.5-204 0-59.5-59.5-53.8-150.2 0-204l116.2-116.2c3.1-3.1 3.1-8.2 0-11.3l-39.8-39.8a8.03 8.03 0 0 0-11.3 0L191.4 526.5c-84.6 84.6-84.6 221.5 0 306s221.5 84.6 306 0l116.2-116.2c3.1-3.1 3.1-8.2 0-11.3L574 665.4zm258.6-474c-84.6-84.6-221.5-84.6-306 0L410.3 307.6a8.03 8.03 0 0 0 0 11.3l39.7 39.7c3.1 3.1 8.2 3.1 11.3 0l116.2-116.2c53.8-53.8 144.6-59.5 204 0 59.5 59.5 53.8 150.2 0 204L665.3 562.6a8.03 8.03 0 0 0 0 11.3l39.8 39.8c3.1 3.1 8.2 3.1 11.3 0l116.2-116.2c84.5-84.6 84.5-221.5 0-306.1zM610.1 372.3a8.03 8.03 0 0 0-11.3 0L372.3 598.7a8.03 8.03 0 0 0 0 11.3l39.6 39.6c3.1 3.1 8.2 3.1 11.3 0l226.4-226.4c3.1-3.1 3.1-8.2 0-11.3l-39.5-39.6z"></path></svg>';
const orcidSvg = '<svg fill="currentColor" stroke-width="0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="1em" width="1em" style="overflow: visible; color: currentcolor;"><path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.95.95 0 0 1-.947-.947c0-.525.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.025-5.325 5.025h-3.919V7.416zm1.444 1.303v7.444h2.297c3.272 0 4.022-2.484 4.022-3.722 0-2.016-1.284-3.722-4.097-3.722h-2.222z"></path></svg>';

const authors = [
  {
    avatar: 'https://avatars.githubusercontent.com/u/12172162?v=4',
    name: 'Matthieu Viry',
    title: 'Software engineer',
    org: 'CNRS',
    desc: 'Co-creator & developer',
    links: [
      { icon: 'github', link: 'https://github.com/mthh' },
      { icon: 'mastodon', link: 'https://fosstodon.org/@mthv' },
      { icon: { svg: orcidSvg }, link: 'https://orcid.org/0000-0002-0693-8556' },
      { icon: { svg: linkSvg }, link: 'https://mthh.github.io/' }
    ],
  },
  {
    avatar: 'https://avatars.githubusercontent.com/u/3041254?v=4',
    name: 'Timothée Giraud',
    title: 'GIS Engineer',
    org: 'CNRS',
    desc: 'Co-creator',
    links: [
      { icon: 'github', link: 'https://github.com/rcarto' },
      { icon: 'mastodon', link: 'https://fosstodon.org/@rcarto' },
      { icon: { svg: orcidSvg }, link: 'https://orcid.org/0000-0002-1932-3323' },
      { icon: { svg: linkSvg }, link: 'https://rcarto.github.io/' }
    ],
  },
];

const contributors = [
  {
    avatar: 'https://avatars.githubusercontent.com/u/17565776?v=4',
    name: 'Ronan Ysebaert',
    title: 'GIS Engineer',
    org: 'Univ. Paris Cité',
    desc: 'Contributor (example datasets)',
    links: [
      { icon: 'github', link: 'https://github.com/rysebaert' },
      { icon: { svg: orcidSvg }, link: 'https://orcid.org/0000-0002-7344-5911' }
    ],
  },
];
</script>

# Magrit team

Magrit is designed and developed within the UAR RIATE (CNRS / Université Paris Cité) by :

<VPTeamMembers size="small" :members="authors" />

<VPTeamMembers size="small" :members="contributors" />

Occasional contributions were also made by various users: RIATE members (or former members), ESR members and users.
We thank them for their involvement and support :heart:.