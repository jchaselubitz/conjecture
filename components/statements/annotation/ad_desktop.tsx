import { AnnotationWithComments, BaseCommentWithUser } from 'kysely-codegen';
import { useEffect, useRef } from 'react';
import { AccordionContent, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useStatementAnnotationContext } from '@/contexts/StatementAnnotationContext';
import { formatDate } from '@/lib/helpers/helpersDate';
import { cn } from '@/lib/utils';

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

  return (
    <Card
      ref={containerRef}
      className={cn(
        'p-0 gap-0 max-h-4/5 overflow-y-auto',
        selected ? 'shadow-2xl my-4' : 'shadow-none hover:shadow-md  '
      )}
    >
      <AccordionTrigger className={cn('w-full p-4 hover:no-underline')}>
        <div className="flex flex-col gap-3 w-full">
          {annotation.text && (
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm italic line-clamp-2">{`"${annotation.text}"`}</p>
            </div>
          )}

          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <Avatar className="border ">
                <AvatarImage src={annotation.userImageUrl} className="object-cover" />
                <AvatarFallback>{annotation.userName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{annotation.userName || 'User'}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate({
                    date: new Date(annotation.createdAt),
                    withTime: true
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="flex flex-col px-4 pb-4 gap-3">
        {nestedComments.length > 0 && (
          <div className="border-b pb-1 border-muted">
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
                isRootComment={nestedComments[0]?.id === comment.id}
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
          cancelReply={cancelReply}
        />
      </AccordionContent>
    </Card>
  );
}
