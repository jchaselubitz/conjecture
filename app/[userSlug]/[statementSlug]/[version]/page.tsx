import { StatementContainer } from '@/containers/StatementContainer';

type Props = {
  params: Promise<{ statementSlug: string; userSlug: string; version: string }>;
  searchParams: Promise<{ edit: string }>;
};

export default async function StatementPage({ params }: Props) {
  const { statementSlug } = await params;
  return <StatementContainer statementSlug={statementSlug} />;
}
