/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://api-gateway:80/api/:path*',
            },
        ]
    },
}

module.exports = nextConfig;


