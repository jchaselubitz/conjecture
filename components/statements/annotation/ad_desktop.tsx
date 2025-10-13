import { AnnotationWithComments, CommentWithReplies, CommentWithUser } from 'kysely-codegen';
import { RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { AccordionContent, AccordionTrigger } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { ButtonLoadingState, LoadingButton } from '@/components/ui/loading-button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useStatementAnnotationContext } from '@/contexts/StatementAnnotationContext';
import { useStatementContext } from '@/contexts/StatementBaseContext';
import { useUserContext } from '@/contexts/userContext';
import { cn } from '@/lib/utils';

import AnnotationHeader from '../annotation_header';
import Comment from '../comment';

import CommentInput from './comment_input';

interface AnnotationDetailDesktopProps {
  selected: boolean;
  annotation: AnnotationWithComments;
  statementId: string;
  statementCreatorId: string;
  handleDeleteAnnotation: (annotation: AnnotationWithComments) => Promise<void>;
}

export default function AnnotationDetailDesktop({
  annotation,
  selected,
  statementId,
  statementCreatorId,
  handleDeleteAnnotation
}: AnnotationDetailDesktopProps) {
  const { setReplyToComment, handleCommentDeleted, comments, replyToComment } =
    useStatementAnnotationContext();

  const { editor } = useStatementContext();
  const { userId } = useUserContext();
  const isCreator = userId === statementCreatorId;
  const editable = editor?.isEditable;
  const [deletingButtonState, setDeletingButtonState] = useState<ButtonLoadingState>('default');
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const handleReplyClick = (comment: CommentWithUser) => {
    setReplyToComment(comment);
    // Focus the textarea and scroll to it
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus();
        commentInputRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 100);
  };

  const handleDelete = async () => {
    setDeletingButtonState('loading');
    await handleDeleteAnnotation(annotation);
    setDeletingButtonState('success');
  };

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected && containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [selected]);

  const earliestComment = comments.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )[0];

  return (
    <Card
      ref={containerRef}
      className={cn(
        'p-0 gap-0 max-h-4/5 overflow-y-auto min-w-72',
        selected ? 'shadow-2xl my-4' : 'shadow-none hover:shadow-md  '
      )}
    >
      <div className="relative flex items-end w-full">
        <AccordionTrigger className={'w-full p-4 hover:no-underline'} fullWidth>
          <AnnotationHeader
            annotation={annotation}
            isCreator={isCreator}
            isMobile={false}
            editor={editor}
            handleDeleteAnnotation={handleDeleteAnnotation}
          />
        </AccordionTrigger>
        {isCreator && editable && (
          <div className="absolute right-11 bottom-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <LoadingButton
                    buttonState={deletingButtonState}
                    onClick={handleDelete}
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
          </div>
        )}
      </div>
      <AccordionContent className="flex flex-col px-4 pb-4 gap-3">
        {comments.length > 0 && (
          <div className=" border-none pb-1 ">
            {comments.map(comment => (
              <Comment
                key={comment.id}
                comment={comment}
                replies={(comment.children as CommentWithReplies[]) || []}
                statementId={statementId}
                statementCreatorId={statementCreatorId}
                annotationId={annotation.id}
                onReplyClick={handleReplyClick}
                onCommentDeleted={handleCommentDeleted}
                isRootComment={earliestComment.id === comment.id}
              />
            ))}
          </div>
        )}
        {(comments.length < 1 || replyToComment) && <CommentInput annotation={annotation} />}
      </AccordionContent>
    </Card>
  );
}
