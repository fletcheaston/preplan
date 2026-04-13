import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";

import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import { defineConfig } from "vite";

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact()],
  ssr: {
    external: ["better-sqlite3"],
  },
  optimizeDeps: {
    exclude: ["better-sqlite3"],
  },
});

export default config;
