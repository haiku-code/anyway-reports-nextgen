import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const TRACKING_BLOCK = /[ \t]*<!-- tracking:start -->[\s\S]*?<!-- tracking:end -->\n?/g
const NOINDEX = '    <meta name="robots" content="noindex, nofollow" />\n  </head>'

// The tracking tags in index.html report to ynet's live Chartbeat, Meta Pixel
// and GA properties. Only a production build may fire them, so staging and dev
// builds get the block removed and are marked noindex.
function stripTrackingOutsideProduction(mode: string): Plugin {
  return {
    name: 'strip-tracking-outside-production',
    transformIndexHtml(html) {
      if (mode === 'production') return html
      return html.replace(TRACKING_BLOCK, '').replace('</head>', NOINDEX)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), stripTrackingOutsideProduction(mode)],
}))
