'use client';

import { SubscriptionWithRecipient } from 'kysely-codegen';
import { ArrowRightToLineIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SubscriberTable } from '@/components/user/subscriber_table';

interface NewsletterPanelProps {
  subscribers: SubscriptionWithRecipient[];
}

export default function NewsletterPanel({ subscribers }: NewsletterPanelProps) {
  return (
    <div className="flex flex-col mt-2 gap-6 mx-auto w-full h-full">
      <div className="flex justify-between pl-4 w-full items-center">
        <div className="text-lg font-bold">Subscribers</div>
        <Button variant="ghost" onClick={() => {}}>
          <ArrowRightToLineIcon className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-2 h-full overflow-hidden">
        <SubscriberTable
          subscriptions={subscribers}
          columns={['recipientEmail', 'recipientImageUrl', 'createdAt', 'paused']}
        />
      </div>
    </div>
  );
}
