import AppNav from "@/components/navigation/app_nav";
import { StatementListContainer } from "@/containers/StatementListContainer";
import { getDrafts } from "@/lib/actions/statementActions";

export default async function DraftsPage() {
  const statements = await getDrafts({
    forCurrentUser: true,
    publishedOnly: false,
  });

  return (
    <div>
      <AppNav />
      <main className="flex-1 mx-auto bg-background container py-8">
        <StatementListContainer
          statements={statements}
          pathname={"statements"}
        />
      </main>
    </div>
  );
}
