import { Suspense } from 'react';

import type { Metadata } from 'next';

import { AuthGuard } from '@/features/auth';

import TanStackProvider from './providers';

import './globals.css';

export const metadata: Metadata = {
  title: 'Respec',
  description: 'Respec frontend',
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="ko">
      <body>
        <TanStackProvider>
          {/* 가드는 현재 경로(usePathname)를 읽으므로 동적 경로에서는 요청 시점까지 기다립니다. */}
          <Suspense>
            <AuthGuard>{children}</AuthGuard>
          </Suspense>
        </TanStackProvider>
      </body>
    </html>
  );
};

export default RootLayout;
