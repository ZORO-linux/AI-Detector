import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: 'AI Scam Shield — Detect Scams. Verify Media. Stay Protected.',
    template: '%s | AI Scam Shield',
  },
  description:
    'AI Scam Shield analyses suspicious messages, AI-generated photos and deepfake videos using real AI detection services, and explains the risk in plain language.',
  keywords: ['scam detector', 'deepfake detection', 'phishing', 'AI image detection', 'cybersecurity'],
};

export const viewport: Viewport = {
  themeColor: '#030814',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-cyan-400 focus:px-4 focus:py-2 focus:text-navy-950"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
