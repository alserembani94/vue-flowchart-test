/// <reference types="vitest/config" />
import vue from "@vitejs/plugin-vue";
import vueRouter from "vue-router/vite";
import tailwindcss from "@tailwindcss/vite";

import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vueRouter(), tailwindcss(), vue()],
  test: {
    globals: true,
    environment: "node",
    include: [
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "src/__tests__/**/*.{test,spec}.{js,ts,jsx,tsx}",
    ],
  },
});
