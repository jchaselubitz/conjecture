import { SubscriptionWithRecipient } from 'kysely-codegen';

import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Column, SubscriberRow } from './subscriber_row';

interface SubscriberTableProps {
  subscriptions: SubscriptionWithRecipient[];
  columns: Column[];
  className?: string;
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
  ],
  className
}: SubscriberTableProps) {
  if (subscriptions.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No subscribers found.</div>;
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <Table className="h-full relative ">
        <TableHeader className="sticky top-0 bg-background z-10 flex-1">
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
        <>
          <TableBody className="overflow-y-auto h-full flex-1">
            {subscriptions.map(subscription => (
              <SubscriberRow key={subscription.id} subscription={subscription} columns={columns} />
            ))}
          </TableBody>
          <div className="h-24"></div>
        </>
      </Table>
    </div>
  );
}
