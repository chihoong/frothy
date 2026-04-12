import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // BullMQ and ioredis are Node-only; don't bundle them in the edge runtime
  serverExternalPackages: ["ioredis", "bullmq", "@prisma/client"],
};

export default nextConfig;
