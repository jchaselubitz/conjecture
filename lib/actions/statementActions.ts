"use server";

import { jsonArrayFrom } from "kysely/helpers/postgres";
import {
  AnnotationWithComments,
  BaseComment,
  BaseCommentWithUser,
  BaseStatementCitation,
  BaseStatementImage,
  BaseStatementVote,
  DraftWithAnnotations,
  DraftWithUser,
  NewAnnotation,
  Statement,
} from "kysely-codegen";
import { RevalidationPath } from "kysely-codegen";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import db from "@/lib/database";
import { createClient } from "@/supabase/server";

import {
  checkValidStatementSlug,
  generateStatementId,
} from "../helpers/helpersStatements";
import { createStatementImageUrl } from "../helpers/helpersStorage";

import { authenticatedUser } from "./baseActions";
import { deleteStoredStatementImage } from "./storageActions";

export async function getDrafts({
  forCurrentUser,
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

  let drafts = db
    .selectFrom("draft")
    .leftJoin(
      "draft as previousDraft",
      "draft.parentStatementId",
      "previousDraft.statementId",
    )
    .innerJoin("profile", "draft.creatorId", "profile.id")
    .innerJoin("statementUrl", "draft.statementId", "statementUrl.statementId")
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
      "statementUrl.slug",
      jsonArrayFrom(
        eb.selectFrom("annotation").selectAll().whereRef(
          "annotation.draftId",
          "=",
          "draft.id",
        ),
      ).as("annotations"),
      jsonArrayFrom(
        eb
          .selectFrom("statementVote")
          .selectAll()
          .whereRef("statementVote.statementId", "=", "draft.statementId"),
      ).as("upvotes"),
    ])
    .orderBy("versionNumber", "desc");

  if (publishedOnly) {
    drafts = drafts.where("draft.publishedAt", "is not", null);
  }

  if (forCurrentUser && user) {
    drafts = drafts.where("draft.creatorId", "=", user.id);
  }

  if (creatorId) {
    drafts = drafts.where("draft.creatorId", "=", creatorId);
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

export async function getFullThread(
  threadId: string,
): Promise<DraftWithUser[]> {
  const thread = await db.transaction().execute(async (tx) => {
    const drafts = await tx
      .selectFrom("draft")
      .innerJoin(
        "statementUrl",
        "draft.statementId",
        "statementUrl.statementId",
      )
      .innerJoin("profile", "draft.creatorId", "profile.id")
      .where("threadId", "=", threadId)
      .select([
        "draft.id",
        "draft.title",
        "draft.subtitle",
        "draft.content",
        "draft.headerImg",
        "draft.createdAt",
        "draft.updatedAt",
        "draft.creatorId",
        "draft.statementId",
        "draft.versionNumber",
        "draft.parentStatementId",
        "draft.publishedAt",
        "draft.threadId",
        "profile.name as creatorName",
        "profile.username as creatorSlug",
        "statementUrl.slug as slug",
      ])
      .where("publishedAt", "is not", null)
      .orderBy("publishedAt", "asc")
      .execute();

    return drafts;
  });

  return thread;
}

export async function getPublishedStatement(
  statementSlug: string,
): Promise<DraftWithUser | null> {
  const statement = await db.transaction().execute(async (tx) => {
    const { statementId } = await tx
      .selectFrom("statementUrl")
      .where("slug", "=", statementSlug)
      .select("statementId")
      .executeTakeFirstOrThrow();
    const statement = await tx
      .selectFrom("draft")
      .innerJoin("profile", "draft.creatorId", "profile.id")
      .innerJoin(
        "statementUrl",
        "draft.statementId",
        "statementUrl.statementId",
      )
      .select(({ eb }) => [
        "draft.id",
        "draft.title",
        "draft.subtitle",
        "draft.content",
        "draft.headerImg",
        "draft.publishedAt",
        "draft.creatorId",
        "draft.createdAt",
        "draft.updatedAt",
        "draft.parentStatementId",
        "draft.threadId",
        "draft.statementId",
        "draft.versionNumber",
        "profile.name as creatorName",
        "profile.imageUrl as creatorImageUrl",
        "profile.username as creatorSlug",
        "statementUrl.slug",
        jsonArrayFrom(
          eb.selectFrom("annotation").selectAll().whereRef(
            "annotation.draftId",
            "=",
            "draft.id",
          ),
        ).as("annotations"),
      ])
      .where("draft.statementId", "=", statementId)
      .where("publishedAt", "is not", null)
      .executeTakeFirst();

    return statement ?? null;
  });

  return statement;
}

export async function getDraftsByStatementSlug(
  statementSlug: string,
): Promise<DraftWithAnnotations[]> {
  const draftPackage = await db.transaction().execute(async (tx) => {
    const { statementId } = await tx
      .selectFrom("statementUrl")
      .where("slug", "=", statementSlug)
      .select("statementId")
      .executeTakeFirstOrThrow();

    const drafts = await tx
      .selectFrom("draft")
      .innerJoin(
        "statementUrl",
        "draft.statementId",
        "statementUrl.statementId",
      )
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

        "statementUrl.slug",
        jsonArrayFrom(
          eb
            .selectFrom("statementImage")
            .select(["id", "src", "alt", "caption"])
            .whereRef("statementImage.statementId", "=", "draft.statementId"),
        ).as("images"),
        jsonArrayFrom(
          eb
            .selectFrom("statementCitation")
            .selectAll()
            .whereRef(
              "statementCitation.statementId",
              "=",
              "draft.statementId",
            ),
        ).as("citations"),
        jsonArrayFrom(
          eb
            .selectFrom("statementVote")
            .selectAll()
            .whereRef("statementVote.statementId", "=", "draft.statementId"),
        ).as("upvotes"),
      ])
      .where("draft.statementId", "=", statementId)
      .execute();

    const draftIds = drafts.map((draft) => draft.id);

    const annotations = await tx
      .selectFrom("annotation")
      .selectAll()
      .where("annotation.draftId", "in", draftIds)
      .orderBy("annotation.createdAt", "desc")
      .execute();

    const annotationIds = annotations.map((annotation) => annotation.id);

    let comments: BaseComment[] = [];
    if (annotationIds.length > 0) {
      comments = await tx
        .selectFrom("comment")
        .select(({ eb }) => [
          "comment.id",
          "comment.content",
          "comment.createdAt",
          "comment.updatedAt",
          "comment.userId",
          "comment.annotationId",
          "comment.parentId",
          jsonArrayFrom(
            eb
              .selectFrom("commentVote")
              .selectAll()
              .whereRef("commentVote.commentId", "=", "comment.id"),
          ).as("votes"),
        ])
        .where("comment.annotationId", "in", annotationIds)
        .orderBy("comment.createdAt", "desc")
        .execute();
    }

    const profileIds = new Set([
      ...drafts.map((draft) => draft.creatorId),
      ...comments.map((comment) => comment.userId),
      ...annotations.map((annotation) => annotation.userId),
    ]);

    const profiles = await tx
      .selectFrom("profile")
      .selectAll()
      .where("profile.id", "in", Array.from(profileIds))
      .execute();

    return {
      drafts,
      annotations,
      comments,
      profiles,
    };
  });

  const { drafts, annotations, comments, profiles } = draftPackage;

  const draftWithAnnotations = drafts.map((draft) => ({
    ...draft,
    creatorName: profiles.find((p) => p.id === draft.creatorId)?.name,
    creatorImageUrl: profiles.find((p) => p.id === draft.creatorId)?.imageUrl,
    creatorSlug: profiles.find((p) => p.id === draft.creatorId)?.username,
    slug: draft.slug,
    images: draft.images.map((i) => ({
      ...i,
    })) as BaseStatementImage[],
    upvotes: draft.upvotes.map((u) => ({
      id: u.id,
      userId: u.userId,
      statementId: u.statementId,
      createdAt: u.createdAt,
    })) as BaseStatementVote[],
    citations: draft.citations.map((c) => ({
      ...c,
    })) as BaseStatementCitation[],
    annotations: annotations.map((a) => ({
      ...a,
      userName: profiles.find((p) => p.id === a.userId)?.name,
      userImageUrl: profiles.find((p) => p.id === a.userId)?.imageUrl,
      comments: comments
        .filter((c) => c.annotationId === a.id)
        .map((c) => ({
          ...c,
          userName: profiles.find((p) => p.id === c.userId)?.name,
          userImageUrl: profiles.find((p) => p.id === c.userId)?.imageUrl,
        })) as BaseCommentWithUser[],
    })) as AnnotationWithComments[],
  }));

  return draftWithAnnotations;
}

