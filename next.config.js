/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove trailingSlash: true - this breaks App Router
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['lh3.googleusercontent.com', 'storage.googleapis.com'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://taxcalculator.hybridfoundation.org https://hybridfoundation.org;"
          },
        ]
      }
    ]
  }
};

module.exports = nextConfig;