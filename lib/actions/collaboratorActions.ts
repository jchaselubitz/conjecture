'use server';

import db from '../database';

export const getCollaborators = async (statementSlug: string) => {
  const collaborators = await db
    .selectFrom('collaborator')
    .selectAll()
    .where('statementId', '=', statementSlug)
    .execute();
  return collaborators;
};
