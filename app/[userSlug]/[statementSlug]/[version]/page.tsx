import type { Metadata, ResolvingMetadata } from 'next';

import { StatementContainer } from '@/containers/StatementContainer';
import { getPublishedStatement } from '@/lib/actions/statementActions';

type Props = {
  params: Promise<{ statementSlug: string; userSlug: string }>;
  searchParams: Promise<{ edit: string; version: string }>;
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
    creator: statement?.authors.map(author => author.name).join(', '),
    // keywords: statement?.keywords,
    openGraph: {
      images: [`${statement?.headerImg}`, ...previousImages]
    }
  };
}

export default async function StatementPage({ params, searchParams }: Props) {
  const { edit } = await searchParams;

  const editMode = edit === 'true';
  return <StatementContainer edit={editMode} />;
}
