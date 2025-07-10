'use server';

import { jsonArrayFrom } from 'kysely/helpers/postgres';
import {
  AnnotationWithComments,
  BaseComment,
  BaseProfile,
  CommentWithUser,
  DraftWithAnnotations,
  NewAnnotation,
  StatementPackage,
  StatementWithUser
} from 'kysely-codegen';
import { RevalidationPath } from 'kysely-codegen';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import db from '@/lib/database';

import { AuthorGroup, UserStatementRoles } from '../enums/permissions';
import { checkValidStatementSlug, generateStatementId } from '../helpers/helpersStatements';
import { createStatementImageUrl } from '../helpers/helpersStorage';

import { authenticatedUser, getUser, isAuthor } from './baseActions';
import { deleteStoredStatementImage } from './storageActions';

export async function getStatementId(statementSlug: string) {
  const statement = await db
    .selectFrom('statement')
    .select('statementId')
    .where('slug', '=', statementSlug)
    .executeTakeFirstOrThrow();
  return statement.statementId;
}

export async function getStatements({
  forCurrentUser,
  publishedOnly,
  creatorId,
  statementSlug,
  statementId
}: {
  forCurrentUser?: boolean;
  publishedOnly?: boolean;
  creatorId?: string;
  statementSlug?: string;
  statementId?: string;
}): Promise<StatementWithUser[]> {
  const user = await getUser();
  let statements = db
    .selectFrom('statement')
    .leftJoin('draft', 'statement.statementId', 'draft.statementId')
    .select(({ eb }) => [
      'statement.statementId',
      'statement.slug',
      'statement.creatorId',
      'statement.createdAt',
      'statement.updatedAt',
      'statement.parentStatementId',
      'statement.headerImg as headerImg',
      'statement.title',
      'statement.subtitle',
      'statement.threadId',
      'statement.distributedAt as distributedAt',
      'draft.publishedAt as publishedAt',
      'draft.content as content',
      'draft.versionNumber as versionNumber',
      'draft.id as draftId',
      jsonArrayFrom(
        eb
          .selectFrom('collaborator')
          .selectAll()
          .whereRef('collaborator.statementId', '=', 'statement.statementId')
          .where('collaborator.role', 'in', AuthorGroup)
      ).as('collaborators'),
      jsonArrayFrom(
        eb
          .selectFrom('statementVote')
          .selectAll()
          .whereRef('statementVote.statementId', '=', 'statement.statementId')
      ).as('upvotes')
    ]);

  if (forCurrentUser && user) {
    statements = statements.where('statement.creatorId', '=', user.id);
  }
  if (creatorId) {
    statements = statements.where('statement.creatorId', '=', creatorId);
  }
  if (statementSlug) {
    statements = statements.where('statement.slug', '=', statementSlug);
  }
  if (statementId) {
    statements = statements.where('statement.statementId', '=', statementId);
  }
  if (publishedOnly) {
    statements = statements
      .where('draft.publishedAt', 'is not', null)
      .orderBy('draft.publishedAt', 'desc');
  } else {
    statements = statements.orderBy('draft.createdAt', 'desc');
  }

  const statementsList = await statements.execute();

  if (statementsList.length === 0) {
    return [];
  }

  const authorIds = statementsList.flatMap(statement => {
    return statement.collaborators.map(collaborator => collaborator.userId);
  });

  const profiles = await db
    .selectFrom('profile')
    .selectAll()
    .where('id', 'in', authorIds)
    .execute();

  const getStatementAuthors = (
    statement: {
      collaborators: { userId: string }[];
    },
    profiles: BaseProfile[]
  ) => {
    return statement.collaborators
      .map(collaborator => profiles.find(profile => profile.id === collaborator.userId))
      .filter((profile): profile is BaseProfile => !!profile);
  };

  return statementsList.map(statement => ({
    ...statement,
    creatorSlug: profiles.find(profile => profile.id === statement.creatorId)?.username,
    authors: getStatementAuthors(statement, profiles),
    draft: {
      id: statement.draftId,
      publishedAt: statement.publishedAt,
      versionNumber: statement.versionNumber,
      content: statement.content
    }
  })) as StatementWithUser[];
}

