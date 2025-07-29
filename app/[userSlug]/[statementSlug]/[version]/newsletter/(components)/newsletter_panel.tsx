'use client';

import { LazySubscriberData } from '@/components/user/lazy_subscriber_data';
import { SubscriberTable } from '@/components/user/subscriber_table';
import { useStatementContext } from '@/contexts/StatementBaseContext';
import { useUserContext } from '@/contexts/userContext';
import { unsubscribeBulk } from '@/lib/actions/notificationActions';

export default function NewsletterPanel() {
  const { userId } = useUserContext();
  const { statement } = useStatementContext();
  const authorId = statement.creatorId;
  const handleSubscriptionsChange = async (subscriberIds: string[]) => {
    if (!userId) return;
    await unsubscribeBulk(userId, subscriberIds);
    // The LazySubscriberData component will handle refreshing the data
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
        <LazySubscriberData authorId={authorId} fallback={<div>Loading subscribers...</div>}>
          {subscribers => (
            <SubscriberTable
              subscriptions={subscribers}
              onSubscriptionsChange={handleSubscriptionsChange}
              authorId={userId}
              columns={['recipientEmail', 'recipientImageUrl', 'paused']}
            />
          )}
        </LazySubscriberData>
      </div>
    </div>
  );
}