export async function createDraft({
  statementId,
  title,
  subtitle,
  content,
  headerImg,
  versionNumber,
  annotations,
  parentId,
  threadId,
}: {
  statementId?: string;
  title?: string;
  subtitle?: string;
  content?: string;
  headerImg?: string;
  versionNumber: number;
  annotations?: NewAnnotation[];
  parentId?: string | null;
  threadId?: string | null;
}) {
  const user = await authenticatedUser();

  const prepStatementId = statementId ? statementId : generateStatementId();
  const defaultSlug = prepStatementId;

  const prepThreadId = threadId ? threadId : nanoid();
  const statementThreadId = parentId ? prepThreadId : null;

  const { statementId: returnedStatementId } = await db.transaction().execute(
    async (tx) => {
      const { statementId: returnedStatementId, id: draftId } = await db
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

      await tx
        .insertInto("statementUrl")
        .values({
          statementId: prepStatementId,
          slug: defaultSlug,
        })
        .execute();

      if (annotations && annotations.length > 0) {
        const annotationsWithDraftId = annotations.map((annotation) => ({
          ...annotation,
          draftId,
        }));
        await tx.insertInto("annotation").values(annotationsWithDraftId)
          .execute();
      }

      if (parentId) {
        await tx
          .updateTable("draft")
          .set({
            threadId: prepThreadId,
          })
          .where("statementId", "=", parentId)
          .where("threadId", "is", null)
          .execute();
      }

      return { statementId: returnedStatementId, draftId };
    },
  );

  if (returnedStatementId) {
    redirect(
      `/[userSlug]/${returnedStatementId}?version=${versionNumber}&edit=true`,
    );
  } else {
    return { error: "Failed to create draft" };
  }
}

