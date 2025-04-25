'use client';

import * as Sentry from '@sentry/nextjs';
import { BaseCommentWithUser } from 'kysely-codegen';
import { ArrowUp, Edit2, RefreshCw, Reply, Trash2 } from 'lucide-react';
import { startTransition, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ButtonLoadingState, LoadingButton } from '@/components/ui/loading-button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { deleteComment, toggleCommentUpvote } from '@/lib/actions/commentActions';
interface CommentControlsProps {
  userId?: string | null;
  comment: BaseCommentWithUser;
  isRootComment: boolean;
  isHovered: boolean;
  editingComment: boolean;
  statementId: string;
  votes:
    | {
        userId: string;
        createdAt: Date;
        id: string;
        commentId: string;
      }[]
    | undefined;
  setVotes: (
    action: {
      createdAt: Date;
      id: string;
      userId: string;
      commentId: string;
    }[]
  ) => void;
  onReplyClick: (comment: BaseCommentWithUser) => void;
  onEditClick: () => void;
  onCommentDeleted: (commentId: string) => void;
  statementCreatorId: string;
}

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
  setVotes,
  onCommentDeleted,
  statementCreatorId
}: CommentControlsProps) {
  const [deletingButtonState, setDeletingButtonState] = useState<ButtonLoadingState>('default');

  const isModerator = userId === statementCreatorId;
  const isCreator = userId === comment.userId;
  const isCreatorOrModerator = isCreator || isModerator;

  const voteCount = votes?.length || 0;
  const hasUpvoted = votes?.some(vote => vote.userId === userId) || false;

  const handleVote = async () => {
    if (!userId) return;
    try {
      const newVotes = hasUpvoted
        ? votes?.filter(vote => vote.userId !== userId)
        : [
            ...(votes || []),
            {
              id: crypto.randomUUID(),
              userId,
              commentId: comment.id,
              createdAt: new Date()
            }
          ];
      startTransition(() => {
        if (newVotes) {
          setVotes(newVotes);
        }
      });

      await toggleCommentUpvote({
        commentId: comment.id,
        isUpvoted: hasUpvoted,
        statementId
      });
    } catch (error) {
      console.error('Error upvoting comment:', error);
    } finally {
    }
  };

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
                  <Reply className="w-3 h-3" />
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
                    <Edit2 className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit comment</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={hasUpvoted ? 'default' : 'ghost'}
                  size="sm"
                  onClick={handleVote}
                  className="text-xs opacity-70 hover:opacity-100 hover:cursor-pointer"
                >
                  <ArrowUp className="w-3 h-3" />
                  {isHovered && voteCount > 0 && voteCount}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{hasUpvoted ? 'Remove upvote' : 'Upvote comment'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
