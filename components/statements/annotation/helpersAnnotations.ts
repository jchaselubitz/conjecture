import { AnnotationWithComments } from 'kysely-codegen';
import { BaseCommentWithUser } from 'kysely-codegen';

import { CommentWithReplies } from '../comment';

export interface AnnotationDetailDeviceProps {
  annotation: AnnotationWithComments;
  statementCreatorId: string;
  statementId: string;
  replyToComment: BaseCommentWithUser | null;
  cancelReply: () => void;
  setReplyToComment: React.Dispatch<React.SetStateAction<BaseCommentWithUser | null>>;
  handleReplyClick: (comment: BaseCommentWithUser) => void;
  handleCommentDeleted: (commentId: string) => void;
  setComments: React.Dispatch<React.SetStateAction<BaseCommentWithUser[]>>;
  nestedComments: CommentWithReplies[];
}
