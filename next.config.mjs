/** @type {import('next').NextConfig} */
<<<<<<< HEAD
const nextConfig = {};
=======
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
>>>>>>> origin/v0/marcogrima93-788a0347

export default nextConfig;
