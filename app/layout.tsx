import './globals.css';

import { Analytics } from '@vercel/analytics/next';
import type { Metadata, Viewport } from 'next';

import { Toaster } from '@/components/ui/sonner';
import { UserProvider } from '@/contexts/userContext';
import { getUserProfile } from '@/lib/actions/userActions';
import { createClient } from '@/supabase/server';

import ProfileSettingsDialog from './settings/(components)/profile_settings_dialog';
import { optimizedStartupImages } from './optimizedImages';

const fontSans = {
  variable: '--font-sans'
};

const siteURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteURL),
  title: 'Conject',
  description: 'Conjecture and Critique',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' }
    ],
    apple: [{ url: '/apple-icon-180.png' }]
  },
  applicationName: 'Conject',
  appleWebApp: {
    capable: true,
    title: 'Conject',
    statusBarStyle: 'black-translucent',
    startupImage: optimizedStartupImages
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'TOP',
    'mobile-web-app-capable': 'yes',
    'theme-color': '#fdf6ec'
  }
};

export const viewport: Viewport = {
  themeColor: '#fdf6ec',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'contain'
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let profile = null;
  let email = null;
  let slug = null;

  if (user) {
    profile = await getUserProfile();
    email = user.email;
    slug = profile?.username;
  }

  return (
    <html lang="en" className={` ${fontSans.variable}`}>
      <link rel="dns-prefetch" href={`//${process.env.SUPABASE_URL?.replace('https://', '')}`} />
      <link
        rel="dns-prefetch"
        href={`//${process.env.NEXT_PUBLIC_SITE_URL?.replace('https://', '')}`}
      />
      <link rel="manifest" href="/manifest.webmanifest" />

      <body>
        <div className="min-h-screen app-safe">
          <UserProvider userProfile={profile} userEmail={user?.email} userSlug={profile?.username}>
            {children}

            <Toaster />
            <ProfileSettingsDialog />
          </UserProvider>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
