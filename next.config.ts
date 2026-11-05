import type { NextConfig } from 'next';

// 끝에 `/`가 있으면 rewrite 결과가 `https://host//projects`가 되어 백엔드에서 404가 납니다.
const apiBaseUrl = process.env.API_BASE_URL?.replace(/\/+$/, '');

if (!apiBaseUrl) {
  throw new Error('API_BASE_URL is required');
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  experimental: {
    // 초안 생성은 최대 약 240초 걸립니다. 기본값 30초에서는 `/backend` 프록시가 먼저 끊깁니다.
    // `next dev`/`next start`에만 적용됩니다. Vercel에서는 외부 rewrite를 CDN이 처리하고 최대 120초라서,
    // 배포 환경은 `NEXT_PUBLIC_API_BASE_URL`로 백엔드를 바로 부릅니다(`features/generate-draft/api/draft.ts`).
    proxyTimeout: 300_000,
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
