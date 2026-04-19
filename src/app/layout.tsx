import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Device Flow Proxy Server',
  description: 'OAuth 2.0 Device Authorization Grant Proxy',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
