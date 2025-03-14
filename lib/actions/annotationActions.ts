"use server";

import { createClient } from "@/supabase/server";
import db from "../database";
import { EditedAnnotation } from "kysely-codegen";
import { revalidatePath } from "next/cache";
export async function getAnnotationsForDraft({ draftId }: { draftId: string }) {
 const annotations = await db
  .selectFrom("annotation")
  .selectAll()
  .where("draftId", "=", draftId)
  .execute();
 return annotations;
}

export async function createAnnotation(
 { annotation, statementId }: {
  annotation: {
   id: string;
   tag: string | undefined | null;
   text: string;
   start: number;
   end: number;
   userId: string;
   draftId: string; //we need to supply this for a responsive UI
  };
  statementId: string;
 },
) {
 const { id: annotationId } = await db.insertInto("annotation").values({
  ...annotation,
 }).returning("id").executeTakeFirstOrThrow();
 revalidatePath(`/statements/${statementId}`, "page");
 return annotationId;
}

export async function updateAnnotation(
 { id, annotation }: { id: string; annotation: EditedAnnotation },
) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user || user.id !== annotation.userId) {
  return { error: "Unauthorized" };
 }
 const result = await db.updateTable("annotation").set(annotation).where(
  "id",
  "=",
  id,
 ).execute();
 return result;
}

export async function deleteAnnotation({
 annotationId,
 statementCreatorId,
 annotationCreatorId,
 statementId,
}: {
 annotationId: string;
 statementCreatorId: string;
 annotationCreatorId: string;
 statementId: string;
}) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  throw new Error("No user found");
 }

 if (
  user.id === annotationCreatorId || user.id === statementCreatorId
 ) {
  await db.deleteFrom("annotation").where("id", "=", annotationId)
   .execute();
 } else {
  throw new Error("Unauthorized");
 }

 revalidatePath(`/statements/${statementId}`, "page");
}
