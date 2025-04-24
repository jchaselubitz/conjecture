import { StatementContainer } from '@/containers/StatementContainer';
import { getDraftsByStatementSlug, getPublishedStatement } from '@/lib/actions/statementActions';
import { createClient } from '@/supabase/server';
import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: Promise<{ statementSlug: string }>;
  searchParams: Promise<{ edit: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { statementSlug } = await params;
  const statement = await getPublishedStatement(statementSlug);
  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: statement?.title,
    description: statement?.subtitle,
    creator: statement?.creatorName,
    // keywords: statement?.keywords,
    openGraph: {
      images: [`${statement?.headerImg}`, ...previousImages]
    }
  };
}

export default async function CreatePage({ params, searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const userId = user?.id?.toString();
  const { statementSlug } = await params;
  const { edit } = await searchParams;

  const drafts = await getDraftsByStatementSlug(statementSlug);
  const creator = drafts[0]?.creatorId.toString();
  const isCreator = creator === userId;
  const editMode = edit === 'true' && isCreator;

  return <StatementContainer edit={editMode} drafts={drafts} />;
}
