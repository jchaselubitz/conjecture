'use client';

import { AnnotationWithComments, CommentWithReplies, CommentWithUser } from 'kysely-codegen';
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useMemo,
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

  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | undefined>(undefined);
  const [commentsOverride, setCommentsOverride] = useState<CommentWithReplies[] | null>(null);

  const [replyToComment, setReplyToComment] = useState<CommentWithUser | null>(null);

  const selectedAnnotation = useMemo(
    () =>
      (annotations.find(a => a.id === selectedAnnotationId) as
        | AnnotationWithComments
        | undefined) || null,
    [annotations, selectedAnnotationId]
  );

  const comments = useMemo(
    () => commentsOverride ?? nestComments(selectedAnnotation?.comments || []),
    [commentsOverride, selectedAnnotation]
  );

  const setComments: Dispatch<SetStateAction<CommentWithReplies[]>> = update => {
    setCommentsOverride(prevCommentsOverride => {
      const baseComments = prevCommentsOverride ?? nestComments(selectedAnnotation?.comments || []);
      return typeof update === 'function'
        ? (update as (prevState: CommentWithReplies[]) => CommentWithReplies[])(baseComments)
        : update;
    });
  };

  const handleSetSelectedAnnotationId: Dispatch<SetStateAction<string | undefined>> = update => {
    setSelectedAnnotationId(prevSelectedAnnotationId => {
      const nextSelectedAnnotationId =
        typeof update === 'function' ? update(prevSelectedAnnotationId) : update;
      setCommentsOverride(null);
      return nextSelectedAnnotationId;
    });
  };

  const setSelectedAnnotation: Dispatch<SetStateAction<AnnotationWithComments | null>> = update => {
    const nextSelectedAnnotation =
      typeof update === 'function' ? update(selectedAnnotation) : update;
    setCommentsOverride(null);
    setSelectedAnnotationId(nextSelectedAnnotation?.id);
  };

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

  const sortedAnnotations = [...annotations].sort((a, b) => {
    return a.start - b.start;
  });

  return (
    <StatementAnnotationContext.Provider
      value={{
        annotations: sortedAnnotations,
        setAnnotations,
        selectedAnnotationId,
        setSelectedAnnotationId: handleSetSelectedAnnotationId,
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
