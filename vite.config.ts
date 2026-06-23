import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-dom') || id.includes('/react/')) return 'react-vendor';
          if (id.includes('react-router-dom')) return 'router-vendor';
          if (id.includes('antd') || id.includes('@ant-design')) return 'antd-vendor';
          if (id.includes('echarts')) return 'echarts-vendor';
          if (id.includes('three') || id.includes('@react-three')) return 'three-vendor';
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://10.130.91.109:8000',
        changeOrigin: true,
      },
    },
  },
});
