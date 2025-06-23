'use client';

import { SubscriptionWithRecipient } from 'kysely-codegen';
import { ArrowRightToLineIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { SubscriberTable } from '@/components/user/subscriber_table';
import { useUserContext } from '@/contexts/userContext';
import { getSubscribers, unsubscribeBulk } from '@/lib/actions/notificationActions';

interface NewsletterPanelProps {
  subscribers: SubscriptionWithRecipient[];
}

export default function NewsletterPanel({ subscribers }: NewsletterPanelProps) {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithRecipient[]>(subscribers);
  const { userId } = useUserContext();

  const handleSubscriptionsChange = async (subscriberIds: string[]) => {
    if (!userId) return;
    await unsubscribeBulk(userId, subscriberIds);
    const updatedSubscriptions = await getSubscribers(userId);
    setSubscriptions(updatedSubscriptions);
  };

  return (
    <div className="flex flex-col mt-4 gap-6 mx-auto w-full h-full">
      <div className="flex justify-between pl-4 w-full items-center">
        <div className="text-lg font-bold">Subscribers</div>
        {/* <Button variant="ghost" onClick={() => {}}>
          <ArrowRightToLineIcon className="w-4 h-4" />
        </Button> */}
      </div>

      <div className="flex flex-col gap-2 h-full overflow-hidden">
        <SubscriberTable
          subscriptions={subscriptions}
          onSubscriptionsChange={handleSubscriptionsChange}
          authorId={userId}
          columns={['recipientEmail', 'recipientImageUrl', 'paused']}
        />
      </div>
    </div>
  );
}
