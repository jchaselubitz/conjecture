import { BaseStatementVote } from 'kysely-codegen';
import { ArrowUp } from 'lucide-react';
import { startTransition, useOptimistic } from 'react';

import { useUserContext } from '@/contexts/userContext';
import { toggleStatementUpvote } from '@/lib/actions/statementActions';

import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface VoteButtonProps {
  statementId: string;
  upvotes: BaseStatementVote[];
  className?: string;
  creatorSlug: string;
  statementSlug: string;
}

export default function VoteButton({
  statementId,
  upvotes,
  className,
  creatorSlug,
  statementSlug
}: VoteButtonProps) {
  const { userId } = useUserContext();

  const [optVotes, setOptVotes] = useOptimistic<BaseStatementVote[], BaseStatementVote[]>(
    upvotes,
    (current, updated) => {
      return updated;
    }
  );

  const voteCount = optVotes?.length || 0;
  const hasUpvoted = optVotes?.some(vote => vote.userId === userId) || false;

  const handleVote = async () => {
    if (!userId) return;
    try {
      const newVotes = hasUpvoted
        ? optVotes.filter(vote => vote.userId !== userId)
        : [
            ...optVotes,
            {
              id: crypto.randomUUID(),
              userId,
              statementId,
              createdAt: new Date()
            }
          ];
      startTransition(() => {
        setOptVotes(newVotes);
      });

      await toggleStatementUpvote({
        statementId,
        isUpvoted: hasUpvoted,
        revalidationPath: { path: `/${creatorSlug}/${statementSlug}`, type: 'layout' }
      });
    } catch (error) {
      console.error('Error upvoting comment:', error);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={hasUpvoted ? 'default' : 'outline'}
            size="default"
            onClick={handleVote}
            disabled={!userId}
            className={` opacity-70 hover:opacity-100 hover:cursor-pointer ${className}`}
          >
            <ArrowUp className="w-3 h-3 mr-1" /> {hasUpvoted ? '' : 'Upvote'}
            {voteCount > 0 && voteCount}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{hasUpvoted ? 'Remove upvote' : 'Upvote comment'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
