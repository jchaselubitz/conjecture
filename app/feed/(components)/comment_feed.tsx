'use client';
import React from 'react';

import CommentInput from '@/components/statements/annotation/comment_input';
import Comment, { CommentWithReplies } from '@/components/statements/comment';
import { Card } from '@/components/ui/card';

interface CommentFeedProps {
  nestedComments: CommentWithReplies[];
}

export default function CommentFeed({ nestedComments }: CommentFeedProps) {
  // nestComments and CommentWithReplies should be imported or defined elsewhere

  const earliestComment = nestedComments.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )[0];

  if (!nestedComments.length) return null;

  return (
    <div className="flex flex-col gap-6">
      {nestedComments.map(comment => (
        <div key={comment.id} className="flex flex-col gap-6">
          <FeedComment
            key={comment.id}
            comment={comment}
            replies={(comment.children as CommentWithReplies[]) || []}
            statementId={comment.statement?.statementId || ''}
            statementCreatorId={comment.statement?.creatorId || ''}
            annotationId={comment.annotationId}
            // onReplyClick={() => {}}
            isRootComment={earliestComment.id === comment.id}
          />
          {/* <CommentInput
            statementId={comment.statement?.statementId || ''}
            annotationId={comment.annotationId}
            onCommentCreated={() => {}}
          /> */}
        </div>
      ))}
    </div>
  );
}

export function FeedComment({
  comment,
  replies,
  statementId,
  statementCreatorId,
  annotationId
}: {
  comment: CommentWithReplies;
  replies: CommentWithReplies[];
  statementId: string;
  statementCreatorId: string;
  annotationId: string;
  isRootComment: boolean;
}) {
  return (
    <Card className="p-0 px-4">
      <Comment
        comment={comment}
        replies={replies}
        statementId={statementId}
        statementCreatorId={statementCreatorId}
        annotationId={annotationId}
        onReplyClick={() => {}}
        onCommentDeleted={() => {}}
        isRootComment={false}
      />
    </Card>
  );
}
