//can scroll through annotations on x axis, and scroll through comments on y axis
//clicking response button opens drawer fullscreen comment field on bottom of screen

import { AnnotationWithComments, BaseCommentWithUser } from 'kysely-codegen';
import { Dispatch, SetStateAction, useRef } from 'react';
import Comment from '@/components/statements/comment';
import { CommentWithReplies } from '@/components/statements/comment';
import { AvatarFallback } from '@/components/ui/avatar';
import { AvatarImage } from '@/components/ui/avatar';
import { Avatar } from '@/components/ui/avatar';
import { useStatementAnnotationContext } from '@/contexts/StatementAnnotationContext';
import { formatDate } from '@/lib/helpers/helpersDate';
interface AnnotationDetailMobileProps {
  annotation: AnnotationWithComments;
  statementCreatorId: string;
  statementId: string;
  handleAnnotationSelection: (annotationId: string) => void;
  setReplyToComment: Dispatch<SetStateAction<BaseCommentWithUser | null>>;
  nestedComments: CommentWithReplies[];
}

export default function AnnotationDetailMobile({
  annotation,
  statementCreatorId,
  statementId,
  handleAnnotationSelection,
  nestedComments
}: AnnotationDetailMobileProps) {
  const { setReplyToComment, handleCommentDeleted } = useStatementAnnotationContext();

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

  const earliestComment = nestedComments.sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  )[0];

  const rootComment = earliestComment;

  const annotationHeader = (
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
  );

  const annotationContent = (
    <>
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
              isRootComment={rootComment?.id === comment.id}
            />
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="flex flex-col gap-3 px-2 h-full">
      <div className="h-full flex flex-col overflow-y-auto">
        {annotationHeader}
        {annotationContent}
      </div>
    </div>
  );
}
