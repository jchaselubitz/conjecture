"use server";

import { createClient } from "@/supabase/server";
import db from "@/lib/database";
import { revalidatePath } from "next/cache";
import {
  AnnotationWithComments,
  BaseCommentWithUser,
  BaseDraft,
  BaseStatementCitation,
  BaseStatementVote,
  DraftWithAnnotations,
  NewAnnotation,
  Statement,
} from "kysely-codegen";
import { redirect } from "next/navigation";
import { generateStatementId } from "../helpers/helpersStatements";
import { jsonArrayFrom } from "kysely/helpers/postgres";
import { authenticatedUser } from "./baseActions";
import { nanoid } from "nanoid";
import { deleteStoredStatementImage } from "./storageActions";

export async function getDrafts({
  forCurrentUser = false,
  publishedOnly = true,
  creatorId,
}: {
  forCurrentUser?: boolean;
  publishedOnly?: boolean;
  creatorId?: string;
}): Promise<Statement[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }
  let drafts = db
    .selectFrom("draft")
    .innerJoin("profile", "draft.creatorId", "profile.id")
    .select(({ eb }) => [
      "draft.id",
      "draft.title",
      "draft.subtitle",
      "draft.content",
      "draft.headerImg",
      "draft.publishedAt",
      "draft.versionNumber",
      "draft.statementId",
      "draft.creatorId",
      "draft.createdAt",
      "draft.updatedAt",
      "draft.parentStatementId",
      "draft.threadId",
      "profile.name as creatorName",
      "profile.imageUrl as creatorImageUrl",
      "profile.username as creatorSlug",
      jsonArrayFrom(
        eb
          .selectFrom("statementVote")
          .selectAll()
          .whereRef("statementVote.statementId", "=", "draft.statementId"),
      ).as("upvotes"),
    ])
    .orderBy("versionNumber", "desc");

  if (publishedOnly) {
    drafts = drafts.where("publishedAt", "is not", null);
  }

  if (forCurrentUser) {
    drafts = drafts.where("creatorId", "=", user.id);
  }

  if (creatorId) {
    drafts = drafts.where("creatorId", "=", creatorId);
  }

  const objects = await drafts.execute();

  const draftsObject = objects.reduce(
    (acc: Record<string, Statement>, draft) => {
      const statementId = draft.statementId;
      const creatorSlug = draft.creatorSlug;
      if (!acc[statementId]) {
        acc[statementId] = {
          statementId,
          creatorSlug,
          drafts: [],
        };
      }
      acc[statementId].drafts.push(draft);
      return acc;
    },
    {},
  );

  const arrayOfStatements = Object.values(draftsObject);

  return arrayOfStatements;
}

// export async function getDraftById(
//   id: string,
// ): Promise<DraftWithUser | null | undefined> {
//   const draft = await db
//     .selectFrom("draft")
//     .innerJoin("profile", "draft.creatorId", "profile.id")
//     .select([
//       "draft.id",
//       "draft.title",
//       "draft.subtitle",
//       "draft.content",
//       "draft.headerImg",
//       "draft.publishedAt",
//       "draft.versionNumber",
//       "draft.statementId",
//       "draft.creatorId",
//       "draft.createdAt",
//       "draft.updatedAt",
//       "profile.name as creatorName",
//       "profile.imageUrl as creatorImageUrl",
//       "profile.username as creatorSlug",
//     ])
//     .where("id", "=", id)
//     .executeTakeFirst();
//   return draft;
// }

export async function getPublishedStatement(
  statementId: string,
): Promise<BaseDraft | null> {
  const statement = await db
    .selectFrom("draft")
    .selectAll()
    .where("statementId", "=", statementId)
    .where("publishedAt", "is not", null)
    .executeTakeFirst();
  return statement ?? null;
}

