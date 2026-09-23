import adapter from '@sveltejs/adapter-node'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  vitePlugin: {
    // Force runes mode for all project components (no legacy mode fallback);
    // third-party libraries decide for themselves.
    dynamicCompileOptions: ({ filename }) =>
      filename.split(/[/\\]/).includes('node_modules')
        ? undefined
        : { runes: true }
  },
  kit: {
    adapter: adapter()
  }
}

export default config
