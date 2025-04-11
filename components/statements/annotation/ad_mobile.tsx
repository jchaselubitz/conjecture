//can scroll through annotations on x axis, and scroll through comments on y axis
//clicking response button opens drawer fullscreen comment field on bottom of screen

import { useEffect, useRef } from 'react';
import Comment from '@/components/statements/comment';
import { CommentWithReplies } from '@/components/statements/comment';
import { AvatarFallback } from '@/components/ui/avatar';
import { AvatarImage } from '@/components/ui/avatar';
import { Avatar } from '@/components/ui/avatar';
import { formatDate } from '@/lib/helpers/helpersDate';

import { AnnotationDetailDeviceProps } from './helpersAnnotations';

interface AnnotationDetailMobileProps extends AnnotationDetailDeviceProps {
  handleAnnotationSelection: (annotationId: string) => void;
}

export default function AnnotationDetailMobile({
  annotation,
  statementCreatorId,
  statementId,
  handleReplyClick,
  handleCommentDeleted,
  handleAnnotationSelection,
  nestedComments
}: AnnotationDetailMobileProps) {
  // Use IntersectionObserver to detect when annotation is in view
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentRef = containerRef.current; // Capture the current value
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            console.log('Setting in ad_mobile', annotation.id);
            handleAnnotationSelection(annotation.id);
          }
        });
      },
      {
        threshold: 0.5 // Trigger when 50% of the element is visible
      }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [annotation.id, handleAnnotationSelection]);

  const annotationHeader = (
    <>
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
    </>
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
              isRootComment={nestedComments[0]?.id === comment.id}
            />
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="flex flex-col gap-3 min-w-screen px-2 snap-center h-full">
      <div ref={containerRef} className="h-full flex flex-col overflow-y-auto">
        {annotationHeader}
        {annotationContent}
      </div>
    </div>
  );
}