export async function updateStatementUrl({
  statementId,
  slug,
  creatorId,
}: {
  statementId: string;
  slug: string;
  creatorId: string;
}) {
  await authenticatedUser(creatorId);

  if (!checkValidStatementSlug(slug)) {
    return { error: "Invalid slug" };
  }
  try {
    await db
      .updateTable("statementUrl")
      .set({
        slug,
      })
      .where("statementId", "=", statementId)
      .execute();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("duplicate key value violates unique constraint")
    ) {
      return { error: "URL already exists" };
    }
    return { error: "Failed to update statement URL" };
  }
}

export async function updateDraft({
  id,
  title,
  subtitle,
  content,
  headerImg,
  versionNumber,
  statementId,
  creatorId,
}: {
  id: string;
  title?: string;
  subtitle?: string;
  content?: string;
  headerImg?: string;
  versionNumber: number;
  statementId: string;
  creatorId: string;
}) {
  const user = await authenticatedUser(creatorId);

  await db
    .updateTable("draft")
    .set({
      title,
      subtitle,
      content,
      headerImg,
    })
    .where("id", "=", id)
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
    await tx
      .updateTable("draft")
      .set({ publishedAt: null })
      .where("statementId", "=", statementId)
      .execute();

    if (publish) {
      await tx.updateTable("draft").set({ publishedAt: now }).where(
        "id",
        "=",
        id,
      ).execute();
    }
  });
}

