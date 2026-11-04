import type { Metadata } from 'next';

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
        <TanStackProvider>{children}</TanStackProvider>
      </body>
    </html>
  );
};

export default RootLayout;
