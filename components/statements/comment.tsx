'use client';

import {
  BaseCommentVote,
  CommentWithReplies,
  CommentWithUser,
  StatementWithUser
} from 'kysely-codegen';
import { DotIcon } from 'lucide-react';
import React, { useOptimistic, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useUserContext } from '@/contexts/userContext';
import { editComment } from '@/lib/actions/commentActions';
import { timeAgo } from '@/lib/helpers/helpersDate';
import { cn } from '@/lib/utils';

import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ButtonLoadingState, LoadingButton } from '../ui/loading-button';
import { Textarea } from '../ui/textarea';

import CommentControls from './comment_controls';

interface CommentProps {
  comment: CommentWithReplies;
  replies?: CommentWithReplies[];
  statementId: string;
  statementCreatorId: string;
  annotationId: string;
  onReplyClick: (comment: CommentWithUser) => void;
  onCommentDeleted: (commentId: string) => void;
  level?: number;
  isRootComment?: boolean;
  statement?: StatementWithUser;
}

const Comment: React.FC<CommentProps> = ({
  comment,
  replies = [],
  statementId,
  statementCreatorId,
  onReplyClick,
  onCommentDeleted,
  level = 0,
  isRootComment = false
}) => {
  const { userId } = useUserContext();

  const [editingComment, setEditingComment] = useState(false);
  const [commentContent, setCommentContent] = useState(comment.content);
  const [editingButtonState, setEditingButtonState] = useState<ButtonLoadingState>('default');
  const [isHovered, setIsHovered] = useState(false);

  const [optVotes, setOptVotes] = useOptimistic<BaseCommentVote[] | undefined, BaseCommentVote[]>(
    comment.votes,
    (current, updated) => {
      return updated;
    }
  );

  const handleEditComment = async () => {
    if (!userId) return;
    try {
      await editComment({
        id: comment.id,
        content: commentContent,
        statementId
      });
      setEditingComment(false);
    } catch (error) {
      console.error('Error editing comment:', error);
      setEditingButtonState('error');
    } finally {
      setEditingButtonState('default');
    }
  };

  const maxLevel = 7; // Maximum nesting level
  const currentLevel = Math.min(level, maxLevel);

  const borderColor = () => {
    switch (currentLevel) {
      case 0:
        return 'border-zinc-50/50';
      case 1:
        return 'border-zinc-100/50';
      case 2:
        return 'border-zinc-200/50';
      case 3:
        return 'border-zinc-300/50';
      case 4:
        return 'border-zinc-400/50';
      case 5:
        return 'border-zinc-500/50';
      case 6:
        return 'border-zinc-600/50';
      case 7:
        return 'border-zinc-700/50';
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col',
        currentLevel > 0 && 'ml-2 mt-2 pl-2 border-l-2',
        borderColor()
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          'p-3 rounded-md transition-colors flex flex-col ',
          currentLevel === 0 ? 'bg-background' : 'bg-muted',
          isHovered && 'bg-muted/80',
          !isRootComment && 'gap-3',
          !isRootComment && level === 0 && 'mt-4'
        )}
      >
        {/* Comment header with user info */}
        <div className="flex items-center w-full justify-between">
          {!isRootComment && (
            <>
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarImage
                    src={comment.userImageUrl}
                    className="object-cover border border-muted-foreground"
                  />
                  <AvatarFallback>{comment.userName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-wrap font-semibold text-xs text-muted-foreground items-center">
                  <p>{comment.userId === userId ? 'You' : comment.userName}</p>
                  <DotIcon className="w-4 text-muted-foreground" />
                  <p className="text-muted-foreground whitespace-nowrap">
                    {timeAgo(new Date(comment.createdAt))}
                  </p>
                </div>
              </div>

              <CommentControls
                userId={userId}
                statementCreatorId={statementCreatorId}
                comment={comment}
                isRootComment={isRootComment}
                isHovered={isHovered}
                editingComment={editingComment}
                onReplyClick={onReplyClick}
                onEditClick={() => setEditingComment(true)}
                onCommentDeleted={onCommentDeleted}
                votes={optVotes}
                setVotes={setOptVotes}
                statementId={statementId}
              />
            </>
          )}
        </div>

        {editingComment ? (
          <div className="flex flex-col gap-2 mt-4">
            <Textarea
              defaultValue={commentContent}
              onChange={e => setCommentContent(e.target.value)}
              className="w-full bg-white/70"
            />
            <div className="flex items-center gap-2">
              <LoadingButton
                buttonState={editingButtonState}
                onClick={handleEditComment}
                text="Save"
                variant="ghost"
                size="sm"
                loadingText="Saving..."
                successText="Saved"
                errorText="Error"
              />
              <Button variant="ghost" size="sm" onClick={() => setEditingComment(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">{commentContent}</p>
        )}
        {/* Reply button */}
      </div>
      {isRootComment && (
        <CommentControls
          userId={userId}
          comment={comment}
          isRootComment={isRootComment}
          isHovered={isHovered}
          editingComment={editingComment}
          onReplyClick={onReplyClick}
          onEditClick={() => setEditingComment(true)}
          onCommentDeleted={onCommentDeleted}
          statementCreatorId={statementCreatorId}
          votes={optVotes}
          setVotes={setOptVotes}
          statementId={statementId}
        />
      )}
      {/* Nested replies */}
      {replies.length > 0 && (
        <div className="">
          {replies.map(reply => (
            <Comment
              key={reply.id}
              comment={reply}
              replies={(reply.children as CommentWithReplies[]) || []}
              statementId={statementId}
              statementCreatorId={statementCreatorId}
              annotationId={comment.annotationId}
              onReplyClick={onReplyClick}
              onCommentDeleted={onCommentDeleted}
              level={currentLevel + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Comment;
