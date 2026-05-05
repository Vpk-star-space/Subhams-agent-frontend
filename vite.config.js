import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 🟢 FIX: We completely removed the dangerous "define: process.env" block!
  // Vite automatically handles import.meta.env securely for you.
});