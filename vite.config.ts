import { readFileSync } from 'node:fs'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

// `base: './'` keeps asset URLs relative so the build works from any
// GitHub Pages sub-path. Override with VITE_BASE if needed.
export default defineConfig({
  base: process.env.VITE_BASE ?? './',
  plugins: [react(), tailwindcss()],
  // Shown in the header: the version from package.json and the time of this build (the deploy time).
  define: { __APP_VERSION__: JSON.stringify(pkg.version), __BUILD_TIME__: JSON.stringify(new Date().toISOString()) },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
