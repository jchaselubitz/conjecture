import { AnnotationWithComments, BaseCommentWithUser } from 'kysely-codegen';
import { useEffect, useRef } from 'react';
import { AccordionContent, AccordionTrigger } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { useStatementAnnotationContext } from '@/contexts/StatementAnnotationContext';
import { useUserContext } from '@/contexts/userContext';
import { cn } from '@/lib/utils';

import AnnotationHeader from '../annotation_header';
import { CommentWithReplies } from '../comment';
import Comment from '../comment';
import CommentInput from './comment_input';

interface AnnotationDetailDesktopProps {
  selected: boolean;
  annotation: AnnotationWithComments;
  statementId: string;
  statementCreatorId: string;
  nestedComments: CommentWithReplies[];
}

export default function AnnotationDetailDesktop({
  annotation,
  selected,
  statementId,
  statementCreatorId,
  nestedComments
}: AnnotationDetailDesktopProps) {
  const { replyToComment, setReplyToComment, setComments, cancelReply, handleCommentDeleted } =
    useStatementAnnotationContext();

  const { userId } = useUserContext();
  const isCreator = userId === statementCreatorId;

  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const handleReplyClick = (comment: BaseCommentWithUser) => {
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

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected && containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [selected]);

  const earliestComment = nestedComments.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )[0];

  return (
    <Card
      ref={containerRef}
      className={cn(
        'p-0 gap-0 max-h-4/5 overflow-y-auto',
        selected ? 'shadow-2xl my-4' : 'shadow-none hover:shadow-md  '
      )}
    >
      <AccordionTrigger className={cn('w-full p-4 hover:no-underline')}>
        <AnnotationHeader annotation={annotation} isCreator={isCreator} />
      </AccordionTrigger>

      <AccordionContent className="flex flex-col px-4 pb-4 gap-3">
        {nestedComments.length > 0 && (
          <div className=" border-none pb-1 ">
            {nestedComments.map((comment) => (
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
        <CommentInput
          annotation={annotation}
          replyToComment={replyToComment}
          onCancelReply={cancelReply}
          setComments={setComments}
          setReplyToComment={setReplyToComment}
        />
      </AccordionContent>
    </Card>
  );
}
