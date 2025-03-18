"use server";

import { createClient } from "@/supabase/server";
import db from "@/lib/database";
import { revalidatePath } from "next/cache";
import {
  AnnotationWithComments,
  BaseCommentWithUser,
  DraftWithAnnotations,
  DraftWithUser,
  NewAnnotation,
  Statement,
} from "kysely-codegen";
import { redirect } from "next/navigation";
import { generateStatementId } from "../helpers/helpersStatements";
import { jsonArrayFrom } from "kysely/helpers/postgres";

export async function getDrafts({
  forCurrentUser = false,
  publishedOnly = true,
}: {
  forCurrentUser?: boolean;
  publishedOnly?: boolean;
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
    .select([
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

      "profile.name as creatorName",
      "profile.imageUrl as creatorImageUrl",
    ])
    .orderBy("versionNumber", "desc");

  if (publishedOnly) {
    drafts = drafts.where("publishedAt", "is not", null);
  }

  if (forCurrentUser) {
    drafts = drafts.where("creatorId", "=", user.id);
  }

  const objects = await drafts.execute();

  const draftsObject = objects.reduce(
    (acc: Record<string, Statement>, draft) => {
      const statementId = draft.statementId;
      if (!acc[statementId]) {
        acc[statementId] = {
          statementId,
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

export async function getDraftById(
  id: string,
): Promise<DraftWithUser | null | undefined> {
  const draft = await db
    .selectFrom("draft")
    .innerJoin("profile", "draft.creatorId", "profile.id")
    .select([
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
      "profile.name as creatorName",
      "profile.imageUrl as creatorImageUrl",
    ])
    .where("id", "=", id)
    .executeTakeFirst();
  return draft;
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
      "profile.name as creatorName",
      "profile.imageUrl as creatorImageUrl",
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
}: {
  title?: string;
  subtitle?: string;
  content?: string;
  headerImg?: string;
  statementId?: string;
  versionNumber: number;
  annotations?: NewAnnotation[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }
  const prepStatementId = statementId ? statementId : generateStatementId();

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

      return { statementId: returnedStatementId, draftId };
    },
  );

  if (returnedStatementId) {
    redirect(
      `/statements/${returnedStatementId}/edit?version=${versionNumber}`,
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
}: {
  title?: string;
  subtitle?: string;
  content?: string;
  headerImg?: string;
  publishedAt?: Date;
  versionNumber: number;
  statementId?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }
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
}: {
  statementId: string;
  id: string;
  publish: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

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

export async function updateStatementImageUrl(
  statementId: string,
  imageUrl: string,
) {
  await db.updateTable("draft").set({ headerImg: imageUrl }).where(
    "statementId",
    "=",
    statementId,
  ).execute();
  revalidatePath(`/statements/${statementId}`, "page");
}

export async function deleteDraft(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  await db.deleteFrom("draft").where("id", "=", id).execute();

  revalidatePath(`/statements}`, "page");
}
