import StatementCreateEditForm from "@/app/(app)/statements/(components)/create_edit_form";
import StatementNav from "@/components/navigation/statement_nav";

export default async function CreatePage() {
  return (
    <div className="flex-1 bg-background">
      <StatementNav />
      <div className="mx-auto container pt-20 px-4">
        <StatementCreateEditForm />
      </div>
    </div>
  );
}
