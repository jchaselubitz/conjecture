import {
  CamelCasePlugin,
  Insertable,
  Kysely,
  PostgresDialect,
  Selectable,
  Updateable
} from 'kysely';
import {
  Annotation,
  Collaborator,
  Comment,
  CommentVote,
  DB,
  Draft,
  Follow,
  Profile,
  Statement,
  StatementCitation,
  StatementImage,
  StatementVote,
  Subscription
} from 'kysely-codegen';
import { Pool } from 'pg';

const db = new Kysely<DB>({
  plugins: [new CamelCasePlugin()],
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10
    })
  })
});

declare module 'kysely-codegen' {
  export type RevalidationPath = {
    path: string;
    type?: 'page' | 'layout' | undefined;
  };

  export type BaseProfile = Selectable<Profile>;
  export type ProfileWithFollowers = BaseProfile & {
    followerCount: number | null;
  };
  export type NewProfile = Insertable<Profile>;
  export type EditedProfile = Updateable<Profile>;

  export type BaseCollaborator = Selectable<Collaborator>;
  export type NewCollaborator = Insertable<Collaborator>;
  export type EditedCollaborator = Updateable<Collaborator>;

  export type NotificationMedium = 'email';

  export type BaseSubscription = Selectable<Subscription>;
  export type SubscriptionWithRecipient = BaseSubscription & {
    recipientUsername: string | null;
    recipientName: string | null;
    recipientImageUrl: string | null;
    recipientEmail: string | null;
  };
  export type NewSubscription = Insertable<Subscription>;
  export type EditedSubscription = Updateable<Subscription>;

  export type BaseStatementImage = Selectable<StatementImage>;
  export type NewStatementImage = Insertable<StatementImage> & {
    id: string;
  };
  export type EditedStatementImage = Updateable<StatementImage>;

  export type BaseStatementVote = Selectable<StatementVote>;
  export type NewStatementVote = Insertable<StatementVote>;
  export type EditedStatementVote = Updateable<StatementVote>;

  export type BaseStatementCitation = Selectable<StatementCitation>;
  export type NewStatementCitation = Insertable<StatementCitation> & {
    id: string;
  };
  export type EditedStatementCitation = Updateable<StatementCitation>;

  export type BaseDraft = Selectable<Draft> & {
    slug: string | null | undefined;
  };

  export type DraftWithAnnotations = BaseDraft & {
    images: BaseStatementImage[];
    annotations: AnnotationWithComments[];
    upvotes: BaseStatementVote[];
    citations: BaseStatementCitation[];
  };

  export type NewDraft = Insertable<Draft>;
  export type EditedDraft = Updateable<Draft>;

  export type BaseAnnotation = Selectable<Annotation>;
  export type AnnotationWithComments = BaseAnnotation & {
    comments: CommentWithUser[];
    userName: string;
    userImageUrl: string;
    id: string;
  };
  export type NewAnnotation = Insertable<Annotation> & {
    id: string;
  };
  export type EditedAnnotation = Updateable<Annotation>;

  export type BaseComment = Selectable<Comment>;
  export type CommentWithUser = BaseComment & {
    userName: string;
    userImageUrl: string;
    votes?: BaseCommentVote[];
    draftId: string;
  };

  export type CommentWithStatement = CommentWithUser & {
    statement?: StatementWithUser;
  };

  export type NewComment = Insertable<Comment>;
  export type EditedComment = Updateable<Comment>;

  export type BaseCommentVote = Selectable<CommentVote>;
  export type NewCommentVote = Insertable<CommentVote>;
  export type EditedCommentVote = Updateable<CommentVote>;

  export type BaseFollow = Selectable<Follow>;
  export type FollowWithFollower = BaseFollow & {
    followerName: string | null;
    followerImageUrl: string | null;
    followerUsername: string | null;
    userSince: Date;
  };
  export type FollowWithFollowed = BaseFollow & {
    followedName: string | null;
    followedImageUrl: string | null;
    followedUsername: string | null;
    userSince: Date;
  };
  export type NewFollow = Insertable<Follow>;
  export type EditedFollow = Updateable<Follow>;

  export type BaseStatement = Selectable<Statement>;

  export type StatementWithUser = BaseStatement & {
    authors: {
      id: string;
      name: string | null | undefined;
      username: string | null | undefined;
      imageUrl: string | null | undefined;
      email: string | null | undefined;
    }[];
    collaborators: BaseCollaborator[];
    creatorSlug: string | null | undefined;
    upvotes?: BaseStatementVote[];
    draft: {
      id: string;
      publishedAt?: Date | null | undefined;
      versionNumber: number;
      content?: string | null | undefined;
      contentPlainText?: string | null | undefined;
    };
  };

  // export type StatementDraft = DraftWithAnnotations & StatementWithUser;

  export type StatementPackage = StatementWithUser & {
    images: BaseStatementImage[];
    draft: DraftWithAnnotations;
    citations: BaseStatementCitation[];
    upvotes: BaseStatementVote[];
  };
}
export default db;
