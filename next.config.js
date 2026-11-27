/** @type {import('next').NextConfig} */
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : undefined

const nextConfig = {
  // Hide X-Powered-By header in self-hosted environments (aaPanel/Nginx)
  poweredByHeader: false,

  // External packages for server
  serverExternalPackages: ['xlsx'],

  // Enable compression
  compress: true,

  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      ...(allowedOrigins && allowedOrigins.length > 0 ? { allowedOrigins } : {}),
    },
    // Optimize package imports — tree-shake heavy icon libraries
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Skip build checks for faster deploys
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Images: rely on Next built-in optimization where possible
  images: {
    unoptimized: true, // keep for Vercel free tier compatibility
  },

  // Disable source maps in production (faster builds, smaller bundles)
  productionBrowserSourceMaps: false,

  // Remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Cache and security headers (replaces vercel.json headers for aaPanel/Node hosting)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ]
  },

  // Webpack config — server-side shims only
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },

  // Redirect root to login
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false,
      },
      {
        // Redirect direct access to master-tarif to dashboard
        source: '/master-tarif',
        destination: '/dashboard',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig