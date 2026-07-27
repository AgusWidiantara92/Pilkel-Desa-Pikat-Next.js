import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
