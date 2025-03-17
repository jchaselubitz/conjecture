import { UserProvider } from "@/contexts/userContext";
import { getUserProfile } from "@/lib/actions/userActions";
import { createClient } from "@/supabase/server";

import ProfileSettingsDialog from "./settings/(components)/profile_settings_dialog";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = await getUserProfile();

  return (
    <UserProvider userProfile={profile} userEmail={user?.email}>
      <div className="min-h-screen">{children}</div>
      <ProfileSettingsDialog />
    </UserProvider>
  );
}