export async function getDraftsByStatementId(
  statementId: string,
): Promise<DraftWithAnnotations[]> {
  const draft = await db
    .selectFrom("draft")
    .innerJoin("profile", "draft.creatorId", "profile.id")
    .select(({ eb }) => [
      "draft.id",
      "draft.title",
      "draft.subtitle",
      "draft.content",
      "draft.headerImg",
      "draft.publishedAt",
      "draft.versionNumber",
      "draft.statementId",
      "draft.creatorId",
      "draft.createdAt",
      "draft.updatedAt",
      "draft.parentStatementId",
      "draft.threadId",
      "profile.name as creatorName",
      "profile.imageUrl as creatorImageUrl",
      "profile.username as creatorSlug",
      jsonArrayFrom(
        eb
          .selectFrom("statementCitation")
          .selectAll()
          .whereRef("statementCitation.statementId", "=", "draft.statementId"),
      ).as("citations"),
      jsonArrayFrom(
        eb
          .selectFrom("statementVote")
          .selectAll()
          .whereRef("statementVote.statementId", "=", "draft.statementId"),
      ).as("upvotes"),
      jsonArrayFrom(
        eb
          .selectFrom("annotation")
          .innerJoin("profile", "annotation.userId", "profile.id")
          .select(({ eb }) => [
            "annotation.id",
            "tag",
            "text",
            "start",
            "end",
            "annotation.userId",
            "annotation.draftId",
            "annotation.createdAt",
            "annotation.updatedAt",
            "annotation.isPublic",
            "profile.name as userName",
            "profile.imageUrl as userImageUrl",
            jsonArrayFrom(
              eb
                .selectFrom("comment")
                .innerJoin("profile", "comment.userId", "profile.id")
                .select(({ eb }) => [
                  "comment.id",
                  "comment.content",
                  "comment.createdAt",
                  "comment.updatedAt",
                  "comment.userId",
                  "comment.annotationId",
                  "comment.parentId",
                  "profile.name as userName",
                  "profile.imageUrl as userImageUrl",
                  jsonArrayFrom(
                    eb
                      .selectFrom("commentVote")
                      .selectAll()
                      .whereRef("commentVote.commentId", "=", "comment.id"),
                  ).as("votes"),
                ])
                .whereRef("annotation.id", "=", "comment.annotationId"),
            ).as("comments"),
          ])
          .whereRef("draft.id", "=", "annotation.draftId")
          .orderBy("annotation.createdAt", "desc"),
      ).as("annotations"),
    ])
    .where("statementId", "=", statementId)
    .execute();

  const draftWithAnnotations = draft.map((draft) => ({
    ...draft,
    upvotes: draft.upvotes.map((u) => ({
      id: u.id,
      userId: u.userId,
      statementId: u.statementId,
      createdAt: u.createdAt,
    })) as BaseStatementVote[],
    citations: draft.citations.map((c) => ({
      ...c,
    })) as BaseStatementCitation[],
    annotations: draft.annotations.map((a) => ({
      ...a,
      comments: a.comments.map((c) => ({
        ...c,
        userName: c.userName,
      })) as BaseCommentWithUser[],
    })) as AnnotationWithComments[],
  }));

  return draftWithAnnotations;
}

export async function createDraft({
  title,
  subtitle,
  content,
  headerImg,
  statementId,
  versionNumber,
  annotations,
  parentId,
  threadId,
}: {
  title?: string;
  subtitle?: string;
  content?: string;
  headerImg?: string;
  statementId?: string;
  versionNumber: number;
  annotations?: NewAnnotation[];
  parentId?: string | null;
  threadId?: string | null;
}) {
  const user = await authenticatedUser();

  const prepStatementId = statementId ? statementId : generateStatementId();

  const prepThreadId = threadId ? threadId : nanoid();
  const statementThreadId = parentId ? prepThreadId : null;

  const { statementId: returnedStatementId } = await db.transaction().execute(
    async (tx) => {
      const { statementId: returnedStatementId, id: draftId } = await tx
        .insertInto("draft")
        .values({
          title,
          content,
          headerImg,
          creatorId: user.id,
          statementId: prepStatementId,
          versionNumber,
          subtitle,
          parentStatementId: parentId,
          threadId: statementThreadId,
        })
        .returning(["statementId", "id"])
        .executeTakeFirstOrThrow();

      if (annotations) {
        const annotationsWithDraftId = annotations.map((annotation) => ({
          ...annotation,
          draftId,
        }));
        await tx.insertInto("annotation").values(annotationsWithDraftId)
          .execute();
      }

      if (parentId) {
        await tx.updateTable("draft").set({
          threadId: prepThreadId,
        }).where("statementId", "=", parentId).where("threadId", "is", null)
          .execute();
      }

      return { statementId: returnedStatementId, draftId };
    },
  );

  if (returnedStatementId) {
    redirect(
      `/statements/${returnedStatementId}?version=${versionNumber}`,
    );
  } else {
    return { error: "Failed to create draft" };
  }
}

