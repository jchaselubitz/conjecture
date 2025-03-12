"use server";

import { createClient } from "@/supabase/server";
import db from "@/lib/database";
import { revalidatePath } from "next/cache";
import { BaseDraft, Statement } from "kysely-codegen";
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
 versionNumber,
}: {
 title?: string;
 content?: string;
 headerImg?: string;
 statementId?: string;
 versionNumber?: number;
}) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return { error: "Unauthorized" };
 }
 const prepStatementId = statementId ? statementId : generateStatementId();
 const { statementId: returnedStatementId } = await db.insertInto("draft")
  .values({
   title,
   content,
   headerImg,
   creatorId: user.id,
   statementId: prepStatementId,
   versionNumber,
  })
  .returning(["statementId"])
  .executeTakeFirstOrThrow();

 if (returnedStatementId) {
  redirect(`/statements/${returnedStatementId}/edit?version=${versionNumber}`);
 } else {
  return { error: "Failed to create draft" };
 }
}

export async function updateDraft({
 title,
 content,
 headerImg,
 publishedAt,
 versionNumber,
 statementId,
}: {
 title?: string;
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
 console.log(statementId, versionNumber);
 await db.updateTable("draft")
  .set({
   title,
   content,
   headerImg,
   publishedAt,
   versionNumber,
  })
  .where("statementId", "=", `${statementId}`)
  .where("versionNumber", "=", versionNumber)
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
