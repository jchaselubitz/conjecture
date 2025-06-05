import { DraftWithUser } from 'kysely-codegen';
import React from 'react';

import { cn } from '@/lib/utils';

import StackCard from './stack_card';

export interface CardPost {
  id: string;
  title: string;
  author: string;
}

export default function VerticalCardStack({
  familyTree,
  currentTitle
}: {
  familyTree: {
    precedingPosts: DraftWithUser[];
    followingPosts: DraftWithUser[];
  };
  currentTitle: string;
}) {
  const { precedingPosts, followingPosts } = familyTree;

  return (
    <div className={cn(' max-w-96 w-full z-30 flex flex-col items-start  ')}>
      {/* Preceding posts */}
      {precedingPosts.map((post, index) => (
        <StackCard
          key={post.id}
          title={post.title ?? ''}
          author={post.creatorName ?? post.creatorSlug ?? ''}
          creatorSlug={post.creatorSlug ?? ''}
          slug={post.slug ?? ''}
          zIndex={precedingPosts.length - index}
          opacity={1 - index * 0.12}
          className={cn('mb-1')}
          tabIndex={0}
          publishedAt={post.publishedAt}
        />
      ))}
      {/* Separator with more space and current post title */}
      <div className={cn('w-full flex items-center my-10')}>
        <div className="flex-1 h-px bg-zinc-300" />
        <span
          className="mx-2 text-xs text-zinc-600 font-medium select-none truncate max-w-[10rem]"
          title={currentTitle}
        >
          {currentTitle || 'Current Post'}
        </span>
        <div className="flex-1 h-px bg-zinc-300" />
      </div>
      {/* Following posts */}
      {followingPosts.map((post, idx) => (
        <StackCard
          key={post.id}
          title={post.title ?? ''}
          author={post.creatorName ?? post.creatorSlug ?? ''}
          creatorSlug={post.creatorSlug ?? ''}
          slug={post.slug ?? ''}
          zIndex={followingPosts.length - idx}
          opacity={1 - idx * 0.12}
          className="mt-1"
          tabIndex={0}
          publishedAt={post.publishedAt}
        />
      ))}
    </div>
  );
}
