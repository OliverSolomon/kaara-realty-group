import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
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
