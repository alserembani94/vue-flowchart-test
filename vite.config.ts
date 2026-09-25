import vue from "@vitejs/plugin-vue";
import vueRouter from "vue-router/vite";
import tailwindcss from "@tailwindcss/vite";

import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vueRouter(), tailwindcss(), vue()],
});