export async function getFullThread(threadId: string): Promise<StatementWithUser[]> {
  const statementsList = await db
    .selectFrom('statement')
    .innerJoin('draft', 'statement.statementId', 'draft.statementId')
    .innerJoin('profile', 'statement.creatorId', 'profile.id')
    .select(({ eb }) => [
      'statement.statementId',
      'statement.slug',
      'statement.creatorId',
      'statement.createdAt',
      'statement.updatedAt',
      'statement.parentStatementId',
      'statement.headerImg as headerImg',
      'statement.title',
      'statement.subtitle',
      'statement.threadId',
      'statement.distributedAt as distributedAt',
      'draft.publishedAt as publishedAt',
      'draft.versionNumber as versionNumber',
      'draft.content as content',
      'draft.contentPlainText as contentPlainText',
      'draft.id as draftId',
      jsonArrayFrom(
        eb
          .selectFrom('collaborator')
          .selectAll()
          .whereRef('collaborator.statementId', '=', 'statement.statementId')
          .where('collaborator.role', 'in', AuthorGroup)
      ).as('collaborators'),
      'profile.username as creatorSlug'
    ])
    .where('threadId', '=', threadId)
    .where('draft.publishedAt', 'is not', null)
    .orderBy('draft.publishedAt', 'asc')
    .execute();

  const authorIds = statementsList.flatMap(statement => {
    return statement.collaborators.map(collaborator => collaborator.userId);
  });

  const profiles = await db
    .selectFrom('profile')
    .selectAll()
    .where('id', 'in', authorIds)
    .execute();

  const profileMap = new Map(profiles.map(profile => [profile.id, profile]));

  return statementsList.map(statement => ({
    ...statement,
    authors: statement.collaborators
      .map(collaborator => profileMap.get(collaborator.userId))
      .filter((profile): profile is BaseProfile => !!profile),
    creatorSlug: statement.creatorSlug,
    draft: {
      id: statement.draftId,
      publishedAt: statement.publishedAt,
      versionNumber: statement.versionNumber,
      content: statement.content
    }
  }));
}

export async function getPublishedOrLatest(
  statementSlug: string,
  userIsCollaborator: boolean = false
): Promise<{
  version: number;
  versionList: { versionNumber: number; createdAt: Date }[];
} | null> {
  if (statementSlug === 'appspecific') {
    return null;
  }
  try {
    const statement = await db
      .selectFrom('statement')
      .selectAll()
      .where('slug', '=', statementSlug)
      .executeTakeFirstOrThrow();

    const drafts = await db
      .selectFrom('draft')
      .selectAll()
      .where('statementId', '=', statement.statementId)
      .execute();

    const versions = drafts
      .map(draft => ({
        versionNumber: draft.versionNumber,
        createdAt: draft.createdAt
      }))
      .sort((a, b) => b.versionNumber - a.versionNumber);

    if (drafts.length > 0 && userIsCollaborator) {
      const greatestVersionNumber = drafts.reduce(
        (max, draft) => Math.max(max, draft.versionNumber),
        0
      );
      return { version: greatestVersionNumber, versionList: versions };
    }
    const publishedDraft = drafts.filter(draft => draft.publishedAt !== null)[0]?.versionNumber;

    return { version: publishedDraft ?? undefined, versionList: versions };
  } catch (error) {
    return null;
  }
}

