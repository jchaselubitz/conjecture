import './globals.css';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import AppNav from '@/components/navigation/app_nav';
import { Toaster } from '@/components/ui/sonner';
import { EditModeProvider } from '@/contexts/EditModeContext';
import { NavProvider } from '@/contexts/NavContext';
import { UserProvider } from '@/contexts/userContext';
import { getUserProfile } from '@/lib/actions/userActions';
import { createClient } from '@/supabase/server';

import ProfileSettingsDialog from './settings/(components)/profile_settings_dialog';
const inter = Inter({ subsets: ['latin'] });

const siteURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteURL),
  title: 'Conject',
  description: 'Conjecture and Critique',
  icons: {
    icon: '/favicon.ico'
  }
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
    <html lang="en" className={inter.className}>
      <body>
        <div className="min-h-screen">
          <UserProvider userProfile={profile} userEmail={user?.email} userSlug={profile?.username}>
            <NavProvider>
              <EditModeProvider>
                <AppNav />
                {children}
              </EditModeProvider>
            </NavProvider>
            <Toaster />
            <ProfileSettingsDialog />
          </UserProvider>
        </div>
      </body>
    </html>
  );
}
