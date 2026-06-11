import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

function logoProxyPlugin(): Plugin {
  async function handleLogoProxy(
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
    next: () => void,
  ) {
    const requestUrl = new URL(req.url ?? "", "http://localhost");

    if (!requestUrl.pathname.endsWith("/logo-proxy")) {
      next();
      return;
    }

    const logoUrl = requestUrl.searchParams.get("url");

    if (!logoUrl) {
      res.statusCode = 400;
      res.end("Missing logo url");
      return;
    }

    let remoteUrl: URL;
    try {
      remoteUrl = new URL(logoUrl);
    } catch {
      res.statusCode = 400;
      res.end("Invalid logo url");
      return;
    }

    if (remoteUrl.protocol !== "https:" && remoteUrl.protocol !== "http:") {
      res.statusCode = 400;
      res.end("Unsupported logo url");
      return;
    }

    try {
      const upstream = await fetch(remoteUrl, {
        headers: {
          accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "user-agent": "Mortorshow3D logo proxy",
        },
      });

      if (!upstream.ok) {
        res.statusCode = upstream.status;
        res.end(`Unable to load logo: ${upstream.status}`);
        return;
      }

      const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
      const buffer = Buffer.from(await upstream.arrayBuffer());

      res.statusCode = 200;
      res.setHeader("access-control-allow-origin", "*");
      res.setHeader("cache-control", "public, max-age=86400");
      res.setHeader("content-type", contentType);
      res.end(buffer);
    } catch (error) {
      res.statusCode = 502;
      res.end(error instanceof Error ? error.message : "Unable to proxy logo");
    }
  }

  return {
    name: "mortorshow3d-logo-proxy",
    configureServer(server) {
      server.middlewares.use(handleLogoProxy);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleLogoProxy);
    },
  };
}

export default defineConfig({
  base: process.env.GITHUB_PAGES ? "/Mortorshow3d-repo/" : "/",
  publicDir: "Public",
  plugins: [logoProxyPlugin(), react(), tailwindcss()],
});
