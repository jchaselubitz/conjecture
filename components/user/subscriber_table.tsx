import { SubscriptionWithRecipient } from 'kysely-codegen';

import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Column, SubscriberRow } from './subscriber_row';

interface SubscriberTableProps {
  subscriptions: SubscriptionWithRecipient[];
  columns: Column[];
}

export function SubscriberTable({
  subscriptions,
  columns = [
    'recipientEmail',
    'recipientName',
    'recipientUsername',
    'medium',
    'paused',
    'recipientImageUrl',
    'createdAt'
  ]
}: SubscriberTableProps) {
  if (subscriptions.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No subscribers found.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.includes('recipientImageUrl') && <TableHead></TableHead>}
          {columns.includes('recipientName') && <TableHead>Name</TableHead>}
          {columns.includes('recipientUsername') && <TableHead>Username</TableHead>}
          {columns.includes('recipientEmail') && <TableHead>Email</TableHead>}
          {columns.includes('medium') && <TableHead>Medium</TableHead>}
          {columns.includes('paused') && <TableHead>Status</TableHead>}
          {columns.includes('createdAt') && <TableHead>Subscribed</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {subscriptions.map(subscription => (
          <SubscriberRow key={subscription.id} subscription={subscription} columns={columns} />
        ))}
      </TableBody>
    </Table>
  );
}
