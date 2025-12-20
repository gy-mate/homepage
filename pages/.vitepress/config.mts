import { defineConfig } from 'vitepress'


export default defineConfig({
  title: "Máté Gyöngyösi",
  description: "Máté's website",
  
  cleanUrls: true,

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Projects', link: '/projects/kalauz' },
      { text: 'Achievements', link: '/achievements' },
      { text: 'Journeys', link: '/journeys' },
      { text: 'Misc', link: '/misc/commands' },
      { text: 'CV', link: '/cv' }
    ],

    search: {
      provider: 'local'
    },

    socialLinks: [
      { icon: 'element', link: 'https://matrix.to/#/@gymate:grin.hu' },
      { icon: 'telegram', link: 'https://t.me/gymate' },
      { icon: 'mastodon', link: 'https://mastodon.grin.hu/@gymate' },
      { icon: 'linkedin', link: 'https://linkedin.com/in/gymate/' },
      { icon: 'github', link: 'https://github.com/gy-mate/homepage' }
    ],

    sidebar: {
      '/projects': [
        {
          text: 'Past',
          items: [
            { text: 'MÁV', link: '/projects/mav' },
          ]
        },
        {
          text: 'Present',
          items: [
            { text: 'Kalauz', link: '/projects/kalauz' },
            { text: 'GTFS Feeds', link: '/projects/gtfs' },
            { text: 'VIK Wiki', link: '/projects/vikwiki' },
          ]
        },
        {
          text: 'Future',
          items: [
            { text: 'Ideas', link: '/projects/ideas' },
          ]
        }
      ]
    },

    editLink: {
      pattern: 'https://github.com/gy-mate/homepage/tree/main/pages/:path',
      text: 'Suggest a change to this page'
    },

    footer: {
      message: `
      This website is released under GPL-3.0 
      and served from the <a href="https://aws.amazon.com/cloudfront/features">AWS CloudFront edge location</a> closest to you.<br>

      Powered by <a href="https://vitepress.dev">VitePress</a>.
      `
    }
  }
})
