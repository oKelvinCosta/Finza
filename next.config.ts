import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-expect-error next config experimental option
  agentRules: false,
};

export default nextConfig;
