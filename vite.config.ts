import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          // Heaviest chunk: HiGHS WASM LP solver
          if (id.includes("highs")) return "vendor-highs";
          // Charts — recharts + d3 deps
          if (id.includes("recharts") || id.includes("d3-") || id.includes("victory")) return "vendor-charts";
          // Animation
          if (id.includes("framer-motion")) return "vendor-motion";
          // Date utilities
          if (id.includes("date-fns") || id.includes("react-day-picker")) return "vendor-date";
          // Supabase client
          if (id.includes("@supabase")) return "vendor-supabase";
          // React Query
          if (id.includes("@tanstack")) return "vendor-query";
          // All Radix UI primitives
          if (id.includes("@radix-ui")) return "vendor-ui";
          // React core
          if (id.includes("react-dom") || id.includes("react-router") || (id.includes("node_modules/react/") && !id.includes("react-"))) return "vendor-react";
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@lovable.dev/cloud-auth-js",
      "dexie",
    ],
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "service-worker.ts",
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: {
        name: "LampFarms Poultry Ledger",
        short_name: "LampFarms",
        description: "Premium Poultry Operations & Biosecurity Ledger PWA",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "/placeholder.svg",
            sizes: "192x192",
            type: "image/svg+xml"
          },
          {
            src: "/placeholder.svg",
            sizes: "512x512",
            type: "image/svg+xml"
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: "module"
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