export async function getStatementPackage({
  statementSlug,
  version
}: {
  statementSlug: string;
  version?: number;
}): Promise<StatementPackage> {
  const statPackage = await db.transaction().execute(async tx => {
    const statement = await tx
      .selectFrom('statement')
      .select(({ eb }) => [
        'statementId',
        'slug',
        'creatorId',
        'createdAt',
        'updatedAt',
        'parentStatementId',
        'headerImg',
        'threadId',
        'title',
        'subtitle',
        'distributedAt',
        jsonArrayFrom(
          eb
            .selectFrom('collaborator')
            .selectAll()
            .whereRef('collaborator.statementId', '=', 'statement.statementId')
        ).as('collaborators'),
        jsonArrayFrom(
          eb
            .selectFrom('statementImage')
            .selectAll()
            .whereRef('statementImage.statementId', '=', 'statement.statementId')
        ).as('images'),
        jsonArrayFrom(
          eb
            .selectFrom('statementCitation')
            .selectAll()
            .whereRef('statementCitation.statementId', '=', 'statement.statementId')
        ).as('citations'),
        jsonArrayFrom(
          eb
            .selectFrom('statementVote')
            .selectAll()
            .whereRef('statementVote.statementId', '=', 'statement.statementId')
        ).as('upvotes')
      ])
      .where('slug', '=', statementSlug)
      .executeTakeFirstOrThrow();

    let draftQuery = tx
      .selectFrom('draft')
      .selectAll()
      .where('draft.statementId', '=', statement.statementId);
    if (version) {
      draftQuery = draftQuery.where('versionNumber', '=', version);
    } else {
      draftQuery = draftQuery.where('publishedAt', 'is not', null);
    }

    const draft = await draftQuery.executeTakeFirstOrThrow();

    const annotations = await tx
      .selectFrom('annotation')
      .selectAll()
      .where('annotation.draftId', '=', draft.id)
      .orderBy('annotation.createdAt', 'desc')
      .execute();

    const annotationIds = annotations.map(annotation => annotation.id);

    let comments: BaseComment[] = [];
    if (annotationIds.length > 0) {
      comments = await tx
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
        .where('comment.annotationId', 'in', annotationIds)
        .orderBy('comment.createdAt', 'desc')
        .execute();
    }

    const profileIds = new Set([
      ...statement.collaborators.map(collaborator => collaborator.userId),
      ...comments.map(comment => comment.userId),
      ...annotations.map(annotation => annotation.userId)
    ]);

    const profiles = await tx
      .selectFrom('profile')
      .selectAll()
      .where('profile.id', 'in', Array.from(profileIds))
      .execute();

    return {
      statement,
      draft,
      annotations,
      comments,
      profiles
    };
  });

  const { statement, draft, annotations, comments, profiles } = statPackage;

  const authors = statement.collaborators
    .map(collaborator =>
      AuthorGroup.includes(collaborator.role as UserStatementRoles)
        ? profiles.find(p => p.id === collaborator.userId)
        : undefined
    )
    .filter(author => author !== undefined);

  const statementPackage = {
    ...statement,
    authors,
    creatorSlug: profiles.find(p => p.id === statement.creatorId)?.username,
    citations: statement.citations.map(c => ({
      ...c,
      title: c.title ?? ''
    })),
    images: statement.images,
    upvotes: statement.upvotes,
    collaborators: statement.collaborators,
    draft: {
      ...draft,
      annotations: annotations
        .filter(a => a.draftId === draft.id)
        .map(a => ({
          ...a,
          userName: profiles.find(p => p.id === a.userId)?.name,
          userImageUrl: profiles.find(p => p.id === a.userId)?.imageUrl,
          comments: comments
            .filter(c => c.annotationId === a.id)
            .map(c => ({
              ...c,
              userName: profiles.find(p => p.id === c.userId)?.name,
              userImageUrl: profiles.find(p => p.id === c.userId)?.imageUrl
            })) as CommentWithUser[]
        })) as AnnotationWithComments[]
    } as DraftWithAnnotations
  };

  return statementPackage;
}

type CreateStatementParams = {
  creatorSlug: string;
  creatorId: string;
  title?: string;
  subtitle?: string;
  content?: string;
  headerImg?: string;
  parentId?: string;
  threadId?: string;
};

export async function createStatement({
  creatorSlug,
  creatorId,
  title,
  subtitle,
  content,
  headerImg,
  parentId,
  threadId
}: CreateStatementParams) {
  const user = await authenticatedUser(creatorId);

  const generatedStatementId = generateStatementId();

  try {
    const { slug, statementId } = await db
      .insertInto('statement')
      .values({
        statementId: generatedStatementId,
        slug: generatedStatementId,
        creatorId: user.id,
        title,
        subtitle,
        headerImg,
        parentStatementId: parentId,
        threadId: threadId ?? null
      })
      .returning(['slug', 'statementId'])
      .executeTakeFirstOrThrow();

    await db
      .insertInto('draft')
      .values({
        content,
        statementId: statementId,
        versionNumber: 1,
        creatorId: user.id
      })
      .executeTakeFirstOrThrow();

    await db
      .insertInto('collaborator')
      .values({
        statementId,
        userId: user.id,
        role: UserStatementRoles.LeadAuthor
      })
      .execute();

    if (slug) {
      return { url: `/${creatorSlug}/${slug}/1?edit=true` };
    } else {
      return { error: 'Failed to create draft' };
    }
  } catch (error) {
    console.error(error);
    await db
      .deleteFrom('statement')
      .where('statementId', '=', generatedStatementId)
      .executeTakeFirst();
    return { error: 'Failed to create draft' };
  }
}

