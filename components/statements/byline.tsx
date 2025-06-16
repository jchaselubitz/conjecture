'use client';

import { StatementWithUser } from 'kysely-codegen';
import React, { useCallback, useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ButtonLoadingState, LoadingButton } from '@/components/ui/loading-button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserContext } from '@/contexts/userContext';
import { getFollow, toggleFollow } from '@/lib/actions/userActions';
import { formatDate } from '@/lib/helpers/helpersDate';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type author = {
  id: string;
  name: string | null | undefined;
  username: string | null | undefined;
  imageUrl: string | null | undefined;
};

const AvatarGroup = ({ authors }: { authors: author[] }) => {
  return (
    <div className="flex items-center">
      {authors.map((author, index) => (
        <div
          key={author.id}
          className={cn(index > 0 && '-ml-4 shadow-md', `z-${index * 10}`, 'rounded-full')}
        >
          <Avatar key={author.id}>
            <AvatarImage src={author.imageUrl || ''} className="object-cover" />
            <AvatarFallback>{author.name?.slice(0, 2)}</AvatarFallback>
          </Avatar>
        </div>
      ))}
    </div>
  );
};

const Byline = ({ statement }: { statement: StatementWithUser }) => {
  const { userId } = useUserContext();
  const [buttonStates, setButtonStates] = useState<Record<string, ButtonLoadingState>>({});
  const [isFollowing, setIsFollowing] = useState<Record<string, boolean>>({});

  // const [followerCount, setFollowerCount] = useState<number>(0);

  const getIsFollowing = useCallback(
    async (authorId: string) => {
      if (!userId || !authorId) {
        return false;
      }
      const following = await getFollow({ followerId: userId, followingId: authorId });
      setIsFollowing(prev => ({ ...prev, [authorId]: following }));
    },
    [userId]
  );

  // const getFollowerCount = async () => {
  //   console.log('getFollowerCount');

  //   const followers = await getFollowers(statement?.creatorId);
  //   console.log(followers);
  //   setFollowerCount(followers.length);
  // };

  useEffect(() => {
    const checkFollow = async () => {
      if (!userId) {
        return;
      }
      statement?.authors.forEach(author => {
        getIsFollowing(author.id);
      });
      // getFollowerCount();
    };
    checkFollow();
  }, [userId, statement?.authors, getIsFollowing]);

  const handleFollow = async (authorId: string) => {
    setButtonStates(prev => ({ ...prev, [authorId]: 'loading' }));
    if (!userId || !authorId) {
      setButtonStates(prev => ({ ...prev, [authorId]: 'error' }));
      !userId && alert('You must be logged in to follow');
      return;
    }
    try {
      await toggleFollow({ followerId: userId, followingId: authorId });
      setButtonStates(prev => ({ ...prev, [authorId]: 'success' }));
      getIsFollowing(authorId);
    } catch (error) {
      console.error(error);
      setButtonStates(prev => ({ ...prev, [authorId]: 'error' }));
    } finally {
      setButtonStates(prev => ({ ...prev, [authorId]: 'default' }));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer">
            <AvatarGroup authors={statement?.authors} />
            <div className="font-bold">
              {statement?.authors.map(author => author.name ?? author.username).join(', ')}
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80 m-2">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-start gap-4">
              {statement?.authors.map(author => (
                <div className="flex flex-col gap-2 w-full" key={author.id}>
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src={author.imageUrl || ''} className="object-cover" />
                      <AvatarFallback>{author.name?.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-lg">{author.name ?? author.username}</div>
                        <Link
                          className="text-sm text-muted-foreground hover:underline"
                          href={`/${author.username}`}
                          prefetch={false}
                        >
                          @{author.username}
                        </Link>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Joined {formatDate({ date: statement?.createdAt })}
                      </div>
                      {/*   <div className="text-sm text-muted-foreground">0 followers</div> */}
                    </div>
                  </div>
                  <LoadingButton
                    className="w-full"
                    variant={isFollowing[author.id] ? 'outline' : 'default'}
                    onClick={() => handleFollow(author.id)}
                    disabled={userId === author.id}
                    buttonState={buttonStates[author.id] ?? 'default'}
                    text={
                      userId === author.id ? 'You' : isFollowing[author.id] ? 'Following' : 'Follow'
                    }
                    loadingText={isFollowing[author.id] ? 'Unfollowing...' : 'Following...'}
                    successText={isFollowing[author.id] ? 'Unfollowed' : 'Followed'}
                    errorText="Error"
                  />
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="text-xs text-muted-foreground bg-zinc-100 rounded-sm px-2 py-1">
              {statement?.draft.publishedAt
                ? formatDate({ date: statement.draft.publishedAt })
                : 'Not published'}
            </div>
          </TooltipTrigger>
          {statement?.draft.publishedAt && (
            <TooltipContent>
              <p>Published {formatDate({ date: statement.draft.publishedAt, withTime: true })}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      <div className="text-xs text-muted-foreground bg-zinc-100 rounded-sm px-2 py-1">
        v{statement?.draft.versionNumber}
      </div>
    </div>
  );
};

export default Byline;
