/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Output configuration for Amplify
  output: 'standalone', // Optimized for serverless deployment
  
  // Image optimization
  images: {
    domains: ['localhost', 'whizsuite-media.s3.ap-south-1.amazonaws.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.cloudfront.net', // For CloudFront CDN
      },
    ],
    unoptimized: false, // Enable image optimization
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api',
  },
  
  // Amplify-specific optimizations
  compress: true,
  poweredByHeader: false,
  
  // Handle trailing slashes for Amplify
  trailingSlash: false,
};

module.exports = nextConfig;


