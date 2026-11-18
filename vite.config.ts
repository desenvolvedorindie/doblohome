import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    host: true
  },
  test: {
    // backend/ tem seus próprios testes (node backend/tests/api.test.mjs) e dependências PHP
    exclude: ['node_modules/**', 'backend/**', 'dist/**']
  }
});
