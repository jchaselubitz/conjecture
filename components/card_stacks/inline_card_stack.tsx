import { StatementWithUser } from 'kysely-codegen';
import React from 'react';

import { cn } from '@/lib/utils';

import StackCard from './stack_card';
export interface CardPost {
  id: string;
  title: string;
  author: string;
}

export default function InlineCardStack({
  familyTree,
  currentTitle
}: {
  familyTree: {
    precedingPosts: StatementWithUser[];
    followingPosts: StatementWithUser[];
  };
  currentTitle: string;
}) {
  const { precedingPosts, followingPosts } = familyTree;

  return (
    <div className={cn(' flex flex-col items-start w-full  ')}>
      {/* Preceding posts */}
      {precedingPosts.map((post, index) => (
        <StackCard
          key={post.statementId}
          title={post.title ?? ''}
          author={post.authors.map(author => author.name ?? author.username).join(', ')}
          creatorSlug={post.creatorSlug ?? ''}
          slug={post.slug ?? ''}
          zIndex={precedingPosts.length + index}
          opacity={1}
          className={cn('-mb-6', index === precedingPosts.length - 1 && 'mb-1')}
          tabIndex={0}
          publishedAt={post.draft.publishedAt ?? null}
        />
      ))}
      {/* Separator with more space and current post title */}
      <div className={cn('w-full flex items-center my-2')}>
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
      {followingPosts.map((post, index) => (
        <StackCard
          key={post.statementId}
          title={post.title ?? ''}
          author={post.authors.map(author => author.name ?? author.username).join(', ')}
          creatorSlug={post.creatorSlug ?? ''}
          slug={post.slug ?? ''}
          zIndex={followingPosts.length + index}
          opacity={1}
          className={cn('-mb-6', index === followingPosts.length - 1 && 'mb-1')}
          tabIndex={0}
          publishedAt={post.draft.publishedAt ?? null}
        />
      ))}
    </div>
  );
}
