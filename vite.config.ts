import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: process.env.GITHUB_PAGES ? "/Mortorshow3d-repo/" : "/",
  publicDir: "Public",
  plugins: [react(), tailwindcss()],
});
