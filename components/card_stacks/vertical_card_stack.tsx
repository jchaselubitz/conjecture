import { StatementWithUser } from 'kysely-codegen';
import { Plus } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

import RebuttalButton from '../statements/rebuttal_button';

import StackCard from './stack_card';

export default function VerticalCardStack({
  familyTree,
  currentTitle,
  currentStatementId,
  currentThreadId
}: {
  familyTree: {
    precedingPosts: StatementWithUser[];
    followingPosts: StatementWithUser[];
  };
  currentTitle: string;
  currentStatementId: string;
  currentThreadId: string | null | undefined;
}) {
  const { precedingPosts, followingPosts } = familyTree;

  return (
    <div className={cn(' max-w-96 w-full z-30 flex flex-col items-start mx-auto ')}>
      {/* Preceding posts */}
      <div className="flex flex-col gap-1 w-full">
        {precedingPosts.map((post, index) => (
          <StackCard
            key={post.statementId}
            title={post.title ?? ''}
            author={post.authors.map(author => author.name ?? author.username).join(', ')}
            creatorSlug={post.creatorSlug ?? ''}
            slug={post.slug ?? ''}
            zIndex={precedingPosts.length - index}
            opacity={1 - index * 0.12}
            className={cn('mb-1')}
            tabIndex={0}
            publishedAt={post.draft.publishedAt ?? null}
          />
        ))}
      </div>
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
      <div className="flex flex-col gap-1 w-full">
        {followingPosts.map((post, idx) => (
          <StackCard
            key={post.statementId}
            title={post.title ?? ''}
            author={post.authors.map(author => author.name ?? author.username).join(', ')}
            creatorSlug={post.creatorSlug ?? ''}
            slug={post.slug ?? ''}
            zIndex={followingPosts.length - idx}
            opacity={1 - idx * 0.12}
            tabIndex={0}
            publishedAt={post.draft.publishedAt ?? null}
          />
        ))}
        <div className="w-full flex">
          <RebuttalButton
            className="w-full h-fit"
            buttonText={
              <div className="flex items-center gap-1">
                <Plus className="w-4 h-4" />
                <span className="text-sm text-center">Write a response</span>
              </div>
            }
            existingStatementId={currentStatementId}
            existingTitle={currentTitle}
            existingThreadId={currentThreadId ?? null}
          />
        </div>{' '}
      </div>
    </div>
  );
}
