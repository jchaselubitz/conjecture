'use client';

import { SubscriptionWithRecipient } from 'kysely-codegen';
import { useEffect, useState } from 'react';

import { getSubscribersCached } from '@/lib/actions/notificationActions';

interface LazySubscriberDataProps {
  authorId: string;
  children: (subscribers: SubscriptionWithRecipient[]) => React.ReactNode;
  fallback?: React.ReactNode;
}

export function LazySubscriberData({ authorId, children, fallback }: LazySubscriberDataProps) {
  const [subscribers, setSubscribers] = useState<SubscriptionWithRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSubscribers = async () => {
      try {
        setLoading(true);
        const data = await getSubscribersCached(authorId);
        setSubscribers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load subscribers');
      } finally {
        setLoading(false);
      }
    };

    loadSubscribers();
  }, [authorId]);

  if (loading) {
    return fallback ? <>{fallback}</> : <div>Loading subscribers...</div>;
  }

  if (error) {
    return <div>Error loading subscribers: {error}</div>;
  }

  return <>{children(subscribers)}</>;
}
