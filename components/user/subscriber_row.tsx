import { SubscriptionWithRecipient } from 'kysely-codegen';
import { TableCell, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate } from '@/lib/helpers/helpersDate';

export type Column =
  | 'recipientName'
  | 'recipientUsername'
  | 'recipientEmail'
  | 'medium'
  | 'paused'
  | 'recipientImageUrl'
  | 'createdAt';

interface SubscriberRowProps {
  subscription: SubscriptionWithRecipient;
  columns: Column[];
}

export function SubscriberRow({ subscription, columns }: SubscriberRowProps) {
  return (
    <TableRow className="hover:bg-transparent">
      {columns.includes('recipientImageUrl') && (
        <TableCell className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={subscription.recipientImageUrl || ''}
              alt={subscription.recipientName || 'Subscriber'}
              className="h-full w-full object-cover"
            />
            <AvatarFallback>
              {subscription.recipientName?.slice(0, 2) ||
                subscription.recipientUsername?.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
        </TableCell>
      )}

      {columns.includes('recipientName') && (
        <TableCell className="font-medium">
          {subscription.recipientName || 'Unknown User'}
        </TableCell>
      )}
      {columns.includes('recipientUsername') && subscription.recipientUsername && (
        <TableCell className="text-sm text-muted-foreground">
          @{subscription.recipientUsername}
        </TableCell>
      )}
      {columns.includes('recipientEmail') && (
        <TableCell className="text-sm text-muted-foreground">
          {subscription.recipientEmail || subscription.email}
        </TableCell>
      )}

      {columns.includes('medium') && <TableCell>{subscription.medium}</TableCell>}
      {columns.includes('paused') && (
        <TableCell>
          <div
            className={`inline-flex items-center justify-center rounded-full text-xs font-medium px-2 py-1 ${
              subscription.paused ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
            }`}
          >
            {subscription.paused ? 'Paused' : 'Active'}
          </div>
        </TableCell>
      )}
      {columns.includes('createdAt') && (
        <TableCell className="text-sm text-muted-foreground">
          {formatDate({ date: subscription.createdAt })}
        </TableCell>
      )}
    </TableRow>
  );
}
