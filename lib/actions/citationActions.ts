"use server";

import { NewStatementCitation } from "kysely-codegen";
import db from "../database";
import { revalidatePath } from "next/cache";

export async function createCitation(citation: NewStatementCitation) {
 await db
  .insertInto("statementCitation")
  .values(citation)
  .executeTakeFirst();

 revalidatePath("/statements", "page");
}

export async function updateCitation(citation: NewStatementCitation) {
 await db
  .updateTable("statementCitation")
  .set(citation)
  .where("id", "=", citation.id)
  .executeTakeFirst();
}
