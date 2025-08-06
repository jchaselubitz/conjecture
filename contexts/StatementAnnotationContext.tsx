'use client';

import { AnnotationWithComments, CommentWithReplies, CommentWithUser } from 'kysely-codegen';
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState
} from 'react';

import { nestComments } from '@/lib/helpers/helpersComments';

import { useStatementContext } from './StatementBaseContext';

interface StatementAnnotationContextType {
  annotations: AnnotationWithComments[];
  setAnnotations: Dispatch<SetStateAction<AnnotationWithComments[]>>;
  selectedAnnotationId: string | undefined;
  setSelectedAnnotationId: Dispatch<SetStateAction<string | undefined>>;
  selectedAnnotation: AnnotationWithComments | null;
  setSelectedAnnotation: Dispatch<SetStateAction<AnnotationWithComments | null>>;
  comments: CommentWithReplies[];
  setComments: Dispatch<SetStateAction<CommentWithReplies[]>>;
  addComment: (comment: CommentWithReplies) => void;
  replyToComment: CommentWithUser | null;
  setReplyToComment: Dispatch<SetStateAction<CommentWithUser | null>>;
  cancelReply: () => void;
  handleCommentDeleted: (commentId: string) => void;
}

const StatementAnnotationContext = createContext<StatementAnnotationContextType | undefined>(
  undefined
);

export function StatementAnnotationProvider({ children }: { children: ReactNode }) {
  const { annotations, setAnnotations } = useStatementContext();

  console.log('annotations', annotations);

  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | undefined>(undefined);
  const [selectedAnnotation, setSelectedAnnotation] = useState<AnnotationWithComments | null>(null);

  const [comments, setComments] = useState<CommentWithReplies[]>(
    nestComments(selectedAnnotation?.comments || [])
  );

  const [replyToComment, setReplyToComment] = useState<CommentWithUser | null>(null);

  useEffect(() => {
    setComments(nestComments(selectedAnnotation?.comments || []));
  }, [selectedAnnotation]);

  useEffect(() => {
    setSelectedAnnotation(
      (annotations.find(a => a.id === selectedAnnotationId) as AnnotationWithComments) || null
    );
  }, [selectedAnnotationId, annotations, setSelectedAnnotation]);

  const cancelReply = () => {
    setReplyToComment(null);
  };

  // a kind of hackish way to keep the comments in sync with the annotations
  const handleAddComment = (comment: CommentWithReplies) => {
    setComments(prevComments => nestComments([...prevComments, comment]));
    const newAnnotations = annotations.map(a =>
      a.id === selectedAnnotationId
        ? {
            ...a,
            comments: [...a.comments, comment]
          }
        : a
    );
    setAnnotations(newAnnotations as AnnotationWithComments[]);
  };

  // a kind of hackish way to keep the comments in sync with the annotations
  const handleCommentDeleted = (commentId: string) => {
    setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
    // If we were replying to this comment, cancel the reply
    const newAnnotations = annotations.map(a =>
      a.id === selectedAnnotationId
        ? {
            ...a,
            comments: a.comments.filter(comment => comment.id !== commentId)
          }
        : a
    );
    setAnnotations(newAnnotations as AnnotationWithComments[]);
    if (replyToComment?.id === commentId) {
      setReplyToComment(null);
    }
  };

  const sortedAnnotations = annotations.sort((a, b) => {
    return a.start - b.start;
  });

  return (
    <StatementAnnotationContext.Provider
      value={{
        annotations: sortedAnnotations,
        setAnnotations,
        selectedAnnotationId,
        setSelectedAnnotationId,
        selectedAnnotation,
        setSelectedAnnotation,
        comments,
        setComments,
        addComment: handleAddComment,
        replyToComment,
        setReplyToComment,
        cancelReply,
        handleCommentDeleted
      }}
    >
      {children}
    </StatementAnnotationContext.Provider>
  );
}

export function useStatementAnnotationContext() {
  const context = useContext(StatementAnnotationContext);
  if (context === undefined) {
    throw new Error(
      'useStatementAnnotationContext must be used within a StatementAnnotationProvider'
    );
  }
  return context;
}
