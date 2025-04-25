'use client';
import { DraftWithUser } from 'kysely-codegen';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ButtonLoadingState, LoadingButton } from '@/components/ui/loading-button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserContext } from '@/contexts/userContext';
import { getFollow, toggleFollow } from '@/lib/actions/userActions';
import { formatDate } from '@/lib/helpers/helpersDate';

const Byline = ({ statement }: { statement: DraftWithUser }) => {
  const router = useRouter();
  const { userId } = useUserContext();
  const [buttonState, setButtonState] = useState<ButtonLoadingState>('default');
  const [isFollowing, setIsFollowing] = useState<boolean>(false);

  // const [followerCount, setFollowerCount] = useState<number>(0);

  const getIsFollowing = useCallback(async () => {
    if (!userId || !statement?.creatorId) {
      return false;
    }
    const following = await getFollow({ followerId: userId, followingId: statement?.creatorId });
    setIsFollowing(following);
  }, [userId, statement?.creatorId]);

  // const getFollowerCount = async () => {
  //   console.log('getFollowerCount');

  //   const followers = await getFollowers(statement?.creatorId);
  //   console.log(followers);
  //   setFollowerCount(followers.length);
  // };

  useEffect(() => {
    const checkFollow = async () => {
      if (!userId || !statement?.creatorId) {
        return;
      }
      getIsFollowing();
      // getFollowerCount();
    };
    checkFollow();
  }, [userId, statement?.creatorId, getIsFollowing]);

  const handleFollow = async () => {
    setButtonState('loading');
    if (!userId || !statement?.creatorId) {
      setButtonState('error');
      return;
    }
    try {
      await toggleFollow({ followerId: userId, followingId: statement?.creatorId });
      setButtonState('success');
      getIsFollowing();
    } catch (error) {
      console.error(error);
      setButtonState('error');
    } finally {
      setButtonState('default');
    }
  };

  const handleCreatorClick = () => {
    if (statement?.creatorSlug) {
      router.push(`/${statement.creatorSlug}`);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer">
            <Avatar className="w-10 h-10">
              <AvatarImage src={statement?.creatorImageUrl || ''} className="object-cover" />
              <AvatarFallback>{statement?.creatorName?.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="font-bold">{statement?.creatorName}</div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80 m-2">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-4" onClick={handleCreatorClick}>
              <Avatar className="w-12 h-12">
                <AvatarImage src={statement?.creatorImageUrl || ''} className="object-cover" />
                <AvatarFallback>{statement?.creatorName?.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <div className="font-bold text-lg">{statement?.creatorName}</div>
                  <div className="text-sm text-muted-foreground">@{statement?.creatorSlug}</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Joined {formatDate({ date: statement?.createdAt })}
                </div>
                {/* <div className="text-sm text-muted-foreground">0 followers</div> */}
              </div>
            </div>

            <LoadingButton
              className="w-full"
              variant={isFollowing ? 'outline' : 'default'}
              onClick={handleFollow}
              disabled={userId === statement?.creatorId}
              buttonState={buttonState}
              text={userId === statement?.creatorId ? 'You' : isFollowing ? 'Following' : 'Follow'}
              loadingText={isFollowing ? 'Unfollowing...' : 'Following...'}
              successText={isFollowing ? 'Unfollowed' : 'Followed'}
              errorText="Error"
            />
          </div>
        </PopoverContent>
      </Popover>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="text-xs text-muted-foreground bg-zinc-100 rounded-sm px-2 py-1">
              {statement?.publishedAt
                ? formatDate({ date: statement.publishedAt })
                : 'Not published'}
            </div>
          </TooltipTrigger>
          {statement?.publishedAt && (
            <TooltipContent>
              <p>Published {formatDate({ date: statement.publishedAt, withTime: true })}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      <div className="text-xs text-muted-foreground bg-zinc-100 rounded-sm px-2 py-1">
        v{statement?.versionNumber}
      </div>
    </div>
  );
};

export default Byline;
