/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removing 'output: export' to support dynamic routes
  // output: 'export',
  distDir: './dist', // Changes the build output directory to match Vite's
  reactStrictMode: true,
}

export default nextConfig;
