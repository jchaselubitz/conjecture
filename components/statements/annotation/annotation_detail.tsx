'use client';

import { AnnotationWithComments, BaseCommentWithUser } from 'kysely-codegen';
import React, { useEffect, useRef } from 'react';
import { useWindowSize } from 'react-use';
import { AccordionItem } from '@/components/ui/accordion';
import { useStatementAnnotationContext } from '@/contexts/StatementAnnotationContext';
import { nestComments } from '@/lib/helpers/helpersGeneral';

import AnnotationDetailDesktop from './ad_desktop';
import AnnotationDetailMobile from './ad_mobile';

interface AnnotationDetailProps {
  annotation: AnnotationWithComments;
  handleAnnotationSelection: (annotationId: string) => void;
  statementCreatorId: string;
  statementId: string;
  selectedAnnotationId: string | undefined;
}

const AnnotationDetail: React.FC<AnnotationDetailProps> = ({
  annotation,
  handleAnnotationSelection,
  statementCreatorId,
  statementId,
  selectedAnnotationId
}) => {
  const { replyToComment, setReplyToComment, setComments, cancelReply, handleCommentDeleted } =
    useStatementAnnotationContext();

  const isMobile = useWindowSize().width < 768;

  const annotationRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (selectedAnnotationId && annotationRef.current) {
      annotationRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [selectedAnnotationId]);

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

  const nestedComments = nestComments(annotation?.comments || []);

  if (isMobile) {
    return (
      <AnnotationDetailMobile
        annotation={annotation}
        statementCreatorId={statementCreatorId}
        statementId={statementId}
        replyToComment={replyToComment}
        handleReplyClick={handleReplyClick}
        handleAnnotationSelection={handleAnnotationSelection}
        nestedComments={nestedComments}
        cancelReply={cancelReply}
        setReplyToComment={setReplyToComment}
        setComments={setComments}
        handleCommentDeleted={handleCommentDeleted}
      />
    );
  } else {
    return (
      <AccordionItem value={annotation.id} className="border-0 ">
        <AnnotationDetailDesktop
          annotation={annotation}
          selected={selectedAnnotationId === annotation.id}
          nestedComments={nestedComments}
          statementId={statementId}
          statementCreatorId={statementCreatorId}
          handleReplyClick={handleReplyClick}
          replyToComment={replyToComment}
          cancelReply={cancelReply}
          setReplyToComment={setReplyToComment}
          setComments={setComments}
          handleCommentDeleted={handleCommentDeleted}
        />
      </AccordionItem>
    );
  }
};

export default AnnotationDetail;
