'use client';

import { StatementWithDraftAndCollaborators, SubscriptionWithRecipient } from 'kysely-codegen';
import React from 'react';

import { getNewsletterHtml } from '@/lib/assets/newsletter_template';

export default function Newsletter({
  statement,
  isAuthor,
  subscribers
}: {
  statement: StatementWithDraftAndCollaborators;
  isAuthor: boolean;
  subscribers: SubscriptionWithRecipient[] | [];
}) {
  const subscriberEmail = isAuthor ? subscribers[0]?.email : undefined;

  const newsletterHtml = getNewsletterHtml({
    subscriberEmail,
    statement: statement,
    previewMode: true
  });

  return (
    <div className="h-full overflow-y-auto pb-20">
      <iframe
        title="Newsletter Preview"
        style={{ width: '100%', height: '100%', border: 'none', minHeight: 600 }}
        sandbox="allow-same-origin"
        srcDoc={newsletterHtml}
      />
    </div>
  );
}
