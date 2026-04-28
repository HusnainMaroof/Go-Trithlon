import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  images: {
    domains: ["lh3.googleusercontent.com"],
    
    remotePatterns: [
      {
        protocol: "https",
        hostname: "example.com",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatar.vercel.sh",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com", // Handles all Google Auth images
        pathname: "/**",
      },
      {
        protocol: "http", 
        hostname: "googleusercontent.com", // Fallback for your specific mocked DB data
        pathname: "/**",
      }
    ],
  },
};

export default nextConfig;
