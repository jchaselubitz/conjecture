'use client';
import { StatementWithUser } from 'kysely-codegen';
import React from 'react';

import { useNavContext } from '@/contexts/NavContext';
import { getNewsletterHtml } from '@/lib/assets/newsletter_template';

export default function Newsletter({
  statement,
  subscriberEmail
}: {
  statement: StatementWithUser;
  subscriberEmail: string;
}) {
  const { setShowNav } = useNavContext();
  setShowNav(false);

  const title = statement.title || '';
  const subtitle = statement.subtitle || '';
  const headerImg = statement.headerImg || '';
  const htmlContent = statement.draft.content || '';
  const authors = statement.authors || [];
  const postUrl = `/${statement.creatorSlug}/${statement.slug}`;

  const newsletterHtml = getNewsletterHtml({
    headerImg,
    title,
    subtitle,
    htmlContent,
    authors,
    postUrl,
    creatorId: statement.creatorId,
    subscriberEmail
  });

  return (
    <div className="h-full overflow-y-auto pb-20">
      <div dangerouslySetInnerHTML={{ __html: newsletterHtml }} />
    </div>
  );
}
