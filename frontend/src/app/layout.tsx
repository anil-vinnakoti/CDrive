import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CDrive - Cloud Storage & File Manager',
  description: 'Secure, high-performance cloud drive application powered by AWS Serverless & Go.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body className="antialiased min-h-screen bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
