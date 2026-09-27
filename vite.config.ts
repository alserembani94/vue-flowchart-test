/// <reference types="vitest/config" />
import vue from "@vitejs/plugin-vue";
import vueRouter from "vue-router/vite";
import tailwindcss from "@tailwindcss/vite";

import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vueRouter(), tailwindcss(), vue()],
  server: {
    proxy: {
      // This is to bypass CORS, in production, should set it in bucket policy
      "/api/processes": {
        target:
          "https://respond-io-fe-bucket.s3.ap-southeast-1.amazonaws.com/candidate-assessments/payload.json",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/processes/, ""),
      },
    },
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["src/__tests__/setup.ts"],
    include: [
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "src/__tests__/**/*.{test,spec}.{js,ts,jsx,tsx}",
    ],
  },
});
