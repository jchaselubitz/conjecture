"use server";

import { createClient } from "@/supabase/server";
import db from "../database";
import { revalidatePath } from "next/cache";
import { NewCommentVote } from "kysely-codegen";

export async function createComment({ comment, statementId, parentId }: {
 comment: {
  userId: string;
  annotationId: string;
  content: string;
  id: string;
 };
 statementId: string;
 parentId?: string;
}) {
 await db.insertInto("comment")
  .values({
   userId: comment.userId,
   annotationId: comment.annotationId,
   content: comment.content,
   id: comment.id,
   parentId: parentId,
  })
  .returning("id")
  .executeTakeFirst();

 revalidatePath(`/statements/${statementId}`, "page");
}

export async function editComment({
 id,
 content,
}: {
 id: string;
 content: string;
}) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  throw new Error("No user found");
 }

 await db.updateTable("comment").set({
  content,
 }).where("id", "=", id).where("userId", "=", user.id).execute();
 revalidatePath(`/statements/[statementId]`, "page");
}

export async function deleteComment({
 id,
 commenterId,
 statementCreatorId,
}: {
 id: string;
 commenterId: string;
 statementCreatorId: string;
}) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 const userId = user?.id;
 if (userId === commenterId || userId === statementCreatorId) {
  await (db as any)
   .deleteFrom("comment")
   .where("id", "=", id)
   .execute();

  revalidatePath(`/statements/[statementId]`, "page");
 } else {
  throw new Error("Unauthorized");
 }
}

export async function toggleUpvote(
 { commentId, isUpvoted }: { commentId: string; isUpvoted: boolean },
) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 const userId = user?.id;

 if (!userId) {
  throw new Error("No user found");
 }

 try {
  if (isUpvoted) {
   await db.deleteFrom("commentVote").where("userId", "=", userId).where(
    "commentId",
    "=",
    commentId,
   ).execute();
  } else {
   await db.insertInto("commentVote").values({
    userId,
    commentId,
   } as NewCommentVote).execute();
  }
 } catch (error) {
  console.error("Error toggling upvote:", error);
 }

 revalidatePath(`/statements/[statementId]`, "page");
}
