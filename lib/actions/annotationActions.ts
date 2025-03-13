"use server";

import { createClient } from "@/supabase/server";
import db from "../database";
import { EditedAnnotation, NewAnnotation } from "kysely-codegen";

export async function getAnnotationsForDraft({ draftId }: { draftId: string }) {
 const annotations = await db
  .selectFrom("annotation")
  .selectAll()
  .where("draftId", "=", draftId)
  .execute();
 return annotations;
}

export async function createAnnotation(
 { annotation }: { annotation: NewAnnotation },
) {
 await db.insertInto("annotation").values({
  ...annotation,
 }).execute();
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

export async function deleteAnnotation(
 { id, annotationCreatorId, statementCreatorId }: {
  id: string;
  annotationCreatorId: string;
  statementCreatorId: string;
 },
) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (
  !user || user.id !== annotationCreatorId || user.id !== statementCreatorId
 ) {
  return { error: "Unauthorized" };
 }

 const result = await db.deleteFrom("annotation").where("id", "=", id)
  .execute();
 return result;
}
