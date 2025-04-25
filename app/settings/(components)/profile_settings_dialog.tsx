'use client';
import { FollowWithFollowed, FollowWithFollower } from 'kysely-codegen';
import { useState } from 'react';
import { useAsync } from 'react-use';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Table } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserContext } from '@/contexts/userContext';
import { getFollowedUsers, getFollowers } from '@/lib/actions/userActions';
import { formatDate } from '@/lib/helpers/helpersDate';

import ProfileForm from './profile_form';

export default function ProfileSettingsDialog() {
  const { settingsDialog, setSettingsDialog, userId } = useUserContext();
  const [following, setFollowing] = useState<FollowWithFollowed[]>([]);
  const [followers, setFollowers] = useState<FollowWithFollower[]>([]);

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

  return (
    <Dialog open={settingsDialog} onOpenChange={setSettingsDialog}>
      <DialogContent className="md:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>Manage your profile settings here.</DialogDescription>
        </DialogHeader>
        <ProfileForm />
        <div className="space-y-4 mt-10">
          <Tabs defaultValue="following" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="following" className="flex-1">
                You Follow
              </TabsTrigger>
              <TabsTrigger value="followers" className="flex-1">
                Following You
              </TabsTrigger>
            </TabsList>
            <TabsContent value="following" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Followed Since</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {following.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>{user.followedName}</TableCell>
                      <TableCell>{user.followedUsername}</TableCell>
                      <TableCell>{formatDate({ date: user.userSince })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="followers" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Follows Since</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {followers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>{user.followerName}</TableCell>
                      <TableCell>{user.followerUsername}</TableCell>
                      <TableCell>{formatDate({ date: user.userSince })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
