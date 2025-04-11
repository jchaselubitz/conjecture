'use client';

import * as Sentry from '@sentry/nextjs';
import { AnnotationWithComments, BaseCommentWithUser } from 'kysely-codegen';
import { NewAnnotation } from 'kysely-codegen';
import { RefreshCw, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useWindowSize } from 'react-use';
import { Button } from '@/components/ui/button';
import { ButtonLoadingState, LoadingButton } from '@/components/ui/loading-button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useStatementAnnotationContext } from '@/contexts/StatementAnnotationContext';
import { useStatementContext } from '@/contexts/statementContext';
import { useUserContext } from '@/contexts/userContext';
import { deleteAnnotation } from '@/lib/actions/annotationActions';
import { createComment } from '@/lib/actions/commentActions';
interface Comment {
  content: string;
  id: string;
}

interface CommentInputProps {
  annotation: AnnotationWithComments;
  replyToComment: Comment | null;
  onCancelReply: () => void;
  setComments: React.Dispatch<React.SetStateAction<BaseCommentWithUser[]>>;
  setReplyToComment: React.Dispatch<React.SetStateAction<BaseCommentWithUser | null>>;
  cancelReply: () => void;
}

export default function CommentInput({
  annotation,
  replyToComment,
  onCancelReply,
  setComments,
  setReplyToComment,
  cancelReply
}: CommentInputProps) {
  const { name, imageUrl, userId } = useUserContext();
  const { statement, editor } = useStatementContext();
  const { setAnnotations, setSelectedAnnotationId } = useStatementAnnotationContext();

  const isMobile = useWindowSize().width < 768;
  const statementId = statement?.id;
  const isCreator = userId === statement.creatorId;

  const [commentText, setCommentText] = useState('');
  const [submittingButtonState, setSubmittingButtonState] = useState<ButtonLoadingState>('default');
  const [deletingButtonState, setDeletingButtonState] = useState<ButtonLoadingState>('default');
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !userId) return;

    setSubmittingButtonState('loading');
    try {
      const newComment = {
        userId,
        annotationId: annotation.id,
        content: commentText,
        id: crypto.randomUUID(),
        parentId: replyToComment?.id || null
      };

      setComments((prevComments) => [
        ...prevComments,
        {
          ...newComment,
          createdAt: new Date(),
          updatedAt: new Date(),
          userImageUrl: imageUrl || '',
          userName: name || ''
        }
      ]);

      await createComment({
        comment: newComment,
        statementId,
        parentId: replyToComment?.id
      });

      setCommentText('');
      setReplyToComment(null);
      setSubmittingButtonState('success');
    } catch (error) {
      console.error('Error creating comment:', error);
      setSubmittingButtonState('error');
      // Revert optimistic update on error
      setComments(annotation.comments);
    } finally {
      setSubmittingButtonState('default');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }

    // Cancel reply on Escape
    if (e.key === 'Escape' && replyToComment) {
      e.preventDefault();
      cancelReply();
    }
  };

  const handleDeleteAnnotation = async () => {
    setDeletingButtonState('loading');
    const annotationId = annotation.id;
    if (!annotationId) return;

    setAnnotations((prevAnnotations: NewAnnotation[]) =>
      prevAnnotations.filter((a) => a.id !== annotationId)
    );

    try {
      await deleteAnnotation({
        annotationId: annotation.id,
        statementCreatorId: statement.creatorId,
        annotationCreatorId: annotation.userId,
        statementId: annotation.draftId
      });
      if (editor) {
        editor.commands.deleteAnnotationHighlight(annotationId);
        setDeletingButtonState('success');
      } else {
        throw new Error('Editor not found');
      }
      setSelectedAnnotationId(undefined);
    } catch (error) {
      console.error('Error deleting annotation:', error);
      Sentry.captureException(error);
    }
  };

  return (
    <div id="comment-input" className="w-full bg-white">
      {userId ? (
        <div id="comment-input" className=" ">
          {replyToComment && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-muted/50 rounded-md">
              <span className="text-xs flex-1 truncate">
                Replying to:{' '}
                <span className="font-medium italic">
                  {replyToComment.content.substring(0, 40)}
                  {replyToComment.content.length > 40 ? '...' : ''}
                </span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 shrink-0"
                onClick={onCancelReply}
                aria-label="Cancel reply"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <div>{annotation.id}</div>
          <Textarea
            ref={commentInputRef}
            placeholder={replyToComment ? 'Write your reply...' : 'Share your thoughts...'}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={!isMobile ? handleKeyDown : undefined}
            className="min-h-[80px] focus-visible:ring-0"
          />

          <div className="flex flex-row justify-between mt-2 gap-2">
            {isCreator && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <LoadingButton
                      buttonState={deletingButtonState}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent accordion from toggling
                        handleDeleteAnnotation();
                      }}
                      text={<Trash2 className="w-4 h-4" color="red" />}
                      variant="ghost"
                      size="sm"
                      loadingText={<RefreshCw className="w-4 h-4 animate-spin" />}
                      successText="Deleted"
                      errorText="Error deleting annotation"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete annotation</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {!isMobile && (
              <div className="text-xs text-muted-foreground self-center">
                Press <kbd className="px-1 py-0.5 bg-muted rounded">⇧</kbd>+
                <kbd className="px-1 py-0.5 bg-muted rounded">Enter</kbd> for new line
              </div>
            )}
            <div className="flex flex-row gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCommentText('');
                        onCancelReply();
                      }}
                    >
                      {commentText ? 'Clear' : 'Cancel'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{commentText ? 'Clear comment text' : 'Cancel reply'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <LoadingButton
                      buttonState={submittingButtonState}
                      onClick={handleSubmitComment}
                      text={replyToComment ? 'Reply' : 'Comment'}
                      loadingText="Submitting..."
                      successText="Submitted"
                      errorText="Error"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{replyToComment ? 'Submit your reply' : 'Submit your comment'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 justify-end">
          <Link href="/login">
            <Button variant="default" size="sm">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline" size="sm">
              Create Account
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
