import './globals.css';

import type { Metadata, Viewport } from 'next';

import { Toaster } from '@/components/ui/sonner';
import { UserProvider } from '@/contexts/userContext';
import { getUserProfile } from '@/lib/actions/userActions';
import { createClient } from '@/supabase/server';

import ProfileSettingsDialog from './settings/(components)/profile_settings_dialog';

const fontSans = {
  variable: '--font-sans'
};

const siteURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteURL),
  title: 'Conject',
  description: 'Conjecture and Critique',
  icons: {
    icon: '/favicon.ico'
  }
};

export const viewport: Viewport = {
  themeColor: '#f1f5f9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover'
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

  const profile = await getUserProfile();

  return (
    <html lang="en" className={` ${fontSans.variable}`}>
      <link
        rel="dns-prefetch"
        href={`//${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '')}`}
      />
      <body>
        <div className="min-h-screen">
          <UserProvider userProfile={profile} userEmail={user?.email} userSlug={profile?.username}>
            {children}

            <Toaster />
            <ProfileSettingsDialog />
          </UserProvider>
        </div>
      </body>
    </html>
  );
}
