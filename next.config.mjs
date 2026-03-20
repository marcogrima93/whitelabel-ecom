/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['*.vusercontent.net', 'vm-oqzd6t1is1uulxqbwdqkp6.vusercontent.net'],
  logging: {
    browserToTerminal: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
