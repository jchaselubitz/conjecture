import { StatementContainer } from '@/containers/StatementContainer';

type Props = {
  params: Promise<{ statementSlug: string; userSlug: string }>;
  searchParams: Promise<{ edit: string; version: string }>;
};

export default async function StatementPage({ params, searchParams }: Props) {
  const { edit } = await searchParams;
  const editMode = edit === 'true';
  return <StatementContainer edit={editMode} />;
}
