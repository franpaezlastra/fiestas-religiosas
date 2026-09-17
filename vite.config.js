import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://fiestas-religiosas-preview.vercel.app",
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: "",
        cookiePathRewrite: "/",
        // Solo local HTTP: quitar Secure de la cookie para que el navegador la acepte
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
