'use client';

import { AnnotationWithComments, BaseCommentWithUser, NewAnnotation } from 'kysely-codegen';
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState
} from 'react';

import { useStatementContext } from './StatementContext';

interface StatementAnnotationContextType {
  annotations: NewAnnotation[];
  setAnnotations: Dispatch<SetStateAction<NewAnnotation[]>>;
  selectedAnnotationId: string | undefined;
  setSelectedAnnotationId: Dispatch<SetStateAction<string | undefined>>;
  selectedAnnotation: AnnotationWithComments | null;
  setSelectedAnnotation: Dispatch<SetStateAction<AnnotationWithComments | null>>;
  comments: BaseCommentWithUser[];
  setComments: Dispatch<SetStateAction<BaseCommentWithUser[]>>;
  replyToComment: BaseCommentWithUser | null;
  setReplyToComment: Dispatch<SetStateAction<BaseCommentWithUser | null>>;
  cancelReply: () => void;
  handleCommentDeleted: (commentId: string) => void;
}

const StatementAnnotationContext = createContext<StatementAnnotationContextType | undefined>(
  undefined
);

export function StatementAnnotationProvider({ children }: { children: ReactNode }) {
  const { statement } = useStatementContext();
  const [annotations, setAnnotations] = useState<NewAnnotation[]>(statement.annotations);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | undefined>(undefined);
  const [selectedAnnotation, setSelectedAnnotation] = useState<AnnotationWithComments | null>(null);
  const [comments, setComments] = useState<BaseCommentWithUser[]>(
    selectedAnnotation?.comments || []
  );
  const [replyToComment, setReplyToComment] = useState<BaseCommentWithUser | null>(null);

  useEffect(() => {
    setSelectedAnnotation(
      (annotations.find((a) => a.id === selectedAnnotationId) as AnnotationWithComments) || null
    );
  }, [selectedAnnotationId, annotations, setSelectedAnnotation]);

  const cancelReply = () => {
    setReplyToComment(null);
  };

  const handleCommentDeleted = (commentId: string) => {
    setComments((prevComments) => prevComments.filter((comment) => comment.id !== commentId));
    // If we were replying to this comment, cancel the reply
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
