import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    // `domains` is deprecated and matches a whole host without a path, which is
    // the looser of the two checks. Every host below is expressed as an
    // explicit remote pattern instead.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
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
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "fastly.picsum.photos",
      },
    ],
  },
  async redirects() {
    return [
      {
        // The neighbourhood pages were retired. Anything that still points at
        // them lands on the Buy collection rather than a 404.
        source: '/neighborhoods',
        destination: '/buy',
        permanent: true,
      },
      {
        source: '/neighborhoods/:slug',
        destination: '/buy',
        permanent: true,
      },
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
