import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: [
        "**/ảnh của chiến sa/**",
        "**/public/**",
        "**/*.crdownload",
        "**/*.tmp",
        "**/*.part",
        "**/*.png",
        "**/*.jpg",
        "**/*.jpeg",
        "**/*.mp4",
        "**/node_modules/**",
        "**/.git/**"
      ]
    }
  }
});
