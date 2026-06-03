import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import AppInitializer from '@/components/AppInitializer';
import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
  preload: false,
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: 'swap',
  preload: false,
});

export const viewport: Viewport = {
  themeColor: "#0F172A",
};

export const metadata: Metadata = {
  title: "Uangmu",
  description: "Modern, dynamic budget tracking and management",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Uangmu",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('theme') || 'slate-dark';
                var el = document.documentElement;
                var toRemove = Array.from(el.classList).filter(function(c){ return c === 'dark' || c.indexOf('theme-') === 0; });
                toRemove.forEach(function(c){ el.classList.remove(c); });
                if (t === 'slate-dark') { el.classList.add('dark'); }
                else if (t !== 'slate-light') { el.classList.add('theme-' + t); }
              } catch (_) {}
            `,
          }}
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} ${manrope.variable} font-body bg-surface text-on-surface antialiased min-h-screen pb-32`}
      >
        <ThemeProvider>
        <AppInitializer />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--app-surface-container-high)',
              color: 'var(--app-on-surface)',
              borderRadius: '1rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              border: '1px solid var(--app-outline-variant)',
            },
          }}
        />
        {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
