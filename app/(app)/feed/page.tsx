import AppNav from "@/components/navigation/app_nav";
import { StatementCard } from "@/components/statements/card";
import { getDrafts } from "@/lib/actions/statementActions";

export default async function Feed() {
  const statements = await getDrafts({
    forCurrentUser: false,
    publishedOnly: true,
  });

  if ("error" in statements) {
    return (
      <div className="min-h-screen bg-background">
        <AppNav />
        <main className="container max-w-4xl pt-20 px-4">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">
              Please sign in to view your feed
            </h3>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen ">
      <AppNav />
      <main className="flex-1 mx-auto bg-background container px-4 md:px-0 ">
        <div className="flex items-center justify-between my-8">
          <h1 className="text-3xl font-bold">Feed</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statements.length > 0 ? (
            statements.map((statement) => (
              <StatementCard
                key={statement.statementId}
                statement={statement.drafts[0]}
                isPublic={true}
                pathname={statement.creatorSlug}
              />
            ))
          ) : (
            <div className="text-center py-12 col-span-full">
              <h3 className="text-lg font-medium">
                No content in your feed yet
              </h3>
              <p className="text-muted-foreground mt-1">
                Follow users to see their statements in your feed
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
