import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["tedious", "typeorm", "reflect-metadata", "mssql"],
};

export default nextConfig;
