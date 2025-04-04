import { StatementContainer } from "@/containers/StatementContainer";
import { getDraftsByStatementId } from "@/lib/actions/statementActions";
import { createClient } from "@/supabase/server";
export default async function CreatePage({
  params,
  searchParams,
}: {
  params: Promise<{ statementId: string }>;
  searchParams: Promise<{ edit: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id;
  const { statementId } = await params;
  const { edit } = await searchParams;
  const drafts = await getDraftsByStatementId(statementId);
  const isCreator = drafts[0].creatorId === userId;
  const editMode = edit === "true" && isCreator;

  return <StatementContainer drafts={drafts} edit={editMode} />;
}
