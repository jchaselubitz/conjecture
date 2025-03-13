import { UserProvider } from "@/contexts/userContext";
import { getUserProfile } from "@/lib/actions/userActions";
import { createClient } from "@/supabase/server";

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
    </UserProvider>
  );
}