export async function updateDraft({
  title,
  subtitle,
  content,
  headerImg,
  publishedAt,
  versionNumber,
  statementId,
  creatorId,
}: {
  title?: string;
  subtitle?: string;
  content?: string;
  headerImg?: string;
  publishedAt?: Date;
  versionNumber: number;
  statementId?: string;
  creatorId: string;
}) {
  const user = await authenticatedUser(creatorId);

  await db.updateTable("draft")
    .set({
      title,
      subtitle,
      content,
      headerImg,
      publishedAt,
      versionNumber,
    })
    .where("statementId", "=", `${statementId}`)
    .where("versionNumber", "=", versionNumber)
    .where("creatorId", "=", user.id)
    .execute();
}

export async function publishDraft({
  statementId,
  id,
  publish,
  creatorId,
}: {
  statementId: string;
  id: string;
  publish: boolean;
  creatorId: string;
}) {
  await authenticatedUser(creatorId);

  const now = new Date();
  await db.transaction().execute(async (tx) => {
    await tx.updateTable("draft").set({ publishedAt: null }).where(
      "statementId",
      "=",
      statementId,
    ).execute();

    if (publish) {
      await tx.updateTable("draft").set({ publishedAt: now }).where(
        "id",
        "=",
        id,
      ).execute();
    }
  });
}

export async function updateStatementHeaderImageUrl(
  statementId: string,
  creatorId: string,
  imageUrl: string,
) {
  await authenticatedUser(creatorId);
  await db.updateTable("draft").set({ headerImg: imageUrl }).where(
    "statementId",
    "=",
    statementId,
  ).execute();
  revalidatePath(`/statements/${statementId}`, "page");
}

export async function deleteDraft(id: string, creatorId: string) {
  await authenticatedUser(creatorId);
  await db.deleteFrom("draft").where("id", "=", id).execute();
  revalidatePath(`/statements}`, "page");
}

export async function deleteStatement(
  statementId: string,
  creatorId: string,
  headerImg: string,
) {
  await authenticatedUser(creatorId);
  await deleteStoredStatementImage({
    url: headerImg,
    creatorId,
    statementId,
  });
  await db.deleteFrom("draft").where("statementId", "=", statementId)
    .execute();

  revalidatePath(`/statements}`, "page");
}

export type UpsertImageDataType = {
  src: string;
  alt: string;
  statementId: string;
  id: string;
};

export async function upsertStatementImage({
  alt,
  src,
  statementId,
  id,
}: {
  alt: string;
  src: string;
  statementId: string;
  id: string;
}) {
  const user = await authenticatedUser();
  await db.insertInto("statementImage").values({
    id,
    src,
    alt,
    statementId,
    creatorId: user.id,
  }).onConflict((oc) =>
    oc.column("id").doUpdateSet({
      src,
      alt,
      statementId,
      id,
    }).where("statementImage.id", "=", id).where(
      "statementImage.creatorId",
      "=",
      user.id,
    )
  )
    .execute();
}

export async function deleteStatementImage(id: string) {
  const user = await authenticatedUser();
  await db.deleteFrom("statementImage").where("id", "=", id).where(
    "creatorId",
    "=",
    user.id,
  ).execute();
}

export async function toggleStatementUpvote({
  statementId,
  isUpvoted,
}: {
  statementId: string;
  isUpvoted: boolean;
}) {
  const user = await authenticatedUser();

  if (isUpvoted) {
    await db.deleteFrom("statementVote").where("statementId", "=", statementId)
      .where("userId", "=", user.id).execute();
  } else {
    await db.insertInto("statementVote").values({
      statementId,
      userId: user.id,
    }).execute();
  }

  revalidatePath(`/statements/[statementId]`, "page");
}
