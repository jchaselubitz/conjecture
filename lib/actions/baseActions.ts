'use server';

import * as Sentry from '@sentry/nextjs';
import { User } from '@supabase/supabase-js';

import { createClient } from '@/supabase/server';

import { AuthorGroup, UserStatementRoles } from '../enums/permissions';

import { getCollaborators } from './collaboratorActions';

export const getUser = async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
};

export const authenticatedUser = async (compareId?: string | undefined): Promise<User> => {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not found');
  }
  const isCreator = user?.id.toString() === compareId?.toString();
  if (compareId && !isCreator) {
    throw new Error('User not authorized');
  }
  return user;
};

//take in a user and a statementSlug and return the user's role for that statement
export const getUserRole = async (
  userId: string | undefined,
  statementSlug: string
): Promise<UserStatementRoles> => {
  const collaborators = await getCollaborators(statementSlug);

  const userRole = collaborators.find(collaborator => collaborator.userId === userId)?.role;

  if (!userRole) {
    return UserStatementRoles.Viewer;
  }
  return userRole as UserStatementRoles;
};

export const isAuthor = async (userId: string, statementSlug: string): Promise<boolean> => {
  const collaborators = await getCollaborators(statementSlug);
  const authors = collaborators.filter(collaborator =>
    AuthorGroup.includes(collaborator.role as UserStatementRoles)
  );
  return authors.some(collaborator => collaborator.userId === userId);
};

// export const hasPermission = async (
//   user: User,
//   statementSlug: string,
//   permission: StatementPermissions,
// ): Promise<boolean> => {
//   const userRole = await getUserRole(user, statementSlug);
//   return UserStatementPermissions[userRole].includes(permission);
// };

// export const checkUserClaims = async ({
//   requiredPermissions,

//   statementId,
//   callOrigin,
// }: {
//   requiredPermissions: StatementPermissions[];
//   statementId: string;
//   callOrigin?: string;
// }): Promise<UserClaims> => {
//   const user = await getUser();

//   if (!user) {
//     return;
//   }

//   let error = null;
//   const permitted = await hasPermission(userRole, requiredPermissions);

//   if (!permitted) {
//     error =
//       `Role ${userRole}, at org ${organizationId} does not have permission: ${callOrigin} (${requiredPermissions})`;
//     Sentry.captureException(new Error(error));
//     const userMessage = `Not Authorized: ${callOrigin}`;
//     throw new Error(userMessage);
//   }
// };

// export const hasPermission = async (
//   role: UserStatementRoles | null,
//   permissions: StatementPermissions[],
// ): Promise<boolean> => {
//   if (!role) {
//     return permissions.every((permission) =>
//       UserStatementPermissions.viewer.includes(permission)
//     );
//   }
//   if (role === UserStatementRoles.SuperAdmin) {
//     return true;
//   }
//   return permissions.some((permission) =>
//     UserStatementPermissions[role].includes(permission)
//   );
// };
