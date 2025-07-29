'use client';

import React from 'react';

import { useStatementContext } from '@/contexts/StatementBaseContext';
import { getNewsletterHtml } from '@/lib/assets/newsletter_template';

export default function Newsletter() {
  const { isCreator, subscribers, statement } = useStatementContext();
  const subscriberEmail = isCreator ? subscribers[0]?.email : undefined;
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
