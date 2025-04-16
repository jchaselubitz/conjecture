import { StatementContainer } from '@/containers/StatementContainer';
import { getDraftsByStatementId } from '@/lib/actions/statementActions';
import { createClient } from '@/supabase/server';
export default async function CreatePage({
  params,
  searchParams
}: {
  params: Promise<{ statementId: string }>;
  searchParams: Promise<{ edit: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const userId = user?.id?.toString();
  const { statementId } = await params;
  const { edit } = await searchParams;
  const drafts = await getDraftsByStatementId(statementId);
  const creator = drafts[0]?.creatorId.toString();
  const isCreator = creator === userId;
  const editMode = edit === 'true' && isCreator;

  return <StatementContainer edit={editMode} drafts={drafts} />;
}
