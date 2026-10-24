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
  // The worker thread requires postgres at runtime rather than through a static
  // import the tracer can follow, so ship the package explicitly.
  outputFileTracingIncludes: {
    "/**": ["./node_modules/postgres/**"],
  },
};

export default nextConfig;
