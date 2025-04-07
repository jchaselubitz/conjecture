import {
  CamelCasePlugin,
  Insertable,
  Kysely,
  PostgresDialect,
  Selectable,
  Updateable,
} from "kysely";
import {
  Annotation,
  Comment,
  CommentVote,
  DB,
  Draft,
  Profile,
  StatementCitation,
  StatementImage,
  StatementVote,
} from "kysely-codegen";
import { Pool } from "pg";

const db = new Kysely<DB>({
  plugins: [new CamelCasePlugin()],
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
    }),
  }),
});

declare module "kysely-codegen" {
  export type RevalidationPath = {
    path: string;
    type?: "page" | "layout" | undefined;
  };

  export type BaseProfile = Selectable<Profile>;
  export type NewProfile = Insertable<Profile>;
  export type EditedProfile = Updateable<Profile>;

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

  export type BaseDraft = Selectable<Draft>;
  export type DraftWithUser = BaseDraft & {
    creatorName: string | null | undefined;
    creatorImageUrl: string | null | undefined;
    creatorSlug: string | null | undefined;
  };
  export type DraftWithAnnotations = DraftWithUser & {
    annotations: AnnotationWithComments[];
    upvotes: BaseStatementVote[];
    citations: BaseStatementCitation[];
  };

  export type NewDraft = Insertable<Draft>;
  export type EditedDraft = Updateable<Draft>;

  export type BaseAnnotation = Selectable<Annotation>;
  export type AnnotationWithComments = BaseAnnotation & {
    comments: BaseCommentWithUser[];
    userName: string;
    userImageUrl: string;
    id: string;
  };
  export type NewAnnotation = Insertable<Annotation> & {
    id: string;
  };
  export type EditedAnnotation = Updateable<Annotation>;

  export type BaseComment = Selectable<Comment>;
  export type BaseCommentWithUser = BaseComment & {
    userName: string;
    userImageUrl: string;
    votes?: BaseCommentVote[];
  };
  export type NewComment = Insertable<Comment>;
  export type EditedComment = Updateable<Comment>;

  export type BaseCommentVote = Selectable<CommentVote>;
  export type NewCommentVote = Insertable<CommentVote>;
  export type EditedCommentVote = Updateable<CommentVote>;

  export type Statement = {
    statementId: string;
    creatorSlug: string;
    drafts: DraftWithUser[];
  };
}
export default db;
