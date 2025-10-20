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

const connectionString = process.env.DATABASE_URL_TRANSACTION_POOLING || '';
// "write-supabase-ca": "node -e \"const fs=require('fs'); if(!process.env.SUPABASE_CA_PEM){console.error('SUPABASE_CA_PEM missing'); process.exit(1)} fs.writeFileSync('./supabase-ca.pem', process.env.SUPABASE_CA_PEM)\"",
// "generate-deploy": "if [ -n \"$VERCEL\" ]; then NODE_OPTIONS=\"--dns-result-order=ipv4first\" yarn write-supabase-ca && PGSSLMODE=verify-full PGSSLROOTCERT=./supabase-ca.pem kysely-codegen; else kysely-codegen; fi",
//
// const stringWithSsl = connectionString + '?sslmode=require';

// const ssl = (() => {
//   if (process.env.NODE_ENV === 'development' && !process.env.VERCEL) {
//     return connectionString.includes('sslmode=require') ? true : false;
//   }
//   if (process.env.VERCEL || connectionString.includes('sslmode=require')) {
//     if (process.env.SUPABASE_CA_PEM) {
//       return {
//         rejectUnauthorized: true,
//         ca: process.env.SUPABASE_CA_PEM
//       };
//     }
//     return {
//       rejectUnauthorized: false
//     };
//   }
//   return { rejectUnauthorized: true };
// })();

const db = new Kysely<DB>({
  plugins: [new CamelCasePlugin()],
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: connectionString,
      // ssl: { rejectUnauthorized: true },
      max: 10,
      min: 2
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
  export type AnnotationWithStatement = AnnotationWithComments & {
    statement: {
      statementId: string;
      statementSlug: string;
      creatorSlug: string;
      versionNumber: number;
    };
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
    statement?: StatementWithDraft;
  };

  export type CommentWithReplies = CommentWithStatement & {
    children: CommentWithReplies[];
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

  export type StatementWithDraft = BaseStatement & {
    publishedAt: Date | null | undefined;
    versionNumber: number;
    content: string | null | undefined;
    contentPlainText: string | null | undefined;
    draftId: string | null | undefined;
    collaborators: BaseCollaborator[];
    authors: {
      id: string;
      name: string | null | undefined;
      username: string | null | undefined;
      imageUrl: string | null | undefined;
      email: string | null | undefined;
    }[];
    // upvotes: BaseStatementVote[];
    creatorSlug: string | null | undefined;
  };

  export type StatementWithDraftAndCollaborators = BaseStatement & {
    authors: {
      id: string;
      name: string | null | undefined;
      username: string | null | undefined;
      imageUrl: string | null | undefined;
      email: string | null | undefined;
    }[];
    managers: {
      id: string;
      name: string | null | undefined;
      username: string | null | undefined;
      imageUrl: string | null | undefined;
      email: string | null | undefined;
    }[];
    collaborators: BaseCollaborator[];
    creatorSlug: string | null | undefined;
    upvotes?: BaseStatementVote[];
    draft: BaseDraft;
    versionList: { versionNumber: number; createdAt: Date }[];
  };

  export type StatementPackage = StatementWithDraftAndCollaborators & {
    draft: DraftWithAnnotations;
    images: BaseStatementImage[];
    citations: BaseStatementCitation[];
  };
}
export default db;
