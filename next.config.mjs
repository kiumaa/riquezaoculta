import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  typedRoutes: true,
  experimental: {
    devtoolSegmentExplorer: false
  },
  outputFileTracingRoot: __dirname
};

export default nextConfig;
