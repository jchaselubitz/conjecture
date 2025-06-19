'use client';
import { StatementWithUser } from 'kysely-codegen';
import { getNewsletterHtml } from '@/lib/assets/newsletter_template';
import React from 'react';

export default function Newsletter({ statement }: { statement: StatementWithUser }) {
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
    postUrl
  });

  return <div dangerouslySetInnerHTML={{ __html: newsletterHtml }} />;
}