export async function updateStatementHeaderImageUrl({
  statementId,
  creatorId,
  imageUrl,
  revalidationPath,
}: {
  statementId: string;
  creatorId: string;
  imageUrl: string;
  revalidationPath?: RevalidationPath;
}) {
  await authenticatedUser(creatorId);
  await db
    .updateTable("draft")
    .set({ headerImg: imageUrl })
    .where("statementId", "=", statementId)
    .execute();
  // revalidatePath(
  //   revalidationPath?.path ?? `/[userSlug]/${statementId}`,
  //   "layout",
  // );
}

export async function deleteDraft(id: string, creatorId: string) {
  await authenticatedUser(creatorId);
  await db.deleteFrom("draft").where("id", "=", id).execute();
  revalidatePath(`/[userSlug]`, "layout");
}

export async function deleteStatement(
  statementId: string,
  creatorId: string,
  headerImg: string,
  revalidationPath?: RevalidationPath,
) {
  await authenticatedUser(creatorId);
  await deleteStoredStatementImage({
    url: headerImg,
    creatorId,
    statementId,
  });
  await db.deleteFrom("draft").where("statementId", "=", statementId).execute();

  revalidatePath(revalidationPath?.path ?? `/[userSlug]`, "layout");
}

export type UpsertImageDataType = {
  src: string;
  alt?: string | undefined | null;
  statementId: string;
  id: string;
  caption?: string | undefined | null;
};

export async function upsertStatementImage({
  alt,
  src,
  statementId,
  id,
  caption,
  revalidationPath,
}: {
  alt: UpsertImageDataType["alt"];
  src: UpsertImageDataType["src"];
  statementId: UpsertImageDataType["statementId"];
  id: UpsertImageDataType["id"];
  caption?: UpsertImageDataType["caption"];
  revalidationPath?: RevalidationPath;
}) {
  const user = await authenticatedUser();
  await db
    .insertInto("statementImage")
    .values({
      id,
      src,
      alt,
      statementId,
      caption,
      creatorId: user.id,
    })
    .onConflict((oc) =>
      oc
        .column("id")
        .doUpdateSet({
          src,
          alt,
          statementId,
          caption,
          id,
        })
        .where("statementImage.id", "=", id)
        .where("statementImage.creatorId", "=", user.id)
    )
    .execute();
  revalidatePath(
    revalidationPath?.path ?? `/[userSlug]/${statementId}`,
    revalidationPath?.type ?? "layout",
  );
}

export async function deleteStatementImage(
  id: string,
  statementId: string,
  creatorId: string,
  revalidationPath?: RevalidationPath,
) {
  const user = await authenticatedUser(creatorId);
  const imageUrl = createStatementImageUrl({
    userId: creatorId,
    statementId,
    imageId: id,
  });
  await deleteStoredStatementImage({
    url: imageUrl,
    creatorId: user.id,
    statementId,
  });

  await db
    .deleteFrom("statementImage")
    .where("id", "=", id)
    .where("creatorId", "=", user.id)
    .execute();
  // revalidatePath(
  //   revalidationPath?.path ?? `/[userSlug]/[statementId]`,
  //   "layout",
  // );
}

export async function toggleStatementUpvote({
  statementId,
  isUpvoted,
  revalidationPath,
}: {
  statementId: string;
  isUpvoted: boolean;
  revalidationPath?: RevalidationPath;
}) {
  const user = await authenticatedUser();

  if (isUpvoted) {
    await db
      .deleteFrom("statementVote")
      .where("statementId", "=", statementId)
      .where("userId", "=", user.id)
      .execute();
  } else {
    await db
      .insertInto("statementVote")
      .values({
        statementId,
        userId: user.id,
      })
      .execute();
  }

  revalidatePath(
    revalidationPath?.path ?? `/[userSlug]/${statementId}`,
    "layout",
  );
}
