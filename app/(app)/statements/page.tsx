import AppNav from "@/components/navigation/app_nav";
import StatementNav from "@/components/navigation/statement_nav";
import { StatementCard } from "@/components/statements/card";
import { getDrafts } from "@/lib/actions/statementActions";

export default async function DraftsPage() {
  const statements = await getDrafts({
    forCurrentUser: true,
    publishedOnly: false,
  });

  if ("error" in statements) {
    return (
      <div className="min-h-screen bg-background">
        <StatementNav />
        <main className="container max-w-4xl pt-20 px-4">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">
              Please sign in to view your drafts
            </h3>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <AppNav />
      <main className="flex-1 mx-auto bg-background container ">
        <div className="flex items-center justify-between my-8">
          <h1 className="text-3xl font-bold">Statements</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* each statement is the either the latest draft with that statementId or the latest published statement */}
          {statements.length > 0 ? (
            statements.map((statement) => (
              <StatementCard
                key={statement.statementId}
                statement={statement.drafts[0]}
              />
            ))
          ) : (
            <div className="text-center py-12 col-span-full">
              <h3 className="text-lg font-medium">No drafts yet</h3>
              <p className="text-muted-foreground mt-1">
                Create a new draft to get started
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
