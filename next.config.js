/** @type {import('next').NextConfig} */
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : undefined

const isProd = process.env.NODE_ENV === 'production'
const isConstrainedBuild = Boolean(process.env.NEXT_BUILD_CPUS)

const nextConfig = {
  // Hide X-Powered-By header in self-hosted environments (aaPanel/Nginx)
  poweredByHeader: false,

  // Keep compiled pages in memory much longer during dev so switching
  // between the 11 sidebar routes does not evict and rebuild them
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000, // 1 hour
    pagesBufferLength: 25,
  },

  // External packages for server (skip bundling heavy libraries in server chunks)
  serverExternalPackages: ['xlsx', 'jspdf', 'jspdf-autotable', 'canvg'],

  // Skip tracing heavy packages and non-app directories during `Collecting build traces`
  outputFileTracingExcludes: {
    '*': [
      './node_modules/xlsx/**/*',
      './node_modules/jspdf/**/*',
      './node_modules/jspdf-autotable/**/*',
      './node_modules/canvg/**/*',
      './node_modules/@swc/core*/**/*',
      './node_modules/esbuild/**/*',
      './node_modules/typescript/**/*',
      './ARCHIVE_SCRIPTS/**/*',
      './materi KPI/**/*',
      './tmp/**/*',
      './tests/**/*',
      './test-output/**/*',
    ],
  },

  // Enable compression
  compress: true,

  // Experimental features
  experimental: {
    // Only apply aggressive memory/CPU limits during production or constrained VPS builds.
    // Leaving these enabled in `next dev` causes slow single-core rebuilds and cache eviction.
    ...(isProd ? {
      webpackMemoryOptimizations: true,
      serverSourceMaps: false,
    } : {}),
    ...(isConstrainedBuild ? {
      workerThreads: false,
      cpus: Number(process.env.NEXT_BUILD_CPUS),
    } : {}),
    serverActions: {
      bodySizeLimit: '10mb',
      ...(allowedOrigins && allowedOrigins.length > 0 ? { allowedOrigins } : {}),
    },
    // Optimize package imports — tree-shake heavy libraries
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'date-fns',
      '@radix-ui/react-icons',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
    ],
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

  // Turbopack config (silences Webpack-only warning when running `next dev --turbopack`)
  turbopack: {},

  // Webpack config — server-side shims & production memory optimization
  webpack: (config, { isServer, dev }) => {
    // Disable PackFileCacheStrategy in production builds to avoid high RAM
    // spikes during serialization (and removes "Serializing big strings" warnings)
    if (!dev) {
      config.cache = false
    }

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