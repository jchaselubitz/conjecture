import { LoginForm } from "@/components/login/login_form";
import AppNav from "@/components/navigation/app_nav";
import { StatementListContainer } from "@/containers/StatementListContainer";
import { getDrafts } from "@/lib/actions/statementActions";
import { createClient } from "@/supabase/server";
export default async function DraftsPage() {
  const statements = await getDrafts({
    forCurrentUser: true,
    publishedOnly: false,
  });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <AppNav />
      <main className="flex-1 mx-auto bg-background container py-8 px-4 md:px-0">
        {user?.id ? (
          <StatementListContainer
            statements={statements}
            pathname={"statements"}
          />
        ) : (
          <div className="text-center gap-3 text-muted-foreground w-full flex flex-col items-center justify-center">
            Please login to view your drafts
            <div className="w-full max-w-sm">
              <LoginForm />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
