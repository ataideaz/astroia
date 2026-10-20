import vinext from "vinext";
import { defineConfig } from "vite";

export default defineConfig(async () => {
  // Mantém os arquivos de log e estado do Wrangler dentro do projeto.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: { host: "0.0.0.0" },
    plugins: [
      vinext(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        // Lê bindings (D1, Assets, Images) de wrangler.jsonc.
        configPath: "./wrangler.jsonc",
      }),
    ],
  };
});
