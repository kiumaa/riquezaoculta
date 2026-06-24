import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Cabeçalhos de segurança aplicados a todas as rotas.
// Nota: CSP não é forçado de propósito — a página carrega scripts de terceiros
// (Meta Pixel, Lottie) e uma CSP rígida partiria o pixel/checkout. Adicionar
// CSP exige testar o funil completo primeiro.
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  typedRoutes: true,
  output: "standalone",
  experimental: {
    devtoolSegmentExplorer: false
  },
  outputFileTracingRoot: __dirname,
  // Garante que os PDFs entregáveis (lidos via process.cwd()/data em runtime) são
  // incluídos no bundle standalone da rota de download — senão dão 404 em produção.
  outputFileTracingIncludes: {
    "/api/download/[reference]": ["./data/guia-1m-em-uma-semana.pdf", "./data/Riqueza_Oculta.pdf"]
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  }
};

export default nextConfig;
