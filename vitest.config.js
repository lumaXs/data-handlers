import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'url'

export default defineConfig({
   test: {
      environment: 'node',
   },
   resolve: {
      alias: {
         'data-handlers': fileURLToPath(
            new URL('./dist/index.js', import.meta.url),
         ),
      },
   },
})
