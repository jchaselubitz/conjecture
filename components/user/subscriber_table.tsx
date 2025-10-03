import { SubscriptionWithRecipient } from 'kysely-codegen';
import { useState } from 'react';

import { LoadingButton } from '@/components/ui/loading-button';
import { ButtonLoadingState } from '@/components/ui/loading-button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { unsubscribeBulk } from '@/lib/actions/notificationActions';

import { Column, SubscriberRow } from './subscriber_row';

interface SubscriberTableProps {
  subscriptions: SubscriptionWithRecipient[];
  columns: Column[];
  className?: string;
  authorId?: string;
  onSubscriptionsChange?: (subscriberIds: string[]) => void;
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
  className,
  authorId,
  onSubscriptionsChange
}: SubscriberTableProps) {
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<Set<string>>(new Set());
  const [removeButtonState, setRemoveButtonState] = useState<ButtonLoadingState>('default');

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSubscriptions(new Set(subscriptions.map(sub => sub.id)));
    } else {
      setSelectedSubscriptions(new Set());
    }
  };

  const handleSelectSubscription = (subscriptionId: string, checked: boolean) => {
    const newSelected = new Set(selectedSubscriptions);
    if (checked) {
      newSelected.add(subscriptionId);
    } else {
      newSelected.delete(subscriptionId);
    }
    setSelectedSubscriptions(newSelected);
  };

  const handleRemoveSelected = async () => {
    if (selectedSubscriptions.size === 0 || !authorId) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove ${selectedSubscriptions.size} subscriber${selectedSubscriptions.size > 1 ? 's' : ''}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setRemoveButtonState('loading');

    try {
      const selectedSubscriptionObjects = subscriptions.filter(sub =>
        selectedSubscriptions.has(sub.id)
      );
      const recipientEmails = selectedSubscriptionObjects.map(sub => sub.email);
      if (recipientEmails.length > 0) {
        await unsubscribeBulk(authorId, recipientEmails);
        setSelectedSubscriptions(new Set());
        onSubscriptionsChange?.(recipientEmails);
      }
      setRemoveButtonState('success');
      setTimeout(() => setRemoveButtonState('default'), 2000);
    } catch (error) {
      console.error('Error removing subscribers:', error);
      setRemoveButtonState('error');
      setTimeout(() => setRemoveButtonState('default'), 2000);
    }
  };

  const isAllSelected =
    subscriptions.length > 0 && selectedSubscriptions.size === subscriptions.length;
  const isPartiallySelected =
    selectedSubscriptions.size > 0 && selectedSubscriptions.size < subscriptions.length;

  if (subscriptions.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No subscribers found.</div>;
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {onSubscriptionsChange && (
        <div className="mb-4 flex justify-between items-center px-2 mt-2">
          <span className="text-sm text-muted-foreground">
            {selectedSubscriptions.size} subscriber{selectedSubscriptions.size > 1 ? 's' : ''}{' '}
            selected
          </span>
          <LoadingButton
            onClick={handleRemoveSelected}
            disabled={selectedSubscriptions.size === 0}
            buttonState={removeButtonState}
            variant="outline"
            size="sm"
            text="Remove Selected"
            className="border-destructive text-destructive disabled:text-muted-foreground disabled:border-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          />
        </div>
      )}

      <Table className="h-full relative ">
        <TableHeader className="sticky top-0 bg-background z-10 flex-1">
          <TableRow>
            {onSubscriptionsChange && (
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={input => {
                    if (input) input.indeterminate = isPartiallySelected;
                  }}
                  onChange={e => handleSelectAll(e.target.checked)}
                  className="h-4 w-4"
                />
              </TableHead>
            )}
            {columns.includes('recipientImageUrl') && <TableHead></TableHead>}
            {columns.includes('recipientName') && <TableHead>Name</TableHead>}
            {columns.includes('recipientUsername') && <TableHead>Username</TableHead>}
            {columns.includes('recipientEmail') && <TableHead>Email</TableHead>}
            {columns.includes('medium') && <TableHead>Medium</TableHead>}
            {columns.includes('paused') && <TableHead>Status</TableHead>}
            {columns.includes('createdAt') && <TableHead>Subscribed</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody className="overflow-y-auto h-full flex-1">
          {subscriptions.map(subscription => (
            <SubscriberRow
              key={subscription.id}
              subscription={subscription}
              columns={columns}
              isSelected={selectedSubscriptions.has(subscription.id)}
              onSelectChange={
                onSubscriptionsChange
                  ? (checked: boolean) => handleSelectSubscription(subscription.id, checked)
                  : undefined
              }
            />
          ))}
        </TableBody>
      </Table>
      <div className="md:h-24"></div>
    </div>
  );
}
