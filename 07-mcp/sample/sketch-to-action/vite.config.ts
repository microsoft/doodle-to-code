/// <reference types="vitest" />
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, './src/components'),
      '@parser': path.resolve(__dirname, './src/parser'),
      '@services': path.resolve(__dirname, './src/services'),
      '@samples': path.resolve(__dirname, './samples'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    typecheck: {
      tsconfig: path.resolve(__dirname, './tsconfig.vitest.json'),
    },
  },
})
