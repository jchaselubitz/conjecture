'use client';

import * as Sentry from '@sentry/nextjs';
import { BaseCommentVote, CommentWithUser } from 'kysely-codegen';
import { ArrowUp, Edit2, RefreshCw, Reply, Trash2 } from 'lucide-react';
import { startTransition, useOptimistic, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ButtonLoadingState, LoadingButton } from '@/components/ui/loading-button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useStatementAnnotationContext } from '@/contexts/StatementAnnotationContext';
import { deleteComment, toggleCommentUpvote } from '@/lib/actions/commentActions';
interface CommentControlsProps {
  userId?: string | null;
  comment: CommentWithUser;
  isRootComment: boolean;
  isHovered: boolean;
  editingComment: boolean;
  statementId: string;
  votes: BaseCommentVote[] | undefined;
  onReplyClick: (comment: CommentWithUser) => void;
  onEditClick: () => void;
  onCommentDeleted: (commentId: string) => void;
  statementCreatorId: string;
}

const CommentVoteButton = ({
  votes,
  userId,
  commentId,
  statementId
}: {
  votes: BaseCommentVote[] | undefined;
  userId: string;
  commentId: string;
  statementId: string;
}) => {
  const [optVotes, setOptVotes] = useState<BaseCommentVote[] | undefined>(votes);
  const voteCount = optVotes?.length || 0;
  const hasUpvoted = optVotes?.some(vote => vote.userId === userId) || false;

  const handleVote = async () => {
    if (!userId) return;
    try {
      const newVotes = hasUpvoted
        ? optVotes?.filter(vote => vote.userId !== userId)
        : [
            ...(optVotes || []),
            {
              id: crypto.randomUUID(),
              userId,
              commentId,
              createdAt: new Date()
            }
          ];

      if (newVotes) {
        setOptVotes(newVotes);
      }

      await toggleCommentUpvote({
        commentId,
        isUpvoted: hasUpvoted,
        statementId
      });
    } catch (error) {
      console.error('Error upvoting comment:', error);
    } finally {
    }
  };
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={hasUpvoted ? 'default' : 'ghost'}
            size="sm"
            onClick={handleVote}
            className="text-xs opacity-70 hover:opacity-100 hover:cursor-pointer"
          >
            <div className="flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              {voteCount > 0 && voteCount}
              {hasUpvoted ? ' ' : ' Upvote'}{' '}
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{hasUpvoted ? 'Remove upvote' : 'Upvote comment'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default function CommentControls({
  userId,
  comment,
  isRootComment,
  isHovered,
  editingComment,
  votes,
  statementId,
  onReplyClick,
  onEditClick,
  onCommentDeleted,
  statementCreatorId
}: CommentControlsProps) {
  const [deletingButtonState, setDeletingButtonState] = useState<ButtonLoadingState>('default');

  const isModerator = userId === statementCreatorId;
  const isCreator = userId === comment.userId;
  const isCreatorOrModerator = isCreator || isModerator;

  const handleDeleteComment = async () => {
    if (!userId) return;

    setDeletingButtonState('loading');
    try {
      await deleteComment({
        id: comment.id,
        commenterId: comment.userId,
        statementCreatorId,
        statementId
      });

      onCommentDeleted(comment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
      Sentry.captureException(error);
      setDeletingButtonState('error');
    } finally {
      setDeletingButtonState('default');
    }
  };

  return (
    <div className="flex items-center gap-1">
      {!editingComment && userId && (
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReplyClick(comment)}
                  className="text-xs opacity-70 hover:opacity-100 hover:cursor-pointer"
                >
                  <Reply className="w-3 h-3" /> Reply
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reply to comment</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {isCreator && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEditClick}
                    className="text-xs opacity-70 hover:opacity-100 hover:cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit comment</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {userId && (
            <CommentVoteButton
              votes={votes}
              userId={userId}
              commentId={comment.id}
              statementId={statementId}
            />
          )}
        </>
      )}

      {isCreatorOrModerator && !isRootComment && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <LoadingButton
                buttonState={deletingButtonState}
                onClick={handleDeleteComment}
                text={<Trash2 className="w-3 h-3" />}
                variant="ghost"
                size="sm"
                loadingText={<RefreshCw className="w-3 h-3 animate-spin" />}
                successText="Deleted"
                errorText="Error"
                className="opacity-70 hover:opacity-100"
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete comment</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
