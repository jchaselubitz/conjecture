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
  subscriberEmail?: string;
}) {
  const newsletterHtml = getNewsletterHtml({
    statement,
    subscriberEmail,
    previewMode: true
  });

  return (
    <div className="h-full overflow-y-auto pb-20">
      <div dangerouslySetInnerHTML={{ __html: newsletterHtml }} />
    </div>
  );
}
