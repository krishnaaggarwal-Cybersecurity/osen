import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow react-router-dom's BrowserRouter to work inside the catch-all page
  // by disabling strict mode conflicts in production
  reactStrictMode: true,

  // Vercel-compatible image optimization settings
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
