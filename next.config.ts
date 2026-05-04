import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    domains: ["cdn.sanity.io", "images.unsplash.com", "res.cloudinary.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.sanity.io",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/webmail',
        destination: 'https://webmail.kaararealtygroup.com', // This will redirect to the cPanel webmail.  
        permanent: true,
      },
      {
        source: '/cpanel',
        destination: 'https://cpanel.kaararealtygroup.com', // This will redirect to cPanel.
        permanent: true,
      }
    ];
  },
};

export default nextConfig;
