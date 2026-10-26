import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [{ source: "/notifications", destination: "/dashboard", permanent: false }];
  },
};

export default nextConfig;
