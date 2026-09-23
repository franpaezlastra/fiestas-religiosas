import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      filename: "dist/stats.html",
      gzipSize: true,
      brotliSize: true,
      template: "treemap",
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/maplibre-gl") || id.includes("node_modules/react-map-gl")) {
            return "maplibre";
          }
          if (id.includes("/src/admin/")) {
            return "admin";
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://api-preview.fiestasreligiosas.com",
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: "",
        cookiePathRewrite: "/",
        configure(proxy) {
          proxy.on("proxyRes", (proxyResponse) => {
            const cookies = proxyResponse.headers["set-cookie"];
            if (cookies) {
              proxyResponse.headers["set-cookie"] = cookies.map((cookie) =>
                cookie.replace(/;\s*Secure/gi, ""),
              );
            }
          });
        },
      },
    },
  },
});