export async function createDraft({
  statementId,
  slug,
  content,
  versionNumber,
  annotations
}: {
  statementId?: string;
  slug?: string;
  content?: string;
  versionNumber: number;
  annotations?: NewAnnotation[];
}) {
  const user = await authenticatedUser();

  try {
    await db.transaction().execute(async tx => {
      const { id: draftId } = await db
        .insertInto('draft')
        .values({
          content,
          statementId,
          versionNumber,
          creatorId: user.id
        })
        .returning(['id'])
        .executeTakeFirstOrThrow();

      if (annotations && annotations.length > 0) {
        const annotationsWithDraftId = annotations.map(annotation => ({
          ...annotation,
          draftId
        }));
        await tx.insertInto('annotation').values(annotationsWithDraftId).execute();
      }
    });

    redirect(`/[userSlug]/${slug}/${versionNumber}?edit=true`);
  } catch (error) {
    return { error: 'Failed to create draft' };
  }
}

export async function updateStatementUrl({
  statementId,
  slug,
  creatorId
}: {
  statementId: string;
  slug: string;
  creatorId: string;
}) {
  await authenticatedUser(creatorId);

  if (!checkValidStatementSlug(slug)) {
    return { error: 'Invalid slug' };
  }
  try {
    await db
      .updateTable('statement')
      .set({
        slug
      })
      .where('statementId', '=', statementId)
      .execute();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('duplicate key value violates unique constraint')
    ) {
      return { error: 'URL already exists' };
    }
    return { error: 'Failed to update statement URL' };
  }
}

export async function updateStatementTitle({
  statementId,
  title,
  creatorId,
  statementSlug
}: {
  statementId: string;
  title: string;
  creatorId: string;
  statementSlug: string;
}) {
  await authenticatedUser(creatorId);

  await db.updateTable('statement').set({ title }).where('statementId', '=', statementId).execute();
  revalidatePath(`/[userSlug]/${statementSlug}`, 'layout');
}

export async function updateStatementSubtitle({
  statementId,
  subtitle,
  creatorId,
  statementSlug
}: {
  statementId: string;
  subtitle: string;
  creatorId: string;
  statementSlug: string;
}) {
  await authenticatedUser(creatorId);

  await db
    .updateTable('statement')
    .set({ subtitle })
    .where('statementId', '=', statementId)
    .execute();
  revalidatePath(`/[userSlug]/${statementSlug}`, 'layout');
}

export async function updateStatementThreadId({
  statementId,
  threadId
}: {
  statementId: string;
  threadId: string;
}) {
  await authenticatedUser();
  await db
    .updateTable('statement')
    .set({ threadId })
    .where('statementId', '=', statementId)
    .execute();
}

export async function updateStatementHeaderImageUrl({
  statementId,
  creatorId,
  imageUrl
}: {
  statementId: string;
  creatorId: string;
  imageUrl: string;
}) {
  await authenticatedUser(creatorId);
  await db
    .updateTable('statement')
    .set({ headerImg: imageUrl })
    .where('statementId', '=', statementId)
    .execute();
}

export async function updateDraft({
  id,
  content,
  contentJson,
  contentPlainText,
  versionNumber,
  creatorId
}: {
  id: string;
  content?: string;
  contentJson?: string;
  contentPlainText?: string;
  versionNumber: number;
  creatorId?: string;
}) {
  await authenticatedUser();
  //should add something that ensures only annotations have been updated if not creator

  await db
    .updateTable('draft')
    .set({
      content,
      contentJson,
      contentPlainText
    })
    .where('id', '=', id)
    .where('versionNumber', '=', versionNumber)
    .execute();
}

export async function publishDraft({
  statementId,
  id,
  publish,
  creatorId
}: {
  statementId: string;
  id: string;
  publish: boolean;
  creatorId: string;
}) {
  await authenticatedUser(creatorId);

  const now = new Date();
  await db.transaction().execute(async tx => {
    await tx
      .updateTable('draft')
      .set({ publishedAt: null })
      .where('statementId', '=', statementId)
      .execute();

    if (publish) {
      await tx.updateTable('draft').set({ publishedAt: now }).where('id', '=', id).execute();
    }
  });
}

