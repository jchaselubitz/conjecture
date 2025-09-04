import { AnnotationWithComments, CommentWithReplies, CommentWithUser } from 'kysely-codegen';
import { Dispatch, SetStateAction, useRef } from 'react';

import Comment from '@/components/statements/comment';
import { useStatementAnnotationContext } from '@/contexts/StatementAnnotationContext';
import { useStatementContext } from '@/contexts/StatementBaseContext';
import { useUserContext } from '@/contexts/userContext';

import AnnotationHeader from '../annotation_header';

interface AnnotationDetailMobileProps {
  annotation: AnnotationWithComments;
  statementCreatorId: string;
  statementId: string;
  setReplyToComment: Dispatch<SetStateAction<CommentWithUser | null>>;
  nestedComments: CommentWithReplies[];
  handleDeleteAnnotation: (annotation: AnnotationWithComments) => Promise<void>;
}

export default function AnnotationDetailMobile({
  annotation,
  statementCreatorId,
  statementId,
  nestedComments,
  handleDeleteAnnotation
}: AnnotationDetailMobileProps) {
  const { editor } = useStatementContext();
  const { setReplyToComment, handleCommentDeleted, comments } = useStatementAnnotationContext();

  const { userId } = useUserContext();
  const isCreator = userId === statementCreatorId;

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

  const earliestComment = nestedComments.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )[0];

  return (
    <div className="flex flex-col gap-3 px-2 h-full">
      <div className="h-full flex flex-col overflow-y-auto">
        <AnnotationHeader
          annotation={annotation}
          isCreator={isCreator}
          isMobile={true}
          editor={editor}
          handleDeleteAnnotation={handleDeleteAnnotation}
        />
        {comments.length > 0 && (
          <div className="border-b pb-1 border-muted">
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
            <div className="h-32"></div>
          </div>
        )}
      </div>
    </div>
  );
}
