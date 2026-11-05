import type { NextConfig } from 'next';

const apiBaseUrl = process.env.API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error('API_BASE_URL is required');
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  experimental: {
    // 초안 생성은 최대 120초 걸립니다. 기본값 30초에서는 `/backend` 프록시가 먼저 끊깁니다.
    // `next dev`/`next start`에만 적용됩니다. Vercel에서는 외부 rewrite를 CDN이 처리하고 최대 120초입니다.
    proxyTimeout: 130_000,
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },

  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: `${apiBaseUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