export async function deleteDraft(id: string, creatorId: string, statementSlug: string) {
  await authenticatedUser(creatorId);
  await db.deleteFrom('draft').where('id', '=', id).execute();
  revalidatePath(`/[userSlug]/${statementSlug}`, 'layout');
}

export async function deleteStatement(
  statementId: string,
  creatorId: string,
  headerImg: string,
  revalidationPath?: RevalidationPath
) {
  await authenticatedUser(creatorId);
  await deleteStoredStatementImage({
    url: headerImg,
    creatorId,
    statementId
  });
  await db.deleteFrom('draft').where('statementId', '=', statementId).execute();

  revalidatePath(revalidationPath?.path ?? `/[userSlug]`, 'layout');
}

export type UpsertImageDataType = {
  src: string;
  alt?: string | undefined | null;
  statementId: string;
  id: string;
  caption?: string | undefined | null;
};

export async function upsertStatementImage({
  alt,
  src,
  statementId,
  id,
  caption,
  revalidationPath
}: {
  alt: UpsertImageDataType['alt'];
  src: UpsertImageDataType['src'];
  statementId: string;
  id: UpsertImageDataType['id'];
  caption?: UpsertImageDataType['caption'];
  revalidationPath?: RevalidationPath;
}) {
  //this needs permissions
  try {
    const user = await authenticatedUser();
    await isAuthor(user.id, statementId);
    await db
      .insertInto('statementImage')
      .values({
        id,
        src,
        alt,
        statementId,
        caption
      })
      .onConflict(oc =>
        oc
          .column('id')
          .doUpdateSet({
            src,
            alt,
            statementId,
            caption,
            id
          })
          .where('statementImage.id', '=', id)
          .where('statementImage.statementId', '=', statementId)
      )
      .execute();
    revalidatePath(revalidationPath?.path ?? `/[userSlug]`, revalidationPath?.type ?? 'layout');
  } catch (error) {
    if (error instanceof Error && error.message.includes('User not authorized')) {
      return { error: 'User not authorized' };
    }
    return { error: 'Failed to upsert statement image' };
  }
}

export async function deleteStatementImage(id: string, statementId: string, creatorId: string) {
  try {
    const user = await authenticatedUser();
    await isAuthor(user.id, statementId);

    const imageUrl = createStatementImageUrl({
      userId: creatorId,
      statementId,
      imageId: id
    });
    await deleteStoredStatementImage({
      url: imageUrl,
      creatorId: user.id,
      statementId
    });

    await db
      .deleteFrom('statementImage')
      .where('id', '=', id)
      .where('statementId', '=', statementId)
      .execute();
  } catch (error) {
    if (error instanceof Error && error.message.includes('User not authorized')) {
      return { error: 'User not authorized' };
    }
    return { error: 'Failed to delete statement image' };
  }
}

export async function toggleStatementUpvote({
  statementId,
  isUpvoted,
  revalidationPath
}: {
  statementId: string;
  isUpvoted: boolean;
  revalidationPath?: RevalidationPath;
}) {
  const user = await authenticatedUser();

  if (isUpvoted) {
    await db
      .deleteFrom('statementVote')
      .where('statementId', '=', statementId)
      .where('userId', '=', user.id)
      .execute();
  } else {
    await db
      .insertInto('statementVote')
      .values({
        statementId,
        userId: user.id
      })
      .execute();
  }

  revalidatePath(revalidationPath?.path ?? '/', revalidationPath?.type ?? 'layout');
}

export async function updateDraftPublicationDate({
  id,
  statementSlug,
  creatorId,
  publishedAt,
  creatorSlug
}: {
  id: string;
  statementSlug: string;
  creatorId: string;
  publishedAt: Date | null;
  creatorSlug?: string | null | undefined;
}) {
  await authenticatedUser(creatorId);
  await db.updateTable('draft').set({ publishedAt }).where('id', '=', id).execute();
  if (creatorSlug) {
    revalidatePath(`/${creatorSlug}/${statementSlug}`, 'layout');
  } else {
    revalidatePath(`/[userSlug]/${statementSlug}`, 'layout');
  }
}

// .innerJoin("draft", (join) =>
//   join
//     .onRef("statement.statementId", "=", "draft.statementId")
//     .on("draft.versionNumber", "=", (eb) =>
//       eb.selectFrom("draft as d2")
//         .select(eb.fn.max("versionNumber").as("maxVersion"))
//         .whereRef("d2.statementId", "=", "statement.statementId")))
