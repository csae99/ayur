/** @type {import('next').NextConfig} */
// const withPWA = require('next-pwa')({
//     dest: 'public',
//     disable: process.env.NODE_ENV === 'development',
//     register: true,
//     skipWaiting: true,
// });

const nextConfig = {
    output: 'standalone',
    // Image optimization configuration
    images: {
        // Enable modern image formats
        formats: ['image/avif', 'image/webp'],
        // Device sizes for responsive images
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
        // Icon sizes for smaller images
        imageSizes: [16, 32, 48, 64, 96, 128, 256],
        // Minimize external requests - use internal optimization
        minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
        // Disable remote patterns for security (all images are local)
        unoptimized: false,
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://api-gateway:80/api/:path*',
            },
        ]
    },
}

// module.exports = withPWA(nextConfig);
module.exports = nextConfig;


