import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // postgres must stay outside the server bundle: the data layer requires it
  // from process.cwd() inside a worker thread, so the tracer has to ship it in
  // node_modules (Vercel and other build-then-run hosts).
  serverExternalPackages: ["unpdf", "postgres"],
};

export default nextConfig;
