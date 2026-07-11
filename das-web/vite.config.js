import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4100",
        changeOrigin: true,
        proxyTimeout: 15000,
        timeout: 15000,
        configure(proxy) {
          proxy.on("error", (_error, _req, res) => {
            if (!res.headersSent) {
              res.writeHead(503, {
                "Content-Type": "application/json; charset=utf-8"
              });
            }
            if (!res.writableEnded) {
              res.end(JSON.stringify({
                message: "Máy chủ API đang khởi động lại. Vui lòng thử lại sau vài giây."
              }));
            }
          });
        }
      }
    }
  }
});
