'use server';

import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { CommentWithUser, NewCommentVote, RevalidationPath } from 'kysely-codegen';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/supabase/server';

import db from '../database';

import { authenticatedUser } from './baseActions';

export async function getPublicComments(draftIds: string[]) {
  try {
    const comments = await db
      .selectFrom('comment')
      .innerJoin('annotation', 'comment.annotationId', 'annotation.id')
      .select(({ eb }) => [
        'comment.id',
        'comment.content',
        'comment.createdAt',
        'comment.updatedAt',
        'comment.userId',
        'comment.annotationId',
        'comment.parentId',
        'annotation.isPublic',
        'annotation.draftId as draftId',
        jsonArrayFrom(
          eb
            .selectFrom('commentVote')
            .selectAll()
            .whereRef('commentVote.commentId', '=', 'comment.id')
        ).as('votes')
      ])
      .where('comment.isPublic', '=', true)
      .where('annotation.draftId', 'in', draftIds)
      .orderBy('createdAt', 'desc')
      .execute();

    const profileIds = new Set([...comments.map(comment => comment.userId)]);

    const profiles = await db
      .selectFrom('profile')
      .selectAll()
      .where('profile.id', 'in', Array.from(profileIds))
      .execute();

    const commentsWithProfiles = comments.map(comment => ({
      ...comment,
      userName: profiles.find(p => p.id === comment.userId)?.name,
      userImageUrl: profiles.find(p => p.id === comment.userId)?.imageUrl
    })) as CommentWithUser[];
    return commentsWithProfiles;
  } catch (error) {
    console.error('Error getting comments by annotation id:', error);
    return [];
  }
}

export async function getCommentsByAnnotationId(annotationId: string) {
  try {
    const commentsWithProfiles = await db.transaction().execute(async tx => {
      const comments = await tx
        .selectFrom('comment')
        .select(({ eb }) => [
          'comment.id',
          'comment.content',
          'comment.createdAt',
          'comment.updatedAt',
          'comment.userId',
          'comment.annotationId',
          'comment.parentId',
          'comment.isPublic',
          jsonArrayFrom(
            eb
              .selectFrom('commentVote')
              .selectAll()
              .whereRef('commentVote.commentId', '=', 'comment.id')
          ).as('votes')
        ])
        .where('annotationId', '=', annotationId)
        .orderBy('comment.createdAt', 'desc')
        .execute();

      const profileIds = new Set([...comments.map(comment => comment.userId)]);

      const profiles = await tx
        .selectFrom('profile')
        .selectAll()
        .where('profile.id', 'in', Array.from(profileIds))
        .execute();

      const commentsWithProfiles = comments.map(comment => ({
        ...comment,
        userName: profiles.find(p => p.id === comment.userId)?.name,
        userImageUrl: profiles.find(p => p.id === comment.userId)?.imageUrl,
        draftId: comment.annotationId
      })) as CommentWithUser[];
      return commentsWithProfiles;
    });
    return commentsWithProfiles;
  } catch (error) {
    console.error('Error getting comments by annotation id:', error);
    return [];
  }
}

export async function createComment({
  comment,
  parentId,
  revalidationPath
}: {
  comment: {
    userId: string;
    annotationId: string;
    content: string;
    id: string;
  };
  parentId?: string;
  revalidationPath: RevalidationPath;
}) {
  try {
    await db
      .insertInto('comment')
      .values({
        userId: comment.userId,
        annotationId: comment.annotationId,
        content: comment.content,
        id: comment.id,
        parentId: parentId
      })
      .returning('id')
      .executeTakeFirst();

    revalidatePath(revalidationPath.path, revalidationPath.type);
  } catch (error) {
    console.error('Error creating comment:', error);
    throw new Error('Failed to create comment');
  }
}

export async function editComment({
  id,
  content,
  statementId
}: {
  id: string;
  content: string;
  statementId: string;
}) {
  const user = await authenticatedUser();

  await db
    .updateTable('comment')
    .set({
      content
    })
    .where('id', '=', id)
    .where('userId', '=', user.id)
    .execute();
  revalidatePath(`/[userSlug]/${statementId}`, 'page');
}

export async function deleteComment({
  id,
  commenterId,
  statementCreatorId,
  statementId
}: {
  id: string;
  commenterId: string;
  statementCreatorId: string;
  statementId: string;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const userId = user?.id;
  if (userId === commenterId || userId === statementCreatorId) {
    await (db as any).deleteFrom('comment').where('id', '=', id).execute();

    revalidatePath(`/[userSlug]/${statementId}`, 'layout');
  } else {
    throw new Error('Unauthorized');
  }
}

export async function toggleCommentUpvote({
  commentId,
  isUpvoted,
  statementId
}: {
  commentId: string;
  isUpvoted: boolean;
  statementId: string;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const userId = user?.id;

  if (!userId) {
    throw new Error('No user found');
  }

  try {
    if (isUpvoted) {
      await db
        .deleteFrom('commentVote')
        .where('userId', '=', userId)
        .where('commentId', '=', commentId)
        .execute();
    } else {
      await db
        .insertInto('commentVote')
        .values({
          userId,
          commentId
        } as NewCommentVote)
        .execute();
    }
  } catch (error) {
    console.error('Error toggling upvote:', error);
  }

  revalidatePath(`/[userSlug]/${statementId}`, 'page');
}
