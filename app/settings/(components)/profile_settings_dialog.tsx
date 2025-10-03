'use client';
import { FollowWithFollowed, FollowWithFollower, SubscriptionWithRecipient } from 'kysely-codegen';
import { useState } from 'react';
import { useAsync } from 'react-use';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import DragAndDrop from '@/components/ui/drag_and_drop';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubscriberTable } from '@/components/user/subscriber_table';
import { useUserContext } from '@/contexts/userContext';
import { getSubscribers, unsubscribeBulk } from '@/lib/actions/notificationActions';
import { getFollowedUsers } from '@/lib/actions/userActions';
import { getFollowers } from '@/lib/actions/userActions';
import { createClient } from '@/supabase/client';

import FollowersTable from './followers_table';
import ProfileForm from './profile_form';

export default function ProfileSettingsDialog() {
  const { settingsDialog, setSettingsDialog, userId } = useUserContext();
  const [following, setFollowing] = useState<FollowWithFollowed[]>([]);
  const [followers, setFollowers] = useState<FollowWithFollower[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithRecipient[]>([]);

  useAsync(async () => {
    if (!userId) return;
    const following = await getFollowedUsers(userId);
    setFollowing(following);
  }, [userId]);

  useAsync(async () => {
    if (!userId) return;
    const followers = await getFollowers(userId);
    setFollowers(followers);
  }, [userId]);

  useAsync(async () => {
    if (!userId) return;
    const subscriptions = await getSubscribers(userId);
    setSubscriptions(subscriptions);
  }, [userId]);

  const handleCsvUpload = async (file: File) => {
    if (!userId) {
      throw new Error('You must be logged in to upload subscribers');
    }

    // Read the CSV file content
    const csvData = await file.text();

    // Call the Supabase function
    const supabase = createClient();
    const { data, error } = await supabase.functions.invoke('add_subscribers', {
      body: {
        authorId: userId,
        csvData: csvData
      }
    });

    if (error) {
      throw error;
    }

    // Refresh the subscribers list
    const updatedSubscriptions = await getSubscribers(userId);
    setSubscriptions(updatedSubscriptions);

    toast.success(data.message || 'Subscribers added successfully!');
  };

  const handleSubscriptionsChange = async (subscriberIds: string[]) => {
    if (!userId) return;
    await unsubscribeBulk(userId, subscriberIds);
    const updatedSubscriptions = await getSubscribers(userId);
    setSubscriptions(updatedSubscriptions);
  };

  return (
    <Dialog open={settingsDialog} onOpenChange={setSettingsDialog}>
      <DialogContent className="md:max-w-[800px] md:h-[70vh] max-h-[95vh] flex flex-col h-full">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>Manage your profile settings here.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-4 h-full overflow-hidden">
          <TabsList className="w-full">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
            <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="flex flex-col h-full overflow-y-auto">
            <ProfileForm />
          </TabsContent>
          <TabsContent value="network">
            <FollowersTable following={following} followers={followers} />
          </TabsContent>
          <TabsContent value="subscribers" className="flex flex-col h-full overflow-hidden">
            {/* Scrollable subscriber table container */}
            <div className="flex-1 overflow-hidden">
              <SubscriberTable
                authorId={userId}
                onSubscriptionsChange={handleSubscriptionsChange}
                subscriptions={subscriptions}
                columns={[
                  'recipientEmail',
                  'recipientName',
                  'paused',
                  'recipientImageUrl',
                  'createdAt'
                ]}
              />
            </div>

            {/* CSV Upload Section - Fixed at bottom */}
            <div className="space-y-4 border-t pt-4 flex-shrink-0">
              <DragAndDrop
                onUpload={handleCsvUpload}
                uploadButtonText="Upload Subscribers"
                title="Drag and drop a CSV file to add subscribers"
                description="CSV files only. Email addresses should be in the first column."
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
