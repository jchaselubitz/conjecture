'use client';
import { AnnotationWithStatement } from 'kysely-codegen';
import React, { useState } from 'react';

import { Accordion, AccordionItem } from '@/components/ui/accordion';

import AnnotationItem from './annotation_item';

interface AnnotationFeedProps {
  annotations: AnnotationWithStatement[];
}

export default function AnnotationFeed({ annotations }: AnnotationFeedProps) {
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | undefined>(undefined);
  // nestComments and CommentWithReplies should be imported or defined elsewhere

  return (
    <Accordion
      type="single"
      collapsible
      value={selectedAnnotationId}
      onValueChange={value => setSelectedAnnotationId(value)}
    >
      <div className="flex md:flex-col gap-2 mx-auto max-w-11/12 ">
        {annotations.map(annotation => (
          <AccordionItem key={annotation.id} value={annotation.id} className="border-none">
            <AnnotationItem
              key={annotation.id}
              annotation={annotation}
              statementId={annotation.statement.statementId}
              selected={selectedAnnotationId === annotation.id}
              statementCreatorId={annotation.userId}
            />
          </AccordionItem>
        ))}
        <div className="h-20" />
      </div>
    </Accordion>
  );
}

// export function FeedComment({
//   comment,
//   replies,
//   statementId,
//   statementCreatorId,
//   annotationId
// }: {
//   comment: CommentWithReplies;
//   replies: CommentWithReplies[];
//   statementId: string;
//   statementCreatorId: string;
//   annotationId: string;
//   isRootComment: boolean;
// }) {
//   return (
//     <Card className="p-0 px-4">
//       <Comment
//         comment={comment}
//         replies={replies}
//         statementId={statementId}
//         statementCreatorId={statementCreatorId}
//         annotationId={annotationId}
//         onReplyClick={() => {}}
//         onCommentDeleted={() => {}}
//         isRootComment={false}
//       />
//     </Card>
//   );
// }
