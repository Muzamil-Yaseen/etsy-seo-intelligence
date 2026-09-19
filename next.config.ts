import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  async redirects() {
    return [
      { source: "/dashboard", destination: "/", permanent: false },
      { source: "/research", destination: "/", permanent: false },
      { source: "/tags", destination: "/", permanent: false },
      { source: "/title", destination: "/", permanent: false },
      { source: "/description", destination: "/", permanent: false },
      { source: "/analyzer", destination: "/", permanent: false },
      { source: "/imports", destination: "/", permanent: false },
      { source: "/shops", destination: "/", permanent: false },
      { source: "/experiments", destination: "/", permanent: false },
      { source: "/settings", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
