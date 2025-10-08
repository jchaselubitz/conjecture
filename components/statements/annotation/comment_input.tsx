'use client';

import { AnnotationWithComments } from 'kysely-codegen';
import { X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import { useWindowSize } from 'react-use';

import { AuthButtons } from '@/components/navigation/auth_buttons';
import { Button } from '@/components/ui/button';
import { ButtonLoadingState, LoadingButton } from '@/components/ui/loading-button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useStatementAnnotationContext } from '@/contexts/StatementAnnotationContext';
import { useUserContext } from '@/contexts/userContext';
import { createComment } from '@/lib/actions/commentActions';
import { nestComments } from '@/lib/helpers/helpersComments';

interface CommentInputProps {
  annotation: AnnotationWithComments;
  showCommentInput?: boolean;
  setShowCommentInput?: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function CommentInput({
  annotation,
  showCommentInput,
  setShowCommentInput
}: CommentInputProps) {
  const { name, imageUrl, userId } = useUserContext();
  const { replyToComment, setReplyToComment, addComment, cancelReply, setComments } =
    useStatementAnnotationContext();

  const isMobile = useWindowSize().width < 600;

  const [commentText, setCommentText] = useState('');
  const [submittingButtonState, setSubmittingButtonState] = useState<ButtonLoadingState>('default');

  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const pathname = usePathname();
  const pathnameWithoutParams = pathname.split('/').slice(0, 3).join('/');
  const revalidationPath = { path: pathnameWithoutParams, type: 'layout' as const };

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

      addComment({
        ...newComment,
        createdAt: new Date(),
        updatedAt: new Date(),
        userImageUrl: imageUrl || '',
        userName: name || '',
        children: [],
        isPublic: true,
        draftId: annotation.draftId
      });

      setCommentText('');

      await createComment({
        comment: newComment,
        parentId: replyToComment?.id,
        revalidationPath: revalidationPath
      });

      setReplyToComment(null);
      setShowCommentInput?.(false);
      setSubmittingButtonState('success');
    } catch (error) {
      console.error('Error creating comment:', error);
      setSubmittingButtonState('error');
      setComments(nestComments(annotation.comments));
    } finally {
      setSubmittingButtonState('default');
    }
  };

  const handleCancel = () => {
    setShowCommentInput?.(false);
    cancelReply();
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
      handleCancel();
    }
  };

  return (
    <div id="comment-input" className="w-full  rounded-t-md pb-2">
      {userId ? (
        <div id="comment-input" className=" ">
          {replyToComment && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-muted/50 rounded-md ">
              <div className="max-h-20 h-full overflow-y-auto text-xs/4">
                <span className=" flex-1">
                  Replying to:{' '}
                  <span className="font-medium italic ">
                    {replyToComment.content}
                    {/* {replyToComment.content.substring(0, 100)}
                  {replyToComment.content.length > 100 ? '...' : ''} */}
                  </span>
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 shrink-0"
                onClick={cancelReply}
                aria-label="Cancel reply"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          <Textarea
            ref={commentInputRef}
            autoFocus={showCommentInput}
            placeholder={replyToComment ? 'Write your reply...' : 'Share your thoughts...'}
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onKeyDown={!isMobile ? handleKeyDown : undefined}
            className="min-h-[80px] focus-visible:ring-0 bg-background"
          />

          <div className="flex flex-row justify-between mt-2 gap-2">
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
                      size="sm"
                      onClick={() => {
                        setCommentText('');
                        handleCancel();
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
                      size="sm"
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
        <AuthButtons className="mt-4" />
      )}
    </div>
  );
}
