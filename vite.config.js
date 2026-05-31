import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs   from "fs";
import path from "path";

// Stamp the service worker so every new deploy triggers a browser update.
function stampServiceWorker() {
  return {
    name: "stamp-sw",
    closeBundle() {
      const swPath = path.resolve(__dirname, "dist/sw.js");
      if (fs.existsSync(swPath)) {
        let src = fs.readFileSync(swPath, "utf8");
        src = src.replace("__BUILD_VERSION__", Date.now().toString());
        fs.writeFileSync(swPath, src);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), stampServiceWorker()],
  publicDir: "public",

  build: {
    // Raise the warning threshold slightly (analytics chunk is intentionally large).
    chunkSizeWarningLimit: 700,

    rollupOptions: {
      output: {
        // ── Manual chunk splitting ─────────────────────────────────────────────
        // Each key becomes a separate JS file loaded only when first needed.
        // This cuts the initial bundle from ~1 MB down to ~150 KB.
        manualChunks(id) {
          // Heavy analytics code → loaded only when Analytics view is opened.
          if (id.includes("components/analytics")) return "chunk-analytics";

          // Settings page — rarely visited, no need to ship on first load.
          if (id.includes("components/layout/Settings")) return "chunk-settings";

          // Kanban — only used inside Funnels view.
          if (id.includes("components/layout/KanbanBoard")) return "chunk-kanban";

          // CSV import, bulk-edit, won-proof — large modals opened rarely.
          if (
            id.includes("CSVImportModal") ||
            id.includes("BulkEditModal")  ||
            id.includes("WonProofModal")
          ) return "chunk-heavy-modals";

          // Supabase client library → its own vendor chunk for long-term caching.
          if (id.includes("node_modules/@supabase")) return "vendor-supabase";

          // React + React-DOM → separate vendor chunk (never changes between builds).
          if (id.includes("node_modules/react")) return "vendor-react";
        },
      },
    },
  },
});
