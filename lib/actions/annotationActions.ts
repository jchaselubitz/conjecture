'use server';

import { EditedAnnotation } from 'kysely-codegen';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/supabase/server';

import db from '../database';

export async function getAnnotationsForDraft({ draftId }: { draftId: string }) {
  const annotations = await db
    .selectFrom('annotation')
    .selectAll()
    .where('draftId', '=', draftId)
    .execute();
  return annotations;
}

export async function createAnnotation({
  annotation,
  statementId
}: {
  annotation: {
    id: string;
    tag: string | undefined | null;
    text: string;
    start: number;
    end: number;
    userId: string;
    draftId: string;
  };
  statementId: string;
}) {
  const { id: annotationId } = await db
    .insertInto('annotation')
    .values({
      ...annotation
    })
    .returning('id')
    .executeTakeFirstOrThrow();
  revalidatePath(`/[userSlug]/${statementId}`, 'page');
  console.log(annotationId, 'annotationId');
  return annotationId;
}

export async function updateAnnotation({
  annotation,
  statementId
}: {
  annotation: EditedAnnotation;
  statementId: string;
}) {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || user.id !== annotation.userId) {
    return { error: 'Unauthorized' };
  }
  if (!annotation.id) {
    return { error: 'Annotation ID is required' };
  }

  const annotationId = annotation.id;
  const { start, end, text } = annotation;

  await db
    .updateTable('annotation')
    .set({
      id: annotationId,
      start,
      end,
      text
    })
    .where('id', '=', annotation.id)
    .execute();
  revalidatePath(`/[userSlug]/${statementId}`, 'page');
}

export async function deleteAnnotation({
  annotationId,
  statementCreatorId,
  annotationCreatorId,
  statementId
}: {
  annotationId: string;
  statementCreatorId: string;
  annotationCreatorId: string;
  statementId: string;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No user found');
  }

  if (user.id === annotationCreatorId || user.id === statementCreatorId) {
    await db.deleteFrom('annotation').where('id', '=', annotationId).execute();
  } else {
    throw new Error('Unauthorized');
  }

  revalidatePath(`/[userSlug]/${statementId}`, 'page');
}

export async function deleteAnnotationsBatch({
  annotationIds,
  userId, // The ID of the user initiating the delete, for authorization
  statementCreatorId, // Optional: Creator of the statement for authorization rules
  statementId // For revalidation
}: {
  annotationIds: string[];
  userId: string;
  statementCreatorId?: string; // Make optional if not always needed for auth check
  statementId: string;
}) {
  if (!annotationIds || annotationIds.length === 0) {
    console.log('No annotation IDs provided for batch deletion.');
    return { success: true, deletedCount: 0 }; // Nothing to delete
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    // Basic check: User must be logged in and match the provided userId
    // More complex auth might be needed depending on rules (e.g., can only delete own, or statement creator can delete all)
    // For now, we assume the caller provides the correct userId and potentially statementCreatorId if needed for checks elsewhere
    throw new Error('Unauthorized: User mismatch or not logged in.');
  }

  // Add more sophisticated authorization logic here if needed
  // e.g., check if user ID matches annotationCreatorId for each annotation,
  // or if user ID matches statementCreatorId. This might require fetching annotations first.
  // Simplified for now: Assumes the calling logic verified permissions.

  try {
    const result = await db
      .deleteFrom('annotation')
      .where('id', 'in', annotationIds)
      // Add an additional authorization check if necessary, e.g.:
      // .where((eb) => eb.or([
      //   eb('userId', '=', userId), // User can delete their own
      //   ...(statementCreatorId ? [eb('userId', '=', statementCreatorId)] : []) // Or statement creator can delete (if provided) - Adjust logic as needed
      // ]))
      .executeTakeFirst(); // executeTakeFirst gives Result<DB, number | bigint> | undefined

    const deletedCount = Number(result?.numDeletedRows ?? 0); // Use numDeletedRows for Kysely PgDialect

    console.log(
      `Attempted to delete ${annotationIds.length} annotations. Deleted: ${deletedCount}`
    );

    if (deletedCount > 0) {
      revalidatePath(`/[userSlug]/${statementId}`, 'page');
      // Consider revalidating specific annotation-related paths if applicable
    }

    return { success: true, deletedCount };
  } catch (error) {
    console.error('Error deleting annotations batch:', error);
    // Consider more specific error handling or re-throwing
    throw new Error('Failed to delete annotations batch.');
  }
}
