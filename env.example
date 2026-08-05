import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mon Gestionnaire',
  description: "Plateforme SaaS de gestion d'entreprise",
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mon Gestionnaire',
  },
};

export const viewport = {
  themeColor: '#C1653C',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
