import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],
  outputFileTracingIncludes: {
    "/**/*": [
      "./prisma/templates/**/*",
      "./node_modules/.prisma/client/**/*",
      "./src/generated/registry/**/*",
    ],
  },
};

export default nextConfig;
