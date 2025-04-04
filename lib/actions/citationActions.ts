"use server";

import { NewStatementCitation, RevalidationPath } from "kysely-codegen";
import db from "../database";
import { revalidatePath } from "next/cache";

import { authenticatedUser } from "./baseActions";

export async function createCitation({
  creatorId,
  citation,
  revalidationPath,
}: {
  creatorId: string;
  citation: NewStatementCitation;
  revalidationPath?: RevalidationPath;
}) {
  await authenticatedUser(creatorId);
  await db
    .insertInto("statementCitation")
    .values(citation)
    .executeTakeFirst();

  revalidatePath(
    revalidationPath?.path || "/",
    revalidationPath?.type || "page",
  );
}

export async function updateCitation({
  creatorId,
  citation,
  revalidationPath,
}: {
  creatorId: string;
  citation: NewStatementCitation;
  revalidationPath: RevalidationPath;
}) {
  await authenticatedUser(creatorId);
  await db
    .updateTable("statementCitation")
    .set(citation)
    .where("id", "=", citation.id)
    .executeTakeFirst();

  revalidatePath(revalidationPath.path, revalidationPath.type);
}

export async function deleteCitation(
  id: string,
  creatorId: string,
) {
  await authenticatedUser(creatorId);
  await db
    .deleteFrom("statementCitation")
    .where("id", "=", id)
    .executeTakeFirst();
}

export async function deleteCitations(
  citationIds: string[],
  creatorId: string,
) {
  await authenticatedUser(creatorId);
  await db
    .deleteFrom("statementCitation")
    .where("id", "in", citationIds)
    .execute();
}
