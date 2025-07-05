/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // appDir is now stable and this option is deprecated
  }
}

// To handle images from external sources
nextConfig.images = {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'lh3.googleusercontent.com',
    },
    {
      protocol: 'https',
      hostname: 'res.cloudinary.com',
    },
    {
      protocol: 'http',
      hostname: 'localhost',
    }
  ],
};

module.exports = nextConfig
