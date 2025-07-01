'use client';

import { StatementWithUser } from 'kysely-codegen';
import React from 'react';

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
      <iframe
        title="Newsletter Preview"
        style={{ width: '100%', height: '100%', border: 'none', minHeight: 600 }}
        sandbox="allow-same-origin"
        srcDoc={newsletterHtml}
      />
    </div>
  );
}
