import {
  AnnotationWithComments,
  AnnotationWithStatement,
  CommentWithReplies,
  CommentWithUser
} from 'kysely-codegen';
import { RefreshCw, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import AnnotationHeader from '@/components/statements/annotation_header';
import Comment from '@/components/statements/comment';
import { AccordionContent, AccordionTrigger } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { useUserContext } from '@/contexts/userContext';
import { cn } from '@/lib/utils';

interface AnnotationItemProps {
  selected: boolean;
  annotation: AnnotationWithStatement;
  statementId: string;
  statementCreatorId: string;
}

export default function AnnotationItem({
  annotation,
  selected,
  statementCreatorId
}: AnnotationItemProps) {
  const { userId } = useUserContext();
  const isCreator = userId === statementCreatorId;
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const [comments, setComments] = useState<CommentWithReplies[]>(
    (annotation.comments as CommentWithReplies[]) || []
  );

  const { statementId, statementSlug, creatorSlug } = annotation.statement;

  // const handleReplyClick = (comment: CommentWithUser) => {
  //   setReplyToComment(comment);
  //   // Focus the textarea and scroll to it
  //   setTimeout(() => {
  //     if (commentInputRef.current) {
  //       commentInputRef.current.focus();
  //       commentInputRef.current.scrollIntoView({
  //         behavior: 'smooth',
  //         block: 'center'
  //       });
  //     }
  //   }, 100);
  // };

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

  const router = useRouter();

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
          <AnnotationHeader annotation={annotation} isCreator={isCreator} isMobile={false} />
        </AccordionTrigger>
      </div>
      <AccordionContent className="flex flex-col px-4 pb-4 gap-3">
        {annotation.comments && annotation.comments.length > 0 && (
          <div className=" border-none pb-1 ">
            {annotation.comments.map(comment => (
              <Comment
                key={comment.id}
                comment={comment as CommentWithReplies}
                replies={(comment as CommentWithReplies).children || []}
                statementId={statementId}
                statementCreatorId={statementCreatorId}
                annotationId={annotation.id}
                onReplyClick={() => {
                  console.log('replying to comment', comment);
                  router.push(
                    `/${creatorSlug}/${statementSlug}/${annotation.statement.versionNumber}?annotation-id=${annotation.id}&comment-id=${comment.id}`
                  );
                }}
                onCommentDeleted={() => {}}
                isRootComment={earliestComment.id === comment.id}
              />
            ))}
          </div>
        )}
        {/* <CommentInput annotation={annotation} /> */}
      </AccordionContent>
    </Card>
  );
}
