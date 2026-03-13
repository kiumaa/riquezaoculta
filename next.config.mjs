import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_KAMBAFY_CHECKOUT_URL: process.env.KAMBAFY_CHECKOUT_URL ?? "https://pay.kambafy.com/checkout/bd59f082-a243-4c64-87dd-9dc9d5f1e4eb",
  },
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  typedRoutes: true,
  output: "standalone",
  experimental: {
    devtoolSegmentExplorer: false
  },
  outputFileTracingRoot: __dirname
};

export default nextConfig;
