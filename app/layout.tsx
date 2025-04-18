import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { getUserProfile } from '@/lib/actions/userActions';
import { createClient } from '@/supabase/server';
import { UserProvider } from '@/contexts/userContext';
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Conject',
  description: 'Conjecture and Critique'
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
          <UserProvider userProfile={profile} userEmail={user?.email}>
            {children}
          </UserProvider>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
