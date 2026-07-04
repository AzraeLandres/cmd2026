import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@atoms/*": path.resolve(__dirname, "./src/atoms/*"),
      "@molecules/*": path.resolve(__dirname, "./src/molecules/*"),
      "@organisms/*": path.resolve(__dirname, "./src/organisms/*"),
      "@graphql/*": path.resolve(__dirname, "./src/graphql/*"),
      "@interfaces/*": path.resolve(__dirname, "./src/interfaces/*"),
    },
  },
  server: {
    proxy: {
      "/graphql": "http://localhost:3000",
    },
  },
  build: {
    outDir: "dist",
  },
});
