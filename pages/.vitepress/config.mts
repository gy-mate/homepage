import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Máté Gyöngyösi",
  description: "Máté's website",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'element', link: 'https://matrix.to/#/@gymate:grin.hu' },
      { icon: 'telegram', link: 'https://t.me/gymate' },
      { icon: 'mastodon', link: 'https://mastodon.grin.hu/@gymate' },
      { icon: 'linkedin', link: 'https://linkedin.com/in/gymate/' },
      { icon: 'github', link: 'https://github.com/gy-mate/homepage' }
    ]
  }
})
