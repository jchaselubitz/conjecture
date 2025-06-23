import { FollowWithFollowed, FollowWithFollower } from 'kysely-codegen';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/helpers/helpersDate';

interface FollowersTableProps {
  following: FollowWithFollowed[];
  followers: FollowWithFollower[];
}

export default function FollowersTable({ following, followers }: FollowersTableProps) {
  return (
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
  );
}
