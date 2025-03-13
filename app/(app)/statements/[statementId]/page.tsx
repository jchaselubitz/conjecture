import StatementDetails from "@/app/(app)/statements/(components)/statement_details";
import AppNav from "@/components/navigation/app_nav";
export default async function CreatePage({
  params,
}: {
  params: Promise<{ statementId: string }>;
}) {
  return (
    <div>
      <AppNav />
      <div className="flex-1 mx-auto bg-background container ">
        <div className="container max-w-4xl mx-auto pt-20 px-4">
          <StatementDetails />
        </div>
      </div>
    </div>
  );
}
