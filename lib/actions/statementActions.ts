'use server';

import { User } from '@supabase/supabase-js';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import {
  AnnotationWithComments,
  BaseCollaborator,
  BaseDraft,
  BaseProfile,
  BaseStatement,
  BaseStatementCitation,
  BaseStatementImage,
  NewAnnotation,
  StatementWithDraft,
  StatementWithDraftAndCollaborators
} from 'kysely-codegen';
import { RevalidationPath } from 'kysely-codegen';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import db from '@/lib/database';

import { AuthorGroup, userAccess, UserStatementRoles } from '../enums/permissions';
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

export async function getPublishedOrLatestStatements({
  forCurrentUser,
  publishedOnly,
  creatorId,
  statementSlug,
  statementId,
  version,
  limit = 100,
  offset = 0
}: {
  forCurrentUser?: boolean;
  publishedOnly?: boolean;
  creatorId?: string;
  statementSlug?: string;
  statementId?: string;
  version?: number;
  limit?: number;
  offset?: number;
}): Promise<StatementWithDraftAndCollaborators[]> {
  const user = await getUser();

  type BaseStatementQuery = BaseStatement & {
    collaborators: BaseCollaborator[];
  };

  let statements = db
    .selectFrom('statement')
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
      jsonArrayFrom(
        eb
          .selectFrom('collaborator')
          .selectAll()
          .whereRef('collaborator.statementId', '=', 'statement.statementId')
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
  // Add pagination
  statements = statements.limit(limit).offset(offset).orderBy('statement.createdAt', 'desc');

  const statementsList = await statements.execute();

  if (statementsList.length === 0) {
    return [];
  }

  let drafts = db
    .selectFrom('draft')
    .selectAll()
    .where(
      'statementId',
      'in',
      statementsList.map(statement => statement.statementId)
    );

  if (publishedOnly) {
    drafts = drafts.where('publishedAt', 'is not', null);
  }

  const draftsList = (await drafts.execute()) as BaseDraft[];

  const authorIds = statementsList.flatMap(statement => {
    return statement.collaborators
      .filter(collaborator => userAccess(collaborator.role as UserStatementRoles) === 'author')
      .map(collaborator => collaborator.userId);
  });

  const managerIds = statementsList.flatMap(statement => {
    return statement.collaborators
      .filter(collaborator => userAccess(collaborator.role as UserStatementRoles) === 'manager')
      .map(collaborator => collaborator.userId);
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

  const getVersionList = ({ drafts }: { drafts: BaseDraft[] }) => {
    return drafts.map(draft => ({
      versionNumber: draft.versionNumber,
      createdAt: draft.createdAt
    }));
  };

  const getLeadDraft = ({
    statement,
    drafts,
    user,
    version
  }: {
    statement: BaseStatementQuery;
    drafts: BaseDraft[];
    user: User | null;
    version?: number;
  }) => {
    const userIsCollaborator = statement.collaborators.some(
      collaborator => collaborator.userId === user?.id?.toString()
    );
    if (drafts.length === 0) {
      return null;
    }
    const statementDrafts = drafts.filter(draft => draft.statementId === statement.statementId);

    //get version if user is collaborator
    if (version && userIsCollaborator) {
      const versionDraft = statementDrafts.find(draft => draft.versionNumber === version) ?? null;

      if (versionDraft) {
        return versionDraft;
      }
    }

    //get published draft
    const publishedDraft = statementDrafts.find(draft => draft.publishedAt !== null) ?? null;
    if (publishedDraft) {
      return publishedDraft;
    }

    //get latest version if user is collaborator
    if (userIsCollaborator) {
      const latestVersionDraft = statementDrafts.reduce(
        (max, draft) => Math.max(max, draft.versionNumber),
        0
      );
      const versionDraft =
        statementDrafts.find(draft => draft.versionNumber === latestVersionDraft) ?? null;
      if (versionDraft) {
        return versionDraft;
      }
    }
  };

  const statementsWithDraft = statementsList.map(statement => ({
    ...statement,
    creatorSlug: profiles.find(profile => profile.id === statement.creatorId)?.username,
    draft: getLeadDraft({
      statement: statement as BaseStatementQuery,
      drafts: draftsList,
      user,
      version
    }),
    versionList: getVersionList({
      drafts: draftsList
    }),
    authors: getStatementAuthors(statement, profiles),
    managers: profiles.filter(profile => managerIds.includes(profile.id))
  })) as StatementWithDraftAndCollaborators[];

  const orderedStatementsWithDraft = statementsWithDraft.sort((a, b) => {
    if (a.draft?.publishedAt && b.draft?.publishedAt) {
      return b.draft.publishedAt.getTime() - a.draft.publishedAt.getTime();
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return orderedStatementsWithDraft.filter(statement => statement.draft !== undefined);
}

// Cached version for better performance
export const getStatementsCached = cache(
  async ({
    forCurrentUser,
    publishedOnly,
    creatorId,
    statementSlug,
    statementId,
    version,
    limit = 20,
    offset = 0
  }: {
    forCurrentUser?: boolean;
    publishedOnly?: boolean;
    creatorId?: string;
    statementSlug?: string;
    statementId?: string;
    version?: number;
    limit?: number;
    offset?: number;
  }): Promise<StatementWithDraftAndCollaborators[]> => {
    return getPublishedOrLatestStatements({
      forCurrentUser,
      publishedOnly,
      creatorId,
      statementSlug,
      statementId,
      version,
      limit,
      offset
    });
  }
);

export async function getFullThread(threadId: string): Promise<StatementWithDraft[]> {
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
      'profile.username as creatorSlug',
      jsonArrayFrom(
        eb
          .selectFrom('collaborator')
          .selectAll()
          .whereRef('collaborator.statementId', '=', 'statement.statementId')
          .where('collaborator.role', 'in', AuthorGroup)
      ).as('collaborators')
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
      .filter((profile): profile is BaseProfile => !!profile)
  }));
}

export const getFullThreadCached = cache(
  async (threadId: string): Promise<StatementWithDraft[]> => {
    return getFullThread(threadId);
  }
);

export async function getStatementDetails({
  statementId,
  draftId,
  userId,
  version
}: {
  statementId: string;
  draftId: string;
  userId?: string;
  version?: number;
}): Promise<{
  images: BaseStatementImage[];
  citations: BaseStatementCitation[];
  annotations: AnnotationWithComments[];
}> {
  try {
    const images = await db
      .selectFrom('statementImage')
      .selectAll()
      .where('statementId', '=', statementId)
      .execute();

    const citations = await db
      .selectFrom('statementCitation')
      .selectAll()
      .where('statementId', '=', statementId)
      .execute();

    // Get annotations and comments for the selected draft
    const [annotations, comments] = await Promise.all([
      db
        .selectFrom('annotation')
        .selectAll()
        .where('annotation.draftId', '=', draftId)
        .orderBy('annotation.createdAt', 'desc')
        .execute(),
      db
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
        .where(
          'comment.annotationId',
          'in',
          db.selectFrom('annotation').select('id').where('draftId', '=', draftId)
        )
        .orderBy('comment.createdAt', 'desc')
        .execute()
    ]);

    // Get profiles for all users involved
    const profileIds = new Set([
      ...comments.map(comment => comment.userId),
      ...annotations.map(annotation => annotation.userId)
    ]);

    const profiles = await db
      .selectFrom('profile')
      .selectAll()
      .where('profile.id', 'in', Array.from(profileIds))
      .execute();

    const composedAnnotations = annotations.map(annotation => ({
      ...annotation,
      userName: profiles.find(p => p.id === annotation.userId)?.name || '',
      userImageUrl: profiles.find(p => p.id === annotation.userId)?.imageUrl || '',
      comments: comments
        .filter(c => c.annotationId === annotation.id)
        .map(comment => ({
          ...comment,
          userName: profiles.find(p => p.id === comment.userId)?.name || '',
          userImageUrl: profiles.find(p => p.id === comment.userId)?.imageUrl || '',
          draftId: draftId
        }))
    }));

    // annotations
    //   .filter((a) => a.draftId === draftId)
    //   .map((a) => ({
    //     ...a,
    //     userName: profiles.find((p) => p.id === a.userId)?.name || "",
    //     userImageUrl: profiles.find((p) => p.id === a.userId)?.imageUrl ||
    //       "",
    //     comments: comments
    //       .filter((c) => c.annotationId === a.id)
    //       .map((c) => ({
    //         ...c,
    //         userName: profiles.find((p) => p.id === c.userId)?.name || "",
    //         userImageUrl: profiles.find((p) => p.id === c.userId)?.imageUrl ||
    //           "",
    //         draftId: draftId,
    //       })),
    //   })),

    const returnPackage = {
      images: images,
      citations: citations,
      annotations: composedAnnotations
    };
    return returnPackage;
  } catch (error) {
    console.error('Error loading statement details:', error);
    return {
      images: [],
      citations: [],
      annotations: []
    };
  }
}

export const getStatementDetailsCached = cache(
  async ({
    statementId,
    draftId,
    userId,
    version
  }: {
    statementId: string;
    draftId: string;
    userId?: string;
    version?: number;
  }): Promise<{
    images: BaseStatementImage[];
    citations: BaseStatementCitation[];
    annotations: AnnotationWithComments[];
  }> => {
    return getStatementDetails({
      statementId,
      draftId,
      userId,
      version
    });
  }
);

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
  imageUrl,
  revalidationPath
}: {
  statementId: string;
  creatorId: string;
  imageUrl: string;
  revalidationPath: RevalidationPath;
}) {
  await authenticatedUser(creatorId);
  await db
    .updateTable('statement')
    .set({ headerImg: imageUrl })
    .where('statementId', '=', statementId)
    .execute();

  revalidatePath(revalidationPath.path, revalidationPath.type);
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

// export async function getStatementPageData({
//   statementSlug,
//   userId,
//   version,
//   publishedOnly = false,
// }: {
//   statementSlug: string;
//   userId?: string;
//   version?: number;
//   publishedOnly?: boolean;
// }): Promise<{
//   userRole: UserStatementRoles;
//   userIsCollaborator: boolean;
//   selection: {
//     version: number;
//     versionList: { versionNumber: number; createdAt: Date }[];
//   } | null;
//   statementPackage: StatementPackage | null;
// }> {
//   if (statementSlug === "appspecific") {
//     return {
//       userRole: UserStatementRoles.Viewer,
//       userIsCollaborator: false,
//       selection: null,
//       statementPackage: null,
//     };
//   }

//   try {
//     // Get statement and collaborators in a single query
//     let _statement = db
//       .selectFrom("statement")
//       .select(({ eb }) => [
//         "statementId",
//         "slug",
//         "creatorId",
//         "createdAt",
//         "updatedAt",
//         "parentStatementId",
//         "headerImg",
//         "threadId",
//         "title",
//         "subtitle",
//         "distributedAt",
//         jsonArrayFrom(
//           eb
//             .selectFrom("collaborator")
//             .selectAll()
//             .whereRef("collaborator.statementId", "=", "statement.statementId"),
//         ).as("collaborators"),
//         jsonArrayFrom(
//           eb
//             .selectFrom("statementImage")
//             .selectAll()
//             .whereRef(
//               "statementImage.statementId",
//               "=",
//               "statement.statementId",
//             ),
//         ).as("images"),
//         jsonArrayFrom(
//           eb
//             .selectFrom("statementCitation")
//             .selectAll()
//             .whereRef(
//               "statementCitation.statementId",
//               "=",
//               "statement.statementId",
//             ),
//         ).as("citations"),
//         jsonArrayFrom(
//           eb
//             .selectFrom("statementVote")
//             .selectAll()
//             .whereRef(
//               "statementVote.statementId",
//               "=",
//               "statement.statementId",
//             ),
//         ).as("upvotes"),
//       ])
//       .where("slug", "=", statementSlug);

//     const statement = await _statement.executeTakeFirstOrThrow();

//     // Get drafts in parallel with the statement query
//     let drafts = db
//       .selectFrom("draft")
//       .selectAll()
//       .where("statementId", "=", statement.statementId)
//       .orderBy("versionNumber", "desc");

//     if (publishedOnly) {
//       drafts = drafts.where("publishedAt", "is not", null);
//     }

//     const draftsList = await drafts.execute();

//     // Determine user role from collaborators
//     const userRole = (statement.collaborators.find((collaborator) =>
//       collaborator.userId === userId
//     )
//       ?.role as UserStatementRoles) || UserStatementRoles.Viewer;

//     const userIsCollaborator = userRole !== UserStatementRoles.Viewer;
//     // If version is provided and user is not a collaborator, send to base page
//     if (version && !userIsCollaborator) {
//       const creatorSlug = statement.collaborators.find((p) =>
//         p.userId === statement.creatorId
//       )?.slug;
//       redirect(`/${creatorSlug}/${statementSlug}`);
//     }
//     // Determine version selection
//     const versions = draftsList
//       .map((draft) => ({
//         versionNumber: draft.versionNumber,
//         createdAt: draft.createdAt,
//       }))
//       .sort((a, b) =>
//         b.versionNumber - a.versionNumber
//       );

//     let selectedVersion: number;
//     if (draftsList.length > 0 && userIsCollaborator) {
//       if (version) {
//         selectedVersion = version;
//       } else {
//         selectedVersion = draftsList.reduce(
//           (max, draft) => Math.max(max, draft.versionNumber),
//           0,
//         );
//       }
//     } else {
//       const publishedDraft = draftsList.find((draft) =>
//         draft.publishedAt !== null
//       );
//       selectedVersion = publishedDraft?.versionNumber || 0;
//     }

//     const selection = selectedVersion > 0
//       ? { version: selectedVersion, versionList: versions }
//       : null;

//     // If no valid version found, return early
//     if (!selection) {
//       return {
//         userRole,
//         userIsCollaborator,
//         selection: null,
//         statementPackage: null,
//       };
//     }

//     // Get the selected draft and related data
//     const selectedDraft = draftsList.find((d) =>
//       d.versionNumber === selectedVersion
//     );
//     if (!selectedDraft) {
//       return {
//         userRole,
//         userIsCollaborator,
//         selection: null,
//         statementPackage: null,
//       };
//     }

//     // Get annotations and comments for the selected draft
//     const [annotations, comments] = await Promise.all([
//       db
//         .selectFrom("annotation")
//         .selectAll()
//         .where("annotation.draftId", "=", selectedDraft.id)
//         .orderBy("annotation.createdAt", "desc")
//         .execute(),
//       db
//         .selectFrom("comment")
//         .select(({ eb }) => [
//           "comment.id",
//           "comment.content",
//           "comment.createdAt",
//           "comment.updatedAt",
//           "comment.userId",
//           "comment.annotationId",
//           "comment.parentId",
//           "comment.isPublic",
//           jsonArrayFrom(
//             eb
//               .selectFrom("commentVote")
//               .selectAll()
//               .whereRef("commentVote.commentId", "=", "comment.id"),
//           ).as("votes"),
//         ])
//         .where(
//           "comment.annotationId",
//           "in",
//           db.selectFrom("annotation").select("id").where(
//             "draftId",
//             "=",
//             selectedDraft.id,
//           ),
//         )
//         .orderBy("comment.createdAt", "desc")
//         .execute(),
//     ]);

//     // Get profiles for all users involved
//     const profileIds = new Set([
//       ...statement.collaborators.map((collaborator) => collaborator.userId),
//       ...comments.map((comment) => comment.userId),
//       ...annotations.map((annotation) => annotation.userId),
//     ]);

//     const profiles = await db
//       .selectFrom("profile")
//       .selectAll()
//       .where("profile.id", "in", Array.from(profileIds))
//       .execute();

//     // Build the statement package
//     const authors = statement.collaborators
//       .map((collaborator) =>
//         AuthorGroup.includes(collaborator.role as UserStatementRoles)
//           ? profiles.find((p) => p.id === collaborator.userId)
//           : undefined
//       )
//       .filter((author) => author !== undefined);

//     const statementPackage = {
//       ...statement,
//       authors,
//       creatorSlug: profiles.find((p) => p.id === statement.creatorId)?.username,
//       citations: statement.citations.map((c) => ({
//         ...c,
//         title: c.title ?? "",
//       })),
//       images: statement.images,
//       upvotes: statement.upvotes,
//       collaborators: statement.collaborators,
//       draft: {
//         ...selectedDraft,
//         slug: statement.slug,
//         images: statement.images,
//         upvotes: statement.upvotes,
//         citations: statement.citations,
//         annotations: annotations
//           .filter((a) => a.draftId === selectedDraft.id)
//           .map((a) => ({
//             ...a,
//             userName: profiles.find((p) => p.id === a.userId)?.name || "",
//             userImageUrl: profiles.find((p) => p.id === a.userId)?.imageUrl ||
//               "",
//             comments: comments
//               .filter((c) => c.annotationId === a.id)
//               .map((c) => ({
//                 ...c,
//                 userName: profiles.find((p) => p.id === c.userId)?.name || "",
//                 userImageUrl: profiles.find((p) =>
//                   p.id === c.userId
//                 )?.imageUrl || "",
//                 draftId: selectedDraft.id,
//               })),
//           })),
//       },
//     } as StatementPackage;

//     return {
//       userRole,
//       userIsCollaborator,
//       selection,
//       statementPackage,
//     };
//   } catch (error) {
//     return {
//       userRole: UserStatementRoles.Viewer,
//       userIsCollaborator: false,
//       selection: null,
//       statementPackage: null,
//     };
//   }
// }
