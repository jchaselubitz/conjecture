import { StatementContainer } from '@/containers/StatementContainer';
import { getStatementId } from '@/lib/actions/statementActions';

type Props = {
  params: Promise<{ statementSlug: string; userSlug: string; version: string }>;
  searchParams: Promise<{ edit: string }>;
};

export default async function StatementPage({ params }: Props) {
  const { statementSlug } = await params;
  const statementId = await getStatementId(statementSlug);
  return <StatementContainer statementId={statementId} />;
}
