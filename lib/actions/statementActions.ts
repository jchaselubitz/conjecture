"use server";

import { createClient } from "@/supabase/server";
import db from "@/lib/database";
import { revalidatePath } from "next/cache";
import { BaseDraft, EditedDraft, Statement } from "kysely-codegen";
import { redirect } from "next/navigation";
import { generateStatementId } from "../helpers/helpersStatements";

export async function getDrafts(): Promise<Statement[]> {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return [];
 }
 const drafts = await db
  .selectFrom("draft")
  .selectAll()
  .where("creatorId", "=", user.id)
  .orderBy("createdAt", "desc")
  .execute();

 const draftsObject = drafts.reduce((acc: Record<string, Statement>, draft) => {
  const statementId = draft.statementId;
  if (!acc[statementId]) {
   acc[statementId] = {
    statementId,
    drafts: [],
   };
  }
  acc[statementId].drafts.push(draft);
  return acc;
 }, {});

 const arrayOfStatements = Object.values(draftsObject);

 return arrayOfStatements;
}

export async function getDraftById(id: string) {
 const draft = await db
  .selectFrom("draft")
  .selectAll()
  .where("id", "=", id)
  .executeTakeFirst();
 return draft;
}

export async function getDraftsByStatementId(statementId: string) {
 const draft = await db
  .selectFrom("draft")
  .selectAll()
  .where("statementId", "=", statementId)
  .execute();
 return draft;
}

export async function createDraft({
 title,
 content,
 headerImg,
 statementId,
}: {
 title: string;
 content: string;
 headerImg?: string;
 statementId?: string;
}) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return { error: "Unauthorized" };
 }
 const prepStatementId = statementId ? statementId : generateStatementId(title);
 const { statementId: returnedStatementId } = await db.insertInto("draft")
  .values({
   title,
   content,
   headerImg,
   creatorId: user.id,
   statementId: prepStatementId,
  })
  .returning(["statementId"])
  .executeTakeFirstOrThrow();

 if (returnedStatementId) {
  redirect(`/statements/${returnedStatementId}`);
 }
}

export async function updateDraft({
 id,
 title,
 content,
 headerImg,
 isPublished,
}: EditedDraft) {
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
   content,
   headerImg,
   isPublished,
  })
  .where("id", "=", `${id}`)
  .where("creatorId", "=", user.id)
  .execute();

 revalidatePath("/feed", "page");
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

 await db.transaction().execute(async (tx) => {
  await tx.updateTable("draft").set({ isPublished: false }).where(
   "statementId",
   "=",
   statementId,
  ).execute();

  if (publish) {
   await tx.updateTable("draft").set({ isPublished: true }).where(
    "id",
    "=",
    id,
   ).where("creatorId", "=", user.id).execute();
  }
 });
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

 revalidatePath("/");
}
