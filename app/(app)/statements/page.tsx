import Link from "next/link";
import AppNav from "@/components/navigation/app_nav";
import StatementNav from "@/components/navigation/statement_nav";
import { getDrafts } from "@/lib/actions/statementActions";

export default async function DraftsPage() {
  const statements = await getDrafts();

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
        <div className="flex flex-col gap-4">
          {/* each statement is the either the latest draft with that statementId or the latest published statement */}
          {statements.length > 0 ? (
            statements.map((statement) => (
              <Link
                key={statement.statementId}
                href={`/statements/${statement.statementId}`}
                className="border border-foreground/20 rounded-lg p-4"
              >
                <h2 className="text-lg font-semibold">
                  {statement.drafts[0].title}
                </h2>
              </Link>
            ))
          ) : (
            <div className="text-center py-12">
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
